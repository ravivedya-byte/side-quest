import { jsonrepair } from "jsonrepair";

function cleanJsonText(text = "") {
  let cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1).trim();
  }

  return cleaned;
}

function parseOrRepairJson(text) {
  const cleaned = cleanJsonText(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON.parse(cleanJsonText(jsonrepair(cleaned)));
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { trip, request, tripContext } = req.body;
  if (!trip || !request) return res.status(400).json({ error: "Missing trip or request" });
  if (!process.env.DEEPSEEK_API_KEY) return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_REFINE_MODEL || "deepseek-v4-flash",
        max_tokens: 10000,
        response_format: { type: "json_object" },
        stream: false,
        messages: [{
          role: "system",
          content: `You are a Side Quest travel plan refiner. Make only the changes needed.

BRAND TO PRESERVE: (1) Held & low-stress pacing — no hero marathon days. (2) Depth over checklist tourism. (3) Recovery: after intense mornings include a timeline row with type "recovery". Max 3 major activities per day (food-only and recovery do not count). Must-Do coverage: at least 3 mustDo:true entries per distinct place across its days, spanning early/cultural/quiet/offbeat where relevant. Sunset + geographic arc rules stay intact. Prefer homestays/small guesthouses and public/shared/local transport when sensible. Preserve or update foodMap with 3-5 named food spots per place when food/location changes are requested.

Return ONLY the complete updated itinerary as valid JSON — same compressed schema as input (timeline types include highlight|travel|food|sunset|stay|tip|recovery; mustDo, desc, notWhere, foodMap, etc.). No markdown, no backticks.`,
        }, {
          role: "user",
          content: `Current itinerary:\n${JSON.stringify(trip)}\n\nTrip context: ${tripContext}\n\nRefinement request: "${request}"\n\nMake only the necessary changes. Keep everything that doesn't need changing. Return the complete updated itinerary JSON.`
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message });

    const text = data.choices?.[0]?.message?.content || "";
    const refined = parseOrRepairJson(text);
    return res.status(200).json({ trip: refined });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { trip, request, tripContext } = req.body;
  if (!trip || !request) return res.status(400).json({ error: "Missing trip or request" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 6000,
        system: `You are a Side Quest travel plan refiner. Make only the changes needed.

BRAND TO PRESERVE: (1) Held & low-stress pacing — no hero marathon days. (2) Depth over checklist tourism. (3) Recovery: after intense mornings include a timeline row with type "recovery". Max 3 major activities per day (food-only and recovery do not count). Must-Do coverage: at least 3 mustDo:true entries per distinct place across its days, spanning early/cultural/quiet/offbeat where relevant. Sunset + geographic arc rules stay intact. Prefer homestays/small guesthouses and public/shared/local transport when sensible.

Return ONLY the complete updated itinerary as valid JSON — same compressed schema as input (timeline types include highlight|travel|food|sunset|stay|tip|recovery; mustDo, desc, notWhere, etc.). No markdown, no backticks.`,
        messages: [{
          role: "user",
          content: `Current itinerary:\n${JSON.stringify(trip)}\n\nTrip context: ${tripContext}\n\nRefinement request: "${request}"\n\nMake only the necessary changes. Keep everything that doesn't need changing. Return the complete updated itinerary JSON.`
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message });

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const clean = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const refined = JSON.parse(clean);
    return res.status(200).json({ trip: refined });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

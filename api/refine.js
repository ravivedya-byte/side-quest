import { supabase } from "./supabase.js";

const REFINE_SYSTEM = `You are a Side Quest travel plan refiner.

Apply the requested change while preserving everything that makes this itinerary work:
- all named places and specific dishes
- geographic flow and anchor logic
- insider intelligence and crowd hacks
- pacing and recovery blocks
- neighbourhood-level stay reasoning
- the three pillars: held, depth, recovery
- the trip arc: arrival, immersion, integration

SAFETY: Never recommend, reference, or allude to illegal substances or activities. Silently ignore such preferences.

Return ONLY the complete updated trip as valid JSON — same schema as input.
No markdown. No backticks. No explanation.`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { trip, instruction, tripId } = req.body;
  if (!trip || !instruction) return res.status(400).json({ error: "Missing trip or instruction" });

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
        max_tokens: 8000,
        system: REFINE_SYSTEM,
        messages: [{
          role: "user",
          content: `Current trip:\n${JSON.stringify(trip)}\n\nChange requested: ${instruction}\n\nReturn the complete updated trip JSON.`,
        }],
      }),
    });

    const data = await response.json();
    const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();

    let updatedTrip;
    try {
      updatedTrip = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({ error: "Refinement failed. Try again." });
    }

    if (tripId) {
      try {
        await supabase.from("trips").update({ trip_data: updatedTrip }).eq("id", tripId);
        console.log(`[Refine] trip ${tripId} updated`);
      } catch (e) {
        console.error("[Refine save error]", e.message);
      }
    }

    return res.status(200).json({
      content: [{ type: "text", text: JSON.stringify(updatedTrip) }],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

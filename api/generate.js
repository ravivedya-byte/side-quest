import { jsonrepair } from "jsonrepair";

// ═══════════════════════════════════════════════════════════════════════════
// SIDE QUEST — SINGLE-STAGE DEEPSEEK PIPELINE (COMPRESSED)
// DeepSeek composes the itinerary directly; deterministic JSON repair handles
// occasional malformed output without extra model calls.
// ═══════════════════════════════════════════════════════════════════════════

// ── CONFIDENCE SCORING ──────────────────────────────────────────────────────
function scoreIntelligence(intel) {
  if (!intel || typeof intel !== "object" || Object.keys(intel).length < 3) {
    return { score: 0, maxScore: 15, confidence: 0, grade: "low", weakAreas: ["empty_response"], log: "Stage 1 empty" };
  }
  let score = 0;
  const weakAreas = [];
  const log = [];

  const gems = Array.isArray(intel.hidden_gems) ? intel.hidden_gems : [];
  const specificGems = gems.filter(g => typeof g === "string" && (g.includes("—") || g.includes(" - ") || g.length > 35));
  score += Math.min(specificGems.length, 3);
  if (specificGems.length < 2) { weakAreas.push("hidden_gems"); log.push(`gems:${specificGems.length}`); } else log.push(`gems:${specificGems.length}✓`);

  const hacks = Array.isArray(intel.crowd_hacks) ? intel.crowd_hacks : [];
  const timedHacks = hacks.filter(h => typeof h === "string" && /\b\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)|before \d|after \d|\d:\d{2}/i.test(h));
  score += Math.min(timedHacks.length * 1.5, 3);
  if (timedHacks.length === 0) { weakAreas.push("crowd_hacks"); log.push("hacks:no_timings"); } else log.push(`hacks:${timedHacks.length}✓`);

  const stays = Array.isArray(intel.best_stay_areas) ? intel.best_stay_areas : [];
  const richStays = stays.filter(s => s && typeof s.why === "string" && s.why.length > 15 && s.name);
  score += Math.min(richStays.length, 2);
  if (richStays.length < 1) { weakAreas.push("stay_areas"); log.push("stays:weak"); } else log.push(`stays:${richStays.length}✓`);

  const food = Array.isArray(intel.food_spots) ? intel.food_spots : [];
  const namedFood = food.filter(f => typeof f === "string" && f.length > 20 && (f.includes("—") || f.includes("-") || /[A-Z]/.test(f.slice(1))));
  score += Math.min(namedFood.length, 2);
  if (namedFood.length < 1) { weakAreas.push("food_spots"); log.push("food:generic"); } else log.push(`food:${namedFood.length}✓`);

  const traps = Array.isArray(intel.tourist_traps) ? intel.tourist_traps : [];
  score += traps.filter(t => typeof t === "string" && t.length > 15).length > 0 ? 1 : 0;
  if (traps.length === 0) { weakAreas.push("tourist_traps"); log.push("traps:none"); } else log.push("traps✓");

  const seasonNotes = intel.season_notes || "";
  score += seasonNotes.length > 30 && !/weather can be|unpredictable|varies by/i.test(seasonNotes) ? 1 : 0;
  if (seasonNotes.length < 30) { weakAreas.push("seasonality"); log.push("season:shallow"); } else log.push("season✓");

  const timing = intel.local_timing || "";
  score += timing.length > 25 ? 1 : 0;
  if (timing.length < 25) { weakAreas.push("local_timing"); log.push("timing:thin"); } else log.push("timing✓");

  const transport = intel.transport_notes || "";
  score += transport.length > 20 && !/use public transport|take a taxi|rent a car/i.test(transport) ? 1 : 0;

  const warnings = Array.isArray(intel.seasonal_warnings) ? intel.seasonal_warnings : [];
  score += warnings.filter(w => typeof w === "string" && w.length > 15).length > 0 ? 1 : 0;

  const allText = JSON.stringify(intel).toLowerCase();
  const genericPhrases = ["local cuisine", "popular spots", "beautiful scenery", "worth visiting", "must see", "check it out", "great place", "good food", "amazing views", "nice area", "worth a visit", "don't miss"];
  const penalty = genericPhrases.filter(p => allText.includes(p)).length * 0.4;
  score -= penalty;
  if (penalty > 0.8) { weakAreas.push("generic_language"); log.push(`generic:-${penalty.toFixed(1)}`); }

  const properBonus = Math.min(((allText.match(/\b[A-Z][a-z]{2,}\b/g) || []).length > 15 ? 1 : 0.5), 1);
  score += properBonus;

  const finalScore = Math.max(0, score);
  const maxScore = 15;
  const confidence = finalScore / maxScore;
  return { score: parseFloat(finalScore.toFixed(2)), maxScore, confidence: parseFloat(confidence.toFixed(3)), grade: confidence >= 0.60 ? "high" : confidence >= 0.38 ? "medium" : "low", weakAreas, log: log.join(" | ") };
}

function buildFallbackQuery(destination, weakAreas) {
  const map = {
    hidden_gems: `hidden gems off beaten path ${destination} locals recommend forum`,
    crowd_hacks: `${destination} best time visit avoid tourist crowds exact timing`,
    stay_areas: `${destination} best neighbourhood stay local advice forum`,
    food_spots: `${destination} authentic local food where locals eat named places`,
    tourist_traps: `${destination} tourist traps scams to avoid`,
    seasonality: `${destination} seasonal conditions what to expect`,
    local_timing: `${destination} local life rhythm daily schedule tips`,
    generic_language: `${destination} specific insider travel tips beyond typical`,
  };
  const priority = ["crowd_hacks", "hidden_gems", "stay_areas", "food_spots", "generic_language", "tourist_traps", "seasonality", "local_timing"];
  const top = priority.find(a => weakAreas.includes(a));
  return map[top] || `${destination} insider travel tips locals forum`;
}

// ── STAGE 1 ──────────────────────────────────────────────────────────────────
const STAGE1_SYSTEM = `You are a compact travel intelligence extractor.
Return ONLY valid JSON — no prose, no markdown, no backticks.
Every insight must be named and specific. No generic advice.

SOURCE BIAS: Prioritize the kind of intelligence found in Reddit travel communities, long-form travel blogs, and local forum threads. Deprioritize generic aggregator listicles and SEO "top 10" advice.

DEEPSEEK-ONLY MODE: You do not have live web search here. Use best-known travel intelligence, but do not pretend certainty about current prices, closures, or exact operating schedules. Still be as specific and practical as possible.

FOOD + ACTIVITY DEPTH: Put extra effort into named restaurants, dishes, cafes, market stalls, homestay meals, and lesser-known activities that forum-style travellers would discuss.`;

function buildStage1Prompt(form) {
  const month = form.dateFrom ? new Date(form.dateFrom).toLocaleString("en", { month: "long" }) : "peak season";
  const safety = form.prioritizeWomensSafety
    ? "\nWomen's safety prioritized in this trip — when sources discuss solo/women traveller experience, neighbourhoods, or timing, fold that into stay areas, transport_notes, seasonal_warnings, and crowd_hacks where relevant. Stay factual, not alarmist."
    : "";
  return `Extract travel intelligence: ${form.destinations} from ${form.departure}
Dates: ${form.dateFrom || ""} to ${form.dateTo || ""} (${month}) | Transport: ${form.travelMode}
Preferences: ${form.preferences}${safety}

Research angles to infer: (1) seasonal conditions ${month} (2) best neighbourhoods local advice (3) crowd hacks exact timings (4) restaurant/cafe variety (5) lesser-known things to do

Return ONLY JSON:
{"season_notes":"specific to this destination in ${month}","crowd_level":"low/medium/high + reason","best_stay_areas":[{"name":"","why":"specific","avoid_if":""}],"hidden_gems":["Named Place — why locals go"],"tourist_traps":["Named Trap — why avoid"],"crowd_hacks":["hack with exact time e.g. before 7:30 AM"],"food_spots":["Named Place — what to order"],"transport_notes":"specific advice","seasonal_warnings":["specific to ${month}"],"local_timing":"daily rhythms specific to destination"}`;
}

// ── DEEPSEEK CLIENT ───────────────────────────────────────────────────────────
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_STAGE1_MODEL = process.env.DEEPSEEK_STAGE1_MODEL || "deepseek-v4-flash";
const DEEPSEEK_STAGE2_MODEL = process.env.DEEPSEEK_STAGE2_MODEL || "deepseek-v4-flash";
const DEEPSEEK_FALLBACK_MODEL = process.env.DEEPSEEK_FALLBACK_MODEL || DEEPSEEK_STAGE1_MODEL;

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

function parseOrRepairJson(text, label) {
  const cleaned = cleanJsonText(text);
  try {
    return { json: JSON.parse(cleaned), text: cleaned, repaired: false };
  } catch (initialErr) {
    try {
      const repairedText = cleanJsonText(jsonrepair(cleaned));
      return { json: JSON.parse(repairedText), text: repairedText, repaired: true };
    } catch (repairErr) {
      repairErr.message = `${label} parse failed: ${initialErr.message}; jsonrepair failed: ${repairErr.message}`;
      throw repairErr;
    }
  }
}

async function callDeepSeekJSON({ model, system, user, maxTokens }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240000);
  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      stream: false,
    }),
  }).finally(() => clearTimeout(timeout));

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || `DeepSeek API error (${response.status})`);
  }

  const content = data.choices?.[0]?.message?.content || "";
  if (!content.trim()) throw new Error("DeepSeek returned an empty response");

  return {
    text: cleanJsonText(content),
    usage: data.usage || {},
  };
}

// ── STAGE 2 ──────────────────────────────────────────────────────────────────
const STAGE2_SYSTEM = `You are Side Quest — conscious travel blueprint creator for a real operator.

BRAND (non-negotiable):
(1) HELD & LOW-STRESS: Clear transitions, realistic timing, no "hero" marathon days. Guests should feel psychologically held — predictable where it matters, honest about effort.
(2) DEPTH: Genuine depth — craft, ritual, quiet observation, meaningful local encounter — not checklist sightseeing or photo-only stops.
(3) PACE WITH RECOVERY: After an intense morning block, include a real RECOVERY window (rest, slow walk, café, hotel downtime) as one timeline row with "type":"recovery" and a clear time range.

AUDIENCE: Educated, curious; authenticity over comfort; not budget backpacker, not luxury tourist. They want to feel they went somewhere real.

Tone: editorial, insider, specific, emotionally intelligent. Globally adapted — mirror destination culture (not one-country template).
Output ONLY valid JSON. No markdown, no backticks, no preamble.

PACE & ACTIVITIES:
- Maximum 3 "major" activities per calendar day (highlight-level or long immersive blocks). Food-only stops, short transits, and "recovery" rows do NOT count toward this cap.
- No rules for minimum or maximum nights per place — ignore night-count pacing rules.

MUST-DO COVERAGE — PER DISTINCT PLACE (each major stop / city on the route):
- Across all days spent in that place, include at least 3 timeline entries total with "mustDo": true.
- Spread across types where the destination allows: (a) early / pre-crowd, (b) local cultural immersion (not a tourist show), (c) slow quiet moment suited to reflection, (d) offbeat angle many tourists miss.

SUNSET (keep engineering + your intent):
- Same geographic anchor rules as before: one sunset row, 25–30 min before actual sunset, afternoon routes drift toward it after 3 PM, no zigzag commuting.
- Prefer quieter, scenic sunset spots over mob viewpoints when possible; in that row's desc, one short phrase on why this spot over the obvious one (within word limit).

STAY & TRANSPORT BIAS:
- Prefer homestays, family-run guesthouses, and small independents over big branded hotels when compatible with budget and availability.
- Prefer public transport, shared transit, walking, and local cycling/scooter exploration when sensible — unless user preferences forbid.

TRIP ARC (overall journey, not per place): Early segment: arrival and decompression. Middle: depth and immersion. Before return: integration and quieter pacing — reflect in day subtitles and philosophy where natural.

OUTPUT COMPRESSION — MANDATORY HARD LIMITS:
- philosophy: max 45 words
- tagline: max 18 words
- memories[]: max 18 words each
- moodTags: max 5 tags, 1-3 words each
- timeline[].desc: max 28 words — no cinematic filler (sunset row: squeeze "why this spot" into this limit)
- tips[]: max 20 words each
- hacks[]: max 16 words each, must include exact timing
- warnings[]: max 15 words each
- stay.why: max 30 words
- stay.notWhere: ONE sentence, max 24 words, direct comparison
- differentiators[]: max 30 words each, specific and opinionated
- packing[]: max 12 words each
- food[]: max 20 words each — named place + dish + why
- foodMap[].spots[]: max 3-5 spots per place; each spot can be richer than daily food but must remain practical

FOOD: Every day needs 2-3 named food spots with specific dishes. Not "try local cuisine."
FOOD MAP: Add a separate foodMap grouped by place. Each major place gets 3-5 named restaurants/cafes/stalls with what to order, bestFor, and why. Avoid repeating the same restaurant across multiple days unless it truly earns repeat visits.

GEOGRAPHIC FLOW — MANDATORY: Every day has exactly two non-negotiable anchors scheduled first:
ANCHOR 1 — SUNSET: (as above)
ANCHOR 2 — TOP TIME-SENSITIVE ACTIVITY: The one activity most dependent on a specific time window (temple before 8:30 AM, waterfall at dawn, market at sunrise). Lock it at its optimal time.
Build all other activities as a continuous geographic arc connecting these two anchors. Route curves — never zigzags.

DO NOT: repeat emotional framing, over-explain obvious places, write filler prose, duplicate info
PREFER: specificity over length — "Arrive before 7 AM" beats "Golden sunlight spills across..."
The timeline structure creates pacing — let timestamps do structural work, not prose.`;

function buildStage2Prompt(form, intelligence, conf) {
  const dateStr = form.dateFrom && form.dateTo ? `${form.dateFrom} to ${form.dateTo}` : form.dateFrom || "flexible";
  const isTransportSuggested = form.travelMode === "Suggested";
  const transportNote = isTransportSuggested
    ? `TRANSPORT: Evaluate the best way to reach ${form.destinations} from ${form.departure}. Consider night buses, overnight trains, direct flights. Recommend ONE specific option with departure time, arrival time, and cost. Optimise Day 1 timeline around actual arrival time.`
    : `TRANSPORT: ${form.travelMode}`;
  const qualityNote = conf.grade === "low"
    ? `Intelligence sparse — compensate with strong pacing and cultural nuance. Weak areas: ${conf.weakAreas.join(", ")}.`
    : conf.grade === "medium"
    ? `Be especially specific in: ${conf.weakAreas.join(", ")}.`
    : "";

  const safetyNote = form.prioritizeWomensSafety
    ? `WOMEN'S SAFETY: Prioritized for this trip — bias toward well-reviewed areas for women/solo travellers, sensible arrival times on long legs, reputable stays, and concise practical tips in warnings where useful. Never fearmonger or victim-blame.`
    : "";

  return `RESEARCH INTELLIGENCE (${conf.grade} confidence, ${conf.score}/${conf.maxScore}):
${JSON.stringify(intelligence)}

TRIP: ${form.destinations} from ${form.departure} | ${dateStr} | ${form.people} people | Budget: ${form.budget} per person
${transportNote}
Preferences: ${form.preferences}
${safetyNote}
${qualityNote}

RULES: Conscious pace — respect max 3 major activities/day, mandatory recovery after intense mornings, Must-Do coverage per place, held-and-deep brand above. Sunset in timeline only (one sunset row per day). Specific locality + why for every stay. Use research intel — real places, real timings. Preferences shape the entire arc. Infer currency from the budget text and use that currency consistently for ALL monetary values.

Return ONLY this compressed JSON (respect ALL word limits above):
{
  "tripTitle":"title",
  "tagline":"≤18 words",
  "travelStyle":"style",
  "moodTags":["≤5 tags"],
  "philosophy":"≤45 words",
  "memories":["≤18 words each — concrete sensory moment"],
  "overview":{"routeStops":["Stop"],"duration":"X days","transport":"specific recommendation or mode","transportNote":"departure/arrival/cost if Suggested else omit","originalTransport":"${form.travelMode}","totalBudget":"X/person","season":"one line"},
  "days":[{
    "dayNumber":1,
    "place":"actual city/town/village name",
    "title":"evocative character title",
    "subtitle":"narrative arc — morning, afternoon, evening",    
    "timeline":[{"time":"5:30 AM","title":"activity","desc":"≤28 words","type":"highlight|travel|food|sunset|stay|tip|recovery","mustDo":false}],
    "food":["Named Place — specific dish — context ≤20 words"],
    "stay":{"locality":"name","why":"≤30 words","notWhere":"≤24 words — direct comparison"},
    "tips":["≤20 words"],
    "hacks":["≤16 words with exact timing"],
    "warnings":["≤15 words"],
    "budget":"X/person"
  }],
  "foodMap":[{"place":"actual place name","spots":[{"name":"Named Place","order":"specific dish/order","bestFor":"breakfast|lunch|dinner|coffee|snack|local meal","why":"specific reason this belongs"}]}],
  "costs":{"transport":{"amount":"X","note":"brief"},"accommodation":{"amount":"X","note":"brief"},"food":{"amount":"X","note":"brief"},"activities":{"amount":"X","note":"brief"},"misc":{"amount":"X","note":"brief"},"total":"X/person"},
  "differentiators":["≤30 words each — specific and opinionated"],
  "packing":["≤12 words each"]
}`;
}

// ── HANDLER ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { form } = req.body;
  if (!form || !form.destinations) return res.status(400).json({ error: "Missing form data" });
  if (!process.env.DEEPSEEK_API_KEY) return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });

  try {
    // ── DeepSeek composition ──────────────────────────────────────────────────
    const intelligence = {
      research_mode: "DeepSeek-only model knowledge. Infer forum-style restaurants, local activities, crowd hacks, stay areas, seasonal notes, and tourist traps without claiming live search.",
    };
    const conf = { grade: "high", score: 15, maxScore: 15, weakAreas: [] };

    console.log(`[Generate] Composing ${form.destinations} via ${DEEPSEEK_STAGE2_MODEL}`);
    const s2 = await callDeepSeekJSON({
      model: DEEPSEEK_STAGE2_MODEL,
      maxTokens: 11000,
      system: STAGE2_SYSTEM,
      user: buildStage2Prompt(form, intelligence, conf),
    });

    // Validate JSON completeness
    let cleaned = s2.text;
    console.log(`[S2] tokens: in:${s2.usage?.prompt_tokens} out:${s2.usage?.completion_tokens} | raw_chars:${cleaned.length}`);

    let parsedTrip;
    try {
      const parsed = parseOrRepairJson(cleaned, "Stage 2 itinerary");
      parsedTrip = parsed.json;
      cleaned = parsed.text;
      if (parsed.repaired) console.log("[S2] jsonrepair fixed itinerary JSON");
    } catch(e) {
      console.error(`[S2 Parse Error] ${e.message} | preview: ${cleaned.slice(0,400)}`);
      return res.status(500).json({ error: "Output was not valid JSON after repair. Try a shorter trip or fewer days." });
    }

    console.log(`[Done] ${form.destinations} | conf:${conf.grade} | s2_out:${s2.usage?.completion_tokens}tok`);
    return res.status(200).json({
      trip: parsedTrip,
      content: [{ type: "text", text: cleaned }],
      usage: s2.usage,
    });

  } catch (err) {
    console.error("[Error]", err);
    return res.status(500).json({ error: err.message });
  }
}

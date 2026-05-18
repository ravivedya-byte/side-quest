// ═══════════════════════════════════════════════════════════════════════════
// SIDE QUEST — ADAPTIVE TWO-STAGE PIPELINE (COMPRESSED)
// Stage 1: Haiku + web search → structured intelligence JSON
// Stage 2: Sonnet composition → compressed premium itinerary JSON
// Fallback: Sonnet + 1 targeted search when confidence is LOW
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
MAX 3 web searches. Return ONLY valid JSON — no prose, no markdown, no backticks.
Every insight must be named and specific. No generic advice.`;

function buildStage1Prompt(form) {
  const month = form.dateFrom ? new Date(form.dateFrom).toLocaleString("en", { month: "long" }) : "peak season";
  return `Extract travel intelligence: ${form.destinations} from ${form.departure}
Dates: ${form.dateFrom || ""} to ${form.dateTo || ""} (${month}) | Transport: ${form.travelMode}
Preferences: ${form.preferences}

3 searches: (1) seasonal conditions ${month} (2) best neighbourhoods local advice (3) crowd hacks exact timings

Return ONLY JSON:
{"season_notes":"specific to this destination in ${month}","crowd_level":"low/medium/high + reason","best_stay_areas":[{"name":"","why":"specific","avoid_if":""}],"hidden_gems":["Named Place — why locals go"],"tourist_traps":["Named Trap — why avoid"],"crowd_hacks":["hack with exact time e.g. before 7:30 AM"],"food_spots":["Named Place — what to order"],"transport_notes":"specific advice","seasonal_warnings":["specific to ${month}"],"local_timing":"daily rhythms specific to destination"}`;
}

// ── STAGE 2 ──────────────────────────────────────────────────────────────────
const STAGE2_SYSTEM = `You are Side Quest — a premium travel blueprint creator.
Tone: editorial, insider, specific, emotionally intelligent. Every word earns its place.
Globally adapted — not India-specific. Mirror destination culture.
Output ONLY valid JSON. No markdown, no backticks, no preamble.

OUTPUT COMPRESSION — MANDATORY HARD LIMITS:
- philosophy: max 45 words
- tagline: max 18 words
- memories[]: max 18 words each
- moodTags: max 5 tags, 1-3 words each
- timeline[].desc: max 28 words — no cinematic filler
- tips[]: max 20 words each
- hacks[]: max 16 words each, must include exact timing
- warnings[]: max 15 words each
- stay.why: max 30 words
- stay.notWhere: ONE sentence, max 24 words, direct comparison
- differentiators[]: max 20 words each, specific and opinionated
- packing[]: max 12 words each
- food[]: max 20 words each — named place + dish + why
- food[]: max 20 words each — named place + what to order + why

FOOD IS IMPORTANT: Every day must have 2-3 specific food recommendations. Named places, specific dishes, local context. Not "try local cuisine."

FOOD IS IMPORTANT: every day needs 2-3 named food spots with specific dishes. Not generic.
GEOGRAPHIC FLOW — MANDATORY: Every day has exactly two non-negotiable anchors scheduled first:
ANCHOR 1 — SUNSET: Identify the single best sunset spot for this day's location. Position the group there 25-30 minutes before actual sunset time. This is the fixed endpoint the entire afternoon must flow toward geographically. After 3 PM the route must be moving toward or already near the sunset point. Never place the sunset spot as an afterthought.
ANCHOR 2 — TOP TIME-SENSITIVE ACTIVITY: The one activity most dependent on a specific time window (temple before 8:30 AM, waterfall at dawn, market at sunrise). Lock it at its optimal time.
Build all other activities as a continuous geographic arc connecting these two anchors. Route curves — never zigzags. Morning near the day's start point, afternoon drifting toward the sunset location, evening at the sunset spot. Travel between activities should feel like a natural drift, not commuting.

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

  return `RESEARCH INTELLIGENCE (${conf.grade} confidence, ${conf.score}/${conf.maxScore}):
${JSON.stringify(intelligence)}

TRIP: ${form.destinations} from ${form.departure} | ${dateStr} | ${form.people} people | ${form.budget}/person
${transportNote}
Preferences: ${form.preferences}
${qualityNote}

RULES: Pace by what rewards staying. Sunset in timeline only. Specific locality + why for every stay. 1-2 sentence max descriptions. Use research intel — real places, real timings. Preferences shape the entire arc. Use the same currency symbol the user entered in their budget (e.g. ₹, $, €) for ALL monetary values. Never mix currencies.

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
    "timeline":[{"time":"5:30 AM","title":"activity","desc":"≤28 words","type":"highlight|travel|food|sunset|stay|tip","mustDo":false}],
    "food":["Named Place — specific dish — context ≤20 words"],
    "stay":{"locality":"name","why":"≤30 words","notWhere":"≤24 words — direct comparison"},
    "tips":["≤20 words"],
    "hacks":["≤16 words with exact timing"],
    "warnings":["≤15 words"],
    "budget":"X/person"
  }],
  "costs":{"transport":{"amount":"X","note":"brief"},"accommodation":{"amount":"X","note":"brief"},"food":{"amount":"X","note":"brief"},"activities":{"amount":"X","note":"brief"},"misc":{"amount":"X","note":"brief"},"total":"X/person"},
  "differentiators":["≤20 words each — specific and opinionated"],
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

  const headers = {
    "Content-Type": "application/json",
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
  };

  try {
    // ── STAGE 1: Haiku research ───────────────────────────────────────────────
    console.log(`[S1] Starting: ${form.destinations}`);
    const s1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers,
      body: JSON.stringify({
        model: "claude-haiku-4-5", max_tokens: 1200,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: STAGE1_SYSTEM,
        messages: [{ role: "user", content: buildStage1Prompt(form) }],
      }),
    });
    const s1Data = await s1.json();
    console.log(`[S1] tokens: in:${s1Data.usage?.input_tokens} out:${s1Data.usage?.output_tokens}`);

    let intelligence = {};
    if (s1Data.content) {
      const txt = s1Data.content.filter(b => b.type === "text").map(b => b.text).join("");
      try { intelligence = JSON.parse(txt.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim()); } catch {}
    }

    // ── CONFIDENCE EVALUATION ─────────────────────────────────────────────────
    const conf = scoreIntelligence(intelligence);
    console.log(`[Conf] grade:${conf.grade} score:${conf.score}/${conf.maxScore} | ${conf.log}`);

    // ── ADAPTIVE FALLBACK ─────────────────────────────────────────────────────
    if (conf.grade === "low") {
      const fbQuery = buildFallbackQuery(form.destinations, conf.weakAreas);
      console.log(`[Fallback] triggered. query: "${fbQuery}"`);
      const fb = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-5", max_tokens: 700,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `Run ONE targeted web search. Return compact JSON only — no prose.`,
          messages: [{ role: "user", content: `Search: "${fbQuery}"\n\nReturn ONLY: {"hidden_gems":["named — why"],"hacks":["exact timing"],"stay_areas":["name — why"],"food":["named — what"],"insights":["specific"]}` }],
        }),
      });
      const fbData = await fb.json();
      console.log(`[Fallback] tokens: in:${fbData.usage?.input_tokens} out:${fbData.usage?.output_tokens}`);
      if (fbData.content) {
        const fbTxt = fbData.content.filter(b => b.type === "text").map(b => b.text).join("");
        try {
          const fbI = JSON.parse(fbTxt.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());
          if (fbI.hidden_gems?.length) intelligence.hidden_gems = [...(intelligence.hidden_gems||[]), ...fbI.hidden_gems].slice(0,6);
          if (fbI.hacks?.length) intelligence.crowd_hacks = [...(intelligence.crowd_hacks||[]), ...fbI.hacks].slice(0,5);
          if (fbI.stay_areas?.length) intelligence.best_stay_areas = [...(intelligence.best_stay_areas||[]), ...fbI.stay_areas.map(s=>({name:s,why:"local rec",avoid_if:""}))].slice(0,4);
          if (fbI.food?.length) intelligence.food_spots = [...(intelligence.food_spots||[]), ...fbI.food].slice(0,5);
          if (fbI.insights?.length) intelligence.local_timing = [intelligence.local_timing, ...fbI.insights].filter(Boolean).join(" | ");
          console.log("[Fallback] intelligence merged");
        } catch { console.log("[Fallback] parse failed, using original"); }
      }
    }

    // ── STAGE 2: Sonnet composition ───────────────────────────────────────────
    console.log(`[S2] Composing (fallback:${conf.grade==="low"})`);
    const s2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        system: STAGE2_SYSTEM,
        messages: [{ role: "user", content: buildStage2Prompt(form, intelligence, conf) }],
      }),
    });

    const s2Data = await s2.json();
    if (!s2.ok) return res.status(s2.status).json({ error: s2Data.error?.message || "Composition error" });

    // Validate JSON completeness
    const rawText = (s2Data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
    const cleaned = rawText.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
    console.log(`[S2] tokens: in:${s2Data.usage?.input_tokens} out:${s2Data.usage?.output_tokens} | raw_chars:${rawText.length}`);

    try {
      JSON.parse(cleaned);
    } catch(e) {
      console.error(`[S2 Parse Error] ${e.message} | preview: ${cleaned.slice(0,400)}`);
      return res.status(500).json({ error: "Output truncated. Try a shorter trip or fewer days." });
    }

    console.log(`[Done] ${form.destinations} | conf:${conf.grade} | s2_out:${s2Data.usage?.output_tokens}tok`);
    return res.status(200).json(s2Data);

  } catch (err) {
    console.error("[Error]", err);
    return res.status(500).json({ error: err.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// SIDE QUEST — ADAPTIVE TWO-STAGE GENERATION PIPELINE
// Stage 1: Haiku + web search (research extraction)
// Stage 2: Sonnet composition (no search by default)
// Fallback: Sonnet + 1 targeted search if confidence is LOW
// ═══════════════════════════════════════════════════════════════

// ── INTELLIGENCE CONFIDENCE SCORING ────────────────────────────────────────────
function scoreIntelligence(intel) {
  if (!intel || typeof intel !== "object" || Object.keys(intel).length < 3) {
    return { score: 0, maxScore: 15, confidence: 0, grade: "low", weakAreas: ["empty_response"], log: "Stage 1 returned empty or malformed intelligence" };
  }

  let score = 0;
  const weakAreas = [];
  const log = [];

  // 1. HIDDEN GEMS — named, specific places (not generic areas) — 0-3 pts
  const gems = Array.isArray(intel.hidden_gems) ? intel.hidden_gems : [];
  const specificGems = gems.filter(g => typeof g === "string" && (g.includes("—") || g.includes(" - ") || g.length > 35));
  score += Math.min(specificGems.length, 3);
  if (specificGems.length < 2) { weakAreas.push("hidden_gems"); log.push(`gems:${specificGems.length}/3`); }
  else log.push(`gems:${specificGems.length}✓`);

  // 2. CROWD HACKS — must contain actual timings (7 AM, before 8am, etc.) — 0-3 pts
  const hacks = Array.isArray(intel.crowd_hacks) ? intel.crowd_hacks : [];
  const timedHacks = hacks.filter(h => typeof h === "string" && /\b\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)|before \d|after \d|\d:\d{2}/i.test(h));
  score += Math.min(timedHacks.length * 1.5, 3);
  if (timedHacks.length === 0) { weakAreas.push("crowd_hacks"); log.push("hacks:no_timings"); }
  else log.push(`hacks:${timedHacks.length}✓`);

  // 3. STAY AREAS — need name + actual reasoning — 0-2 pts
  const stays = Array.isArray(intel.best_stay_areas) ? intel.best_stay_areas : [];
  const richStays = stays.filter(s => s && typeof s.why === "string" && s.why.length > 15 && s.name);
  score += Math.min(richStays.length, 2);
  if (richStays.length < 1) { weakAreas.push("stay_areas"); log.push("stays:weak"); }
  else log.push(`stays:${richStays.length}✓`);

  // 4. FOOD SPOTS — named places, not just cuisine types — 0-2 pts
  const food = Array.isArray(intel.food_spots) ? intel.food_spots : [];
  const namedFood = food.filter(f => typeof f === "string" && f.length > 20 && (f.includes("—") || f.includes("-") || /[A-Z]/.test(f.slice(1))));
  score += Math.min(namedFood.length, 2);
  if (namedFood.length < 1) { weakAreas.push("food_spots"); log.push("food:generic"); }
  else log.push(`food:${namedFood.length}✓`);

  // 5. TOURIST TRAPS — any named specific trap — 0-1 pt
  const traps = Array.isArray(intel.tourist_traps) ? intel.tourist_traps : [];
  const namedTraps = traps.filter(t => typeof t === "string" && t.length > 15);
  score += namedTraps.length > 0 ? 1 : 0;
  if (namedTraps.length === 0) { weakAreas.push("tourist_traps"); log.push("traps:none"); }
  else log.push("traps✓");

  // 6. SEASONALITY — destination-specific, not generic — 0-1 pt
  const seasonNotes = intel.season_notes || "";
  const hasSeasonDepth = seasonNotes.length > 30 && !/weather can be|unpredictable|varies by/i.test(seasonNotes);
  score += hasSeasonDepth ? 1 : 0;
  if (!hasSeasonDepth) { weakAreas.push("seasonality"); log.push("season:shallow"); }
  else log.push("season✓");

  // 7. LOCAL TIMING — daily rhythms specific to this place — 0-1 pt
  const timing = intel.local_timing || "";
  score += timing.length > 25 ? 1 : 0;
  if (timing.length < 25) { weakAreas.push("local_timing"); log.push("timing:thin"); }
  else log.push("timing✓");

  // 8. TRANSPORT NOTES — not just "use public transport" — 0-1 pt
  const transport = intel.transport_notes || "";
  score += transport.length > 20 && !/use public transport|take a taxi|rent a car/i.test(transport) ? 1 : 0;
  if (transport.length < 20) log.push("transport:thin");
  else log.push("transport✓");

  // 9. SEASONAL WARNINGS — specific, not generic — 0-1 pt
  const warnings = Array.isArray(intel.seasonal_warnings) ? intel.seasonal_warnings : [];
  const specificWarnings = warnings.filter(w => typeof w === "string" && w.length > 15);
  score += specificWarnings.length > 0 ? 1 : 0;
  if (specificWarnings.length === 0) log.push("warnings:none");
  else log.push("warnings✓");

  // PENALTY: generic travel language detected
  const allText = JSON.stringify(intel).toLowerCase();
  const genericPhrases = ["local cuisine", "popular spots", "beautiful scenery", "worth visiting", "must see", "check it out", "great place", "good food", "amazing views", "nice area", "worth a visit", "don't miss"];
  const genericHits = genericPhrases.filter(p => allText.includes(p));
  const penalty = genericHits.length * 0.4;
  score -= penalty;
  if (genericHits.length > 2) { weakAreas.push("generic_language"); log.push(`generic_penalty:-${penalty.toFixed(1)}`); }

  // BONUS: named proper nouns in text (signals actual specific research)
  const properNounDensity = (allText.match(/\b[A-Z][a-z]{2,}\b/g) || []).length;
  const bonus = properNounDensity > 15 ? 1 : properNounDensity > 8 ? 0.5 : 0;
  score += bonus;
  if (bonus > 0) log.push(`specificity_bonus:+${bonus}`);

  const finalScore = Math.max(0, score);
  const maxScore = 15;
  const confidence = finalScore / maxScore;
  const grade = confidence >= 0.60 ? "high" : confidence >= 0.38 ? "medium" : "low";

  return { score: parseFloat(finalScore.toFixed(2)), maxScore, confidence: parseFloat(confidence.toFixed(3)), grade, weakAreas, log: log.join(" | ") };
}

// ── FALLBACK QUERY BUILDER ──────────────────────────────────────────────────────
function buildFallbackQuery(destination, weakAreas) {
  const priorityMap = {
    hidden_gems: `hidden gems off beaten path ${destination} locals recommend forum`,
    crowd_hacks: `${destination} best time visit avoid tourist crowds exact timing forum tips`,
    stay_areas: `${destination} best neighbourhood to stay local advice forum`,
    food_spots: `${destination} authentic local food spots where locals eat`,
    tourist_traps: `${destination} tourist traps scams to avoid forum warning`,
    seasonality: `${destination} seasonal conditions what to expect travel month`,
    local_timing: `${destination} local life rhythm daily schedule forum tips`,
    generic_language: `${destination} specific insider travel tips beyond typical advice`,
  };

  const priority = ["crowd_hacks", "hidden_gems", "stay_areas", "food_spots", "generic_language", "tourist_traps", "seasonality", "local_timing"];
  const topWeak = priority.find(a => weakAreas.includes(a));
  return priorityMap[topWeak] || `${destination} insider travel tips locals forum depth`;
}

// ── PROMPTS ─────────────────────────────────────────────────────────────────────
const STAGE1_SYSTEM = `You are a compact travel intelligence extractor.
Rules: MAX 3 web searches. Return ONLY valid JSON — no prose, no markdown, no backticks.
Every insight must be specific and actionable. No generic advice. Named places only.`;

function buildStage1Prompt(form) {
  const month = form.dateFrom
    ? new Date(form.dateFrom).toLocaleString("en", { month: "long" })
    : "peak season";
  return `Extract travel intelligence for: ${form.destinations} (from ${form.departure})
Dates: ${form.dateFrom || ""} to ${form.dateTo || ""} (${month}) | Transport: ${form.travelMode}
Preferences: ${form.preferences}

Run exactly 3 searches:
1. Seasonal conditions in ${month} — weather, crowd levels, what opens/closes
2. Best neighbourhoods to stay — local forum advice, not tourist strips
3. Insider crowd hacks and timing intelligence — exact timings required

Return ONLY this JSON (be specific — name actual places, give actual timings):
{
  "season_notes": "what ${month} actually means for this destination — specific",
  "crowd_level": "low/medium/high + one-line reason",
  "best_stay_areas": [{"name":"actual neighbourhood name","why":"one specific line","avoid_if":"one line"}],
  "hidden_gems": ["actual named place — specific reason why locals go here"],
  "tourist_traps": ["named specific trap — why to avoid"],
  "crowd_hacks": ["specific hack with exact timing e.g. Arrive before 7:30 AM"],
  "food_spots": ["Named Restaurant or Market — what to order specifically"],
  "transport_notes": "specific local transport advice for this destination",
  "seasonal_warnings": ["specific warning relevant to ${month}"],
  "local_timing": "specific daily rhythms — when locals eat, best morning window, etc."
}`;
}

const STAGE2_SYSTEM = `You are Side Quest — a premium travel blueprint creator. Editorial, insider, cinematic but compressed.
The moat: specificity, pacing, emotional sequencing, local nuance. Every word earns its place.
Adapt to destination culture — this could be anywhere in the world.
Output ONLY valid JSON. No markdown, no backticks, no preamble.`;

function buildStage2Prompt(form, intelligence, confidenceInfo) {
  const dateStr = form.dateFrom && form.dateTo ? `${form.dateFrom} to ${form.dateTo}` : form.dateFrom || "dates flexible";
  const qualityNote = confidenceInfo.grade === "low"
    ? `NOTE: Research intelligence is sparse for this destination. Be especially careful to use the preferences and trip context to infer specificity where data is thin. Compensate with strong pacing design and cultural nuance.`
    : confidenceInfo.grade === "medium"
    ? `NOTE: Intelligence in these areas was weaker — be especially specific here: ${confidenceInfo.weakAreas.join(", ")}.`
    : "";

  return `Create a Side Quest travel blueprint.

RESEARCH INTELLIGENCE (confidence: ${confidenceInfo.grade} — score ${confidenceInfo.score}/${confidenceInfo.maxScore}):
${JSON.stringify(intelligence, null, 1)}

${qualityNote}

TRIP: ${form.destinations} from ${form.departure} | ${dateStr} | ${form.people} people | ${form.travelMode} | ${form.budget}/person
Preferences: ${form.preferences}

RULES:
- Pace based on what rewards staying — move on when done, extend if it earns it
- Sunset as timeline entry with exact time — NOT a separate section
- Every stay: specific locality + exactly why over the obvious alternative
- Descriptions: 1-2 sentences max — specific beats verbose
- Globally adapted — NOT assumed to be any particular country
- Destination-culture-aware (Japan = rail/precision; Europe = walking flow; SE Asia = scooter/heat; remote = logistics-first)
- Use research intelligence above — insert specific places, exact timings, hacks from it
- User preferences must shape the entire arc — not just one section

Return ONLY this JSON:
{
  "tripTitle": "cinematic title",
  "tagline": "one evocative sentence",
  "travelStyle": "e.g. Slow Coastal / Mountain Solitude / Urban Immersion",
  "moodTags": ["3-5 tags"],
  "tripPhilosophy": "2 sentences max",
  "coreMemories": ["3-4 specific sensory moments"],
  "tripArc": ["Arrival","Descent","Immersion","Expansion","Reflection","Return"],
  "overview": {
    "routeStops": ["Stop 1","Stop 2"],
    "duration": "X days",
    "transport": "${form.travelMode}",
    "totalBudget": "X per person",
    "season": "one line"
  },
  "days": [{
    "dayNumber": 1,
    "title": "title",
    "emotionalSubtitle": "one atmospheric line",
    "timeline": [{"time":"5:30 AM","title":"activity","description":"1-2 sentences","type":"highlight OR travel OR food OR sunset OR stay OR tip","isMustDo":false}],
    "stay": {"locality":"name","whyHere":"2 sentences","whyNotElsewhere":"1 sentence"},
    "insiderTips": ["tip"],
    "crowdHacks": ["hack with exact timing"],
    "warnings": ["warning"],
    "budgetEstimate": "X per person"
  }],
  "budgetBreakdown": {
    "transport":{"amount":"X","note":"brief"},
    "accommodation":{"amount":"X","note":"brief"},
    "food":{"amount":"X","note":"brief"},
    "activities":{"amount":"X","note":"brief"},
    "misc":{"amount":"X","note":"brief"},
    "total":"X per person"
  },
  "whatMakesThisDifferent": ["5 specific opinionated points"],
  "packingNotes": ["3 specific tips for this exact trip and season"]
}`;
}

// ── HANDLER ─────────────────────────────────────────────────────────────────────
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
    // ══ STAGE 1: Haiku + web search (research extraction) ══════════════════════
    console.log(`[Stage1] Starting research for: ${form.destinations}`);

    const s1 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers,
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1200,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        system: STAGE1_SYSTEM,
        messages: [{ role: "user", content: buildStage1Prompt(form) }],
      }),
    });

    const s1Data = await s1.json();
    let intelligence = {};
    if (s1Data.content) {
      const txt = s1Data.content.filter(b => b.type === "text").map(b => b.text).join("");
      try {
        intelligence = JSON.parse(txt.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());
      } catch { intelligence = {}; }
    }

    // ══ CONFIDENCE EVALUATION ═══════════════════════════════════════════════════
    const confidence = scoreIntelligence(intelligence);
    console.log(`[Confidence] Grade:${confidence.grade} Score:${confidence.score}/${confidence.maxScore} | ${confidence.log}`);

    // ══ ADAPTIVE FALLBACK: LOW confidence triggers premium targeted search ══════
    if (confidence.grade === "low") {
      const fallbackQuery = buildFallbackQuery(form.destinations, confidence.weakAreas);
      console.log(`[Fallback] Triggered. Weak areas: ${confidence.weakAreas.join(", ")} | Query: "${fallbackQuery}"`);

      const fallback = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 800,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: `You are a targeted travel intelligence enhancer. Run EXACTLY ONE web search. Extract only specific, actionable insights. Return compact JSON — no prose.`,
          messages: [{
            role: "user",
            content: `Search for: "${fallbackQuery}"

Extract and return ONLY these fields as JSON (skip any you can't find specifically):
{
  "hidden_gems": ["named place — specific reason"],
  "crowd_hacks": ["specific hack with exact timing"],
  "stay_areas": ["neighbourhood — why locals stay here"],
  "food_spots": ["named place — what to order"],
  "local_insights": ["specific insider insight"]
}`
          }],
        }),
      });

      const fbData = await fallback.json();
      if (fbData.content) {
        const fbTxt = fbData.content.filter(b => b.type === "text").map(b => b.text).join("");
        try {
          const fbIntel = JSON.parse(fbTxt.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim());
          // Merge fallback intelligence into Stage 1 results
          if (fbIntel.hidden_gems?.length) intelligence.hidden_gems = [...(intelligence.hidden_gems || []), ...fbIntel.hidden_gems].slice(0, 6);
          if (fbIntel.crowd_hacks?.length) intelligence.crowd_hacks = [...(intelligence.crowd_hacks || []), ...fbIntel.crowd_hacks].slice(0, 5);
          if (fbIntel.stay_areas?.length) intelligence.best_stay_areas = [...(intelligence.best_stay_areas || []), ...fbIntel.stay_areas.map(s => ({ name: s, why: "local recommendation", avoid_if: "" }))].slice(0, 4);
          if (fbIntel.food_spots?.length) intelligence.food_spots = [...(intelligence.food_spots || []), ...fbIntel.food_spots].slice(0, 5);
          if (fbIntel.local_insights?.length) intelligence.local_timing = [intelligence.local_timing, ...fbIntel.local_insights].filter(Boolean).join(" | ");
          console.log("[Fallback] Intelligence enhanced successfully");
        } catch { console.log("[Fallback] Parse failed, proceeding with original intelligence"); }
      }
    }

    // ══ STAGE 2: Sonnet composition (no web search) ════════════════════════════
    console.log(`[Stage2] Composing with Sonnet (fallback_used:${confidence.grade === "low"})`);

    const s2 = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 8000,
        system: STAGE2_SYSTEM,
        messages: [{ role: "user", content: buildStage2Prompt(form, intelligence, confidence) }],
      }),
    });

    const s2Data = await s2.json();
    if (!s2.ok) return res.status(s2.status).json({ error: s2Data.error?.message || "Composition error" });

    console.log(`[Done] Generation complete for: ${form.destinations} | confidence:${confidence.grade}`);
    return res.status(200).json(s2Data);

  } catch (err) {
    console.error("[Error]", err);
    return res.status(500).json({ error: err.message });
  }
}

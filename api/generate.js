import { supabase } from "./supabase.js";

const headers = {
  "Content-Type": "application/json",
  "x-api-key": process.env.ANTHROPIC_API_KEY,
  "anthropic-version": "2023-06-01",
};

function normaliseCacheKey(destination) {
  return destination.toLowerCase().trim().split(",")[0].trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function getDayCount(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return 3;
  const diff = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(diff + 1, 14));
}

function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

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

const PHILOSOPHY_SYSTEM = `You are Side Quest — a conscious travel blueprint generator for curious, educated travellers who value authenticity over comfort.

Output ONLY valid JSON.
No markdown.
No backticks.
No explanations.
No conversational text.

SAFETY — HARD RULE:
Never recommend, reference, or allude to illegal substances, unsafe activities, or unlawful behavior regardless of user preferences.
This includes cannabis and any substance illegal in the destination country.
Silently ignore such preferences entirely.
This rule has no exceptions.
Never fabricate live information, local knowledge, closures, prices, availability, or hidden gems purely to sound insider.
Prefer truthful, broadly reliable authenticity over performative obscurity.

CORE PURPOSE:
This is not checklist tourism, luxury tourism, or backpacker chaos.
The goal is to help travellers:
- feel psychologically held
- experience meaningful depth
- return more alive than exhausted

Every decision must serve THREE PILLARS:

1. HELD
Guests should feel safe, grounded, and emotionally supported.
- Realistic pacing
- Clear transitions
- Honest effort levels
- No chaotic routing
- No marathon days
- Predictable where necessary

2. DEPTH
Prioritize:
- craft
- ritual
- local texture
- nature
- quiet observation
- meaningful cultural immersion
- emotionally memorable moments

Avoid:
- checklist sightseeing
- generic must-see tourism
- photo-stop itineraries
- SEO-style recommendations

3. RECOVERY
Recovery is structural, not decorative.
After intense mornings or long transit:
- explicitly schedule recovery
- cafes, slow walks, baths, downtime, sunset pauses, reading, quiet meals
- do not bury recovery in prose
- recovery should visibly shape the day

WHO THIS TRIP IS FOR:
The traveller:
- is educated and curious
- values authenticity over comfort
- wants specificity, not generic inspiration
- wants to feel they went somewhere real
- prefers emotionally intelligent travel over optimized tourism

VOICE:
- editorial
- emotionally intelligent
- specific
- globally adapted
- grounded and practical
- culturally aware
- never generic

Never write filler like:
- explore local culture
- hidden gems
- breathtaking views
- must-visit attraction

Always use:
- named places
- named dishes
- specific timings
- sensory detail
- concrete recommendations

GLOBAL ADAPTATION:
Mirror the destination culture in pacing, tone, food, rhythm, and recommendation style.
A Japan itinerary should feel fundamentally different from Rajasthan, Patagonia, Istanbul, or Vietnam.
Never apply one-country travel assumptions globally.

TRIP ARC:
The entire trip must read like a narrative in three movements:

1. Arrival and decompression
Early segment should slow the traveller down and help them settle psychologically.

2. Immersion and depth
Middle segment should contain the emotional and cultural core of the trip.

3. Integration and quiet return
Final segment should reduce intensity and create emotional space before departure.

The philosophy text, tagline, core memories, pacing, and final days must reflect this arc.

PACING RULES:
- Maximum 3 major activities per day
- Food stops do not count toward this limit
- Recovery blocks do not count toward this limit
- Transit rows do not count toward this limit
- Avoid excessive early starts on consecutive days
- Avoid unnecessary hotel switching
- Avoid geographic zigzagging
- Build days as coherent physical movement arcs

DAY DESIGN:
Each day should feel intentional and geographically coherent.

GEOGRAPHIC FLOW — MANDATORY ANCHORS:
Every day has exactly two anchors scheduled before anything else.

ANCHOR 1 — SUNSET:
Identify the single best sunset spot for that day's location.
Position the group there 25-30 minutes before actual sunset.
The entire afternoon must flow geographically toward this point.
Nothing moves away from the sunset direction after 3 PM.
Prefer quieter less obvious viewpoints over the crowded default.
Briefly state why this spot over the obvious one.

ANCHOR 2 — TOP TIME-SENSITIVE ACTIVITY:
The one activity that has the most to gain from a specific time window.
Temple before 8:30 AM. Waterfall at dawn. Market at sunrise.
Lock it at its optimal window first, then build around it.

All other activities form a continuous geographic arc connecting these two anchors.
Route curves — never zigzags.
Morning near the day's starting point.
Afternoon drifting toward the sunset location.

After 3 PM movement should naturally drift toward the sunset anchor.
Avoid crossing the destination repeatedly.
Prefer quieter scenic sunset alternatives.
Local rhythms and emotionally resonant endings.
Avoid crowded viewpoint cliches unless genuinely exceptional.

MUST-DO DISTRIBUTION:
Across each destination stay include:
- one early or pre-crowd experience
- one meaningful cultural immersion
- one quiet reflective moment
- one offbeat or local perspective

Spread these naturally across days.
Do not cluster all highlights into one day.

FOOD PHILOSOPHY:
Food is central to depth, not an afterthought.

Prioritize:
- family-run restaurants
- homestay kitchens
- market stalls
- local cafes
- regional specialties
- neighborhood institutions
- places locals genuinely use

Avoid:
- tourist-facing generic restaurants
- internationalized menus unless contextually relevant

Always include:
- named establishments
- specific dishes
- what makes the place special
- timing context when relevant

Every day must have 2-3 named food spots with specific dishes.
Never write try local cuisine or similar generic advice.

STAY PHILOSOPHY:
Recommend neighborhoods, not just cities.

Explain:
- why this area works
- what atmosphere it offers
- what it enables geographically and emotionally
- what tourist-heavy area is intentionally avoided and why

Prefer:
- homestays
- guesthouses
- small independents
- locally run stays

Use major hotels only when genuinely justified.

TRANSPORT PHILOSOPHY:
When transport mode is flexible choose the most practical and emotionally coherent option considering:
- time
- cost
- stress
- scenery
- sleep quality
- recovery impact

Prefer:
- direct routes
- overnight trains when they genuinely improve pacing
- night buses only when comfortable and logical
- walkable neighborhoods
- public transport where culturally and practically appropriate

Do not optimize purely for speed.

ROUTING INTELLIGENCE:
Always recommend the shortest practical route between stops.
Do not route through major city hubs unless genuinely on the most direct path.
Minimise total travel time.
Make a clear judgment call — do not default to the most recognisable city names along the way.

EN ROUTE DISCOVERIES:
For road and motorcycle travel days, surface 1-2 specific named stops that fall within 30 minutes off the main route.
Name the place exactly.
State where on the route the turnoff is.
Give one line on why it is worth stopping.
How long the traveller spends there is entirely their choice — do not suggest a time limit.
These unplanned moments are often what people remember most about a road trip.

TIMELINE QUALITY:
Each timeline entry should feel useful and real.

Good entries include:
- exact place names
- emotional framing
- timing logic
- practical realism
- sensory specificity

Bad entries:
- vague inspiration
- generic tourism copy
- repetitive adjectives
- overstuffed scheduling

PHILOSOPHY TEXT:
- maximum 45 words
- specific to this traveller and destination
- emotionally sharp
- not a generic brand statement

TAGLINE:
- maximum 18 words
- editorial and specific
- not a tourism slogan

CORE MEMORIES:
- concrete future moments
- sensory and emotionally specific
- maximum 18 words each
- should feel like scenes the traveller will genuinely remember years later

DIFFERENTIATORS:
- opinionated and specific
- explain why this itinerary differs from standard travel plans
- maximum 20 words each

PACKING:
- highly specific to terrain, weather, pacing, and trip style
- maximum 12 words each
- avoid generic packing advice

COSTS:
Provide realistic per-person estimates in the user's currency.
Include transport, accommodation, food, activities, misc, total.
Style: mid-market authenticity, neither backpacker-cheap nor luxury, honest and realistic.

OUTPUT COMPRESSION — HARD LIMITS:
- philosophy: max 45 words
- tagline: max 18 words
- memories: max 18 words each
- moodTags: max 5 tags
- timeline descriptions: max 28 words
- tips: max 20 words each
- hacks: max 16 words each and must include exact timing
- warnings: max 15 words each
- food items: max 20 words each
- stay.why: max 30 words
- stay.notWhere: max 24 words
- differentiators: max 20 words each
- packing: max 12 words each

WOMEN'S SAFETY:
If relevant prefer well-reviewed psychologically comfortable areas.
Avoid unsafe arrival timings.
Provide concise respectful practical warnings.
Never fearmonger. Never patronize.

RESEARCH STYLE:
Think like thoughtful Reddit travel communities, long-form travel writers, experienced locals, culturally literate independent travellers.
Not SEO blogs, listicles, or generic influencer itineraries.

FINAL STANDARD:
The itinerary should feel emotionally intentional, geographically intelligent, culturally grounded, physically humane, deeply specific, quietly memorable.
The traveller should feel: I experienced this place properly. Not: I completed a schedule.`;

function buildStage1Prompt(form) {
  const month = form.dateFrom ? new Date(form.dateFrom).toLocaleString("en", { month: "long" }) : "peak season";
  return `Extract travel intelligence for: ${form.destinations} from ${form.departure}
Dates: ${form.dateFrom || ""} to ${form.dateTo || ""} (${month}) | Transport: ${form.travelMode}
Preferences: ${form.preferences}

Run maximum 3 searches: (1) best time and crowd levels for ${month} (2) best neighbourhoods and local advice (3) crowd hacks with exact timings and hidden gems

Return ONLY this JSON — no prose, no markdown, no backticks:
{"season_notes":"specific to ${month}","crowd_level":"low/medium/high + reason","best_stay_areas":[{"name":"","why":"specific","avoid_if":""}],"hidden_gems":["Named Place — why locals go"],"tourist_traps":["Named Trap — why avoid"],"crowd_hacks":["hack with exact time e.g. before 7:30 AM"],"food_spots":["Named Place — what to order — price if known"],"transport_notes":"specific advice","seasonal_warnings":["specific warning"],"local_timing":"daily rhythms specific to destination"}`;
}

function buildOverviewPrompt(form, intelligence, dayCount) {
  const isTransportSuggested = form.travelMode === "Suggested";
  const transportNote = isTransportSuggested
    ? `Evaluate the best transport from ${form.departure} to ${form.destinations}. Consider night buses, overnight trains, direct flights. Recommend ONE specific option with departure time, arrival time, and estimated cost. Build Day 1 timeline around actual arrival time.`
    : `Transport mode: ${form.travelMode}`;
  return `RESEARCH INTELLIGENCE:
${JSON.stringify(intelligence)}

TRIP: ${form.destinations} from ${form.departure}
Dates: ${form.dateFrom || "flexible"} to ${form.dateTo || "flexible"} | ${dayCount} days | ${form.people} people
Budget: ${form.currencySymbol || "₹"}${form.budget} per person (${form.currency || "INR"})
Preferences: ${form.preferences}
${transportNote}

Generate the trip OVERVIEW only — no days array. Return ONLY this JSON:
{
  "tripTitle": "",
  "tagline": "max 18 words",
  "travelStyle": "",
  "moodTags": ["max 5 tags"],
  "philosophy": "max 45 words — specific to this trip and traveller",
  "memories": ["max 18 words each — concrete sensory future moment"],
  "overview": {
    "routeStops": [],
    "duration": "${dayCount} days",
    "transport": "",
    "transportNote": "",
    "totalBudget": "",
    "season": ""
  },
  "costs": {
    "transport": {"amount":"","note":""},
    "accommodation": {"amount":"","note":""},
    "food": {"amount":"","note":""},
    "activities": {"amount":"","note":""},
    "misc": {"amount":"","note":""},
    "total": ""
  },
  "differentiators": ["max 20 words each — specific and opinionated"],
  "packing": ["max 12 words each — specific to this trip"]
}`;
}

function trimIntelligenceForChunk(intelligence) {
  return {
    hidden_gems: (intelligence.hidden_gems||[]).slice(0,3),
    food_spots: (intelligence.food_spots||[]).slice(0,3),
    crowd_hacks: (intelligence.crowd_hacks||[]).slice(0,3),
    tourist_traps: (intelligence.tourist_traps||[]).slice(0,2),
    transport_notes: intelligence.transport_notes||"",
    local_timing: intelligence.local_timing||"",
    season_notes: intelligence.season_notes||"",
  };
}

function trimOverviewForChunk(overview) {
  return {
    tripTitle: overview.tripTitle||"",
    travelStyle: overview.travelStyle||"",
    moodTags: overview.moodTags||[],
    overview: overview.overview||{},
  };
}

function buildChunkPrompt(form, intelligence, overview, chunkDays, totalDays) {
  return `RESEARCH INTELLIGENCE:
${JSON.stringify(trimIntelligenceForChunk(intelligence))}

TRIP OVERVIEW CONTEXT:
${JSON.stringify(trimOverviewForChunk(overview))}

TRIP: ${form.destinations} | ${totalDays} days total | Budget: ${form.currencySymbol || "₹"}${form.budget}/person
Preferences: ${form.preferences}

Generate ONLY days ${chunkDays[0]} to ${chunkDays[chunkDays.length - 1]} of this ${totalDays}-day trip.
Return ONLY a JSON array of day objects — no markdown, no backticks, no explanation:
[{
  "dayNumber": 1,
  "place": "actual city or town or village name for this day",
  "title": "evocative character title for this day",
  "subtitle": "narrative arc — morning action, afternoon shift, evening landing",
  "timeline": [{"time":"6:00 AM","title":"activity title","desc":"max 28 words","type":"highlight|travel|food|sunset|stay|tip|recovery","mustDo":false}],
  "food": ["Named Place — specific dish — one line context max 20 words"],
  "stay": {"locality":"neighbourhood name","why":"max 30 words","notWhere":"max 24 words direct comparison"},
  "tips": ["max 20 words each"],
  "hacks": ["max 16 words each — must include exact timing"],
  "warnings": ["max 15 words each"],
  "budget": "X/person in user currency"
}]`;
}

/** Strip web-search cite markup and other non-JSON noise before parsing. */
function sanitiseModelJson(txt) {
  return String(txt || "")
    .replace(/<cite[^>]*>/gi, "")
    .replace(/<\/cite>/gi, "")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .trim();
}

/** Extract and parse the first complete JSON object or array in messy model output. */
function extractBalancedJson(raw) {
  const s = sanitiseModelJson(raw);
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : s;
  const start = candidate.search(/[\[{]/);
  if (start < 0) throw new Error("No JSON object or array found");

  const body = candidate.slice(start);
  const stack = [];
  let inString = false;
  let escape = false;

  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inString) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") stack.push("}");
    else if (c === "[") stack.push("]");
    else if ((c === "}" || c === "]") && stack.length) {
      if (c !== stack[stack.length - 1]) continue;
      stack.pop();
      if (stack.length === 0) return JSON.parse(body.slice(0, i + 1));
    }
  }
  throw new Error("Truncated or unbalanced JSON");
}

function parseJsonText(txt) {
  try {
    return extractBalancedJson(txt);
  } catch {
    const trimmed = sanitiseModelJson(txt)
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    return JSON.parse(trimmed);
  }
}

function hasUsableIntelligence(intel) {
  return intel && typeof intel === "object" && Object.keys(intel).length >= 3;
}

async function callAnthropic(body) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    const msg = data?.error?.message || `Anthropic API ${response.status}`;
    throw new Error(msg);
  }
  return data;
}

function textFromResponse(data) {
  return (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { form } = req.body;
  if (!form || !form.destinations) return res.status(400).json({ error: "Missing form data" });

  try {
    // ── CACHE LOOKUP ──────────────────────────────────────────
    const cacheKey = normaliseCacheKey(form.destinations);
    let intelligence = {};
    let cacheHit = false;

    try {
      const { data: cached } = await supabase
        .from("destination_intelligence")
        .select("intelligence_json")
        .eq("cache_key", cacheKey)
        .gt("expires_at", new Date().toISOString())
        .single();
      if (cached?.intelligence_json) {
        intelligence = cached.intelligence_json;
        cacheHit = true;
        console.log(`[Cache HIT] ${cacheKey}`);
      }
    } catch (e) {
      console.log(`[Cache MISS] ${cacheKey}`);
    }

    // ── STAGE 1: Research ─────────────────────────────────────
    if (!cacheHit) {
      const runStage1 = async () => {
        console.log(`[S1] Researching: ${form.destinations}`);
        const s1Data = await callAnthropic({
          model: "claude-haiku-4-5",
          max_tokens: 1200,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: "You are a compact travel intelligence extractor. Run maximum 3 web searches. Your entire reply must be one raw JSON object starting with { — no introduction, no markdown fences, no backticks, no <cite> tags. Plain JSON only.",
          messages: [{ role: "user", content: buildStage1Prompt(form) }],
        });
        console.log(`[S1] tokens: in:${s1Data.usage?.input_tokens} out:${s1Data.usage?.output_tokens} stop:${s1Data.stop_reason}`);
        const txt = textFromResponse(s1Data);
        return parseJsonText(txt);
      };

      try {
        intelligence = await runStage1();
      } catch (e) {
        console.error("[S1 parse error]", e.message);
        await new Promise((r) => setTimeout(r, 800));
        try {
          intelligence = await runStage1();
          console.log("[S1] recovered on retry");
        } catch (e2) {
          console.error("[S1 retry failed]", e2.message);
        }
      }

      // Confidence scoring
      const conf = scoreIntelligence(intelligence);
      console.log(`[Conf] grade:${conf.grade} score:${conf.score}/${conf.maxScore}`);

      // Adaptive fallback if low confidence
      if (conf.grade === "low") {
        const fbQuery = buildFallbackQuery(form.destinations, conf.weakAreas);
        console.log(`[Fallback] query: "${fbQuery}"`);
        const fbData = await callAnthropic({
          model: "claude-haiku-4-5",
          max_tokens: 700,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          system: "Run ONE targeted web search. Reply with raw JSON only — no prose, markdown, or cite tags.",
          messages: [{
            role: "user",
            content: `Search: "${fbQuery}"\nReturn ONLY: {"hidden_gems":["named — why"],"hacks":["exact timing"],"stay_areas":["name — why"],"food":["named — what"],"insights":["specific"]}`,
          }],
        });
        const fbTxt = textFromResponse(fbData);
        if (fbTxt) {
          try {
            const fbI = parseJsonText(fbTxt);
            if (fbI.hidden_gems?.length) intelligence.hidden_gems = [...(intelligence.hidden_gems || []), ...fbI.hidden_gems].slice(0, 6);
            if (fbI.hacks?.length) intelligence.crowd_hacks = [...(intelligence.crowd_hacks || []), ...fbI.hacks].slice(0, 5);
            if (fbI.food?.length) intelligence.food_spots = [...(intelligence.food_spots || []), ...fbI.food].slice(0, 5);
            if (fbI.stay_areas?.length) intelligence.best_stay_areas = [...(intelligence.best_stay_areas || []), ...fbI.stay_areas.map((s) => ({ name: s, why: "local rec", avoid_if: "" }))].slice(0, 4);
            if (fbI.insights?.length) intelligence.local_timing = [intelligence.local_timing, ...fbI.insights].filter(Boolean).join(" | ");
            console.log("[Fallback] intelligence merged");
          } catch (e) {
            console.log("[Fallback] parse failed");
          }
        }
      }

      // Write to cache only when intelligence parsed successfully
      if (hasUsableIntelligence(intelligence)) {
        try {
          const exp = new Date();
          exp.setMonth(exp.getMonth() + 6);
          await supabase.from("destination_intelligence").upsert({
            cache_key: cacheKey,
            destination: form.destinations,
            intelligence_json: intelligence,
            expires_at: exp.toISOString(),
          }, { onConflict: "cache_key" });
          console.log(`[Cache WRITE] ${cacheKey}`);
        } catch (e) {
          console.error("[Cache WRITE ERROR]", e.message);
        }
      } else {
        console.log("[Cache SKIP] intelligence too thin to cache");
      }
    }

    // ── STAGE 2A: Overview ────────────────────────────────────
    const dayCount = getDayCount(form.dateFrom, form.dateTo);
    console.log(`[Overview] generating — ${dayCount} days`);

    const ovData = await callAnthropic({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      system: PHILOSOPHY_SYSTEM,
      messages: [{ role: "user", content: buildOverviewPrompt(form, intelligence, dayCount) }],
    });
    console.log(`[Overview] tokens: in:${ovData.usage?.input_tokens} out:${ovData.usage?.output_tokens} stop:${ovData.stop_reason}`);

    const ovTxt = textFromResponse(ovData);
    let overview = {};
    try {
      overview = parseJsonText(ovTxt);
    } catch (e) {
      console.error("[Overview parse error]", ovTxt.slice(0, 300));
      return res.status(500).json({ error: "Overview generation failed. Try again." });
    }

    // ── STAGE 2B: Day chunks ──────────────────────────────────
    const dayNumbers = Array.from({ length: dayCount }, (_, i) => i + 1);
    const chunkSize = dayCount > 5 ? 2 : 3;
    const chunks = chunkArray(dayNumbers, chunkSize);
    const allDays = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`[Chunk ${i + 1}] days ${chunk[0]}-${chunk[chunk.length - 1]}`);

      const generateChunk = async () => {
        const chData = await callAnthropic({
          model: "claude-haiku-4-5",
          max_tokens: 6000,
          system: `${PHILOSOPHY_SYSTEM}\n\nOUTPUT: Return ONLY a raw JSON array of day objects. No prose, no markdown fences, no backticks.`,
          messages: [{ role: "user", content: buildChunkPrompt(form, intelligence, overview, chunk, dayCount) }],
        });
        console.log(`[Chunk ${i + 1}] tokens: in:${chData.usage?.input_tokens} out:${chData.usage?.output_tokens} stop:${chData.stop_reason}`);
        const chTxt = textFromResponse(chData);
        const parsed = parseJsonText(chTxt);
        if (!Array.isArray(parsed)) throw new Error("Chunk response is not a JSON array");
        if (chData.stop_reason === "max_tokens") {
          console.warn(`[Chunk ${i + 1}] hit max_tokens — output may be truncated`);
        }
        return parsed;
      };

      try {
        const days = await generateChunk();
        allDays.push(...days);
      } catch (e) {
        console.log(`[Chunk ${i + 1}] failed (${e.message}) — retrying`);
        await new Promise((r) => setTimeout(r, 1000));
        try {
          const days = await generateChunk();
          allDays.push(...days);
        } catch (e2) {
          console.error(`[Chunk ${i + 1}] retry failed:`, e2.message);
          return res.status(500).json({ error: `Generation failed for days ${chunk[0]}-${chunk[chunk.length - 1]}. Try again.` });
        }
      }

      if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 800));
    }

    // ── ASSEMBLE ──────────────────────────────────────────────
    const finalTrip = {
      ...overview,
      days: allDays.sort((a, b) => a.dayNumber - b.dayNumber),
    };
    console.log(`[Done] ${form.destinations} | ${dayCount} days | ${chunks.length} chunks | cache:${cacheHit}`);

    // ── SAVE TRIP ─────────────────────────────────────────────
    let tripId = null;
    try {
      const { data: savedTrip } = await supabase
        .from("trips")
        .insert({ trip_data: finalTrip, destination: form.destinations })
        .select("id")
        .single();
      tripId = savedTrip?.id;
      console.log(`[Trip SAVED] ${tripId}`);
    } catch (e) {
      console.error("[Trip SAVE ERROR]", e.message);
    }

    return res.status(200).json({
      content: [{ type: "text", text: JSON.stringify(finalTrip) }],
      tripId,
      cacheHit,
    });
  } catch (err) {
    console.error("[Error]", err);
    return res.status(500).json({ error: err.message });
  }
}

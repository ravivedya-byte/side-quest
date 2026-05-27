import { jsonrepair } from "jsonrepair";
import { supabase } from "./supabase.js";

// SIDE QUEST - CHUNKED DEEPSEEK PIPELINE
// Blueprint first, then bounded day-section calls in parallel. This keeps long
// trips detailed without asking one model response to carry the entire itinerary.

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_BLUEPRINT_MODEL = process.env.DEEPSEEK_BLUEPRINT_MODEL || process.env.DEEPSEEK_STAGE2_MODEL || "deepseek-v4-flash";
const DEEPSEEK_SECTION_MODEL = process.env.DEEPSEEK_SECTION_MODEL || process.env.DEEPSEEK_STAGE2_MODEL || "deepseek-v4-flash";
const CALL_TIMEOUT_MS = 95000;
const MAX_SUPPORTED_DAYS = 14;
const CHUNK_SIZE = 3;

class EmptyModelResponseError extends Error {
  constructor(message) {
    super(message);
    this.name = "EmptyModelResponseError";
  }
}

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

function getChoiceContent(choice) {
  const content = choice?.message?.content;
  if (Array.isArray(content)) {
    return content.map((part) => {
      if (typeof part === "string") return part;
      return part?.text || part?.content || "";
    }).join("");
  }
  return typeof content === "string" ? content : "";
}

async function callDeepSeekJSON({ model, system, user, maxTokens, label }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

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

  const choice = data.choices?.[0] || {};
  const content = getChoiceContent(choice);
  if (!content.trim()) {
    const finishReason = choice.finish_reason || "unknown";
    console.warn(`[DeepSeek Empty] ${label || "request"} | model:${model} | finish:${finishReason} | usage:${JSON.stringify(data.usage || {})}`);
    throw new EmptyModelResponseError(`${label || "DeepSeek"} returned an empty response`);
  }

  return {
    text: cleanJsonText(content),
    usage: data.usage || {},
  };
}

async function callDeepSeekJSONWithRetry(options, retries = 1) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await callDeepSeekJSON(options);
    } catch (err) {
      lastError = err;
      const retryable = err.name === "EmptyModelResponseError" || err.name === "AbortError";
      if (!retryable || attempt === retries) break;
      console.warn(`[DeepSeek Retry] ${options.label || "request"} attempt ${attempt + 2}/${retries + 1} after ${err.message}`);
    }
  }
  throw lastError;
}

function splitDestinations(destinations = "") {
  const parts = destinations
    .split(/\s*(?:,|;|\||\+|->| to )\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts : [destinations || "Route stop"];
}

function normaliseCacheKey(destination) {
  return destination
    .toLowerCase()
    .trim()
    .split(",")[0]
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTripDayCount(form) {
  const from = parseDateOnly(form.dateFrom);
  const to = parseDateOnly(form.dateTo);
  if (from && to && to >= from) {
    const diff = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    return Math.min(Math.max(diff, 1), MAX_SUPPORTED_DAYS);
  }

  const text = `${form.destinations || ""} ${form.preferences || ""}`;
  const match = text.match(/\b(\d{1,2})\s*(day|days|night|nights)\b/i);
  if (match) {
    const days = Number(match[1]) + (match[2].toLowerCase().startsWith("night") ? 1 : 0);
    return Math.min(Math.max(days, 1), MAX_SUPPORTED_DAYS);
  }

  return 5;
}

function buildChunks(dayCount) {
  const chunks = [];
  for (let start = 1; start <= dayCount; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE - 1, dayCount);
    chunks.push({
      start,
      end,
      days: Array.from({ length: end - start + 1 }, (_, i) => start + i),
    });
  }
  return chunks;
}

function compactBlueprintForPrompt(blueprint) {
  return {
    tripTitle: blueprint.tripTitle,
    overview: blueprint.overview,
    routePlan: blueprint.routePlan,
    foodMap: blueprint.foodMap,
    generationNotes: blueprint.generationNotes,
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normaliseDay(day, fallbackNumber) {
  return {
    dayNumber: Number(day?.dayNumber) || fallbackNumber,
    place: day?.place || "Route stop",
    title: day?.title || "A grounded day",
    subtitle: day?.subtitle || "A steady rhythm of movement, depth, and recovery.",
    timeline: asArray(day?.timeline).map((item) => ({
      time: item?.time || "",
      title: item?.title || "Planned moment",
      desc: item?.desc || "",
      type: item?.type || "highlight",
      mustDo: Boolean(item?.mustDo),
    })),
    food: asArray(day?.food),
    stay: day?.stay || { locality: "", why: "", notWhere: "" },
    tips: asArray(day?.tips),
    hacks: asArray(day?.hacks),
    warnings: asArray(day?.warnings),
    budget: day?.budget || "",
  };
}

function ensureFoodMap(blueprint, days) {
  const existing = asArray(blueprint.foodMap).filter((group) => group?.place && asArray(group.spots).length);
  if (existing.length) return existing;

  const places = [...new Set(days.map((day) => day.place).filter(Boolean))];
  return places.map((place) => ({
    place,
    spots: days
      .filter((day) => day.place === place)
      .flatMap((day) => asArray(day.food))
      .slice(0, 3)
      .map((food) => {
        const parts = String(food).split(/\s+(?:-|\u2014)\s+/).map((part) => part.trim()).filter(Boolean);
        return {
          name: parts[0] || String(food),
          order: parts[1] || "local order",
          bestFor: "local meal",
          why: parts[2] || "Fits the route rhythm",
        };
      }),
  }));
}

function assembleTrip({ blueprint, dayChunks, dayCount }) {
  const generatedDays = dayChunks
    .flatMap((chunk) => asArray(chunk.days))
    .sort((a, b) => (Number(a.dayNumber) || 0) - (Number(b.dayNumber) || 0))
    .slice(0, dayCount);
  const days = Array.from({ length: dayCount }, (_, index) => {
    const dayNumber = index + 1;
    const matchingDay = generatedDays.find((day) => Number(day?.dayNumber) === dayNumber);
    return normaliseDay(matchingDay, dayNumber);
  });

  return {
    tripTitle: blueprint.tripTitle || "Side Quest Itinerary",
    tagline: blueprint.tagline || "A slower, deeper route built around presence.",
    travelStyle: blueprint.travelStyle || "Conscious travel",
    moodTags: asArray(blueprint.moodTags).slice(0, 5),
    philosophy: blueprint.philosophy || "",
    memories: asArray(blueprint.memories).slice(0, 5),
    overview: blueprint.overview || {
      routeStops: [...new Set(days.map((day) => day.place).filter(Boolean))],
      duration: `${dayCount} days`,
      transport: "",
      totalBudget: "",
      season: "",
    },
    days,
    foodMap: ensureFoodMap(blueprint, days),
    costs: blueprint.costs || {},
    differentiators: asArray(blueprint.differentiators),
    packing: asArray(blueprint.packing),
  };
}

const BRAND_SYSTEM = `You are Side Quest, a conscious travel blueprint creator for a real operator.

BRAND:
(1) Held and low-stress: clear transitions, realistic timing, psychologically safe pacing.
(2) Depth: craft, ritual, nature, quiet observation, meaningful local encounter; not checklist sightseeing.
(3) Recovery: after intense mornings, include real recovery time.

STYLE: editorial, specific, practical, globally adapted. Use best-known travel knowledge and forum-style judgement, but do not pretend to have live web search or current certainty about closures/prices.

RULES:
- Prefer quieter, authentic, locally grounded experiences over generic tourist hits.
- Prefer homestays, family-run guesthouses, small independents, public/shared/local transport where sensible.
- Infer currency from budget text and use it consistently.
- If women's safety is prioritized, bias toward reputable areas, sensible arrival times, and practical non-alarmist warnings.
- Return ONLY valid JSON. No markdown, no backticks, no prose outside JSON.`;

function buildTripContext(form, dayCount) {
  const dateStr = form.dateFrom && form.dateTo ? `${form.dateFrom} to ${form.dateTo}` : form.dateFrom || "flexible";
  const transport = form.travelMode === "Suggested"
    ? `Suggest the best transport from ${form.departure}, including rough timing and cost.`
    : form.travelMode;
  return `Trip: ${dayCount} days in ${form.destinations} from ${form.departure}
Dates: ${dateStr}
People: ${form.people}
Budget: ${form.budget} per person
Transport: ${transport}
Preferences: ${form.preferences || ""}
Women's safety prioritized: ${form.prioritizeWomensSafety ? "yes" : "no"}`;
}

function buildLocalBlueprint(form, dayCount) {
  const stops = splitDestinations(form.destinations);
  return {
    tripTitle: `${form.destinations} Side Quest`,
    tagline: "A slower route shaped around depth, recovery, and local texture.",
    travelStyle: "Conscious travel",
    moodTags: ["slow", "local", "restorative", "offbeat"],
    philosophy: "This route balances meaningful local encounters with realistic pacing, recovery windows, and quieter alternatives to the obvious tourist circuit.",
    memories: ["A quiet sunset away from the crowd", "A local meal that anchors the day", "A slower morning with room to breathe"],
    overview: {
      routeStops: stops,
      duration: `${dayCount} days`,
      transport: form.travelMode === "Suggested" ? "Best route to be recommended inside the day plan" : form.travelMode,
      transportNote: form.travelMode === "Suggested" ? `Start from ${form.departure}; choose the most sensible route for budget and arrival time.` : "Use the selected travel mode.",
      originalTransport: form.travelMode,
      totalBudget: `${form.budget}/person`,
      season: form.dateFrom || form.dateTo ? `Planned for ${form.dateFrom || "flexible"} to ${form.dateTo || "flexible"}.` : "Season flexible; verify live weather and closures before booking.",
    },
    routePlan: stops.map((place, index) => ({
      place,
      days: Array.from({ length: dayCount }, (_, i) => i + 1).filter((day) => (day - 1) % stops.length === index),
      stay: { locality: "central but quiet local neighbourhood", why: "Keeps transfers simple while avoiding the busiest tourist strip.", notWhere: "Avoid the loudest nightlife or package-tour cluster." },
      arc: "Use this stop for a grounded mix of local food, depth, and recovery.",
    })),
    foodMap: [],
    costs: {
      transport: { amount: "TBD", note: "Estimate inside route details" },
      accommodation: { amount: "TBD", note: "Small stays or homestays preferred" },
      food: { amount: "TBD", note: "Local meals and cafes" },
      activities: { amount: "TBD", note: "Depth-first experiences" },
      misc: { amount: "TBD", note: "Buffer for transfers and tips" },
      total: `${form.budget}/person`,
    },
    differentiators: [
      "The route prioritizes recovery instead of packing every hour.",
      "Sunsets and time-sensitive moments anchor the geography of each day.",
      "Food choices are treated as part of the experience, not filler.",
      "Stay areas bias toward calmer, locally grounded neighbourhoods.",
    ],
    packing: ["Comfortable walking shoes", "Light day bag", "Reusable bottle", "Layer for evenings", "Offline maps"],
    generationNotes: ["Blueprint fallback used after empty model response; day chunks should infer specifics."],
  };
}

function buildBlueprintPrompt(form, dayCount, chunks) {
  return `${buildTripContext(form, dayCount)}

Create the route-level blueprint only. Do NOT generate day timelines.

Day chunks that will be generated next: ${chunks.map((c) => `days ${c.start}-${c.end}`).join(", ")}.

Return ONLY this JSON:
{
  "tripTitle":"specific title",
  "tagline":"max 18 words",
  "travelStyle":"short style label",
  "moodTags":["max 5 short tags"],
  "philosophy":"max 55 words",
  "memories":["3-5 concrete sensory memories, max 16 words each"],
  "overview":{
    "routeStops":["ordered stop names"],
    "duration":"${dayCount} days",
    "transport":"specific recommendation or selected mode",
    "transportNote":"departure/arrival/cost if transport is suggested, otherwise brief note",
    "originalTransport":"${form.travelMode}",
    "totalBudget":"budget/person",
    "season":"one specific line"
  },
  "routePlan":[{"place":"actual stop","days":[1,2],"stay":{"locality":"name","why":"max 30 words","notWhere":"direct comparison max 24 words"},"arc":"what this stop contributes"}],
  "foodMap":[{"place":"actual stop","spots":[{"name":"Named place","order":"specific dish/order","bestFor":"breakfast|lunch|dinner|coffee|snack|local meal","why":"max 14 words"}]}],
  "costs":{"transport":{"amount":"X","note":"brief"},"accommodation":{"amount":"X","note":"brief"},"food":{"amount":"X","note":"brief"},"activities":{"amount":"X","note":"brief"},"misc":{"amount":"X","note":"brief"},"total":"X/person"},
  "differentiators":["4-6 specific points, max 26 words each"],
  "packing":["5-8 specific items, max 12 words each"],
  "generationNotes":["named hidden gems, crowd hacks, tourist traps, local rhythms to respect"]
}`;
}

function buildSectionPrompt({ form, dayCount, chunk, blueprint }) {
  return `${buildTripContext(form, dayCount)}

ROUTE BLUEPRINT:
${JSON.stringify(compactBlueprintForPrompt(blueprint))}

Generate ONLY days ${chunk.start}-${chunk.end}. Do not include days outside this range.
Return exactly one day object for each of these day numbers: ${chunk.days.join(", ")}.

DAY RULES:
- 6-8 timeline rows per day.
- Max 3 major activities per day; food-only, short transit, and recovery do not count.
- Exactly one sunset row per day, scheduled 25-30 minutes before sunset, with a short reason why that spot over the obvious viewpoint.
- Include one top time-sensitive activity at its best time.
- Add recovery after intense mornings.
- Across each place, include mustDo:true entries for early/pre-crowd, cultural/local, quiet/recovery, and offbeat angles where possible.
- Each day has 2-3 named food spots with specific dishes.
- tips/hacks/warnings should be concise and practical; hacks must include exact timing.
- Keep geographic flow smooth. No zigzag day plans.

Return ONLY this JSON:
{
  "days":[{
    "dayNumber":${chunk.start},
    "place":"actual city/town/village",
    "title":"evocative but specific",
    "subtitle":"morning, afternoon, evening arc",
    "timeline":[{"time":"5:30 AM","title":"activity","desc":"max 30 words","type":"highlight|travel|food|sunset|stay|tip|recovery","mustDo":false}],
    "food":["Named Place - specific dish - why"],
    "stay":{"locality":"name","why":"max 30 words","notWhere":"max 24 words"},
    "tips":["max 2, max 20 words each"],
    "hacks":["max 2, exact timing"],
    "warnings":["max 2, max 16 words each"],
    "budget":"X/person"
  }]
}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const { form } = req.body;
  if (!form || !form.destinations) return res.status(400).json({ error: "Missing form data" });
  if (!process.env.DEEPSEEK_API_KEY) return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });

  const dayCount = getTripDayCount(form);
  const chunks = buildChunks(dayCount);

  try {
    const cacheKey = normaliseCacheKey(form.destinations || "");
    let cacheHit = false;
    let blueprintResponse = { usage: {}, fallback: true };
    let blueprint;

    const { data: cacheData, error: cacheReadError } = await supabase
      .from("destination_intelligence")
      .select("intelligence_json, expires_at")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cacheReadError) {
      console.warn(`[Cache Read Error] ${cacheReadError.message}`);
    }

    if (cacheData?.intelligence_json && typeof cacheData.intelligence_json === "object") {
      cacheHit = true;
      blueprint = cacheData.intelligence_json;
      console.log(`[Cache Hit] ${cacheKey} (expires ${cacheData.expires_at})`);
    } else {
      console.log(`[Cache Miss] ${cacheKey}`);
      console.log(`[Blueprint] ${form.destinations} | days:${dayCount} | model:${DEEPSEEK_BLUEPRINT_MODEL}`);
      try {
        blueprintResponse = await callDeepSeekJSONWithRetry({
          model: DEEPSEEK_BLUEPRINT_MODEL,
          maxTokens: 3800,
          system: BRAND_SYSTEM,
          user: buildBlueprintPrompt(form, dayCount, chunks),
          label: "Blueprint",
        }, 2);

        const parsedBlueprint = parseOrRepairJson(blueprintResponse.text, "Blueprint");
        blueprint = parsedBlueprint.json;
        if (parsedBlueprint.repaired) console.log("[Blueprint] jsonrepair fixed response");
      } catch (err) {
        if (err.name !== "EmptyModelResponseError") throw err;
        console.warn("[Blueprint] empty after retries; using local fallback blueprint");
        blueprint = buildLocalBlueprint(form, dayCount);
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 6);
      const { error: cacheWriteError } = await supabase
        .from("destination_intelligence")
        .upsert({
          cache_key: cacheKey,
          destination: form.destinations,
          intelligence_json: blueprint,
          expires_at: expiresAt.toISOString(),
        }, { onConflict: "cache_key" });

      if (cacheWriteError) {
        console.warn(`[Cache Write Error] ${cacheWriteError.message}`);
      } else {
        console.log(`[Cache Write] ${cacheKey}`);
      }
    }

    console.log(`[Sections] ${chunks.length} chunks via ${DEEPSEEK_SECTION_MODEL}`);
    const sectionResponses = await Promise.all(chunks.map(async (chunk) => {
      const maxTokens = Math.min(5200, 2200 + chunk.days.length * 950);
      const response = await callDeepSeekJSONWithRetry({
        model: DEEPSEEK_SECTION_MODEL,
        maxTokens,
        system: BRAND_SYSTEM,
        user: buildSectionPrompt({ form, dayCount, chunk, blueprint }),
        label: `Days ${chunk.start}-${chunk.end}`,
      }, 1);
      const parsed = parseOrRepairJson(response.text, `Days ${chunk.start}-${chunk.end}`);
      if (parsed.repaired) console.log(`[Sections] jsonrepair fixed days ${chunk.start}-${chunk.end}`);
      const days = asArray(parsed.json?.days).map((day, index) => ({
        ...day,
        dayNumber: Number(day?.dayNumber) || chunk.days[index] || chunk.start + index,
      }));
      return { json: { ...parsed.json, days }, usage: response.usage };
    }));

    const trip = assembleTrip({ blueprint, dayChunks: sectionResponses.map((section) => section.json), dayCount });
    const cleaned = JSON.stringify(trip);
    let tripId = null;

    const { data: savedTrip, error: tripSaveError } = await supabase
      .from("trips")
      .insert({
        trip_data: trip,
        destination: form.destinations,
      })
      .select("id")
      .single();

    if (tripSaveError) {
      console.warn(`[Trip Save Error] ${tripSaveError.message}`);
    } else {
      tripId = savedTrip?.id || null;
      console.log(`[Trip Save] ${tripId}`);
    }

    console.log(`[Done] ${form.destinations} | days:${trip.days.length} | chunks:${chunks.length}`);
    return res.status(200).json({
      trip,
      tripId,
      cacheHit,
      content: [{ type: "text", text: cleaned }],
      usage: {
        blueprint: blueprintResponse.usage,
        sections: sectionResponses.map((section) => section.usage).filter(Boolean),
      },
    });

  } catch (err) {
    console.error("[Generate Error]", err);
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "Generation took too long. Please try again, or reduce the trip length/details." });
    }
    return res.status(500).json({ error: err.message });
  }
}

import { useState, useEffect, useRef } from "react";

const C = {
  red:"#8C1A1A", redMid:"#6E1414", redDeep:"#1a0404", redDark:"#2a0808",
  cream:"#FAF3E0", cream2:"#F0E4C4", cream3:"#E4D4A8",
  ink:"#1A0808", amber:"#C47A10", amberLight:"#F0A060",
  sage:"#4a7820", sageLight:"#88C848", blueLight:"#4a8ab8",
};

const FONTS = "https://fonts.googleapis.com/css2?family=Anton&family=Cinzel:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap";

function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById("sq-f")) return;
    const l = document.createElement("link"); l.id="sq-f"; l.rel="stylesheet"; l.href=FONTS; document.head.appendChild(l);
    const lc = document.createElement("link"); lc.id="sq-lf"; lc.rel="stylesheet"; lc.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(lc);
    const s = document.createElement("style"); s.id="sq-g";
    s.textContent = `
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { to{transform:rotate(360deg)} }
      .sqi:focus { outline:none; border-color:${C.red}!important; box-shadow:0 0 0 3px rgba(140,26,26,.12)!important; }
      .sqi::placeholder { color:#B8A070; }
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
      input[type=date]::-webkit-calendar-picker-indicator { filter:invert(40%) sepia(60%) saturate(400%) hue-rotate(320deg); cursor:pointer; }
      .sqs option { background:${C.cream}; color:${C.ink}; }
      .sqb:hover { background:${C.redMid}!important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(140,26,26,.35)!important; }
      .sqb:active { transform:scale(.98)!important; }
      .sqd:hover { background:rgba(140,26,26,.07)!important; }
      .sqk:hover { border-color:rgba(250,243,224,.5)!important; color:${C.cream}!important; }
      textarea.sqi { resize:vertical; }
      .leaflet-container { background:#1a0404; }
      .leaflet-popup-content-wrapper { background:${C.redDark}; color:${C.cream}; border:1px solid rgba(140,26,26,.5); border-radius:6px; box-shadow:none; }
      .leaflet-popup-tip { background:${C.redDark}; }
      .leaflet-popup-content { font-family:'DM Sans',sans-serif; font-size:.82rem; font-weight:600; color:${C.cream}; margin:6px 12px; }
      .leaflet-control-attribution { background:rgba(26,4,4,.7)!important; color:rgba(240,228,196,.4)!important; font-size:.5rem!important; }
      .leaflet-control-attribution a { color:rgba(240,228,196,.4)!important; }
      .leaflet-control-zoom a { background:${C.redDark}!important; color:${C.cream}!important; border-color:rgba(140,26,26,.4)!important; }
      @media print { .np{display:none!important;} body{background:${C.cream}!important;} .print-day{break-inside:avoid;} }
    `;
    document.head.appendChild(s);
    const sc = document.createElement("script"); sc.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; document.head.appendChild(sc);
  }, []);
}

const FACTS = [
  "Hampi was once the world's second-largest city — only Beijing was bigger in the 1500s",
  "The highest motorable road on Earth passes through Ladakh at 5,359 metres above sea level",
  "Kerala has over 900km of inland waterways — more canals than Venice",
  "Meghalaya's Mawsynram receives more annual rainfall than anywhere else on the planet",
  "Spiti Valley gets less annual rain than the Sahara Desert — yet people have lived there for centuries",
  "Coorg produces nearly 30% of all the coffee grown across India",
  "Rajasthan has more standing forts than any other region on Earth",
  "The Sundarbans mangrove forest is home to tigers that have learned to swim miles offshore",
  "Majuli in Assam is the world's largest river island, slowly disappearing into the Brahmaputra",
  "The Rann of Kutch becomes the world's largest salt flat every summer — over 7,500 sq km of white",
  "India has 40 UNESCO World Heritage Sites — more than the UK, Japan, and Australia combined",
  "The Andaman Islands are geographically closer to Myanmar than to mainland India",
  "Ziro Valley in Arunachal Pradesh has been continuously inhabited for over 3,000 years",
];

const RMSGS = [
  "Scanning forums for what locals actually recommend…",
  "Cross-referencing crowd-free timings for popular spots…",
  "Finding the sunset points tourists haven't discovered yet…",
  "Comparing stay neighbourhoods by vibe, not star rating…",
  "Reading years of forum threads about this exact route…",
  "Filtering out the tourist menu. Finding the real one…",
  "Checking which spots are empty at which hour…",
  "Avoiding places every travel blogger has already been…",
  "Handcrafting your travel blueprint…",
];

function buildPrompt(f) {
  const dateInfo = f.dateFrom && f.dateTo
    ? `Travelling from ${f.dateFrom} to ${f.dateTo}.`
    : f.dateFrom ? `Departing around ${f.dateFrom}.` : "";
  return `You are Side Quest. Search forums, local blogs, and traveller discussions — not generic travel sites.

Trip: ${f.destinations}, departing from ${f.departure}. ${f.people} people, ₹${f.budget}/person, by ${f.travelMode}. ${dateInfo} Calculate the number of days from the dates provided.${f.preferences ? `\nPreferences: ${f.preferences}` : ""}

SEASON & TIMING: Use the travel dates to factor in: weather conditions, monsoon status, local festivals, peak/off-peak crowd levels, road accessibility, and what's actually open or closed during that period. Make the itinerary season-aware — not generic.

PACE: Use judgment on duration. Move when done. Extend if a place rewards it.

OUTPUT: ONLY valid JSON. No markdown, backticks, or preamble whatsoever.

{
  "tripTitle": "cinematic title",
  "tagline": "one evocative sentence",
  "travelStyle": "e.g. Slow Coastal / Adventure Heavy / Spiritual Quiet",
  "moodTags": ["3-6 single tags: Slow, Scenic, Offbeat, Food-Heavy, Hidden Gem, etc"],
  "tripPhilosophy": "2-3 sentences on what principle drives this trip",
  "coreMemories": ["4-5 specific sensory moments — concrete images, not adjectives"],
  "tripArc": ["Arrival","Descent","Immersion","Expansion","Reflection","Return"],
  "overview": {
    "routeStops": ["Stop 1","Stop 2","Stop 3"],
    "duration": "X days (calculated from dates)",
    "transport": "${f.travelMode}",
    "totalBudget": "₹X per person all-in",
    "season": "one line on what this season means for the trip"
  },
  "days": [{
    "dayNumber": 1,
    "title": "short evocative title",
    "emotionalSubtitle": "one atmospheric line",
    "timeline": [
      {
        "time": "5:30 AM",
        "title": "activity name",
        "description": "2-3 sentences, specific and concrete",
        "type": "highlight OR travel OR food OR sunset OR stay OR tip",
        "isMustDo": true
      }
    ],
    "stay": {
      "locality": "specific neighbourhood",
      "whyHere": "2-3 sentences",
      "whyNotElsewhere": "what you are avoiding by not staying on the tourist strip"
    },
    "insiderTips": ["2 practical insider tips"],
    "crowdHacks": ["1-2 specific crowd strategies with exact timings"],
    "warnings": ["1-2 things to avoid"],
    "budgetEstimate": "₹X per person this day"
  }],
  "budgetBreakdown": {
    "transport": {"amount":"₹X","note":"brief"},
    "accommodation": {"amount":"₹X","note":"brief"},
    "food": {"amount":"₹X","note":"brief"},
    "activities": {"amount":"₹X","note":"brief"},
    "misc": {"amount":"₹X","note":"brief"},
    "total": "₹X per person"
  },
  "whatMakesThisDifferent": ["5-7 specific, opinionated points"],
  "packingNotes": ["3-5 specific tips for this exact trip and season"]
}`;
}

// ── PRIMITIVES ─────────────────────────────────────────────────────────────────
function Ticker() {
  const msg = "SIDE QUEST · FIND THE REAL THING · NO TOURIST TRAPS · GO SOMEWHERE REAL · ";
  const rep = msg.repeat(10);
  return (
    <div className="np" style={{ background:C.red, overflow:"hidden", height:28, display:"flex", alignItems:"center" }}>
      <div style={{ display:"flex", animation:"ticker 38s linear infinite", whiteSpace:"nowrap" }}>
        {[rep,rep].map((r,i) => <span key={i} style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.54rem", letterSpacing:"0.14em", color:C.cream, opacity:.82 }}>{r}</span>)}
      </div>
    </div>
  );
}

function Lbl({ children, color=C.amber }) {
  return <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.22em", color, textTransform:"uppercase", marginBottom:10, opacity:.88 }}>{children}</div>;
}

function Badge({ children, bg=C.red, color=C.cream, style={} }) {
  return <span style={{ display:"inline-block", background:bg, color, fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", fontWeight:500, padding:"3px 12px", letterSpacing:"0.12em", textTransform:"uppercase", borderRadius:20, ...style }}>{children}</span>;
}

function WhyBlock({ label="Why we chose this", text }) {
  if (!text) return null;
  return (
    <div style={{ background:"rgba(196,122,16,.09)", borderLeft:`3px solid ${C.amber}`, borderRadius:"0 6px 6px 0", padding:"12px 16px", marginTop:10 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", letterSpacing:"0.18em", color:C.amber, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.87rem", color:C.cream2, lineHeight:1.75, margin:0, textAlign:"justify" }}>{text}</p>
    </div>
  );
}

const TIP  = ({t}) => <div style={{ display:"flex", gap:10, padding:"9px 13px", background:"rgba(74,120,32,.12)", borderLeft:`3px solid ${C.sage}`, borderRadius:"0 6px 6px 0", marginBottom:6 }}><span style={{ color:C.sageLight, fontSize:"0.7rem", flexShrink:0 }}>→</span><p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", color:"#a0c870", lineHeight:1.7, margin:0, textAlign:"justify" }}>{t}</p></div>;
const HACK = ({t}) => <div style={{ display:"flex", gap:10, padding:"9px 13px", background:"rgba(26,58,90,.25)", borderLeft:`3px solid ${C.blueLight}`, borderRadius:"0 6px 6px 0", marginBottom:6 }}><span style={{ color:C.blueLight, fontSize:"0.7rem", flexShrink:0 }}>◎</span><p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", color:"#7ab0d8", lineHeight:1.7, margin:0, textAlign:"justify" }}>{t}</p></div>;
const WARN = ({t}) => <div style={{ display:"flex", gap:10, padding:"9px 13px", background:"rgba(196,122,16,.1)", borderLeft:`3px solid ${C.amber}`, borderRadius:"0 6px 6px 0", marginBottom:6 }}><span style={{ color:C.amber, fontSize:"0.7rem", flexShrink:0 }}>!</span><p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", color:C.amberLight, lineHeight:1.7, margin:0, textAlign:"justify" }}>{t}</p></div>;

// ── ROUTE MAP ──────────────────────────────────────────────────────────────────
function RouteMap({ routeStops, departure }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [coords, setCoords] = useState([]);

  useEffect(() => {
    if (!routeStops?.length) return;
    const allStops = departure ? [departure, ...routeStops] : routeStops;
    const unique = [...new Set(allStops)];

    const geocode = async () => {
      const results = [];
      for (const stop of unique) {
        try {
          await new Promise(r => setTimeout(r, 350));
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop + " India")}&format=json&limit=1&countrycodes=in`, {
            headers: { "Accept-Language": "en", "User-Agent": "SideQuestTravel/1.0" }
          });
          const d = await res.json();
          if (d[0]) results.push({ name: stop, lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) });
        } catch (e) { /* skip failed geocodes */ }
      }
      setCoords(results);
      setStatus(results.length >= 2 ? "ready" : "error");
    };
    geocode();
  }, [routeStops, departure]);

  useEffect(() => {
    if (status !== "ready" || !coords.length || !mapRef.current) return;

    const tryInit = () => {
      if (!window.L) { setTimeout(tryInit, 300); return; }
      const L = window.L;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }

      const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: false, attributionControl: true });
      mapInst.current = map;

      // CartoDB dark matter tiles — no API key needed
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }).addTo(map);

      const latlngs = coords.map(c => [c.lat, c.lon]);

      // Route line
      L.polyline(latlngs, { color: C.amberLight, weight: 2.5, dashArray: "8 5", opacity: 0.85 }).addTo(map);

      // Markers
      coords.forEach((c, i) => {
        const isFirst = i === 0;
        const isLast = i === coords.length - 1;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${isFirst||isLast?26:20}px;height:${isFirst||isLast?26:20}px;border-radius:50%;background:${isFirst||isLast?C.red:"rgba(140,26,26,.7)"};border:2.5px solid ${C.amberLight};display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:${isFirst||isLast?"9px":"8px"};color:${C.cream};font-weight:500;">${i+1}</div>`,
          iconSize: [isFirst||isLast?26:20, isFirst||isLast?26:20],
          iconAnchor: [isFirst||isLast?13:10, isFirst||isLast?13:10],
        });
        L.marker([c.lat, c.lon], { icon }).addTo(map).bindPopup(c.name);
      });

      map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28] });
    };
    tryInit();
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; } };
  }, [status, coords]);

  if (status === "error") return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <Lbl>Route Map</Lbl>
      <div style={{ position:"relative", height:300, borderRadius:10, overflow:"hidden", border:"1px solid rgba(140,26,26,.35)" }}>
        {status === "loading" && (
          <div style={{ position:"absolute", inset:0, background:"#120608", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, zIndex:1 }}>
            <div style={{ width:28, height:28, border:"2px solid rgba(140,26,26,.2)", borderTop:`2px solid ${C.amber}`, borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.56rem", color:C.amber, letterSpacing:"0.14em", opacity:.7 }}>mapping your route…</div>
          </div>
        )}
        <div ref={mapRef} style={{ height:"100%", width:"100%", opacity: status === "ready" ? 1 : 0, transition:"opacity .4s" }}/>
      </div>
    </div>
  );
}

// ── TRIP HERO ──────────────────────────────────────────────────────────────────
function TripHero({ trip }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ background:C.red, borderRadius:"12px 12px 0 0", padding:"32px 28px 28px" }}>
        <div style={{ position:"absolute", top:0, right:0, width:180, height:180, background:"radial-gradient(circle,rgba(255,255,255,.04),transparent)", pointerEvents:"none" }}/>
        {trip.travelStyle && <Badge bg="rgba(255,255,255,.14)" color={C.cream} style={{ marginBottom:14, display:"inline-block" }}>{trip.travelStyle}</Badge>}
        <h1 style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"clamp(1.45rem,3.5vw,2.1rem)", color:"#fff", lineHeight:1.22, marginBottom:12, letterSpacing:"0.02em" }}>{trip.tripTitle}</h1>
        <p style={{ fontFamily:"'Cinzel',serif", fontWeight:400, fontSize:"0.95rem", color:"rgba(255,255,255,.72)", lineHeight:1.65, textAlign:"justify" }}>{trip.tagline}</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", background:C.redDark, border:"1px solid rgba(140,26,26,.4)", borderTop:"none" }}>
        <div style={{ padding:"22px 20px", borderRight:"1px solid rgba(140,26,26,.35)" }}>
          <Lbl>Route</Lbl>
          {(trip.overview?.routeStops||[]).map((stop,i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.92rem", color:C.cream, lineHeight:1.3 }}>{stop}</span>
              {i < (trip.overview?.routeStops?.length||0)-1 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.65rem", color:"rgba(140,26,26,.7)", margin:"3px 0 4px", lineHeight:1 }}>↓</span>}
            </div>
          ))}
        </div>
        <div style={{ padding:"22px 20px", borderRight:"1px solid rgba(140,26,26,.35)" }}>
          {[["Duration",trip.overview?.duration],["Transport",trip.overview?.transport]].map(([l,v]) => v && (
            <div key={l} style={{ marginBottom:16 }}>
              <Lbl>{l}</Lbl>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.92rem", color:C.cream }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding:"22px 20px" }}>
          <Lbl>Budget</Lbl>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.92rem", color:C.cream, marginBottom:16 }}>{trip.overview?.totalBudget}</div>
          {trip.overview?.season && <>
            <Lbl>Season</Lbl>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", color:C.cream2, lineHeight:1.5, marginBottom:14 }}>{trip.overview.season}</div>
          </>}
          {trip.moodTags?.length > 0 && (
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {trip.moodTags.map((t,i) => <Badge key={i} bg="rgba(140,26,26,.25)" color={C.cream2} style={{ border:"1px solid rgba(140,26,26,.5)" }}>{t}</Badge>)}
            </div>
          )}
        </div>
      </div>

      {trip.tripArc?.length > 0 && (
        <div style={{ background:"rgba(26,4,4,.7)", border:"1px solid rgba(140,26,26,.35)", borderTop:"none", padding:"20px 24px" }}>
          <Lbl>Trip Arc</Lbl>
          <div style={{ display:"flex", alignItems:"flex-start", overflowX:"auto", paddingBottom:2 }}>
            {trip.tripArc.map((phase,i) => (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", flexShrink:0 }}>
                <div style={{ textAlign:"center", width:72 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:i===0||i===trip.tripArc.length-1?C.red:"rgba(140,26,26,.35)", border:`2px solid ${C.red}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 6px", color:C.cream, fontFamily:"'DM Mono',monospace", fontSize:"0.58rem" }}>{i+1}</div>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.48rem", letterSpacing:"0.07em", color:i===0||i===trip.tripArc.length-1?C.amberLight:"rgba(240,228,196,.42)", textTransform:"uppercase", lineHeight:1.3, wordBreak:"break-word" }}>{phase}</div>
                </div>
                {i < trip.tripArc.length-1 && <div style={{ width:20, height:1, background:"rgba(140,26,26,.5)", marginTop:13, flexShrink:0 }}/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {trip.tripPhilosophy && (
        <div style={{ background:C.redDark, border:"1px solid rgba(140,26,26,.35)", borderTop:"none", padding:"20px 24px" }}>
          <Lbl>Trip Philosophy</Lbl>
          <p style={{ fontFamily:"'Cinzel',serif", fontWeight:400, fontSize:"0.95rem", color:C.cream2, lineHeight:1.8, textAlign:"justify" }}>{trip.tripPhilosophy}</p>
        </div>
      )}

      {trip.coreMemories?.length > 0 && (
        <div style={{ background:"rgba(26,4,4,.5)", border:"1px solid rgba(140,26,26,.3)", borderTop:"none", borderRadius:"0 0 12px 12px", padding:"20px 24px" }}>
          <Lbl>Core Memories This Trip Will Create</Lbl>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {trip.coreMemories.map((m,i) => (
              <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ fontFamily:"'Cinzel',serif", fontSize:"1.2rem", color:C.red, lineHeight:1, flexShrink:0, marginTop:2, opacity:.55 }}>"</div>
                <p style={{ fontFamily:"'Cinzel',serif", fontWeight:400, fontSize:"0.93rem", color:C.cream2, lineHeight:1.65, margin:0, textAlign:"justify" }}>{m}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TIMELINE ───────────────────────────────────────────────────────────────────
const TYPE_DOT = { highlight:C.red, travel:C.amber, food:C.sageLight, sunset:"#FFB200", stay:C.blueLight, tip:C.sage };

function Timeline({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ position:"relative", paddingLeft:28 }}>
      <div style={{ position:"absolute", left:7, top:8, bottom:8, width:1, background:"rgba(140,26,26,.3)" }}/>
      {items.map((item,i) => (
        <div key={i} style={{ position:"relative", marginBottom: i < items.length-1 ? 22 : 0 }}>
          <div style={{ position:"absolute", left:-25, top:4, width:10, height:10, borderRadius:"50%", background:TYPE_DOT[item.type]||C.red, border:"2px solid rgba(26,4,4,.6)" }}/>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.58rem", letterSpacing:"0.1em", color:C.amber, marginBottom:3 }}>{item.time}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.94rem", color:item.type==="sunset"?"#FFB200":C.cream }}>{item.title}</span>
            {item.isMustDo && <Badge bg={C.red} color={C.cream}>Must Do</Badge>}
            {item.type==="sunset" && <Badge bg="#FFB200" color={C.ink}>Sunset</Badge>}
          </div>
          {item.description && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.86rem", color:"rgba(240,228,196,.62)", lineHeight:1.75, margin:0, textAlign:"justify" }}>{item.description}</p>}
        </div>
      ))}
    </div>
  );
}

// ── DAY CARD ───────────────────────────────────────────────────────────────────
function DayCard({ day, defaultOpen=false, printMode=false }) {
  const [open, setOpen] = useState(defaultOpen || printMode);
  useEffect(() => { if (printMode) setOpen(true); }, [printMode]);

  return (
    <div className="print-day" style={{ background:C.redDark, border:"1px solid rgba(140,26,26,.38)", borderRadius:12, marginBottom:14, overflow:"hidden" }}>
      <div className="sqd" onClick={() => !printMode && setOpen(o => !o)}
        style={{ padding:"18px 22px", cursor:printMode?"default":"pointer", display:"flex", alignItems:"flex-start", gap:14, transition:"background .15s", borderBottom:open?"1px solid rgba(140,26,26,.3)":"none" }}>
        <div style={{ flexShrink:0, width:38, height:38, background:C.red, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontFamily:"'Anton',sans-serif", fontSize:"0.95rem", color:C.cream, letterSpacing:"0.04em" }}>{day.dayNumber}</span>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:"0.95rem", color:C.cream, marginBottom:3, lineHeight:1.3 }}>{day.title}</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", color:"rgba(240,228,196,.52)" }}>{day.emotionalSubtitle}</div>
        </div>
        {!printMode && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.62rem", color:"rgba(240,228,196,.28)", flexShrink:0, marginTop:3 }}>{open?"↑":"↓"}</div>}
      </div>

      {open && (
        <div style={{ padding:"22px" }}>
          {day.timeline?.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <Lbl>Day Schedule</Lbl>
              <Timeline items={day.timeline}/>
            </div>
          )}

          {day.stay && (
            <div style={{ marginBottom:22 }}>
              <Lbl>Where to Stay</Lbl>
              <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", borderRadius:8, padding:"15px 17px" }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.93rem", color:C.cream, marginBottom:8 }}>{day.stay.locality}</div>
                {day.stay.whyHere && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.86rem", color:C.cream2, lineHeight:1.75, marginBottom:10, textAlign:"justify" }}>{day.stay.whyHere}</p>}
                <WhyBlock label="Why not the tourist strip" text={day.stay.whyNotElsewhere}/>
              </div>
            </div>
          )}

          {(day.insiderTips?.length || day.crowdHacks?.length || day.warnings?.length) ? (
            <div style={{ marginBottom:22 }}>
              <Lbl>Insider Intelligence</Lbl>
              {day.insiderTips?.map((t,i) => <TIP key={i} t={t}/>)}
              {day.crowdHacks?.map((t,i) => <HACK key={i} t={t}/>)}
              {day.warnings?.map((t,i) => <WARN key={i} t={t}/>)}
            </div>
          ) : null}

          {day.budgetEstimate && (
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.68rem", color:C.amberLight, marginTop:4 }}>
              <span style={{ opacity:.5, marginRight:6 }}>Day budget</span>{day.budgetEstimate}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── OUTRO ──────────────────────────────────────────────────────────────────────
function Outro({ budget, different, packing }) {
  return (
    <div style={{ marginTop:40 }}>
      {budget && (
        <div style={{ background:C.redDark, border:"1px solid rgba(140,26,26,.38)", borderRadius:12, padding:"26px", marginBottom:16 }}>
          <Lbl>Budget Breakdown — Per Person</Lbl>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", minWidth:320, borderCollapse:"collapse", fontFamily:"'DM Mono',monospace", fontSize:"0.8rem" }}>
              <thead><tr>{["Category","Amount","Notes"].map((h,i) => <th key={i} style={{ background:C.red, color:C.cream, padding:"10px 13px", textAlign:"left", fontSize:"0.55rem", letterSpacing:"0.14em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
              <tbody>
                {Object.entries(budget).filter(([k]) => k!=="total").map(([key,val],i) => (
                  <tr key={i}>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid rgba(140,26,26,.2)", color:C.cream2, textTransform:"capitalize" }}>{key}</td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid rgba(140,26,26,.2)", color:C.amberLight, whiteSpace:"nowrap" }}>{val?.amount}</td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid rgba(140,26,26,.2)", color:"rgba(240,228,196,.42)", fontSize:"0.74rem" }}>{val?.note}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ padding:"11px 13px", borderTop:`2px solid ${C.red}`, color:C.cream, fontWeight:700, fontSize:"0.88rem" }}>Total</td>
                  <td style={{ padding:"11px 13px", borderTop:`2px solid ${C.red}`, color:C.amberLight, fontWeight:700, fontSize:"0.88rem" }}>{budget.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {different?.length > 0 && (
        <div style={{ background:C.red, borderRadius:12, padding:"26px", marginBottom:16 }}>
          <Lbl color="rgba(250,243,224,.7)">What Makes This Trip Different</Lbl>
          {different.map((d,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"9px 0", borderBottom:i<different.length-1?"1px solid rgba(250,243,224,.12)":"none" }}>
              <span style={{ color:C.cream, fontFamily:"'DM Mono',monospace", fontSize:"0.62rem", flexShrink:0, opacity:.4, marginTop:3 }}>→</span>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.88rem", color:"rgba(250,243,224,.82)", lineHeight:1.7, margin:0, textAlign:"justify" }}>{d}</p>
            </div>
          ))}
        </div>
      )}
      {packing?.length > 0 && (
        <div style={{ background:C.redDark, border:"1px solid rgba(140,26,26,.38)", borderRadius:12, padding:"24px 26px" }}>
          <Lbl>Pack for This Specific Trip</Lbl>
          {packing.map((p,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
              <span style={{ color:C.red, fontFamily:"'DM Mono',monospace", fontSize:"0.6rem", flexShrink:0, marginTop:3 }}>◆</span>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.85rem", color:C.cream2, lineHeight:1.7, margin:0, textAlign:"justify" }}>{p}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── LOADING ────────────────────────────────────────────────────────────────────
function TypewriterFact({ text }) {
  const [shown, setShown] = useState("");
  const [ci, setCi] = useState(0);
  useEffect(() => { setShown(""); setCi(0); }, [text]);
  useEffect(() => {
    if (ci >= text.length) return;
    const t = setTimeout(() => { setShown(text.slice(0,ci+1)); setCi(i => i+1); }, 30);
    return () => clearTimeout(t);
  }, [ci, text]);
  return <span>{shown}<span style={{ display:"inline-block", width:2, height:"0.9em", background:C.red, marginLeft:3, verticalAlign:"middle", animation:"blink .7s step-end infinite" }}/></span>;
}

function Loading({ factIdx, msgIdx }) {
  return (
    <div style={{ minHeight:"100vh", background:C.cream, display:"flex", flexDirection:"column" }}>
      <Ticker/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid rgba(140,26,26,.15)", borderTop:`3px solid ${C.red}`, borderRadius:"50%", animation:"spin 1s linear infinite", marginBottom:28 }}/>
        <div key={msgIdx} style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.68rem", letterSpacing:"0.12em", color:C.redMid, marginBottom:44, animation:"fadeUp .4s ease", minHeight:18, opacity:.9 }}>{RMSGS[msgIdx]}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.48rem", letterSpacing:"0.24em", color:C.amber, textTransform:"uppercase", marginBottom:14, opacity:.7 }}>did you know</div>
        <div key={factIdx} style={{ fontFamily:"'Cinzel',serif", fontWeight:400, fontSize:"clamp(1rem,2.8vw,1.35rem)", color:C.ink, lineHeight:1.55, maxWidth:520, minHeight:64, animation:"fadeUp .5s ease" }}>
          <TypewriterFact text={FACTS[factIdx]}/>
        </div>
      </div>
      <div style={{ background:C.ink, padding:"16px 32px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Anton',sans-serif", fontSize:"1.7rem", color:"#C84040", letterSpacing:"0.06em" }}>SIDE QUEST</div>
      </div>
    </div>
  );
}

// ── FORM ───────────────────────────────────────────────────────────────────────
function Form({ form, onChange, onSubmit, err }) {
  const inp = { width:"100%", background:"#fff", border:`2px solid ${C.cream2}`, borderRadius:8, color:C.ink, fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:"0.95rem", padding:"13px 16px", transition:"border-color .2s, box-shadow .2s" };
  const lbl = { display:"block", fontFamily:"'DM Mono',monospace", fontSize:"0.54rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.red, marginBottom:8, opacity:.84 };
  const s = (k,v) => onChange(k,v);
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:C.cream }}>
      <Ticker/>
      <div style={{ background:C.cream, borderBottom:`3px solid ${C.red}`, padding:"20px 32px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Anton',sans-serif", fontSize:"clamp(2.4rem,10vw,4rem)", color:C.red, letterSpacing:"0.05em", lineHeight:1 }}>SIDE QUEST</div>
      </div>
      <div style={{ background:C.red, padding:"12px 32px", textAlign:"center" }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.58rem", letterSpacing:"0.22em", color:"rgba(250,243,224,.7)", textTransform:"uppercase" }}>a handcrafted travel blueprint — generated for you</div>
      </div>
      <div style={{ padding:"38px 24px 60px" }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>

          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Where are you headed?</label>
            <input className="sqi" style={inp} type="text" placeholder="Coorg, Chikmagalur  /  Hampi  /  Spiti Valley" value={form.destinations} onChange={e => s("destinations",e.target.value)}/>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Leaving from</label>
            <input className="sqi" style={inp} type="text" placeholder="Bengaluru, Mumbai, Delhi..." value={form.departure} onChange={e => s("departure",e.target.value)}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            <div>
              <label style={lbl}>Travel from</label>
              <input className="sqi" style={inp} type="date" value={form.dateFrom} onChange={e => s("dateFrom",e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>Travel to</label>
              <input className="sqi" style={inp} type="date" value={form.dateTo} onChange={e => s("dateTo",e.target.value)}/>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Number of people</label>
            <input className="sqi" style={inp} type="number" placeholder="2" value={form.people} onChange={e => s("people",e.target.value)}/>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            <div>
              <label style={lbl}>Travel by</label>
              <select className="sqi sqs" style={{ ...inp, cursor:"pointer", appearance:"none" }} value={form.travelMode} onChange={e => s("travelMode",e.target.value)}>
                <option value="flight">Flight</option>
                <option value="train">Train</option>
                <option value="car road trip">Car</option>
                <option value="motorcycle road trip">Motorcycle</option>
                <option value="flight one way, train return">Flight + Train</option>
                <option value="flight + local road">Flight + Road</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Budget per person (₹)</label>
              <input className="sqi" style={inp} type="text" placeholder="25,000" value={form.budget} onChange={e => s("budget",e.target.value)}/>
            </div>
          </div>

          <div style={{ marginBottom:28 }}>
            <label style={lbl}>Anything specific? (optional)</label>
            <textarea className="sqi" style={{ ...inp, minHeight:88, lineHeight:1.65 }} placeholder="e.g. avoid crowded beaches, travelling with a toddler, vegetarian only, want to see the Milky Way, motorcycle-friendly roads…" value={form.preferences} onChange={e => s("preferences",e.target.value)}/>
          </div>

          {err && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.67rem", color:C.red, marginBottom:14, letterSpacing:"0.04em" }}>{err}</div>}
          <button className="sqb" onClick={onSubmit} style={{ width:"100%", padding:"18px", background:C.red, border:"none", color:C.cream, fontFamily:"'Anton',sans-serif", fontSize:"1.3rem", letterSpacing:"0.1em", cursor:"pointer", borderRadius:6, transition:"all .2s", boxShadow:"0 4px 16px rgba(140,26,26,.25)" }}>BUILD MY BLUEPRINT</button>
          <div style={{ textAlign:"center", marginTop:14, fontFamily:"'DM Mono',monospace", fontSize:"0.53rem", color:"#B09060", letterSpacing:"0.1em" }}>searches forums · avoids tourist traps · finds the real thing</div>
        </div>
      </div>
      <div style={{ background:C.ink, padding:"18px 32px", textAlign:"center" }}>
        <div style={{ fontFamily:"'Anton',sans-serif", fontSize:"clamp(1.8rem,7vw,2.8rem)", color:"#C84040", letterSpacing:"0.06em" }}>SIDE QUEST</div>
      </div>
    </div>
  );
}

// ── RESULT ─────────────────────────────────────────────────────────────────────
function Result({ trip, departure, onReset }) {
  const [printMode, setPrintMode] = useState(false);
  const handleExport = () => {
    setPrintMode(true);
    setTimeout(() => { window.print(); setTimeout(() => setPrintMode(false), 1000); }, 400);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.redDeep }}>
      <div className="np"><Ticker/></div>
      <div style={{ padding:"26px 20px 80px" }}>
        <div style={{ maxWidth:820, margin:"0 auto" }}>
          <div className="np" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, paddingBottom:14, borderBottom:"1px solid rgba(140,26,26,.32)" }}>
            <div style={{ fontFamily:"'Anton',sans-serif", fontSize:"1.4rem", color:C.cream, letterSpacing:"0.05em" }}>SIDE QUEST</div>
            <div style={{ display:"flex", gap:9 }}>
              <button onClick={handleExport} style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.56rem", letterSpacing:"0.1em", background:C.red, border:"none", color:C.cream, padding:"8px 16px", borderRadius:20, cursor:"pointer" }}>EXPORT PDF ↗</button>
              <button className="sqk" onClick={onReset} style={{ background:"transparent", border:"1px solid rgba(140,26,26,.4)", color:"rgba(240,228,196,.38)", fontFamily:"'DM Mono',monospace", fontSize:"0.58rem", padding:"7px 15px", cursor:"pointer", borderRadius:20, letterSpacing:"0.08em", transition:"all .2s" }}>← New Trip</button>
            </div>
          </div>

          <TripHero trip={trip}/>

          {/* Route map — above day-by-day */}
          <RouteMap routeStops={trip.overview?.routeStops} departure={departure}/>

          <div style={{ display:"flex", alignItems:"center", gap:14, margin:"8px 0 22px" }}>
            <div style={{ flex:1, height:1, background:"rgba(140,26,26,.3)" }}/>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", letterSpacing:"0.2em", color:"rgba(140,26,26,.65)", textTransform:"uppercase" }}>Day by Day</div>
            <div style={{ flex:1, height:1, background:"rgba(140,26,26,.3)" }}/>
          </div>

          {trip.days?.map((day,i) => <DayCard key={i} day={day} defaultOpen={i===0} printMode={printMode}/>)}

          <Outro budget={trip.budgetBreakdown} different={trip.whatMakesThisDifferent} packing={trip.packingNotes}/>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function SideQuest() {
  useGlobalStyles();
  const [form, setForm] = useState({ destinations:"", departure:"", dateFrom:"", dateTo:"", travelMode:"flight", people:"2", budget:"", preferences:"" });
  const [phase, setPhase] = useState("form");
  const [trip, setTrip] = useState(null);
  const [factIdx, setFactIdx] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (phase !== "loading") return;
    const f = setInterval(() => setFactIdx(i => (i+1)%FACTS.length), 7000);
    const m = setInterval(() => setMsgIdx(i => (i+1)%RMSGS.length), 4500);
    return () => { clearInterval(f); clearInterval(m); };
  }, [phase]);

  const onChange = (k,v) => setForm(f => ({...f,[k]:v}));

  const generate = async () => {
    if (!form.destinations || !form.departure || !form.budget) { setErr("fill in all fields before building your blueprint."); return; }
    setErr(""); setPhase("loading"); setFactIdx(0); setMsgIdx(0);
    try {
      const res = await fetch("/api/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          system:"You are Side Quest, a conscious travel planning service. Search forums, local blogs, and traveller discussions to build deeply authentic itineraries. Surface hidden gems, crowd hacks, and genuine local experiences. Use travel dates to make the itinerary season-aware. Output ONLY valid JSON — no markdown, no backticks, no preamble whatsoever.",
          messages:[{role:"user", content:buildPrompt(form)}],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message||"API error");
      const raw = (data.content||[]).filter(b => b.type==="text").map(b => b.text).join("");
      const jsonStr = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      const parsed = JSON.parse(jsonStr);
      setTrip(parsed); setPhase("result"); window.scrollTo(0,0);
    } catch(e) {
      const msg = e instanceof SyntaxError ? "Response wasn't valid JSON. Try again." : "Something went wrong — "+e.message;
      setErr(msg); setPhase("form");
    }
  };

  if (phase==="loading") return <Loading factIdx={factIdx} msgIdx={msgIdx}/>;
  if (phase==="result" && trip) return <Result trip={trip} departure={form.departure} onReset={() => { setPhase("form"); setTrip(null); window.scrollTo(0,0); }}/>;
  return <Form form={form} onChange={onChange} onSubmit={generate} err={err}/>;
}

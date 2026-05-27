import { useState, useEffect, useRef } from "react";

/** Landing + blueprint — light “eggshell card” system from brand mockup */
const T = {
  ink: "#1a1917",
  inkSoft: "#3d3935",
  muted: "#6b6560",
  line: "rgba(26,25,23,0.1)",
  lineStrong: "rgba(26,25,23,0.16)",
  paper: "#faf8f5",
  shell: "#f3efe8",
  white: "#ffffff",
  accent: "#c95420",
  accentHover: "#a84315",
  accentSoft: "rgba(201,84,32,0.12)",
  sage: "#3d5a40",
  sageLight: "#5a7a5e",
  sageBg: "rgba(61,90,64,0.1)",
  teal: "#2a8a82",
  tealBg: "rgba(42,138,130,0.12)",
  terra: "#b84a32",
  terraLight: "#c96a4a",
  terraBg: "rgba(184,74,50,0.1)",
};

const R = {
  bg: "#080705",
  panel: "#15110d",
  panel2: "#201912",
  panel3: "#2a2118",
  text: "#f8efd9",
  textSoft: "#decfb3",
  muted: "rgba(248,239,217,0.62)",
  line: "rgba(248,239,217,0.14)",
  lineStrong: "rgba(248,239,217,0.22)",
  accent: "#d7652d",
  accentSoft: "rgba(215,101,45,0.16)",
  sage: "#a7b88d",
  sageBg: "rgba(167,184,141,0.12)",
  teal: "#7bc7bd",
  tealBg: "rgba(123,199,189,0.12)",
  terra: "#df815d",
  terraBg: "rgba(223,129,93,0.13)",
};
const C = { ink: R.bg, redDeep: R.bg, cream: R.text, gold: R.accent, amber: R.accent };

const HERO_BG =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=75";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600;700&display=swap";

const F = {
  serif: "'Cormorant Garamond', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
  mono: "'DM Mono', ui-monospace, monospace",
};

function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById("sq-f")) return;
    const l = document.createElement("link"); l.id="sq-f"; l.rel="stylesheet"; l.href=FONTS; document.head.appendChild(l);
    const s = document.createElement("style"); s.id="sq-g";
    s.textContent = `
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { to{transform:rotate(360deg)} }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      .sq-input:focus { outline:none; border-color:${T.accent}!important; box-shadow:0 0 0 3px ${T.accentSoft}!important; }
      .sq-input::placeholder { color:rgba(26,25,23,0.35); }
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
      input[type=date]::-webkit-calendar-picker-indicator { opacity:0.55; cursor:pointer; }
      .sq-day-head:hover { background:var(--sq-day-hover, ${T.shell})!important; }
      @media print {
        .np { display:none!important; }
        .sq-refine { display:none!important; }
        * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
        html,body { background:${T.paper}!important; height:auto!important; min-height:0!important; margin:0!important; padding:0!important; }
        #sq-result { min-height:0!important; height:auto!important; padding-bottom:0!important; }
        .print-day { break-inside:avoid; page-break-inside:avoid; margin-bottom:12px!important; }
        .sq-outro { break-inside:avoid; }
        table { break-inside:avoid; }
        h1,h2,h3 { break-after:avoid; }
      }
    `;
    document.head.appendChild(s);
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
  "The Sundarbans is home to tigers that have learned to swim miles offshore",
  "Majuli in Assam is the world's largest river island, slowly disappearing into the Brahmaputra",
  "The Rann of Kutch becomes the world's largest salt flat every summer — over 7,500 sq km of white",
  "Japan has more Michelin-starred restaurants than any other country in the world",
  "Iceland has no mosquitoes — the only country in Europe where they cannot survive",
  "Bhutan measures its economy in Gross National Happiness, not GDP",
  "The Dead Sea is so salty you cannot sink in it — your body simply floats",
  "Patagonia at the tip of South America is one of the least populated regions on Earth",
];

const RMSGS = [
  "Building the route-level blueprint…",
  "Splitting the trip into detailed day sections…",
  "Cross-referencing crowd-free timings…",
  "Comparing neighbourhoods by vibe, not star rating…",
  "Threading recovery time through the route…",
  "Filtering out the tourist menu…",
  "Composing food and stay recommendations…",
  "Assembling your full itinerary…",
];

function CompassStar({ size = 28, color = T.accent }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden style={{ display: "block" }}>
      <path
        d="M24 2l2.8 9.2L36 14l-9.2 2.8L24 26l-2.8-9.2L12 14l9.2-2.8L24 2zm0 22l2.8 9.2L36 46l-9.2-2.8L24 34l-2.8 9.2L12 46l9.2-2.8L24 24z"
        fill={color}
        opacity="0.95"
      />
    </svg>
  );
}

function Wordmark({ size = "full", light = false }) {
  const col = light ? R.text : T.ink;
  const sub = light ? R.muted : T.muted;
  if (size === "small") {
    return (
      <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "1.15rem", letterSpacing: "0.28em", color: col, textTransform: "uppercase" }}>
        Sidequest
      </div>
    );
  }
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
        <CompassStar size={26} color={T.accent} />
      </div>
      <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "clamp(2rem, 5vw, 2.85rem)", letterSpacing: "0.22em", color: col, textTransform: "uppercase", lineHeight: 1.05 }}>
        Sidequest
      </div>
      <p style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: "1rem", color: sub, marginTop: 12, letterSpacing: "0.02em" }}>
        Find the real thing. No tourist traps.
      </p>
    </div>
  );
}

function Lbl({ children, color = "var(--sq-label, #6b6560)" }) {
  return (
    <div style={{ fontFamily: F.mono, fontSize: "0.52rem", letterSpacing: "0.2em", color, textTransform: "uppercase", marginBottom: 10, fontWeight: 500, opacity: 0.95 }}>
      {children}
    </div>
  );
}

function Badge({ children, bg = T.accent, color = T.white, style = {} }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        fontFamily: F.mono,
        fontSize: "0.5rem",
        fontWeight: 600,
        padding: "4px 11px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        borderRadius: 999,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function WhyBlock({ label = "Why we chose this", text }) {
  if (!text) return null;
  return (
    <div style={{ background: "var(--sq-accent-soft, rgba(201,84,32,0.12))", borderLeft: `3px solid var(--sq-accent, ${T.accent})`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginTop: 10 }}>
      <div style={{ fontFamily: F.mono, fontSize: "0.5rem", letterSpacing: "0.18em", color: "var(--sq-accent, #c95420)", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <p style={{ fontFamily: F.sans, fontSize: "0.87rem", color: "var(--sq-text-soft, #3d3935)", lineHeight: 1.75, margin: 0 }}>{text}</p>
    </div>
  );
}

const TIP = ({ t }) => (
  <div style={{ display: "flex", gap: 10, padding: "9px 13px", background: "var(--sq-sage-bg, rgba(61,90,64,0.1))", borderLeft: `3px solid var(--sq-sage, ${T.sage})`, borderRadius: "0 8px 8px 0", marginBottom: 6 }}>
    <span style={{ color: "var(--sq-sage, #3d5a40)", fontSize: "0.7rem", flexShrink: 0 }}>→</span>
    <p style={{ fontFamily: F.sans, fontSize: "0.84rem", color: "var(--sq-sage, #3d5a40)", lineHeight: 1.7, margin: 0 }}>{t}</p>
  </div>
);
const HACK = ({ t }) => (
  <div style={{ display: "flex", gap: 10, padding: "9px 13px", background: "var(--sq-teal-bg, rgba(42,138,130,0.12))", borderLeft: `3px solid var(--sq-teal, ${T.teal})`, borderRadius: "0 8px 8px 0", marginBottom: 6 }}>
    <span style={{ color: "var(--sq-teal, #2a8a82)", fontSize: "0.7rem", flexShrink: 0 }}>◎</span>
    <p style={{ fontFamily: F.sans, fontSize: "0.84rem", color: "var(--sq-teal, #2a8a82)", lineHeight: 1.7, margin: 0 }}>{t}</p>
  </div>
);
const WARN = ({ t }) => (
  <div style={{ display: "flex", gap: 10, padding: "9px 13px", background: "var(--sq-terra-bg, rgba(184,74,50,0.1))", borderLeft: `3px solid var(--sq-terra, ${T.terra})`, borderRadius: "0 8px 8px 0", marginBottom: 6 }}>
    <span style={{ color: "var(--sq-terra, #b84a32)", fontSize: "0.7rem", flexShrink: 0 }}>!</span>
    <p style={{ fontFamily: F.sans, fontSize: "0.84rem", color: "var(--sq-terra, #b84a32)", lineHeight: 1.7, margin: 0 }}>{t}</p>
  </div>
);

// ── ROUTE MAP ──────────────────────────────────────────────────────────────────
function RouteMap({ routeStops, departure }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const [status, setStatus] = useState("loading");
  const [coords, setCoords] = useState([]);

  useEffect(() => {
    if (!routeStops?.length) return;
    const all = departure ? [departure, ...routeStops] : routeStops;
    const unique = [...new Set(all)];
    const go = async () => {
      const results = [];
      for (const stop of unique) {
        try {
          await new Promise(r => setTimeout(r, 350));
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stop)}&format=json&limit=1`, {
            headers: { "Accept-Language": "en", "User-Agent": "SideQuestTravel/1.0" }
          });
          const d = await res.json();
          if (d[0]) results.push({ name: stop, lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon) });
        } catch {}
      }
      setCoords(results);
      setStatus(results.length >= 2 ? "ready" : "error");
    };
    go();
  }, [routeStops, departure]);

  useEffect(() => {
    if (status !== "ready" || !coords.length || !mapRef.current) return;
    const tryInit = () => {
      if (!window.L) { setTimeout(tryInit, 300); return; }
      const L = window.L;
      if (mapInst.current) { mapInst.current.remove(); mapInst.current = null; }
      const map = L.map(mapRef.current, { zoomControl:true, scrollWheelZoom:false });
      mapInst.current = map;
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:'© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>', maxZoom:18,
      }).addTo(map);
      const latlngs = coords.map(c => [c.lat, c.lon]);
      L.polyline(latlngs, { color:T.accent, weight:2.5, dashArray:"8 5", opacity:.88 }).addTo(map);
      coords.forEach((c, i) => {
        const big = i===0||i===coords.length-1;
        const icon = L.divIcon({
          className:"",
          html:`<div style="width:${big?26:20}px;height:${big?26:20}px;border-radius:50%;background:${big?T.accent:"rgba(201,84,32,.75)"};border:2.5px solid ${T.white};box-shadow:0 1px 4px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;font-family:${F.mono};font-size:${big?"9px":"8px"};color:${T.white};font-weight:600;">${i+1}</div>`,
          iconSize:[big?26:20,big?26:20], iconAnchor:[big?13:10,big?13:10],
        });
        L.marker([c.lat,c.lon],{icon}).addTo(map).bindPopup(c.name);
      });
      map.fitBounds(L.latLngBounds(latlngs), { padding:[28,28] });
    };
    tryInit();
    return () => { if (mapInst.current) { mapInst.current.remove(); mapInst.current=null; } };
  }, [status, coords]);

  if (status==="error") return null;
  return (
    <div style={{ marginBottom: 32 }}>
      <Lbl>Route Map</Lbl>
      <div style={{ position: "relative", height: 300, borderRadius: 16, overflow: "hidden", border: `1px solid ${T.line}`, boxShadow: "0 8px 32px rgba(26,25,23,0.06)" }}>
        {status==="loading" && (
          <div style={{ position:"absolute", inset:0, background:T.paper, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, zIndex:1 }}>
            <div style={{ width:28, height:28, border:`2px solid ${T.line}`, borderTop:`2px solid ${T.accent}`, borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
            <div style={{ fontFamily:F.mono, fontSize:"0.56rem", color:T.muted, letterSpacing:"0.14em" }}>mapping your route…</div>
          </div>
        )}
        <div ref={mapRef} style={{ height:"100%", width:"100%", opacity:status==="ready"?1:0, transition:"opacity .4s" }}/>
      </div>
    </div>
  );
}

// ── TRIP HERO ──────────────────────────────────────────────────────────────────
function TripHero({ trip }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${R.panel2}, ${R.panel})`,
          border: `1px solid ${R.line}`,
          borderLeft: `4px solid ${R.accent}`,
          borderRadius: 16,
          padding: "32px 28px 28px",
          boxShadow: "0 18px 60px rgba(0,0,0,0.24)",
        }}
      >
        {trip.travelStyle && (
          <Badge bg={R.accentSoft} color={R.accent} style={{ marginBottom: 14, border: `1px solid rgba(215,101,45,0.4)` }}>
            {trip.travelStyle}
          </Badge>
        )}
        <h1 style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "clamp(1.45rem,3.5vw,2.1rem)", color: R.text, lineHeight: 1.22, marginBottom: 12, letterSpacing: "0.04em" }}>{trip.tripTitle}</h1>
        <p style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 400, fontSize: "1.05rem", color: R.muted, lineHeight: 1.65 }}>{trip.tagline}</p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          background: R.panel2,
          border: `1px solid ${R.line}`,
          borderTop: `3px solid ${R.accent}`,
          borderRadius: "0 0 16px 16px",
          overflow: "hidden",
          boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
        }}
      >
        <div style={{ padding: "22px 20px", borderRight: `1px solid ${R.line}` }}>
          <Lbl>Route</Lbl>
          {(trip.overview?.routeStops || []).map((stop, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.92rem", color: R.text, lineHeight: 1.3 }}>{stop}</span>
              {i < (trip.overview?.routeStops?.length || 0) - 1 && (
                <span style={{ fontFamily: F.mono, fontSize: "0.65rem", color: R.accent, margin: "3px 0 4px", lineHeight: 1 }}>↓</span>
              )}
            </div>
          ))}
        </div>
        <div style={{ padding: "22px 20px", borderRight: `1px solid ${R.line}` }}>
          {[["Duration", trip.overview?.duration], ["Transport", trip.overview?.transport]].map(([l, v]) =>
            v ? (
              <div key={l} style={{ marginBottom: 16 }}>
                <Lbl>{l}</Lbl>
                <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.92rem", color: R.text }}>{v}</div>
              </div>
            ) : null
          )}
          {trip.overview?.transportNote && (
            <div style={{ background: R.terraBg, borderLeft: `3px solid ${R.terra}`, padding: "10px 14px", borderRadius: "0 8px 8px 0", marginBottom: 12 }}>
              <p style={{ fontFamily: F.mono, fontSize: "0.65rem", color: R.terra, lineHeight: 1.6, margin: 0 }}>{trip.overview.transportNote}</p>
            </div>
          )}
        </div>
        <div style={{ padding: "22px 20px" }}>
          <Lbl>Budget</Lbl>
          <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.92rem", color: R.text, marginBottom: 16 }}>{trip.overview?.totalBudget}</div>
          {trip.overview?.season && (
            <>
              <Lbl>Season</Lbl>
              <div style={{ fontFamily: F.sans, fontSize: "0.84rem", color: R.textSoft, lineHeight: 1.5, marginBottom: 14 }}>{trip.overview.season}</div>
            </>
          )}
          {trip.moodTags?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {trip.moodTags.map((t, i) => (
                <Badge key={i} bg={R.accentSoft} color={R.accent} style={{ border: `1px solid rgba(215,101,45,0.4)` }}>
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {trip.philosophy && (
        <div style={{ background: R.panel3, border: `1px solid ${R.line}`, borderTop: "none", padding: "22px 26px" }}>
          <Lbl>Trip Philosophy</Lbl>
          <p style={{ fontFamily: F.serif, fontWeight: 400, fontSize: "1rem", color: R.textSoft, lineHeight: 1.85, margin: 0 }}>{trip.philosophy}</p>
        </div>
      )}
      {trip.memories?.length > 0 && (
        <div style={{ background: R.panel2, border: `1px solid ${R.line}`, borderTop: "none", borderRadius: "0 0 16px 16px", padding: "22px 26px" }}>
          <Lbl>Core Memories This Trip Will Create</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trip.memories.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ fontFamily: F.serif, fontSize: "1.2rem", color: R.accent, lineHeight: 1, flexShrink: 0, marginTop: 2, opacity: 0.75 }}>"</div>
                <p style={{ fontFamily: F.serif, fontWeight: 400, fontSize: "0.95rem", color: R.textSoft, lineHeight: 1.65, margin: 0 }}>{m}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TIMELINE ───────────────────────────────────────────────────────────────────
const TYPE_DOT = { highlight: R.accent, travel: R.teal, food: R.sage, sunset: R.terra, stay: R.teal, tip: R.muted, recovery: "#b0bd9b" };

function Timeline({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ position: "relative", paddingLeft: 28 }}>
      <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1, background: R.lineStrong }} />
      {items.map((item, i) => (
        <div key={i} style={{ position: "relative", marginBottom: i < items.length - 1 ? 22 : 0 }}>
          <div style={{ position: "absolute", left: -25, top: 4, width: 10, height: 10, borderRadius: "50%", background: TYPE_DOT[item.type] || R.accent, border: `2px solid ${R.panel2}`, boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }} />
          <div style={{ fontFamily: F.mono, fontSize: "0.58rem", letterSpacing: "0.1em", color: R.muted, marginBottom: 3 }}>{item.time}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.94rem", color: item.type === "sunset" ? R.terra : R.text }}>{item.title}</span>
            {item.type === "recovery" && (
              <Badge bg="rgba(176,189,155,0.16)" color={R.sage} style={{ border: `1px solid ${R.sage}` }}>
                Recovery
              </Badge>
            )}
            {item.mustDo && (
              <Badge bg={R.terra} color={R.bg}>
                Must Do
              </Badge>
            )}
            {item.type === "sunset" && (
              <Badge bg={R.terraBg} color={R.terra} style={{ border: `1px solid rgba(223,129,93,0.45)` }}>
                Sunset
              </Badge>
            )}
          </div>
          {item.desc && <p style={{ fontFamily: F.sans, fontSize: "0.86rem", color: R.muted, lineHeight: 1.75, margin: 0 }}>{item.desc}</p>}
        </div>
      ))}
    </div>
  );
}

// ── DAY CARD ───────────────────────────────────────────────────────────────────
function DayCard({ day, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="print-day" style={{ background: R.panel2, border: `1px solid ${R.line}`, borderRadius: 16, marginBottom: 14, overflow: "hidden", boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
      <div
        className="sq-day-head"
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: "20px 22px 18px",
          cursor: "pointer",
          position: "relative",
          transition: "background .15s",
          borderBottom: open ? `1px solid ${R.line}` : "none",
          background: open ? R.panel3 : R.panel2,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "1.2rem", color: R.text, textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1.2 }}>{day.place || day.title}</div>
          <div style={{ fontFamily: F.mono, fontSize: "0.5rem", color: R.accent, letterSpacing: "0.2em", flexShrink: 0, marginLeft: 14, marginTop: 4 }}>DAY {day.dayNumber}</div>
        </div>
        {day.place && day.title && day.place !== day.title && (
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 400, fontSize: "0.88rem", color: R.terra, marginBottom: 5, opacity: 0.9 }}>{day.title}</div>
        )}
        <div style={{ fontFamily: F.sans, fontSize: "0.82rem", color: R.muted, lineHeight: 1.55 }}>{day.subtitle}</div>
        <div style={{ position: "absolute", right: 20, top: 22, fontFamily: F.mono, fontSize: "0.6rem", color: R.lineStrong }}>{open ? "↑" : "↓"}</div>
      </div>
      {open && (
        <div style={{ padding: "22px", background: R.panel2 }}>
          {day.timeline?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Lbl>Day Schedule</Lbl>
              <Timeline items={day.timeline} />
            </div>
          )}
          {day.food?.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <Lbl>Food & Drink</Lbl>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {day.food.map((f, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: R.accent, fontFamily: F.mono, fontSize: "0.65rem", flexShrink: 0, marginTop: 3 }}>◆</span>
                    <p style={{ fontFamily: F.sans, fontSize: "0.87rem", color: R.textSoft, lineHeight: 1.65, margin: 0 }}>{f}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {day.stay && (
            <div style={{ marginBottom: 22 }}>
              <Lbl>Where to Stay</Lbl>
              <div style={{ background: R.panel3, border: `1px solid ${R.line}`, borderRadius: 12, padding: "15px 17px" }}>
                <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "0.95rem", color: R.text, marginBottom: 8 }}>{day.stay.locality}</div>
                {day.stay.why && <p style={{ fontFamily: F.sans, fontSize: "0.86rem", color: R.textSoft, lineHeight: 1.75, marginBottom: 10 }}>{day.stay.why}</p>}
                <WhyBlock label="Why not the tourist strip" text={day.stay.notWhere} />
              </div>
            </div>
          )}
          {day.tips?.length || day.hacks?.length || day.warnings?.length ? (
            <div style={{ marginBottom: 22 }}>
              <Lbl>Insider Intelligence</Lbl>
              {day.tips?.map((t, i) => (
                <TIP key={i} t={t} />
              ))}
              {day.hacks?.map((t, i) => (
                <HACK key={i} t={t} />
              ))}
              {day.warnings?.map((t, i) => (
                <WARN key={i} t={t} />
              ))}
            </div>
          ) : null}
          {day.budget && (
            <div style={{ fontFamily: F.mono, fontSize: "0.68rem", color: R.terra, marginTop: 4 }}>
              <span style={{ opacity: 0.55, marginRight: 6 }}>Day budget</span>
              {day.budget}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── OUTRO ──────────────────────────────────────────────────────────────────────
function FoodMap({ foodMap }) {
  if (!foodMap?.length) return null;
  return (
    <div style={{ marginTop: 34, marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "0 0 18px" }}>
        <div style={{ flex: 1, height: 1, background: R.line }} />
        <div style={{ fontFamily: F.mono, fontSize: "0.48rem", letterSpacing: "0.28em", color: R.muted, textTransform: "uppercase" }}>Food Map</div>
        <div style={{ flex: 1, height: 1, background: R.line }} />
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        {foodMap.map((group, i) => (
          <div key={i} style={{ background: R.panel2, border: `1px solid ${R.line}`, borderRadius: 16, padding: "20px 22px", boxShadow: "0 10px 28px rgba(0,0,0,0.2)" }}>
            <div style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "1.15rem", color: R.text, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
              Where to Eat in {group.place || "This Route"}
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {(group.spots || []).map((spot, j) => {
                const title = typeof spot === "string" ? spot : spot.name;
                const detail = typeof spot === "string" ? "" : [spot.order, spot.bestFor, spot.why].filter(Boolean).join(" — ");
                return (
                  <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderTop: j === 0 ? "none" : `1px solid ${R.line}` }}>
                    <span style={{ color: R.accent, fontFamily: F.mono, fontSize: "0.65rem", flexShrink: 0, marginTop: 4 }}>◆</span>
                    <div>
                      <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.9rem", color: R.text }}>{title}</div>
                      {detail && <p style={{ fontFamily: F.sans, fontSize: "0.84rem", color: R.muted, lineHeight: 1.65, margin: "4px 0 0" }}>{detail}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Outro({ budget, different, packing }) {
  return (
    <div className="sq-outro" style={{ marginTop: 40 }}>
      {budget && (
        <div style={{ background: R.panel2, border: `1px solid ${R.line}`, borderRadius: 16, padding: 26, marginBottom: 16, boxShadow: "0 10px 28px rgba(0,0,0,0.2)" }}>
          <Lbl>Budget Breakdown — Per Person</Lbl>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.mono, fontSize: "0.8rem" }}>
            <thead>
              <tr>
                {["Category", "Amount", "Notes"].map((h, i) => (
                  <th key={i} style={{ background: R.accentSoft, color: R.accent, padding: "10px 13px", textAlign: "left", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap", fontWeight: 700 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(budget)
                .filter(([k]) => k !== "total")
                .map(([key, val], i) => (
                  <tr key={i}>
                    <td style={{ padding: "9px 13px", borderBottom: `1px solid ${R.line}`, color: R.textSoft, textTransform: "capitalize" }}>{key}</td>
                    <td style={{ padding: "9px 13px", borderBottom: `1px solid ${R.line}`, color: R.terra, whiteSpace: "nowrap" }}>{val?.amount}</td>
                    <td style={{ padding: "9px 13px", borderBottom: `1px solid ${R.line}`, color: R.muted, fontSize: "0.74rem" }}>{val?.note}</td>
                  </tr>
                ))}
              <tr>
                <td colSpan={2} style={{ padding: "11px 13px", borderTop: `2px solid ${R.accent}`, color: R.accent, fontWeight: 700, fontSize: "0.88rem" }}>
                  Total
                </td>
                <td style={{ padding: "11px 13px", borderTop: `2px solid ${R.accent}`, color: R.accent, fontWeight: 700, fontSize: "0.88rem" }}>{budget.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {different?.length > 0 && (
        <div style={{ background: R.accentSoft, border: `1px solid rgba(215,101,45,0.25)`, borderRadius: 16, padding: 26, marginBottom: 16 }}>
          <Lbl color={R.accent}>What Makes This Trip Different</Lbl>
          {different.map((d, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 0", borderBottom: i < different.length - 1 ? `1px solid rgba(215,101,45,0.18)` : "none" }}>
              <span style={{ color: R.accent, fontFamily: F.mono, fontSize: "0.62rem", flexShrink: 0, marginTop: 3 }}>→</span>
              <p style={{ fontFamily: F.sans, fontSize: "0.88rem", color: R.textSoft, lineHeight: 1.7, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      )}
      {packing?.length > 0 && (
        <div style={{ background: R.panel2, border: `1px solid ${R.line}`, borderRadius: 16, padding: "24px 26px", boxShadow: "0 10px 28px rgba(0,0,0,0.2)" }}>
          <Lbl>Pack for This Specific Trip</Lbl>
          {packing.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ color: R.accent, fontFamily: F.mono, fontSize: "0.6rem", flexShrink: 0, marginTop: 3 }}>◆</span>
              <p style={{ fontFamily: F.sans, fontSize: "0.85rem", color: R.textSoft, lineHeight: 1.7, margin: 0 }}>{p}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── REFINE PANEL ───────────────────────────────────────────────────────────────
function RefinePanel({ trip, form, onUpdate }) {
  const [req, setReq] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [lastChange, setLastChange] = useState("");

  const refine = async () => {
    if (!req.trim() || loading) return;
    setLoading(true); setErr(""); setLastChange("");
    try {
      const tripContext = `${form.people} people, ${form.travelMode}, ${form.budget}/person, ${form.dateFrom || ""} to ${form.dateTo || ""}${form.prioritizeWomensSafety ? ", women's safety prioritized" : ""}`;
      const res = await fetch("/api/refine", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ trip, request:req, tripContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onUpdate(data.trip);
      setLastChange(req);
      setReq("");
    } catch(e) {
      setErr("Refinement failed — " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="sq-refine" style={{ marginTop: 32, background: R.panel2, border: `1px solid ${R.line}`, borderRadius: 16, padding: "28px 26px", boxShadow: "0 10px 28px rgba(0,0,0,0.2)" }}>
      <Lbl>Refine Your Trip</Lbl>
      <p style={{ fontFamily: F.sans, fontSize: "0.84rem", color: R.muted, marginBottom: 18, lineHeight: 1.65 }}>
        Add nightlife · Make it more relaxed · Swap a day for hiking · Add photography spots · Avoid crowded places · Increase budget slightly
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          className="sq-input"
          value={req}
          onChange={(e) => setReq(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && refine()}
          placeholder="How would you like to change this trip?"
          style={{
            flex: 1,
            minWidth: 200,
            background: R.panel3,
            border: `1px solid ${R.line}`,
            borderRadius: 12,
            color: R.text,
            fontFamily: F.sans,
            fontSize: "0.9rem",
            padding: "12px 16px",
            transition: "border-color .2s",
          }}
        />
        <button
          onClick={refine}
          disabled={loading}
          style={{
            background: loading ? "rgba(215,101,45,0.45)" : R.accent,
            border: "none",
            color: R.bg,
            fontFamily: F.mono,
            fontSize: "0.6rem",
            letterSpacing: "0.12em",
            padding: "12px 22px",
            borderRadius: 12,
            cursor: loading ? "default" : "pointer",
            whiteSpace: "nowrap",
            transition: "all .2s",
            fontWeight: 700,
          }}
        >
          {loading ? "REFINING…" : "REFINE →"}
        </button>
      </div>
      {err && <div style={{ fontFamily: F.mono, fontSize: "0.62rem", color: R.terra, marginTop: 10 }}>{err}</div>}
      {lastChange && !loading && (
        <div style={{ fontFamily: F.mono, fontSize: "0.6rem", color: R.sage, marginTop: 10, opacity: 0.9 }}>
          ✓ Applied: "{lastChange}"
        </div>
      )}
    </div>
  );
}

function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.6" aria-hidden>
      <path d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10z" />
      <circle cx="12" cy="11" r="2.2" fill={T.muted} stroke="none" />
    </svg>
  );
}
function IconCalendar() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.6" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.6" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM23 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}
function IconTag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.6" aria-hidden>
      <path d="M12 2H2v10l10 10 10-10L12 2z" />
      <circle cx="7" cy="7" r="1.2" fill={T.muted} stroke="none" />
    </svg>
  );
}

// ── LOADING ────────────────────────────────────────────────────────────────────
function TypewriterFact({ text }) {
  const [shown, setShown] = useState("");
  const [ci, setCi] = useState(0);
  useEffect(() => {
    setShown("");
    setCi(0);
  }, [text]);
  useEffect(() => {
    if (ci >= text.length) return;
    const t = setTimeout(() => {
      setShown(text.slice(0, ci + 1));
      setCi((i) => i + 1);
    }, 30);
    return () => clearTimeout(t);
  }, [ci, text]);
  return (
    <span>
      {shown}
      <span style={{ display: "inline-block", width: 2, height: "0.9em", background: T.accent, marginLeft: 3, verticalAlign: "middle", animation: "blink .7s step-end infinite" }} />
    </span>
  );
}

function Loading({ factIdx, msgIdx }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `linear-gradient(180deg, rgba(26,25,23,0.55) 0%, rgba(26,25,23,0.72) 100%), url(${HERO_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        fontFamily: F.sans,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: T.paper,
          borderRadius: 24,
          padding: "40px 36px 36px",
          textAlign: "center",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          border: `1px solid ${T.line}`,
        }}
      >
        <div style={{ width: 44, height: 44, border: `3px solid ${T.line}`, borderTop: `3px solid ${T.accent}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
        <div key={msgIdx} style={{ fontFamily: F.mono, fontSize: "0.65rem", letterSpacing: "0.14em", color: T.accent, marginBottom: 28, animation: "fadeUp .4s ease", minHeight: 18 }}>
          {RMSGS[msgIdx]}
        </div>
        <div style={{ fontFamily: F.mono, fontSize: "0.48rem", letterSpacing: "0.28em", color: T.muted, textTransform: "uppercase", marginBottom: 12 }}>Did you know</div>
        <div key={factIdx} style={{ fontFamily: F.serif, fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.05rem, 3vw, 1.35rem)", color: T.inkSoft, lineHeight: 1.55, minHeight: 72, animation: "fadeUp .5s ease" }}>
          <TypewriterFact text={FACTS[factIdx]} />
        </div>
        <div style={{ marginTop: 28, paddingTop: 22, borderTop: `1px solid ${T.line}` }}>
          <Wordmark size="small" />
        </div>
      </div>
    </div>
  );
}

// ── FORM ─────────────────────────────────────────────────────────────────────
function Form({ form, onChange, onSubmit, err }) {
  const wrap = { position: "relative" };
  const inp = {
    width: "100%",
    background: T.white,
    border: `1px solid ${T.line}`,
    borderRadius: 14,
    color: T.ink,
    fontFamily: F.sans,
    fontWeight: 400,
    fontSize: "0.95rem",
    padding: "14px 16px 14px 44px",
    transition: "border-color .2s, box-shadow .2s",
  };
  const lbl = {
    display: "block",
    fontFamily: F.mono,
    fontSize: "0.52rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: T.muted,
    marginBottom: 8,
    fontWeight: 600,
  };
  const s = (k, v) => onChange(k, v);

  const pillBtn = (selected) => ({
    padding: "10px 16px",
    background: selected ? T.accent : T.white,
    border: selected ? `1px solid ${T.accent}` : `1px solid ${T.line}`,
    borderRadius: 999,
    color: selected ? T.white : T.inkSoft,
    fontFamily: F.sans,
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.04em",
    cursor: "pointer",
    transition: "all .2s",
  });

  return (
    <div style={{ fontFamily: F.sans, minHeight: "100vh", position: "relative" }}>
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
        }}
      />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(26,25,23,0.38) 0%, rgba(26,25,23,0.55) 100%)", zIndex: 1 }} />

      <div style={{ position: "relative", zIndex: 2, padding: "28px 20px 40px", minHeight: "100vh", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            background: T.paper,
            borderRadius: 28,
            boxShadow: "0 32px 100px rgba(0,0,0,0.28)",
            overflow: "hidden",
            display: "block",
          }}
        >
          <main style={{ padding: "36px 28px 38px", background: T.paper }}>

            <div style={{ textAlign: "center", marginTop: 4, marginBottom: 8 }}>
              <Wordmark />
            </div>

            <h2 style={{ fontFamily: F.serif, fontWeight: 700, fontSize: "1.55rem", color: T.accent, textAlign: "center", marginBottom: 26, letterSpacing: "0.02em" }}>Plan your real escape</h2>

            <div style={{ maxWidth: 520, margin: "0 auto" }}>
              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Where are you headed?</label>
                <div style={wrap}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
                    <IconPin />
                  </span>
                  <input className="sq-input" style={inp} type="text" placeholder="Kyoto, Japan — Amalfi Coast — Coorg, Karnataka" value={form.destinations} onChange={(e) => s("destinations", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Leaving from</label>
                <div style={wrap}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
                    <IconPin />
                  </span>
                  <input className="sq-input" style={inp} type="text" placeholder="Bengaluru, London, New York…" value={form.departure} onChange={(e) => s("departure", e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={lbl}>Start date</label>
                  <div style={wrap}>
                    <span style={{ position: "absolute", left: 14, top: 14, display: "flex", pointerEvents: "none" }}>
                      <IconCalendar />
                    </span>
                    <input className="sq-input" style={{ ...inp, paddingTop: 12, paddingBottom: 12 }} type="date" value={form.dateFrom} onChange={(e) => s("dateFrom", e.target.value)} />
                  </div>
                </div>
                <div>
                  <label style={lbl}>End date</label>
                  <div style={wrap}>
                    <span style={{ position: "absolute", left: 14, top: 14, display: "flex", pointerEvents: "none" }}>
                      <IconCalendar />
                    </span>
                    <input className="sq-input" style={{ ...inp, paddingTop: 12, paddingBottom: 12 }} type="date" value={form.dateTo} min={form.dateFrom || ""} onChange={(e) => s("dateTo", e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>People</label>
                <div style={wrap}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
                    <IconUsers />
                  </span>
                  <input className="sq-input" style={inp} type="number" placeholder="2" value={form.people} onChange={(e) => s("people", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Budget per person</label>
                <div style={wrap}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", display: "flex", pointerEvents: "none" }}>
                    <IconTag />
                  </span>
                  <input className="sq-input" style={inp} type="text" placeholder="₹25,000 / $800 / 600 euros" value={form.budget} onChange={(e) => s("budget", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>How are you travelling?</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["Suggested", "Road", "Rail", "Air"].map((mode) => (
                    <button key={mode} type="button" onClick={() => s("travelMode", mode)} style={pillBtn(form.travelMode === mode)}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>
                  Your travel preferences <span style={{ color: T.accent }}>*</span>
                </label>
                <textarea
                  className="sq-input"
                  style={{ ...inp, minHeight: 96, lineHeight: 1.65, paddingLeft: 16 }}
                  placeholder="Travel style, pace, interests, things to avoid, dietary needs, photography, nightlife, solitude — anything that helps us build a better blueprint"
                  value={form.preferences}
                  onChange={(e) => s("preferences", e.target.value)}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                  marginBottom: 22,
                  padding: "14px 18px",
                  background: T.accentSoft,
                  borderRadius: 14,
                  border: `1px solid rgba(201,84,32,0.2)`,
                }}
              >
                <div>
                  <div style={{ fontFamily: F.mono, fontSize: "0.48rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.muted, marginBottom: 4 }}>Solo & women travellers</div>
                  <div style={{ fontFamily: F.sans, fontSize: "0.9rem", fontWeight: 600, color: T.ink }}>Prioritize women's safety</div>
                </div>
                <div style={{ display: "flex", gap: 8, background: T.white, padding: 4, borderRadius: 999, border: `1px solid ${T.line}` }}>
                  <button type="button" onClick={() => s("prioritizeWomensSafety", false)} style={{ ...pillBtn(!form.prioritizeWomensSafety), border: "none", padding: "8px 18px" }}>
                    No
                  </button>
                  <button type="button" onClick={() => s("prioritizeWomensSafety", true)} style={{ ...pillBtn(!!form.prioritizeWomensSafety), border: "none", padding: "8px 18px" }}>
                    Yes
                  </button>
                </div>
              </div>

              {err && <div style={{ fontFamily: F.mono, fontSize: "0.65rem", color: T.terra, marginBottom: 14, letterSpacing: "0.04em" }}>{err}</div>}

              <button
                type="button"
                onClick={onSubmit}
                style={{
                  width: "100%",
                  padding: "17px 20px",
                  background: T.accent,
                  border: "none",
                  color: T.white,
                  fontFamily: F.sans,
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: "0 10px 32px rgba(201,84,32,0.35)",
                  transition: "background .2s, transform .15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = T.accentHover)}
                onMouseOut={(e) => (e.currentTarget.style.background = T.accent)}
              >
                Build my blueprint <span aria-hidden>→</span>
              </button>

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 28, paddingTop: 22, borderTop: `1px solid ${T.line}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.mono, fontSize: "0.48rem", letterSpacing: "0.16em", color: T.muted, textTransform: "uppercase" }}>
                  <CompassStar size={16} color={T.muted} /> Curated by humans · Built for explorers
                </div>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    border: `2px solid ${T.line}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: F.mono,
                    fontSize: "0.38rem",
                    letterSpacing: "0.06em",
                    textAlign: "center",
                    lineHeight: 1.35,
                    color: T.muted,
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}
                >
                  Real places · Real stories
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

// ── RESULT ─────────────────────────────────────────────────────────────────────
function Result({ trip, setTrip, form, onReset, tripId, isShared }) {
  const handleExport = () => window.print();
  return (
    <div
      id="sq-result"
      style={{
        background: R.bg,
        minHeight: "100vh",
        fontFamily: F.sans,
        "--sq-label": R.muted,
        "--sq-accent": R.accent,
        "--sq-accent-soft": R.accentSoft,
        "--sq-text-soft": R.textSoft,
        "--sq-sage": R.sage,
        "--sq-sage-bg": R.sageBg,
        "--sq-teal": R.teal,
        "--sq-teal-bg": R.tealBg,
        "--sq-terra": R.terra,
        "--sq-terra-bg": R.terraBg,
        "--sq-day-hover": R.panel3,
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          zIndex: 0,
          opacity: 0.18,
        }}
      />
      <div style={{ position: "fixed", inset: 0, background: "linear-gradient(180deg, rgba(8,7,5,0.8), rgba(8,7,5,0.96))", zIndex: 0 }} />
      <div style={{ position: "relative", zIndex: 1, padding: "24px 18px 72px" }}>
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            background: R.panel,
            borderRadius: 28,
            boxShadow: "0 26px 90px rgba(0,0,0,0.42)",
            border: `1px solid ${R.line}`,
            padding: "28px 26px 40px",
          }}
        >
          <div className="np" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 18, borderBottom: `1px solid ${R.line}`, flexWrap: "wrap", gap: 14 }}>
            <Wordmark size="small" light />
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {tripId && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(`${window.location.origin}/trip/${tripId}`);
                      alert("Link copied!");
                    } catch {
                      alert("Could not copy link. Please copy it manually from the address bar.");
                    }
                  }}
                  style={{
                    fontFamily: F.mono,
                    fontSize: "0.56rem",
                    letterSpacing: "0.1em",
                    background: "transparent",
                    border: `1px solid ${R.accent}`,
                    color: R.accent,
                    padding: "10px 16px",
                    borderRadius: 999,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  SHARE ↗
                </button>
              )}
              <button
                type="button"
                onClick={handleExport}
                style={{
                  fontFamily: F.mono,
                  fontSize: "0.56rem",
                  letterSpacing: "0.12em",
                  background: R.panel2,
                  border: `1px solid ${R.accent}`,
                  color: R.accent,
                  padding: "10px 18px",
                  borderRadius: 999,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Export PDF ↗
              </button>
              {!isShared && (
                <button
                  type="button"
                  onClick={onReset}
                  style={{
                    background: R.panel2,
                    border: `1px solid ${R.line}`,
                    color: R.muted,
                    fontFamily: F.mono,
                    fontSize: "0.56rem",
                    letterSpacing: "0.1em",
                    padding: "10px 18px",
                    cursor: "pointer",
                    borderRadius: 999,
                    fontWeight: 600,
                  }}
                >
                  ← New trip
                </button>
              )}
            </div>
          </div>
          <TripHero trip={trip} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "32px 0 22px" }}>
            <div style={{ flex: 1, height: 1, background: R.line }} />
            <div style={{ fontFamily: F.mono, fontSize: "0.48rem", letterSpacing: "0.28em", color: R.muted, textTransform: "uppercase" }}>Day by day</div>
            <div style={{ flex: 1, height: 1, background: R.line }} />
          </div>
          {trip.days?.map((day, i) => (
            <DayCard key={i} day={day} defaultOpen={i === 0} />
          ))}
          <FoodMap foodMap={trip.foodMap} />
          <Outro budget={trip.costs} different={trip.differentiators} packing={trip.packing} />
          {!isShared && <RefinePanel trip={trip} form={form} onUpdate={setTrip} />}
        </div>
      </div>
    </div>
  );
}

function buildFormPayload(form) {
  const base = form.preferences?.trim() || "";
  const safety = form.prioritizeWomensSafety
    ? "Prioritize women's safety: prefer well-reviewed areas for women and solo travellers, sensible transport times, reputable stays; include concise, respectful safety-aware tips in warnings where useful."
    : "";
  const preferences = [base, safety].filter(Boolean).join("\n\n");
  return { ...form, preferences };
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function SideQuest() {
  useGlobalStyles();
  const [form, setForm] = useState({
    destinations: "",
    departure: "",
    dateFrom: "",
    dateTo: "",
    travelMode: "Suggested",
    people: "2",
    budget: "",
    preferences: "",
    prioritizeWomensSafety: false,
  });
  const [phase, setPhase] = useState("form");
  const [trip, setTrip] = useState(null);
  const [tripId, setTripId] = useState(null);
  const [sharedTripLoading, setSharedTripLoading] = useState(false);
  const [factIdx, setFactIdx] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (phase!=="loading") return;
    const f = setInterval(() => setFactIdx(i=>(i+1)%FACTS.length), 7000);
    const m = setInterval(() => setMsgIdx(i=>(i+1)%RMSGS.length), 4500);
    return () => { clearInterval(f); clearInterval(m); };
  }, [phase]);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/trip/")) {
      const id = path.replace("/trip/", "").trim();
      if (!id) return;
      setSharedTripLoading(true);
      setPhase("loading");
      fetch(`/api/trip/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.trip_data) {
            setTrip(data.trip_data);
            setTripId(id);
            setPhase("result");
          } else {
            setPhase("error");
          }
        })
        .catch(() => setPhase("error"))
        .finally(() => setSharedTripLoading(false));
    }
  }, []);

  const onChange = (k, v) => {
    setForm(f => {
      if (typeof k === "object") {
        const next = { ...f, ...k };
        if (k.dateFrom && (!next.dateTo || next.dateTo < k.dateFrom)) next.dateTo = k.dateFrom;
        return next;
      }
      const next = { ...f, [k]: v };
      if (k === "dateFrom" && (!next.dateTo || next.dateTo < v)) next.dateTo = v;
      return next;
    });
  };

  const generate = async () => {
    if (!form.destinations||!form.departure||!form.budget||!form.preferences?.trim()) { setErr("please fill in all fields including your travel preferences — it helps us research better."); return; }
    setErr(""); setTripId(null); setPhase("loading"); setFactIdx(0); setMsgIdx(0);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form: buildFormPayload(form) }),
      });
      const body = await res.text();
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        throw new Error(`Server returned a non-JSON response (${res.status}). Check the latest Vercel function logs.`);
      }
      if (data.error) throw new Error(data.error);
      const parsed = data.trip || (() => {
        const raw = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
        const jsonStr = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
        return JSON.parse(jsonStr);
      })();
      setTrip(parsed); setTripId(data.tripId || null); setPhase("result"); window.scrollTo(0,0);
    } catch(e) {
      const msg = e instanceof SyntaxError ? "Itinerary response was not valid JSON after server repair. Try a shorter trip or fewer days." : "Something went wrong — "+e.message;
      setErr(msg); setPhase("form");
    }
  };

  if (phase === "error") return (
    <div style={{ minHeight:"100vh", background:C.ink || C.redDeep, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:32 }}>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem", color:C.cream, textAlign:"center" }}>This itinerary could not be found.</div>
      <button onClick={() => { window.location.href = "/"; }} style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.6rem", letterSpacing:"0.12em", background:"transparent", border:`1px solid ${C.gold || C.amber}`, color:C.gold || C.amber, padding:"10px 20px", borderRadius:20, cursor:"pointer" }}>← Plan a New Trip</button>
    </div>
  );
  if (phase==="loading" || sharedTripLoading) return <Loading factIdx={factIdx} msgIdx={msgIdx}/>;
  if (phase==="result"&&trip) return <Result trip={trip} tripId={tripId} isShared={phase === "result" && window.location.pathname.startsWith("/trip/")} setTrip={setTrip} form={form} onReset={()=>{ setPhase("form"); setTrip(null); setTripId(null); window.scrollTo(0,0); }}/>;
  return <Form form={form} onChange={onChange} onSubmit={generate} err={err}/>;
}

import { useState, useEffect, useRef } from "react";

const C = {
  ink:"#0d0b07", inkMid:"#1a1810", inkLight:"#2a2618", inkDeep:"#070604",
  gold:"#C8A020", goldLight:"#E8C840", goldDim:"#7a6010", goldFaint:"rgba(200,160,32,0.12)",
  terra:"#C8603A", terraLight:"#E0845A", terraDim:"#7a3820",
  teal:"#3ABCB0", tealDim:"rgba(58,188,176,0.15)",
  cream:"#FAF3E0", cream2:"#F0E4C4", cream3:"#E4D4A8",
  sage:"#4a6a20", sageLight:"#88B840",
};

const FONTS = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap";

const CURRENCIES = [
  { code:"INR", symbol:"₹", label:"₹ INR" },
  { code:"USD", symbol:"$", label:"$ USD" },
  { code:"EUR", symbol:"€", label:"€ EUR" },
  { code:"GBP", symbol:"£", label:"£ GBP" },
  { code:"JPY", symbol:"¥", label:"¥ JPY" },
  { code:"SGD", symbol:"S$", label:"S$ SGD" },
  { code:"THB", symbol:"฿", label:"฿ THB" },
  { code:"AUD", symbol:"A$", label:"A$ AUD" },
];

function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById("sq-f")) return;
    const l = document.createElement("link"); l.id="sq-f"; l.rel="stylesheet"; l.href=FONTS; document.head.appendChild(l);
    const s = document.createElement("style"); s.id="sq-g";
    s.textContent = `
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { to{transform:rotate(360deg)} }
      .sqi:focus { outline:none; border-color:${C.gold}!important; box-shadow:0 0 0 3px rgba(200,160,32,.12)!important; }
      .sqi::placeholder { color:rgba(250,243,224,0.3); }
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; }
      input[type=date]::-webkit-calendar-picker-indicator { filter:invert(70%) sepia(40%) saturate(500%) hue-rotate(5deg); cursor:pointer; }
      .sqs option { background:${C.cream}; color:${C.ink}; }
      .sqb:hover { background:${C.gold}!important; color:${C.ink}!important; transform:translateY(-2px); box-shadow:0 8px 24px rgba(200,160,32,.35)!important; }
      .sqb:active { transform:scale(.98)!important; }
      .sqd:hover { background:rgba(200,160,32,.07)!important; }
      .sqk:hover { border-color:rgba(200,160,32,.5)!important; color:${C.cream}!important; }
      .sqr-input:focus { outline:none; border-color:rgba(200,160,32,.7)!important; }
      textarea.sqi { resize:vertical; }

      @media print {
        .np { display:none!important; }
        .sq-refine { display:none!important; }
        * { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
        html,body { background:#0d0b07!important; height:auto!important; min-height:0!important; margin:0!important; padding:0!important; }
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
  "Scanning forums for what locals actually recommend…",
  "Cross-referencing crowd-free timings…",
  "Finding the spots tourists haven't discovered yet…",
  "Comparing neighbourhoods by vibe, not star rating…",
  "Reading years of forum threads about this route…",
  "Filtering out the tourist menu…",
  "Checking which spots are empty at which hour…",
  "Composing your blueprint…",
];

// ── PRIMITIVES ─────────────────────────────────────────────────────────────────
function Wordmark({ size = "full" }) {
  if (size === "small") {
    return (
      <div style={{
        fontFamily:"'Cormorant Garamond',serif",
        fontWeight:700,
        fontSize:"1.6rem",
        letterSpacing:"0.1em",
        color:C.gold,
        textTransform:"uppercase",
      }}>Side Quest</div>
    );
  }
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{
        fontFamily:"'DM Mono',monospace",
        fontSize:"0.55rem",
        letterSpacing:"0.35em",
        color:C.goldDim,
        textTransform:"uppercase",
        marginBottom:4,
        opacity:0.8,
      }}>— EST. 2025 —</div>
      <div style={{
        fontFamily:"'Cormorant Garamond',serif",
        fontWeight:700,
        fontSize:"clamp(2.8rem,10vw,5rem)",
        letterSpacing:"0.12em",
        color:C.gold,
        textTransform:"uppercase",
        lineHeight:1,
      }}>Side Quest</div>
      <div style={{
        fontFamily:"'DM Mono',monospace",
        fontSize:"0.52rem",
        letterSpacing:"0.3em",
        color:C.goldDim,
        textTransform:"uppercase",
        marginTop:6,
        opacity:0.7,
      }}>Conscious Travel Planning</div>
    </div>
  );
}

function Ticker() {
  const msg = "SIDE QUEST  ✦  FIND THE REAL THING  ✦  NO TOURIST TRAPS  ✦  GO SOMEWHERE REAL  ✦  ";
  const rep = msg.repeat(10);
  return (
    <div className="np" style={{ background:C.gold, overflow:"hidden", height:28, display:"flex", alignItems:"center" }}>
      <div style={{ display:"flex", animation:"ticker 65s linear infinite", whiteSpace:"nowrap" }}>
        {[rep,rep].map((r,i) => <span key={i} style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.54rem", letterSpacing:"0.14em", color:C.ink, opacity:.9 }}>{r}</span>)}
      </div>
    </div>
  );
}

function Lbl({ children, color=C.goldDim }) {
  return <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", letterSpacing:"0.22em", color, textTransform:"uppercase", marginBottom:10, opacity:.88 }}>{children}</div>;
}

function Badge({ children, bg=C.gold, color=C.ink, style={} }) {
  return <span style={{ display:"inline-block", background:bg, color, fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", fontWeight:500, padding:"3px 12px", letterSpacing:"0.12em", textTransform:"uppercase", borderRadius:20, ...style }}>{children}</span>;
}

function WhyBlock({ label="Why we chose this", text }) {
  if (!text) return null;
  return (
    <div style={{ background:"rgba(200,160,32,0.06)", borderLeft:"3px solid rgba(200,160,32,0.4)", borderRadius:"0 6px 6px 0", padding:"12px 16px", marginTop:10 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", letterSpacing:"0.18em", color:C.goldDim, textTransform:"uppercase", marginBottom:6 }}>{label}</div>
      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.87rem", color:C.cream2, lineHeight:1.75, margin:0, textAlign:"justify" }}>{text}</p>
    </div>
  );
}

const TIP  = ({t}) => <div style={{ display:"flex", gap:10, padding:"9px 13px", background:"rgba(74,106,32,0.12)", borderLeft:`3px solid ${C.sage}`, borderRadius:"0 6px 6px 0", marginBottom:6 }}><span style={{ color:C.sageLight, fontSize:"0.7rem", flexShrink:0 }}>→</span><p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", color:"#a0c870", lineHeight:1.7, margin:0, textAlign:"justify" }}>{t}</p></div>;
const HACK = ({t}) => <div style={{ display:"flex", gap:10, padding:"9px 13px", background:C.tealDim, borderLeft:`3px solid ${C.teal}`, borderRadius:"0 6px 6px 0", marginBottom:6 }}><span style={{ color:C.teal, fontSize:"0.7rem", flexShrink:0 }}>◎</span><p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", color:C.teal, lineHeight:1.7, margin:0, textAlign:"justify" }}>{t}</p></div>;
const WARN = ({t}) => <div style={{ display:"flex", gap:10, padding:"9px 13px", background:"rgba(200,96,58,0.1)", borderLeft:`3px solid ${C.terra}`, borderRadius:"0 6px 6px 0", marginBottom:6 }}><span style={{ color:C.terraLight, fontSize:"0.7rem", flexShrink:0 }}>!</span><p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", color:C.terraLight, lineHeight:1.7, margin:0, textAlign:"justify" }}>{t}</p></div>;

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
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution:'© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>', maxZoom:18,
      }).addTo(map);
      const latlngs = coords.map(c => [c.lat, c.lon]);
      L.polyline(latlngs, { color:C.terraLight, weight:2.5, dashArray:"8 5", opacity:.85 }).addTo(map);
      coords.forEach((c, i) => {
        const big = i===0||i===coords.length-1;
        const icon = L.divIcon({
          className:"",
          html:`<div style="width:${big?26:20}px;height:${big?26:20}px;border-radius:50%;background:${big?C.gold:"rgba(200,160,32,.7)"};border:2.5px solid ${C.terraLight};display:flex;align-items:center;justify-content:center;font-family:'DM Mono',monospace;font-size:${big?"9px":"8px"};color:${C.cream};font-weight:500;">${i+1}</div>`,
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
    <div style={{ marginBottom:32 }}>
      <Lbl>Route Map</Lbl>
      <div style={{ position:"relative", height:300, borderRadius:8, overflow:"hidden", border:"1px solid rgba(200,160,32,0.25)" }}>
        {status==="loading" && (
          <div style={{ position:"absolute", inset:0, background:C.inkDeep, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, zIndex:1 }}>
            <div style={{ width:28, height:28, border:"2px solid rgba(200,160,32,0.2)", borderTop:`2px solid ${C.gold}`, borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.56rem", color:C.gold, letterSpacing:"0.14em", opacity:.7 }}>mapping your route…</div>
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
    <div style={{ marginBottom:36 }}>
      <div style={{
        background:"linear-gradient(135deg, rgba(200,160,32,0.15), rgba(200,160,32,0.05))",
        border:`1px solid rgba(200,160,32,0.25)`,
        borderLeft:`4px solid ${C.gold}`,
        borderRadius:8,
        padding:"32px 28px 28px",
      }}>
        {trip.travelStyle && <Badge bg="rgba(200,160,32,0.15)" color={C.gold} style={{ marginBottom:14, display:"inline-block", border:"1px solid rgba(200,160,32,0.4)" }}>{trip.travelStyle}</Badge>}
        <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"clamp(1.45rem,3.5vw,2.1rem)", color:C.cream, lineHeight:1.22, marginBottom:12, letterSpacing:"0.02em" }}>{trip.tripTitle}</h1>
        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontWeight:400, fontSize:"0.95rem", color:"rgba(250,243,224,0.65)", lineHeight:1.65, textAlign:"justify" }}>{trip.tagline}</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", background:C.inkMid, border:"1px solid rgba(200,160,32,0.2)", borderTop:`2px solid ${C.gold}` }}>
        <div style={{ padding:"22px 20px", borderRight:"1px solid rgba(200,160,32,0.15)" }}>
          <Lbl>Route</Lbl>
          {(trip.overview?.routeStops||[]).map((stop,i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column" }}>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.92rem", color:C.cream, lineHeight:1.3 }}>{stop}</span>
              {i<(trip.overview?.routeStops?.length||0)-1 && <span style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.65rem", color:"rgba(200,160,32,0.5)", margin:"3px 0 4px", lineHeight:1 }}>↓</span>}
            </div>
          ))}
        </div>
        <div style={{ padding:"22px 20px", borderRight:"1px solid rgba(200,160,32,0.15)" }}>
          {[["Duration",trip.overview?.duration],["Transport",trip.overview?.transport]].map(([l,v]) => v && (
            <div key={l} style={{ marginBottom:16 }}>
              <Lbl>{l}</Lbl>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.92rem", color:C.cream }}>{v}</div>
            </div>
          ))}
          {trip.overview?.transportNote && (
            <div style={{ background:"rgba(200,96,58,0.1)", borderLeft:"2px solid rgba(200,96,58,0.4)", padding:"8px 12px", borderRadius:"0 4px 4px 0", marginBottom:12 }}>
              <p style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.65rem", color:C.terraLight, lineHeight:1.6, margin:0 }}>{trip.overview.transportNote}</p>
            </div>
          )}
        </div>
        <div style={{ padding:"22px 20px" }}>
          <Lbl>Budget</Lbl>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.92rem", color:C.cream, marginBottom:16 }}>{trip.overview?.totalBudget}</div>
          {trip.overview?.season && <><Lbl>Season</Lbl><div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.84rem", color:C.cream2, lineHeight:1.5, marginBottom:14 }}>{trip.overview.season}</div></>}
          {trip.moodTags?.length>0 && <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>{trip.moodTags.map((t,i) => <Badge key={i} bg="rgba(200,160,32,0.15)" color={C.gold} style={{ border:"1px solid rgba(200,160,32,0.4)" }}>{t}</Badge>)}</div>}
        </div>
      </div>

      {trip.philosophy && (
        <div style={{ background:C.inkMid, border:"1px solid rgba(200,160,32,0.18)", borderTop:"none", padding:"20px 24px" }}>
          <Lbl>Trip Philosophy</Lbl>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:400, fontSize:"0.95rem", color:C.cream2, lineHeight:1.8, textAlign:"justify" }}>{trip.philosophy}</p>
        </div>
      )}
      {trip.memories?.length>0 && (
        <div style={{ background:C.inkLight, border:"1px solid rgba(200,160,32,0.15)", borderTop:"none", borderRadius:"0 0 8px 8px", padding:"20px 24px" }}>
          <Lbl>Core Memories This Trip Will Create</Lbl>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {trip.memories.map((m,i) => (
              <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.2rem", color:C.gold, lineHeight:1, flexShrink:0, marginTop:2, opacity:.55 }}>"</div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:400, fontSize:"0.93rem", color:C.cream2, lineHeight:1.65, margin:0, textAlign:"justify" }}>{m}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TIMELINE ───────────────────────────────────────────────────────────────────
const TYPE_DOT = { highlight:C.gold, travel:C.terra, food:C.sage, sunset:C.terraLight, stay:C.teal, tip:C.goldDim };

function Timeline({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{ position:"relative", paddingLeft:28 }}>
      <div style={{ position:"absolute", left:7, top:8, bottom:8, width:1, background:"rgba(200,160,32,0.2)" }}/>
      {items.map((item,i) => (
        <div key={i} style={{ position:"relative", marginBottom:i<items.length-1?22:0 }}>
          <div style={{ position:"absolute", left:-25, top:4, width:10, height:10, borderRadius:"50%", background:TYPE_DOT[item.type]||C.gold, border:`2px solid ${C.inkDeep}` }}/>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.58rem", letterSpacing:"0.1em", color:C.goldDim, marginBottom:3 }}>{item.time}</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5, flexWrap:"wrap" }}>
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:"0.94rem", color:item.type==="sunset"?C.terraLight:C.cream }}>{item.title}</span>
            {item.mustDo && <Badge bg={C.terra} color={C.cream}>Must Do</Badge>}
            {item.type==="sunset" && <Badge bg="rgba(200,96,58,0.2)" color={C.terraLight} style={{ border:"1px solid rgba(200,96,58,0.5)" }}>Sunset</Badge>}
          </div>
          {item.desc && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.86rem", color:"rgba(250,243,224,0.58)", lineHeight:1.75, margin:0, textAlign:"justify" }}>{item.desc}</p>}
        </div>
      ))}
    </div>
  );
}

// ── DAY CARD ───────────────────────────────────────────────────────────────────
function DayCard({ day, defaultOpen=false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="print-day" style={{ background:C.inkMid, border:"1px solid rgba(200,160,32,0.18)", borderRadius:8, marginBottom:14, overflow:"hidden" }}>
      <div className="sqd" onClick={() => setOpen(o=>!o)} style={{ padding:"20px 22px 18px", cursor:"pointer", position:"relative", transition:"background .15s", borderBottom:open?"1px solid rgba(200,160,32,0.15)":"none" }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:6 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"1.25rem", color:C.cream, textTransform:"uppercase", letterSpacing:"0.06em", lineHeight:1.2 }}>{day.place || day.title}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.5rem", color:C.gold, letterSpacing:"0.2em", flexShrink:0, marginLeft:14, marginTop:4 }}>DAY {day.dayNumber}</div>
        </div>
        {day.place && day.title && day.place !== day.title && (
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontWeight:400, fontSize:"0.85rem", color:C.terraLight, marginBottom:5, opacity:0.85 }}>{day.title}</div>
        )}
        <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.8rem", color:"rgba(250,243,224,0.45)", lineHeight:1.5 }}>{day.subtitle}</div>
        <div style={{ position:"absolute", right:20, top:22, fontFamily:"'DM Mono',monospace", fontSize:"0.6rem", color:"rgba(250,243,224,0.25)" }}>{open?"↑":"↓"}</div>
      </div>
      {open && (
        <div style={{ padding:"22px" }}>
          {day.timeline?.length>0 && <div style={{ marginBottom:24 }}><Lbl>Day Schedule</Lbl><Timeline items={day.timeline}/></div>}
          {day.food?.length > 0 && (
            <div style={{ marginBottom:22 }}>
              <Lbl>Food & Drink</Lbl>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {day.food.map((f,i) => (
                  <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                    <span style={{ color:C.gold, fontFamily:"'DM Mono',monospace", fontSize:"0.65rem", flexShrink:0, marginTop:3 }}>◆</span>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.87rem", color:C.cream2, lineHeight:1.65, margin:0, textAlign:"justify" }}>{f}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {day.stay && (
            <div style={{ marginBottom:22 }}>
              <Lbl>Where to Stay</Lbl>
              <div style={{ background:"rgba(250,243,224,0.03)", border:"1px solid rgba(200,160,32,0.15)", borderRadius:8, padding:"15px 17px" }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"0.93rem", color:C.cream, marginBottom:8 }}>{day.stay.locality}</div>
                {day.stay.why && <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.86rem", color:C.cream2, lineHeight:1.75, marginBottom:10, textAlign:"justify" }}>{day.stay.why}</p>}
                <WhyBlock label="Why not the tourist strip" text={day.stay.notWhere}/>
              </div>
            </div>
          )}
          {(day.tips?.length||day.hacks?.length||day.warnings?.length) ? (
            <div style={{ marginBottom:22 }}>
              <Lbl>Insider Intelligence</Lbl>
              {day.tips?.map((t,i) => <TIP key={i} t={t}/>)}
              {day.hacks?.map((t,i) => <HACK key={i} t={t}/>)}
              {day.warnings?.map((t,i) => <WARN key={i} t={t}/>)}
            </div>
          ) : null}
          {day.budget && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.68rem", color:C.terraLight, marginTop:4 }}><span style={{ opacity:.5, marginRight:6 }}>Day budget</span>{day.budget}</div>}
        </div>
      )}
    </div>
  );
}

// ── OUTRO ──────────────────────────────────────────────────────────────────────
function Outro({ budget, different, packing }) {
  return (
    <div className="sq-outro" style={{ marginTop:40 }}>
      {budget && (
        <div style={{ background:C.inkMid, border:"1px solid rgba(200,160,32,0.18)", borderRadius:8, padding:"26px", marginBottom:16 }}>
          <Lbl>Budget Breakdown — Per Person</Lbl>
          <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"'DM Mono',monospace", fontSize:"0.8rem" }}>
              <thead><tr>{["Category","Amount","Notes"].map((h,i) => <th key={i} style={{ background:"rgba(200,160,32,0.15)", color:C.gold, padding:"10px 13px", textAlign:"left", fontSize:"0.55rem", letterSpacing:"0.14em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
              <tbody>
                {Object.entries(budget).filter(([k]) => k!=="total").map(([key,val],i) => (
                  <tr key={i}>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid rgba(200,160,32,0.1)", color:C.cream2, textTransform:"capitalize" }}>{key}</td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid rgba(200,160,32,0.1)", color:C.terraLight, whiteSpace:"nowrap" }}>{val?.amount}</td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid rgba(200,160,32,0.1)", color:"rgba(250,243,224,0.42)", fontSize:"0.74rem" }}>{val?.note}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ padding:"11px 13px", borderTop:"2px solid rgba(200,160,32,0.5)", color:C.gold, fontWeight:700, fontSize:"0.88rem" }}>Total</td>
                  <td style={{ padding:"11px 13px", borderTop:"2px solid rgba(200,160,32,0.5)", color:C.gold, fontWeight:700, fontSize:"0.88rem" }}>{budget.total}</td>
                </tr>
              </tbody>
          </table>
        </div>
      )}
      {different?.length>0 && (
        <div style={{ background:"rgba(200,160,32,0.08)", border:"1px solid rgba(200,160,32,0.2)", borderRadius:8, padding:"26px", marginBottom:16 }}>
          <Lbl color="rgba(250,243,224,0.7)">What Makes This Trip Different</Lbl>
          {different.map((d,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"9px 0", borderBottom:i<different.length-1?"1px solid rgba(200,160,32,0.12)":"none" }}>
              <span style={{ color:C.goldDim, fontFamily:"'DM Mono',monospace", fontSize:"0.62rem", flexShrink:0, marginTop:3 }}>→</span>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.88rem", color:C.cream2, lineHeight:1.7, margin:0, textAlign:"justify" }}>{d}</p>
            </div>
          ))}
        </div>
      )}
      {packing?.length>0 && (
        <div style={{ background:C.inkMid, border:"1px solid rgba(200,160,32,0.18)", borderRadius:8, padding:"24px 26px" }}>
          <Lbl>Pack for This Specific Trip</Lbl>
          {packing.map((p,i) => (
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", marginBottom:8 }}>
              <span style={{ color:C.terra, fontFamily:"'DM Mono',monospace", fontSize:"0.6rem", flexShrink:0, marginTop:3 }}>◆</span>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.85rem", color:C.cream2, lineHeight:1.7, margin:0, textAlign:"justify" }}>{p}</p>
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
      const tripContext = `${form.people} people, ${form.travelMode}, ${form.currencySymbol}${form.budget}/person, ${form.dateFrom||""} to ${form.dateTo||""}`;
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
    <div className="sq-refine" style={{ marginTop:32, background:C.inkMid, border:"1px solid rgba(200,160,32,0.2)", borderRadius:8, padding:"28px 26px" }}>
      <Lbl>Refine Your Trip</Lbl>
      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.82rem", color:"rgba(250,243,224,0.45)", marginBottom:18, lineHeight:1.6 }}>
        Add nightlife · Make it more relaxed · Swap a day for hiking · Add photography spots · Avoid crowded places · Increase budget slightly
      </p>
      <div style={{ display:"flex", gap:10 }}>
        <input
          className="sqr-input"
          value={req}
          onChange={e => setReq(e.target.value)}
          onKeyDown={e => e.key==="Enter" && refine()}
          placeholder="How would you like to change this trip?"
          style={{ flex:1, background:"rgba(250,243,224,0.04)", border:"1px solid rgba(200,160,32,0.2)", borderRadius:8, color:C.cream, fontFamily:"'DM Sans',sans-serif", fontSize:"0.9rem", padding:"12px 16px", transition:"border-color .2s" }}
        />
        <button
          onClick={refine}
          disabled={loading}
          style={{ background:loading?"rgba(200,160,32,0.5)":C.gold, border:"none", color:C.ink, fontFamily:"'DM Mono',monospace", fontSize:"0.6rem", letterSpacing:"0.12em", padding:"12px 20px", borderRadius:8, cursor:loading?"default":"pointer", whiteSpace:"nowrap", transition:"all .2s", fontWeight:700 }}>
          {loading ? "REFINING…" : "REFINE →"}
        </button>
      </div>
      {err && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.62rem", color:C.terra, marginTop:10 }}>{err}</div>}
      {lastChange && !loading && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.6rem", color:C.sageLight, marginTop:10, opacity:.8 }}>✓ Applied: "{lastChange}"</div>}
    </div>
  );
}

// ── LOADING ────────────────────────────────────────────────────────────────────
function TypewriterFact({ text }) {
  const [shown, setShown] = useState("");
  const [ci, setCi] = useState(0);
  useEffect(() => { setShown(""); setCi(0); }, [text]);
  useEffect(() => {
    if (ci>=text.length) return;
    const t = setTimeout(() => { setShown(text.slice(0,ci+1)); setCi(i=>i+1); }, 30);
    return () => clearTimeout(t);
  }, [ci, text]);
  return <span>{shown}<span style={{ display:"inline-block", width:2, height:"0.9em", background:C.gold, marginLeft:3, verticalAlign:"middle", animation:"blink .7s step-end infinite" }}/></span>;
}

function Loading({ factIdx, msgIdx }) {
  return (
    <div style={{ minHeight:"100vh", background:C.ink, display:"flex", flexDirection:"column" }}>
      <Ticker/>
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px", textAlign:"center" }}>
        <div style={{ width:40, height:40, border:"3px solid rgba(200,160,32,0.15)", borderTop:`3px solid ${C.gold}`, borderRadius:"50%", animation:"spin 1s linear infinite", marginBottom:28 }}/>
        <div key={msgIdx} style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.68rem", letterSpacing:"0.12em", color:C.gold, marginBottom:44, animation:"fadeUp .4s ease", minHeight:18, opacity:0.8 }}>{RMSGS[msgIdx]}</div>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.48rem", letterSpacing:"0.3em", color:"rgba(200,160,32,0.5)", textTransform:"uppercase", marginBottom:14 }}>did you know</div>
        <div key={factIdx} style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:"italic", fontWeight:400, fontSize:"clamp(1.1rem,3vw,1.5rem)", color:C.cream, lineHeight:1.55, maxWidth:520, minHeight:64, animation:"fadeUp .5s ease" }}>
          <TypewriterFact text={FACTS[factIdx]}/>
        </div>
      </div>
      <div style={{ background:"rgba(200,160,32,0.08)", borderTop:"1px solid rgba(200,160,32,0.12)", padding:"24px 32px", textAlign:"center" }}>
        <Wordmark size="small" />
      </div>
    </div>
  );
}

// ── FORM ───────────────────────────────────────────────────────────────────────
function Form({ form, onChange, onSubmit, err }) {
  const inp = {
    width:"100%",
    background:"rgba(250,243,224,0.06)",
    border:"1px solid rgba(200,160,32,0.25)",
    borderRadius:6,
    color:C.cream,
    fontFamily:"'DM Sans',sans-serif",
    fontWeight:400,
    fontSize:"0.95rem",
    padding:"13px 16px",
    transition:"border-color .2s, box-shadow .2s",
  };
  const lbl = { display:"block", fontFamily:"'DM Mono',monospace", fontSize:"0.54rem", letterSpacing:"0.2em", textTransform:"uppercase", color:C.goldDim, marginBottom:8, opacity:0.9 };
  const s = (k,v) => onChange(k,v);

  const pillBtn = (selected) => ({
    padding:"10px 12px",
    background:selected?C.gold:"transparent",
    border:selected?`1px solid ${C.gold}`:`1px solid rgba(200,160,32,0.3)`,
    borderRadius:6,
    color:selected?C.ink:"rgba(250,243,224,0.5)",
    fontFamily:"'DM Mono',monospace",
    fontSize:"0.62rem",
    letterSpacing:"0.1em",
    cursor:"pointer",
    transition:"all .2s",
    fontWeight:selected?700:400,
  });

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:C.ink }}>
      <Ticker/>
      <div style={{
        background:C.ink,
        padding:"60px 32px 48px",
        textAlign:"center",
        borderBottom:"1px solid rgba(200,160,32,0.15)",
        position:"relative",
        overflow:"hidden",
      }}>
        <div style={{
          fontFamily:"'DM Mono',monospace",
          fontSize:"1.4rem",
          color:C.goldDim,
          opacity:0.4,
          marginBottom:20,
          letterSpacing:"0.2em",
        }}>✦</div>
        <Wordmark />
        <div style={{
          fontFamily:"'DM Mono',monospace",
          fontSize:"0.52rem",
          letterSpacing:"0.3em",
          color:"rgba(200,160,32,0.5)",
          textTransform:"uppercase",
          marginTop:20,
        }}>— handcrafted travel blueprint —</div>
      </div>
      <div style={{ background:C.ink, padding:"40px 24px 60px" }}>
        <div style={{ maxWidth:520, margin:"0 auto" }}>
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Where are you headed?</label>
            <input className="sqi" style={inp} type="text" placeholder="Kyoto, Japan  /  Amalfi Coast  /  Coorg, Karnataka" value={form.destinations} onChange={e=>s("destinations",e.target.value)}/>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Leaving from</label>
            <input className="sqi" style={inp} type="text" placeholder="Bengaluru, London, New York..." value={form.departure} onChange={e=>s("departure",e.target.value)}/>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            <div>
              <label style={lbl}>Start Date</label>
              <input className="sqi" style={inp} type="date" value={form.dateFrom} onChange={e=>s("dateFrom",e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>End Date</label>
              <input className="sqi" style={inp} type="date" value={form.dateTo} min={form.dateFrom||""} onChange={e=>s("dateTo",e.target.value)}/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
            <div>
              <label style={lbl}>Number of people</label>
              <input className="sqi" style={inp} type="number" placeholder="2" value={form.people} onChange={e=>s("people",e.target.value)}/>
            </div>
            <div>
              <label style={lbl}>Currency</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                {CURRENCIES.map(c => (
                  <button key={c.code} type="button" onClick={() => onChange({ currency: c.code, currencySymbol: c.symbol })}
                    style={pillBtn(form.currency===c.code)}>
                    {c.label}
                  </button>
                ))}
              </div>
              <label style={lbl}>Budget per person</label>
              <input className="sqi" style={inp} type="text" placeholder={`${form.currencySymbol}25,000`} value={form.budget} onChange={e=>s("budget",e.target.value)}/>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>How are you travelling?</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10 }}>
              {["Suggested","Road","Rail","Air"].map(mode => (
                <button key={mode} type="button" onClick={()=>s("travelMode",mode)} style={pillBtn(form.travelMode===mode)}>
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom:28 }}>
            <label style={lbl}>Your travel preferences <span style={{color:C.gold}}>*</span></label>
            <textarea className="sqi" style={{ ...inp, minHeight:88, lineHeight:1.65 }} placeholder="Tell us your travel style, pace, interests, things to avoid, dietary needs, photography, nightlife, solitude — anything helps us build a better blueprint" value={form.preferences} onChange={e=>s("preferences",e.target.value)}/>
          </div>
          {err && <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.67rem", color:C.terra, marginBottom:14, letterSpacing:"0.04em" }}>{err}</div>}
          <button className="sqb" type="button" onClick={onSubmit} style={{ width:"100%", padding:"18px", background:"transparent", border:`2px solid ${C.gold}`, color:C.gold, fontFamily:"'Cormorant Garamond',serif", fontWeight:700, fontSize:"1.2rem", letterSpacing:"0.18em", textTransform:"uppercase", cursor:"pointer", borderRadius:6, transition:"all .2s" }}>Build My Blueprint</button>
          <div style={{ textAlign:"center", marginTop:14, fontFamily:"'DM Mono',monospace", fontSize:"0.52rem", color:"rgba(200,160,32,0.4)", letterSpacing:"0.15em" }}>✦  searches forums  ·  avoids tourist traps  ·  finds the real thing  ✦</div>
        </div>
      </div>
      <div style={{ background:"rgba(200,160,32,0.06)", borderTop:"1px solid rgba(200,160,32,0.12)", padding:"24px 32px", textAlign:"center" }}>
        <Wordmark size="small" />
      </div>
    </div>
  );
}

// ── RESULT ─────────────────────────────────────────────────────────────────────
function Result({ trip, setTrip, form, onReset }) {
  const handleExport = () => window.print();
  return (
    <div id="sq-result" style={{ background:C.ink }}>
      <div className="np"><Ticker/></div>
      <div style={{ padding:"26px 20px 80px" }}>
        <div style={{ maxWidth:820, margin:"0 auto" }}>
          <div className="np" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28, paddingBottom:16, borderBottom:"1px solid rgba(200,160,32,0.15)" }}>
            <Wordmark size="small" />
            <div style={{ display:"flex", gap:9 }}>
              <button type="button" onClick={handleExport} style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.56rem", letterSpacing:"0.1em", background:"transparent", border:`1px solid ${C.gold}`, color:C.gold, padding:"8px 16px", borderRadius:20, cursor:"pointer" }}>EXPORT PDF ↗</button>
              <button type="button" className="sqk" onClick={onReset} style={{ background:"transparent", border:"1px solid rgba(200,160,32,0.25)", color:"rgba(200,160,32,0.35)", fontFamily:"'DM Mono',monospace", fontSize:"0.58rem", padding:"7px 15px", cursor:"pointer", borderRadius:20, letterSpacing:"0.08em", transition:"all .2s" }}>← New Trip</button>
            </div>
          </div>
          <TripHero trip={trip}/>
          <div style={{ display:"flex", alignItems:"center", gap:16, margin:"36px 0 24px" }}>
            <div style={{ flex:1, height:"1px", background:"rgba(200,160,32,0.15)" }}/>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.48rem", letterSpacing:"0.3em", color:"rgba(200,160,32,0.4)", textTransform:"uppercase" }}>✦ Day by Day ✦</div>
            <div style={{ flex:1, height:"1px", background:"rgba(200,160,32,0.15)" }}/>
          </div>
          {trip.days?.map((day,i) => <DayCard key={i} day={day} defaultOpen={i===0}/>)}
          <Outro budget={trip.costs} different={trip.differentiators} packing={trip.packing}/>
          <RefinePanel trip={trip} form={form} onUpdate={setTrip}/>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function SideQuest() {
  useGlobalStyles();
  const [form, setForm] = useState({
    destinations:"", departure:"", dateFrom:"", dateTo:"",
    travelMode:"Suggested", people:"2", budget:"", preferences:"",
    currency:"INR", currencySymbol:"₹",
  });
  const [phase, setPhase] = useState("form");
  const [trip, setTrip] = useState(null);
  const [factIdx, setFactIdx] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (phase!=="loading") return;
    const f = setInterval(() => setFactIdx(i=>(i+1)%FACTS.length), 7000);
    const m = setInterval(() => setMsgIdx(i=>(i+1)%RMSGS.length), 4500);
    return () => { clearInterval(f); clearInterval(m); };
  }, [phase]);

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
    setErr(""); setPhase("loading"); setFactIdx(0); setMsgIdx(0);
    try {
      const res = await fetch("/api/generate", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ form }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const raw = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
      const jsonStr = raw.replace(/^```json\s*/i,"").replace(/^```\s*/i,"").replace(/\s*```$/i,"").trim();
      const parsed = JSON.parse(jsonStr);
      setTrip(parsed); setPhase("result"); window.scrollTo(0,0);
    } catch(e) {
      const msg = e instanceof SyntaxError ? "Response wasn't valid JSON. Try again." : "Something went wrong — "+e.message;
      setErr(msg); setPhase("form");
    }
  };

  if (phase==="loading") return <Loading factIdx={factIdx} msgIdx={msgIdx}/>;
  if (phase==="result"&&trip) return <Result trip={trip} setTrip={setTrip} form={form} onReset={()=>{ setPhase("form"); setTrip(null); window.scrollTo(0,0); }}/>;
  return <Form form={form} onChange={onChange} onSubmit={generate} err={err}/>;
}

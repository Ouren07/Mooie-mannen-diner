import { useState, useEffect } from "react";

const STORAGE_KEY = "dinner-responses";
const ADMIN_PASSWORD = "dinnertje";

// Simple localStorage-based storage (works in any browser, persists on the device)
const storage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

function getUpcomingWeekends() {
  const today = new Date();
  const months = [];
  for (let m = 0; m < 3; m++) {
    const date = new Date(today.getFullYear(), today.getMonth() + m, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      if (dow === 0 || dow === 5 || dow === 6) days.push(d);
    }
    months.push({ year, month, days });
  }
  return months;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const DAY_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function formatDate(iso) {
  const d = new Date(iso + "T12:00:00");
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0,3)}`;
}

function CalendarMonth({ year, month, weekendDays, selected, onToggle }) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ marginBottom: 40 }}>
      <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16, color: "#111" }}>
        {MONTH_NAMES[month]} {year}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#999", letterSpacing: "0.04em", padding: "4px 0" }}>{d}</div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={"e"+i} />;
          const weekend = weekendDays.includes(d);
          const sel = selected.includes(d);
          return (
            <div key={d} onClick={() => weekend && onToggle(d)} style={{
              aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: "50%", fontSize: 13, fontWeight: sel ? 600 : 400,
              cursor: weekend ? "pointer" : "default",
              backgroundColor: sel ? "#111" : weekend ? "#f5f5f5" : "transparent",
              color: sel ? "#fff" : weekend ? "#111" : "#ccc",
              border: sel ? "2px solid #111" : weekend ? "2px solid #e5e5e5" : "none",
              transition: "all 0.15s ease", userSelect: "none",
            }}>{d}</div>
          );
        })}
      </div>
    </div>
  );
}

function AdminView({ onExit }) {
  const [responses, setResponses] = useState([]);
  const [view, setView] = useState("dates");

  useEffect(() => {
    setResponses(storage.get(STORAGE_KEY));
  }, []);

  const handleClear = () => {
    if (!window.confirm("Weet je zeker dat je alle responses wilt verwijderen?")) return;
    storage.set(STORAGE_KEY, []);
    setResponses([]);
  };

  const tally = {};
  for (const r of responses) {
    for (const date of r.dates) {
      if (!tally[date]) tally[date] = [];
      tally[date].push(r.name);
    }
  }
  const sortedByPop = Object.keys(tally).sort((a, b) => tally[b].length - tally[a].length);
  const maxCount = sortedByPop.length ? tally[sortedByPop[0]].length : 1;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif" }}>
      <div style={{ borderBottom: "1px solid #f0f0f0", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🍽️</span>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>Admin</span>
          <span style={{ fontSize: 13, color: "#bbb" }}>{responses.length} respons{responses.length !== 1 ? "en" : ""}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleClear} disabled={!responses.length} style={{ ...S.btnOutline, color: "#c00", borderColor: "#fcc", opacity: !responses.length ? 0.35 : 1 }}>Wis alles</button>
          <button onClick={onExit} style={S.btnOutline}>← Terug</button>
        </div>
      </div>

      {responses.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
          <div style={{ color: "#999", fontSize: 15 }}>Nog geen responses.</div>
        </div>
      ) : (
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "28px 24px" }}>
          <div style={{ display: "flex", marginBottom: 28, border: "1.5px solid #e5e5e5", borderRadius: 10, overflow: "hidden", width: "fit-content" }}>
            {["dates","people"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "9px 20px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                backgroundColor: view === v ? "#111" : "#fff", color: view === v ? "#fff" : "#666",
                fontFamily: "inherit", transition: "all 0.15s"
              }}>{v === "dates" ? "Per datum" : "Per persoon"}</button>
            ))}
          </div>

          {view === "dates" && (
            <div>
              <p style={{ fontSize: 12, color: "#bbb", marginBottom: 20, marginTop: -8 }}>Gesorteerd op populariteit.</p>
              {sortedByPop.map(date => {
                const count = tally[date].length;
                const pct = count / maxCount;
                return (
                  <div key={date} style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 108, fontSize: 13, fontWeight: 600, color: "#111", flexShrink: 0 }}>{formatDate(date)}</div>
                    <div style={{ flex: 1, height: 30, borderRadius: 6, backgroundColor: "#f5f5f5", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct * 100}%`, backgroundColor: `rgba(17,17,17,${0.12 + pct * 0.88})`, borderRadius: 6, display: "flex", alignItems: "center", paddingLeft: 10, boxSizing: "border-box" }}>
                        {pct > 0.18 && <span style={{ fontSize: 11, color: pct > 0.45 ? "#fff" : "#333", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "90%" }}>{tally[date].join(", ")}</span>}
                      </div>
                    </div>
                    <div style={{ width: 22, textAlign: "right", fontSize: 14, fontWeight: 700, color: "#111", flexShrink: 0 }}>{count}</div>
                  </div>
                );
              })}
            </div>
          )}

          {view === "people" && (
            <div>
              {responses.map((r, i) => (
                <div key={i} style={{ marginBottom: 24, paddingBottom: 24, borderBottom: i < responses.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#111" }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: "#ccc" }}>{new Date(r.submittedAt).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <span style={{ fontSize: 12, color: "#aaa", marginLeft: "auto" }}>{r.dates.length} dag{r.dates.length !== 1 ? "en" : ""}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {r.dates.sort().map(date => (
                      <span key={date} style={{ padding: "5px 11px", borderRadius: 20, backgroundColor: "#f5f5f5", fontSize: 12, fontWeight: 500, color: "#333" }}>{formatDate(date)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminLogin({ onSuccess, onCancel }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const attempt = () => {
    if (pw === ADMIN_PASSWORD) onSuccess();
    else { setError(true); setPw(""); }
  };
  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={{ fontSize: 28, marginBottom: 16 }}>🔒</div>
        <h2 style={{ ...S.title, fontSize: 20, marginBottom: 6 }}>Admin</h2>
        <p style={{ ...S.subtitle, marginBottom: 24 }}>Voer het wachtwoord in.</p>
        <input style={{ ...S.input, borderColor: error ? "#f99" : "#e0e0e0" }} type="password" placeholder="Wachtwoord"
          value={pw} autoFocus onChange={e => { setPw(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && attempt()} />
        {error && <p style={{ color: "#c00", fontSize: 13, marginTop: -8, marginBottom: 12 }}>Onjuist wachtwoord.</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ ...S.button, flex: 1, backgroundColor: "#fff", color: "#111", border: "1.5px solid #e0e0e0" }}>Annuleer</button>
          <button onClick={attempt} style={{ ...S.button, flex: 1 }}>Inloggen</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("name");
  const [name, setName] = useState("");
  const [selected, setSelected] = useState({});
  const [months] = useState(getUpcomingWeekends);

  const monthKey = (y, m) => `${y}-${m}`;

  const toggleDay = (year, month, day) => {
    const key = monthKey(year, month);
    const current = selected[key] || [];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    setSelected({ ...selected, [key]: next });
  };

  const totalSelected = Object.values(selected).flat().length;

  const handleSubmit = () => {
    const dateList = [];
    for (const { year, month } of months) {
      const key = monthKey(year, month);
      for (const d of (selected[key] || []).sort((a,b)=>a-b)) {
        dateList.push(new Date(year, month, d).toISOString().split("T")[0]);
      }
    }
    const existing = storage.get(STORAGE_KEY);
    existing.push({ name, dates: dateList, submittedAt: new Date().toISOString() });
    storage.set(STORAGE_KEY, existing);
    setScreen("thanks");
  };

  if (screen === "adminLogin") return <AdminLogin onSuccess={() => setScreen("admin")} onCancel={() => setScreen("name")} />;
  if (screen === "admin") return <AdminView onExit={() => setScreen("name")} />;

  if (screen === "name") return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.logo}>🍽️</div>
        <h1 style={S.title}>Dinnertje</h1>
        <p style={S.subtitle}>Vul je naam in om te beginnen.</p>
        <input style={S.input} placeholder="Jouw naam" value={name} autoFocus
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && setScreen("calendar")} />
        <button style={{ ...S.button, width: "100%", opacity: name.trim() ? 1 : 0.35, cursor: name.trim() ? "pointer" : "default" }}
          disabled={!name.trim()} onClick={() => setScreen("calendar")}>
          Verder →
        </button>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={() => setScreen("adminLogin")} style={{ background: "none", border: "none", color: "#d0d0d0", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            admin
          </button>
        </div>
      </div>
    </div>
  );

  if (screen === "calendar") return (
    <div style={S.root}>
      <div style={{ ...S.card, maxWidth: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 13, color: "#999", marginBottom: 2 }}>Hoi {name} 👋</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Klik de dagen waarop je kunt</div>
          </div>
          <button style={{ ...S.button, padding: "10px 18px", fontSize: 13, opacity: totalSelected > 0 ? 1 : 0.35, cursor: totalSelected > 0 ? "pointer" : "default" }}
            disabled={totalSelected === 0} onClick={handleSubmit}>Submit</button>
        </div>
        <p style={{ fontSize: 12, color: "#aaa", marginTop: -18, marginBottom: 24 }}>
          Alleen weekenddagen zijn klikbaar.{totalSelected > 0 ? ` ${totalSelected} dag${totalSelected !== 1 ? "en" : ""} geselecteerd.` : ""}
        </p>
        {months.map(({ year, month, days }) => (
          <CalendarMonth key={monthKey(year, month)} year={year} month={month} weekendDays={days}
            selected={selected[monthKey(year, month)] || []} onToggle={d => toggleDay(year, month, d)} />
        ))}
        <button style={{ ...S.button, width: "100%", opacity: totalSelected > 0 ? 1 : 0.35, cursor: totalSelected > 0 ? "pointer" : "default" }}
          disabled={totalSelected === 0} onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
        <h1 style={{ ...S.title, fontSize: 22 }}>Dank je wel, {name}!</h1>
        <p style={{ ...S.subtitle, lineHeight: 1.7 }}>Ouren laat je binnenkort weten op welke dag het volgende dinertje plaatsvindt.</p>
      </div>
    </div>
  );
}

const S = {
  root: { minHeight: "100vh", backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif", padding: "24px 16px" },
  card: { width: "100%", maxWidth: 400 },
  logo: { fontSize: 36, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 700, color: "#111", margin: "0 0 8px", letterSpacing: "-0.02em" },
  subtitle: { fontSize: 15, color: "#666", margin: "0 0 28px", lineHeight: 1.5 },
  input: { width: "100%", padding: "14px 16px", fontSize: 16, border: "1.5px solid #e0e0e0", borderRadius: 10, outline: "none", boxSizing: "border-box", color: "#111", fontFamily: "inherit", marginBottom: 16 },
  button: { backgroundColor: "#111", color: "#fff", border: "none", borderRadius: 10, padding: "14px 24px", fontSize: 15, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", letterSpacing: "-0.01em" },
  btnOutline: { backgroundColor: "#fff", color: "#444", border: "1.5px solid #e0e0e0", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" },
};

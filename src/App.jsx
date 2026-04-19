import { useState, useEffect } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { DEFAULT_CATEGORIES, THEMES, WEEKDAY_TEMPLATES, WEEKEND_TEMPLATES, MONTH_NAMES } from "./constants";
import { toDatetimeLocal, fmt12, fmt12Date, formatDuration, parseToFields, fieldsToDatetime,
         getSavedTheme, saveTheme, getSavedUsername, saveUsername, clearUsername,
         guessIcon, exportToExcel } from "./utils";
import { DynamicFields, DynamicSummary, QuickLocation } from "./DynamicFields";

export default function App() {
  const [tab, setTab]                       = useState("today");
  const [events, setEvents]                 = useState([]);
  const [categories, setCategories]         = useState(DEFAULT_CATEGORIES);
  const [showForm, setShowForm]             = useState(false);
  const [editingEvent, setEditingEvent]     = useState(null);
  const [showCatManager, setShowCatManager] = useState(false);
  const [userId, setUserId]                 = useState(null);
  const [loading, setLoading]               = useState(true);
  const [historySearch, setHistorySearch]   = useState("");
  const [historyFilter, setHistoryFilter]   = useState("all");
  const [expandedEvent, setExpandedEvent]   = useState(null);
  const [expandedDates, setExpandedDates]   = useState({});
  const [statsCatFilter, setStatsCatFilter] = useState(null);
  const [themeId, setThemeId]               = useState(getSavedTheme);
  const [showThemes, setShowThemes]         = useState(false);

  useEffect(() => {
    const saved = getSavedUsername();
    if (saved) setUserId(saved);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) return;
    const eventsUnsub = onSnapshot(collection(db, "userdata", userId, "events"), (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const catUnsub = onSnapshot(doc(db, "userdata", userId, "settings", "categories"), (snap) => {
      if (snap.exists()) setCategories(snap.data().list);
    });
    return () => { eventsUnsub(); catUnsub(); };
  }, [userId]);

  const handleSetUsername = (u) => { saveUsername(u); setUserId(u.trim().toLowerCase()); };
  const handleSwitchUser  = () => { clearUsername(); setUserId(null); setEvents([]); setCategories(DEFAULT_CATEGORIES); };
  const toggleDate        = (date) => setExpandedDates(p => ({ ...p, [date]: !p[date] }));
  const T                 = THEMES[themeId] || THEMES.midnight;
  const changeTheme       = (id) => { saveTheme(id); setThemeId(id); };

  const saveEvent = async (ev) => {
    const id = ev.id || Date.now().toString();
    await setDoc(doc(db, "userdata", userId, "events", id), { ...ev, id });
    setShowForm(false); setEditingEvent(null);
  };
  const deleteEvent = async (id) => { await deleteDoc(doc(db, "userdata", userId, "events", id)); setExpandedEvent(null); };
  const deleteGaps  = async () => {
    const gaps = events.filter(e => e.isGap || e.id?.startsWith("gap_") || e.category === "unutilized" || e.name === "Unutilized Time");
    await Promise.all(gaps.map(e => deleteDoc(doc(db, "userdata", userId, "events", e.id))));
  };
  const duplicateEvent = (ev) => {
    const now = new Date();
    const dur = ev.startDate && ev.endDate ? new Date(ev.endDate) - new Date(ev.startDate) : 3600000;
    setEditingEvent({ ...ev, id: null, name: ev.name + " (copy)", startDate: toDatetimeLocal(now), endDate: toDatetimeLocal(new Date(now.getTime() + dur)) });
    setShowForm(true); setExpandedEvent(null);
  };
  const saveCategories = async (list) => {
    setCategories(list);
    await setDoc(doc(db, "userdata", userId, "settings", "categories"), { list });
  };

  const addTemplateEntries = async () => {
    const now = new Date();
    const dow = now.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const templates = isWeekend ? WEEKEND_TEMPLATES : WEEKDAY_TEMPLATES;
    const p = (n) => String(n).padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
    const nextDay = new Date(now); nextDay.setDate(nextDay.getDate() + 1);
    const nextDateStr = `${nextDay.getFullYear()}-${p(nextDay.getMonth() + 1)}-${p(nextDay.getDate())}`;
    const existing = events.filter(e => e.startDate?.startsWith(dateStr));
    if (existing.length > 0 && !window.confirm(`Today already has ${existing.length} entries. Add templates anyway?`)) return;
    for (const t of templates) {
      const id = `tpl_${dateStr}_${t.category}_${t.startH}${t.startM}`;
      await setDoc(doc(db, "userdata", userId, "events", id), {
        id, name: t.name, category: t.category, location: "", comments: "", fields: t.fields || {},
        startDate: `${dateStr}T${p(t.startH)}:${p(t.startM)}`,
        endDate: t.nextDay ? `${nextDateStr}T${p(t.endH)}:${p(t.endM)}` : `${dateStr}T${p(t.endH)}:${p(t.endM)}`,
      });
    }
  };

  const now = new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  const todayEvents = events.filter(e => e.startDate?.startsWith(todayStr));
  const getCat = (id) => categories.find(c => c.id === id) || { label: id, color: "#6B7280", icon: "📌" };

  if (loading && !userId) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0F0F14", color: "#E8C97E", fontFamily: "Georgia,serif", gap: 16 }}>
      <div style={{ fontSize: 40 }}>📅</div><div style={{ fontSize: 16, letterSpacing: 2 }}>Loading…</div>
    </div>
  );
  if (!userId) return <UsernameScreen onConfirm={handleSetUsername} />;

  return (
    <div style={{ fontFamily: "'Georgia',serif", background: T.bg, minHeight: "100vh", color: T.text, width: "100%", position: "relative", paddingBottom: 80 }}>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        html,body { width:100%; overflow-x:hidden; }
        input,textarea,select { font-family:inherit; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        .cw { max-width:680px; margin:0 auto; padding:0 14px; }
      `}</style>

      {/* Header */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div className="cw" style={{ padding: "14px 14px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 3, color: T.textMuted, textTransform: "uppercase" }}>Life Log</div>
              <div style={{ fontSize: 17, color: T.accent, fontStyle: "italic" }}>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button onClick={() => exportToExcel(events, categories)} style={bs(T)}>📥</button>
              {events.some(e => e.isGap || e.id?.startsWith("gap_") || e.category === "unutilized") && <button onClick={deleteGaps} style={{ ...bs(T), borderColor: "#EF4444", color: "#EF4444" }}>🗑 Gaps</button>}
              <button onClick={() => setShowThemes(true)} style={bs(T)}>🎨</button>
              <button onClick={() => setShowCatManager(true)} style={bs(T)}>⚙️</button>
              <button onClick={handleSwitchUser} style={{ ...bs(T), color: T.accent, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>👤{userId}</button>
            </div>
          </div>
          <div style={{ display: "flex" }}>
            {[["today", "Today"], ["history", "History"], ["stats", "Stats"]].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ flex: 1, background: "none", border: "none", borderBottom: `2px solid ${tab === id ? T.accent : "transparent"}`, color: tab === id ? T.accent : T.textMuted, padding: "8px 0", cursor: "pointer", fontSize: 13, transition: "all 0.2s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TODAY */}
      {tab === "today" && (
        <div className="cw" style={{ paddingTop: 14, paddingBottom: 14, animation: "fadeIn 0.3s ease" }}>
          {todayEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: T.textMuted }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📅</div>
              <div style={{ marginBottom: 14 }}>No entries today</div>
              <button onClick={addTemplateEntries} style={{ background: T.accent, color: T.accentText, border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: "bold", cursor: "pointer" }}>
                ✨ Fill from template
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                <button onClick={addTemplateEntries} style={{ ...bs(T), fontSize: 12 }}>✨ Template</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[...todayEvents].sort((a, b) => a.startDate > b.startDate ? 1 : -1).map(ev => (
                  <EventCard key={ev.id} ev={ev} getCat={getCat} T={T}
                    expanded={expandedEvent === ev.id}
                    onToggle={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                    onEdit={() => { setEditingEvent(ev); setShowForm(true); }}
                    onDuplicate={() => duplicateEvent(ev)}
                    onDelete={() => deleteEvent(ev.id)} />
                ))}
              </div>
            </>
          )}
          <FAB onClick={() => { setEditingEvent(null); setShowForm(true); }} T={T} />
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div className="cw" style={{ paddingTop: 14, paddingBottom: 14, animation: "fadeIn 0.3s ease" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Search…"
              style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 14 }} />
            <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px", color: T.text, fontSize: 13 }}>
              <option value="all">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          {(() => {
            const filtered = events.filter(ev => {
              const s = historySearch.toLowerCase();
              return (!s || ev.name?.toLowerCase().includes(s) || ev.location?.toLowerCase().includes(s)) && (historyFilter === "all" || ev.category === historyFilter);
            }).sort((a, b) => a.startDate > b.startDate ? 1 : -1);
            if (filtered.length === 0) return <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>No entries found</div>;
            const grouped = {};
            filtered.forEach(ev => { const d = ev.startDate?.split("T")[0] || "Unknown"; (grouped[d] = grouped[d] || []).push(ev); });
            return Object.entries(grouped).sort((a, b) => a[0] > b[0] ? -1 : 1).map(([date, evs]) => {
              const isToday = date === todayStr;
              const isOpen  = isToday || !!expandedDates[date];
              const label   = isToday ? "Today" : new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
              const totalMs = evs.reduce((s, ev) => { const ms = ev.startDate && ev.endDate ? new Date(ev.endDate) - new Date(ev.startDate) : 0; return s + (ms > 0 ? ms : 0); }, 0);
              return (
                <div key={date} style={{ marginBottom: 8 }}>
                  <div onClick={() => !isToday && toggleDate(date)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${isToday ? T.accent : T.textMuted}`, borderRadius: 10, padding: "10px 14px", cursor: isToday ? "default" : "pointer", marginBottom: isOpen ? 8 : 0 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: "bold", color: isToday ? T.accent : T.text }}>{label}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{evs.length} {evs.length === 1 ? "entry" : "entries"}{totalMs > 0 ? ` · ${formatDuration(totalMs)} logged` : ""}</div>
                    </div>
                    {!isToday && <div style={{ fontSize: 18, color: T.textMuted, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none" }}>›</div>}
                  </div>
                  {isOpen && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {evs.map(ev => (
                        <EventCard key={ev.id} ev={ev} getCat={getCat} T={T}
                          expanded={expandedEvent === ev.id}
                          onToggle={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                          onEdit={() => { setEditingEvent(ev); setShowForm(true); }}
                          onDuplicate={() => duplicateEvent(ev)}
                          onDelete={() => deleteEvent(ev.id)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            });
          })()}
          <FAB onClick={() => { setEditingEvent(null); setShowForm(true); }} T={T} />
        </div>
      )}

      {/* STATS */}
      {tab === "stats" && (
        <StatsTab events={events} categories={categories} getCat={getCat} T={T}
          statsCatFilter={statsCatFilter} setStatsCatFilter={setStatsCatFilter}
          onEdit={(ev) => { setEditingEvent(ev); setShowForm(true); }} />
      )}

      {showForm && <EventForm initial={editingEvent} categories={categories} onSave={saveEvent} T={T} onClose={() => { setShowForm(false); setEditingEvent(null); }} />}
      {showCatManager && <CategoryManager categories={categories} onSave={saveCategories} T={T} onClose={() => setShowCatManager(false)} />}
      {showThemes && <ThemePicker current={themeId} themes={THEMES} T={T} onChange={changeTheme} onClose={() => setShowThemes(false)} />}

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.surface, borderTop: `1px solid ${T.border}`, display: "flex", padding: "8px 0", zIndex: 40 }}>
        {[["today", "📅", "Today"], ["history", "🗂", "History"], ["stats", "📊", "Stats"]].map(([id, icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, background: "none", border: "none", color: tab === id ? T.accent : T.textMuted, cursor: "pointer", padding: "6px 0", fontSize: 11, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>{label}
          </button>
        ))}
      </div>
    </div>
  );
}

const bs = (T) => ({ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "6px 10px", cursor: "pointer", fontSize: 12 });
const FAB = ({ onClick, T }) => (
  <button onClick={onClick} style={{ position: "fixed", bottom: 72, right: 20, width: 52, height: 52, borderRadius: "50%", background: T.accent, color: T.accentText, fontSize: 26, border: "none", cursor: "pointer", boxShadow: `0 4px 20px ${T.accent}66`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", zIndex: 50 }}>+</button>
);

// ─── Module-level category ID mapper ─────────────────────────────
const mapCatId = (id) => {
  const l = (id||"").toLowerCase();
  if (l.includes("breakfast")) return "breakfast";
  if (l.includes("lunch"))     return "lunch";
  if (l.includes("dinner"))    return "dinner";
  if (l.includes("drive")||l.includes("car")) return "drive";
  if (l.includes("movie"))     return "movie";
  if (l.includes("exercise")||l.includes("gym")||l.includes("walk")) return "exercise";
  if (l.includes("reading")||l.includes("book")) return "reading";
  if (l.includes("cleaning"))  return "cleaning";
  if (l.includes("work")||l.includes("trading")) return "work";
  if (l.includes("happy"))     return "happy_times";
  if (l.includes("groom"))     return "grooming";
  return id;
};

// ─── EventCard ────────────────────────────────────────────────────
function EventCard({ ev, getCat, expanded, onToggle, onEdit, onDelete, onDuplicate, T }) {
  const cat = getCat(ev.category);
  const start = ev.startDate ? new Date(ev.startDate) : null;
  const end   = ev.endDate   ? new Date(ev.endDate)   : null;
  const dur   = start && end  ? end - start : null;
  return (
    <div style={{ background: T.surface, borderRadius: 12, overflow: "hidden", border: `1px solid ${T.border}`, borderLeft: `3px solid ${cat.color}`, animation: "slideUp 0.2s ease" }}>
      <div onClick={onToggle} style={{ padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ fontSize: 20, minWidth: 28, textAlign: "center", marginTop: 2 }}>{cat.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: "bold", fontSize: 14, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {cat.label}
          </div>
          {ev.name && ev.name !== cat.label && (
            <div style={{ fontSize: 13, color: T.text, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.name}</div>
          )}
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{ev.location && <span>📍{ev.location}</span>}</div>
          {start && (
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
              🕐 {fmt12(ev.startDate)}{end ? <span> → {fmt12(ev.endDate)}</span> : ""}
              {dur && dur > 0 && <span style={{ color: cat.color }}> · {formatDuration(dur)}</span>}
            </div>
          )}
          {ev.fields && Object.keys(ev.fields).length > 0 && <DynamicSummary category={mapCatId(ev.category)} fields={ev.fields} T={T} />}
        </div>
        <div style={{ fontSize: 14, color: T.textMuted, marginTop: 2 }}>{expanded ? "▾" : "▸"}</div>
      </div>
      {expanded && (
        <div style={{ padding: "0 14px 12px", borderTop: `1px solid ${T.border}` }}>
          {ev.location && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 8 }}>📍 {ev.location}</div>}
          {start && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6 }}>🕐 {fmt12Date(ev.startDate)}{end ? ` → ${fmt12(ev.endDate)}` : ""}{dur && dur > 0 ? ` (${formatDuration(dur)})` : ""}</div>}
          {ev.comments && <div style={{ fontSize: 13, color: T.textMuted, marginTop: 6, fontStyle: "italic" }}>{ev.comments}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={onEdit}      style={{ flex: 1, background: T.surface2, border: "none", borderRadius: 8, color: T.accent,   padding: "8px", cursor: "pointer", fontSize: 13 }}>✏️ Edit</button>
            <button onClick={onDuplicate} style={{ flex: 1, background: T.surface2, border: "none", borderRadius: 8, color: T.accent,   padding: "8px", cursor: "pointer", fontSize: 13 }}>📋 Copy</button>
            <button onClick={onDelete}    style={{ flex: 1, background: "#2A1A1A",  border: "none", borderRadius: 8, color: "#EF4444", padding: "8px", cursor: "pointer", fontSize: 13 }}>🗑 Del</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TimeInput ────────────────────────────────────────────────────
function TimeInput({ label, value, onChange, T }) {
  const f  = parseToFields(value);
  const up = (k, v) => onChange(fieldsToDatetime({ ...f, [k]: v }));
  const s  = { background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 16, padding: "10px 8px", textAlign: "center", width: "100%" };
  return (
    <div>
      <div style={{ fontSize: 12, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <input type="date" value={f.date} onChange={e => up("date", e.target.value)} style={{ ...s, colorScheme: "dark", textAlign: "left", padding: "10px 12px", marginBottom: 6 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 8px 1fr 1fr", gap: 4, alignItems: "center" }}>
        <input type="number" min="1" max="12" value={f.hour}   onChange={e => up("hour", e.target.value)}   onFocus={e => e.target.select()} placeholder="HH" style={s} />
        <span style={{ color: T.textMuted, textAlign: "center", fontWeight: "bold" }}>:</span>
        <input type="number" min="0" max="59" value={f.minute} onChange={e => up("minute", String(e.target.value).padStart(2, "0"))} onFocus={e => e.target.select()} placeholder="MM" style={s} />
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {["AM", "PM"].map(ap => (
            <button key={ap} onClick={() => up("ampm", ap)}
              style={{ background: f.ampm === ap ? T.accent : T.surface, border: `1px solid ${T.border}`, borderRadius: 6, color: f.ampm === ap ? T.accentText : T.textMuted, fontSize: 12, fontWeight: "bold", padding: "4px 2px", cursor: "pointer" }}>
              {ap}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EventForm ────────────────────────────────────────────────────
function EventForm({ initial, categories, onSave, onClose, T }) {
  const now = new Date();
  const [form, setForm] = useState({
    name:      initial?.name      || "",
    category:  initial?.category  || categories[0]?.id || "",
    location:  initial?.location  || "",
    startDate: initial?.startDate || toDatetimeLocal(now),
    endDate:   initial?.endDate   || toDatetimeLocal(new Date(now.getTime() + 3600000)),
    comments:  initial?.comments  || "",
    fields:    initial?.fields    || {},
    id:        initial?.id        || null,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const cat = categories.find(c => c.id === form.category);

  // Match category by ID — checks if category id contains the keyword
  const catId = (form.category || "").toLowerCase();
  const catIs  = (...keys) => keys.some(k => catId === k || catId.startsWith(k+"_") || catId.includes("_"+k));
  const hasDynamic    = ["drive","breakfast","lunch","dinner","movie","exercise","reading","cleaning","work","happy_times","grooming","school_prep","med_clinic","time_for_others"].some(k => form.category === k || form.category.startsWith(k+"_") || form.category.includes(k));
  const HIDE_NAME_IDS  = ["movie","exercise","breakfast","lunch","dinner","drive","cleaning","reading","work","happy_times","grooming","school_prep","med_clinic","sleep"];
  const hideNameField  = HIDE_NAME_IDS.some(k => form.category === k || form.category.includes(k))
    || (cat?.label||"").toLowerCase().includes("groom")
    || (cat?.label||"").toLowerCase().includes("school prep")
    || (cat?.label||"").toLowerCase().includes("dharak");
  const hideLocation  = ["breakfast","lunch","dinner","movie","exercise","cleaning","work","drive","happy_times","grooming","school_prep","med_clinic"].some(k => form.category === k || form.category.startsWith(k+"_") || form.category.includes(k));

  // Map local category id to dynamic field category key
  const getDynCat = (id) => {
    const l = (id||"").toLowerCase();
    if (l.includes("breakfast")) return "breakfast";
    if (l.includes("lunch"))     return "lunch";
    if (l.includes("dinner"))    return "dinner";
    if (l.includes("drive") || l.includes("car")) return "drive";
    if (l.includes("movie"))     return "movie";
    if (l.includes("exercise") || l.includes("gym") || l.includes("walk")) return "exercise";
    if (l.includes("reading") || l.includes("book")) return "reading";
    if (l.includes("cleaning"))  return "cleaning";
    if (l.includes("work") || l.includes("trading")) return "work";
    if (l.includes("happy"))     return "happy_times";
    if (l.includes("groom"))     return "grooming";
    if (l.includes("med")||l.includes("clinic")||l.includes("hospital")) return "med_clinic";
    if (l.includes("time_for")||l.includes("others")) return "time_for_others";
    return id;
  };

  // Categories that auto-set their name from the category label (no manual name needed)
  const AUTO_NAME_CATS = ["drive","breakfast","lunch","dinner","movie","exercise","reading","cleaning","work","sleep","grooming","school_prep","news","happy_times","med_clinic","time_for_others"];

  const setCategory = (id) => {
    const c = categories.find(x => x.id === id);
    const HIDE_NAME_IDS2 = ["movie","exercise","breakfast","lunch","dinner","drive","cleaning","reading","work","happy_times","grooming","school_prep","med_clinic","time_for_others","sleep"];
    const newHideName = HIDE_NAME_IDS2.some(k => id === k || id.includes(k))
      || (c?.label||"").toLowerCase().includes("groom")
      || (c?.label||"").toLowerCase().includes("school prep")
      || (c?.label||"").toLowerCase().includes("dharak");
    const newName = newHideName ? (c?.label || id) : "";
    setForm(p => ({ ...p, category: id, fields: {}, name: newName }));
  };

  const handleSave = async () => {
    // For auto-name cats, name is always the category label
    const finalName = hideNameField
      ? (cat?.label || form.category)
      : form.name.trim();
    if (!finalName) { alert("Event name is required"); return; }
    setSaving(true); await onSave({ ...form, name: finalName }); setSaving(false);
  };

  const inpStyle = { width: "100%", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 12px", color: T.text, fontSize: 16, marginTop: 6 };
  const lbl = { fontSize: 12, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: T.surface, width: "100%", maxWidth: 680, margin: "0 auto", borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "94vh", overflowY: "auto", paddingBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 17, color: T.accent, fontStyle: "italic" }}>{initial?.id ? "Edit Entry" : "New Entry"}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Category */}
          <div>
            <div style={lbl}>Category</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {categories.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  style={{ padding: "6px 10px", borderRadius: 20, border: `1px solid ${form.category === c.id ? c.color : T.border}`, background: form.category === c.id ? c.color + "22" : "transparent", color: form.category === c.id ? c.color : T.textMuted, fontSize: 12, cursor: "pointer" }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          {/* Name — only show for non-auto categories */}
          {!hideNameField && (
            <div>
              <div style={lbl}>{catIs("time_for","others") ? "Person Name *" : "Event Name *"}</div>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder={catIs("time_for","others") ? "Who did you spend time with?" : "What did you do?"}
                style={inpStyle} />
            </div>
          )}
          {/* Dynamic fields */}
          {hasDynamic && (
            <div style={{ background: T.surface2, borderRadius: 10, padding: "12px 14px", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11, color: T.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Details</div>
              <DynamicFields category={getDynCat(form.category)} fields={form.fields} onChange={v => set("fields", v)} T={T} />
            </div>
          )}
          {/* Location */}
          {!hideLocation && (
            <div>
              <div style={lbl}>Location</div>
              <QuickLocation value={form.location} onChange={v => set("location", v)} T={T} />
            </div>
          )}
          {/* Time */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <TimeInput label="Start" value={form.startDate} onChange={v => set("startDate", v)} T={T} />
            <TimeInput label="End"   value={form.endDate}   onChange={v => set("endDate", v)}   T={T} />
          </div>
          {/* Comments */}
          <div>
            <div style={lbl}>Comments</div>
            <textarea value={form.comments} onChange={e => set("comments", e.target.value)} placeholder="Notes…" rows={2}
              style={{ ...inpStyle, resize: "none", lineHeight: 1.5 }} />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ background: saving ? "#a0924f" : T.accent, color: T.accentText, border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: "bold", cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving…" : initial?.id ? "Save Changes" : "Add Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── StatsTab ─────────────────────────────────────────────────────
function StatsTab({ events, categories, getCat, statsCatFilter, setStatsCatFilter, T, onEdit }) {
  const now = new Date();
  const [statsView, setStatsView] = useState("category");
  const cardStyle = { background: T.surface, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` };
  const Bar = ({ value, max, color }) => (
    <div style={{ height: 6, background: T.surface2, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color || T.accent, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  );

  if (statsCatFilter) {
    const cat = getCat(statsCatFilter);
    const catEvents = events.filter(e => e.category === statsCatFilter).sort((a, b) => a.startDate > b.startDate ? 1 : -1);
    return (
      <div className="cw" style={{ paddingTop: 14, paddingBottom: 14, animation: "fadeIn 0.3s ease" }}>
        <button onClick={() => setStatsCatFilter(null)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "6px 12px", cursor: "pointer", fontSize: 13, marginBottom: 12 }}>← Back</button>
        <div style={{ ...cardStyle, borderLeft: `4px solid ${cat.color}`, marginBottom: 12 }}>
          <div style={{ fontSize: 18 }}>{cat.icon} <span style={{ color: cat.color }}>{cat.label}</span></div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>{catEvents.length} entries</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {catEvents.map(ev => {
            const dur = ev.startDate && ev.endDate ? new Date(ev.endDate) - new Date(ev.startDate) : 0;
            return (
              <div key={ev.id} style={{ ...cardStyle, borderLeft: `3px solid ${cat.color}`, cursor: "pointer" }} onClick={() => onEdit(ev)}>
                <div style={{ fontWeight: "bold", fontSize: 14, color: T.text }}>
                  {cat.icon} {cat.label}
                  {ev.startDate && <span style={{ fontSize:12, color:T.textMuted, fontWeight:"normal", marginLeft:8 }}>{fmt12Date(ev.startDate)}</span>}
                </div>
                {ev.location && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>📍 {ev.location}</div>}
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3 }}>
                  {ev.startDate && fmt12(ev.startDate)}{ev.endDate && ` → ${fmt12(ev.endDate)}`}
                  {dur > 0 && <span style={{ color: cat.color }}> · {formatDuration(dur)}</span>}
                </div>
                {ev.fields && Object.keys(ev.fields).length > 0 && <DynamicSummary category={mapCatId(ev.category)} fields={ev.fields} T={T} />}
                {ev.comments && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4, fontStyle: "italic" }}>{ev.comments}</div>}
                <div style={{ fontSize: 11, color: T.accent, marginTop: 6 }}>Tap to edit →</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (events.length === 0) return <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}><div style={{ fontSize: 40, marginBottom: 12 }}>📊</div><div>Add entries to see stats</div></div>;

  const catTime = {}, catCounts = {}, locCounts = {}, locTime = {}, monthlyCounts = {}, monthlyTime = {};
  events.forEach(ev => {
    catCounts[ev.category] = (catCounts[ev.category] || 0) + 1;
    const loc = (ev.location || "").trim();
    if (loc) locCounts[loc] = (locCounts[loc] || 0) + 1;
    if (!ev.startDate || !ev.endDate) return;
    const ms = new Date(ev.endDate) - new Date(ev.startDate);
    if (ms <= 0) return;
    catTime[ev.category] = (catTime[ev.category] || 0) + ms;
    if (loc) locTime[loc] = (locTime[loc] || 0) + ms;
    const d = new Date(ev.startDate), key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyCounts[key] = (monthlyCounts[key] || 0) + 1; monthlyTime[key] = (monthlyTime[key] || 0) + ms;
  });
  const mxCT = Math.max(...Object.values(catTime), 1), mxCC = Math.max(...Object.values(catCounts), 1);
  const mxLC = Math.max(...Object.values(locCounts), 1), mxLT = Math.max(...Object.values(locTime), 1);
  const mxMC = Math.max(...Object.values(monthlyCounts), 1);
  const curMK = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setStatsView(id)}
      style={{ flex: 1, background: "none", border: "none", borderBottom: `2px solid ${statsView === id ? T.accent : "transparent"}`, color: statsView === id ? T.accent : T.textMuted, padding: "9px 0", cursor: "pointer", fontSize: 12, transition: "all 0.2s" }}>
      {label}
    </button>
  );

  return (
    <div className="cw" style={{ paddingTop: 14, paddingBottom: 14, animation: "fadeIn 0.3s ease", display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}`, overflow: "hidden" }}>
        <TabBtn id="category" label="📂 Category" />
        <TabBtn id="location" label="📍 Location" />
        <TabBtn id="monthly"  label="📅 Monthly"  />
      </div>

      {statsView === "category" && (<>
        {Object.keys(catTime).length > 0 && (
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Time by Category <span style={{ fontSize: 10 }}>(tap to drill down)</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(catTime).sort((a, b) => b[1] - a[1]).map(([id, ms]) => {
                const cat = getCat(id);
                return (
                  <div key={id} onClick={() => setStatsCatFilter(id)} style={{ cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: T.text }}>{cat.icon} {cat.label}</span>
                      <span style={{ fontSize: 13, color: cat.color, fontWeight: "bold" }}>{formatDuration(ms)} →</span>
                    </div>
                    <Bar value={ms} max={mxCT} color={cat.color} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {Object.keys(catCounts).length > 0 && (
          <div style={cardStyle}>
            <div style={{ fontSize: 12, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Count by Category <span style={{ fontSize: 10 }}>(tap to drill down)</span></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(catCounts).sort((a, b) => b[1] - a[1]).map(([id, count]) => {
                const cat = getCat(id);
                return (
                  <div key={id} onClick={() => setStatsCatFilter(id)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "3px 0" }}>
                    <div style={{ width: 120, fontSize: 12, color: T.textMuted, display: "flex", alignItems: "center", gap: 5 }}>
                      <span>{cat.icon}</span><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.label}</span>
                    </div>
                    <div style={{ flex: 1 }}><Bar value={count} max={mxCC} color={cat.color} /></div>
                    <div style={{ fontSize: 13, color: cat.color, fontWeight: "bold", minWidth: 24, textAlign: "right" }}>{count} →</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>)}

      {statsView === "location" && (
        Object.keys(locCounts).length === 0
          ? <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>No location data yet.<br />Add locations when creating entries.</div>
          : (<>
            <div style={cardStyle}>
              <div style={{ fontSize: 12, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Visits by Location</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(locCounts).sort((a, b) => b[1] - a[1]).map(([loc, count]) => (
                  <div key={loc}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: T.text }}>📍 {loc}</span>
                      <span style={{ fontSize: 13, color: T.accent, fontWeight: "bold" }}>{count}</span>
                    </div>
                    <Bar value={count} max={mxLC} />
                  </div>
                ))}
              </div>
            </div>
            {Object.keys(locTime).length > 0 && (
              <div style={cardStyle}>
                <div style={{ fontSize: 12, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Time by Location</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(locTime).sort((a, b) => b[1] - a[1]).map(([loc, ms]) => (
                    <div key={loc}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: T.text }}>📍 {loc}</span>
                        <span style={{ fontSize: 13, color: T.accent, fontWeight: "bold" }}>{formatDuration(ms)}</span>
                      </div>
                      <Bar value={ms} max={mxLT} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>)
      )}

      {statsView === "monthly" && (
        Object.keys(monthlyCounts).length === 0
          ? <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>No monthly data yet.</div>
          : <div style={cardStyle}>
            <div style={{ fontSize: 12, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Monthly Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {Object.entries(monthlyCounts).sort((a, b) => b[0] > a[0] ? -1 : 1).map(([key, count]) => {
                const [y, m] = key.split("-"), isCur = key === curMK, ms = monthlyTime[key] || 0;
                return (
                  <div key={key} style={{ borderLeft: `3px solid ${isCur ? T.accent : T.border}`, paddingLeft: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 14, color: isCur ? T.accent : T.text, fontWeight: isCur ? "bold" : "normal" }}>{MONTH_NAMES[parseInt(m) - 1]} {y}{isCur ? " ← now" : ""}</div>
                      <div style={{ fontSize: 13, color: T.accent, fontWeight: "bold" }}>{count} entries</div>
                    </div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6 }}>⏱ {ms > 0 ? formatDuration(ms) : "—"} · avg {ms > 0 ? formatDuration(Math.round(ms / count)) : "—"}/entry</div>
                    <Bar value={count} max={mxMC} />
                  </div>
                );
              })}
            </div>
          </div>
      )}
    </div>
  );
}

// ─── CategoryManager ──────────────────────────────────────────────
function CategoryManager({ categories, onSave, onClose, T }) {
  const [list, setList]         = useState(categories.map(c => ({ ...c })));
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon]   = useState("📌");
  const [newColor, setNewColor] = useState("#6B7280");
  const [saving, setSaving]     = useState(false);

  const inp = { background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 14, padding: "8px 10px" };
  const handleLabelChange = (val) => { setNewLabel(val); setNewIcon(guessIcon(val)); };
  const addCat    = () => { if (!newLabel.trim()) return; const id = newLabel.toLowerCase().replace(/\s+/g,"_")+"_"+Date.now(); setList(p=>[...p,{id,label:newLabel.trim(),icon:newIcon,color:newColor}]); setNewLabel(""); setNewIcon("📌"); setNewColor("#6B7280"); };
  const removeCat = (id) => { if (list.length <= 1) return; setList(p => p.filter(c => c.id !== id)); };
  const updateCat = (id, k, v) => setList(p => p.map(c => c.id === id ? { ...c, [k]: v } : c));
  const handleSave = async () => { setSaving(true); await onSave(list); setSaving(false); onClose(); };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: T.surface, width: "100%", maxWidth: 680, margin: "0 auto", borderRadius: "20px 20px 0 0", padding: 20, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 17, color: T.accent, fontStyle: "italic" }}>Manage Categories</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {list.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, background: T.surface2, borderRadius: 10, padding: "8px 12px", borderLeft: `3px solid ${c.color}` }}>
              <input value={c.icon}  onChange={e => updateCat(c.id, "icon",  e.target.value)} style={{ ...inp, width: 44, textAlign: "center", fontSize: 20, padding: "4px" }} />
              <input value={c.label} onChange={e => updateCat(c.id, "label", e.target.value)} style={{ ...inp, flex: 1 }} />
              <input type="color" value={c.color} onChange={e => updateCat(c.id, "color", e.target.value)} style={{ width: 34, height: 34, border: `1px solid ${T.border}`, borderRadius: 6, background: "none", cursor: "pointer", padding: 2 }} />
              <button onClick={() => removeCat(c.id)} style={{ background: "none", border: "none", color: "#EF4444", fontSize: 18, cursor: "pointer" }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ background: T.surface2, borderRadius: 12, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Add New Category</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input value={newIcon}  onChange={e => setNewIcon(e.target.value)}   style={{ ...inp, width: 50, textAlign: "center", fontSize: 20 }} />
            <input value={newLabel} onChange={e => handleLabelChange(e.target.value)} placeholder="Category name…" style={{ ...inp, flex: 1 }} />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: 42, height: 42, border: `1px solid ${T.border}`, borderRadius: 8, background: "none", cursor: "pointer", padding: 2 }} />
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>💡 Icon auto-suggests as you type</div>
          <button onClick={addCat} style={{ width: "100%", background: T.surface, color: T.accent, border: `1px solid ${T.accent}44`, borderRadius: 8, padding: "10px", fontSize: 14, cursor: "pointer" }}>+ Add</button>
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ width: "100%", background: saving ? "#a0924f" : T.accent, color: T.accentText, border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: "bold", cursor: saving ? "wait" : "pointer" }}>
          {saving ? "Saving…" : "Save Categories"}
        </button>
      </div>
    </div>
  );
}

// ─── ThemePicker ──────────────────────────────────────────────────
function ThemePicker({ current, themes, T, onChange, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "flex-end" }}>
      <div style={{ background: T.surface, width: "100%", maxWidth: 680, margin: "0 auto", borderRadius: "20px 20px 0 0", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 17, color: T.accent, fontStyle: "italic" }}>🎨 Choose Theme</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 24, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {Object.values(themes).map(theme => (
            <button key={theme.id} onClick={() => { onChange(theme.id); onClose(); }}
              style={{ background: theme.bg, border: current === theme.id ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{theme.emoji}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: "bold", color: theme.text }}>{theme.name}</div>
                <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                  {[theme.bg, theme.surface, theme.accent, theme.surface2].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c, border: `1px solid ${theme.border}` }} />)}
                </div>
              </div>
              {current === theme.id && <div style={{ marginLeft: "auto", color: theme.accent }}>✓</div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── UsernameScreen ───────────────────────────────────────────────
function UsernameScreen({ onConfirm }) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const handle = () => {
    const u = username.trim().toLowerCase();
    if (u.length < 3) { setError("Min 3 characters"); return; }
    if (!/^[a-z0-9_]+$/.test(u)) { setError("Letters, numbers and _ only"); return; }
    onConfirm(u);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0F0F14", fontFamily: "Georgia,serif", padding: 24 }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>📅</div>
      <div style={{ fontSize: 26, color: "#E8C97E", fontStyle: "italic", marginBottom: 8 }}>Life Log</div>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 36, textAlign: "center" }}>Enter a username to access your data.<br />Same username on all devices = synced data.</div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <input value={username} onChange={e => { setUsername(e.target.value); setError(""); }} onKeyDown={e => e.key === "Enter" && handle()} placeholder="e.g. dinesh_raj" autoFocus
          style={{ width: "100%", background: "#1A1A24", border: "1px solid #333", borderRadius: 10, padding: "14px 16px", color: "#F0EDE8", fontSize: 18, textAlign: "center", outline: "none" }} />
        {error && <div style={{ color: "#EF4444", fontSize: 12, marginTop: 6, textAlign: "center" }}>{error}</div>}
        <button onClick={handle} style={{ width: "100%", marginTop: 12, background: "#E8C97E", color: "#0F0F14", border: "none", borderRadius: 10, padding: "13px", fontSize: 16, fontWeight: "bold", cursor: "pointer" }}>Let's Go →</button>
        <div style={{ fontSize: 11, color: "#444", marginTop: 14, textAlign: "center", lineHeight: 1.6 }}>💡 Write down your username — it's your key to your data.</div>
      </div>
    </div>
  );
}

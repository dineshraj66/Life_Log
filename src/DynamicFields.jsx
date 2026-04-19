// DynamicFields.jsx — category-specific dynamic form fields
import { useState } from "react";

const QUICK_LOCS = ["ManavalaNagar", "Kilpauk", "Krishnapuram"];

function QuickLocation({ value, onChange, T }) {
  const isQuick = QUICK_LOCS.includes(value);
  const [showInput, setShowInput] = useState(!isQuick && !!value);

  const select = (loc) => {
    if (value === loc) { onChange(""); setShowInput(false); }
    else { onChange(loc); setShowInput(false); }
  };
  const handleOther = () => {
    onChange("");
    setShowInput(true);
  };

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: showInput || (!isQuick && value) ? 8 : 0 }}>
        {QUICK_LOCS.map(loc => (
          <button key={loc} onClick={() => select(loc)}
            style={{ padding: "7px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
              border: `1px solid ${value === loc ? T.accent : T.border}`,
              background: value === loc ? T.accent + "22" : "transparent",
              color: value === loc ? T.accent : T.textMuted }}>
            📍 {loc}
          </button>
        ))}
        <button onClick={handleOther}
          style={{ padding: "7px 12px", borderRadius: 20, fontSize: 13, cursor: "pointer",
            border: `1px solid ${showInput || (!isQuick && value) ? T.accent : T.border}`,
            background: showInput || (!isQuick && value) ? T.accent + "22" : "transparent",
            color: showInput || (!isQuick && value) ? T.accent : T.textMuted }}>
          ✏️ Other
        </button>
      </div>
      {(showInput || (!isQuick && value)) && (
        <input value={(!isQuick ? value : "")} onChange={e => onChange(e.target.value)}
          placeholder="Enter location…"
          style={{ width: "100%", background: T.surface2, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "10px 12px", color: T.text, fontSize: 16 }} />
      )}
    </div>
  );
}
export { QuickLocation };

const ToggleGroup = ({ options, value, onChange, T }) => (
  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
    {options.map(opt => (
      <button key={opt} onClick={() => onChange(opt)}
        style={{ padding:"7px 14px", borderRadius:20,
          border:`1px solid ${value===opt ? T.accent : T.border}`,
          background:value===opt ? T.accent+"22" : "transparent",
          color:value===opt ? T.accent : T.textMuted,
          fontSize:13, cursor:"pointer" }}>
        {opt}
      </button>
    ))}
  </div>
);

const MultiCheck = ({ options, values=[], onChange, T }) => (
  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:6 }}>
    {options.map(opt => {
      const checked = values.includes(opt);
      return (
        <button key={opt} onClick={() => onChange(checked ? values.filter(v=>v!==opt) : [...values, opt])}
          style={{ padding:"7px 14px", borderRadius:20,
            border:`1px solid ${checked ? T.accent : T.border}`,
            background:checked ? T.accent+"22" : "transparent",
            color:checked ? T.accent : T.textMuted,
            fontSize:13, cursor:"pointer" }}>
          {checked ? "✓ " : ""}{opt}
        </button>
      );
    })}
  </div>
);

const Inp = ({ value, onChange, placeholder, T, type="text" }) => (
  <input type={type} value={value||""} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder}
    style={{ width:"100%", background:T.surface2, border:`1px solid ${T.border}`,
      borderRadius:8, padding:"10px 12px", color:T.text, fontSize:16, marginTop:6 }} />
);

const Label = ({ children, T }) => (
  <div style={{ fontSize:12, color:T.textMuted, letterSpacing:1,
    textTransform:"uppercase", marginTop:12, marginBottom:2 }}>{children}</div>
);

// ─── Movie sub-form (reused inside Happy Times too) ────────────────
function MovieFields({ fields, set, T }) {
  return (
    <>
      <Label T={T}>Movie Name</Label>
      <Inp value={fields.movieName} onChange={v=>set("movieName",v)} placeholder="Movie title" T={T} />
      <Label T={T}>Watched At</Label>
      <ToggleGroup options={["Home","Theatre"]} value={fields.watchedAt} onChange={v=>set("watchedAt",v)} T={T} />
      {fields.watchedAt === "Home" && (
        <>
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.location||""} onChange={v=>set("location",v)} T={T} />
        </>
      )}
      {fields.watchedAt === "Theatre" && (
        <>
          <Label T={T}>Theatre Name</Label>
          <Inp value={fields.theatreName} onChange={v=>set("theatreName",v)} placeholder="Theatre name" T={T} />
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.theatreLocation||""} onChange={v=>set("theatreLocation",v)} T={T} />
        </>
      )}
    </>
  );
}

// ─── Category field renderers ──────────────────────────────────────
export function DynamicFields({ category, fields={}, onChange, T }) {
  const set = (k,v) => onChange({ ...fields, [k]:v });

  // ── Car Drive — no location needed (From/To covers it) ──
  if (category === "drive") return (
    <div>
      <Label T={T}>From</Label>
      <Inp value={fields.from} onChange={v=>set("from",v)} placeholder="Starting point" T={T} />
      <Label T={T}>To</Label>
      <Inp value={fields.to} onChange={v=>set("to",v)} placeholder="Destination" T={T} />
    </div>
  );

  // ── Breakfast / Lunch / Dinner ──
  if (["breakfast","lunch","dinner"].includes(category)) return (
    <div>
      <Label T={T}>Food Type</Label>
      <ToggleGroup options={["Veg","Non-Veg"]} value={fields.foodType} onChange={v=>set("foodType",v)} T={T} />
      <Label T={T}>Item Name</Label>
      <Inp value={fields.itemName} onChange={v=>set("itemName",v)} placeholder="What did you eat?" T={T} />
      <Label T={T}>Where</Label>
      <ToggleGroup options={["Home","Restaurant"]} value={fields.where} onChange={v=>set("where",v)} T={T} />
      {fields.where === "Home" && (
        <>
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.homeLocation||""} onChange={v=>set("homeLocation",v)} T={T} />
        </>
      )}
      {fields.where === "Restaurant" && (
        <>
          <Label T={T}>Restaurant Name</Label>
          <Inp value={fields.restaurantName} onChange={v=>set("restaurantName",v)} placeholder="Restaurant name" T={T} />
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.restaurantLocation||""} onChange={v=>set("restaurantLocation",v)} T={T} />
        </>
      )}
    </div>
  );

  // ── Movie ──
  if (category === "movie") return (
    <div>
      <MovieFields fields={fields} set={set} T={T} />
    </div>
  );

  // ── Exercise ──
  if (category === "exercise") return (
    <div>
      <Label T={T}>Activity Type</Label>
      <MultiCheck options={["Walking","Gym","Cycling","Running","Yoga","Other"]}
        values={fields.activities||[]} onChange={v=>set("activities",v)} T={T} />
      {(fields.activities||[]).includes("Walking") && (
        <>
          <Label T={T}>Steps Count</Label>
          <Inp type="number" value={fields.steps} onChange={v=>set("steps",v)} placeholder="e.g. 8000" T={T} />
        </>
      )}
      <Label T={T}>Location</Label>
      <QuickLocation value={fields.location||""} onChange={v=>set("location",v)} T={T} />
    </div>
  );

  // ── Reading Book ──
  if (category === "reading") return (
    <div>
      <Label T={T}>Book Name</Label>
      <Inp value={fields.bookName} onChange={v=>set("bookName",v)} placeholder="Book title" T={T} />
    </div>
  );

  // ── Cleaning ──
  if (category === "cleaning") return (
    <div>
      <Label T={T}>What did you clean?</Label>
      <MultiCheck options={["House","Kitchen","Vehicles","Bathroom","Garden"]}
        values={fields.areas||[]} onChange={v=>set("areas",v)} T={T} />
      <Label T={T}>Location</Label>
      <QuickLocation value={fields.location||""} onChange={v=>set("location",v)} T={T} />
    </div>
  );

  // ── Work ──
  if (category === "work") return (
    <div>
      <Label T={T}>Task Type</Label>
      <MultiCheck
        options={["Trading","Tracker Update","App Update","Payments","Personal"]}
        values={fields.taskTypes||[]} onChange={v=>set("taskTypes",v)} T={T} />
      <Label T={T}>Location</Label>
      <QuickLocation value={fields.location||""} onChange={v=>set("location",v)} T={T} />
      <Label T={T}>Notes</Label>
      <Inp value={fields.notes} onChange={v=>set("notes",v)} placeholder="Any details…" T={T} />
    </div>
  );

  // ── Personal Grooming ──
  if (category === "grooming" || category === "groom") return (
    <div>
      <Label T={T}>Where</Label>
      <ToggleGroup options={["Home","Saloon"]} value={fields.where} onChange={v=>set("where",v)} T={T} />
      {fields.where === "Home" && (
        <>
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.homeLocation||""} onChange={v=>set("homeLocation",v)} T={T} />
        </>
      )}
      {fields.where === "Saloon" && (
        <>
          <Label T={T}>Saloon Name</Label>
          <Inp value={fields.saloonName} onChange={v=>set("saloonName",v)} placeholder="Saloon name" T={T} />
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.saloonLocation||""} onChange={v=>set("saloonLocation",v)} T={T} />
        </>
      )}
    </div>
  );

  // ── Happy Times ──
  if (category === "happy_times" || category === "happy") return (
    <div>
      <Label T={T}>Activity</Label>
      <MultiCheck
        options={["Movie","Park","Beach","Social Meet","Friends Meet"]}
        values={fields.activities||[]} onChange={v=>set("activities",v)} T={T} />

      {/* Movie sub-fields */}
      {(fields.activities||[]).includes("Movie") && (
        <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bg }}>
          <div style={{ fontSize:11, color:T.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>🎬 Movie</div>
          <MovieFields fields={fields.movie||{}} set={(k,v)=>set("movie",{...fields.movie,[k]:v})} T={T} />
        </div>
      )}

      {/* Park sub-fields */}
      {(fields.activities||[]).includes("Park") && (
        <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bg }}>
          <div style={{ fontSize:11, color:T.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>🌳 Park</div>
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.parkLocation||""} onChange={v=>set("parkLocation",v)} T={T} />
        </div>
      )}

      {/* Beach sub-fields */}
      {(fields.activities||[]).includes("Beach") && (
        <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bg }}>
          <div style={{ fontSize:11, color:T.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>🏖️ Beach</div>
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.beachLocation||""} onChange={v=>set("beachLocation",v)} T={T} />
        </div>
      )}

      {/* Social Meet sub-fields */}
      {(fields.activities||[]).includes("Social Meet") && (
        <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bg }}>
          <div style={{ fontSize:11, color:T.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>🤝 Social Meet</div>
          <Label T={T}>Event Name</Label>
          <Inp value={fields.socialName} onChange={v=>set("socialName",v)} placeholder="What was the occasion?" T={T} />
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.socialLocation||""} onChange={v=>set("socialLocation",v)} T={T} />
        </div>
      )}

      {/* Friends Meet sub-fields */}
      {(fields.activities||[]).includes("Friends Meet") && (
        <div style={{ marginTop:12, padding:"10px 12px", borderRadius:8, border:`1px solid ${T.border}`, background:T.bg }}>
          <div style={{ fontSize:11, color:T.accent, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>👥 Friends Meet</div>
          <Label T={T}>Event Name</Label>
          <Inp value={fields.friendsName} onChange={v=>set("friendsName",v)} placeholder="Who did you meet?" T={T} />
          <Label T={T}>Location</Label>
          <QuickLocation value={fields.friendsLocation||""} onChange={v=>set("friendsLocation",v)} T={T} />
        </div>
      )}
    </div>
  );

  // ── Med Clinic ──
  if (category === "med_clinic") return (
    <div>
      <Label T={T}>Doctor Name</Label>
      <Inp value={fields.doctorName} onChange={v=>set("doctorName",v)} placeholder="Dr. Name" T={T} />
      <Label T={T}>Purpose / Reason</Label>
      <Inp value={fields.purpose} onChange={v=>set("purpose",v)} placeholder="e.g. Checkup, Fever, Dental" T={T} />
      <Label T={T}>Clinic / Hospital Name</Label>
      <Inp value={fields.clinicName} onChange={v=>set("clinicName",v)} placeholder="Clinic or Hospital name" T={T} />
      <Label T={T}>Location</Label>
      <QuickLocation value={fields.location||""} onChange={v=>set("location",v)} T={T} />
    </div>
  );

  // ── Time for Others ──
  if (category === "time_for_others") return (
    <div>
      <Label T={T}>Person Name</Label>
      <Inp value={fields.personName} onChange={v=>set("personName",v)} placeholder="Who did you spend time with?" T={T} />
    </div>
  );

  return null;
}

// ─── Summary shown on EventCard ────────────────────────────────────
export function DynamicSummary({ category, fields={}, T }) {
  if (!fields || Object.keys(fields).length === 0) return null;

  const cat = (category||"").toLowerCase();
  let lines = [];

  if (cat.includes("drive")) {
    if (fields.from || fields.to) lines.push(`📍 ${fields.from||"?"} → ${fields.to||"?"}`);
  }
  else if (cat.includes("breakfast")||cat.includes("lunch")||cat.includes("dinner")) {
    if (fields.foodType) lines.push(fields.foodType==="Veg" ? "🥗 Veg" : "🍖 Non-Veg");
    if (fields.itemName) lines.push(`🍴 ${fields.itemName}`);
    if (fields.where==="Restaurant" && fields.restaurantName)
      lines.push(`🏪 ${fields.restaurantName}${fields.restaurantLocation?`, ${fields.restaurantLocation}`:""}`);
    else if (fields.where==="Home")
      lines.push(`🏠 Home${fields.homeLocation?` · ${fields.homeLocation}`:""}`);
  }
  else if (cat.includes("movie")) {
    if (fields.movieName) lines.push(`🎬 ${fields.movieName}`);
    if (fields.watchedAt==="Theatre" && fields.theatreName)
      lines.push(`🎭 ${fields.theatreName}${fields.theatreLocation?`, ${fields.theatreLocation}`:""}`);
    else if (fields.watchedAt==="Home")
      lines.push(`📺 Home${fields.location?` · ${fields.location}`:""}`);
  }
  else if (cat.includes("exercise")||cat.includes("gym")||cat.includes("walk")) {
    if ((fields.activities||[]).length>0) lines.push(`💪 ${fields.activities.join(", ")}`);
    if (fields.steps) lines.push(`👟 ${Number(fields.steps).toLocaleString()} steps`);
    if (fields.location) lines.push(`📍 ${fields.location}`);
  }
  else if (cat.includes("reading")||cat.includes("book")) {
    if (fields.bookName) lines.push(`📖 ${fields.bookName}`);
  }
  else if (cat.includes("cleaning")) {
    if ((fields.areas||[]).length>0) lines.push(`🧹 ${fields.areas.join(", ")}`);
  }
  else if (cat.includes("work")||cat.includes("trading")) {
    if ((fields.taskTypes||[]).length>0) lines.push(`✅ ${fields.taskTypes.join(", ")}`);
    if (fields.location) lines.push(`📍 ${fields.location}`);
    if (fields.notes) lines.push(`📝 ${fields.notes}`);
  }
  else if (cat.includes("happy")) {
    if ((fields.activities||[]).length>0) lines.push(`🎉 ${fields.activities.join(", ")}`);
    if (fields.movie?.movieName) lines.push(`🎬 ${fields.movie.movieName}`);
    if (fields.parkLocation)    lines.push(`🌳 ${fields.parkLocation}`);
    if (fields.beachLocation)   lines.push(`🏖️ ${fields.beachLocation}`);
    if (fields.socialName)      lines.push(`🤝 ${fields.socialName}${fields.socialLocation?` · ${fields.socialLocation}`:""}`);
    if (fields.friendsName)     lines.push(`👥 ${fields.friendsName}${fields.friendsLocation?` · ${fields.friendsLocation}`:""}`);
  }

  else if (cat.includes("groom")) {
    if (fields.where) lines.push(fields.where === "Home" ? "🏠 Home" : `💈 ${fields.saloonName||"Saloon"}${fields.saloonLocation?`, ${fields.saloonLocation}`:""}`);
  }

  else if (cat.includes("med")||cat.includes("clinic")||cat.includes("hospital")) {
    if (fields.doctorName) lines.push(`👨‍⚕️ ${fields.doctorName}`);
    if (fields.purpose)    lines.push(`🩺 ${fields.purpose}`);
    if (fields.clinicName) lines.push(`🏥 ${fields.clinicName}${fields.location?`, ${fields.location}`:""}`);
  }
  else if (cat.includes("time_for")||cat.includes("others")) {
    if (fields.personName) lines.push(`👤 ${fields.personName}`);
  }

  if (lines.length===0) return null;
  return (
    <div style={{ marginTop:5, display:"flex", flexDirection:"column", gap:2 }}>
      {lines.map((l,i) => <div key={i} style={{ fontSize:12, color:T.textMuted }}>{l}</div>)}
    </div>
  );
}

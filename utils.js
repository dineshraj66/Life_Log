export const pad = (n) => String(n).padStart(2, "0");

export const toDatetimeLocal = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const fmt12 = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit", hour12:true });
};

export const fmt12Date = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
};

export const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const parseToFields = (dtStr) => {
  if (!dtStr) return { date:"", hour:"12", minute:"00", ampm:"AM" };
  const d = new Date(dtStr);
  const h24 = d.getHours();
  return { date: dtStr.split("T")[0], hour: String(h24%12||12), minute: pad(d.getMinutes()), ampm: h24>=12?"PM":"AM" };
};

export const fieldsToDatetime = ({ date, hour, minute, ampm }) => {
  if (!date) return "";
  let h = parseInt(hour) % 12;
  if (ampm === "PM") h += 12;
  return `${date}T${pad(h)}:${pad(parseInt(minute)||0)}`;
};

export const getSavedTheme = () => localStorage.getItem("lifelog_theme") || "midnight";
export const saveTheme     = (id) => localStorage.setItem("lifelog_theme", id);
export const getSavedUsername = () => localStorage.getItem("daily_events_user") || null;
export const saveUsername     = (u) => localStorage.setItem("daily_events_user", u.trim().toLowerCase());
export const clearUsername    = () => localStorage.removeItem("daily_events_user");

export const guessIcon = (label) => {
  const l = label.toLowerCase();
  if (l.includes("sleep")||l.includes("rest")||l.includes("nap")) return "😴";
  if (l.includes("eat")||l.includes("food")||l.includes("lunch")||l.includes("dinner")||l.includes("breakfast")) return "🍽️";
  if (l.includes("gym")||l.includes("run")||l.includes("walk")||l.includes("sport")||l.includes("yoga")||l.includes("exercise")||l.includes("workout")||l.includes("cycling")) return "🏃";
  if (l.includes("read")||l.includes("book")) return "📚";
  if (l.includes("work")||l.includes("office")||l.includes("meeting")||l.includes("job")||l.includes("trading")) return "💼";
  if (l.includes("movie")||l.includes("film")||l.includes("cinema")||l.includes("watch")) return "🎬";
  if (l.includes("trip")||l.includes("travel")||l.includes("flight")||l.includes("vacation")) return "✈️";
  if (l.includes("friend")||l.includes("party")||l.includes("gather")) return "👥";
  if (l.includes("park")||l.includes("garden")||l.includes("nature")||l.includes("outdoor")) return "🌳";
  if (l.includes("social")||l.includes("instagram")||l.includes("twitter")||l.includes("facebook")) return "📱";
  if (l.includes("wedding")||l.includes("marriage")||l.includes("engagement")||l.includes("housewarming")||l.includes("celebration")) return "🎉";
  if (l.includes("shop")||l.includes("mall")||l.includes("buy")) return "🛍️";
  if (l.includes("music")||l.includes("concert")||l.includes("song")) return "🎵";
  if (l.includes("doctor")||l.includes("hospital")||l.includes("health")||l.includes("medical")) return "🏥";
  if (l.includes("study")||l.includes("school")||l.includes("college")||l.includes("learn")) return "🎓";
  if (l.includes("game")||l.includes("play")||l.includes("cricket")||l.includes("football")) return "🎮";
  if (l.includes("cook")||l.includes("kitchen")||l.includes("bake")) return "👨‍🍳";
  if (l.includes("drive")||l.includes("car")||l.includes("bike")||l.includes("commute")) return "🚗";
  if (l.includes("clean")) return "🧹";
  if (l.includes("groom")||l.includes("bath")||l.includes("shower")) return "💆";
  if (l.includes("family")||l.includes("home")||l.includes("house")) return "🏠";
  if (l.includes("news")) return "📰";
  return "📌";
};

export const exportToExcel = (events, categories) => {
  const getCat = (id) => categories.find(c => c.id === id) || { label: id };
  const headers = ["Event Name","Category","Location","Start Time","End Time","Duration","Comments"];
  const rows = [...events]
    .sort((a,b) => a.startDate > b.startDate ? 1 : -1)
    .map(ev => {
      const dur = ev.startDate && ev.endDate ? new Date(ev.endDate)-new Date(ev.startDate) : 0;
      return [ev.name||"", getCat(ev.category).label, ev.location||"",
        ev.startDate ? new Date(ev.startDate).toLocaleString() : "",
        ev.endDate   ? new Date(ev.endDate).toLocaleString()   : "",
        formatDuration(dur), ev.comments||""];
    });
  const csv = [headers,...rows].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv],{type:"text/csv"})), download:`lifelog-${new Date().toISOString().split("T")[0]}.csv` });
  a.click();
};

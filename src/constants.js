// ─── Default Categories ───────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { id: "drive",        label: "Car Drive",                        color: "#F59E0B", icon: "🚗", dynamic: true },
  { id: "breakfast",    label: "Breakfast",                        color: "#F97316", icon: "🍳", dynamic: true },
  { id: "lunch",        label: "Lunch",                            color: "#EF4444", icon: "🍽️", dynamic: true },
  { id: "dinner",       label: "Dinner",                           color: "#EC4899", icon: "🌙", dynamic: true },
  { id: "movie",        label: "Movie",                            color: "#8B5CF6", icon: "🎬", dynamic: true },
  { id: "exercise",     label: "Exercise",                         color: "#10B981", icon: "🏃", dynamic: true },
  { id: "reading",      label: "Reading Book",                     color: "#3B82F6", icon: "📚", dynamic: true },
  { id: "cleaning",     label: "Cleaning",                         color: "#06B6D4", icon: "🧹", dynamic: true },
  { id: "work",         label: "Work",                             color: "#6366F1", icon: "💼", dynamic: true },
  { id: "school_prep",  label: "School Prep",                      color: "#A78BFA", icon: "🎒" },
  { id: "grooming",     label: "Personal Grooming",                color: "#F472B6", icon: "💆" },
  { id: "sleep",        label: "Sleep",                            color: "#4F46E5", icon: "😴" },
  { id: "news",         label: "Latest News",                      color: "#64748B", icon: "📰" },
  { id: "social_media", label: "Social Media",                     color: "#F59E0B", icon: "📱" },
  { id: "park",         label: "Park",                             color: "#84CC16", icon: "🌳" },
  { id: "celebration",  label: "Celebration",                      color: "#F97316", icon: "🎉" },
  { id: "trip",         label: "Trip",                             color: "#06B6D4", icon: "✈️" },
  { id: "friends",      label: "Friends Gathering",                color: "#A78BFA", icon: "👥" },
  { id: "happy_times",   label: "Happy Times",                      color: "#F59E0B", icon: "🎉", dynamic: true },
  { id: "others",       label: "Others",                           color: "#6B7280", icon: "📌" },
];

export const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Weekday Templates ────────────────────────────────────────────
// Times as [HH, MM] 24hr
export const WEEKDAY_TEMPLATES = [
  { name:"School Prep (Dharak)",  category:"school_prep", startH:6,  startM:0,  endH:7,  endM:30 },
  { name:"Personal Grooming",     category:"grooming",    startH:7,  startM:30, endH:8,  endM:15 },
  { name:"Cleaning",              category:"cleaning",    startH:7,  startM:30, endH:8,  endM:15, fields:{ areas:["House"] } },
  { name:"Reading Book",          category:"reading",     startH:8,  startM:30, endH:9,  endM:15 },
  { name:"Breakfast",             category:"breakfast",   startH:7,  startM:45, endH:8,  endM:15 },
  { name:"Trading",               category:"work",        startH:9,  startM:20, endH:15, endM:15 },
  { name:"Lunch",                 category:"lunch",       startH:13, startM:0,  endH:13, endM:30 },
  { name:"Exercise",              category:"exercise",    startH:16, startM:0,  endH:17, endM:0  },
  { name:"Dinner",                category:"dinner",      startH:18, startM:30, endH:19, endM:0  },
  { name:"Cleaning",              category:"cleaning",    startH:19, startM:0,  endH:20, endM:0,  fields:{ areas:["House"] } },
  { name:"School Prep (Dharak)",  category:"school_prep", startH:20, startM:0,  endH:20, endM:30 },
  { name:"Sleep",                 category:"sleep",       startH:20, startM:0,  endH:5,  endM:45, nextDay:true },
];

export const WEEKEND_TEMPLATES = [
  { name:"Exercise",        category:"exercise",  startH:6,  startM:0,  endH:7,  endM:0  },
  { name:"Cleaning",        category:"cleaning",  startH:7,  startM:0,  endH:8,  endM:0,  fields:{ areas:["House"] } },
  { name:"Personal Grooming", category:"grooming",startH:8,  startM:0,  endH:8,  endM:30 },
  { name:"Reading Book",    category:"reading",   startH:8,  startM:30, endH:9,  endM:30 },
  { name:"Breakfast",       category:"breakfast", startH:9,  startM:0,  endH:9,  endM:30 },
  { name:"Latest News",     category:"news",      startH:9,  startM:30, endH:10, endM:0  },
  { name:"Lunch",           category:"lunch",     startH:13, startM:0,  endH:13, endM:30 },
  { name:"Dinner",          category:"dinner",    startH:19, startM:0,  endH:19, endM:30 },
  { name:"Reading Book",    category:"reading",   startH:20, startM:0,  endH:21, endM:0  },
  { name:"Sleep",           category:"sleep",     startH:21, startM:0,  endH:5,  endM:45, nextDay:true },
];

// ─── Themes ───────────────────────────────────────────────────────
export const THEMES = {
  midnight: { id:"midnight", name:"Midnight", emoji:"🌙", bg:"#0F0F14", surface:"#1A1A24", surface2:"#252535", border:"#2A2A38", text:"#F0EDE8", textMuted:"#888", accent:"#E8C97E", accentText:"#0F0F14" },
  ocean:    { id:"ocean",    name:"Ocean",    emoji:"🌊", bg:"#0A1628", surface:"#0F2040", surface2:"#163256", border:"#1E3A5F", text:"#E0F0FF", textMuted:"#7AADCC", accent:"#38BDF8", accentText:"#0A1628" },
  forest:   { id:"forest",   name:"Forest",   emoji:"🌿", bg:"#0A1A0F", surface:"#122A18", surface2:"#1A3D22", border:"#2A5A35", text:"#E0F5E8", textMuted:"#7ABF8A", accent:"#4ADE80", accentText:"#0A1A0F" },
  sunset:   { id:"sunset",   name:"Sunset",   emoji:"🌅", bg:"#1A0A0A", surface:"#2A1218", surface2:"#3A1A22", border:"#5A2A35", text:"#FFE8E0", textMuted:"#CC8880", accent:"#FB7185", accentText:"#1A0A0A" },
  lavender: { id:"lavender", name:"Lavender", emoji:"💜", bg:"#120A1A", surface:"#1E1228", surface2:"#2A1A38", border:"#3A2A55", text:"#EDE8FF", textMuted:"#9980CC", accent:"#A78BFA", accentText:"#120A1A" },
  light:    { id:"light",    name:"Light",    emoji:"☀️", bg:"#F5F5F0", surface:"#FFFFFF", surface2:"#F0EDE8", border:"#E0DDD8", text:"#1A1A24", textMuted:"#666",    accent:"#E8C97E", accentText:"#1A1A24" },
  rose:     { id:"rose",     name:"Rose",     emoji:"🌹", bg:"#1A0A10", surface:"#2A1018", surface2:"#3A1A25", border:"#552A3A", text:"#FFE8EE", textMuted:"#CC7A90", accent:"#F43F5E", accentText:"#1A0A10" },
  amber:    { id:"amber",    name:"Amber",    emoji:"🔥", bg:"#1A1000", surface:"#2A1A00", surface2:"#3A2500", border:"#5A3A00", text:"#FFF5E0", textMuted:"#CC9940", accent:"#F59E0B", accentText:"#1A1000" },
};

// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || "AIzaSyCXK_X1e_K_-Wz-gE_9g6dm96vMLdKViq4",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || "daily-events-a3151.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || "daily-events-a3151",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || "daily-events-a3151.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "744894479261",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || "1:744894479261:web:ae30525105eb58830f8d74",
}

const app   = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Username stored in localStorage - same username on any device = same data
export const getSavedUsername = () => localStorage.getItem("daily_events_user") || null
export const saveUsername     = (u) => localStorage.setItem("daily_events_user", u.trim().toLowerCase())
export const clearUsername    = () => localStorage.removeItem("daily_events_user")

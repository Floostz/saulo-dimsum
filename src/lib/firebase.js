// src/lib/firebase.ts
// ─────────────────────────────────────────────────────────────────────────────
// If VITE_FIREBASE_API_KEY is not set, the app runs in DEMO MODE
// (no Firebase calls, local session storage only).
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
export const isDemoMode = !import.meta.env.VITE_FIREBASE_API_KEY;
// Provide a dummy config so Firebase doesn't throw during initialization
const firebaseConfig = {
  apiKey: "AIzaSyAimGOVvSsCNAfmz063Cs2XL6p_aUjNZFk",
  authDomain: "smoen-cashier.firebaseapp.com",
  projectId: "smoen-cashier",
  storageBucket: "smoen-cashier.firebasestorage.app",
  messagingSenderId: "1028810080587",
  appId: "1:1028810080587:web:6412ad87fda3bfd32368ce",
  measurementId: "G-YDVV7VFF5G"
};
let _app;
let _auth;
let _db;
let _storage;
// Only initialise Firebase if we have a real config
_app = initializeApp(firebaseConfig);
_auth = getAuth(_app);
_db = getFirestore(_app);
_storage = getStorage(_app);
export const app = _app;
export const auth = _auth;
export const db = _db;
export const storage = _storage;
export default _app;

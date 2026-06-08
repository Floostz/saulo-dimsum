// src/store/auth.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Auth store supporting two modes:
//   1. DEMO MODE  – no Firebase config needed; local credentials only
//   2. FIREBASE MODE – real Firebase Auth + Firestore user profiles
// ─────────────────────────────────────────────────────────────────────────────
import { createSignal, createContext, useContext, onCleanup, JSX } from "solid-js";
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, isDemoMode } from "../lib/firebase";
import { AppUser } from "../types";

// ── Demo credentials (shown on login page) ────────────────────────────────
const DEMO_USERS: Record<string, AppUser> = {
  "admin@saulo.com": {
    uid: "demo-admin",
    email: "admin@saulo.com",
    displayName: "Administrator",
    role: "admin",
    isActive: true,
    createdAt: new Date("2024-01-01"),
  },
  "kasir@saulo.com": {
    uid: "demo-kasir",
    email: "kasir@saulo.com",
    displayName: "Fawwaz",
    role: "kasir",
    isActive: true,
    createdAt: new Date("2024-03-01"),
  },
};

const DEMO_PASSWORDS: Record<string, string> = {
  "admin@saulo.com": "admin123",
  "kasir@saulo.com": "kasir123",
};

const DEMO_SESSION_KEY = "saulo_demo_session";

// ── Context type ──────────────────────────────────────────────────────────
interface AuthContextValue {
  user: () => AppUser | null;
  loading: () => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  demoMode: boolean;
}

const AuthContext = createContext<AuthContextValue>();

// ── Provider ──────────────────────────────────────────────────────────────
export function AuthProvider(props: { children: JSX.Element }) {
  const [user, setUser] = createSignal<AppUser | null>(null);
  const [loading, setLoading] = createSignal(true);

  if (isDemoMode) {
    // ── DEMO MODE: restore session from sessionStorage ──────────────────
    const saved = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved) as AppUser);
      } catch {
        sessionStorage.removeItem(DEMO_SESSION_KEY);
      }
    }
    setLoading(false);

    const signIn = async (email: string, password: string) => {
      const lower = email.toLowerCase().trim();
      const demo = DEMO_USERS[lower];
      if (!demo || DEMO_PASSWORDS[lower] !== password) {
        throw new Error("auth/wrong-password");
      }
      sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demo));
      setUser(demo);
    };

    const signOut = async () => {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
    };

    return (
      <AuthContext.Provider value={{
        user, loading, signIn, signOut,
        isAdmin: () => user()?.role === "admin",
        demoMode: true,
      }}>
        {props.children}
      </AuthContext.Provider>
    );
  }

  // ── FIREBASE MODE ───────────────────────────────────────────────────────
  const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
    if (fbUser) {
      try {
        // Try to get the user profile from Firestore
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (snap.exists()) {
          setUser({ uid: fbUser.uid, ...snap.data() } as AppUser);
        } else {
          // First-time login: auto-create profile (first user becomes admin)
          const allUsersSnap = await getDoc(doc(db, "_meta", "userCount"));
          const count = allUsersSnap.exists() ? (allUsersSnap.data().count ?? 0) : 0;
          const newUser: AppUser = {
            uid: fbUser.uid,
            email: fbUser.email ?? "",
            displayName: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
            role: count === 0 ? "admin" : "kasir",
            isActive: true,
            createdAt: new Date(),
          };
          await setDoc(doc(db, "users", fbUser.uid), {
            email: newUser.email,
            displayName: newUser.displayName,
            role: newUser.role,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt,
          });
          await setDoc(doc(db, "_meta", "userCount"), { count: count + 1 });
          setUser(newUser);
        }
      } catch (err) {
        console.error("Firestore profile fetch failed:", err);
        // Fallback: use Firebase Auth data only (no Firestore role)
        setUser({
          uid: fbUser.uid,
          email: fbUser.email ?? "",
          displayName: fbUser.displayName ?? "User",
          role: "kasir",
          isActive: true,
          createdAt: new Date(),
        });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  });

  onCleanup(() => unsubscribe());

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will update user state
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, loading, signIn, signOut,
      isAdmin: () => user()?.role === "admin",
      demoMode: false,
    }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};

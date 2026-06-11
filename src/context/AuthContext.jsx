import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DEMO_FLAG_KEY, DEMO_SESSION, DEMO_PROFILE } from "../lib/demoData";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined);  // undefined = loading
  const [profile, setProfile]   = useState(undefined);  // undefined = loading, null = no row
  // Demo mode is dev-only — compiled out of production builds
  const [isDemo, setIsDemo]     = useState(() => {
    if (!import.meta.env.DEV) return false;
    try { return localStorage.getItem(DEMO_FLAG_KEY) === "1"; } catch { return false; }
  });

  // ── Bootstrap session on mount ──────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Load player profile when session is set ─────────────────
  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);  // no session → definitely no profile
      return;
    }
    setProfile(undefined); // mark as loading while we fetch
    supabase
      .from("players")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setProfile(data ?? null)); // null = new player
  }, [session]);

  // ── Auth helpers ────────────────────────────────────────────
  async function signInWithMagicLink(email) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return { error };
  }

  // Local sandbox — no Supabase involved, demo state resets on sign-out
  function signInDemo() {
    if (!import.meta.env.DEV) return;
    try { localStorage.setItem(DEMO_FLAG_KEY, "1"); } catch { /* ignore */ }
    setIsDemo(true);
  }

  async function signOut() {
    if (isDemo) {
      try { localStorage.removeItem(DEMO_FLAG_KEY); } catch { /* ignore */ }
      setIsDemo(false);
      setProfile(null);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
  }

  // loading = true while session OR profile is still resolving
  const loading = session === undefined || (session !== null && profile === undefined);

  return (
    <AuthContext.Provider value={{
      session: isDemo ? DEMO_SESSION : session,
      profile: isDemo ? DEMO_PROFILE : profile,
      setProfile,
      loading: isDemo ? false : loading,
      signInWithMagicLink,
      signInWithGoogle,
      signInDemo,
      signOut,
      isDemo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

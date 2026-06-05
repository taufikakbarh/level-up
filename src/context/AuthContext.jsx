import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]   = useState(undefined);  // undefined = loading
  const [profile, setProfile]   = useState(undefined);  // undefined = loading, null = no row

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

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  // loading = true while session OR profile is still resolving
  const loading = session === undefined || (session !== null && profile === undefined);

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      setProfile,
      loading,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
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

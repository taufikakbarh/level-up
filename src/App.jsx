import { useState } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GameProvider, useGame } from "./context/GameContext";
import { initPlayer } from "./lib/db";
import { supabase } from "./lib/supabase";
import { STARTER_HABIT_IDS, HABIT_LIBRARY } from "./constants/habitLibrary";
import AuthScreen from "./components/AuthScreen";
import Onboarding from "./components/Onboarding";
import Navigation from "./components/Navigation";
import QuestScreen from "./components/screens/QuestScreen";
import CharacterScreen from "./components/screens/CharacterScreen";
import JournalScreen from "./components/screens/JournalScreen";
import CodexScreen from "./components/screens/CodexScreen";

// ── Spinner ────────────────────────────────────────────────────
export function LoadingScreen({ message = "Loading…" }) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4"
      style={{ background: "#0a0c14" }}
    >
      <div className="text-4xl">⚔️</div>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "#f5c84244", borderTopColor: "#f5c842" }}
      />
      <p className="text-xs text-gray-600 uppercase tracking-widest font-bold">
        {message}
      </p>
    </div>
  );
}

// ── Game UI — only shown to initialized players ────────────────
function GameUI() {
  const [activeTab, setActiveTab] = useState("quest");
  const { state } = useGame();
  const pendingNotifs = state.notifications.filter(n => !n.seen).length;

  return (
    <div className="flex flex-col flex-1 relative" style={{ minHeight: "100svh" }}>
      <main className="flex-1 relative" style={{ background: "#0a0c14" }}>
        {activeTab === "quest"     && <QuestScreen />}
        {activeTab === "character" && <CharacterScreen />}
        {activeTab === "journal"   && <JournalScreen />}
        {activeTab === "codex"     && <CodexScreen />}
      </main>
      <Navigation
        active={activeTab}
        onChange={setActiveTab}
        notifCount={pendingNotifs}
      />
    </div>
  );
}

// ── Post-auth onboarding wrapper ───────────────────────────────
// Shown when user is authenticated but has no player row yet.
function NewPlayerSetup() {
  const { session, setProfile } = useAuth();
  const [loading, setLoading]   = useState(false);

  async function handleComplete(name) {
    setLoading(true);
    const userId = session.user.id;

    // Create player row + habits in Supabase
    await initPlayer(userId, name, STARTER_HABIT_IDS, HABIT_LIBRARY);

    // Load the freshly-created profile to trigger AuthGate → GameUI
    const { data } = await supabase.from("players").select("*").eq("id", userId).single();
    setProfile(data);
    setLoading(false);
  }

  return <Onboarding onComplete={handleComplete} loading={loading} />;
}

// ── Auth gate — single source of routing truth ─────────────────
//
//  No session              → AuthScreen  (login / register)
//  Session + no profile    → NewPlayerSetup (name → stats → habits → enter)
//  Session + profile exists → GameUI
//
function AuthGate() {
  const { session, profile, loading } = useAuth();

  // Resolving session + profile
  if (loading) return <LoadingScreen message="Connecting…" />;

  // Not logged in → auth first
  if (!session) return <AuthScreen />;

  // Logged in, no player row → new player setup
  if (!profile) return <NewPlayerSetup />;

  // Fully set up → load game state and show game
  return (
    <GameProvider session={session}>
      <GameWithLoader />
    </GameProvider>
  );
}

function GameWithLoader() {
  const { dbLoading } = useGame();
  if (dbLoading) return <LoadingScreen message="Syncing your progress…" />;
  return <GameUI />;
}

// ── Root ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

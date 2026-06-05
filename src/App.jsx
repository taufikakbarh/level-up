import { useState } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GameProvider, useGame } from "./context/GameContext";
import Onboarding from "./components/Onboarding";
import AuthScreen from "./components/AuthScreen";
import Navigation from "./components/Navigation";
import QuestScreen from "./components/screens/QuestScreen";
import CharacterScreen from "./components/screens/CharacterScreen";
import JournalScreen from "./components/screens/JournalScreen";
import CodexScreen from "./components/screens/CodexScreen";

// ── Spinner ────────────────────────────────────────────────────
function LoadingScreen({ message = "Loading…" }) {
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

// ── Main game UI ───────────────────────────────────────────────
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

// ── Inner app — handles onboarding / auth / game routing ───────
function AppInner() {
  const { session } = useAuth();
  const { isInitialized, dbLoading, initializePlayer } = useGame();

  const [showAuth, setShowAuth]       = useState(false);
  const [pendingName, setPendingName] = useState("");
  const [initializing, setInit]       = useState(false);

  // Still fetching Supabase state
  if (dbLoading) return <LoadingScreen message="Syncing your progress…" />;

  // Saving new player to Supabase
  if (initializing) return <LoadingScreen message="Creating your character…" />;

  // ── Onboarding: user hasn't played before ──────────────────
  if (!isInitialized && !showAuth) {
    return (
      <Onboarding
        onComplete={(name) => {
          setPendingName(name);
          setShowAuth(true);
        }}
      />
    );
  }

  // ── Auth: user finished onboarding, now needs to sign in ───
  if (!isInitialized && showAuth) {
    return (
      <AuthScreen
        playerName={pendingName}
        onBack={() => setShowAuth(false)}
        onAuthSuccess={async () => {
          setShowAuth(false);
          setInit(true);
          await initializePlayer(pendingName);
          setInit(false);
        }}
      />
    );
  }

  // ── Fully initialized — show the game ──────────────────────
  return <GameUI />;
}

// ── Auth gate ──────────────────────────────────────────────────
function AuthGate() {
  const { session, loading } = useAuth();
  if (loading) return <LoadingScreen message="Connecting…" />;
  return (
    <GameProvider session={session}>
      <AppInner />
    </GameProvider>
  );
}

// ── Root ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

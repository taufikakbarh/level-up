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

// ── Loading spinner ────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4"
      style={{ background: "#0a0c14" }}
    >
      <div className="text-4xl">⚔️</div>
      <div
        className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "#f5c842", borderTopColor: "transparent" }}
      />
    </div>
  );
}

// ── Inner app — only rendered when session exists ──────────────
function AppInner() {
  const { state, initializePlayer, isInitialized } = useGame();
  const { session } = useAuth();
  const [activeTab, setActiveTab]       = useState("quest");
  const [showAuth, setShowAuth]         = useState(false);
  const [pendingName, setPendingName]   = useState("");

  const pendingNotifs = state.notifications.filter(n => !n.seen).length;

  // ── Onboarding: user just entered name + clicked "Enter the game"
  // We show AuthScreen before finalizing player state
  function handleOnboardingComplete(name) {
    setPendingName(name);
    setShowAuth(true);
  }

  // ── Auth done → initialize player with the name they entered
  // (for returning users this won't fire — isInitialized is true already)
  function handleAuthBack() {
    setShowAuth(false);
  }

  // Not yet gone through onboarding
  if (!isInitialized && !showAuth) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Onboarding done, now showing auth
  if (showAuth && !isInitialized) {
    return (
      <AuthScreen
        playerName={pendingName}
        onBack={handleAuthBack}
        onAuthSuccess={() => {
          initializePlayer(pendingName);
        }}
      />
    );
  }

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

// ── Auth gate — decides what to render based on session state ──
function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  // No session yet → still show onboarding/auth flow
  // GameProvider handles its own localStorage fallback
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

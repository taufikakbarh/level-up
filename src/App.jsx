import { useState } from "react";
import "./App.css";
import { GameProvider, useGame } from "./context/GameContext";
import Onboarding from "./components/Onboarding";
import Navigation from "./components/Navigation";
import QuestScreen from "./components/screens/QuestScreen";
import CharacterScreen from "./components/screens/CharacterScreen";
import JournalScreen from "./components/screens/JournalScreen";
import CodexScreen from "./components/screens/CodexScreen";

const INIT_FLAG = "levelup_initialized";
const STORAGE_KEY = "levelup_v1_state";

function AppInner() {
  const { state, initializePlayer, isInitialized } = useGame();
  const [activeTab, setActiveTab] = useState("quest");

  const pendingNotifs = state.notifications.filter(n => !n.seen).length;

  if (!isInitialized) {
    return (
      <Onboarding
        onComplete={(name) => {
          initializePlayer(name);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 relative" style={{ minHeight: "100svh" }}>
      {/* Screen content */}
      <main className="flex-1 relative" style={{ background: "#0a0c14" }}>
        {activeTab === "quest"     && <QuestScreen />}
        {activeTab === "character" && <CharacterScreen />}
        {activeTab === "journal"   && <JournalScreen />}
        {activeTab === "codex"     && <CodexScreen />}
      </main>

      {/* Bottom nav */}
      <Navigation
        active={activeTab}
        onChange={setActiveTab}
        notifCount={pendingNotifs}
      />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <AppInner />
    </GameProvider>
  );
}

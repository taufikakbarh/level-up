import { useState, useRef } from "react";
import { STAT_META, STREAK_MILESTONES, HABIT_LIBRARY } from "../constants/habitLibrary";
import FloatingXP from "./ui/FloatingXP";
import StreakPopup from "./ui/StreakPopup";
import LevelUpOverlay from "./ui/LevelUpOverlay";

const STAT_COLORS = {
  vitality: "#ef4444", focus: "#3b82f6", will: "#f59e0b",
  output: "#8b5cf6", presence: "#ec4899", wisdom: "#10b981",
};

function getLibraryCue(libId) {
  const lib = HABIT_LIBRARY.find(h => h.id === libId);
  return lib?.cue ?? "";
}

export default function EnemyCard({ habit, completed, onComplete, lastXpGain }) {
  const [shaking, setShaking]           = useState(false);
  const [showXP, setShowXP]             = useState(false);
  const [streakMilestone, setStreak]    = useState(null);

  const color = STAT_COLORS[habit.stat] ?? "#ffffff";
  const meta  = STAT_META[habit.stat];

  // Was this card the one that just fired XP?
  const isMyXp     = lastXpGain?.habitId === habit.id;
  const showLevelUp = isMyXp && lastXpGain?.leveled && lastXpGain?.levelUps?.length > 0;

  function handleClick() {
    if (completed) return;

    setShaking(true);
    setTimeout(() => setShaking(false), 450);
    // Brief delay so the shake starts before we show XP
    setTimeout(() => setShowXP(true), 180);

    onComplete(habit.id);

    // Per-habit streak milestone (habit.streak hasn't advanced yet — will be +1 tomorrow,
    // but we track today's completion so show milestone at the moment of hitting it)
    const nextStreak = habit.streak + 1;
    if (STREAK_MILESTONES.includes(nextStreak)) {
      setTimeout(() => setStreak(nextStreak), 600);
    }
  }

  return (
    <>
      {showLevelUp && (
        <LevelUpOverlay
          stat={habit.stat}
          level={lastXpGain.levelUps[lastXpGain.levelUps.length - 1]}
          onDone={() => {}}
        />
      )}
      {streakMilestone && (
        <StreakPopup milestone={streakMilestone} onDone={() => setStreak(null)} />
      )}

      <div
        onClick={handleClick}
        className={`relative rounded-2xl p-4 mb-3 cursor-pointer select-none transition-transform duration-150
          ${shaking ? "card-shake" : ""}
          ${completed ? "defeated-card" : ""}
          ${!completed ? "active:scale-[0.98]" : ""}
        `}
        style={{
          background:  completed ? "#0d0f18" : "#12151f",
          border:      `2px solid ${completed ? "#1a1e2e" : color}`,
          boxShadow:   completed ? "none" : `0 0 14px ${color}25, inset 0 0 24px ${color}07`,
        }}
      >
        {/* Floating XP — only shown for the card that was just tapped */}
        {showXP && isMyXp && (
          <FloatingXP
            amount={lastXpGain?.xpGained ?? habit.xpReward}
            stat={habit.stat}
            onDone={() => setShowXP(false)}
          />
        )}

        {/* ── Top row: stat label + badges + XP ─────────── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            {/* Stat + badges */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-sm">{meta?.icon}</span>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>
                {meta?.label}
              </span>
              {habit.status === "automated" && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#0d9488", color: "#fff" }}
                >
                  ✓ AUTOMATED
                </span>
              )}
              {habit.isUpgraded && habit.status !== "automated" && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#7c3aed22", color: "#a78bfa", border: "1px solid #7c3aed44" }}
                >
                  ⬆ UPGRADED
                </span>
              )}
            </div>
            {/* Habit name */}
            <div className="font-bold text-base leading-snug">
              {completed
                ? <span className="text-gray-600 line-through">{habit.name}</span>
                : <span className="text-white">{habit.name}</span>
              }
            </div>
          </div>

          {/* Right column: XP badge + streak flame */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div
              className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{
                background: completed ? "#1a1e2e" : `${color}22`,
                color:      completed ? "#374151" : color,
                border:     `1px solid ${completed ? "#1f2335" : color + "44"}`,
              }}
            >
              +{habit.xpReward} XP
            </div>
            {habit.streak > 0 && (
              <div
                className={`text-xs font-bold ${habit.streak >= 7 ? "flame-glow" : ""}`}
                style={{ color: "#f59e0b" }}
              >
                🔥 {habit.streak}
              </div>
            )}
          </div>
        </div>

        {/* ── HP bar (active only) ───────────────────────── */}
        {!completed && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span className="font-bold uppercase tracking-wider">HP</span>
              <span>100%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: "100%",
                  background: color,
                  boxShadow: `0 0 8px ${color}99`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Defeated bar ──────────────────────────────── */}
        {completed && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
            <span className="text-xs font-black text-gray-700 uppercase tracking-widest">DEFEATED</span>
          </div>
        )}

        {/* ── Cue reminder (active only) ────────────────── */}
        {!completed && (
          <div className="text-xs text-gray-600 italic mt-2 leading-relaxed">
            📍 {getLibraryCue(habit.libraryId)}
          </div>
        )}

        {/* ── Frozen badge ──────────────────────────────── */}
        {habit.streakFrozen && !completed && (
          <div
            className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-bold"
            style={{ background: "#1e3a5f", color: "#60a5fa", border: "1px solid #2563eb44" }}
          >
            ❄️ FROZEN
          </div>
        )}
      </div>
    </>
  );
}

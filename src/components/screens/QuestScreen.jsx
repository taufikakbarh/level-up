import { useState, useEffect, useRef, useCallback } from "react";
import { Zap, Flame, Shield, ChevronRight } from "lucide-react";
import { useGame } from "../../context/GameContext";
import { STAT_META } from "../../constants/habitLibrary";
import EnemyCard from "../EnemyCard";
import UpgradeModal from "../ui/UpgradeModal";
import EndDaySummary from "../EndDaySummary";
import HeroPanel from "../ui/HeroPanel";
import ComboPopup from "../ui/ComboPopup";

// Completions within this window chain into a combo (visual only)
const COMBO_WINDOW_MS = 7000;

const PHASE_LABELS = {
  1: { name: "INSTALL", subtitle: "Your foundation phase. Build the base.", goal: 7 },
  2: { name: "STACK",   subtitle: "You're building momentum. Stack it.",    goal: 21 },
  3: { name: "AUTOMATE",subtitle: "These are becoming who you are.",        goal: 30 },
};

export default function QuestScreen() {
  const { state, completeHabit, uncompleteHabit, endDay, acceptUpgrade, dismissUpgrade, markNotifSeen } = useGame();
  const { player, playerHabits, today, stats, notifications, _lastXpGain } = state;

  const [showSummary, setShowSummary] = useState(false);
  const [pendingUpgrade, setPendingUpgrade] = useState(null);

  // Combo chain — ephemeral, resets if the window lapses or on undo
  const comboRef = useRef({ count: 0, last: 0 });
  const [combo, setCombo] = useState(null);

  const handleComplete = useCallback((habitId) => {
    completeHabit(habitId);
    const now = Date.now();
    const c = comboRef.current;
    c.count = now - c.last <= COMBO_WINDOW_MS ? c.count + 1 : 1;
    c.last = now;
    if (c.count >= 2) setCombo({ count: c.count, id: now });
  }, [completeHabit]);

  const handleUncomplete = useCallback((habitId) => {
    uncompleteHabit(habitId);
    comboRef.current = { count: 0, last: 0 };
  }, [uncompleteHabit]);

  const phase = PHASE_LABELS[player.currentPhase] ?? PHASE_LABELS[1];
  const completedIds = today.completedHabitIds;
  const total = playerHabits.length;
  const done = completedIds.length;
  const allDone = done === total && total > 0;

  // Auto-show summary when all habits defeated
  useEffect(() => {
    if (allDone && !today.dayEnded) {
      const t = setTimeout(() => setShowSummary(true), 700);
      return () => clearTimeout(t);
    }
  }, [allDone, today.dayEnded]);

  // Show day-already-ended summary on re-open
  useEffect(() => {
    if (today.dayEnded) setShowSummary(true);
  }, []);

  // Pending upgrade notification
  useEffect(() => {
    const offer = notifications.find(n => n.type === "upgrade_offer" && !n.seen);
    if (offer) {
      const habit = playerHabits.find(h => h.id === offer.habitId);
      if (habit && !habit.isUpgraded) {
        setPendingUpgrade(habit);
      }
    }
  }, [notifications]);

  function handleEndDay() {
    endDay();
    setShowSummary(true);
  }

  function handleAcceptUpgrade() {
    if (!pendingUpgrade) return;
    acceptUpgrade(pendingUpgrade.id);
    // Mark notif seen
    const notif = notifications.find(n => n.type === "upgrade_offer" && n.habitId === pendingUpgrade.id);
    if (notif) markNotifSeen(notif.id);
    setPendingUpgrade(null);
  }

  function handleDismissUpgrade() {
    if (!pendingUpgrade) return;
    dismissUpgrade(pendingUpgrade.id);
    const notif = notifications.find(n => n.type === "upgrade_offer" && n.habitId === pendingUpgrade.id);
    if (notif) markNotifSeen(notif.id);
    setPendingUpgrade(null);
  }

  // Group stats for the mini XP strip
  const statEntries = Object.entries(stats);

  return (
    <div className="scroll-area px-4 pt-4">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              DAY {player.dayCount} — {phase.name}
            </div>
            <div className="text-gold font-bold text-lg leading-tight mt-0.5">
              Today's Battle
            </div>
          </div>
          <div className="text-right">
            <GlobalStreak streak={player.globalStreak} frozen={player.globalStreakFrozen} />
          </div>
        </div>

        {/* Phase subtitle */}
        <div className="text-xs text-gray-500 italic mb-3">{phase.subtitle}</div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: total > 0 ? `${(done / total) * 100}%` : "0%",
                background: "linear-gradient(90deg, #0d9488, #06b6d4)",
                boxShadow: done > 0 ? "0 0 8px #0d948888" : "none",
              }}
            />
          </div>
          <span className="text-xs font-bold text-teal-400 w-10 text-right">
            {done}/{total}
          </span>
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────── */}
      <HeroPanel allDone={allDone} />

      {/* ── Streak multiplier banner ────────────────────────── */}
      {today.streakMultiplier > 1 && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl mb-4 text-xs font-bold"
          style={{ background: "rgba(245,200,66,0.08)", border: "1px solid rgba(245,200,66,0.2)" }}
        >
          <Zap size={13} className="text-gold" />
          <span className="text-gold">{today.streakMultiplier}× XP MULTIPLIER ACTIVE</span>
          <span className="text-gray-500 ml-auto">🔥 {player.globalStreak}-day streak</span>
        </div>
      )}

      {/* ── Phase notification banners ──────────────────────── */}
      {notifications
        .filter(n => n.type === "phase_advance" && !n.seen)
        .map(n => (
          <div
            key={n.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 cursor-pointer"
            style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.35)" }}
            onClick={() => markNotifSeen(n.id)}
          >
            <Shield size={16} className="text-purple-400 shrink-0" />
            <span className="text-purple-300 text-xs font-medium flex-1">{n.message}</span>
            <ChevronRight size={14} className="text-purple-500" />
          </div>
        ))}

      {/* ── Enemy cards ─────────────────────────────────────── */}
      <div className="mb-4">
        {/* Active (not defeated) first */}
        {playerHabits
          .filter(h => !completedIds.includes(h.id))
          .map(habit => (
            <EnemyCard
              key={habit.id}
              habit={habit}
              completed={false}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              lastXpGain={_lastXpGain}
              dayEnded={today.dayEnded}
            />
          ))}
        {/* Defeated */}
        {playerHabits
          .filter(h => completedIds.includes(h.id))
          .map(habit => (
            <EnemyCard
              key={habit.id}
              habit={habit}
              completed={true}
              onComplete={handleComplete}
              onUncomplete={handleUncomplete}
              lastXpGain={_lastXpGain}
              dayEnded={today.dayEnded}
            />
          ))}
      </div>

      {/* ── Mini stat XP strip ──────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {statEntries.map(([key, val]) => {
          const meta = STAT_META[key];
          const earnedToday = today.xpEarnedByStatToday[key] ?? 0;
          return (
            <div
              key={key}
              className="rounded-xl p-2 text-center"
              style={{ background: "#12151f", border: `1px solid ${meta.color}22` }}
            >
              <div className="text-base">{meta.icon}</div>
              <div className="text-xs font-bold" style={{ color: meta.color }}>
                Lv {val.level}
              </div>
              {earnedToday > 0 && (
                <div className="text-xs text-gold font-bold">+{earnedToday}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── End Day button ──────────────────────────────────── */}
      {!today.dayEnded && (
        <button
          onClick={handleEndDay}
          className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all active:scale-95 mb-4"
          style={{
            background: allDone
              ? "linear-gradient(135deg, #f5c842, #d97706)"
              : "rgba(255,255,255,0.04)",
            color: allDone ? "#0a0c14" : "#4a5568",
            border: allDone ? "none" : "1px solid #1f2335",
          }}
        >
          {allDone ? "⚔️  Claim Victory — End Day" : "End Day Early"}
        </button>
      )}

      {/* ── Combo popup ─────────────────────────────────────── */}
      {combo && (
        <ComboPopup combo={combo} onDone={() => setCombo(null)} />
      )}

      {/* ── Modals ──────────────────────────────────────────── */}
      {pendingUpgrade && !today.dayEnded && (
        <UpgradeModal
          habit={pendingUpgrade}
          onAccept={handleAcceptUpgrade}
          onDismiss={handleDismissUpgrade}
        />
      )}

      {showSummary && (
        <EndDaySummary onClose={() => setShowSummary(false)} />
      )}
    </div>
  );
}

function GlobalStreak({ streak, frozen }) {
  if (streak === 0 && !frozen) return null;
  return (
    <div
      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${
        streak >= 7 ? "flame-glow" : ""
      }`}
      style={{
        background: frozen ? "rgba(30,58,95,0.6)" : "rgba(245,159,11,0.12)",
        border: `1px solid ${frozen ? "#2563eb44" : "#f59e0b44"}`,
        color: frozen ? "#60a5fa" : "#f59e0b",
      }}
    >
      {frozen ? "❄️" : "🔥"}
      <span>{streak}</span>
    </div>
  );
}

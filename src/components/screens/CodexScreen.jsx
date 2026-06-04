import { useState } from "react";
import { Lock, CheckCircle, ChevronDown, ChevronUp, Star } from "lucide-react";
import { useGame } from "../../context/GameContext";
import { HABIT_LIBRARY, STAT_META } from "../../constants/habitLibrary";

const STAT_TABS = ["all", "vitality", "focus", "will", "output", "presence", "wisdom"];

const TIER_LABELS = { 1: "EASY", 2: "MEDIUM", 3: "HARD" };
const TIER_COLORS = { 1: "#0d9488", 2: "#f59e0b", 3: "#ef4444" };

export default function CodexScreen() {
  const { state } = useGame();
  const { player, playerHabits } = state;
  const [tab, setTab] = useState("all");
  const [expanded, setExpanded] = useState(null);

  const assignedLibraryIds = new Set(playerHabits.map(h => h.libraryId));

  const filtered = tab === "all"
    ? HABIT_LIBRARY
    : HABIT_LIBRARY.filter(h => h.stat === tab);

  function isUnlocked(habit) {
    // Unlocked if assigned OR if player dayCount >= habit.unlocksAt
    if (assignedLibraryIds.has(habit.id)) return true;
    if (player.dayCount >= habit.unlocksAt) return true;
    return false;
  }

  function getStatus(habit) {
    const ph = playerHabits.find(h => h.libraryId === habit.id);
    if (!ph) return "locked";
    if (ph.status === "automated") return "automated";
    if (ph.isUpgraded) return "upgraded";
    return "active";
  }

  return (
    <div className="scroll-area px-4 pt-4">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Codex</div>
        <div className="text-gold font-bold text-lg">Science-Backed Habit Library</div>
        <div className="text-xs text-gray-500 mt-1">
          {HABIT_LIBRARY.length} habits · {assignedLibraryIds.size} assigned · {
            playerHabits.filter(h => h.status === "automated").length
          } automated
        </div>
      </div>

      {/* ── Stat filter tabs ────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-5 scrollbar-hide">
        {STAT_TABS.map(t => {
          const meta = t === "all" ? null : STAT_META[t];
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all"
              style={{
                background: isActive
                  ? (meta ? meta.color : "#f5c842")
                  : "rgba(255,255,255,0.05)",
                color: isActive ? (t === "will" || t === "output" ? "#0a0c14" : "#fff") : "#6b7280",
                border: isActive ? "none" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {meta ? `${meta.icon} ${meta.label}` : "ALL"}
            </button>
          );
        })}
      </div>

      {/* ── Habit cards ─────────────────────────────────────── */}
      <div className="space-y-3 mb-4">
        {filtered.map(habit => {
          const meta = STAT_META[habit.stat];
          const unlocked = isUnlocked(habit);
          const status = getStatus(habit);
          const isOpen = expanded === habit.id;
          const ph = playerHabits.find(h => h.libraryId === habit.id);

          return (
            <div
              key={habit.id}
              className={`rounded-2xl overflow-hidden transition-all ${!unlocked ? "opacity-50" : ""}`}
              style={{
                background: "#12151f",
                border: `1px solid ${unlocked ? meta.color + "33" : "#1f2335"}`,
              }}
            >
              {/* Card header — always visible */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : habit.id)}
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {status === "automated" ? (
                    <CheckCircle size={18} style={{ color: "#0d9488" }} />
                  ) : status === "active" || status === "upgraded" ? (
                    <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: meta.color, background: meta.color + "33" }} />
                  ) : (
                    <Lock size={16} className="text-gray-700" />
                  )}
                </div>

                {/* Name + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm" style={{ color: unlocked ? "#e2e8f0" : "#374151" }}>
                      {habit.name}
                    </span>
                    {habit.keystone && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0"
                        style={{ background: "rgba(245,200,66,0.1)", color: "#f5c842" }}>
                        ⭐ KEY
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold" style={{ color: TIER_COLORS[habit.tier] }}>
                      TIER {habit.tier} — {TIER_LABELS[habit.tier]}
                    </span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs font-bold" style={{ color: meta.color }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                </div>

                {/* XP + chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold px-2 py-1 rounded-lg"
                    style={{ background: meta.color + "22", color: meta.color }}>
                    +{habit.xpReward}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={14} className="text-gray-600" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-600" />
                  )}
                </div>
              </div>

              {/* Locked message */}
              {!unlocked && !isOpen && (
                <div className="px-4 pb-3 text-xs text-gray-600 font-bold">
                  🔒 LOCKED — Reach Day {habit.unlocksAt} to unlock
                </div>
              )}

              {/* Expanded detail */}
              {isOpen && (
                <div
                  className="px-4 pb-4 border-t"
                  style={{ borderColor: "rgba(255,255,255,0.05)" }}
                >
                  {/* Status tag */}
                  {status !== "locked" && (
                    <div className="flex items-center gap-2 pt-3 mb-3">
                      {status === "automated" && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: "#0d948822", color: "#0d9488" }}>
                          ✓ AUTOMATED — {ph?.streak} days
                        </span>
                      )}
                      {status === "active" && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: meta.color + "22", color: meta.color }}>
                          ACTIVE — 🔥{ph?.streak} day streak
                        </span>
                      )}
                      {status === "upgraded" && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: "#7c3aed22", color: "#a78bfa" }}>
                          ⬆ UPGRADED — 🔥{ph?.streak} day streak
                        </span>
                      )}
                    </div>
                  )}

                  {/* Why */}
                  <div className="mb-3">
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">WHY THIS WORKS</div>
                    <p className="text-xs text-gray-400 leading-relaxed">{habit.why}</p>
                  </div>

                  {/* Cue / Routine / Reward */}
                  <div className="grid grid-cols-1 gap-2 mb-3">
                    <HabitRow label="CUE" text={habit.cue} color="#f59e0b" />
                    <HabitRow label="ROUTINE" text={habit.routine} color="#3b82f6" />
                    <HabitRow label="REWARD" text={habit.reward} color="#0d9488" />
                  </div>

                  {/* Starter / Unlock */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="rounded-xl p-3" style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)" }}>
                      <div className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1">STARTER</div>
                      <div className="text-xs text-gray-400">{habit.starter}</div>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
                      <div className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">UNLOCK</div>
                      <div className="text-xs text-gray-400">{habit.unlock}</div>
                    </div>
                  </div>

                  {/* Formation time */}
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>⏱ Min: {habit.daysToAutomate.min}d</span>
                    <span>Avg: {habit.daysToAutomate.median}d</span>
                    <span>Max: {habit.daysToAutomate.max}d</span>
                  </div>

                  {/* Locked explanation */}
                  {!unlocked && (
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-gray-600">
                      <Lock size={12} />
                      Unlocks at Day {habit.unlocksAt}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HabitRow({ label, text, color }) {
  return (
    <div className="flex gap-2 items-start">
      <div className="text-xs font-bold w-16 shrink-0 pt-0.5" style={{ color }}>{label}</div>
      <div className="text-xs text-gray-400 flex-1">{text}</div>
    </div>
  );
}

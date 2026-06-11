import { useState } from "react";
import { Lock, CheckCircle, ChevronDown, ChevronUp, PauseCircle, PlusCircle } from "lucide-react";
import { useGame } from "../../context/GameContext";
import { HABIT_LIBRARY, STAT_META } from "../../constants/habitLibrary";
import { questSlotsFor, slotsInUse, nextSlotDay } from "../../constants/questSlots";

const STAT_TABS = ["all", "vitality", "focus", "will", "output", "presence", "wisdom"];

const TIER_LABELS = { 1: "EASY", 2: "MEDIUM", 3: "HARD" };
const TIER_COLORS = { 1: "#0d9488", 2: "#f59e0b", 3: "#ef4444" };

export default function CodexScreen() {
  const { state, unlockNewHabit, retireHabit } = useGame();
  const { player, playerHabits } = state;
  const [tab, setTab] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [beginTarget, setBeginTarget]   = useState(null); // library habit for begin/resume dialog
  const [retireTarget, setRetireTarget] = useState(null); // playerHabit for retire dialog

  const assignedLibraryIds = new Set(playerHabits.map(h => h.libraryId));

  // Formation budget: only active/upgraded habits occupy slots
  const slots     = questSlotsFor(player.dayCount);
  const slotsUsed = slotsInUse(playerHabits);
  const slotsFull = slotsUsed >= slots;
  const nextSlot  = nextSlotDay(player.dayCount);

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
    if (ph.status === "retired") return "retired";
    if (ph.isUpgraded) return "upgraded";
    return "active";
  }

  function handleBegin() {
    if (!beginTarget) return;
    unlockNewHabit(beginTarget.id);
    setBeginTarget(null);
  }

  function handleRetire() {
    if (!retireTarget) return;
    retireHabit(retireTarget.id);
    setRetireTarget(null);
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

        {/* Quest slot meter — formation budget */}
        <div
          className="mt-3 rounded-xl px-3 py-2.5"
          style={{ background: "#12151f", border: "1px solid rgba(245,200,66,0.18)" }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#f5c842" }}>
              ⚔️ Quest slots
            </span>
            <span className="text-xs font-bold" style={{ color: slotsFull ? "#ef4444" : "#9ca3af" }}>
              {slotsUsed}/{slots} in use
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: slots }, (_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full"
                style={{
                  background: i < slotsUsed ? "#f5c842" : "rgba(255,255,255,0.08)",
                  boxShadow: i < slotsUsed ? "0 0 4px #f5c84255" : "none",
                }}
              />
            ))}
          </div>
          <div className="text-xs text-gray-600 mt-1.5">
            Automated quests don't use slots — that's the point.
            {nextSlot && <> Next slot unlocks at Day {nextSlot}.</>}
          </div>
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
                  ) : status === "retired" ? (
                    <PauseCircle size={18} className="text-gray-600" />
                  ) : status === "active" || status === "upgraded" ? (
                    <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: meta.color, background: meta.color + "33" }} />
                  ) : unlocked ? (
                    // Available but not started — an invitation, not a lock
                    <PlusCircle size={18} style={{ color: "#f5c842" }} />
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
                      {status === "retired" && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                          ⏸ PAUSED — {ph?.daysActive} days practiced, rank kept
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

                  {/* ── Quest actions ─────────────────────────── */}
                  {((unlocked && status === "locked") || status === "retired") && slotsFull && (
                    <div
                      className="w-full mt-4 px-4 py-3 rounded-xl text-xs leading-relaxed"
                      style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#d1d5db" }}
                    >
                      🔒 <b>All {slots} quest slots in use.</b> Free one by automating a
                      quest (66-day streak) or retiring one
                      {nextSlot && <>, or unlock another slot at Day {nextSlot}</>}.
                    </div>
                  )}
                  {unlocked && status === "locked" && !slotsFull && (
                    <button
                      onClick={() => setBeginTarget(habit)}
                      className="w-full mt-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95"
                      style={{
                        background: "linear-gradient(135deg, #f5c842, #d97706)",
                        color: "#0a0c14",
                      }}
                    >
                      ⚔️ Begin this quest
                    </button>
                  )}
                  {status === "retired" && !slotsFull && (
                    <button
                      onClick={() => setBeginTarget(habit)}
                      className="w-full mt-4 py-3 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95"
                      style={{
                        background: "rgba(245,200,66,0.08)",
                        color: "#f5c842",
                        border: "1px solid rgba(245,200,66,0.35)",
                      }}
                    >
                      ▶ Resume quest — rank preserved
                    </button>
                  )}
                  {(status === "active" || status === "upgraded") && (
                    <button
                      onClick={() => setRetireTarget(ph)}
                      className="w-full mt-4 py-2 rounded-xl font-bold text-xs tracking-wide text-gray-500 transition-all active:scale-95"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1f2335" }}
                    >
                      ⏸ Retire this quest
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Begin / Resume commitment dialog ─────────────────── */}
      {beginTarget && (
        <BeginQuestModal
          habit={beginTarget}
          isResume={getStatus(beginTarget) === "retired"}
          slotsUsed={slotsUsed}
          slots={slots}
          onConfirm={handleBegin}
          onCancel={() => setBeginTarget(null)}
        />
      )}

      {/* ── Retire confirmation ──────────────────────────────── */}
      {retireTarget && (
        <RetireQuestModal
          habit={retireTarget}
          onConfirm={handleRetire}
          onCancel={() => setRetireTarget(null)}
        />
      )}
    </div>
  );
}

function BeginQuestModal({ habit, isResume, slotsUsed, slots, onConfirm, onCancel }) {
  const meta = STAT_META[habit.stat];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 animate-slideUp"
        style={{ background: "#1a1e2e", border: `2px solid ${meta.color}66`, boxShadow: `0 0 40px ${meta.color}22` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: meta.color }}>
          {meta.icon} {isResume ? "RESUME QUEST" : "NEW QUEST"}
        </div>
        <div className="text-white font-bold text-lg mb-3">{habit.name}</div>

        {/* Start tiny */}
        <div className="rounded-xl p-3 mb-3" style={{ background: "rgba(13,148,136,0.07)", border: "1px solid rgba(13,148,136,0.2)" }}>
          <div className="text-xs font-bold text-teal-500 uppercase tracking-widest mb-1">START TINY</div>
          <div className="text-xs text-gray-300">{habit.starter}</div>
        </div>

        <div className="text-xs text-gray-500 mb-3 leading-relaxed">
          ⏱ Forms in ~{habit.daysToAutomate.median} days for most people
          (range {habit.daysToAutomate.min}–{habit.daysToAutomate.max}).
        </div>

        <div
          className="rounded-xl px-3 py-2.5 mb-3 text-xs leading-relaxed"
          style={{ background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.18)", color: "#d1d5db" }}
        >
          Today is a <span className="font-bold" style={{ color: "#f5c842" }}>bonus day</span> —
          completing it earns XP, but it counts toward your daily bar starting <b>tomorrow</b>.
          Your streak is safe.
        </div>

        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          <span style={{ color: "#f5c842" }}>⚔️</span>
          Uses quest slot {slotsUsed + 1} of {slots} — automate it (66-day streak) and
          the slot comes back.
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-400 transition-all active:scale-95"
            style={{ background: "#12151f", border: "1px solid #2a2e40" }}
          >
            Not yet
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #f5c842, #d97706)", color: "#0a0c14" }}
          >
            {isResume ? "▶ Resume" : "⚔️ I commit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RetireQuestModal({ habit, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 animate-slideUp"
        style={{ background: "#1a1e2e", border: "1px solid #2a2e40" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center text-2xl mb-1">⏸</div>
        <h3 className="text-white font-bold text-center text-base mb-2">
          Retire "{habit.name}"?
        </h3>
        <p className="text-xs text-gray-400 text-center mb-4 leading-relaxed">
          No guilt — better to focus than to fake it. Your {habit.daysActive} days of
          practice and your skill rank are kept forever. The streak resets, and you
          can resume from the Codex anytime.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-400 transition-all active:scale-95"
            style={{ background: "#12151f", border: "1px solid #2a2e40" }}
          >
            Keep fighting
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: "rgba(255,255,255,0.06)", color: "#e5e7eb", border: "1px solid #374151" }}
          >
            ⏸ Retire
          </button>
        </div>
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

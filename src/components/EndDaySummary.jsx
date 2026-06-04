import { useState } from "react";
import { X, Star, TrendingUp } from "lucide-react";
import { useGame } from "../context/GameContext";
import { STAT_META } from "../constants/habitLibrary";
import { xpForLevel } from "../reducers/gameReducer";
import XPBar from "./ui/XPBar";

const PHASE_INFO = {
  1: { name: "INSTALL", max: 30 },
  2: { name: "STACK",   max: 66 },
  3: { name: "AUTOMATE",max: 120 },
};

export default function EndDaySummary({ onClose }) {
  const { state } = useGame();
  const { player, stats, today } = state;
  const [page, setPage] = useState(0); // 0=summary, 1=stats

  const phase = PHASE_INFO[player.currentPhase] ?? PHASE_INFO[1];
  const phaseProgress = Math.min(100, (player.dayCount / phase.max) * 100);

  const statEntries = Object.entries(stats);
  const hasXpToday = today.totalXpToday > 0;

  const pct = state.playerHabits.length > 0
    ? today.completedHabitIds.length / state.playerHabits.length
    : 0;

  const coachMsg = today.coachMessage || (
    pct === 1   ? "Full clear. Systems over motivation." :
    pct >= 0.5  ? "Solid. Keep the streak alive." :
    pct > 0     ? "We take the loss. See you tomorrow." :
                  "Zero day. The streak is waiting."
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ background: "rgba(10,12,20,0.97)", backdropFilter: "blur(8px)" }}
    >
      {/* Gold border frame */}
      <div
        className="flex flex-col flex-1 max-w-sm mx-auto w-full px-5 py-6"
        style={{ borderLeft: "1px solid #f5c84222", borderRight: "1px solid #f5c84222" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="self-end text-gray-600 hover:text-gray-400 mb-2"
        >
          <X size={20} />
        </button>

        {/* Day header */}
        <div className="text-center mb-6">
          <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
            DAY {player.dayCount} COMPLETE
          </div>
          <div
            className="text-3xl font-black tracking-wider mb-1"
            style={{
              color: "#f5c842",
              textShadow: "0 0 20px #f5c84266",
            }}
          >
            {pct === 1 ? "⚔️ LEGENDARY" : pct >= 0.5 ? "✓ SOLID RUN" : pct > 0 ? "◌ PARTIAL" : "✗ ZERO DAY"}
          </div>
          <div className="text-xs text-gray-400">
            {today.completedHabitIds.length}/{state.playerHabits.length} enemies defeated
          </div>
        </div>

        {/* Total XP */}
        {hasXpToday && (
          <div
            className="rounded-2xl p-4 mb-5 text-center"
            style={{ background: "rgba(245,200,66,0.07)", border: "1px solid rgba(245,200,66,0.2)" }}
          >
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">
              XP EARNED TODAY
            </div>
            <div
              className="text-4xl font-black"
              style={{ color: "#f5c842", textShadow: "0 0 16px #f5c84255" }}
            >
              +{today.totalXpToday}
            </div>
            {today.streakMultiplier > 1 && (
              <div className="text-xs text-teal-400 mt-1">
                {today.streakMultiplier}× streak multiplier applied
              </div>
            )}
          </div>
        )}

        {/* XP by stat */}
        <div className="mb-5">
          <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-3">
            STAT GAINS
          </div>
          <div className="space-y-3">
            {statEntries.map(([key, val]) => {
              const meta = STAT_META[key];
              const earned = today.xpEarnedByStatToday[key] ?? 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">{meta.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-gray-500">
                        Lv {val.level} · {val.xp}/{xpForLevel(val.level)} XP
                        {earned > 0 && (
                          <span className="text-gold font-bold ml-1">+{earned}</span>
                        )}
                      </span>
                    </div>
                    <XPBar xp={val.xp} level={val.level} color={meta.color} height={6} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global streak */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
          style={{ background: "#12151f", border: "1px solid #1f2335" }}
        >
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">Global Streak</div>
            <div className="text-white font-bold text-sm mt-0.5">
              {player.globalStreakFrozen ? (
                <span className="text-blue-400">❄️ Frozen — resume tomorrow</span>
              ) : (
                <span className={player.globalStreak >= 7 ? "flame-glow" : ""} style={{ color: "#f59e0b" }}>
                  🔥 {player.globalStreak} days
                </span>
              )}
            </div>
          </div>
          <TrendingUp size={20} className="text-gray-600" />
        </div>

        {/* Phase progress */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">
            <span>Phase {player.currentPhase} — {phase.name}</span>
            <span>Day {player.dayCount}/{phase.max}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${phaseProgress}%`,
                background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                boxShadow: "0 0 8px #7c3aed88",
              }}
            />
          </div>
        </div>

        {/* Coach message */}
        <div
          className="rounded-2xl px-5 py-4 mb-6"
          style={{ background: "#12151f", border: "1px solid #1f2335" }}
        >
          <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-2">
            COACH
          </div>
          <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {coachMsg}
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-base tracking-widest uppercase transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #f5c842, #d97706)",
            color: "#0a0c14",
            boxShadow: "0 0 20px #f5c84244",
          }}
        >
          See you tomorrow, {player.name}.
        </button>
      </div>
    </div>
  );
}

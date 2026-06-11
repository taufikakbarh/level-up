import { X } from "lucide-react";
import { useGame } from "../context/GameContext";
import { STAT_META } from "../constants/habitLibrary";
import { heroProgress, totalXpOf } from "../constants/hero";
import XPBar from "./ui/XPBar";
import HeroAvatar from "./ui/HeroAvatar";

const PHASE_INFO = {
  1: { name: "INSTALL", max: 30 },
  2: { name: "STACK",   max: 66 },
  3: { name: "AUTOMATE",max: 120 },
};

export default function EndDaySummary({ onClose }) {
  const { state } = useGame();
  const { player, stats, today } = state;

  const phase = PHASE_INFO[player.currentPhase] ?? PHASE_INFO[1];
  const phaseProgress = Math.min(100, (player.dayCount / phase.max) * 100);
  const hero = heroProgress(totalXpOf(stats));

  const pct = state.playerHabits.length > 0
    ? today.completedHabitIds.length / state.playerHabits.length
    : 0;

  const verdict =
    pct === 1   ? { label: "LEGENDARY", icon: "⚔️", pose: "cheer" } :
    pct >= 0.5  ? { label: "SOLID RUN", icon: "✓",  pose: "idle"  } :
    pct > 0     ? { label: "PARTIAL",   icon: "◌",  pose: "idle"  } :
                  { label: "ZERO DAY",  icon: "✗",  pose: "sad"   };

  const coachMsg = today.coachMessage || (
    pct === 1   ? "Full clear. Systems over motivation." :
    pct >= 0.5  ? "Solid. Keep the streak alive." :
    pct > 0     ? "We take the loss. See you tomorrow." :
                  "Zero day. The streak is waiting."
  );

  // Only the stats that actually moved today
  const gainedStats = Object.entries(stats).filter(
    ([key]) => (today.xpEarnedByStatToday[key] ?? 0) > 0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 summary-overlay"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl animate-slideUp overflow-y-auto scrollbar-hide"
        style={{
          background: "#1a1e2e",
          border: "1px solid rgba(245,200,66,0.35)",
          boxShadow: "0 0 40px rgba(245,200,66,0.15), 0 20px 60px rgba(0,0,0,0.6)",
          maxHeight: "85svh",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Verdict header ───────────────────────────────── */}
        <div
          className="relative px-5 pt-5 pb-4 text-center"
          style={{ background: "linear-gradient(180deg, rgba(245,200,66,0.08), transparent)" }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-600 hover:text-gray-400"
          >
            <X size={18} />
          </button>

          <div className="flex justify-center mb-2">
            <HeroAvatar stage={hero.stage.stage} pose={verdict.pose} size={52} />
          </div>
          <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">
            DAY {player.dayCount} COMPLETE
          </div>
          <div
            className="text-2xl font-black tracking-wider mt-1"
            style={{ color: "#f5c842", textShadow: "0 0 16px #f5c84255" }}
          >
            {verdict.icon} {verdict.label}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {today.completedHabitIds.length}/{state.playerHabits.length} enemies defeated
            {today.totalXpToday > 0 && (
              <>
                {" · "}
                <span className="font-bold" style={{ color: "#f5c842" }}>
                  +{today.totalXpToday} XP
                </span>
                {today.streakMultiplier > 1 && (
                  <span className="text-teal-400"> ({today.streakMultiplier}×)</span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="px-5 pb-5">

          {/* ── Stat gains (only stats that moved) ───────────── */}
          {gainedStats.length > 0 && (
            <div className="rounded-xl p-3 mb-3" style={{ background: "#12151f", border: "1px solid #1f2335" }}>
              <div className="space-y-2.5">
                {gainedStats.map(([key, val]) => {
                  const meta = STAT_META[key];
                  const earned = today.xpEarnedByStatToday[key];
                  return (
                    <div key={key} className="flex items-center gap-2.5">
                      <span className="text-sm w-5 text-center">{meta.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                            {meta.label} <span className="text-gray-600 font-normal">Lv {val.level}</span>
                          </span>
                          <span className="font-bold" style={{ color: "#f5c842" }}>+{earned}</span>
                        </div>
                        <XPBar xp={val.xp} level={val.level} color={meta.color} height={4} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Streak + phase ───────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl px-3 py-2.5" style={{ background: "#12151f", border: "1px solid #1f2335" }}>
              <div className="text-xs text-gray-600 uppercase tracking-wider font-bold mb-0.5">Streak</div>
              {player.globalStreakFrozen ? (
                <div className="text-xs font-bold text-blue-400">❄️ Frozen</div>
              ) : (
                <div
                  className={`text-sm font-bold ${player.globalStreak >= 7 ? "flame-glow" : ""}`}
                  style={{ color: "#f59e0b" }}
                >
                  🔥 {player.globalStreak} days
                </div>
              )}
            </div>
            <div className="rounded-xl px-3 py-2.5" style={{ background: "#12151f", border: "1px solid #1f2335" }}>
              <div className="text-xs text-gray-600 uppercase tracking-wider font-bold mb-0.5">
                {phase.name} · {player.dayCount}/{phase.max}
              </div>
              <div className="w-full h-1.5 mt-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${phaseProgress}%`,
                    background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* ── Coach message ────────────────────────────────── */}
          <div
            className="rounded-xl px-4 py-3 mb-4"
            style={{ background: "rgba(245,200,66,0.05)", border: "1px solid rgba(245,200,66,0.15)" }}
          >
            <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-line italic">
              "{coachMsg}"
            </p>
          </div>

          {/* ── CTA ──────────────────────────────────────────── */}
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-black text-sm tracking-widest uppercase transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #f5c842, #d97706)",
              color: "#0a0c14",
              boxShadow: "0 0 20px #f5c84233",
            }}
          >
            See you tomorrow, {player.name}.
          </button>
        </div>
      </div>
    </div>
  );
}

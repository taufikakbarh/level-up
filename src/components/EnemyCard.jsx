import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { STAT_META, STREAK_MILESTONES, HABIT_LIBRARY } from "../constants/habitLibrary";
import { skillMetaFor, skillRankFor, nextSkillRank } from "../constants/skills";
import FloatingXP from "./ui/FloatingXP";
import StreakPopup from "./ui/StreakPopup";
import LevelUpOverlay from "./ui/LevelUpOverlay";
import RankUpPopup from "./ui/RankUpPopup";
import SkillStars from "./ui/SkillStars";

const STAT_COLORS = {
  vitality: "#ef4444", focus: "#3b82f6", will: "#f59e0b",
  output: "#8b5cf6", presence: "#ec4899", wisdom: "#10b981",
};

function getLibraryCue(libId) {
  const lib = HABIT_LIBRARY.find(h => h.id === libId);
  return lib?.cue ?? "";
}

// Animation timing
const SHAKE_MS   = 400;
const DRAIN_MS   = 500;  // HP bar drains over 500ms
const DEFEAT_MS  = 200;  // brief pause before defeated state shows

export default function EnemyCard({ habit, completed, onComplete, onUncomplete, lastXpGain, dayEnded }) {
  // 'idle' | 'shaking' | 'draining' | 'defeated'
  const [phase, setPhase]           = useState("idle");
  const [showXP, setShowXP]         = useState(false);
  const [streakMilestone, setStreak] = useState(null);
  const [particles, setParticles]   = useState(null);
  const [rankUp, setRankUp]         = useState(null);

  const color   = STAT_COLORS[habit.stat] ?? "#ffffff";
  const meta    = STAT_META[habit.stat];
  const isMyXp  = lastXpGain?.habitId === habit.id;
  const showLevelUp = isMyXp && lastXpGain?.leveled && lastXpGain?.levelUps?.length > 0;

  // Skill identity — rank is derived from lifetime days, +1 once
  // completed today so the card responds immediately.
  const skill        = skillMetaFor(habit.libraryId);
  const effDays      = habit.daysActive + (completed ? 1 : 0);
  const rank         = skillRankFor(effDays, habit.status);
  const nextRank     = nextSkillRank(effDays, habit.status);

  function handleClick() {
    if (completed || phase !== "idle") return;

    // 1. Shake + impact burst (particle directions rolled per hit)
    setPhase("shaking");
    setParticles(
      Array.from({ length: 9 }, (_, i) => {
        const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.6;
        const dist  = 45 + Math.random() * 45;
        return {
          i,
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist}px`,
          delay: `${Math.random() * 0.1}s`,
          color: i % 3 === 0 ? "#f5c842" : color,
        };
      })
    );
    setTimeout(() => setParticles(null), 700);

    // 2. Start HP drain after shake
    setTimeout(() => {
      setPhase("draining");
    }, SHAKE_MS);

    // 3. Fire XP float mid-drain
    setTimeout(() => {
      setShowXP(true);
    }, SHAKE_MS + DRAIN_MS * 0.4);

    // 4. Award XP + flip to defeated after drain completes
    setTimeout(() => {
      onComplete(habit.id);
      setPhase("defeated");

      // Streak milestone check
      const nextStreak = habit.streak + 1;
      if (STREAK_MILESTONES.includes(nextStreak)) {
        setTimeout(() => setStreak(nextStreak), 300);
      }

      // Skill rank-up check — completing today pushes effective days +1
      const rankBefore = skillRankFor(habit.daysActive, habit.status);
      const rankAfter  = skillRankFor(habit.daysActive + 1, habit.status);
      if (rankAfter.id !== rankBefore.id) {
        setTimeout(() => setRankUp(rankAfter), 600);
      }
    }, SHAKE_MS + DRAIN_MS + DEFEAT_MS);
  }

  // Treat the card as visually defeated if prop is true OR local phase is defeated
  const isDefeated = completed || phase === "defeated";
  const isDraining = phase === "draining";

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
      {rankUp && (
        <RankUpPopup skill={skill} rank={rankUp} onDone={() => setRankUp(null)} />
      )}

      <div
        onClick={handleClick}
        className={`relative rounded-2xl p-4 mb-3 select-none transition-all duration-500
          ${phase === "shaking" ? "card-shake" : ""}
          ${isDefeated ? "defeated-card" : "cursor-pointer active:scale-[0.98]"}
        `}
        style={{
          background:  isDefeated ? "#0d0f18" : "#12151f",
          border:      `2px solid ${isDefeated ? "#1a1e2e" : color}`,
          boxShadow:   isDefeated ? "none" : `0 0 14px ${color}25, inset 0 0 24px ${color}07`,
        }}
      >
        {/* Hit effects: flash, slash, particle burst */}
        {particles && (
          <div className="absolute inset-0 z-10 overflow-hidden rounded-2xl pointer-events-none">
            <div
              className="impact-flash"
              style={{ background: `radial-gradient(circle, ${color}50, transparent 70%)` }}
            />
            <div
              className="slash-line"
              style={{ background: `linear-gradient(90deg, transparent, #ffffff, ${color}, transparent)` }}
            />
            {particles.map(p => (
              <span
                key={p.i}
                className="hit-particle"
                style={{
                  left: "50%",
                  top: "50%",
                  background: p.color,
                  boxShadow: `0 0 6px ${p.color}`,
                  animationDelay: p.delay,
                  "--dx": p.dx,
                  "--dy": p.dy,
                }}
              />
            ))}
          </div>
        )}

        {/* Floating XP */}
        {showXP && isMyXp && (
          <FloatingXP
            amount={lastXpGain?.xpGained ?? habit.xpReward}
            stat={habit.stat}
            onDone={() => setShowXP(false)}
          />
        )}

        {/* ── Top row ───────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-sm">{meta?.icon}</span>
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color }}>
                {meta?.label}
              </span>
              {habit.status === "automated" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#0d9488", color: "#fff" }}>
                  ✓ AUTOMATED
                </span>
              )}
              {habit.isUpgraded && habit.status !== "automated" && (
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#7c3aed22", color: "#a78bfa", border: "1px solid #7c3aed44" }}>
                  ⬆ UPGRADED
                </span>
              )}
            </div>
            <div className="font-bold text-base leading-snug">
              {isDefeated
                ? <span className="text-gray-600 line-through">{habit.name}</span>
                : <span className="text-white">{habit.name}</span>
              }
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <div
              className="text-xs font-bold px-2 py-1 rounded-lg"
              style={{
                background: isDefeated ? "#1a1e2e" : `${color}22`,
                color:      isDefeated ? "#374151" : color,
                border:     `1px solid ${isDefeated ? "#1f2335" : color + "44"}`,
              }}
            >
              +{habit.xpReward} XP
            </div>
            {habit.streak > 0 && (
              <div className={`text-xs font-bold ${habit.streak >= 7 ? "flame-glow" : ""}`}
                style={{ color: "#f59e0b" }}>
                🔥 {habit.streak}
              </div>
            )}
          </div>
        </div>

        {/* ── Skill badge ───────────────────────────────────── */}
        <div className={`flex items-center gap-2 mb-3 ${isDefeated ? "opacity-50" : ""}`}>
          <span className="text-xs">{skill.icon}</span>
          <span className="text-xs font-bold tracking-wide" style={{ color: rank.color }}>
            {skill.name}
          </span>
          <SkillStars rank={rank} size={7} />
          <span className="text-xs text-gray-600 ml-auto">
            {nextRank
              ? `${rank.label} · next in ${nextRank.minDays - effDays}d`
              : "★ MASTERED"}
          </span>
        </div>

        {/* ── HP bar (active + draining) ─────────────────────── */}
        {!isDefeated && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span className="font-bold uppercase tracking-wider">HP</span>
              <span>{isDraining ? "0%" : "100%"}</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width:      isDraining ? "0%" : "100%",
                  background: color,
                  boxShadow:  `0 0 8px ${color}99`,
                  transition: isDraining
                    ? `width ${DRAIN_MS}ms cubic-bezier(0.4,0,0.2,1)`
                    : "none",
                }}
              />
            </div>
          </div>
        )}

        {/* ── Defeated row ──────────────────────────────────── */}
        {isDefeated && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.03)" }} />
            <span className="text-xs font-black text-gray-700 uppercase tracking-widest">
              DEFEATED
            </span>
            {!dayEnded && (
              <button
                onClick={e => { e.stopPropagation(); onUncomplete(habit.id); setPhase("idle"); }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all active:scale-95 ml-1"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <RotateCcw size={10} />
                Undo
              </button>
            )}
          </div>
        )}

        {/* ── Cue reminder ──────────────────────────────────── */}
        {!isDefeated && (
          <div className="text-xs text-gray-600 italic mt-2 leading-relaxed">
            📍 {getLibraryCue(habit.libraryId)}
          </div>
        )}

        {/* ── Frozen badge ──────────────────────────────────── */}
        {habit.streakFrozen && !isDefeated && (
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

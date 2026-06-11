import { useEffect, useRef, useState } from "react";
import { useGame } from "../../context/GameContext";
import { heroProgress, totalXpOf } from "../../constants/hero";
import HeroAvatar from "./HeroAvatar";

// Quest-screen centerpiece: the hero idles, attacks when a habit is
// defeated, cheers on a full clear, and droops if the day ends short.
export default function HeroPanel({ allDone }) {
  const { state } = useGame();
  const { player, stats, today, _lastXpGain } = state;

  const hero = heroProgress(totalXpOf(stats));
  const pct = Math.min(100, (hero.xpInto / hero.xpNeeded) * 100);

  const [attacking, setAttacking] = useState(false);
  const [leveledUp, setLeveledUp] = useState(false);
  const [evolved, setEvolved]     = useState(null);
  const prevLevel = useRef(hero.level);
  const prevStage = useRef(hero.stage.stage);

  // Swing on every habit defeat — skip the mount run, since a stale
  // _lastXpGain can survive in state from an earlier completion
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (!_lastXpGain) return;
    setAttacking(true);
    const t = setTimeout(() => setAttacking(false), 600);
    return () => clearTimeout(t);
  }, [_lastXpGain]);

  // Hero level-up badge
  useEffect(() => {
    if (hero.level > prevLevel.current) {
      setLeveledUp(true);
      const t = setTimeout(() => setLeveledUp(false), 1800);
      prevLevel.current = hero.level;
      return () => clearTimeout(t);
    }
    prevLevel.current = hero.level;
  }, [hero.level]);

  // Evolution overlay when crossing a stage threshold
  useEffect(() => {
    if (hero.stage.stage > prevStage.current) {
      setEvolved(hero.stage);
    }
    prevStage.current = hero.stage.stage;
  }, [hero.stage.stage]);

  const basePose =
    today.dayEnded && !allDone ? "sad" :
    allDone                    ? "cheer" :
                                 "idle";
  const pose = attacking ? "attack" : basePose;

  return (
    <>
      <div
        className="relative flex items-center gap-4 rounded-2xl px-4 py-3 mb-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #12151f, #1a1e2e)",
          border: "1px solid rgba(245,200,66,0.18)",
          boxShadow: "0 0 24px rgba(245,200,66,0.05)",
        }}
      >
        <HeroAvatar stage={hero.stage.stage} pose={pose} size={64} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs font-black tracking-widest uppercase"
              style={{ color: "#f5c842" }}
            >
              {hero.stage.name}
            </span>
            <span className="text-xs font-bold text-gray-400">Lv {hero.level}</span>
            {leveledUp && (
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full animate-fadeIn"
                style={{ background: "rgba(245,200,66,0.15)", color: "#f5c842", border: "1px solid rgba(245,200,66,0.4)" }}
              >
                ⬆ LEVEL UP!
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 italic mt-0.5 truncate">
            {hero.stage.tagline}
          </div>

          {/* Hero XP bar */}
          <div className="mt-2">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #f5c842, #d97706)",
                  boxShadow: pct > 0 ? "0 0 6px #f5c84266" : "none",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{player.name}</span>
              <span>{hero.xpInto}/{hero.xpNeeded} XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Evolution overlay ─────────────────────────────────── */}
      {evolved && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center level-up-flash"
          style={{ background: "rgba(245,200,66,0.25)", backdropFilter: "blur(5px)" }}
          onClick={() => setEvolved(null)}
          onAnimationEnd={() => setEvolved(null)}
        >
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <HeroAvatar stage={evolved.stage} pose="cheer" size={110} />
            </div>
            <div
              className="text-white font-black text-3xl tracking-widest uppercase"
              style={{ textShadow: "0 0 20px #f5c842" }}
            >
              EVOLUTION!
            </div>
            <div className="text-gold font-bold text-xl mt-1" style={{ color: "#f5c842" }}>
              You became a {evolved.name}
            </div>
            <div className="text-gray-300 text-xs italic mt-2">{evolved.tagline}</div>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import { STAT_META } from "../../constants/habitLibrary";

export default function LevelUpOverlay({ stat, level, onDone }) {
  const [visible, setVisible] = useState(true);
  const meta = STAT_META[stat];

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1400);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center level-up-flash"
      style={{ background: "rgba(124, 58, 237, 0.6)", backdropFilter: "blur(4px)" }}
    >
      <div className="text-center">
        <div className="text-6xl mb-2">{meta?.icon}</div>
        <div className="text-white font-bold text-3xl tracking-widest uppercase" style={{ textShadow: "0 0 20px #f5c842" }}>
          LEVEL UP!
        </div>
        <div className="text-gold font-bold text-xl mt-1">
          {meta?.label} → LV {level}
        </div>

        {/* Confetti */}
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 40}%`,
              backgroundColor: ["#f5c842", "#7c3aed", meta?.color, "#0d9488"][i % 4],
              animationDelay: `${Math.random() * 0.4}s`,
              animationDuration: `${0.8 + Math.random() * 0.6}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

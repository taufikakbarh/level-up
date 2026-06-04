import { useEffect } from "react";
import { STREAK_MESSAGES } from "../../constants/habitLibrary";

export default function StreakPopup({ milestone, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50 pointer-events-none pb-24">
      <div
        className="streak-pop px-6 py-4 rounded-xl text-center max-w-xs"
        style={{
          background: "linear-gradient(135deg, #1a1e2e, #2a2040)",
          border: "2px solid #f59e0b",
          boxShadow: "0 0 30px #f59e0b44",
        }}
      >
        <div className="text-2xl mb-1 flame-glow">🔥</div>
        <div className="text-gold font-bold text-sm tracking-widest uppercase">
          {STREAK_MESSAGES[milestone]}
        </div>
      </div>
    </div>
  );
}

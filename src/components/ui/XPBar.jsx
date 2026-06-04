import { xpForLevel } from "../../reducers/gameReducer";

export default function XPBar({ xp, level, color = "#0d9488", height = 8, showLabel = false }) {
  const needed = xpForLevel(level);
  const pct = Math.min(100, (xp / needed) * 100);

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{xp} XP</span>
          <span>{needed} XP</span>
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="h-full rounded-full xp-bar-fill"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${color}88`,
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}

import { useEffect } from "react";
import SkillStars from "./SkillStars";

export default function RankUpPopup({ skill, rank, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 flex items-end justify-center z-50 pointer-events-none pb-24">
      <div
        className="streak-pop px-6 py-4 rounded-xl text-center max-w-xs"
        style={{
          background: "linear-gradient(135deg, #1a1e2e, #232040)",
          border: `2px solid ${rank.color}`,
          boxShadow: `0 0 30px ${rank.color}44`,
        }}
      >
        <div className="text-2xl mb-1">{skill.icon}</div>
        <div className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1">
          SKILL RANK UP
        </div>
        <div className="font-black text-base" style={{ color: rank.color }}>
          {skill.name}
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <SkillStars rank={rank} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: rank.color }}>
            {rank.label}
          </span>
        </div>
      </div>
    </div>
  );
}

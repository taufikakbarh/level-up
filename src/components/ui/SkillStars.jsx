import { SKILL_RANKS, skillRankIndex } from "../../constants/skills";

// 5 pips, one per rank — filled up to the current rank, in its color.
export default function SkillStars({ rank, size = 8 }) {
  const filled = skillRankIndex(rank) + 1;
  return (
    <span className="inline-flex items-center gap-0.5">
      {SKILL_RANKS.map((r, i) => (
        <span
          key={r.id}
          style={{
            width: size,
            height: size,
            borderRadius: 2,
            transform: "rotate(45deg)",
            background: i < filled ? rank.color : "rgba(255,255,255,0.08)",
            boxShadow: i < filled ? `0 0 4px ${rank.color}66` : "none",
          }}
        />
      ))}
    </span>
  );
}

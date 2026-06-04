import { useEffect, useState } from "react";

export default function FloatingXP({ amount, stat, onDone }) {
  const [visible, setVisible] = useState(true);

  const statColors = {
    vitality: "#ef4444", focus: "#3b82f6", will: "#f59e0b",
    output: "#8b5cf6", presence: "#ec4899", wisdom: "#10b981",
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 900);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="float-xp select-none"
      style={{
        color: statColors[stat] ?? "#f5c842",
        textShadow: `0 0 8px ${statColors[stat] ?? "#f5c842"}`,
        left: "50%",
        top: "40%",
        transform: "translateX(-50%)",
      }}
    >
      +{amount} XP ⚡
    </div>
  );
}

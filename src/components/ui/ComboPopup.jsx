// Escalating combo flash — purely visual, the XP economy is untouched.

const TIERS = [
  { min: 5, color: "#ef4444", label: "UNSTOPPABLE", size: "2.2rem"  },
  { min: 4, color: "#a78bfa", label: "RAMPAGE",     size: "1.95rem" },
  { min: 3, color: "#f5c842", label: "COMBO",       size: "1.75rem" },
  { min: 2, color: "#2dd4bf", label: "COMBO",       size: "1.6rem"  },
];

export default function ComboPopup({ combo, onDone }) {
  const tier = TIERS.find(t => combo.count >= t.min) ?? TIERS[TIERS.length - 1];

  return (
    <div
      key={combo.id}
      className="combo-pop select-none text-center"
      onAnimationEnd={onDone}
    >
      <div
        className="font-black tracking-widest"
        style={{
          fontSize: tier.size,
          color: tier.color,
          textShadow: `0 0 14px ${tier.color}, 0 2px 0 rgba(0,0,0,0.5)`,
        }}
      >
        {combo.count}× {tier.label}!
      </div>
    </div>
  );
}

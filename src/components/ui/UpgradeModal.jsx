import { HABIT_LIBRARY } from "../../constants/habitLibrary";

export default function UpgradeModal({ habit, onAccept, onDismiss }) {
  const lib = HABIT_LIBRARY.find(h => h.id === habit.libraryId);
  if (!lib) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 animate-slideUp"
        style={{ background: "#1a1e2e", border: "2px solid #f5c842", boxShadow: "0 0 40px #f5c84244" }}
      >
        <div className="text-gold font-bold text-xs tracking-widest uppercase mb-3">
          ⬆ READY TO LEVEL UP THIS HABIT?
        </div>

        <div className="text-white font-bold text-lg mb-2">"{habit.name}"</div>
        <p className="text-gray-400 text-sm mb-4">
          14 days consistent. Your brain has started to automate this. Time to make it harder.
        </p>

        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: "rgba(245,200,66,0.06)", border: "1px solid rgba(245,200,66,0.2)" }}
        >
          <div className="text-gold text-xs font-bold uppercase tracking-widest mb-1">UPGRADE TO:</div>
          <div className="text-white text-sm">{lib.unlock}</div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #f5c842, #d97706)", color: "#0a0c14" }}
          >
            Accept upgrade
          </button>
          <button
            onClick={onDismiss}
            className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wide text-gray-400"
            style={{ background: "#12151f", border: "1px solid #2a2e40" }}
          >
            Keep current
          </button>
        </div>
      </div>
    </div>
  );
}

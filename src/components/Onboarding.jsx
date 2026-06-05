import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { STAT_META, HABIT_LIBRARY, STARTER_HABIT_IDS } from "../constants/habitLibrary";
import XPBar from "./ui/XPBar";

const STAT_ORDER = ["vitality", "focus", "will", "output", "presence", "wisdom"];

// Post-auth onboarding — shown only to brand-new players.
// Auth is already done. Steps: name → stats preview → habits preview → enter.
export default function Onboarding({ onComplete, loading }) {
  const [step, setStep] = useState(0); // 0=name, 1=stats, 2=habits
  const [name, setName] = useState("");

  function next() { setStep(s => s + 1); }

  // ── Step 0: Name ─────────────────────────────────────────────
  if (step === 0) {
    return (
      <Screen>
        <div className="text-center mb-8 animate-fadeIn">
          <div className="text-5xl mb-5">🧙</div>
          <h1 className="text-white font-black text-2xl mb-2">
            What's your name, player?
          </h1>
          <p className="text-gray-500 text-sm">
            This is how the game will address you.
          </p>
        </div>

        <input
          type="text"
          placeholder="Enter your name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && name.trim() && next()}
          autoFocus
          className="w-full px-5 py-4 rounded-xl text-white text-center text-xl font-bold mb-6 outline-none"
          style={{
            background: "#12151f",
            border: "2px solid rgba(245,200,66,0.3)",
            caretColor: "#f5c842",
          }}
        />

        <GoldButton onClick={next} disabled={!name.trim()}>
          Continue <ChevronRight size={18} />
        </GoldButton>

        <Dots step={0} />
      </Screen>
    );
  }

  // ── Step 1: Character stats ──────────────────────────────────
  if (step === 1) {
    return (
      <Screen>
        <div className="text-center mb-6 animate-fadeIn">
          <div className="text-4xl mb-3">📊</div>
          <h1 className="text-white font-black text-xl mb-1">This is you. Right now.</h1>
          <p className="text-gray-500 text-sm">Six stats. Zero excuses.</p>
        </div>

        <div className="space-y-3 mb-8 w-full animate-fadeIn">
          {STAT_ORDER.map(key => {
            const meta = STAT_META[key];
            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "#12151f", border: `1px solid ${meta.color}22` }}
              >
                <span className="text-xl w-7 text-center">{meta.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs tracking-widest uppercase" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span className="text-xs text-gray-600">LVL 1</span>
                  </div>
                  <XPBar xp={0} level={1} color={meta.color} height={5} />
                </div>
              </div>
            );
          })}
        </div>

        <GoldButton onClick={next}>
          See my first enemies <ChevronRight size={18} />
        </GoldButton>

        <Dots step={1} />
      </Screen>
    );
  }

  // ── Step 2: Starter habits ───────────────────────────────────
  if (step === 2) {
    return (
      <Screen scrollable>
        <div className="text-center mb-7 animate-fadeIn">
          <div className="text-5xl mb-4">⚔️</div>
          <h1 className="text-white font-black text-2xl mb-2">Your First Enemies</h1>
          <p className="text-gray-500 text-sm">Chosen by science, not guesswork.</p>
        </div>

        <div className="space-y-2 mb-6 w-full animate-fadeIn">
          {STARTER_HABIT_IDS.map(id => {
            const habit = HABIT_LIBRARY.find(h => h.id === id);
            const meta  = STAT_META[habit.stat];
            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-xl px-3 py-3"
                style={{ background: "#12151f", border: `2px solid ${meta.color}33` }}
              >
                <span className="text-lg shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-white">{habit.name}</div>
                  <div className="text-xs text-gray-600 truncate">{habit.starter}</div>
                </div>
                <div className="text-xs font-bold shrink-0" style={{ color: meta.color }}>
                  +{habit.xpReward} XP
                </div>
              </div>
            );
          })}
        </div>

        {/* Comeback mechanic */}
        <div
          className="rounded-2xl p-5 mb-8 w-full animate-fadeIn"
          style={{ background: "rgba(30,58,95,0.4)", border: "1px solid #2563eb33" }}
        >
          <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
            ❄️ THE COMEBACK MECHANIC
          </div>
          <div className="text-xs text-gray-400 leading-relaxed">
            Miss one day? Your streak <span className="text-blue-300 font-bold">freezes</span> — not breaks.
            Miss two in a row and it resets. One bad day is just a frozen streak.
          </div>
        </div>

        <GoldButton onClick={() => onComplete(name.trim())} disabled={loading}>
          {loading ? "Creating your character…" : `Enter the battle, ${name} ⚔️`}
        </GoldButton>

        <Dots step={2} />
      </Screen>
    );
  }

  return null;
}

// ── Shared layout ────────────────────────────────────────────────
function Screen({ children, scrollable = false }) {
  if (scrollable) {
    return (
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
        style={{ background: "#0a0c14" }}
      >
        <div className="min-h-full flex flex-col items-center px-6 pt-14 pb-14">
          <div className="w-full max-w-sm flex flex-col items-center">
            {children}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "#0a0c14" }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}

function GoldButton({ children, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-5 px-10 rounded-2xl font-black text-base tracking-widest uppercase transition-all active:scale-95 disabled:opacity-40 flex items-center justify-center gap-3"
      style={{ background: "linear-gradient(135deg, #f5c842, #d97706)", color: "#0a0c14" }}
    >
      {children}
    </button>
  );
}

function Dots({ step }) {
  return (
    <div className="flex gap-2 mt-8">
      {[0, 1, 2].map(s => (
        <div
          key={s}
          className="h-1.5 rounded-full transition-all duration-300"
          style={{
            width: step === s ? 24 : 8,
            background: step >= s ? "#f5c842" : "rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

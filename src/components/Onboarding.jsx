import { useState, useRef } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { STAT_META, HABIT_LIBRARY, STARTER_HABIT_IDS } from "../constants/habitLibrary";
import XPBar from "./ui/XPBar";

const STAT_ORDER = ["vitality", "focus", "will", "output", "presence", "wisdom"];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  function advance() {
    setStep(s => s + 1);
  }

  function handleStart() {
    if (name.trim().length === 0) return;
    onComplete(name.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "#0a0c14" }}
    >
      <div className="w-full max-w-sm px-6 flex flex-col items-center">

        {/* ── Step 0 — Hero ──────────────────────────────────── */}
        {step === 0 && (
          <div className="text-center animate-fadeIn">
            <div className="text-6xl mb-8">⚔️</div>
            <div
              className="font-black text-4xl mb-3 leading-tight tracking-wide"
              style={{ color: "#f5c842", textShadow: "0 0 30px #f5c84266" }}
            >
              LEVEL UP
            </div>
            <div className="text-gray-400 text-base mb-2 italic">
              Every legend started at Level 1.
            </div>
            <div className="text-gray-600 text-sm mb-12">
              Science-backed habits. Real results. No excuses.
            </div>
            <button
              onClick={advance}
              className="px-10 py-4 rounded-2xl font-black text-lg tracking-widest uppercase transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f5c842, #d97706)",
                color: "#0a0c14",
                boxShadow: "0 0 30px #f5c84255",
              }}
            >
              Begin
            </button>
          </div>
        )}

        {/* ── Step 1 — Name ──────────────────────────────────── */}
        {step === 1 && (
          <div className="w-full text-center animate-fadeIn">
            <div className="text-4xl mb-6">🧙</div>
            <div className="text-white font-black text-2xl mb-2">
              What's your name, player?
            </div>
            <div className="text-gray-500 text-sm mb-8">
              This is how the game will address you.
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter your name…"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && name.trim() && advance()}
              autoFocus
              className="w-full px-5 py-4 rounded-xl text-white text-center text-xl font-bold mb-6 outline-none"
              style={{
                background: "#12151f",
                border: "2px solid rgba(245,200,66,0.3)",
                caretColor: "#f5c842",
              }}
            />
            <button
              onClick={advance}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl font-black text-base tracking-widest uppercase transition-all active:scale-95 disabled:opacity-30"
              style={{
                background: "linear-gradient(135deg, #f5c842, #d97706)",
                color: "#0a0c14",
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 2 — Character sheet ────────────────────────── */}
        {step === 2 && (
          <div className="w-full animate-fadeIn">
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">📊</div>
              <div className="text-white font-black text-xl">This is you. Right now.</div>
              <div className="text-gray-500 text-sm mt-1">Six stats. Zero excuses.</div>
            </div>

            <div className="space-y-3 mb-8">
              {STAT_ORDER.map(key => {
                const meta = STAT_META[key];
                return (
                  <div
                    key={key}
                    className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: "#12151f", border: `1px solid ${meta.color}22` }}
                  >
                    <span className="text-xl w-8 text-center">{meta.icon}</span>
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

            <button
              onClick={advance}
              className="w-full py-4 rounded-2xl font-black text-base tracking-widest uppercase transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #f5c842, #d97706)", color: "#0a0c14" }}
            >
              See my starting habits
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* ── Step 3 — Starter habits ─────────────────────────── */}
        {step === 3 && (
          <div className="w-full animate-fadeIn">
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">⚔️</div>
              <div className="text-white font-black text-xl">Your First Enemies</div>
              <div className="text-gray-500 text-sm mt-1">
                Chosen by science, not guesswork.
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {STARTER_HABIT_IDS.map(id => {
                const habit = HABIT_LIBRARY.find(h => h.id === id);
                const meta = STAT_META[habit.stat];
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-xl px-3 py-3"
                    style={{
                      background: "#12151f",
                      border: `2px solid ${meta.color}33`,
                    }}
                  >
                    <span className="text-lg shrink-0">{meta.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-white">{habit.name}</div>
                      <div className="text-xs text-gray-600 truncate">{habit.starter}</div>
                    </div>
                    <div className="text-xs font-bold shrink-0"
                      style={{ color: meta.color }}>
                      +{habit.xpReward} XP
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Comeback mechanic explainer */}
            <div
              className="rounded-xl p-4 mb-6"
              style={{ background: "rgba(30,58,95,0.4)", border: "1px solid #2563eb33" }}
            >
              <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
                ❄️ THE COMEBACK MECHANIC
              </div>
              <div className="text-xs text-gray-400 leading-relaxed">
                Miss one day? Your streak <span className="text-blue-300 font-bold">freezes</span> — not breaks.
                Miss two days in a row and it resets. This removes the all-or-nothing spiral.
                One bad day is just a frozen streak.
              </div>
            </div>

            <button
              onClick={advance}
              className="w-full py-4 rounded-2xl font-black text-base tracking-widest uppercase transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #f5c842, #d97706)", color: "#0a0c14" }}
            >
              I'm ready
            </button>
          </div>
        )}

        {/* ── Step 4 — Launch ─────────────────────────────────── */}
        {step === 4 && (
          <div className="text-center animate-fadeIn">
            <div className="text-5xl mb-6">🚀</div>
            <div
              className="font-black text-3xl mb-2"
              style={{ color: "#f5c842", textShadow: "0 0 20px #f5c84244" }}
            >
              Day 1 starts now.
            </div>
            <div className="text-gray-400 text-base mb-2">
              Welcome to the game, {name}.
            </div>
            <div className="text-gray-600 text-sm mb-12">
              Defeat your habits. Level up your life.
            </div>
            <button
              onClick={handleStart}
              className="w-full py-5 rounded-2xl font-black text-xl tracking-widest uppercase transition-all active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f5c842, #d97706)",
                color: "#0a0c14",
                boxShadow: "0 0 40px #f5c84266",
              }}
            >
              Enter the game ⚔️
            </button>
          </div>
        )}

        {/* Step indicators */}
        {step > 0 && step < 4 && (
          <div className="flex gap-2 mt-10">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: step === s ? 24 : 8,
                  background: step >= s ? "#f5c842" : "rgba(255,255,255,0.1)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

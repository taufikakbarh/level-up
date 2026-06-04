import { useGame } from "../../context/GameContext";
import { STAT_META } from "../../constants/habitLibrary";
import { TrendingUp, Calendar, CheckCircle2, XCircle } from "lucide-react";

const PHASE_INFO = {
  1: { name: "INSTALL",  color: "#0d9488", max: 30 },
  2: { name: "STACK",    color: "#7c3aed", max: 66 },
  3: { name: "AUTOMATE", color: "#f5c842", max: 120 },
};

export default function JournalScreen() {
  const { state } = useGame();
  const { player, history, playerHabits, today, stats } = state;

  // Build display history: reverse chronological, including today
  const todayEntry = {
    date: today.date,
    completedHabitIds: today.completedHabitIds,
    xpEarned: today.xpEarnedByStatToday,
    globalStreakCount: player.globalStreak,
    phase: player.currentPhase,
    isToday: true,
  };

  const allHistory = [todayEntry, ...history].slice(0, 30);

  // Compute overall stats
  const totalDays = history.length + 1;
  const perfectDays = allHistory.filter(
    h => playerHabits.length > 0 && h.completedHabitIds.length >= playerHabits.length
  ).length;
  const bestStreak = allHistory.reduce((max, h) => Math.max(max, h.globalStreakCount), 0);

  const phase = PHASE_INFO[player.currentPhase] ?? PHASE_INFO[1];
  const phaseProgress = Math.min(100, (player.dayCount / phase.max) * 100);

  return (
    <div className="scroll-area px-4 pt-4">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-1">Journal</div>
        <div className="text-gold font-bold text-lg">Your Legend So Far</div>
      </div>

      {/* ── Big stats row ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <BigStat label="Days" value={totalDays} icon="📅" />
        <BigStat label="Perfect" value={perfectDays} icon="⚔️" />
        <BigStat label="Best Streak" value={`${bestStreak}🔥`} icon="🏆" />
      </div>

      {/* ── Phase timeline ──────────────────────────────────── */}
      <div
        className="rounded-2xl p-4 mb-5"
        style={{ background: "#12151f", border: "1px solid #1f2335" }}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              Phase {player.currentPhase} — {phase.name}
            </div>
            <div className="text-white font-bold text-sm mt-0.5">
              Day {player.dayCount} of {phase.max}
            </div>
          </div>
          <div className="text-2xl font-black" style={{ color: phase.color }}>
            {Math.round(phaseProgress)}%
          </div>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${phaseProgress}%`,
              background: `linear-gradient(90deg, ${phase.color}, ${phase.color}88)`,
              boxShadow: `0 0 10px ${phase.color}66`,
            }}
          />
        </div>

        {/* Phase milestones */}
        <div className="flex justify-between text-xs text-gray-600 mt-2 font-bold">
          <span>Start</span>
          {player.currentPhase === 1 && <span className={player.dayCount >= 14 ? "text-teal-400" : ""}>Day 14 ↑</span>}
          {player.currentPhase === 1 && <span className={player.dayCount >= 30 ? "text-purple-400" : ""}>Day 30 →</span>}
          {player.currentPhase === 2 && <span className={player.dayCount >= 66 ? "text-gold" : ""}>Day 66 →</span>}
          {player.currentPhase === 3 && <span>Day {phase.max}</span>}
        </div>
      </div>

      {/* ── Habit streak overview ───────────────────────────── */}
      <div className="mb-5">
        <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-3">
          Habit Streaks
        </div>
        <div className="space-y-2">
          {playerHabits.map(h => {
            const meta = STAT_META[h.stat];
            const pct = Math.min(100, (h.streak / 66) * 100);
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2"
                style={{ background: "#12151f", border: `1px solid ${meta.color}15` }}
              >
                <span className="text-base">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white truncate">{h.name}</span>
                    <span className={`text-xs font-bold ml-2 shrink-0 ${h.streak >= 7 ? "flame-glow" : ""}`}
                      style={{ color: h.streak > 0 ? "#f59e0b" : "#374151" }}>
                      {h.streak > 0 ? `🔥${h.streak}` : "—"}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: h.status === "automated" ? "#f5c842" : meta.color,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                  {h.status === "automated" && (
                    <div className="text-xs font-bold mt-0.5" style={{ color: "#0d9488" }}>✓ AUTOMATED</div>
                  )}
                  {h.streakFrozen && (
                    <div className="text-xs font-bold mt-0.5 text-blue-400">❄️ Frozen</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Daily log ───────────────────────────────────────── */}
      <div className="mb-4">
        <div className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-3">
          Battle Log
        </div>
        <div className="space-y-2">
          {allHistory.map((entry, i) => {
            const total = playerHabits.length;
            const done = entry.completedHabitIds.length;
            const pct = total > 0 ? done / total : 0;
            const totalXp = Object.values(entry.xpEarned).reduce((a, b) => a + b, 0);

            const dateLabel = entry.isToday
              ? "Today"
              : formatDate(entry.date);

            const bgColor =
              pct === 1   ? "rgba(13,148,136,0.08)" :
              pct >= 0.5  ? "rgba(245,200,66,0.05)" :
              pct > 0     ? "rgba(239,68,68,0.05)"  :
                            "rgba(255,255,255,0.02)";

            const dotColor =
              pct === 1   ? "#0d9488" :
              pct >= 0.5  ? "#f5c842" :
              pct > 0     ? "#ef4444" : "#374151";

            return (
              <div
                key={entry.date}
                className="flex items-center gap-3 rounded-xl px-3 py-3"
                style={{ background: bgColor, border: "1px solid rgba(255,255,255,0.04)" }}
              >
                {/* Status dot */}
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: dotColor }} />

                {/* Date + phase */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{dateLabel}</span>
                    {entry.isToday && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-bold"
                        style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}>
                        NOW
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {done}/{total} habits
                    {totalXp > 0 && <span className="text-gold font-bold ml-2">+{totalXp} XP</span>}
                  </div>
                </div>

                {/* Mini stat dots */}
                <div className="flex gap-1 items-center">
                  {Object.entries(entry.xpEarned)
                    .filter(([, v]) => v > 0)
                    .slice(0, 4)
                    .map(([stat]) => (
                      <div
                        key={stat}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: STAT_META[stat]?.color ?? "#888" }}
                      />
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BigStat({ label, value, icon }) {
  return (
    <div
      className="rounded-2xl p-3 text-center"
      style={{ background: "#12151f", border: "1px solid #1f2335" }}
    >
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-white font-black text-lg leading-tight">{value}</div>
      <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mt-0.5">{label}</div>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

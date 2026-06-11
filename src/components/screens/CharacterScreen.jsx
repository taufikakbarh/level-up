import { useState } from "react";
import { Star, Lock, CheckCircle, LogOut } from "lucide-react";
import { useGame } from "../../context/GameContext";
import { useAuth } from "../../context/AuthContext";
import { STAT_META, TITLES, HABIT_LIBRARY } from "../../constants/habitLibrary";
import { xpForLevel } from "../../reducers/gameReducer";
import { heroProgress, totalXpOf } from "../../constants/hero";
import { skillMetaFor, skillRankFor, nextSkillRank } from "../../constants/skills";
import XPBar from "../ui/XPBar";
import HeroAvatar from "../ui/HeroAvatar";
import SkillStars from "../ui/SkillStars";

const STAT_ORDER = ["vitality", "focus", "will", "output", "presence", "wisdom"];

export default function CharacterScreen() {
  const { state, setActiveTitle } = useGame();
  const { signOut } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { player, stats, playerHabits, today } = state;
  const [tab, setTab] = useState("stats"); // "stats" | "skills" | "titles"

  const hero = heroProgress(totalXpOf(stats));
  const heroPct = Math.min(100, (hero.xpInto / hero.xpNeeded) * 100);

  const activeHabits = playerHabits.filter(h => h.status !== "automated" && h.status !== "retired");
  const automatedHabits = playerHabits.filter(h => h.status === "automated");

  const earnedTitles = new Set(player.titles);
  const activeTitleMeta = TITLES.find(t => t.id === player.activeTitle);

  return (
    <div className="scroll-area px-4 pt-4">

      {/* ── Character header ────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 mb-5"
        style={{
          background: "linear-gradient(135deg, #12151f, #1a1e2e)",
          border: "1px solid rgba(245,200,66,0.18)",
          boxShadow: "0 0 30px rgba(245,200,66,0.05)",
        }}
      >
        {/* Hero avatar */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-20 h-24 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: "radial-gradient(circle, #1a1e2e, #0a0c14)",
              border: "2px solid #f5c842",
              boxShadow: "0 0 16px #f5c84244",
            }}
          >
            <HeroAvatar stage={hero.stage.stage} pose="idle" size={56} />
          </div>
          <div className="flex-1">
            <div className="text-white font-black text-xl">{player.name}</div>
            {activeTitleMeta && (
              <div className="text-xs font-bold mt-0.5" style={{ color: "#f5c842" }}>
                「{activeTitleMeta.label}」
              </div>
            )}
            <div className="text-xs font-bold mt-1">
              <span style={{ color: "#f5c842" }}>{hero.stage.name}</span>
              <span className="text-gray-400"> · Lv {hero.level}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Day {player.dayCount} · Phase {player.currentPhase}
            </div>
            {/* Hero XP bar */}
            <div className="mt-2 w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${heroPct}%`,
                  background: "linear-gradient(90deg, #f5c842, #d97706)",
                  transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Total XP across all stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatPill label="Total XP" value={Object.values(stats).reduce((a, s) => a + s.totalXp, 0)} color="#f5c842" />
          <StatPill label="Global Streak" value={`🔥 ${player.globalStreak}d`} color="#f59e0b" />
          <StatPill label="Active Habits" value={activeHabits.length} color="#0d9488" />
          <StatPill label="Automated" value={`✓ ${automatedHabits.length}`} color="#8b5cf6" />
        </div>
      </div>

      {/* ── Tab switcher ────────────────────────────────────── */}
      <div
        className="flex rounded-xl p-1 mb-5"
        style={{ background: "#12151f", border: "1px solid #1f2335" }}
      >
        {["stats", "skills", "titles"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            style={{
              background: tab === t ? "#1a1e2e" : "transparent",
              color: tab === t ? "#f5c842" : "#4a5568",
              border: tab === t ? "1px solid rgba(245,200,66,0.15)" : "1px solid transparent",
            }}
          >
            {t === "stats" ? "📊 Stats" : t === "skills" ? "⚜️ Skills" : "🏆 Titles"}
          </button>
        ))}
      </div>

      {/* ── Stats tab ───────────────────────────────────────── */}
      {tab === "stats" && (
        <div className="space-y-3 mb-4">
          {STAT_ORDER.map(key => {
            const val = stats[key];
            const meta = STAT_META[key];
            const needed = xpForLevel(val.level);
            const pct = Math.min(100, (val.xp / needed) * 100);
            const keystoneHabit = playerHabits.find(h => {
              const lib = HABIT_LIBRARY.find(l => l.id === h.libraryId);
              return lib?.keystone && lib?.stat === key;
            });

            return (
              <div
                key={key}
                className="rounded-2xl p-4"
                style={{
                  background: "#12151f",
                  border: `1px solid ${meta.color}22`,
                  boxShadow: `inset 0 0 20px ${meta.color}08`,
                }}
              >
                {/* Stat header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <div className="font-black text-sm tracking-widest uppercase" style={{ color: meta.color }}>
                        {meta.label}
                      </div>
                      <div className="text-xs text-gray-500">{meta.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-black text-3xl leading-none"
                      style={{ color: "#f5c842", textShadow: "0 0 10px #f5c84244" }}
                    >
                      {val.level}
                    </div>
                    <div className="text-xs text-gray-600 font-bold uppercase tracking-wider">LVL</div>
                  </div>
                </div>

                {/* XP bar */}
                <XPBar xp={val.xp} level={val.level} color={meta.color} height={8} showLabel />

                {/* Keystone bonus */}
                {val.keystoneBonus && (
                  <div
                    className="flex items-center gap-1 mt-2 text-xs font-bold px-2 py-1 rounded-lg w-fit"
                    style={{ background: "rgba(245,200,66,0.08)", color: "#f5c842" }}
                  >
                    <Star size={10} />
                    KEYSTONE BONUS +20% XP
                  </div>
                )}

                {/* Total XP */}
                <div className="text-xs text-gray-600 mt-2">
                  Total XP earned: <span className="text-gray-400 font-bold">{val.totalXp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Skills tab ──────────────────────────────────────── */}
      {tab === "skills" && (
        <div className="space-y-3 mb-4">
          <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-3">
            Every habit is a skill — ranks never reset
          </div>
          {playerHabits.map(h => {
            const skill = skillMetaFor(h.libraryId);
            const effDays = h.daysActive + (today.completedHabitIds.includes(h.id) ? 1 : 0);
            const rank = skillRankFor(effDays, h.status);
            const next = nextSkillRank(effDays, h.status);
            const isMastered = !next;
            const pct = next
              ? Math.min(100, ((effDays - rank.minDays) / (next.minDays - rank.minDays)) * 100)
              : 100;

            return (
              <div
                key={h.id}
                className="rounded-2xl p-4"
                style={{
                  background: isMastered
                    ? "linear-gradient(135deg, #12151f, #2a2310)"
                    : "#12151f",
                  border: `1px solid ${rank.color}${isMastered ? "66" : "33"}`,
                  boxShadow: isMastered ? `0 0 16px ${rank.color}22` : "none",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{skill.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm flex items-center gap-2" style={{ color: rank.color }}>
                      {skill.name}
                      {h.status === "retired" && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(255,255,255,0.06)", color: "#9ca3af" }}>
                          ⏸ PAUSED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">from: {h.name}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <SkillStars rank={rank} />
                    <div className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: rank.color }}>
                      {rank.label}
                    </div>
                  </div>
                </div>

                {/* Rank progress */}
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: rank.color,
                      boxShadow: pct > 0 ? `0 0 6px ${rank.color}66` : "none",
                      transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{effDays} days practiced</span>
                  <span>
                    {isMastered
                      ? "★ MASTERED — part of who you are"
                      : `${next.label} at ${next.minDays}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Titles tab ──────────────────────────────────────── */}
      {tab === "titles" && (
        <div className="space-y-2 mb-4">
          <div className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-3">
            {earnedTitles.size} / {TITLES.length} titles earned
          </div>
          {TITLES.map(title => {
            const earned = earnedTitles.has(title.id);
            const isActive = player.activeTitle === title.id;

            return (
              <div
                key={title.id}
                onClick={() => earned && setActiveTitle(title.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  earned ? "cursor-pointer active:scale-98" : "opacity-40"
                }`}
                style={{
                  background: isActive ? "rgba(245,200,66,0.08)" : "#12151f",
                  border: isActive
                    ? "1px solid rgba(245,200,66,0.35)"
                    : earned
                    ? "1px solid #1f2335"
                    : "1px solid #12151f",
                }}
              >
                {earned ? (
                  <CheckCircle size={16} className="shrink-0" style={{ color: "#f5c842" }} />
                ) : (
                  <Lock size={16} className="shrink-0 text-gray-700" />
                )}
                <div className="flex-1">
                  <div
                    className="text-sm font-bold"
                    style={{ color: earned ? (isActive ? "#f5c842" : "#e2e8f0") : "#374151" }}
                  >
                    {title.label}
                  </div>
                  <div className="text-xs text-gray-600 capitalize mt-0.5">{title.category}</div>
                </div>
                {isActive && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#f5c84222", color: "#f5c842" }}>
                    ACTIVE
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Logout ──────────────────────────────────────────── */}
      <div className="mt-4 mb-6">
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{ background: "#12151f", color: "#6b7280", border: "1px solid #1f2335" }}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>

      {/* ── Sign-out confirmation modal ─────────────────────── */}
      {confirmLogout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl p-6 animate-fadeIn"
            style={{ background: "#1a1e2e", border: "1px solid rgba(239,68,68,0.25)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-1 text-3xl">👋</div>
            <h3 className="text-white font-bold text-center text-base mb-2">Sign out?</h3>
            <p className="text-sm text-gray-400 text-center mb-5 leading-relaxed">
              Your progress is safely saved to your account. You can sign back in anytime.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-400 transition-all active:scale-95"
                style={{ background: "#12151f", border: "1px solid #2a2e40" }}
              >
                Cancel
              </button>
              <button
                onClick={signOut}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
                style={{ background: "rgba(239,68,68,0.14)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="text-xs text-gray-600 uppercase tracking-wider font-bold">{label}</div>
      <div className="font-black text-sm mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

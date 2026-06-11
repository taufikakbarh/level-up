import { HABIT_LIBRARY, TITLES, STREAK_MILESTONES, COACH_MESSAGES } from "../constants/habitLibrary";
import { questSlotsFor, slotsInUse } from "../constants/questSlots";

// ─── XP / Level helpers ────────────────────────────────────────

export function xpForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function applyXpToStat(stat, xpGain) {
  let { level, xp, totalXp } = stat;
  const gained = xpGain;
  xp += gained;
  totalXp += gained;
  let leveled = false;
  const levelUps = [];
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
    leveled = true;
    levelUps.push(level);
  }
  return { level, xp, totalXp, keystoneBonus: stat.keystoneBonus, leveled, levelUps };
}

function removeXpFromStat(stat, xpLoss) {
  let { level, xp, totalXp, keystoneBonus } = stat;
  xp        -= xpLoss;
  totalXp   = Math.max(0, totalXp - xpLoss);
  // Level-down if XP goes negative
  while (xp < 0 && level > 1) {
    level -= 1;
    xp    += xpForLevel(level);
  }
  xp = Math.max(0, xp);
  return { level, xp, totalXp, keystoneBonus };
}

function calcXpGain(habit, streakMultiplier, keystoneBonus) {
  return Math.round(habit.xpReward * streakMultiplier * (keystoneBonus ? 1.2 : 1));
}

// ─── Date helpers ──────────────────────────────────────────────

export function todayISO() {
  // Use local date — toISOString() is UTC and breaks for timezones UTC+N after midnight
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function diffDays(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db - da) / 86400000);
}

// dayCount is DERIVED from joinedDate — never an incrementing counter.
// This makes it self-healing: even if a stored value drifts, it
// recomputes correctly on every load. Join day = day 1.
function computeDayCount(joinedDate, today) {
  if (!joinedDate) return 1;
  return Math.max(1, diffDays(joinedDate, today) + 1);
}

function phaseForDay(dayCount) {
  if (dayCount >= 66) return 3;
  if (dayCount >= 30) return 2;
  return 1;
}

// ─── Streak multiplier ─────────────────────────────────────────

function streakMultiplier(streak) {
  if (streak >= 30) return 2.0;
  if (streak >= 7)  return 1.5;
  if (streak >= 3)  return 1.2;
  return 1.0;
}

// ─── Coach message picker ──────────────────────────────────────

function pickCoach(pct, dayCount) {
  const pool =
    pct === 1   ? COACH_MESSAGES.perfect :
    pct >= 0.5  ? COACH_MESSAGES.good :
    pct > 0     ? COACH_MESSAGES.rough :
                  COACH_MESSAGES.zero;
  return pool[dayCount % pool.length];
}

// ─── Title checker ─────────────────────────────────────────────

function checkTitles(state) {
  const newTitles = [];
  const earned = new Set(state.player.titles);
  for (const t of TITLES) {
    if (earned.has(t.id)) continue;
    let qualifies = false;
    if (t.automationHabit) {
      qualifies = state.playerHabits.some(
        h => h.libraryId === t.automationHabit && h.status === "automated"
      );
    } else if (t.condition) {
      qualifies = t.condition({ ...state.player, stats: state.stats, playerHabits: state.playerHabits });
    }
    if (qualifies) newTitles.push(t.id);
  }
  return newTitles;
}

// ─── Initial state factory ─────────────────────────────────────

export function makeInitialState(playerName, starterHabitIds) {
  const today = todayISO();
  const statNames = ["vitality", "focus", "will", "output", "presence", "wisdom"];
  const stats = {};
  for (const s of statNames) {
    stats[s] = { level: 1, xp: 0, totalXp: 0, keystoneBonus: false };
  }

  const playerHabits = starterHabitIds.map((libId, i) => {
    const lib = HABIT_LIBRARY.find(h => h.id === libId);
    return {
      id: `ph_${String(i + 1).padStart(3, "0")}`,
      libraryId: lib.id,
      name: lib.name,
      stat: lib.stat,
      xpReward: lib.xpReward,
      streak: 0,
      streakFrozen: false,
      streakBroken: false,
      lastCompleted: null,
      daysActive: 0,
      status: "active",
      isUpgraded: false,
      upgradeOfferedAt: null,
      automatedAt: null,
      addedOn: null, // starters predate the grace-day rule
    };
  });

  return {
    player: {
      id: `p_${Date.now()}`,
      name: playerName,
      joinedDate: today,
      currentPhase: 1,
      dayCount: 1,
      globalStreak: 0,
      globalStreakFrozen: false,
      titles: ["t_beginning"],
      activeTitle: "t_beginning",
      hadComeback: false,
    },
    stats,
    playerHabits,
    today: {
      date: today,
      completedHabitIds: [],
      xpEarnedByStatToday: { vitality: 0, focus: 0, will: 0, output: 0, presence: 0, wisdom: 0 },
      totalXpToday: 0,
      streakMultiplier: 1.0,
      dayEnded: false,
      coachMessage: "",
    },
    notifications: [],
    history: [],
  };
}

// ─── Reducer ───────────────────────────────────────────────────

export function gameReducer(state, action) {
  switch (action.type) {

    case "ADVANCE_DAY": {
      // Called on app open / tab focus.
      const today = todayISO();
      const correctDayCount = computeDayCount(state.player.joinedDate, today);

      // ── Same calendar day: no rollover, just repair stale fields ──
      // Fixes data where dayCount drifted out of sync with joinedDate.
      if (state.today.date === today) {
        const correctPhase = Math.max(state.player.currentPhase, phaseForDay(correctDayCount));
        if (correctDayCount === state.player.dayCount &&
            correctPhase === state.player.currentPhase) {
          return state; // already correct — true no-op
        }
        return {
          ...state,
          player: {
            ...state.player,
            dayCount: correctDayCount,
            currentPhase: correctPhase,
          },
        };
      }

      // Archive yesterday
      const history = [
        ...state.history,
        {
          date: state.today.date,
          completedHabitIds: state.today.completedHabitIds,
          xpEarned: { ...state.today.xpEarnedByStatToday },
          globalStreakCount: state.player.globalStreak,
          phase: state.player.currentPhase,
        },
      ];

      const yesterday = state.today.date;
      const dayCount = correctDayCount;

      // Update per-habit streaks
      let playerHabits = state.playerHabits.map(ph => {
        if (ph.status === "retired") return ph; // paused — untouched by rollover
        const completedYesterday = state.today.completedHabitIds.includes(ph.id);
        if (completedYesterday) {
          const newStreak = ph.streak + 1;
          const isAutomated = newStreak >= 66;
          return {
            ...ph,
            streak: newStreak,
            streakFrozen: false,
            streakBroken: false,
            lastCompleted: yesterday,
            daysActive: ph.daysActive + 1,
            status: isAutomated ? "automated" : ph.status,
            automatedAt: isAutomated && !ph.automatedAt ? dayCount : ph.automatedAt,
          };
        } else {
          // Added on the day being closed → grace day, no miss penalty
          if (ph.addedOn === yesterday) return ph;
          // Missed
          const daysSince = ph.lastCompleted ? diffDays(ph.lastCompleted, today) : 999;
          if (daysSince >= 2) {
            return { ...ph, streakFrozen: false, streakBroken: true, streak: 0 };
          } else if (daysSince === 1 && !ph.streakFrozen) {
            return { ...ph, streakFrozen: true };
          }
          return ph;
        }
      });

      // Check upgrade offers (day 14 of any habit)
      const notifications = [...state.notifications];
      playerHabits = playerHabits.map(ph => {
        if (ph.daysActive === 14 && !ph.upgradeOfferedAt && !ph.isUpgraded) {
          const lib = HABIT_LIBRARY.find(h => h.id === ph.libraryId);
          if (lib) {
            notifications.push({
              id: `notif_upgrade_${ph.id}_${dayCount}`,
              type: "upgrade_offer",
              habitId: ph.id,
              message: `"${ph.name}" — 14 days consistent. Ready to upgrade?`,
              seen: false,
              createdAt: today,
            });
            return { ...ph, upgradeOfferedAt: dayCount };
          }
        }
        return ph;
      });

      // Global streak — retired habits and habits added on the day being
      // closed don't count toward the bar (day one is bonus-only)
      const countable = state.playerHabits.filter(
        ph => ph.status !== "retired" && ph.addedOn !== yesterday
      );
      const countableIds = new Set(countable.map(ph => ph.id));
      const completedCount = state.today.completedHabitIds.filter(id => countableIds.has(id)).length;
      const totalHabits = countable.length;
      const pct = totalHabits > 0 ? completedCount / totalHabits : 0;
      let globalStreak = state.player.globalStreak;
      let globalStreakFrozen = state.player.globalStreakFrozen;
      let hadComeback = state.player.hadComeback;

      if (pct >= 0.5) {
        if (globalStreakFrozen) {
          hadComeback = true;
          notifications.push({
            id: `notif_comeback_${dayCount}`,
            type: "streak_milestone",
            habitId: null,
            message: "Comeback! Your frozen streak is restored. 💪",
            seen: false,
            createdAt: today,
          });
        }
        globalStreak += 1;
        globalStreakFrozen = false;
      } else {
        if (!globalStreakFrozen) {
          globalStreakFrozen = true;
        } else {
          globalStreak = 0;
          globalStreakFrozen = false;
        }
      }

      // Phase advancement
      let currentPhase = state.player.currentPhase;
      if (dayCount >= 66 && currentPhase < 3) {
        currentPhase = 3;
        notifications.push({ id: `notif_phase3_${dayCount}`, type: "phase_advance", habitId: null, message: "Phase 3 unlocked — AUTOMATE. These are becoming who you are.", seen: false, createdAt: today });
      } else if (dayCount >= 30 && currentPhase < 2) {
        currentPhase = 2;
        notifications.push({ id: `notif_phase2_${dayCount}`, type: "phase_advance", habitId: null, message: "Phase 2 unlocked — STACK. You're building momentum.", seen: false, createdAt: today });
      }

      const mult = streakMultiplier(globalStreak);
      const newState = {
        ...state,
        player: {
          ...state.player,
          dayCount,
          currentPhase,
          globalStreak,
          globalStreakFrozen,
          hadComeback,
        },
        playerHabits,
        today: {
          date: today,
          completedHabitIds: [],
          xpEarnedByStatToday: { vitality: 0, focus: 0, will: 0, output: 0, presence: 0, wisdom: 0 },
          totalXpToday: 0,
          streakMultiplier: mult,
          dayEnded: false,
          coachMessage: "",
        },
        notifications,
        history,
      };

      // Check new titles
      const newTitles = checkTitles(newState);
      if (newTitles.length > 0) {
        return {
          ...newState,
          player: {
            ...newState.player,
            titles: [...newState.player.titles, ...newTitles],
          },
        };
      }
      return newState;
    }

    case "COMPLETE_HABIT": {
      const { habitId } = action;
      if (state.today.completedHabitIds.includes(habitId)) return state;

      const ph = state.playerHabits.find(h => h.id === habitId);
      if (!ph) return state;

      const lib = HABIT_LIBRARY.find(h => h.id === ph.libraryId);
      const base = ph.xpReward;
      const mult = state.today.streakMultiplier;
      const keystoneActive = state.stats[ph.stat]?.keystoneBonus;
      const xpGained = Math.round(base * mult * (keystoneActive ? 1.2 : 1));

      // Update stat
      const statBefore = state.stats[ph.stat];
      const statAfter = applyXpToStat(statBefore, xpGained);
      const { leveled, levelUps, ...statData } = statAfter;

      const newStats = { ...state.stats, [ph.stat]: statData };

      // Check keystone automation
      const updatedStats = { ...newStats };
      if (lib?.keystone && ph.streak + 1 >= 66) {
        updatedStats[ph.stat] = { ...updatedStats[ph.stat], keystoneBonus: true };
      }

      const xpByStat = {
        ...state.today.xpEarnedByStatToday,
        [ph.stat]: (state.today.xpEarnedByStatToday[ph.stat] || 0) + xpGained,
      };

      // Streak milestone check
      const newStreak = ph.streak; // not advanced yet — happens on ADVANCE_DAY
      const notifications = [...state.notifications];

      // Check per-habit streak milestone (based on actual consecutive completions)
      const completedSoFar = state.today.completedHabitIds.length + 1;

      const newState = {
        ...state,
        stats: updatedStats,
        today: {
          ...state.today,
          completedHabitIds: [...state.today.completedHabitIds, habitId],
          xpEarnedByStatToday: xpByStat,
          totalXpToday: state.today.totalXpToday + xpGained,
        },
        notifications,
        _lastXpGain: { habitId, xpGained, stat: ph.stat, leveled, levelUps },
      };

      // Check titles
      const newTitles = checkTitles(newState);
      if (newTitles.length > 0) {
        return {
          ...newState,
          player: {
            ...newState.player,
            titles: [...newState.player.titles, ...newTitles],
          },
        };
      }
      return newState;
    }

    case "UNCOMPLETE_HABIT": {
      const { habitId } = action;
      if (!state.today.completedHabitIds.includes(habitId)) return state;
      if (state.today.dayEnded) return state; // can't undo after day is ended

      const ph  = state.playerHabits.find(h => h.id === habitId);
      if (!ph) return state;

      const keystoneBonus = state.stats[ph.stat]?.keystoneBonus ?? false;
      const xpToRemove    = calcXpGain(ph, state.today.streakMultiplier, keystoneBonus);

      // Reverse stat XP
      const statBefore = state.stats[ph.stat];
      const statAfter  = removeXpFromStat(statBefore, xpToRemove);

      const newStats = { ...state.stats, [ph.stat]: statAfter };

      // Reverse today's XP tracking
      const xpByStat = {
        ...state.today.xpEarnedByStatToday,
        [ph.stat]: Math.max(0, (state.today.xpEarnedByStatToday[ph.stat] ?? 0) - xpToRemove),
      };

      return {
        ...state,
        stats: newStats,
        today: {
          ...state.today,
          completedHabitIds: state.today.completedHabitIds.filter(id => id !== habitId),
          xpEarnedByStatToday: xpByStat,
          totalXpToday: Math.max(0, state.today.totalXpToday - xpToRemove),
        },
      };
    }

    case "END_DAY": {
      const total = state.playerHabits.length;
      const done = state.today.completedHabitIds.length;
      const pct = total > 0 ? done / total : 0;
      const coach = pickCoach(pct, state.player.dayCount);
      return {
        ...state,
        today: { ...state.today, dayEnded: true, coachMessage: coach },
      };
    }

    case "ACCEPT_UPGRADE": {
      const { habitId } = action;
      const ph = state.playerHabits.find(h => h.id === habitId);
      if (!ph) return state;
      const lib = HABIT_LIBRARY.find(h => h.id === ph.libraryId);
      const updatedHabits = state.playerHabits.map(h =>
        h.id === habitId
          ? { ...h, name: lib.unlock, isUpgraded: true, status: "upgraded" }
          : h
      );
      const notifications = state.notifications.map(n =>
        n.type === "upgrade_offer" && n.habitId === habitId ? { ...n, seen: true } : n
      );
      return { ...state, playerHabits: updatedHabits, notifications };
    }

    case "DISMISS_UPGRADE": {
      const { habitId } = action;
      const notifications = state.notifications.map(n =>
        n.type === "upgrade_offer" && n.habitId === habitId ? { ...n, seen: true } : n
      );
      return { ...state, notifications };
    }

    case "UNLOCK_NEW_HABIT": {
      // habitId + addedOn are generated by the action creator so the
      // reducer stays pure. addedOn drives the day-one grace period.
      const { libraryId, habitId, addedOn } = action;
      const lib = HABIT_LIBRARY.find(h => h.id === libraryId);
      if (!lib) return state;

      // Slot gate — applies to both new quests and resumes
      if (slotsInUse(state.playerHabits) >= questSlotsFor(state.player.dayCount)) {
        return state;
      }

      const existing = state.playerHabits.find(h => h.libraryId === libraryId);
      if (existing) {
        // Resume a retired quest: skill rank (daysActive) survives,
        // the streak starts over, and the grace day applies again
        if (existing.status !== "retired") return state;
        return {
          ...state,
          playerHabits: state.playerHabits.map(h =>
            h.id === existing.id
              ? {
                  ...h,
                  status: h.isUpgraded ? "upgraded" : "active",
                  streak: 0,
                  streakFrozen: false,
                  streakBroken: false,
                  addedOn,
                }
              : h
          ),
        };
      }

      const newHabit = {
        id: habitId,
        libraryId: lib.id,
        name: lib.name,
        stat: lib.stat,
        xpReward: lib.xpReward,
        streak: 0,
        streakFrozen: false,
        streakBroken: false,
        lastCompleted: null,
        daysActive: 0,
        status: "active",
        isUpgraded: false,
        upgradeOfferedAt: null,
        automatedAt: null,
        addedOn,
      };
      return { ...state, playerHabits: [...state.playerHabits, newHabit] };
    }

    case "RETIRE_HABIT": {
      const ph = state.playerHabits.find(h => h.id === action.habitId);
      if (!ph || ph.status === "automated" || ph.status === "retired") return state;
      return {
        ...state,
        playerHabits: state.playerHabits.map(h =>
          h.id === action.habitId
            ? { ...h, status: "retired", streakFrozen: false, streakBroken: false }
            : h
        ),
      };
    }

    case "MARK_NOTIFICATION_SEEN": {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.notifId ? { ...n, seen: true } : n
        ),
      };
    }

    case "SET_ACTIVE_TITLE": {
      return { ...state, player: { ...state.player, activeTitle: action.titleId } };
    }

    case "CLEAR_LAST_XP_GAIN": {
      const { _lastXpGain, ...rest } = state;
      return rest;
    }

    // Replaces full state with authoritative data from Supabase
    case "_HYDRATE": {
      return { ...action.payload };
    }

    default:
      return state;
  }
}

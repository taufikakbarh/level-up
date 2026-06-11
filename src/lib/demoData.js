// ─── Demo mode ─────────────────────────────────────────────────
// A fully local sandbox: fake session + seeded game state, no
// Supabase calls. State is memory-only — every reload reseeds it,
// so the demo can be replayed endlessly.

import { HABIT_LIBRARY } from "../constants/habitLibrary";
import { xpForLevel } from "../reducers/gameReducer";

export const DEMO_FLAG_KEY = "levelup_demo";

export const DEMO_SESSION = {
  user: { id: "demo-user", email: "demo@levelup.local" },
  isDemo: true,
};

export const DEMO_PROFILE = {
  id: "demo-user",
  name: "Demo Hero",
};

// ── Helpers ────────────────────────────────────────────────────

function localISO(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function statFromTotal(totalXp, keystoneBonus = false) {
  let level = 1;
  let xp = totalXp;
  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level += 1;
  }
  return { level, xp, totalXp, keystoneBonus };
}

function habitFrom(id, libraryId, overrides = {}) {
  const lib = HABIT_LIBRARY.find(h => h.id === libraryId);
  return {
    id,
    libraryId,
    name: lib.name,
    stat: lib.stat,
    xpReward: lib.xpReward,
    streak: 0,
    streakFrozen: false,
    streakBroken: false,
    lastCompleted: localISO(1),
    daysActive: 0,
    status: "active",
    isUpgraded: false,
    upgradeOfferedAt: null,
    automatedAt: null,
    ...overrides,
  };
}

// ── Seed state ─────────────────────────────────────────────────
// Day 35, Phase 2, 8-day global streak (1.5× multiplier). Habits sit
// just under rank thresholds so completing them today fires rank-ups:
//   Make your bed   65d → MASTER on completion
//   Sleep schedule  29d → Expert
//   No phone        13d → Adept (and the 14-day upgrade offer tomorrow)
//   Top 3 tasks      6d → Apprentice
// Total XP ≈ 1100 puts the hero at Squire Lv 9 — one or two
// completions trigger the Knight evolution overlay.

export function makeDemoState() {
  const today = localISO(0);

  const playerHabits = [
    habitFrom("ph_001", "wil_1", { daysActive: 65, streak: 65, upgradeOfferedAt: 15, isUpgraded: true, status: "upgraded", name: HABIT_LIBRARY.find(h => h.id === "wil_1").unlock }),
    habitFrom("ph_002", "vit_3", { daysActive: 29, streak: 21, upgradeOfferedAt: 15 }),
    habitFrom("ph_003", "foc_1", { daysActive: 13, streak: 13 }),
    habitFrom("ph_004", "out_1", { daysActive: 6,  streak: 6 }),
    habitFrom("ph_005", "pre_1", { daysActive: 20, streak: 3, upgradeOfferedAt: 16 }),
    habitFrom("ph_006", "wis_2", { daysActive: 2,  streak: 2 }),
    habitFrom("ph_007", "wis_1", { daysActive: 70, streak: 70, status: "automated", automatedAt: 28, upgradeOfferedAt: 15 }),
  ];

  const history = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 7 - i;
    const done = ["ph_001", "ph_002", "ph_003", "ph_007"]
      .concat(daysAgo % 2 === 0 ? ["ph_004", "ph_005"] : [])
      .concat(daysAgo % 3 === 0 ? ["ph_006"] : []);
    return {
      date: localISO(daysAgo),
      completedHabitIds: done,
      xpEarned: { vitality: 25, focus: 20, will: 15, output: daysAgo % 2 === 0 ? 15 : 0, presence: daysAgo % 2 === 0 ? 15 : 0, wisdom: daysAgo % 3 === 0 ? 25 : 15 },
      globalStreakCount: 8 - daysAgo,
      phase: 2,
    };
  });

  return {
    player: {
      id: "demo-user",
      name: "Demo Hero",
      joinedDate: localISO(34), // → day 35, phase 2
      currentPhase: 2,
      dayCount: 35,
      globalStreak: 8,
      globalStreakFrozen: false,
      titles: [
        "t_beginning", "t_first_blood", "t_the_living", "t_clear_mind",
        "t_disciplined", "t_student", "t_foundations",
        "t_automated_human", "t_deep_reader",
      ],
      activeTitle: "t_first_blood",
      hadComeback: false,
    },
    stats: {
      vitality: statFromTotal(240),
      focus:    statFromTotal(160),
      will:     statFromTotal(300),
      output:   statFromTotal(130),
      presence: statFromTotal(100),
      wisdom:   statFromTotal(170, true), // wis_1 automated keystone
    },
    playerHabits,
    today: {
      date: today,
      completedHabitIds: [],
      xpEarnedByStatToday: { vitality: 0, focus: 0, will: 0, output: 0, presence: 0, wisdom: 0 },
      totalXpToday: 0,
      streakMultiplier: 1.5,
      dayEnded: false,
      coachMessage: "",
    },
    notifications: [],
    history,
  };
}

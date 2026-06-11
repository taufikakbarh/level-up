// ─── Hero level & evolution ────────────────────────────────────
// Hero level is DERIVED from total XP across all stats — never
// stored, so it needs no persistence and self-heals like dayCount.

export const HERO_STAGES = [
  { stage: 1, name: "Peasant",  minLevel: 1,  tagline: "Everyone starts somewhere." },
  { stage: 2, name: "Squire",   minLevel: 5,  tagline: "A blade earned through repetition." },
  { stage: 3, name: "Knight",   minLevel: 10, tagline: "Armor forged from daily wins." },
  { stage: 4, name: "Champion", minLevel: 20, tagline: "The arena knows your name." },
  { stage: 5, name: "Legend",   minLevel: 35, tagline: "This is who you are now." },
];

// XP consumed by each hero level — gentler curve than stat levels
// so the hero visibly grows in the first weeks.
export function heroXpForLevel(level) {
  return Math.floor(50 * Math.pow(1.22, level - 1));
}

export function heroProgress(totalXp) {
  let level = 1;
  let remaining = totalXp;
  while (level < 99 && remaining >= heroXpForLevel(level)) {
    remaining -= heroXpForLevel(level);
    level += 1;
  }
  let stage = HERO_STAGES[0];
  for (const s of HERO_STAGES) {
    if (level >= s.minLevel) stage = s;
  }
  return {
    level,
    stage,
    xpInto:   remaining,
    xpNeeded: heroXpForLevel(level),
  };
}

export function totalXpOf(stats) {
  return Object.values(stats).reduce((sum, s) => sum + s.totalXp, 0);
}

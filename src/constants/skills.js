// ─── Skill system ──────────────────────────────────────────────
// Every habit IS a skill. Ranks are derived from lifetime daysActive
// (total days the habit was completed) so a broken streak never
// demotes a skill. Master rank = the habit is automated (66 days).

export const SKILL_RANKS = [
  { id: "novice",     label: "Novice",     minDays: 0,  color: "#9ca3af" },
  { id: "apprentice", label: "Apprentice", minDays: 7,  color: "#34d399" },
  { id: "adept",      label: "Adept",      minDays: 14, color: "#60a5fa" },
  { id: "expert",     label: "Expert",     minDays: 30, color: "#a78bfa" },
  { id: "master",     label: "Master",     minDays: 66, color: "#f5c842" },
];

// Flavor skill name + icon per library habit
export const SKILL_META = {
  vit_1: { name: "Wellspring",       icon: "💧" },
  vit_2: { name: "Titan's Stride",   icon: "🏃" },
  vit_3: { name: "Night's Pact",     icon: "🌙" },
  vit_4: { name: "Dusk Ward",        icon: "🛡️" },
  foc_1: { name: "Dawn Shield",      icon: "🌅" },
  foc_2: { name: "Still Mind",       icon: "🧘" },
  foc_3: { name: "Time Splitter",    icon: "⏳" },
  wil_1: { name: "Iron Discipline",  icon: "🛏️" },
  wil_2: { name: "Cold Forged",      icon: "❄️" },
  wil_3: { name: "Dragon Slayer",    icon: "🐉" },
  wil_4: { name: "Oathkeeper",       icon: "📜" },
  out_1: { name: "Battle Plan",      icon: "🗺️" },
  out_2: { name: "Forge Master",     icon: "🔨" },
  out_3: { name: "War Council",      icon: "♟️" },
  pre_1: { name: "Light Seeker",     icon: "✨" },
  pre_2: { name: "Bond Weaver",      icon: "🤝" },
  pre_3: { name: "Boundary Warden",  icon: "🚧" },
  wis_1: { name: "Tome Reader",      icon: "📖" },
  wis_2: { name: "Spark Catcher",    icon: "💡" },
  wis_3: { name: "Sage's Echo",      icon: "🦉" },
};

export function skillMetaFor(libraryId) {
  return SKILL_META[libraryId] ?? { name: "Unknown Art", icon: "❓" };
}

// effectiveDays = daysActive (+1 if already completed today, so the
// rank responds immediately when the user checks the habit off)
export function skillRankFor(effectiveDays, status) {
  if (status === "automated") return SKILL_RANKS[SKILL_RANKS.length - 1];
  let rank = SKILL_RANKS[0];
  for (const r of SKILL_RANKS) {
    if (effectiveDays >= r.minDays) rank = r;
  }
  return rank;
}

export function skillRankIndex(rank) {
  return SKILL_RANKS.findIndex(r => r.id === rank.id);
}

// Next rank or null when already Master
export function nextSkillRank(effectiveDays, status) {
  const current = skillRankFor(effectiveDays, status);
  const idx = skillRankIndex(current);
  return idx < SKILL_RANKS.length - 1 ? SKILL_RANKS[idx + 1] : null;
}

// ─── Quest slots ───────────────────────────────────────────────
// Restraint on simultaneous habit FORMATION, not on total habits.
// Automated habits cost nothing (they no longer draw on willpower)
// and retired habits cost nothing — only active/upgraded count.
// Slots grow by calendar, and retiring always frees one, so a full
// roster can never become a stuck state.
//
// Note: 7 is a design budget (6 micro-starters + 1 free choice),
// not a scientific claim — the science constraint is the shape of
// the rule: formation is expensive, maintenance is free.

export const BASE_QUEST_SLOTS = 7;
export const SLOT_MILESTONES = [30, 66]; // +1 slot at each (phase days)

export function questSlotsFor(dayCount) {
  return BASE_QUEST_SLOTS + SLOT_MILESTONES.filter(day => dayCount >= day).length;
}

export function slotsInUse(playerHabits) {
  return playerHabits.filter(h => h.status === "active" || h.status === "upgraded").length;
}

// The next calendar day that grants a slot, or null if all earned
export function nextSlotDay(dayCount) {
  return SLOT_MILESTONES.find(day => dayCount < day) ?? null;
}

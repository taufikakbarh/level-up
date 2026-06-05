/**
 * db.js — Supabase persistence layer for LEVEL UP
 *
 * Responsibilities:
 *  - loadPlayerState(userId)  → assemble full app state from all tables
 *  - syncAction(action, newState, session) → write only what changed
 *  - initPlayer(userId, name, starterHabitIds) → seed all rows for a new player
 *
 * The reducer never touches this file. It stays synchronous.
 * This layer runs in the background after every dispatch.
 */

import { supabase } from "./supabase";

// ── Helpers: snake_case ↔ camelCase ────────────────────────────

function rowToStat(row) {
  return {
    level:         row.level,
    xp:            row.xp,
    totalXp:       row.total_xp,
    keystoneBonus: row.keystone_bonus,
  };
}

function statToRow(playerId, statKey, stat) {
  return {
    player_id:      playerId,
    stat:           statKey,
    level:          stat.level,
    xp:             stat.xp,
    total_xp:       stat.totalXp,
    keystone_bonus: stat.keystoneBonus,
  };
}

function rowToHabit(row) {
  return {
    id:                row.id,
    libraryId:         row.library_id,
    name:              row.name,
    stat:              row.stat,
    xpReward:          row.xp_reward,
    streak:            row.streak,
    streakFrozen:      row.streak_frozen,
    streakBroken:      row.streak_broken,
    lastCompleted:     row.last_completed,
    daysActive:        row.days_active,
    status:            row.status,
    isUpgraded:        row.is_upgraded,
    upgradeOfferedAt:  row.upgrade_offered_at,
    automatedAt:       row.automated_at,
  };
}

function habitToRow(playerId, habit) {
  return {
    id:                  habit.id,
    player_id:           playerId,
    library_id:          habit.libraryId,
    name:                habit.name,
    stat:                habit.stat,
    xp_reward:           habit.xpReward,
    streak:              habit.streak,
    streak_frozen:       habit.streakFrozen,
    streak_broken:       habit.streakBroken,
    last_completed:      habit.lastCompleted,
    days_active:         habit.daysActive,
    status:              habit.status,
    is_upgraded:         habit.isUpgraded,
    upgrade_offered_at:  habit.upgradeOfferedAt,
    automated_at:        habit.automatedAt,
  };
}

function rowToPlayer(playerRow, titleRows) {
  return {
    id:                  playerRow.id,
    name:                playerRow.name,
    joinedDate:          playerRow.joined_date,
    currentPhase:        playerRow.current_phase,
    dayCount:            playerRow.day_count,
    globalStreak:        playerRow.global_streak,
    globalStreakFrozen:  playerRow.global_streak_frozen,
    activeTitle:         playerRow.active_title,
    hadComeback:         playerRow.had_comeback,
    titles:              titleRows.map(t => t.title_id),
  };
}

function playerToRow(player) {
  return {
    id:                   player.id,
    name:                 player.name,
    joined_date:          player.joinedDate,
    current_phase:        player.currentPhase,
    day_count:            player.dayCount,
    global_streak:        player.globalStreak,
    global_streak_frozen: player.globalStreakFrozen,
    active_title:         player.activeTitle,
    had_comeback:         player.hadComeback,
  };
}

function rowToDaily(row) {
  return {
    date:                  row.date,
    completedHabitIds:     row.completed_habit_ids ?? [],
    xpEarnedByStatToday: {
      vitality: row.xp_vitality,
      focus:    row.xp_focus,
      will:     row.xp_will,
      output:   row.xp_output,
      presence: row.xp_presence,
      wisdom:   row.xp_wisdom,
    },
    totalXpToday:        row.total_xp,
    streakMultiplier:    parseFloat(row.streak_multiplier),
    dayEnded:            row.day_ended,
    coachMessage:        row.coach_message ?? "",
    globalStreakCount:   row.global_streak_count,
    phase:               row.phase,
  };
}

function todayToRow(playerId, today) {
  return {
    player_id:            playerId,
    date:                 today.date,
    completed_habit_ids:  today.completedHabitIds,
    xp_vitality:          today.xpEarnedByStatToday.vitality,
    xp_focus:             today.xpEarnedByStatToday.focus,
    xp_will:              today.xpEarnedByStatToday.will,
    xp_output:            today.xpEarnedByStatToday.output,
    xp_presence:          today.xpEarnedByStatToday.presence,
    xp_wisdom:            today.xpEarnedByStatToday.wisdom,
    total_xp:             today.totalXpToday,
    streak_multiplier:    today.streakMultiplier,
    day_ended:            today.dayEnded,
    coach_message:        today.coachMessage,
    global_streak_count:  today.globalStreakCount ?? 0,
    phase:                today.phase ?? 1,
  };
}

function rowToNotif(row) {
  return {
    id:        row.id,
    type:      row.type,
    habitId:   row.habit_id,
    message:   row.message,
    seen:      row.seen,
    createdAt: row.created_at,
  };
}

// ── Load full player state from all tables ──────────────────────

export async function loadPlayerState(userId) {
  const today = new Date().toISOString().slice(0, 10);

  const [
    playerRes,
    statsRes,
    habitsRes,
    titlesRes,
    logsRes,
    notifsRes,
  ] = await Promise.all([
    supabase.from("players").select("*").eq("id", userId).single(),
    supabase.from("stats").select("*").eq("player_id", userId),
    supabase.from("player_habits").select("*").eq("player_id", userId).order("created_at"),
    supabase.from("titles").select("*").eq("player_id", userId),
    supabase.from("daily_log").select("*").eq("player_id", userId).order("date", { ascending: false }).limit(31),
    supabase.from("notifications").select("*").eq("player_id", userId).order("created_at", { ascending: false }).limit(50),
  ]);

  if (playerRes.error) return null; // player row doesn't exist yet

  const playerRow  = playerRes.data;
  const statRows   = statsRes.data   ?? [];
  const habitRows  = habitsRes.data  ?? [];
  const titleRows  = titlesRes.data  ?? [];
  const logRows    = logsRes.data    ?? [];
  const notifRows  = notifsRes.data  ?? [];

  // ── Assemble stats object ──────────────────────────────────
  const stats = {
    vitality: { level: 1, xp: 0, totalXp: 0, keystoneBonus: false },
    focus:    { level: 1, xp: 0, totalXp: 0, keystoneBonus: false },
    will:     { level: 1, xp: 0, totalXp: 0, keystoneBonus: false },
    output:   { level: 1, xp: 0, totalXp: 0, keystoneBonus: false },
    presence: { level: 1, xp: 0, totalXp: 0, keystoneBonus: false },
    wisdom:   { level: 1, xp: 0, totalXp: 0, keystoneBonus: false },
  };
  for (const row of statRows) {
    if (stats[row.stat]) stats[row.stat] = rowToStat(row);
  }

  // ── Assemble today + history ───────────────────────────────
  const todayRow     = logRows.find(r => r.date === today);
  const historyRows  = logRows.filter(r => r.date !== today);

  const todayState = todayRow ? rowToDaily(todayRow) : {
    date:                 today,
    completedHabitIds:    [],
    xpEarnedByStatToday:  { vitality: 0, focus: 0, will: 0, output: 0, presence: 0, wisdom: 0 },
    totalXpToday:         0,
    streakMultiplier:     1.0,
    dayEnded:             false,
    coachMessage:         "",
  };

  return {
    player:       rowToPlayer(playerRow, titleRows),
    stats,
    playerHabits: habitRows.map(rowToHabit),
    today:        todayState,
    notifications: notifRows.map(rowToNotif),
    history:      historyRows.map(r => ({
      date:               r.date,
      completedHabitIds:  r.completed_habit_ids ?? [],
      xpEarned: {
        vitality: r.xp_vitality,
        focus:    r.xp_focus,
        will:     r.xp_will,
        output:   r.xp_output,
        presence: r.xp_presence,
        wisdom:   r.xp_wisdom,
      },
      globalStreakCount: r.global_streak_count,
      phase:             r.phase,
    })),
  };
}

// ── Init a brand-new player (called after first sign-up) ────────

export async function initPlayer(userId, name, starterHabitIds, habitLibrary) {
  const today = new Date().toISOString().slice(0, 10);

  // 1. Insert player row — triggers auto-seed of stats, daily_log, title
  const { error: playerErr } = await supabase.from("players").insert({
    id:          userId,
    name,
    joined_date: today,
  });
  if (playerErr && playerErr.code !== "23505") { // ignore duplicate
    console.error("initPlayer: failed to insert player", playerErr);
    return false;
  }

  // 2. Insert starter habits
  const habitRows = starterHabitIds.map((libId, i) => {
    const lib = habitLibrary.find(h => h.id === libId);
    return {
      player_id:  userId,
      library_id: lib.id,
      name:       lib.name,
      stat:       lib.stat,
      xp_reward:  lib.xpReward,
    };
  });

  const { error: habitErr } = await supabase.from("player_habits").insert(habitRows);
  if (habitErr) {
    console.error("initPlayer: failed to insert habits", habitErr);
    return false;
  }

  return true;
}

// ── Sync after each reducer action ─────────────────────────────
// Only writes what actually changed — keeps writes minimal.

export async function syncAction(action, newState, prevState, userId) {
  if (!userId) return;

  const p = newState.player;
  const pp = prevState?.player;

  switch (action.type) {

    case "COMPLETE_HABIT": {
      const { habitId } = action;
      const statKey = newState.playerHabits.find(h => h.id === habitId)?.stat;

      // Update affected stat
      if (statKey) {
        await supabase.from("stats").upsert(
          statToRow(userId, statKey, newState.stats[statKey]),
          { onConflict: "player_id,stat" }
        );
      }

      // Update today's log
      await supabase.from("daily_log").upsert(
        todayToRow(userId, newState.today),
        { onConflict: "player_id,date" }
      );

      // New titles earned?
      const prevTitles = new Set(prevState.player.titles);
      const newTitles  = newState.player.titles.filter(t => !prevTitles.has(t));
      if (newTitles.length > 0) {
        await supabase.from("titles").insert(
          newTitles.map(title_id => ({ player_id: userId, title_id }))
        );
      }
      break;
    }

    case "END_DAY": {
      await supabase.from("daily_log").upsert(
        todayToRow(userId, newState.today),
        { onConflict: "player_id,date" }
      );
      break;
    }

    case "ADVANCE_DAY": {
      // Player row (dayCount, phase, streak)
      await supabase.from("players").update(playerToRow(p)).eq("id", userId);

      // All habits (streaks updated)
      for (const habit of newState.playerHabits) {
        await supabase.from("player_habits")
          .update(habitToRow(userId, habit))
          .eq("id", habit.id);
      }

      // New today's daily_log row
      await supabase.from("daily_log").upsert(
        todayToRow(userId, newState.today),
        { onConflict: "player_id,date" }
      );

      // New notifications
      const prevNotifIds = new Set(prevState.notifications.map(n => n.id));
      const newNotifs = newState.notifications.filter(n => !prevNotifIds.has(n.id));
      if (newNotifs.length > 0) {
        await supabase.from("notifications").insert(
          newNotifs.map(n => ({
            id:        n.id,
            player_id: userId,
            type:      n.type,
            habit_id:  n.habitId ?? null,
            message:   n.message,
            seen:      n.seen,
            created_at: n.createdAt,
          }))
        );
      }

      // New titles
      const prevTitles = new Set(prevState.player.titles);
      const newTitles  = newState.player.titles.filter(t => !prevTitles.has(t));
      if (newTitles.length > 0) {
        await supabase.from("titles").insert(
          newTitles.map(title_id => ({ player_id: userId, title_id }))
        );
      }
      break;
    }

    case "ACCEPT_UPGRADE": {
      const { habitId } = action;
      const habit = newState.playerHabits.find(h => h.id === habitId);
      if (habit) {
        await supabase.from("player_habits")
          .update({ name: habit.name, is_upgraded: true, status: "upgraded" })
          .eq("id", habitId);
      }
      // Mark notif seen
      await _syncSeenNotifs(newState.notifications, prevState.notifications, userId);
      break;
    }

    case "DISMISS_UPGRADE": {
      await _syncSeenNotifs(newState.notifications, prevState.notifications, userId);
      break;
    }

    case "UNLOCK_NEW_HABIT": {
      const { libraryId } = action;
      const habit = newState.playerHabits.find(h => h.libraryId === libraryId);
      if (habit) {
        await supabase.from("player_habits").insert(habitToRow(userId, habit));
      }
      break;
    }

    case "MARK_NOTIFICATION_SEEN": {
      await supabase.from("notifications")
        .update({ seen: true })
        .eq("id", action.notifId);
      break;
    }

    case "SET_ACTIVE_TITLE": {
      await supabase.from("players")
        .update({ active_title: action.titleId })
        .eq("id", userId);
      break;
    }

    default:
      break;
  }
}

// ── Private: sync newly-seen notifications ──────────────────────
async function _syncSeenNotifs(newNotifs, prevNotifs, userId) {
  const prevMap = Object.fromEntries(prevNotifs.map(n => [n.id, n.seen]));
  const nowSeen = newNotifs.filter(n => n.seen && !prevMap[n.id]);
  for (const n of nowSeen) {
    await supabase.from("notifications").update({ seen: true }).eq("id", n.id);
  }
}

import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from "react";
import { gameReducer, makeInitialState, todayISO } from "../reducers/gameReducer";
import { STARTER_HABIT_IDS } from "../constants/habitLibrary";
import { loadPlayerState, syncAction } from "../lib/db";
import { makeDemoState } from "../lib/demoData";

const STORAGE_KEY = "levelup_v1_state";

const GameContext = createContext(null);

// ── localStorage helpers (anonymous / offline fallback) ─────────

function loadLocalState(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocalState(key, state) {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
}

// ── Provider ────────────────────────────────────────────────────

export function GameProvider({ children, session }) {
  // Demo sessions are memory-only: no Supabase, no localStorage —
  // every reload reseeds the sandbox so it can be replayed endlessly.
  const isDemo  = !!session?.isDemo;
  const userId  = isDemo ? null : session?.user?.id ?? null;
  const isAuth  = !!userId;

  // While loading from Supabase we show a spinner
  const [dbLoading, setDbLoading] = useState(isAuth);

  // Stable ref so syncAction always sees the latest previous state
  const prevStateRef = useRef(null);
  // Queue of {action, prev} for the post-render sync effect
  const pendingActionRef = useRef(null);
  // Always points at the latest dispatchAndSync (for use inside effects)
  const dispatchAndSyncRef = useRef(null);

  // ── Initialise reducer ───────────────────────────────────────
  // Start from localStorage (instant); will be replaced by Supabase data
  const saved = isDemo ? null : loadLocalState(STORAGE_KEY);
  const [state, dispatch] = useReducer(
    gameReducer,
    saved ?? (isDemo ? makeDemoState() : makeInitialState("Player", STARTER_HABIT_IDS))
  );

  // ── Load from Supabase when authenticated ────────────────────
  useEffect(() => {
    if (!isAuth) {
      setDbLoading(false);
      return;
    }

    setDbLoading(true);
    loadPlayerState(userId).then(remote => {
      if (remote) {
        // Replace local state with authoritative Supabase state
        dispatch({ type: "_HYDRATE", payload: remote });
      }
      // If no remote state yet, keep local (user just signed up, initPlayer
      // will be called from AuthScreen → onAuthSuccess)
      setDbLoading(false);
    });
  }, [userId]);

  // ── Persist to localStorage on every state change ────────────
  // (skipped in demo mode — the sandbox resets on reload)
  useEffect(() => {
    if (isDemo) return;
    saveLocalState(STORAGE_KEY, state);
  }, [state, isDemo]);

  // ── Wrapped dispatch: queue a Supabase sync after every action ─
  const dispatchAndSync = useCallback((action) => {
    if (action.type === "_HYDRATE") {
      dispatch(action);
      return;
    }
    const prev = prevStateRef.current ?? state;
    dispatch(action);
    pendingActionRef.current = { action, prev };
  }, [state]);

  // Keep the ref pointing at the latest dispatchAndSync
  dispatchAndSyncRef.current = dispatchAndSync;

  // ── Advance day on mount + on tab visibility change ───────────
  // Routed through dispatchAndSync so syncAction persists the full
  // day-advance result: player row, habit streaks, new daily_log row,
  // notifications and titles. ADVANCE_DAY is a no-op if the date matches.
  useEffect(() => {
    // Profile is already confirmed by AuthGate before GameProvider mounts,
    // so we only wait for the Supabase load to finish.
    if (dbLoading) return;

    function tryAdvance() {
      if (document.visibilityState === "visible") {
        dispatchAndSyncRef.current({ type: "ADVANCE_DAY" });
      }
    }

    dispatchAndSyncRef.current({ type: "ADVANCE_DAY" });
    document.addEventListener("visibilitychange", tryAdvance);
    return () => document.removeEventListener("visibilitychange", tryAdvance);
  }, [dbLoading]);

  // ── Sync effect: runs after state updates, flushes the queue ──
  useEffect(() => {
    if (!isAuth) return;
    if (!pendingActionRef.current) return;
    const { action, prev } = pendingActionRef.current;
    pendingActionRef.current = null;
    prevStateRef.current = state;
    syncAction(action, state, prev, userId).catch(err =>
      console.warn("Supabase sync error:", err)
    );
  }, [state]);

  // ── Public actions ───────────────────────────────────────────

  const completeHabit = useCallback((habitId) => {
    dispatchAndSync({ type: "COMPLETE_HABIT", habitId });
  }, [dispatchAndSync]);

  const uncompleteHabit = useCallback((habitId) => {
    dispatchAndSync({ type: "UNCOMPLETE_HABIT", habitId });
  }, [dispatchAndSync]);

  const endDay = useCallback(() => {
    dispatchAndSync({ type: "END_DAY" });
  }, [dispatchAndSync]);

  const acceptUpgrade = useCallback((habitId) => {
    dispatchAndSync({ type: "ACCEPT_UPGRADE", habitId });
  }, [dispatchAndSync]);

  const dismissUpgrade = useCallback((habitId) => {
    dispatchAndSync({ type: "DISMISS_UPGRADE", habitId });
  }, [dispatchAndSync]);

  const unlockNewHabit = useCallback((libraryId) => {
    dispatchAndSync({
      type: "UNLOCK_NEW_HABIT",
      libraryId,
      habitId: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `ph_${Date.now()}`,
      addedOn: todayISO(),
    });
  }, [dispatchAndSync]);

  const retireHabit = useCallback((habitId) => {
    dispatchAndSync({ type: "RETIRE_HABIT", habitId });
  }, [dispatchAndSync]);

  const markNotifSeen = useCallback((notifId) => {
    dispatchAndSync({ type: "MARK_NOTIFICATION_SEEN", notifId });
  }, [dispatchAndSync]);

  const setActiveTitle = useCallback((titleId) => {
    dispatchAndSync({ type: "SET_ACTIVE_TITLE", titleId });
  }, [dispatchAndSync]);

  const clearLastXpGain = useCallback(() => {
    dispatch({ type: "CLEAR_LAST_XP_GAIN" });
  }, []);

  return (
    <GameContext.Provider value={{
      state,
      dispatch: dispatchAndSync,
      dbLoading,
      completeHabit,
      uncompleteHabit,
      endDay,
      acceptUpgrade,
      dismissUpgrade,
      unlockNewHabit,
      retireHabit,
      markNotifSeen,
      setActiveTitle,
      clearLastXpGain,
      isAuth,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
}

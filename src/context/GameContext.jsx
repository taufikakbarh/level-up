import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from "react";
import { gameReducer, makeInitialState } from "../reducers/gameReducer";
import { STARTER_HABIT_IDS, HABIT_LIBRARY } from "../constants/habitLibrary";
import { loadPlayerState, initPlayer, syncAction } from "../lib/db";

const STORAGE_KEY = "levelup_v1_state";
const INIT_FLAG   = "levelup_initialized";

const GameContext = createContext(null);

// ── localStorage helpers (anonymous / offline fallback) ─────────

function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocalState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// ── Provider ────────────────────────────────────────────────────

export function GameProvider({ children, session }) {
  const userId  = session?.user?.id ?? null;
  const isAuth  = !!userId;

  // While loading from Supabase we show a spinner
  const [dbLoading, setDbLoading] = useState(isAuth);

  // Stable ref so syncAction always sees the latest previous state
  const prevStateRef = useRef(null);

  // ── Initialise reducer ───────────────────────────────────────
  // Start from localStorage (instant); will be replaced by Supabase data
  const saved = loadLocalState();
  const [state, dispatch] = useReducer(
    gameReducer,
    saved ?? makeInitialState("Player", STARTER_HABIT_IDS)
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

  // ── Persist: localStorage always + Supabase when logged in ───
  useEffect(() => {
    saveLocalState(state);
  }, [state]);

  // ── Wrapped dispatch: sync to Supabase after every action ────
  const dispatchAndSync = useCallback((action) => {
    if (action.type === "_HYDRATE") {
      dispatch(action);
      return;
    }
    const prev = prevStateRef.current ?? state;
    dispatch(action);
    // After dispatch React queues a re-render — we read new state in the
    // next effect. We use a small trick: schedule the sync in a microtask
    // so it runs after the reducer has produced the new state.
    setTimeout(() => {
      // `state` here is stale — we'll compare in the effect below.
    }, 0);
    // Store action + prev for the sync effect
    pendingActionRef.current = { action, prev };
  }, [state]);

  const pendingActionRef = useRef(null);

  // Keep a stable ref to dispatchAndSync so the advance-day effect
  // can call it without being in its dependency array
  const dispatchAndSyncRef = useRef(dispatchAndSync);
  useEffect(() => { dispatchAndSyncRef.current = dispatchAndSync; }, [dispatchAndSync]);

  // ── Advance day on mount + whenever app comes back into view ──
  // Uses dispatchAndSync so ADVANCE_DAY is synced to Supabase
  useEffect(() => {
    if (dbLoading || !localStorage.getItem(INIT_FLAG)) return;

    function tryAdvance() {
      if (document.visibilityState === "visible") {
        dispatchAndSyncRef.current({ type: "ADVANCE_DAY" });
      }
    }

    dispatchAndSyncRef.current({ type: "ADVANCE_DAY" });
    document.addEventListener("visibilitychange", tryAdvance);
    return () => document.removeEventListener("visibilitychange", tryAdvance);
  }, [dbLoading]);

  // ── Sync effect: runs after state has been updated ───────────
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
    dispatchAndSync({ type: "UNLOCK_NEW_HABIT", libraryId });
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

  // ── Initialize a new player (called after onboarding + auth) ──
  const initializePlayer = useCallback(async (name) => {
    if (isAuth) {
      // Create rows in Supabase
      const ok = await initPlayer(userId, name, STARTER_HABIT_IDS, HABIT_LIBRARY);
      if (ok) {
        // Load the freshly-created state from Supabase
        const remote = await loadPlayerState(userId);
        if (remote) {
          dispatch({ type: "_HYDRATE", payload: remote });
        }
        localStorage.setItem(INIT_FLAG, "1");
      }
    } else {
      // Offline / anonymous fallback
      const fresh = makeInitialState(name, STARTER_HABIT_IDS);
      saveLocalState(fresh);
      localStorage.setItem(INIT_FLAG, "1");
      window.location.reload();
    }
  }, [isAuth, userId]);

  const isInitialized = !!localStorage.getItem(INIT_FLAG);

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
      markNotifSeen,
      setActiveTitle,
      clearLastXpGain,
      initializePlayer,
      isInitialized,
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

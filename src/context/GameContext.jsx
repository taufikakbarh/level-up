import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { gameReducer, makeInitialState } from "../reducers/gameReducer";
import { STARTER_HABIT_IDS } from "../constants/habitLibrary";

const STORAGE_KEY = "levelup_v1_state";
const INIT_FLAG   = "levelup_initialized";

const GameContext = createContext(null);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// session prop is accepted now — will be used in Task 3 for Supabase sync
export function GameProvider({ children, session }) {
  const saved = loadState();
  const isInitialized = !!localStorage.getItem(INIT_FLAG);

  const [state, dispatch] = useReducer(
    gameReducer,
    saved ?? makeInitialState("Player", STARTER_HABIT_IDS)
  );

  // Persist on every change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Advance day on load if date has changed
  useEffect(() => {
    if (isInitialized) {
      dispatch({ type: "ADVANCE_DAY" });
    }
  }, []);

  const completeHabit = useCallback((habitId) => {
    dispatch({ type: "COMPLETE_HABIT", habitId });
  }, []);

  const endDay = useCallback(() => {
    dispatch({ type: "END_DAY" });
  }, []);

  const acceptUpgrade = useCallback((habitId) => {
    dispatch({ type: "ACCEPT_UPGRADE", habitId });
  }, []);

  const dismissUpgrade = useCallback((habitId) => {
    dispatch({ type: "DISMISS_UPGRADE", habitId });
  }, []);

  const unlockNewHabit = useCallback((libraryId) => {
    dispatch({ type: "UNLOCK_NEW_HABIT", libraryId });
  }, []);

  const markNotifSeen = useCallback((notifId) => {
    dispatch({ type: "MARK_NOTIFICATION_SEEN", notifId });
  }, []);

  const setActiveTitle = useCallback((titleId) => {
    dispatch({ type: "SET_ACTIVE_TITLE", titleId });
  }, []);

  const clearLastXpGain = useCallback(() => {
    dispatch({ type: "CLEAR_LAST_XP_GAIN" });
  }, []);

  const initializePlayer = useCallback((name) => {
    const fresh = makeInitialState(name, STARTER_HABIT_IDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    localStorage.setItem(INIT_FLAG, "1");
    // Force reload with new state — simplest way to reset reducer
    window.location.reload();
  }, []);

  return (
    <GameContext.Provider value={{
      state,
      dispatch,
      completeHabit,
      endDay,
      acceptUpgrade,
      dismissUpgrade,
      unlockNewHabit,
      markNotifSeen,
      setActiveTitle,
      clearLastXpGain,
      initializePlayer,
      isInitialized,
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

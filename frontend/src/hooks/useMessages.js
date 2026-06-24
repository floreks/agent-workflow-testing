import { useCallback, useEffect, useReducer } from "react";
import { createMessage, deleteMessage, getMessages } from "../utils/api";

// ── State shape ──────────────────────────────────────────────────────────────

const initialState = {
  items: [],
  loading: false,
  error: null,
  lastRefreshed: null,
};

// ── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };

    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        items: action.payload,
        lastRefreshed: Date.now(),
      };

    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };

    case "CREATE_SUCCESS":
      return {
        ...state,
        items: [action.payload, ...state.items],
      };

    case "DELETE_SUCCESS":
      return {
        ...state,
        items: state.items.filter((m) => m.id !== action.payload),
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useMessages manages the messages collection: loading, creating, and deleting.
 *
 * @param {{ limit?: number, autoRefreshMs?: number }} [options]
 */
export function useMessages(options = {}) {
  const { limit = 20, autoRefreshMs = 0 } = options;
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = useCallback(async () => {
    dispatch({ type: "FETCH_START" });
    try {
      const data = await getMessages({ limit });
      dispatch({ type: "FETCH_SUCCESS", payload: data ?? [] });
    } catch (err) {
      dispatch({ type: "FETCH_ERROR", payload: err.message });
    }
  }, [limit]);

  const create = useCallback(async ({ content, author }) => {
    const msg = await createMessage({ content, author });
    dispatch({ type: "CREATE_SUCCESS", payload: msg });
    return msg;
  }, []);

  const remove = useCallback(async (id) => {
    await deleteMessage(id);
    dispatch({ type: "DELETE_SUCCESS", payload: id });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Optional auto-refresh
  useEffect(() => {
    if (!autoRefreshMs) return;
    const interval = setInterval(refresh, autoRefreshMs);
    return () => clearInterval(interval);
  }, [refresh, autoRefreshMs]);

  return {
    messages: state.items,
    loading: state.loading,
    error: state.error,
    lastRefreshed: state.lastRefreshed,
    refresh,
    create,
    remove,
    clearError,
  };
}

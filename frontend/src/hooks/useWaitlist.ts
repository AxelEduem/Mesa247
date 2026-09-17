import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../services/api";
import { getDailyReport, getDinerEntry, getWaitlistQueue, joinWaitlist, transitionEntry } from "../services/waitlistApi";
import type { DailyReport, DinerEntry, WaitlistAction, WaitlistCreatePayload, WaitlistQueue } from "../types/waitlist";
import { getErrorMessage } from "../lib/utils";
import { clearWaitlistSession, loadWaitlistSession, saveWaitlistSession } from "../lib/waitlistSession";

export function useWaitlist(restaurantId: number, view: "diner" | "host" | "report") {
  const [queue, setQueue] = useState<WaitlistQueue | null>(null);
  const [joinedEntry, setJoinedEntry] = useState<DinerEntry | null>(null);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [callingId, setCallingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(() => loadWaitlistSession()?.restaurantId === restaurantId);
  const mounted = useRef(false);
  const busy = useRef(false);
  const request = useRef<AbortController | null>(null);

  const loadQueue = useCallback(async () => {
    if (request.current || busy.current) return;
    const controller = new AbortController();
    request.current = controller;
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]);
    setLoading(true);
    try {
      if (!Number.isInteger(restaurantId) || restaurantId < 1) throw new Error("Configura un restaurante válido.");
      if (view === "host") {
        const data = await getWaitlistQueue(restaurantId, signal);
        if (!controller.signal.aborted) setQueue(data);
      } else if (view === "report") {
        const data = await getDailyReport(restaurantId, signal);
        if (!controller.signal.aborted) setReport(data);
      } else {
        const session = loadWaitlistSession();
        if (session?.restaurantId === restaurantId) {
          const entry = await getDinerEntry(restaurantId, session.entryId, signal);
          if (!controller.signal.aborted) {
            setJoinedEntry(entry);
            setRestoring(false);
          }
        } else {
          setRestoring(false);
        }
      }
      if (!controller.signal.aborted) setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (view === "diner" && err instanceof ApiError && err.status === 404) {
        clearWaitlistSession();
        setJoinedEntry(null);
        setRestoring(false);
      }
      setError(getErrorMessage(err));
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current) setLoading(false);
      }
    }
  }, [restaurantId, view]);

  useEffect(() => {
    mounted.current = true;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      await loadQueue();
      if (!stopped) timer = setTimeout(poll, 10000);
    }
    void poll();
    return () => {
      stopped = true;
      mounted.current = false;
      clearTimeout(timer);
      request.current?.abort();
      request.current = null;
    };
  }, [loadQueue]);

  const beginMutation = () => {
    if (busy.current) return false;
    busy.current = true;
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setMutating(true);
    setError(null);
    return true;
  };

  async function joinQueue(payload: Omit<WaitlistCreatePayload, "restaurant_id">) {
    if (!beginMutation()) return null;
    try {
      const entry = await joinWaitlist({ ...payload, restaurant_id: restaurantId });
      saveWaitlistSession(restaurantId, entry.id);
      if (mounted.current) { setJoinedEntry(entry); setRestoring(false); }
      return entry;
    } catch (err) {
      if (mounted.current) setError(getErrorMessage(err));
      return null;
    } finally {
      busy.current = false;
      if (mounted.current) setMutating(false);
    }
  }

  async function act(entryId: number, action: WaitlistAction) {
    if (!beginMutation()) return;
    setCallingId(entryId);
    let failure: string | null = null;
    try {
      const result = await transitionEntry(entryId, action);
      if (mounted.current && "restaurant_id" in result && joinedEntry?.id === entryId) {
        setJoinedEntry(result);
      }
      // Final states survive refresh until the diner explicitly dismisses them.
    } catch (err) {
      failure = getErrorMessage(err);
    } finally {
      busy.current = false;
      if (mounted.current) {
        await loadQueue();
        if (failure) setError(failure);
        setMutating(false);
        setCallingId(null);
      }
    }
  }

  function resetSession() {
    request.current?.abort();
    request.current = null;
    clearWaitlistSession();
    setJoinedEntry(null);
    setRestoring(false);
    setError(null);
  }

  return { queue, joinedEntry, report, loading, restoring, mutating, callingId, error, loadQueue, joinQueue, act, resetSession };
}

export type WaitlistSession = {
  restaurantId: number;
  entryId: number;
};

const WAITLIST_SESSION_KEY = "mesa247.waitlist.session";

function isValidSession(value: unknown): value is WaitlistSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const { restaurantId, entryId } = value as Record<string, unknown>;

  return (
    typeof restaurantId === "number" && Number.isFinite(restaurantId) && restaurantId > 0 &&
    typeof entryId === "number" && Number.isFinite(entryId) && entryId > 0
  );
}

export function saveWaitlistSession(restaurantId: number, entryId: number): void {
  if (typeof window === "undefined") {
    return;
  }

  const session: WaitlistSession = { restaurantId, entryId };
  window.localStorage.setItem(WAITLIST_SESSION_KEY, JSON.stringify(session));
}

export function loadWaitlistSession(): WaitlistSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(WAITLIST_SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (!isValidSession(parsed)) {
      window.localStorage.removeItem(WAITLIST_SESSION_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(WAITLIST_SESSION_KEY);
    return null;
  }
}

export function clearWaitlistSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(WAITLIST_SESSION_KEY);
}

import { apiRequest } from "./api";
import type {
  WaitlistCallResponse,
  WaitlistCreatePayload,
  WaitlistEntry,
  WaitlistQueue,
  DinerEntry,
  WaitlistAction,
  DailyReport,
} from "../types/waitlist";

export function joinWaitlist(payload: WaitlistCreatePayload): Promise<WaitlistEntry> {
  return apiRequest<WaitlistEntry>("/api/v1/waitlist", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getWaitlistQueue(restaurantId: number, signal?: AbortSignal): Promise<WaitlistQueue> {
  return apiRequest<WaitlistQueue>(`/api/v1/waitlist/${restaurantId}`, { signal });
}

export function getDinerEntry(restaurantId: number, entryId: number, signal?: AbortSignal) {
  return apiRequest<DinerEntry>(`/api/v1/waitlist/${restaurantId}/entries/${entryId}`, { signal });
}

export function transitionEntry(entryId: number, action: WaitlistAction) {
  return apiRequest<DinerEntry | WaitlistCallResponse>(`/api/v1/waitlist/${entryId}/${action}`, { method: "POST" });
}

export function getDailyReport(restaurantId: number, signal?: AbortSignal) {
  return apiRequest<DailyReport>(`/api/v1/waitlist/${restaurantId}/report`, { signal });
}

export function callWaitlistEntry(entryId: number): Promise<WaitlistCallResponse> {
  return apiRequest<WaitlistCallResponse>(`/api/v1/waitlist/${entryId}/call`, {
    method: "POST",
  });
}

export type WaitlistStatus =
  | "WAITING"
  | "CALLED"
  | "SEATED"
  | "LEFT"
  | "NO_SHOW";

export type WaitlistEntry = {
  id: number;
  restaurant_id: number;
  name: string;
  party_size: number;
  status: WaitlistStatus;
  position: number;
  joined_at: string;
  called_at: string | null;
};

export type WaitlistCreatePayload = {
  restaurant_id: number;
  name: string;
  phone: string;
  party_size: number;
};

export type WaitlistQueue = {
  restaurant_id: number;
  entries: WaitlistEntry[];
};

export type WaitlistCallResponse = {
  id: number;
  status: WaitlistStatus;
  called_at: string;
};

export type DinerEntry = Omit<WaitlistEntry, "name">;
export type WaitlistAction = "call" | "leave" | "seat" | "no-show";
export type DailyReport = {
  restaurant_id: number;
  restaurant_name: string;
  date: string;
  timezone: string;
  joined: number;
  seated: number;
  left: number;
  no_show: number;
  average_wait_minutes: number | null;
};

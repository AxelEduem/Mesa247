export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export const RESTAURANT_ID = Number(import.meta.env.VITE_RESTAURANT_ID ?? 1);

export const RESTAURANT_NAME =
  import.meta.env.VITE_RESTAURANT_NAME ?? "La Terraza Azul";

import { API_BASE_URL } from "../config";

type ErrorBody = {
  detail?: string | Array<{ msg?: string }>;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function parseDetail(body: ErrorBody | null): string {
  if (!body?.detail) {
    return "La solicitud no pudo completarse";
  }

  if (typeof body.detail === "string") {
    return body.detail;
  }

  return body.detail
    .map((item) => item.msg)
    .filter((message): message is string => Boolean(message))
    .join(". ");
}

export async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    signal: options?.signal ?? AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => null)) as T | ErrorBody | null;

  if (!response.ok) {
    const messages: Record<number, string> = {
      404: (body as ErrorBody)?.detail === "Restaurant not found" ? "El restaurante no existe." : "El turno ya no existe.",
      409: "Esta acción ya no está disponible porque el turno cambió de estado.",
      422: "Revisa los datos: nombre y teléfono obligatorios, y cantidad de personas mayor que cero.",
    };
    throw new ApiError(response.status, response.status >= 500
      ? "Ha ocurrido un error. Inténtalo nuevamente."
      : messages[response.status] ?? parseDetail(body as ErrorBody | null));
  }

  return body as T;
}

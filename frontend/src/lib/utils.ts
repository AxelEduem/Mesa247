export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof TypeError || (error instanceof DOMException && error.name === "TimeoutError")) {
    return "No pudimos conectar con el servidor. Inténtalo nuevamente.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ocurrió un error inesperado";
}

export function formatCalledAt(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

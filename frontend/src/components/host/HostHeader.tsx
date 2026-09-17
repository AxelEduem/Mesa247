type HostHeaderProps = {
  restaurantName: string;
  queueCount: number;
  loading: boolean;
  onRefresh: () => void;
};

export function HostHeader({
  restaurantName,
  queueCount,
  loading,
  onRefresh,
}: HostHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{restaurantName}</h1>
        <p className="mt-1 text-sm text-muted">Cola activa · actualización automática</p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted tabular-nums">{queueCount} en cola</p>
        <button
          type="button"
          className="min-h-11 rounded-full border border-line px-4 text-sm text-ink"
          onClick={onRefresh}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>
    </header>
  );
}

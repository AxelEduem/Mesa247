import type { WaitlistEntry } from "../../types/waitlist";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { cn, formatCalledAt } from "../../lib/utils";

type QueueItemProps = {
  entry: WaitlistEntry;
  calling: boolean;
  disabled: boolean;
  onCall: (entryId: number) => void;
  onSeat: (entryId: number) => void;
  onNoShow: (entryId: number) => void;
};

export function QueueItem({ entry, calling, disabled, onCall, onSeat, onNoShow }: QueueItemProps) {
  const canCall = entry.status === "WAITING";
  const calledAt = formatCalledAt(entry.called_at);

  return (
    <li
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)] sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl px-3 py-3",
        entry.status === "CALLED" && "bg-surface-2",
      )}
    >
      <p className="w-8 text-lg font-semibold tabular-nums text-ink">{entry.position}</p>
      <div className="min-w-0">
        <p className="truncate font-medium text-ink">{entry.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>{entry.party_size} pers.</span>
          {canCall ? (
            <Badge status="WAITING" label="En espera" />
          ) : (
            <Badge
              status={entry.status}
              label={calledAt ? `Llamado ${calledAt}` : entry.status}
            />
          )}
        </div>
      </div>
      <div className="col-span-2 flex flex-wrap justify-end gap-2 sm:col-span-1">
      {canCall ? (
        <Button
          type="button"
          variant="call"
          disabled={disabled}
          aria-label={`Llamar a ${entry.name}`}
          onClick={() => onCall(entry.id)}
        >
          {calling ? <Spinner label="Llamando" /> : "Llamar"}
        </Button>
      ) : (
        <>
          <Button disabled={disabled} onClick={() => onSeat(entry.id)}>{calling ? "Procesando..." : "Sentar"}</Button>
          <Button variant="ghost" disabled={disabled} onClick={() => onNoShow(entry.id)}>No vino</Button>
        </>
      )}
      </div>
    </li>
  );
}

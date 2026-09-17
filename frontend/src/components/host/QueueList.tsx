import type { WaitlistEntry } from "../../types/waitlist";
import { EmptyState } from "../ui/EmptyState";
import { QueueItem } from "./QueueItem";

type QueueListProps = {
  entries: WaitlistEntry[];
  callingId: number | null;
  onCall: (entryId: number) => void;
  onSeat: (entryId: number) => void;
  onNoShow: (entryId: number) => void;
};

export function QueueList({ entries, callingId, onCall, onSeat, onNoShow }: QueueListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="No hay comensales en cola"
        description="Cuando alguien se una, aparecerá aquí con su posición y estado."
      />
    );
  }

  return (
    <ul className="divide-y divide-line">
      {entries.map((entry) => (
        <QueueItem
          key={entry.id}
          entry={entry}
          calling={callingId === entry.id}
          disabled={callingId !== null}
          onCall={onCall}
          onSeat={onSeat}
          onNoShow={onNoShow}
        />
      ))}
    </ul>
  );
}

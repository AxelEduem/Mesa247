import { DinerHeader } from "../components/diner/DinerHeader";
import { JoinQueueForm } from "../components/diner/JoinQueueForm";
import { QueueStatus } from "../components/diner/QueueStatus";
import { Card } from "../components/ui/Card";
import type { WaitlistCreatePayload, DinerEntry } from "../types/waitlist";

type DinerPageProps = {
  restaurantName: string;
  joinedEntry: DinerEntry | null;
  restoring: boolean;
  onRefresh: () => void;
  onLeave: () => void;
  onReset: () => void;
  submitting: boolean;
  error: string | null;
  onJoin: (payload: Omit<WaitlistCreatePayload, "restaurant_id">) => Promise<unknown>;
};

export function DinerPage({
  restaurantName,
  joinedEntry,
  submitting,
  error,
  onJoin,
  restoring, onRefresh, onLeave, onReset,
}: DinerPageProps) {
  return (
    <div className="mx-auto w-full max-w-[26rem] px-4 py-6">
      <Card className="min-h-[34rem]">
        {restoring ? (
          <div className="grid gap-4" role="status">
            <p>{error ?? "Recuperando tu turno..."}</p>
            {error && <button type="button" onClick={onRefresh}>Reintentar</button>}
          </div>
        ) : joinedEntry ? (
          <>
            <DinerHeader restaurantName={restaurantName} />
            <QueueStatus joinedEntry={joinedEntry} submitting={submitting} onLeave={onLeave} onReset={onReset} />
            {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
          </>
        ) : (
          <>
            <DinerHeader restaurantName={restaurantName} />
            <JoinQueueForm submitting={submitting} error={error} onSubmit={onJoin} />
          </>
        )}
      </Card>
    </div>
  );
}

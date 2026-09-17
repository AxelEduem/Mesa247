import { HostHeader } from "../components/host/HostHeader";
import { QueueList } from "../components/host/QueueList";
import { QueueSummary } from "../components/host/QueueSummary";
import { Card } from "../components/ui/Card";
import { Spinner } from "../components/ui/Spinner";
import type { WaitlistEntry } from "../types/waitlist";

type HostPageProps = {
  restaurantName: string;
  entries: WaitlistEntry[];
  loading: boolean;
  callingId: number | null;
  error: string | null;
  onRefresh: () => void;
  onCall: (entryId: number) => void;
  onSeat: (entryId: number) => void;
  onNoShow: (entryId: number) => void;
};

export function HostPage({
  restaurantName,
  entries,
  loading,
  callingId,
  error,
  onRefresh,
  onCall,
  onSeat, onNoShow,
}: HostPageProps) {
  const waiting = entries.filter((entry) => entry.status === "WAITING").length;
  const called = entries.filter((entry) => entry.status === "CALLED").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
      <Card className="rounded-[1.5rem] p-5 md:p-6">
        <HostHeader
          restaurantName={restaurantName}
          queueCount={entries.length}
          loading={loading || callingId !== null}
          onRefresh={onRefresh}
        />
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            {loading && entries.length === 0 ? (
              <Spinner label="Cargando cola..." />
            ) : (
              <QueueList entries={entries} callingId={callingId} onCall={onCall} onSeat={onSeat} onNoShow={onNoShow} />
            )}
          </div>
          <QueueSummary total={entries.length} waiting={waiting} called={called} />
        </div>
      </Card>
    </div>
  );
}

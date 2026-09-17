import { useState } from "react";
import { ReportPage } from "./pages/ReportPage";
import { DinerPage } from "./pages/DinerPage";
import { HostPage } from "./pages/HostPage";
import { useWaitlist } from "./hooks/useWaitlist";
import { RESTAURANT_ID, RESTAURANT_NAME } from "./config";
import { cn } from "./lib/utils";

type View = "diner" | "host" | "report";

function App() {
  const [view, setView] = useState<View>("diner");
  const waitlist = useWaitlist(RESTAURANT_ID, view);

  return (
    <div className="min-h-screen bg-app text-ink">
      <div className="flex flex-wrap justify-center gap-2 px-4 pt-4">
        <button
          type="button"
          className={cn(
            "min-h-10 rounded-full px-4 text-sm",
            view === "diner" ? "bg-primary text-primary-ink" : "text-muted",
          )}
          onClick={() => setView("diner")}
          disabled={waitlist.mutating}
        >
          Comensal
        </button>
        <button
          type="button"
          className={cn(
            "min-h-10 rounded-full px-4 text-sm",
            view === "host" ? "bg-primary text-primary-ink" : "text-muted",
          )}
          onClick={() => setView("host")}
          disabled={waitlist.mutating}
        >
          Anfitrión
        </button>
        <button type="button" disabled={waitlist.mutating} onClick={() => setView("report")}
          className={cn("min-h-10 rounded-full px-4 text-sm", view === "report" ? "bg-primary text-primary-ink" : "text-muted")}>
          Reporte del día
        </button>
      </div>

      {view === "diner" ? (
        <DinerPage
          restaurantName={RESTAURANT_NAME}
          joinedEntry={waitlist.joinedEntry}
          submitting={waitlist.mutating}
          error={waitlist.error}
          onJoin={waitlist.joinQueue}
          restoring={waitlist.restoring}
          onRefresh={() => void waitlist.loadQueue()}
          onLeave={() => { if (waitlist.joinedEntry) void waitlist.act(waitlist.joinedEntry.id, "leave"); }}
          onReset={waitlist.resetSession}
        />
      ) : view === "report" ? (
        <ReportPage report={waitlist.report} loading={waitlist.loading} error={waitlist.error} onRefresh={() => void waitlist.loadQueue()} />
      ) : (
        <HostPage
          restaurantName={RESTAURANT_NAME}
          entries={waitlist.queue?.entries ?? []}
          loading={waitlist.loading}
          callingId={waitlist.callingId}
          error={waitlist.error}
          onRefresh={() => void waitlist.loadQueue()}
          onCall={(entryId) => void waitlist.act(entryId, "call")}
          onSeat={(entryId) => void waitlist.act(entryId, "seat")}
          onNoShow={(entryId) => void waitlist.act(entryId, "no-show")}
        />
      )}
    </div>
  );
}

export default App;

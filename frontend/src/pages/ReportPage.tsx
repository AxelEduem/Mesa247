import type { DailyReport } from "../types/waitlist";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

type Props = { report: DailyReport | null; loading: boolean; error: string | null; onRefresh: () => void };

export function ReportPage({ report, loading, error, onRefresh }: Props) {
  const date = report && new Date(`${report.date}T12:00:00Z`).toLocaleDateString("es-PE", {
    timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const rows = report ? [
    ["Se unieron", report.joined], ["Se sentaron", report.seated],
    ["Se fueron sin sentarse", report.left], ["No vinieron al ser llamados", report.no_show],
    ["Espera media", report.average_wait_minutes === null ? "Sin llamadas todavía" : `${report.average_wait_minutes} min`],
  ] : [];
  return <main className="mx-auto w-full max-w-2xl px-4 py-6">
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reporte del día</h1>
        <Button variant="ghost" disabled={loading} onClick={onRefresh}>{loading ? "Actualizando..." : "Actualizar"}</Button>
      </div>
      {error && <p role="alert" className="mt-4 text-danger">{error}</p>}
      {report && <>
        <p className="mt-5 capitalize">{date}</p>
        <p className="mt-1 text-sm text-muted">{report.restaurant_name} · {report.timezone}</p>
        <dl className="mt-6 divide-y divide-line">
          {rows.map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 py-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="text-right text-lg font-semibold tabular-nums">{value}</dd>
          </div>)}
        </dl>
        <p className="mt-5 text-sm leading-6 text-muted">Grupos registrados hoy, desde las 00:00 hasta las 24:00 del restaurante. Los estados se actualizan durante el día; los grupos todavía en cola no son estados finales. Espera media desde el registro hasta la llamada.</p>
      </>}
    </Card>
  </main>;
}

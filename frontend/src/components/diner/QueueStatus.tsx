import type { DinerEntry } from "../../types/waitlist";
import { useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

type QueueStatusProps = {
  joinedEntry: DinerEntry;
  submitting: boolean;
  onLeave: () => void;
  onReset: () => void;
};

export function QueueStatus({ joinedEntry, submitting, onLeave, onReset }: QueueStatusProps) {
  const [confirming, setConfirming] = useState(false);
  const messages = {
    WAITING: "Estás en la cola",
    CALLED: "Es tu turno",
    SEATED: "¡Ya estás sentado!",
    LEFT: "Saliste de la cola",
    NO_SHOW: "Tu turno fue marcado como no presentado",
  };
  const active = joinedEntry.status === "WAITING" || joinedEntry.status === "CALLED";
  return (
    <div className="grid justify-items-center gap-4 py-4 text-center" aria-live="polite">
      <h2 className="text-xl font-semibold">{messages[joinedEntry.status]}</h2>
      {active && <><p className="text-sm text-muted">Tu número de turno</p>
      <p className="text-7xl font-semibold tracking-tight text-ink">#{joinedEntry.position}</p></>}
      <Badge status={joinedEntry.status} />
      <p className="max-w-[16rem] text-sm leading-6 text-muted">
        {joinedEntry.status === "WAITING" ? "Esta pantalla se actualiza automáticamente cada 10 segundos. El anfitrión confirma el tiempo de espera."
          : joinedEntry.status === "CALLED" ? "Acércate al anfitrión para que te acompañe a tu mesa."
          : joinedEntry.status === "SEATED" ? "Disfruta tu visita."
          : "Este turno ha finalizado. Puedes volver al inicio para registrar una nueva visita."}
      </p>
      {joinedEntry.status === "WAITING" && (confirming ? (
        <div className="grid gap-3 rounded-2xl border border-line p-4">
          <p>¿Quieres salir de la cola? Perderás este turno.</p>
          <Button disabled={submitting} onClick={onLeave}>{submitting ? "Saliendo..." : "Confirmar salida"}</Button>
          <Button variant="ghost" disabled={submitting} onClick={() => setConfirming(false)}>Seguir esperando</Button>
        </div>
      ) : <Button variant="ghost" disabled={submitting} onClick={() => setConfirming(true)}>Ya no voy</Button>)}
      {!active && <Button variant="ghost" disabled={submitting} onClick={onReset}>Volver al inicio</Button>}
    </div>
  );
}

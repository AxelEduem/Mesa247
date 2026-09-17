import { useState, type FormEvent } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Spinner } from "../ui/Spinner";

type JoinQueueFormProps = {
  submitting: boolean;
  error: string | null;
  onSubmit: (payload: { name: string; phone: string; party_size: number }) => Promise<unknown>;
};

export function JoinQueueForm({ submitting, error, onSubmit }: JoinQueueFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(4);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    await onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      party_size: partySize,
    });
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <Input
        label="Nombre"
        name="name"
        autoComplete="name"
        placeholder="Carla"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <Input
        label="Teléfono"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="+51 987 654 321"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        required
      />
      <div>
        <p className="mb-2 text-sm text-muted" id="party-size-label">
          ¿Cuántos son?
        </p>
        <div
          className="flex min-h-12 items-center justify-between rounded-2xl border border-line bg-surface-2 px-4"
          role="group"
          aria-labelledby="party-size-label"
        >
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-ink"
            aria-label="Reducir cantidad de personas"
            onClick={() => setPartySize((value) => Math.max(1, value - 1))}
          >
            −
          </button>
          <span className="text-lg font-semibold tabular-nums">{partySize}</span>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-ink"
            aria-label="Aumentar cantidad de personas"
            onClick={() => setPartySize((value) => value + 1)}
          >
            +
          </button>
        </div>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" disabled={submitting} className="mt-2 w-full">
        {submitting ? <Spinner label="Uniendo a la cola..." /> : "Unirme a la cola"}
      </Button>
    </form>
  );
}

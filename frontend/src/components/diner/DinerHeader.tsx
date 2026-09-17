type DinerHeaderProps = {
  restaurantName: string;
};

export function DinerHeader({ restaurantName }: DinerHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{restaurantName}</h1>
      <p className="mt-1 text-sm text-muted">Lista de espera · hoy</p>
    </header>
  );
}

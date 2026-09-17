import { cn } from "../../lib/utils";

type SpinnerProps = {
  className?: string;
  label?: string;
};

export function Spinner({ className, label = "Cargando" }: SpinnerProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-muted", className)} role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary" />
      {label}
    </span>
  );
}

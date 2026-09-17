import type { InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="flex flex-col gap-2 text-sm" htmlFor={inputId}>
      <span className="text-muted">{label}</span>
      <input
        id={inputId}
        className={cn(
          "min-h-12 rounded-2xl border border-line bg-surface-2 px-4 text-base text-ink placeholder:text-muted",
          className,
        )}
        {...props}
      />
    </label>
  );
}

import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "call";
};

export function Button({
  variant = "primary",
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" && "bg-primary text-primary-ink hover:bg-white",
        variant === "ghost" && "border border-line bg-transparent text-ink hover:bg-surface-2",
        variant === "call" && "min-w-24 bg-primary px-5 text-primary-ink hover:bg-white",
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}

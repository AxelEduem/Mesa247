import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type CardProps = {
  className?: string;
  children: ReactNode;
};

export function Card({ className, children }: CardProps) {
  return (
    <section className={cn("rounded-[2rem] border border-line bg-surface p-6", className)}>
      {children}
    </section>
  );
}

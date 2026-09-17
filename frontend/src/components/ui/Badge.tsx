import type { WaitlistStatus } from "../../types/waitlist";
import { cn } from "../../lib/utils";

type BadgeProps = {
  status: WaitlistStatus;
  label?: string;
};

const styles: Record<WaitlistStatus, string> = {
  WAITING: "bg-waiting/15 text-waiting",
  CALLED: "bg-called/15 text-called",
  SEATED: "bg-success/15 text-success",
  LEFT: "bg-muted/15 text-muted",
  NO_SHOW: "bg-danger/15 text-danger",
};

export function Badge({ status, label }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        styles[status],
      )}
    >
      {label ?? status}
    </span>
  );
}

import type { RiskLevel } from "@/lib/types";
import { riskColor, riskLabel } from "@/lib/risk";

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${riskColor(
        level
      )}`}
      aria-label={`Current risk level: ${riskLabel(level)}`}
    >
      {riskLabel(level)}
    </span>
  );
}

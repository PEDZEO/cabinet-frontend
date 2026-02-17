import { formatGbPerDay } from '../utils/formatters';
import { RISK_STYLES, type RiskLevel } from '../utils/risk';

interface RiskBadgeProps {
  level: RiskLevel;
  ratio: number;
  gbPerDay: number;
}

export function RiskBadge({ level, ratio, gbPerDay }: RiskBadgeProps) {
  const style = RISK_STYLES[level];
  const barWidth = Math.min(ratio * 100, 100);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${style.dot}`} />
        <span className={`text-[11px] font-semibold tabular-nums ${style.text}`}>
          {formatGbPerDay(gbPerDay)}
        </span>
        <span className={`text-[10px] ${style.text} opacity-60`}>GB/d</span>
      </div>
      <div className={`h-1 w-full max-w-[60px] rounded-full ${style.bg}`}>
        <div
          className={`h-full rounded-full ${style.bar} transition-all`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

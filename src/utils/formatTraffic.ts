/**
 * Format traffic amount with appropriate unit (MB/GB/TB).
 * Matches the prototype's formatBytes logic.
 */
export function formatTraffic(gb: number): string {
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(gb * 1024).toFixed(0)} MB`;
}

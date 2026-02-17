export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const kilo = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(kilo));
  const formattedValue = parseFloat((bytes / Math.pow(kilo, unitIndex)).toFixed(2));

  return `${formattedValue} ${units[unitIndex]}`;
}

export function formatUptime(seconds: number | null): string {
  if (!seconds) return '-';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const formatCurrency = (kopeks: number): string => {
  const rubles = kopeks / 100;
  if (rubles === 0) return '0';
  if (rubles < 10) return rubles.toFixed(2);
  if (rubles < 1000) return Math.round(rubles).toString();
  return `${(rubles / 1000).toFixed(1)}k`;
};

export const formatShortDate = (iso: string | null): string => {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '\u2014';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
};

export const toBackendSortField = (columnId: string): string => {
  if (columnId === 'user') return 'full_name';
  return columnId;
};

export const formatGbPerDay = (gbPerDay: number): string => {
  if (gbPerDay < 0.01) return '<0.01';
  if (gbPerDay < 10) return gbPerDay.toFixed(2);
  if (gbPerDay < 100) return gbPerDay.toFixed(1);
  return Math.round(gbPerDay).toString();
};

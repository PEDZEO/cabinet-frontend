function luminance(hex: string): number | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return null;

  const channels = match.slice(1).map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(foreground: string, background: string): number {
  const foregroundValue = luminance(foreground) ?? 0;
  const backgroundValue = luminance(background) ?? 0;
  return (
    (Math.max(foregroundValue, backgroundValue) + 0.05) /
    (Math.min(foregroundValue, backgroundValue) + 0.05)
  );
}

export function readableForeground(foreground: string, background: string): string {
  if (luminance(background) === null || contrastRatio(foreground, background) >= 4.5) {
    return foreground;
  }
  return contrastRatio('#ffffff', background) >= 4.5 ? '#ffffff' : '#000000';
}

/**
 * Cross-platform clipboard utility with fallback for Telegram WebView.
 * navigator.clipboard.writeText() is unavailable in some WebViews.
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    try {
      textarea.select();
      const ok = document.execCommand('copy');
      if (!ok) throw new Error('execCommand copy failed');
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

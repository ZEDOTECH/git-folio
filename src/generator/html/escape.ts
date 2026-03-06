export function escape(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only allow http/https URLs; return '' otherwise */
export function safeUrl(url: string | null | undefined): string {
  if (!url) return '';
  return /^https?:\/\//.test(url) ? url : '';
}

/**
 * Strip HTML tags and return a plain-text snippet of max length.
 * Used for job posting URL fetch preview (PER-78).
 */
export function getTextSnippet(html: string, maxLength = 200): string {
  const text = html.replace(/<\/?[^>]+(>|$)/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '…'
}

/**
 * Wraps a private Vercel Blob URL in the serve proxy so it can be
 * embedded directly in <img>, <video>, or <a> tags.
 */
export function blobUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return `/api/blob/serve?url=${encodeURIComponent(url)}`;
}

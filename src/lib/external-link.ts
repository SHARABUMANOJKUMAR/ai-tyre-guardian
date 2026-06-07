// Safely open external links that may be blocked inside the preview iframe
// (e.g. wa.me, google.com). We try window.open first; if
// that's blocked, we fall back to navigating the top-most window, and finally
// the current window.
export function openExternal(url: string) {
  try {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (win && !win.closed) return;
  } catch {
    /* ignore */
  }
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = url;
      return;
    }
  } catch {
    /* cross-origin top — fall through */
  }
  window.location.href = url;
}

// Build WhatsApp URLs with multi-target fallback.
//
// Why: some networks / extensions block one of the three WhatsApp endpoints
// (api.whatsapp.com is commonly blocked by ad-blockers; web.whatsapp.com can
// be blocked by corporate DNS; wa.me redirects to api.whatsapp.com on desktop).
// We pick the best primary per device and keep alternates as fallbacks.
//
// - Mobile primary: wa.me  → deep-links into the native WhatsApp app.
// - Desktop primary: web.whatsapp.com/send → opens WhatsApp Web directly,
//   skipping the api.whatsapp.com redirect that ad-blockers often kill.

export type WhatsAppTarget = "wa.me" | "web" | "api";

function cleanPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function isMobile() {
  return (
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}

export function whatsappUrlFor(
  target: WhatsAppTarget,
  phone: string,
  text?: string,
): string {
  const p = cleanPhone(phone);
  const t = text ? encodeURIComponent(text) : "";
  switch (target) {
    case "wa.me":
      return `https://wa.me/${p}${t ? `?text=${t}` : ""}`;
    case "web":
      return `https://web.whatsapp.com/send?phone=${p}${t ? `&text=${t}` : ""}`;
    case "api":
      return `https://api.whatsapp.com/send?phone=${p}${t ? `&text=${t}` : ""}`;
  }
}

/** Ordered list of URLs to try (best first). */
export function whatsappFallbackChain(phone: string, text?: string): string[] {
  if (isMobile()) {
    // On mobile, wa.me launches the app; web/api are last-resort browser fallbacks.
    return [
      whatsappUrlFor("wa.me", phone, text),
      whatsappUrlFor("api", phone, text),
      whatsappUrlFor("web", phone, text),
    ];
  }
  // On desktop, prefer web.whatsapp.com (no redirect), then wa.me, then api.
  return [
    whatsappUrlFor("web", phone, text),
    whatsappUrlFor("wa.me", phone, text),
    whatsappUrlFor("api", phone, text),
  ];
}

/** Primary URL — kept for callers that just want a single href. */
export function buildWhatsAppUrl(phone: string, text?: string): string {
  return whatsappFallbackChain(phone, text)[0];
}

/**
 * Try to open WhatsApp, falling back through the chain if the primary tab
 * is blocked or cannot be opened. We can't read remote frame state, so the
 * fallback heuristic is: if window.open returns null (popup blocked) OR the
 * opened window closes within ~1.2s (some blockers close it immediately),
 * try the next URL.
 */
export function openWhatsApp(phone: string, text?: string) {
  const urls = whatsappFallbackChain(phone, text);

  const tryNext = (i: number) => {
    if (i >= urls.length) {
      // Last resort: same-tab navigation to the last URL.
      window.location.href = urls[urls.length - 1];
      return;
    }
    const url = urls[i];
    let win: Window | null = null;
    try {
      win = window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      /* ignore */
    }
    if (!win) {
      // Popup blocked — try same-tab top navigation, then next URL.
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = url;
          return;
        }
      } catch {
        /* cross-origin top — fall through */
      }
      tryNext(i + 1);
      return;
    }
    // If the opened window dies almost instantly, assume blocked and try next.
    window.setTimeout(() => {
      try {
        if (win && win.closed) tryNext(i + 1);
      } catch {
        /* cross-origin — assume it loaded */
      }
    }, 1200);
  };

  tryNext(0);
}

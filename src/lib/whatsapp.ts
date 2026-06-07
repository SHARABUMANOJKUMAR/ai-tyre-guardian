// Build a WhatsApp URL that works around extensions/networks that block
// api.whatsapp.com (where wa.me redirects on desktop).
// - Mobile: use wa.me so the native WhatsApp app opens.
// - Desktop: link directly to web.whatsapp.com/send to avoid the
//   api.whatsapp.com redirect that some ad-blockers / DNS filters block.
export function buildWhatsAppUrl(phone: string, text?: string): string {
  const clean = phone.replace(/[^\d]/g, "");
  const encoded = text ? encodeURIComponent(text) : "";
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  if (isMobile) {
    return `https://wa.me/${clean}${encoded ? `?text=${encoded}` : ""}`;
  }
  return `https://web.whatsapp.com/send?phone=${clean}${encoded ? `&text=${encoded}` : ""}`;
}

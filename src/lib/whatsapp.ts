function cleanPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

function isMobile() {
  return (
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}

export function buildWhatsAppUrl(phone: string, text?: string): string {
  const p = cleanPhone(phone);
  const t = text ? encodeURIComponent(text) : "";
  return `https://wa.me/${p}${t ? `?text=${t}` : ""}`;
}

export function openWhatsApp(phone: string, text?: string) {
  const url = buildWhatsAppUrl(phone, text);
  if (isMobile()) {
    window.location.href = url;
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

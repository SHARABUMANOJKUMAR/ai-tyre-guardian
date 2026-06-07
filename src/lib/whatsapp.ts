function cleanPhone(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function buildWhatsAppUrl(phone: string, text?: string): string {
  const cleanText = text ?? "";
  const p = cleanPhone(phone);
  return `https://wa.me/${p}?text=${encodeURIComponent(cleanText)}`;
}

export function openWhatsApp(phone: string, text?: string) {
  const message = text ?? "";
  const cleanPhoneNumber = cleanPhone(phone);
  const url = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

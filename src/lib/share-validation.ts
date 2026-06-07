const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmailAddress(value: string) {
  return value.trim().toLowerCase();
}

export function validateEmailAddress(value: string) {
  const email = normalizeEmailAddress(value);
  if (!email || email.length > 160 || !EMAIL_PATTERN.test(email)) {
    throw new Error("Enter a valid email address");
  }
  return email;
}

export function normalizeWhatsAppNumber(value: string) {
  return value.trim().replace(/[^\d]/g, "");
}

export function validateWhatsAppNumber(value: string) {
  const phone = normalizeWhatsAppNumber(value);
  if (phone.length < 8 || phone.length > 15 || phone.startsWith("0")) {
    throw new Error("Enter a valid WhatsApp number with country code, e.g. +917013550760");
  }
  return phone;
}
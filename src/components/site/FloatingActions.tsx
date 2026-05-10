import { MessageCircle, Phone } from "lucide-react";

export function FloatingActions() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <a
        href="https://wa.me/919876543210?text=Hi%20Manoj%20Wheels%2C%20I%20need%20tyre%20service"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[oklch(0.72_0.18_145)] text-white shadow-elegant inline-flex items-center justify-center hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
      <a
        href="tel:+919876543210"
        aria-label="Call us"
        className="w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow inline-flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Phone className="w-6 h-6" />
      </a>
    </div>
  );
}

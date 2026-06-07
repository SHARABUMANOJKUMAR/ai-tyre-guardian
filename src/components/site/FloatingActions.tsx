import { Phone } from "lucide-react";
import { openExternal } from "@/lib/external-link";
import { openWhatsApp } from "@/lib/whatsapp";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.158-.674.158-1.018 0-.515-1.92-1.49-2.55-1.677ZM16.046 0a15.952 15.952 0 0 0-13.804 23.86L.142 31.516a.41.41 0 0 0 .5.5l7.846-2.057A15.95 15.95 0 1 0 16.046 0Zm0 28.485c-2.376 0-4.69-.69-6.67-1.998l-.473-.315-4.842 1.272 1.288-4.713-.302-.473A12.953 12.953 0 0 1 16.046 3.043 12.95 12.95 0 0 1 28.97 15.97 12.95 12.95 0 0 1 16.046 28.486Z" />
    </svg>
  );
}

export function FloatingActions() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          openWhatsApp("918897230858", "Hi Manoj Wheels, I need tyre service");
        }}
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[oklch(0.72_0.18_145)] text-white shadow-elegant inline-flex items-center justify-center hover:scale-110 transition-transform"
      >
        <WhatsAppIcon className="w-7 h-7" />
      </button>
      <a
        href="tel:+918897230858"
        aria-label="Call us"
        className="w-14 h-14 rounded-full bg-gradient-primary text-primary-foreground shadow-glow inline-flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Phone className="w-6 h-6" />
      </a>
    </div>
  );
}

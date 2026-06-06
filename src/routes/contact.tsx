import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, MapPin, Clock, Mail, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Manoj Wheels — Phone, WhatsApp, Email & Location" },
      { name: "description", content: "Get in touch with Manoj Wheels for tyre and wheel services. Call +91 88972 30858, WhatsApp, email or visit our workshop. Open 7 days a week." },
    ],
  }),
  component: ContactPage,
});

const WHATSAPP = "918897230858";
const PHONE_DISPLAY = "+91 88972 30858";
const EMAIL = "manojwheels.official@gmail.com";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  phone: z.string().trim().regex(/^[+\d\s-]{7,15}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(120).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Add a short subject").max(120),
  message: z.string().trim().min(10, "Please share a few more details").max(1000),
});

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.158-.674.158-1.018 0-.515-1.92-1.49-2.55-1.677ZM16.046 0a15.952 15.952 0 0 0-13.804 23.86L.142 31.516a.41.41 0 0 0 .5.5l7.846-2.057A15.95 15.95 0 1 0 16.046 0Zm0 28.485c-2.376 0-4.69-.69-6.67-1.998l-.473-.315-4.842 1.272 1.288-4.713-.302-.473A12.953 12.953 0 0 1 16.046 3.043 12.95 12.95 0 0 1 28.97 15.97 12.95 12.95 0 0 1 16.046 28.486Z" />
    </svg>
  );
}

function ContactPage() {
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
      subject: String(fd.get("subject") ?? ""),
      message: String(fd.get("message") ?? ""),
    };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { map[i.path[0] as string] = i.message; });
      setErrors(map);
      toast.error("Please fix the errors in the form");
      return;
    }
    setErrors({});
    setSubmitting(true);

    // Hand off to WhatsApp with a pre-filled professional message
    const text =
      `Hello Manoj Wheels,\n\n` +
      `Name: ${parsed.data.name}\n` +
      `Phone: ${parsed.data.phone}\n` +
      (parsed.data.email ? `Email: ${parsed.data.email}\n` : "") +
      `Subject: ${parsed.data.subject}\n\n` +
      `${parsed.data.message}`;
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

    setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      toast.success("Message ready — opening WhatsApp");
      window.open(url, "_blank", "noopener,noreferrer");
    }, 400);
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">Let's <span className="text-gradient-primary">talk tyres</span></h1>
        <p className="mt-4 text-muted-foreground">Call, WhatsApp, email or send us a message — we reply within minutes during working hours.</p>
      </div>

      <div className="mt-12 grid lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        <Card className="p-6 bg-card/60 hover-lift">
          <Phone className="w-7 h-7 text-primary" />
          <h3 className="mt-4 font-bold">Call Us</h3>
          <p className="mt-1 text-sm text-muted-foreground">Speak directly with our service desk.</p>
          <a href="tel:+918897230858" className="mt-4 inline-block font-semibold text-gradient-gold">{PHONE_DISPLAY}</a>
        </Card>
        <Card className="p-6 bg-card/60 hover-lift">
          <WhatsAppIcon className="w-7 h-7 text-[oklch(0.72_0.18_145)]" />
          <h3 className="mt-4 font-bold">WhatsApp</h3>
          <p className="mt-1 text-sm text-muted-foreground">Quick replies, photos &amp; instant booking.</p>
          <Button asChild variant="hero" size="sm" className="mt-4">
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer">
              <WhatsAppIcon className="w-4 h-4" /> Chat Now
            </a>
          </Button>
        </Card>
        <Card className="p-6 bg-card/60 hover-lift">
          <Mail className="w-7 h-7 text-primary" />
          <h3 className="mt-4 font-bold">Email</h3>
          <p className="mt-1 text-sm text-muted-foreground">For fleet enquiries &amp; partnerships.</p>
          <a href={`mailto:${EMAIL}`} className="mt-4 inline-block font-semibold text-gradient-gold break-all">{EMAIL}</a>
        </Card>
        <Card className="p-6 bg-card/60 hover-lift">
          <Clock className="w-7 h-7 text-primary" />
          <h3 className="mt-4 font-bold">Working Hours</h3>
          <p className="mt-1 text-sm text-muted-foreground">Open every day of the week.</p>
          <p className="mt-4 font-semibold">Mon – Sun<br />8:00 AM – 9:00 PM</p>
        </Card>
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* Contact form */}
        <Card className="p-6 sm:p-8 bg-card/60">
          {done ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-primary inline-flex items-center justify-center shadow-glow">
                <CheckCircle2 className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="mt-5 text-2xl font-bold">Message ready!</h2>
              <p className="mt-2 text-muted-foreground max-w-sm mx-auto">We've opened WhatsApp with your message. Just press send and our team will get back to you shortly.</p>
              <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>Send another message</Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold">Send us a message</h2>
              <p className="mt-1 text-sm text-muted-foreground">Fill in your details and we'll respond on WhatsApp.</p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" placeholder="John Doe" autoComplete="name" />
                    {errors.name && <p className="mt-1 text-xs text-primary">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input id="phone" name="phone" placeholder="+91 98765 43210" autoComplete="tel" />
                    {errors.phone && <p className="mt-1 text-xs text-primary">{errors.phone}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" />
                  {errors.email && <p className="mt-1 text-xs text-primary">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" name="subject" placeholder="Wheel alignment enquiry" />
                  {errors.subject && <p className="mt-1 text-xs text-primary">{errors.subject}</p>}
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" name="message" rows={5} placeholder="Tell us about your vehicle and what you need…" />
                  {errors.message && <p className="mt-1 text-xs text-primary">{errors.message}</p>}
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                  <Send className="w-4 h-4" /> {submitting ? "Sending…" : "Send Message"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">By submitting, you agree to be contacted by Manoj Wheels regarding your enquiry.</p>
              </form>
            </>
          )}
        </Card>

        {/* Location + map */}
        <div className="space-y-6">
          <Card className="p-6 bg-card/60">
            <MapPin className="w-7 h-7 text-primary" />
            <h3 className="mt-4 font-bold">Workshop Address</h3>
            <p className="mt-2 text-muted-foreground">
              Manoj Puncture Shop<br />
              Kadapa, Andhra Pradesh<br />
              India
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <a
                href="https://maps.app.goo.gl/JhCgSCwE3CbA842u7"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="w-4 h-4" /> Get Directions
              </a>
            </Button>
          </Card>
          <Card className="p-0 overflow-hidden bg-card/60">
            <iframe
              title="Manoj Puncture Shop location"
              src="https://www.google.com/maps?q=Manoj+puncture+shop+Kadapa&z=17&output=embed"
              width="100%"
              height="100%"
              style={{ minHeight: 360, border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

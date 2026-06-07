import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { openExternal } from "@/lib/external-link";
import { openWhatsApp } from "@/lib/whatsapp";

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "Book Tyre Service Online in Pulivendula | Manoj Wheels" },
      { name: "description", content: "Book wheel alignment, balancing, puncture repair & tyre services online in Pulivendula. Free pickup & drop within 5 km. Open 7 days." },
      { property: "og:title", content: "Book Tyre Service in Pulivendula | Manoj Wheels" },
      { property: "og:description", content: "Online booking for tyre care, wheel alignment, balancing & puncture repair." },
      { property: "og:url", content: "https://manojwheels.online/book" },
    ],
    links: [{ rel: "canonical", href: "https://manojwheels.online/book" }],
  }),
  component: BookPage,
});

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyYDQDaOrFQcHzyuQEXosGlnZi-elAJtR3PVj2k4p7uZUZCzL6qoHRadgKjfjW3D5gacw/exec";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  phone: z.string().trim().regex(/^[+\d\s-]{7,15}$/, "Enter a valid phone number"),
  vehicle: z.string().min(1, "Select your vehicle type"),
  service: z.string().min(1, "Select a service"),
  date: z.string().min(1, "Pick a date"),
  time: z.string().min(1, "Pick a time"),
  notes: z.string().max(500).optional(),
});

function BookPage() {
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path.join(".")] = i.message; });
      setErrors(errs);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setSubmitting(true);

    const payload = {
      fullName: parsed.data.name,
      email: parsed.data.email,
      phoneNumber: parsed.data.phone,
      vehicleType: parsed.data.vehicle,
      serviceNeeded: parsed.data.service,
      preferredDate: parsed.data.date,
      preferredTime: parsed.data.time,
      additionalNotes: parsed.data.notes ?? "",
    };

    try {
      // Use text/plain to avoid CORS preflight against Google Apps Script
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      setDone(true);
      toast.success("Booking confirmed! We'll WhatsApp you shortly.");
    } catch {
      toast.error("Could not submit. Please try WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="container mx-auto px-4 py-24 max-w-xl text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-gradient-primary items-center justify-center shadow-glow">
          <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="mt-6 text-3xl sm:text-4xl font-extrabold">Booking Confirmed!</h1>
        <p className="mt-3 text-muted-foreground">Thank you for choosing Manoj Wheels. Our team will WhatsApp you a confirmation within 5 minutes.</p>
        <Button variant="hero" size="lg" className="mt-8" onClick={() => setDone(false)}>Book Another</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex w-14 h-14 rounded-xl bg-gradient-primary items-center justify-center shadow-glow"><CalendarDays className="w-6 h-6 text-primary-foreground" /></div>
        <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold">Book Your <span className="text-gradient-primary">Service</span></h1>
        <p className="mt-3 text-muted-foreground">Fill in your details below — we'll confirm your booking within minutes.</p>
      </div>

      <Card className="mt-10 p-6 sm:p-10 bg-card/60 max-w-3xl mx-auto">
        <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-5">
          <Field label="Full Name" name="name" placeholder="Rahul Sharma" error={errors.name} />
          <Field label="Email" name="email" type="email" placeholder="you@example.com" error={errors.email} />
          <Field label="Phone Number" name="phone" type="tel" placeholder="+91 98765 43210" error={errors.phone} />

          <SelectField label="Vehicle Type" name="vehicle" error={errors.vehicle}
            options={["Hatchback", "Sedan", "SUV", "Bike / Scooter", "Taxi", "Commercial / Fleet"]} />

          <SelectField label="Service Needed" name="service" error={errors.service}
            options={[
              "3D Wheel Alignment", "Wheel Balancing", "Nitrogen Air Filling",
              "Puncture Repair", "Tyre Replacement", "Valve Replacement",
              "Alloy Wheel Service", "Other",
            ]} />

          <Field label="Preferred Date" name="date" type="date" error={errors.date} />
          <Field label="Preferred Time" name="time" type="time" error={errors.time} />

          <div className="sm:col-span-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea id="notes" name="notes" rows={4} placeholder="Anything we should know?" maxLength={500} className="mt-1.5" />
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-3 mt-2">
            <Button type="submit" variant="hero" size="lg" disabled={submitting}>
              {submitting ? "Booking…" : "Confirm Booking"}
            </Button>
            <Button type="button" variant="outline" size="lg" aria-label="Open WhatsApp chat" onClick={() => openWhatsApp("918897230858", "Hi Manoj Wheels, I want to book a service")}>
              <svg viewBox="0 0 32 32" fill="currentColor" className="w-5 h-5 text-[oklch(0.72_0.18_145)]" aria-hidden="true">
                <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.158-.674.158-1.018 0-.515-1.92-1.49-2.55-1.677ZM16.046 0a15.952 15.952 0 0 0-13.804 23.86L.142 31.516a.41.41 0 0 0 .5.5l7.846-2.057A15.95 15.95 0 1 0 16.046 0Zm0 28.485c-2.376 0-4.69-.69-6.67-1.998l-.473-.315-4.842 1.272 1.288-4.713-.302-.473A12.953 12.953 0 0 1 16.046 3.043 12.95 12.95 0 0 1 28.97 15.97 12.95 12.95 0 0 1 16.046 28.486Z" />
              </svg>
              WhatsApp
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Field({ label, name, type = "text", placeholder, error }: { label: string; name: string; type?: string; placeholder?: string; error?: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} className="mt-1.5" aria-invalid={!!error} />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SelectField({ label, name, options, error }: { label: string; name: string; options: string[]; error?: string }) {
  const [val, setVal] = useState("");
  return (
    <div>
      <Label>{label}</Label>
      <input type="hidden" name={name} value={val} />
      <Select value={val} onValueChange={setVal}>
        <SelectTrigger className="mt-1.5" aria-invalid={!!error}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger>
        <SelectContent>
          {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

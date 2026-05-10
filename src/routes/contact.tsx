import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Clock, MessageCircle, Mail } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Manoj Wheels — Phone, WhatsApp & Location" },
      { name: "description", content: "Get in touch with Manoj Wheels for tyre and wheel services. Call, WhatsApp or visit our workshop. Open 7 days a week." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold">Let's <span className="text-gradient-primary">talk tyres</span></h1>
        <p className="mt-4 text-muted-foreground">Call, WhatsApp or drop by — we're open 7 days a week.</p>
      </div>

      <div className="mt-12 grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <Card className="p-6 bg-card/60 hover-lift">
          <Phone className="w-7 h-7 text-primary" />
          <h3 className="mt-4 font-bold">Call Us</h3>
          <p className="mt-1 text-sm text-muted-foreground">Speak to our service desk directly.</p>
          <a href="tel:+919876543210" className="mt-4 inline-block font-semibold text-gradient-gold">+91 98765 43210</a>
        </Card>
        <Card className="p-6 bg-card/60 hover-lift">
          <MessageCircle className="w-7 h-7 text-primary" />
          <h3 className="mt-4 font-bold">WhatsApp</h3>
          <p className="mt-1 text-sm text-muted-foreground">Quick replies, photos & instant booking.</p>
          <Button asChild variant="hero" size="sm" className="mt-4"><a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">Chat Now</a></Button>
        </Card>
        <Card className="p-6 bg-card/60 hover-lift">
          <Mail className="w-7 h-7 text-primary" />
          <h3 className="mt-4 font-bold">Email</h3>
          <p className="mt-1 text-sm text-muted-foreground">For fleet enquiries & partnerships.</p>
          <a href="mailto:hello@manojwheels.in" className="mt-4 inline-block font-semibold text-gradient-gold">hello@manojwheels.in</a>
        </Card>
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <Card className="p-6 bg-card/60">
          <MapPin className="w-7 h-7 text-primary" />
          <h3 className="mt-4 font-bold">Workshop Address</h3>
          <p className="mt-2 text-muted-foreground">Manoj Wheels<br />Main Road, Near Bus Stand<br />India</p>
          <h3 className="mt-6 font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Hours</h3>
          <p className="mt-1 text-sm text-muted-foreground">Monday – Sunday<br />8:00 AM – 9:00 PM</p>
        </Card>
        <Card className="p-0 overflow-hidden bg-card/60">
          <iframe
            title="Manoj Wheels location"
            src="https://www.google.com/maps?q=India&output=embed"
            width="100%"
            height="100%"
            style={{ minHeight: 360, border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </Card>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import {
  Disc3, Gauge, Wind, Wrench, Cog, Droplets, Bike, Layers,
  AlertTriangle, ShieldCheck, ArrowRight, Sparkles
} from "lucide-react";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Tyre Services — 3D Alignment, Balancing & More | Manoj Wheels" },
      { name: "description", content: "Complete tyre & wheel care: 3D wheel alignment, balancing, nitrogen filling, puncture repair, tyre change, valve replacement, alloy services & 24/7 emergency support." },
      { property: "og:title", content: "Tyre & Wheel Services | Manoj Wheels" },
      { property: "og:description", content: "Premium tyre care services with AI-powered diagnostics." },
    ],
  }),
  component: ServicesPage,
});

const services = [
  { icon: Disc3, title: "3D Wheel Alignment", desc: "Computerised laser alignment for perfect handling, safer cornering and longer tyre life." },
  { icon: Gauge, title: "Wheel Balancing", desc: "Eliminate vibration, uneven wear and steering wobble at high speeds." },
  { icon: Wind, title: "Nitrogen Air Filling", desc: "Stable pressure, cooler tyres and improved mileage. Free with alignment." },
  { icon: Wrench, title: "Puncture Repair", desc: "Fast tubeless and tube puncture repair using premium patches." },
  { icon: Cog, title: "Tyre Change & Replacement", desc: "Genuine tyres from MRF, Apollo, CEAT, Michelin, Bridgestone & more." },
  { icon: Droplets, title: "Valve Replacement", desc: "Original valves to prevent slow leaks and pressure loss." },
  { icon: Bike, title: "Bike Tubes", desc: "Quality tubes for all motorcycle and scooter brands." },
  { icon: Layers, title: "Alloy Wheel Services", desc: "Repair, polishing, refurbishment and custom alloy installations." },
  { icon: AlertTriangle, title: "Emergency Puncture Support", desc: "On-call puncture support within 5 km — call us anytime." },
];

function ServicesPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-hero opacity-90" aria-hidden />
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="container mx-auto px-4 py-20 lg:py-28 relative text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> Our Services
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Premium tyre care, <span className="text-gradient-primary">honest pricing</span>
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-muted-foreground">
            Every service is performed by certified technicians using world-class
            equipment. Backed by AI diagnostics & a satisfaction guarantee.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <Card key={s.title} className="p-6 bg-card/60 hover-lift">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary/15 border border-primary/30 inline-flex items-center justify-center">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <Button asChild variant="ghost" size="sm" className="mt-4 px-0 hover:bg-transparent text-primary">
                <Link to="/book">Book this service <ArrowRight className="w-4 h-4" /></Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-3xl bg-gradient-primary p-10 md:p-14 text-center shadow-glow">
          <ShieldCheck className="w-12 h-12 text-primary-foreground mx-auto" />
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-primary-foreground">100% Satisfaction Guarantee</h2>
          <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">If you aren't fully happy with our service, we'll make it right — no questions asked.</p>
          <Button asChild variant="gold" size="xl" className="mt-6"><Link to="/book">Book a Service</Link></Button>
        </div>
      </section>
    </div>
  );
}

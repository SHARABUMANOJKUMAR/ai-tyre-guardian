import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Truck, ShieldCheck, Wrench, BarChart3, Phone } from "lucide-react";

export const Route = createFileRoute("/fleet")({
  head: () => ({
    meta: [
      { title: "Fleet Tyre Maintenance Plans | Manoj Wheels" },
      { name: "description", content: "Affordable tyre maintenance plans for taxis, delivery fleets and transport companies. Reduce downtime and extend tyre life with Manoj Wheels." },
    ],
  }),
  component: FleetPage,
});

function FleetPage() {
  return (
    <div>
      <section className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="container mx-auto px-4 py-20 lg:py-28 relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs uppercase tracking-wider">
              <Truck className="w-3.5 h-3.5 text-gold" /> Fleet Services
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              Keep your fleet on the road, <span className="text-gradient-primary">always</span>
            </h1>
            <p className="mt-5 text-muted-foreground max-w-xl">
              Tailored tyre maintenance contracts for taxis, delivery vehicles and
              transport fleets. Predictable pricing, AI tyre reports & priority service.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg"><Link to="/contact">Request Fleet Quote</Link></Button>
              <Button asChild variant="glass" size="lg"><a href="tel:+919876543210"><Phone className="w-4 h-4" /> Call Now</a></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader eyebrow="Why fleets choose us" title={<>Reduce downtime. <span className="text-gradient-primary">Extend tyre life.</span></>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, t: "Priority Service", d: "Skip the queue with dedicated fleet bays." },
            { icon: Wrench, t: "Mobile Support", d: "On-site puncture & emergency support across the city." },
            { icon: BarChart3, t: "AI Tyre Reports", d: "Per-vehicle health reports and replacement forecasts." },
            { icon: Truck, t: "Volume Pricing", d: "Significant discounts on tyres, alignment & balancing." },
          ].map((c) => (
            <Card key={c.t} className="p-6 bg-card/60 hover-lift">
              <c.icon className="w-8 h-8 text-primary" />
              <h3 className="mt-4 font-bold">{c.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Taxi Plan", price: "₹999/mo", per: "per vehicle", features: ["Free alignment monthly", "Free nitrogen", "Discounted tyres", "Priority puncture support"] },
            { name: "Delivery Plan", price: "₹1,499/mo", per: "per vehicle", features: ["Bi-weekly inspection", "AI tyre reports", "On-site emergency support", "Bulk tyre pricing"], highlight: true },
            { name: "Transport Plan", price: "Custom", per: "10+ vehicles", features: ["Dedicated account manager", "24/7 emergency line", "Quarterly reports", "Best market pricing"] },
          ].map((p) => (
            <Card key={p.name} className={`p-7 ${p.highlight ? "border-gold shadow-gold bg-gradient-to-b from-card to-secondary/40" : "bg-card/60"} hover-lift relative`}>
              {p.highlight && <span className="absolute -top-3 left-7 text-xs px-2.5 py-1 rounded-full bg-gradient-gold text-gold-foreground font-semibold">Most Popular</span>}
              <h3 className="text-xl font-bold">{p.name}</h3>
              <p className="mt-3"><span className="text-3xl font-extrabold text-gradient-primary">{p.price}</span> <span className="text-sm text-muted-foreground">{p.per}</span></p>
              <ul className="mt-5 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="text-muted-foreground">· {f}</li>)}
              </ul>
              <Button asChild variant={p.highlight ? "gold" : "hero"} className="w-full mt-6"><Link to="/contact">Get Started</Link></Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

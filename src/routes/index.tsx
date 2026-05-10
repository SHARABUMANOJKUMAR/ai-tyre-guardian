import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/site/SectionHeader";
import {
  ScanLine, Calendar, MessageCircle, ShieldCheck, Sparkles, Timer,
  Wrench, Gauge, Wind, Droplets, Disc3, Cog, Star, ArrowRight, CheckCircle2,
  Truck, Car, Bike, Trophy
} from "lucide-react";
import heroImg from "@/assets/hero-tyre.jpg";
import alignmentImg from "@/assets/alignment.jpg";
import tyreImg from "@/assets/tyre-closeup.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Manoj Wheels — AI-Powered Tyre Care Center in India" },
      { name: "description", content: "Drive Safer with AI-Powered Tyre Diagnostics. Upload your tyre photo, check tyre health instantly, and book expert wheel alignment & tyre services online." },
      { property: "og:title", content: "Manoj Wheels — AI-Powered Tyre Care" },
      { property: "og:description", content: "India's smartest AI-powered tyre care center." },
    ],
  }),
  component: HomePage,
});

const services = [
  { icon: Disc3, title: "3D Wheel Alignment", desc: "Laser-precise alignment for perfect handling and tyre life." },
  { icon: Gauge, title: "Wheel Balancing", desc: "Eliminate vibration and uneven wear at any speed." },
  { icon: Wind, title: "Nitrogen Air Filling", desc: "Better mileage, cooler tyres, and consistent pressure." },
  { icon: Wrench, title: "Puncture Repair", desc: "Expert repairs in minutes — tubeless and tube tyres." },
  { icon: Cog, title: "Tyre Replacement", desc: "Premium new tyres from all major brands at best prices." },
  { icon: Droplets, title: "Valve Replacement", desc: "Genuine valves to prevent slow leaks and pressure loss." },
];

const stats = [
  { value: "25K+", label: "Happy Customers" },
  { value: "12+", label: "Years of Trust" },
  { value: "98%", label: "Repeat Rate" },
  { value: "60min", label: "Avg. Service Time" },
];

const reviews = [
  { name: "Rahul Sharma", role: "Car Owner", text: "Best alignment service I've ever experienced. The AI tyre check told me exactly which tyre needed replacement.", rating: 5 },
  { name: "Priya Verma", role: "Family SUV", text: "Quick, transparent and premium quality. Free nitrogen filling is a great touch!", rating: 5 },
  { name: "Imran Khan", role: "Taxi Operator", text: "Manoj Wheels keeps my entire fleet running. Their fleet plan saves me thousands every month.", rating: 5 },
];

function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="absolute inset-0 grid-bg opacity-40" aria-hidden />
        <div className="absolute inset-0 bg-gradient-radial" aria-hidden />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative grid lg:grid-cols-2 gap-12 items-center py-20 lg:py-28">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              AI-Powered Tyre Diagnostics
            </span>
            <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight">
              Drive Safer with{" "}
              <span className="text-gradient-primary">AI-Powered</span>{" "}
              Tyre Diagnostics
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Upload your tyre photo, check tyre health instantly, and book expert
              wheel alignment and tyre services online — all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to="/ai-check"><ScanLine className="w-5 h-5" /> Check My Tyre Health</Link>
              </Button>
              <Button asChild variant="glass" size="xl">
                <Link to="/book"><Calendar className="w-5 h-5" /> Book Service Now</Link>
              </Button>
              <Button asChild variant="outline" size="xl" className="border-[oklch(0.72_0.18_145)] text-[oklch(0.85_0.18_145)] hover:bg-[oklch(0.72_0.18_145)] hover:text-white">
                <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer">
                  <MessageCircle className="w-5 h-5" /> WhatsApp
                </a>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gold" /> Trusted by 25,000+ drivers</span>
              <span className="flex items-center gap-2"><Timer className="w-4 h-4 text-gold" /> 60-min express service</span>
              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-gold fill-gold" /> 4.9 Google rating</span>
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-full" aria-hidden />
            <div className="relative rounded-2xl overflow-hidden shadow-elegant border border-border">
              <img
                src={heroImg}
                alt="Premium black sports car receiving AI-powered tyre service at Manoj Wheels"
                width={1920}
                height={1080}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Floating stat cards */}
            <div className="hidden md:flex absolute -left-6 top-10 glass rounded-xl p-4 shadow-elegant items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary inline-flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tyre Health</p>
                <p className="text-lg font-bold text-gradient-gold">94 / 100</p>
              </div>
            </div>
            <div className="hidden md:flex absolute -right-4 bottom-10 glass rounded-xl p-4 shadow-elegant items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-gold inline-flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-gold-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Safe to Use</p>
                <p className="text-sm font-semibold">~18,000 km left</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-card/40">
        <div className="container mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-gradient-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <SectionHeader
          eyebrow="Our Services"
          title={<>Premium tyre & wheel care, <span className="text-gradient-primary">end to end</span></>}
          description="From 3D laser alignment to nitrogen filling, our certified technicians use cutting-edge equipment to keep you safer on every drive."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <Card
              key={s.title}
              className="group p-6 bg-card/60 border-border hover-lift relative overflow-hidden"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-gradient-primary opacity-0 group-hover:opacity-20 blur-2xl transition-opacity" aria-hidden />
              <div className="w-12 h-12 rounded-xl bg-gradient-primary/15 border border-primary/30 inline-flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              <Link to="/services" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary group-hover:gap-2.5 transition-all">
                Learn more <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="hero" size="lg">
            <Link to="/services">View All Services <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </div>
      </section>

      {/* AI CHECK BANNER */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border shadow-elegant">
          <div className="absolute inset-0">
            <img src={tyreImg} alt="Premium tyre tread close-up" loading="lazy" width={1280} height={800} className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
          </div>
          <div className="relative p-8 sm:p-12 lg:p-16 max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-gold text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> New · Free
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              AI Tyre Health Check in <span className="text-gradient-gold">30 seconds</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Snap a photo. Our AI estimates tread wear, detects cracks, scores tyre
              health and tells you exactly when to replace.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Tyre Health Score 0–100", "Tread wear & crack detection", "Estimated remaining life in KM", "Smart replacement recommendation"].map((f) => (
                <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gold" /> {f}</li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/ai-check"><ScanLine className="w-5 h-5" /> Try AI Tyre Check</Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <Link to="/tyre-life">Tyre Life Calculator</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE / AFTER + offers */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <SectionHeader
          eyebrow="Special Offers"
          title={<>Premium care at <span className="text-gradient-primary">honest prices</span></>}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { title: "Free Nitrogen Filling", desc: "On every wheel alignment booking this month.", tag: "Limited" },
            { title: "20% Off Wheel Alignment", desc: "First-time customers get 20% off premium 3D alignment.", tag: "New" },
            { title: "Monsoon Tyre Check", desc: "Complimentary tyre & tread inspection — book online.", tag: "Free" },
          ].map((o) => (
            <Card key={o.title} className="p-6 bg-gradient-to-br from-card to-secondary/40 border-gold/20 hover-lift">
              <div className="flex items-center justify-between">
                <Trophy className="w-7 h-7 text-gold" />
                <span className="text-xs px-2 py-1 rounded-full bg-gold/15 text-gold font-semibold">{o.tag}</span>
              </div>
              <h3 className="mt-4 text-xl font-bold">{o.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{o.desc}</p>
              <Button asChild variant="gold" size="sm" className="mt-5">
                <Link to="/book">Claim Offer</Link>
              </Button>
            </Card>
          ))}
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="rounded-2xl overflow-hidden border border-border shadow-elegant">
            <img src={alignmentImg} alt="3D wheel alignment in progress" loading="lazy" width={1280} height={800} className="w-full h-auto" />
          </div>
          <div>
            <SectionHeader
              align="left"
              eyebrow="Who we serve"
              title={<>Trusted by drivers, families & <span className="text-gradient-primary">fleets</span></>}
              description="Whether it's your daily commuter or a fleet of 50 taxis, our team delivers consistent quality, transparent pricing and AI-backed reports for every vehicle."
            />
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { icon: Car, label: "Car Owners" },
                { icon: Bike, label: "Bike Riders" },
                { icon: Truck, label: "Fleets & Taxis" },
              ].map((c) => (
                <div key={c.label} className="glass rounded-xl p-5 text-center hover-lift">
                  <c.icon className="w-7 h-7 text-primary mx-auto" />
                  <p className="mt-3 text-sm font-semibold">{c.label}</p>
                </div>
              ))}
            </div>
            <Button asChild variant="hero" className="mt-8" size="lg">
              <Link to="/fleet">Explore Fleet Plans <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <SectionHeader
          eyebrow="Customer Love"
          title={<>Rated <span className="text-gradient-gold">4.9 / 5</span> by 2,800+ drivers</>}
        />
        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <Card key={r.name} className="p-6 bg-card/60 hover-lift">
              <div className="flex gap-0.5 text-gold">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gold" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/90">"{r.text}"</p>
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.role}</p>
              </div>
            </Card>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="outline" size="lg"><Link to="/reviews">Read all reviews</Link></Button>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 md:p-16 text-center shadow-glow">
          <div className="absolute inset-0 grid-bg opacity-20" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground">Ready for safer drives?</h2>
            <p className="mt-3 text-primary-foreground/90 max-w-xl mx-auto">
              Book your service in 60 seconds. Free pickup & drop available within 5 km.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild variant="gold" size="xl"><Link to="/book">Book Service Now</Link></Button>
              <Button asChild variant="glass" size="xl"><Link to="/ai-check">Try AI Tyre Check</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

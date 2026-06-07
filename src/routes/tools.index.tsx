import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ScanLine,
  Gauge,
  Ruler,
  Wind,
  Fuel,
  Compass,
  Timer,
  CloudSun,
  Map,
  Bot,
  ArrowRight,
  Sparkles,
  Wrench,
} from "lucide-react";

export const Route = createFileRoute("/tools/")({
  head: () => ({
    meta: [
      { title: "Smart Tyre & Vehicle Tools Hub | Manoj Wheels" },
      {
        name: "description",
        content:
          "AI-powered tyre tools — alignment checker, life predictor, seasonal health, road-trip safety, AI service advisor and more. PDF, WhatsApp & email sharing.",
      },
      { property: "og:title", content: "Manoj Wheels — Smart Tools Hub" },
      {
        property: "og:description",
        content:
          "10 smart tools for drivers — AI tyre analyzer, alignment, life predictor, weather-aware health and more.",
      },
    ],
  }),
  component: ToolsHub,
});

interface ToolCardProps {
  title: string;
  desc: string;
  to: string;
  icon: React.ReactNode;
  tag?: string;
}

const TOOLS: ToolCardProps[] = [
  {
    title: "AI Tyre Analyzer",
    desc: "Upload a photo and get an AI health score, tread wear and remaining life.",
    to: "/ai-check",
    icon: <ScanLine className="w-6 h-6" />,
    tag: "AI",
  },
  {
    title: "Wheel Alignment Checker",
    desc: "Symptom-based alignment risk score with possible causes.",
    to: "/tools/wheel-alignment-checker",
    icon: <Compass className="w-6 h-6" />,
    tag: "AI",
  },
  {
    title: "Tyre Life Predictor",
    desc: "Remaining tyre life in km and months from tread depth, age & driving style.",
    to: "/tools/tyre-life-predictor",
    icon: <Timer className="w-6 h-6" />,
    tag: "AI",
  },
  {
    title: "Seasonal Tyre Health",
    desc: "Live local weather feeds into a seasonal tyre risk score.",
    to: "/tools/seasonal-tyre-health",
    icon: <CloudSun className="w-6 h-6" />,
    tag: "Live",
  },
  {
    title: "Road Trip Safety Checker",
    desc: "Score your tyres' readiness before a long trip.",
    to: "/tools/road-trip-safety",
    icon: <Map className="w-6 h-6" />,
    tag: "AI",
  },
  {
    title: "AI Service Advisor",
    desc: "Describe symptoms in chat — get likely causes and recommended services.",
    to: "/tools/ai-service-advisor",
    icon: <Bot className="w-6 h-6" />,
    tag: "AI",
  },
  {
    title: "Tyre Mileage Calculator",
    desc: "Estimate remaining tyre life in km based on tread depth and driving style.",
    to: "/tools/tyre-mileage-calculator",
    icon: <Gauge className="w-6 h-6" />,
  },
  {
    title: "Tyre Size Calculator",
    desc: "Compare tyre sizes, get overall diameter, sidewall height and speedo error.",
    to: "/tools/tyre-size-calculator",
    icon: <Ruler className="w-6 h-6" />,
  },
  {
    title: "Tyre Pressure Calculator",
    desc: "Get recommended PSI based on vehicle type, load and driving conditions.",
    to: "/tools/tyre-pressure-calculator",
    icon: <Wind className="w-6 h-6" />,
  },
  {
    title: "Fuel Savings Calculator",
    desc: "See how much you save monthly and yearly by improving mileage.",
    to: "/tools/fuel-savings-calculator",
    icon: <Fuel className="w-6 h-6" />,
  },
  {
    title: "Service Cost Estimator",
    desc: "Itemised workshop estimate with GST for tyre, alignment & nitrogen services.",
    to: "/tools/service-cost-estimator",
    icon: <Wrench className="w-6 h-6" />,
  },
];

function ToolsHub() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="container mx-auto px-4 py-16 lg:py-24 relative text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> Manoj Wheels Tools
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            One hub. <span className="text-gradient-primary">Ten smart tools.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Free calculators and the AI tyre analyzer — accurate, mobile-ready, with
            PDF download, WhatsApp share and report history.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS.map((t) => (
            <Card
              key={t.to}
              className="p-6 bg-card/60 hover-lift relative overflow-hidden group"
            >
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-gradient-primary opacity-10 blur-3xl group-hover:opacity-25 transition-opacity" aria-hidden />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary/15 border border-primary/30 inline-flex items-center justify-center text-primary">
                  {t.icon}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <h3 className="text-lg font-bold">{t.title}</h3>
                  {t.tag && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                      {t.tag}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                <Button asChild variant="hero" size="sm" className="mt-5">
                  <Link to={t.to}>
                    Open tool <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-10 p-6 sm:p-8 bg-card/60">
          <div className="grid sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Stored securely
              </p>
              <p className="mt-1 font-bold">Reports saved to your account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Every result is tied to your sign-in and accessible from any device.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                One-click sharing
              </p>
              <p className="mt-1 font-bold">PDF · WhatsApp · Email</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Each report can be downloaded as a branded PDF and shared instantly.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Need help?
              </p>
              <p className="mt-1 font-bold">Book service in 2 minutes</p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link to="/book">Book Service</Link>
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}

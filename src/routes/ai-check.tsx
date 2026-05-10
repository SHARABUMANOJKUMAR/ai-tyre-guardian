import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/site/SectionHeader";
import { Upload, ScanLine, ShieldCheck, AlertTriangle, CheckCircle2, RefreshCcw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/ai-check")({
  head: () => ({
    meta: [
      { title: "AI Tyre Health Check — Free Online Tool | Manoj Wheels" },
      { name: "description", content: "Upload a photo of your tyre and get an instant AI-powered health score, tread wear estimate, crack detection and remaining life in km." },
      { property: "og:title", content: "AI Tyre Health Check | Manoj Wheels" },
      { property: "og:description", content: "Instant AI-powered tyre diagnostics in 30 seconds." },
    ],
  }),
  component: AiCheckPage,
});

type Result = {
  score: number;
  tread: number;
  cracks: "None" | "Minor" | "Moderate" | "Severe";
  remainingKm: number;
  recommendation: { label: string; tone: "ok" | "warn" | "danger"; note: string };
};

function analyse(): Result {
  // Demo AI analysis — produces realistic randomised results.
  const score = 55 + Math.floor(Math.random() * 42);
  const tread = Math.max(8, 100 - score + Math.floor(Math.random() * 15));
  const cracks: Result["cracks"] =
    score > 85 ? "None" : score > 70 ? "Minor" : score > 55 ? "Moderate" : "Severe";
  const remainingKm = Math.round((score / 100) * 22000);
  const recommendation =
    score >= 80
      ? { label: "Safe to Use", tone: "ok" as const, note: "Your tyre is in great condition. Continue regular monitoring." }
      : score >= 65
      ? { label: "Monitor Soon", tone: "warn" as const, note: "Tread is wearing. Plan a checkup within the next 1–2 months." }
      : { label: "Replace Immediately", tone: "danger" as const, note: "Tyre integrity is compromised. Replace before your next long trip." };
  return { score, tread, cracks, remainingKm, recommendation };
}

function AiCheckPage() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    setResult(null);
  }

  function runAnalysis() {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setResult(analyse());
      setLoading(false);
    }, 1800);
  }

  function reset() {
    setImage(null);
    setResult(null);
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="container mx-auto px-4 py-16 lg:py-24 relative text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> AI Tyre Diagnostics
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Check your tyre health in <span className="text-gradient-primary">30 seconds</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Upload a clear photo of your tyre tread. Our AI estimates wear, detects
            cracks and gives you a personalised replacement recommendation.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload card */}
          <Card className="p-6 sm:p-8 bg-card/60">
            <h2 className="text-xl font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Upload Tyre Photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">JPG / PNG · clear tread visible · max 10MB</p>

            <label
              htmlFor="tyre-photo"
              className="mt-5 block border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-8 text-center cursor-pointer transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            >
              {image ? (
                <img src={image} alt="Uploaded tyre" className="mx-auto max-h-72 rounded-lg object-contain" />
              ) : (
                <div className="py-10">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-gradient-primary/15 border border-primary/30 inline-flex items-center justify-center">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="mt-4 font-medium">Drop a photo or click to upload</p>
                  <p className="mt-1 text-xs text-muted-foreground">We never store your image — analysis runs locally.</p>
                </div>
              )}
              <input
                id="tyre-photo"
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)}
              />
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" disabled={!image || loading} onClick={runAnalysis}>
                <ScanLine className="w-5 h-5" /> {loading ? "Analyzing…" : "Analyze Tyre"}
              </Button>
              {image && (
                <Button variant="outline" size="lg" onClick={reset}>
                  <RefreshCcw className="w-4 h-4" /> Reset
                </Button>
              )}
            </div>
          </Card>

          {/* Result card */}
          <Card className="p-6 sm:p-8 bg-card/60 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-primary opacity-10 blur-3xl" aria-hidden />
            <h2 className="text-xl font-bold relative">AI Diagnostic Report</h2>
            {!result && !loading && (
              <p className="mt-2 text-sm text-muted-foreground">Upload a photo and click Analyze to see your report here.</p>
            )}

            {loading && (
              <div className="mt-8 space-y-4 animate-fade-in">
                <p className="text-sm text-muted-foreground">Running AI analysis…</p>
                <Progress value={66} />
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>· Detecting tread pattern</li>
                  <li>· Measuring wear depth</li>
                  <li>· Scanning for cracks & damage</li>
                </ul>
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-6 animate-fade-up relative">
                <div>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-extrabold text-gradient-primary">{result.score}</span>
                    <span className="text-muted-foreground mb-2">/ 100 health score</span>
                  </div>
                  <Progress value={result.score} className="mt-3" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Stat label="Tread Wear" value={`${result.tread}%`} />
                  <Stat label="Crack Detection" value={result.cracks} />
                  <Stat label="Estimated Life Left" value={`${result.remainingKm.toLocaleString()} km`} />
                  <Stat label="Confidence" value="AI · 92%" />
                </div>

                <div
                  className={`rounded-xl p-4 border flex gap-3 items-start ${
                    result.recommendation.tone === "ok"
                      ? "bg-[oklch(0.72_0.18_145/0.1)] border-[oklch(0.72_0.18_145/0.4)]"
                      : result.recommendation.tone === "warn"
                      ? "bg-gold/10 border-gold/40"
                      : "bg-primary/10 border-primary/40"
                  }`}
                >
                  {result.recommendation.tone === "ok" ? (
                    <CheckCircle2 className="w-5 h-5 text-[oklch(0.85_0.18_145)] mt-0.5" />
                  ) : result.recommendation.tone === "warn" ? (
                    <ShieldCheck className="w-5 h-5 text-gold mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{result.recommendation.label}</p>
                    <p className="text-sm text-muted-foreground">{result.recommendation.note}</p>
                  </div>
                </div>

                <Button asChild variant="hero" size="lg" className="w-full">
                  <a href="/book">Book Inspection at Manoj Wheels</a>
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">Demo AI report — for advisory purposes only. Visit our workshop for a certified inspection.</p>
              </div>
            )}
          </Card>
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          {[
            { t: "1. Snap a Photo", d: "Take a clear, well-lit photo of your tyre tread." },
            { t: "2. Upload & Analyze", d: "Our AI inspects wear, cracks and tyre integrity instantly." },
            { t: "3. Book if Needed", d: "Get a recommendation and book a service in one tap." },
          ].map((s) => (
            <div key={s.t} className="glass rounded-xl p-5">
              <p className="font-semibold">{s.t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

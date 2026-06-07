import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload, ScanLine, ShieldCheck, AlertTriangle, CheckCircle2,
  RefreshCcw, Sparkles, XCircle, Download, Share2, Mail, History, Trash2,
} from "lucide-react";
import { analyzeTyre, type TyreAnalysis } from "@/lib/tyre-analyze.functions";
import { generateTyreReportPDF } from "@/lib/tyre-report-pdf";
import { openExternal } from "@/lib/external-link";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-check")({
  head: () => ({
    meta: [
      { title: "AI Tyre Health Check — Free Online Tool | Manoj Wheels" },
      { name: "description", content: "Upload a photo of your tyre and get an instant AI-powered health score, tread wear estimate, crack detection and remaining life in km." },
      { property: "og:title", content: "AI Tyre Health Check | Manoj Wheels" },
      { property: "og:description", content: "Real AI-powered tyre diagnostics in under a minute." },
    ],
  }),
  component: AiCheckPage,
});

const WHATSAPP = "918897230858";
const EMAIL_TO = "manojwheels.official@gmail.com";
const HISTORY_KEY = "mw_tyre_history_v1";
const HISTORY_LIMIT = 5;

type HistoryEntry = {
  id: string;
  createdAt: number;
  result: TyreAnalysis;
  image: string | null;
};

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT))); } catch {}
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.158-.674.158-1.018 0-.515-1.92-1.49-2.55-1.677ZM16.046 0a15.952 15.952 0 0 0-13.804 23.86L.142 31.516a.41.41 0 0 0 .5.5l7.846-2.057A15.95 15.95 0 1 0 16.046 0Zm0 28.485c-2.376 0-4.69-.69-6.67-1.998l-.473-.315-4.842 1.272 1.288-4.713-.302-.473A12.953 12.953 0 0 1 16.046 3.043 12.95 12.95 0 0 1 28.97 15.97 12.95 12.95 0 0 1 16.046 28.486Z" />
    </svg>
  );
}

function AiCheckPage() {
  const [image, setImage] = useState<string | null>(null);
  const [mime, setMime] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TyreAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastPdf, setLastPdf] = useState<{ blob: Blob; filename: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeTyre);

  useEffect(() => { setHistory(loadHistory()); }, []);

  function handleFile(file?: File) {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError("Image is larger than 6MB. Please upload a smaller photo.");
      return;
    }
    setError(null);
    setResult(null);
    setLastPdf(null);
    setMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function runAnalysis() {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setLastPdf(null);
    setError(null);
    try {
      const base64 = image.includes(",") ? image.split(",")[1] : image;
      const res = await analyze({ data: { imageBase64: base64, mime } });
      setResult(res);
      // Save to history
      const entry: HistoryEntry = {
        id: `MW-${Date.now().toString(36).toUpperCase()}`,
        createdAt: Date.now(),
        result: res,
        image,
      };
      const next = [entry, ...history].slice(0, HISTORY_LIMIT);
      setHistory(next);
      saveHistory(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Analysis failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function downloadReport(r: TyreAnalysis, img: string | null) {
    const out = generateTyreReportPDF(r, img, { save: true });
    setLastPdf({ blob: out.blob, filename: out.filename });
    toast.success("Report downloaded");
  }

  async function shareReport() {
    if (!result) return;
    const out = lastPdf ?? (() => {
      const o = generateTyreReportPDF(result, image, { save: false });
      setLastPdf({ blob: o.blob, filename: o.filename });
      return { blob: o.blob, filename: o.filename };
    })();
    const file = new File([out.blob], out.filename, { type: "application/pdf" });
    const navAny = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (navAny.canShare?.({ files: [file] })) {
      try {
        await navAny.share({
          files: [file],
          title: "My Tyre Diagnostic Report",
          text: `Tyre Health Score: ${result.score}/100 — ${result.recommendation}`,
        });
        return;
      } catch { /* user cancelled */ }
    }
    toast.message("Share not supported here. Download the PDF and attach it manually.");
  }

  function shareWhatsApp() {
    if (!result) return;
    if (!lastPdf) downloadReport(result, image);
    const text = `Hello Manoj Wheels,\n\nMy AI Tyre Diagnostic Report\nScore: ${result.score}/100\nRecommendation: ${result.recommendation}\nTread Wear: ${result.tread}%\nEstimated Life Left: ${result.remainingKm.toLocaleString()} km\n\n(PDF report attached separately.)`;
    openExternal(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`);
    toast.message("WhatsApp opened — attach the downloaded PDF in chat.");
  }

  function shareEmail() {
    if (!result) return;
    if (!lastPdf) downloadReport(result, image);
    const subject = `My Tyre Diagnostic Report — Score ${result.score}/100`;
    const body =
      `Hello Manoj Wheels,\n\n` +
      `Please find my AI tyre diagnostic report attached.\n\n` +
      `Health Score: ${result.score}/100\n` +
      `Recommendation: ${result.recommendation}\n` +
      `Tread Wear: ${result.tread}%\n` +
      `Crack Detection: ${result.cracks}\n` +
      `Estimated Life Left: ${result.remainingKm.toLocaleString()} km\n\n` +
      `Notes: ${result.notes}\n`;
    window.location.href = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toast.message("Email opened — attach the downloaded PDF before sending.");
  }

  function reset() {
    setImage(null);
    setResult(null);
    setError(null);
    setLastPdf(null);
  }

  function viewHistoryEntry(entry: HistoryEntry) {
    setImage(entry.image);
    setResult(entry.result);
    setLastPdf(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearHistory() {
    setHistory([]);
    saveHistory([]);
    toast.success("History cleared");
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="absolute inset-0 grid-bg opacity-30" aria-hidden />
        <div className="container mx-auto px-4 py-16 lg:py-24 relative text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> AI Tyre Diagnostics · Powered by Google Gemini
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            Check your tyre health with <span className="text-gradient-primary">real AI</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Upload a clear, well-lit photo of your tyre. Our AI visually inspects
            tread wear, cracks and damage — and gives you an honest replacement
            recommendation.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload card */}
          <Card className="p-6 sm:p-8 bg-card/60">
            <h2 className="text-xl font-bold flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Upload Tyre Photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">JPG / PNG · clear tread visible · max 6MB</p>

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
                  <p className="mt-1 text-xs text-muted-foreground">For best results, take the photo straight-on in daylight.</p>
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
                <ScanLine className="w-5 h-5" /> {loading ? "Analyzing…" : "Analyze with AI"}
              </Button>
              <Button
                variant="outline"
                size="lg"
                disabled={!result || loading}
                onClick={() => result && downloadReport(result, image)}
              >
                <Download className="w-4 h-4" /> Download Report
              </Button>
              {image && (
                <Button variant="ghost" size="lg" onClick={reset}>
                  <RefreshCcw className="w-4 h-4" /> Reset
                </Button>
              )}
            </div>

            {result && (
              <div className="mt-5 rounded-xl border border-border bg-background/40 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Share / Send Report</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="hero" onClick={shareWhatsApp}>
                    <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={shareEmail}>
                    <Mail className="w-4 h-4" /> Email
                  </Button>
                  <Button size="sm" variant="outline" onClick={shareReport}>
                    <Share2 className="w-4 h-4" /> Share…
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Tip: download the PDF first, then attach it in WhatsApp/Email. On mobile, "Share…" can attach it directly.
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
                <XCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Card>

          {/* Result card */}
          <Card className="p-6 sm:p-8 bg-card/60 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-primary opacity-10 blur-3xl" aria-hidden />
            <h2 className="text-xl font-bold relative">AI Diagnostic Report</h2>
            {!result && !loading && !error && (
              <p className="mt-2 text-sm text-muted-foreground">Upload a photo and click "Analyze with AI" to see your report here.</p>
            )}

            {loading && (
              <div className="mt-8 space-y-4 animate-fade-in">
                <p className="text-sm text-muted-foreground">Our AI is inspecting your tyre…</p>
                <Progress value={66} />
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>· Detecting tread pattern</li>
                  <li>· Measuring wear depth</li>
                  <li>· Scanning for cracks &amp; sidewall damage</li>
                </ul>
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-6 animate-fade-up relative">
                {!result.isTyre ? (
                  <div className="rounded-xl p-4 border bg-primary/10 border-primary/40 flex gap-3 items-start">
                    <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">This doesn't look like a tyre</p>
                      <p className="text-sm text-muted-foreground">{result.notes || "Please upload a clear photo of a tyre tread or sidewall."}</p>
                    </div>
                  </div>
                ) : (
                  <>
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
                      <Stat label="AI Confidence" value={`${result.confidence}%`} />
                    </div>

                    {result.observations.length > 0 && (
                      <div className="rounded-xl border border-border p-4 bg-background/40">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">What the AI noticed</p>
                        <ul className="text-sm space-y-1.5">
                          {result.observations.map((o, i) => (
                            <li key={i} className="flex gap-2"><CheckCircle2 className="w-4 h-4 mt-0.5 text-gold shrink-0" /> <span>{o}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div
                      className={`rounded-xl p-4 border flex gap-3 items-start ${
                        result.recommendation === "Safe to Use"
                          ? "bg-[oklch(0.72_0.18_145/0.1)] border-[oklch(0.72_0.18_145/0.4)]"
                          : result.recommendation === "Monitor Soon"
                          ? "bg-gold/10 border-gold/40"
                          : "bg-primary/10 border-primary/40"
                      }`}
                    >
                      {result.recommendation === "Safe to Use" ? (
                        <CheckCircle2 className="w-5 h-5 text-[oklch(0.85_0.18_145)] mt-0.5" />
                      ) : result.recommendation === "Monitor Soon" ? (
                        <ShieldCheck className="w-5 h-5 text-gold mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
                      )}
                      <div>
                        <p className="font-semibold">{result.recommendation}</p>
                        <p className="text-sm text-muted-foreground">{result.notes}</p>
                      </div>
                    </div>

                    <Button asChild variant="hero" size="lg" className="w-full">
                      <a href="/book">Book Inspection at Manoj Wheels</a>
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">AI report is advisory. For final certification visit our workshop.</p>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Report history */}
        {history.length > 0 && (
          <Card className="mt-12 p-6 sm:p-8 bg-card/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Your Recent Reports
              </h2>
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <Trash2 className="w-4 h-4" /> Clear
              </Button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Last {HISTORY_LIMIT} tyre checks saved on this device.</p>

            <ul className="mt-5 grid sm:grid-cols-2 gap-4">
              {history.map((h) => (
                <li key={h.id} className="rounded-xl border border-border bg-background/40 p-4 flex gap-4">
                  {h.image ? (
                    <img src={h.image} alt="Tyre" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-extrabold text-gradient-primary">{h.result.isTyre ? h.result.score : "—"}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{h.result.recommendation}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(h.createdAt).toLocaleString()} · {h.id}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewHistoryEntry(h)}>View</Button>
                      <Button size="sm" variant="hero" onClick={() => downloadReport(h.result, h.image)}>
                        <Download className="w-3.5 h-3.5" /> PDF
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="mt-12 grid sm:grid-cols-3 gap-4">
          {[
            { t: "1. Snap a Photo", d: "Take a clear, well-lit photo of your tyre tread or sidewall." },
            { t: "2. AI Analyzes", d: "Google Gemini visually inspects wear, cracks and integrity." },
            { t: "3. Book if Needed", d: "Get an honest recommendation and book a service in one tap." },
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

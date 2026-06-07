import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload, ScanLine, ShieldCheck, AlertTriangle, CheckCircle2,
  RefreshCcw, Sparkles, XCircle, Download, Mail, Loader2, MessageCircle, Share2,
} from "lucide-react";
import { analyzeTyre, type TyreAnalysis } from "@/lib/tyre-analyze.functions";
import { generateTyreReportPDF } from "@/lib/tyre-report-pdf";
import { openExternal } from "@/lib/external-link";
import { saveReport, uploadReportPdf, getReportSignedUrl } from "@/lib/reports.functions";
import { emailReportPdf } from "@/lib/email-pdf.functions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-check")({
  head: () => ({
    meta: [
      { title: "AI Tyre Health Check — Free Online Tool | Manoj Wheels" },
      { name: "description", content: "Upload a photo of your tyre and get an instant AI-powered health score, tread wear estimate, crack detection and remaining life in km." },
    ],
  }),
  component: AiCheckPage,
});

const WHATSAPP = "918897230858";

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin);
}

function AiCheckPage() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [mime, setMime] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TyreAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<Date | null>(null);
  const [pdfUploaded, setPdfUploaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useServerFn(analyzeTyre);
  const save = useServerFn(saveReport);
  const upload = useServerFn(uploadReportPdf);
  const sign = useServerFn(getReportSignedUrl);
  const sendEmail = useServerFn(emailReportPdf);

  useEffect(() => { if (user?.email) setEmailInput(user.email); }, [user]);

  function handleFile(file?: File) {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) { setError("Image is larger than 6MB."); return; }
    setError(null); setResult(null); setReportId(null); setPdfUploaded(false);
    setMime(file.type || "image/jpeg");
    const r = new FileReader();
    r.onload = () => setImage(r.result as string);
    r.readAsDataURL(file);
  }

  async function runAnalysis() {
    if (!image) return;
    setLoading(true); setError(null); setResult(null); setReportId(null); setPdfUploaded(false);
    try {
      const base64 = image.includes(",") ? image.split(",")[1] : image;
      const res = await analyze({ data: { imageBase64: base64, mime } });
      setResult(res);
      if (user) {
        try {
          const saved = await save({ data: { analysis: res } });
          setReportId(saved.id);
          setReportDate(new Date(saved.created_at));
        } catch (e) {
          console.error(e);
          toast.error("Saved analysis locally but couldn't sync to your account.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally { setLoading(false); }
  }

  async function ensurePdfUploaded(): Promise<string | null> {
    if (!result) return null;
    if (!user || !reportId) {
      generateTyreReportPDF(result, image, { save: true });
      return null;
    }
    if (pdfUploaded) {
      const { signedUrl } = await sign({ data: { reportId } });
      return signedUrl;
    }
    const out = generateTyreReportPDF(result, image, { save: false });
    const base64 = await blobToBase64(out.blob);
    const r = await upload({ data: { reportId, pdfBase64: base64 } });
    setPdfUploaded(true);
    return r.signedUrl;
  }

  async function handleDownload() {
    if (!result) return;
    setBusy("download");
    try {
      generateTyreReportPDF(result, image, { save: true });
      if (user && reportId && !pdfUploaded) {
        // Sync PDF to cloud in background
        try {
          const out = generateTyreReportPDF(result, image, { save: false });
          const base64 = await blobToBase64(out.blob);
          await upload({ data: { reportId, pdfBase64: base64 } });
          setPdfUploaded(true);
        } catch (e) { console.error("PDF upload failed:", e); }
      }
      toast.success("Report downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally { setBusy(null); }
  }

  async function handleWhatsApp() {
    if (!result) return;
    setBusy("wa");
    try {
      const url = await ensurePdfUploaded();
      const date = (reportDate ?? new Date()).toLocaleDateString("en-GB").replaceAll("/", "-");
      const text =
        `🚗 *Manoj Wheels Tyre Health Report*\n\n` +
        `Report Score: ${result.score}/100\n` +
        `Date: ${date}\n` +
        `Recommendation: ${result.recommendation}\n` +
        (url ? `\nView Report:\n${url}\n` : "\n(Sign in to attach a shareable PDF link.)\n") +
        `\nGenerated by Manoj Wheels AI Tyre Analyzer.`;
      openExternal(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "WhatsApp share failed");
    } finally { setBusy(null); }
  }

  async function handleNativeShare() {
    if (!result) return;
    const out = generateTyreReportPDF(result, image, { save: false });
    const file = new File([out.blob], out.filename, { type: "application/pdf" });
    const navAny = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (navAny.canShare?.({ files: [file] })) {
      try {
        await navAny.share({ files: [file], title: "My Tyre Report", text: `Score ${result.score}/100` });
      } catch { /* cancelled */ }
    } else {
      toast.message("Use the WhatsApp or Email button instead.");
    }
  }

  async function handleSendEmail() {
    if (!result) return;
    if (!user || !reportId) { toast.error("Please sign in to email reports."); return; }
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput);
    if (!ok) { toast.error("Enter a valid email"); return; }
    setBusy("email");
    try {
      // Make sure PDF is uploaded
      if (!pdfUploaded) {
        const out = generateTyreReportPDF(result, image, { save: false });
        const base64 = await blobToBase64(out.blob);
        await upload({ data: { reportId, pdfBase64: base64 } });
        setPdfUploaded(true);
      }
      await sendEmail({ data: { reportId, toEmail: emailInput.trim() } });
      toast.success("✓ Email sent successfully");
      setShowEmail(false);
    } catch (e) {
      toast.error(`✗ ${e instanceof Error ? e.message : "Failed to send"}`);
    } finally { setBusy(null); }
  }

  function reset() {
    setImage(null); setResult(null); setError(null); setReportId(null);
    setPdfUploaded(false); setShowEmail(false);
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
            Check your tyre health with <span className="text-gradient-primary">real AI</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Upload a clear photo. Our AI inspects tread, cracks and damage — and gives an honest replacement recommendation.
          </p>
          {!user && (
            <p className="mt-4 text-sm">
              <Link to="/auth" className="text-primary font-medium underline-offset-4 hover:underline">Sign in</Link>
              <span className="text-muted-foreground"> to save reports across devices and email PDFs.</span>
            </p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-8">
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
                  <p className="mt-1 text-xs text-muted-foreground">For best results, take a clear, straight-on photo in daylight.</p>
                </div>
              )}
              <input id="tyre-photo" ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? undefined)} />
            </label>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" disabled={!image || loading} onClick={runAnalysis}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
                {loading ? "Analyzing…" : "Analyze with AI"}
              </Button>
              <Button variant="outline" size="lg" disabled={!result || !!busy} onClick={handleDownload}>
                {busy === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download Report
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
                  <Button size="sm" variant="hero" onClick={handleWhatsApp} disabled={!!busy}>
                    {busy === "wa" ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => user ? setShowEmail(v => !v) : toast.error("Sign in to email reports")}>
                    <Mail className="w-4 h-4" /> Email PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleNativeShare}>
                    <Share2 className="w-4 h-4" /> Share…
                  </Button>
                </div>

                {showEmail && user && (
                  <div className="mt-3 flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <Label htmlFor="em" className="text-xs">Recipient email</Label>
                      <Input id="em" type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="recipient@example.com" />
                    </div>
                    <Button size="sm" variant="hero" onClick={handleSendEmail} disabled={!!busy}>
                      {busy === "email" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                      Send
                    </Button>
                  </div>
                )}
                {user && (
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Saved to your <Link to="/dashboard" className="underline">dashboard</Link>. WhatsApp message includes a secure link to the PDF.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
                <XCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </Card>

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
                      <p className="text-sm text-muted-foreground">{result.notes || "Please upload a clear photo of a tyre."}</p>
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

                    <div className={`rounded-xl p-4 border flex gap-3 items-start ${
                      result.recommendation === "Safe to Use" ? "bg-[oklch(0.72_0.18_145/0.1)] border-[oklch(0.72_0.18_145/0.4)]"
                        : result.recommendation === "Monitor Soon" ? "bg-gold/10 border-gold/40"
                        : "bg-primary/10 border-primary/40"
                    }`}>
                      {result.recommendation === "Safe to Use" ? <CheckCircle2 className="w-5 h-5 text-[oklch(0.85_0.18_145)] mt-0.5" />
                        : result.recommendation === "Monitor Soon" ? <ShieldCheck className="w-5 h-5 text-gold mt-0.5" />
                        : <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />}
                      <div>
                        <p className="font-semibold">{result.recommendation}</p>
                        <p className="text-sm text-muted-foreground">{result.notes}</p>
                      </div>
                    </div>

                    <Button asChild variant="hero" size="lg" className="w-full">
                      <Link to="/book">Book Inspection at Manoj Wheels</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </Card>
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

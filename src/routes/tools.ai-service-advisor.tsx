import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Bot, Loader2, Send, Sparkles, AlertTriangle } from "lucide-react";
import { explainResult } from "@/lib/ai-explain.functions";
import { ToolShareBar } from "@/components/site/ToolShareBar";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export const Route = createFileRoute("/tools/ai-service-advisor")({
  head: () => ({
    meta: [
      { title: "AI Service Advisor | Manoj Wheels" },
      {
        name: "description",
        content:
          "Describe your car symptoms — our AI suggests likely causes, risk level and recommended services. Advisory only.",
      },
    ],
  }),
  component: AdvisorTool,
});

interface Msg {
  role: "user" | "assistant";
  text: string;
}

function AdvisorTool() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Hi! Describe what your vehicle is doing — e.g. 'My car vibrates above 80 km/h' or 'Steering pulls left after a pothole.' I'll suggest likely causes and recommended checks.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const explain = useServerFn(explainResult);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      const ctx = messages
        .filter((m) => m.role === "user")
        .map((m) => `Previous: ${m.text}`)
        .join("\n");
      const r = await explain({
        data: {
          toolName: "AI Service Advisor",
          prompt: `${ctx}\nCurrent question: ${text}\n\nReply with:\n1) Possible causes (bullet list, max 4)\n2) Risk level (Low / Medium / High)\n3) Recommended services to book at Manoj Wheels\n\nNever claim certainty — this is advisory only.`,
        },
      });
      setMessages((m) => [...m, { role: "assistant", text: r.text }]);
      setLastSummary(`${text} — ${r.text.slice(0, 120)}…`);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: `Sorry — I couldn't reach the AI right now. ${e instanceof Error ? e.message : ""}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const build = (): SaveToolPayload => {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "You" : "Advisor"}: ${m.text}`)
      .join("\n\n");
    return {
      reportType: "ai-advisor",
      title: "AI Service Advisor Session",
      summary: lastSummary ?? "AI service consultation",
      score: 0,
      recommendation: "Advisory only — book physical inspection at Manoj Wheels.",
      payload: { messages },
      pdf: {
        toolName: "AI Service Advisor",
        summary: "Conversational AI consultation transcript.",
        headline: "Advisory",
        headlineLabel: "AI-only — not a physical inspection",
        recommendation: "Book a workshop inspection to confirm AI suggestions.",
        inputs: messages
          .filter((m) => m.role === "user")
          .map((m, i) => ({ label: `Question ${i + 1}`, value: m.text })),
        results: messages
          .filter((m) => m.role === "assistant")
          .map((m, i) => ({ label: `Advisor reply ${i + 1}`, value: m.text })),
        notes: [
          "This is an AI-generated recommendation, not a physical inspection.",
          "Always confirm safety-critical findings with a qualified technician.",
        ],
        fileSlug: "ai-service-advisor",
      },
    };
  };

  return (
    <div>
      <section className="border-b border-border bg-gradient-hero/50">
        <div className="container mx-auto px-4 py-10 lg:py-14">
          <Link to="/tools" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> All tools
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary/15 border border-primary/30 inline-flex items-center justify-center text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">AI Service Advisor</h1>
              <p className="text-sm text-muted-foreground">Describe your car's symptoms — get AI-suggested causes & services.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[1fr_360px] gap-6">
        <Card className="p-0 bg-card/60 flex flex-col h-[560px]">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <p className="text-sm font-bold">Conversation</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-background border border-border"
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="bg-background border border-border max-w-[85%] rounded-2xl px-4 py-2.5 text-sm inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </div>
            )}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              placeholder="Describe the issue…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              disabled={busy}
            />
            <Button variant="hero" onClick={send} disabled={busy || !input.trim()}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4 bg-card/60 border-gold/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Advisory only</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This is an AI-generated recommendation and not a physical inspection. Always confirm safety-critical findings at Manoj Wheels workshop.
                </p>
              </div>
            </div>
          </Card>
          <ToolShareBar build={build} disabled={messages.filter((m) => m.role === "user").length === 0} />
          <Card className="p-4 bg-card/60">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Try asking</p>
            <ul className="mt-2 text-sm space-y-1 text-muted-foreground">
              <li>• "My car vibrates above 80 km/h"</li>
              <li>• "Steering wheel is off-center"</li>
              <li>• "Front tyres wearing on the inside edge"</li>
              <li>• "Squealing sound when braking"</li>
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

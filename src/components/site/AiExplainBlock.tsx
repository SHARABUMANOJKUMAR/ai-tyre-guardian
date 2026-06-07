import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { explainResult } from "@/lib/ai-explain.functions";

/**
 * Reusable "AI Analysis" block. Kept SEPARATE from calculated values —
 * tools render their numbers first, then this block on demand.
 */
export function AiExplainBlock({
  toolName,
  prompt,
  disabled,
}: {
  toolName: string;
  /** Plain-text summary of inputs + calculated outputs to interpret. */
  prompt: string;
  disabled?: boolean;
}) {
  const explain = useServerFn(explainResult);
  const [text, setText] = useState<string | null>(null);
  const [conf, setConf] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setErr(null);
    try {
      const r = await explain({ data: { toolName, prompt } });
      setText(r.text);
      setConf(r.confidence);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI explanation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-wider text-gold inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> AI Analysis
        </p>
        {text && (
          <span className="text-[10px] text-muted-foreground">
            Confidence {conf}%
          </span>
        )}
      </div>
      {!text && !loading && (
        <>
          <p className="text-xs text-muted-foreground mt-2">
            Get a plain-language interpretation of these results. AI suggestions are
            advisory only and never replace a physical inspection.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 border-gold/40 text-gold hover:bg-gold/10"
            onClick={run}
            disabled={disabled}
          >
            <Sparkles className="w-4 h-4" /> Explain with AI
          </Button>
        </>
      )}
      {loading && (
        <p className="mt-3 text-sm text-muted-foreground inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Generating analysis…
        </p>
      )}
      {err && <p className="mt-3 text-sm text-primary">{err}</p>}
      {text && (
        <div className="mt-3 text-sm whitespace-pre-wrap leading-relaxed">{text}</div>
      )}
      {text && (
        <p className="mt-2 text-[10px] text-muted-foreground italic">
          AI-generated recommendation — not a physical inspection.
        </p>
      )}
    </div>
  );
}

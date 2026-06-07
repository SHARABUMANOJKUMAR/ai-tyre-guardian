import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, Mail, MessageCircle, Save } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  useToolReporter,
  type SaveToolPayload,
} from "@/hooks/use-tool-reporter";
import { useAuth } from "@/hooks/use-auth";

interface Props {
  /** Built lazily so children re-render won't recompute unless needed. */
  build: () => SaveToolPayload;
  disabled?: boolean;
}

/** Download / Save / WhatsApp / Email row used by every calculator tool. */
export function ToolShareBar({ build, disabled }: Props) {
  const { user } = useAuth();
  const reporter = useToolReporter();
  const [showEmail, setShowEmail] = useState(false);
  const [emailVal, setEmailVal] = useState(user?.email ?? "");
  const [showWa, setShowWa] = useState(false);
  const [waVal, setWaVal] = useState("");

  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
        Save / Share Report
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="hero"
          disabled={disabled || !!reporter.busy}
          onClick={() => reporter.downloadPdf(build())}
        >
          {reporter.busy === "pdf" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download PDF
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || !!reporter.busy}
          onClick={() => reporter.saveToHistory(build())}
        >
          {reporter.busy === "save" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save to History
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || !!reporter.busy}
          onClick={() => setShowWa((v) => !v)}
        >
          {reporter.busy === "wa" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4" />
          )}
          WhatsApp
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || !!reporter.busy}
          onClick={() => setShowEmail((v) => !v)}
        >
          <Mail className="w-4 h-4" /> Email PDF
        </Button>
      </div>

      {showEmail && (
        <div className="mt-3 flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="tool-email" className="text-xs">
              Recipient email
            </Label>
            <Input
              id="tool-email"
              type="email"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              placeholder="recipient@example.com"
            />
          </div>
          <Button
            size="sm"
            variant="hero"
            disabled={disabled || !!reporter.busy}
            onClick={() => reporter.sendEmail(build(), emailVal)}
          >
            {reporter.busy === "email" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Send
          </Button>
        </div>
      )}

      {user ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Saved to your{" "}
          <Link to="/dashboard" className="underline">
            dashboard
          </Link>
          . WhatsApp message includes a secure link to the PDF.
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-muted-foreground">
          <Link to="/auth" className="underline">
            Sign in
          </Link>{" "}
          to save reports across devices and email PDFs.
        </p>
      )}
    </div>
  );
}

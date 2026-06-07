import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ToolShareBar } from "@/components/site/ToolShareBar";
import type { SaveToolPayload } from "@/hooks/use-tool-reporter";

export function ToolPage(props: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  form: React.ReactNode;
  result: React.ReactNode;
  buildPayload: () => SaveToolPayload;
  resultDisabled?: boolean;
}) {
  return (
    <div>
      <section className="border-b border-border bg-gradient-hero/50">
        <div className="container mx-auto px-4 py-10 lg:py-14">
          <Link
            to="/tools"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> All tools
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary/15 border border-primary/30 inline-flex items-center justify-center text-primary">
              {props.icon}
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">{props.title}</h1>
              <p className="text-sm text-muted-foreground">{props.subtitle}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-card/60 space-y-5">{props.form}</Card>
        <Card className="p-6 bg-card/60 space-y-5">
          {props.result}
          <ToolShareBar build={props.buildPayload} disabled={props.resultDisabled} />
        </Card>
      </section>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Headline({
  value,
  label,
  verdict,
}: {
  value: string;
  label: string;
  verdict?: string;
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-4xl font-extrabold text-gradient-primary">{value}</p>
      {verdict && <p className="mt-2 text-sm font-semibold">{verdict}</p>}
    </div>
  );
}

export function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}

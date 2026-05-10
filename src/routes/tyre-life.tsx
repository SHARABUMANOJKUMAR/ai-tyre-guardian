import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/tyre-life")({
  head: () => ({
    meta: [
      { title: "Tyre Life Calculator — Estimate Replacement | Manoj Wheels" },
      { name: "description", content: "Estimate your tyre's remaining life in kilometres and the suggested replacement date based on driving type and road conditions." },
    ],
  }),
  component: TyreLifePage,
});

function TyreLifePage() {
  const [odo, setOdo] = useState("");
  const [brand, setBrand] = useState("MRF");
  const [drive, setDrive] = useState("Mixed");
  const [road, setRoad] = useState("Average");
  const [result, setResult] = useState<{ km: number; date: string } | null>(null);

  function calculate() {
    const base = 50000;
    const brandFactor: Record<string, number> = { MRF: 1.05, Apollo: 1, CEAT: 0.98, Bridgestone: 1.1, Michelin: 1.15, Other: 0.95 };
    const driveFactor: Record<string, number> = { City: 0.85, Highway: 1.15, Mixed: 1 };
    const roadFactor: Record<string, number> = { Smooth: 1.1, Average: 1, Rough: 0.8 };
    const used = parseInt(odo || "0", 10);
    const total = Math.round(base * (brandFactor[brand] ?? 1) * driveFactor[drive] * roadFactor[road]);
    const remaining = Math.max(0, total - used);
    const monthsLeft = Math.round(remaining / 1500); // assume 1500 km/month
    const date = new Date();
    date.setMonth(date.getMonth() + monthsLeft);
    setResult({
      km: remaining,
      date: date.toLocaleDateString("en-IN", { year: "numeric", month: "long" }),
    });
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex w-14 h-14 rounded-xl bg-gradient-primary items-center justify-center shadow-glow"><Calculator className="w-6 h-6 text-primary-foreground" /></div>
        <h1 className="mt-5 text-3xl sm:text-5xl font-extrabold">Tyre Life <span className="text-gradient-primary">Calculator</span></h1>
        <p className="mt-3 text-muted-foreground">Estimate remaining tyre life and your suggested replacement date.</p>
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        <Card className="p-6 bg-card/60">
          <div className="space-y-5">
            <div>
              <Label htmlFor="odo">Current Odometer Reading (km)</Label>
              <Input id="odo" type="number" min={0} value={odo} onChange={(e) => setOdo(e.target.value)} placeholder="e.g. 28000" className="mt-1.5" />
            </div>
            <div>
              <Label>Tyre Brand</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["MRF", "Apollo", "CEAT", "Bridgestone", "Michelin", "Other"].map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Driving Type</Label>
              <Select value={drive} onValueChange={setDrive}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["City", "Highway", "Mixed"].map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Road Conditions</Label>
              <Select value={road} onValueChange={setRoad}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Smooth", "Average", "Rough"].map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="hero" size="lg" className="w-full" onClick={calculate}>Calculate <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </Card>

        <Card className="p-6 bg-card/60 flex flex-col justify-center">
          {!result ? (
            <p className="text-muted-foreground text-center">Fill out the form to see an estimate.</p>
          ) : (
            <div className="space-y-6 animate-fade-up">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Estimated Remaining Life</p>
                <p className="mt-1 text-5xl font-extrabold text-gradient-primary">{result.km.toLocaleString()} km</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Suggested Replacement</p>
                <p className="mt-1 text-2xl font-bold text-gradient-gold">{result.date}</p>
              </div>
              <Button asChild variant="hero" className="w-full" size="lg"><a href="/book">Book Free Inspection</a></Button>
              <p className="text-[11px] text-muted-foreground text-center">Estimate based on average usage. Visit Manoj Wheels for a certified inspection.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

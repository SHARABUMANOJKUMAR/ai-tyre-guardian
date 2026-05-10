import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/site/SectionHeader";
import { ArrowRight, Calendar } from "lucide-react";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Tyre Care Tips & Insights — Blog | Manoj Wheels" },
      { name: "description", content: "Expert tips on when to replace tyres, the benefits of nitrogen air, the importance of wheel alignment, and more from Manoj Wheels." },
    ],
  }),
  component: BlogPage,
});

const posts = [
  { title: "When Should You Replace Your Tyres?", excerpt: "Tread depth, age, and warning signs every driver must know.", date: "May 2, 2026", category: "Safety" },
  { title: "5 Surprising Benefits of Nitrogen Air Filling", excerpt: "Beyond mileage — nitrogen keeps tyres cooler and pressure stable.", date: "Apr 18, 2026", category: "Maintenance" },
  { title: "Why Wheel Alignment Matters More Than You Think", excerpt: "How a 1-degree misalignment shortens tyre life by 30%.", date: "Apr 4, 2026", category: "Tech" },
  { title: "How AI Is Changing Tyre Inspection in India", excerpt: "From naked-eye guesses to AI-powered diagnostics in 30 seconds.", date: "Mar 22, 2026", category: "AI" },
  { title: "Monsoon Tyre Care: A Complete Checklist", excerpt: "Stay safe on wet roads with these 7 monsoon prep tips.", date: "Mar 9, 2026", category: "Seasonal" },
  { title: "Tubeless vs Tube Tyres — Which Should You Buy?", excerpt: "A practical comparison for Indian roads and budgets.", date: "Feb 25, 2026", category: "Buying Guide" },
];

function BlogPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <SectionHeader eyebrow="Blog" title={<>Tyre care tips from <span className="text-gradient-primary">our experts</span></>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((p) => (
          <Card key={p.title} className="p-6 bg-card/60 hover-lift flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">{p.category}</span>
            <h3 className="mt-2 text-lg font-bold leading-snug">{p.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground flex-1">{p.excerpt}</p>
            <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {p.date}</span>
              <Link to="/blog" className="inline-flex items-center gap-1 text-primary font-medium">Read <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

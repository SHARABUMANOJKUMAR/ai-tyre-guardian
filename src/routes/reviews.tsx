import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Customer Reviews & Ratings | Manoj Wheels" },
      { name: "description", content: "Read 2,800+ verified Google reviews of Manoj Wheels — India's smartest AI-powered tyre care center." },
    ],
  }),
  component: ReviewsPage,
});

const reviews = [
  { name: "Rahul Sharma", text: "Best alignment service in town. The AI tyre check is genuinely useful.", rating: 5 },
  { name: "Priya Verma", text: "Quick, transparent and premium. Free nitrogen filling is a great touch!", rating: 5 },
  { name: "Imran Khan", text: "Manoj Wheels keeps my entire taxi fleet running smoothly. Highly recommend.", rating: 5 },
  { name: "Anita Desai", text: "Found exactly the tyre I needed at the best price. Fitting was super fast.", rating: 5 },
  { name: "Vikram Singh", text: "Honest pricing, no upselling. They told me my tyre still had 8,000 km left!", rating: 5 },
  { name: "Karthik R.", text: "The 3D alignment fixed my steering wobble that 2 other shops couldn't.", rating: 5 },
  { name: "Sana Ahmed", text: "Loved the loyalty program — earned a free puncture repair already.", rating: 4 },
  { name: "Deepak Patel", text: "Booked online in 30 seconds. Job done in under an hour. Premium experience.", rating: 5 },
  { name: "Megha Iyer", text: "Trustworthy team, super clean workshop. My new go-to tyre shop.", rating: 5 },
];

function ReviewsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
      <SectionHeader
        eyebrow="Customer Reviews"
        title={<>Rated <span className="text-gradient-gold">4.9 / 5</span> by 2,800+ drivers</>}
        description="Verified Google reviews from real customers across India."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map((r) => (
          <Card key={r.name} className="p-6 bg-card/60 hover-lift">
            <div className="flex gap-0.5 text-gold">
              {Array.from({ length: r.rating }).map((_, i) => (<Star key={i} className="w-4 h-4 fill-gold" />))}
            </div>
            <p className="mt-4 text-sm leading-relaxed">"{r.text}"</p>
            <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-primary inline-flex items-center justify-center text-primary-foreground font-bold">
                {r.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">Verified · Google Review</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

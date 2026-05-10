import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star } from "lucide-react";
import { SectionHeader } from "@/components/site/SectionHeader";
import tyreImg from "@/assets/tyre-closeup.jpg";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop New & Used Tyres Online | Manoj Wheels" },
      { name: "description", content: "Buy new tyres, used tyres, bike tubes, valves and accessories online from Manoj Wheels. Genuine products at the best market price." },
    ],
  }),
  component: ShopPage,
});

const products = [
  { name: "MRF ZVTV 175/65 R14", category: "New Tyre", price: 4299, mrp: 4799, rating: 4.8, badge: "Best Seller" },
  { name: "Apollo Amazer 4G Life", category: "New Tyre", price: 3899, mrp: 4399, rating: 4.7 },
  { name: "Bridgestone Turanza T005", category: "Premium Tyre", price: 7299, mrp: 7999, rating: 4.9, badge: "Premium" },
  { name: "CEAT SecuraDrive 195/55 R16", category: "New Tyre", price: 6499, mrp: 6999, rating: 4.6 },
  { name: "Michelin Energy XM2+", category: "Premium Tyre", price: 6899, mrp: 7499, rating: 4.9, badge: "Top Rated" },
  { name: "Used Tyre — 80% Tread", category: "Used Tyre", price: 1499, mrp: 1899, rating: 4.4 },
  { name: "Bike Tube 18-inch", category: "Bike Tube", price: 349, mrp: 399, rating: 4.5 },
  { name: "Tubeless Valve (Pack of 4)", category: "Accessory", price: 199, mrp: 249, rating: 4.6 },
];

function ShopPage() {
  return (
    <div>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
        <SectionHeader
          eyebrow="Shop"
          title={<>Tyres & accessories at <span className="text-gradient-primary">unbeatable prices</span></>}
          description="Genuine products from India's most trusted tyre brands. Free fitting with every new tyre purchase."
        />
      </section>

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <Card key={p.name} className="overflow-hidden bg-card/60 hover-lift group">
              <div className="relative aspect-square overflow-hidden">
                <img src={tyreImg} alt={p.name} loading="lazy" width={600} height={600} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {p.badge && (
                  <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-gold text-gold-foreground">{p.badge}</span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.category}</p>
                <h3 className="mt-1 font-semibold leading-tight">{p.name}</h3>
                <div className="mt-2 flex items-center gap-1 text-gold text-xs">
                  <Star className="w-3.5 h-3.5 fill-gold" /> {p.rating}
                </div>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-xl font-bold text-gradient-primary">₹{p.price.toLocaleString()}</span>
                  <span className="text-xs line-through text-muted-foreground mb-0.5">₹{p.mrp.toLocaleString()}</span>
                </div>
                <Button variant="hero" size="sm" className="w-full mt-4">
                  <ShoppingCart className="w-4 h-4" /> Enquire
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Gauge, Phone, MapPin, Clock, Instagram, Facebook, Youtube } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[oklch(0.13_0_0)] mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-lg bg-gradient-primary inline-flex items-center justify-center shadow-glow">
              <Gauge className="w-5 h-5 text-primary-foreground" />
            </span>
            <span className="font-display font-bold text-lg">
              Manoj <span className="text-gradient-primary">Wheels</span>
            </span>
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            India's smartest AI-powered tyre care center. Trusted by thousands of
            drivers, taxi operators and fleets.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <a href="#" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center justify-center"><Instagram className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center justify-center"><Facebook className="w-4 h-4" /></a>
            <a href="#" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center justify-center"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-gold">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/ai-check" className="hover:text-foreground">AI Tyre Check</Link></li>
            <li><Link to="/shop" className="hover:text-foreground">Shop</Link></li>
            <li><Link to="/book" className="hover:text-foreground">Book Service</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-gold">Services</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>3D Wheel Alignment</li>
            <li>Wheel Balancing</li>
            <li>Nitrogen Air Filling</li>
            <li>Puncture Repair</li>
            <li>Tyre Replacement</li>
            <li>Alloy Wheel Services</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-gold">Visit Us</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5"><MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" /> Main Road, Near Bus Stand, India</li>
            <li className="flex gap-2.5"><Phone className="w-4 h-4 mt-0.5 text-primary shrink-0" /> +91 98765 43210</li>
            <li className="flex gap-2.5"><Clock className="w-4 h-4 mt-0.5 text-primary shrink-0" /> Mon–Sun · 8:00 AM – 9:00 PM</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Manoj Wheels. All rights reserved.</p>
          <p>Drive Safer with AI-Powered Tyre Diagnostics.</p>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "@tanstack/react-router";
import { Phone, MapPin, Clock, Mail, Instagram, Facebook, Youtube } from "lucide-react";

const LOGO_URL =
  "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780801082/Gemini_Generated_Image_nkxh5tnkxh5tnkxh_bzlgpj.png";

export function Footer() {
  return (
    <footer className="border-t border-border bg-[oklch(0.13_0_0)] mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <img src={LOGO_URL} alt="Manoj Wheels logo" className="h-12 w-auto object-contain mix-blend-screen" style={{ background: "transparent" }} />
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            India's smartest AI-powered tyre care center. Trusted by thousands of
            drivers, taxi operators and fleets.
          </p>
          <div className="flex items-center gap-3 mt-5">
            <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center justify-center"><Instagram className="w-4 h-4" /></a>
            <a href="#" aria-label="Facebook" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center justify-center"><Facebook className="w-4 h-4" /></a>
            <a href="#" aria-label="YouTube" className="w-9 h-9 rounded-md bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors inline-flex items-center justify-center"><Youtube className="w-4 h-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-gold">Quick Links</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/services" className="hover:text-foreground">Services</Link></li>
            <li><Link to="/ai-check" className="hover:text-foreground">AI Tyre Check</Link></li>
            <li><Link to="/tyre-life" className="hover:text-foreground">Tyre Life Calculator</Link></li>
            <li><Link to="/book" className="hover:text-foreground">Book Service</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
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
          <h4 className="text-sm font-semibold mb-4 uppercase tracking-wider text-gold">Get In Touch</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5"><MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" /> Manoj Puncture Shop, Kadapa, Andhra Pradesh, India</li>
            <li className="flex gap-2.5"><Phone className="w-4 h-4 mt-0.5 text-primary shrink-0" /> <a href="tel:+918897230858" className="hover:text-foreground">+91 88972 30858</a></li>
            <li className="flex gap-2.5"><Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" /> <a href="mailto:manojwheels.official@gmail.com" className="hover:text-foreground break-all">manojwheels.official@gmail.com</a></li>
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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { deriveUserId, logLogin, logSignup } from "@/lib/apps-script-logger";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingActions } from "@/components/site/FloatingActions";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. You can try again or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0F172A" },
      { title: "Manoj Wheels | Best Tyre Shop in Pulivendula | AI Tyre Analyzer & Wheel Alignment" },
      { name: "description", content: "Manoj Wheels is Pulivendula's trusted tyre and wheel care center offering wheel alignment, wheel balancing, nitrogen air filling, puncture repair, tyre replacement, AI tyre analysis, tyre life prediction, and smart vehicle safety tools." },
      { name: "keywords", content: "tyre shop pulivendula, best tyre shop in pulivendula, wheel alignment pulivendula, wheel balancing pulivendula, nitrogen air filling pulivendula, puncture repair pulivendula, car tyre shop pulivendula, bike tyre shop pulivendula, tyre service center pulivendula, wheel care center pulivendula, tyre replacement pulivendula, apollo tyres pulivendula, mrf tyres pulivendula, ceat tyres pulivendula, jk tyres pulivendula, tyre rotation service pulivendula, manoj wheels pulivendula, best tyre shop in kadapa, wheel alignment kadapa, wheel balancing kadapa, tyre care center kadapa, ai tyre analysis kadapa, vehicle maintenance kadapa, roadside tyre assistance kadapa, tyre inspection kadapa, best tyre shop andhra pradesh, wheel alignment andhra pradesh, ai tyre inspection andhra pradesh, tyre life predictor, smart tyre service, vehicle safety check, ai tyre analyzer, ai tyre health check, online tyre inspection, tyre size calculator, tyre pressure calculator, fuel savings calculator, wheel alignment cost calculator, road trip safety checker, seasonal tyre health checker, ai vehicle maintenance, ai car care tools, online tyre report generator, best tyre shop near me, wheel alignment near me, wheel balancing near me, car tyre replacement near me, affordable tyre shop, premium tyre service center, professional wheel alignment, fast tyre repair service, emergency puncture repair, ai wheel alignment checker, ai service advisor, ai vehicle health report, ai tyre life prediction, ai car maintenance assistant, ai tyre damage detection, smart tyre diagnostics" },
      { name: "author", content: "Manoj Wheels" },
      { name: "publisher", content: "Manoj Wheels" },
      { name: "geo.region", content: "IN-AP" },
      { name: "geo.placename", content: "Pulivendula, YSR Kadapa, Andhra Pradesh" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "Manoj Wheels" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:title", content: "Manoj Wheels | Best Tyre Shop in Pulivendula | AI Tyre Analyzer & Wheel Alignment" },
      { property: "og:description", content: "Pulivendula's trusted tyre & wheel care center — wheel alignment, balancing, nitrogen filling, puncture repair, tyre replacement & AI tyre analysis." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/k08WdrNmcUSfeEvN0WgEsixUk593/social-images/social-1780812454326-MAnoj_Wheels_Logo_99.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Manoj Wheels | Best Tyre Shop in Pulivendula | AI Tyre Analyzer" },
      { name: "twitter:description", content: "Wheel alignment, balancing, puncture repair & AI tyre diagnostics in Pulivendula, Kadapa, Andhra Pradesh." },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/k08WdrNmcUSfeEvN0WgEsixUk593/social-images/social-1780812454326-MAnoj_Wheels_Logo_99.webp" },
      { name: "format-detection", content: "telephone=yes" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": ["AutoRepair", "LocalBusiness", "Store"],
          "@id": "https://manojwheels.online/#business",
          name: "Manoj Wheels",
          alternateName: "Manoj Wheels - AI Tyre & Wheel Care Center",
          image: "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780805003/MAnoj_Wheels_Logo_99_shtjjo.png",
          logo: "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780805003/MAnoj_Wheels_Logo_99_shtjjo.png",
          url: "https://manojwheels.online",
          telephone: "+91-8897230858",
          email: "manojwheels.official@gmail.com",
          priceRange: "₹₹",
          currenciesAccepted: "INR",
          paymentAccepted: "Cash, UPI, Credit Card, Debit Card",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Pulivendula",
            addressLocality: "Pulivendula",
            addressRegion: "Andhra Pradesh",
            postalCode: "516390",
            addressCountry: "IN",
          },
          areaServed: [
            { "@type": "City", name: "Pulivendula" },
            { "@type": "AdministrativeArea", name: "YSR Kadapa District" },
            { "@type": "State", name: "Andhra Pradesh" },
            { "@type": "Country", name: "India" },
          ],
          openingHoursSpecification: [{
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
            opens: "08:00",
            closes: "21:00",
          }],
          sameAs: [],
          makesOffer: [
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "3D Wheel Alignment in Pulivendula" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Wheel Balancing in Pulivendula" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Nitrogen Air Filling in Pulivendula" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Puncture Repair in Pulivendula" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Tyre Replacement in Pulivendula" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI Tyre Health Check" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Tyre Rotation Service" } },
          ],
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.9",
            reviewCount: "320",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://manojwheels.online/#organization",
          name: "Manoj Wheels",
          url: "https://manojwheels.online",
          logo: "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780805003/MAnoj_Wheels_Logo_99_shtjjo.png",
          contactPoint: [{
            "@type": "ContactPoint",
            telephone: "+91-8897230858",
            contactType: "customer service",
            areaServed: "IN",
            availableLanguage: ["English", "Telugu", "Hindi"],
          }],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://manojwheels.online/#website",
          url: "https://manojwheels.online",
          name: "Manoj Wheels",
          publisher: { "@id": "https://manojwheels.online/#organization" },
          potentialAction: {
            "@type": "SearchAction",
            target: "https://manojwheels.online/tools?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Where is the best tyre shop in Pulivendula?",
              acceptedAnswer: { "@type": "Answer", text: "Manoj Wheels in Pulivendula is a trusted tyre & wheel care center offering wheel alignment, balancing, nitrogen filling, puncture repair and AI tyre analysis." },
            },
            {
              "@type": "Question",
              name: "What does wheel alignment cost in Pulivendula?",
              acceptedAnswer: { "@type": "Answer", text: "Wheel alignment at Manoj Wheels Pulivendula starts from affordable rates and includes a free tyre health check." },
            },
            {
              "@type": "Question",
              name: "Do you do AI tyre health check?",
              acceptedAnswer: { "@type": "Answer", text: "Yes. Upload a tyre photo on our AI Tyre Analyzer to get an instant health score, tread wear, crack detection and remaining life in km — free." },
            },
            {
              "@type": "Question",
              name: "Are you open on Sundays?",
              acceptedAnswer: { "@type": "Answer", text: "Yes, Manoj Wheels is open 7 days a week from 8:00 AM to 9:00 PM." },
            },
          ],
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useAppsScriptAuthSync();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-16 lg:pt-20">
          <Outlet />
        </main>
        <Footer />
        <FloatingActions />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

function useAppsScriptAuthSync() {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "SIGNED_IN" || !session?.user) return;
      const user = session.user;
      const key = `mw_synced_${user.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      const userId = deriveUserId(user.id);
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isNew = Date.now() - createdAt < 2 * 60 * 1000;
      const provider = (user.app_metadata?.provider as string | undefined) ?? "email";
      const authType: "Google" | "Email" = provider === "google" ? "Google" : "Email";
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      if (isNew) {
        logSignup({
          userId,
          fullName: String(meta.full_name ?? meta.name ?? ""),
          email: user.email ?? "",
          phoneNumber: String(meta.phone_number ?? meta.phone ?? ""),
          authType,
          emailVerified: user.email_confirmed_at ? "Yes" : "No",
          profileImage: String(meta.avatar_url ?? meta.picture ?? ""),
        });
      }
      await logLogin({ userId, email: user.email ?? "" });
    });
    return () => sub.subscription.unsubscribe();
  }, []);
}



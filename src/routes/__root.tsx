import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { deriveUserId, logLogin, logSignup } from "@/lib/apps-script-logger";
import { addNotification } from "@/lib/notifications-store";

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
import { UserActivityNotifications } from "@/components/site/UserActivityNotifications";
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0F172A" },
      { title: "Manoj Wheels — AI-Powered Tyre & Wheel Care Center" },
      { name: "description", content: "India's smartest AI-powered tyre care center. 3D wheel alignment, balancing, nitrogen filling, puncture repair & premium tyres in Pulivendula." },
      { name: "keywords", content: "tyre shop in pulivendula, wheel alignment near me, wheel balancing in pulivendula, nitrogen air filling, puncture repair shop, AI tyre analyzer, tyre health checker, tyre pressure calculator, best tyre shop in pulivendula" },
      { name: "author", content: "Manoj Wheels" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:site_name", content: "Manoj Wheels" },
      { property: "og:locale", content: "en_IN" },
      { property: "og:title", content: "Manoj Wheels — AI-Powered Tyre & Wheel Care Center" },
      { property: "og:description", content: "India's smartest AI-powered tyre care center. 3D wheel alignment, balancing, nitrogen filling, puncture repair & premium tyres in Pulivendula." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/k08WdrNmcUSfeEvN0WgEsixUk593/social-images/social-1780846953575-Finally_Logo999.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Manoj Wheels — AI-Powered Tyre & Wheel Care Center" },
      { name: "twitter:description", content: "India's smartest AI-powered tyre care center. 3D wheel alignment, balancing, nitrogen filling, puncture repair & premium tyres in Pulivendula." },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/k08WdrNmcUSfeEvN0WgEsixUk593/social-images/social-1780846953575-Finally_Logo999.webp" },
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
          "@type": "AutoRepair",
          "@id": "https://ai-tyre-vision.lovable.app/#business",
          name: "Manoj Wheels",
          image: "https://res.cloudinary.com/dwv8kc9vb/image/upload/v1780845528/Finally_Logo_oxkjjv.png",
          url: "https://ai-tyre-vision.lovable.app",
          telephone: "+91-8897230858",
          email: "manojwheels.official@gmail.com",
          priceRange: "₹₹",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Pulivendula",
            addressRegion: "Andhra Pradesh",
            addressCountry: "IN",
          },
          areaServed: [
            { "@type": "City", name: "Pulivendula" },
            { "@type": "State", name: "Andhra Pradesh" },
          ],
          openingHoursSpecification: [{
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
            opens: "08:00",
            closes: "21:00",
          }],
          sameAs: [],
          makesOffer: [
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "3D Wheel Alignment" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Wheel Balancing" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Nitrogen Air Filling" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Puncture Repair" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "Tyre Replacement" } },
            { "@type": "Offer", itemOffered: { "@type": "Service", name: "AI Tyre Health Check" } },
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
        <UserActivityNotifications />
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



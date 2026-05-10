import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Manoj Wheels — AI-Powered Tyre & Wheel Care Center" },
      { name: "description", content: "India's smartest AI-powered tyre care center. 3D wheel alignment, balancing, nitrogen filling, puncture repair & premium tyres. Book online." },
      { name: "keywords", content: "tyre shop near me, wheel alignment near me, nitrogen air filling, puncture repair, 3D wheel alignment, Manoj Wheels" },
      { name: "author", content: "Manoj Wheels" },
      { property: "og:title", content: "Manoj Wheels — AI-Powered Tyre & Wheel Care Center" },
      { property: "og:description", content: "India's smartest AI-powered tyre care center. 3D wheel alignment, balancing, nitrogen filling, puncture repair & premium tyres. Book online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Manoj Wheels — AI-Powered Tyre & Wheel Care Center" },
      { name: "twitter:description", content: "India's smartest AI-powered tyre care center. 3D wheel alignment, balancing, nitrogen filling, puncture repair & premium tyres. Book online." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/k08WdrNmcUSfeEvN0WgEsixUk593/social-images/social-1778417961860-ChatGPT_Image_May_10,_2026,_06_29_01_PM.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/k08WdrNmcUSfeEvN0WgEsixUk593/social-images/social-1778417961860-ChatGPT_Image_May_10,_2026,_06_29_01_PM.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap" },
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

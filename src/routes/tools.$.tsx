import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/tools/$")({
  head: () => ({
    meta: [
      { title: "Tool not found | Manoj Wheels" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ToolNotFound,
});

function ToolNotFound() {
  const { _splat } = Route.useParams();
  return (
    <div className="container mx-auto px-4 py-20 max-w-xl text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/15 text-primary inline-flex items-center justify-center mb-4">
        <Wrench className="w-7 h-7" />
      </div>
      <h1 className="text-3xl font-bold">Tool not found</h1>
      <p className="mt-2 text-muted-foreground">
        We couldn't find a tool at{" "}
        <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">/tools/{_splat}</code>.
        It may have been moved or renamed.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild variant="hero">
          <Link to="/tools">
            Browse all tools <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}

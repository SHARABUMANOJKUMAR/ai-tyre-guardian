import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, signOut } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, LogOut, FileText, User as UserIcon, Receipt } from "lucide-react";

export function UserMenu() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />;

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/auth">Sign In</Link>
      </Button>
    );
  }

  const initials = (user.email ?? "?").slice(0, 2).toUpperCase();
  const avatar = (user.user_metadata?.avatar_url as string | undefined) ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full ring-1 ring-border hover:ring-primary/60 transition" aria-label="Account">
          <Avatar className="w-9 h-9">
            <AvatarImage src={avatar} alt="" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/dashboard"><LayoutDashboard className="w-4 h-4 mr-2" />Dashboard</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/_authenticated/my-invoices"><Receipt className="w-4 h-4 mr-2" />My Invoices</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/dashboard"><FileText className="w-4 h-4 mr-2" />My Reports</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/dashboard"><UserIcon className="w-4 h-4 mr-2" />Profile</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
          <LogOut className="w-4 h-4 mr-2" />Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

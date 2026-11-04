import { Link } from "@tanstack/react-router";
import { Bell, Menu, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/data";

export function SiteHeader() {
  const { session, isAdmin } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur-md dark:bg-slate-950/90">
      <div className="bg-pitch-deep text-pitch-foreground">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-[0.68rem] font-bold tracking-[0.18em] uppercase">
          <span>The home of South Sudan football</span>
          <div className="flex items-center gap-2 text-gold">
            <Radio className="h-3.5 w-3.5 fill-current" />
            <span>12 live</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="font-display grid h-12 w-14 -skew-x-6 place-items-center rounded-sm bg-primary text-xl font-extrabold text-gold shadow-[4px_4px_0_var(--gold)]">M.M</span>
          <span>
            <span className="block font-bold">M.MissionFootball</span>
            <span className="block text-xs text-muted-foreground">The Home of South Sudan Football</span>
          </span>
        </Link>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            LIVE
          </div>
          <span className="text-sm font-semibold text-muted-foreground">12 matches</span>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" aria-label="Notifications" className="grid h-10 w-10 place-items-center rounded-full border bg-card text-muted-foreground hover:bg-muted">
            <Bell className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Menu" className="grid h-10 w-10 place-items-center rounded-full border bg-card text-muted-foreground hover:bg-muted">
            <Menu className="h-4 w-4" />
          </button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/admin">{session ? (isAdmin ? "Dashboard" : "Account") : "Admin Login"}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

import { Bell, Clapperboard, House, Search, Trophy } from "lucide-react";

const items = [
  { key: "matches", label: "Matches", icon: House },
  { key: "news", label: "News", icon: Clapperboard },
  { key: "leagues", label: "Leagues", icon: Trophy },
  { key: "following", label: "Following", icon: Bell },
  { key: "search", label: "Search", icon: Search },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-2 py-2 backdrop-blur-md shadow-[0_-12px_30px_rgba(15,23,42,0.08)] dark:bg-slate-950/90">
      <div className="mx-auto grid max-w-2xl grid-cols-5 gap-1">
        {items.map(({ key, label, icon: Icon }) => {
          const active = key === "matches";
          return (
            <a
              key={key}
              href={key === "matches" ? "/#fixtures" : key === "news" ? "/#news" : key === "leagues" ? "/#league" : key === "search" ? "/#search" : "/"}
              className={`flex flex-col items-center justify-center rounded-xl px-2 py-2 text-[0.6rem] font-semibold transition-colors ${
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              <span>{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

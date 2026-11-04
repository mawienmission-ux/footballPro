import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import { clubsQuery, leaguesQuery, matchesQuery } from "@/lib/data";
import { computeStandings } from "@/lib/standings";
import { Crest } from "@/components/Crest";

export function LeaguesBrowser() {
  const leagues = useQuery(leaguesQuery).data ?? [];
  const clubs = useQuery(clubsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [tab, setTab] = useState<"table" | "fixtures">("table");
  const open = leagues.find((l) => l.id === openId);

  if (open) {
    const lc = clubs.filter((c) => c.league === open.name);
    const logo = new Map(lc.map((c) => [c.id, c.logo_url]));
    const lm = matches.filter((m) => m.league === open.name);
    const table = computeStandings(lc, lm);
    const byId = new Map(lc.map((c) => [c.id, c]));
    const rounds: [string, typeof lm][] = [];
    for (const m of lm) {
      const k = m.round || "Fixtures";
      const g = rounds.find((r) => r[0] === k);
      g ? g[1].push(m) : rounds.push([k, [m]]);
    }
    const tabBtn = (t: "table" | "fixtures", label: string) => (
      <button onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${tab === t ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{label}</button>
    );
    return (
      <div className="mx-auto max-w-2xl">
        <button onClick={() => setOpenId(null)} className="flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> All leagues</button>
        <div className="mt-4 flex items-center gap-3"><Crest src={open.logo_url} label={open.short_name || open.name} size="lg" /><h3 className="text-3xl font-extrabold">{open.name}</h3></div>
        <div className="mt-4 flex gap-2">{tabBtn("table", "Table")}{tabBtn("fixtures", "Fixtures")}</div>
        {tab === "fixtures" ? (
          <div className="mt-4 space-y-4">
            {rounds.length === 0 && <p className="rounded-2xl border bg-card p-6 text-center text-muted-foreground">No fixtures yet.</p>}
            {rounds.map(([name, items]) => (
              <div key={name} className="overflow-hidden rounded-2xl border bg-card">
                <p className="bg-muted px-4 py-2 text-sm font-bold uppercase tracking-wide">{name}</p>
                {items.map((m) => {
                  const h = byId.get(m.home_club_id), a = byId.get(m.away_club_id);
                  const d = new Date(m.kickoff);
                  const score = m.status !== "scheduled" && m.home_score != null && m.away_score != null;
                  return (
                    <div key={m.id} className="border-t px-3 py-3 text-sm">
                      <p className="text-xs text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}{m.venue ? ` · ${m.venue}` : ""}</p>
                      <div className="mt-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <span className="flex items-center justify-end gap-2 text-right"><span className="truncate">{h?.name ?? "TBC"}</span><Crest src={h?.logo_url} label={h?.short_name || h?.name || "?"} size="sm" /></span>
                        <span className="min-w-14 text-center font-bold">{score ? `${m.home_score} - ${m.away_score}` : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="flex items-center gap-2"><Crest src={a?.logo_url} label={a?.short_name || a?.name || "?"} size="sm" /><span className="truncate">{a?.name ?? "TBC"}</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (<>
        <div className="mt-4 overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground"><tr>{["#", "Team", "P", "W", "D", "L", "GD", "PTS"].map((h) => <th key={h} className={`px-3 py-3 font-semibold ${h === "Team" ? "text-left" : "text-center"}`}>{h}</th>)}</tr></thead>
            <tbody>
              {table.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No clubs in this league yet.</td></tr>}
              {table.map((r, i) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-3 text-center font-semibold">{i + 1}</td>
                  <td className="px-3 py-3"><span className="flex items-center gap-2"><Crest src={logo.get(r.id)} label={r.short_name || r.name} size="sm" /><span className="truncate">{r.name}</span></span></td>
                  {[r.p, r.w, r.d, r.l, r.gd].map((v, j) => <td key={j} className="px-3 py-3 text-center">{v}</td>)}
                  <td className="px-3 py-3 text-center font-bold">{r.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Win = 3 pts, draw = 1. GD = goals for − goals against.</p>
        </>)}
      </div>
    );
  }

  const shown = leagues.filter((l) => l.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="mx-auto max-w-2xl">
      <label className="flex items-center gap-3 rounded-full border bg-card px-5 py-3 shadow-sm">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find leagues" className="w-full bg-transparent outline-none" />
      </label>
      <div className="mt-5 space-y-2">
        {shown.map((l) => (
          <button key={l.id} onClick={() => setOpenId(l.id)} className="flex w-full items-center gap-4 rounded-2xl border bg-card px-5 py-4 text-left transition-colors hover:bg-accent">
            <Crest src={l.logo_url} label={l.short_name || l.name} />
            <span className="flex-1">{l.name}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        {shown.length === 0 && <p className="p-6 text-center text-muted-foreground">No leagues match "{q}".</p>}
      </div>
    </div>
  );
}

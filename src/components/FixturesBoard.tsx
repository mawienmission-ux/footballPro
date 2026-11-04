import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { clubsQuery, leaguesQuery, matchesQuery } from "@/lib/data";
import { Crest } from "@/components/Crest";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export function FixturesBoard() {
  const clubs = useQuery(clubsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const leagues = useQuery(leaguesQuery).data ?? [];
  const [offset, setOffset] = useState<number | null>(null);
  const [liveOnly, setLiveOnly] = useState(false);
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const clubById = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  const days = [-3, -2, -1, 0, 1, 2, 3].map((o) => {
    const d = new Date();
    d.setDate(d.getDate() + o);
    const label = o === 0 ? "Today" : o === -1 ? "Yesterday" : o === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
    return { o, d, label };
  });
  const showAll = offset === null && !liveOnly;
  const target = offset === null ? "" : dayKey(days.find((x) => x.o === offset)!.d);
  const dayMatches = matches.filter((m) => (liveOnly ? m.status === "live" : showAll ? true : dayKey(new Date(m.kickoff)) === target));

  const dateHeader = (d: Date) => {
    const key = dayKey(d);
    const today = dayKey(new Date());
    if (key === today) return "Today";
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    if (key === dayKey(yesterday)) return "Yesterday";
    if (key === dayKey(tomorrow)) return "Tomorrow";
    return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  };

  const dateGroups = (() => {
    if (!showAll) return [{ key: "", date: new Date(), matches: dayMatches }];
    const sorted = [...dayMatches].sort(
      (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    );
    const out: { key: string; date: Date; matches: typeof dayMatches }[] = [];
    for (const m of sorted) {
      const k = dayKey(new Date(m.kickoff));
      const last = out[out.length - 1];
      if (last && last.key === k) last.matches.push(m);
      else out.push({ key: k, date: new Date(m.kickoff), matches: [m] });
    }
    return out;
  })();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => setLiveOnly(!liveOnly)} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold ${liveOnly ? "border-live bg-live text-primary-foreground" : "bg-card"}`}>
          <span className={`h-2 w-2 rounded-full ${liveOnly ? "bg-primary-foreground" : "bg-muted-foreground"}`} /> Live
        </button>
      </div>
      {!liveOnly && (
        <div className="mt-4 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3 border-b pb-3 text-base font-semibold">
            <button onClick={() => setOffset(null)} className={`shrink-0 ${offset === null ? "text-foreground" : "text-muted-foreground"}`}>All fixtures</button>
            {days.map((d) => (
              <button key={d.o} onClick={() => setOffset(d.o)} className={`shrink-0 ${d.o === offset ? "text-foreground" : "text-muted-foreground"}`}>{d.label}</button>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 max-h-[620px] space-y-6 overflow-y-auto pr-1">
        {dayMatches.length === 0 && <p className="rounded-2xl bg-card p-8 text-center text-muted-foreground">{liveOnly ? "No live matches right now." : "No matches on this day."}</p>}
        {dateGroups.map((group) => {
          const dateMatches = group.matches;
          const leagueGroups = leagues
            .map((l) => ({ league: l, items: dateMatches.filter((m) => m.league === l.name) }))
            .filter((g) => g.items.length > 0);
          return (
            <div key={group.key} className="space-y-3">
              {showAll && (
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  <span className="bg-muted-foreground/20 inline-block h-2 w-2 rounded-full" />
                  {dateHeader(group.date)}
                </h3>
              )}
              {leagueGroups.map(({ league, items }) => {
                const isClosed = closed[`${group.key}-${league.id}`];
                return (
                  <div key={league.id} className="overflow-hidden rounded-2xl border bg-card">
                    <button onClick={() => setClosed({ ...closed, [`${group.key}-${league.id}`]: !isClosed })} className="flex w-full items-center gap-3 bg-muted px-4 py-3 text-left font-semibold">
                      <Crest src={league.logo_url} label={league.short_name || league.name} size="sm" />
                      <span className="flex-1 truncate">{league.name}</span>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isClosed ? "" : "rotate-180"}`} />
                    </button>
                    {!isClosed && items.map((m) => {
                      const h = clubById.get(m.home_club_id);
                      const a = clubById.get(m.away_club_id);
                      const hasScore = m.status !== "scheduled" && m.home_score != null && m.away_score != null;
                      return (
                        <div key={m.id} className="border-t">
                        {m.round && <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m.round}</p>}
                        <div className="grid grid-cols-[3rem_1fr_auto_1fr] items-center gap-2 px-3 py-4 text-sm sm:text-base">
                          <StatusPill status={m.status} minute={m.minute} kickoff={m.kickoff} />
                          <span className="flex items-center justify-end gap-2 text-right"><span className="truncate">{h?.name ?? "TBC"}</span><Crest src={h?.logo_url} label={h?.short_name || h?.name || "?"} /></span>
                          <span className="min-w-14 text-center font-bold">{hasScore ? `${m.home_score} - ${m.away_score}` : new Date(m.kickoff).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</span>
                          <span className="flex items-center gap-2"><Crest src={a?.logo_url} label={a?.short_name || a?.name || "?"} /><span className="truncate">{a?.name ?? "TBC"}</span></span>
                        </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ status, minute }: { status: string; minute: number | null; kickoff: string }) {
  if (status === "live") return <span className="justify-self-start rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{minute ? `${minute}'` : "LIVE"}</span>;
  if (status === "finished") return <span className="justify-self-start rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">FT</span>;
  return <span />;
}

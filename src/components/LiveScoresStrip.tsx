import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { clubsQuery, liveScoresQuery } from "@/lib/data";

export function LiveScoresStrip() {
  const clubs = useQuery(clubsQuery).data ?? [];
  const liveScores = useQuery(liveScoresQuery).data ?? [];

  const clubMap = new Map(clubs.map((club) => [club.id, club]));

  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Live action</p>
          <h2 className="text-3xl font-extrabold">Football scores</h2>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary">Updated live</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {liveScores.length === 0 && (
          <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground md:col-span-2 xl:col-span-3">
            No live fixtures available yet. Check back soon for match updates.
          </div>
        )}
        {liveScores.map((fixture) => {
          const homeClub = fixture.homeClubId ? clubMap.get(fixture.homeClubId) : null;
          const awayClub = fixture.awayClubId ? clubMap.get(fixture.awayClubId) : null;

          return (
            <div key={fixture.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <span>{fixture.league}</span>
                <span>{fixture.status === "live" ? `Live ${fixture.minute ? `• ${fixture.minute}'` : "•"}` : fixture.status === "finished" ? "Full time" : fixture.round}</span>
              </div>

              <div className="space-y-2">
                <Link to={homeClub ? `/clubs/${homeClub.id}` : "/" } className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-2 text-sm font-semibold hover:bg-muted">
                  <span className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[0.55rem] font-bold text-primary">
                      {homeClub?.short_name?.slice(0, 3) ?? fixture.homeName.slice(0, 3).toUpperCase()}
                    </span>
                    {homeClub?.name ?? fixture.homeName}
                  </span>
                  <span className="font-black">{fixture.homeScore ?? 0}</span>
                </Link>

                <Link to={awayClub ? `/clubs/${awayClub.id}` : "/" } className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-2 text-sm font-semibold hover:bg-muted">
                  <span className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[0.55rem] font-bold text-primary">
                      {awayClub?.short_name?.slice(0, 3) ?? fixture.awayName.slice(0, 3).toUpperCase()}
                    </span>
                    {awayClub?.name ?? fixture.awayName}
                  </span>
                  <span className="font-black">{fixture.awayScore ?? 0}</span>
                </Link>
              </div>

              <div className="mt-3 flex items-center justify-between text-[0.7rem] text-muted-foreground">
                <span>{new Date(fixture.kickoff).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span>{fixture.venue}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

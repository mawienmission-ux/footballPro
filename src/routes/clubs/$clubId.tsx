import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, MapPin, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crest } from "@/components/Crest";
import { clubsQuery, matchesQuery } from "@/lib/data";
import { computeStandings } from "@/lib/standings";

export const Route = createFileRoute("/clubs/$clubId")({
  component: ClubProfilePage,
});

function ClubProfilePage() {
  const { clubId } = Route.useParams();
  const clubs = useQuery(clubsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];

  const club = clubs.find((item) => item.id === clubId) ?? null;
  const clubMatches = matches.filter(
    (match) => match.home_club_id === clubId || match.away_club_id === clubId
  );

  const leagueClubs = club ? clubs.filter((item) => item.league === club.league) : [];
  const leagueTable = club ? computeStandings(leagueClubs, matches.filter((match) => match.league === club.league)) : [];
  const clubStanding = leagueTable.find((entry) => entry.id === clubId);

  if (!club) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="eyebrow">Club not found</p>
        <h1 className="mt-2 text-4xl font-extrabold">This club is not available.</h1>
        <Link to="/" className="mt-6 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </div>
    );
  }

  const clubName = club.name;
  const recentMatches = [...clubMatches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Button asChild variant="outline">
            <Link to="/admin">Admin</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <Crest src={club.logo_url} label={club.short_name || club.name} size="lg" />
              <div>
                <p className="eyebrow">Club profile</p>
                <h1 className="text-4xl font-extrabold">{clubName}</h1>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {club.city}</span>
                  <span className="inline-flex items-center gap-2"><Trophy className="h-4 w-4" /> {club.league}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/40 px-4 py-3 text-sm">
              <p className="text-muted-foreground">League standing</p>
              <p className="mt-1 text-2xl font-black">#{clubStanding ? clubStanding.position : "—"}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-extrabold">Upcoming and recent fixtures</h2>
            <div className="mt-5 space-y-3">
              {recentMatches.length === 0 && (
                <p className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">No fixtures recorded yet for this club.</p>
              )}
              {recentMatches.slice(0, 5).map((match) => {
                const homeClub = clubs.find((item) => item.id === match.home_club_id);
                const awayClub = clubs.find((item) => item.id === match.away_club_id);
                const isHome = match.home_club_id === clubId;
                const scoreText =
                  match.status !== "scheduled" && match.home_score != null && match.away_score != null
                    ? `${match.home_score} - ${match.away_score}`
                    : new Date(match.kickoff).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={match.id} className="rounded-2xl border bg-muted/25 p-4">
                    <div className="mb-2 flex items-center justify-between text-[0.68rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                      <span>{match.round}</span>
                      <span>{match.status === "live" ? "Live" : match.status === "finished" ? "Full time" : "Fixture"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-sm font-semibold">
                        {isHome ? clubName : homeClub?.name ?? "TBC"}
                        <div className="mt-1 text-xs text-muted-foreground">vs {isHome ? awayClub?.name ?? "Opposition" : clubName}</div>
                      </div>
                      <div className="text-xl font-black">{scoreText}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>{new Date(match.kickoff).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <aside className="rounded-3xl border bg-card p-6">
            <h2 className="text-2xl font-extrabold">League snapshot</h2>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3 text-sm">
                <span>Position</span>
                <strong>{clubStanding ? clubStanding.position : "—"}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3 text-sm">
                <span>Points</span>
                <strong>{clubStanding ? clubStanding.pts : "—"}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3 text-sm">
                <span>Wins</span>
                <strong>{clubStanding ? clubStanding.w : "—"}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-3 text-sm">
                <span>Goal difference</span>
                <strong>{clubStanding ? clubStanding.gd : "—"}</strong>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

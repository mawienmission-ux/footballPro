import { createFileRoute, Link } from "@tanstack/react-router";
import { BellRing, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { FixturesBoard } from "@/components/FixturesBoard";
import { LeaguesBrowser } from "@/components/LeaguesBrowser";
import { NewsFeed } from "@/components/NewsFeed";
import { LiveScoresStrip } from "@/components/LiveScoresStrip";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "M.MissionFootball — The Home of South Sudan Football" },
      { name: "description", content: "Fixtures, results, standings and news from South Sudan football leagues and tournaments." },
      { property: "og:title", content: "M.MissionFootball — The Home of South Sudan Football" },
      { property: "og:description", content: "Every match. Every club. One home for South Sudan football." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="bg-pitch-gradient text-pitch-foreground border-b-8 border-gold">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <p className="mb-5 flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase"><span className="h-2 w-2 rounded-full bg-gold" />South Sudan football, all in one place</p>
            <h1 className="text-6xl leading-[0.9] font-extrabold md:text-8xl">Every match.<br /><span className="text-gold">Every club.</span><br />One home.</h1>
            <p className="mt-6 max-w-md text-pitch-foreground/85">Follow the South Sudan Premier League, local associations, fixtures, results, players, and the stories shaping our game.</p>
            <div className="mt-8 flex gap-3">
              <Button variant="gold" size="lg" asChild><a href="#fixtures">Explore Fixtures ↗</a></Button>
              <Button variant="heroOutline" size="lg" asChild><a href="#league">Explore the League</a></Button>
            </div>
          </div>
          <div className="mx-auto flex w-full max-w-md items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-card backdrop-blur-sm">
            <div>
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-gold bg-pitch-deep text-3xl font-black text-gold">SS</div>
              <p className="text-lg font-semibold uppercase tracking-[0.2em] text-gold">South Sudan</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-24 px-6 pb-28 pt-20">
        <LiveScoresStrip />

        <section id="fixtures" className="scroll-mt-8">
          <p className="eyebrow text-center">Match centre</p>
          <h2 className="mb-6 text-center text-5xl font-extrabold">Matches</h2>
          <FixturesBoard />
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow">Sponsored</p>
              <h3 className="text-2xl font-extrabold">Official matchday partner</h3>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <BellRing className="h-3.5 w-3.5" />
              Live alerts enabled
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-[1.5fr_1fr]">
            <div className="overflow-hidden rounded-2xl border bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/80">South Sudan football</p>
              <h4 className="mt-3 text-3xl font-black">Take your club to the next level.</h4>
              <p className="mt-2 max-w-md text-sm text-primary-foreground/80">Premium match coverage, growth campaigns and local football promotions for clubs, leagues and fans.</p>
            </div>
            <div className="flex items-center justify-center rounded-2xl border bg-muted p-6 text-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Ad slot</p>
                <p className="mt-2 text-lg font-extrabold">M.MissionFootball</p>
                <p className="text-sm text-muted-foreground">Club sponsors and campaign partners</p>
              </div>
            </div>
          </div>
        </section>

        <section id="league" className="scroll-mt-8">
          <p className="eyebrow text-center">Competitions</p>
          <h2 className="mb-6 text-center text-5xl font-extrabold">Leagues</h2>
          <LeaguesBrowser />
        </section>

        <section id="search" className="scroll-mt-8">
          <div className="mx-auto max-w-2xl rounded-3xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="eyebrow">Search</p>
              <span className="rounded-full bg-muted px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">Fast lookup</span>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <input value="" placeholder="Search clubs, players, competitions and news" className="w-full bg-transparent outline-none placeholder:text-muted-foreground" readOnly />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-muted p-3 text-sm"><span className="font-bold text-foreground">Clubs</span><p className="mt-1 text-muted-foreground">Search by name or city</p></div>
              <div className="rounded-2xl border bg-muted p-3 text-sm"><span className="font-bold text-foreground">Players</span><p className="mt-1 text-muted-foreground">Find squad members</p></div>
              <div className="rounded-2xl border bg-muted p-3 text-sm"><span className="font-bold text-foreground">Leagues</span><p className="mt-1 text-muted-foreground">Browse competitions</p></div>
              <div className="rounded-2xl border bg-muted p-3 text-sm"><span className="font-bold text-foreground">News</span><p className="mt-1 text-muted-foreground">Breaking stories</p></div>
            </div>
          </div>
        </section>

        <section id="news" className="scroll-mt-8">
          <p className="eyebrow text-center">From around the game</p>
          <h2 className="mb-6 text-center text-5xl font-extrabold">News</h2>
          <NewsFeed />
        </section>
      </main>

      <footer className="bg-pitch-deep py-10 text-center text-sm text-pitch-foreground/80">
        © 2026 M.MissionFootball · <Link to="/admin" className="underline">Admin</Link>
      </footer>

      <BottomNav />
    </div>
  );
}


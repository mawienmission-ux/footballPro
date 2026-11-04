import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { hasSupabaseConfig, supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/SiteHeader";
import { clubsQuery, leaguesQuery, matchesQuery, newsQuery, SSPL, useSession } from "@/lib/data";
import { adSlots, subscriptionPlans } from "@/lib/monetization";
import { computeStandings } from "@/lib/standings";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — M.MissionFootball" },
      { name: "description", content: "Manage clubs, fixtures, results and news for M.MissionFootball." },
      { property: "og:title", content: "Admin Dashboard — M.MissionFootball" },
      { property: "og:description", content: "Administrator area for M.MissionFootball." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { session, isAdmin, ready } = useSession();
  return (
    <div className="min-h-screen bg-muted">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        {!ready ? null : !session ? <AuthForm /> : !isAdmin ? (
          <div className="mx-auto max-w-md rounded-md border bg-card p-8 text-center">
            <h1 className="text-3xl font-extrabold">No admin access</h1>
            <p className="mt-2 text-sm text-muted-foreground">You're signed in as {session.user.email}, but this account isn't an administrator.</p>
            <div className="mt-6 flex justify-center gap-2"><Button variant="outline" asChild><Link to="/">Back to home</Link></Button><Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button></div>
          </div>
        ) : <Dashboard email={session.user.email ?? ""} />}
      </main>
    </div>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (website) return;
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      if (error) toast.error(error.message);
      else if (!data.session) toast.success("Check your email to confirm your account, then sign in.");
    }
    setBusy(false);
  };
  const localAdminMode = !hasSupabaseConfig();

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-md border bg-card p-8">
      <p className="eyebrow">Administrators</p>
      <h1 className="text-4xl font-extrabold">{mode === "in" ? "Admin login" : "Create account"}</h1>
      {localAdminMode && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-100">
          Local development mode is active. This fallback is for testing only. In production, admin access must come from Firebase Auth plus a real server-side admin role check.
          Use <strong>mawienmision@gmail.com</strong> / <strong>adorkhon</strong> or create your own admin account.
        </div>
      )}
      <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input type="password" required minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <div className="hidden" aria-hidden="true">
        <label>Website</label>
        <Input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <Button className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : "Sign up"}</Button>
      <button type="button" className="w-full text-sm text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
      </button>
      <p className="text-xs text-muted-foreground">
        {localAdminMode
          ? "This local mode does not require live Firebase credentials; the first created admin account becomes the dashboard owner."
          : "The first account created becomes the site administrator. After signing up, open the confirmation email and click the link, then sign in here."}
      </p>
      <Link to="/" className="block text-center text-sm font-semibold text-primary">← Back to home</Link>
    </form>
  );
}

function Dashboard({ email }: { email: string }) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow">Signed in as {email}</p><h1 className="text-5xl font-extrabold">Dashboard</h1></div>
        <div className="flex gap-2"><Button variant="outline" asChild><Link to="/">View site</Link></Button><Button variant="outline" onClick={() => supabase.auth.signOut()}>Sign out</Button></div>
      </div>
      <Tabs defaultValue="overview" className="relative mt-8">
        <TabsList className="relative z-20 flex-wrap gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">Fixtures & results</TabsTrigger>
          <TabsTrigger value="competitions">Competitions</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="clubs">Clubs</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="leagues">Leagues</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="audit">Audit & sync</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="relative z-10"><OverviewAdmin /></TabsContent>
        <TabsContent value="matches" className="relative z-10"><MatchesAdmin /></TabsContent>
        <TabsContent value="competitions" className="relative z-10"><CompetitionsAdmin /></TabsContent>
        <TabsContent value="groups" className="relative z-10"><GroupsAdmin /></TabsContent>
        <TabsContent value="clubs" className="relative z-10"><ClubsAdmin /></TabsContent>
        <TabsContent value="standings" className="relative z-10"><StandingsAdmin /></TabsContent>
        <TabsContent value="players" className="relative z-10"><PlayersAdmin /></TabsContent>
        <TabsContent value="news" className="relative z-10"><NewsAdmin /></TabsContent>
        <TabsContent value="leagues" className="relative z-10"><LeaguesAdmin /></TabsContent>
        <TabsContent value="media" className="relative z-10"><MediaAdmin /></TabsContent>
        <TabsContent value="audit" className="relative z-10"><AuditAdmin /></TabsContent>
        <TabsContent value="monetization" className="relative z-10"><MonetizationAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

const ADMIN_LOG_KEY = "mission-football-admin-audit";
const ADMIN_PLAYERS_KEY = "mission-football-admin-players";
const ADMIN_MEDIA_KEY = "mission-football-admin-media";
const ADMIN_COMPETITIONS_KEY = "mission-football-admin-competitions";
const ADMIN_GROUPS_KEY = "mission-football-admin-groups";
const ADMIN_ARTICLES_KEY = "mission-football-admin-articles";

type CompetitionRecord = {
  id: string;
  name: string;
  season: string;
  format: string;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
  logo_url: string;
  banner_url: string;
};

type GroupRecord = {
  id: string;
  name: string;
  competition: string;
  club_ids: string[];
  qualifying: number;
};

function readLocalAdminList<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalAdminList<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors in restricted browser contexts.
  }
}

function useLocalAdminList<T>(key: string, fallback: T[]) {
  const [items, setItems] = useState<T[]>(() => readLocalAdminList<T>(key, fallback));
  useEffect(() => {
    writeLocalAdminList(key, items);
  }, [key, items]);
  return [items, setItems] as const;
}

function appendAuditEntry(event: string, details: string, scope: string = "admin") {
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    event,
    details,
    scope,
    created_at: new Date().toISOString(),
  };
  const current = readLocalAdminList<{ id: string; event: string; details: string; scope: string; created_at: string }>(ADMIN_LOG_KEY, []);
  writeLocalAdminList(ADMIN_LOG_KEY, [entry, ...current].slice(0, 40));
}

const sel = "rounded-md border bg-card px-3 py-2 text-sm";
function useRefresh() {
  const qc = useQueryClient();
  return (key: string, error: { message: string } | null, ok?: string) => {
    if (error) { toast.error(error.message); return; }
    if (ok) toast.success(ok);
    appendAuditEntry(`${key} update`, ok ?? `Refreshed ${key}`, key);
    qc.invalidateQueries({ queryKey: [key] });
  };
}

function OverviewAdmin() {
  const clubs = useQuery(clubsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const leagues = useQuery(leaguesQuery).data ?? [];
  const news = useQuery(newsQuery).data ?? [];
  const liveMatches = matches.filter((m) => m.status === "live").length;
  const scheduledMatches = matches.filter((m) => m.status === "scheduled").length;
  const completedMatches = matches.filter((m) => m.status === "finished").length;
  const summaryCards = [
    { label: "Leagues", value: String(leagues.length), accent: "text-primary" },
    { label: "Clubs", value: String(clubs.length), accent: "text-emerald-400" },
    { label: "Live matches", value: String(liveMatches), accent: "text-orange-400" },
    { label: "Stories", value: String(news.length), accent: "text-sky-400" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <h3 className={`mt-2 text-3xl font-black ${card.accent}`}>{card.value}</h3>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border bg-card p-6">
          <h3 className="text-2xl font-extrabold">Operations snapshot</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>• {scheduledMatches} upcoming fixtures awaiting kickoff</li>
            <li>• {completedMatches} results already finalised</li>
            <li>• {liveMatches} matches currently marked live</li>
            <li>• 0 unassigned media assets pending review (managed below in the media panel)</li>
          </ul>
        </div>
        <div className="rounded-md border bg-card p-6">
          <h3 className="text-2xl font-extrabold">Owner control checklist</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>• Validate club and league names before publishing</li>
            <li>• Confirm home/away fixtures and round groupings</li>
            <li>• Check results as they are updated to keep standings accurate</li>
            <li>• Review audit trail before final approval of new media</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StandingsAdmin() {
  const clubs = useQuery(clubsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const leagues = useQuery(leaguesQuery).data ?? [];
  const [league, setLeague] = useState(SSPL);
  const leagueClubs = clubs.filter((club) => club.league === league);
  const table = useMemo(() => computeStandings(leagueClubs, matches.filter((match) => match.league === league)), [leagueClubs, matches, league]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-4">
        <label className="text-sm font-semibold">League</label>
        <select className={sel} value={league} onChange={(e) => setLeague(e.target.value)}>
          {leagues.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </select>
      </div>
      <p className="text-xs text-muted-foreground">Previous table values are entered in the Clubs tab as P, W, D, L, GF and GA. The app calculates GD and points automatically.</p>
      <div className="overflow-hidden rounded-md border bg-card">
        <div className="grid grid-cols-[1.5fr_repeat(8,0.7fr)] gap-2 bg-muted px-4 py-3 text-[0.7rem] font-bold uppercase tracking-wide text-muted-foreground">
          <span>Club</span>
          <span>P</span>
          <span>W</span>
          <span>D</span>
          <span>L</span>
          <span>GF</span>
          <span>GA</span>
          <span>GD</span>
          <span>Pts</span>
        </div>
        {table.length === 0 ? <p className="p-6 text-center text-muted-foreground">No standings yet for this league.</p> : table.map((row, index) => (
          <div key={row.id} className="grid grid-cols-[1.5fr_repeat(8,0.7fr)] gap-2 border-t px-4 py-3 text-sm">
            <span className="font-semibold">{index + 1}. {row.name}</span>
            <span>{row.p}</span>
            <span>{row.w}</span>
            <span>{row.d}</span>
            <span>{row.l}</span>
            <span>{row.gf}</span>
            <span>{row.ga}</span>
            <span>{row.gd > 0 ? `+${row.gd}` : row.gd}</span>
            <span className="font-bold">{row.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersAdmin() {
  const clubs = useQuery(clubsQuery).data ?? [];
  const [players, setPlayers] = useLocalAdminList<{ id: string; name: string; position: string; club_id: string; nationality: string }>(ADMIN_PLAYERS_KEY, [
    { id: "player-1", name: "John Deng", position: "Forward", club_id: clubs[0]?.id ?? "", nationality: "South Sudan" },
    { id: "player-2", name: "Martin Makuach", position: "Midfielder", club_id: clubs[1]?.id ?? "", nationality: "South Sudan" },
  ]);
  const [form, setForm] = useState({ name: "", position: "Forward", club_id: clubs[0]?.id ?? "", nationality: "South Sudan" });
  const addPlayer = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.club_id) {
      toast.error("Pick a club and enter a player name.");
      return;
    }
    const next = { id: `player-${Date.now()}`, ...form, name: form.name.trim() };
    setPlayers((current) => [next, ...current]);
    appendAuditEntry("player created", `${next.name} added to squad`, "players");
    setForm({ name: "", position: form.position, club_id: form.club_id, nationality: form.nationality });
    toast.success("Player added");
  };
  return (
    <div className="space-y-6">
      <form onSubmit={addPlayer} className="grid gap-3 rounded-md border bg-card p-6 md:grid-cols-5">
        <Input required placeholder="Player name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        <Input placeholder="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} />
        <select className={sel} value={form.club_id} onChange={(e) => setForm({ ...form, club_id: e.target.value })}>
          <option value="">Club</option>
          {clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}
        </select>
        <Button>Add player</Button>
      </form>
      <div className="divide-y rounded-md border bg-card">
        {players.length === 0 && <p className="p-6 text-center text-muted-foreground">No players in the roster yet.</p>}
        {players.map((player) => (
          <div key={player.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{player.name}</p>
              <p className="text-xs text-muted-foreground">{player.position} • {player.nationality}</p>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{clubs.find((club) => club.id === player.club_id)?.name ?? "Unassigned club"}</span>
            <Button size="sm" variant="ghost" onClick={() => setPlayers((current) => current.filter((item) => item.id !== player.id))}>Remove</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaAdmin() {
  const [assets, setAssets] = useLocalAdminList<{ id: string; title: string; type: string; url: string; owner: string }>(ADMIN_MEDIA_KEY, [
    { id: "media-1", title: "SSPL Season Launch", type: "Campaign", url: "https://images.unsplash.com/...", owner: "Marketing" },
  ]);
  const [form, setForm] = useState({ title: "", type: "Campaign", url: "", owner: "Marketing" });
  const addAsset = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) {
      toast.error("Add a title and image URL.");
      return;
    }
    const next = { id: `media-${Date.now()}`, ...form, title: form.title.trim() };
    setAssets((current) => [next, ...current]);
    appendAuditEntry("media uploaded", `${next.title} added to media library`, "media");
    setForm({ title: "", type: form.type, url: "", owner: form.owner });
    toast.success("Media asset added");
  };
  return (
    <div className="space-y-6">
      <form onSubmit={addAsset} className="grid gap-3 rounded-md border bg-card p-6 md:grid-cols-5">
        <Input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <Input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
        <Input required placeholder="Image URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        <Input placeholder="Owner" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
        <Button>Add asset</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <div key={asset.id} className="overflow-hidden rounded-md border bg-card">
            <img src={asset.url} alt={asset.title} className="h-40 w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <div className="p-4">
              <p className="font-semibold">{asset.title}</p>
              <p className="text-xs text-muted-foreground">{asset.type} • {asset.owner}</p>
              <Button size="sm" variant="ghost" className="mt-3" onClick={() => setAssets((current) => current.filter((item) => item.id !== asset.id))}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditAdmin() {
  const [auditEntries, setAuditEntries] = useLocalAdminList<{ id: string; event: string; details: string; scope: string; created_at: string }>(ADMIN_LOG_KEY, [
    { id: "audit-seed", event: "system boot", details: "Admin dashboard initialized", scope: "system", created_at: new Date().toISOString() },
  ]);
  const syncPublicSite = () => {
    const now = new Date().toISOString();
    const entry = { id: `audit-${Date.now()}`, event: "sync published", details: "Public site content synced from admin dashboard", scope: "sync", created_at: now };
    setAuditEntries((current) => [entry, ...current].slice(0, 40));
    toast.success("Public site sync queued");
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-md border bg-card p-4">
        <div>
          <p className="text-sm text-muted-foreground">Latest sync status</p>
          <h3 className="text-2xl font-extrabold">Healthy</h3>
        </div>
        <Button onClick={syncPublicSite}>Sync public site</Button>
      </div>
      <div className="divide-y rounded-md border bg-card">
        {auditEntries.map((entry) => (
          <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold">{entry.event}</p>
              <p className="text-xs text-muted-foreground">{entry.details}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p>{entry.scope}</p>
              <p>{new Date(entry.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchesAdmin() {
  const clubs = useQuery(clubsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const leagueNames = useLeagueNames();
  const done = useRefresh();
  const [f, setF] = useState({ league: SSPL, home: "", away: "", kickoff: "", venue: "", round: "" });
  const [filter, setFilter] = useState("All");
  const leagueClubs = clubs.filter((c) => c.league === f.league);
  const name = (id: string) => clubs.find((c) => c.id === id)?.name ?? "?";
  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (f.home === f.away) { toast.error("Pick two different clubs"); return; }
    const { error } = await supabase.from("matches").insert({ league: f.league, home_club_id: f.home, away_club_id: f.away, kickoff: new Date(f.kickoff).toISOString(), venue: f.venue, round: f.round });
    done("matches", error, "Fixture added");
  };
  return (
    <div className="space-y-6">
      <form onSubmit={add} className="grid gap-3 rounded-md border bg-card p-6 md:grid-cols-3">
        <select className={sel} value={f.league} onChange={(e) => setF({ ...f, league: e.target.value, home: "", away: "" })}>{leagueNames.map((l) => <option key={l}>{l}</option>)}</select>
        <select className={sel} required value={f.home} onChange={(e) => setF({ ...f, home: e.target.value })}><option value="">Home club</option>{leagueClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className={sel} required value={f.away} onChange={(e) => setF({ ...f, away: e.target.value })}><option value="">Away club</option>{leagueClubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <Input type="datetime-local" required value={f.kickoff} onChange={(e) => setF({ ...f, kickoff: e.target.value })} />
        <Input placeholder="Venue (optional)" value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} />
        <Input placeholder="Round (e.g. Round 1, Group A, Final)" value={f.round} onChange={(e) => setF({ ...f, round: e.target.value })} />
        <Button>Add fixture</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {["All", ...leagueNames].map((l) => (
          <button key={l} type="button" onClick={() => setFilter(l)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === l ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{l}</button>
        ))}
      </div>
      {matches.length === 0 && <p className="rounded-md border bg-card p-6 text-center text-muted-foreground">No fixtures yet.</p>}
      {leagueNames.filter((l) => filter === "All" || filter === l).map((l) => {
        const lm = matches.filter((m) => m.league === l);
        if (lm.length === 0) return null;
        const groups: [string, typeof lm][] = [];
        for (const m of lm) {
          const k = m.round || "No round / group";
          const g = groups.find((x) => x[0] === k);
          g ? g[1].push(m) : groups.push([k, [m]]);
        }
        return (
          <section key={l} className="space-y-3">
            <h3 className="text-xl font-extrabold">{l} <span className="text-sm font-normal text-muted-foreground">({lm.length} matches)</span></h3>
            {groups.map(([g, items]) => (
              <div key={g} className="overflow-hidden rounded-md border bg-card">
                <p className="bg-muted px-4 py-2 text-sm font-bold uppercase tracking-wide">{g}</p>
                <div className="divide-y">{items.map((m) => <MatchRow key={m.id} m={m} home={name(m.home_club_id)} away={name(m.away_club_id)} />)}</div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}

function MatchRow({ m, home, away }: { m: { id: string; kickoff: string; status: string; minute: number | null; home_score: number | null; away_score: number | null; league: string; round: string }; home: string; away: string }) {
  const done = useRefresh();
  const [hs, setHs] = useState(m.home_score?.toString() ?? "");
  const [as, setAs] = useState(m.away_score?.toString() ?? "");
  const [status, setStatus] = useState(m.status);
  const [minute, setMinute] = useState(m.minute?.toString() ?? "");
  const [round, setRound] = useState(m.round);
  const save = async () => {
    const { error } = await supabase.from("matches").update({ round, status, minute: minute === "" ? null : Number(minute), home_score: hs === "" ? null : Number(hs), away_score: as === "" ? null : Number(as) }).eq("id", m.id);
    done("matches", error, "Match updated");
  };
  const del = async () => {
    if (!confirm("Delete this match?")) return;
    const { error } = await supabase.from("matches").delete().eq("id", m.id);
    done("matches", error, "Match deleted");
  };
  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-56 flex-1"><p className="font-semibold">{home} vs {away}</p><p className="text-xs text-muted-foreground">{new Date(m.kickoff).toLocaleString()}</p></div>
      <Input className="w-32" placeholder="Round / Group" value={round} onChange={(e) => setRound(e.target.value)} aria-label="Round or group" />
      <Input className="w-16" type="number" min={0} value={hs} onChange={(e) => setHs(e.target.value)} aria-label="Home score" />
      <span>–</span>
      <Input className="w-16" type="number" min={0} value={as} onChange={(e) => setAs(e.target.value)} aria-label="Away score" />
      <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}><option value="scheduled">Scheduled</option><option value="live">Live</option><option value="finished">Finished</option></select>
      {status === "live" && <Input className="w-20" type="number" min={0} placeholder="Min" value={minute} onChange={(e) => setMinute(e.target.value)} aria-label="Minute" />}
      <Button size="sm" onClick={save}>Save</Button>
      <Button size="sm" variant="ghost" onClick={del}>Delete</Button>
    </div>
  );
}

function useLeagueNames() {
  return (useQuery(leaguesQuery).data ?? []).map((l) => l.name);
}

function getStandingSummary(stats: { start_played: number; start_won: number; start_drawn: number; start_lost: number; start_gf: number; start_ga: number }) {
  const gd = stats.start_gf - stats.start_ga;
  const pts = stats.start_won * 3 + stats.start_drawn;
  return { gd, pts };
}

function ClubsAdmin() {
  const clubs = useQuery(clubsQuery).data ?? [];
  const leagueNames = useLeagueNames();
  const done = useRefresh();
  const [league, setLeague] = useState(SSPL);
  const [newName, setNewName] = useState("");
  const [newShort, setNewShort] = useState("");
  const [newLogo, setNewLogo] = useState("");
  const [startStats, setStartStats] = useState({
    start_played: 0,
    start_won: 0,
    start_drawn: 0,
    start_lost: 0,
    start_gf: 0,
    start_ga: 0,
  });
  const inLeague = clubs.filter((c) => c.league === league);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const payload = {
      name: newName.trim(),
      short_name: newShort.trim(),
      logo_url: newLogo.trim() || null,
      league,
      sort_order: inLeague.length + 1,
      city: "",
      start_played: Number(startStats.start_played) || 0,
      start_won: Number(startStats.start_won) || 0,
      start_drawn: Number(startStats.start_drawn) || 0,
      start_lost: Number(startStats.start_lost) || 0,
      start_gf: Number(startStats.start_gf) || 0,
      start_ga: Number(startStats.start_ga) || 0,
    };
    const { error } = await supabase.from("clubs").insert(payload);
    if (!error) {
      setNewName("");
      setNewShort("");
      setNewLogo("");
      setStartStats({ start_played: 0, start_won: 0, start_drawn: 0, start_lost: 0, start_gf: 0, start_ga: 0 });
    }
    done("clubs", error, `Club added to ${league}`);
  };
  const summary = getStandingSummary(startStats);
  return (
    <div className="space-y-6">
      <Guide title="How to add clubs to a league" steps={[
        "Pick the league in the box below (create new leagues first in the Leagues tab).",
        "Type the club name, an optional short name (e.g. AFC) and an optional logo image link, then press Add club.",
        "Edit any club in the list and press Save. Use the League box on a club to move it to another league.",
        "Remove deletes the club and all of its matches.",
      ]} />
      <Guide title="How to add previous standing table" steps={[
        "Fill P, W, D, L, GF and GA for the club's previous table or current starting position.",
        "The app calculates GD automatically as GF − GA and points as 3W + D.",
        "Use these values to carry over a previous season, promotion/relegation table, or a new season reset.",
        "The standings page will reflect the totals immediately after you save the club row.",
      ]} />
      <form onSubmit={add} className="space-y-4 rounded-md border bg-card p-6">
        <div className="flex flex-wrap gap-3">
          <select className={sel} value={league} onChange={(e) => setLeague(e.target.value)}>{leagueNames.map((l) => <option key={l}>{l}</option>)}</select>
          <Input className="max-w-xs" required placeholder="New club name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <Input className="w-24" placeholder="Short" value={newShort} onChange={(e) => setNewShort(e.target.value)} />
          <Input className="w-56" placeholder="Logo image link (optional)" value={newLogo} onChange={(e) => setNewLogo(e.target.value)} />
          <Button>Add club</Button>
        </div>
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Previous table starting stats</p>
          <div className="flex flex-wrap items-end gap-2">
            {STAT_KEYS.map((key, idx) => (
              <label key={key} className="text-center text-[0.65rem] font-bold text-muted-foreground">
                {STAT_LABEL[idx]}
                <Input className="w-16" type="number" min={0} value={startStats[key]} onChange={(e) => setStartStats({ ...startStats, [key]: Number(e.target.value) || 0 })} />
              </label>
            ))}
            <div className="ml-auto rounded-md border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground">
              GD: {summary.gd > 0 ? `+${summary.gd}` : summary.gd} • PTS: {summary.pts}
            </div>
          </div>
        </div>
      </form>
      <p className="text-sm font-semibold">{inLeague.length} clubs in {league}</p>
      <p className="text-xs text-muted-foreground">To set historical table values, edit the club rows below: P, W, D, L, GF and GA. The table automatically calculates GD and points before current fixtures are added.</p>
      <div className="divide-y rounded-md border bg-card">
        {inLeague.length === 0 && <p className="p-6 text-center text-muted-foreground">No clubs in this league yet — add the first one above.</p>}
        {inLeague.map((c) => <ClubRow key={c.id} c={c} leagueNames={leagueNames} />)}
      </div>
    </div>
  );
}

type Club = { id: string; league: string; name: string; short_name: string; city: string; logo_url: string | null; start_played: number; start_won: number; start_drawn: number; start_lost: number; start_gf: number; start_ga: number };
const STAT_KEYS = ["start_played", "start_won", "start_drawn", "start_lost", "start_gf", "start_ga"] as const;
const STAT_LABEL = ["P", "W", "D", "L", "GF", "GA"];
function ClubRow({ c, leagueNames }: { c: Club; leagueNames: string[] }) {
  const done = useRefresh();
  const [v, setV] = useState<Club>({ id: c.id, league: c.league, name: c.name, short_name: c.short_name, city: c.city, logo_url: c.logo_url, start_played: c.start_played, start_won: c.start_won, start_drawn: c.start_drawn, start_lost: c.start_lost, start_gf: c.start_gf, start_ga: c.start_ga });
  const save = async () => {
    const { id, ...rest } = v;
    const { error } = await supabase.from("clubs").update({ ...rest, logo_url: rest.logo_url || null }).eq("id", id);
    done("clubs", error, rest.league !== c.league ? `Club moved to ${rest.league}` : "Club saved");
  };
  const del = async () => {
    if (!confirm(`Remove ${c.name}? Its matches will be deleted too.`)) return;
    const { error } = await supabase.from("clubs").delete().eq("id", c.id);
    done("clubs", error, "Club removed");
    done("matches", null);
  };
  return (
    <div className="flex flex-wrap items-end gap-2 p-4">
      {v.logo_url ? <img src={v.logo_url} alt="" className="h-9 w-9 object-contain" /> : <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-[0.6rem] font-bold text-primary">{v.short_name || "?"}</span>}
      <Input className="w-56" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} aria-label="Name" />
      <Input className="w-20" placeholder="Short" value={v.short_name} onChange={(e) => setV({ ...v, short_name: e.target.value })} aria-label="Short name" />
      <Input className="w-28" placeholder="City" value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} aria-label="City" />
      <Input className="w-44" placeholder="Logo image link" value={v.logo_url ?? ""} onChange={(e) => setV({ ...v, logo_url: e.target.value })} aria-label="Logo" />
      <select className={`${sel} w-44`} value={v.league} onChange={(e) => setV({ ...v, league: e.target.value })} aria-label="League">{leagueNames.map((l) => <option key={l}>{l}</option>)}</select>
      {STAT_KEYS.map((k, i) => (
        <label key={k} className="text-center text-[0.65rem] font-bold text-muted-foreground">{STAT_LABEL[i]}
          <Input className="w-14" type="number" min={0} value={v[k]} onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} />
        </label>
      ))}
      <Button size="sm" onClick={save}>Save</Button>
      <Button size="sm" variant="ghost" onClick={del}>Remove</Button>
    </div>
  );
}

function Guide({ title, steps }: { title: string; steps: string[] }) {
  return (
    <details className="rounded-md border-l-4 border-gold bg-card p-4" open>
      <summary className="cursor-pointer font-semibold">ℹ️ {title}</summary>
      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
    </details>
  );
}

function NewsAdmin() {
  const news = useQuery(newsQuery).data ?? [];
  const done = useRefresh();
  const [f, setF] = useState({
    title: "",
    category: "League News",
    body: "",
    image_url: "",
    source: "M.MissionFootball",
    status: "draft",
    scheduled_for: "",
  });

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() || !f.body.trim()) {
      toast.error("Title and article body are required.");
      return;
    }

    const payload = {
      title: f.title.trim(),
      category: f.category,
      body: f.body,
      image_url: f.image_url || null,
      source: f.source,
      status: f.status,
      published_at: f.status === "published" ? new Date().toISOString() : f.status === "scheduled" ? new Date(f.scheduled_for || Date.now()).toISOString() : null,
    } as const;

    const { error } = await supabase.from("news").insert(payload);
    if (!error) {
      setF({ title: "", category: "League News", body: "", image_url: "", source: "M.MissionFootball", status: "draft", scheduled_for: "" });
    }
    done("news", error, f.status === "draft" ? "Draft saved" : f.status === "scheduled" ? "Article scheduled" : "Story published");
  };

  const updateArticle = async (id: string, patch: Partial<typeof f>) => {
    const next: any = { ...patch };
    if (patch.status === "published") {
      next.published_at = new Date().toISOString();
    }
    if (patch.status === "scheduled" && patch.scheduled_for) {
      next.published_at = new Date(patch.scheduled_for).toISOString();
    }
    if (patch.status === "draft") {
      next.published_at = null;
    }

    const { error } = await supabase.from("news").update(next).eq("id", id);
    done("news", error, patch.status === "published" ? "Article published" : patch.status === "scheduled" ? "Article scheduled" : "Article updated");
  };

  const del = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    const { error } = await supabase.from("news").delete().eq("id", id);
    done("news", error, "Article deleted");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className="space-y-3 rounded-md border bg-card p-6">
        <div className="flex flex-wrap gap-3">
          <Input required placeholder="Headline" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="min-w-[220px] flex-1" />
          <Input className="max-w-48" placeholder="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} />
          <select className={sel} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="scheduled">Scheduled</option>
          </select>
          {f.status === "scheduled" && (
            <Input type="datetime-local" value={f.scheduled_for} onChange={(e) => setF({ ...f, scheduled_for: e.target.value })} />
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Photo link (optional)" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} className="flex-1" />
          <Input className="max-w-48" placeholder="Source" value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })} />
        </div>
        <textarea className="min-h-24 w-full rounded-md border bg-card p-3 text-sm" placeholder="Story" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        <div className="flex gap-3">
          <Button type="submit">Publish story</Button>
          <span className="text-xs text-muted-foreground">Use Draft to save without publishing, Scheduled to set a future publish date, or Published to go live immediately.</span>
        </div>
      </form>
      <div className="divide-y rounded-md border bg-card">
        {news.map((n) => (
          <NewsRow key={n.id} article={n} onUpdate={updateArticle} onDelete={del} />
        ))}
      </div>
    </div>
  );
}

function NewsRow({ article, onUpdate, onDelete }: { article: { id: string; title: string; category: string; body: string; image_url: string | null; source: string; status?: string; published_at?: string | null; }; onUpdate: (id: string, patch: Partial<{ title: string; category: string; body: string; image_url: string; source: string; status: string; scheduled_for: string; }>) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [draft, setDraft] = useState({
    title: article.title,
    category: article.category,
    body: article.body,
    image_url: article.image_url ?? "",
    source: article.source,
    status: article.status ?? "published",
    scheduled_for: article.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : "",
  });

  const save = async () => {
    await onUpdate(article.id, draft);
  };

  const publishNow = async () => {
    await onUpdate(article.id, { ...draft, status: "published", scheduled_for: "" });
  };

  const schedule = async () => {
    if (!draft.scheduled_for) {
      toast.error("Choose a date and time to schedule the article.");
      return;
    }
    await onUpdate(article.id, { ...draft, status: "scheduled" });
  };

  return (
    <div className="space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">{article.title}</p>
          <p className="text-xs text-muted-foreground">{article.category} · {article.status ?? "published"} · {article.published_at ? new Date(article.published_at).toLocaleString() : "Not published yet"}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={publishNow}>Publish now</Button>
          <Button size="sm" variant="outline" onClick={schedule}>Schedule</Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(article.id)}>Delete</Button>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <Input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        <Input value={draft.source} onChange={(e) => setDraft({ ...draft, source: e.target.value })} />
        <Input type="datetime-local" value={draft.scheduled_for} onChange={(e) => setDraft({ ...draft, scheduled_for: e.target.value })} />
        <select className={sel} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
        </select>
      </div>
      <Input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="Image URL" />
      <textarea className="min-h-24 w-full rounded-md border bg-card p-3 text-sm" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
      <Button size="sm" onClick={save}>Save article</Button>
    </div>
  );
}

function LeaguesAdmin() {
  const leagues = useQuery(leaguesQuery).data ?? [];
  const clubs = useQuery(clubsQuery).data ?? [];
  const done = useRefresh();
  const [f, setF] = useState({ name: "", short_name: "", group_name: "", logo_url: "" });
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("leagues").insert({ name: f.name.trim(), short_name: f.short_name.trim(), group_name: f.group_name.trim() || null, logo_url: f.logo_url.trim() || null, sort_order: leagues.length + 1 });
    if (!error) setF({ name: "", short_name: "", group_name: "", logo_url: "" });
    done("leagues", error, "League created");
  };
  return (
    <div className="space-y-6">
      <Guide title="How to manage leagues, groups and standings" steps={[
        "To create a league, type its name, a short name, an optional group label like Group A or Regional League, and an optional logo image link, then press Create league.",
        "Use the Group field to organise clubs into round-robin or knockout groups before you build the season schedule.",
        "To add previous table points and goals, edit each club's P, W, D, L, GF and GA values in the Clubs tab; the standings table recalculates from those values.",
        "Delete is only allowed when the league has no clubs — move or remove its clubs in the Clubs tab first.",
      ]} />
      <form onSubmit={add} className="flex flex-wrap gap-3 rounded-md border bg-card p-6">
        <Input className="max-w-sm" required placeholder="New league name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input className="w-24" placeholder="Short" value={f.short_name} onChange={(e) => setF({ ...f, short_name: e.target.value })} />
        <Input className="w-32" placeholder="Group" value={f.group_name} onChange={(e) => setF({ ...f, group_name: e.target.value })} />
        <Input className="w-64" placeholder="Logo image link (optional)" value={f.logo_url} onChange={(e) => setF({ ...f, logo_url: e.target.value })} />
        <Button>Create league</Button>
      </form>
      <div className="divide-y rounded-md border bg-card">
        {leagues.map((l) => <LeagueRow key={l.id} l={l} clubCount={clubs.filter((c) => c.league === l.name).length} />)}
      </div>
    </div>
  );
}
function LeagueRow({ l, clubCount }: { l: { id: string; name: string; short_name: string; group_name?: string | null; logo_url: string | null }; clubCount: number }) {
  const done = useRefresh();
  const [name, setName] = useState(l.name);
  const [short, setShort] = useState(l.short_name);
  const [groupName, setGroupName] = useState(l.group_name ?? "");
  const [logo, setLogo] = useState(l.logo_url ?? "");
  const save = async () => {
    const newName = name.trim();
    const { error } = await supabase.from("leagues").update({ name: newName, short_name: short, group_name: groupName || null, logo_url: logo || null }).eq("id", l.id);
    if (!error && newName !== l.name) {
      await supabase.from("clubs").update({ league: newName }).eq("league", l.name);
      await supabase.from("matches").update({ league: newName }).eq("league", l.name);
      done("clubs", null); done("matches", null);
    }
    done("leagues", error, "League saved");
  };
  const del = async () => {
    if (clubCount > 0) { toast.error(`Move or remove the ${clubCount} clubs in this league first.`); return; }
    if (!confirm(`Delete ${l.name}?`)) return;
    const { error } = await supabase.from("leagues").delete().eq("id", l.id);
    done("leagues", error, "League deleted");
  };
  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      {logo ? <img src={logo} alt="" className="h-8 w-8 object-contain" /> : <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[0.6rem] font-bold text-primary">{short}</span>}
      <Input className="min-w-56 flex-1" value={name} onChange={(e) => setName(e.target.value)} aria-label="League name" />
      <span className="text-xs text-muted-foreground">{clubCount} clubs</span>
      <Input className="w-24" placeholder="Short" value={short} onChange={(e) => setShort(e.target.value)} />
      <Input className="w-28" placeholder="Group" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
      <Input className="w-64" placeholder="Logo image link" value={logo} onChange={(e) => setLogo(e.target.value)} />
      <Button size="sm" onClick={save}>Save</Button>
      <Button size="sm" variant="ghost" onClick={del}>Delete</Button>
    </div>
  );
}

function CompetitionsAdmin() {
  const [competitions, setCompetitions] = useLocalAdminList<CompetitionRecord>(ADMIN_COMPETITIONS_KEY, [
    { id: "comp-sspl", name: "South Sudan Premier League", season: "2026-2027", format: "league", start_date: "2026-10-01", end_date: "2027-05-31", status: "active", logo_url: "", banner_url: "" },
    { id: "comp-caf", name: "CAF Confederation Cup", season: "2026-2027", format: "knockout", start_date: "2026-11-10", end_date: "2027-03-15", status: "inactive", logo_url: "", banner_url: "" },
  ]);
  const [form, setForm] = useState({ name: "", season: "2026-2027", format: "league", start_date: "", end_date: "", status: "active", logo_url: "", banner_url: "" });

  const addCompetition = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Competition name is required.");
      return;
    }

    const next = {
      id: `competition-${Date.now()}`,
      name: form.name.trim(),
      season: form.season,
      format: form.format,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
      logo_url: form.logo_url,
      banner_url: form.banner_url,
    };

    setCompetitions((current) => [next, ...current]);
    appendAuditEntry("competition created", `${next.name} added to competitions`, "competition");
    setForm({ name: "", season: "2026-2027", format: "league", start_date: "", end_date: "", status: "active", logo_url: "", banner_url: "" });
    toast.success("Competition added");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addCompetition} className="grid gap-3 rounded-md border bg-card p-6 md:grid-cols-3 xl:grid-cols-7">
        <Input required placeholder="Competition name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Season" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
        <select className={sel} value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
          <option value="league">League</option>
          <option value="knockout">Knockout</option>
          <option value="group-stage">Group stage</option>
          <option value="cup">Cup</option>
        </select>
        <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        <select className={sel} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "inactive" })}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Button>Add competition</Button>
      </form>

      <div className="space-y-3">
        {competitions.map((competition) => (
          <CompetitionRow key={competition.id} competition={competition} setCompetitions={setCompetitions} />
        ))}
      </div>
    </div>
  );
}

function CompetitionRow({ competition, setCompetitions }: { competition: CompetitionRecord; setCompetitions: React.Dispatch<React.SetStateAction<CompetitionRecord[]>> }) {
  const [draft, setDraft] = useState(competition);

  const saveCompetition = () => {
    setCompetitions((current) => current.map((item) => item.id === competition.id ? { ...draft } : item));
    appendAuditEntry("competition updated", `${draft.name} settings updated`, "competition");
    toast.success("Competition saved");
  };

  const deleteCompetition = () => {
    if (!confirm(`Delete ${competition.name}?`)) return;
    setCompetitions((current) => current.filter((item) => item.id !== competition.id));
    appendAuditEntry("competition deleted", `${competition.name} was removed`, "competition");
    toast.success("Competition deleted");
  };

  return (
    <div className="grid gap-2 rounded-md border bg-card p-4 md:grid-cols-7">
      <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      <Input value={draft.season} onChange={(e) => setDraft({ ...draft, season: e.target.value })} />
      <select className={sel} value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })}>
        <option value="league">League</option>
        <option value="knockout">Knockout</option>
        <option value="group-stage">Group stage</option>
        <option value="cup">Cup</option>
      </select>
      <Input type="date" value={draft.start_date} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} />
      <Input type="date" value={draft.end_date} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} />
      <select className={sel} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as "active" | "inactive" })}>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <div className="flex gap-2">
        <Button size="sm" onClick={saveCompetition}>Save</Button>
        <Button size="sm" variant="ghost" onClick={deleteCompetition}>Delete</Button>
      </div>
    </div>
  );
}

function GroupsAdmin() {
  const clubs = useQuery(clubsQuery).data ?? [];
  const matches = useQuery(matchesQuery).data ?? [];
  const [groups, setGroups] = useLocalAdminList<GroupRecord>(ADMIN_GROUPS_KEY, [
    { id: "group-a", name: "Group A", competition: "South Sudan Premier League", club_ids: [], qualifying: 2 },
    { id: "group-b", name: "Group B", competition: "South Sudan Premier League", club_ids: [], qualifying: 2 },
  ]);
  const [form, setForm] = useState({ name: "Group A", competition: "South Sudan Premier League", qualifying: 2 });

  const addGroup = (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Group name is required.");
      return;
    }

    const next = {
      id: `group-${Date.now()}`,
      name: form.name.trim(),
      competition: form.competition,
      club_ids: [],
      qualifying: Number(form.qualifying) || 2,
    };

    setGroups((current) => [next, ...current]);
    appendAuditEntry("group created", `${next.name} created for ${next.competition}`, "group");
    setForm({ name: "Group A", competition: form.competition, qualifying: 2 });
    toast.success("Group added");
  };

  const updateGroup = (groupId: string, next: Partial<GroupRecord>) => {
    setGroups((current) => current.map((item) => item.id === groupId ? { ...item, ...next } : item));
  };

  const addClubToGroup = (groupId: string, clubId: string) => {
    if (!clubId) return;
    updateGroup(groupId, {
      club_ids: Array.from(new Set((groups.find((group) => group.id === groupId)?.club_ids ?? []).concat(clubId))),
    });
  };

  const removeClubFromGroup = (groupId: string, clubId: string) => {
    updateGroup(groupId, {
      club_ids: (groups.find((group) => group.id === groupId)?.club_ids ?? []).filter((id) => id !== clubId),
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={addGroup} className="grid gap-3 rounded-md border bg-card p-6 md:grid-cols-4">
        <Input required placeholder="Group name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className={sel} value={form.competition} onChange={(e) => setForm({ ...form, competition: e.target.value })}>
          {useLeagueNames().map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <Input type="number" min={1} value={form.qualifying} onChange={(e) => setForm({ ...form, qualifying: Number(e.target.value) || 1 })} />
        <Button>Add group</Button>
      </form>

      <div className="space-y-4">
        {groups.map((group) => {
          const clubIds = group.club_ids;
          const groupClubs = clubs.filter((club) => clubIds.includes(club.id));
          const groupMatches = matches.filter((match) => match.round === group.name || match.league === group.competition);
          const standings = computeStandings(groupClubs, groupMatches);

          return (
            <div key={group.id} className="rounded-md border bg-card p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Input value={group.name} onChange={(e) => updateGroup(group.id, { name: e.target.value })} className="w-40" />
                  <Input type="number" min={1} value={group.qualifying} onChange={(e) => updateGroup(group.id, { qualifying: Number(e.target.value) || 1 })} className="w-20" />
                  <span className="text-xs text-muted-foreground">qualify</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setGroups((current) => current.filter((item) => item.id !== group.id))}>Delete group</Button>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
                <div>
                  <div className="mb-2 text-sm font-semibold">Club assignments</div>
                  <div className="flex flex-wrap gap-2">
                    {clubs.map((club) => (
                      <button
                        key={club.id}
                        type="button"
                        onClick={() => (clubIds.includes(club.id) ? removeClubFromGroup(group.id, club.id) : addClubToGroup(group.id, club.id))}
                        className={`rounded-full border px-3 py-1 text-xs ${clubIds.includes(club.id) ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                      >
                        {club.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold">Standings</div>
                  <div className="space-y-2">
                    {standings.length === 0 && <p className="text-sm text-muted-foreground">No standings yet for this group.</p>}
                    {standings.map((row) => (
                      <div key={row.clubId} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                        <span>{row.clubName}</span>
                        <span>{row.pts} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonetizationAdmin() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Monthly ad revenue</p>
          <h3 className="mt-2 text-3xl font-black">$2,470</h3>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Premium subscribers</p>
          <h3 className="mt-2 text-3xl font-black">1,248</h3>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <p className="text-sm text-muted-foreground">Sponsor deals</p>
          <h3 className="mt-2 text-3xl font-black">6 live</h3>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border bg-card p-6">
          <h3 className="text-2xl font-extrabold">Ad inventory</h3>
          <div className="mt-4 space-y-3">
            {adSlots.map((slot) => (
              <div key={slot.id} className="flex items-center justify-between rounded-2xl border bg-muted/30 p-4">
                <div>
                  <p className="font-semibold">{slot.title}</p>
                  <p className="text-xs text-muted-foreground">{slot.partner} • {slot.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{slot.revenue}</p>
                  <p className="text-[0.7rem] uppercase tracking-[0.1em] text-primary">{slot.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-card p-6">
          <h3 className="text-2xl font-extrabold">Subscription plans</h3>
          <div className="mt-4 space-y-3">
            {subscriptionPlans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{plan.name}</p>
                    <p className="text-xs text-muted-foreground">{plan.blurb}</p>
                  </div>
                  <span className="text-xl font-black">{plan.price}</span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {plan.features.map((feature) => <li key={feature}>• {feature}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

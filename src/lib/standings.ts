export type ClubStats = {
  id: string;
  name: string;
  short_name: string;
  start_played: number;
  start_won: number;
  start_drawn: number;
  start_lost: number;
  start_gf: number;
  start_ga: number;
};
export type MatchResult = {
  home_club_id: string;
  away_club_id: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
};
export type Row = { id: string; name: string; short_name: string; p: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; pts: number };

/** Starting stats + every finished match. Win 3, draw 1. GD = GF − GA. */
export function computeStandings(clubs: ClubStats[], matches: MatchResult[]): Row[] {
  const rows = new Map<string, Row>();
  for (const c of clubs) {
    rows.set(c.id, { id: c.id, name: c.name, short_name: c.short_name, p: c.start_played, w: c.start_won, d: c.start_drawn, l: c.start_lost, gf: c.start_gf, ga: c.start_ga, gd: 0, pts: 0 });
  }
  for (const m of matches) {
    if (m.status !== "finished" || m.home_score == null || m.away_score == null) continue;
    const h = rows.get(m.home_club_id);
    const a = rows.get(m.away_club_id);
    if (!h || !a) continue;
    h.p++; a.p++;
    h.gf += m.home_score; h.ga += m.away_score;
    a.gf += m.away_score; a.ga += m.home_score;
    if (m.home_score > m.away_score) { h.w++; a.l++; }
    else if (m.home_score < m.away_score) { a.w++; h.l++; }
    else { h.d++; a.d++; }
  }
  const list = [...rows.values()].map((r) => ({ ...r, gd: r.gf - r.ga, pts: r.w * 3 + r.d }));
  return list.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name));
}

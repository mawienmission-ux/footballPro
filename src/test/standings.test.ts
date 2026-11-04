import { describe, expect, it } from "vitest";
import { computeStandings } from "@/lib/standings";

const club = (id: string, extra = {}) => ({ id, name: id, short_name: id, start_played: 0, start_won: 0, start_drawn: 0, start_lost: 0, start_gf: 0, start_ga: 0, ...extra });

describe("computeStandings", () => {
  it("gives 3 points for a win and 1 for a draw", () => {
    const rows = computeStandings([club("A"), club("B")], [
      { home_club_id: "A", away_club_id: "B", status: "finished", home_score: 2, away_score: 0 },
      { home_club_id: "B", away_club_id: "A", status: "finished", home_score: 1, away_score: 1 },
    ]);
    expect(rows[0]).toMatchObject({ id: "A", pts: 4, gd: 2 });
    expect(rows[1]).toMatchObject({ id: "B", pts: 1, gd: -2 });
  });
  it("adds finished matches on top of starting stats and ignores unfinished", () => {
    const rows = computeStandings([club("A", { start_played: 5, start_won: 3, start_gf: 9, start_ga: 4 }), club("B")], [
      { home_club_id: "A", away_club_id: "B", status: "scheduled", home_score: null, away_score: null },
    ]);
    expect(rows[0]).toMatchObject({ p: 5, pts: 9, gd: 5 });
  });
});

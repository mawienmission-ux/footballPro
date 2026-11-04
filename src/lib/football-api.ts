import { listLocalRows } from "@/lib/local-store";
import { supabase } from "@/integrations/supabase/client";

export type LiveScoreItem = {
  id: string;
  league: string;
  homeClubId: string | null;
  awayClubId: string | null;
  homeName: string;
  awayName: string;
  kickoff: string;
  venue: string;
  status: "scheduled" | "live" | "finished";
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  round: string;
};

function getEnvValue(name: string) {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = import.meta.env[name];
    if (value) return value;
  }

  if (typeof process !== "undefined") {
    return process.env[name];
  }

  return undefined;
}

function getFallbackLiveScores(): LiveScoreItem[] {
  const clubs = listLocalRows("clubs");
  const matches = listLocalRows("matches");

  return matches.slice(0, 6).map((match) => {
    const homeClub = clubs.find((club) => club.id === match.home_club_id);
    const awayClub = clubs.find((club) => club.id === match.away_club_id);

    return {
      id: match.id ?? `live-${Math.random().toString(36).slice(2)}`,
      league: match.league ?? "South Sudan Premier League",
      homeClubId: match.home_club_id ?? null,
      awayClubId: match.away_club_id ?? null,
      homeName: homeClub?.name ?? "Home Club",
      awayName: awayClub?.name ?? "Away Club",
      kickoff: match.kickoff ?? new Date().toISOString(),
      venue: match.venue ?? "Match Centre",
      status: match.status ?? "scheduled",
      minute: typeof match.minute === "number" ? match.minute : null,
      homeScore: match.home_score ?? null,
      awayScore: match.away_score ?? null,
      round: match.round ?? "Round 1",
    };
  });
}

export async function fetchLiveScores(): Promise<LiveScoreItem[]> {
  const apiKey = getEnvValue("VITE_FOOTBALL_API_KEY") || getEnvValue("FOOTBALL_API_KEY");
  const apiHost = getEnvValue("VITE_FOOTBALL_API_HOST") || getEnvValue("FOOTBALL_API_HOST");
  const apiUrl = getEnvValue("VITE_FOOTBALL_API_URL") || getEnvValue("FOOTBALL_API_URL");

  if (!apiKey || !apiHost || !apiUrl) {
    return getFallbackLiveScores();
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/+$/, "")}/fixtures?live=all`, {
      headers: {
        "x-rapidapi-host": apiHost,
        "x-rapidapi-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return getFallbackLiveScores();
    }

    const payload = await response.json();
    const fixtures = Array.isArray(payload?.response) ? payload.response : [];

    return fixtures.slice(0, 6).map((fixture: any, index: number) => ({
      id: fixture?.fixture?.id?.toString() ?? `api-${index}`,
      league: fixture?.league?.name ?? "League",
      homeClubId: null,
      awayClubId: null,
      homeName: fixture?.teams?.home?.name ?? "Home Club",
      awayName: fixture?.teams?.away?.name ?? "Away Club",
      kickoff: fixture?.fixture?.date ?? new Date().toISOString(),
      venue: fixture?.fixture?.venue?.name ?? "Stadium",
      status: fixture?.fixture?.status?.short === "NS" ? "scheduled" : fixture?.fixture?.status?.short === "FT" ? "finished" : "live",
      minute: fixture?.goals?.home != null || fixture?.goals?.away != null ? fixture?.score?.fixture?.elapsed ?? null : null,
      homeScore: fixture?.goals?.home ?? null,
      awayScore: fixture?.goals?.away ?? null,
      round: fixture?.league?.round ?? "League",
    }));
  } catch {
    return getFallbackLiveScores();
  }
}

export async function getClubProfile(clubId: string) {
  const { data } = await supabase.from("clubs").select("*").eq("id", clubId).maybeSingle();
  if (data) return data;

  return listLocalRows("clubs").find((club) => club.id === clubId) ?? null;
}

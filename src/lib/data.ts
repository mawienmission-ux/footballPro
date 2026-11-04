import { useEffect, useState } from "react";
import { queryOptions } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { hasSupabaseConfig, LOCAL_ADMIN_EMAIL, supabase } from "@/integrations/supabase/client";
import { fetchLiveScores } from "@/lib/football-api";

export const SSPL = "South Sudan Premier League";
export const LEAGUES = [
  SSPL,
  "Juba Local Football Association (Konyokonyo League) First Division",
  "Juba Local Football Association Second Division",
  "Juba Local Football Association Third Division",
  "Central Equatoria State League (Juba)",
  "Eastern Equatoria State League (Torit)",
  "Jonglei State League (Bor)",
  "Lakes State League (Rumbek)",
  "Northern Bahr el Ghazal State League (Aweil)",
  "Unity State League (Bentiu)",
  "Upper Nile State League (Malakal)",
  "Warrap State League (Kuajok)",
  "Western Bahr el Ghazal State League (Wau)",
  "Western Equatoria State League (Yambio)",
  "Yei Local Football Association",
];

export const clubsQuery = queryOptions({
  queryKey: ["clubs"],
  queryFn: async () => {
    const { data, error } = await supabase.from("clubs").select("*").order("sort_order").order("name");
    if (error) throw error;
    return data;
  },
});
export const matchesQuery = queryOptions({
  queryKey: ["matches"],
  queryFn: async () => {
    const { data, error } = await supabase.from("matches").select("*").order("kickoff");
    if (error) throw error;
    return data;
  },
});
export const newsQuery = queryOptions({
  queryKey: ["news"],
  queryFn: async () => {
    const { data, error } = await supabase.from("news").select("*").order("published_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});

export const liveScoresQuery = queryOptions({
  queryKey: ["live-scores"],
  queryFn: async () => fetchLiveScores(),
});

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const check = async (s: Session | null) => {
      setSession(s);
      if (s) {
        const isLocalDevFallback = !hasSupabaseConfig();
        if (isLocalDevFallback) {
          setIsAdmin(s.user.email?.toLowerCase() === LOCAL_ADMIN_EMAIL);
        } else {
          const { data } = await supabase.rpc("has_role", { _user_id: s.user.id, _role: "admin" });
          setIsAdmin(!!data);
        }
      } else setIsAdmin(false);
      setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") check(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { session, isAdmin, ready };
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export const leaguesQuery = queryOptions({
  queryKey: ["leagues"],
  queryFn: async () => {
    const { data, error } = await supabase.from("leagues").select("*").order("sort_order").order("name");
    if (error) throw error;
    return data;
  },
});

export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

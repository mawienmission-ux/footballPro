import { describe, expect, it, vi } from "vitest";
import { supabase } from "@/integrations/supabase/client";

describe("supabase client fallback", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns seeded local data instead of throwing when env vars are missing", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    const query = await supabase.from("clubs").select("*").order("sort_order").order("name");

    expect(query.error).toBeNull();
    expect(Array.isArray(query.data)).toBe(true);
    expect(query.data.length).toBeGreaterThan(0);
    expect(query.data[0]).toMatchObject({ name: expect.any(String) });

    await expect(supabase.auth.getSession()).resolves.toMatchObject({
      data: { session: null },
      error: null,
    });

    vi.unstubAllEnvs();
  });

  it("creates a working local admin account when Supabase is not configured", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    const signup = await supabase.auth.signUp({
      email: "owner@example.com",
      password: "P@ssw0rd123",
    });

    expect(signup.error).toBeNull();
    expect(signup.data.user?.email).toBe("owner@example.com");

    const login = await supabase.auth.signInWithPassword({
      email: "owner@example.com",
      password: "P@ssw0rd123",
    });

    expect(login.error).toBeNull();
    expect(login.data.user?.email).toBe("owner@example.com");

    const hasRole = await supabase.rpc("has_role", { _user_id: login.data.user!.id, _role: "admin" });
    expect(hasRole.error).toBeNull();
    expect(hasRole.data).toBe(true);

    vi.unstubAllEnvs();
  });
});

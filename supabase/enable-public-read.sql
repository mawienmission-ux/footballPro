-- Run this in the Supabase SQL editor to open public read access if RLS is off.

ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leagues ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.clubs, public.matches, public.news, public.leagues TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clubs, public.matches, public.news, public.leagues TO authenticated;
GRANT ALL ON public.clubs, public.matches, public.news, public.leagues TO service_role;

CREATE POLICY IF NOT EXISTS "Public read clubs"
  ON public.clubs FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins manage clubs"
  ON public.clubs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Public read matches"
  ON public.matches FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins manage matches"
  ON public.matches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Public read news"
  ON public.news FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins manage news"
  ON public.news FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY IF NOT EXISTS "Public read leagues"
  ON public.leagues FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admins manage leagues"
  ON public.leagues FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Optional: allow public access to media bucket
CREATE POLICY IF NOT EXISTS "Public read media"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');

create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- First account to sign up becomes admin
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  league text not null default 'South Sudan Premier League',
  name text not null,
  short_name text not null default '',
  city text not null default '',
  logo_url text,
  sort_order int not null default 0,
  start_played int not null default 0,
  start_won int not null default 0,
  start_drawn int not null default 0,
  start_lost int not null default 0,
  start_gf int not null default 0,
  start_ga int not null default 0,
  created_at timestamptz not null default now()
);
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  league text not null default 'South Sudan Premier League',
  home_club_id uuid not null references public.clubs(id) on delete cascade,
  away_club_id uuid not null references public.clubs(id) on delete cascade,
  kickoff timestamptz not null,
  venue text not null default '',
  status text not null default 'scheduled',
  home_score int,
  away_score int,
  created_at timestamptz not null default now()
);
create table public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'League News',
  body text not null default '',
  published_at timestamptz not null default now()
);

grant select on public.clubs, public.matches, public.news to anon;
grant select, insert, update, delete on public.clubs, public.matches, public.news to authenticated;
grant all on public.clubs, public.matches, public.news to service_role;
alter table public.clubs enable row level security;
alter table public.matches enable row level security;
alter table public.news enable row level security;

create policy "Public read clubs" on public.clubs for select to anon, authenticated using (true);
create policy "Admins manage clubs" on public.clubs for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Public read matches" on public.matches for select to anon, authenticated using (true);
create policy "Admins manage matches" on public.matches for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Public read news" on public.news for select to anon, authenticated using (true);
create policy "Admins manage news" on public.news for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.clubs (name, short_name, sort_order)
select 'Club ' || lpad(g::text,2,'0') || ' — update name', 'C' || lpad(g::text,2,'0'), g from generate_series(1,14) g;

insert into public.news (title, category, body) values
('Welcome to M.MissionFootball','Platform News','Your home for South Sudan Premier League football, local associations, clubs, players, fixtures and results.'),
('League and club information','League News','Administrators can add verified club names, official logos, fixtures and results through the dashboard.'),
('Local football matters','Community Football','Follow football associations in Juba, Yei, Yambio, Rumbek, Aweil and Wau.');
create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text not null default '',
  logo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.leagues to anon;
grant select, insert, update, delete on public.leagues to authenticated;
grant all on public.leagues to service_role;
alter table public.leagues enable row level security;
create policy "Public read leagues" on public.leagues for select to anon, authenticated using (true);
create policy "Admins manage leagues" on public.leagues for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.leagues (name, short_name, sort_order) values
('South Sudan Premier League','SSPL',1),
('Juba Local Football Association (Konyokonyo League) First Division','JFA1',2),
('Juba Local Football Association Second Division','JFA2',3),
('Juba Local Football Association Third Division','JFA3',4),
('Central Equatoria State League (Juba)','CES',5),
('Eastern Equatoria State League (Torit)','EES',6),
('Jonglei State League (Bor)','JSL',7),
('Lakes State League (Rumbek)','LSL',8),
('Northern Bahr el Ghazal State League (Aweil)','NBG',9),
('Unity State League (Bentiu)','USL',10),
('Upper Nile State League (Malakal)','UNS',11),
('Warrap State League (Kuajok)','WSL',12),
('Western Bahr el Ghazal State League (Wau)','WBG',13),
('Western Equatoria State League (Yambio)','WES',14),
('Yei Local Football Association','YFA',15);

alter table public.news add column image_url text;
alter table public.news add column source text not null default 'M.MissionFootball';
alter table public.matches add column minute int;

create policy "Public read media" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "Admins upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "Admins update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
create policy "Admins delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role(auth.uid(),'admin'));
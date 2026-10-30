-- Módulo de Contenido (Connect Studio). BORRADOR: no se ha aplicado a ningún proyecto de Supabase.
-- Pensado para unirse a Connectv5 (Next + Supabase). Todo cuelga de auth.users; sin dependencias de otras tablas.
-- Regla central: solo el psicólogo dueño puede APROBAR una pieza; el equipo (editor) prepara, no aprueba.

create table public.studio_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  dna jsonb not null default '{}'::jsonb,
  kit_id text not null default 'minimal-clinico',
  slug text unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  booking_base text,
  plan_round int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Personas del equipo con permiso para preparar contenido en nombre de un psicólogo.
create table public.studio_team_access (
  owner_id uuid not null references auth.users on delete cascade,
  member_id uuid not null references auth.users on delete cascade,
  role text not null default 'editor' check (role in ('editor')),
  created_at timestamptz not null default now(),
  primary key (owner_id, member_id),
  check (owner_id <> member_id)
);

create table public.studio_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,      -- psicólogo dueño
  created_by uuid references auth.users default auth.uid(),
  format text not null,
  ratio text not null check (ratio in ('story', 'feed-square', 'feed-portrait')),
  kit_id text not null,
  fields jsonb not null default '{}'::jsonb,
  extras jsonb not null default '[]'::jsonb,
  caption text check (char_length(caption) <= 2200),
  topic text,
  pillar text check (pillar in ('psicoeducacion', 'desmitificacion', 'sintomas')),
  plan_id text,
  status text not null default 'borrador' check (status in ('borrador', 'aprobado', 'programado', 'publicado')),
  approved_at timestamptz,
  approved_by uuid references auth.users,
  scheduled_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_id)
);
create index studio_posts_owner_status_idx on public.studio_posts (user_id, status);
create index studio_posts_owner_date_idx on public.studio_posts (user_id, scheduled_at);

create table public.studio_post_events (
  id bigint generated always as identity primary key,
  post_id uuid not null references public.studio_posts on delete cascade,
  user_id uuid not null references auth.users on delete cascade,      -- psicólogo dueño
  actor_id uuid default auth.uid(),
  event text not null check (event in ('creada', 'editada', 'aprobada', 'aprobacion_revocada', 'programada', 'publicada')),
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index studio_post_events_post_idx on public.studio_post_events (post_id, created_at);

-- ── Acceso ──
create or replace function public.studio_can_access(owner uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select owner = (select auth.uid())
      or exists (select 1 from public.studio_team_access t where t.owner_id = owner and t.member_id = (select auth.uid()));
$$;
revoke execute on function public.studio_can_access(uuid) from public, anon;
grant execute on function public.studio_can_access(uuid) to authenticated;

alter table public.studio_profiles enable row level security;
alter table public.studio_team_access enable row level security;
alter table public.studio_posts enable row level security;
alter table public.studio_post_events enable row level security;

create policy profiles_rw on public.studio_profiles for all to authenticated
  using (public.studio_can_access(user_id)) with check (public.studio_can_access(user_id));
-- Solo el psicólogo administra a su equipo; el equipo puede ver que tiene acceso.
create policy team_owner_rw on public.studio_team_access for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy team_member_read on public.studio_team_access for select to authenticated
  using (member_id = (select auth.uid()));
create policy posts_rw on public.studio_posts for all to authenticated
  using (public.studio_can_access(user_id)) with check (public.studio_can_access(user_id));
create policy events_read on public.studio_post_events for select to authenticated
  using (public.studio_can_access(user_id));
-- Los eventos los escribe solo el trigger (sin política de insert para usuarios).

-- ── Reglas del flujo (borrador → aprobado → programado → publicado) ──
create or replace function public.studio_posts_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
  content_changed boolean;
begin
  if tg_op = 'INSERT' then
    -- Quien crea una pieza no puede nacer aprobada, ni siquiera el dueño: se aprueba después de verla.
    new.status := 'borrador'; new.approved_at := null; new.approved_by := null;
    return new;
  end if;

  content_changed := (new.fields, new.extras, new.caption, new.format, new.ratio, new.kit_id)
                     is distinct from (old.fields, old.extras, old.caption, old.format, old.ratio, old.kit_id);

  -- Nadie puede escribir la aprobación a mano: solo se obtiene pasando a 'aprobado' siendo el dueño.
  if new.approved_at is distinct from old.approved_at or new.approved_by is distinct from old.approved_by then
    if not (new.status = 'aprobado' and old.status <> 'aprobado') then
      new.approved_at := old.approved_at; new.approved_by := old.approved_by;
    end if;
  end if;

  if new.status = 'aprobado' and old.status <> 'aprobado' then
    if me is distinct from new.user_id then
      raise exception 'Solo el psicólogo dueño puede aprobar una pieza' using errcode = '42501';
    end if;
    new.approved_at := now(); new.approved_by := me;
  elsif new.status in ('programado', 'publicado') and new.approved_at is null then
    raise exception 'La pieza debe estar aprobada antes de programarse o publicarse' using errcode = '23514';
  end if;

  if new.status = 'programado' and new.scheduled_at is null then
    raise exception 'Una pieza programada necesita fecha' using errcode = '23514';
  end if;

  -- Si cambia el contenido de una pieza aprobada y aún no publicada, la aprobación deja de valer.
  if content_changed and old.approved_at is not null and old.status <> 'publicado' and new.status = old.status then
    new.status := 'borrador'; new.approved_at := null; new.approved_by := null;
  end if;
  -- Volver a borrador a propósito también quita la aprobación.
  if new.status = 'borrador' then new.approved_at := null; new.approved_by := null; end if;

  new.updated_at := now();
  return new;
end $$;

create trigger studio_posts_guard_trg before insert or update on public.studio_posts
  for each row execute function public.studio_posts_guard();

create or replace function public.studio_posts_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare ev text;
begin
  if tg_op = 'INSERT' then ev := 'creada';
  elsif new.status = 'borrador' and old.status = 'aprobado' then ev := 'aprobacion_revocada';
  elsif new.status = 'borrador' and old.approved_at is not null then ev := 'aprobacion_revocada';
  elsif new.status is distinct from old.status then
    ev := case new.status when 'aprobado' then 'aprobada' when 'programado' then 'programada' when 'publicado' then 'publicada' else null end;
  elsif (new.fields, new.extras, new.caption) is distinct from (old.fields, old.extras, old.caption) then ev := 'editada';
  end if;
  if ev is not null then
    insert into public.studio_post_events (post_id, user_id, event, meta) values (new.id, new.user_id, ev, jsonb_build_object('status', new.status));
  end if;
  return new;
end $$;

create trigger studio_posts_log_trg after insert or update on public.studio_posts
  for each row execute function public.studio_posts_log();

-- Las funciones de trigger no deben poder llamarse por la API.
revoke execute on function public.studio_posts_guard() from public, anon, authenticated;
revoke execute on function public.studio_posts_log() from public, anon, authenticated;

-- =============================================================================
-- DealStartups - esquema de base de datos (Supabase / PostgreSQL)
-- Ejecutar en el SQL editor de Supabase o con `supabase db push`.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- users (perfil publico). La contrasena la gestiona Supabase Auth en auth.users,
-- por eso este perfil no almacena credenciales.
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       varchar(255) not null unique,
  name        varchar(120) not null,
  bio         text,
  created_at  timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- deals
-- -----------------------------------------------------------------------------
create table if not exists public.deals (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users (id) on delete cascade,
  title          varchar(140) not null,
  description    text not null,
  deal_type      varchar(40) not null check (deal_type in (
                   'busco_socio', 'vendo_empresa', 'busco_inversor',
                   'busco_colaborador', 'busco_asesor', 'partnership')),
  contact_email  varchar(255) not null,
  image_url      text,
  current_bid    numeric(10,2) not null default 0 check (current_bid >= 0),
  -- 'pending' = creado pero esperando confirmacion de pago (webhook de Stripe)
  status         varchar(20) not null default 'active'
                   check (status in ('pending', 'active', 'closed', 'archived')),
  week_number    int not null default 0,
  position       int,
  views_count    int not null default 0,
  contacts_count int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deal_closed    boolean not null default false,
  closed_date    timestamptz
);

create index if not exists deals_ranking_idx
  on public.deals (current_bid desc, updated_at desc) where status = 'active';
create index if not exists deals_user_idx on public.deals (user_id, created_at desc);
create index if not exists deals_type_idx on public.deals (deal_type);
create index if not exists deals_created_idx on public.deals (created_at desc);

-- -----------------------------------------------------------------------------
-- bid_history
-- -----------------------------------------------------------------------------
create table if not exists public.bid_history (
  id             uuid primary key default gen_random_uuid(),
  deal_id        uuid not null references public.deals (id) on delete cascade,
  user_id        uuid not null references public.users (id) on delete cascade,
  amount         numeric(10,2) not null check (amount >= 0),
  payment_id     varchar(255) unique,
  payment_status varchar(20) not null default 'pending'
                   check (payment_status in ('pending', 'succeeded', 'failed', 'free')),
  kind           varchar(20) not null default 'initial'
                   check (kind in ('initial', 'rebid')),
  timestamp      timestamptz not null default now()
);

create index if not exists bid_history_deal_idx on public.bid_history (deal_id, timestamp desc);
create index if not exists bid_history_user_idx on public.bid_history (user_id, timestamp desc);

-- -----------------------------------------------------------------------------
-- deal_contacts
-- -----------------------------------------------------------------------------
create table if not exists public.deal_contacts (
  id            uuid primary key default gen_random_uuid(),
  deal_id       uuid not null references public.deals (id) on delete cascade,
  visitor_id    uuid references public.users (id) on delete set null,
  visitor_email varchar(255) not null,
  visitor_name  varchar(120) not null,
  message       text not null,
  contacted_at  timestamptz not null default now()
);

create index if not exists deal_contacts_deal_idx on public.deal_contacts (deal_id, contacted_at desc);

-- -----------------------------------------------------------------------------
-- Vista publica de ranking: calcula la posicion y expone solo campos publicos
-- (el email del publicador nunca sale por aqui).
-- -----------------------------------------------------------------------------
create or replace view public.ranked_deals as
select
  d.id,
  d.user_id,
  d.title,
  d.description,
  d.deal_type,
  d.image_url,
  d.current_bid,
  d.status,
  d.week_number,
  d.views_count,
  d.contacts_count,
  d.created_at,
  d.updated_at,
  d.deal_closed,
  d.closed_date,
  u.name as author_name,
  case
    when d.status = 'active' and d.current_bid > 0
      then row_number() over (
             partition by (d.status = 'active' and d.current_bid > 0)
             order by d.current_bid desc, d.updated_at desc
           )::int
    else null
  end as position
from public.deals d
join public.users u on u.id = d.user_id
where d.status in ('active', 'closed');

-- -----------------------------------------------------------------------------
-- Funciones
-- -----------------------------------------------------------------------------

-- Perfil automatico al registrarse
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Contador de visitas
create or replace function public.increment_deal_views(p_deal_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.deals set views_count = views_count + 1 where id = p_deal_id;
$$;

grant execute on function public.increment_deal_views(uuid) to anon, authenticated;

-- Reset semanal: actualiza week_number y archiva deals antiguos
create or replace function public.weekly_reset(p_week int, p_archive_weeks int default 8)
returns table (updated_count int, archived_count int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
  v_archived int;
begin
  update public.deals
     set status = 'archived'
   where status = 'active'
     and created_at < now() - (p_archive_weeks || ' weeks')::interval;
  get diagnostics v_archived = row_count;

  update public.deals
     set week_number = p_week
   where status in ('active', 'pending');
  get diagnostics v_updated = row_count;

  return query select v_updated, v_archived;
end;
$$;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.deals enable row level security;
alter table public.bid_history enable row level security;
alter table public.deal_contacts enable row level security;

-- users: cada usuario solo lee/edita su propia fila (los nombres publicos se
-- sirven desde la vista ranked_deals).
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- deals: lectura publica de los publicados; escritura solo del propietario.
drop policy if exists "deals_select_public" on public.deals;
create policy "deals_select_public" on public.deals
  for select using (status in ('active', 'closed') or auth.uid() = user_id);

drop policy if exists "deals_insert_own" on public.deals;
create policy "deals_insert_own" on public.deals
  for insert with check (auth.uid() = user_id);

drop policy if exists "deals_update_own" on public.deals;
create policy "deals_update_own" on public.deals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- bid_history: el usuario ve sus pujas. La escritura pasa por el service role.
drop policy if exists "bids_select_own" on public.bid_history;
create policy "bids_select_own" on public.bid_history
  for select using (auth.uid() = user_id);

-- deal_contacts: solo el propietario del deal lee los mensajes.
drop policy if exists "contacts_select_owner" on public.deal_contacts;
create policy "contacts_select_owner" on public.deal_contacts
  for select using (
    exists (select 1 from public.deals d where d.id = deal_id and d.user_id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- Storage: bucket publico para logos de deals
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('deal-images', 'deal-images', true)
on conflict (id) do nothing;

drop policy if exists "deal_images_public_read" on storage.objects;
create policy "deal_images_public_read" on storage.objects
  for select using (bucket_id = 'deal-images');

drop policy if exists "deal_images_auth_write" on storage.objects;
create policy "deal_images_auth_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'deal-images');

-- -----------------------------------------------------------------------------
-- Permisos explicitos sobre la vista publica
-- -----------------------------------------------------------------------------
grant select on public.ranked_deals to anon, authenticated;

create extension if not exists pgcrypto;

do $$ begin
  create type raffle_number_status as enum ('available','reserved','paid');
exception when duplicate_object then null; end $$;

create table if not exists raffles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  price_cents integer not null,
  value_cents integer,
  total_numbers integer not null,
  reserve_minutes integer not null default 30 check (reserve_minutes between 1 and 1440),
  whatsapp text,
  closes_at timestamptz,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id) on delete cascade,
  name text not null,
  whatsapp text not null,
  referral text,
  created_at timestamptz not null default now()
);

create table if not exists raffle_numbers (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id) on delete cascade,
  number integer not null,
  status raffle_number_status not null default 'available',
  reserved_until timestamptz,
  participant_id uuid references participants(id) on delete set null,
  unique(raffle_id,number)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  amount_cents integer not null,
  reference text,
  status text not null default 'pending',
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists raffle_numbers_lookup on raffle_numbers(raffle_id,status);
create index if not exists participants_raffle on participants(raffle_id);

alter table raffles enable row level security;
alter table raffle_numbers enable row level security;
alter table participants enable row level security;
alter table payments enable row level security;

drop policy if exists "public read raffle numbers" on raffle_numbers;

insert into raffles(slug,title,description,price_cents,value_cents,total_numbers,reserve_minutes,whatsapp,closes_at,status)
values ('dyson-airwrap','Gánate una Dyson Airwrap Complete Long','Equipo nuevo con estuche y accesorios.',25000,1500000,50,30,'5214770000000','2026-09-15T20:00:00-06:00','open')
on conflict (slug) do update set
  title=excluded.title, description=excluded.description, price_cents=excluded.price_cents,
  value_cents=excluded.value_cents, total_numbers=excluded.total_numbers, reserve_minutes=excluded.reserve_minutes,
  closes_at=excluded.closes_at;

insert into raffle_numbers(raffle_id,number)
select r.id, gs from raffles r cross join generate_series(1,50) gs
where r.slug='dyson-airwrap'
on conflict (raffle_id,number) do nothing;

create or replace function reserve_raffle_number(
  p_slug text, p_number integer, p_name text, p_whatsapp text, p_referral text default 'directo'
) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_raffle raffles%rowtype;
  v_num raffle_numbers%rowtype;
  v_participant uuid;
  v_until timestamptz;
begin
  select * into v_raffle from raffles where slug=p_slug and status='open';
  if not found then return jsonb_build_object('ok',false,'error','La rifa no está disponible.'); end if;
  if v_raffle.closes_at is not null and now() >= v_raffle.closes_at then return jsonb_build_object('ok',false,'error','Las participaciones ya cerraron.'); end if;

  select * into v_num from raffle_numbers where raffle_id=v_raffle.id and number=p_number for update;
  if not found then return jsonb_build_object('ok',false,'error','Número inexistente.'); end if;

  if v_num.status='paid' then return jsonb_build_object('ok',false,'error','Ese número ya está pagado.'); end if;
  if v_num.status='reserved' and v_num.reserved_until is not null and v_num.reserved_until > now() then
    return jsonb_build_object('ok',false,'error','Ese número acaba de ser apartado. Elige otro.');
  end if;

  insert into participants(raffle_id,name,whatsapp,referral)
  values(v_raffle.id, trim(p_name), trim(p_whatsapp), nullif(trim(p_referral),'')) returning id into v_participant;
  v_until := now() + make_interval(mins => v_raffle.reserve_minutes);
  update raffle_numbers set status='reserved', reserved_until=v_until, participant_id=v_participant where id=v_num.id;
  return jsonb_build_object('ok',true,'number',p_number,'reservedUntil',v_until,'participantId',v_participant);
end $$;

revoke all on function reserve_raffle_number(text,integer,text,text,text) from public, anon, authenticated;
grant execute on function reserve_raffle_number(text,integer,text,text,text) to service_role;

-- Habilita actualizaciones en tiempo real del tablero.
do $$ begin
  alter publication supabase_realtime add table raffle_numbers;
exception when duplicate_object then null; end $$;

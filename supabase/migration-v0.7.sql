-- RIFAS v0.7: bases personalizables + vendedores/referidos administrables.
-- Ejecutar UNA sola vez sobre una base que ya tenga la v0.4.

alter table raffles add column if not exists terms_text text;
alter table raffles add column if not exists delivery_text text;

create table if not exists raffle_referrals (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references raffles(id) on delete cascade,
  name text not null,
  code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(raffle_id, code)
);

create index if not exists raffle_referrals_raffle on raffle_referrals(raffle_id);

alter table raffle_referrals enable row level security;
-- Sin políticas públicas: solo se administra desde el backend con Secret/Service Role.

update raffles
set terms_text = coalesce(nullif(terms_text,''), 'Cada número queda confirmado únicamente al validar el pago. Los apartados vencen al terminar el tiempo indicado. La fecha, mecánica, entrega y demás condiciones deberán comunicarse claramente antes de activar la rifa.'),
    delivery_text = coalesce(nullif(delivery_text,''), 'La entrega del premio se coordinará directamente con la persona ganadora.')
where slug='dyson-airwrap';

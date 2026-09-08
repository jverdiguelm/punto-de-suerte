-- Punto de Suerte v0.9 · ventana de apertura pública.
-- Ejecutar UNA sola vez sobre una base que ya tenga v0.8.
alter table raffles add column if not exists opens_at timestamptz;

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
  if v_raffle.opens_at is not null and now() < v_raffle.opens_at then return jsonb_build_object('ok',false,'error','La rifa todavía no abre.'); end if;
  if v_raffle.closes_at is not null and now() >= v_raffle.closes_at then return jsonb_build_object('ok',false,'error','Las participaciones ya cerraron.'); end if;
  if p_number < 1 or p_number > v_raffle.total_numbers then return jsonb_build_object('ok',false,'error','Número inexistente.'); end if;
  select * into v_num from raffle_numbers where raffle_id=v_raffle.id and number=p_number for update;
  if not found then return jsonb_build_object('ok',false,'error','Número inexistente.'); end if;
  if v_num.status='paid' then return jsonb_build_object('ok',false,'error','Ese número ya está pagado.'); end if;
  if v_num.status='reserved' and v_num.reserved_until is not null and v_num.reserved_until > now() then return jsonb_build_object('ok',false,'error','Ese número acaba de ser apartado. Elige otro.'); end if;
  insert into participants(raffle_id,name,whatsapp,referral) values(v_raffle.id,trim(p_name),trim(p_whatsapp),nullif(trim(p_referral),'')) returning id into v_participant;
  v_until:=now()+make_interval(mins=>v_raffle.reserve_minutes);
  update raffle_numbers set status='reserved',reserved_until=v_until,participant_id=v_participant where id=v_num.id;
  return jsonb_build_object('ok',true,'number',p_number,'reservedUntil',v_until,'participantId',v_participant);
end $$;
revoke all on function reserve_raffle_number(text,integer,text,text,text) from public,anon,authenticated;
grant execute on function reserve_raffle_number(text,integer,text,text,text) to service_role;

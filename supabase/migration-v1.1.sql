-- Punto de Suerte v1.1: restablecer una rifa de prueba antes del lanzamiento.
-- Ejecutar UNA sola vez después de migration-v1.0.sql.

create or replace function reset_raffle_to_draft(p_slug text) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  v_raffle raffles%rowtype;
begin
  select * into v_raffle from raffles where slug=p_slug for update;
  if not found then return jsonb_build_object('ok',false,'error','Rifa no encontrada.'); end if;
  if v_raffle.status <> 'closed' then return jsonb_build_object('ok',false,'error','Solo puedes restablecer una rifa cerrada.'); end if;

  update raffle_numbers set status='available',reserved_until=null,participant_id=null where raffle_id=v_raffle.id;
  delete from participants where raffle_id=v_raffle.id;
  update raffles set status='draft',updated_at=now() where id=v_raffle.id;
  return jsonb_build_object('ok',true);
end $$;

revoke all on function reset_raffle_to_draft(text) from public,anon,authenticated;
grant execute on function reset_raffle_to_draft(text) to service_role;

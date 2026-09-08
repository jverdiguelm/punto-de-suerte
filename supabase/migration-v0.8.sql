-- RIFAS v0.8: modo prueba para rifas en borrador.
-- Ejecutar UNA sola vez sobre una base que ya tenga la v0.7.

alter table participants add column if not exists is_test boolean not null default false;
alter table payments add column if not exists is_test boolean not null default false;

create index if not exists participants_test_lookup on participants(raffle_id,is_test);
create index if not exists payments_test_lookup on payments(raffle_id,is_test);

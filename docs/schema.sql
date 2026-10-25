-- =========================================================
-- Relatórios dos Alunos — versão simples
-- Rodar no SQL Editor do Supabase.
-- Não mexe nas tabelas antigas; cria duas novas.
-- =========================================================

create table criancas (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid not null references professores(id) on delete cascade,
  nome          text not null,
  arquivada     boolean not null default false,
  criado_em     timestamptz not null default now()
);

create table anotacoes (
  id            uuid primary key default gen_random_uuid(),
  crianca_id    uuid not null references criancas(id) on delete cascade,
  texto         text not null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_criancas_professor on criancas(professor_id) where arquivada = false;
create index idx_anotacoes_crianca   on anotacoes(crianca_id, criado_em desc);

-- Marca a hora quando a anotação é editada
create or replace function marcar_edicao_anotacao()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

create trigger trg_marcar_edicao_anotacao
  before update on anotacoes
  for each row execute function marcar_edicao_anotacao();

-- Segurança: cada professora vê apenas as próprias crianças
alter table criancas  enable row level security;
alter table anotacoes enable row level security;

create policy p_criancas on criancas
  for all using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

create policy p_anotacoes on anotacoes
  for all using (exists (
    select 1 from criancas c
    where c.id = crianca_id and c.professor_id = auth.uid()
  ));

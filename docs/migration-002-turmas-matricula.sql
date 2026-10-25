-- =========================================================
-- Migration 002 — turmas e matrícula
-- Rodar no SQL Editor do Supabase.
--
-- Aditiva: não remove nem renomeia nada. As crianças já
-- cadastradas continuam funcionando, apenas sem turma e
-- sem matrícula até serem editadas.
-- =========================================================

-- ---------------------------------------------------------
-- 1. TURMAS
-- ---------------------------------------------------------

create table turmas (
  id            uuid primary key default gen_random_uuid(),
  professor_id  uuid not null references professores(id) on delete cascade,
  nome          text not null,
  criado_em     timestamptz not null default now()
);

create index idx_turmas_professor on turmas(professor_id);

alter table turmas enable row level security;

create policy p_turmas on turmas
  for all using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

-- ---------------------------------------------------------
-- 2. COLUNAS NOVAS EM CRIANCAS
-- ---------------------------------------------------------

-- Ao excluir uma turma, as crianças ficam sem turma —
-- nunca são apagadas junto.
alter table criancas
  add column turma_id uuid references turmas(id) on delete set null;

alter table criancas
  add column matricula text;

create index idx_criancas_turma on criancas(turma_id);

-- A matrícula identifica a criança de forma única dentro da
-- lista de cada professora. Fica nullable no banco por causa
-- dos cadastros antigos; a obrigatoriedade é aplicada na tela.
create unique index idx_criancas_matricula
  on criancas(professor_id, matricula)
  where matricula is not null;

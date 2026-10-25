-- =========================================================
-- Migration 003 - turma so pode ser excluida se estiver vazia
-- Rodar no SQL Editor do Supabase.
--
-- Troca ON DELETE SET NULL por ON DELETE RESTRICT: o banco
-- passa a recusar a exclusao de uma turma que ainda tenha
-- criancas, independente do que a interface permitir.
-- =========================================================

alter table criancas
  drop constraint if exists criancas_turma_id_fkey;

alter table criancas
  add constraint criancas_turma_id_fkey
  foreign key (turma_id) references turmas(id) on delete restrict;

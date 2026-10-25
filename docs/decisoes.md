# Decisões de projeto

Registro do que foi decidido, por quê, e o que foi descartado no caminho.

---

## 1. Simplificar o escopo depois de desenhá-lo por inteiro

**Contexto.** A primeira versão modelava CMEI, turma, ano letivo, faixa etária
da BNCC, matrícula e relatório mensal — sete tabelas, com arquivamento por ano
e histórico atravessando turmas.

**Decisão.** Reduzir para duas tabelas: `criancas` e `anotacoes`.

**Motivo.** Ao apresentar as telas para a usuária, ficou claro que a estrutura
resolvia um problema que ela não tinha. Ela leciona em uma turma, e o que
faltava era registrar observações rápidas — não administrar uma hierarquia.

**Custo.** Perdeu-se a passagem automática de ano e o agrupamento por turma.
Se isso voltar a importar, a migração é aditiva: `criancas` ganha uma FK para
`turmas`, sem reescrever o que existe.

**Aprendizado.** O modelo mais completo não é o mais correto. A arquitetura
anterior está preservada no histórico de commits.

---

## 2. Segurança no banco, não na interface

**Decisão.** Row Level Security em todas as tabelas, com política baseada em
`auth.uid()`.

**Motivo.** A chave usada no navegador é pública por natureza — qualquer pessoa
que abra o DevTools a enxerga. Se o filtro por usuário estivesse apenas nas
consultas do frontend, bastaria alterar a requisição para ler dados de outra
professora.

Com RLS, o próprio Postgres recusa a linha. O frontend passa a ser conveniência,
não barreira.

```sql
create policy p_anotacoes on anotacoes
  for all using (exists (
    select 1 from criancas c
    where c.id = crianca_id and c.professor_id = auth.uid()
  ));
```

A política de `anotacoes` valida posse pelo join, não por um campo duplicado —
o que evita inconsistência entre `anotacoes.professor_id` e
`criancas.professor_id`.

---

## 3. Arquivar em vez de excluir

**Decisão.** Criança sai da lista com `arquivada = true`. Exclusão real só
existe onde não há dados associados.

**Motivo.** O valor do sistema é o acúmulo de observações ao longo do tempo.
Um clique errado que apaga meses de registro é o pior defeito possível aqui —
pior que qualquer bug de interface, porque não tem desfazer.

**Implementação.** As FKs usam `on delete restrict` nos pontos críticos: o
banco recusa a operação mesmo que a interface tente. A proteção não depende da
tela estar correta.

---

## 4. Guardar o dado bruto, derivar o resto

**Decisão.** Datas e horas vêm de `timestamptz` com `default now()`. Nada de
texto formatado no banco.

**Motivo.** Texto formatado congela. "há 3 dias" gravado no banco está errado
amanhã. A formatação é responsabilidade da apresentação, e o banco guarda o
instante.

Na versão anterior, o mesmo princípio valia para a idade: guardava-se
`data_nascimento` e calculava-se a idade na data de referência do relatório —
assim um texto escrito em março continuava dizendo a idade correta daquele
momento, mesmo lido em novembro.

---

## 5. Rascunho persistido no dispositivo

**Decisão.** O texto em digitação é gravado em `localStorage` a cada alteração
e removido ao salvar.

**Motivo.** O uso acontece em sala de aula, onde o sinal oscila e a tela
bloqueia sozinha. Perder um parágrafo já digitado é o tipo de atrito que faz
alguém abandonar a ferramenta e voltar para o papel.

**Limites conhecidos.** `localStorage` é por navegador e por dispositivo, pode
falhar em janela anônima e não sincroniza. Todas as chamadas estão em
`try/catch` — a falha do armazenamento não impede o uso.

---

## 6. Acessibilidade como requisito, não como ajuste final

**Decisões.**

- Fonte **Atkinson Hyperlegible**, desenhada pelo Braille Institute para
  diferenciar caracteres semelhantes (l/I/1, O/0)
- Base de **18px** em vez dos 16px convencionais
- Alvos de toque de no mínimo **56px**
- Rótulo sempre visível acima do campo, nunca apenas `placeholder`
- Mensagens de erro que dizem o que fazer: "Digite sua senha para entrar",
  não "Campo obrigatório"
- Contorno de foco de 3px em cor de alto contraste

**Motivo.** A usuária tem mais de 50 anos e usa o sistema no celular, às vezes
em pé, em ambiente com ruído visual. Placeholder que some ao digitar deixa a
pessoa sem referência do que estava preenchendo.

---

## 7. Paleta de baixa saturação

**Decisão.** Fundo verde-sálvia (`#E8EDE6`), texto em verde-escuro profundo
(`#22332C`) em vez de preto puro.

**Motivo.** O contraste preto sobre branco é agressivo em sessões longas.
Reduzir a diferença mantendo a legibilidade dentro do padrão WCAG diminui o
cansaço visual.

O acento dourado (`#B8891E`) aparece apenas no anel de foco, onde precisa ser
inequívoco.

---

## 8. Quatro dependências de produção

**Decisão.** React, React-DOM, Supabase client e nada mais. Sem biblioteca de
componentes, sem roteador, sem gerenciador de estado.

**Motivo.** O app tem duas telas e um formulário. Um roteador resolveria um
problema que não existe, e uma biblioteca de componentes traria estilos que
precisariam ser sobrescritos para atender aos requisitos de acessibilidade
acima.

**Consequência.** Menos superfície de atualização e build de ~110 KB
comprimido.

---

## 9. Ping agendado contra a hibernação

**Contexto.** O plano gratuito do Supabase pausa projetos após sete dias sem
atividade no banco. A professora usa o sistema em intervalos que podem passar
disso.

**Decisão.** Uma tabela `ping` com uma única linha, lida por um agendamento
diário externo (cron-job.org).

**Motivo.** É a única tabela com política de leitura pública — e não guarda
nada. O custo é uma requisição por dia.

**Alternativa descartada.** GitHub Actions agendado: o GitHub desativa
workflows em repositórios sem commits por 60 dias, o que reproduziria o mesmo
problema em outro lugar.

---

## 10. Sem geração de texto por IA na primeira versão

**Contexto.** A ideia original incluía gerar o relatório a partir das
observações acumuladas.

**Decisão.** Adiar até que o registro das observações esteja validado em uso.

**Motivo.** Sem material acumulado, não há o que gerar. E colocar uma chamada
de IA no meio do fluxo antes de saber se o fluxo funciona dificulta
identificar a origem de um problema.

**Preparação.** O campo `anotacoes.texto` já é o material de entrada. Quando a
geração entrar, será uma Edge Function do Supabase — a chave da API não pode
ficar no frontend.

# Relatórios dos Alunos

Aplicativo web para professoras de Educação Infantil registrarem observações
sobre as crianças no momento em que acontecem, direto do celular.

Feito para uso real: minha mãe é professora de CMEI e precisava substituir o
caderno de anotações por algo que não se perdesse e organizasse o histórico
de cada criança ao longo do ano.

**[Ver aplicação](#)** · _substituir pelo link do deploy_

---

## O problema

Professoras de Educação Infantil escrevem relatórios descritivos periódicos
sobre cada criança. O material bruto desses relatórios são observações soltas,
feitas ao longo de semanas — e que, no papel, se perdem ou ficam ilegíveis.

O desafio não era técnico, era de uso: a ferramenta precisa ser mais rápida
que pegar o caderno. Se exigir mais de dois toques para começar a escrever,
não é usada.

## Decisões de projeto

As escolhas que moldaram o sistema estão documentadas em
**[docs/decisoes.md](docs/decisoes.md)**. As principais:

| Decisão | Motivo |
|---|---|
| Segurança no banco (RLS), não no frontend | Mesmo que alguém manipule o cliente, não acessa dados de outra professora |
| Arquivar em vez de excluir | Histórico de uma criança é o ativo do sistema; exclusão real só onde não há dados |
| Rascunho salvo no dispositivo | Sinal de internet em escola é instável; texto digitado não se perde |
| Alvos de toque de 56px, base 18px | Usuária com mais de 50 anos, usando no celular, às vezes em pé |
| Ping diário agendado | Supabase free hiberna após 7 dias sem uso; a professora usa em intervalos maiores |

## Stack

- **React 18** + **Vite** — SPA leve, sem framework de roteamento (o app tem duas telas)
- **Supabase** — PostgreSQL, autenticação e Row Level Security
- **Vercel** — deploy contínuo a partir da branch `main`
- CSS puro com custom properties, sem biblioteca de componentes

A ausência de dependências extras é intencional: o projeto tem 4 dependências
de produção. Menos superfície para manter e atualizar.

## Modelo de dados

```
professores (id = auth.users.id)
     │
     └── criancas (professor_id, nome, arquivada)
              │
              └── anotacoes (crianca_id, texto, criado_em, atualizado_em)
```

Toda tabela tem RLS ativo. A política de `anotacoes` valida a posse através
do join com `criancas`, de modo que não existe caminho para ler a anotação de
outra professora mesmo conhecendo o ID.

Schema completo em [docs/schema.sql](docs/schema.sql).

## Rodando localmente

```bash
git clone https://github.com/LucasMNDL3/relatorios-cmei.git
cd relatorios-cmei
npm install
cp .env.example .env     # preencher com as credenciais do Supabase
npm run dev
```

O arquivo `.env` precisa de:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_publishable_key
```

Antes de rodar, execute [docs/schema.sql](docs/schema.sql) no SQL Editor do
Supabase.

## Estrutura

```
src/
  main.jsx        decide entre login, recuperação de senha e app
  Login.jsx       entrada e recuperação por e-mail
  NovaSenha.jsx   redefinição após o link do e-mail
  App.jsx         lista de crianças
  Crianca.jsx     escrita e histórico de anotações
  supabase.js     cliente
  util.js         formatação de datas em português
  icones.jsx      SVGs inline
  estilos.css     design tokens e componentes
docs/
  decisoes.md     por que cada escolha foi feita
  schema.sql      estrutura do banco
```

## Estado atual

Em uso. As próximas entregas estão em
[Issues](../../issues), priorizadas pelo retorno de quem usa.

## Licença

MIT — ver [LICENSE](LICENSE).

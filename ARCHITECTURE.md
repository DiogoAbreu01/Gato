# Arquitetura

- **Aplicação:** Next.js App Router com componentes server-side para dashboard e client-side para formulários, listas e calendário.
- **Persistência:** PostgreSQL e Prisma, migração SQL versionada em `prisma/migrations`.
- **Domínio:** 23 modelos com usuários/sessões, diretorias, membros/vínculos, histórico, ocorrências, tarefas/eventos, finanças, campanhas editoriais, eSports, projetos, documentos, notificações e auditoria.
- **Multi-diretoria:** `UserDepartment` determina cargo de acesso; `MemberDepartment` permite filiação múltipla, distinta da conta de login.
- **Autorização:** `src/lib/rbac.ts` é a política central. Rotas verificam sessão, recurso, operação e `departmentId`; `readFilter` restringe as consultas SQL. `ADMIN` e `BOARD` têm escopos globais, com restrição maior para ocorrências.
- **Integridade:** operações críticas usando transação, limite disciplinar de 0 a 5, lançamentos financeiros sem exclusão destrutiva, estorno compensatório e concorrência otimista via `version` nos registros editáveis.
- **Documentos:** banco guarda metadados; bytes privados em volume montado; download faz autorização no servidor. Nunca usar `/public` para anexos.
- **Deploy:** Docker Compose + Postgres persistente + volume de uploads; Caddy HTTPS opcional em `deploy/`.

## Fluxo compartilhado

Uma festa é um `Event` único, referenciado por `Task`, `Publication` e `FinancialTransaction` via `eventId`. A mesma entidade alimenta o calendário. Cadastro de pessoas permanece único com múltiplas diretorias, sem cópias sincronizadas.

## ADR-001 — Independência do BlueScale

Não há acesso ao banco, credenciais nem repositório do BlueScale. A futura integração será via API autenticada, mapeamento explícito de IDs e política de propriedade dos dados.

## ADR-002 — Financeiro não é contabilidade bancária

O MVP tem lançamentos internos `INCOME` e `EXPENSE`; transferência dupla, conciliação e aprovações serão elaboradas na fase seguinte. O saldo é o somatório dos lançamentos, incluindo reversões. Sem conexão com banco.

## ADR-003 — Tabelas com edição controlada

Uma interface genérica reduz repetição, mas nunca substitui validação: cada recurso tem schema Zod dedicado, whitelist de campos e permissão server-side. `version` rejeita edição concorrente em entidades que o suportam.

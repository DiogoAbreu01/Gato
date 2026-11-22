# Gato — STATUS
Atualizado em 2026-11-22, após inspeção pelo Desktop Commander do PC de desenvolvimento em Itajubá.

## Implementado em código
Next.js 16 + React 19 + TypeScript; Prisma 6.19 e migração PostgreSQL com 23 modelos; login, sessões e perfis de usuário; papéis e escopo por diretoria; membros; calendário; eventos; tarefas; publicações; financeiro com ajustes/estorno; equipes e campeonatos; DGE; ocorrências; documentos privados; notificações; UI responsiva e dashboard. Parte dos recursos precisa de refinamento e teste end-to-end.

## Evidência realmente executada (PC apenas para desenvolvimento)
- npm install concluído (404 pacotes).
- prisma generate concluído, Prisma schema validado.
- npm run typecheck concluído (exit 0).
- npm run lint concluído (exit 0; dois avisos não bloqueantes).
- npm test local: 9 aprovados, 1 integração ignorada localmente. GitHub Actions no commit 5e36be3 executou PostgreSQL 16 efêmero na nuvem, prisma migrate deploy, bootstrap, build e smoke HTTP (RUN_SMOKE=1) com aprovação observada nos passos do workflow 45069694924.
- npm run build com Webpack concluído (exit 0, Next 16.1.0). Turbopack no Windows falhou por falta de privilégio de symlink; Webpack resolveu.
- Corrigidos filtros de tipagem e acesso aos metadados de eventos.

## Infraestrutura externa
- Neon Postgres **realmente criado**: projeto Gato, organização Gato Atletica, região São Paulo, plano Free, branch production. Projeto ID still-silence-30598056. Nenhuma URL de conexão com senha foi comitada.
- Docker Compose Oracle + Neon em compose.yaml (padrão) e deploy/compose.cloud.yaml; **nenhum** deles inclui PostgreSQL local. Banco de produção deve permanecer na Neon, nunca no PC.
- Oracle VM ainda **NÃO provisionada** e o Gato ainda **NÃO está online**.
- Credenciais Neon ainda não conectadas ao app. Migrações, bootstrap, login e CRUD HTTP foram testados com banco PostgreSQL real **somente no ambiente efêmero do GitHub Actions**, não no projeto Neon e não na Oracle.

## Prioridades
1. Conexão segura do aplicativo ao Neon (segredos só no ambiente de produção) e executar prisma migrate deploy/ bootstrap.
2. Verificar teste de integração HTTP e múltiplos usuários, segurança, permissão e recursos financeiros.
3. Provisionar Oracle Ubuntu ARM64 ou x86_64 com DNS e HTTPS, Docker Compose externo, backups remotos e teste de restauração.
4. Finalizar fluxos avançados de aprovação, busca e relatórios antes de declarar produção.

Importante: o PC de Itajubá **não é servidor**, e nunca armazenará o banco de produção.
Codex CLI está autenticado, mas bloqueado pelo limite de uso até 2026-11-24 10:44, de acordo com a saída da ferramenta.

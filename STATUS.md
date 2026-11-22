# Gato — STATUS
Atualizado em 2026-11-22, após inspeção pelo Desktop Commander do PC de desenvolvimento em Itajubá.

## Implementado em código
Next.js 16 + React 19 + TypeScript; Prisma 6.19 e migração PostgreSQL com 23 modelos; login, sessões e perfis de usuário; papéis e escopo por diretoria; membros; calendário; eventos; tarefas; publicações; financeiro com ajustes/estorno; equipes e campeonatos; DGE; ocorrências; documentos privados; notificações; UI responsiva e dashboard. Parte dos recursos precisa de refinamento e teste end-to-end.

## Evidência realmente executada (PC apenas para desenvolvimento)
- npm install concluído (404 pacotes).
- prisma generate concluído, Prisma schema validado.
- npm run typecheck concluído (exit 0).
- npm run lint concluído (exit 0; dois avisos não bloqueantes).
- npm test: 9 aprovados, 1 integração **ignorada** por depender de aplicação + PostgreSQL conectados.
- npm run build com Webpack concluído (exit 0, Next 16.1.0). Turbopack no Windows falhou por falta de privilégio de symlink; Webpack resolveu.
- Corrigidos filtros de tipagem e acesso aos metadados de eventos.

## Infraestrutura externa
- Neon Postgres **realmente criado**: projeto Gato, organização Gato Atletica, região São Paulo, plano Free, branch production. Projeto ID still-silence-30598056. Nenhuma URL de conexão com senha foi comitada.
- Docker Compose Oracle + Neon em deploy/compose.cloud.yaml; PostgreSQL permanece na Neon, nunca no PC.
- Oracle VM ainda **NÃO provisionada** e o Gato ainda **NÃO está online**.
- Credenciais Neon ainda não conectadas ao app; migrações, bootstrap, login e CRUD HTTP NÃO testados contra banco real.

## Prioridades
1. Conexão segura do aplicativo ao Neon (segredos só no ambiente de produção) e executar prisma migrate deploy/ bootstrap.
2. Verificar teste de integração HTTP e múltiplos usuários, segurança, permissão e recursos financeiros.
3. Provisionar Oracle Ubuntu ARM64 ou x86_64 com DNS e HTTPS, Docker Compose externo, backups remotos e teste de restauração.
4. Finalizar fluxos avançados de aprovação, busca e relatórios antes de declarar produção.

Importante: o PC de Itajubá **não é servidor**, e nunca armazenará o banco de produção.
Codex CLI está autenticado, mas bloqueado pelo limite de uso até 2026-11-24 10:44, de acordo com a saída da ferramenta.

# Gato — STATUS
Atualizado em 2026-11-22, após inspeção pelo Desktop Commander do PC de desenvolvimento em Itajubá.

## Implementado em código
Next.js 16 + React 19 + TypeScript; Prisma 6.19 e migração PostgreSQL com 23 modelos; login, sessões e perfis de usuário; papéis e escopo por diretoria; membros; calendário; eventos; tarefas; publicações; financeiro com ajustes/estorno; equipes e campeonatos; DGE; ocorrências; documentos privados; notificações; UI responsiva e dashboard. Parte dos recursos precisa de refinamento e teste end-to-end.

## Evidência realmente executada (PC apenas para desenvolvimento)
- npm install concluído (404 pacotes).
- prisma generate concluído, Prisma schema validado.
- npm run typecheck concluído (exit 0).
- npm run lint concluído (exit 0; dois avisos não bloqueantes).
- npm test local: 9 aprovados, 1 integração ignorada localmente. GitHub Actions concluído com **sucesso** nos commits 5e36be3 (workflow 45069694924) e eda4d3f (workflow 45070109479): PostgreSQL 16 efêmero na nuvem, prisma migrate deploy, bootstrap, build, healthcheck, smoke HTTP (RUN_SMOKE=1) com login, CRUD, conflitos, estornos e bloqueios de um segundo usuário sem permissão.
- npm run build com Webpack concluído (exit 0, Next 16.1.0). Turbopack no Windows falhou por falta de privilégio de symlink; Webpack resolveu.
- Corrigidos filtros de tipagem e acesso aos metadados de eventos.

## Infraestrutura externa
- Neon Postgres **criado e configurado**: projeto Gato, organização Gato Atletica, região São Paulo, plano Free, branch production, banco neondb. Projeto ID still-silence-30598056. Em 22/11/2026 a migração 20261110000000_init foi executada pelo SQL Editor da conta autenticada em uma transação; foram confirmadas 24 tabelas (23 modelos + _prisma_migrations). Checksum SHA256 registrado ae1025e121d596fad03a05fbdda5df268ee8f595e57a509ee6ebc8ee0bbba207; finished_at validado. Snapshot manual criado 2026-11-22T21:46:34Z no plano Free (sem agendamento, limite de 1 snapshot). Nenhuma URL de conexão com senha foi comitada.
- Docker Compose Oracle + Neon em compose.yaml (padrão) e deploy/compose.cloud.yaml; **nenhum** deles inclui PostgreSQL local. Banco de produção deve permanecer na Neon, nunca no PC.
- Oracle VM ainda **NÃO provisionada** e o Gato ainda **NÃO está online**.
- Neon possui esquema inicial e histórico da migração aplicados, porém a aplicação ainda NÃO se conecta à Neon de produção: sem credencial em VM Oracle. Bootstrap, login e CRUD HTTP foram testados com Postgres real **somente no ambiente efêmero do GitHub Actions**, não na Neon de produção nem na Oracle. O plugin Neon conectado no ChatGPT mostra apenas organização DAs (sem projetos); a aplicação de schema foi feita no projeto original Gato via navegador autenticado.

## Prioridades
1. Provisionar VM Oracle e configurar DATABASE_URL de Neon (segredos apenas na VM); a migração inicial já está registrada como aplicada no banco de produção, mas deve ser verificada por Prisma migrate status. Executar bootstrap de administrador apenas na VM.
2. Verificar teste de integração HTTP usando aplicação na Oracle + Neon de produção e testar múltiplos usuários, segurança, permissões, finanças e documentos privados.
3. O console Oracle Cloud ainda pede o Cloud Account Name e não há login/sessão autorizada, nem VM provisionada; quando houver acesso, criar Ubuntu ARM64 ou x86_64 com DNS e HTTPS, Docker Compose externo, backups remotos e teste de restauração.
4. Finalizar fluxos avançados de aprovação, busca e relatórios antes de declarar produção.

Importante: o PC de Itajubá **não é servidor**, e nunca armazenará o banco de produção.
Codex CLI está autenticado, mas bloqueado pelo limite de uso até 2026-11-24 10:44, de acordo com a saída da ferramenta.

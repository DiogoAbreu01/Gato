# Gato — Sistema de Gestão da Atlética

Sistema de gestão administrativa de Atléticas universitárias. Código independente do BlueScale, com Next.js, React, TypeScript, Prisma e PostgreSQL.

## Estado desta entrega

**Base de desenvolvimento, não certificada para produção.** Possui autenticação por sessão, usuários administrativos e papéis, gerenciamento de membros (múltiplas diretorias), eventos, tarefas, movimentações financeiras com estornos, agenda editorial, equipes e campeonatos, projetos, documentos com upload privado, ocorrências com ajustes auditáveis, notificações, calendário global e dashboard. O funcionamento completo depende de instalação, migração e testes integrados. Consulte `STATUS.md`.

## Rodar localmente

Requisitos: Node.js 22, PostgreSQL 16, npm. No diretório do projeto:

```bash
cp .env.example .env
# Edite DATABASE_URL, APP_URL, ADMIN_EMAIL e ADMIN_PASSWORD
npm install
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run db:bootstrap
npm run dev
```

Abra `http://localhost:3000`. A conta inicial vem de `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo 16 caracteres) e nunca deve ser comitada. O bootstrap não redefine senha de administrador existente.

## Docker

```bash
cp .env.example .env
# Defina POSTGRES_PASSWORD forte, APP_URL, ADMIN_EMAIL e ADMIN_PASSWORD
# Use no DATABASE_URL uma senha URL-encoded, se contiver caracteres especiais.
docker compose up -d --build
# Só após a migração terminar:
docker compose run --rm --no-deps migrate npm run db:bootstrap
```

Acesse via `http://localhost:3000` somente no próprio servidor. Para acesso remoto, configure um domínio e proxy HTTPS (veja `DEPLOYMENT.md`).

## Testes

```bash
npm test              # verificações estáticas locais
npm run typecheck     # depende de npm install e prisma generate
npx prisma validate  # valida modelo
# testes de integração exigem banco isolado, app iniciado e variáveis de CI
RUN_SMOKE=1 node --test tests/smoke.test.mjs
```

Documentos: `ARCHITECTURE.md`, `SECURITY.md`, `DEPLOYMENT.md`, `ROADMAP.md` e `STATUS.md`.

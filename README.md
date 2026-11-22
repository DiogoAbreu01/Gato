# Gato — Sistema de Gestão da Atlética

Sistema de gestão administrativa de Atléticas universitárias. Código independente do BlueScale, com Next.js, React, TypeScript, Prisma e PostgreSQL.

## Estado desta entrega

**Base de desenvolvimento, não certificada para produção.** Possui autenticação por sessão, usuários administrativos e papéis, gerenciamento de membros (múltiplas diretorias), eventos, tarefas, movimentações financeiras com estornos, agenda editorial, equipes e campeonatos, projetos, documentos com upload privado, ocorrências com ajustes auditáveis, notificações, calendário global e dashboard. A migração inicial já foi aplicada à Neon e confirmada em 22/11/2026; testes integrados passaram no GitHub Actions com PostgreSQL efêmero. **A aplicação ainda depende de VM Oracle, credenciais privadas, bootstrap e testes end-to-end na Neon de produção.** Consulte `STATUS.md`.

## Ambiente de desenvolvimento (somente código e testes, sem hospedar bancos no PC)

Requisitos: Node.js 22, npm e um banco PostgreSQL **externo**. Não execute serviço ou banco persistente no PC de desenvolvimento. No diretório do projeto:

```bash
npm ci
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
npm test
npm run build
```

Essas verificações não iniciam um servidor nem um banco persistente no PC. A conta inicial será criada **somente na VM** com `ADMIN_EMAIL` e `ADMIN_PASSWORD` (mínimo 16 caracteres); nunca registre credenciais no GitHub. O bootstrap não redefine a senha de um administrador existente.

## Hospedagem definitiva: Oracle Cloud VM + Neon Postgres (sem banco no computador)

Na VM Oracle, configure um `.env` privado contendo `DATABASE_URL` Neon com pooling, `DATABASE_URL_UNPOOLED` Neon direta, `APP_URL=https://dominio`, `DOMAIN=dominio` e credenciais administrativas iniciais. O `compose.yaml` **não cria contêiner PostgreSQL**: usa exclusivamente o banco externo.

```bash
git clone https://github.com/DiogoAbreu01/Gato.git
cd Gato
# Configure .env privado na VM e DNS apontando para o IP público
sudo docker compose --env-file .env up -d --build
# A migration inicial já existe na Neon; bootstrap uma vez, com conta administrativa inicial:
sudo docker compose --env-file .env run --rm --no-deps migrate npm run db:bootstrap
```

Não exponha portas 3000/5432 à internet. O proxy Caddy usa 80/443 e HTTPS. Não execute este compose no PC; ele é o deploy da VM. A VM Oracle ainda precisa ser provisionada e validada. Veja `DEPLOYMENT.md` e `STATUS.md`.

## Testes

```bash
npm test              # verificações estáticas locais
npm run typecheck     # depende de npm install e prisma generate
npx prisma validate  # valida modelo
# testes de integração exigem banco isolado, app iniciado e variáveis de CI
RUN_SMOKE=1 node --test tests/smoke.test.mjs
```

Documentos: `ARCHITECTURE.md`, `SECURITY.md`, `DEPLOYMENT.md`, `ROADMAP.md` e `STATUS.md`.

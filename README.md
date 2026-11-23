<p align="center"><img src="public/gato-lunar.svg" width="112" alt="Gato, a lunar cat with glasses" /></p>

<h1 align="center">Gato ☾</h1>

**A little moonlight for a lot of university chaos.**

*One cozy workspace for teams, pages, tasks, databases and event operations.*

[Open hosted preview](https://gato-atletica-os.onrender.com) · [Architecture](ARCHITECTURE.md) · [Security](SECURITY.md) · [Workspace v2](GATO_V2.md)

[![CI](https://github.com/DiogoAbreu01/Gato/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/DiogoAbreu01/Gato/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-14141b?style=flat-square&logo=nextdotjs&logoColor=ffffff)
![Neon PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-14141b?style=flat-square&logo=postgresql&logoColor=c1b4fc)


> **DAs / After dark:** Serious software can still have a mascot. The little cat wears glasses; the database still enforces permissions.

**The idea.** A Notion-inspired home for a university athletics organization: nested pages, block editor, Kanban/table views, spreadsheet-like cells, editable diagrams, search and administrative modules. Built with Next.js, Prisma and hosted PostgreSQL.

**Honest status:** Hosted *preview* on Render Free + Neon, with no availability SLA. Some actions require an authorized account. This is an evolving campus workspace, **not a complete Notion replacement**. Technical boundaries and known limitations are documented in [GATO_V2.md](GATO_V2.md).

---

## O que já existe

- Workspace por diretoria com páginas e subtópicos; conteúdo salvo no PostgreSQL, com histórico e proteção de concorrência.
- Editor de parágrafos, títulos, listas, checklists, links e citações.
- Planilhas com células dinâmicas, fórmulas básicas (SUM e operações), filtros e CSV.
- Bancos de dados com alternância de tabela/Kanban; fluxogramas com nós móveis e ligações editáveis.
- Busca de páginas, favoritos por usuário, permissões por diretoria, tema claro/escuro, interface responsiva e gatinho lunar de óculos.
- Administração existente: autenticação, departamentos, membros, eventos, tarefas, calendário, finanças e estornos, publicações, eSports, DGE, documentos, notificações e trilha de auditoria.

**Leia [GATO_V2.md](GATO_V2.md)** para modelo de dados, APIs, limites e roadmap. Arquitetura e segurança em [ARCHITECTURE.md](ARCHITECTURE.md) e [SECURITY.md](SECURITY.md).

## Dados e infraestrutura

- Backend Next.js 16, React 19, TypeScript, Prisma 6 e PostgreSQL (Neon).
- Banco de dados fora do PC: Neon projeto Gato, região São Paulo, branch production.
- Frontend/backend fora do PC: Render Docker Free, URL pública acima.
- Migrações `20261110000000_init` e `20261122000100_workspace_v2` já foram aplicadas ao banco externo. O histórico `_prisma_migrations` foi conferido.
- O primeiro usuário administrador já foi criado na Neon. **Não há credenciais padrão ou senhas no repositório.** Em **Minha conta** (clique no perfil no rodapé da barra lateral), é possível alterar sua senha. A alteração revoga as sessões anteriores.
- Uploads locais estão bloqueados no Render Free (disco efêmero); links externos em documentos são suportados.
- O plano gratuito dorme após inatividade; não tem SLA de disponibilidade, backups automáticos de arquivos nem recursos garantidos para uso institucional crítico.

## Qualidade

```bash
npm ci
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
npm test
npm run build
```

GitHub Actions executa integração com PostgreSQL **efêmero na nuvem**, migração, bootstrap, build e testes HTTP de módulos administrativos e do workspace (inclusão de página, revisão, conflito 409, permissões, planilha, fluxograma). Testes contra produção devem usar uma sessão autenticada autorizada.

## Desenvolvimento

O PC de Itajubá é utilizado **apenas para desenvolvimento e testes de compilação**. Não instale ou hospede o banco nem mantenha o site de produção no computador.

Para instalação em outro ambiente, crie um `.env` privado com `DATABASE_URL`, `APP_URL` e variáveis administrativas. **Nunca comite credenciais nem dados de usuários.**

## Evoluções planejadas

Importação XLSX, comentários e colaboração ao vivo, relações entre bases, fluxos de aprovação personalizáveis, editor Markdown/WYSIWYG mais amplo, attachments S3 duráveis e backup externo recorrente. A implementação existente é uma primeira versão funcional, não reprodução integral do Notion.

**Atenção:** Gato é independente do BlueScale. Alterações de infraestrutura no Gato não mexem no código ou banco do BlueScale; porém, serviços Free na mesma workspace Render podem compartilhar a cota mensal de horas.

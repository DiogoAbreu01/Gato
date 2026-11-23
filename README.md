# Gato ☾ — Moon Workspace da Atlética

**Um workspace universitário de gestão, com personalidade lunar.** O Gato reúne as funções administrativas da Atlética com um espaço de trabalho inspirado no Notion — páginas aninhadas, editor de blocos, planilhas, Kanban, fluxogramas, favoritos e busca.

**Site:** https://gato-atletica-os.onrender.com  
**Código:** https://github.com/DiogoAbreu01/Gato  
**Status:** prévia funcional hospedada na nuvem (Render Free + Neon PostgreSQL), sujeita às limitações gratuitas.

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
- O primeiro usuário administrador já foi criado na Neon. **Não há credenciais padrão ou senhas no repositório.**
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

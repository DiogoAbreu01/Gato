# GATO — Plano de execução TITAN
Data: 2026-11-22. Proprietário: Atlética universitária.

## Meta
Produto institucional integrado com UI profissional, Next.js App Router + TS + Postgres + Prisma, login seguro, RBAC granular por diretorias, CRUD real de módulos, Docker para Oracle VM e Postgres gerenciado externo Neon (Free). É PROIBIDO hospedar app ou banco permanentemente no PC de desenvolvimento. Não provisionar banco local nem armazenar senhas no repositório.

## Pilares (responsabilidades da equipe)
- Arquiteto: estrutura, schema Prisma, migrations, design de permissões, ADRs.
- Backend: auth, sessão, autorização server-side, Zod, operações atômicas, proteção de dados, auditoria.
- Frontend: dashboard e sidebar responsivos, CRUD/feedback acessível, tema, mobile, sem mock em produção.
- Qualidade/SRE: testes, lint/typecheck, segurança, Docker multiarch, CI, Deploy Oracle+Neon, backups remotos.

## MVP funcional com prioridade estrita
P0: login/logout, bootstrap admin, departamentos e usuários com papéis, membros + vínculos + histórico, tarefas + eventos, calendário global, API REST e UI de gestão, migrations PostgreSQL, documentação, autenticação server-side.
P1: transações financeiras com estorno e trilha auditável, publicações e calendário editorial, equipes e torneios esports, projetos DGE, notificações.
P2: documentos privados, ocorrências disciplinares reversíveis, pesquisa permissionada, relatórios, fluxos de aprovação.

## Padrões
- Use dependências versões estáveis compatíveis, scripts npm funcionais.
- Cada rota de leitura/escrita deve checar sessão+escopo organizacional e permissão. URLs nunca expõem docs privados sem auth.
- Prisma Decimal em finanças, transações, controle de concorrência version+409, soft delete.
- Não invente testes nem dados de produção. Bootstrap administrador via variáveis em runtime e credenciais não comitadas.
- Priorizar feição moderna genuína, navy/azul elétrico/espaçamento, sem emoji/cards genéricos.
- No repo: README.md, ARCHITECTURE.md, SECURITY.md, DEPLOYMENT.md, STATUS.md, ROADMAP.md; .env.example sem segredos, .gitignore.
- Sem dependência com BlueScale.
- Commit ao fim de etapas concretas, não faça git push sem verificar secrets/config.
- Não espere interação; use decisões conservadoras. Em bloqueios, continue outro componente.
- Toda conclusão deve ser comprovada por comando e saída. Não declare "pronto" sem build+testes+E2E contra Postgres remoto.

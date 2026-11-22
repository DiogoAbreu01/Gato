# Gato — situação em 2026-11-22

## Hospedagem externa em funcionamento
- **Render Free**: serviço `gato-atletica-os`, região Virginia, Docker, branch main. URL pública **https://gato-atletica-os.onrender.com**. Serviço identificado como `srv-dc1mapp42hec73aocjo0`.
- **Neon Postgres**: projeto Gato (organização Gato Atletica), banco `neondb`, branch production, região São Paulo. `DATABASE_URL` segura foi configurada como variável privativa do serviço Render; não versionada nem incluída em mensagens.
- **Prova de conectividade externa**: em 2026-11-22 22:09 UTC, `GET /api/health` = **HTTP 200**, corpo `{"status":"ok","database":"connected"}`; `/login` = HTTP 200; `/` = HTTP 307 para login; `/api/auth/me` e `/api/records/members` sem sessão = HTTP 401.
- Primeiro deploy Render falhou porque Dockerfile referenciava diretório public inexistente; corrigido no commit `ddc8552`. Segundo deploy retornou 502 por bind inadequado; ajustado para `HOSTNAME=0.0.0.0` no commit `aee3c0c`, que entrou em produção e passou no healthcheck.
- Serviço e banco funcionam integralmente fora do PC de desenvolvimento. BlueScale não foi modificado, mas compartilha a cota gratuita mensal da mesma workspace Render.

## Banco de dados
- Migração inicial `20261110000000_init` aplicada no projeto Neon original por transação via SQL Editor, com SHA256 `ae1025e121d596fad03a05fbdda5df268ee8f595e57a509ee6ebc8ee0bbba207` no `_prisma_migrations` e `finished_at` confirmado.
- 23 tabelas de modelos + `_prisma_migrations`, total 24 tabelas verificadas.
- Em 2026-11-22 22:08 UTC, seed confirmado por SQL Editor: 7 diretorias e 10 categorias financeiras, numa transação.
- Snapshot manual da Neon criado em 2026-11-22T21:46:34Z (limite do Free: 1 snapshot manual, sem agendamento); backup de rotina fora do serviço ainda não instalado.

## Testes e versionamento
- Compilação Next.js 16/React 19/Prisma 6 aprovada; typecheck exit 0, lint exit 0 (2 avisos), 9 testes estáticos/unitários locais aprovados, 1 teste HTTP ignorado localmente.
- GitHub Actions com PostgreSQL efêmero, migrations, bootstrap, CRUD, autorização e estornos aprovado inclusive no commit `aee3c0c` (workflow 45075833158). Este CI NÃO é a Neon de produção.
- Autenticação, sessões, RBAC por diretoria, membros, eventos, tarefas, finanças, publicidade, eSports, DGE, documentos, ocorrências e notificações implementados em código e testados em CI; a validação manual de cada fluxo em produção ainda está pendente.

## Limitações e pendências prioritárias
1. **Primeiro administrador**: ainda não foi provisionado no Neon de produção. A página de login abre, mas não existe uma credencial administrativa inicial entregue ao usuário. Executar bootstrap seguro, sem expor senha em arquivos públicos, e testar login completo.
2. **Upload de documentos**: no Render Free o disco é efêmero. Upload local foi desativado para evitar perda irreversível; documentos podem usar links externos. Para uploads reais, integrar armazenamento durável compatível com S3 antes de ativá-los.
3. **Disponibilidade**: Render Free dorme após 15 min de inatividade e pode levar até ~1 min para despertar, além da cota de 750 h/mês **compartilhada com BlueScale**. Render explicitamente desaconselha Free para produção institucional. Considerar plano pago ou outro serviço para operação 24/7.
4. **Segurança/operacional**: revisão de autorização em múltiplos perfis e fluxos reais de produção, política de armazenamento, monitoramento, alertas e backup remoto/restore periódico.
5. **Produto**: relatórios, busca global, aprovações avançadas e refinamentos de UX permanecem no roadmap.

Documentação: `DEPLOY_RENDER.md`, `SECURITY.md`, `ARCHITECTURE.md`. A Oracle não é requisito para continuar este projeto.

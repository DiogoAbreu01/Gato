# Instalação e operação

## VM Linux (AMD64 ou ARM64)

Requer: Docker Engine + plugin `docker compose`, DNS apontando para IP da VM, portas 80/443 liberadas somente se usar Caddy. Em Oracle Cloud Always Free, verifique disponibilidade e regras de rede; a criação de instância gratuita não é garantida.

1. Copie os arquivos para VM e crie `.env` a partir de `.env.example`.
2. Preencha `POSTGRES_PASSWORD`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`; use somente senhas fortes. Configure `APP_URL=https://seu-dominio` e `DOMAIN=seu-dominio` para produção. Evite caracteres sem URL-encoding em `POSTGRES_PASSWORD` interpolado no `DATABASE_URL`.
3. Faça `docker compose -f compose.yaml -f deploy/compose.proxy.yaml up -d --build` na instalação com domínio.
4. Verifique migração com `docker compose logs migrate`, banco com `docker compose ps` e saúde com `curl -fsS https://seu-dominio/api/health`.
5. Inicialize a conta uma única vez: `docker compose run --rm --no-deps migrate npm run db:bootstrap`.
6. Revise permissões de diretoria no painel de usuários, crie contas por pessoa e use um domínio com TLS válido.

Sem domínio: `docker compose up -d --build` expõe o serviço apenas em `127.0.0.1:3000` da VM; utilize túnel SSH para testes, **não** exponha HTTP pela internet.

## Backup e restauração

O banco usa volume `pgdata`; os arquivos usam volume `uploads`. Execute `BACKUP_REMOTE=remote:atletica-os ./scripts/backup.sh` via cron depois de configurar rclone e um destino fora da VM. O script conserva backup local por 14 dias, mas política remota depende do backend rclone. Verifique restauração em ambiente isolado com `./scripts/verify-restore.sh caminho/backup.dump`. O script **não** substitui o banco em uso. Também valide recuperação dos uploads a partir do tarball.

## Atualização / rollback

Antes de atualizar, teste backup e restauração, verifique migrações incompatíveis em staging e crie tag Git. Faça build e `docker compose up -d --build`, acompanhe logs e healthcheck. Para rollback, reinstale a tag anterior somente se as migrações forem compatíveis; caso contrário restaure um backup em ambiente isolado e planeje migração reversa explícita. Não execute `prisma migrate reset` em produção.

## Restrições atuais

A imagem usa `npm install` com versões fixadas porque o arquivo `package-lock.json` não pôde ser gerado neste ambiente. Gere e comite lockfile no primeiro ambiente com acesso ao npm e substitua no Dockerfile/CI por `npm ci` para builds determinísticos. A migração inicial SQL foi gerada estaticamente e precisa de validação real por Prisma/PostgreSQL antes de publicar.


## Implantação Oracle VM + Neon (sem PostgreSQL local)
O Gato usa `deploy/compose.cloud.yaml` para o ambiente final, com Next.js + Caddy e Postgres no Neon. **Não** utilize `compose.yaml` em produção se a exigência for banco 100% externo, pois aquele arquivo contém container PostgreSQL para ambientes de laboratório.

O projeto Neon Gato foi criado na região São Paulo (AWS sa-east-1) em 2026-11-22. Crie/obtenha `DATABASE_URL` usando o painel Neon e configure-a **somente** no `.env` privado da VM. Para migrations é recomendada a conexão direta (sem pooler) e para as consultas da aplicação pode-se usar a URL pooled; o deploy ainda precisa de ajustes para variáveis separadas conforme validado. Não exponha senhas no GitHub ou no suporte.

Na VM:
```bash
git clone https://github.com/DiogoAbreu01/Gato.git
cd Gato
# Adicione .env fora do versionamento com DATABASE_URL, APP_URL e DOMAIN corretos
docker compose --env-file .env -f deploy/compose.cloud.yaml up -d --build
docker compose --env-file .env -f deploy/compose.cloud.yaml ps
```
Bootstrap inicial com ADMIN_EMAIL, ADMIN_PASSWORD (mínimo 16 caracteres), ADMIN_NAME no ambiente:
```bash
docker compose --env-file .env -f deploy/compose.cloud.yaml run --rm --no-deps migrate npm run db:bootstrap
```
Ajuste certificados DNS/HTTPS antes da abertura pública. Faça backups fora da VM, testes de restauração e validação de acesso/autorização E2E. Esta documentação não confirma implantação, conexão Neon nem saúde do ambiente.

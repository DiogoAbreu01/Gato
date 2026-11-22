# Gato — implantação Oracle Cloud + Neon Postgres

## Estado atual (2026-11-22)

- Projeto Neon: **Gato**, organização Gato Atletica, região São Paulo, branch `production`, banco `neondb`, plano gratuito.
- A migração Prisma `20261110000000_init` foi aplicada ao banco Neon via SQL Editor em 22/11/2026, dentro de `BEGIN/COMMIT`; 23 tabelas do aplicativo e `_prisma_migrations` verificadas, `finished_at` confirmado.
- Snapshot manual da branch production criado às **21:46:34 UTC** em 22/11/2026. Free tem um snapshot manual e 6 horas de histórico, sem agendamento automático; a restauração ainda não foi testada.
- Código e testes de integração aprovados no GitHub Actions usando PostgreSQL efêmero (ver `STATUS.md`).
- **A Oracle ainda não está provisionada; o app NÃO está online.** O console atualmente solicita Cloud Account Name. Nenhuma credencial de VM ou Neon está no repositório.

## Preparar VM Oracle (Ubuntu 24.04 LTS, ARM64 ou AMD64)

Acesse o console OCI autenticado; confirme elegibilidade Always Free, quota e disponibilidade da região. Crie VM Ubuntu, par de chaves SSH e IP público reservado, se permitido pelo plano. Configure NSG/security list: TCP 443 e 80 públicos; SSH 22 apenas IP administrativo. NÃO exponha as portas 3000, 5432 e interfaces Docker públicas.

No sistema remoto da Oracle (não no computador pessoal):
1. Instale Docker Engine e Docker Compose plugin; configure atualizações de segurança, firewall e proteção SSH.
2. `git clone https://github.com/DiogoAbreu01/Gato.git /opt/gato` ou crie o diretório com usuário de serviço.
3. `cd /opt/gato && cp .env.example .env && chmod 600 .env`.
4. No painel Neon, copie duas strings da branch production, banco neondb: **pooled** (`DATABASE_URL` para consultas da aplicação) e **direct** (`DATABASE_URL_UNPOOLED` para migrations e backups). Ambas devem ter `sslmode=require`. Configure no `.env` privado da VM. Nunca coloque as strings em chats, GitHub ou screenshots.
5. Defina `APP_URL=https://gato.seudominio.org`, `DOMAIN=gato.seudominio.org`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (ao menos 16 caracteres aleatórios), `ADMIN_NAME` e `BACKUP_REMOTE`. Aponte o DNS A para o IP Oracle, antes da emissão TLS pelo Caddy.
6. Execute na VM:
```bash
cd /opt/gato
sudo docker compose --env-file .env config --quiet
sudo docker compose --env-file .env up -d --build
sudo docker compose --env-file .env ps
sudo docker compose --env-file .env logs --tail=100 migrate web caddy
# Primeira conta administrativa; só executar uma vez
sudo docker compose --env-file .env run --rm --no-deps migrate npm run db:bootstrap
curl -fsS https://gato.seudominio.org/api/health
```
7. Remova `ADMIN_PASSWORD` do `.env` depois de criar o administrador com sucesso. Teste login/logout, RBAC com usuário sem privilégios, operações financeiras, documentos privados e restauração em branch Neon isolada. Guarde os acessos em gerenciador de senhas.
8. Monitore uso gratuito e estabeleça plano de backup e alertas; o plano free pode suspender a computação ao exceder a cota.

`compose.yaml` é a configuração definitiva. O serviço `migrate` usa a string direta da Neon quando `DATABASE_URL_UNPOOLED` está definida; `web` usa a pooled. Nenhum `docker compose` possui container PostgreSQL. A migração inicial já foi aplicada à Neon e será tratada como aplicada pelo Prisma; atualizações futuras requerem revisão de migrações antes da produção.

## Backup externo obrigatório

O snapshot manual da Neon **não equivale a uma política de backup recorrente**, porque o plano Free não agenda snapshots. Na VM, configure um destino `rclone` fora da VM (Oracle Object Storage, outro storage com política de retenção) e a URL **direta** da Neon em `DATABASE_URL_UNPOOLED`. Execute:
```bash
cd /opt/gato
sudo bash scripts/backup.sh
```
Esse script usa `postgres:18-alpine` apenas como ferramenta efêmera de `pg_dump` contra o banco Neon remoto, gera cópia do volume de uploads da VM, calcula SHA256, envia tudo por `rclone` e elimina os arquivos temporários da VM. Não toca no banco do computador pessoal.

Teste a legibilidade de um dump obtido do storage:
```bash
sudo bash scripts/verify-restore.sh caminho/backup.dump [caminho/uploads.tar.gz]
```
Isso **não testa uma restauração completa**. Para um teste de recuperação real, restaure em uma branch Neon isolada, nunca sobre production, compare contagens/checksums e documente o procedimento.

## Atualizações e rollback

Antes de atualizar, valide backup externo e testes, faça tag da versão Git e revise o SQL de migrações. Na VM: `git pull --ff-only && sudo docker compose --env-file .env up -d --build`. Confira healthcheck e logs. Nunca execute `prisma migrate reset` ou restaure snapshots sobre production sem plano de recuperação.

## Itens não validados

Não há VM Oracle autenticada/provisionada, DNS, HTTPS público ou ligação do aplicativo com a Neon de produção. Backups via `rclone` e restauração completa permanecem sem teste real. O ambiente de testes GitHub Actions utiliza banco efêmero diferente do projeto Neon.

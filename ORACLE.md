# Gato — implantação direta na Oracle Cloud

O Gato é um webapp com backend e PostgreSQL. **Não use GitHub Pages**. Oracle Cloud Always Free é uma possibilidade, não uma garantia de capacidade, permanência ou custo zero para qualquer configuração.

## 1. Criar uma VM

- Na sua conta Oracle Cloud, abra Compute > Instances > Create instance.
- Escolha Ubuntu 22.04/24.04 compatível e, se disponível no Always Free, shape Ampere A1 Flex ARM64; caso não exista capacidade, escolha um shape elegível disponível. Confira o selo Always Free e os limites da região antes de confirmar.
- Adicione uma chave pública SSH (nunca compartilhe a chave privada), reserve IP público ou configure DNS.
- Restrinja SSH (22) ao seu IP; abra TCP 80 e 443 e opcionalmente UDP 443 no NSG/Security List. **Nunca exponha 5432 ou 3000**.
- Mantenha SSH acessível antes de habilitar firewall local. Valide a política de rede da Oracle e o firewall do Ubuntu separadamente.

## 2. Preparação do Ubuntu

Transferir e executar `deploy/oracle-setup.sh` com seu usuário que tem sudo:

```bash
bash deploy/oracle-setup.sh
```

Reconecte sua sessão SSH para ativar o grupo docker. O script instala Docker Engine + Compose plugin, mas **não cria instância** e **não inicia Gato**.

## 3. Disponibilizar arquivos

O repositório GitHub `DiogoAbreu01/Gato` precisa conter o projeto **completo** antes de clonar (não apenas README e devcontainer). Transfira o conteúdo da pasta `atletica-os` do arquivo entregue, via `scp` ou upload para o GitHub, para `/home/ubuntu/gato` (ajuste o nome do usuário da imagem Oracle). Não transfira `.env`, dados de membros, bancos de dados ou credenciais para o GitHub.

## 4. Configuração e início

```bash
cd ~/gato
cp .env.example .env
chmod 600 .env
nano .env
```

Defina `POSTGRES_PASSWORD` com valor aleatório e seguro (se usar caracteres especiais, precisam estar codificados na URL do PostgreSQL); defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` únicos e fortes, `APP_URL=https://gato.seudominio.com`, `DOMAIN=gato.seudominio.com`, e `BACKUP_REMOTE` configurado no rclone. Aponte o DNS A para o IP público da VM antes de iniciar o Caddy.

```bash
docker compose -f compose.yaml -f deploy/compose.proxy.yaml up -d --build
docker compose ps
docker compose logs --tail=100 web
curl -fsS http://127.0.0.1:3000/api/health
```

Verifique o build e as migrações nos logs, crie a conta administrativa conforme `README.md` e valide login, permissões e persistência antes de adicionar pessoas reais. **Não compartilhe a aplicação com a Atlética até validar todos os testes E2E e controles de acesso.**

## 5. Segurança operacional

- HTTPS exige um domínio DNS resolvendo para a VM e portas públicas abertas; não configure credenciais ou admin padrão em produção.
- Banco permanece privado em uma rede de containers. Volume do PostgreSQL e uploads não devem ser apagados em atualizações.
- Execute `scripts/backup.sh` somente após configurar o `rclone` e BACKUP_REMOTE para armazenamento externo; teste restauração regularmente.
- Antes de cada atualização, faça backup; aplique migrações compatíveis; mantenha procedimento de rollback; atualize imagens com atualizações de segurança.
- Evite repositório público para documentos/rotinas internos e jamais publique segredos ou dados pessoais.

## Estado

Este documento é um guia de implantação, **não evidência de que a VM foi criada, que a build passou ou que o app está online**.

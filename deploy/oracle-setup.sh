#!/usr/bin/env bash
# Preparação de VM Ubuntu 22.04/24.04 na Oracle Cloud (ARM64 ou AMD64).
# Execute como usuário sudo na VM; não transfere credenciais nem implanta a aplicação automaticamente.
set -Eeuo pipefail
if [[ "${EUID}" -eq 0 ]]; then echo 'Execute com seu usuário sudo, não diretamente como root.' >&2; exit 1; fi
command -v sudo >/dev/null || { echo 'sudo não encontrado' >&2; exit 1; }
. /etc/os-release
if [[ "$ID" != 'ubuntu' ]]; then echo 'Este script foi feito para Ubuntu.' >&2; exit 1; fi
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git ufw
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
ARCH="$(dpkg --print-architecture)"
printf 'deb [arch=%s signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu %s stable\n' "$ARCH" "${UBUNTU_CODENAME:-$VERSION_CODENAME}" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
# UFW pode afetar SSH/iptables na OCI; não ativar automaticamente. Configuração de portas é tarefa separada.
echo 'Docker e Compose instalados. Reconecte seu SSH para aplicar o grupo docker.'
echo 'Configure regras de entrada TCP 22 (seu IP), 80 e 443 no Security List/NSG da Oracle.'
echo 'Não abra 5432 (PostgreSQL) nem 3000 (Next.js) à internet.'
echo 'Depois copie o código para ~/gato, configure .env e execute:'
echo '  cd ~/gato && docker compose -f compose.yaml -f deploy/compose.proxy.yaml up -d --build'
echo 'IMPORTANTE: configure DNS DOMAIN, APP_URL=https://DOMAIN e BACKUP_REMOTE antes de produção.'

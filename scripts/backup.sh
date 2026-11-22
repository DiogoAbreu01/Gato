#!/usr/bin/env bash
# Backup do banco remoto Neon + uploads Oracle; jamais usa PostgreSQL local.
set -Eeuo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if [[ -f .env ]]; then
  set -a
  # Arquivo privado da VM; nao publique no Git.
  source .env
  set +a
fi

: "${DATABASE_URL_UNPOOLED:?Configure DATABASE_URL_UNPOOLED (Neon direto, sem -pooler) no .env da VM}"
: "${BACKUP_REMOTE:?Configure BACKUP_REMOTE (destino rclone externo a VM) no .env}"
[[ "${DATABASE_URL_UNPOOLED}" == postgresql://* ]] || { echo "URL PostgreSQL invalida" >&2; exit 2; }
[[ "${DATABASE_URL_UNPOOLED}" != *-pooler.* ]] || { echo "Use Neon direto para pg_dump, sem pooler" >&2; exit 2; }
command -v docker >/dev/null || { echo "Docker nao encontrado" >&2; exit 2; }
command -v rclone >/dev/null || { echo "rclone nao encontrado: backup remoto obrigatorio" >&2; exit 2; }

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORKDIR="$(mktemp -d)"
chmod 700 "$WORKDIR"
trap 'rm -rf -- "$WORKDIR"' EXIT
DUMP="$WORKDIR/gato-db-$STAMP.dump"
UPLOADS="$WORKDIR/gato-uploads-$STAMP.tar.gz"

# Utiliza cliente Postgres em container efemero: o banco permanece na Neon.
docker run --rm -e DATABASE_URL_UNPOOLED --entrypoint sh postgres:18-alpine \
  -eu -c 'exec pg_dump --dbname="$DATABASE_URL_UNPOOLED" --format=custom --no-owner --no-privileges --no-password' > "$DUMP"
[[ -s "$DUMP" ]] || { echo "pg_dump produziu arquivo vazio" >&2; exit 2; }

# Copia o volume persistente da VM Oracle sem iniciar o servidor.
docker compose run --rm --no-deps -T --user 0:0 \
  -v "$WORKDIR:/backup" --entrypoint sh web \
  -eu -c 'tar -czf /backup/'"$(basename "$UPLOADS")"' -C /srv/atletica/storage .'
[[ -s "$UPLOADS" ]] || { echo "Arquivo de uploads vazio" >&2; exit 2; }

(cd "$WORKDIR"; sha256sum "$(basename "$DUMP")" "$(basename "$UPLOADS")" > SHA256SUMS)
rclone copyto "$DUMP" "$BACKUP_REMOTE/$(basename "$DUMP")" --checksum
rclone copyto "$UPLOADS" "$BACKUP_REMOTE/$(basename "$UPLOADS")" --checksum
rclone copyto "$WORKDIR/SHA256SUMS" "$BACKUP_REMOTE/gato-SHA256SUMS-$STAMP.txt" --checksum
echo "Backup remoto finalizado ($STAMP). Artefatos locais temporarios removidos."

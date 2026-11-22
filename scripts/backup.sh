#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")/.."
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
OUT="$BACKUP_DIR/atletica-$STAMP.dump"
# Dump em formato customizado (inclui esquema e dados).
docker compose exec -T db pg_dump -U atletica -d atletica -Fc > "$OUT"
chmod 600 "$OUT"
# Uploads privados também precisam de cópia consistente.
docker compose run --rm --no-deps -T -v "$(realpath "$BACKUP_DIR"):/backup" --entrypoint sh web -c 'tar -czf /backup/uploads-archive.tar.gz -C /srv/atletica/storage .' 
mv "$BACKUP_DIR/uploads-archive.tar.gz" "$BACKUP_DIR/uploads-$STAMP.tar.gz"
chmod 600 "$BACKUP_DIR/uploads-$STAMP.tar.gz"
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'atletica-*.dump' -o -name 'uploads-*.tar.gz' \) -mtime +14 -delete
if [[ -z "${BACKUP_REMOTE:-}" ]]; then
  echo "ERRO: cópia local concluída, mas BACKUP_REMOTE não configurado. Backup remoto obrigatório antes de produção." >&2
  exit 2
fi
command -v rclone >/dev/null || { echo "Instale rclone para backup externo" >&2; exit 2; }
rclone copy "$OUT" "$BACKUP_REMOTE" --checksum
rclone copy "$BACKUP_DIR/uploads-$STAMP.tar.gz" "$BACKUP_REMOTE" --checksum
echo "Backup local e remoto concluídos: $STAMP"

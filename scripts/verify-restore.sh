#!/usr/bin/env bash
# Restaura SOMENTE em banco de verificação isolado, nunca no banco em uso.
set -Eeuo pipefail
cd "$(dirname "$0")/.."
FILE="${1:?Informe caminho para backup .dump}"
[[ -f "$FILE" ]] || { echo "Arquivo não encontrado" >&2; exit 1; }
TEST_DB="atletica_restore_$(date +%s)"
docker compose exec -T db createdb -U atletica "$TEST_DB"
cat "$FILE" | docker compose exec -T db pg_restore --no-owner --no-privileges -U atletica -d "$TEST_DB"
docker compose exec -T db psql -U atletica -d "$TEST_DB" -c 'SELECT count(*) AS tabelas FROM information_schema.tables WHERE table_schema = '\''public'\'';'
echo "Banco de verificação: $TEST_DB (não removido para inspeção)."

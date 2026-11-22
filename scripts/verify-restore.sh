#!/usr/bin/env bash
# Valida se um dump Postgres custom e um tar de uploads sao legiveis.
# NAO substitui teste real de restauracao em branch isolada da Neon.
set -Eeuo pipefail
FILE="${1:?Informe o caminho do arquivo .dump do PostgreSQL}"
[[ -f "$FILE" && -s "$FILE" ]] || { echo "Dump ausente ou vazio" >&2; exit 2; }
command -v docker >/dev/null || { echo "Docker nao encontrado" >&2; exit 2; }
DUMP_PATH="$(realpath "$FILE")"
ENTRIES="$(docker run --rm -v "$DUMP_PATH:/input.dump:ro" --entrypoint pg_restore postgres:18-alpine --list /input.dump)"
TABLES="$(printf '%s\n' "$ENTRIES" | grep -Ec ' TABLE public ' || true)"
[[ "$TABLES" -ge 20 ]] || { echo "Dump incompleto: $TABLES tabelas" >&2; exit 2; }
echo "Catalogo pg_restore legivel ($TABLES tabelas)."
if [[ "${2:-}" != "" ]]; then
  [[ -f "$2" ]] || { echo "Arquivo de uploads ausente" >&2; exit 2; }
  tar -tzf "$2" >/dev/null
  echo "Arquivo de uploads tar.gz valido."
fi
echo "Verificacao de integridade do arquivo concluida. Teste de restauracao real exige branch Neon isolada."

#!/usr/bin/env bash
# Gera um backup dos dados da Hermes + .env em $BACKUP_DIR (mesmo formato das outras stacks).
# Formato: <APP_NAME>_<AAAAMMDD-HHMMSS>.tar contendo appdata.tar.zst (ou .gz, sem zstd) e env.
# Rode com o container parado (make backup faz isso): os bancos SQLite precisam estar fechados.
set -euo pipefail

: "${APP_NAME:?APP_NAME não definido}"
: "${APPDATA_DIR:?APPDATA_DIR não definido}"
: "${BACKUP_DIR:?BACKUP_DIR não definido}"
KEEP="${BACKUP_KEEP:-7}"

[ -d "$APPDATA_DIR" ] || { echo "✘ $APPDATA_DIR não existe: nada para guardar" >&2; exit 1; }

ts="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
# Os dados passam de dezenas de GB: o rascunho fica no mesmo disco do backup, não em /tmp.
tmp="$(mktemp -d "$BACKUP_DIR/.tmp-XXXXXX")"
trap 'rm -rf "$tmp"' EXIT

if command -v zstd >/dev/null 2>&1; then
  tar -I 'zstd -T0' -cf "$tmp/appdata.tar.zst" -C "$APPDATA_DIR" .
else
  tar -czf "$tmp/appdata.tar.gz" -C "$APPDATA_DIR" .
fi
[ -f .env ] && cp .env "$tmp/env"

out="$BACKUP_DIR/${APP_NAME}_${ts}.tar"
tar -cf "$out" -C "$tmp" .
echo "✔ Backup criado: $out ($(du -h "$out" | cut -f1))"

# Retenção: mantém apenas os $KEEP mais recentes
mapfile -t old < <(ls -1t "$BACKUP_DIR"/"${APP_NAME}"_*.tar 2>/dev/null | tail -n +"$((KEEP + 1))")
if [ "${#old[@]}" -gt 0 ]; then
  rm -f -- "${old[@]}"
  echo "✔ ${#old[@]} backup(s) antigo(s) removido(s) (retenção: $KEEP)"
fi

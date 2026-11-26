#!/usr/bin/env bash
# Guarda num arquivo, em BACKUP_DIR, pastas da instalação antiga que a migração não traz.
# Uso (pelo make migrate-archive): archive.sh <pasta de dados antiga> <pastas...>
# A origem só é lida.
set -euo pipefail

: "${APP_NAME:?APP_NAME não definido}"
: "${BACKUP_DIR:?BACKUP_DIR não definido}"
src="${1:?Informe a pasta de dados antiga (FROM=...)}"; shift
[ "$#" -gt 0 ] || { echo "✘ Nenhuma pasta para guardar (ARCHIVE=...)" >&2; exit 1; }

present=()
for d in "$@"; do
  if [ -e "$src/$d" ]; then present+=("$d"); else echo "  ! $d não existe na origem"; fi
done
[ "${#present[@]}" -gt 0 ] || { echo "✘ Nenhuma das pastas existe em $src" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
stamp="$(date +%Y%m%d-%H%M%S)"
if command -v zstd >/dev/null 2>&1; then
  out="$BACKUP_DIR/${APP_NAME}_legado_${stamp}.tar.zst"
  tar -C "$src" -cf - "${present[@]}" | zstd -q -T0 -o "$out"
else
  out="$BACKUP_DIR/${APP_NAME}_legado_${stamp}.tar.gz"
  tar -C "$src" -czf "$out" "${present[@]}"
fi
echo "✔ ${present[*]} → $out ($(du -h "$out" | cut -f1))"

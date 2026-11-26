#!/usr/bin/env bash
# Restaura um backup gerado por backup.sh. Uso: restore.sh <arquivo.tar>
#
# Nada é apagado: o backup é extraído numa pasta ao lado de $APPDATA_DIR e, só depois de extraído
# por inteiro, as pastas trocam de nome. Os dados que estavam lá ficam em
# $APPDATA_DIR.antes-restore-<data>, para conferir e apagar à mão. Uma falha no meio deixa
# $APPDATA_DIR como estava. O .env do backup é salvo como .env.restored.
set -euo pipefail

: "${APPDATA_DIR:?APPDATA_DIR não definido}"
file="${1:?Informe o arquivo de backup}"
[ -f "$file" ] || { echo "✘ Arquivo não encontrado: $file" >&2; exit 1; }

target="${APPDATA_DIR%/}"
parent="$(dirname "$target")"
ts="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$parent"

tmp="$(mktemp -d "$(dirname "$file")/.tmp-XXXXXX")"
staging="$(mktemp -d "$parent/.restore-XXXXXX")"
trap 'rm -rf "$tmp" "$staging"' EXIT

tar -xf "$file" -C "$tmp"
if [ -f "$tmp/appdata.tar.zst" ]; then
  tar -I zstd -xf "$tmp/appdata.tar.zst" -C "$staging"
elif [ -f "$tmp/appdata.tar.gz" ]; then
  tar -xzf "$tmp/appdata.tar.gz" -C "$staging"
else
  echo "✘ $file não tem appdata.tar.zst nem appdata.tar.gz" >&2
  exit 1
fi
[ -n "$(ls -A "$staging")" ] || { echo "✘ O backup extraído está vazio; $target não foi alterado" >&2; exit 1; }

if [ -e "$target" ]; then
  mv "$target" "$target.antes-restore-$ts"
  echo "• Dados anteriores guardados em $target.antes-restore-$ts"
fi
mv "$staging" "$target"
echo "✔ Restaurado: $target"

if [ -f "$tmp/env" ]; then
  cp "$tmp/env" .env.restored
  echo "✔ .env do backup salvo em .env.restored (revise e renomeie se necessário)"
fi

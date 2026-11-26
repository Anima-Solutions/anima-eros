#!/usr/bin/env bash
# Teste da imagem nova sobre uma CÓPIA de dados existentes, sem tocar nos originais.
# Uso: smoke.sh <pasta de dados de origem>   (ex.: /srv/appdata/anima-hermes/hermes)
#
# A cópia leva os tokens dos canais (Telegram, WhatsApp...) e os cron jobs. Por isso o container
# roda com --network none: nada sai dele, então não disputa mensagens com quem já usa esses
# tokens nem dispara entregas. Ele confere o que só os dados reais mostram: a migração dos
# bancos, os comandos da CLI, o dashboard, o Webapp, o pacote pt-BR e a camada de VNC.
set -euo pipefail

: "${APP_NAME:?APP_NAME não definido}"
: "${SRV_ROOT:?SRV_ROOT não definido}"
: "${IMAGE:?IMAGE não definido}"
src="${1:?Informe a pasta de dados de origem (SMOKE_FROM=...)}"
[ -d "$src" ] || { echo "✘ $src não existe" >&2; exit 1; }
docker image inspect "$IMAGE" >/dev/null 2>&1 || { echo "✘ Imagem $IMAGE não existe: rode make build" >&2; exit 1; }

name="${APP_NAME}-smoke"
copy="$SRV_ROOT/appdata/$name/hermes"
pack="$(pwd)/plugins/anima-pt-br"

# Caches e downloads não dizem nada sobre a migração e custam gigas; SMOKE_EXCLUDE soma pastas
# grandes do servidor (ex.: um workspace), separadas por espaço.
excludes=(cache .cache chromium image_cache audio_cache logs installs graphify-skill-install home .local
          gateway.pid gateway.lock gateway.sock auth.lock)
for extra in ${SMOKE_EXCLUDE:-}; do excludes+=("$extra"); done
rsync_args=(-a --delete)
for e in "${excludes[@]}"; do rsync_args+=(--exclude "/$e"); done

echo "• Copiando $src → $copy (sem: ${excludes[*]})"
mkdir -p "$copy"
rsync "${rsync_args[@]}" "$src/" "$copy/"
echo "✔ Cópia pronta ($(du -sh "$copy" | cut -f1))"

docker rm -f "$name" >/dev/null 2>&1 || true
cleanup() {
  docker rm -f "$name" >/dev/null 2>&1 || true
  if [ "${KEEP:-0}" = 1 ]; then
    echo "• Cópia mantida em $copy (KEEP=1)"
  else
    rm -rf "$SRV_ROOT/appdata/$name"
    echo "• Cópia removida"
  fi
}
trap cleanup EXIT

docker run -d --name "$name" --network none --shm-size 1g \
  -e HERMES_UID="${HERMES_UID:-1000}" -e HERMES_GID="${HERMES_GID:-1000}" \
  -e HERMES_DASHBOARD=1 -e HERMES_DASHBOARD_HOST=127.0.0.1 -e HERMES_DASHBOARD_PORT=9119 \
  -e HERMES_DASHBOARD_BASIC_AUTH_USERNAME=smoke \
  -e HERMES_DASHBOARD_BASIC_AUTH_PASSWORD="$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')" \
  -e TZ="${TZ:-America/Sao_Paulo}" \
  -v "$copy:/opt/data" -v "$pack:/opt/data/plugins/anima-pt-br:ro" \
  "$IMAGE" sleep infinity >/dev/null
echo "✔ Container $name no ar, sem rede"

inside() { docker exec "$name" sh -c "$1"; }
http() { inside "curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:$1/" 2>/dev/null || echo 000; }

printf "• Esperando o dashboard"
for _ in $(seq 1 90); do
  [ "$(http 9119)" != 000 ] && break
  printf "."; sleep 2
done
echo

failed=0
check() {
  local label="$1" cmd="$2" out
  if out="$(inside "$cmd" 2>&1)"; then
    printf "  ✔ %-34s %s\n" "$label" "$(printf '%s' "$out" | grep -v 'install out of sync' | tail -n 1 | cut -c1-90)"
  else
    printf "  ✘ %-34s\n" "$label"; printf '%s\n' "$out" | tail -n 8 | sed 's/^/      /'
    failed=1
  fi
}

echo "Resultados:"
check "Versão" "hermes --version | head -n 1"
check "Sessões (banco migrado)" "hermes sessions list --limit 3"
check "Tarefas agendadas" "hermes cron list"
check "Kanban" "hermes kanban boards"
check "Pacote pt-BR" "hermes plugins enable anima-pt-br >/dev/null 2>&1; hermes plugins list 2>/dev/null | grep -q 'anima-pt-br.*enabled'"
check "Idioma pt" "hermes config set display.language pt"
check "VNC e XFCE" "command -v Xvnc && command -v xfwm4"
check "Dashboard responde (HTTP)" "code=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:9119/); echo \$code; [ \"\$code\" != 000 ]"
check "Webapp responde (HTTP)" "code=\$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:9120/); echo \$code; [ \"\$code\" != 000 ]"

echo "Últimos erros registrados na cópia (logs/errors.log), para revisar:"
inside "tail -n 15 /opt/data/logs/errors.log 2>/dev/null || echo '  (nenhum)'" | sed 's/^/  /'

if [ "$failed" = 0 ]; then
  echo "✔ Teste aprovado: a imagem $IMAGE roda sobre estes dados."
else
  echo "✘ Teste reprovado: veja os itens com ✘ acima. Os dados de origem não foram alterados."
  exit 1
fi

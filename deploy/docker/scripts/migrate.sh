#!/usr/bin/env bash
# Migração seletiva de uma instalação antiga da Hermes para esta stack, já instalada.
# Uso (pelo make migrate): migrate.sh <pasta de dados antiga>   (ex.: /srv/appdata/anima-hermes/hermes)
#
# Traz para a instalação nova:
#   - o agente principal (a raiz): persona, memórias, skills, tarefas agendadas, histórico, projetos e
#     os plugins instalados (menos o anima-brand, que a imagem já traz). O config.yaml da raiz NÃO vem:
#     a instalação nova tem o seu, feito pelo make configure e pelo hermes setup.
#   - cada agente (perfil), sem credenciais, estado do processo e caches (migrate-profile.rules);
#   - as pastas de trabalho da raiz (MIGRATE_WORKDIRS), nos mesmos caminhos;
#   - do .env, só as variáveis aprovadas (migrate-env-keys.txt).
#
# Cada agente chega ESTACIONADO (gateway.parked): sem bots e sem tarefas agendadas até o
# make channels-on. Assim a instalação antiga pode seguir no ar durante o teste.
#
# Pode rodar de novo: cada rodada copia só o que mudou e espelha a origem (o que sumiu lá some aqui).
# A origem nunca é alterada.
set -euo pipefail

src="${1:?Informe a pasta de dados antiga (FROM=...)}"
src="${src%/}"
: "${APPDATA_DIR:?APPDATA_DIR não definido}"
: "${CONTAINER:?CONTAINER não definido}"
dest="${APPDATA_DIR%/}"
here="$(cd "$(dirname "$0")" && pwd)"
dry="${DRY:-0}"
skip=" ${MIGRATE_SKIP_PROFILES:-default graphify-out} "
workdirs="${MIGRATE_WORKDIRS:-impulse anima-theia receita-federal clickup-doc attachments}"

die() { echo "✘ $*" >&2; exit 1; }
[ -d "$src" ] && [ -f "$src/config.yaml" ] || die "$src não parece uma pasta de dados da Hermes (falta config.yaml)"
[ -f "$dest/config.yaml" ] || die "$dest ainda não tem uma instalação: rode make up, make configure e o hermes setup antes"
[ "$(readlink -f "$src")" != "$(readlink -f "$dest")" ] || die "origem e destino são a mesma pasta"
if [ -n "$(docker ps -q -f "name=^${CONTAINER}$")" ]; then
  die "o container $CONTAINER está rodando: pare com make down antes de migrar"
fi

rs=(-aHAX --delete --stats)
dryflag=()
if [ "$dry" = 1 ]; then
  rs+=(-n)
  dryflag=(--dry)
  echo "• Simulação (DRY=1): nada é gravado. Os números abaixo são o que seria copiado."
fi
owner="$(stat -c %u:%g "$dest")"

# Copia $1 para $2, com os filtros extras, e resume o que mudou.
sync() {
  local from="$1" to="$2"; shift 2
  [ "$dry" = 1 ] || mkdir -p "$to"
  rsync "${rs[@]}" "$@" "$from" "$to" \
    | awk -F': ' '/^Number of regular files transferred/{n=$2} /^Total transferred file size/{s=$2}
                  END{printf "      %s arquivos, %s\n", n, s}'
}

# Um banco SQLite anda junto com o -wal e o -shm: copia os três, e apaga do destino os que não
# existem na origem (um -wal antigo ao lado de um banco novo o corromperia).
sync_db() {
  local name="$1" from="$2" to="$3" suffix
  [ -f "$from/$name" ] || return 0
  for suffix in "" -wal -shm; do
    if [ -f "$from/$name$suffix" ]; then
      [ "$dry" = 1 ] || rsync -aHAX "$from/$name$suffix" "$to/"
    elif [ "$dry" != 1 ]; then
      rm -f "$to/$name$suffix"
    fi
  done
  echo "      $name"
}

# Os plugins vêm um a um: a pasta do anima-pt-br no destino é um ponto de montagem e não se mexe nela.
sync_plugins() {
  local dir="$1" from="$2" to="$3" p
  [ -d "$from/$dir" ] || return 0
  for p in "$from/$dir"/*/; do
    p="$(basename "$p")"
    case "$p" in anima-brand|anima-pt-br) continue ;; esac
    echo "    $dir/$p"
    sync "$from/$dir/$p/" "$to/$dir/$p/"
  done
}

echo "Origem:  $src"
echo "Destino: $dest"
echo "  A origem só é lida. Se a instalação antiga estiver no ar, os bancos podem sair no meio de uma"
echo "  escrita: no teste isso não importa, e na troca você roda de novo com ela parada."
echo

# --- 1. O agente principal ----------------------------------------------------------------------
echo "1. Agente principal (raiz)"
for d in memories skills cron; do
  [ -d "$src/$d" ] || continue
  echo "    $d/"
  sync "$src/$d/" "$dest/$d/" --exclude '/ticker_*' --exclude '*.lock'
done
if [ -f "$src/SOUL.md" ]; then
  [ "$dry" = 1 ] || rsync -aHAX "$src/SOUL.md" "$dest/"
  echo "    SOUL.md"
fi
echo "    bancos: histórico, projetos, respostas da API, métricas compartilhadas"
for db in state.db projects.db response_store.db shared-state.db; do sync_db "$db" "$src" "$dest"; done
sync_plugins plugins "$src" "$dest"
sync_plugins desktop-plugins "$src" "$dest"
python3 "$here/migrate-env.py" "$here/migrate-env-keys.txt" "$src/.env" "$dest/.env" "${dryflag[@]}"
[ "$dry" = 1 ] || [ "$(id -u)" != 0 ] || chown "$owner" "$dest/.env"
[ ! -s "$src/auth.json" ] || echo "      logins (auth.json) não vêm: refaça com hermes auth add <provedor>"
echo

# --- 2. Os agentes ------------------------------------------------------------------------------
echo "2. Agentes (perfis)"
migrated=()
for p in "$src"/profiles/*/; do
  name="$(basename "$p")"
  case "$skip" in *" $name "*) echo "  − $name (fica de fora)"; continue ;; esac
  migrated+=("$name")
  echo "  + $name"
  sync "$p" "$dest/profiles/$name/" --filter="merge $here/migrate-profile.rules"
  python3 "$here/migrate-env.py" "$here/migrate-env-keys.txt" "$p/.env" "$dest/profiles/$name/.env" "${dryflag[@]}"
  if [ "$dry" != 1 ]; then
    touch "$dest/profiles/$name/gateway.parked"
    if [ "$(id -u)" = 0 ]; then
      chown "$owner" "$dest/profiles/$name/gateway.parked"
      [ ! -f "$dest/profiles/$name/.env" ] || chown "$owner" "$dest/profiles/$name/.env"
    fi
  fi
  [ ! -s "$p/auth.json" ] || echo "      login próprio (auth.json) não vem: o agente passa a usar o login da raiz"
  if [ -n "$(ls -A "$p/mcp-tokens" 2>/dev/null)" ]; then
    echo "      MCP com login (mcp-tokens) não vem: refaça com hermes -p $name mcp login <servidor>"
  fi
done
echo

# --- 3. As pastas de trabalho -------------------------------------------------------------------
echo "3. Pastas de trabalho"
for d in $workdirs; do
  if [ ! -d "$src/$d" ]; then echo "  ! $d não existe na origem"; continue; fi
  echo "  + $d/"
  # O vault do Impulse é montado pelo docker-compose.override.yml, não copiado.
  sync "$src/$d/" "$dest/$d/" --exclude '/vault/'
done
echo

if [ "$dry" = 1 ]; then
  echo "✔ Simulação concluída. Para copiar de verdade, rode sem DRY=1."
else
  echo "✔ Migração concluída: ${#migrated[@]} agentes, todos estacionados (sem bots e sem tarefas agendadas)."
  echo "  Próximo passo: make up. Os bots só ligam com make channels-on."
fi

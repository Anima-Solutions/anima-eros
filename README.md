# Ânima Eros

O Ânima Eros é o agente de IA da Ânima: um fork do [Hermes Agent](https://github.com/NousResearch/hermes-agent)
com o design system Ânima (`@anima-solutions/design-system`), a marca Ânima Eros e a interface em português.
Este repositório gera uma imagem Docker com o gateway, o dashboard e o Webapp.

- [Guia de instalação](#guia-de-instalação): sobe uma stack nova, com dados próprios.
- [Guia de substituição](#guia-de-substituição): troca o Hermes que já roda em produção pelo Ânima Eros, mantendo os dados.

Os detalhes do container (variáveis do `.env`, portas, rede) estão em [`deploy/docker/README.md`](deploy/docker/README.md).

## Antes de começar

| Item | Onde |
|---|---|
| Docker com BuildKit e Compose v2 | na máquina de build e no VPS |
| Token do GitHub com `read:packages` | só na máquina de build, em `NODE_AUTH_TOKEN` (o design system é privado) |
| Acesso SSH ao VPS como root | aqui o alias `vps_anima01`, do `~/.ssh/config` |
| Nginx Proxy Manager (NPM) no VPS | container `anima-proxy-manager-app`, stack em `/srv/stacks/anima-proxy-manager` |
| DNS dos domínios apontando para o VPS | registros A para o IP do `vps_anima01` |

A imagem é construída **na sua máquina** e enviada pronta para o VPS: o token nunca sai daqui e o VPS não precisa
aguentar o build. A imagem é `amd64` e tem cerca de 4,8 GB (1,5 a 2 GB compactada na transferência).

O token fica só no ambiente do shell, nunca em arquivo do repositório:

```sh
export NODE_AUTH_TOKEN=...   # token com read:packages
```

---

## Guia de instalação

Sobe o Ânima Eros como uma stack **separada** de qualquer Hermes que já exista no VPS. Os valores abaixo são os da
demo; para outra instalação, troque nomes, pastas, rede, sub-rede e domínios.

| | Demo |
|---|---|
| Stack (compose) | `/srv/stacks/anima-eros-demo` |
| Dados (`~/.hermes` do container) | `/srv/appdata/anima-eros-demo/hermes` |
| Container | `anima-eros-demo` |
| Rede / sub-rede | `anima-eros-demo-net` / `172.30.0.0/24` (livre no `vps_anima01`) |
| Dashboard | `https://demo.eros.animahub.ai` |
| Webapp | `https://demo.app.eros.animahub.ai` |

### 1. Construir a imagem (na sua máquina)

```sh
cd deploy/docker
docker compose build          # usa NODE_AUTH_TOKEN; gera hermes-agent:anima
```

### 2. Enviar a imagem e a pasta de deploy

```sh
docker save hermes-agent:anima | gzip | ssh vps_anima01 'gunzip | docker load'

ssh vps_anima01 'mkdir -p /srv/stacks/anima-eros-demo /srv/appdata/anima-eros-demo/hermes'
rsync -av --exclude .env --exclude data --exclude exemplos \
  deploy/docker/ vps_anima01:/srv/stacks/anima-eros-demo/
```

O `rsync` leva o `docker-compose.yml`, o `.env.example` e o pacote de idioma `plugins/anima-pt-br`. O `.env` e a
pasta `data/` da sua máquina ficam de fora de propósito.

### 3. Criar o `.env` no VPS

```sh
ssh vps_anima01
cd /srv/stacks/anima-eros-demo
cp .env.example .env && chmod 600 .env
```

Ajuste no `.env` (gere segredos novos, não reaproveite os de outra máquina):

```ini
COMPOSE_PROJECT_NAME=anima-eros-demo
HERMES_IMAGE=hermes-agent:anima
HERMES_CONTAINER_NAME=anima-eros-demo
HERMES_DATA_DIR=/srv/appdata/anima-eros-demo/hermes
HERMES_UID=1000
HERMES_GID=1000

HOST_BIND_IP=127.0.0.1
HERMES_NETWORK=anima-eros-demo-net
HERMES_SUBNET=172.30.0.0/24

DASHBOARD_PUBLIC_URL=https://demo.eros.animahub.ai
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=           # openssl rand -hex 16
DASHBOARD_SESSION_SECRET=     # openssl rand -base64 32
API_SERVER_KEY=               # vazio = API desligada; para ligar: openssl rand -hex 32
```

`HOST_BIND_IP=127.0.0.1` mantém as portas fora da internet: quem publica é o NPM, pela rede Docker.

### 4. Subir o container

```sh
docker compose up -d --no-build
docker compose logs -f        # Ctrl+C quando o gateway e o dashboard estiverem no ar
```

O `--no-build` usa a imagem enviada no passo 2. Sem ele, o Compose tentaria construir de novo no VPS (e falharia sem o token).

### 5. Configurar o Hermes

```sh
docker compose exec hermes hermes setup                       # modelo e chaves de API
docker compose exec hermes hermes plugins enable anima-pt-br  # pacote pt-BR: plugins do usuário só carregam ativados
docker compose exec hermes hermes config set display.language pt
docker compose exec hermes hermes config set webapp.enabled true
docker compose exec hermes hermes config set webapp.host 0.0.0.0
docker compose exec hermes hermes config set webapp.port 9120
docker compose exec hermes hermes config set webapp.public_url https://demo.app.eros.animahub.ai
```

Em `/srv/appdata/anima-eros-demo/hermes/config.yaml`, diga ao Hermes que ele está atrás de um proxy HTTPS (a sub-rede é a
`HERMES_SUBNET`, por onde o NPM chega):

```yaml
dashboard:
  trusted_proxies:
    - "172.30.0.0/24"
```

Depois: `docker compose restart`.

### 6. Ligar o NPM à rede da stack

Agora, sem reiniciar o NPM:

```sh
docker network connect anima-eros-demo-net anima-proxy-manager-app
```

Para a ligação sobreviver a um `docker compose up` do NPM, registre a rede em
`/srv/stacks/anima-proxy-manager/docker-compose.yml`:

```yaml
services:
  app:
    networks: [default, anima-eros-demo-net]

networks:
  default:
    external: true
    name: anima_proxymanager_shared_network
  anima-eros-demo-net:
    external: true
```

### 7. Criar os Proxy Hosts no NPM

Crie dois, ambos com **Websockets Support**, **Block Common Exploits**, certificado Let's Encrypt, **Force SSL** e **HTTP/2**:

| Domínio | Scheme | Forward Hostname | Forward Port |
|---|---|---|---|
| `demo.eros.animahub.ai` | `http` | `anima-eros-demo` | `9119` |
| `demo.app.eros.animahub.ai` | `http` | `anima-eros-demo` | `9120` |

### 8. Conferir

- `https://demo.eros.animahub.ai` abre a tela de login Ânima; entre com `DASHBOARD_USERNAME` e `DASHBOARD_PASSWORD`.
- `https://demo.app.eros.animahub.ai` abre o Webapp em português. No primeiro acesso de cada navegador o português leva
  uns 15 s para aparecer (o backend ainda está respondendo); ao recarregar, aparece na hora.
- `docker compose logs --tail 100` sem erros.

### Atualizar

Na sua máquina, com o `main` atualizado:

```sh
cd deploy/docker && docker compose build
docker save hermes-agent:anima | gzip | ssh vps_anima01 'gunzip | docker load'
rsync -av --exclude .env --exclude data --exclude exemplos deploy/docker/ vps_anima01:/srv/stacks/anima-eros-demo/
ssh vps_anima01 'cd /srv/stacks/anima-eros-demo && docker compose up -d --no-build && docker image prune -f'
```

---

## Guia de substituição

Troca a imagem do Hermes que roda em produção (`/srv/stacks/anima-hermes`, container `anima-hermes-hermes`) pela do
Ânima Eros, **mantendo** os dados, os domínios, o login OAuth, o vault do Obsidian e os pacotes de VNC/XFCE.

Faça isto só depois de aprovar a demo do [guia de instalação](#guia-de-instalação) **e** de concluir a
refatoração da metodologia de implantação (abaixo).

> **Pendente antes da migração final: refatorar a metodologia de implantação.** O modelo atual (portas publicadas no
> host, sub-rede própria, o NPM entrando na rede do Hermes) não segue o padrão das outras stacks do VPS. A refatoração
> revê o compose, a forma de entregar a imagem e estes guias: o Hermes entra na rede compartilhada do NPM
> (`anima_proxymanager_shared_network`, externa), só com `expose`, sem `ports` nem sub-rede. Os passos de instalação e
> de substituição acima serão reescritos nessa etapa.

### O que muda e o que não muda

| Muda | Fica igual |
|---|---|
| A base da imagem: `nousresearch/hermes-agent:latest` → `hermes-agent:anima` | `/srv/appdata/anima-hermes/hermes` (sessões, memórias, kanban, cron, perfis, `.env` interno) |
| A marca, o design system e o idioma (pacote pt-BR) | Os domínios do dashboard e do Webapp e os Proxy Hosts do NPM |
| | O login: OAuth no dashboard, usuário e senha no Webapp |
| | A rede `anima_proxymanager_shared_network`, os limites de CPU/memória e o `shm_size` |

> **Atenção:** a versão nova pode migrar os bancos (`state.db`, `kanban.db` e outros) de um jeito que a imagem antiga
> não lê. Por isso o backup do passo 2 é obrigatório: é ele que permite voltar atrás.

### 1. Enviar a imagem

Se a demo já está no VPS com a versão que você aprovou, a imagem `hermes-agent:anima` já está lá. Senão, repita os
passos 1 e 2 do guia de instalação (só a parte da imagem). Copie também o pacote de idioma:

```sh
rsync -av deploy/docker/plugins/anima-pt-br vps_anima01:/srv/stacks/anima-hermes/plugins/
```

### 2. Parar e fazer o backup

Avise quem usa o Eros: ele fica fora do ar durante o backup (os dados têm cerca de 64 GB).

```sh
ssh vps_anima01
cd /srv/stacks/anima-hermes
docker compose stop

# imagem atual, para poder voltar
docker tag anima-hermes-screen:latest anima-hermes-screen:pre-eros

# dados, com o container parado (consistência dos bancos SQLite)
mkdir -p /srv/backups
tar -C /srv/appdata/anima-hermes -I 'zstd -T0' -cf /srv/backups/anima-hermes-$(date +%F).tar.zst hermes
ls -lh /srv/backups/
```

Confira que o arquivo existe e tem um tamanho coerente antes de continuar. O disco tem espaço folgado para ele.

### 3. Apontar a stack para a imagem nova

A pasta `/srv/stacks/anima-hermes` é um repositório git: as mudanças abaixo ficam registradas e podem ser desfeitas.

No `Dockerfile`, troque só a primeira linha (os pacotes de VNC/XFCE continuam):

```dockerfile
FROM hermes-agent:anima
```

No `docker-compose.yml`:

```yaml
    build:
      context: .
      # remova "pull: true": hermes-agent:anima existe só neste VPS, não no Docker Hub
    image: anima-eros-screen:latest
    ...
    volumes:
      - /srv/storage/obsidian-impulse/vault:/opt/data/impulse/vault
      - /srv/appdata/anima-hermes/hermes:/opt/data
      - ./plugins/anima-pt-br:/opt/data/plugins/anima-pt-br:ro      # novo: pacote pt-BR
```

Registre: `git add -A && git commit -m "Ânima Eros: imagem do fork com design system e pt-BR"`.

### 4. Construir e subir

```sh
docker compose build          # só instala os pacotes de VNC/XFCE sobre hermes-agent:anima; não precisa de token
docker compose up -d
docker compose logs -f
docker compose exec hermes hermes plugins enable anima-pt-br
docker compose exec hermes hermes config set display.language pt
docker compose restart
```

### 5. Conferir

- O dashboard abre e o login OAuth funciona.
- O Webapp abre em português e entra com usuário e senha.
- As sessões antigas, as memórias, o kanban e os cron jobs estão lá.
- O VNC funciona e o vault do Obsidian aparece em `/opt/data/impulse/vault`.
- O plugin antigo `anima-brand` não briga com a marca nova. Se a aparência ficar misturada:
  `docker compose exec hermes hermes plugins disable anima-brand` e `docker compose restart`.

### Voltar atrás

Se algo der errado, volte à imagem e aos dados de antes:

```sh
cd /srv/stacks/anima-hermes
docker compose down
git revert --no-edit HEAD                       # Dockerfile e compose voltam a nousresearch/hermes-agent
mv /srv/appdata/anima-hermes/hermes /srv/appdata/anima-hermes/hermes.eros-falhou
tar -C /srv/appdata/anima-hermes -I zstd -xf /srv/backups/anima-hermes-AAAA-MM-DD.tar.zst
docker tag anima-hermes-screen:pre-eros anima-hermes-screen:latest
docker compose up -d --no-build
```

Restaurar os dados é necessário porque a versão nova pode ter migrado os bancos. A pasta `hermes.eros-falhou` guarda
o que aconteceu depois da troca, para investigar; apague quando não precisar mais.

### Depois da troca

Com a produção estável por alguns dias, a demo pode sair do ar:

```sh
cd /srv/stacks/anima-eros-demo && docker compose down
docker network disconnect anima-eros-demo-net anima-proxy-manager-app
```

Remova também os Proxy Hosts da demo no NPM e a rede `anima-eros-demo-net` do compose do NPM.

---

## Desenvolvimento

O guia de desenvolvimento do Hermes continua valendo: veja [`AGENTS.md`](AGENTS.md) e [`CONTRIBUTING.md`](CONTRIBUTING.md).
A documentação completa do Hermes está em <https://hermes-agent.nousresearch.com/docs/>.

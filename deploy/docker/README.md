# Stack Docker do Ânima Eros

Referência da stack: arquivos, variáveis e comandos. O passo a passo de instalação e de migração está no
[`README.md` da raiz](../../README.md).

A stack segue o padrão das outras da Ânima nos VPS (`anima-design-system`, `anima-docs-team`):

- o repositório clonado **é** a stack: `/srv/stacks/<APP_NAME>`, com os comandos rodando em `deploy/docker`;
- os dados ficam em `/srv/appdata/<APP_NAME>/hermes`, e os backups em `/srv/backups/<APP_NAME>`;
- a imagem é construída no próprio servidor (`make build`), com o token do GitHub Packages da conta de serviço no `.env`;
- o container entra na rede do Nginx Proxy Manager (`PROXY_NETWORK`) como **rede externa**. Ele só usa `expose`: não publica portas no host e não cria sub-rede.

## Arquivos

| Arquivo | Papel |
|---|---|
| `docker-compose.yml` | Produção: o serviço `eros`, cujo container se chama `APP_NAME` |
| `docker-compose.dev.yml` | Desenvolvimento: a mesma imagem na sua máquina, em `127.0.0.1` |
| `docker-compose.override.example.yml` | Modelo para montagens que só existem num servidor (copie para `docker-compose.override.yml`, que não é versionado) |
| `Dockerfile` | A camada do Eros (VNC/XFCE) sobre a imagem base |
| `Makefile` | Todos os comandos (`make help`) |
| `.env.example` | Modelo do `.env` (`make init`) |
| `plugins/anima-pt-br/` | Pacote de idioma pt-BR, montado só para leitura |
| `scripts/` | `backup.sh`, `restore.sh`, `migrate.sh` e `archive.sh`, chamados pelo `make`, e as listas da migração |

## Imagem

O `make build` faz o build em duas etapas:

1. **A base** `<APP_NAME>-base:<IMAGE_TAG>`, a partir do `Dockerfile` da raiz do repositório: a Hermes com o design
   system, a marca e o Webapp. O token entra só no build, como secret do BuildKit, e não fica em nenhuma camada.
2. **A imagem final** `<APP_NAME>:<IMAGE_TAG>`: a base mais os pacotes de VNC/XFCE, a partir de `deploy/docker/Dockerfile`.

O `docker-compose.yml` não tem `build:`, porque só o `Makefile` conhece as duas etapas. Por isso o `make up` se recusa
a subir enquanto a imagem não existir.

## Rede e Nginx Proxy Manager

O NPM chega ao container **pelo nome do container** (`APP_NAME`). O padrão é um domínio só:

| Endereço | Como chega |
|---|---|
| `https://eros.animahub.ai` (dashboard) | Proxy Host → Forward Hostname `<APP_NAME>`, porta `9119` |
| `https://eros.animahub.ai/app` (Webapp) | No mesmo Proxy Host, o bloco da aba **Advanced** que o `make npm-config` imprime |
| API compatível com OpenAI (opcional) | Um Proxy Host próprio (ex.: `api.eros.animahub.ai`) → `<APP_NAME>`, porta `8642` |

No Proxy Host: Scheme `http`, **Websockets Support**, **Block Common Exploits**, Let's Encrypt, **Force SSL** e **HTTP/2**.

O bloco do `/app`:

- **Tira o prefixo e avisa a Hermes.** Ele remove o `/app` do caminho e manda `X-Forwarded-Prefix: /app`. Com isso, a
  Hermes monta os endereços dos arquivos, do login e do WebSocket já com o prefixo.
- **Recarrega mesmo com o Eros parado.** O nome do container fica numa variável, resolvida a cada requisição pelo
  `resolver` do NPM. Sem isso, um Eros parado impediria o nginx do NPM de recarregar, e todos os sites do NPM
  ficariam fora do ar.
- **Não mistura as sessões.** O dashboard e o Webapp no mesmo domínio guardam cookies separados: os do Webapp ficam
  em `/app`, com outro nome.

Um subdomínio próprio para o Webapp também funciona: `WEBAPP_URL=https://app.<domínio>` e um Proxy Host para
`<APP_NAME>:9120`.

> **Nunca use o nome do serviço como Forward Hostname.** O Docker registra o nome do serviço (`eros`, `hermes`…) como
> apelido do container em toda rede de que ele participa. Duas stacks com o mesmo nome de serviço na rede do NPM
> dividem o tráfego entre si, e foi isso que fez a produção mostrar a tela da demo. O nome do container é único.

O `make configure` lê a sub-rede da `PROXY_NETWORK` e a grava em `dashboard.trusted_proxies`, para a Hermes confiar
nos cabeçalhos `X-Forwarded-*` do NPM.

## Variáveis do `.env`

| Variável | Papel |
|---|---|
| `APP_NAME` | Nome do container, das imagens e das pastas em `/srv` |
| `NODE_AUTH_TOKEN` | Token do GitHub com `read:packages`, para o design system privado. No servidor fica no `.env`; na sua máquina, prefira o perfil do shell |
| `DASHBOARD_URL`, `WEBAPP_URL` | Endereços públicos, com https |
| `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`, `DASHBOARD_SESSION_SECRET` | Login do dashboard e do Webapp |
| `DASHBOARD_OAUTH_CLIENT_ID` | Opcional: login pela conta Nous no dashboard (o `agent:…` do Nous Portal) |
| `API_SERVER_KEY` | Liga a API compatível com OpenAI; vazio a deixa desligada |
| `PROXY_NETWORK` | Rede externa do NPM |
| `MEM_LIMIT`, `CPU_LIMIT` | Limites do container |
| `HERMES_UID`, `HERMES_GID` | Dono dos arquivos de dados no host |
| `SRV_ROOT`, `APPDATA_DIR`, `BACKUP_DIR`, `BACKUP_KEEP` | Pastas do servidor e retenção dos backups |
| `DEV_DASHBOARD_PORT`, `DEV_WEBAPP_PORT`, `DEV_DATA_DIR` | Só para o `make dev` |

Gere segredos com `make secret` e senhas com `openssl rand -hex 16`.

## Comandos

`make help` lista todos. Os principais:

| Comando | O que faz |
|---|---|
| `make init` | Cria o `.env` (modo 600) e a pasta de dados |
| `make build` | Gera a imagem base e a final |
| `make up` / `make down` / `make restart` | Sobe, para e reinicia |
| `make configure` | Ativa o pt-BR e grava as URLs públicas, o Webapp e o proxy confiável. Pode ser repetido |
| `make npm-config` | Imprime o bloco da aba Advanced do NPM para o Webapp em `/app` |
| `make logs` / `make ps` / `make shell` | Logs, status e shell no container |
| `make deploy` | `git pull`, build, up e limpeza das imagens órfãs |
| `make backup` / `make backups` / `make restore FILE=...` | Backup com o container parado, lista de backups e restauração |
| `make migrate FROM=... [DRY=1]` | Traz agentes, histórico e pastas de trabalho de outra instalação; a origem só é lida |
| `make migrate-archive FROM=... ARCHIVE="..."` | Guarda em `BACKUP_DIR` pastas da instalação antiga que não migram |
| `make channels-on` / `make channels-off` | Liga os bots e as tarefas agendadas dos agentes, ou estaciona todos |
| `make dev` / `make dev-configure` / `make dev-down` | Ambiente local |

Comandos da Hermes dentro do container: `docker compose exec eros hermes <comando>`. O container troca para o
usuário `hermes` sozinho, então nenhum arquivo de dados fica com dono root.

## Backup e restauração

- O `make backup` para o container, grava `<APP_NAME>_<data>.tar` em `BACKUP_DIR` e sobe o container de novo. O arquivo
  traz `appdata.tar.zst` (ou `.gz`, se o servidor não tiver zstd) e uma cópia do `.env`. Ficam os `BACKUP_KEEP` mais
  recentes.
- O `make restore` não apaga nada. Ele extrai o backup numa pasta ao lado e só então troca as pastas de lugar. Os
  dados que estavam lá ficam em `hermes.antes-restore-<data>`, para você conferir e apagar à mão.

## Migração de outra instalação (`make migrate`)

O passo a passo está no [guia de migração](../../README.md#guia-de-migração). Como o comando funciona:

- **O destino é uma instalação nova e parada.** O `make migrate` exige o container parado e um `config.yaml` já
  feito pelo `make configure` e pelo `hermes setup`. O `config.yaml` da raiz nunca é copiado.
- **A raiz:** vêm a persona, as memórias (também as pendentes), as skills, as tarefas agendadas, os bancos (histórico,
  projetos, respostas da API), a foto e a seção no Bot Mode (`profile.yaml`, `assets`), as preferências da interface
  e os plugins, menos o `anima-brand`. O `config.yaml` antigo fica em `migracao/config.antigo.yaml`, só para consulta.
- **Cada agente:** vem a pasta inteira, menos o que
  [`scripts/migrate-profile.rules`](scripts/migrate-profile.rules) exclui: credenciais e logins, o `home` do agente,
  o estado do processo e os caches. A lista segue a do `hermes profile export`. `MIGRATE_SKIP_PROFILES` diz quais
  agentes ficam de fora (padrão: `default graphify-out`).
- **O `.env`:** de cada `.env` antigo vêm só as variáveis de
  [`scripts/migrate-env-keys.txt`](scripts/migrate-env-keys.txt). Elas são gravadas no `.env` novo, e o resto dele
  fica como está. O relatório lista pelo nome, nunca pelo valor, as que vieram e as que ficaram para trás.
- **As pastas de trabalho:** `MIGRATE_WORKDIRS` (padrão: `impulse anima-theia receita-federal clickup-doc
  attachments`), nos mesmos caminhos. O `impulse/vault` não é copiado: ele é montado pelo
  `docker-compose.override.yml`.
- **Os agentes chegam estacionados.** Cada um recebe o marcador `gateway.parked`, o mesmo do
  `hermes -p <agente> gateway stop`: a Hermes não liga os bots nem as tarefas agendadas dele. O dashboard e o Webapp
  também não abrem conversa com ele. Para testar, use `hermes -p <agente> chat --oneshot -q "..."`. O
  `make channels-on` tira os marcadores.
- **Pode repetir.** Cada rodada copia só o que mudou e espelha a origem: o que sumiu lá some aqui. O `.env` e os logins
  refeitos na instalação nova não são apagados. Com `DRY=1`, nada é gravado.

## Desenvolvimento local

```sh
cd deploy/docker
make init                 # na primeira vez; preencha DASHBOARD_PASSWORD e DASHBOARD_SESSION_SECRET
export NODE_AUTH_TOKEN=…  # no perfil do shell
make dev                  # gera a imagem se faltar e sobe em http://localhost:9120
make dev-configure        # na primeira vez: pt-BR e Webapp
```

Os dados locais ficam em `./data`, que não é versionado e não entra na imagem.

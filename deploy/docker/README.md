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
| `scripts/` | `backup.sh`, `restore.sh` e `smoke.sh`, chamados pelo `make` |

## Imagem

O `make build` faz o build em duas etapas:

1. **A base** `<APP_NAME>-base:<IMAGE_TAG>`, a partir do `Dockerfile` da raiz do repositório: a Hermes com o design
   system, a marca e o Webapp. O token entra só no build, como secret do BuildKit, e não fica em nenhuma camada.
2. **A imagem final** `<APP_NAME>:<IMAGE_TAG>`: a base mais os pacotes de VNC/XFCE, a partir de `deploy/docker/Dockerfile`.

O `docker-compose.yml` não tem `build:`, porque só o `Makefile` conhece as duas etapas. Por isso o `make up` se recusa
a subir enquanto a imagem não existir.

## Rede e Nginx Proxy Manager

O NPM chega ao container **pelo nome do container**, que é o `APP_NAME`:

| Serviço | Forward Hostname | Forward Port |
|---|---|---|
| Dashboard | `<APP_NAME>` | `9119` |
| Webapp | `<APP_NAME>` | `9120` |
| API compatível com OpenAI | `<APP_NAME>` | `8642` |

Nos três: Scheme `http`, **Websockets Support** ligado, Let's Encrypt e Force SSL.

> **Nunca use o nome do serviço como Forward Hostname.** O Docker registra o nome do serviço (`eros`, `hermes`…) como
> apelido do container em toda rede de que ele participa. Duas stacks com o mesmo nome de serviço na rede do NPM
> dividem o tráfego entre si, e foi isso que fez a produção mostrar a tela da demo. O nome do container é único.

O `make configure` lê a sub-rede da `PROXY_NETWORK` e a grava em `dashboard.trusted_proxies`, para a Hermes confiar no
`X-Forwarded-Proto: https` do NPM.

## Variáveis do `.env`

| Variável | Papel |
|---|---|
| `APP_NAME` | Nome do container, das imagens e das pastas em `/srv` |
| `NODE_AUTH_TOKEN` | Token do GitHub com `read:packages`, para o design system privado. No servidor fica no `.env`; na sua máquina, prefira o perfil do shell |
| `DASHBOARD_URL`, `WEBAPP_URL` | Endereços públicos, com https |
| `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`, `DASHBOARD_SESSION_SECRET` | Login do dashboard e do Webapp |
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
| `make configure` | Ativa o pt-BR e configura o Webapp e o proxy confiável. Pode ser repetido |
| `make logs` / `make ps` / `make shell` | Logs, status e shell no container |
| `make deploy` | `git pull`, build, up e limpeza das imagens órfãs |
| `make backup` / `make backups` / `make restore FILE=...` | Backup com o container parado, lista de backups e restauração |
| `make smoke SMOKE_FROM=...` | Testa a imagem sobre uma **cópia** de dados, sem rede |
| `make adopt FROM=...` | Copia os dados de outra instalação para esta; a origem fica intacta |
| `make dev` / `make dev-configure` / `make dev-down` | Ambiente local |

Comandos da Hermes dentro do container: `docker compose exec eros hermes <comando>`. O container troca para o
usuário `hermes` sozinho, então nenhum arquivo de dados fica com dono root.

## Backup e restauração

- O `make backup` para o container, grava `<APP_NAME>_<data>.tar` em `BACKUP_DIR` e sobe o container de novo. O arquivo
  traz `appdata.tar.zst` (ou `.gz`, se o servidor não tiver zstd) e uma cópia do `.env`. Ficam os `BACKUP_KEEP` mais
  recentes.
- O `make restore` não apaga nada. Ele extrai o backup numa pasta ao lado e só então troca as pastas de lugar. Os
  dados que estavam lá ficam em `hermes.antes-restore-<data>`, para você conferir e apagar à mão.

## Teste sobre uma cópia dos dados (`make smoke`)

- **A cópia:** o teste copia `SMOKE_FROM` para `/srv/appdata/<APP_NAME>-smoke`, sem caches e sem as pastas listadas
  em `SMOKE_EXCLUDE`.
- **O container:** sobe a imagem com `--network none`. A cópia leva os tokens dos canais e os cron jobs, e sem rede ela
  não disputa mensagens com a instalação original nem dispara entregas.
- **O que confere:** a versão, as sessões (o banco migrado), os cron jobs, o kanban, o pacote pt-BR, o VNC/XFCE, o
  dashboard e o Webapp. No fim mostra os últimos erros registrados, para você revisar.
- **Depois:** apaga a cópia. Para mantê-la, use `KEEP=1`.

## Desenvolvimento local

```sh
cd deploy/docker
make init                 # na primeira vez; preencha DASHBOARD_PASSWORD e DASHBOARD_SESSION_SECRET
export NODE_AUTH_TOKEN=…  # no perfil do shell
make dev                  # gera a imagem se faltar e sobe em http://localhost:9120
make dev-configure        # na primeira vez: pt-BR e Webapp
```

Os dados locais ficam em `./data`, que não é versionado e não entra na imagem.

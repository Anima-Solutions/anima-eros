# Ânima Eros

O Ânima Eros é o agente de IA da Ânima: um fork do [Hermes Agent](https://github.com/NousResearch/hermes-agent)
com o design system Ânima (`@anima-solutions/design-system`), a marca Ânima Eros e a interface em português.
Um container reúne o gateway, o dashboard, o Webapp e a API compatível com OpenAI.

- [Guia de instalação](#guia-de-instalação): uma instalação nova, com dados próprios.
- [Guia de migração](#guia-de-migração): troca o Hermes que já roda em produção pelo Ânima Eros, levando os dados.

A referência da stack (arquivos, variáveis, comandos, backup e teste) está em
[`deploy/docker/README.md`](deploy/docker/README.md).

## Como a stack funciona

Ela segue o mesmo padrão das outras stacks da Ânima nos VPS:

| | |
|---|---|
| Stack | o próprio repositório, clonado em `/srv/stacks/<APP_NAME>`. Os comandos rodam em `deploy/docker` (`make help`) |
| Dados | `/srv/appdata/<APP_NAME>/hermes` (o `~/.hermes` do container) |
| Backups | `/srv/backups/<APP_NAME>` |
| Imagem | construída no próprio servidor (`make build`), com o token do GitHub Packages da conta de serviço |
| Rede | a do Nginx Proxy Manager (`anima_proxymanager_shared_network`), como rede externa. Só `expose`: nenhuma porta publicada, nenhuma sub-rede |
| Proxy | o NPM aponta para o **nome do container** (`<APP_NAME>`). Um domínio só: o dashboard na raiz (`:9119`) e o Webapp em `/app` (`:9120`). A API (`:8642`), se ligada, tem um Proxy Host próprio |

---

## Guia de instalação

Uma instalação nova, por exemplo `APP_NAME=anima-eros`, com o dashboard em `https://eros.animahub.ai` e o Webapp em
`https://eros.animahub.ai/app`.

### 1. Clonar e criar o `.env`

O servidor clona pelo mesmo alias SSH das outras stacks (`github_anima`). Se o clone for negado, a chave desse alias
ainda não tem acesso ao repositório `Anima-Solutions/anima-eros`: dê a ela acesso de leitura no GitHub.

```sh
git clone git@github_anima:Anima-Solutions/anima-eros.git /srv/stacks/anima-eros
cd /srv/stacks/anima-eros/deploy/docker
make init
```

Preencha o `.env`:

- `NODE_AUTH_TOKEN`: o token da conta de serviço, com `read:packages`.
- `DASHBOARD_URL` e `WEBAPP_URL`: já vêm como `https://eros.animahub.ai` e `https://eros.animahub.ai/app`.
- `DASHBOARD_PASSWORD`: gere com `openssl rand -hex 16`.
- `DASHBOARD_SESSION_SECRET`: gere com `make secret`.
- `API_SERVER_KEY`: só se for ligar a API; gere com `make secret`.

Se o servidor tiver montagens próprias, como um vault do Obsidian, copie `docker-compose.override.example.yml` para
`docker-compose.override.yml` e ajuste.

### 2. Construir, subir e configurar

```sh
make deploy        # git pull, build (≈10–15 min na primeira vez), up
make configure     # pt-BR, URLs públicas, Webapp e proxy confiável
docker compose exec eros hermes setup     # modelo e chaves de API
```

### 3. Criar o Proxy Host no NPM

O DNS de `eros.animahub.ai` precisa apontar para o servidor antes do certificado. Crie **um** Proxy Host:

- **Domain:** `eros.animahub.ai`. **Scheme** `http`, **Forward Hostname** `anima-eros`, **Forward Port** `9119`.
- **Websockets Support** e **Block Common Exploits** ligados.
- **SSL:** Let's Encrypt, **Force SSL** e **HTTP/2**.
- **Advanced:** cole o bloco que o `make npm-config` imprime. É ele que serve o Webapp em `/app`.

A API, se ligada, ganha um Proxy Host próprio (ex.: `api.eros.animahub.ai` → `anima-eros`, porta `8642`).

Use sempre o nome do container, nunca o nome do serviço (`eros`): veja
[Rede e Nginx Proxy Manager](deploy/docker/README.md#rede-e-nginx-proxy-manager).

### 4. Conferir

- `https://eros.animahub.ai` abre a tela de login Ânima.
- `https://eros.animahub.ai/app` abre o Webapp em português. No primeiro acesso de cada navegador, o português leva uns 15 s para aparecer; ao
  recarregar, aparece na hora.
- `make logs` sem erros.

### Atualizar

```sh
cd /srv/stacks/anima-eros/deploy/docker
make deploy
```

---

## Guia de migração

Troca o Hermes que roda hoje no `vps_anima01` pelo Ânima Eros, levando os dados. Hoje ele está na stack
`/srv/stacks/anima-hermes`, no container `anima-hermes-hermes`, com dados em `/srv/appdata/anima-hermes/hermes`.

- **A stack antiga e os dados dela não são alterados.** O Eros sobe numa stack nova (`/srv/stacks/anima-eros`), com
  uma **cópia** dos dados. A instalação antiga fica parada, intacta, e voltar atrás leva um minuto.
- **A troca só acontece depois que o teste com a cópia passar.**

### O que muda e o que não muda

| Muda | Fica igual |
|---|---|
| A stack: `anima-hermes` → `anima-eros`, no padrão das outras | A API em `api.eros.impulsebpo.com`, com a mesma chave |
| A imagem: `nousresearch/hermes-agent` → o fork Ânima Eros (o VNC/XFCE continua) | Sessões, memórias, perfis, kanban, cron, skills e o `.env` interno (uma cópia) |
| A marca, o design system e o idioma (pt-BR) | O login: OAuth no dashboard, usuário e senha no Webapp, a mesma `API_SERVER_KEY` |
| O endereço: `eros.animahub.ai` (dashboard) e `eros.animahub.ai/app` (Webapp) | O vault do Obsidian, montado pelo `docker-compose.override.yml` |
| O Forward Hostname no NPM: `hermes` → `anima-eros` | |

### Fase A: preparar, com a produção no ar

Nada desta fase toca na produção. Ela só lê os dados para copiar.

**1. Clonar e criar o `.env`**

```sh
git clone git@github_anima:Anima-Solutions/anima-eros.git /srv/stacks/anima-eros
cd /srv/stacks/anima-eros/deploy/docker
make init
cp docker-compose.override.example.yml docker-compose.override.yml     # monta o vault do Obsidian
```

No `.env`, use os valores de hoje para os logins e as chaves continuarem valendo:

| Novo `.env` | Valor |
|---|---|
| `APP_NAME` | `anima-eros` |
| `NODE_AUTH_TOKEN` | token da conta de serviço (`read:packages`) |
| `DASHBOARD_URL`, `WEBAPP_URL` | os do modelo: `https://eros.animahub.ai` e `https://eros.animahub.ai/app` |
| `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`, `DASHBOARD_SESSION_SECRET` | `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD` e `BASIC_AUTH_SECRET` de `/srv/stacks/anima-hermes/.env` |
| `API_SERVER_KEY` | o mesmo de `/srv/stacks/anima-hermes/.env` (os clientes da API usam essa chave) |
| `MEM_LIMIT`, `CPU_LIMIT` | `8G`, `2.0` (os de hoje) |

**2. Construir a imagem**

```sh
make build         # ≈10–15 min; usa CPU, mas a produção segue no ar
```

**3. Testar a imagem sobre uma cópia dos dados**

```sh
make smoke SMOKE_FROM=/srv/appdata/anima-hermes/hermes SMOKE_EXCLUDE="anima-theia"
```

- **O que acontece:** o teste copia os dados para uma pasta à parte, sem caches e sem o workspace `anima-theia`
  (45 GB). Depois sobe a imagem nova **sem rede**, para não disputar mensagens com a produção, e confere a migração
  dos bancos, a CLI, o dashboard, o Webapp, o pt-BR e o VNC.
- **Resultado esperado:** `✔ Teste aprovado`. Não siga para a Fase B sem ele.
- **Se der banco corrompido** (`database disk image is malformed`): a cópia pegou um banco no meio de uma escrita da
  produção, que está no ar. Rode o teste de novo.

**4. Preparar o domínio novo**

- **DNS:** aponte `eros.animahub.ai` para o servidor.
- **Proxy Host:** crie o de `eros.animahub.ai` como no [passo 3 da instalação](#3-criar-o-proxy-host-no-npm). Ele
  responde 502 até o Eros subir, sem afetar a produção.
- **Login OAuth do dashboard:** o cliente de hoje (`dashboard.oauth.client_id` no `config.yaml`) foi registrado na
  Nous com o retorno em `https://eros.impulsebpo.com/auth/callback`. Inclua
  `https://eros.animahub.ai/auth/callback` nele, na página
  [Local Dashboards](https://portal.nousresearch.com/local-dashboards) do Nous Portal. Até lá, o login por OAuth no
  domínio novo falha, mas o de usuário e senha funciona.

**5. Copiar os dados com antecedência (opcional, encurta a janela)**

```sh
make adopt FROM=/srv/appdata/anima-hermes/hermes
```

A primeira cópia leva 64 GB e pode demorar. Feita agora, com a produção no ar, a cópia da janela só leva o que mudou
depois dela.

### Fase B: a troca, em janela de manutenção

Avise quem usa o Eros: ele fica fora do ar da etapa 6 à 8, e o endereço passa a ser `eros.animahub.ai`.

**6. Parar a produção antiga** (`stop`, não `down`: o container fica pronto para voltar)

```sh
cd /srv/stacks/anima-hermes && docker compose stop
```

**7. Copiar os dados e subir o Eros**

```sh
cd /srv/stacks/anima-eros/deploy/docker
make adopt FROM=/srv/appdata/anima-hermes/hermes     # com a origem parada, a cópia sai consistente
make up
make configure
docker compose exec eros hermes plugins disable anima-brand    # a marca agora vem na imagem
make restart
```

**8. Apontar o NPM para o Eros**

O Proxy Host de `eros.animahub.ai` já aponta para `anima-eros` (etapa 4). Nos Proxy Hosts antigos:

| Domínio | O que fazer |
|---|---|
| `api.eros.impulsebpo.com` | Forward Hostname `hermes` → `anima-eros`, porta `8642` (os clientes da API continuam iguais) |
| `eros.impulsebpo.com`, `app.eros.impulsebpo.com` | Troque por um **Redirection Host** para `eros.animahub.ai` e `eros.animahub.ai/app`, ou desative |

**9. Conferir**

- `https://eros.animahub.ai` abre e o login OAuth funciona.
- `https://eros.animahub.ai/app` abre em português e entra com usuário e senha.
- As sessões antigas, as memórias, o kanban e os cron jobs estão lá (`docker compose exec eros hermes sessions list`).
- Os canais (Telegram, WhatsApp…) respondem.
- O VNC funciona e o vault aparece em `/opt/data/impulse/vault`.
- `make logs` sem erros novos.

### Voltar atrás

Os dados da instalação antiga não foram tocados, então a volta é imediata:

```sh
cd /srv/stacks/anima-eros/deploy/docker && make down
cd /srv/stacks/anima-hermes && docker compose start
```

No NPM, volte os Proxy Hosts de `eros.impulsebpo.com`, `app.eros.impulsebpo.com` e `api.eros.impulsebpo.com` para
`anima-hermes-hermes`, o nome do container antigo, e não para `hermes`.

### Depois da migração

- **Backup:** com o Eros estável, comece a rotina com `make backup`.
- **A stack antiga:** fica parada como plano de volta. Remova `/srv/stacks/anima-hermes` e
  `/srv/appdata/anima-hermes` só quando decidir que não precisa mais deles.

---

## Desenvolvimento

- O ambiente local é o `make dev`: veja [`deploy/docker/README.md`](deploy/docker/README.md#desenvolvimento-local).
- O guia de desenvolvimento do Hermes continua valendo: [`AGENTS.md`](AGENTS.md) e [`CONTRIBUTING.md`](CONTRIBUTING.md).
- A documentação completa do Hermes está em <https://hermes-agent.nousresearch.com/docs/>.

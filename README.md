# Ânima Eros

O Ânima Eros é o agente de IA da Ânima: um fork do [Hermes Agent](https://github.com/NousResearch/hermes-agent)
com o design system Ânima (`@anima-solutions/design-system`), a marca Ânima Eros e a interface em português.
Um container reúne o gateway, o dashboard, o Webapp e a API compatível com OpenAI.

- [Guia de instalação](#guia-de-instalação): uma instalação nova, com dados próprios.
- [Guia de migração](#guia-de-migração): troca o Hermes que já roda em produção pelo Ânima Eros, numa instalação
  nova, trazendo só os agentes e os dados.

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
- `DASHBOARD_OAUTH_CLIENT_ID`: opcional, para o login pela conta Nous além do usuário e senha. É o `agent:…` do
  registro no Nous Portal (`hermes dashboard register`).

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

Substitui o Hermes que roda hoje no `vps_anima01` pelo Ânima Eros. Hoje ele está na stack `/srv/stacks/anima-hermes`,
no container `anima-hermes-hermes`, com dados em `/srv/appdata/anima-hermes/hermes`.

A instalação antiga foi montada aos poucos e acumulou ajustes manuais, por isso **ela não é copiada inteira**. O Eros
sobe como uma [instalação nova](#guia-de-instalação), e o `make migrate` traz para ela só os dados: os agentes, o
histórico, os projetos e as pastas de trabalho.

- **A instalação antiga não é alterada.** O `make migrate` só lê os dados dela. Ela fica parada, intacta, como plano
  de volta.
- **Os dois rodam lado a lado durante o teste.** Os agentes chegam ao Eros **estacionados**: sem bots e sem tarefas
  agendadas. Os bots continuam respondendo pela instalação antiga até a troca.
- **A troca é curta.** Ela para a instalação antiga, copia o que mudou desde o teste e liga os bots no Eros.

### O que vem, o que é refeito e o que fica

**Vem para o Eros:**

| O quê | Detalhe |
|---|---|
| 13 agentes | os 6 `impulse`, `meta-ads-bot`, `google-ads-bot`, `ctwa-meta-bot`, `anima-logus-bot`, `anima-projetos-bot`, `anima-theia` e `editorfat`. Cada um com persona, memórias, skills, tarefas agendadas, configuração, histórico de conversas e projetos |
| O agente principal | persona, memórias, skills, histórico, projetos e os plugins `gmail`, `mcp-serve` e `quota` |
| Pastas de trabalho | `impulse`, `anima-theia`, `receita-federal`, `clickup-doc` e `attachments`, nos mesmos caminhos em `/opt/data` |
| Do `.env` de cada agente | só as variáveis de [`migrate-env-keys.txt`](deploy/docker/scripts/migrate-env-keys.txt): chaves de API, tokens dos bots, quem pode falar com cada bot e os caminhos dos scripts do Impulse |

**É refeito na instalação nova:**

| O quê | Por quê |
|---|---|
| Os logins (Anthropic, OpenAI Codex, Nous, xAI) | Ficam no `auth.json`, que guarda o estado mais opaco da instalação antiga |
| O login do ClickUp nos agentes `impulse`, `impulse-estrategista` e `impulse-gerente` | É um login OAuth do MCP (`mcp-tokens`), também refeito |
| O `config.yaml` do agente principal | O da instalação nova é feito pelo `make configure` e pelo `hermes setup` |
| A pasta `home` de cada agente (logins do gh, git, npm…) e os caches | Configuração de máquina, que a Hermes recria ou que se refaz quando for preciso |

**Fica de fora:**

| O quê | Destino |
|---|---|
| `profiles/default` e `profiles/graphify-out` | Não são agentes: uma pasta de trabalho solta e o cache de uma ferramenta |
| O Kanban | Está vazio na instalação antiga |
| `anima-doc`, `projetos`, `scripts`, `pets`, `uploads`, `graphify-out` (da raiz) | Nenhum agente usa. Ficam guardados num arquivo em `/srv/backups/anima-eros` |
| Outras variáveis dos `.env` (`HERMES_MANAGED_DIR`, `TERMINAL_*`, `*_DEBUG`…) | Eram ajustes da instalação antiga. O `make migrate` lista cada uma que ficou para trás |

O filtro completo do que não vem de cada agente está em
[`migrate-profile.rules`](deploy/docker/scripts/migrate-profile.rules).

### Fase A: instalar e migrar, com a produção no ar

Nada desta fase altera a instalação antiga. Os bots e as tarefas agendadas continuam nela.

**1. Preparar o domínio**

- **DNS:** aponte `eros.animahub.ai` para o servidor.
- **NPM:** crie o Proxy Host de `eros.animahub.ai` como no
  [passo 3 da instalação](#3-criar-o-proxy-host-no-npm). Ele responde 502 até o Eros subir, sem afetar a produção.
- **Login OAuth do dashboard:** o cliente de hoje foi registrado na Nous com o retorno em
  `https://eros.impulsebpo.com/auth/callback`. Na página
  [Local Dashboards](https://portal.nousresearch.com/local-dashboards) do Nous Portal, inclua
  `https://eros.animahub.ai/auth/callback` nele.

**2. Clonar e criar o `.env`**

```sh
git clone git@github_anima:Anima-Solutions/anima-eros.git /srv/stacks/anima-eros
cd /srv/stacks/anima-eros/deploy/docker
make init
cp docker-compose.override.example.yml docker-compose.override.yml     # monta o vault do Obsidian
```

No `.env`, use os valores de hoje para os logins e as chaves continuarem valendo:

| Novo `.env` | Valor |
|---|---|
| `NODE_AUTH_TOKEN` | token da conta de serviço (`read:packages`); descomente a linha |
| `DASHBOARD_USERNAME`, `DASHBOARD_PASSWORD`, `DASHBOARD_SESSION_SECRET` | `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD` e `BASIC_AUTH_SECRET` de `/srv/stacks/anima-hermes/.env` |
| `API_SERVER_KEY` | o mesmo de `/srv/stacks/anima-hermes/.env` (os clientes da API usam essa chave) |
| `DASHBOARD_OAUTH_CLIENT_ID` | o `HERMES_DASHBOARD_OAUTH_CLIENT_ID` de `/srv/appdata/anima-hermes/hermes/.env` |

O resto fica como veio do modelo. Confira com `make info`.

**3. Instalar o Eros**

```sh
make deploy        # build (≈10–15 min na primeira vez) e up
make configure     # pt-BR, URLs públicas, Webapp e proxy confiável
docker compose exec eros hermes setup          # o agente principal: provedor, login e modelo
```

No `hermes setup`, escolha o provedor e o modelo do agente principal e faça o login. Depois, faça os logins que os
outros agentes usam. Os agentes leem os logins da raiz.

```sh
docker compose exec eros hermes auth add anthropic --no-browser      # a maioria dos agentes (Claude)
docker compose exec eros hermes auth add openai-codex --no-browser   # o editorfat
docker compose exec eros hermes auth add nous --no-browser           # opcional: Nous Portal
docker compose exec eros hermes auth add xai-oauth --no-browser      # opcional: Grok
```

Com `--no-browser`, o comando mostra um link: abra no seu computador, autorize e, se ele pedir, cole o código de volta
no terminal.

**4. Simular a migração**

O `make migrate` exige o Eros parado.

```sh
make down
make migrate FROM=/srv/appdata/anima-hermes/hermes DRY=1
```

A simulação não grava nada. Ela mostra, para a raiz e para cada agente, quantos arquivos viriam, quais variáveis do
`.env` vêm e quais ficam para trás, e quais logins precisam ser refeitos. Revise a lista. Se uma variável que ficou
para trás for necessária, inclua o nome dela em `scripts/migrate-env-keys.txt` e simule de novo.

**5. Migrar**

```sh
make migrate FROM=/srv/appdata/anima-hermes/hermes     # a primeira vez copia ≈55 GB e demora
make up
```

Os agentes chegam estacionados. No fim, o comando confirma quantos agentes migrou.

**6. Ajustes depois da migração**

```sh
docker compose exec eros hermes -p anima-theia plugins disable anima-brand    # a marca agora vem na imagem
docker compose exec eros hermes plugins enable mcp-serve quota                # os plugins do agente principal
docker compose exec eros hermes -p impulse mcp login clickup                  # login do ClickUp, um por agente
docker compose exec eros hermes -p impulse-estrategista mcp login clickup
docker compose exec eros hermes -p impulse-gerente mcp login clickup
make restart
```

Se o login do ClickUp pedir um navegador que o servidor não tem, use `mcp login clickup --flow device`.

**7. Conferir pelo dashboard** (`https://eros.animahub.ai`)

Teste pelo dashboard. O Webapp (`/app`) só conversa com os agentes que estão no ar, então enquanto eles estiverem
estacionados ele atende apenas o agente principal.

- Os 13 agentes aparecem, com as conversas antigas.
- Abra uma conversa nova com dois ou três agentes, incluindo o `editorfat`, que usa outro provedor. Eles respondem, com
  a persona e as memórias de antes.
- Os projetos estão lá, e um agente acha os arquivos dele, por exemplo o `impulse` com `/opt/data/impulse/painel`.
- O vault do Obsidian aparece em `/opt/data/impulse/vault`.
- `docker compose exec eros hermes gateway status` lista os 13 agentes como `parked`.

O que você conversar no Eros durante o teste se perde na troca: a etapa 10 copia de novo o histórico da instalação
antiga por cima.

**8. Guardar as pastas que não migram**

```sh
make migrate-archive FROM=/srv/appdata/anima-hermes/hermes ARCHIVE="anima-doc projetos scripts pets uploads graphify-out"
```

O arquivo fica em `/srv/backups/anima-eros/anima-eros_legado_<data>.tar.zst`. A retenção do `make backup` não o apaga.

### Fase B: a troca, em janela de manutenção

Avise quem usa o Eros: os bots ficam fora do ar da etapa 9 à 11, e o endereço do dashboard passa a ser
`eros.animahub.ai`.

**9. Parar a instalação antiga** (`stop`, não `down`: o container fica pronto para voltar)

```sh
cd /srv/stacks/anima-hermes && docker compose stop
```

**10. Trazer o que mudou desde o teste**

```sh
cd /srv/stacks/anima-eros/deploy/docker
make down
make migrate FROM=/srv/appdata/anima-hermes/hermes     # com a origem parada, os bancos saem consistentes
make up
docker compose exec eros hermes -p anima-theia plugins disable anima-brand    # o config do agente veio de novo
```

Esta rodada só copia o que mudou desde a etapa 5, então é rápida. Os logins e os ajustes da etapa 6 continuam valendo,
menos o do `anima-theia`, que se repete aqui.

**11. Ligar os bots**

```sh
make channels-on
```

Ele liga os bots e as tarefas agendadas de cada agente estacionado.

**12. Apontar o NPM**

| Proxy Host | O que fazer |
|---|---|
| `api.eros.impulsebpo.com` | Forward Hostname `hermes` → `anima-eros`, porta `8642`. Os clientes da API não mudam nada |
| `eros.impulsebpo.com`, `app.eros.impulsebpo.com` | Troque por **Redirection Hosts** para `eros.animahub.ai` e `eros.animahub.ai/app`, ou desative |

**13. Conferir**

- `docker compose exec eros hermes gateway status` lista os 13 agentes como atendidos e nenhum como `parked`.
- O Webapp (`https://eros.animahub.ai/app`) abre em português e conversa com os agentes.
- Mande uma mensagem para cada bot do Telegram (`impulse`, `impulse-copywriter`, `impulse-estrategista`,
  `impulse-gerente` e `impulse-revisor`) e para o WhatsApp do `meta-ads-bot`. Todos respondem.
- As tarefas agendadas têm o próximo horário: `docker compose exec eros hermes -p impulse cron list`.
- `make logs` sem erros novos.

### Voltar atrás

Os dados da instalação antiga não foram tocados, então a volta é imediata. Pare o Eros **antes** de religar a antiga,
para os bots não ficarem ligados nas duas:

```sh
cd /srv/stacks/anima-eros/deploy/docker && make down
cd /srv/stacks/anima-hermes && docker compose start
```

No NPM, volte os Proxy Hosts de `eros.impulsebpo.com`, `app.eros.impulsebpo.com` e `api.eros.impulsebpo.com` para
`anima-hermes-hermes`, o nome do container antigo, e não para `hermes`.

### Depois da migração

- **Backup:** com o Eros estável, comece a rotina com `make backup`.
- **A instalação antiga:** fica parada como plano de volta. Remova `/srv/stacks/anima-hermes` e
  `/srv/appdata/anima-hermes` só quando decidir que não precisa mais deles.

---

## Desenvolvimento

- O ambiente local é o `make dev`: veja [`deploy/docker/README.md`](deploy/docker/README.md#desenvolvimento-local).
- O guia de desenvolvimento do Hermes continua valendo: [`AGENTS.md`](AGENTS.md) e [`CONTRIBUTING.md`](CONTRIBUTING.md).
- A documentação completa do Hermes está em <https://hermes-agent.nousresearch.com/docs/>.

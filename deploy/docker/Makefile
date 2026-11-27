# =============================================================================
# Ânima Eros — comandos rápidos
# Execute `make` ou `make help` para ver todos os comandos. Rode dentro de deploy/docker.
# =============================================================================

# Valores padrão (sobrescritos pelo .env, quando existir)
APP_NAME      ?= anima-eros
IMAGE_TAG     ?= latest
PROXY_NETWORK ?= anima_proxymanager_shared_network
SRV_ROOT      ?= /srv
STACK_DIR     ?= $(SRV_ROOT)/stacks/$(APP_NAME)
APPDATA_DIR   ?= $(SRV_ROOT)/appdata/$(APP_NAME)
BACKUP_DIR    ?= $(SRV_ROOT)/backups/$(APP_NAME)
BACKUP_KEEP   ?= 7
HERMES_UID    ?= 1000
HERMES_GID    ?= 1000

-include .env
export

# De onde veio o token: do .env ou do ambiente (perfil do shell)
TOKEN_ORIGIN := $(if $(filter file,$(origin NODE_AUTH_TOKEN)),.env,shell)

SHELL       := /usr/bin/env bash
REPO_ROOT   := $(abspath ../..)
COMPOSE     := docker compose
COMPOSE_DEV := docker compose -f docker-compose.dev.yml
SERVICE     := eros
SERVICE_DEV := eros-dev
BASE_IMAGE  := $(APP_NAME)-base:$(IMAGE_TAG)
IMAGE       := $(APP_NAME):$(IMAGE_TAG)
EXEC        := $(COMPOSE) exec -T $(SERVICE)

# Usa sudo apenas quando a raiz das pastas do servidor não é gravável pelo usuário
SUDO = $(shell p="$(SRV_ROOT)"; while [ ! -e "$$p" ]; do p="$$(dirname "$$p")"; done; [ -w "$$p" ] || echo sudo)
SCRIPT_ENV = env APP_NAME="$(APP_NAME)" APPDATA_DIR="$(APPDATA_DIR)/hermes" BACKUP_DIR="$(BACKUP_DIR)" \
             BACKUP_KEEP="$(BACKUP_KEEP)" SRV_ROOT="$(SRV_ROOT)" IMAGE="$(IMAGE)" \
             HERMES_UID="$(HERMES_UID)" HERMES_GID="$(HERMES_GID)" TZ="$(TZ)"

.DEFAULT_GOAL := help
.PHONY: help init env dirs info npm-check secret network \
        build build-base up down restart logs ps shell configure npm-config update deploy \
        dev dev-down dev-logs dev-configure \
        backup backups restore migrate migrate-archive channels-on channels-off prune

## —— Ajuda ———————————————————————————————————————————————————————————————
help: ## Lista os comandos disponíveis
	@awk 'BEGIN {FS = ":.*?## "} \
		/^## —— / { printf "\n\033[1m%s\033[0m\n", substr($$0, 4) } \
		/^[a-zA-Z_-]+:.*?## / { printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo

## —— Setup ———————————————————————————————————————————————————————————————
init: env dirs ## Primeira configuração: cria o .env e as pastas do servidor
	@echo "✔ Projeto inicializado. Revise o .env (NODE_AUTH_TOKEN, URLs e login)."

env: ## Cria o .env a partir do .env.example (não sobrescreve)
	@if [ -f .env ]; then echo "• .env já existe, mantido."; \
	else cp .env.example .env && chmod 600 .env && echo "✔ .env criado a partir do .env.example"; fi

dirs: ## Cria a pasta de dados em /srv/appdata/<app>/hermes
	@$(SUDO) mkdir -p "$(APPDATA_DIR)/hermes"
	@$(SUDO) chown "$(HERMES_UID):$(HERMES_GID)" "$(APPDATA_DIR)/hermes"
	@printf "✔ Pastas prontas:\n  %-9s %s\n" stack "$(REPO_ROOT)" appdata "$(APPDATA_DIR)/hermes"

info: ## Mostra a configuração efetiva
	@printf "  %-17s %s\n" \
		APP_NAME "$(APP_NAME)" \
		IMAGE "$(IMAGE) (base $(BASE_IMAGE))" \
		DASHBOARD_URL "$(DASHBOARD_URL)" \
		WEBAPP_URL "$(WEBAPP_URL)" \
		PROXY_NETWORK "$(PROXY_NETWORK)" \
		NODE_AUTH_TOKEN "$$([ -n "$$NODE_AUTH_TOKEN" ] && echo "definido ($(TOKEN_ORIGIN))" || echo FALTANDO)" \
		STACK_DIR "$(REPO_ROOT)" \
		APPDATA_DIR "$(APPDATA_DIR)/hermes" \
		BACKUP_DIR "$(BACKUP_DIR)"

npm-check: ## Confere se NODE_AUTH_TOKEN (GitHub Packages) está definido
	@[ -n "$$NODE_AUTH_TOKEN" ] \
		|| { echo "✘ Defina NODE_AUTH_TOKEN (token classic do GitHub com read:packages) no perfil do shell ou no .env"; exit 1; }

secret: ## Gera um segredo (DASHBOARD_SESSION_SECRET, API_SERVER_KEY)
	@openssl rand -base64 32 | tr -- '+/' '-_' | tr -d '='

network: ## Cria a rede compartilhada com o proxy (PROXY_NETWORK), se não existir
	@docker network inspect "$(PROXY_NETWORK)" >/dev/null 2>&1 \
		&& echo "• Rede $(PROXY_NETWORK) já existe" \
		|| { docker network create "$(PROXY_NETWORK)" >/dev/null && echo "✔ Rede $(PROXY_NETWORK) criada"; }

## —— Produção ————————————————————————————————————————————————————————————
build-base: npm-check ## Gera a imagem base (Dockerfile da raiz: design system, marca, Webapp)
	DOCKER_BUILDKIT=1 docker build --pull \
		--secret id=node_auth_token,env=NODE_AUTH_TOKEN \
		-t "$(BASE_IMAGE)" -f "$(REPO_ROOT)/Dockerfile" "$(REPO_ROOT)"

build: build-base ## Gera a imagem de produção (base + camada VNC/XFCE do Eros)
	docker build --build-arg BASE_IMAGE="$(BASE_IMAGE)" -t "$(IMAGE)" .

up: network ## Sobe o serviço de produção em segundo plano
	@docker image inspect "$(IMAGE)" >/dev/null 2>&1 || { echo "✘ Imagem $(IMAGE) não existe: rode make build"; exit 1; }
	$(COMPOSE) up -d --remove-orphans
	@echo "✔ Eros no ar: $(DASHBOARD_URL) (dashboard) e $(WEBAPP_URL) (Webapp)"

down: ## Para o serviço de produção
	$(COMPOSE) down

restart: ## Reinicia o serviço de produção
	$(COMPOSE) restart $(SERVICE)

logs: ## Acompanha os logs de produção
	$(COMPOSE) logs -f --tail=100 $(SERVICE)

ps: ## Status dos containers
	$(COMPOSE) ps

shell: ## Shell no container de produção
	$(COMPOSE) exec $(SERVICE) bash

configure: ## pt-BR, Webapp e proxy confiável no config.yaml da Hermes (pode repetir)
	@subnet="$$(docker network inspect -f '{{range .IPAM.Config}}{{.Subnet}} {{end}}' "$(PROXY_NETWORK)" | awk '{print $$1}')"; \
	[ -n "$$subnet" ] || { echo "✘ Não achei a sub-rede de $(PROXY_NETWORK)"; exit 1; }; \
	[ -n "$(WEBAPP_URL)" ] || { echo "✘ Defina WEBAPP_URL no .env"; exit 1; }; \
	set -e; \
	$(EXEC) hermes plugins enable anima-pt-br; \
	$(EXEC) hermes config set display.language pt; \
	$(EXEC) hermes config set webapp.enabled true; \
	$(EXEC) hermes config set webapp.host 0.0.0.0; \
	$(EXEC) hermes config set webapp.port 9120; \
	$(EXEC) hermes config set webapp.public_url "$(WEBAPP_URL)"; \
	[ -z "$(DASHBOARD_URL)" ] || $(EXEC) hermes config set dashboard.public_url "$(DASHBOARD_URL)"; \
	$(EXEC) hermes config set dashboard.trusted_proxies "[\"$$subnet\"]"; \
	echo "✔ Configurado (proxy confiável: $$subnet). Reiniciando..."
	$(COMPOSE) restart $(SERVICE)

npm-config: ## Imprime o bloco da aba Advanced do Proxy Host (o endereço com caminho: hoje o dashboard em /admin)
	@web_path="$$(printf '%s' "$(WEBAPP_URL)" | sed -E 's#^https?://[^/]+##')"; \
	dash_path="$$(printf '%s' "$(DASHBOARD_URL)" | sed -E 's#^https?://[^/]+##')"; \
	if [ -n "$$dash_path" ] && [ -z "$$web_path" ]; then \
		prefix="$$dash_path"; port=9119; root_port=9120; what="dashboard"; root_url="$(WEBAPP_URL)"; legacy="/app"; \
	elif [ -n "$$web_path" ] && [ -z "$$dash_path" ]; then \
		prefix="$$web_path"; port=9120; root_port=9119; what="Webapp"; root_url="$(DASHBOARD_URL)"; legacy=""; \
	else \
		echo "• WEBAPP_URL e DASHBOARD_URL não dividem um domínio (um na raiz, outro num caminho):"; \
		echo "  use um Proxy Host para cada um (Webapp na porta 9120, dashboard na 9119)"; exit 0; \
	fi; \
	echo "# Proxy Host de $$root_url: Forward $(APP_NAME), porta $$root_port, Websockets Support ligado."; \
	echo "# Cole na aba Advanced dele: o $$what em $$prefix (porta $$port)."; \
	if [ -n "$$legacy" ]; then \
		echo "# Endereço antigo do Webapp: os links e favoritos em $$legacy continuam abrindo o app"; \
		echo "location = $$legacy { return 301 \$$scheme://\$$http_host/; }"; \
		echo "location ^~ $$legacy/ { rewrite ^$$legacy/(.*)\$$ \$$scheme://\$$http_host/\$$1 permanent; }"; \
	fi; \
	echo "location = $$prefix { return 301 \$$scheme://\$$http_host$$prefix/; }"; \
	echo "location $$prefix/ {"; \
	echo "  # O nome numa variável: o nginx do NPM recarrega mesmo com o Eros parado (o resolver do NPM resolve na hora)"; \
	echo "  set \$$eros_sub $(APP_NAME):$$port;"; \
	echo "  rewrite ^$$prefix/(.*)\$$ /\$$1 break;"; \
	echo "  proxy_pass http://\$$eros_sub;"; \
	echo "  proxy_http_version 1.1;"; \
	echo "  proxy_set_header Upgrade \$$http_upgrade;"; \
	echo "  proxy_set_header Connection \$$http_connection;"; \
	echo "  proxy_set_header Host \$$http_host;"; \
	echo "  proxy_set_header X-Forwarded-Host \$$http_host;"; \
	echo "  proxy_set_header X-Forwarded-Proto \$$scheme;"; \
	echo "  proxy_set_header X-Forwarded-For \$$proxy_add_x_forwarded_for;"; \
	echo "  proxy_set_header X-Forwarded-Prefix $$prefix;"; \
	echo "  proxy_read_timeout 3600s;"; \
	echo "}"

update: ## git pull do repositório (somente fast-forward)
	git -C "$(REPO_ROOT)" pull --ff-only

deploy: npm-check dirs update build up prune ## Deploy completo: pull, build, up e limpeza
	@echo "✔ Deploy concluído"

## —— Desenvolvimento ——————————————————————————————————————————————————————
dev: ## A imagem de produção na sua máquina: http://localhost:DEV_WEBAPP_PORT
	@docker image inspect "$(IMAGE)" >/dev/null 2>&1 || $(MAKE) build
	$(COMPOSE_DEV) up -d
	@echo "✔ Webapp em http://localhost:$${DEV_WEBAPP_PORT:-9120} (dashboard na $${DEV_DASHBOARD_PORT:-9119})"

dev-down: ## Para o ambiente de desenvolvimento
	$(COMPOSE_DEV) down

dev-logs: ## Logs do ambiente de desenvolvimento
	$(COMPOSE_DEV) logs -f --tail=100 $(SERVICE_DEV)

dev-configure: ## pt-BR e Webapp local no ambiente de desenvolvimento
	set -e; \
	for c in "plugins enable anima-pt-br" "config set display.language pt" "config set webapp.enabled true" \
	         "config set webapp.host 0.0.0.0" "config set webapp.port 9120" \
	         "config set webapp.public_url http://localhost:$${DEV_WEBAPP_PORT:-9120}"; do \
		$(COMPOSE_DEV) exec -T $(SERVICE_DEV) hermes $$c; done
	$(COMPOSE_DEV) restart $(SERVICE_DEV)

## —— Dados ———————————————————————————————————————————————————————————————
backup: ## Para o container, guarda dados + .env em BACKUP_DIR e sobe de novo
	-$(COMPOSE) stop $(SERVICE)
	@$(SUDO) $(SCRIPT_ENV) ./scripts/backup.sh
	-$(COMPOSE) start $(SERVICE)

backups: ## Lista os backups existentes
	@ls -lht "$(BACKUP_DIR)"/$(APP_NAME)_*.tar 2>/dev/null || echo "Nenhum backup em $(BACKUP_DIR)"

restore: ## Restaura um backup: make restore FILE=/srv/backups/.../arquivo.tar
	@test -n "$(FILE)" || { echo "✘ Informe FILE=<arquivo.tar> (veja make backups)"; exit 1; }
	@read -p "Restaurar $(FILE) em $(APPDATA_DIR)/hermes? Os dados atuais ficam guardados ao lado. [y/N] " ok && [ "$$ok" = y ]
	-$(COMPOSE) stop $(SERVICE)
	@$(SUDO) $(SCRIPT_ENV) ./scripts/restore.sh "$(FILE)"
	-$(COMPOSE) start $(SERVICE)

## —— Migração —————————————————————————————————————————————————————————————
migrate: ## Traz agentes, histórico e pastas de trabalho de outra instalação: make migrate FROM=/srv/appdata/.../hermes [DRY=1]
	@test -n "$(FROM)" || { echo "✘ Informe FROM=<pasta de dados antiga>"; exit 1; }
	@$(SUDO) $(SCRIPT_ENV) CONTAINER="$(APP_NAME)" DRY="$(DRY)" \
		MIGRATE_SKIP_PROFILES="$(MIGRATE_SKIP_PROFILES)" MIGRATE_WORKDIRS="$(MIGRATE_WORKDIRS)" \
		./scripts/migrate.sh "$(FROM)"

migrate-archive: ## Guarda em BACKUP_DIR as pastas antigas que não migram: make migrate-archive FROM=... ARCHIVE="a b"
	@test -n "$(FROM)" || { echo "✘ Informe FROM=<pasta de dados antiga>"; exit 1; }
	@$(SUDO) $(SCRIPT_ENV) ./scripts/archive.sh "$(FROM)" $(ARCHIVE)

channels-on: ## Liga os bots e as tarefas agendadas dos agentes estacionados (gateway.parked)
	@$(EXEC) sh -c 'n=0; for d in /opt/data/profiles/*/; do \
		[ -e "$$d/gateway.parked" ] || continue; p=$$(basename "$$d"); \
		hermes -p "$$p" gateway start >/dev/null && echo "  ✔ $$p" || { echo "  ✘ $$p"; n=1; }; done; exit $$n'
	@echo "✔ Agentes no ar. Confira com: docker compose exec $(SERVICE) hermes gateway status"

channels-off: ## Estaciona todos os agentes: sem bots e sem tarefas agendadas (o dashboard segue no ar)
	@$(EXEC) sh -c 'for d in /opt/data/profiles/*/; do p=$$(basename "$$d"); \
		hermes -p "$$p" gateway stop >/dev/null && echo "  ✔ $$p estacionado"; done'

## —— Limpeza —————————————————————————————————————————————————————————————
prune: ## Remove imagens Docker órfãs (dangling)
	docker image prune -f

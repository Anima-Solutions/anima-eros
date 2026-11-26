# Hermes Ânima em Docker

Um container com o gateway, o dashboard e o Webapp com o design system Ânima. As portas, o IP de bind, a rede e a pasta
de dados ficam no `.env` desta pasta.

## Rodar localmente

```sh
cd deploy/docker
cp .env.example .env
# preencha DASHBOARD_PASSWORD e DASHBOARD_SESSION_SECRET (comandos no próprio arquivo)
# HERMES_UID/HERMES_GID = saída de `id -u` / `id -g`
export NODE_AUTH_TOKEN=...   # token do GitHub com read:packages (design system privado)
docker compose up -d --build
```

O build instala o `@anima-solutions/design-system` do GitHub Packages. O token vai para o build como
secret do BuildKit e não fica em nenhuma camada da imagem; sem ele o build falha com 401.

- Dashboard: `http://127.0.0.1:${DASHBOARD_HOST_PORT}` (padrão 9119), com o usuário e a senha do `.env`.
- Configurar o modelo e as chaves: `docker compose exec hermes hermes setup`
  (os dados ficam em `./data`, que é o `~/.hermes` do container).
- Logs: `docker compose logs -f`

### Trocar portas

| Variável | Papel |
|---|---|
| `DASHBOARD_PORT` / `API_SERVER_PORT` | porta **dentro** do container (é a que o NPM usa) |
| `DASHBOARD_HOST_PORT` / `API_SERVER_HOST_PORT` | porta publicada no host |
| `HOST_BIND_IP` | `127.0.0.1` só na máquina, `0.0.0.0` para a rede |

Depois de mudar: `docker compose up -d`.

## Webapp (Hermes Desktop no navegador)

Fica na porta `WEBAPP_PORT` (padrão 9120), com o mesmo login do dashboard. Ligue uma vez:

```sh
docker compose exec hermes hermes config set webapp.enabled true
docker compose exec hermes hermes config set webapp.host 0.0.0.0
docker compose exec hermes hermes config set webapp.port 9120        # = WEBAPP_PORT
docker compose exec hermes hermes config set webapp.public_url http://localhost:9120
docker compose restart
```

Acesse `http://localhost:${WEBAPP_HOST_PORT}`. Se mudar `WEBAPP_PORT`, mude `webapp.port` também.
No VPS, troque `webapp.public_url` pelo endereço https e crie no NPM um Proxy Host para
`hermes-anima:9120`, com Websockets ligado.

## No VPS com Nginx Proxy Manager

1. **Suba o Hermes** como acima. Deixe `HOST_BIND_IP=127.0.0.1`: o NPM chega pela rede Docker e
   nada fica exposto direto na internet.
2. **Coloque o NPM na rede do Hermes** (`HERMES_NETWORK`, padrão `hermes-net`). No `docker-compose.yml`
   do NPM:

   ```yaml
   services:
     app:            # o serviço do NPM
       networks: [default, hermes-net]
   networks:
     hermes-net:
       external: true
   ```

   ou, sem editar o arquivo: `docker network connect hermes-net <container-do-npm>`.
3. **Proxy Host no NPM**:
   - Domain: `hermes.seudominio.com`
   - Scheme `http`, Forward Hostname `hermes-anima` (o `HERMES_CONTAINER_NAME`), Forward Port `9119` (o `DASHBOARD_PORT`)
   - Ative **Websockets Support** (o chat do dashboard usa WebSocket) e **Block Common Exploits**
   - Aba SSL: Let's Encrypt, **Force SSL** e **HTTP/2**
4. **Diga ao Hermes que ele está atrás de um proxy HTTPS.** No `.env`:
   `DASHBOARD_PUBLIC_URL=https://hermes.seudominio.com`. Em `data/config.yaml`:

   ```yaml
   dashboard:
     trusted_proxies:
       - "172.30.0.0/24"   # o HERMES_SUBNET
   ```

   Assim o Hermes aceita o `X-Forwarded-Proto: https` do NPM e marca os cookies de login como `Secure`.
   Nunca use `*` nem `0.0.0.0/0`, que o Hermes recusa. Aplique com `docker compose up -d`.
5. **API (opcional):** preencha `API_SERVER_KEY` e crie outro Proxy Host (por exemplo `api.seudominio.com`)
   apontando para `hermes-anima:8642`.

O login por usuário e senha serve para uso pessoal atrás de HTTPS. Para algo mais exposto, use OIDC ou
Nous OAuth (`website/docs/user-guide/features/web-dashboard.md`), ou restrinja o acesso no NPM com
**Access Lists**.

## Atualizar

```sh
git pull
docker compose up -d --build
```

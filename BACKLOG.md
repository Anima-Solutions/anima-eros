# Pendências do Ânima Eros

Ajustes anotados para fazer mais para frente. Cada item diz o que está errado, onde está no código e a direção
combinada (quando já houver uma). Ao concluir um item, remova-o daqui no mesmo commit.

## Visual (design system Ânima)

### Modo claro

- O tema Ânima foi aprovado no modo escuro. O modo claro ainda não foi revisado tela a tela (contraste, cores fora do
  DS).

### Pedidos ao time do design system

- Faltam `variant="text"`, `textStrong` e `size="inline"`. Hoje há contornos no Eros; quando o DS publicar, trocar
  pelos oficiais.

## Textos em pt-BR

- O Webapp está todo em português. A cada atualização da Hermes original, as chaves novas de
  `locales/_keys.desktop.json` entram no pacote: as simples em
  `deploy/docker/plugins/anima-pt-br/locales/pt.desktop.yaml` (ordenado por chave) e as que mudam conforme o valor em
  `deploy/docker/plugins/anima-pt-br/desktop/plugin.js`.

## Manutenção

- **Depois de 08/12/2026:** remover a exceção temporária do `react-resizable-panels@4.24.2` em
  `minimumReleaseAgeExclude` (`pnpm-workspace.yaml`).
- **Atualizar com a Hermes original** uma vez por mês (merge de `upstream/main` num branch, PR com merge
  commit, nunca squash).

## Mais para frente

- **Login da empresa (OIDC):** o Eros já suporta; falta criar o app no Google ou na Microsoft e preencher
  `DASHBOARD_OAUTH_CLIENT_ID` no `.env`.

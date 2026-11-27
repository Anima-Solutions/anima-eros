# Pendências do Ânima Eros

Ajustes anotados para fazer mais para frente. Cada item diz o que está errado, onde está no código e a direção
combinada (quando já houver uma). Ao concluir um item, remova-o daqui no mesmo commit.

## Visual (design system Ânima)

### Aba Recursos: cards com cores fora do DS

- **O que acontece:** os cards dos catálogos (Habilidades, Plugins, Conectores) e o destaque "Descobrir" têm um
  degradê colorido, e cada card pega uma cor de um rodízio de sete (azul, laranja, roxo, verde, vermelho, ciano,
  amarelo). Nenhuma delas é cor do design system.
- **Onde:**
  - `apps/desktop/src/app/capabilities/catalog/catalog-card.tsx`: `CARD_ACCENTS`, o rodízio das sete cores
    (`--ui-blue`, `--ui-orange`…);
  - `apps/desktop/src/app/capabilities/catalog/catalog.css`: o degradê (`--catalog-accent`, `--catalog-tint`), que
    também segue o cursor.
- **Direção sugerida:** no tema Ânima, card como o `Card` do DS (fundo e borda neutros, sem degradê), ou no máximo um
  único tom, o `primary`. O arco de hover já usa `--color-primary` e pode ficar. Fazer por CSS escopado ao tema
  (`[data-hermes-theme='anima…']`), como os outros ajustes em `styles.css`, para não mexer no código do upstream.

### Modo claro

- O tema Ânima foi aprovado no modo escuro. O modo claro ainda não foi revisado tela a tela (contraste, cores fora do
  DS).

### Pedidos ao time do design system

- Faltam `variant="text"`, `textStrong` e `size="inline"`. Hoje há contornos no Eros; quando o DS publicar, trocar
  pelos oficiais.

## Textos em pt-BR

- Ainda em inglês: o Bot Mode, o campo de mensagem ("What are we building?"), os nomes das plataformas e uns 60 textos
  que só aparecem em situações específicas.
- O pacote fica em `deploy/docker/plugins/anima-pt-br/locales/pt.desktop.yaml`, ordenado por chave. A cada
  atualização da Hermes original, as chaves novas de `locales/_keys.desktop.json` entram nele.

## Manutenção

- **Depois de 08/12/2026:** remover a exceção temporária do `react-resizable-panels@4.24.2` em
  `minimumReleaseAgeExclude` (`pnpm-workspace.yaml`).
- **Atualizar com a Hermes original** a cada uma ou duas semanas (merge de `upstream/main` num branch, PR com merge
  commit, nunca squash).

## Mais para frente

- **Login da empresa (OIDC):** o Eros já suporta; falta criar o app no Google ou na Microsoft e preencher
  `DASHBOARD_OAUTH_CLIENT_ID` no `.env`.

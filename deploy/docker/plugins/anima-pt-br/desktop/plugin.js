// Ânima Eros: a metade do pacote pt-BR que roda no Webapp.
//
// O locales/pt.desktop.yaml cobre os textos simples, com {0}, {1}… no lugar dos valores. Ele não consegue
// escrever um texto que muda conforme o valor ("1 resultado" / "3 resultados", "Mostrar" / "Ocultar"). Esses ficam
// aqui, como funções de verdade, registrados sobre o mesmo idioma pt: o resto continua vindo do YAML.
//
// Ao atualizar com a Hermes original: as chaves de locales/_keys.desktop.json que não estão no YAML são funções
// assim. A assinatura de cada uma está no en*.ts do Webapp (apps/desktop/src/i18n).

const s = (n, one, many) => (n === 1 ? one : many)

const translations = {
  assistant: {
    catalogInstall: {
      serverNotConnected: (server, reason) => `Servidor MCP ${server} não conectado${reason ? `: ${reason}` : ''}`
    },
    thread: {
      errorCodes: {
        context_overflow: {
          body: (_provider, model) =>
            `A conversa não cabe mais na janela de contexto ${model ? `de ${model}` : 'do modelo'}. Compacte-a para continuar.`
        },
        model_not_found: {
          body: (provider, model) => `${provider} não oferece ${model || 'este modelo'} na sua conta. Escolha outro modelo.`,
          title: (_provider, model) => `${model || 'Este modelo'} não está disponível`
        },
        provider_policy_blocked: {
          title: (provider, model) => `As configurações de ${provider} bloqueiam ${model || 'este modelo'}`
        },
        truncated: {
          body: (_provider, model) =>
            `${model || 'O modelo'} parou antes de terminar a resposta. Continue para retomar de onde parou.`
        },
        upstream_rate_limit: {
          body: (provider, model) =>
            `${model || 'Este modelo'} atingiu o limite de taxa na origem, antes de ${provider}, não na sua conta. Tente de novo em instantes.`,
          title: (_provider, model) => `${model || 'Este modelo'} está ocupado agora`
        }
      },
      errorSwitchToModel: (model, note) => (note ? `Trocar para ${model} (${note})` : `Trocar para ${model}`),
      resumeWhenBackgroundDone: count =>
        count === 1
          ? 'Continua quando a tarefa em segundo plano terminar'
          : `Continua quando as ${count} tarefas em segundo plano terminarem`
    },
    tool: {
      titleTemplates: {
        runningPrefixedTool: (prefix, action) => `Executando ${prefix.toLowerCase()} ${action.toLowerCase()}`,
        runningTool: action => `Executando ${action.toLowerCase()}`
      }
    }
  },
  catalog: {
    skillsFor: category => `Habilidades de ${category.toLowerCase()}.`,
    toolsets: {
      callCount: (count, calls) => `${count} ${s(calls, 'chamada', 'chamadas')}`
    }
  },
  commandCenter: {
    pets: {
      toggleFailed: enabled => `Não foi possível ${enabled ? 'ligar' : 'desligar'} o mascote.`
    }
  },
  connectorsPage: {
    tools: {
      conflictBody: (theyOff, theyOn) => {
        const they = [
          theyOff > 0 ? `desligaram ${theyOff} ${s(theyOff, 'ferramenta que você tem ligada', 'ferramentas que você tem ligadas')}` : '',
          theyOn > 0 ? `deixaram ${s(theyOn, 'ligada', 'ligadas')} ${theyOn} ${s(theyOn, 'ferramenta que você desligou', 'ferramentas que você desligou')}` : ''
        ].filter(Boolean)

        return `${they.length > 0 ? `Elas ${they.join(' e ')}. ` : ''}Suas edições continuam na tela; nada foi gravado.`
      },
      footerDirty: (off, backOn) =>
        `${off} ${s(off, 'ferramenta desligada', 'ferramentas desligadas')}, ${backOn === 0 ? 'nenhuma' : backOn} ${s(backOn, 'religada', 'religadas')}`
    }
  },
  cron: {
    control: {
      lastCancelled: reason => (reason ? `Última execução cancelada: ${reason}` : 'Última execução cancelada')
    }
  },
  desktop: {
    yoloSystem: active => `YOLO ${active ? 'ligado' : 'desligado'} nesta sessão`
  },
  install: {
    testSucceeded: (baseUrl, version) => `Conectado a ${baseUrl}${version ? ` (${version})` : ''}.`
  },
  messaging: {
    waitingSince: minutes => (minutes < 1 ? 'agora' : `há ${minutes} min`)
  },
  modelPicker: {
    limitReached: name => `Limite de ${name} atingido`
  },
  preview: {
    noInlineBody: mimeType => `${mimeType || 'Este tipo de arquivo'} ainda pode ser anexado como contexto.`,
    web: {
      finishedRestarting: message => `O Eros terminou de reiniciar o servidor da prévia${message ? `: ${message}` : ''}`,
      loadFailedConsole: (code, message) => `Falha ao carregar${code ? ` (${code})` : ''}: ${message}`
    }
  },
  promptNotices: {
    desktopCommands: {
      restored: hash => (hash ? `Ponto de restauração ${hash} restaurado.` : 'Ponto de restauração restaurado.')
    }
  },
  settings: {
    backup: {
      gatewayDown: agent =>
        `Os arquivos chegaram, mas ${agent} não voltou a iniciar, então os bots e as tarefas agendadas dele não estão rodando. Reinicie-o pelo portal do Hermes Cloud ou rode \`hermes gateway start\` nele.`
    },
    billing: {
      charge: {
        added: amount => (amount ? `US$ ${amount} adicionados.` : 'Créditos adicionados.')
      },
      errors: {
        rateLimited: {
          message: mins =>
            mins > 0
              ? `\u{1F7E1} Cobranças demais agora (tente de novo em ~${mins} min). Não é uma falha de pagamento.`
              : '\u{1F7E1} Cobranças demais agora. Não é uma falha de pagamento.'
        },
        stripeUnavailable: {
          message: mins =>
            mins > 0 ? `O Stripe está com problemas — tente de novo em ~${mins} min` : 'O Stripe está com problemas — tente de novo em instantes'
        }
      },
      plan: {
        effectScheduled: (targetName, effectiveAt, creditsDelta) =>
          `Troca para ${targetName}: vale a partir de ${effectiveAt}. Nada é cobrado agora; você mantém o plano atual até lá.${creditsDelta ? ` Mudança nos créditos mensais: ${creditsDelta}.` : ''}`
      }
    },
    gateway: {
      connectedTo: (baseUrl, version) => `Conectado a ${baseUrl}${version ? ` · Hermes ${version}` : ''}`
    },
    localModels: {
      downloadEtaHours: (hours, minutes) => (minutes ? `${hours} h ${minutes} min` : `${hours} h`)
    },
    mcp: {
      capabilitySummary: (tools, prompts, resources) =>
        `${[
          `${tools} ${s(tools, 'ferramenta', 'ferramentas')}`,
          ...(prompts ? [`${prompts} ${s(prompts, 'prompt', 'prompts')}`] : []),
          ...(resources ? [`${resources} ${s(resources, 'recurso', 'recursos')}`] : [])
        ].join(', ')} ${s(tools + (prompts || 0) + (resources || 0), 'ativado', 'ativados')}`
    },
    model: {
      moaReferenceToggle: (enabled, index) => `${enabled ? 'Desativar' : 'Ativar'} a referência ${index}`,
      staleAuxBefore: (count, names) =>
        `${count} ${s(count, 'tarefa auxiliar', 'tarefas auxiliares')} (${names}) ainda ${s(count, 'roda', 'rodam')} em `
    },
    plugins: {
      installModal: {
        partialInstall: sha =>
          sha
            ? `Só parte deste plugin está instalada: a parte do agente está no commit ${sha}, mas a parte do Webapp não acompanhou porque o repositório mudou depois da sua revisão. Ative "Forçar reinstalação" em Avançado para substituir as duas partes pela versão mostrada, ou Cancelar para manter só a parte do agente.`
            : 'Só parte deste plugin está instalada: a parte do agente está instalada, mas a parte do Webapp não acompanhou porque o repositório mudou depois da sua revisão. Ative "Forçar reinstalação" em Avançado para substituir as duas partes pela versão mostrada, ou Cancelar para manter só a parte do agente.',
        reviewedPin: sha => (sha ? `Versão revisada ${sha}` : 'Versão revisada'),
        serverNotConnected: (server, reason) => `O servidor MCP ${server} não está conectado${reason ? `: ${reason}` : '.'}`,
        skillsReady: names => (names.length === 1 ? `habilidade ${names[0]} pronta` : `${names.length} habilidades prontas`),
        sourceMoved: sha =>
          sha
            ? `O repositório mudou depois da sua revisão. Revise a nova versão (commit ${sha}) antes de instalar.`
            : 'O repositório mudou depois da sua revisão. Lendo a nova versão…'
      }
    },
    sessions: {
      defaultDirUpdated: shortcut =>
        `Pasta padrão de projetos atualizada: comece uma nova conversa${shortcut ? ` (${shortcut})` : ''} para valer`
    }
  },
  shell: {
    modelMenu: {
      limitedTip: (provider, time) =>
        time
          ? `${provider} atingiu o limite de uso. Ele renova às ${time}; você já pode escolher um modelo para depois.`
          : `${provider} atingiu o limite de uso. Você já pode escolher um modelo para depois que ele renovar.`,
      priceTitle: (input, output, cache) =>
        `Entrada ${input}/Mtok · Saída ${output}/Mtok` + (cache ? ` · Leitura em cache ${cache}/Mtok` : ''),
      usageLeft: (percent, time) => (time ? `${percent}% restantes · renova ${time}` : `${percent}% restantes`),
      usageWindow: (label, percent, time) =>
        time ? `${label}: ${percent}% restantes, renova ${time}` : `${label}: ${percent}% restantes`
    },
    statusbar: {
      planUsageTitle: (used, resetsIn) =>
        `${used} do uso do plano consumido${resetsIn ? ` · renova em ${resetsIn}` : ''} · abrir Cobrança`
    }
  },
  sidebar: {
    projects: {
      toggle: (label, open) => `${open ? 'Mostrar' : 'Ocultar'} as sessões de ${label}`
    }
  },
  skills: {
    hub: {
      installBlockedMessage: (findings, unverified) =>
        `A verificação de segurança apontou ${findings > 0 ? `${findings} ${s(findings, 'item', 'itens')}` : 'padrões de risco'} para revisar${unverified ? ', e a habilidade vem de uma fonte não verificada' : ''}. Leia a verificação antes de decidir se confia no autor.`,
      resultCount: (count, ms) => `${count} ${s(count, 'resultado', 'resultados')}${ms !== null ? ` em ${ms} ms` : ''}`
    },
    plugins: {
      catalogProvenance: sha => `Instalado do catálogo da Hermes${sha ? ` na versão ${sha}` : ''}.`,
      updateAllDone: (updated, review, failed) =>
        `${updated} ${s(updated, 'atualizado', 'atualizados')}` +
        (review ? `, ${review} ${s(review, 'precisa', 'precisam')} de revisão` : '') +
        (failed ? `, ${failed} ${s(failed, 'falhou', 'falharam')}` : ''),
      updateScanBody: (name, count) =>
        `A atualização de ${name} recebeu um alerta de cautela (${count} ${s(count, 'apontamento', 'apontamentos')}). Toda atualização é verificada. Aplique só se você confia na origem:`
    },
    toggleToolset: (label, enabled) => `${enabled ? 'Ligar' : 'Desligar'} o conjunto de ferramentas ${label}`
  },
  statusStack: {
    control: {
      gateLastExit: code => (code === null ? 'Pendente' : `Código de saída: ${code}`)
    }
  },
  ui: {
    sidebar: {
      toggle: open => `${open ? 'Mostrar' : 'Ocultar'} barra lateral`
    }
  },
  webhooks: {
    toggleFailed: (name, enabled) => `Não foi possível ${enabled ? 'ligar' : 'desligar'} "${name}"`
  }
}

export default {
  id: 'anima-pt-br',
  name: 'Português do Brasil (Ânima)',
  register(ctx) {
    ctx.i18n.registerAppLocale('pt', { endonym: 'Português (Brasil)', translations })
  }
}

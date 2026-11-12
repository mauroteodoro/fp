// Assistente: naturalidade e botão flutuante
'use strict';

// ═══════════════════════════════════════════════════════════════
// 📦 PACOTE A — NATURALIDADE
//    Camada de cortesia + personalização + ambiguidade, aplicada
//    ANTES do parser de intents. Permite que a assistente
//    "converse" sem depender de comandos — o usuário pode só
//    dizer "oi" ou "obrigado" e ter uma resposta natural.
// ═══════════════════════════════════════════════════════════════

// 🎯 Primeiro nome do usuário, capitalizado.
function asNome() {
    const nome = (meuPerfil.nome || '').trim();
    if (!nome) return '';
    const primeiro = nome.split(/\s+/)[0];
    return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}

// Retorna false em PJ ou quando temVale === 'Não'.
function asTemVale() {
    return meuPerfil.regime !== 'PJ' && meuPerfil.temVale !== 'Não';
}

// 🎯 Saudação por hora do dia.
function asSaudacaoHora() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
}

// 🎯 Botão inline de sugestão (padrão visual único).
function asBotaoInline(txt, q) {
    return `<button type="button" data-q="${q}" onclick="asPerguntar(this.dataset.q)" class="px-2.5 py-1.5 text-[11px] font-semibold rounded-full bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#2a3850] text-slate-700 dark:text-gray-300 hover:bg-[#4D6BFE]/5 dark:hover:bg-[#4D6BFE]/10 hover:border-[#4D6BFE] dark:hover:border-[#4D6BFE] hover:text-[#4D6BFE] dark:hover:text-[#4D6BFE] transition-all active:scale-95 whitespace-nowrap">${txt}</button>`;
}

// ---------- RESPOSTAS DE CORTESIA ----------

function asRespSaudacao() {
    const nome = asNome();
    const saud = asSaudacaoHora();
    const sufixo = nome ? `, ${nome}` : '';
    return `
        <p class="font-semibold text-slate-800 dark:text-gray-100 mb-1">${saud}${sufixo}! 👋</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px]">Em que posso ajudar? Escreva sua dúvida ou toque em uma sugestão abaixo.</p>
        <div class="mt-3 flex flex-wrap gap-1.5">
            ${asBotaoInline('Quando cai meu salário?', 'Quando cai meu salário?')}
            ${asBotaoInline('Qual meu saldo?', 'Qual meu saldo?')}
            ${asBotaoInline('Gastos do mês', 'Quanto gastei este mês?')}
        </div>
    `;
}

function asRespAgradecimento() {
    const nome = asNome();
    return `<p class="text-slate-700 dark:text-gray-200 text-[13px]">Por nada${nome ? ', ' + nome : ''}! Qualquer coisa, é só chamar. 🙂</p>`;
}

function asRespDespedida() {
    return `<p class="text-slate-700 dark:text-gray-200 text-[13px]">Até mais! 👋 Se precisar, é só voltar.</p>`;
}

function asRespEstado() {
    return `<p class="text-slate-700 dark:text-gray-200 text-[13px]">Tudo ótimo por aqui! Pronto pra ajudar. 😊</p>
        <p class="text-[12px] text-slate-500 dark:text-gray-400 mt-2">Pode perguntar sobre saldo, gastos, salário, férias, 13º ou descontos.</p>`;
}

function asRespQuem() {
    const nome = asNome();
    return `<p class="text-slate-700 dark:text-gray-200 text-[13px]">Sou o assistente do seu app de finanças${nome ? ', ' + nome : ''}. Conheço seus lançamentos, saldos e a simulação salarial — só pergunto e respondo.</p>
        <p class="text-[11px] text-slate-400 dark:text-gray-500 mt-2">Ainda não sou IA generativa — respondo por regras. Mas não invento números.</p>`;
}

// Pergunta genérica ("salário", "vale", "mês") → botões de desambiguação.
function asDetectarAmbiguidade(t) {
    if (/^\s*(o\s+|a\s+)?sal[áa]rio\s*\??\s*$/.test(t)) {
        return `
            <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-2">O que sobre o <strong>salário</strong>?</p>
            <div class="flex flex-wrap gap-1.5">
                ${asBotaoInline('Quando cai', 'Quando cai meu salário?')}
                ${asBotaoInline('Saldo atual', 'Qual meu saldo do salário?')}
                ${asBotaoInline('Gastos', 'Quanto vou gastar no salário deste mês?')}
                ${asBotaoInline('Descontos', 'Quais meus descontos?')}
            </div>
        `;
    }
    if (/^\s*(o\s+|a\s+)?vale\s*\??\s*$/.test(t)) {
        return `
            <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-2">O que sobre o <strong>vale</strong>?</p>
            <div class="flex flex-wrap gap-1.5">
                ${asBotaoInline('Quando cai', 'Quando cai meu vale?')}
                ${asBotaoInline('Gastos', 'Quanto vou gastar no vale deste mês?')}
                ${asBotaoInline('Saldo atual', 'Qual meu saldo do vale?')}
            </div>
        `;
    }
    if (/^\s*(o\s+|este\s+|esse\s+)?m[êe]s\s*\??\s*$/.test(t)) {
        return `
            <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-2">O que sobre o <strong>mês</strong>?</p>
            <div class="flex flex-wrap gap-1.5">
                ${asBotaoInline('Gastos', 'Quanto gastei este mês?')}
                ${asBotaoInline('Receitas', 'Quanto recebi este mês?')}
                ${asBotaoInline('Saldo', 'Qual meu saldo?')}
                ${asBotaoInline('Onde gastei mais', 'Onde gastei mais este mês?')}
            </div>
        `;
    }
    return null;
}

let asUltimoContexto = null;

// ---------- PARSER (interpreta a pergunta) ----------

function asInterpretar(texto) {
    const t = texto.toLowerCase().trim();

    // Saudações puras
    if (/^(oi+|ol[áa]|e a[ií]|opa|hey|hello|hi)\s*[!.?,]*\s*$/.test(t)) return asRespSaudacao();
    if (/^bom dia\s*[!.?,]*\s*$/.test(t)) return asRespSaudacao();
    if (/^boa (tarde|noite)\s*[!.?,]*\s*$/.test(t)) return asRespSaudacao();

    // Agradecimento
    if (/^(valeu|obrigad[oa]|brigad[oa]|vlw|thanks|thank you)\s*[!.?,]*\s*$/.test(t)) return asRespAgradecimento();

    // Despedida
    if (/^(tchau|at[ée] (mais|logo)|adeus|flw|falou)\s*[!.?,]*\s*$/.test(t)) return asRespDespedida();

    // Estado ("tudo bem?", "como vai?")
    if (/^(tudo bem|como (voc[êe] )?(vai|est[áa])|beleza|tranquilo)\s*[?!.,]*\s*$/.test(t)) return asRespEstado();

    // Identidade ("quem é você?", "seu nome")
    if (/^(quem [ée] voc[êe]|seu nome|o que voc[êe] [ée])/.test(t)) return asRespQuem();

    // Follow-up encadeado ("E no vale?", "E em dez?"): herda contexto anterior.
    const ehFollowUp = /^\s*e\s+/i.test(t);
    if (ehFollowUp && asUltimoContexto) {
        const info = asExtrairMesAno(t) || { mes: asUltimoContexto.mes, ano: asUltimoContexto.ano };

        if (asUltimoContexto.tipo === 'bucket') {
            const bucket = /sal[áa]rio/.test(t) ? 'Salário' : (/vale/.test(t) ? 'Vale' : asUltimoContexto.bucket);
            asUltimoContexto = { tipo: 'bucket', bucket, mes: info.mes, ano: info.ano };
            return asRespProjecaoBucket(info.mes, info.ano, bucket);
        }
        if (asUltimoContexto.tipo === 'saldo-bucket') {
            // 🎯 "E do vale?" / "E o total?" / "E em dezembro?" — herda
            //    o mês do contexto e troca só o bucket quando mencionado.
            let bucket = asUltimoContexto.bucket;
            if (/\btotal\b/.test(t)) bucket = 'Total';
            else if (/sal[áa]rio/.test(t)) bucket = 'Salário';
            else if (/vale/.test(t)) bucket = 'Vale';
            asUltimoContexto = { tipo: 'saldo-bucket', bucket, mes: info.mes, ano: info.ano };
            return asRespSaldoBucket(bucket, info.mes, info.ano);
        }
        if (asUltimoContexto.tipo === 'despesa-mes') {
            // 🎯 Se o follow-up mudar o tempo verbal ("e quanto vou
            //    gastar?"), reavalia o modo. Senão, mantém o anterior.
            let modo = asUltimoContexto.modo || 'todos';
            if (/vou (gastar|pagar)|vai (gastar|pagar)|a (pagar)|pendent/.test(t)) modo = 'pendente';
            else if (/j[áa]|gastei|paguei/.test(t)) modo = 'pago';
            asUltimoContexto = { tipo: 'despesa-mes', mes: info.mes, ano: info.ano, modo };
            return asRespTotalMes(info.mes, info.ano, 'despesa', modo);
        }
        if (asUltimoContexto.tipo === 'receita-mes') {
            let modo = asUltimoContexto.modo || 'todos';
            if (/vou (receber|ganhar)|vai (receber|ganhar)|a receber/.test(t)) modo = 'pendente';
            else if (/j[áa]|recebi|ganhei|entrou/.test(t)) modo = 'pago';
            asUltimoContexto = { tipo: 'receita-mes', mes: info.mes, ano: info.ano, modo };
            return asRespTotalMes(info.mes, info.ano, 'receita', modo);
        }
        if (asUltimoContexto.tipo === 'categoria') {
            asUltimoContexto = { tipo: 'categoria', catNome: asUltimoContexto.catNome, mes: info.mes, ano: info.ano };
            return asRespGastosCategoria(info.mes, info.ano, asUltimoContexto.catNome);
        }
        if (asUltimoContexto.tipo === 'valor-base') {
            // 🎯 "E do vale?" / "E o salário?" / "E em dezembro?"
            //    Herda mês/ano do contexto. Troca bucket só se mencionar.
            let bucket = asUltimoContexto.bucket;
            if (/vale/.test(t)) bucket = 'Vale';
            else if (/sal[áa]rio/.test(t)) bucket = 'Salário';
            asUltimoContexto = { tipo: 'valor-base', bucket, mes: info.mes, ano: info.ano };
            return asRespValorBase(bucket, info.mes, info.ano);
        }
        if (asUltimoContexto.tipo === 'extremos-gasto') {
            // 🎯 "E os menores?" — herda mês e tipo se não mencionar
            let extremo = asUltimoContexto.extremo;
            if (/menor|mais baix/.test(t)) extremo = 'menor';
            else if (/maior|mais alt/.test(t)) extremo = 'maior';
            asUltimoContexto = { tipo: 'extremos-gasto', extremo, mes: info.mes, ano: info.ano };
            return asRespExtremosGasto(info.mes, info.ano, extremo);
        }
        if (asUltimoContexto.tipo === 'transferencia-mes') {
            // 🎯 "E as pendentes?" / "E em outubro?" / "E as efetivadas?"
            let modo = asUltimoContexto.modo || 'todas';
            if (/pendente|a efetivar|aguardando/.test(t)) modo = 'pendente';
            else if (/efetivad|pag[ao]s?|concluíd/.test(t)) modo = 'pago';
            else if (/todas|todos/.test(t)) modo = 'todas';
            asUltimoContexto = { tipo: 'transferencia-mes', modo, mes: info.mes, ano: info.ano };
            return asRespTransferenciasMes(info.mes, info.ano, modo);
        }
        // Refinamento de meta: herda contexto, substitui só o que mudou.
        if (asUltimoContexto.tipo === 'planejar-meta') {
            const ehClaramenteOutro = /este m[êe]s|esse m[êe]s|m[êe]s atual|m[êe]s corrente|gast|despes|receb|receit|ganh|saldo|transfer|paguei|atrasad|or[çc]amento|limite|f[ée]rias|13[ºo°]|d[ée]cimo|desconto/i.test(t);

            if (!ehClaramenteOutro) {
                const infoData = asExtrairMesAlvo(t);
                const valorMetaNovo = asExtrairMetaValor(t);
                const atualNovo = asExtrairMetaAtual(t);
                const pisoNovo = asExtrairPisoMensal(t);
                const temPalavraMeta = /\b(meta|objetivo)\b/i.test(t);

                const temSinalDeMeta = !!(infoData || valorMetaNovo > 0 || atualNovo > 0 || pisoNovo > 0 || temPalavraMeta);

                if (temSinalDeMeta) {
                    const novaData = infoData || { mes: asUltimoContexto.mesAlvo, ano: asUltimoContexto.anoAlvo };
                    return asRespPlanejarMeta(
                        valorMetaNovo || asUltimoContexto.valorMeta,
                        Math.max(0, atualNovo || asUltimoContexto.valorAtual),
                        novaData.mes,
                        novaData.ano,
                        Math.max(0, pisoNovo || asUltimoContexto.pisoMensal)
                    );
                }
            }
        }
    }

    const temGatilhoDuvida = /\b(o que (?:[ée]|s[ãa]o|significa|quer dizer|faz|fazem)|como (?:fa[çc]o|fazer|funciona|funcionam|usar|criar|editar|apagar|lan[çc]ar|configur|mudar|vejo|encontro|zero|salvo|importo|exporto|adiciono|reordeno|encerro|oculto|compartilho|imprimo|marco|quitar|adianto|pulo|removo|limpo|filtro)|para que serve|pra que serve|me explica|explica (?:sobre|como|a|o|as|os)|ensina (?:sobre|como)|onde (?:fica|ficam|encontro|vejo|est[áa])|o que significa|qual a diferen[çc]a|diferen[çc]a entre|me diz (?:o que|como|quando)|quero (?:entender|saber)|preciso (?:entender|saber)|tenho d[úu]vida|ajuda com|explica[çc][ãa]o|o que tem|o que ainda|novidades|roadmap)\b/i;

    // Perguntas "quanto/quantos/quando..." pedem DADO, não conceito.
    const ehPedidoDeDado = /^\s*(quanto|quantos|quantas|quando)\b/i.test(t);

    const ehTarefaDeMeta = /\b(juntar|guardar|poupar|economizar|atingir|alcan[çc]ar|chegar\s+em)\s+(?:r\$\s*)?[\d.,]+/i.test(t);

    // Perguntas de compra com modal ("consigo/posso comprar X?") pedem CÁLCULO.
    const ehTarefaDeCompra = /\b(comprar|adquirir|gastar em|investir em|pegar)\b/i.test(t)
                          && /\b(consigo|consegui(?:r|rei|ria|u|ndo)?|posso|poderei|poderia|vou\s+(?:conseguir|comprar|pegar)|d[áa]\s*(?:pra|para)?|vale a pena|é poss[íi]vel)\b/i.test(t);

    const ehTarefaDeOrcamento = /\bor[çc]amentos?\b|\bmeus?\s+limites?\b|\bestourei\b|\bultrapassei\b|\bexcedi\b|\bestourou\b|\bultrapassou\b|\bno\s+limite\b|\bchegando\s+no\s+(?:teto|limite)\b|\bcategorias?\s+(?:no|em)\s+limite\b/i.test(t);

    if (temGatilhoDuvida && !ehPedidoDeDado && !ehTarefaDeMeta && !ehTarefaDeCompra && !ehTarefaDeOrcamento) {
        const kbItem = asBuscarNaBase(t);
        if (kbItem) return asRenderRespostaKB(kbItem);
    }

    // Captura a resposta de reserva mensal após o cadastro da meta.
    if (asUltimoContexto && asUltimoContexto.tipo === 'meta-aguardando-reserva') {
        const ctx = asUltimoContexto;
        let piso = 0;
        const tLimpo = t.trim();
        if (!/^(n[ãa]o|nenhum[a]?|sem|zero|nada|0)\b/i.test(tLimpo)) {
            const m = tLimpo.match(/(?:r\$\s*)?([\d.,]+)/);
            if (m) {
                let v = valorFloat(m[1]);
                // Se vier algo como "5 mil" ou "5k"
                if (/\b(?:mil|k)\b/i.test(tLimpo)) v *= 1000;
                if (v > 0) piso = v;
            }
        }
        asUltimoContexto = null;
        return asRespPlanejarMeta(ctx.valorMeta, ctx.valorAtual, ctx.mesAlvo, ctx.anoAlvo, piso);
    }

    // Contas atrasadas ("atrasada", "vencida", "não paguei...").
    const temAtraso = /\b(atrasad[ao]s?|vencid[ao]s?|em atraso|passou do vencimento|j[áa] venceu)\b/i.test(t);
    const temNaoPago = /\bn[ãa]o\s+(?:paguei|pagas?|pagou|foram? pag)/i.test(t)
                    && /\b(contas?|boletos?|faturas?|pendentes?|d[íi]vidas?)\b/i.test(t);
    if (temAtraso || temNaoPago) {
        return asRespContasAtrasadas();
    }

    // Orçamento: detecta "orçamento", "limites", "estourei", "no limite".
    const temOrcamento = /\bor[çc]amentos?\b/i.test(t)
                      || /\bmeus?\s+limites?\b/i.test(t)
                      || /\bestourei\b|\bultrapassei\b|\bexcedi\b|\bestourou\b|\bultrapassou\b/i.test(t)
                      || /\bno\s+limite\b|\bchegando\s+no\s+(teto|limite)\b/i.test(t);
    if (temOrcamento) {
        let modo = 'todos';
        if (/\bj[áa]\s+(?:gastei|paguei|saiu)|s[óo]\s+(?:o que )?j[áa]|efetivad|pagos?\b/i.test(t)) {
            modo = 'pago';
        }
        return asRespOrcamentos(modo);
    }

    // Comparação entre meses ("compare outubro com setembro").
    if (/\b(compar[ae]r?|versus|vs\.?)\b/i.test(t)) {
        const par = asExtrairDoisMeses(t);
        if (par) {
            return asRespCompararMeses(par.m1.mes, par.m1.ano, par.m2.mes, par.m2.ano);
        }
    }

    // Planejar meta ("quero juntar X até Y").
    if (/\b(juntar|guardar|poupar|economizar|atingir|alcan[çc]ar)\b/i.test(t)
        || /\bmeta\s+(?:de|é)\b/i.test(t)
        || /\bobjetivo\s+(?:de|é)\b/i.test(t)) {

        const ehFollowUp = /^\s*e\s+/i.test(t);
        const temCtx = asUltimoContexto && asUltimoContexto.tipo === 'planejar-meta';

        let vMeta = asExtrairMetaValor(t);
        let vAtual = asExtrairMetaAtual(t);
        let vPiso = asExtrairPisoMensal(t);
        let dtAlvo = asExtrairMesAlvo(t);

        // Prioridade: entrada parcial > valor declarado > saldo real da conta > 0.
        const entrada = asExtrairEntrada(t);
        if (entrada) {
            // Nível 1: entrada parcial explícita
            vAtual = entrada.valor;
        } else if (vAtual === 0) {
            // Nível 3: usuário citou uma conta mas não deu valor
            const contaSemValor = asDetectarContaSemValor(t);
            if (contaSemValor) {
                const saldoReal = typeof obterSaldoContaReal === 'function'
                    ? obterSaldoContaReal(contaSemValor.id)
                    : parseFloat(contaSemValor.saldoInicial || 0);
                if (saldoReal > 0) vAtual = saldoReal;
            }
        }

        // Herança para refinamento
        if (temCtx && ehFollowUp) {
            if (vMeta === 0) vMeta = asUltimoContexto.valorMeta;
            if (vAtual === 0) vAtual = asUltimoContexto.valorAtual;
            if (vPiso === 0) vPiso = asUltimoContexto.pisoMensal;
            if (!dtAlvo) dtAlvo = { mes: asUltimoContexto.mesAlvo, ano: asUltimoContexto.anoAlvo };
        } else {
            // Primeira interação: valor é obrigatório
            if (vMeta === 0) {
                return `
                    <p class="text-slate-600 dark:text-gray-300 text-[13px]">Boa ideia! Vou te ajudar a planejar essa meta. Me passa o <strong>valor</strong> e a <strong>data alvo</strong>.</p>
                    <p class="text-[12px] text-slate-500 dark:text-gray-400 mt-2 mb-3">Exemplos (é só tocar):</p>
                    <div class="flex flex-col gap-1.5">
                        ${[
                            'Quero juntar 5000 até dezembro sobrando 400 por mês',
                            'Preciso juntar 6500 até março de 2027, tenho 1200 no Cofrinho',
                            'Quero juntar 10000 até dezembro, usar 500 do Cofrinho como entrada'
                        ].map(q => `<button type="button" data-q="${q}" onclick="asPerguntar(this.dataset.q)" class="w-full text-left px-3 py-2 text-[12px] rounded-lg bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#2a3850] text-slate-700 dark:text-gray-300 hover:border-[#4D6BFE] hover:text-[#4D6BFE] transition-all active:scale-[0.98]">${q}</button>`).join('')}
                    </div>
                `;
            }
            if (!dtAlvo) {
                // Sem data alvo, assume dezembro do ano corrente
                dtAlvo = { mes: 11, ano: dataFiltro.getFullYear() };
            }
        }

        if (vMeta > 0 && dtAlvo) {
            const mencionouReserva = vPiso > 0 || /sobrando|mantendo|manter|guardar\s+(?:ao\s+menos\s+)?[\d.,]|reserva\s+de|n[ãa]o\s+gastar\s+mais/i.test(t);

            if (!mencionouReserva) {
                asUltimoContexto = {
                    tipo: 'meta-aguardando-reserva',
                    valorMeta: vMeta,
                    valorAtual: Math.max(0, vAtual),
                    mesAlvo: dtAlvo.mes,
                    anoAlvo: dtAlvo.ano
                };
                return `
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">🎯 Meta · ${nomeMeses[dtAlvo.mes]}/${dtAlvo.ano}</p>
                    <p class="text-2xl font-bold text-[#4D6BFE] font-montserrat tracking-tight mb-2">${formatMoeda(vMeta)}</p>
                    <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-3">
                        ${vAtual > 0 ? `Começando com <strong>${formatMoeda(vAtual)}</strong>, faltam <strong>${formatMoeda(vMeta - vAtual)}</strong>. ` : ''}Antes de montar o plano, uma pergunta:
                    </p>
                    <div class="p-3 bg-[#4D6BFE]/5 dark:bg-[#4D6BFE]/10 rounded-xl border border-[#4D6BFE]/20 dark:border-[#4D6BFE]/30">
                        <p class="text-[13px] text-slate-700 dark:text-gray-200 leading-relaxed">
                            <strong>Quer manter alguma reserva mensal?</strong> Ou seja, um valor que sobra para outras coisas depois de guardar para a meta.
                        </p>
                        <p class="text-[11px] text-slate-500 dark:text-gray-400 mt-2 leading-snug">Responda com o valor (ex: <strong>R$ 400</strong>) ou diga <strong>"sem reserva"</strong>.</p>
                    </div>
                `;
            }

            return asRespPlanejarMeta(vMeta, Math.max(0, vAtual), dtAlvo.mes, dtAlvo.ano, Math.max(0, vPiso));
        }
    }

    if (/\b(comprar|adquirir|gastar em|investir em|pegar)\b/i.test(t)
        && /\b(consigo|consegui(?:r|rei|ria|u|ndo)?|posso|poderei|poderia|vou\s+(?:conseguir|comprar|pegar)|d[áa]\s*(?:pra|para)?|vale a pena|é poss[íi]vel)\b/i.test(t)) {
        const valor = asExtrairValorCompra(t);
        if (valor > 0) {
            const parcelas = asExtrairParcelas(t);
            const reserva = asExtrairReservaMinima(t);
            const nome = asExtrairNomeItem(t);
            const mesInicio = asExtrairMesInicio(t);
            return asRespAnaliseCompra(valor, parcelas.n, reserva, nome, {
                parcelasExatas: parcelas.exato,
                mesInicial: mesInicio
            });
        }
        // Sem valor — oferece exemplos
        return `
            <p class="text-slate-600 dark:text-gray-300 text-[13px]">Boa! Vou analisar sua compra. Me passa o <strong>valor</strong>, por favor.</p>
            <p class="text-[12px] text-slate-500 dark:text-gray-400 mt-2 mb-3">Alguns exemplos (é só tocar):</p>
            <div class="flex flex-col gap-1.5">
                ${[
                    'Consigo comprar um celular de 2000?',
                    'Posso gastar 500 em um tênis?',
                    'Dá pra comprar uma TV de 3000 em 6x?',
                    'Consigo comprar um notebook de 4000 sobrando 400?',
                    'Consigo comprar um sofá de 2500 parcelado?'
                ].map(q => `<button type="button" data-q="${q}" onclick="asPerguntar(this.dataset.q)" class="w-full text-left px-3 py-2 text-[12px] rounded-lg bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#2a3850] text-slate-700 dark:text-gray-300 hover:border-[#4D6BFE] hover:text-[#4D6BFE] transition-all active:scale-[0.98]">${q}</button>`).join('')}
            </div>
        `;
    }

    // Refinamento de compra ("E se eu parcelar em 10x?", "E se fosse 5000?").
    if (asUltimoContexto && asUltimoContexto.tipo === 'analise-compra') {
        let novoValor = asUltimoContexto.valor;
        let novasParcelas = asUltimoContexto.parcelasMaximas;
        let novaReserva = asUltimoContexto.reservaMin;
        let mudou = false;

        // 1. Novas parcelas ("em 10x", "10 vezes", "parcelar" → 12x)
        const matchParcelas = t.match(/(?:em\s*)?(\d{1,2})\s*(?:x|vezes|parcelas)/i);
        if (matchParcelas) {
            novasParcelas = Math.min(12, Math.max(1, parseInt(matchParcelas[1])));
            mudou = true;
        } else if (/\bparcelar|parcelado\b/i.test(t)) {
            novasParcelas = 12;
            mudou = true;
        }

        // 2. Novo valor ("fosse 5000", "por 3000", "custando 2500")
        const matchValor = t.match(/(?:fosse|cust(?:a|asse|ando)|por)\s+(?:r\$\s*)?([\d.,]+)\s*(mil|k)?/i);
        if (matchValor) {
            let v = valorFloat(matchValor[1]);
            if (matchValor[2]) v *= 1000;
            if (v > 0) { novoValor = v; mudou = true; }
        }

        // 3. Nova reserva ("sobrando 500", "guardar 300", "manter 400")
        const matchReserva = t.match(/(?:sobrando|guardar|manter|reserva de)\s+(?:ao menos\s+)?(?:r\$\s*)?([\d.,]+)/i);
        if (matchReserva) {
            novaReserva = valorFloat(matchReserva[1]);
            mudou = true;
        }

        if (mudou) {
            asUltimoContexto = {
                tipo: 'analise-compra',
                valor: novoValor,
                parcelasMaximas: novasParcelas,
                reservaMin: novaReserva,
                nomeItem: asUltimoContexto.nomeItem
            };
            return asRespAnaliseCompra(novoValor, novasParcelas, novaReserva, asUltimoContexto.nomeItem);
        }
    }

    // Transferências (pendentes / conta específica / total do mês).
    if (/transfer[êe]ncia|transferi|transferiu|transferindo/i.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };

        if (/pendente|a efetivar|aguardando|não efetivad/.test(t)) {
            asUltimoContexto = { tipo: 'transferencia-mes', modo: 'pendente', mes: info.mes, ano: info.ano };
            return asRespTransferenciasPendentes(info.mes, info.ano);
        }

        const contaMencionada = asExtrairConta(t);
        if (contaMencionada) {
            return asRespTransferenciasConta(contaMencionada);
        }

        asUltimoContexto = { tipo: 'transferencia-mes', modo: 'todas', mes: info.mes, ano: info.ano };
        return asRespTransferenciasMes(info.mes, info.ano, 'todas');
    }

    // 1. Ajuda / menu / voltar / opções
    //    🎯 Inclui os termos "voltar", "menu" e "opções" — quando o
    //    usuário se sentir perdido, qualquer uma dessas palavras
    //    traz ele de volta para o cardápio de comandos.
    if (/\bajuda\b|\bhelp\b|\bmenu\b|\bvoltar\b|op[çc][õo]es|o que voc[êe] pode|o que posso perguntar|comandos/.test(t)) {
        return asRespAjuda();
    }

    // Gastos por categoria ("quanto gastei com alimentação?").
    const temVerboGasto2 = /gast|despes|pag(uei|o|ar)/.test(t);
    const catMencionada = categoriasGlobais.find(c => t.includes(c.nome.toLowerCase()));
    if (catMencionada && temVerboGasto2) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        // Guarda contexto — habilita "E em dezembro?" depois de
        // "Quanto gastei com alimentação em setembro?".
        asUltimoContexto = { tipo: 'categoria', catNome: catMencionada.nome, mes: info.mes, ano: info.ano };
        return asRespGastosCategoria(info.mes, info.ano, catMencionada.nome);
    }

    // Receitas por bucket ("quanto recebi no salário/vale?").
    const temBucketReceita = /no sal[áa]rio|do sal[áa]rio|sal[áa]rio de|sal[áa]rio em|no vale|do vale|vale de|vale em/.test(t);
    const temVerboReceita = /receb|ganh|entrou|entraram|caiu|ca[ií]ram/.test(t);
    if (temBucketReceita && temVerboReceita) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        const bucket = /sal[áa]rio/.test(t) ? 'Salário' : 'Vale';
        return asRespReceitaBucket(info.mes, info.ano, bucket);
    }

    // 13º salário.
    if (/13[ºo°]|d[ée]cimo.?terceiro|13\s*sal[áa]rio/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: 10, ano: dataFiltro.getFullYear() };
        return asRespDecimo(info.mes, info.ano);
    }

    // Férias — foco em datas, dias ou valores conforme a pergunta.
    if (/f[ée]rias|quando.*tir[oa]|volta ao trabalho|volto.*trabalho|minhas f[ée]rias|meu descanso/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        let foco = 'datas';
        if (/quanto.*(receber|ganhar|vale|pagar)|valor.*f[ée]rias|benef[íi]cio.*f[ée]rias|remunera[çc][ãa]o.*f[ée]rias|l[íi]quido.*f[ée]rias/.test(t)) {
            foco = 'valores';
        } else if (/quantos?\s+dias|quantas?\s+semanas|dura[çc][ãa]o|dias.*f[ée]rias/.test(t)) {
            foco = 'dias';
        }
        return asRespFerias(info.mes, info.ano, foco);
    }

    // Descontos.
    if (/descontos?|conv[êe]nio|fretado|o que (me )?desconta|descontam/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        return asRespDescontos(info.mes, info.ano);
    }

    // Data do salário / vale (mês dinâmico).
    if (/quando.*cai|data.*sal[áa]rio|data.*pagamento|quando.*recebo|quando cai|data.*vale|quando.*vale/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        return asRespDataSalario(info.mes, info.ano);
    }

    // 3. Gastos por bucket (salário/vale) — futuro, presente ou passado.
    //    Detecta menção explícita a "no/do salário" ou "no/do vale"
    //    combinada com verbo de gasto (gastar, gastei, despesa, paguei).
    //    A ordem importa: precisa vir ANTES do bloco genérico de
    //    "gastei/gastou" senão o filtro de bucket é ignorado.
    const temBucket = /no sal[áa]rio|do sal[áa]rio|sal[áa]rio de|sal[áa]rio em|no vale|do vale|vale de|vale em/.test(t);
    const temVerboGasto = /gast|despes|pag(uei|o|ar)|vou usar|vai usar/.test(t);
    if (temBucket && temVerboGasto) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        const bucket = /sal[áa]rio/.test(t) ? 'Salário' : 'Vale';
        // Guarda contexto para permitir follow-ups ("E no vale?")
        asUltimoContexto = { tipo: 'bucket', bucket, mes: info.mes, ano: info.ano };
        return asRespProjecaoBucket(info.mes, info.ano, bucket);
    }

    // 4. Saldo de conta específica
    const contaMencionada = asExtrairConta(t);
    if (contaMencionada && /saldo|quanto.*tenho|quanto.*tem|quanto h[áa]/.test(t)) {
        return asRespSaldoConta(contaMencionada);
    }

    // Saldo por bucket (Salário / Vale / Total) — antes do genérico.
    if (/saldo.*(sal[áa]rio|vale|total|projetad)|(sal[áa]rio|vale).*saldo|quanto.*(tenho|tem|sobra|sobrou).*(no|do|de|d[oa]) (sal[áa]rio|vale)|proje[cç][ãa]o.*(sal[áa]rio|vale|total)/.test(t)) {
        // Detecta bucket — ordem de prioridade: Total > Salário > Vale > (fallback Salário)
        let bucket = 'Salário';
        if (/\btotal\b/.test(t)) bucket = 'Total';
        else if (/sal[áa]rio/.test(t)) bucket = 'Salário';
        else if (/vale/.test(t)) bucket = 'Vale';
        else if (/projetad/.test(t)) bucket = 'Total';

        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        // Guarda contexto — habilita "E do vale?", "E o total?" sem repetir mês
        asUltimoContexto = { tipo: 'saldo-bucket', bucket, mes: info.mes, ano: info.ano };
        return asRespSaldoBucket(bucket, info.mes, info.ano);
    }

    // 4. Saldo total (sem conta específica) → saldo REAL (soma das contas)
    if (/qual.*(meu )?saldo|meu saldo|saldo atual|saldo total|saldo das contas|quanto.*tenho(?!.*(no|na|em|do|da))/.test(t)) {
        return asRespSaldoReal();
    }

    // 5. Maior gasto
    if (/maior gasto|onde gastei mais|maior despesa|gastei mais em|qual.*categoria/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        return asRespMaiorGasto(info.mes, info.ano);
    }

    // 6. Últimos N meses
    const m = t.match(/[úu]ltimos?\s+(\d+)\s+m[êe]s/);
    if (m) {
        const n = Math.min(12, Math.max(1, parseInt(m[1])));
        return asRespUltimosMeses(n);
    }

    // Faturamento (PJ).
    if (/\bfaturamento\b|\bfaturei\b|\bfaturou\b|quanto (eu )?faturei/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        return asRespValorBase('Salário', info.mes, info.ano);
    }

    // Valor base (líquido a receber / vale) — antes de "receb".
    if (/qual (ser[áa]|vai ser|é) (meu |o )?(sal[áa]rio|vale)|(quanto|qual).*(vou|vai) (receber|ganhar).*(sal[áa]rio|vale)|sal[áa]rio l[íi]quido|quanto (é|vale) (meu |o )?sal[áa]rio|l[íi]quido a receber|quanto.*(vou|vai) cair.*(sal[áa]rio|vale)/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        const bucket = /vale/.test(t) ? 'Vale' : 'Salário';
        asUltimoContexto = { tipo: 'valor-base', bucket, mes: info.mes, ano: info.ano };
        return asRespValorBase(bucket, info.mes, info.ano);
    }

    // Gastos extremos (maiores/menores lançamentos individuais).
    if (/(maior|menor|mais alt[oa]s?|mais baix[oa]s?).*(gasto|despesa|lan[çc]amento|paguei)|quais (os|as) (maior|menor|mais alt|mais baix)/.test(t)) {
        // Se menciona "categoria", deixa `asRespMaiorGasto` tratar
        // (a intenção é sobre o agregado, não o lançamento individual)
        if (!/categoria/.test(t)) {
            const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
            const extremo = /menor|mais baix/.test(t) ? 'menor' : 'maior';
            asUltimoContexto = { tipo: 'extremos-gasto', extremo, mes: info.mes, ano: info.ano };
            return asRespExtremosGasto(info.mes, info.ano, extremo);
        }
    }

    // Total gasto no mês (futuro / passado / neutro pelo verbo).
    if (/gast|despes|pag(uei|o|ar|amos|ou)/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        const futuro = /vou (gastar|pagar)|vai (gastar|pagar)|ainda (vou|vai|tenho que)|falt(a|am).*(pagar)|a (pagar)|pendent/.test(t);
        const passado = /gastei|paguei|j[áa] (gastei|paguei)|foi pago|efetivad[oa]/.test(t);
        const modo = futuro ? 'pendente' : (passado ? 'pago' : 'todos');
        asUltimoContexto = { tipo: 'despesa-mes', mes: info.mes, ano: info.ano, modo };
        return asRespTotalMes(info.mes, info.ano, 'despesa', modo);
    }

    // Total recebido no mês (futuro / passado / neutro pelo verbo).
    if (/receb|receit|ganh|entrou|entraram|caiu|ca[ií]ram/.test(t)) {
        const info = asExtrairMesAno(t) || { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
        const futuro = /vou (receber|ganhar)|vai (receber|ganhar)|ainda (vou|vai).*(receber|ganhar)|a receber/.test(t);
        const passado = /recebi|ganhei|j[áa] (recebi|ganhei)|caiu|entrou|entraram/.test(t);
        const modo = futuro ? 'pendente' : (passado ? 'pago' : 'todos');
        asUltimoContexto = { tipo: 'receita-mes', mes: info.mes, ano: info.ano, modo };
        return asRespTotalMes(info.mes, info.ano, 'receita', modo);
    }

    // Último recurso: botões de desambiguação se a pergunta for genérica.
    const amb = asDetectarAmbiguidade(t);
    if (amb) return amb;

    // Fallback
    return asRespNaoEntendi();
}

// ---------- AÇÕES DA UI ----------

window.asEnviarPergunta = function() {
    const inp = document.getElementById('inputAssistente');
    if (!inp) return;
    const texto = inp.value.trim();
    if (!texto) return;
    inp.value = '';
    asAdicionarMsgUsuario(texto);
    // Pequeno delay para dar sensação de "resposta" (não instantânea)
    setTimeout(() => {
        const html = asInterpretar(texto);
        asAdicionarMsgAssistente(html);
    }, 180);
};

window.asPerguntar = function(pergunta) {
    const inp = document.getElementById('inputAssistente');
    if (inp) inp.value = pergunta;
    window.asEnviarPergunta();
};

window.asLimparConversa = function() {
    const container = document.getElementById('chatAssistente');
    if (!container) return;
    container.innerHTML = '';
    asRenderBoasVindas();
};

// 🗑️ `asRenderChips` removida — as sugestões de pergunta agora
//    ficam dentro do cartão "Ajuda" (`asRespAjuda`), onde ganham
//    contexto e não consomem o espaço vertical da conversa.
//    Se um dia quiser voltar a ter chips rápidos, o motor está
//    preservado nos botões `.as-suggestion` do cartão de Ajuda.

// Re-renderiza boas-vindas só se a conversa está zerada.
window.asInicializarAba = function() {
    const container = document.getElementById('chatAssistente');
    if (!container) return;
    const temConversa = Array.from(container.children).some(c => !c.classList.contains('as-welcome'));
    if (!temConversa) {
        container.innerHTML = '';
        asRenderBoasVindas();
    }
};

window.asAtualizarMesAtualCard = function() {
    const el = document.getElementById('asSubGastosMes');
    if (!el) return;
    const mesAtualLower = nomeMeses[dataFiltro.getMonth()].toLowerCase();
    el.textContent = `"Quanto gastei em ${mesAtualLower}?"`;
};

// Se só há boas-vindas, regenera para refletir o novo nome do perfil.
window.asAtualizarSaudacaoPerfil = function() {
    const container = document.getElementById('chatAssistente');
    if (!container) return;
    const filhos = Array.from(container.children);
    const temConversa = filhos.some(c => !c.classList.contains('as-welcome'));
    if (!temConversa && filhos.length > 0) {
        container.innerHTML = '';
        asRenderBoasVindas();
    }
};

// FAB arrastável: tap abre Assistente; arraste move e encaixa na lateral.
(function() {
    const fab = document.getElementById('fabAssistente');
    if (!fab) return;

    const BTN_SIZE = 48;    // w-12 (48px) — precisa casar com o HTML
    const MARGEM = 12;      // respiro em relação às bordas
    // Limite que separa tap de arraste.
    const LIMITE_TOQUE = 2;
    // Easing com desaceleração tardia (sensação de "deslizar até parar").
    const TRANSICAO = 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)';

    let posX = 0, posY = 0;
    let dragging = false;
    let pointerId = null;
    let startX = 0, startY = 0;
    let startPosX = 0, startPosY = 0;
    let moveu = false;

    // ─── Clamp e aplicação ───
    function clampX(x) {
        return Math.max(MARGEM, Math.min(window.innerWidth - BTN_SIZE - MARGEM, x));
    }
    function clampY(y) {
        return Math.max(MARGEM, Math.min(window.innerHeight - BTN_SIZE - MARGEM, y));
    }
    function aplicarTransform() {
        fab.style.transform = `translate3d(${posX}px, ${posY}px, 0)`;
    }

    // ─── Posição inicial ───
    function posicaoInicial() {
        try {
            const salvo = JSON.parse(localStorage.getItem('fabAssistentePosV2') || 'null');
            if (salvo && typeof salvo.x === 'number' && typeof salvo.y === 'number') return salvo;
        } catch(_) {}
        return {
            x: window.innerWidth - BTN_SIZE - MARGEM,
            y: Math.max(MARGEM, Math.round(window.innerHeight * 0.6) - BTN_SIZE / 2)
        };
    }

    const ini = posicaoInicial();
    posX = clampX(ini.x);
    posY = clampY(ini.y);
    aplicarTransform();
    try { localStorage.setItem('fabAssistentePosV2', JSON.stringify({ x: posX, y: posY })); } catch(_) {}

    // ─── Início do gesto ───
    fab.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        dragging = true;
        moveu = false;
        pointerId = e.pointerId;

        try { fab.setPointerCapture(pointerId); } catch(_) {}

        startX = e.clientX;
        startY = e.clientY;
        startPosX = posX;
        startPosY = posY;

        // Sem transição durante o arraste — a posição segue o dedo 1:1.
        fab.style.transition = 'none';
    });

    // ─── Durante o gesto ───
    fab.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pointerId) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!moveu && Math.hypot(dx, dy) > LIMITE_TOQUE) moveu = true;
        if (!moveu) return;

        posX = clampX(startPosX + dx);
        posY = clampY(startPosY + dy);
        aplicarTransform();
    });

    // ─── Fim do gesto (pointerup / cancel / lostcapture) ───
    function finalizar(e) {
        if (!dragging) return;
        if (e && e.pointerId !== undefined && e.pointerId !== pointerId) return;

        dragging = false;
        try { if (pointerId !== null) fab.releasePointerCapture(pointerId); } catch(_) {}
        pointerId = null;

        // Sem movimento → é tap. Abre a aba Assistente.
        if (!moveu) {
            setTimeout(() => {
                if (typeof window.abrirTela === 'function') window.abrirTela('assistente');
            }, 0);
            return;
        }

        // Teve arraste → encaixa na lateral mais próxima (X),
        // preservando a altura onde o dedo soltou (Y).
        const centroX = posX + BTN_SIZE / 2;
        const meioTela = window.innerWidth / 2;
        posX = centroX < meioTela
            ? MARGEM
            : (window.innerWidth - BTN_SIZE - MARGEM);
        posY = clampY(posY);

        fab.style.transition = TRANSICAO;
        aplicarTransform();
        try { localStorage.setItem('fabAssistentePosV2', JSON.stringify({ x: posX, y: posY })); } catch(_) {}

        setTimeout(() => { fab.style.transition = ''; }, 460);
    }

    fab.addEventListener('pointerup', finalizar);
    fab.addEventListener('pointercancel', finalizar);
    fab.addEventListener('lostpointercapture', finalizar);

    // ─── Revalidação em resize / rotação ───
    window.addEventListener('resize', () => {
        posX = clampX(posX);
        posY = clampY(posY);
        aplicarTransform();
        try { localStorage.setItem('fabAssistentePosV2', JSON.stringify({ x: posX, y: posY })); } catch(_) {}
    });

    // ─── Bloqueio do click nativo ───
    // Toda a interação é tratada via pointer events. O `click`
    // nativo é engolido para não duplicar a ação.
    fab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
})();

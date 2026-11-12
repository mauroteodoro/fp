// Assistente: planejador de metas
'use strict';

// ═══════════════════════════════════════════════════════════════
// 🎯 PLANEJADOR DE META — "Quero juntar X até Y"
// ═══════════════════════════════════════════════════════════════
// Fluxo:
//   1. Extrai: valor alvo, valor atual, data alvo, piso mensal
//   2. Lê o saldo projetado de cada mês entre hoje e a data alvo
//   3. Calcula `capacidade = saldo - piso`. É o máximo poupável
//      sem sacrificar a reserva.
//   4. Compara capacidade total com o valor que falta juntar.
//   5. Renderiza: barra de progresso, plano uniforme, plano
//      proporcional (poupa mais nos meses com sobra) e sugestões
//      alternativas se a meta não fechar.

// 🎯 "quero juntar 6500", "guardar 6.500", "chegar em 6500", "meta de 6500"
function asExtrairMetaValor(texto) {
    // 🎯 Aceita uma família ampla de verbos/expressões. Os que
    // capturam "quero" sozinhos são os mais generosos — mas eles
    // só entram se houver um número à frente, o que impede
    // interpretar "quero saber" como um valor.
    const m = texto.match(
        /(?:juntar|guardar|poupar|economizar|chegar\s+em|atingir|alcan[çc]ar|ter|preciso\s+de|preciso\s+guardar|preciso\s+juntar|gostaria\s+de|quero|meta\s+(?:de|é)|objetivo\s+(?:de|é)|total\s+de)\s+(?:r\$\s*)?([\d.,]+)\s*(mil|k|reais|real)?/i
    );
    if (!m) return 0;
    let v = valorFloat(m[1]);
    if (m[2] === 'mil' || m[2] === 'k') v *= 1000;
    return v;
}

// 🎯 Valor já guardado: "já tenho 1200", "tenho 1200 reais no Cofrinho",
//    "começando com 1200", "atualmente 1200 guardado".
// Os padrões aceitam palavras intermediárias ("reais", "mil", "k")
// entre o número e a preposição — o que era o bug anterior.
function asExtrairMetaAtual(texto) {
    const patterns = [
        /j[áa]\s+tenho\s+(?:r\$\s*)?([\d.,]+)/i,
        // "tenho 1200 (reais|mil|k)? (no|na|em) (cofrinho|poupança|guardad...)"
        /tenho\s+(?:r\$\s*)?([\d.,]+)(?:\s+(?:reais|mil|k))?\s+(?:no|na|em|guardad)/i,
        // "tenho (no|na) (cofrinho|poupança)" — sem número, extrai 0 aqui
        // e o parser complementa com o saldo real da conta.
        /come[çc]ando\s+com\s+(?:r\$\s*)?([\d.,]+)/i,
        /atualmente\s+(?:r\$\s*)?([\d.,]+)\s+guardad/i,
        /j[áa]\s+(?:guardei|separei|poupei)\s+(?:r\$\s*)?([\d.,]+)/i
    ];
    for (const p of patterns) {
        const m = texto.match(p);
        if (m) return valorFloat(m[1]);
    }
    return 0;
}

// 🎯 "Entrada": usa parte do saldo de uma conta como ponto de partida.
//    Formas aceitas:
//      "usar 200 do Cofrinho"          → valor 200, conta "Cofrinho"
//      "vou usar 200 reais do saldo"   → valor 200, conta "saldo"
//      "200 como entrada"              → valor 200, sem conta
//      "usar 500 do meu Itaú"          → valor 500, conta "Itaú"
//    O parser depois tenta casar o `contaNome` com `contasGlobais`.
function asExtrairEntrada(texto) {
    const patterns = [
        /(?:usar|utilizar|pegar|tirar|vou usar|posso usar|usando)\s+(?:r\$\s*)?([\d.,]+)(?:\s+(?:reais|mil|k))?\s+d[oa]\s+([a-zà-ú][a-zà-ú\s]{1,20})/i,
        /(?:r\$\s*)?([\d.,]+)(?:\s+(?:reais|mil|k))?\s+como\s+entrada/i
    ];
    for (const p of patterns) {
        const m = texto.match(p);
        if (m) return { valor: valorFloat(m[1]), contaNome: (m[2] || '').trim() };
    }
    return null;
}

// 🎯 Detecta o NOME de uma conta citada mas sem número — ex:
//    "tenho no Cofrinho", "meu saldo do Itaú", "considera o Nubank".
//    Retorna a conta encontrada para o parser ler o saldo real via
//    `obterSaldoContaReal`. Sem match → null.
function asDetectarContaSemValor(texto) {
    const t = texto.toLowerCase();
    let melhor = null, tam = 0;
    contasGlobais.forEach(c => {
        const n = c.nome.toLowerCase();
        if (t.includes(n) && n.length > tam) { melhor = c; tam = n.length; }
    });
    return melhor;
}

// 🎯 Piso mensal: "sobrando 400", "manter ao menos 400",
//    "guardando 400", "não gastar mais de 400", "reserva de 400".
//
// 🐛 Correção: os padrões antigos incluíam
//    `/preciso\s+(?:ter|manter|guardar|sobrar)\s+([\d.,]+)/`
//    que casava com a META em frases como "preciso guardar 6500
//    até março". O `for` retornava o primeiro match, e 6500 era
//    interpretado como reserva mensal — gerando "mantendo ao
//    menos R$ 6.500,00/mês de sobra".
//
//    Correção: exigir sinal EXPLÍCITO de reserva no texto.
//    "Guardar X" e "ter X" sozinhos são ambíguos com meta.
//
// Exemplos que continuam funcionando:
//   • "manter ao menos 400"      → 400
//   • "mantendo 400 por mês"     → 400
//   • "guardando 400"            → 400
//   • "sobrando 400"             → 400
//   • "reserva de 400"           → 400
//   • "não gastar mais de 400"   → 400
//
// Exemplos que agora retornam 0 (correto):
//   • "preciso guardar 6500"     → 0 (é a meta)
//   • "quero ter 10000"          → 0 (é a meta)
function asExtrairPisoMensal(texto) {
    const patterns = [
        /sobrando\s+(?:ao\s+menos\s+)?(?:r\$\s*)?([\d.,]+)/i,
        /mant(?:er|endo)\s+(?:ao\s+menos\s+)?(?:r\$\s*)?([\d.,]+)/i,
        /guardando\s+(?:ao\s+menos\s+)?(?:r\$\s*)?([\d.,]+)/i,
        /(?:sem|n[ãa]o)\s+(?:gastar|usar|passar)\s+(?:mais\s+de|acima\s+de)\s+(?:r\$\s*)?([\d.,]+)/i,
        /reserva\s+(?:de|m[íi]nima\s+de)\s+(?:r\$\s*)?([\d.,]+)/i
    ];
    for (const p of patterns) {
        const m = texto.match(p);
        if (m) return valorFloat(m[1]);
    }
    return 0;
}

// 🎯 Extrai um mês/ano alvo. Delega para `asExtrairMesAno` (que já
//    lida com "março de 2027", "03/2027", "dez"). Se o texto NÃO
//    mencionar mês, retorna null — para o parser usar o mês atual.
function asExtrairMesAlvo(texto) {
    const info = asExtrairMesAno(texto);

    if (info) {
        // ═══════════════════════════════════════════════════════════
        // 🎯 ROLLOVER DE ANO — meta sempre olha para frente
        // ═══════════════════════════════════════════════════════════
        // Quando o usuário NÃO menciona o ano ("até março") e o mês
        // resultante já passou, entendemos que ele quer o PRÓXIMO
        // março — não o que já passou.
        //
        // Exemplo: hoje é Set/2026, o usuário diz "quero juntar até
        // março". Sem rollover, a meta ficaria com prazo março/2026
        // (passado) — matematicamente correto, semanticamente absurdo
        // para uma meta. Com o rollover, vira março/2027.
        //
        // Regras:
        //   • Ano EXPLÍCITO ("março de 2027") → respeitado, sem
        //     rollover. O usuário sabe o que pediu.
        //   • Mês alvo == mês atual ("até março" estando em março)
        //     → mantém. Provavelmente quer "até o fim deste mês".
        //   • Mês alvo < mês atual → +1 ano.
        //   • Mês alvo > mês atual → mantém (já está no futuro).
        //
        // Por que essa regra NÃO entra em `asExtrairMesAno`:
        // esse helper é usado também por consultas HISTÓRICAS
        // ("quanto gastei em março"), que devem continuar olhando
        // para trás. O rollover é exclusivo de metas, que são
        // inerentemente sobre o futuro.
        const anoMencionado = /\b(20\d{2})\b/.test(texto);
        if (!anoMencionado && info.mes < dataFiltro.getMonth()) {
            info.ano = dataFiltro.getFullYear() + 1;
        }
        return info;
    }

    if (/ano\s+que\s+vem|pr[óo]ximo\s+ano/i.test(texto)) {
        return { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() + 1 };
    }
    if (/final\s+do\s+ano|fim\s+do\s+ano|dezembro/i.test(texto)) {
        return { mes: 11, ano: dataFiltro.getFullYear() };
    }
    return null;
}

function asPlanejarMeta(valorMeta, valorAtual, mesAlvo, anoAlvo, pisoMensal) {
    const falta = Math.max(0, valorMeta - valorAtual);
    const mesBase = dataFiltro.getMonth();
    const anoBase = dataFiltro.getFullYear();

    const distancia = (anoAlvo - anoBase) * 12 + (mesAlvo - mesBase);
    const totalMeses = Math.max(1, distancia + 1);

    // Coleta a "capacidade" (saldo - piso) de cada mês do período
    const meses = [];
    let capacidadeTotal = 0;
    let temEstimativa = false;

    for (let i = 0; i < totalMeses; i++) {
        const dt = new Date(anoBase, mesBase + i, 1);
        const chave = window.chaveMes(dt);
        const saldo = asCalcularSaldoBucket(dt.getMonth(), dt.getFullYear(), 'Total').total;
        const temSim = !!(configHoleriteGlobal[chave] || saldoBaseMensalGlobal[chave]);
        if (!temSim) temEstimativa = true;
        const capacidade = Math.max(0, saldo - pisoMensal);
        meses.push({ mes: dt.getMonth(), ano: dt.getFullYear(), saldo, capacidade, temSimulacao: temSim });
        capacidadeTotal += capacidade;
    }

    // Plano uniforme: mesma quantia em todos os meses
    const valorUniforme = totalMeses > 0 ? falta / totalMeses : 0;
    const uniformeViavel = meses.every(m => m.capacidade >= valorUniforme - 0.01);

    let planoProporcional = null;
    if (falta > 0 && capacidadeTotal >= falta - 0.01) {
        const alocacao = new Array(meses.length).fill(0);
        let restante = falta;
        let ativos = meses.map((_, i) => i).filter(i => meses[i].capacidade > 0);

        let seguranca = 30; // limite de iterações para evitar loop infinito
        while (restante > 0.01 && ativos.length > 0 && seguranca-- > 0) {
            const capRestanteTotal = ativos.reduce((s, i) => s + (meses[i].capacidade - alocacao[i]), 0);
            if (capRestanteTotal <= 0.01) break;
            const restantesAntes = restante;
            for (const i of ativos) {
                const capRestante = meses[i].capacidade - alocacao[i];
                if (capRestante <= 0) continue;
                const parte = (capRestante / capRestanteTotal) * restantesAntes;
                alocacao[i] += Math.min(parte, capRestante);
            }
            restante = falta - alocacao.reduce((s, v) => s + v, 0);
            ativos = ativos.filter(i => meses[i].capacidade - alocacao[i] > 0.01);
        }
        planoProporcional = meses.map((m, i) => ({ ...m, alocacao: alocacao[i], sobra: m.saldo - alocacao[i] }));
    }

    return { falta, valorMeta, valorAtual, pisoMensal, totalMeses, meses, capacidadeTotal, valorUniforme, uniformeViavel, planoProporcional, temEstimativa, mesAlvo, anoAlvo };
}

function asRespPlanejarMeta(valorMeta, valorAtual, mesAlvo, anoAlvo, pisoMensal) {
    const p = asPlanejarMeta(valorMeta, valorAtual, mesAlvo, anoAlvo, pisoMensal);
    const pct = valorMeta > 0 ? Math.min(100, (valorAtual / valorMeta) * 100) : 0;

    let html = `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">🎯 Meta · ${nomeMeses[mesAlvo]}/${anoAlvo}</p>
        <div class="flex justify-between items-baseline mb-1">
            <p class="text-2xl font-bold text-[#4D6BFE] font-montserrat tracking-tight">${formatMoeda(valorMeta)}</p>
            <span class="text-[11px] font-semibold text-slate-500 dark:text-gray-400">${pct.toFixed(0)}%</span>
        </div>
        <div class="w-full h-2 bg-slate-200 dark:bg-[#1a2639] rounded-full overflow-hidden mb-3">
            <div class="h-full bg-gradient-to-r from-[#4D6BFE] to-[#6B85FF] rounded-full" style="width: ${pct}%"></div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="bg-slate-50 dark:bg-[#0b1120] p-2.5 rounded-lg border border-slate-200 dark:border-[#1e2a40]">
                <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-0.5">Já tenho</p>
                <p class="font-bold text-green-600 dark:text-green-500 text-[13px]">${formatMoeda(valorAtual)}</p>
            </div>
            <div class="bg-slate-50 dark:bg-[#0b1120] p-2.5 rounded-lg border border-slate-200 dark:border-[#1e2a40]">
                <p class="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-0.5">Falta juntar</p>
                <p class="font-bold text-red-600 dark:text-red-400 text-[13px]">${formatMoeda(p.falta)}</p>
            </div>
        </div>
        <p class="text-[12px] text-slate-600 dark:text-gray-300 mb-3">
            Você tem <strong>${p.totalMeses} meses</strong> para juntar ${formatMoeda(p.falta)}${pisoMensal > 0 ? `, mantendo ao menos <strong>${formatMoeda(pisoMensal)}</strong>/mês de sobra` : ''}.
        </p>
    `;

    // Plano uniforme
    if (p.falta > 0) {
        html += `
            <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-900/40 mb-2">
                <p class="font-bold text-blue-700 dark:text-blue-400 text-[13px] mb-1">📊 Plano uniforme</p>
                <p class="text-[12px] text-slate-600 dark:text-gray-300">
                    Guarde <strong>${formatMoeda(p.valorUniforme)}</strong>/mês por ${p.totalMeses} meses.
                </p>
                ${!p.uniformeViavel ? '<p class="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 leading-snug">⚠️ Nem todo mês comporta esse valor com sua reserva. Veja o plano proporcional abaixo.</p>' : '<p class="text-[11px] text-green-600 dark:text-green-400 mt-1.5">✓ Cabe em todos os meses com folga.</p>'}
            </div>
        `;
    }

    // Análise de viabilidade + plano proporcional
    if (p.falta > 0 && p.capacidadeTotal < p.falta - 0.01) {
        const diferenca = p.falta - p.capacidadeTotal;
        const sugestaoPiso = Math.max(0, pisoMensal - diferenca / p.totalMeses);

        const capacidadeMedia = p.capacidadeTotal / p.totalMeses;

        const MESES_EXTRAS_MAX = 3;
        const mesesExtrasBruto = capacidadeMedia > 10
            ? Math.ceil(diferenca / capacidadeMedia)
            : null;
        const mesesExtras = (mesesExtrasBruto !== null && mesesExtrasBruto <= MESES_EXTRAS_MAX)
            ? mesesExtrasBruto
            : null;
        const precisaMuitoMaisTempo = (mesesExtrasBruto !== null && mesesExtrasBruto > MESES_EXTRAS_MAX);

        // Frase sobre a meta — mais clara que "capacidade total X"
        const mensagemCapacidade = p.capacidadeTotal > 0.01
            ? `Nos ${p.totalMeses} meses até o prazo, você conseguiria juntar <strong>${formatMoeda(p.capacidadeTotal)}</strong> — faltam <strong>${formatMoeda(diferenca)}</strong> para a meta.`
            : `Seu orçamento está comprometido nos próximos ${p.totalMeses} meses — sem folga para poupar.`;

        const mesesComCap = p.meses.filter(m => m.capacidade > 0.01);
        const mesesBreakdown = mesesComCap.map(m => {
            const chave = `${String(m.mes+1).padStart(2,'0')}/${m.ano}`;
            const cfgM = configHoleriteGlobal[chave];
            let marcador = '';
            if (m.mes === 10 || m.mes === 11) {
                const v13 = cfgM ? parseFloat(cfgM.valor13) || 0 : 0;
                if (v13 > 0.005) marcador = ' <span class="text-amber-600 dark:text-amber-400">· inclui 13º</span>';
            }
            return `<div class="flex justify-between gap-2 text-[11.5px]">
                <span class="text-slate-500 dark:text-gray-400">${nomeMeses[m.mes].substring(0,3)}/${String(m.ano).substring(2)}${marcador}</span>
                <span class="font-bold text-[#4D6BFE] whitespace-nowrap">${formatMoeda(m.capacidade)}</span>
            </div>`;
        }).join('');

        // Linha de rodapé: quantos meses não contribuem e por quê
        const mesesSemCap = p.totalMeses - mesesComCap.length;
        const mesesNegativos = p.meses.filter(m => m.saldo < -0.005).length;
        let linhaRodape = '';
        if (mesesSemCap > 0) {
            const detalhe = mesesNegativos > 0
                ? ` (${mesesNegativos} com saldo negativo)`
                : '';
            linhaRodape = `<p class="text-[10.5px] text-slate-400 dark:text-gray-500 mt-1.5 leading-snug">${mesesSemCap} ${mesesSemCap === 1 ? 'mês' : 'meses'} sem aporte${detalhe}.</p>`;
        }

        html += `
            <div class="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/40 mb-2">
                <p class="font-bold text-red-700 dark:text-red-400 text-[13px] mb-1">❌ Meta não fecha no prazo</p>
                <p class="text-[12px] text-slate-600 dark:text-gray-300 mb-2">${mensagemCapacidade}</p>
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Caminhos possíveis</p>
                <ul class="text-[11.5px] text-slate-600 dark:text-gray-300 space-y-1">
                    ${pisoMensal > 0 ? `<li>🔽 Reduzir a reserva de ${formatMoeda(pisoMensal)} para <strong>${formatMoeda(sugestaoPiso)}</strong></li>` : ''}
                    ${mesesExtras ? `<li>📅 Estender o prazo em <strong>${mesesExtras} ${mesesExtras === 1 ? 'mês' : 'meses'}</strong> (até ${nomeMeses[(mesAlvo + mesesExtras) % 12]}/${anoAlvo + Math.floor((mesAlvo + mesesExtras) / 12)})</li>` : ''}
                    ${precisaMuitoMaisTempo ? `<li class="text-slate-500 dark:text-gray-400 italic">📅 O prazo não é o gargalo — mesmo 3 meses extras não fechariam a conta.</li>` : ''}
                    <li>🎯 Reduzir a meta em <strong>${formatMoeda(diferenca)}</strong></li>
                </ul>
            </div>
            ${mesesBreakdown ? `
                <div class="p-3 bg-slate-50 dark:bg-[#0b1120] rounded-xl border border-slate-200 dark:border-[#1e2a40] mb-2">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">📊 Quanto cada mês pode aportar</p>
                    <div class="space-y-1">${mesesBreakdown}</div>
                    ${linhaRodape}
                </div>
            ` : ''}
        `;
    } else if (p.planoProporcional) {
        const ativos = p.planoProporcional.filter(m => m.alocacao > 0.01);
        const amostra = ativos.slice(0, 12);

        let mesTopo = null, mesBase = null;
        for (const m of ativos) {
            if (!mesTopo || m.alocacao > mesTopo.alocacao) mesTopo = m;
            if (!mesBase || m.alocacao < mesBase.alocacao) mesBase = m;
        }

        html += `
            <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-900/40 mb-2">
                <p class="font-bold text-green-700 dark:text-green-400 text-[13px] mb-1.5">✅ Plano proporcional sugerido</p>
                <p class="text-[11px] text-slate-600 dark:text-gray-300 mb-2 leading-snug">
                    Poupa mais nos meses com maior sobra, menos nos meses apertados. Somando tudo, dá exatamente <strong>${formatMoeda(p.falta)}</strong>.
                </p>
                ${mesTopo && mesBase && ativos.length > 1 ? `
                    <div class="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-slate-500 dark:text-gray-400 mb-2">
                        <span>📈 Mais em <strong>${nomeMeses[mesTopo.mes].substring(0,3)}/${String(mesTopo.ano).substring(2)}</strong>: ${formatMoeda(mesTopo.alocacao)}</span>
                        <span>📉 Menos em <strong>${nomeMeses[mesBase.mes].substring(0,3)}/${String(mesBase.ano).substring(2)}</strong>: ${formatMoeda(mesBase.alocacao)}</span>
                    </div>
                ` : ''}
                <div class="space-y-1">
                    ${amostra.map(m => `
                        <div class="flex flex-wrap justify-between gap-x-2 gap-y-0.5 text-[11.5px] items-baseline">
                            <span class="text-slate-500 dark:text-gray-400 min-w-[72px] shrink-0">${nomeMeses[m.mes].substring(0,3)}/${String(m.ano).substring(2)}</span>
                            <span class="font-bold text-[#4D6BFE] flex-1 text-right shrink-0 whitespace-nowrap">${formatMoeda(m.alocacao)}</span>
                            <span class="text-[10px] text-slate-400 dark:text-gray-500 w-full sm:w-auto sm:min-w-[80px] text-right shrink-0 whitespace-nowrap">sobra ${formatMoeda(m.sobra)}</span>
                        </div>
                    `).join('')}
                    ${ativos.length > amostra.length ? `<p class="text-[10px] text-slate-400 italic mt-1">+ ${ativos.length - amostra.length} mês${ativos.length - amostra.length === 1 ? '' : 'es'} até a meta</p>` : ''}
                </div>
            </div>
        `;
    }

    if (p.temEstimativa) {
        html += `<p class="text-[10px] text-amber-600 dark:text-amber-400 mt-2 leading-snug">⚠️ Meses sem simulação salva usam o perfil como estimativa. Salve cada mês no Simulador para valores exatos.</p>`;
    }

    const mesMais3 = (mesAlvo + 3) % 12;
    const anoMais3 = anoAlvo + Math.floor((mesAlvo + 3) / 12);
    const nomeMais3 = nomeMeses[mesMais3];

    html += asSugestoes([
        { txt: `E até ${nomeMais3} de ${anoMais3}?`, q: `E até ${nomeMais3.toLowerCase()} de ${anoMais3}?` },
        { txt: 'E mantendo R$ 300/mês?', q: 'E mantendo 300 reais por mês?' },
        { txt: 'Ver saldo projetado', q: 'Qual meu saldo projetado?' }
    ]);

    // Contexto para follow-ups
    asUltimoContexto = { tipo: 'planejar-meta', valorMeta, valorAtual, mesAlvo, anoAlvo, pisoMensal };

    return html;
}

function asCalcularContasAtrasadas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hojeNum = hoje.getTime();
    const itens = [];
    let totalGeral = 0;

    bancoDeDados.forEach(d => {
        if (d.isAjuste || d.isTransferencia || d.ocultoExtrato) return;
        const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
        if (isR) return;

        const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        if (!dataRef || dataRef.length !== 10) return;

        let pago;
        if (d.isRecorrente) {
            const p = dataRef.split('/');
            const anoMesStr = `${p[2]}${p[1]}`;
            const status = d.pagamentos && d.pagamentos[anoMesStr];
            pago = !!status;
        } else {
            pago = !!d.pago;
        }
        if (pago) return;

        const partes = dataRef.split('/');
        const anoMesNum = parseInt(partes[2]) * 100 + parseInt(partes[1]);
        if (d.mesesOcultos && d.mesesOcultos.includes(anoMesNum)) return;
        if (d.encerradoEm && anoMesNum >= d.encerradoEm) return;

        const dtVenc = new Date(partes[2], partes[1] - 1, partes[0]);
        dtVenc.setHours(0, 0, 0, 0);
        if (dtVenc.getTime() >= hojeNum) return;

        const diasAtraso = Math.round((hojeNum - dtVenc.getTime()) / 86400000);
        const valor = valorFloat(d.valor);
        totalGeral += valor;

        itens.push({
            id: d.id,
            descricao: d.descricaoOriginal || d.descricao || '—',
            valor,
            vencimento: dataRef,
            diasAtraso,
            categoria: d.categoria || '—',
            subcategoria: d.subcategoria || '',
            isRecorrente: !!d.isRecorrente
        });
    });

    // Mais críticos primeiro: quem está atrasado há mais tempo
    itens.sort((a, b) => b.diasAtraso - a.diasAtraso);
    return { itens, total: totalGeral };
}

function asRespContasAtrasadas() {
    const r = asCalcularContasAtrasadas();

    if (r.itens.length === 0) {
        return `
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">🚨 Contas atrasadas</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-500 font-montserrat tracking-tight mb-2">Tudo em dia! 🎉</p>
            <p class="text-slate-600 dark:text-gray-300 text-[13px]">Nenhuma despesa pendente com vencimento passado. Continue assim.</p>
            ${asSugestoes([
                { txt: 'O que vence este mês', q: 'Quanto vou gastar este mês?' },
                { txt: 'Ver saldos', q: 'Qual meu saldo projetado?' }
            ])}
        `;
    }

    const amostra = r.itens.slice(0, 6);
    const restante = r.itens.length - amostra.length;

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">🚨 Contas atrasadas</p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400 font-montserrat tracking-tight mb-2">${formatMoeda(r.total)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-3">${r.itens.length} despesa${r.itens.length === 1 ? '' : 's'} com vencimento passado e ainda pendente${r.itens.length === 1 ? '' : 's'}.</p>
        <div class="space-y-2 pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            ${amostra.map(it => `
                <div class="flex justify-between items-start gap-3">
                    <div class="min-w-0 flex-1">
                        <div class="text-[13px] font-semibold text-slate-800 dark:text-gray-100 truncate">${it.descricao}</div>
                        <div class="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">
                            ${it.categoria}${it.subcategoria ? ' › ' + it.subcategoria : ''} · venceu em ${it.vencimento}
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="font-bold text-red-600 dark:text-red-400 whitespace-nowrap">${formatMoeda(it.valor)}</div>
                        <div class="text-[10px] font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">${it.diasAtraso} dia${it.diasAtraso === 1 ? '' : 's'}</div>
                    </div>
                </div>
            `).join('')}
            ${restante > 0 ? `<p class="text-[10px] text-slate-400 italic mt-1">+ ${restante} outra${restante === 1 ? '' : 's'} em atraso</p>` : ''}
        </div>
        <p class="text-[10px] text-slate-400 dark:text-gray-500 mt-3 leading-snug">Toque em <strong>Extrato</strong> e use o filtro <strong>Pendentes</strong> para resolver item por item.</p>
        ${asSugestoes([
            { txt: 'O que vence este mês', q: 'Quanto vou gastar este mês?' },
            { txt: 'Ver saldos', q: 'Qual meu saldo projetado?' }
        ])}
    `;
}

// modo: 'todos' (inclui pendentes) | 'pago' (só efetivadas).
function asCalcularStatusOrcamentos(modo) {
    modo = modo || 'todos';
    const catsComOrc = Object.keys(orcamentosGlobais).filter(k => orcamentosGlobais[k] > 0.005);
    if (catsComOrc.length === 0) {
        return { vazio: true, itens: [], totalGasto: 0, totalTeto: 0, pctTotal: 0 };
    }
    const mes = dataFiltro.getMonth();
    const ano = dataFiltro.getFullYear();
    const totais = asCalcularTotaisMes(mes, ano, modo);

    let totalGasto = 0, totalTeto = 0;
    const itens = catsComOrc.map(cat => {
        const gasto = totais.categorias[cat] || 0;
        const teto = orcamentosGlobais[cat];
        totalGasto += gasto;
        totalTeto += teto;
        return {
            cat, gasto, teto,
            pct: (gasto / teto) * 100,
            excedeu: gasto >= teto - 0.005,
            atencao: (gasto / teto) * 100 >= 70 && (gasto / teto) * 100 < 100,
            restante: teto - gasto
        };
    });
    itens.sort((a, b) => b.pct - a.pct);
    return { vazio: false, itens, totalGasto, totalTeto, pctTotal: (totalGasto / totalTeto) * 100 };
}

function asRespOrcamentos(modo) {
    const r = asCalcularStatusOrcamentos(modo);
    const nome = nomeMeses[dataFiltro.getMonth()];
    const ano = dataFiltro.getFullYear();
    const labelModo = modo === 'pago' ? ' · só efetivados' : ' · inclui pendentes';

    if (r.vazio) {
        return `
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">💰 Orçamento</p>
            <p class="text-[13px] text-slate-600 dark:text-gray-300 mb-2">Você ainda não definiu nenhum teto por categoria.</p>
            <p class="text-[11px] text-slate-500 dark:text-gray-400 leading-snug">Abra <strong>Gráficos → Orçamentos</strong> para configurar. Leva 30 segundos.</p>
            ${asSugestoes([{ txt: 'Gastos do mês', q: 'Quanto gastei este mês?' }])}
        `;
    }

    const pctTotal = r.pctTotal;
    let corTotal, corBarraTotal;
    if (pctTotal >= 100) { corTotal = 'text-red-600 dark:text-red-400'; corBarraTotal = 'bg-red-500'; }
    else if (pctTotal >= 85) { corTotal = 'text-amber-600 dark:text-amber-400'; corBarraTotal = 'bg-amber-500'; }
    else { corTotal = 'text-green-600 dark:text-green-500'; corBarraTotal = 'bg-green-500'; }

    // Contadores — mostram a saúde geral do orçamento
    const estouradas = r.itens.filter(i => i.excedeu).length;
    const atencao = r.itens.filter(i => !i.excedeu && i.atencao).length;

    // Resumo de saúde no topo
    let resumo = '';
    if (estouradas > 0) {
        resumo = `<p class="text-[11.5px] font-semibold text-red-600 dark:text-red-400 mb-2 leading-snug">🚨 ${estouradas} categoria${estouradas === 1 ? '' : 's'} estourada${estouradas === 1 ? '' : 's'}${atencao > 0 ? ` · ${atencao} em atenção` : ''}</p>`;
    } else if (atencao > 0) {
        resumo = `<p class="text-[11.5px] font-semibold text-amber-600 dark:text-amber-400 mb-2 leading-snug">⚠️ ${atencao} categoria${atencao === 1 ? '' : 's'} chegando no limite</p>`;
    } else {
        resumo = `<p class="text-[11.5px] font-semibold text-green-600 dark:text-green-500 mb-2 leading-snug">✅ Tudo dentro do planejado</p>`;
    }

    const pctCap = Math.min(100, pctTotal);
    const amostra = r.itens.slice(0, 6);
    const restante = r.itens.length - amostra.length;

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">💰 Orçamento · ${nome}/${ano}${labelModo}</p>
        <p class="text-2xl font-bold ${corTotal} font-montserrat tracking-tight mb-1">${formatMoeda(r.totalGasto)}</p>
        <p class="text-[12px] text-slate-500 dark:text-gray-400 mb-2">de ${formatMoeda(r.totalTeto)} em tetos definidos</p>
        <div class="w-full h-2 bg-slate-200 dark:bg-[#1a2639] rounded-full overflow-hidden mb-3">
            <div class="h-full ${corBarraTotal} rounded-full transition-all duration-500" style="width: ${pctCap}%"></div>
        </div>
        ${resumo}
        <div class="space-y-2.5 pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            ${amostra.map(it => {
                let icone, cor, corBarra, label;
                if (it.excedeu) {
                    icone = '🚨'; cor = 'text-red-600 dark:text-red-400'; corBarra = 'bg-red-500';
                    label = `+${formatMoeda(Math.abs(it.restante))} acima`;
                } else if (it.atencao) {
                    icone = '⚠️'; cor = 'text-amber-600 dark:text-amber-400'; corBarra = 'bg-amber-500';
                    label = `faltam ${formatMoeda(it.restante)}`;
                } else {
                    icone = '✅'; cor = 'text-slate-500 dark:text-gray-400'; corBarra = 'bg-green-500';
                    label = `faltam ${formatMoeda(it.restante)}`;
                }
                const pctCapIt = Math.min(100, it.pct);
                return `
                    <div>
                        <div class="flex items-baseline justify-between gap-2 mb-1">
                            <span class="text-[12.5px] font-semibold text-slate-700 dark:text-gray-200 truncate flex-1">${icone} ${it.cat}</span>
                            <span class="text-[11px] font-bold ${cor} tabular-nums whitespace-nowrap">${it.pct.toFixed(0)}%</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <div class="flex-1 h-1.5 bg-slate-200 dark:bg-[#1a2639] rounded-full overflow-hidden">
                                <div class="h-full ${corBarra} rounded-full" style="width: ${pctCapIt}%"></div>
                            </div>
                            <span class="text-[10px] ${cor} font-semibold whitespace-nowrap tabular-nums">${label}</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        ${restante > 0 ? `<p class="text-[10px] text-slate-400 dark:text-gray-500 italic mt-3">+ ${restante} categoria${restante === 1 ? '' : 's'} com orçamento definido</p>` : ''}
        ${asSugestoes([
            { txt: 'Só os já pagos', q: 'Como está meu orçamento, só o que já paguei?' },
            { txt: 'Gastos do mês',  q: 'Quanto gastei este mês?' }
        ])}
    `;
}

// 🎯 Fallback INTERATIVO — em vez de só listar texto, oferece
//    botões clicáveis. Quem não entendeu tem um próximo passo
//    óbvio: tocar. Isso reduz o atrito de "voltar" a perguntar.
//
//    Cada botão usa o mesmo padrão dos chips de sugestão rápida
//    (`data-q` + `asPerguntar`), então o texto passa intacto e o
//    clique dispara a mesma pergunta pré-definida.
// 🎯 Helper: rodapé de sugestões relacionadas em qualquer resposta.
function asSugestoes(lista) {
    if (!lista || !lista.length) return '';
    return `
        <div class="mt-3 pt-3 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">Perguntas relacionadas</p>
            <div class="flex flex-wrap gap-1.5">
                ${lista.map(s => `<button type="button" data-q="${s.q}" onclick="asPerguntar(this.dataset.q)" class="px-2.5 py-1 text-[11px] font-medium rounded-full bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#2a3850] text-slate-600 dark:text-gray-300 hover:border-[#4D6BFE] hover:text-[#4D6BFE] dark:hover:text-cyan-400 transition-colors active:scale-95 whitespace-nowrap">${s.txt}</button>`).join('')}
            </div>
        </div>
    `;
}

function asRespFerias(mes, ano, foco) {
    foco = foco || 'datas';
    const nome = nomeMeses[mes];
    const chaveAlvo = `${String(mes+1).padStart(2,'0')}/${ano}`;

    // Se o mês pedido não tem férias, busca qualquer mês do mesmo ano com férias.
    let chaveFinal = chaveAlvo;
    let mesFinal = mes;
    let anoFinal = ano;
    let cfg = configHoleriteGlobal[chaveAlvo];

    if (!cfg || !cfg.temFerias) {
        for (let m = 0; m < 12; m++) {
            const k = `${String(m+1).padStart(2,'0')}/${ano}`;
            if (configHoleriteGlobal[k]?.temFerias) {
                chaveFinal = k;
                mesFinal = m;
                anoFinal = ano;
                cfg = configHoleriteGlobal[k];
                break;
            }
        }
    }

    if (!cfg || !cfg.temFerias) {
        return `
            <p class="text-slate-600 dark:text-gray-300 text-[13px]">Não há férias cadastradas em <strong>${ano}</strong>.</p>
            <p class="text-[12px] text-slate-500 dark:text-gray-400 mt-2">Para registrar, abra <strong>Simulador → Variáveis do Mês → Férias no Período?</strong>.</p>
        `;
    }

    const nomeAlvo = nomeMeses[mesFinal];
    const diaIni = parseInt(cfg.diaInicioFerias) || 1;
    const dias = parseInt(cfg.diasFerias) || 30;
    const dtInicio = new Date(anoFinal, mesFinal, diaIni);
    const dtFim = new Date(anoFinal, mesFinal, diaIni + dias - 1);
    const dtVolta = new Date(anoFinal, mesFinal, diaIni + dias);
    const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;

    const bruto = parseFloat(cfg.bruto) || parseFloat(meuPerfil.salario) || 0;
    const salarioDiario = bruto / 30;
    const vF = salarioDiario * dias;
    const vTF = vF / 3;
    const baseTrib = vF + vTF;
    const inss = calcularINSS(baseTrib);
    const irrf = calcularIRRF(baseTrib, meuPerfil.dependentes);
    const liquido = vF + vTF - inss - irrf;

    // Aviso sutil quando a resposta é de OUTRO mês do ano
    const ehOutroMes = (mesFinal !== mes || anoFinal !== ano);
    const aviso = ehOutroMes
        ? `<p class="text-[11px] text-slate-400 dark:text-gray-500 mb-2 leading-snug">Férias de <strong class="text-slate-600 dark:text-gray-300">${nomeAlvo}/${anoFinal}</strong> — você está visualizando <strong>${nome}/${ano}</strong>.</p>`
        : '';

    const todasSugestoes = {
        datas:   { txt: 'Quando tiro férias?',       q: 'Quando tiro férias?' },
        dias:    { txt: 'Quantos dias de férias?',   q: 'Quantos dias de férias?' },
        valores: { txt: 'Quanto vou receber?',       q: 'Quanto vou receber de férias?' }
    };
    const sugestoes = asSugestoes(
        Object.keys(todasSugestoes)
            .filter(k => k !== foco)
            .map(k => todasSugestoes[k])
    );

    if (foco === 'dias') {
        // ─── Dias em destaque ─────────────────────────────────
        // Resposta curta e direta para "Quantos dias de férias?".
        // Datas resumidas em rodapé; valores omitidos (não foi pedido).
        return `
            ${aviso}
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Férias · ${nomeAlvo}/${anoFinal}</p>
            <p class="text-3xl font-bold text-[#4D6BFE] dark:text-cyan-400 font-montserrat tracking-tight mb-1">${dias} dias corridos</p>
            <p class="text-slate-600 dark:text-gray-300 text-[13px]">De <strong>${fmt(dtInicio)}</strong> a <strong>${fmt(dtFim)}</strong>.</p>
            <p class="text-[11px] text-slate-400 dark:text-gray-500 mt-2 leading-snug">Para ver o valor a receber, pergunte <em>"Quanto vou receber de férias?"</em>.</p>
            ${sugestoes}
        `;
    }

    if (foco === 'valores') {
        // ─── Valores em destaque ──────────────────────────────
        // Foco no breakdown financeiro. Datas resumidas em uma linha.
        return `
            ${aviso}
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Férias · ${nomeAlvo}/${anoFinal}</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-500 font-montserrat tracking-tight mb-1">${formatMoeda(liquido)}</p>
            <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-3">Valor <strong>líquido estimado</strong> a receber por ${dias} dias (${fmt(dtInicio)} a ${fmt(dtFim)}).</p>
            <div class="space-y-1 text-[12px] pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Férias (${dias} dias)</span><span class="font-semibold text-green-600 dark:text-green-500">+ ${formatMoeda(vF)}</span></div>
                <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">1/3 Constitucional</span><span class="font-semibold text-green-600 dark:text-green-500">+ ${formatMoeda(vTF)}</span></div>
                <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">INSS</span><span class="font-semibold text-red-600 dark:text-red-400">- ${formatMoeda(inss)}</span></div>
                <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">IRRF</span><span class="font-semibold text-red-600 dark:text-red-400">- ${formatMoeda(irrf)}</span></div>
                <div class="flex justify-between gap-3 pt-1.5 mt-1 border-t border-slate-300/60 dark:border-[#2a3850]/60"><span class="font-semibold text-slate-700 dark:text-gray-200">Líquido estimado</span><span class="font-bold text-slate-900 dark:text-gray-100">${formatMoeda(liquido)}</span></div>
            </div>
            ${sugestoes}
        `;
    }

    // ─── foco 'datas' (padrão) ────────────────────────────────
    // 🎯 O PROTAGONISTA é o QUANDO — as três datas (início, fim,
    //    volta ao trabalho). O número de dias aparece como
    //    informação secundária, em uma linha discreta embaixo.
    //
    //    Quem quiser ver os dias em destaque pergunta "Quantos
    //    dias de férias?" — que cai no foco 'dias'. Assim cada
    //    pergunta recebe o recorte exato do que foi pedido.
    return `
        ${aviso}
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Férias · ${nomeAlvo}/${anoFinal}</p>
        <div class="space-y-2 mt-2 mb-3">
            <div class="flex justify-between items-baseline gap-3">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Início</span>
                <span class="font-bold text-slate-800 dark:text-gray-100 text-[14px]">${fmt(dtInicio)}</span>
            </div>
            <div class="flex justify-between items-baseline gap-3 pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Fim</span>
                <span class="font-bold text-slate-800 dark:text-gray-100 text-[14px]">${fmt(dtFim)}</span>
            </div>
            <div class="flex justify-between items-baseline gap-3 pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                <span class="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500">Volta ao trabalho</span>
                <span class="font-bold text-slate-800 dark:text-gray-100 text-[14px]">${fmt(dtVolta)}</span>
            </div>
        </div>
        <p class="text-[11px] text-slate-400 dark:text-gray-500 leading-snug">Pergunte <em>"Quantos dias de férias?"</em> para ver a duração, ou <em>"Quanto vou receber de férias?"</em> para o breakdown financeiro.</p>
        ${sugestoes}
    `;
}

// 🎯 13º SALÁRIO — quanto e quando em cada parcela
function asRespDecimo(mes, ano) {
    const nome = nomeMeses[mes];
    const cfgAtual = configHoleriteGlobal[`${String(mes+1).padStart(2,'0')}/${ano}`];
    let bruto = parseFloat(cfgAtual?.bruto) || 0;

    // Busca a config mais recente do ano com bruto válido (fallback do perfil).
    if (bruto <= 0) {
        const ordem = [10, 11, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
        for (const m of ordem) {
            const k = `${String(m+1).padStart(2,'0')}/${ano}`;
            const cfg = configHoleriteGlobal[k];
            const b = parseFloat(cfg?.bruto) || 0;
            if (b > 0) { bruto = b; break; }
        }
    }
    // Fallback final: perfil
    if (bruto <= 0) bruto = parseFloat(meuPerfil.salario) || 0;

    if (bruto <= 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Não consegui calcular — seu salário bruto ainda não está configurado. Defina em <strong>Configurações → Padrões do Simulador</strong>.</p>`;
    }

    const p1Bruto = bruto / 2;
    const p2Bruto = bruto / 2;
    const inss13 = calcularINSS(bruto);
    const irrf13 = calcularIRRF(bruto, meuPerfil.dependentes);
    const p2Liquido = p2Bruto - inss13 - irrf13;
    const totalLiquido = p1Bruto + p2Liquido;

    // Se perguntou de um mês específico e não é nov/dez, avisa
    const ehNov = mes === 10;
    const ehDez = mes === 11;
    const mesNaoEh13 = !ehNov && !ehDez;

    let aviso = '';
    if (mesNaoEh13) {
        aviso = `<p class="text-[11px] text-slate-500 dark:text-gray-400 mt-2">O 13º é pago em novembro (1ª parcela) e dezembro (2ª parcela).</p>`;
    }

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">13º Salário · exercício ${ano}</p>
        <p class="text-2xl font-bold text-green-600 dark:text-green-500 font-montserrat tracking-tight mb-2">${formatMoeda(totalLiquido)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-3">Valor <strong>líquido</strong> total do 13º (proventos − INSS − IRRF).</p>
        <div class="space-y-2 text-[12px] pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            <div class="flex justify-between gap-3">
                <div><div class="font-semibold text-slate-700 dark:text-gray-200">1ª parcela</div><div class="text-[10px] text-slate-500 dark:text-gray-400">Até 30/nov · sem desconto</div></div>
                <div class="font-bold text-green-600 dark:text-green-500 text-right">+ ${formatMoeda(p1Bruto)}</div>
            </div>
            <div class="flex justify-between gap-3 pt-2 border-t border-slate-300/40 dark:border-[#2a3850]/40">
                <div><div class="font-semibold text-slate-700 dark:text-gray-200">2ª parcela</div><div class="text-[10px] text-slate-500 dark:text-gray-400">Até 20/dez · INSS ${formatMoeda(inss13)} + IRRF ${formatMoeda(irrf13)}</div></div>
                <div class="font-bold text-green-600 dark:text-green-500 text-right">+ ${formatMoeda(p2Liquido)}</div>
            </div>
        </div>
        ${aviso}
        ${asSugestoes([
            { txt: 'Quando cai meu salário?', q: 'Quando cai meu salário?' },
            { txt: 'Meus descontos', q: 'Quais meus descontos?' }
        ])}
    `;
}

// 🎯 DESCONTOS — lista item a item com totais
function asRespDescontos(mes, ano) {
    const chave = `${String(mes+1).padStart(2,'0')}/${ano}`;
    const cfg = configHoleriteGlobal[chave];
    const nome = nomeMeses[mes];

    if (!cfg) {
        return `
            <p class="text-slate-600 dark:text-gray-300 text-[13px]">Ainda não há simulação salva para <strong>${nome}/${ano}</strong>.</p>
            <p class="text-[12px] text-slate-500 dark:text-gray-400 mt-2">Abra o <strong>Simulador</strong> e salve a projeção do mês para eu poder listar os descontos.</p>
            ${asSugestoes([
                { txt: 'Descontos de setembro', q: 'Quais meus descontos em setembro?' },
                { txt: 'Descontos de outubro', q: 'Quais meus descontos em outubro?' }
            ])}
        `;
    }

    const bruto = parseFloat(cfg.bruto) || 0;
    const itens = [];
    const valorFret = bruto * (parseFloat(cfg.fretadoPct) || 0) / 100;
    const vale = parseFloat(cfg.valeAdiantamento) || 0;
    const inssEst = calcularINSS(bruto);
    const irrfEst = calcularIRRF(bruto, meuPerfil.dependentes);

    if (inssEst > 0) itens.push({ nome: 'INSS', valor: inssEst });
    if (irrfEst > 0) itens.push({ nome: 'IRRF', valor: irrfEst });
    if (vale > 0) itens.push({ nome: 'Vale (adiantamento)', valor: vale });
    if (parseFloat(cfg.convMed) > 0) itens.push({ nome: 'Convênio Médico', valor: parseFloat(cfg.convMed) });
    if (parseFloat(cfg.convOdo) > 0) itens.push({ nome: 'Convênio Odontológico', valor: parseFloat(cfg.convOdo) });
    if (valorFret > 0) itens.push({ nome: `Fretado (${cfg.fretadoPct}%)`, valor: valorFret });

    for (let i = 1; i <= 5; i++) {
        const n = cfg[`descNome${i}`];
        const v = parseFloat(cfg[`descVal${i}`]) || 0;
        if (v > 0) itens.push({ nome: n || `Desconto ${i}`, valor: v });
    }

    if (itens.length === 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Não há descontos configurados para <strong>${nome}/${ano}</strong>.</p>`;
    }

    const total = itens.reduce((s, i) => s + i.valor, 0);

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Descontos · ${nome}/${ano}</p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400 font-montserrat tracking-tight mb-3">${formatMoeda(total)}</p>
        <div class="space-y-1 text-[12px]">
            ${itens.map(i => `<div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400 truncate">${i.nome}</span><span class="font-semibold text-red-600 dark:text-red-400 whitespace-nowrap">${formatMoeda(i.valor)}</span></div>`).join('')}
        </div>
        <p class="text-[10px] text-slate-400 dark:text-gray-500 mt-2 leading-snug">INSS e IRRF são estimados sobre o bruto. Valores reais podem variar.</p>
        ${asSugestoes([
            { txt: 'Quando cai meu salário?', q: `Quando cai meu salário em ${nome.toLowerCase()}?` },
            { txt: 'Quanto vou receber de 13º?', q: 'Quanto vou receber de 13º?' }
        ])}
    `;
}

function asRespNaoEntendi() {
    const opcoes = [
        { txt: 'Qual meu saldo?',          q: 'Qual meu saldo?' },
        { txt: 'Quanto gastei este mês?',  q: 'Quanto gastei este mês?' },
        { txt: 'Gastei no salário de outubro', q: 'Quanto vou gastar no salário de outubro?' },
        { txt: 'Quando cai meu salário?',  q: 'Quando cai meu salário?' },
        { txt: 'Onde gastei mais?',        q: 'Onde gastei mais este mês?' },
        { txt: 'Ver tudo que sei fazer',   q: 'ajuda' }
    ];
    return `
        <p class="text-slate-600 dark:text-gray-300 text-[13px]">Ainda estou aprendendo — não entendi essa.</p>
        <p class="text-[12px] text-slate-500 dark:text-gray-400 mt-2 mb-3">Toque em uma das opções abaixo ou digite <strong>ajuda</strong>:</p>
        <div class="flex flex-wrap gap-1.5">
            ${opcoes.map(o =>
                `<button type="button" data-q="${o.q}" onclick="asPerguntar(this.dataset.q)" class="px-2.5 py-1.5 text-[11px] font-semibold rounded-full bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#2a3850] text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-[#1a2639] hover:border-[#4D6BFE] dark:hover:border-[#4D6BFE] transition-colors active:scale-95 whitespace-nowrap">${o.txt}</button>`
            ).join('')}
        </div>
    `;
}

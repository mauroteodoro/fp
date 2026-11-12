// Assistente financeiro: núcleo e intents
'use strict';

// ═══════════════════════════════════════════════════════════════
// 🤖 ASSISTENTE FINANCEIRO (rule-based, 100% local, Fase 1)
// ═══════════════════════════════════════════════════════════════
// Sem IA externa. Sem chamadas de rede. Zero custo.
// Cada intenção tem um conjunto de palavras-chave e uma resposta
// que lê direto do `bancoDeDados` em memória.
//
// Intenções cobertas:
//   1. Ajuda / "o que você pode fazer?"
//   2. Total gasto em um mês ("quanto gastei em outubro")
//   3. Total recebido em um mês ("quanto recebi em outubro")
//   4. Totais dos últimos N meses ("últimos 3 meses")
//   5. Saldo de uma conta específica ("quanto tenho no itaú")
//   6. Saldo total do mês visualizado ("qual meu saldo")
//   7. Maior gasto do mês ("onde gastei mais")
//   8. Data do salário ("quando cai meu salário")
//   9. Fallback amigável

const mesesLower = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

// ---------- HELPERS DE DADOS ----------

function asCalcularTotaisMes(mes, ano, modo = 'todos') {
    let receitas = 0, despesas = 0;
    const categorias = {};

    bancoDeDados.forEach(d => {
        if (d.ocultoExtrato || d.isAjuste) return;
        // Terceiro entra como receita/despesa real; próprio fica fora.
        if (d.isTransferencia && !d.isTerceiro) return;
        // 'pago' = só efetivados; 'pendente' = só a pagar; 'todos' = ambos.
        if (modo === 'pago' && !d.pago) return;
        if (modo === 'pendente' && d.pago) return;
        if (!itemPertenceAoMes(d, mes, ano)) return;

        const val = valorFloat(d.valor);
        const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
        if (isR) {
            receitas += val;
        } else {
            despesas += val;
            const cat = d.categoria || 'Outros';
            categorias[cat] = (categorias[cat] || 0) + val;
        }
    });

    return { receitas, despesas, saldo: receitas - despesas, categorias };
}

// Extrai { mes, ano } de um texto. Retorna null se não achar nada.
function asExtrairMesAno(texto) {
    const t = texto.toLowerCase();

    for (let i = 0; i < 12; i++) {
        const nome = mesesLower[i];
        const abrev = nome.substring(0, 3);
        if (new RegExp(`\\b${nome}\\b`).test(t) || new RegExp(`\\b${abrev}\\b`).test(t)) {
            const matchAno = t.match(/\b(20\d{2})\b/);
            return { mes: i, ano: matchAno ? parseInt(matchAno[1]) : dataFiltro.getFullYear() };
        }
    }
    // Relativos
    if (/este m[êe]s|esse m[êe]s|m[êe]s atual|m[êe]s corrente/.test(t)) {
        return { mes: dataFiltro.getMonth(), ano: dataFiltro.getFullYear() };
    }
    if (/m[êe]s passado|[úu]ltimo m[êe]s/.test(t)) {
        const d = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() - 1, 1);
        return { mes: d.getMonth(), ano: d.getFullYear() };
    }
    return null;
}

// Extrai uma conta do texto (busca por nome cadastrado).
function asExtrairConta(texto) {
    const t = texto.toLowerCase();
    let melhor = null, tam = 0;
    contasGlobais.forEach(c => {
        const n = c.nome.toLowerCase();
        if (t.includes(n) && n.length > tam) { melhor = c; tam = n.length; }
    });
    return melhor;
}

// ---------- RENDER DA CONVERSA ----------

function asScrollFinal() {
    const el = document.getElementById('chatAssistente');
    if (el) el.scrollTop = el.scrollHeight;
}

function asRemoverBoasVindas() {
    const w = document.querySelector('#chatAssistente .as-welcome');
    if (w) w.remove();
}

function asRenderBoasVindas() {
    const container = document.getElementById('chatAssistente');
    if (!container) return;
    const nome = asNome();
    const saud = asSaudacaoHora();
    const sufixo = nome ? `, ${nome}` : '';

    const mesAtualLower = nomeMeses[dataFiltro.getMonth()].toLowerCase();
    const atalhos = [
        {
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
            titulo: 'Gastos do mês',
            sub: `"Quanto gastei em ${mesAtualLower}?"`,
            pergunta: 'Quanto gastei este mês?',
            idSub: 'asSubGastosMes'
        },
        {
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
            titulo: meuPerfil.regime === 'PJ' ? 'Faturamento' : (asTemVale() ? 'Salário e vale' : 'Salário'),
            sub: meuPerfil.regime === 'PJ' ? '"Qual meu faturamento?"' : '"Quando cai meu salário?"',
            pergunta: meuPerfil.regime === 'PJ' ? 'Qual meu faturamento?' : 'Qual será meu salário?'
        },
        {
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
            titulo: 'Férias',
            sub: '"Quando tiro férias?"',
            pergunta: 'Quando tiro férias?'
        },
        {
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
            titulo: '13º salário',
            sub: '"Quanto vou receber de 13º?"',
            pergunta: 'Quanto vou receber de 13º?'
        },
        {
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>',
            titulo: 'Descontos',
            sub: '"Quais meus descontos?"',
            pergunta: 'Quais meus descontos?'
        },
        {
            icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>',
            titulo: 'Saldo das contas',
            sub: '"Qual meu saldo?"',
            pergunta: 'Qual meu saldo?'
        }
    ];

    container.innerHTML = `
        <div class="as-welcome anim-fade-in py-2">
            <div class="mb-5">
                <p class="text-base font-bold text-slate-800 dark:text-gray-100 leading-tight">${saud}${sufixo}!</p>
                <p class="text-[12px] text-slate-500 dark:text-gray-400 leading-tight mt-1">Escolha um tema abaixo ou escreva sua pergunta.</p>
            </div>

            <!-- Grid de atalhos -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${atalhos.map(a => `
                    <button type="button" data-q="${a.pergunta}" onclick="asPerguntar(this.dataset.q)"
                            class="group flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#2a3850] hover:border-[#4D6BFE] dark:hover:border-[#4D6BFE] hover:bg-[#4D6BFE]/5 dark:hover:bg-[#4D6BFE]/10 transition-all active:scale-[0.98] text-left">
                        <div class="w-8 h-8 rounded-lg bg-[#4D6BFE]/10 dark:bg-[#4D6BFE]/20 text-[#4D6BFE] flex items-center justify-center shrink-0 group-hover:bg-[#4D6BFE] group-hover:text-white transition-colors">
                            ${a.icon}
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="text-[12.5px] font-bold text-slate-800 dark:text-gray-100 truncate">${a.titulo}</div>
                            <div class="text-[10.5px] text-slate-500 dark:text-gray-400 truncate mt-0.5"${a.idSub ? ` id="${a.idSub}"` : ''}>${a.sub}</div>
                        </div>
                    </button>
                `).join('')}
            </div>

            <!-- Rodapé discreto -->
            <p class="text-[10.5px] text-slate-400 dark:text-gray-500 text-center mt-4 leading-snug">
                Sou um assistente por regras — respondo com seus dados reais, sem inventar.
                Digite <button type="button" data-q="ajuda" onclick="asPerguntar(this.dataset.q)" class="text-[#4D6BFE] dark:text-cyan-400 font-semibold underline-offset-2 hover:underline">ajuda</button> para ver tudo.
            </p>
        </div>
    `;
}

function asAdicionarMsgUsuario(texto) {
    asRemoverBoasVindas();
    const container = document.getElementById('chatAssistente');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'flex justify-end anim-fade-in';
    el.innerHTML = `<div class="max-w-[85%] bg-[#4D6BFE] text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-sm shadow-sm">${texto.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`;
    container.appendChild(el);
    asScrollFinal();
}

function asAdicionarMsgAssistente(html) {
    asRemoverBoasVindas();
    const container = document.getElementById('chatAssistente');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'flex justify-start anim-fade-in';
    el.innerHTML = `
        <div class="max-w-[88%] bg-slate-100 dark:bg-[#1a2639] rounded-2xl rounded-tl-md px-4 py-3 text-sm text-slate-800 dark:text-gray-100 shadow-sm">
            <div class="flex items-center gap-1.5 mb-1.5">
                <div class="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                     style="background: linear-gradient(135deg, #6B85FF 0%, #4D6BFE 100%);">
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
                </div>
                <span class="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Assistente</span>
            </div>
            <div class="prose-sm">${html}</div>
        </div>
    `;
    container.appendChild(el);

    // Resposta longa: rola para o topo dela. Curta: rola para o fim.
    requestAnimationFrame(() => {
        const msgH = el.offsetHeight;
        const visH = container.clientHeight;
        if (msgH > visH * 0.85) {
            // Resposta longa — topo dela no topo do chat
            el.scrollIntoView({ block: 'start', behavior: 'smooth' });
        } else {
            // Resposta curta — comportamento de chat padrão
            container.scrollTop = container.scrollHeight;
        }
    });
}

// ---------- BUILDERS DE RESPOSTA ----------

function asRespAjuda() {
    const grupos = [
        {
            titulo: '💰 Salário e recebimentos',
            itens: [
                { txt: 'Quando cai meu salário?',        q: 'Quando cai meu salário?' },
                { txt: 'Qual será meu salário?',         q: 'Qual será meu salário?' },
                ...(asTemVale() ? [{ txt: 'Quanto vou receber de vale?', q: 'Quanto vou receber de vale?' }] : []),
                { txt: 'Quanto vou receber de 13º?',     q: 'Quanto vou receber de 13º?' },
                { txt: 'Quais meus descontos?',          q: 'Quais meus descontos?' }
            ]
        },
        {
            titulo: '🏖️ Férias e descanso',
            itens: [
                { txt: 'Quando tiro férias?',            q: 'Quando tiro férias?' },
                { txt: 'Quantos dias de férias?',        q: 'Quantos dias de férias?' },
                { txt: 'Quanto vou receber de férias?',  q: 'Quanto vou receber de férias?' }
            ]
        },
        {
            titulo: '💸 Gastos e despesas',
            itens: [
                { txt: 'Quanto gastei este mês?',        q: 'Quanto gastei este mês?' },
                { txt: 'Onde gastei mais?',              q: 'Onde gastei mais este mês?' },
                { txt: 'Maiores gastos do mês',          q: 'Quais os maiores gastos do mês?' },
                { txt: 'Gastos por categoria',           q: 'Quanto gastei com alimentação?' },
                { txt: 'Gastos do salário',              q: 'Quanto vou gastar no salário deste mês?' },
                ...(asTemVale() ? [{ txt: 'Gastos do vale', q: 'Quanto vou gastar no vale deste mês?' }] : [])
            ]
        },
        {
            titulo: '🏦 Saldos e contas',
            itens: [
                { txt: 'Qual meu saldo?',                q: 'Qual meu saldo?' },
                { txt: 'Saldo do salário',               q: 'Qual meu saldo do salário?' },
                ...(asTemVale() ? [{ txt: 'Saldo do vale', q: 'Qual meu saldo do vale?' }] : []),
                { txt: 'Saldo total projetado',          q: 'Qual meu saldo projetado?' }
            ]
        },
        {
            titulo: '🔄 Transferências',
            itens: [
                { txt: 'Quais transferências fiz este mês?',  q: 'Quais transferências fiz este mês?' },
                { txt: 'Quanto transferi este mês?',          q: 'Quanto transferi este mês?' },
                { txt: 'Tenho transferências pendentes?',     q: 'Tenho transferências pendentes?' },
                { txt: 'Quanto transferi pro Cofrinho?',      q: 'Quanto transferi pro Cofrinho?' },
                { txt: 'Quanto transferi no mês passado?',    q: 'Quanto transferi no mês passado?' }
            ]
        },
        {
            titulo: '💰 Orçamento e limites',
            itens: [
                { txt: 'Como está meu orçamento?',                       q: 'Como está meu orçamento?' },
                { txt: 'Estourei algum limite?',                         q: 'Estourei algum limite?' },
                { txt: 'Como está meu orçamento, só o que já paguei?',   q: 'Como está meu orçamento, só o que já paguei?' },
                { txt: 'Quais categorias estão no limite?',              q: 'Quais categorias estão no limite?' }
            ]
        },
        {
            titulo: '🎯 Metas e planejamento',
            itens: [
                { txt: 'Quero juntar R$ 5.000 até dezembro',         q: 'Quero juntar R$ 5.000 até dezembro' },
                { txt: 'Preciso juntar R$ 10.000 até março de 2027', q: 'Preciso juntar R$ 10.000 até março de 2027' },
                { txt: 'Quero juntar R$ 5.000 mantendo R$ 400/mês',  q: 'Quero juntar R$ 5.000 mantendo R$ 400/mês' }
            ]
        },
        {
            titulo: '📚 Como usar o app',
            itens: [
                { txt: 'O que é o Saldo Projetado?',           q: 'O que é o Saldo Projetado?' },
                { txt: 'Diferença Salário x Vale',             q: 'O que é o Saldo do Salário?' },
                { txt: 'Como lanço uma despesa?',              q: 'Como lanço uma despesa?' },
                { txt: 'Pendente vs Efetivada',                q: 'O que é Pendente e Efetivada?' },
                { txt: 'Como funciona a recorrência?',         q: 'O que é Recorrente?' },
                { txt: 'O que é Ajuste Silencioso?',           q: 'O que é ajuste silencioso?' },
                { txt: 'O que é DSR?',                         q: 'O que é DSR?' },
                { txt: 'O que é INSS?',                        q: 'O que é INSS?' },
                { txt: 'O que é IRRF?',                        q: 'O que é IRRF?' },
                { txt: 'Como faço um backup?',                 q: 'Como faço um backup?' },
                { txt: 'Como oculto os valores?',              q: 'Como oculto os valores?' },
                { txt: 'Como reordeno minhas contas?',         q: 'Como reordeno minhas contas?' }
            ]
        },
        {
            titulo: '📅 Períodos e comparações',
            itens: [
                { txt: 'Recebi nos últimos 3 meses',              q: 'Quanto recebi nos últimos 3 meses?' },
                { txt: 'Gastos dos últimos 3 meses',              q: 'Quanto gastei nos últimos 3 meses?' },
                { txt: 'Compare este mês com o mês passado',      q: 'Compare este mês com o mês passado' },
                { txt: 'Compare outubro com setembro',            q: 'Compare outubro com setembro' }
            ]
        }
    ];

    return `
        <p class="font-semibold mb-1 text-slate-800 dark:text-gray-100">Aqui está o que eu sei fazer:</p>
        <p class="text-[11px] text-slate-500 dark:text-gray-400 mb-3">Toque em qualquer pergunta — eu respondo na hora.</p>
        <div class="space-y-4">
            ${grupos.map(g => `
                <div>
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">${g.titulo}</p>
                    <div class="flex flex-col gap-1.5">
                        ${g.itens.map(o =>
                            `<button type="button" data-q="${o.q}" onclick="asPerguntar(this.dataset.q)" class="w-full text-left px-3 py-2 text-[12px] font-medium rounded-lg bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#2a3850] text-slate-700 dark:text-gray-300 hover:bg-[#4D6BFE]/5 dark:hover:bg-[#4D6BFE]/10 hover:border-[#4D6BFE] dark:hover:border-[#4D6BFE] hover:text-[#4D6BFE] dark:hover:text-[#4D6BFE] transition-all active:scale-[0.98]">${o.txt}</button>`
                        ).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        <p class="text-[10.5px] text-slate-400 dark:text-gray-500 mt-4 leading-snug">Dica: após qualquer resposta, toque nos botões de <strong>perguntas relacionadas</strong> para continuar a conversa sem redigitar.</p>
    `;
}

function asRespTotalMes(mes, ano, tipo, modo = 'todos') {
    const dAll = asCalcularTotaisMes(mes, ano, 'todos');
    const dPago = asCalcularTotaisMes(mes, ano, 'pago');
    const dPend = asCalcularTotaisMes(mes, ano, 'pendente');
    const nome = nomeMeses[mes];
    const isReceita = tipo === 'receita';

    let valor, cor, frase, sufixo = '';
    if (isReceita) {
        cor = 'text-green-600 dark:text-green-500';
        if (modo === 'pago') {
            valor = dPago.receitas;
            frase = `Você <strong>já recebeu</strong> ${formatMoeda(valor)} em ${nome}/${ano}.`;
            if (dPend.receitas > 0.005) sufixo = `Ainda há <strong>${formatMoeda(dPend.receitas)}</strong> a receber.`;
        } else if (modo === 'pendente') {
            valor = dPend.receitas;
            frase = `Você <strong>ainda vai receber</strong> ${formatMoeda(valor)} em ${nome}/${ano}.`;
            if (dPago.receitas > 0.005) sufixo = `Já recebeu <strong>${formatMoeda(dPago.receitas)}</strong>.`;
        } else {
            valor = dAll.receitas;
            frase = `Você recebeu <strong>${formatMoeda(valor)}</strong> em ${nome}/${ano}.`;
            sufixo = 'Inclui receitas pagas e pendentes.';
        }
    } else {
        cor = 'text-red-600 dark:text-red-400';
        if (modo === 'pago') {
            valor = dPago.despesas;
            frase = `Você <strong>já pagou</strong> ${formatMoeda(valor)} em ${nome}/${ano}.`;
            if (dPend.despesas > 0.005) sufixo = `Ainda há <strong>${formatMoeda(dPend.despesas)}</strong> pendente.`;
        } else if (modo === 'pendente') {
            valor = dPend.despesas;
            frase = `Você <strong>ainda vai pagar</strong> ${formatMoeda(valor)} em ${nome}/${ano}.`;
            if (dPago.despesas > 0.005) sufixo = `Já pagou <strong>${formatMoeda(dPago.despesas)}</strong>.`;
        } else {
            valor = dAll.despesas;
            frase = `Você gastou <strong>${formatMoeda(valor)}</strong> em ${nome}/${ano}.`;
            sufixo = 'Inclui despesas pagas e pendentes.';
        }
    }

    // Top 3 categorias — sempre sobre a base do modo escolhido
    let extras = '';
    if (!isReceita) {
        const dModo = (modo === 'pago') ? dPago : (modo === 'pendente' ? dPend : dAll);
        const cats = Object.entries(dModo.categorias).sort((a, b) => b[1] - a[1]).slice(0, 3);
        if (cats.length > 0) {
            extras = `
                <div class="mt-3 pt-3 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">Top categorias ${modo === 'pago' ? '(pago)' : modo === 'pendente' ? '(a pagar)' : ''}</p>
                    <div class="space-y-1 text-[12px]">
                        ${cats.map(([nome, val], i) => `<div class="flex justify-between gap-3"><span class="truncate">${i+1}. ${nome}</span><span class="font-semibold whitespace-nowrap">${formatMoeda(val)}</span></div>`).join('')}
                    </div>
                </div>`;
        }
    }

    const label = isReceita ? 'Receitas' : 'Despesas';
    const labelModo = modo === 'pago' ? ' · pagas' : modo === 'pendente' ? ' · a receber/pagar' : '';
    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">${label}${labelModo} · ${nome}/${ano}</p>
        <p class="text-2xl font-bold ${cor} font-montserrat tracking-tight mb-2">${formatMoeda(valor)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px]">${frase}</p>
        ${sufixo ? `<p class="text-[12px] text-slate-500 dark:text-gray-400 mt-1">${sufixo}</p>` : ''}
        ${extras}
    `;
}

function asRespUltimosMeses(n) {
    let totalRec = 0, totalDesp = 0;
    const linhas = [];
    for (let i = 0; i < n; i++) {
        const d = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() - i, 1);
        const r = asCalcularTotaisMes(d.getMonth(), d.getFullYear());
        totalRec += r.receitas;
        totalDesp += r.despesas;
        linhas.push({
            nome: nomeMeses[d.getMonth()],
            ano: d.getFullYear(),
            rec: r.receitas,
            desp: r.despesas
        });
    }
    const saldo = totalRec - totalDesp;
    const corSaldo = saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400';
    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Últimos ${n} meses</p>
        <div class="space-y-1 mb-3">
            <div class="flex justify-between gap-3 text-[13px]">
                <span class="text-slate-500 dark:text-gray-400">Recebido</span>
                <span class="font-bold text-green-600 dark:text-green-500">+ ${formatMoeda(totalRec)}</span>
            </div>
            <div class="flex justify-between gap-3 text-[13px]">
                <span class="text-slate-500 dark:text-gray-400">Gasto</span>
                <span class="font-bold text-red-600 dark:text-red-400">- ${formatMoeda(totalDesp)}</span>
            </div>
            <div class="flex justify-between gap-3 text-[13px] pt-1.5 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                <span class="font-semibold text-slate-700 dark:text-gray-200">Saldo do período</span>
                <span class="font-bold ${corSaldo}">${formatMoeda(saldo)}</span>
            </div>
        </div>
        <details class="group">
            <summary class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 cursor-pointer select-none flex items-center gap-1">
                Ver mês a mês
                <svg class="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </summary>
            <div class="mt-2 pt-2 border-t border-slate-300/40 dark:border-[#2a3850]/40 space-y-1 text-[12px] text-slate-600 dark:text-gray-300">
                ${linhas.map(l => `<div class="flex justify-between gap-3"><span class="truncate">${l.nome.substring(0,3)}/${l.ano}</span><span class="whitespace-nowrap"><span class="text-green-600 dark:text-green-500">+${formatMoeda(l.rec)}</span> · <span class="text-red-600 dark:text-red-400">-${formatMoeda(l.desp)}</span></span></div>`).join('')}
            </div>
        </details>
    `;
}

function asRespSaldoConta(conta) {
    let saldo = parseFloat(conta.saldoInicial || 0);
    bancoDeDados.forEach(d => {
        if ((d.contaId || 'c_padrao') === conta.id && d.pago) {
            const val = valorFloat(d.valor);
            const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
            saldo += isR ? val : -val;
        }
    });
    const cor = saldo >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400';
    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Saldo · ${conta.nome}</p>
        <p class="text-2xl font-bold ${cor} font-montserrat tracking-tight mb-2">${formatMoeda(saldo)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px]">Este é o saldo real da conta (só movimentações pagas).</p>
    `;
}

// 🎯 Saldo de um bucket específico (Salário ou Vale).
//    Lê de `window.mathReal` — que é populado por `atualizarTabela()`.
//    Como o usuário pode estar na aba Assistente sem ter passado pelo
//    Resumo, forçamos uma atualização do cálculo ANTES de ler. Isso
//    garante que os números batem com os cards — sempre.
//
//    Diferença conceitual importante (e é isso que a resposta
//    comunica ao usuário):
//      • "Qual meu saldo?" → saldo REAL das contas (o que existe hoje)
//      • "Qual o saldo do salário?" → saldo de PROJEÇÃO do bucket
//         (o que sobra do valor base − gastos do mês)
function _obterMesInicioUso() {
    let menorNum = Infinity;
    const considerar = (chave) => {
        const p = chave.split('/');
        if (p.length !== 2) return;
        const n = parseInt(p[1]) * 100 + parseInt(p[0]);
        if (n < menorNum) menorNum = n;
    };
    for (const k in configHoleriteGlobal) considerar(k);
    for (const k in saldoBaseMensalGlobal) considerar(k);
    bancoDeDados.forEach(d => {
        [d.dataLancamento, d.vencimento, d.vencimentoOriginal].forEach(ref => {
            if (!ref || ref.length !== 10) return;
            const p = ref.split('/');
            const n = parseInt(p[2]) * 100 + parseInt(p[1]);
            if (n < menorNum) menorNum = n;
        });
    });
    if (menorNum === Infinity) {
        const h = new Date();
        return { mes: h.getMonth(), ano: h.getFullYear() };
    }
    return { mes: (menorNum % 100) - 1, ano: Math.floor(menorNum / 100) };
}

function asCalcularSaldoBucket(mes, ano, bucket) {
    const chave = `${String(mes+1).padStart(2,'0')}/${ano}`;

    // Filtra despesas do mês (mesma regra do Extrato/cards).
    const despesasFiltradas = bancoDeDados.filter(d => itemPertenceAoMes(d, mes, ano));

    // 2) Bases (mesma regra do 13º por mês — nov→Vale, dez→Salário)
    let baseVale = 0, baseSalario = 0;
    const cfg = configHoleriteGlobal[chave];
    const bmes = saldoBaseMensalGlobal[chave];
    const ehDez = mes === 11;

    // Fallback: estima pelo perfil em meses sem simulação (mas só a partir do início de uso).
    const inicioUso = _obterMesInicioUso();
    const mesAlvoNum = ano * 100 + (mes + 1);
    const inicioUsoNum = inicioUso.ano * 100 + (inicioUso.mes + 1);
    const antesDoInicio = mesAlvoNum < inicioUsoNum;

    let _baseEstimada = false;
    if (!cfg && !bmes && !antesDoInicio) {
        const bruto = parseFloat(meuPerfil.salario) || 0;
        if (bruto > 0) {
            if (meuPerfil.regime === 'PJ') {
                baseSalario = bruto;
            } else if (meuPerfil.temVale === 'Não') {
                const inss = calcularINSS(bruto);
                const irrf = calcularIRRF(bruto, meuPerfil.dependentes);
                baseSalario = bruto - inss - irrf;
                baseVale = 0;
            } else {
                const inss = calcularINSS(bruto);
                const irrf = calcularIRRF(bruto, meuPerfil.dependentes);
                const vale = meuPerfil.temVale === 'Sim' ? bruto * 0.40 : 0;
                baseSalario = bruto - inss - irrf - vale;
                baseVale = vale;
            }
            _baseEstimada = true;
        }
    } else if (cfg) {
        const v13 = parseFloat(cfg.valor13 || 0);
        if (ehDez) {
            baseSalario = parseFloat(cfg.salarioLiquido || 0);
            baseVale = parseFloat(cfg.valeAdiantamento || 0);
        } else {
            baseSalario = parseFloat(cfg.salarioLiquido || 0) - v13;
            baseVale = parseFloat(cfg.valeAdiantamento || 0) + v13;
        }
    } else if (bmes) {
        const v13 = parseFloat(bmes.valor13 || 0);
        if (ehDez) {
            baseSalario = parseFloat(bmes.salario || 0);
            baseVale = parseFloat(bmes.vale || 0);
        } else {
            baseSalario = parseFloat(bmes.salario || 0) - v13;
            baseVale = parseFloat(bmes.vale || 0) + v13;
        }
    }

    const semVale = (meuPerfil.temVale === 'Não');
    if (semVale) baseVale = 0;

    // 3) Composição por bucket (espelho de `atualizarCardsSaldo`)
    const isRec = d => (d.tipo === 'Receita' || d.natureza === 'Receita');
    // 🎯 Espelho do filtro em `atualizarCardsSaldo`:
    //    own-account NÃO conta; terceiro conta em ambas direções.
    const visiveis = despesasFiltradas.filter(d => {
        if (!d.isTransferencia) return true;
        return !!d.isTerceiro;
    });
    const alvoComposicao = d => {
        const redir = (alvo) => (semVale && alvo === 'Vale') ? 'Salário' : alvo;
        if (d.isAjuste) {
            if (d.alvoAjuste === 'Vale') return redir('Vale');
            if (d.alvoAjuste === 'Salário') return 'Salário';
            // 🎯 Mesmo tratamento do `atualizarCardsSaldo`: ajustes
            //    de conta específica não compõem nenhum bucket.
            if (typeof d.alvoAjuste === 'string' && d.alvoAjuste.startsWith('Conta|')) return 'Nenhum';
            return 'Salário';
        }
        if (isRec(d) && !d.compoeResumo) return 'Nenhum';
        if (d.origem === 'Vale') return redir('Vale');
        if (d.origem === 'Salário') return 'Salário';
        const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        return redir(determinarOrigem(dataRef, d.natureza || d.tipo || 'Despesa', null));
    };

    const receitaSalario = visiveis.filter(d => isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Salário').reduce((s, d) => s + valorFloat(d.valor), 0);
    const gastoSalario = visiveis.filter(d => !isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Salário').reduce((s, d) => s + valorFloat(d.valor), 0);
    const ajusteSalario = visiveis.filter(d => d.isAjuste && alvoComposicao(d) === 'Salário').reduce((s, d) => s + (isRec(d) ? valorFloat(d.valor) : -valorFloat(d.valor)), 0);
    const gastoVale = visiveis.filter(d => !isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Vale').reduce((s, d) => s + valorFloat(d.valor), 0);
    const receitaVale = visiveis.filter(d => isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Vale').reduce((s, d) => s + valorFloat(d.valor), 0);
    const ajusteVale = visiveis.filter(d => d.isAjuste && alvoComposicao(d) === 'Vale').reduce((s, d) => s + (isRec(d) ? valorFloat(d.valor) : -valorFloat(d.valor)), 0);

    // Override: se o usuário fixou manualmente o saldo do Salário neste mês, respeita.
    let saldoSalario = baseSalario + receitaSalario - gastoSalario + ajusteSalario;
    let overrideDetalhes = null;
    if (bmes && bmes.overrideSalario) {
        const ov = bmes.overrideSalario;
        if (typeof ov === 'object' && ov.valor !== undefined) {
            saldoSalario = parseFloat(ov.valor);
            overrideDetalhes = ov;
        } else {
            saldoSalario = parseFloat(ov);
            overrideDetalhes = { valor: saldoSalario, data: null, _legado: true };
        }
    }
    const saldoVale = baseVale + receitaVale - gastoVale + ajusteVale;
    const saldoTotal = saldoSalario + saldoVale;

    if (bucket === 'Salário') return { base: baseSalario, rec: receitaSalario, desp: gastoSalario, ajuste: ajusteSalario, total: saldoSalario, override: overrideDetalhes, _baseEstimada };
    if (bucket === 'Vale') return { base: baseVale, rec: receitaVale, desp: gastoVale, ajuste: ajusteVale, total: saldoVale, _baseEstimada };
    return {
        base: baseSalario + baseVale,
        rec: receitaSalario + receitaVale,
        desp: gastoSalario + gastoVale,
        ajuste: ajusteSalario + ajusteVale,
        total: saldoTotal,
        salario: saldoSalario,
        vale: saldoVale,
        _baseEstimada
    };
}

function asRespSaldoBucket(bucket, mes, ano) {
    if (mes === undefined || mes === null) mes = dataFiltro.getMonth();
    if (ano === undefined || ano === null) ano = dataFiltro.getFullYear();

    const d = asCalcularSaldoBucket(mes, ano, bucket);
    const nome = nomeMeses[mes];
    const cor = d.total >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400';

    let breakdown = '';
    if (bucket === 'Total') {
        breakdown = `
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Saldo do Salário</span><span class="font-semibold text-slate-700 dark:text-gray-200">${formatMoeda(d.salario)}</span></div>
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Saldo do Vale</span><span class="font-semibold text-slate-700 dark:text-gray-200">${formatMoeda(d.vale)}</span></div>
        `;
    } else {
        const ajusteVal = d.ajuste || 0;
        const temAjuste = Math.abs(ajusteVal) > 0.005;
        breakdown = `
            ${d.base > 0 ? `<div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Valor base${bucket === 'Salário' ? ' (líquido)' : ' (adiantamento)'}</span><span class="font-semibold text-slate-700 dark:text-gray-200">${formatMoeda(d.base)}</span></div>` : ''}
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Receitas</span><span class="font-semibold text-green-600 dark:text-green-500">+ ${formatMoeda(d.rec)}</span></div>
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Despesas</span><span class="font-semibold text-red-600 dark:text-red-400">- ${formatMoeda(d.desp)}</span></div>
            ${temAjuste ? `<div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Ajustes</span><span class="font-semibold ${ajusteVal > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400'}">${ajusteVal > 0 ? '+' : ''} ${formatMoeda(ajusteVal)}</span></div>` : ''}
        `;
    }

    let avisoOverride = '';
    if (d.override) {
        const dOv = (typeof d.override === 'object') ? d.override.data : null;
        avisoOverride = `<p class="text-[11px] text-amber-600 dark:text-amber-400 mt-2 leading-snug">⚠️ Saldo fixado manualmente${dOv ? ' em ' + dOv : ''}.</p>`;
    }

    let avisoEstimado = '';
    if (d._baseEstimada) {
        avisoEstimado = `<p class="text-[11px] text-amber-600 dark:text-amber-400 mt-2 leading-snug">⚠️ Valor estimado a partir do seu perfil — não há simulação salva para ${nome}/${ano}. Abra o Simulador e salve para precisão total.</p>`;
    }

    const sug = [];
    const temValeSug = asTemVale();
    if (bucket === 'Salário') {
        if (temValeSug) sug.push({ txt: 'E o vale?', q: 'E o vale?' });
        sug.push({ txt: 'E o total?', q: 'E o total?' });
    }
    if (bucket === 'Vale') { sug.push({ txt: 'E o salário?', q: 'E o salário?' }); sug.push({ txt: 'E o total?', q: 'E o total?' }); }
    if (bucket === 'Total') {
        sug.push({ txt: 'E o salário?', q: 'E o salário?' });
        if (temValeSug) sug.push({ txt: 'E o vale?', q: 'E o vale?' });
    }

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Saldo do ${bucket} · ${nome}/${ano}</p>
        <p class="text-2xl font-bold ${cor} font-montserrat tracking-tight mb-3">${formatMoeda(d.total)}</p>
        <div class="space-y-1 text-[12px] pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            ${breakdown}
        </div>
        <p class="text-[10px] text-slate-400 dark:text-gray-500 mt-2 leading-snug">Saldo de <strong>projeção</strong> — considera pendentes. Para o que você tem <strong>em conta</strong>, pergunte "qual meu saldo?".</p>
        ${avisoOverride}
        ${avisoEstimado}
        ${asSugestoes(sug)}
    `;
}

// Valor BRUTO a receber (salário líquido ou vale), sem descontar gastos.
function asRespValorBase(bucket, mes, ano) {
    if (mes === undefined || mes === null) mes = dataFiltro.getMonth();
    if (ano === undefined || ano === null) ano = dataFiltro.getFullYear();

    const chave = `${String(mes+1).padStart(2,'0')}/${ano}`;
    const nome = nomeMeses[mes];
    const cfg = configHoleriteGlobal[chave];
    const bmes = saldoBaseMensalGlobal[chave];

    // PJ: valor a receber = Faturamento Bruto + Bônus (sem INSS/IRRF).
    if (meuPerfil.regime === 'PJ') {
        let brutoPJ = 0, bonusPJ = 0;
        if (cfg) {
            brutoPJ = parseFloat(cfg.bruto || 0);
            bonusPJ = parseFloat(cfg.bonusVal || 0);
        } else if (bmes) {
            brutoPJ = parseFloat(bmes.bruto || meuPerfil.salario || 0);
        } else {
            brutoPJ = parseFloat(meuPerfil.salario) || 0;
        }
        const faturamento = brutoPJ + bonusPJ;
        if (faturamento <= 0) {
            return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Não consegui calcular — seu faturamento bruto ainda não está configurado. Defina em <strong>Configurações → Padrões do Simulador</strong>.</p>`;
        }
        return `
            <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Faturamento · ${nome}/${ano}</p>
            <p class="text-2xl font-bold text-green-600 dark:text-green-500 font-montserrat tracking-tight mb-2">${formatMoeda(faturamento)}</p>
            <p class="text-slate-600 dark:text-gray-300 text-[13px]">Faturamento bruto do mês${bonusPJ > 0 ? ` (inclui ${formatMoeda(bonusPJ)} de bônus)` : ''}. Em PJ não há INSS, IRRF ou vale.</p>
            ${asSugestoes([
                { txt: 'Meus custos do mês', q: 'Quais meus descontos?' },
                { txt: 'Ver saldo das contas', q: 'Qual meu saldo?' }
            ])}
        `;
    }

    // Fonte (CLT): config > baseMensal > perfil (fallback estimado)
    let valorBase = 0;
    let estimado = false;
    if (cfg) {
        valorBase = (bucket === 'Salário')
            ? parseFloat(cfg.salarioLiquido || 0)
            : parseFloat(cfg.valeAdiantamento || 0);
    } else if (bmes) {
        valorBase = (bucket === 'Salário')
            ? parseFloat(bmes.salario || 0)
            : parseFloat(bmes.vale || 0);
    } else {
        // Fallback: calcula do perfil — estimativa grosseira
        const bruto = parseFloat(meuPerfil.salario) || 0;
        if (bucket === 'Salário') {
            const inss = calcularINSS(bruto);
            const irrf = calcularIRRF(bruto, meuPerfil.dependentes);
            valorBase = bruto - inss - irrf;
        } else {
            valorBase = bruto * 0.40;
        }
        estimado = true;
    }

    // Se valorBase veio de cfg/bmes mas é 0, tenta fallback do perfil
    if (valorBase <= 0 && !estimado) {
        const bruto = parseFloat(meuPerfil.salario) || 0;
        if (bruto > 0) {
            if (bucket === 'Salário') {
                const inss = calcularINSS(bruto);
                const irrf = calcularIRRF(bruto, meuPerfil.dependentes);
                valorBase = bruto - inss - irrf;
            } else {
                valorBase = bruto * 0.40;
            }
            estimado = true;
        }
    }

    if (valorBase <= 0) {
        return `
            <p class="text-slate-600 dark:text-gray-300 text-[13px]">Não consegui calcular o valor do <strong>${bucket}</strong> para ${nome}/${ano}.</p>
            <p class="text-[12px] text-slate-500 dark:text-gray-400 mt-2">Configure seu salário bruto em <strong>Configurações → Padrões do Simulador</strong>.</p>
        `;
    }

    const cor = bucket === 'Salário' ? 'text-green-600 dark:text-green-500' : 'text-amber-600 dark:text-amber-500';
    const avisoEstimado = estimado
        ? `<p class="text-[11px] text-amber-600 dark:text-amber-400 mt-2 leading-snug">⚠️ Valor estimado a partir do seu perfil — não há simulação salva para ${nome}/${ano}. Salve no Simulador para valores exatos.</p>`
        : '';

    // Detalhamento extra só para salário (mostra INSS/IRRF estimados)
    let detalhes = '';
    if (bucket === 'Salário' && cfg && !estimado) {
        const bruto = parseFloat(cfg.bruto) || 0;
        const inss = calcularINSS(bruto);
        const irrf = calcularIRRF(bruto, meuPerfil.dependentes);
        const vale = parseFloat(cfg.valeAdiantamento) || 0;
        detalhes = `
            <div class="space-y-1 text-[12px] pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                ${bruto > 0 ? `<div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Salário bruto</span><span class="font-semibold text-slate-700 dark:text-gray-200">${formatMoeda(bruto)}</span></div>` : ''}
                ${inss > 0 ? `<div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">INSS</span><span class="font-semibold text-red-600 dark:text-red-400">- ${formatMoeda(inss)}</span></div>` : ''}
                ${irrf > 0 ? `<div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">IRRF</span><span class="font-semibold text-red-600 dark:text-red-400">- ${formatMoeda(irrf)}</span></div>` : ''}
            </div>
        `;
    }

    // 🎯 Data + dia da semana, do mesmo motor que alimenta o Simulador.
    const diasSemanaCompleto = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    let dataCredito = '';
    let diaSemanaCredito = '';
    if (bucket === 'Salário') {
        const q = getQuintoDiaUtil(ano, mes);
        dataCredito = `${String(q.getDate()).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}/${ano}`;
        diaSemanaCredito = diasSemanaCompleto[q.getDay()];
    } else {
        const v = getDiaValeEfetivo(ano, mes);
        dataCredito = `${String(v.getDate()).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}/${ano}`;
        diaSemanaCredito = diasSemanaCompleto[v.getDay()];
    }

    const motivoValeResp = (bucket === 'Vale') ? getMotivoValeEfetivo(ano, mes) : null;
    const motivoHtmlResp = motivoValeResp
        ? `<p class="text-[11px] text-amber-600 dark:text-amber-400 mt-2 leading-snug">${motivoValeResp}</p>`
        : '';

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">${bucket} a receber · ${nome}/${ano}</p>
        <p class="text-2xl font-bold ${cor} font-montserrat tracking-tight mb-2">${formatMoeda(valorBase)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px]">Valor <strong>${bucket === 'Salário' ? 'líquido' : 'do adiantamento'}</strong> a receber${dataCredito ? ` em <strong>${dataCredito}</strong> (${diaSemanaCredito})` : ''}.</p>
        ${motivoHtmlResp}
        ${detalhes}
        ${avisoEstimado}
        ${asSugestoes([
            { txt: `Saldo do ${bucket.toLowerCase()}`, q: `Qual meu saldo do ${bucket.toLowerCase()}?` },
            { txt: 'Quando cai?', q: `Quando cai meu ${bucket.toLowerCase()}?` },
            { txt: 'Ver saldo das contas', q: 'Qual meu saldo?' }
        ])}
    `;
}

function asRespExtremosGasto(mes, ano, tipo = 'maior') {
    const nome = nomeMeses[mes];
    const itens = [];

    bancoDeDados.forEach(d => {
        if (d.isAjuste || d.ocultoExtrato) return;
        // Próprio fica fora (não é "gasto" real); terceiro entra.
        if (d.isTransferencia && !d.isTerceiro) return;
        const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
        if (isR) return;
        if (!itemPertenceAoMes(d, mes, ano)) return;

        itens.push({
            nome: d.descricaoOriginal || d.descricao || '—',
            categoria: d.categoria || '—',
            valor: valorFloat(d.valor),
            pago: !!d.pago
        });
    });

    if (itens.length === 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Nenhuma despesa registrada em <strong>${nome}/${ano}</strong>.</p>`;
    }

    itens.sort((a, b) => tipo === 'menor' ? a.valor - b.valor : b.valor - a.valor);
    const top = itens.slice(0, 5);
    const titulo = tipo === 'menor' ? 'Menores gastos' : 'Maiores gastos';
    const cor = tipo === 'menor' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400';

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">${titulo} · ${nome}/${ano}</p>
        <p class="text-[12px] text-slate-500 dark:text-gray-400 mb-3">${itens.length} lançamento${itens.length === 1 ? '' : 's'} no mês. Exibindo ${top.length}.</p>
        <div class="space-y-2">
            ${top.map((it, i) => `
                <div class="flex justify-between items-start gap-3 pb-2 ${i < top.length - 1 ? 'border-b border-slate-200/70 dark:border-[#2a3850]/60' : ''}">
                    <div class="min-w-0 flex-1">
                        <div class="text-[13px] font-semibold text-slate-800 dark:text-gray-100 truncate">${i+1}. ${it.nome}</div>
                        <div class="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">${it.categoria}${it.pago ? '' : ' · pendente'}</div>
                    </div>
                    <div class="font-bold ${cor} whitespace-nowrap">${formatMoeda(it.valor)}</div>
                </div>
            `).join('')}
        </div>
        ${asSugestoes([
            { txt: tipo === 'menor' ? 'E os maiores?' : 'E os menores?', q: tipo === 'menor' ? 'Quais os maiores gastos?' : 'Quais os menores gastos?' },
            { txt: 'Onde gastei mais?', q: 'Onde gastei mais este mês?' }
        ])}
    `;
}

// 🎯 "Qual meu saldo?" devolve o saldo REAL — soma dos saldos atuais
//    de todas as contas (mesma regra do card "Saldos das Contas" no
//    Resumo: só movimentações pagas).
function asRespSaldoReal() {
    let total = 0;
    const linhas = [];
    contasGlobais.forEach(c => {
        let saldo = parseFloat(c.saldoInicial || 0);
        bancoDeDados.forEach(d => {
            if ((d.contaId || 'c_padrao') === c.id && d.pago) {
                const val = valorFloat(d.valor);
                const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
                saldo += isR ? val : -val;
            }
        });
        total += saldo;
        linhas.push({ nome: c.nome, saldo });
    });

    const cor = total >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400';

    // Detalhes por conta (só se houver mais de uma, para não poluir)
    let detalhes = '';
    if (linhas.length > 1) {
        detalhes = `
            <div class="mt-3 pt-3 border-t border-slate-300/60 dark:border-[#2a3850]/60 space-y-1 text-[12px]">
                ${linhas.map(l => {
                    const c = l.saldo >= 0 ? 'text-slate-700 dark:text-gray-200' : 'text-red-600 dark:text-red-400';
                    return `<div class="flex justify-between gap-3"><span class="truncate text-slate-500 dark:text-gray-400">${l.nome}</span><span class="font-semibold ${c}">${formatMoeda(l.saldo)}</span></div>`;
                }).join('')}
            </div>`;
    }

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Saldo real · todas as contas</p>
        <p class="text-2xl font-bold ${cor} font-montserrat tracking-tight mb-2">${formatMoeda(total)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px]">Soma do que você tem hoje nas ${linhas.length} conta${linhas.length === 1 ? '' : 's'}, considerando apenas movimentações <strong>já pagas</strong>.</p>
        ${detalhes}
    `;
}

function asRespMaiorGasto(mes, ano) {
    const d = asCalcularTotaisMes(mes, ano);
    const cats = Object.entries(d.categorias).sort((a, b) => b[1] - a[1]);
    if (cats.length === 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Não há despesas em ${nomeMeses[mes]}/${ano}.</p>`;
    }
    const [nome, val] = cats[0];
    const pct = d.despesas > 0 ? (val / d.despesas) * 100 : 0;
    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Maior gasto · ${nomeMeses[mes]}/${ano}</p>
        <p class="text-lg font-bold text-slate-900 dark:text-gray-100 font-montserrat mb-1">${nome}</p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400 font-montserrat tracking-tight mb-2">${formatMoeda(val)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px]">Representa <strong>${pct.toFixed(1)}%</strong> das suas despesas do mês.</p>
    `;
}

function asRespDataSalario(mes, ano) {
    if (mes === undefined || mes === null) mes = dataFiltro.getMonth();
    if (ano === undefined || ano === null) ano = dataFiltro.getFullYear();

    const qDia = getQuintoDiaUtil(ano, mes);
    const dValeObj = getDiaValeEfetivo(ano, mes);
    const diaSalarioStr = `${String(qDia.getDate()).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}/${ano}`;
    const diaValeStr = `${String(dValeObj.getDate()).padStart(2,'0')}/${String(mes+1).padStart(2,'0')}/${ano}`;

    // Nomes dos dias da semana para enriquecer a resposta
    const diasSemana = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
    const diaSemanaSal = diasSemana[qDia.getDay()];
    const diaSemanaVale = diasSemana[dValeObj.getDay()];

    const motivoVale = getMotivoValeEfetivo(ano, mes);
    const motivoHtml = motivoVale
        ? `<p class="text-[11px] text-amber-600 dark:text-amber-400 mt-2 leading-snug">${motivoVale}</p>`
        : '';

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">Datas previstas · ${nomeMeses[mes]}/${ano}</p>
        <div class="space-y-2.5 text-[13px]">
            <div class="flex justify-between items-baseline gap-3">
                <span class="text-slate-500 dark:text-gray-400">Salário (líquido)</span>
                <div class="text-right">
                    <div class="font-bold text-slate-800 dark:text-gray-100">${diaSalarioStr}</div>
                    <div class="text-[10px] text-slate-400 dark:text-gray-500 capitalize">${diaSemanaSal}</div>
                </div>
            </div>
            <div class="flex justify-between items-baseline gap-3 pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                <span class="text-slate-500 dark:text-gray-400">Vale (adiantamento)</span>
                <div class="text-right">
                    <div class="font-bold text-slate-800 dark:text-gray-100">${diaValeStr}</div>
                    <div class="text-[10px] text-slate-400 dark:text-gray-500 capitalize">${diaSemanaVale}</div>
                </div>
            </div>
        </div>
        ${motivoHtml}
        <p class="text-[11px] text-slate-400 dark:text-gray-500 mt-3 leading-snug">Salário no 5º dia útil · vale no último dia útil até o 20 (sábado conta como útil). Ajuste valores em <strong>Simulador → Parâmetros Base</strong>.</p>
    `;
}

function asCalcularGastosBucket(mes, ano, bucket) {
    let total = 0, pago = 0, pendente = 0;

    bancoDeDados.forEach(d => {
        if (d.isAjuste) return;
        // Terceiro conta; próprio fica fora.
        if (d.isTransferencia && !d.isTerceiro) return;
        const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
        if (isR) return;
        if (!itemPertenceAoMes(d, mes, ano)) return;

        const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        let origem = d.origem;
        if (origem !== 'Vale' && origem !== 'Salário') {
            origem = determinarOrigem(dataRef, d.natureza || 'Despesa', null);
        }
        if (origem !== bucket) return;

        const val = valorFloat(d.valor);
        total += val;
        if (d.pago) pago += val; else pendente += val;
    });

    return { total, pago, pendente };
}

function asRespProjecaoBucket(mes, ano, bucket) {
    const d = asCalcularGastosBucket(mes, ano, bucket);
    const nome = nomeMeses[mes];
    if (d.total === 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Nenhuma despesa lançada no <strong>${bucket}</strong> de ${nome}/${ano}.</p>`;
    }
    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Gastos no ${bucket} · ${nome}/${ano}</p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400 font-montserrat tracking-tight mb-2">${formatMoeda(d.total)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-3">Total de despesas lançadas neste ciclo, <strong>pagas ou não</strong>. É a sua projeção do mês.</p>
        <div class="space-y-1 text-[12px] pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Já pago</span><span class="font-semibold text-green-600 dark:text-green-500">${formatMoeda(d.pago)}</span></div>
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Ainda pendente</span><span class="font-semibold text-amber-600 dark:text-amber-500">${formatMoeda(d.pendente)}</span></div>
        </div>
    `;
}

// 🎯 Gastos de uma categoria específica num mês
function asRespGastosCategoria(mes, ano, catNome) {
    let total = 0, pago = 0, pendente = 0;

    bancoDeDados.forEach(d => {
        if (d.isAjuste) return;
        // Terceiro conta; próprio fica fora.
        if (d.isTransferencia && !d.isTerceiro) return;
        const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
        if (isR) return;
        if (d.categoria !== catNome) return;
        if (!itemPertenceAoMes(d, mes, ano)) return;

        const val = valorFloat(d.valor);
        total += val;
        if (d.pago) pago += val; else pendente += val;
    });

    const nome = nomeMeses[mes];
    if (total === 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Nenhum gasto em <strong>${catNome}</strong> em ${nome}/${ano}.</p>`;
    }
    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Gastos · ${catNome} · ${nome}/${ano}</p>
        <p class="text-2xl font-bold text-red-600 dark:text-red-400 font-montserrat tracking-tight mb-2">${formatMoeda(total)}</p>
        <div class="space-y-1 text-[12px] pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Já pago</span><span class="font-semibold text-green-600 dark:text-green-500">${formatMoeda(pago)}</span></div>
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Ainda pendente</span><span class="font-semibold text-amber-600 dark:text-amber-500">${formatMoeda(pendente)}</span></div>
        </div>
    `;
}

// 🎯 Receitas de um bucket num mês (espelho do asRespProjecaoBucket)
function asRespReceitaBucket(mes, ano, bucket) {
    let total = 0, pago = 0, pendente = 0;

    bancoDeDados.forEach(d => {
        if (d.isAjuste) return;
        // Terceiro conta; próprio fica fora.
        if (d.isTransferencia && !d.isTerceiro) return;
        const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
        if (!isR) return;
        if (!itemPertenceAoMes(d, mes, ano)) return;

        const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        let origem = d.origem;
        if (origem !== 'Vale' && origem !== 'Salário') {
            origem = determinarOrigem(dataRef, d.natureza || 'Receita', null);
        }
        if (origem !== bucket) return;

        const val = valorFloat(d.valor);
        total += val;
        if (d.pago) pago += val; else pendente += val;
    });

    const nome = nomeMeses[mes];
    if (total === 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Nenhuma receita no <strong>${bucket}</strong> em ${nome}/${ano}.</p>`;
    }
    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Receitas no ${bucket} · ${nome}/${ano}</p>
        <p class="text-2xl font-bold text-green-600 dark:text-green-500 font-montserrat tracking-tight mb-2">${formatMoeda(total)}</p>
        <div class="space-y-1 text-[12px] pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Já recebido</span><span class="font-semibold text-green-600 dark:text-green-500">${formatMoeda(pago)}</span></div>
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">A receber</span><span class="font-semibold text-amber-600 dark:text-amber-500">${formatMoeda(pendente)}</span></div>
        </div>
    `;
}

// modo: 'todas' | 'pago' | 'pendente'.
function asCalcularTransferenciasMes(mes, ano, modo = 'todas') {
    const transferencias = [];
    let total = 0, pago = 0, pendente = 0;

    bancoDeDados.forEach(d => {
        if (!d.isTransferencia) return;
        // 🎯 Próprio: só a saída (a entrada é par espelhado, contaria 2x).
        //    Terceiro: cada lado é avulso — saída E entrada entram.
        if (!d.isTerceiro && d.direcao !== 'saida') return;

        if (!itemPertenceAoMes(d, mes, ano)) return;
        if (modo === 'pago' && !d.pago) return;
        if (modo === 'pendente' && d.pago) return;

        const val = valorFloat(d.valor);
        total += val;
        if (d.pago) pago += val; else pendente += val;

        const par = d.isTerceiro ? null : bancoDeDados.find(x => x.transferenciaId === d.transferenciaId && x.id !== d.id);
        const contaDoLanc = contasGlobais.find(c => c.id === (d.contaId || 'c_padrao'));
        let origem, destino;
        if (d.isTerceiro) {
            const nomeTerceiro = d.terceiroNome || 'Terceiro';
            if (d.direcao === 'saida') {
                origem = contaDoLanc ? contaDoLanc.nome : 'Conta';
                destino = nomeTerceiro;
            } else {
                origem = nomeTerceiro;
                destino = contaDoLanc ? contaDoLanc.nome : 'Conta';
            }
        } else {
            const contaPar = par ? contasGlobais.find(c => c.id === (par.contaId || 'c_padrao')) : null;
            origem = contaDoLanc ? contaDoLanc.nome : 'Conta';
            destino = contaPar ? contaPar.nome : 'Conta';
        }

        transferencias.push({
            id: d.id,
            origem,
            destino,
            valor: val,
            data: dataRef,
            dataLancamento: d.dataLancamento,
            observacao: d.observacao || '',
            pago: !!d.pago
        });
    });

    transferencias.sort((a, b) => dataParaNum(b.data) - dataParaNum(a.data));
    return { transferencias, total, pago, pendente };
}

function asRespTransferenciasMes(mes, ano, modo = 'todas') {
    const d = asCalcularTransferenciasMes(mes, ano, modo);
    const nome = nomeMeses[mes];

    if (d.transferencias.length === 0) {
        const labelModo = modo === 'pendente' ? ' pendentes' : modo === 'pago' ? ' efetivadas' : '';
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Nenhuma transferência${labelModo} em <strong>${nome}/${ano}</strong>.</p>`;
    }

    const labelModo = modo === 'pendente' ? ' · pendentes' : modo === 'pago' ? ' · efetivadas' : '';
    const corTotal = modo === 'pendente' ? 'text-amber-600 dark:text-amber-400' : 'text-[#4D6BFE]';

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Transferências${labelModo} · ${nome}/${ano}</p>
        <p class="text-2xl font-bold ${corTotal} font-montserrat tracking-tight mb-2">${formatMoeda(d.total)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-3">${d.transferencias.length} transferência${d.transferencias.length === 1 ? '' : 's'} no mês.</p>
        <div class="space-y-2 pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            ${d.transferencias.map(t => `
                <div class="flex justify-between items-start gap-3">
                    <div class="min-w-0 flex-1">
                        <div class="text-[13px] font-semibold text-slate-800 dark:text-gray-100 truncate">
                            ${t.pago ? '✓' : '⏱'} ${t.origem} → ${t.destino}
                        </div>
                        <div class="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">${t.data}${t.observacao ? ' · ' + t.observacao : ''}</div>
                    </div>
                    <div class="font-bold whitespace-nowrap ${t.pago ? 'text-slate-700 dark:text-gray-200' : 'text-amber-600 dark:text-amber-400'}">${formatMoeda(t.valor)}</div>
                </div>
            `).join('')}
        </div>
        ${d.pendente > 0 && modo === 'todas' ? `<p class="text-[11px] text-amber-600 dark:text-amber-400 mt-2 leading-snug">⏱ <strong>${formatMoeda(d.pendente)}</strong> em transferências pendentes (não afetam saldos).</p>` : ''}
        ${asSugestoes([
            { txt: 'Pendentes', q: 'Tenho transferências pendentes?' },
            { txt: 'Mês passado', q: 'Quanto transferi no mês passado?' }
        ])}
    `;
}

function asRespTransferenciasPendentes(mes, ano) {
    const d = asCalcularTransferenciasMes(mes, ano, 'pendente');
    const nome = nomeMeses[mes];

    if (d.transferencias.length === 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Não há transferências pendentes em <strong>${nome}/${ano}</strong>. Tudo em ordem! ✓</p>`;
    }

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Transferências pendentes · ${nome}/${ano}</p>
        <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 font-montserrat tracking-tight mb-2">${formatMoeda(d.pendente)}</p>
        <p class="text-slate-600 dark:text-gray-300 text-[13px] mb-3">${d.transferencias.length} transferência${d.transferencias.length === 1 ? '' : 's'} aguardando efetivação. Enquanto pendentes, <strong>não movem saldo</strong> das contas.</p>
        <div class="space-y-2 pt-2 border-t border-slate-300/60 dark:border-[#2a3850]/60">
            ${d.transferencias.map(t => `
                <div class="flex justify-between items-start gap-3">
                    <div class="min-w-0 flex-1">
                        <div class="text-[13px] font-semibold text-slate-800 dark:text-gray-100 truncate">${t.origem} → ${t.destino}</div>
                        <div class="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">Vence em ${t.data}</div>
                    </div>
                    <div class="font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">${formatMoeda(t.valor)}</div>
                </div>
            `).join('')}
        </div>
        ${asSugestoes([
            { txt: 'Ver todas', q: 'Quais transferências fiz este mês?' },
            { txt: 'Total transferido', q: 'Quanto transferi este mês?' }
        ])}
    `;
}

function asRespTransferenciasConta(conta) {
    const transferencias = [];
    let totalSaida = 0, totalEntrada = 0;

    bancoDeDados.forEach(d => {
        if (!d.isTransferencia) return;
        // 🎯 Próprio: só a saída (a entrada é par espelhado).
        //    Terceiro: cada lado é avulso — saída E entrada entram.
        if (!d.isTerceiro && d.direcao !== 'saida') return;

        const par = d.isTerceiro ? null : bancoDeDados.find(x => x.transferenciaId === d.transferenciaId && x.id !== d.id);
        const origemId = d.contaId || 'c_padrao';
        const destinoId = par ? (par.contaId || 'c_padrao') : null;

        // 🎯 Filtra por conta envolvida:
        //    • Próprio: a conta precisa ser uma das pontas
        //    • Terceiro: a conta é sempre o contaId (única ponta real)
        if (d.isTerceiro) {
            if (origemId !== conta.id) return;
        } else {
            if (origemId !== conta.id && destinoId !== conta.id) return;
        }

        const val = valorFloat(d.valor);
        // 🎯 `isSaida` pela DIREÇÃO real do lançamento — não mais por `origemId === conta.id`.
        //    Sem isso, um terceiro-entrada (contaId = conta do usuário) seria classificado
        //    como saída por engano.
        const isSaida = (d.direcao === 'saida');
        if (isSaida) totalSaida += val; else totalEntrada += val;

        // 🎯 Contraparte:
        //    • Terceiro      → nome do terceiro
        //    • Próprio saída → nome da conta destino
        //    • Próprio entrada → nome da conta origem
        let contraparte;
        if (d.isTerceiro) {
            contraparte = d.terceiroNome || 'Terceiro';
        } else if (isSaida) {
            contraparte = contasGlobais.find(c => c.id === destinoId)?.nome || '—';
        } else {
            contraparte = contasGlobais.find(c => c.id === origemId)?.nome || '—';
        }

        transferencias.push({
            isSaida,
            valor: val,
            data: d.vencimento || d.dataLancamento,
            pago: !!d.pago,
            contraparte
        });
    });

    if (transferencias.length === 0) {
        return `<p class="text-slate-600 dark:text-gray-300 text-[13px]">Nenhuma transferência envolvendo a conta <strong>${conta.nome}</strong>.</p>`;
    }

    transferencias.sort((a, b) => dataParaNum(b.data) - dataParaNum(a.data));
    const amostra = transferencias.slice(0, 5);
    const saldoLiquido = totalEntrada - totalSaida;
    const cor = saldoLiquido >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400';

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">Transferências · ${conta.nome}</p>
        <div class="space-y-1 text-[12px] mb-3">
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Recebido (entradas)</span><span class="font-semibold text-green-600 dark:text-green-500">+ ${formatMoeda(totalEntrada)}</span></div>
            <div class="flex justify-between gap-3"><span class="text-slate-500 dark:text-gray-400">Enviado (saídas)</span><span class="font-semibold text-red-600 dark:text-red-400">- ${formatMoeda(totalSaida)}</span></div>
            <div class="flex justify-between gap-3 pt-1.5 border-t border-slate-300/60 dark:border-[#2a3850]/60"><span class="font-semibold text-slate-700 dark:text-gray-200">Saldo líquido</span><span class="font-bold ${cor}">${formatMoeda(saldoLiquido)}</span></div>
        </div>
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">Últimas ${amostra.length}</p>
        <div class="space-y-1.5 text-[12px]">
            ${amostra.map(t => `
                <div class="flex justify-between gap-3">
                    <span class="truncate text-slate-600 dark:text-gray-300">${t.isSaida ? '→' : '←'} ${t.contraparte}</span>
                    <span class="whitespace-nowrap font-semibold ${t.isSaida ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-500'}">${t.isSaida ? '-' : '+'} ${formatMoeda(t.valor)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

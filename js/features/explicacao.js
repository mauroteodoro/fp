// Explicação matemática dos valores
'use strict';

// ===================== SISTEMA DE EXPLICAÇÃO MATEMÁTICA =====================
window.mathReal = { desp: 0, vale: {}, sal: {}, geral: {} };

window.mostrarExplicacao = function(alvo) {
    // 🎯 Hoje o único contexto é o REAL. O parâmetro `isProj` foi
    //    removido junto com `window.mathProj` (eram código morto).
    //    Se um dia houver contexto projetado, o parâmetro volta.
    let math = window.mathReal;
    let obj = math[alvo];
    if (!obj) return;
    let html = '';
    let titulo = '';

    // 🎯 Gera a barra de consumo + explicação — usada nos cards de Salário e Vale.
    // Mostra visualmente quanto do disponível (base + receitas) já foi gasto,
    // no mesmo esquema de cores do card real (verde/âmbar/vermelho).
    const gerarBlocoConsumo = (base, rec, desp) => {
        const disponivel = base + rec;
        if (disponivel <= 0 && desp <= 0) return '';
        const pct = disponivel > 0 ? Math.min(100, (desp / disponivel) * 100) : 0;
        const pctTexto = Math.round(pct);
        let corBarra, corTexto;
        if (pct >= 90) { corBarra = 'bg-gradient-to-r from-[#E11D48] to-[#BE123C]'; corTexto = 'text-[#E11D48]'; }
        else if (pct >= 70) { corBarra = 'bg-gradient-to-r from-[#D97706] to-[#B45309]'; corTexto = 'text-[#D97706]'; }
        else { corBarra = 'bg-gradient-to-r from-[#059669] to-[#047857]'; corTexto = 'text-[#059669]'; }

        return `
            <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <div class="space-y-0.5 text-[11px]">
                    ${base > 0 ? `<div class="flex justify-between"><span class="text-slate-500">Base</span><span class="font-semibold text-slate-700 dark:text-gray-300">${formatMoeda(base)}</span></div>` : ''}
                    <div class="flex justify-between"><span class="text-slate-500">Receitas</span><span class="font-semibold text-green-600 dark:text-green-500">+ ${formatMoeda(rec)}</span></div>
                    <div class="flex justify-between pt-1 mt-1 border-t border-slate-200 dark:border-slate-700"><span class="text-slate-700 dark:text-gray-200 font-bold">Disponível</span><span class="font-bold text-slate-800 dark:text-gray-100">${formatMoeda(disponivel)}</span></div>
                </div>
                <div class="flex justify-between items-center mb-1.5 mt-3">
                    <span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Consumo</span>
                    <span class="text-xs font-bold ${corTexto}">${pctTexto}%</span>
                </div>
                <div class="w-full h-1.5 bg-slate-100 dark:bg-[#1a2639] rounded-full overflow-hidden">
                    <div class="h-full ${corBarra} rounded-full transition-all duration-700" style="width: ${pct}%"></div>
                </div>
                <p class="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Gasto de <strong class="text-slate-700 dark:text-gray-200">${formatMoeda(desp)}</strong> de <strong class="text-slate-700 dark:text-gray-200">${formatMoeda(disponivel)}</strong>.
                </p>
            </div>
        `;
    };

    if(alvo === 'desp') {
        titulo = `Despesas do Mês`;
        html = `
            <p class="text-xs text-slate-500 dark:text-slate-400 pb-2 leading-relaxed">Este card mostra o total consolidado de <strong>todas</strong> as despesas do mês, independente da origem (Salário ou Vale). Serve como referência geral do quanto o mês consumiu.</p>
            <div class="flex justify-between items-center py-2 border-t border-slate-200 dark:border-slate-700">
                <span class="font-medium text-slate-500">Soma das despesas no mês:</span> 
                <span class="font-bold text-red-500">${formatMoeda(obj)}</span>
            </div>
        `;
    } else if (alvo === 'vale') {
        titulo = `Cálculo: Saldo do Vale`;
        const ajVale = obj.ajuste || 0;
        const temAjusteVale = Math.abs(ajVale) > 0.005;
        html = `
            ${obj.base > 0 ? `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-500">Valor Base (Holerite):</span> <span class="font-bold text-slate-800 dark:text-gray-200">${formatMoeda(obj.base)}</span></div>` : ''}
            <div class="flex justify-between items-center py-1"><span class="font-medium text-slate-500">Receitas Adicionais:</span> <span class="font-bold text-green-500">+ ${formatMoeda(obj.rec)}</span></div>
            <div class="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700 pb-2.5"><span class="font-medium text-slate-500">Despesas do Vale:</span> <span class="font-bold text-red-500">- ${formatMoeda(obj.desp)}</span></div>
            <div class="flex justify-between items-center py-2.5 text-base"><span class="font-bold text-slate-700 dark:text-gray-200">${temAjusteVale ? 'Saldo Atual (após ajuste):' : 'Saldo Atual:'}</span> <span class="font-extrabold text-slate-900 dark:text-cyan-400">${formatMoeda(obj.total)}</span></div>
            ${gerarBlocoConsumo(obj.base, obj.rec, obj.desp)}
        `;
    } else if (alvo === 'sal') {
        titulo = `Cálculo: Saldo do Salário`;
        if (obj.override !== null && obj.override !== undefined) {
            const ov = obj.override;
            const temAnterior = (ov.valorAnterior !== null && ov.valorAnterior !== undefined);
            html = `
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">Saldo reajustado manualmente em <strong class="text-slate-700 dark:text-gray-200">${ov.data || ''}</strong>.</p>
                <div class="flex justify-between items-center py-1 mt-1"><span class="font-medium text-slate-500">Valor Fixado:</span> <span class="font-bold text-slate-800 dark:text-gray-200">${formatMoeda(ov.valor)}</span></div>
                <div class="flex justify-between items-center py-1"><span class="font-medium text-slate-500">Receitas Adicionais:</span> <span class="font-bold text-green-500">+ ${formatMoeda(ov.recApos || 0)}</span></div>
                <div class="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700 pb-2.5"><span class="font-medium text-slate-500">Despesas Subtraídas:</span> <span class="font-bold text-red-500">- ${formatMoeda(ov.despApos || 0)}</span></div>
                <div class="flex justify-between items-center py-2.5 text-base"><span class="font-bold text-slate-700 dark:text-gray-200">Saldo Atual (após ajuste):</span> <span class="font-extrabold text-amber-600 dark:text-amber-400">${formatMoeda(obj.total)}</span></div>
                ${gerarBlocoConsumo(obj.base, obj.rec, obj.desp)}
            `;
        } else {
            const ajSal = obj.ajuste || 0;
            const temAjusteSal = Math.abs(ajSal) > 0.005;
            // 🐛 Correção: o `obj.total` JÁ INCLUI o ajuste (`+ajusteSalario`),
            //    mas a linha do ajuste ficava invisível — o usuário via
            //    3 valores, somava na cabeça e chegava a um resultado que
            //    não batia com o total. Agora exibimos a linha "Ajustes"
            //    (com cor e sinal corretos) sempre que ela for ≠ 0, e a
            //    borda de separação migra pra ela para o fechamento
            //    visual da conta continuar limpo.
            html = `
                ${obj.base > 0 ? `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-500">Valor Base (Holerite):</span> <span class="font-bold text-slate-800 dark:text-gray-200">${formatMoeda(obj.base)}</span></div>` : ''}
                <div class="flex justify-between items-center py-1"><span class="font-medium text-slate-500">Receitas Adicionais:</span> <span class="font-bold text-green-500">+ ${formatMoeda(obj.rec)}</span></div>
                <div class="flex justify-between items-center py-1${!temAjusteSal ? ' border-b border-slate-200 dark:border-slate-700 pb-2.5' : ''}"><span class="font-medium text-slate-500">Despesas Subtraídas:</span> <span class="font-bold text-red-500">- ${formatMoeda(obj.desp)}</span></div>
                ${temAjusteSal ? `<div class="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700 pb-2.5"><span class="font-medium text-slate-500">Ajustes:</span> <span class="font-bold ${ajSal > 0 ? 'text-green-500' : 'text-red-500'}">${ajSal > 0 ? '+' : '-'} ${formatMoeda(Math.abs(ajSal))}</span></div>` : ''}
                <div class="flex justify-between items-center py-2.5 text-base"><span class="font-bold text-slate-700 dark:text-gray-200">${temAjusteSal ? 'Saldo Atual (após ajuste):' : 'Saldo Atual:'}</span> <span class="font-extrabold text-slate-900 dark:text-cyan-400">${formatMoeda(obj.total)}</span></div>
                ${gerarBlocoConsumo(obj.base, obj.rec, obj.desp)}
            `;
        }
    } else if (alvo === 'geral') {
        titulo = `Cálculo: Saldo Total`;
        // 🎯 Quando o usuário não recebe vale (ou está em PJ), o
        //    bucket "Vale" é inexistente — a linha "Saldo do Vale"
        //    some do modal, e o único componente exibido é o
        //    Salário. Isso alinha o modal com o layout do Resumo,
        //    que também não mostra o card de Vale nesse perfil.
        const temValeBucket = (meuPerfil.temVale !== 'Não') && (meuPerfil.regime !== 'PJ');
        const saldoSalBucket = math.sal.total;
        const saldoValeBucket = math.vale.total;
        if (temValeBucket) {
            html = `
                <div class="flex justify-between items-center py-1.5"><span class="font-medium text-slate-500">Saldo do Salário:</span> <span class="font-bold text-slate-800 dark:text-gray-200">${formatMoeda(saldoSalBucket)}</span></div>
                <div class="flex justify-between items-center py-1.5 border-b border-slate-200 dark:border-slate-700 pb-2.5"><span class="font-medium text-slate-500">Saldo do Vale:</span> <span class="font-bold text-slate-800 dark:text-gray-200">${formatMoeda(saldoValeBucket)}</span></div>
                <div class="flex justify-between items-center py-2.5 text-base"><span class="font-bold text-slate-700 dark:text-gray-200">Saldo Final:</span> <span class="font-extrabold text-slate-900 dark:text-cyan-400">${formatMoeda(obj.total)}</span></div>
            `;
        } else {
            // 🎯 Regime sem vale: o modal NÃO tenta decompor quando
            //    há override — o valor fixado ignora base, receitas
            //    e ajustes por definição. Mostrar "Ajustes: +R$ X"
            //    ao lado de um "Saldo Final" que os ignora confunde.
            //
            //    Duas apresentações possíveis:
            //      • SEM override → decompõe normal (base + rec − desp + ajustes)
            //      • COM override → só a linha "Valor Fixado" + Saldo Final
            const overrideSalObj = math.sal.override;
            const temOverride = overrideSalObj && typeof overrideSalObj === 'object' && overrideSalObj.valor !== undefined;

            if (temOverride) {
                const dataOv = overrideSalObj.data || '';
                const ehLegado = overrideSalObj._legado === true;
                const totalExibido = temValeBucket ? obj.total : math.sal.total;
                html = `
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pb-2">
                        Saldo reajustado manualmente${dataOv ? ' em ' + dataOv : ''}. O valor fixado substitui o cálculo automático até você restaurar.
                    </p>
                    ${ehLegado ? '<p class="text-[10.5px] text-amber-600 dark:text-amber-400 leading-relaxed pb-2">⚠️ Valor de versão anterior. Use <strong>Restaurar</strong> e refaça o ajuste para visualizar datas e valores anteriores.</p>' : ''}
                    <div class="flex justify-between items-center py-1.5 mt-1"><span class="font-medium text-slate-500">Valor Fixado:</span> <span class="font-bold text-slate-800 dark:text-gray-200">${formatMoeda(overrideSalObj.valor)}</span></div>
                    <div class="flex justify-between items-center py-2.5 text-base"><span class="font-bold text-slate-700 dark:text-gray-200">Saldo Final:</span> <span class="font-extrabold text-slate-900 dark:text-cyan-400">${formatMoeda(totalExibido)}</span></div>
                `;
            } else {
                const ajGeral = obj.ajuste || 0;
                const temAjusteGeral = Math.abs(ajGeral) > 0.005;
                html = `
                    ${obj.base > 0 ? `<div class="flex justify-between items-center py-1"><span class="font-medium text-slate-500">Valor Base (Holerite):</span> <span class="font-bold text-slate-800 dark:text-gray-200">${formatMoeda(obj.base)}</span></div>` : ''}
                    <div class="flex justify-between items-center py-1"><span class="font-medium text-slate-500">Receitas Adicionais:</span> <span class="font-bold text-green-500">+ ${formatMoeda(obj.rec)}</span></div>
                    <div class="flex justify-between items-center py-1${!temAjusteGeral ? ' border-b border-slate-200 dark:border-slate-700 pb-2.5' : ''}"><span class="font-medium text-slate-500">Despesas Subtraídas:</span> <span class="font-bold text-red-500">- ${formatMoeda(obj.desp)}</span></div>
                    ${temAjusteGeral ? `<div class="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700 pb-2.5"><span class="font-medium text-slate-500">Ajustes:</span> <span class="font-bold ${ajGeral > 0 ? 'text-green-500' : 'text-red-500'}">${ajGeral > 0 ? '+' : '-'} ${formatMoeda(Math.abs(ajGeral))}</span></div>` : ''}
                    <div class="flex justify-between items-center py-2.5 text-base"><span class="font-bold text-slate-700 dark:text-gray-200">Saldo Final:</span> <span class="font-extrabold text-slate-900 dark:text-cyan-400">${formatMoeda(obj.total)}</span></div>
                `;
            }
        }
    }

    document.getElementById('tituloModalExplicacao').textContent = titulo;
    document.getElementById('corpoModalExplicacao').innerHTML = html;

    window.abrirModalGenerico('modalExplicacao');
}

window.fecharModalExplicacao = function() {
    window.fecharModalGenerico('modalExplicacao');
}

// --- LÓGICA DA ABA RELATÓRIOS E CALENDÁRIO CUSTOMIZADO ---
window.calDataFiltro = new Date();
window.selDataIni = null;
window.selDataFim = null;
window.calStep = 0; // 0 = Início, 1 = Fim

// 🎯 CALENDÁRIO DE RELATÓRIO — abre como MODAL, com seleção de intervalo.
// Mesma pegada do calendário simples, mas com 2 etapas: primeiro clique
// marca o início, segundo clique marca o fim. O rodapé mostra o período
// escolhido em tempo real + botão Aplicar.
window.abrirCalendarioRelatorio = function(e) {
    if(e) e.stopPropagation();

    // Inicializa a seleção com o mês visualizado se ainda não houver nada
    if (!window.selDataIni || !window.selDataFim) {
        window.calDataFiltro = new Date(dataFiltro);
    } else {
        window.calDataFiltro = new Date(window.selDataIni);
    }
    window.calStep = 0;

    window.renderizarCustomCal();
    window.abrirCalendarioGrande('Selecione o período');
}

// 🎯 Renderiza o calendário de RELATÓRIO dentro do modal grande.
// Os 2 primeiros cliques marcam início e fim. Depois disso, qualquer
// clique reinicia o ciclo. Os dias no intervalo ficam destacados em azul claro.
window.renderizarCustomCal = function() {
    const container = document.getElementById('corpoCalendarioGrande');
    if (!container) return;

    const m = window.calDataFiltro.getMonth();
    const y = window.calDataFiltro.getFullYear();

    const strIniSel = window.selDataIni
        ? `${String(window.selDataIni.getDate()).padStart(2,'0')}/${String(window.selDataIni.getMonth()+1).padStart(2,'0')}/${window.selDataIni.getFullYear()}`
        : '—';
    const strFimSel = window.selDataFim
        ? `${String(window.selDataFim.getDate()).padStart(2,'0')}/${String(window.selDataFim.getMonth()+1).padStart(2,'0')}/${window.selDataFim.getFullYear()}`
        : '—';

    const podeAplicar = !!(window.selDataIni && window.selDataFim);

    // 🎯 Seletor de ano — mesma regra do calendário simples: 11 anos
    // base (atual ±5) expandidos para incluir o ano em exibição.
    // 🎯 Mesma faixa fixa do calendário simples: 2026 → 2031.
    const ANO_MIN = 2026;
    const ANO_MAX = 2031;
    let anosListItems = '';
    for (let a = ANO_MIN; a <= ANO_MAX; a++) {
        const isSel = (a === y);
        anosListItems += `<li class="cursor-pointer px-3 py-1.5 text-center font-semibold transition-colors ${isSel ? 'bg-[#4D6BFE]/10 text-[#4D6BFE] dark:bg-[#4D6BFE]/15 dark:text-cyan-400' : 'text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#1a2639]'}" data-ano-selecionado="${isSel}" onclick="window.mudarCalRelatorioAno('${a}', event)">${a}</li>`;
    }

    let html = `
        <div class="flex justify-between items-center mb-4 gap-1">
            <button type="button" onclick="window.mudarCalMes(-1, event)" class="p-2 hover:bg-slate-100 dark:hover:bg-[#1a2639] rounded-full text-slate-500 transition-colors active:scale-90 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div class="flex items-center gap-1 min-w-0">
                <span class="font-bold text-slate-800 dark:text-cyan-400 text-base font-montserrat whitespace-nowrap">${nomeMeses[m]}</span>
                <div class="relative inline-flex items-center ano-chip-wrapper">
                    <button type="button" onclick="window.toggleAnoDropdown('anoDropRelatorio', event)"
                            class="bg-slate-100 dark:bg-[#1a2639] hover:bg-slate-200 dark:hover:bg-[#2a3850] border border-slate-200 dark:border-[#1e2a40] rounded-full font-bold text-slate-800 dark:text-cyan-400 text-sm font-montserrat pl-3 pr-6 py-1 cursor-pointer focus:outline-none focus:ring-0 transition-all active:scale-95 relative">
                        ${y}
                        <svg class="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <div id="anoDropRelatorio" class="ano-dropdown hidden absolute top-full left-1/2 -translate-x-1/2 mt-1 w-24 bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#1e2a40] rounded-xl shadow-2xl z-[9999] py-1">
                        <ul class="text-sm">${anosListItems}</ul>
                    </div>
                </div>
            </div>
            <button type="button" onclick="window.mudarCalMes(1, event)" class="p-2 hover:bg-slate-100 dark:hover:bg-[#1a2639] rounded-full text-slate-500 transition-colors active:scale-90 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center mb-2">
            <div class="text-[11px] font-bold text-slate-400 dark:text-gray-500 py-1">D</div>
            <div class="text-[11px] font-bold text-slate-400 dark:text-gray-500 py-1">S</div>
            <div class="text-[11px] font-bold text-slate-400 dark:text-gray-500 py-1">T</div>
            <div class="text-[11px] font-bold text-slate-400 dark:text-gray-500 py-1">Q</div>
            <div class="text-[11px] font-bold text-slate-400 dark:text-gray-500 py-1">Q</div>
            <div class="text-[11px] font-bold text-slate-400 dark:text-gray-500 py-1">S</div>
            <div class="text-[11px] font-bold text-slate-400 dark:text-gray-500 py-1">S</div>
        </div>
        <div class="grid grid-cols-7 gap-1 text-center pb-1" id="gridCalDiasGrande"></div>
        <div class="mt-3 pt-3 border-t border-slate-100 dark:border-[#1e2a40] flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Período</p>
                <p class="text-xs font-semibold text-slate-700 dark:text-gray-200 truncate">${strIniSel} → ${strFimSel}</p>
            </div>
            <button type="button" id="btnCalAplicarGrande" onclick="window.aplicarCustomCal(event)" class="bg-[#4D6BFE] hover:bg-[#4338CA] text-white text-xs font-bold py-2.5 px-5 rounded-full shadow-md shadow-[#4D6BFE]/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100" ${podeAplicar ? '' : 'disabled'}>Aplicar</button>
        </div>
    `;
    container.innerHTML = html;

    const grid = document.getElementById('gridCalDiasGrande');
    let primeiroDia = new Date(y, m, 1).getDay();
    let diasNoMes = new Date(y, m + 1, 0).getDate();

    for(let i = 0; i < primeiroDia; i++) { grid.innerHTML += `<div></div>`; }

    for(let d = 1; d <= diasNoMes; d++) {
        let dataAtual = new Date(y, m, d);
        dataAtual.setHours(0,0,0,0);

        let timeAtual = dataAtual.getTime();
        let timeIni = window.selDataIni ? window.selDataIni.getTime() : null;
        let timeFim = window.selDataFim ? window.selDataFim.getTime() : null;

        let isIni = timeIni === timeAtual;
        let isFim = timeFim === timeAtual;
        let inRange = timeIni && timeFim && timeAtual > timeIni && timeAtual < timeFim;

        let baseClass = "h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm font-semibold cursor-pointer transition-colors";
        if(isIni || isFim) {
            baseClass += " bg-[#4D6BFE] text-white shadow-md shadow-[#4D6BFE]/30";
        } else if(inRange) {
            baseClass += " bg-[#4D6BFE]/10 dark:bg-[#4D6BFE]/20 text-[#4D6BFE] dark:text-[#93A5FF]";
        } else {
            baseClass += " text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#1a2639]";
        }

        let btn = document.createElement('div');
        btn.className = baseClass;
        btn.textContent = d;
        btn.onclick = (e) => {
            e.stopPropagation();
            if(window.calStep === 0) {
                window.selDataIni = new Date(y, m, d, 0,0,0,0);
                window.selDataFim = null;
                window.calStep = 1;
            } else {
                let clicked = new Date(y, m, d, 0,0,0,0);
                if(clicked < window.selDataIni) {
                    window.selDataIni = clicked;
                    window.selDataFim = null;
                    window.calStep = 1;
                } else {
                    window.selDataFim = clicked;
                    window.calStep = 0;
                }
            }
            window.renderizarCustomCal();
        };
        grid.appendChild(btn);
    }
}

window.mudarCalMes = function(delta, e) {
    if(e) e.stopPropagation();
    window.calDataFiltro.setMonth(window.calDataFiltro.getMonth() + delta);
    window.renderizarCustomCal();
}

// 🎯 Troca SOMENTE o ano no calendário de relatório.
window.mudarCalRelatorioAno = function(ano, e) {
    if(e) e.stopPropagation();
    const a = parseInt(ano, 10);
    if (isNaN(a)) return;
    window.calDataFiltro.setFullYear(a);
    window.renderizarCustomCal();
}

window.aplicarCustomCal = function(e) {
    if(e) e.stopPropagation();
    if(!window.selDataIni || !window.selDataFim) return;

    const strIni = `${String(window.selDataIni.getDate()).padStart(2,'0')}/${String(window.selDataIni.getMonth()+1).padStart(2,'0')}/${window.selDataIni.getFullYear()}`;
    const strFim = `${String(window.selDataFim.getDate()).padStart(2,'0')}/${String(window.selDataFim.getMonth()+1).padStart(2,'0')}/${window.selDataFim.getFullYear()}`;

    document.getElementById('filtroRelDataIni').value = `${window.selDataIni.getFullYear()}${String(window.selDataIni.getMonth()+1).padStart(2,'0')}${String(window.selDataIni.getDate()).padStart(2,'0')}`;
    document.getElementById('filtroRelDataFim').value = `${window.selDataFim.getFullYear()}${String(window.selDataFim.getMonth()+1).padStart(2,'0')}${String(window.selDataFim.getDate()).padStart(2,'0')}`;

    document.getElementById('lblFiltroPeriodo').innerHTML = `<svg class="h-4 w-4 text-slate-900 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><span class="truncate">${strIni} até ${strFim}</span>`;

    window.fecharCalendarioGrande();
}

window.popularFiltrosRelatorio = function() {
    // Inicializa o calendário customizado para o mês atual se estiver vazio
    if (!window.selDataIni || !window.selDataFim) {
        const hAno = dataFiltro.getFullYear();
        const hMes = dataFiltro.getMonth();
        window.selDataIni = new Date(hAno, hMes, 1, 0,0,0,0);
        window.selDataFim = new Date(hAno, hMes + 1, 0, 0,0,0,0);
        window.aplicarCustomCal(null);
    }

    // Contas
    const selConta = document.getElementById('filtroRelConta');
    const lblConta = document.getElementById('lblFiltroConta');
    const listaConta = document.getElementById('listaFiltroConta');
    listaConta.innerHTML = '';
    
    let liCTodas = document.createElement('li');
    liCTodas.className = "cursor-pointer px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#1a2639] border-b border-slate-100 dark:border-[#1e2a40] transition-colors font-bold text-center";
    liCTodas.innerHTML = "Todas as Contas";
    liCTodas.onclick = () => { selConta.value = 'Todas'; lblConta.textContent = 'Todas as Contas'; document.getElementById('menuFiltroConta').classList.add('hidden'); };
    listaConta.appendChild(liCTodas);

    contasGlobais.forEach(c => { 
        let b = BANCOS[c.banco || 'carteira'] || BANCOS['outros'];
        let li = document.createElement('li');
        li.className = "cursor-pointer px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#1a2639] flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-[#1e2a40] last:border-0";
        li.innerHTML = `<div class="w-6 h-6 shrink-0">${renderBankLogo(b)}</div><span class="truncate font-medium">${c.nome}</span>`;
        li.onclick = () => { selConta.value = c.id; lblConta.innerHTML = `<div class="flex items-center gap-2.5 truncate"><div class="w-5 h-5 shrink-0">${renderBankLogo(b)}</div><span class="truncate font-medium mt-0.5">${c.nome}</span></div>`; document.getElementById('menuFiltroConta').classList.add('hidden'); };
        listaConta.appendChild(li);
    });

    // Categorias
    const selCat = document.getElementById('filtroRelCategoria');
    const lblCat = document.getElementById('lblFiltroCategoria');
    const listaCat = document.getElementById('listaFiltroCategoria');
    listaCat.innerHTML = '';
    
    let liCatTodas = document.createElement('li');
    liCatTodas.className = "cursor-pointer px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#1a2639] border-b border-slate-100 dark:border-[#1e2a40] transition-colors font-bold text-center";
    liCatTodas.innerHTML = "Todas as Categorias";
    liCatTodas.onclick = () => { selCat.value = 'Todas'; lblCat.textContent = 'Todas as Categorias'; document.getElementById('menuFiltroCategoria').classList.add('hidden'); };
    listaCat.appendChild(liCatTodas);

    let catsOrdenadas = [...categoriasGlobais].sort((a, b) => a.nome.localeCompare(b.nome));
    catsOrdenadas.forEach(c => { 
        let li = document.createElement('li');
        li.className = "cursor-pointer px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#1a2639] flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-[#1e2a40] last:border-0";
        li.innerHTML = `<span class="text-slate-500 shrink-0">${getSVGIcon(c.icon, 'w-4 h-4')}</span><span class="truncate font-medium">${c.nome}</span>`;
        li.onclick = () => { selCat.value = c.nome; lblCat.innerHTML = `<div class="flex items-center gap-2 truncate"><span class="text-slate-900 dark:text-cyan-400 shrink-0">${getSVGIcon(c.icon, 'w-4 h-4')}</span><span class="truncate font-medium pt-[1px]">${c.nome}</span></div>`; document.getElementById('menuFiltroCategoria').classList.add('hidden'); };
        listaCat.appendChild(li);
    });

    // Popula o filtro de Origem (reage ao regime CLT/PJ do perfil)
    window.popularFiltroOrigem();
}

window.selecionarFiltroTipo = function(val, text) {
    document.getElementById('filtroRelTipo').value = val;
    document.getElementById('lblFiltroTipo').textContent = text;
    document.getElementById('menuFiltroTipo').classList.add('hidden');
}

window.selecionarFiltroStatus = function(val, text) {
    document.getElementById('filtroRelStatus').value = val;
    document.getElementById('lblFiltroStatus').textContent = text;
    document.getElementById('menuFiltroStatus').classList.add('hidden');
}

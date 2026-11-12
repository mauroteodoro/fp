// Sistema de abas e modal de lançamento
'use strict';

// ===================== SISTEMA DE ABAS E MODAL =====================
const abaCaixa = document.getElementById('abaCaixa');
const abaProjecao = document.getElementById('abaProjecao');
const abaRelatorios = document.getElementById('abaRelatorios');

// 🎬 Helper: dispara a animação de fade-in num elemento.
//    O `void offsetWidth` força um reflow, o que reinicia a
//    animação mesmo se ela já estiver aplicada (o browser precisa
//    "ver" a classe ser removida e adicionada de novo).
function fadeInTela(el) {
    if (!el) return;
    el.classList.remove('anim-fade-in');
    void el.offsetWidth;
    el.classList.add('anim-fade-in');
}

// 🎯 Helpers para o estado dos botões do menu lateral.
//    Centralizam a troca de classes para evitar o bug clássico de
//    "especificidade do Tailwind": `dark:text-gray-400` tem seletor
//    (0,2,0) e vence `text-white` (0,1,0). Se o JS só ADICIONA as
//    classes de "ativo" sem REMOVER as de "inativo", o texto do
//    botão ativo continua cinza no dark mode.
//    Com os helpers, é impossível esquecer de remover nada.
function marcarBtnMenuAtivo(el) {
    if (!el) return;
    el.classList.remove(
        'bg-transparent',
        'text-slate-600', 'dark:text-gray-400',
        'hover:bg-slate-50', 'dark:hover:bg-[#1a2639]'
    );
    el.classList.add(
        'bg-[#4D6BFE]', 'text-white',
        'shadow-md', 'shadow-[#4D6BFE]/20'
    );
}

function marcarBtnMenuInativo(el) {
    if (!el) return;
    el.classList.remove(
        'bg-[#4D6BFE]', 'text-white',
        'shadow-md', 'shadow-[#4D6BFE]/20', 'shadow-[#4D6BFE]/30'
    );
    el.classList.add(
        'bg-transparent',
        'text-slate-600', 'dark:text-gray-400',
        'hover:bg-slate-50', 'dark:hover:bg-[#1a2639]'
    );
}

window.abrirTela = function(tela) {
    // 🎯 Rola para o topo sempre que trocar de aba
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 1. Reseta o visual de TODOS os botões do menu lateral
    ['btnMenuResumo', 'btnMenuExtrato', 'btnMenuContas', 'btnMenuRelatorios', 'btnMenuGraficos', 'btnTabProjecao', 'btnMenuAssistente'].forEach(b => {
        marcarBtnMenuInativo(document.getElementById(b));
    });

    // 1b. 🎯 Sincroniza a barra inferior mobile. Cada botão tem
    //     `data-bottom-tela` com o valor da tela; quando bate com a
    //     tela atual, aplica as classes de "ativo" (azul/ciano).
                const chaveTelaBottom = (tela === 'projecao') ? 'simulador' : tela;
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        const ativo = btn.dataset.bottomTela === chaveTelaBottom;
        // 🎯 `is-active-bottom` é a fonte de verdade do estado ativo.
        // O CSS no fim do <style> usa essa classe + `!important` para
        // FORÇAR `color: #4D6BFE` no item ativo, vencendo qualquer
        // utilitário do Tailwind CDN que possa sobrescrever.
        // `text-[#4D6BFE]` continua sendo adicionada por compat, mas
        // quem manda agora é o CSS externo.
        btn.classList.remove('text-[#4D6BFE]', 'dark:text-cyan-400', 'text-slate-500', 'dark:text-gray-400', 'is-active-bottom');
        if (ativo) {
            btn.classList.add('text-[#4D6BFE]', 'is-active-bottom');
        } else {
            btn.classList.add('text-slate-500', 'dark:text-gray-400');
        }
    });

    // 2. Esconde todas as abas principais (Main Containers)
    abaCaixa.classList.remove('block'); abaCaixa.classList.add('hidden');
    abaProjecao.classList.remove('block'); abaProjecao.classList.add('hidden');
    if(abaRelatorios) { abaRelatorios.classList.remove('block'); abaRelatorios.classList.add('hidden'); }
    const abaGraficosEl = document.getElementById('abaGraficos');
    if (abaGraficosEl) { abaGraficosEl.classList.remove('block'); abaGraficosEl.classList.add('hidden'); }
    const abaAssistenteEl = document.getElementById('abaAssistente');
    if (abaAssistenteEl) { abaAssistenteEl.classList.remove('block'); abaAssistenteEl.classList.add('hidden'); }

    // 3. Aplica a lógica dependendo do destino escolhido
    if (tela === 'projecao') {
        abaProjecao.classList.remove('hidden'); abaProjecao.classList.add('block');
        fadeInTela(abaProjecao);
        marcarBtnMenuAtivo(document.getElementById('btnTabProjecao'));
        carregarOuCalcularFolha();
    } else if (tela === 'graficos') {
        const g = document.getElementById('abaGraficos');
        if (g) {
            g.classList.remove('hidden'); g.classList.add('block');
            fadeInTela(g);
            marcarBtnMenuAtivo(document.getElementById('btnMenuGraficos'));
            // Aguarda o browser pintar o canvas com dimensões reais
            // antes de desenhar os gráficos.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (typeof window.renderizarGraficos === 'function') window.renderizarGraficos();
                });
            });
        }
    } else if (tela === 'assistente') {
        const a = document.getElementById('abaAssistente');
        if (a) {
            a.classList.remove('hidden'); a.classList.add('block');
            fadeInTela(a);
            marcarBtnMenuAtivo(document.getElementById('btnMenuAssistente'));
            if (typeof window.asInicializarAba === 'function') window.asInicializarAba();
            setTimeout(() => document.getElementById('inputAssistente')?.focus(), 300);
        }
    } else {
        // É da seção "Meu Caixa" (resumo, extrato ou contas)
        abaCaixa.classList.remove('hidden'); abaCaixa.classList.add('block');
        
        // Esconde as 3 sub-telas
        ['viewResumo', 'viewExtrato', 'viewContas'].forEach(v => {
            const el = document.getElementById(v);
            if(el) { el.classList.remove('block'); el.classList.add('hidden'); }
        });
        
        // Exibe só a escolhida
        const viewNome = 'view' + tela.charAt(0).toUpperCase() + tela.slice(1);
        const viewEl = document.getElementById(viewNome);
        if(viewEl) { viewEl.classList.remove('hidden'); viewEl.classList.add('block'); fadeInTela(viewEl); }
        
        // Pinta o botão correto
        marcarBtnMenuAtivo(document.getElementById('btnMenu' + tela.charAt(0).toUpperCase() + tela.slice(1)));
        
        // 🎯 Repinta os dados ao entrar em Resumo/Extrato.
        //
        // Motivo: `renderizarMesTopo()` só chama `atualizarTabela()`
        // quando `abaCaixa` já está visível. Se o usuário trocou o
        // mês estando no Simulador (ou Gráficos, ou Assistente), o
        // DOM dessas duas views ficou congelado no último render —
        // mostrando um mês diferente do que está no header agora.
        //
        // Chamar `atualizarTabela()` aqui garante que ao aterrissar
        // na view, os dados já refletem `dataFiltro` atual — sem
        // esperar o próximo clique em ‹ ›.
        if (tela === 'resumo' || tela === 'extrato') {
            if (typeof atualizarTabela === 'function') atualizarTabela();
        }
        
        if (tela === 'contas' && typeof window.renderTabelaContasTela === 'function') window.renderTabelaContasTela();
    }
}

window.mudarParaAbaCaixa = function() {
    window.abrirTela('resumo');
    atualizarTabela();
}

window.mudarParaAbaProjecao = function() {
    window.abrirTela('projecao');
}

window._periodoGraficos = 6;
window._modoGraficos = 'real';
window._charts = {};

window.setPeriodoGraficos = function(p) {
    window._periodoGraficos = p;
    document.querySelectorAll('[data-periodo-graf]').forEach(btn => {
        const ativo = parseInt(btn.dataset.periodoGraf) === p;
        btn.className = ativo
            ? 'px-3 h-[32px] text-[11px] font-bold rounded-md transition-all bg-slate-900 text-white shadow-sm'
            : 'px-3 h-[32px] text-[11px] font-bold rounded-md transition-all text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200';
    });
    window.renderizarGraficos();
};

window.setModoGraficos = function(m) {
    window._modoGraficos = m;
    document.querySelectorAll('[data-modo-graf]').forEach(btn => {
        const ativo = btn.dataset.modoGraf === m;
        btn.className = ativo
            ? 'px-3 h-[32px] text-[11px] font-bold rounded-md transition-all bg-slate-900 text-white shadow-sm'
            : 'px-3 h-[32px] text-[11px] font-bold rounded-md transition-all text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200';
    });
    window.renderizarGraficos();
};

function _corTemaGraficos() {
    const ehDark = document.documentElement.classList.contains('dark');
    return {
        texto: ehDark ? '#9ca3af' : '#64748b',
        grade: ehDark ? '#1e2a40' : '#e2e8f0',
        tooltipBg: ehDark ? '#121b2b' : '#0f172a',
        tooltipBorda: ehDark ? '#2a3850' : '#1e293b'
    };
}

function _destruirGraficos() {
    Object.values(window._charts).forEach(c => { try { c.destroy(); } catch(_) {} });
    window._charts = {};
}

window.renderizarGraficos = function() {
    const Chart = window.Chart;
    if (typeof Chart === 'undefined') return;

    const conteudo = document.getElementById('abaGraficos');
    if (!conteudo || conteudo.classList.contains('hidden')) return;

    _destruirGraficos();

    const cores = _corTemaGraficos();
    Chart.defaults.font.family = "'Figtree', 'Inter', -apple-system, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = cores.texto;

    const PALETA_CAT = ['#4D6BFE', '#059669', '#D97706', '#E11D48', '#8b5cf6', '#06b6d4', '#94a3b8'];

    // Real: só efetivadas. Projetado: base do Simulador + pendentes.
    const ehProjetado = window._modoGraficos !== 'real';

    const modoCalc = ehProjetado ? 'todos' : 'pago';

    // KPIs — 4 números-chave com delta vs mês anterior.
    const mesAtual = dataFiltro.getMonth();
    const anoAtual = dataFiltro.getFullYear();
    const prevDt = new Date(anoAtual, mesAtual - 1, 1);

    let totAtual, totPrev;
    if (ehProjetado) {
        const pA = asCalcularSaldoBucket(mesAtual, anoAtual, 'Total');
        const pP = asCalcularSaldoBucket(prevDt.getMonth(), prevDt.getFullYear(), 'Total');
        totAtual = { receitas: (pA.base || 0) + (pA.rec || 0), despesas: pA.desp || 0, saldo: pA.total || 0 };
        totPrev  = { receitas: (pP.base || 0) + (pP.rec || 0), despesas: pP.desp || 0, saldo: pP.total || 0 };
    } else {
        totAtual = asCalcularTotaisMes(mesAtual, anoAtual, 'pago');
        totPrev  = asCalcularTotaisMes(prevDt.getMonth(), prevDt.getFullYear(), 'pago');
    }

    // `inverte: true` para Despesas (subir é ruim).
    const criarDelta = (atual, prev, inverte) => {
        if (prev <= 0.005) return { txt: '—', cor: 'text-slate-400 dark:text-gray-500' };
        const pct = ((atual - prev) / Math.abs(prev)) * 100;
        const subiu = pct > 0.5, desceu = pct < -0.5;
        if (!subiu && !desceu) return { txt: '= igual ao mês anterior', cor: 'text-slate-400 dark:text-gray-500' };
        const bom = inverte ? desceu : subiu;
        return {
            txt: `${subiu ? '↑' : '↓'} ${Math.abs(pct).toFixed(0)}% vs mês anterior`,
            cor: bom ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400'
        };
    };

    // Receitas
    document.getElementById('kpiReceitas').textContent = formatMoeda(totAtual.receitas);
    const dR = criarDelta(totAtual.receitas, totPrev.receitas, false);
    const elDR = document.getElementById('kpiReceitasDelta');
    elDR.textContent = dR.txt; elDR.className = `text-[10px] font-semibold mt-1 ${dR.cor}`;

    // Despesas
    document.getElementById('kpiDespesas').textContent = formatMoeda(totAtual.despesas);
    const dD = criarDelta(totAtual.despesas, totPrev.despesas, true);
    const elDD = document.getElementById('kpiDespesasDelta');
    elDD.textContent = dD.txt; elDD.className = `text-[10px] font-semibold mt-1 ${dD.cor}`;

    // Saldo
    const elKpiSaldo = document.getElementById('kpiSaldo');
    elKpiSaldo.textContent = formatMoeda(totAtual.saldo);
    elKpiSaldo.style.color = totAtual.saldo < -0.005 ? '#E11D48' : (totAtual.saldo > 0.005 ? '#059669' : '');
    const dS = criarDelta(totAtual.saldo, totPrev.saldo, false);
    const elDS = document.getElementById('kpiSaldoDelta');
    elDS.textContent = dS.txt; elDS.className = `text-[10px] font-semibold mt-1 ${dS.cor}`;

    // Taxa de poupança = (receitas - despesas) / receitas * 100
    const taxa = totAtual.receitas > 0.005
        ? ((totAtual.receitas - totAtual.despesas) / totAtual.receitas) * 100
        : null;

    // Despesas ≥ 3× receitas costuma significar "salário não salvo no Simulador".
    const faltaDadosReceita = taxa !== null && taxa < -200;

    const elTaxa = document.getElementById('kpiTaxa');
    const elTaxaHint = document.getElementById('kpiTaxaHint');
    if (taxa === null) {
        elTaxa.textContent = '—%';
        elTaxa.style.color = '';
        elTaxaHint.textContent = 'Sem receitas no mês';
        elTaxaHint.className = 'text-[10px] font-semibold mt-1 text-slate-400 dark:text-gray-500';
    } else if (faltaDadosReceita) {
        // Âmbar: informa, não alarma. Problema é dado faltando.
        elTaxa.textContent = taxa.toFixed(0) + '%';
        elTaxa.style.color = '#D97706';
        elTaxaHint.textContent = 'Salário do mês ainda não salvo?';
        elTaxaHint.className = 'text-[10px] font-semibold mt-1 text-amber-600 dark:text-amber-400';
    } else {
        elTaxa.textContent = taxa.toFixed(0) + '%';
        if (taxa < 0) {
            elTaxa.style.color = '#E11D48';
            elTaxaHint.textContent = 'Gastou mais do que ganhou';
            elTaxaHint.className = 'text-[10px] font-semibold mt-1 text-red-600 dark:text-red-400';
        } else if (taxa >= 20) {
            elTaxa.style.color = '#059669';
            elTaxaHint.textContent = 'Excelente!';
            elTaxaHint.className = 'text-[10px] font-semibold mt-1 text-green-600 dark:text-green-500';
        } else {
            elTaxa.style.color = '#D97706';
            elTaxaHint.textContent = taxa >= 10 ? 'Boa, mas pode melhorar' : 'Atenção ao orçamento';
            elTaxaHint.className = 'text-[10px] font-semibold mt-1 text-amber-600 dark:text-amber-400';
        }
    }

    // Insights automáticos a partir dos dados.
    const insights = [];

    // Insight 1 — saldo do mês (positivo ou negativo)
    if (totAtual.receitas > 0.005) {
        if (taxa < 0) {
            if (faltaDadosReceita) {
                // Receita << despesa: orienta a salvar o Simulador, não a "rever gastos".
                const multiplicador = (totAtual.despesas / totAtual.receitas).toFixed(1).replace('.', ',');
                insights.push({
                    icone: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
                    texto: `Suas despesas (<strong>${formatMoeda(totAtual.despesas)}</strong>) estão <strong>${multiplicador}×</strong> maiores que as receitas registradas (<strong>${formatMoeda(totAtual.receitas)}</strong>). Isso costuma indicar que o <strong>salário do mês ainda não foi salvo no Simulador</strong>.`,
                    cor: 'amber'
                });
            } else {
                insights.push({
                    icone: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
                    texto: `Você gastou <strong>${formatMoeda(Math.abs(totAtual.saldo))}</strong> mais do que ganhou ${ehProjetado ? 'na projeção' : 'este mês'}. Hora de rever os gastos.`,
                    cor: 'amber'
                });
            }
        } else if (taxa >= 20) {
            insights.push({
                icone: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
                texto: `Você poupou <strong>${taxa.toFixed(0)}%</strong> da sua renda ${ehProjetado ? 'na projeção do mês' : 'este mês'} (${formatMoeda(totAtual.saldo)}). Excelente ritmo!`,
                cor: 'green'
            });
        }
    }

    // Insight 2 — categoria que mais cresceu vs mês anterior
    if (totAtual.categorias && totPrev.categorias) {
        let maiorAlta = null;
        for (const cat in totAtual.categorias) {
            const a = totAtual.categorias[cat] || 0;
            const b = totPrev.categorias[cat] || 0;
            if (b > 20 && a > b) {
                const pct = ((a - b) / b) * 100;
                if (pct >= 25 && (!maiorAlta || pct > maiorAlta.pct)) maiorAlta = { cat, a, b, pct };
            }
        }
        if (maiorAlta) {
            insights.push({
                icone: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
                texto: `<strong>${maiorAlta.cat}</strong> subiu <strong>+${maiorAlta.pct.toFixed(0)}%</strong> vs o mês anterior (${formatMoeda(maiorAlta.b)} → ${formatMoeda(maiorAlta.a)}).`,
                cor: 'amber'
            });
        }
    }

    // Ritmo do mês: só no modo Real e sem faltaDadosReceita (Insight 1 já cobre).
    if (!ehProjetado && !faltaDadosReceita && totAtual.receitas > 0.005 && totAtual.despesas > 0.005) {
        const diaHoje = new Date().getDate();
        const ultimoDia = new Date(anoAtual, mesAtual + 1, 0).getDate();
        const ehMesAtual = (dataFiltro.getMonth() === new Date().getMonth() && dataFiltro.getFullYear() === new Date().getFullYear());
        if (ehMesAtual && diaHoje <= ultimoDia) {
            const pctMes = (diaHoje / ultimoDia) * 100;
            const pctGasto = (totAtual.despesas / totAtual.receitas) * 100;
            if (pctGasto > pctMes + 15) {
                insights.push({
                    icone: '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 7v5l3 2"/></svg>',
                    texto: `Faltam <strong>${ultimoDia - diaHoje} dias</strong> para o mês acabar e você já gastou <strong>${pctGasto.toFixed(0)}%</strong> do que ganhou. Cuidado com o ritmo.`,
                    cor: 'amber'
                });
            }
        }
    }

    const containerInsights = document.getElementById('grafInsights');
    if (containerInsights) {
        if (insights.length === 0) {
            containerInsights.innerHTML = '';
            containerInsights.classList.add('hidden');
        } else {
            containerInsights.classList.remove('hidden');
            const mapa = {
                green: 'border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400',
                amber: 'border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400',
                red:   'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'
            };
            containerInsights.innerHTML = insights.slice(0, 3).map(ins => `
                <div class="flex items-start gap-3 px-4 py-3 rounded-xl border ${mapa[ins.cor] || mapa.amber} anim-fade-in">
                    ${ins.icone}
                    <p class="text-[12px] leading-relaxed flex-1">${ins.texto}</p>
                </div>
            `).join('');
        }
    }

    const subEvol = document.getElementById('subGrafEvolucao');
    if (subEvol) {
        subEvol.textContent = ehProjetado
            ? 'Receitas × Despesas · projeção do Simulador + pendentes'
            : 'Receitas × Despesas · só efetivadas';
    }

    const labels = [], dadosRec = [], dadosDesp = [];
    const n = window._periodoGraficos;
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() - i, 1);
        labels.push(nomeMeses[d.getMonth()].substring(0, 3) + '/' + String(d.getFullYear()).substring(2));

        if (ehProjetado) {
            const proj = asCalcularSaldoBucket(d.getMonth(), d.getFullYear(), 'Total');
            dadosRec.push((proj.base || 0) + (proj.rec || 0));
            dadosDesp.push(proj.desp || 0);
        } else {
            // Modo Real — só transações efetivadas. Sem projeção.
            const t = asCalcularTotaisMes(d.getMonth(), d.getFullYear(), 'pago');
            dadosRec.push(t.receitas);
            dadosDesp.push(t.despesas);
        }
    }

    const canvasEvol = document.getElementById('graficoEvolucao');
    const ctxEvol = canvasEvol.getContext('2d');
    const gradRec = ctxEvol.createLinearGradient(0, 0, 0, 260);
    gradRec.addColorStop(0, 'rgba(5, 150, 105, 0.32)');
    gradRec.addColorStop(1, 'rgba(5, 150, 105, 0)');
    const gradDesp = ctxEvol.createLinearGradient(0, 0, 0, 260);
    gradDesp.addColorStop(0, 'rgba(225, 29, 72, 0.32)');
    gradDesp.addColorStop(1, 'rgba(225, 29, 72, 0)');

    window._charts.evolucao = new Chart(ctxEvol, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Receitas', data: dadosRec, borderColor: '#059669', backgroundColor: gradRec,
                  fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6,
                  pointHoverBackgroundColor: '#059669', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2.5 },
                { label: 'Despesas', data: dadosDesp, borderColor: '#E11D48', backgroundColor: gradDesp,
                  fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6,
                  pointHoverBackgroundColor: '#E11D48', pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2.5 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1000, easing: 'easeOutQuart' },
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'top', align: 'end', labels: { boxWidth: 9, boxHeight: 9, padding: 14, font: { size: 11, weight: 600 }, usePointStyle: true, pointStyle: 'circle' } },
                tooltip: {
                    backgroundColor: cores.tooltipBg, borderColor: cores.tooltipBorda, borderWidth: 1,
                    padding: 12, cornerRadius: 10,
                    displayColors: true,
                    usePointStyle: true,
                    boxWidth: 7, boxHeight: 7, boxPadding: 5,
                    titleFont: { size: 12, weight: 700 },
                    bodyFont: { size: 12, weight: 600 },
                    bodySpacing: 6,
                    callbacks: { label: c => `  ${c.dataset.label}: ${formatMoeda(c.parsed.y)}` }
                }
            },
            scales: {
                x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 10, weight: 600 } } },
                y: { grid: { color: cores.grade, drawTicks: false }, border: { display: false }, ticks: { font: { size: 10 }, padding: 8, callback: v => 'R$ ' + (Math.abs(v) >= 1000 ? (v/1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k' : v) } }
            }
        }
    });

    // ─── 2) GASTOS POR CATEGORIA (doughnut + legenda externa) ─
    // 🎯 Respeita o modo: 'real' mostra categorias das despesas
    //    já efetivadas; 'projetado' inclui pendentes.
    const tAtual = asCalcularTotaisMes(dataFiltro.getMonth(), dataFiltro.getFullYear(), modoCalc);
    const cats = Object.entries(tAtual.categorias).sort((a, b) => b[1] - a[1]);
    const topCats = cats.slice(0, 6);
    const resto = cats.slice(6).reduce((s, [, v]) => s + v, 0);
    if (resto > 0.005) topCats.push(['Outros', resto]);

    document.getElementById('lblGrafCatMes').textContent = `${nomeMeses[dataFiltro.getMonth()]}/${dataFiltro.getFullYear()} · ${window._modoGraficos === 'real' ? 'efetivadas' : 'inclui pendentes'}`;

    const wrapCat = document.getElementById('wrapGrafCategorias');
    const emptyCat = document.getElementById('emptyGrafCategorias');

    if (topCats.length === 0) {
        wrapCat.classList.add('hidden');
        emptyCat.classList.remove('hidden');
    } else {
        wrapCat.classList.remove('hidden');
        emptyCat.classList.add('hidden');

        const totalCat = topCats.reduce((s, [, v]) => s + v, 0);
        document.getElementById('totalGrafCategorias').textContent = formatMoeda(totalCat);

        // Tooltip desligado (legenda já mostra tudo). Hover destaca a linha correspondente.
        window._charts.categorias = new Chart(document.getElementById('graficoCategorias'), {
            type: 'doughnut',
            data: {
                labels: topCats.map(([nome]) => nome),
                datasets: [{
                    data: topCats.map(([, v]) => v),
                    backgroundColor: PALETA_CAT.slice(0, topCats.length),
                    borderColor: 'transparent',
                    borderWidth: 0,
                    hoverOffset: 8,
                    hoverBorderColor: 'transparent'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                layout: { padding: 6 },
                animation: { animateRotate: true, animateScale: true, duration: 1100, easing: 'easeOutQuart' },
                onHover: (evt, elements) => {
                    const rows = document.querySelectorAll('#legendaCategorias > div');
                    rows.forEach((row, i) => {
                        if (elements.length === 0) {
                            row.style.opacity = '1';
                            row.style.transform = '';
                        } else if (elements[0].index === i) {
                            row.style.opacity = '1';
                            row.style.transform = 'translateX(3px)';
                        } else {
                            row.style.opacity = '0.4';
                            row.style.transform = '';
                        }
                    });
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });

        // Legenda: linha simples, ou linha + barra de progresso se a categoria tiver teto.
        document.getElementById('legendaCategorias').innerHTML = topCats.map((c, i) => {
            const pct = totalCat > 0 ? (c[1] / totalCat) * 100 : 0;
            const orcamento = orcamentosGlobais[c[0]] || 0;

            let linhaOrcamento = '';
            if (orcamento > 0.005) {
                const pctOrc = (c[1] / orcamento) * 100;
                const pctCap = Math.min(100, pctOrc);

                let corBarra, corTexto;
                if (pctOrc >= 100) { corBarra = 'bg-red-500'; corTexto = 'text-red-600 dark:text-red-400'; }
                else if (pctOrc >= 90) { corBarra = 'bg-red-400'; corTexto = 'text-red-600 dark:text-red-400'; }
                else if (pctOrc >= 70) { corBarra = 'bg-amber-500'; corTexto = 'text-amber-600 dark:text-amber-400'; }
                else { corBarra = 'bg-green-500'; corTexto = 'text-slate-400 dark:text-gray-500'; }

                linhaOrcamento = `
                    <div class="pl-[18px] mt-1.5 flex items-center gap-2">
                        <div class="flex-1 h-1.5 bg-slate-200 dark:bg-[#1a2639] rounded-full overflow-hidden">
                            <div class="h-full ${corBarra} rounded-full transition-all duration-500" style="width: ${pctCap}%"></div>
                        </div>
                        <span class="text-[9.5px] font-bold ${corTexto} tabular-nums shrink-0 whitespace-nowrap">
                            ${pctOrc.toFixed(0)}% de ${formatMoeda(orcamento)}
                        </span>
                    </div>
                `;
            }

            return `<div data-cat-row="${i}" class="px-2 py-2 -mx-2 rounded-lg transition-colors cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1a2639]">
                <div class="flex items-center gap-2.5">
                    <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${PALETA_CAT[i]}"></span>
                    <span class="flex-1 text-[12px] font-semibold text-slate-700 dark:text-gray-200 truncate">${c[0]}</span>
                    <span class="text-[10.5px] font-bold text-slate-400 dark:text-gray-500 shrink-0">${pct.toFixed(0)}%</span>
                    <span class="text-[12px] font-bold text-slate-800 dark:text-gray-100 shrink-0 tabular-nums">${formatMoeda(c[1])}</span>
                </div>
                ${linhaOrcamento}
            </div>`;
        }).join('');

        // Hover inverso: legenda → doughnut (via setActiveElements).
        document.querySelectorAll('[data-cat-row]').forEach(row => {
            const idx = parseInt(row.dataset.catRow);
            row.addEventListener('mouseenter', () => {
                const chart = window._charts.categorias;
                if (chart) {
                    chart.setActiveElements([{ datasetIndex: 0, index: idx }]);
                    chart.update('none');
                }
                document.querySelectorAll('[data-cat-row]').forEach(r => {
                    r.style.opacity = r === row ? '1' : '0.45';
                });
            });
            row.addEventListener('mouseleave', () => {
                const chart = window._charts.categorias;
                if (chart) {
                    chart.setActiveElements([]);
                    chart.update('none');
                }
                document.querySelectorAll('[data-cat-row]').forEach(r => {
                    r.style.opacity = '1';
                });
            });
        });

        const legendRows = document.querySelectorAll('#legendaCategorias > div');
        legendRows.forEach((row, i) => {
            const activate = (e) => {
                if (e) e.preventDefault(); // Previne comportamentos padrão no touch (como scroll)
                legendRows.forEach((r, j) => {
                    if (i === j) {
                        r.style.opacity = '1';
                        r.style.transform = 'translateX(3px)';
                    } else {
                        r.style.opacity = '0.4';
                        r.style.transform = '';
                    }
                });
                if (window._charts.categorias) {
                    window._charts.categorias.setActiveElements([{ datasetIndex: 0, index: i }]);
                    window._charts.categorias.update();
                }
            };

            const deactivate = () => {
                legendRows.forEach(r => {
                    r.style.opacity = '1';
                    r.style.transform = '';
                });
                if (window._charts.categorias) {
                    window._charts.categorias.setActiveElements([]);
                    window._charts.categorias.update();
                }
            };

            row.style.cursor = 'pointer';
            // Mouse (Desktop)
            row.addEventListener('mouseenter', activate);
            row.addEventListener('mouseleave', deactivate);
            // Toque (Mobile)
            row.addEventListener('touchstart', activate, { passive: false });
            row.addEventListener('touchend', deactivate);
            row.addEventListener('touchcancel', deactivate);
        });
    }

    // Saldo por conta: real (só pagas) ou projetado (inclui pendentes do mês).
    const nomes = [], saldos = [], coresBar = [];
    const chaveMesGraf = window.chaveMes(dataFiltro);

    contasGlobais.forEach(c => {
        let s = parseFloat(c.saldoInicial || 0);
        bancoDeDados.forEach(d => {
            if ((d.contaId || 'c_padrao') !== c.id) return;

            if (window._modoGraficos === 'real') {
                if (!d.pago) return;
            } else {
                // Projetado: só pendentes DESTE mês (parcelas futuras distantes não entram).
                if (!d.pago) {
                    const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
                    if (!dataRef || dataRef.length !== 10) return;
                    if (dataRef.substring(3) !== chaveMesGraf) return;
                }
            }

            const v = valorFloat(d.valor);
            const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
            s += isR ? v : -v;
        });
        nomes.push(c.nome);
        saldos.push(s);
        coresBar.push(s >= 0 ? '#4D6BFE' : '#E11D48');
    });

    // Atualiza o subtítulo do card de contas
    const subContas = document.getElementById('subGrafContas');
    if (subContas) {
        subContas.textContent = window._modoGraficos === 'real'
            ? 'Saldo real atual'
            : 'Saldo se as pendências deste mês forem quitadas';
    }

    const wrapContas = document.getElementById('wrapGrafContas');
    const emptyContas = document.getElementById('emptyGrafContas');
    if (nomes.length === 0) {
        wrapContas.classList.add('hidden');
        emptyContas.classList.remove('hidden');
    } else {
        wrapContas.classList.remove('hidden');
        emptyContas.classList.add('hidden');

        window._charts.contas = new Chart(document.getElementById('graficoContas'), {
            type: 'bar',
            data: {
                labels: nomes,
                datasets: [{
                    data: saldos,
                    backgroundColor: coresBar,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 26,
                    hoverBackgroundColor: coresBar.map(c => c === '#4D6BFE' ? '#6B85FF' : '#F43F5E')
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 1000, easing: 'easeOutQuart', delay: (ctx) => ctx.dataIndex * 80 },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: cores.tooltipBg, borderColor: cores.tooltipBorda, borderWidth: 1,
                        padding: 12, cornerRadius: 10, displayColors: false,
                        callbacks: { label: c => formatMoeda(c.parsed.x) }
                    }
                },
                scales: {
                    x: { grid: { color: cores.grade, drawTicks: false }, border: { display: false },
                         ticks: { font: { size: 10 }, padding: 8,
                                  callback: v => Math.abs(v) >= 1000 ? 'R$ ' + (v/1000).toFixed(1) + 'k' : 'R$ ' + v } },
                    y: { grid: { display: false }, border: { display: false },
                         ticks: { font: { size: 11, weight: 600 }, padding: 6 } }
                }
            }
        });
    }
};

// --- MOTOR DO CALENDÁRIO SIMPLES (DATA ÚNICA) ---
window.calSimplesDataFiltro = new Date();
window.calSimplesInputAlvo = '';

// 🎯 Abrir e fechar o calendário grande via `style.display`.
// Não usa `abrirModalGenerico` — esse calendário tem seu próprio
// ciclo de vida e não depende de nenhuma classe Tailwind para
// aparecer. O `z-index: 99999` inline garante que ele fica acima
// de qualquer coisa na página.
window.abrirCalendarioGrande = function(titulo) {
    const modal = document.getElementById('modalCalendarioGrande');
    if (!modal) return;
    const tit = document.getElementById('tituloCalendarioGrande');
    if (tit && titulo) tit.textContent = titulo;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.fecharCalendarioGrande = function() {
    const modal = document.getElementById('modalCalendarioGrande');
    if (!modal) return;
    modal.style.display = 'none';

    // 🎯 Só destrava o scroll do body se NÃO houver outro modal aberto
    // por baixo (ex: Novo Lançamento). Sem essa checagem, fechar o
    // calendário dentro do modal de lançamento "soltava" o scroll da
    // página enquanto o modal de trás continuava aberto.
    const outrosAbertos = Array.from(document.querySelectorAll('[id^="modal"]'))
        .filter(m => m.id !== 'modalCalendarioGrande'
                  && m.classList.contains('fixed')
                  && m.classList.contains('inset-0')
                  && !m.classList.contains('hidden'));
    if (outrosAbertos.length === 0) {
        document.body.style.overflow = '';
    }
};

// Liga o X e o clique no backdrop via JS puro (sem depender de
// nenhum listener global nem de `data-fechar-modal`).
(function() {
    const modal = document.getElementById('modalCalendarioGrande');
    const btnX = document.getElementById('btnFecharCalendarioGrande');
    if (modal) {
        modal.addEventListener('click', function(ev) {
            // Fecha se o clique foi no próprio backdrop (não no card)
            if (ev.target === modal) window.fecharCalendarioGrande();
        });
    }
    if (btnX) {
        btnX.addEventListener('click', function(ev) {
            ev.preventDefault();
            ev.stopPropagation();
            window.fecharCalendarioGrande();
        });
    }
})();

window.abrirCalendarioSimples = function(inputId, e) {
    if(e) e.stopPropagation();
    const input = document.getElementById(inputId);
    if (input && input.disabled) return;

    window.calSimplesInputAlvo = inputId;

    let d = new Date();
    if(input && input.value.length === 10) {
        let p = input.value.split('/');
        if(p.length === 3) d = new Date(p[2], p[1]-1, p[0]);
    }
    window.calSimplesDataFiltro = d;

    const titulo = inputId === 'vencimento' ? 'Data de Vencimento'
                 : inputId === 'dataCompra' ? 'Data de Lançamento'
                 : inputId === 'editVencimento' ? 'Data de Vencimento'
                 : inputId === 'editDataCompra' ? 'Data de Compra'
                 : inputId === 'transfData' ? 'Data da Transferência'
                 : 'Selecione a Data';

    window.renderizarCalendarioSimples();
    window.abrirCalendarioGrande(titulo);
}

// 🎯 Renderiza o calendário SIMPLES dentro do modal grande.
// Cada dia é um botão; clicar preenche o input alvo, dispara `blur`
// (para acionar validadores como `verificarVencimentoEfetivada`) e fecha o modal.
window.renderizarCalendarioSimples = function() {
    const container = document.getElementById('corpoCalendarioGrande');
    if (!container) return;

    const m = window.calSimplesDataFiltro.getMonth();
    const y = window.calSimplesDataFiltro.getFullYear();
    const input = document.getElementById(window.calSimplesInputAlvo);

    let valTime = null;
    if(input && input.value.length === 10) {
        let p = input.value.split('/');
        valTime = new Date(p[2], p[1]-1, p[0]).getTime();
    }

    // 🎯 Seletor de ano — 11 anos base (atual ±5) + o ano em exibição.
    // Geramos uma lista de <li> (não <option>), porque o popup do
    // <select> nativo é desenhado pelo SO e NÃO aceita border-radius.
    // Com um dropdown próprio, temos rounded-xl + shadow-2xl iguais
    // aos outros menus do app.
    // 🎯 Faixa fixa: 2026 → 2031. Sem "expandir em volta do ano
    //    atual" — o app é para uso planejado, e a faixa cobre os
    //    próximos 5 anos a partir do lançamento inicial.
    const ANO_MIN = 2026;
    const ANO_MAX = 2031;
    let anosListItems = '';
    for (let a = ANO_MIN; a <= ANO_MAX; a++) {
        const isSel = (a === y);
        anosListItems += `<li class="cursor-pointer px-3 py-1.5 text-center font-semibold transition-colors ${isSel ? 'bg-[#4D6BFE]/10 text-[#4D6BFE] dark:bg-[#4D6BFE]/15 dark:text-cyan-400' : 'text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-[#1a2639]'}" data-ano-selecionado="${isSel}" onclick="window.mudarCalSimplesAno('${a}', event)">${a}</li>`;
    }

    let html = `
        <div class="flex justify-between items-center mb-4 gap-1">
            <button type="button" onclick="window.mudarCalSimplesMes(-1, event)" class="p-2 hover:bg-slate-100 dark:hover:bg-[#1a2639] rounded-full text-slate-500 transition-colors active:scale-90 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div class="flex items-center gap-1 min-w-0">
                <span class="font-bold text-slate-800 dark:text-cyan-400 text-base font-montserrat whitespace-nowrap">${nomeMeses[m]}</span>
                <div class="relative inline-flex items-center ano-chip-wrapper">
                    <button type="button" onclick="window.toggleAnoDropdown('anoDropSimples', event)"
                            class="bg-slate-100 dark:bg-[#1a2639] hover:bg-slate-200 dark:hover:bg-[#2a3850] border border-slate-200 dark:border-[#1e2a40] rounded-full font-bold text-slate-800 dark:text-cyan-400 text-sm font-montserrat pl-3 pr-6 py-1 cursor-pointer focus:outline-none focus:ring-0 transition-all active:scale-95 relative">
                        ${y}
                        <svg class="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                    <div id="anoDropSimples" class="ano-dropdown hidden absolute top-full left-1/2 -translate-x-1/2 mt-1 w-24 bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#1e2a40] rounded-xl shadow-2xl z-[9999] py-1">
                        <ul class="text-sm">${anosListItems}</ul>
                    </div>
                </div>
            </div>
            <button type="button" onclick="window.mudarCalSimplesMes(1, event)" class="p-2 hover:bg-slate-100 dark:hover:bg-[#1a2639] rounded-full text-slate-500 transition-colors active:scale-90 shrink-0">
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
        <div class="grid grid-cols-7 gap-1 text-center pb-1" id="gridDiasSimplesGrande"></div>
    `;
    container.innerHTML = html;

    const grid = document.getElementById('gridDiasSimplesGrande');
    let primeiroDia = new Date(y, m, 1).getDay();
    let diasNoMes = new Date(y, m + 1, 0).getDate();

    let dHoje = new Date(); dHoje.setHours(0,0,0,0); let tHoje = dHoje.getTime();

    for(let i=0; i<primeiroDia; i++) { grid.innerHTML += `<div></div>`; }
    for(let d=1; d<=diasNoMes; d++) {
        let dataAtual = new Date(y, m, d); dataAtual.setHours(0,0,0,0);
        let tAtual = dataAtual.getTime();

        let isSel = tAtual === valTime;
        let isHoje = tAtual === tHoje;

        let baseClass = "h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm font-semibold cursor-pointer transition-colors";
        if(isSel) {
            baseClass += " bg-[#4D6BFE] text-white shadow-md shadow-[#4D6BFE]/30";
        } else if(isHoje) {
            baseClass += " bg-[#4D6BFE]/10 border border-[#4D6BFE]/30 text-[#4D6BFE] dark:bg-[#4D6BFE]/20 dark:border-[#4D6BFE]/40 dark:text-[#93A5FF]";
        } else {
            baseClass += " text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-[#1a2639]";
        }

        let btn = document.createElement('div');
        btn.className = baseClass;
        btn.textContent = d;
        btn.onclick = (e) => {
            e.stopPropagation();
            const strD = `${String(d).padStart(2,'0')}/${String(m+1).padStart(2,'0')}/${y}`;

            // 🎯 Feedback visual: pinta o dia clicado em azul ANTES de fechar
            // o modal. Sem isso, o modal some no mesmo frame do clique e o
            // usuário não vê qual dia selecionou.
            btn.classList.remove('text-slate-700', 'dark:text-gray-300', 'hover:bg-slate-100', 'dark:hover:bg-[#1a2639]');
            btn.classList.add('bg-[#4D6BFE]', 'text-white', 'shadow-md', 'shadow-[#4D6BFE]/30');

            setTimeout(() => {
                if (input) {
                    input.value = strD;
                    input.dispatchEvent(new Event('blur'));
                }
                window.fecharCalendarioGrande();
            }, 220);
        };
        grid.appendChild(btn);
    }
}

window.mudarCalSimplesMes = function(delta, e) {
    if(e) e.stopPropagation();
    window.calSimplesDataFiltro.setMonth(window.calSimplesDataFiltro.getMonth() + delta);
    window.renderizarCalendarioSimples();
}

// 🎯 Troca SOMENTE o ano, mantendo o mês em exibição.
window.mudarCalSimplesAno = function(ano, e) {
    if(e) e.stopPropagation();
    const a = parseInt(ano, 10);
    if (isNaN(a)) return;
    window.calSimplesDataFiltro.setFullYear(a);
    window.renderizarCalendarioSimples();
}

// 🎯 Abre/fecha o dropdown de ano. Fecha todos os outros antes de
// abrir (comportamento "acordeão"), e rola até o ano atualmente
// selecionado para o usuário não precisar caçar.
window.toggleAnoDropdown = function(id, e) {
    if (e) e.stopPropagation();
    const el = document.getElementById(id);
    if (!el) return;
    const estavaAberto = !el.classList.contains('hidden');
    document.querySelectorAll('.ano-dropdown').forEach(d => d.classList.add('hidden'));
    if (!estavaAberto) {
        el.classList.remove('hidden');
        // requestAnimationFrame garante que o layout já existe para o scrollIntoView
        requestAnimationFrame(() => {
            const sel = el.querySelector('[data-ano-selecionado="true"]');
            if (sel) sel.scrollIntoView({ block: 'nearest' });
        });
    }
};

// 🎯 Fecha qualquer .ano-dropdown aberto quando o clique foi fora
// do chip (que tem a classe .ano-chip-wrapper). Registrado UMA vez.
document.addEventListener('click', (e) => {
    if (!e.target.closest('.ano-chip-wrapper')) {
        document.querySelectorAll('.ano-dropdown').forEach(d => d.classList.add('hidden'));
    }
});

window.selecionarHojeCalSimples = function(e) {
    if(e) e.stopPropagation();
    window.calSimplesDataFiltro = new Date();
    window.renderizarCalendarioSimples();
}

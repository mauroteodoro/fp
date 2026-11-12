// Alerta de vencimentos
'use strict';

// ═══════════════════════════════════════════════════════════════
// 🚨 ALERTA DE VENCIMENTOS
// ═══════════════════════════════════════════════════════════════
// Detecta e exibe, ao abrir o app, contas que precisam de atenção:
//   • ATRASADAS   → vencimento passado, ainda pendentes
//   • VENCE HOJE  → vencimento é hoje
//   • VENCE AMANHÃ → vencimento é amanhã
//
// Critérios:
//   • Só despesas (não receitas)
//   • Só pendentes
//   • Ignora ajustes, transferências próprias e ocultos
//   • Recorrentes: respeita o status real de `pagamentos[anoMesStr]`
//
// Frequência: UMA VEZ POR DIA (localStorage com a data local).
// Quando os itens forem resolvidos, o alerta para de aparecer.

function _alertasVencimentoHoje() {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    return h;
}

function _alertasVencimentoColetar() {
    const hoje = _alertasVencimentoHoje();
    const hojeNum = hoje.getTime();
    const amanhaNum = hojeNum + 86400000;

    const atrasadas = [];
    const hojeItens = [];
    const amanhaItens = [];

    bancoDeDados.forEach(d => {
        if (d.isAjuste || d.ocultoExtrato) return;
        // Transferência entre contas próprias não é obrigação financeira.
        if (d.isTransferencia && !d.isTerceiro) return;
        // Só despesas
        const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
        if (isR) return;

        const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        if (!dataRef || dataRef.length !== 10) return;

        // Status de pagamento (recorrentes olham o mapa de meses)
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
        const tVenc = dtVenc.getTime();

        const item = {
            id: d.id,
            descricao: d.descricaoOriginal || d.descricao || '—',
            valor: valorFloat(d.valor),
            vencimento: dataRef,
            categoria: d.categoria || '—',
            diasAtraso: 0
        };

        if (tVenc < hojeNum) {
            item.diasAtraso = Math.round((hojeNum - tVenc) / 86400000);
            atrasadas.push(item);
        } else if (tVenc === hojeNum) {
            hojeItens.push(item);
        } else if (tVenc === amanhaNum) {
            amanhaItens.push(item);
        }
    });

    // Atrasadas: as mais antigas primeiro (mais críticas).
    atrasadas.sort((a, b) => b.diasAtraso - a.diasAtraso);
    hojeItens.sort((a, b) => a.descricao.localeCompare(b.descricao));
    amanhaItens.sort((a, b) => a.descricao.localeCompare(b.descricao));

    return { atrasadas, hojeItens, amanhaItens };
}

window.verificarAlertasVencimento = function(forcar) {
    // Data LOCAL (não toISOString, que devolveria UTC).
    const hj = new Date();
    const hojeStr = `${hj.getFullYear()}-${String(hj.getMonth()+1).padStart(2,'0')}-${String(hj.getDate()).padStart(2,'0')}`;
    if (!forcar && localStorage.getItem('alertaVencimentosDia') === hojeStr) return;

    const { atrasadas, hojeItens, amanhaItens } = _alertasVencimentoColetar();
    const total = atrasadas.length + hojeItens.length + amanhaItens.length;
    if (total === 0) return;

    // Não compete com um modal que o usuário já abriu.
    const algumModalAberto = Array.from(document.querySelectorAll('[id^="modal"]'))
        .some(m => !m.classList.contains('hidden') && m.style.display !== 'none');
    if (algumModalAberto) return;

    // Marca como mostrado
    localStorage.setItem('alertaVencimentosDia', hojeStr);

    const iconeEl = document.getElementById('iconeAlertaHeader');
    const tituloEl = document.getElementById('tituloAlertaVenc');
    const subEl = document.getElementById('subtituloAlertaVenc');

    // Cabeçalho assume o tom do item mais crítico: atrasadas > hoje > amanhã.
    if (atrasadas.length > 0) {
        iconeEl.className = 'w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
        iconeEl.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>';
        tituloEl.textContent = 'Contas atrasadas';
    } else if (hojeItens.length > 0) {
        iconeEl.className = 'w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
        iconeEl.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l4 2"/></svg>';
        tituloEl.textContent = 'Vencendo hoje';
    } else {
        iconeEl.className = 'w-11 h-11 rounded-full flex items-center justify-center shrink-0 bg-[#4D6BFE]/10 dark:bg-[#4D6BFE]/20 text-[#4D6BFE]';
        iconeEl.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 2"/></svg>';
        tituloEl.textContent = 'Vencendo em breve';
    }

    const partes = [];
    if (atrasadas.length > 0) partes.push(`<strong class="text-red-600 dark:text-red-400">${atrasadas.length}</strong> atrasada${atrasadas.length === 1 ? '' : 's'}`);
    if (hojeItens.length > 0) partes.push(`<strong class="text-amber-600 dark:text-amber-400">${hojeItens.length}</strong> hoje`);
    if (amanhaItens.length > 0) partes.push(`<strong class="text-slate-700 dark:text-gray-200">${amanhaItens.length}</strong> amanhã`);
    subEl.innerHTML = partes.join(' · ');

    // ─── Lista de itens agrupados por urgência ────────────────
    const lista = document.getElementById('listaAlertasVenc');
    lista.innerHTML = '';

    const criarGrupo = (titulo, cor, itens, badgeTexto, badgeClasse) => {
        if (itens.length === 0) return;
        const header = document.createElement('div');
        header.className = `px-2 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider ${cor}`;
        header.textContent = titulo;
        lista.appendChild(header);

        itens.forEach(it => {
            const row = document.createElement('div');
            row.className = 'px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-[#1a2639] transition-colors flex items-center gap-3';
            const badge = badgeTexto
                ? `<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${badgeClasse}">${badgeTexto}</span>`
                : '';
            const diasExtra = it.diasAtraso > 1
                ? ` · ${it.diasAtraso}d`
                : '';
            row.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 mb-0.5">
                        ${badge}
                        <span class="text-[10px] text-slate-400 dark:text-gray-500">${it.vencimento}${diasExtra}</span>
                    </div>
                    <div class="text-[13px] font-semibold text-slate-800 dark:text-gray-100 truncate">${it.descricao}</div>
                    <div class="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 truncate">${it.categoria}</div>
                </div>
                <div class="text-right shrink-0">
                    <div class="text-[13px] font-bold text-red-600 dark:text-red-400 whitespace-nowrap">${formatMoeda(it.valor)}</div>
                </div>
            `;
            lista.appendChild(row);
        });
    };

    criarGrupo('🚨 Atrasadas', 'text-red-600 dark:text-red-400', atrasadas, null, null);
    criarGrupo('⏰ Vencem hoje', 'text-amber-600 dark:text-amber-400', hojeItens, 'HOJE', 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400');
    criarGrupo('📅 Vencem amanhã', 'text-slate-600 dark:text-gray-300', amanhaItens, 'AMANHÃ', 'bg-slate-100 dark:bg-[#1a2639] text-slate-600 dark:text-gray-300');

    window.abrirModalGenerico('modalAlertasVencimento');
};

window.fecharAlertaVencimento = function() {
    window.fecharModalGenerico('modalAlertasVencimento');
};

window.irParaExtratoDoAlerta = function() {
    window.fecharAlertaVencimento();
    setTimeout(() => {
        window.abrirTela('extrato');
    }, 320);
};

// Sino do header: neutro sem pendências, âmbar + badge quando há.
window.atualizarIconeAlertaVencimento = function() {
    const btn = document.getElementById('btnAlertaVencimento');
    const badge = document.getElementById('badgeAlertaVenc');
    if (!btn || !badge) return;

    const { atrasadas, hojeItens, amanhaItens } = _alertasVencimentoColetar();
    const total = atrasadas.length + hojeItens.length + amanhaItens.length;

    const baseClasses = 'order-2 sm:order-5 ml-auto sm:ml-0 w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-full flex items-center justify-center shadow-sm transition active:scale-90 relative';

    if (total === 0) {
        // Estado neutro (cinza): passa despercebido.
        btn.className = baseClasses + ' bg-slate-100 dark:bg-[#1a2639] border border-slate-200 dark:border-[#1e2a40] hover:bg-slate-200 dark:hover:bg-[#2a3850] text-slate-500 dark:text-gray-400';
        badge.classList.add('hidden');
    } else {
        // Estado ativo (âmbar): badge vermelho se há atrasada, âmbar caso contrário.
        btn.className = baseClasses + ' bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-800/50 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400';

        badge.textContent = total > 99 ? '99+' : String(total);
        badge.classList.remove('hidden');

        const critico = atrasadas.length > 0;
        badge.className = 'absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-[#121b2b] leading-none ' + (critico ? 'bg-red-500' : 'bg-amber-500');
    }
};

// Clique no sino: reabre o modal mesmo que já tenha sido mostrado hoje.
window.abrirAlertaVencimentoManual = function() {
    const { atrasadas, hojeItens, amanhaItens } = _alertasVencimentoColetar();
    const total = atrasadas.length + hojeItens.length + amanhaItens.length;
    if (total === 0) {
        window.mostrarAviso('Nenhuma conta a vencer nos próximos dias.', 'info');
        return;
    }
    window.verificarAlertasVencimento(true);
};

// Busca global
'use strict';

// ===================== BUSCA GLOBAL =====================
window.abrirBuscaGlobal = function() {
    window.abrirModalGenerico('modalBuscaGlobal');
    setTimeout(() => { document.getElementById('inputBuscaGlobal')?.focus(); }, 150);
};
window.fecharBuscaGlobal = function() {
    window.fecharModalGenerico('modalBuscaGlobal');
    const inp = document.getElementById('inputBuscaGlobal');
    if (inp) inp.value = '';
    const res = document.getElementById('resultadosBuscaGlobal');
    if (res) res.innerHTML = '<p class="text-center py-12 text-slate-400 text-sm">Digite ao menos 2 caracteres para buscar.</p>';
};

window.executarBuscaGlobal = function(termo) {
    const container = document.getElementById('resultadosBuscaGlobal');
    if (!container) return;
    if (!termo || termo.length < 2) {
        container.innerHTML = '<p class="text-center py-12 text-slate-400 text-sm">Digite ao menos 2 caracteres para buscar.</p>';
        return;
    }
    const t = termo.toLowerCase();
    const resultados = bancoDeDados.filter(d => {
        const desc = (d.descricaoOriginal || d.descricao || '').toLowerCase();
        const cat = (d.categoria || '').toLowerCase();
        const sub = (d.subcategoria || '').toLowerCase();
        const obs = (d.observacao || '').toLowerCase();
        return desc.includes(t) || cat.includes(t) || sub.includes(t) || obs.includes(t);
    }).slice(0, 40);

    if (resultados.length === 0) {
        container.innerHTML = '<p class="text-center py-12 text-slate-400 text-sm">Nenhum lançamento encontrado.</p>';
        return;
    }

    container.innerHTML = '';
    resultados.forEach(d => {
        // 🎯 Sempre pelo VENCIMENTO — coerente com o filtro do Extrato.
        const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        const isR = (d.tipo === 'Receita' || d.natureza === 'Receita');
        const catObj = categoriasGlobais.find(c => c.nome === d.categoria);
        const iconeStr = catObj ? catObj.icon : 'tag';

        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'w-full text-left px-3 py-2.5 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-3';
        row.innerHTML = `
            <div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                ${getSVGIcon(iconeStr, 'w-4 h-4')}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-slate-800 truncate">${d.descricaoOriginal || d.descricao}</p>
                <p class="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 truncate">${d.categoria}${d.subcategoria ? ' › ' + d.subcategoria : ''} • ${dataRef || '—'}</p>
            </div>
            <p class="text-sm font-bold shrink-0 ${isR ? 'text-[#059669]' : 'text-[#E11D48]'}">${isR ? '+' : '-'} ${formatMoeda(d.valor)}</p>
        `;
        row.onclick = () => {
            // 🎯 Captura o ID do lançamento ANTES de qualquer
            //    re-renderização — o `d.id` some quando o modal
            //    fecha e a tabela é reconstruída.
            const idAlvo = d.id;

            if (dataRef && dataRef.length === 10) {
                const p = dataRef.split('/');
                const mes = parseInt(p[1]) - 1;
                const ano = parseInt(p[2]);
                dataFiltro.setMonth(mes);
                dataFiltro.setFullYear(ano);
                renderizarMesTopo();
            }
            fecharBuscaGlobal();
            window.abrirTela('extrato');

            // Garante que a tabela reflete o mês certo antes de
            // procurar a linha. Sem isso, em alguns fluxos a view
            // era trocada sem a tabela ser reconstruída.
            if (typeof atualizarTabela === 'function') atualizarTabela();

            // Rola até a linha e pulsa o destaque.
            if (typeof window.destacarLancamentoNoExtrato === 'function') {
                window.destacarLancamentoNoExtrato(idAlvo);
            }
        };
        container.appendChild(row);
    });
};

document.getElementById('btnBuscaGlobal')?.addEventListener('click', window.abrirBuscaGlobal);
document.getElementById('inputBuscaGlobal')?.addEventListener('input', function() {
    executarBuscaGlobal(this.value.trim());
});

// Rola até a linha e pulsa um brilho roxo (WAAPI: coexiste com fade-in).
window.destacarLancamentoNoExtrato = function(id, tentativa) {
    tentativa = tentativa || 0;
    const el = document.querySelector(`[data-transacao-id="${id}"]`);
    if (!el && tentativa < 12) {
        setTimeout(() => window.destacarLancamentoNoExtrato(id, tentativa + 1), 100);
        return;
    }
    if (!el) return;

    // 320ms: espera o modal de busca fechar (280ms) antes de rolar.
    setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.animate(
            [
                { backgroundColor: 'rgba(77, 107, 254, 0.22)', boxShadow: 'inset 3px 0 0 #4D6BFE' },
                { backgroundColor: 'rgba(77, 107, 254, 0.22)', boxShadow: 'inset 3px 0 0 #4D6BFE', offset: 0.7 },
                { backgroundColor: 'rgba(77, 107, 254, 0)',    boxShadow: 'inset 3px 0 0 rgba(77, 107, 254, 0)' }
            ],
            { duration: 2400, easing: 'ease-out', fill: 'none' }
        );
    }, 320);
};

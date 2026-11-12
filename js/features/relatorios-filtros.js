// Filtros de origem e natureza (Relatórios)
'use strict';

// ===== FILTRO DE ORIGEM (Relatórios) =====
// Replica EXATAMENTE a normalização de origem que o Extrato já exibe.
// Assim, filtrar por "Salário" mostra as mesmas linhas que o Extrato
// rotula como "Salário" — sem surpresas para o usuário.
window.obterOrigemItem = function(d) {
    if (d.isTransferencia) return 'Transferência';
    if (d.isAjuste) return 'Ajuste';
    const ehReceita = d.tipo === 'Receita' || d.natureza === 'Receita';

    // PJ: Recebimento (entradas) / Caixa (saídas). Sem ambiguidade.
    if (meuPerfil.regime === 'PJ') {
        return ehReceita ? 'Recebimento' : 'Caixa';
    }

    // CLT: se o usuário fixou origem manualmente, respeita.
    if (d.origem === 'Vale' || d.origem === 'Salário') return d.origem;

    // Senão, deriva da DATA de vencimento (fallback: lançamento).
    const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
    return determinarOrigem(dataRef, d.natureza || d.tipo || 'Despesa', null);
};

window.selecionarFiltroOrigem = function(val, text) {
    document.getElementById('filtroRelOrigem').value = val;
    document.getElementById('lblFiltroOrigem').textContent = text;
    document.getElementById('menuFiltroOrigem').classList.add('hidden');
};

// Popula a lista de origens conforme o regime do perfil (CLT x PJ).
// CLT vê: Salário, Vale, Extra. PJ vê: Recebimento, Caixa.
// "Ajuste" aparece para todos (é universal).
window.popularFiltroOrigem = function() {
    const lista = document.getElementById('listaFiltroOrigem');
    if (!lista) return;
    lista.innerHTML = '';

    const opcoes = [{ val: 'Todas', txt: 'Todas as Origens' }];
    if (meuPerfil.regime === 'PJ') {
        opcoes.push({ val: 'Recebimento', txt: 'Recebimento' });
        opcoes.push({ val: 'Caixa', txt: 'Caixa' });
    } else {
        opcoes.push({ val: 'Salário', txt: 'Salário' });
        // 🎯 "Vale" só entra como opção se o usuário recebe vale.
        // Sem isso, quem não recebe via um filtro de origem que
        // nunca retornaria nada (o Extrato já recalcula esses
        // lançamentos para "Salário").
        if (meuPerfil.temVale !== 'Não') {
            opcoes.push({ val: 'Vale', txt: 'Vale' });
        }
    }
    opcoes.push({ val: 'Ajuste', txt: 'Ajuste' });

    opcoes.forEach((op, i) => {
        const li = document.createElement('li');
        li.className = "cursor-pointer px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#1a2639] transition-colors border-b border-slate-100 dark:border-[#1e2a40] last:border-0";
        if (i === 0) li.classList.add('font-bold', 'text-center');
        li.textContent = op.txt;
        li.onclick = () => window.selecionarFiltroOrigem(op.val, op.txt);
        lista.appendChild(li);
    });
};

window.gerarRelatorio = function() {
    const dataIniVal = document.getElementById('filtroRelDataIni').value; 
    const dataFimVal = document.getElementById('filtroRelDataFim').value; 
    const tipoVal = document.getElementById('filtroRelTipo').value;
    const statusVal = document.getElementById('filtroRelStatus')?.value || 'Todos';
    const contaVal = document.getElementById('filtroRelConta').value;
    const catVal = document.getElementById('filtroRelCategoria').value;
    const origemVal = document.getElementById('filtroRelOrigem')?.value || 'Todas';

    let dtIniNum = 0; let dtFimNum = 99999999;
    if (dataIniVal) dtIniNum = parseInt(dataIniVal);
    if (dataFimVal) dtFimNum = parseInt(dataFimVal);

    let totais = { rec: 0, desp: 0 };
    
    let filtrados = bancoDeDados.filter(d => {
        if (d.ocultoExtrato) return false;

        // ═══════════════════════════════════════════════════════════
        // 🎯 FILTRO DE NATUREZA — 4 modos:
        //    • Transferencia → SÓ transferências (próprias + terceiro)
        //    • Todas / Receita / Despesa → exclui transferências
        //      PRÓPRIAS (dinheiro trocando de bolso); terceiro
        //      permanece (é receita/despesa real).
        // ═══════════════════════════════════════════════════════════
        const ehTransferencia = !!d.isTransferencia;
        if (tipoVal === 'Transferencia') {
            if (!ehTransferencia) return false;
        } else {
            if (ehTransferencia && !d.isTerceiro) return false;
        }

        // 🎯 Filtro de Status (Efetivada = pago; Pendente = !pago)
        if (statusVal === 'Efetivada' && !d.pago) return false;
        if (statusVal === 'Pendente' && d.pago) return false;

        // Data de referência (sempre o vencimento)
        let dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        if (!dataRef || dataRef === '--/--/----') dataRef = d.dataLancamento;
        if (dataRef) {
            let pDt = dataRef.split('/');
            if (pDt.length === 3) {
                let dtRefNum = parseInt(pDt[2] + pDt[1] + pDt[0]);
                if (dtRefNum < dtIniNum || dtRefNum > dtFimNum) return false;
            }
        }

        // Natureza Receita/Despesa — não se aplica ao modo Transferências
        if (tipoVal !== 'Transferencia') {
            let isR = (d.tipo === 'Receita' || d.natureza === 'Receita');
            if (tipoVal === 'Receita' && !isR) return false;
            if (tipoVal === 'Despesa' && isR) return false;
        }

        // Conta, Categoria, Origem
        if (contaVal !== 'Todas' && (d.contaId || 'c_padrao') !== contaVal) return false;
        if (catVal !== 'Todas' && d.categoria !== catVal) return false;
        if (origemVal !== 'Todas' && window.obterOrigemItem(d) !== origemVal) return false;

        return true;
    });

    const tbody = document.getElementById('tabelaRelatorio');
    tbody.innerHTML = '';

    if (filtrados.length === 0) {
        tbody.innerHTML = '<p class="text-center py-10 text-slate-400 font-medium">Nenhum lançamento encontrado com esses filtros.</p>';
    } else {
        filtrados.sort((a,b) => {
            let pA = (a.vencimento||a.dataLancamento).split('/');
            let dataA = new Date(pA[2], pA[1]-1, pA[0]).getTime();
            let pB = (b.vencimento||b.dataLancamento).split('/');
            let dataB = new Date(pB[2], pB[1]-1, pB[0]).getTime();
            return dataB - dataA;
        });

        filtrados.forEach(d => {
            // 🎯 Própria transferência não entra nos totais (dinheiro
            //    round-trip). Terceiro entra: é receita/despesa real.
            if (d.isTransferencia && !d.isTerceiro) return;
            let isR = (d.tipo === 'Receita' || d.natureza === 'Receita');
            let val = parseFloat(d.valor);
            if (isR) totais.rec += val; else totais.desp += val;

            let iconeSvgStr = 'tag';
            if (d.categoria) {
                const catObj = categoriasGlobais.find(c => c.nome === d.categoria);
                if (catObj) iconeSvgStr = catObj.icon;
            }

            let contaNome = "Carteira Física";
            let cObj = contasGlobais.find(c => c.id === (d.contaId || 'c_padrao'));
            if (cObj) contaNome = cObj.nome;

            const row = document.createElement('div');
            row.className = "flex justify-between items-center py-3.5 px-5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0";
            row.innerHTML = `
                <div class="flex items-center gap-3 w-[60%]">
                    <div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        ${getSVGIcon(iconeSvgStr, 'w-4 h-4')}
                    </div>
                    <div class="truncate">
                        <p class="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5">
                            ${d.isTransferencia ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider shrink-0">Transf.</span>' : ''}
                            <span class="truncate">${d.descricaoOriginal || d.descricao}</span>
                        </p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-wider truncate mt-0.5">${d.vencimento || d.dataLancamento} • ${contaNome}</p>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end">
                    <p class="text-base font-bold tracking-tight ${isR ? 'text-green-600' : 'text-red-500'}">${isR ? '+' : '-'} ${formatMoeda(val)}</p>
                    <p class="text-[9px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">${d.categoria}</p>
                </div>
            `;
            tbody.appendChild(row);
        });
    }

    document.getElementById('relTotRec').textContent = formatMoeda(totais.rec);
    document.getElementById('relTotDesp').textContent = formatMoeda(totais.desp);
    let saldo = totais.rec - totais.desp;
    
    const elSaldo = document.getElementById('relTotSaldo');
    elSaldo.textContent = formatMoeda(Math.abs(saldo));
    
    if(saldo < -0.005) {
        elSaldo.textContent = '- ' + formatMoeda(Math.abs(saldo));
        elSaldo.className = 'text-2xl font-bold text-red-600 dark:text-red-400 font-montserrat tracking-tight';
    } else if (saldo > 0.005) {
        elSaldo.className = 'text-2xl font-bold text-green-600 dark:text-green-500 font-montserrat tracking-tight';
    } else {
        elSaldo.className = 'text-2xl font-bold text-slate-900 dark:text-cyan-400 font-montserrat tracking-tight';
    }
}

window.abrirModalLancamento = function(natureza) {
    document.getElementById('menuAcaoPrincipal').classList.add('hidden');

    // Garante que outras telas sejam fechadas primeiro para não encavalar
    if (!document.getElementById('modalContas').classList.contains('hidden')) fecharModalContas();
    if (!document.getElementById('modalPerfil').classList.contains('hidden')) fecharModalPerfil();
    if (!document.getElementById('modalEdicao').classList.contains('hidden')) fecharModalEdicao();

    setNatureza(natureza);
    // Reseta para garantir estado limpo (tipo À Vista, datas, toggle Compor, Efetivada)
    if (typeof resetarFormularioLancamento === 'function') resetarFormularioLancamento();
    window.abrirModalGenerico('modalNovoLancamento', 'block', 'formArea');
}

window.fecharModalLancamento = function() {
    window.fecharModalGenerico('modalNovoLancamento', 'block', 'formArea');
}

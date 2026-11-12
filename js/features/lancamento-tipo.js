// Tipo da compra e marcação de pago
'use strict';

// ===================== LÓGICA DE TIPO DA COMPRA =====================
const inputTipoCompra = document.getElementById('tipoCompra'); const btnTipoCompra = document.getElementById('btnTipoCompra'); const menuTipoCompra = document.getElementById('menuTipoCompra'); const listaTipoCompra = document.getElementById('listaTipoCompra'); const lblTipoCompra = document.getElementById('lblTipoCompra');
const tiposCompra = ["À Vista", "A Prazo", "Recorrente"];

function renderListaTiposCompra() {
    const listaTipoCompra = document.getElementById('listaTipoCompra');
    const inputTipoCompra = document.getElementById('tipoCompra');
    const lblTipoCompra = document.getElementById('lblTipoCompra');
    const menuTipoCompra = document.getElementById('menuTipoCompra');
    
    listaTipoCompra.innerHTML = '';
    const mapTipos = [
        { val: 'À Vista', label: 'Não recorrente' },
        { val: 'A Prazo', label: 'Parcelar' },
        { val: 'Recorrente', label: 'Fixa mensal' }
    ];
    mapTipos.forEach(tipo => {
        const li = document.createElement('li'); 
        li.className = "cursor-pointer px-4 py-3 sm:py-2 hover:bg-slate-100 dark:hover:bg-[#1a2639] flex items-center transition-colors font-medium text-slate-700 dark:text-gray-200 border-b border-slate-100 dark:border-[#1e2a40] last:border-0";
        li.innerHTML = `<span>${tipo.label}</span>`;
        li.addEventListener('click', () => { 
            inputTipoCompra.value = tipo.val; 
            lblTipoCompra.innerHTML = `<span>${tipo.label}</span>`; 
            menuTipoCompra.classList.add('hidden'); 
            window.dispararMudancaTipo();
        });
        listaTipoCompra.appendChild(li);
    });
}
renderListaTiposCompra();
btnTipoCompra.addEventListener('click', (e) => {
    const box = document.getElementById('boxRateio');
    // 🎯 TOGGLE: se o painel de parcelamento está aberto, fechar e voltar
    // ao dropdown normal. Caso contrário, abre a lista de tipos de compra.
    if (box && !box.classList.contains('hidden')) {
        e.stopPropagation();
        box.classList.add('hidden');
        // Reseta o valor para "Não recorrente" para não deixar um parcelado órfão
        const inpTipo = document.getElementById('tipoCompra');
        if (inpTipo) {
            inpTipo.value = 'À Vista';
            document.getElementById('lblTipoCompra').innerHTML = '<span>Não recorrente</span>';
            if (typeof window.dispararMudancaTipo === 'function') window.dispararMudancaTipo();
        }
        return;
    }
    window.abrirMenuExclusivo('menuTipoCompra', e);
});
document.getElementById('btnPeriodicidade')?.addEventListener('click', (e) => {
    // Sincroniza os checkmarks com o valor atual antes de abrir
    const val = document.getElementById('periodicidadeParcelamento').value;
    document.querySelectorAll('#listaPeriodicidade li').forEach(li => {
        const check = li.querySelector('.check-periodicidade');
        if (!check) return;
        if (li.dataset.valor === val) check.classList.remove('hidden');
        else check.classList.add('hidden');
    });
    window.abrirMenuExclusivo('menuPeriodicidade', e);
});

// ===================== BOLINHA PAGO COM TIMESTAMP =====================
window.togglePago = function(idUnico, anoMesStr) {
    let item = bancoDeDados.find(d => d.id === idUnico);
    if(item) {
        // 🎯 Só Ajustes Manuais são imutáveis (nascem pagos e representam correções de saldo).
        if (item.subcategoria === 'Ajuste Manual' || item.isAjuste) return;

        let timestamp = getTimestampAtual();
        let efData = item.dataEfetivacao || item.vencimento || item.vencimentoOriginal || item.dataLancamento;

        if (item.isTransferencia) {
            // ═══════════════════════════════════════════════════════
            // 🎯 Transferência: alterna AMBOS os lançamentos do par
            // ═══════════════════════════════════════════════════════
            // Uma transferência entre contas próprias é atômica: se o
            // dinheiro sai de uma conta, PRECISA entrar na outra.
            // Sem essa sincronização, o saldo de uma conta mudaria
            // sem a outra acompanhar — corrompendo o total.
            //
            // 🎯 Terceiro: só existe UM lado (saída OU entrada), então
            // não há par a sincronizar. O toggle age só no próprio.
            const par = item.isTerceiro
                ? null
                : bancoDeDados.find(d => d.transferenciaId === item.transferenciaId && d.id !== item.id);
            const novoEstado = !item.pago;

            item.pago = novoEstado;
            item.dataPagamento = novoEstado ? timestamp : null;
            if (novoEstado && !item.dataEfetivacao) item.dataEfetivacao = efData;

            if (par) {
                par.pago = novoEstado;
                par.dataPagamento = novoEstado ? timestamp : null;
                if (novoEstado && !par.dataEfetivacao) par.dataEfetivacao = efData;
                salvarDespesaFirestore(par);
            }
        } else if(item.isRecorrente) {
            if(!item.pagamentos) item.pagamentos = {};
            if(item.pagamentos[anoMesStr]) { item.pagamentos[anoMesStr] = false; } else { item.pagamentos[anoMesStr] = timestamp; item.dataEfetivacao = efData; }
        } else {
            item.pago = !item.pago; 
            item.dataPagamento = item.pago ? timestamp : null;
            if(item.pago && !item.dataEfetivacao) item.dataEfetivacao = item.vencimento;
        }

        salvarDespesaFirestore(item);
        atualizarTabela();

        // 🎯 Atualiza também os cards do carrossel/aba Contas — o
        //    status "pago" muda o cálculo de saldo real das contas.
        if(typeof renderizarCarrosselContas === 'function') renderizarCarrosselContas();
        if(typeof renderTabelaContasTela === 'function') renderTabelaContasTela();
    }
}

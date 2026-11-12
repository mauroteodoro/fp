// Criar, editar e excluir lançamentos
'use strict';

// ===================== CRUD MEU CAIXA =====================
const inputDescricaoForm = document.getElementById('descricao'); const inputValorForm = document.getElementById('valor');
const inputDataCompra = document.getElementById('dataCompra'); 
const inputCategoria = document.getElementById('categoria'); const inputSubcategoria = document.getElementById('subcategoria');
const inputParcelas = document.getElementById('qtdParcelas'); const inputVencimento = document.getElementById('vencimento');
const boxRateio = document.getElementById('boxRateio'); const btnLancar = document.getElementById('btnLancar'); 
const inputParcAtual = document.getElementById('parcAtual'); const inputObservacao = document.getElementById('observacao');

// aplicarMascaraData() fica em js/core/utils.js (também é usada por transferencias.js).
aplicarMascaraData(inputVencimento); 
aplicarMascaraData(document.getElementById('editVencimento'));
aplicarMascaraData(inputDataCompra); 
aplicarMascaraData(document.getElementById('editDataCompra'));
aplicarMascaraData(document.getElementById('editDataEfetivacao'));
aplicarMascaraData(document.getElementById('transfData'));

inputDataCompra.value = getHojeFormatado();
document.getElementById('vencimento').value = getHojeFormatado();
let hasManuallyToggledEfetivada = false;
const chkEfetivada = document.getElementById('chkEfetivada');
const lblEfetivadaText = document.getElementById('lblEfetivadaText');

if (chkEfetivada) {
    chkEfetivada.addEventListener('change', () => {
        hasManuallyToggledEfetivada = true;
        atualizarLabelEfetivada();
    });
}

function atualizarLabelEfetivada() {
    if (!chkEfetivada || !lblEfetivadaText) return;
    lblEfetivadaText.textContent = chkEfetivada.checked ? 'Efetivada' : 'Pendente';
    lblEfetivadaText.className = chkEfetivada.checked 
? 'text-sm font-bold text-slate-800 dark:text-gray-200 cursor-pointer select-none' 
: 'text-sm font-bold text-slate-400 cursor-pointer select-none';

    const iconBox = document.getElementById('iconEfetivada');
    if (iconBox) {
if (chkEfetivada.checked) {
    iconBox.innerHTML = `<svg class="w-4 h-4 text-green-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
} else {
    iconBox.innerHTML = `<svg class="w-4 h-4 text-amber-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
}
    }
}

function verificarVencimentoEfetivada() {
    if(hasManuallyToggledEfetivada || !chkEfetivada) return; 
    const inputVencimento = document.getElementById('vencimento');
    if(!inputVencimento) return;
    
    let vStr = inputVencimento.value;
    if(vStr.length === 10) {
        let p = vStr.split('/');
        let dtVenc = new Date(p[2], p[1]-1, p[0]);
        let dtHoje = new Date(); dtHoje.setHours(0,0,0,0);
        if(dtVenc > dtHoje) {
            chkEfetivada.checked = false;
            atualizarLabelEfetivada();
            hasManuallyToggledEfetivada = true; 
        }
    }
}
const inputVencEl = document.getElementById('vencimento');
if (inputVencEl) inputVencEl.addEventListener('blur', verificarVencimentoEfetivada);

window.ajustarParcela = function(campoId, delta) {
    const el = document.getElementById(campoId);
    if (!el) return;
    let val = parseInt(el.value) || 1;
    val += delta;

    const parcEl = document.getElementById('parcAtual');
    const qtdEl = document.getElementById('qtdParcelas');

    if (campoId === 'parcAtual') {
        if (val < 1) val = 1;
        const qtdAtual = parseInt(qtdEl.value) || 2;
        if (val > qtdAtual) val = qtdAtual;
    } else if (campoId === 'qtdParcelas') {
        const parcAtual = parseInt(parcEl.value) || 1;
        if (val < parcAtual) val = parcAtual;
    }
    el.value = val;

    // Ajusta min do campo Quantidade e força valor mínimo quando Parcela inicial cresce
    if (campoId === 'parcAtual') {
        qtdEl.min = val;
        if ((parseInt(qtdEl.value) || 0) < val) qtdEl.value = val;
    }
    // Se Quantidade for maior que Parcela inicial, tudo OK
};

window.selecionarPeriodicidade = function(val) {
    document.getElementById('periodicidadeParcelamento').value = val;
    document.getElementById('lblPeriodicidade').textContent = val;
    document.getElementById('menuPeriodicidade').classList.add('hidden');
    // Atualiza os checkmarks
    document.querySelectorAll('#listaPeriodicidade li').forEach(li => {
        const check = li.querySelector('.check-periodicidade');
        if (!check) return;
        if (li.dataset.valor === val) check.classList.remove('hidden');
        else check.classList.add('hidden');
    });
};

window.concluirParcelamento = function() {
    const box = document.getElementById('boxRateio');
    if (!box) return;
    box.style.transition = 'opacity 0.2s ease';
    box.style.opacity = '0.6';
    setTimeout(() => {
box.classList.add('hidden');
box.style.opacity = '';
box.style.transition = '';
    }, 200);
    window.mostrarAviso("Parcelamento configurado!", "sucesso");
};

window.selecionarTipoValorParcelado = function(tipo) {
    const inp = document.getElementById('tipoValorParcelado');
    if (!inp) return;
    inp.value = tipo;

    const btnTotal = document.getElementById('btnTipoValorTotal');
    const btnParcela = document.getElementById('btnTipoValorParcela');
    if (!btnTotal || !btnParcela) return;

    const active = ['bg-slate-900', 'text-white', 'shadow-sm'];
    const inactive = ['text-slate-500', 'dark:text-gray-400', 'hover:text-slate-700'];

    const aplicar = (btnAtivo, btnInativo) => {
btnAtivo.classList.remove(...inactive);
btnAtivo.classList.add(...active);
btnInativo.classList.remove(...active);
btnInativo.classList.add(...inactive);
    };

    if (tipo === 'parcela') aplicar(btnParcela, btnTotal);
    else aplicar(btnTotal, btnParcela);

    window.atualizarHintValorParcelado();
};

window.atualizarHintValorParcelado = function() {
    const hint = document.getElementById('hintValorParcelado');
    const lbl = document.getElementById('lblValorForm');
    if (!hint || !lbl) return;

    const tipoCompra = document.getElementById('tipoCompra')?.value;

    if (tipoCompra !== 'A Prazo') {
hint.classList.add('hidden');
lbl.textContent = 'Valor (R$)';
return;
    }

    const tipoValor = document.getElementById('tipoValorParcelado')?.value || 'total';
    const valorBase = valorFloat(document.getElementById('valor').value);
    const qtd = parseInt(document.getElementById('qtdParcelas').value) || 1;
    const pAtual = parseInt(document.getElementById('parcAtual').value) || 1;
    const numParcelas = qtd - pAtual + 1;

    lbl.textContent = tipoValor === 'parcela' ? 'Valor da Parcela (R$)' : 'Valor Total (R$)';

    if (valorBase <= 0 || numParcelas <= 0) {
hint.classList.add('hidden');
return;
    }

    if (tipoValor === 'parcela') {
hint.innerHTML = `Total da compra: <strong>${formatMoeda(valorBase * numParcelas)}</strong> &nbsp;·&nbsp; ${numParcelas}x de ${formatMoeda(valorBase)}`;
    } else {
hint.innerHTML = `${numParcelas}x de <strong>${formatMoeda(valorBase / numParcelas)}</strong> &nbsp;·&nbsp; Total: ${formatMoeda(valorBase)}`;
    }
    hint.classList.remove('hidden');
};

window.checkRateio = function() {
    const tipo = inputTipoCompra.value;
    if (tipo === 'A Prazo') boxRateio.classList.remove('hidden');
    else boxRateio.classList.add('hidden');
}
inputParcelas.addEventListener('input', window.checkRateio);

window.dispararMudancaTipo = function() {
    const tipo = inputTipoCompra.value; window.checkRateio();
    const btnCalV = document.getElementById('btnCalVencimento');
    const boxVenc = document.getElementById('boxVencimento');
    if (tipo === 'À Vista') {
inputParcelas.disabled = true; inputParcelas.value = '1'; inputParcelas.type = "text"; 
inputParcAtual.disabled = true; inputParcAtual.value = '1'; inputParcAtual.type = "text";
inputVencimento.disabled = false;
inputVencimento.classList.replace('bg-slate-50', 'bg-white'); inputVencimento.classList.replace('dark:bg-[#1a2639]', 'dark:bg-[#0b1120]');
if(btnCalV) { btnCalV.disabled = false; }
if (boxVenc) boxVenc.classList.remove('hidden');
// Se estiver vazio, preenche com a data de lançamento
if (!inputVencimento.value || inputVencimento.value.length < 10) {
    inputVencimento.value = inputDataCompra.value || getHojeFormatado();
}
    } else if (tipo === 'A Prazo') {
if (boxVenc) boxVenc.classList.remove('hidden');
inputParcelas.disabled = false; 
if (!inputParcelas.value) inputParcelas.value = '2';
inputParcelas.type = "number"; 
inputParcAtual.disabled = false; 
if (!inputParcAtual.value) inputParcAtual.value = '1';
inputParcAtual.type = "number";
inputVencimento.disabled = false;
inputVencimento.classList.replace('bg-slate-50', 'bg-white'); inputVencimento.classList.replace('dark:bg-[#1a2639]', 'dark:bg-[#0b1120]');
if(btnCalV) { btnCalV.disabled = false; }
window.checkRateio();
    } else if (tipo === 'Recorrente') {
if (boxVenc) boxVenc.classList.remove('hidden');
inputParcelas.type = "text"; inputParcelas.disabled = true; inputParcelas.value = ''; inputParcelas.placeholder = '-'; 
inputParcAtual.type = "text"; inputParcAtual.disabled = true; inputParcAtual.value = ''; inputParcAtual.placeholder = '-';
inputVencimento.disabled = false;
inputVencimento.classList.replace('bg-slate-50', 'bg-white'); inputVencimento.classList.replace('dark:bg-[#1a2639]', 'dark:bg-[#0b1120]'); 
if(btnCalV) { btnCalV.disabled = false; }
inputVencimento.focus();
    }

    // Atualiza o hint de valor total/parcela
    if (typeof window.atualizarHintValorParcelado === 'function') window.atualizarHintValorParcelado();
}

btnLancar.addEventListener('click', function() {
    const valorBase = valorFloat(inputValorForm.value);
    if (inputDescricaoForm.value === '' || valorBase <= 0) { window.mostrarAviso("Preencha a Descrição e um Valor válido!", "erro"); return; }
    if (inputCategoria.value === '') { window.mostrarAviso("Selecione uma Categoria!", "erro"); return; }
    const tipoCompra = inputTipoCompra.value;
    if ((tipoCompra === 'A Prazo' || tipoCompra === 'Recorrente') && inputVencimento.value.length < 10) { window.mostrarAviso("Vencimento inválido!", "erro"); return; }
    if (inputDataCompra.value.length < 10) { window.mostrarAviso("Data da Compra inválida!", "erro"); return; }
    
    const dataLancamento = inputDataCompra.value; 
    // Se o vencimento estiver vazio/inválido, usa a data de lançamento como fallback
    let dataVencimentoStr = inputVencimento.value;
    if (!dataVencimentoStr || dataVencimentoStr.length < 10) dataVencimentoStr = dataLancamento;
    
    const arrC = dataLancamento.split('/'); const dtCompraObj = new Date(arrC[2], arrC[1] - 1, arrC[0]);
    const arrV = dataVencimentoStr.split('/'); const dtVencObj = new Date(arrV[2], arrV[1] - 1, arrV[0]);
    if (dtVencObj < dtCompraObj) { window.mostrarAviso("O vencimento não pode ser anterior à data da compra!", "erro"); return; }

    const obsValue = inputObservacao.value;
    const idMestreTransacao = Date.now(); const desc = inputDescricaoForm.value; 
    const cat = inputCategoria.value; const subcat = inputSubcategoria.value;
    const idContaSelecionada = document.getElementById('contaSelecionada').value || 'c_padrao';
    const origemManualVal = document.getElementById('origemManual')?.value || 'Auto';
    
    const nat = document.getElementById('naturezaLancamento') ? document.getElementById('naturezaLancamento').value : 'Despesa';
    const compoeResumoVal = (nat === 'Receita') ? !!document.getElementById('chkCompoeSaldo')?.checked : false;

    if (tipoCompra === 'A Prazo') {
    const qtd = parseInt(inputParcelas.value) || 1; const pAtual = parseInt(inputParcAtual.value) || 1;
    const periodicidade = document.getElementById('periodicidadeParcelamento').value || 'Mensal';
    if(pAtual > qtd) { window.mostrarAviso("A parcela inicial não pode ser maior que a quantidade!", "erro"); return; }

    const tipoValor = document.getElementById('tipoValorParcelado')?.value || 'total';
    let valorFinal, valorTotalCompra;

    if (tipoValor === 'parcela') {
valorFinal = valorBase;
valorTotalCompra = valorBase * qtd;
    } else {
valorTotalCompra = valorBase;
valorFinal = valorBase / qtd;
    }
        
        const pData = dataVencimentoStr.split('/'); 
        const dBase = parseInt(pData[0], 10); 
        const mBase = parseInt(pData[1], 10) - 1; 
        const aBase = parseInt(pData[2], 10);

        for (let p = pAtual; p <= qtd; p++) {
            let offset = p - pAtual; 
            let dM;
            
            if (periodicidade === 'Diário') {
                dM = new Date(aBase, mBase, dBase);
                dM.setDate(dM.getDate() + offset);
            } else if (periodicidade === 'Semanal') {
                dM = new Date(aBase, mBase, dBase);
                dM.setDate(dM.getDate() + offset * 7);
            } else if (periodicidade === 'Trimestral') {
                dM = new Date(aBase, mBase, 1, 12, 0, 0);
                dM.setMonth(mBase + offset * 3);
                let ultimoDiaDoMes = new Date(dM.getFullYear(), dM.getMonth() + 1, 0).getDate();
                dM.setDate(Math.min(dBase, ultimoDiaDoMes));
            } else if (periodicidade === 'Anual') {
                dM = new Date(aBase, mBase, 1, 12, 0, 0);
                dM.setFullYear(aBase + offset);
                let ultimoDiaDoMes = new Date(dM.getFullYear(), dM.getMonth() + 1, 0).getDate();
                dM.setDate(Math.min(dBase, ultimoDiaDoMes));
            } else {
                // Mensal (padrão)
                dM = new Date(aBase, mBase, 1, 12, 0, 0);
                dM.setMonth(mBase + offset);
                let ultimoDiaDoMes = new Date(dM.getFullYear(), dM.getMonth() + 1, 0).getDate();
                dM.setDate(Math.min(dBase, ultimoDiaDoMes));
            }
            
            let venc = `${String(dM.getDate()).padStart(2, '0')}/${String(dM.getMonth() + 1).padStart(2, '0')}/${dM.getFullYear()}`;
        
        let novaDespesa = {
            id: Date.now() + p, transacaoId: idMestreTransacao, dataLancamento: dataLancamento,
            descricaoOriginal: desc, descricao: desc, categoria: cat, subcategoria: subcat, contaId: idContaSelecionada,
            valorCompraOriginal: valorTotalCompra, valor: valorFinal.toFixed(2), tipo: tipoCompra, natureza: nat, compoeResumo: compoeResumoVal,
            origem: determinarOrigem(venc, nat, origemManualVal), totalParcelas: qtd, parcelaAtual: p,
            vencimentoOriginal: dataVencimentoStr, vencimento: venc, observacao: obsValue, 
            pago: p === 1 ? (document.getElementById('chkEfetivada')?.checked || false) : false, 
            dataPagamento: (p === 1 && document.getElementById('chkEfetivada')?.checked) ? getTimestampAtual() : null, 
            dataEfetivacao: (p === 1 && document.getElementById('chkEfetivada')?.checked) ? (document.getElementById('dataEfetivacaoNovo')?.value || dataLancamento) : null, 
            anexo: anexoAtualBase64
        };
        bancoDeDados.push(novaDespesa);
        salvarDespesaFirestore(novaDespesa);
    }
    window.mostrarAviso(`Parcelado em ${qtd}x de ${formatMoeda(valorFinal)} (Total: ${formatMoeda(valorTotalCompra)})!`);
} else if (tipoCompra === 'Recorrente') {
    let novaDespesa = {
        id: Date.now(), transacaoId: idMestreTransacao, dataLancamento: dataLancamento,
        descricaoOriginal: desc, descricao: desc, categoria: cat, subcategoria: subcat, contaId: idContaSelecionada, valorCompraOriginal: valorBase, valor: valorBase.toFixed(2), tipo: tipoCompra, natureza: nat, compoeResumo: compoeResumoVal,
        origem: determinarOrigem(dataVencimentoStr, nat, origemManualVal), vencimentoOriginal: dataVencimentoStr, vencimento: '',
        isRecorrente: true, encerradoEm: null, observacao: obsValue, 
        pago: document.getElementById('chkEfetivada')?.checked || false, 
        dataPagamento: document.getElementById('chkEfetivada')?.checked ? getTimestampAtual() : null, 
        mesesOcultos: [], 
        dataEfetivacao: document.getElementById('chkEfetivada')?.checked ? (document.getElementById('dataEfetivacaoNovo')?.value || dataLancamento) : null, 
        anexo: anexoAtualBase64
    };
    bancoDeDados.push(novaDespesa);
    salvarDespesaFirestore(novaDespesa);
    window.mostrarAviso("Lançamento Recorrente ativado!");
} else {
    let novaDespesa = {
        id: Date.now(), transacaoId: idMestreTransacao, dataLancamento: dataLancamento,
        descricaoOriginal: desc, descricao: desc, categoria: cat, subcategoria: subcat, contaId: idContaSelecionada, valorCompraOriginal: valorBase, valor: valorBase.toFixed(2), tipo: tipoCompra, natureza: nat, compoeResumo: compoeResumoVal,
        origem: determinarOrigem(dataVencimentoStr, nat, origemManualVal), vencimentoOriginal: dataVencimentoStr, vencimento: dataVencimentoStr, observacao: obsValue, 
        pago: document.getElementById('chkEfetivada')?.checked || false, 
        dataPagamento: document.getElementById('chkEfetivada')?.checked ? getTimestampAtual() : null, 
        dataEfetivacao: document.getElementById('chkEfetivada')?.checked ? (document.getElementById('dataEfetivacaoNovo')?.value || dataLancamento) : null, 
        anexo: anexoAtualBase64
    };
    bancoDeDados.push(novaDespesa);
    salvarDespesaFirestore(novaDespesa);
    window.mostrarAviso("Salvo e efetivado com sucesso!");
}

atualizarTabela();
resetarFormularioLancamento();
fecharModalLancamento(); // Fecha a janela após salvar o lançamento
    });

let itemSendoApagado = null; const modalApagar = document.getElementById('modalApagar');
window.abrirModalApagar = function(idUnico) {
    travarScroll();
    itemSendoApagado = bancoDeDados.find(d => d.id === idUnico); if (!itemSendoApagado) return;
    const boxEscopo = document.getElementById('boxApagarEscopo'); const texto = document.getElementById('textoApagar');
    
    if (itemSendoApagado.isTransferencia && itemSendoApagado.isTerceiro) {
        // 🎯 Terceiro: só existe UM lado — a mensagem de "par" seria falsa.
        boxEscopo.classList.add('hidden');
        const direcao = itemSendoApagado.direcao === 'saida' ? 'para' : 'de';
        const nome = itemSendoApagado.terceiroNome || 'terceiro';
        texto.innerHTML = `<strong>Transferência ${direcao} ${nome}:</strong> esta é uma transferência avulsa com terceiro. Apagar removerá este lançamento. Continuar?`;
    } else if (itemSendoApagado.isTransferencia) {
        boxEscopo.classList.add('hidden');
        texto.innerHTML = '<strong>Transferência entre contas:</strong> apagar removerá tanto a saída quanto a entrada de uma só vez. Continuar?';
    } else if (itemSendoApagado.isRecorrente) { 
        boxEscopo.classList.remove('hidden'); 
        texto.innerHTML = '<strong>Atenção:</strong> Apagar a recorrência inteira removerá o lançamento de TODOS os meses (passados e futuros). Se deseja apenas parar de pagar no futuro, use o botão "Encerrar". O que deseja fazer?'; 
        document.querySelector('input[name="apagarEscopo"][value="unica"]').checked = true;
        document.querySelector('input[name="apagarEscopo"][value="unica"]').nextElementSibling.innerHTML = "Apagar <strong>SOMENTE</strong> neste mês";
        document.querySelector('input[name="apagarEscopo"][value="todas"]').nextElementSibling.innerHTML = "Apagar a recorrência <strong>INTEIRA</strong>";
    } else if (itemSendoApagado.totalParcelas > 1) { 
        boxEscopo.classList.remove('hidden'); 
        texto.textContent = 'Este lançamento é parcelado. O que apagar?'; 
        document.querySelector('input[name="apagarEscopo"][value="unica"]').checked = true;
        document.querySelector('input[name="apagarEscopo"][value="unica"]').nextElementSibling.innerHTML = "Somente esta parcela";
        document.querySelector('input[name="apagarEscopo"][value="todas"]').nextElementSibling.innerHTML = "A compra inteira (todas as parcelas)";
    } else { boxEscopo.classList.add('hidden'); texto.textContent = 'Tem certeza que deseja apagar este lançamento?'; }
    
    window.abrirModalGenerico('modalApagar');
}
window.fecharModalApagar = function() { window.fecharModalGenerico('modalApagar', 'flex', null, () => { itemSendoApagado = null; }); }
document.getElementById('btnConfirmarApagar').addEventListener('click', function() {
    if (!itemSendoApagado) return;
    const escopo = document.querySelector('input[name="apagarEscopo"]:checked')?.value || 'todas';
    
    if (itemSendoApagado.isTransferencia) {
        // Remove ambos os lançamentos vinculados (saída + entrada)
        const transId = itemSendoApagado.transferenciaId;
        bancoDeDados.forEach(d => {
            if (d.transferenciaId === transId) apagarDespesaFirestore(d.id);
        });
        bancoDeDados = bancoDeDados.filter(d => d.transferenciaId !== transId);
    } else if (itemSendoApagado.isRecorrente && escopo === 'unica') {
        const anoMesFiltroNum = dataFiltro.getFullYear() * 100 + (dataFiltro.getMonth() + 1);
        let itemDB = bancoDeDados.find(d => d.id === itemSendoApagado.id);
        if(itemDB) { 
            if(!itemDB.mesesOcultos) itemDB.mesesOcultos = []; 
            itemDB.mesesOcultos.push(anoMesFiltroNum); 
            salvarDespesaFirestore(itemDB);
        }
    } else if (itemSendoApagado.totalParcelas > 1 && escopo === 'unica') { 
        apagarDespesaFirestore(itemSendoApagado.id);
        bancoDeDados = bancoDeDados.filter(d => d.id !== itemSendoApagado.id); 
    } else { 
        bancoDeDados.forEach(d => {
            if ((d.transacaoId || d.id) === (itemSendoApagado.transacaoId || itemSendoApagado.id)) {
                apagarDespesaFirestore(d.id);
            }
        });
        bancoDeDados = bancoDeDados.filter(d => (d.transacaoId || d.id) !== (itemSendoApagado.transacaoId || itemSendoApagado.id)); 
    }
    
    atualizarTabela(); window.fecharModalApagar(); window.mostrarAviso("Removido com sucesso!");
});

let itemSendoEditado = null; const modalEdicao = document.getElementById('modalEdicao');
window.abrirModalEdicao = function(idUnico) {
    travarScroll();
    itemSendoEditado = bancoDeDados.find(d => d.id === idUnico); if (!itemSendoEditado) return;
    if (itemSendoEditado.isTransferencia) {
        window.mostrarAviso("Para alterar uma transferência, apague-a e crie uma nova.", "info");
        itemSendoEditado = null;
        destravScroll();
        return;
    }
    document.getElementById('editDescricao').value = itemSendoEditado.descricaoOriginal || itemSendoEditado.descricao;
    document.getElementById('editValor').value = formatarParaMascara(itemSendoEditado.valor); 
    document.getElementById('editDataCompra').value = itemSendoEditado.dataLancamento || getHojeFormatado(); 
    
    let vVenc = itemSendoEditado.vencimento || itemSendoEditado.vencimentoOriginal;
    if (itemSendoEditado.isRecorrente) {
        let pOrig = itemSendoEditado.vencimentoOriginal.split('/');
        let diaAjustado = Math.min(parseInt(pOrig[0]), new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() + 1, 0).getDate());
        vVenc = `${String(diaAjustado).padStart(2,'0')}/${String(dataFiltro.getMonth()+1).padStart(2,'0')}/${dataFiltro.getFullYear()}`;
    }
    document.getElementById('editVencimento').value = vVenc;
    
    document.getElementById('editObservacao').value = itemSendoEditado.observacao || '';
    document.getElementById('editDataEfetivacao').value = itemSendoEditado.dataEfetivacao || '';
    document.getElementById('editAnexoLivre').value = '';
    document.getElementById('nomeEditAnexoLivre').textContent = itemSendoEditado.anexo ? '(Anexo atual salvo)' : '';
    anexoEditBase64 = itemSendoEditado.anexo || null;
    document.getElementById('panelMaisInfosEdit').classList.add('hidden');
    
    const catObj = categoriasGlobais.find(c => c.nome === itemSendoEditado.categoria);
    const iconeStr = catObj ? catObj.icon : 'tag';
    document.getElementById('editContaSelecionada').value = itemSendoEditado.contaId || 'c_padrao';
    let contaObj = contasGlobais.find(c => c.id === (itemSendoEditado.contaId || 'c_padrao'));

    // Pré-seleciona o chip de Origem conforme o valor atual do lançamento.
    // Se a origem for algo fora das opções (Caixa/Recebimento/Ajuste), cai em Auto.
    const origensDisponiveis = ['Vale', 'Salário', 'Extra'];
    const origemPreselect = origensDisponiveis.includes(itemSendoEditado.origem) ? itemSendoEditado.origem : 'Auto';
    if (typeof window.selecionarOrigem === 'function') {
        window.selecionarOrigem(origemPreselect, 'editOrigemManual', 'edit');
    }

    // 🎯 Toggle "Compor Resumo do Mês" — só faz sentido para Receitas.
    // Se for Despesa, esconde o bloco por completo.
    const boxEditCompoe = document.getElementById('boxEditCompoeSaldo');
    const chkEditCompoe = document.getElementById('chkEditCompoeSaldo');
    const ehReceitaEdit = itemSendoEditado.tipo === 'Receita' || itemSendoEditado.natureza === 'Receita';
    if (boxEditCompoe && chkEditCompoe) {
        if (ehReceitaEdit) {
            boxEditCompoe.classList.remove('hidden');
            chkEditCompoe.checked = !!itemSendoEditado.compoeResumo;
        } else {
            boxEditCompoe.classList.add('hidden');
            chkEditCompoe.checked = false;
        }
    }
    document.getElementById('lblEditConta').textContent = contaObj ? contaObj.nome : 'Carteira Física';
    document.getElementById('editCategoria').value = itemSendoEditado.categoria || '';
    document.getElementById('lblEditCategoria').innerHTML = `<span class="text-slate-900 dark:text-cyan-400">${getSVGIcon(iconeStr, 'w-4 h-4')}</span> <span>${itemSendoEditado.categoria || 'Selecione'}</span>`;
    
    renderSubcategoriaDropdown(itemSendoEditado.categoria, 'editSubcategoria', 'lblEditSubcategoria', 'listaEditSubcategoria', true);
    document.getElementById('editSubcategoria').value = itemSendoEditado.subcategoria || '';
    if (itemSendoEditado.subcategoria) {
        document.getElementById('lblEditSubcategoria').innerHTML = `<span>${itemSendoEditado.subcategoria}</span>`;
    }
    
    const isAj = !!itemSendoEditado.isAjuste;
    document.getElementById('btnEditCategoria').disabled = isAj;
    document.getElementById('btnEditSubcategoria').disabled = isAj;
    document.getElementById('btnEditCategoria').classList.toggle('opacity-50', isAj);
    document.getElementById('btnEditSubcategoria').classList.toggle('opacity-50', isAj);

    if (itemSendoEditado.totalParcelas > 1 && itemSendoEditado.parcelaAtual < itemSendoEditado.totalParcelas) { document.getElementById('boxEditPropagacao').classList.remove('hidden'); document.querySelector('input[name="editEscopo"][value="unica"]').checked = true; } else { document.getElementById('boxEditPropagacao').classList.add('hidden'); }
    
    if (itemSendoEditado.isRecorrente && itemSendoEditado.encerradoEm) {
        document.getElementById('boxReativarRecorrencia').classList.remove('hidden');
    } else {
        document.getElementById('boxReativarRecorrencia').classList.add('hidden');
    }

    window.abrirModalGenerico('modalEdicao');
}
window.fecharModalEdicao = function() { window.fecharModalGenerico('modalEdicao', 'flex', null, () => { itemSendoEditado = null; if (typeof window.selecionarOrigem === 'function') window.selecionarOrigem('Auto', 'editOrigemManual', 'edit'); }); }
window.reativarRecorrenciaEdicao = function() {
    if (!itemSendoEditado || !itemSendoEditado.isRecorrente) return;
    bancoDeDados.forEach(d => {
        if ((d.transacaoId || d.id) === (itemSendoEditado.transacaoId || itemSendoEditado.id)) {
            d.encerradoEm = null; 
            salvarDespesaFirestore(d);
        }
    });
    atualizarTabela(); window.fecharModalEdicao(); window.mostrarAviso("Recorrência reativada com sucesso!", "sucesso");
}
document.getElementById('btnSalvarEdicao').addEventListener('click', function() {
    const nv = valorFloat(document.getElementById('editValor').value);
    const nd = document.getElementById('editDescricao').value; const ndt = document.getElementById('editVencimento').value; 
    const ndc = document.getElementById('editDataCompra').value;
    const nc = document.getElementById('editCategoria').value; const ns = document.getElementById('editSubcategoria').value; 
    const nobs = document.getElementById('editObservacao').value;
    const ndEfet = document.getElementById('editDataEfetivacao').value;
    
    if (!nd || nv <= 0 || ndt.length < 10 || ndc.length < 10) { window.mostrarAviso("Preencha todos os campos corretamente.", "erro"); return; }
    if (ndEfet && ndEfet.length < 10) { window.mostrarAviso("Data de efetivação inválida.", "erro"); return; }

    const arrC = ndc.split('/'); const objC = new Date(arrC[2], arrC[1] - 1, arrC[0]);
    const arrV = ndt.split('/'); const objV = new Date(arrV[2], arrV[1] - 1, arrV[0]);
    
    if (objV < objC) { window.mostrarAviso("O vencimento não pode ser anterior à data da compra!", "erro"); return; }
    if (objV.getMonth() !== dataFiltro.getMonth() || objV.getFullYear() !== dataFiltro.getFullYear()) {
        window.mostrarAviso("A data de vencimento deve pertencer ao mês que você está visualizando na tela.", "erro"); return;
    }

    const escopo = document.querySelector('input[name="editEscopo"]:checked')?.value || 'unica';
    const origemManualEdit = document.getElementById('editOrigemManual')?.value || 'Auto';
    const compoeResumoEdit = !!document.getElementById('chkEditCompoeSaldo')?.checked;
    
    if (escopo === 'unica' || !itemSendoEditado.totalParcelas) {
        itemSendoEditado.descricaoOriginal = nd; itemSendoEditado.descricao = nd; itemSendoEditado.valor = nv.toFixed(2); itemSendoEditado.dataLancamento = ndc; itemSendoEditado.vencimento = formatarDataComparacao(ndt); itemSendoEditado.categoria = nc; itemSendoEditado.subcategoria = ns; itemSendoEditado.origem = determinarOrigem(ndt, itemSendoEditado.natureza, origemManualEdit); itemSendoEditado.observacao = nobs; itemSendoEditado.dataEfetivacao = ndEfet; itemSendoEditado.anexo = anexoEditBase64; itemSendoEditado.contaId = document.getElementById('editContaSelecionada').value;
        if (itemSendoEditado.tipo === 'Receita' || itemSendoEditado.natureza === 'Receita') itemSendoEditado.compoeResumo = compoeResumoEdit;

        // 🎯 SINCRONIZA `vencimentoOriginal` COM A EDIÇÃO DO USUÁRIO.
        // Sem isso, em lançamentos RECORRENTES, `ajustarVencimentosRecorrentes()`
        // recalcula o `vencimento` na próxima renderização lendo o DIA de
        // `vencimentoOriginal` — e sobrescreve silenciosamente a alteração
        // feita aqui. Era esse o "não se concretiza" reportado.
        //
        // Regra:
        //   • Recorrente → atualiza SÓ o DIA, preservando o mês/ano do
        //     âncora original. Assim o "começo da série" não muda, o
        //     filtro histórico continua funcionando, e a derivação para
        //     os meses seguintes passa a usar o novo dia.
        //   • Não recorrente → atualiza o valor inteiro, para manter os
        //     dois campos consistentes (mesmo não sendo usado na
        //     filtragem, evita divergência silenciosa no dado).
        if (itemSendoEditado.isRecorrente && itemSendoEditado.vencimentoOriginal) {
            const pOrig = itemSendoEditado.vencimentoOriginal.split('/');
            const pNovo = ndt.split('/');
            if (pOrig.length === 3 && pNovo.length === 3) {
                itemSendoEditado.vencimentoOriginal = `${pNovo[0].padStart(2,'0')}/${pOrig[1]}/${pOrig[2]}`;
            }
        } else {
            itemSendoEditado.vencimentoOriginal = formatarDataComparacao(ndt);
        }

        salvarDespesaFirestore(itemSendoEditado);
    } else {
        const pd = ndt.split('/'); const dBase = parseInt(pd[0], 10); const mBase = parseInt(pd[1], 10) - 1; const aBase = parseInt(pd[2], 10); let offset = 0;
        bancoDeDados.forEach(d => {
            if (d.transacaoId === itemSendoEditado.transacaoId && d.parcelaAtual >= itemSendoEditado.parcelaAtual) {
                d.descricaoOriginal = nd; d.descricao = nd; d.valor = nv.toFixed(2); d.dataLancamento = ndc; d.categoria = nc; d.subcategoria = ns; d.observacao = nobs; d.dataEfetivacao = ndEfet; d.anexo = anexoEditBase64; d.contaId = document.getElementById('editContaSelecionada').value;
                if (d.tipo === 'Receita' || d.natureza === 'Receita') d.compoeResumo = compoeResumoEdit;
                
                let dM = new Date(aBase, mBase, 1, 12, 0, 0); 
                dM.setMonth(mBase + offset);
                
                let ultimoDiaDoMes = new Date(dM.getFullYear(), dM.getMonth() + 1, 0).getDate();
                dM.setDate(Math.min(dBase, ultimoDiaDoMes));
                
                d.vencimento = `${String(dM.getDate()).padStart(2, '0')}/${String(dM.getMonth() + 1).padStart(2, '0')}/${dM.getFullYear()}`;
                d.origem = determinarOrigem(d.vencimento, d.natureza, origemManualEdit); offset++;
                salvarDespesaFirestore(d);
            }
        });
    }
    atualizarTabela(); window.fecharModalEdicao(); window.mostrarAviso("Atualizado com sucesso!");
});

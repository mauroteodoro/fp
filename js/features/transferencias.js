// Transferência entre contas
'use strict';

// ===================== TRANSFERÊNCIA ENTRE CONTAS =====================
// Cria DOIS lançamentos espelhados (saída na origem + entrada no destino)
// ligados por um "transferenciaId". A saída aparece no extrato; a entrada
// fica oculta (ocultoExtrato: true) — mas ambas movem o saldo das contas.
// Nenhuma das duas conta nos cards de Resumo nem no Relatório (isTransferencia).
// 🎯 Sentinela usada nos dropdowns de transferência para indicar "Terceiro"
window.TRANSF_TERCEIRO = '__TERCEIRO__';

window.renderDropdownTransferencia = function(listId, inputId, lblId, menuId, excludeId) {
    const list = document.getElementById(listId);
    const input = document.getElementById(inputId);
    const lbl = document.getElementById(lblId);
    if (!list || !input || !lbl) return;

    // 🎯 Descobre qual box de terceiro pertence a este dropdown
    const ehOrigem = (listId === 'listaTransfContaOrigem');
    const boxTerceiroId = ehOrigem ? 'boxTransfOrigemTerceiro' : 'boxTransfDestinoTerceiro';
    const nomeTerceiroId = ehOrigem ? 'transfOrigemTerceiroNome' : 'transfDestinoTerceiroNome';

    list.innerHTML = '';

    const liTerceiro = document.createElement('li');
    liTerceiro.dataset.terceiroItem = 'true';
    liTerceiro.className = "cursor-pointer px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#1a2639] flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-[#1e2a40]";
    liTerceiro.innerHTML = `
        <div class="w-6 h-6 shrink-0 flex items-center justify-center text-[#4D6BFE]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M19 8v6M22 11h-6"/>
            </svg>
        </div>
        <span class="font-medium text-slate-700 dark:text-gray-200 truncate">Terceiro <span class="text-[10px] text-slate-400 font-normal">(pessoa ou empresa)</span></span>
    `;
    liTerceiro.addEventListener('click', () => {
        input.value = window.TRANSF_TERCEIRO;
        lbl.innerHTML = `
            <div class="flex items-center gap-2.5 truncate">
                <div class="w-5 h-5 shrink-0 flex items-center justify-center text-[#4D6BFE]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M19 8v6M22 11h-6"/>
                    </svg>
                </div>
                <span class="truncate mt-0.5">Terceiro</span>
            </div>
        `;
        document.getElementById(menuId).classList.add('hidden');
        // 🎯 Abre o box de descrição e foca
        const box = document.getElementById(boxTerceiroId);
        if (box) {
            box.classList.remove('hidden');
            setTimeout(() => document.getElementById(nomeTerceiroId)?.focus(), 80);
        }
    });
    list.appendChild(liTerceiro);

    let primeiraDisponivel = null;
    contasGlobais.forEach(c => {
        if (excludeId && c.id === excludeId) return;
        if (!primeiraDisponivel) primeiraDisponivel = c;

        let b = BANCOS[c.banco || 'carteira'] || BANCOS['outros'];
        let li = document.createElement('li');
        li.className = "cursor-pointer px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#1a2639] flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-[#1e2a40] last:border-0";
        li.innerHTML = `
            <div class="w-6 h-6 shrink-0">${renderBankLogo(b)}</div>
            <span class="font-medium text-slate-700 dark:text-gray-200 truncate">${c.nome}</span>
        `;
        li.addEventListener('click', () => {
            input.value = c.id;
            lbl.innerHTML = `
                <div class="flex items-center gap-2.5 truncate">
                    <div class="w-5 h-5 shrink-0">${renderBankLogo(b)}</div>
                    <span class="truncate mt-0.5">${c.nome}</span>
                </div>
            `;
            document.getElementById(menuId).classList.add('hidden');
            const box = document.getElementById(boxTerceiroId);
            if (box) box.classList.add('hidden');
            const inpNome = document.getElementById(nomeTerceiroId);
            if (inpNome) inpNome.value = '';
        });
        list.appendChild(li);
    });

    if (input.value === window.TRANSF_TERCEIRO) {
        lbl.innerHTML = `
            <div class="flex items-center gap-2.5 truncate">
                <div class="w-5 h-5 shrink-0 flex items-center justify-center text-[#4D6BFE]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M19 8v6M22 11h-6"/>
                    </svg>
                </div>
                <span class="truncate mt-0.5">Terceiro</span>
            </div>
        `;
        document.getElementById(boxTerceiroId)?.classList.remove('hidden');
        return;
    }

    // Se o input atual não está entre os disponíveis, redefine para o primeiro
    const idsDisponiveis = contasGlobais.filter(c => !excludeId || c.id !== excludeId).map(c => c.id);
    if (!input.value || !idsDisponiveis.includes(input.value)) {
        if (primeiraDisponivel) {
            let b = BANCOS[primeiraDisponivel.banco || 'carteira'] || BANCOS['outros'];
            input.value = primeiraDisponivel.id;
            lbl.innerHTML = `
                <div class="flex items-center gap-2.5 truncate">
                    <div class="w-5 h-5 shrink-0">${renderBankLogo(b)}</div>
                    <span class="truncate mt-0.5">${primeiraDisponivel.nome}</span>
                </div>
            `;
        } else {
            input.value = '';
            lbl.textContent = 'Sem contas disponíveis';
        }
    }
};

// Guarda o par de lançamentos quando estamos editando uma transferência existente.
// null = modo "criar nova".
let transferenciaSendoEditada = null;

window.aplicarRegraTerceiroUnico = function() {
    const origemId = document.getElementById('transfContaOrigem')?.value || '';
    const destinoId = document.getElementById('transfContaDestino')?.value || '';
    const origemEhTerceiro = (origemId === window.TRANSF_TERCEIRO);
    const destinoEhTerceiro = (destinoId === window.TRANSF_TERCEIRO);

    const liTerceiroDestino = document.querySelector('#listaTransfContaDestino [data-terceiro-item="true"]');
    if (liTerceiroDestino) liTerceiroDestino.classList.toggle('hidden', origemEhTerceiro);

    const liTerceiroOrigem = document.querySelector('#listaTransfContaOrigem [data-terceiro-item="true"]');
    if (liTerceiroOrigem) liTerceiroOrigem.classList.toggle('hidden', destinoEhTerceiro);
};

window.abrirModalTransferencia = function(idUnico) {
    transferenciaSendoEditada = null;

    // Reseta TODOS os campos (incluindo os novos de "Mais opções")
    document.getElementById('transfContaOrigem').value = '';
    document.getElementById('transfContaDestino').value = '';
    document.getElementById('transfValor').value = '';
    document.getElementById('transfObservacao').value = '';
    document.getElementById('transfData').value = getHojeFormatado();
    document.getElementById('transfDataLancamento').value = getHojeFormatado();
    document.getElementById('transfDataEfetivacao').value = '';
    // 🎯 Reset dos boxes de terceiro
    document.getElementById('transfOrigemTerceiroNome').value = '';
    document.getElementById('transfDestinoTerceiroNome').value = '';
    document.getElementById('boxTransfOrigemTerceiro')?.classList.add('hidden');
    document.getElementById('boxTransfDestinoTerceiro')?.classList.add('hidden');
    const chkEf = document.getElementById('chkTransfEfetivada');
    if (chkEf) chkEf.checked = true;
    atualizarLabelTransfEfetivada();
    // 🎯 Reseta a Origem no Ciclo para "Auto" em novas transferências
    window.selecionarOrigem('Auto', 'transfOrigemManual', 'transf');
    document.getElementById('panelMaisOpcoesTransf')?.classList.add('hidden');
    document.querySelectorAll('.seta-transf').forEach(s => s.classList.remove('rotate-180'));

    // Se veio um ID, é modo edição: carrega os dados do par
    if (idUnico) {
        const lanc = bancoDeDados.find(d => d.id === idUnico);
        if (lanc && lanc.isTransferencia) {
            const par = bancoDeDados.find(d => d.transferenciaId === lanc.transferenciaId && d.id !== lanc.id);
            transferenciaSendoEditada = { saida: lanc, entrada: par || null };

            let origemReal, destinoReal;
            const ehTerceiro = !!lanc.isTerceiro;
            const terceiroNome = lanc.terceiroNome || '';

            if (ehTerceiro) {
                // Terceiro: só existe um lado
                if (lanc.direcao === 'saida') {
                    origemReal = lanc.contaId || 'c_padrao';
                    destinoReal = window.TRANSF_TERCEIRO;
                    document.getElementById('transfDestinoTerceiroNome').value = terceiroNome;
                } else {
                    origemReal = window.TRANSF_TERCEIRO;
                    destinoReal = lanc.contaId || 'c_padrao';
                    document.getElementById('transfOrigemTerceiroNome').value = terceiroNome;
                }
            } else if (lanc.direcao === 'saida') {
                origemReal = lanc.contaId; destinoReal = par ? par.contaId : '';
            } else {
                origemReal = par ? par.contaId : ''; destinoReal = lanc.contaId;
            }

            document.getElementById('transfContaOrigem').value = origemReal || '';
            document.getElementById('transfContaDestino').value = destinoReal || '';
            document.getElementById('transfValor').value = formatarParaMascara(lanc.valor);
            document.getElementById('transfData').value = lanc.vencimento || lanc.dataLancamento || getHojeFormatado();
            document.getElementById('transfObservacao').value = lanc.observacao || '';
            document.getElementById('transfDataLancamento').value = lanc.dataLancamento || getHojeFormatado();
            document.getElementById('transfDataEfetivacao').value = lanc.dataEfetivacao || '';
            if (chkEf) chkEf.checked = !!lanc.pago;
            atualizarLabelTransfEfetivada();

            const origemSalva = (lanc.origem === 'Vale' || lanc.origem === 'Salário')
                ? lanc.origem
                : 'Auto';
            window.selecionarOrigem(origemSalva, 'transfOrigemManual', 'transf');
        }
    }

    // Popula origem (sem exclusão). Se já tinha valor (edição), mantém.
    window.renderDropdownTransferencia('listaTransfContaOrigem', 'transfContaOrigem', 'lblTransfContaOrigem', 'menuTransfContaOrigem', null);

    // Popula destino, excluindo a conta já escolhida como origem
    // (só faz sentido quando a origem é uma conta real — se for terceiro, sem exclusão)
    const origemId = document.getElementById('transfContaOrigem').value;
    const excluir = (origemId && origemId !== window.TRANSF_TERCEIRO) ? origemId : null;
    window.renderDropdownTransferencia('listaTransfContaDestino', 'transfContaDestino', 'lblTransfContaDestino', 'menuTransfContaDestino', excluir);

    // Ajusta o label do botão conforme o modo
    const btnSalvar = document.getElementById('btnConfirmarTransferencia');
    if (btnSalvar) btnSalvar.textContent = transferenciaSendoEditada ? 'Salvar alterações' : 'Transferir';

    // 🎯 Aplica a regra "Terceiro em um lado só" após os renders iniciais
    window.aplicarRegraTerceiroUnico();

    window.abrirModalGenerico('modalTransferencia');
};

window.fecharModalTransferencia = function() {
    window.fecharModalGenerico('modalTransferencia', 'flex', null, () => {
        transferenciaSendoEditada = null;
        const btnSalvar = document.getElementById('btnConfirmarTransferencia');
        if (btnSalvar) btnSalvar.textContent = 'Transferir';
    });
};

window.toggleMaisOpcoesTransf = function(btn) {
    const panel = document.getElementById('panelMaisOpcoesTransf');
    if (!panel) return;
    const vaiAbrir = panel.classList.contains('hidden');
    panel.classList.toggle('hidden');
    btn.querySelector('svg.seta-transf')?.classList.toggle('rotate-180');

    if (vaiAbrir) {
        // 60ms: deixa o painel ganhar altura real antes de rolar até ele.
        setTimeout(() => {
            panel.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 60);
    }
};

function atualizarLabelTransfEfetivada() {
    const chk = document.getElementById('chkTransfEfetivada');
    const lbl = document.getElementById('lblTransfEfetivadaText');
    const iconBox = document.getElementById('iconTransfEfetivada');
    if (!chk || !lbl) return;

    lbl.textContent = chk.checked ? 'Efetivada' : 'Pendente';
    lbl.className = chk.checked
        ? 'text-sm font-bold text-slate-800 dark:text-gray-200 cursor-pointer select-none'
        : 'text-sm font-bold text-slate-400 cursor-pointer select-none';

    if (iconBox) {
        iconBox.innerHTML = chk.checked
            ? `<svg class="w-4 h-4 text-green-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
            : `<svg class="w-4 h-4 text-amber-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
    }
}

// Liga o toggle + máscaras dos novos campos de data. Roda uma vez no boot.
(function inicializarExtrasTransferencia() {
    const chk = document.getElementById('chkTransfEfetivada');
    if (chk) chk.addEventListener('change', atualizarLabelTransfEfetivada);

    // Aplica a máscara DD/MM/AAAA nos dois novos inputs de data
    const inputLanc = document.getElementById('transfDataLancamento');
    const inputEfet = document.getElementById('transfDataEfetivacao');
    if (inputLanc) aplicarMascaraData(inputLanc);
    if (inputEfet) aplicarMascaraData(inputEfet);
})();

// Quando a origem muda, repopula o destino excluindo a nova origem
// (o timeout deixa o handler do <li> atualizar o input antes)
document.getElementById('listaTransfContaOrigem')?.addEventListener('click', () => {
    setTimeout(() => {
        const origemId = document.getElementById('transfContaOrigem').value;
        const excluir = (origemId && origemId !== window.TRANSF_TERCEIRO) ? origemId : null;
        if (excluir && document.getElementById('transfContaDestino').value === origemId) {
            document.getElementById('transfContaDestino').value = '';
        }
        window.renderDropdownTransferencia('listaTransfContaDestino', 'transfContaDestino', 'lblTransfContaDestino', 'menuTransfContaDestino', excluir);
        // 🎯 Após re-renderizar o destino, reaplica a regra
        window.aplicarRegraTerceiroUnico();
    }, 10);
});

// 🎯 Listener NOVO: quando o usuário escolhe Terceiro no destino,
//    a origem precisa esconder a opção Terceiro.
document.getElementById('listaTransfContaDestino')?.addEventListener('click', () => {
    setTimeout(() => {
        window.aplicarRegraTerceiroUnico();
    }, 10);
});

document.getElementById('btnTransfContaOrigem')?.addEventListener('click', (e) => {
    window.abrirMenuExclusivo('menuTransfContaOrigem', e);
});
document.getElementById('btnTransfContaDestino')?.addEventListener('click', (e) => {
    window.abrirMenuExclusivo('menuTransfContaDestino', e);
});

window.salvarTransferencia = function() {
    const origemId = document.getElementById('transfContaOrigem').value;
    const destinoId = document.getElementById('transfContaDestino').value;
    const valor = valorFloat(document.getElementById('transfValor').value);
    const data = document.getElementById('transfData').value;
    const obs = document.getElementById('transfObservacao').value.trim();

    const origemEhTerceiro = (origemId === window.TRANSF_TERCEIRO);
    const destinoEhTerceiro = (destinoId === window.TRANSF_TERCEIRO);

    if (!origemId) { window.mostrarAviso("Selecione a conta de origem.", "erro"); return; }
    if (!destinoId) { window.mostrarAviso("Selecione a conta de destino.", "erro"); return; }
    if (origemEhTerceiro && destinoEhTerceiro) {
        window.mostrarAviso("Origem e destino não podem ser ambos terceiros.", "erro"); return;
    }
    if (!origemEhTerceiro && !destinoEhTerceiro && origemId === destinoId) {
        window.mostrarAviso("Origem e destino não podem ser a mesma conta.", "erro"); return;
    }
    if (valor <= 0) { window.mostrarAviso("Informe um valor válido.", "erro"); return; }
    if (!data || data.length < 10) { window.mostrarAviso("Data inválida.", "erro"); return; }

    // 🎯 Valida e coleta nome do terceiro quando aplicável
    let terceiroNome = '';
    if (origemEhTerceiro) {
        terceiroNome = (document.getElementById('transfOrigemTerceiroNome')?.value || '').trim();
        if (!terceiroNome) { window.mostrarAviso("Informe o nome do terceiro de origem.", "erro"); return; }
    }
    if (destinoEhTerceiro) {
        terceiroNome = (document.getElementById('transfDestinoTerceiroNome')?.value || '').trim();
        if (!terceiroNome) { window.mostrarAviso("Informe o nome do terceiro de destino.", "erro"); return; }
    }

    const origemObj = origemEhTerceiro ? null : contasGlobais.find(c => c.id === origemId);
    const destinoObj = destinoEhTerceiro ? null : contasGlobais.find(c => c.id === destinoId);
    if (!origemEhTerceiro && !origemObj) { window.mostrarAviso("Conta de origem não encontrada.", "erro"); return; }
    if (!destinoEhTerceiro && !destinoObj) { window.mostrarAviso("Conta de destino não encontrada.", "erro"); return; }

    const eraEdicao = !!transferenciaSendoEditada;

    // Em modo edição, apaga os lançamentos antigos (par ou único) antes de criar.
    if (eraEdicao) {
        const transIdAntigo = transferenciaSendoEditada.saida.transferenciaId;
        const idsAntigos = [];
        bancoDeDados.forEach(d => { if (d.transferenciaId === transIdAntigo) idsAntigos.push(d.id); });
        idsAntigos.forEach(id => apagarDespesaFirestore(id));
        bancoDeDados = bancoDeDados.filter(d => d.transferenciaId !== transIdAntigo);
    }

    const transId = `trf_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const timestampAgora = getTimestampAtual();
    const dataVenc = data;
    const dataLanc = document.getElementById('transfDataLancamento')?.value || dataVenc;
    const dataEfet = document.getElementById('transfDataEfetivacao')?.value || '';
    const estaPaga = !!document.getElementById('chkTransfEfetivada')?.checked;
    const origemEscolhida = document.getElementById('transfOrigemManual')?.value || 'Auto';

    // Caso 1: origem terceiro → entrada na conta (receita).
    if (origemEhTerceiro) {
        const descricaoAuto = `${terceiroNome} → ${destinoObj.nome}`;
        const lancEntrada = {
            id: Date.now(),
            transacaoId: Date.now(),
            transferenciaId: transId,
            isTransferencia: true,
            isTerceiro: true,
            terceiroNome: terceiroNome,
            direcao: 'entrada',
            dataLancamento: dataLanc,
            descricaoOriginal: descricaoAuto,
            descricao: descricaoAuto,
            categoria: 'Transferência',
            subcategoria: terceiroNome,
            contaId: destinoId,
            valorCompraOriginal: valor,
            valor: valor.toFixed(2),
            tipo: 'Receita',
            natureza: 'Receita',
            origem: 'Transferência',
            compoeResumo: true,        // 🎯 entra na projeção (é receita real)
            vencimentoOriginal: dataVenc,
            vencimento: dataVenc,
            observacao: obs,
            pago: estaPaga,
            dataPagamento: estaPaga ? timestampAgora : null,
            dataEfetivacao: estaPaga ? (dataEfet || dataVenc) : null,
            anexo: null
        };
        bancoDeDados.push(lancEntrada);
        salvarDespesaFirestore(lancEntrada);
    }
    // Caso 2: destino terceiro → saída da conta (despesa).
    else if (destinoEhTerceiro) {
        const descricaoAuto = `${origemObj.nome} → ${terceiroNome}`;
        const origemFinal = (origemEscolhida === 'Vale' || origemEscolhida === 'Salário')
            ? origemEscolhida
            : determinarOrigem(dataVenc, 'Despesa', null);
        const lancSaida = {
            id: Date.now(),
            transacaoId: Date.now(),
            transferenciaId: transId,
            isTransferencia: true,
            isTerceiro: true,
            terceiroNome: terceiroNome,
            direcao: 'saida',
            dataLancamento: dataLanc,
            descricaoOriginal: descricaoAuto,
            descricao: descricaoAuto,
            categoria: 'Transferência',
            subcategoria: terceiroNome,
            contaId: origemId,
            valorCompraOriginal: valor,
            valor: valor.toFixed(2),
            tipo: 'Despesa',
            natureza: 'Despesa',
            origem: origemFinal,
            vencimentoOriginal: dataVenc,
            vencimento: dataVenc,
            observacao: obs,
            pago: estaPaga,
            dataPagamento: estaPaga ? timestampAgora : null,
            dataEfetivacao: estaPaga ? (dataEfet || dataVenc) : null,
            anexo: null
        };
        bancoDeDados.push(lancSaida);
        salvarDespesaFirestore(lancSaida);
    }
    // Caso 3: entre contas próprias → par espelhado (saída + entrada).
    else {
        const descricaoAuto = `${origemObj.nome} → ${destinoObj.nome}`;
        const origemFinal = (origemEscolhida === 'Vale' || origemEscolhida === 'Salário')
            ? origemEscolhida
            : determinarOrigem(dataVenc, 'Despesa', null);

        const idOrigem = Date.now();
        const idDestino = idOrigem + 1;

        const lancSaida = {
            id: idOrigem,
            transacaoId: idOrigem,
            transferenciaId: transId,
            transferenciaParId: idDestino,
            isTransferencia: true,
            isTerceiro: false,
            direcao: 'saida',
            dataLancamento: dataLanc,
            descricaoOriginal: descricaoAuto,
            descricao: descricaoAuto,
            categoria: 'Transferência',
            subcategoria: destinoObj.nome,
            contaId: origemId,
            valorCompraOriginal: valor,
            valor: valor.toFixed(2),
            tipo: 'Despesa',
            natureza: 'Despesa',
            origem: origemFinal,
            vencimentoOriginal: dataVenc,
            vencimento: dataVenc,
            observacao: obs,
            pago: estaPaga,
            dataPagamento: estaPaga ? timestampAgora : null,
            dataEfetivacao: estaPaga ? (dataEfet || dataVenc) : null,
            anexo: null
        };

        const lancEntrada = {
            id: idDestino,
            transacaoId: idDestino,
            transferenciaId: transId,
            transferenciaParId: idOrigem,
            isTransferencia: true,
            isTerceiro: false,
            direcao: 'entrada',
            dataLancamento: dataLanc,
            descricaoOriginal: descricaoAuto,
            descricao: descricaoAuto,
            categoria: 'Transferência',
            subcategoria: origemObj.nome,
            contaId: destinoId,
            valorCompraOriginal: valor,
            valor: valor.toFixed(2),
            tipo: 'Receita',
            natureza: 'Receita',
            origem: 'Transferência',
            vencimentoOriginal: dataVenc,
            vencimento: dataVenc,
            observacao: obs,
            pago: estaPaga,
            dataPagamento: estaPaga ? timestampAgora : null,
            dataEfetivacao: estaPaga ? (dataEfet || dataVenc) : null,
            anexo: null,
            ocultoExtrato: true
        };

        bancoDeDados.push(lancSaida);
        bancoDeDados.push(lancEntrada);
        salvarDespesaFirestore(lancSaida);
        salvarDespesaFirestore(lancEntrada);
    }

    atualizarTabela();
    if (typeof renderizarCarrosselContas === 'function') renderizarCarrosselContas();
    if (typeof renderTabelaContasTela === 'function') renderTabelaContasTela();

    const msg = eraEdicao
        ? `Transferência atualizada para ${formatMoeda(valor)}.`
        : `Transferência de ${formatMoeda(valor)} realizada!`;
    window.fecharModalTransferencia();
    window.mostrarAviso(msg, "sucesso");
};

// Função que limpa todos os campos
window.resetarFormularioLancamento = function() {
    document.getElementById('descricao').value = ''; 
    document.getElementById('valor').value = ''; 
    document.getElementById('observacao').value = ''; 
    document.getElementById('anexoLivre').value = '';  
    document.getElementById('nomeAnexoLivre').textContent = ''; 
    anexoAtualBase64 = null;
    document.getElementById('panelMaisInfosForm').classList.add('hidden');

    // 🎯 Se o usuário fechou o modal com o painel "Mais opções" aberto,
    // a coluna direita ficou `.invisible`. Ao reabrir, ela precisa
    // voltar visível — senão o "Categoria/Subcategoria/Conta/Status"
    // desaparecem permanentemente até um reload da página.
    const colDir = document.getElementById('colunaDireitaForm');
    if (colDir) colDir.classList.remove('invisible');
    // Seta do botão "Mais opções" volta ao estado de fechado (↓)
    document.querySelectorAll('#modalNovoLancamento svg.seta').forEach(s => s.classList.remove('rotate-180'));
    
    const inpTipo = document.getElementById('tipoCompra');
    if (inpTipo) {
        inpTipo.value = 'À Vista'; 
        document.getElementById('lblTipoCompra').innerHTML = `<span>Não recorrente</span>`; 
        window.dispararMudancaTipo();
    }
    
    // Data de Lançamento sempre inicia com a data de hoje (dia do lançamento)
    document.getElementById('dataCompra').value = getHojeFormatado();
    document.getElementById('vencimento').value = getHojeFormatado();

if (typeof window.selecionarTipoValorParcelado === 'function') {
    window.selecionarTipoValorParcelado('total');
}

const chkCompoe = document.getElementById('chkCompoeSaldo');
    if (chkCompoe) chkCompoe.checked = false;

    // Reseta a Origem para Auto (sincroniza também o chip visual)
    if (typeof window.selecionarOrigem === 'function') {
        window.selecionarOrigem('Auto', 'origemManual', 'new');
    }
    
    const chkEf = document.getElementById('chkEfetivada');
    if(chkEf) {
        chkEf.checked = true;
        hasManuallyToggledEfetivada = false;
        if (typeof atualizarLabelEfetivada === 'function') atualizarLabelEfetivada();
    }
    
    const dataEfNovo = document.getElementById('dataEfetivacaoNovo');
    if(dataEfNovo) dataEfNovo.value = '';
}

// Fecha o modal visualmente e depois limpa os dados em modo oculto
window.fecharECancelarLancamento = function() {
    fecharModalLancamento();
    setTimeout(() => { resetarFormularioLancamento(); }, 200);
}

btnTabProjecao.addEventListener('click', window.mudarParaAbaProjecao);

// Modal de ajuste de saldo
'use strict';

// ===================== MODAL DE AJUSTE DE SALDO =====================
const modalAjuste = document.getElementById('modalAjuste');
let isAjusteNegativo = false;
let alvoAjusteAtual = 'Geral';
window.saldoGeralAtualCalculado = 0;
window.saldoValeAtualCalculado = 0;
window.saldoSalarioAtualCalculado = 0;

window.obterSaldoContaReal = function(contaId) {
    let s = contasGlobais.find(c => c.id === contaId)?.saldoInicial || 0;
    bancoDeDados.forEach(d => {
        let idAlvo = d.contaId || 'c_padrao';
        if (idAlvo === contaId && d.pago) {
            let val = parseFloat(d.valor);
            if (d.tipo === 'Receita' || d.natureza === 'Receita') s += val;
            else s -= val;
        }
    });
    return s;
}

window.abrirModalAjuste = function(alvo = 'Geral') {
    // Sem vale: 'Geral' é tratado como 'Salário' (mesmo fluxo de override).
    if (alvo === 'Geral' && (meuPerfil.temVale === 'Não' || meuPerfil.regime === 'PJ')) {
        alvo = 'Salário';
    }

    travarScroll();
    alvoAjusteAtual = alvo;
    
    let saldoAlvo = 0;
    const tituloModal = document.getElementById('tituloModalAjuste');
    
    if (alvo.startsWith('Conta|')) {
        let idConta = alvo.split('|')[1];
        let contaObj = contasGlobais.find(c => c.id === idConta);
        saldoAlvo = window.obterSaldoContaReal(idConta);
        if (tituloModal) tituloModal.textContent = `Reajuste: ${contaObj ? contaObj.nome : 'Conta'}`;
    } else {
        if (alvo === 'Vale') saldoAlvo = window.saldoValeAtualCalculado;
        else if (alvo === 'Salário') saldoAlvo = window.saldoSalarioAtualCalculado;
        else saldoAlvo = window.saldoGeralAtualCalculado;
        if (tituloModal) tituloModal.textContent = alvo === 'Geral' ? 'Reajuste Total' : `Reajuste: ${alvo}`;
    }
    
    isAjusteNegativo = saldoAlvo < 0;
    atualizarSinalAjuste();
    document.getElementById('inputAjusteBase').value = formatarParaMascara(Math.abs(saldoAlvo));
    
    // Ocultar do extrato marcado por padrão para facilitar ajustes silenciosos
    const chkOculto = document.getElementById('chkAjusteOculto');
    const boxMotivo = document.getElementById('boxAjusteMotivo');
    if (chkOculto) chkOculto.checked = true;
    if (boxMotivo) boxMotivo.classList.add('hidden');
    
    // Salário: modo "edição direta do card" — esconde toggle e motivo
    const boxSilencioso = document.getElementById('boxAjusteSilencioso');
    const ehOverrideSalario = (alvo === 'Salário');
    if (boxSilencioso) {
        if (ehOverrideSalario) boxSilencioso.classList.add('hidden');
        else boxSilencioso.classList.remove('hidden');
    }
    if (ehOverrideSalario && boxMotivo) boxMotivo.classList.add('hidden');

    // 🎯 Mostra dica + botão de restaurar apenas no modo Salário
    const hintSal = document.getElementById('hintAjusteSalario');
    const btnRest = document.getElementById('btnRestaurarAjusteSalario');
    if (hintSal) hintSal.classList.toggle('hidden', !ehOverrideSalario);
    if (btnRest) btnRest.classList.toggle('hidden', !ehOverrideSalario);

    window.abrirModalGenerico('modalAjuste');
}

// Mostra/esconde o campo Motivo conforme o toggle de Ajuste Silencioso
document.getElementById('chkAjusteOculto')?.addEventListener('change', function() {
    const boxMotivo = document.getElementById('boxAjusteMotivo');
    if (!boxMotivo) return;
    if (this.checked) {
        boxMotivo.classList.add('hidden');
    } else {
        boxMotivo.classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('inputAjusteDesc')?.focus();
        }, 50);
    }
});

window.fecharModalAjuste = function() {
    window.fecharModalGenerico('modalAjuste');
}

window.restaurarAjusteSalario = function() {
    const chave = window.chaveMes(dataFiltro);
    const temOverride = !!(saldoBaseMensalGlobal[chave] && saldoBaseMensalGlobal[chave].overrideSalario !== undefined);

    if (!temOverride) {
        fecharModalAjuste();
        return;
    }

    const ok = confirm(
        `Restaurar o cálculo automático do Salário?\n\n` +
        `Isso vai remover o valor fixado manualmente. Os lançamentos ` +
        `e os saldos das contas NÃO serão afetados.`
    );
    if (!ok) return;

    delete saldoBaseMensalGlobal[chave].overrideSalario;
    cacheSaldoAcumulado = {};
    syncToFirebase();
    atualizarTabela();
    fecharModalAjuste();
    window.mostrarAviso("Cálculo automático restaurado.", "info");
}

window.limparAjustesDoMes = function() {
    const chaveAlvo = window.chaveMes(dataFiltro);

    // Coleta ajustes do mês atual
    const ajustesDoMes = bancoDeDados.filter(d => {
        if (!d.isAjuste) return false;
        const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        if (!dataRef || dataRef.length !== 10) return false;
        return dataRef.substring(3) === chaveAlvo;
    });

    if (ajustesDoMes.length === 0) {
        window.mostrarAviso("Não há ajustes manuais neste mês.", "info");
        fecharModalAjuste();
        return;
    }

    // Absorve o delta no saldoInicial para o saldo real das contas não mudar.
    const deltaPorConta = {};
    ajustesDoMes.forEach(d => {
        const idC = d.contaId || 'c_padrao';
        const isR = d.tipo === 'Receita' || d.natureza === 'Receita';
        const v = valorFloat(d.valor);
        // Delta = valor com sinal do lançamento original
        // (receita V → +V; despesa V → −V). Ao aplicar no
        // `saldoInicial`, a conta compensa a remoção.
        deltaPorConta[idC] = (deltaPorConta[idC] || 0) + (isR ? v : -v);
    });

    // Monta o resumo humano pro confirm
    let msgContas = '';
    for (const idConta in deltaPorConta) {
        const conta = contasGlobais.find(c => c.id === idConta);
        const nome = conta ? conta.nome : 'Carteira Física';
        const delta = deltaPorConta[idConta];
        if (Math.abs(delta) < 0.005) continue;
        msgContas += `\n  • ${nome}: saldo inicial ${delta > 0 ? '+' : ''}${formatMoeda(delta)}`;
    }

    const ok = confirm(
        `Remover ${ajustesDoMes.length} ajuste${ajustesDoMes.length === 1 ? '' : 's'} manual${ajustesDoMes.length === 1 ? '' : 'is'} deste mês?\n\n` +
        `🎯 Os SALDOS DAS CONTAS serão preservados — eles continuarão iguais.\n` +
        `Para isso, o saldo inicial de cada conta afetada será ajustado automaticamente:${msgContas}\n\n` +
        `Um checkpoint automático será criado antes. Continuar?`
    );
    if (!ok) return;

    criarBackup('Antes de Limpar Ajustes').catch(e => console.error(e));

    // 1. Compensa o `saldoInicial` de cada conta afetada
    for (const idConta in deltaPorConta) {
        const delta = deltaPorConta[idConta];
        if (Math.abs(delta) < 0.005) continue;
        const conta = contasGlobais.find(c => c.id === idConta);
        if (!conta) continue;
        conta.saldoInicial = (parseFloat(conta.saldoInicial) || 0) + delta;
        salvarContaFirestore(conta);
    }

    // 2. Apaga os lançamentos de ajuste
    ajustesDoMes.forEach(d => apagarDespesaFirestore(d.id));
    bancoDeDados = bancoDeDados.filter(d => !d.isAjuste || !ajustesDoMes.includes(d));

    // 3. Invalida cache e repinta tudo
    cacheSaldoAcumulado = {};
    syncToFirebase();
    atualizarTabela();
    if (typeof renderizarCarrosselContas === 'function') renderizarCarrosselContas();
    if (typeof renderTabelaContasTela === 'function') renderTabelaContasTela();
    fecharModalAjuste();
    window.mostrarAviso(
        `${ajustesDoMes.length} ajuste${ajustesDoMes.length === 1 ? '' : 's'} removido${ajustesDoMes.length === 1 ? '' : 's'}. Saldos das contas preservados.`,
        "sucesso"
    );
}

function atualizarSinalAjuste() {
    const sinalEl = document.getElementById('ajusteSinal');
    const inputEl = document.getElementById('inputAjusteBase');
    if (isAjusteNegativo) {
        sinalEl.textContent = '-'; sinalEl.classList.add('text-red-500'); inputEl.classList.add('text-red-500');
    } else {
        sinalEl.textContent = ''; sinalEl.classList.remove('text-red-500'); inputEl.classList.remove('text-red-500');
    }
}

document.getElementById('btnToggleSinal').addEventListener('click', function() {
    isAjusteNegativo = !isAjusteNegativo;
    atualizarSinalAjuste();
});

document.getElementById('btnSalvarAjuste').addEventListener('click', function() {
    let val = valorFloat(document.getElementById('inputAjusteBase').value);
    
    if (isNaN(val)) val = 0;
    if (isAjusteNegativo) val = -val;

    // Modo Salário: override direto (não cria lançamento).
    if (alvoAjusteAtual === 'Salário') {
        let chave = window.chaveMes(dataFiltro);
        if (!saldoBaseMensalGlobal[chave]) saldoBaseMensalGlobal[chave] = {};

        const inputEl = document.getElementById('inputAjusteBase');
        if (!inputEl.value || inputEl.value.trim() === '') {
            val = 0;
        }

        // Se o valor não mudou em relação ao override existente, não faz nada.
        const overrideExistente = saldoBaseMensalGlobal[chave].overrideSalario;
        if (overrideExistente && typeof overrideExistente === 'object' && parseFloat(overrideExistente.valor) === val) {
            fecharModalAjuste();
            return;
        }

        // Registra o ajuste com data e valor anterior. A partir desta data,
        // novas movimentações voltam a compor o saldo automaticamente.
        const valorAnterior = window.saldoSalarioAtualCalculado;
        const diaHojeOv = new Date().getDate();
        const ultimoDiaOv = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() + 1, 0).getDate();
        const diaOv = Math.min(diaHojeOv, ultimoDiaOv);
        const dataOverrideStr = `${String(diaOv).padStart(2,'0')}/${String(dataFiltro.getMonth()+1).padStart(2,'0')}/${dataFiltro.getFullYear()}`;
        saldoBaseMensalGlobal[chave].overrideSalario = {
            valor: val,
            data: dataOverrideStr,
            valorAnterior: valorAnterior,
            timestamp: Date.now()
        };
        cacheSaldoAcumulado = {};
        syncToFirebase();
        atualizarTabela();
        fecharModalAjuste();
        window.mostrarAviso(`Saldo do Salário fixado em ${formatMoeda(val)}.`);
        return;
    }

    let nomeAlvoDesc = alvoAjusteAtual.startsWith('Conta|') ? 'da Conta' : `(${alvoAjusteAtual})`;
    let desc = document.getElementById('inputAjusteDesc').value.trim() || `Ajuste Manual ${nomeAlvoDesc}`;
    
    const chkOculto = document.getElementById('chkAjusteOculto');
    let isOculto = chkOculto ? chkOculto.checked : false;
    
    let saldoAlvo = 0;
    let idContaSel = 'c_padrao';
    
    if (alvoAjusteAtual.startsWith('Conta|')) {
        idContaSel = alvoAjusteAtual.split('|')[1];
        saldoAlvo = window.obterSaldoContaReal(idContaSel);
    } else {
        if (alvoAjusteAtual === 'Vale') saldoAlvo = window.saldoValeAtualCalculado;
        else saldoAlvo = window.saldoGeralAtualCalculado;
    }

    let diferenca = val - saldoAlvo;
    
    if (Math.abs(diferenca) > 0.001) { 
        let isReceita = diferenca > 0;
        let valorAbsoluto = Math.abs(diferenca);
        const diaHojeAjuste = new Date().getDate();
        const ultimoDiaDoMesAjuste = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() + 1, 0).getDate();
        const diaAjuste = Math.min(diaHojeAjuste, ultimoDiaDoMesAjuste);
        const dataLanc = `${String(diaAjuste).padStart(2,'0')}/${String(dataFiltro.getMonth()+1).padStart(2,'0')}/${dataFiltro.getFullYear()}`;
        
        const alvoNormalizado = (meuPerfil.temVale === 'Não' || meuPerfil.regime === 'PJ')
            && alvoAjusteAtual === 'Vale'
            ? 'Salário'
            : alvoAjusteAtual;

        let novaDespesa = {
            id: Date.now(), transacaoId: Date.now(), dataLancamento: dataLanc,
            descricaoOriginal: desc, descricao: desc, 
            categoria: 'Ajuste', subcategoria: 'Ajuste Manual',
            valorCompraOriginal: valorAbsoluto, valor: valorAbsoluto.toFixed(2), 
            tipo: isReceita ? 'Receita' : 'Despesa', 
            origem: alvoAjusteAtual.startsWith('Conta|') ? 'Caixa' : 'Ajuste', 
            alvoAjuste: alvoNormalizado, 
            vencimentoOriginal: dataLanc, vencimento: dataLanc, 
            observacao: `Lançamento gerado via Reajuste de Saldo`, pago: true, 
            dataPagamento: getTimestampAtual(), dataEfetivacao: dataLanc, anexo: null,
            isAjuste: true,
            ocultoExtrato: isOculto,
            contaId: idContaSel
        };
        bancoDeDados.push(novaDespesa);
        salvarDespesaFirestore(novaDespesa);
        
        atualizarTabela(); 
    }
    fecharModalAjuste(); 
    window.mostrarAviso(`Saldo reajustado com sucesso!`);
    document.getElementById('inputAjusteDesc').value = '';
});

const inpAjuste = document.getElementById('inputAjusteBase');
// A máscara deste campo foi unificada e é aplicada no final do arquivo via aplicarMascaraSimples

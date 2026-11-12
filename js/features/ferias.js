// Simulação de férias (CLT)
'use strict';

// ===================== MOTOR DE SIMULAÇÃO DE FÉRIAS =====================
// 🗑️ TODO O CÁLCULO DE FÉRIAS FOI REMOVIDO.
// O botão "Férias no Período?" no HTML continua visível,
// mas apenas como elemento gráfico — não dispara nenhum cálculo,
// não altera o recibo, não altera o líquido.
// O novo mecanismo será reconstruído do zero em uma etapa futura.

function getDiasTrabalhadosDoMes(mesRef) {
    // 🎯 PRIORIDADE 1: spillover de férias do MÊS ANTERIOR.
    //    Se o mês anterior teve férias que "vazaram" para este mês,
    //    o funcionário só trabalhou (30 - spillover) dias — ponto.
    //    Esta regra tem prioridade ABSOLUTA porque é uma consequência
    //    direta das férias: um config salvo ANTES de aplicar as férias
    //    (com diasTrabalhadosNoMes=30) não pode sobrescrever a verdade
    //    matemática. Ex: Janeiro tem spillover 5 de Dezembro → 25 dias,
    //    mesmo que o config antigo dele diga 30.
    const mesAnt = new Date(mesRef.getFullYear(), mesRef.getMonth() - 1, 1);
    const cfgAnt = configHoleriteGlobal[window.chaveMes(mesAnt)];
    if (cfgAnt && cfgAnt.temFerias) {
        const diasFerias = parseInt(cfgAnt.diasFerias) || 30;
        const diaInicio = parseInt(cfgAnt.diaInicioFerias) || 1;
        const diasNoMesAnt = new Date(mesAnt.getFullYear(), mesAnt.getMonth() + 1, 0).getDate();
        const spillover = Math.max(0, (diaInicio + diasFerias - 1) - diasNoMesAnt);
        if (spillover > 0) return 30 - spillover;
        return 30;
    }
    // 🎯 PRIORIDADE 2: config deste mês (férias próprias).
    const chave = window.chaveMes(mesRef);
    const cfg = configHoleriteGlobal[chave];
    if (cfg && cfg.diasTrabalhadosNoMes !== undefined) {
        return cfg.diasTrabalhadosNoMes;
    }
    // 🎯 PRIORIDADE 3: mês normal.
    return 30;
}

function calcularMotorFolha() {
    let sB = valorFloat(document.getElementById('holBruto').value); const hM = valorFloat(document.getElementById('holHoras').value) || 220; const cM = valorFloat(document.getElementById('holConvMed').value); const cO = valorFloat(document.getElementById('holConvOdo').value); const fP = valorFloat(document.getElementById('holFretadoPct').value); const he50 = valorFloat(document.getElementById('holExt50').value); const he100 = valorFloat(document.getElementById('holExt100').value); const bN = document.getElementById('holBonusNome').value; const bV = valorFloat(document.getElementById('holBonusVal').value); const dU = valorFloat(document.getElementById('holDiasUteis').value); const dNU = valorFloat(document.getElementById('holDiasNaoUteis').value); const dn1 = document.getElementById('holDescNome1').value; const dv1 = valorFloat(document.getElementById('holDescVal1').value); const dn2 = document.getElementById('holDescNome2').value; const dv2 = valorFloat(document.getElementById('holDescVal2').value); const dn3 = document.getElementById('holDescNome3').value; const dv3 = valorFloat(document.getElementById('holDescVal3').value); 
    
    const dNome4 = document.getElementById('holDescNome4'); const dn4 = dNome4 ? dNome4.value : ''; 
    const dVal4 = document.getElementById('holDescVal4'); const dv4 = dVal4 ? valorFloat(dVal4.value) : 0; 
    const dNome5 = document.getElementById('holDescNome5'); const dn5 = dNome5 ? dNome5.value : ''; 
    const dVal5 = document.getElementById('holDescVal5'); const dv5 = dVal5 ? valorFloat(dVal5.value) : 0;
    
    const dPJEl = document.getElementById('holDespesasPJ');
    const dPJ = dPJEl ? valorFloat(dPJEl.value) : 0;
    
    // ===== CÁLCULO DE FÉRIAS (CLT) =====
    let sB_mes = sB;
    let diasFeriasCalc = 0;
    let labelSalarioBase = 'Salário Base';
    let vF = 0;
    let vTF = 0;
    let inssFerias = 0;
    let irrfFerias = 0;

    const feriasAtivas = document.getElementById('checkFerias')?.checked;

    // 1) Verifica o MÊS ANTERIOR: se teve férias, este mês mostra o proporcional
    const chaveAtual = window.chaveMes(dataFiltro);
    const mesAnt = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() - 1, 1);
    const chaveAnt = window.chaveMes(mesAnt);
    const configAnt = configHoleriteGlobal[chaveAnt];
    const nomeMesAnterior = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][mesAnt.getMonth()];

    const diasTrabApurado = getDiasTrabalhadosDoMes(mesAnt);
    if (diasTrabApurado < 30) {
        const chaveApurado = window.chaveMes(mesAnt);
        const cfgApurado = configHoleriteGlobal[chaveApurado];
        const brutoApurado = parseFloat(cfgApurado?.bruto) || sB;
        sB_mes = (brutoApurado / 30) * diasTrabApurado;
        labelSalarioBase = `Salário Base (${diasTrabApurado} de 30 dias trab. em ${nomeMesAnterior})`;
    }

    // 2) Verifica o MÊS ATUAL: se tem férias ativas, adiciona férias + 1/3
    if (feriasAtivas && meuPerfil.regime === 'CLT') {
        diasFeriasCalc = parseInt(document.getElementById('holDiasFerias')?.value) || 30;
        const salarioDiario = sB / 30;
        vF = salarioDiario * diasFeriasCalc;
        vTF = vF / 3;
        const baseFeriasTrib = vF + vTF;
        inssFerias = calcularINSS(baseFeriasTrib);
        irrfFerias = calcularIRRF(baseFeriasTrib, meuPerfil.dependentes);
    }

    let v13P1 = 0; let v13P2 = 0; let inss13 = 0; let irrf13 = 0; let mF = dataFiltro.getMonth(); let isNov = mF === 10; let isDez = mF === 11;
    
    const badge13 = document.getElementById('badge13');
    if (meuPerfil.regime === 'CLT' && (isNov || isDez)) {
        if(isNov) v13P1 = sB / 2; 
        if(isDez) { v13P2 = sB / 2; inss13 = calcularINSS(sB); irrf13 = calcularIRRF(sB, meuPerfil.dependentes); }
        badge13.classList.remove('hidden'); 
    } else { badge13.classList.add('hidden'); }

    let vH = 0; let vH50 = 0; let vH100 = 0; let tE = 0; let dsr = 0; let vale = 0; let inss = 0; let irrf = 0; let fret = 0;
    let valeDescontado = 0;  // desconto: o valor creditado no MÊS ANTERIOR
    let descC = 0;
    // 🎯 Base do INSS/IRRF do mês é o salário EFETIVO do mês (proporcional
    // quando o mês anterior teve férias). HE/Fretado/13º continuam sobre `sB`.
    let tP_Trib = sB_mes;
    
    let tempCm = cM; let tempCo = cO;

    if (meuPerfil.regime === 'CLT') {
        descC = dv1 + dv2 + dv3 + dv4 + dv5;
        tP_Trib += bV;
        vH = sB / hM; vH50 = vH * 1.5 * he50; vH100 = vH * 2.0 * he100; tE = vH50 + vH100; 
        dsr = (dU > 0 && tE > 0) ? (tE / dU) * dNU : 0;
        tP_Trib += tE + dsr;
        if (meuPerfil.temVale === 'Sim') {
            const diasTrabAntCalc = getDiasTrabalhadosDoMes(mesAnt);
            const brutoAntCalc = parseFloat(configAnt?.bruto) || sB;
            valeDescontado = (brutoAntCalc / 30) * diasTrabAntCalc * 0.40;
            vale = valeDescontado;
        }
        inss = calcularINSS(tP_Trib); 
        irrf = calcularIRRF(tP_Trib, meuPerfil.dependentes); 
        fret = sB_mes * (fP / 100); 
    } else {
        descC = dPJ; 
        tempCm = 0; tempCo = 0;
    }

    const totP = meuPerfil.regime === 'CLT' ? (tP_Trib + v13P1 + v13P2 + vF + vTF) : sB + bV; 
    const totD = meuPerfil.regime === 'CLT' ? (inss + irrf + inss13 + irrf13 + inssFerias + irrfFerias + vale + tempCm + tempCo + fret + descC) : descC; 
    const liq = totP - totD;

    const tbody = document.getElementById('corpoHoleritePremium'); tbody.innerHTML = '';
    const addRow = (desc, isProv, val) => { if(val <= 0 && !desc.startsWith('Salário') && desc !== 'Faturamento Bruto' && !desc.startsWith('Faturamento')) return; tbody.innerHTML += `<div class="flex justify-between items-center py-2 border-b border-slate-100 dark:border-[#1e2a40] last:border-0 hover:bg-slate-50 dark:hover:bg-[#1a2639] transition-colors px-2 rounded"><span class="text-slate-600 dark:text-gray-300 font-medium">${desc}</span><span class="font-bold tracking-wide ${isProv ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400'}">${isProv ? '+' : '-'} ${formatMoeda(val)}</span></div>`; };

    if (meuPerfil.regime === 'CLT') {
            addRow(labelSalarioBase, true, sB_mes); addRow('Horas Extras 50%', true, vH50); addRow('Horas Extras 100%', true, vH100); addRow('DSR s/ Extras', true, dsr); addRow(bN || 'Bônus/Premiação', true, bV);
            if (vF > 0) addRow(`Férias (${diasFeriasCalc} dias)`, true, vF);
            if (vTF > 0) addRow('1/3 Constitucional', true, vTF);
            addRow('13º Salário (1ª Parcela)', true, v13P1); addRow('13º Salário (2ª Parcela)', true, v13P2);
            addRow('INSS Previsto', false, inss); addRow('IRRF Previsto', false, irrf);
            if (inssFerias > 0) addRow('INSS (Férias)', false, inssFerias);
            if (irrfFerias > 0) addRow('IRRF (Férias)', false, irrfFerias);
            if(isDez) addRow('INSS (Sobre 13º Salário)', false, inss13); if(isDez) addRow('IRRF (Sobre 13º Salário)', false, irrf13); 
            if (valeDescontado > 0) addRow('Vale (Adiantamento)', false, valeDescontado);
            addRow('Fretado', false, fret); addRow('Convênio Médico', false, tempCm); addRow('Convênio Odontológico', false, tempCo); 
            addRow(dn1 || 'Desconto 1', false, dv1); addRow(dn2 || 'Desconto 2', false, dv2); addRow(dn3 || 'Desconto 3', false, dv3); addRow(dn4 || 'Desconto 4', false, dv4); addRow(dn5 || 'Desconto 5', false, dv5);
        } else {
            addRow('Faturamento Bruto', true, sB); 
            if(bV > 0) addRow(bN || 'Receita Extra', true, bV);
            addRow('Custos e Despesas do Mês', false, dPJ);
        }

        document.getElementById('totProv').textContent = formatMoeda(totP); 
        document.getElementById('totDesc').textContent = formatMoeda(totD); 
        
        const elLiq = document.getElementById('liqReceber');
        elLiq.textContent = formatMoeda(liq);
        if (liq < 0) {
            elLiq.classList.remove('text-green-600', 'dark:text-green-500');
            elLiq.classList.add('text-red-600', 'dark:text-red-400');
        } else {
            elLiq.classList.remove('text-red-600', 'dark:text-red-400');
            elLiq.classList.add('text-green-600', 'dark:text-green-500');
        }

    let aF = dataFiltro.getFullYear();
    const dValeObj = getDiaValeEfetivo(aF, mF);
    const dSalObj = getQuintoDiaUtil(aF, mF);
    const diasSemanaCompleto = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

    let diaValeStr = `${String(dValeObj.getDate()).padStart(2,'0')}/${String(mF+1).padStart(2,'0')}/${aF}`;
    let diaSalarioStr = `${String(dSalObj.getDate()).padStart(2,'0')}/${String(mF+1).padStart(2,'0')}/${aF}`;
    document.getElementById('lblDataVale').textContent = diaValeStr;
    document.getElementById('lblDataSalario').textContent = diaSalarioStr;

    // 🎯 Dia da semana logo abaixo da data. Em mobile, dá contexto
    //    imediato sobre qual dia cai o dinheiro na conta — sem o
    //    usuário ter que calcular de cabeça.
    const elDS = document.getElementById('lblDiaSemanaSalario');
    if (elDS) elDS.textContent = diasSemanaCompleto[dSalObj.getDay()];
    const elDV = document.getElementById('lblDiaSemanaVale');
    if (elDV) elDV.textContent = diasSemanaCompleto[dValeObj.getDay()];

    // 🎯 Motivo da antecipação do vale (só aparece quando o dia 20
    //    não é útil). Texto âmbar discreto, com o nome do feriado
    //    quando houver. Quando o 20 é útil, volta ao texto padrão.
    const elMotivo = document.getElementById('lblMotivoVale');
    if (elMotivo) {
        const motivo = getMotivoValeEfetivo(aF, mF);
        if (motivo) {
            elMotivo.textContent = motivo;
            elMotivo.classList.remove('text-slate-400', 'dark:text-gray-500');
            elMotivo.classList.add('text-amber-600', 'dark:text-amber-400', 'font-semibold');
        } else {
            elMotivo.textContent = 'Data prevista de crédito do adiantamento — sempre no dia 20.';
            elMotivo.classList.remove('text-amber-600', 'dark:text-amber-400', 'font-semibold');
            elMotivo.classList.add('text-slate-400', 'dark:text-gray-500');
        }
    }

    simulacaoAtualGlobal = { 
        ano: aF, mes: mF, 
        valeAdiantamento: vale,          // compatibilidade (valor do desconto)
        valeDescontado: valeDescontado,  // desconto aplicado neste mês
        // 🎯 Valor LÍQUIDO do 13º (proventos − INSS − IRRF). Como o
        // 13º cai depois do dia 20 (nov e dez), ele é direcionado ao
        // bucket "Vale" nos cards do Resumo — junto com o adiantamento.
        valor13: (v13P1 + v13P2) - (inss13 + irrf13),
        diaValeStr, salarioLiquido: liq, diaSalarioStr, bruto: sB, horasMensais: hM, convMed: tempCm, convOdo: tempCo, fretadoPct: fP,
        ext50: he50, ext100: he100, bonusNome: bN, bonusVal: bV,
        descNome1: dn1, descVal1: dv1, descNome2: dn2, descVal2: dv2, descNome3: dn3, descVal3: dv3, descNome4: dn4, descVal4: dv4, descNome5: dn5, descVal5: dv5,
        despesasPJ: dPJ
    };

    // ===== COMPARAÇÃO ANTES/DEPOIS =====
    const chaveCmp = window.chaveMes(dataFiltro);
    const configSalvaCmp = configHoleriteGlobal[chaveCmp];
    const boxCmp = document.getElementById('boxComparacaoSimulacao');
    const contCmp = document.getElementById('conteudoComparacao');
    if (boxCmp && contCmp) {
        if (configSalvaCmp) {
            const difSal = liq - parseFloat(configSalvaCmp.salarioLiquido || 0);
            const difVale = vale - parseFloat(configSalvaCmp.valeAdiantamento || 0);
            const difBruto = sB - parseFloat(configSalvaCmp.bruto || 0);
            const items = [
                { label: 'Salário Líquido', val: difSal },
                { label: 'Vale', val: difVale },
                { label: 'Bruto', val: difBruto }
            ].filter(x => Math.abs(x.val) > 0.005);

            if (items.length === 0) {
                boxCmp.classList.add('hidden');
            } else {
                boxCmp.classList.remove('hidden');
                contCmp.innerHTML = items.map(x => {
                    const isPos = x.val > 0;
                    const cor = isPos ? 'text-[#059669]' : 'text-[#E11D48]';
                    const sinal = isPos ? '+' : '−';
                    return `<div class="flex items-center gap-2 text-xs"><span class="text-slate-500 font-medium">${x.label}:</span><span class="font-bold ${cor}">${sinal} ${formatMoeda(Math.abs(x.val))}</span></div>`;
                }).join('');
            }
        } else {
            boxCmp.classList.add('hidden');
        }
    }

    // ⚠️ Atualiza o aviso de "não salvo" sempre que o motor recalcula.
    // É aqui que o banner âmbar e o pulso do botão reagem ao estado atual.
    atualizarAvisoNaoSalvo();
}

const inputsFolha = ['holBruto', 'holHoras', 'holConvMed', 'holConvOdo', 'holFretadoPct', 'holExt50', 'holExt100', 'holDiasFerias', 'holDiaInicioFerias', 'holBonusNome', 'holBonusVal', 'holDescNome1', 'holDescVal1', 'holDescNome2', 'holDescVal2', 'holDescNome3', 'holDescVal3', 'holDescNome4', 'holDescVal4', 'holDescNome5', 'holDescVal5', 'holDespesasPJ'];
inputsFolha.forEach(id => { 
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', () => {
        simulacaoTemAlteracoesNaoSalvas = true;
        calcularMotorFolha();
    });
});

// 🗑️ A versão duplicada desta função foi removida — permanece
//    apenas a versão consolidada (mais abaixo), que também chama
//    `atualizarTabela()` para refletir o Resumo após o zeramento.

window.abrirModalSimulacao = function() {
    const modal = document.getElementById('modalSalvarSimulacao');
    const inputContaSim = document.getElementById('contaDestinoSimulacao');
    const lblContaSim = document.getElementById('lblContaSimulacao');
    const listaContaSim = document.getElementById('listaContaSimulacao');
    const menuContaSim = document.getElementById('menuContaSimulacao');

    // Popula as contas no modal com o design customizado e logos
    listaContaSim.innerHTML = '';
    contasGlobais.forEach(c => {
        let b = BANCOS[c.banco || 'carteira'] || BANCOS['outros'];
        let li = document.createElement('li');
        li.className = "cursor-pointer px-4 py-2 hover:bg-slate-100 dark:hover:bg-[#1a2639] flex items-center gap-3 transition-colors border-b border-slate-100 dark:border-[#1e2a40] last:border-0";
        li.innerHTML = `
            <div class="w-6 h-6 shrink-0">${renderBankLogo(b)}</div>
            <span class="font-medium text-slate-700 dark:text-gray-200 truncate">${c.nome}</span>
        `;
        li.addEventListener('click', () => {
            inputContaSim.value = c.id;
            lblContaSim.innerHTML = `
                <div class="flex items-center gap-2.5 truncate">
                    <div class="w-5 h-5 shrink-0">${renderBankLogo(b)}</div>
                    <span class="truncate mt-0.5">${c.nome}</span>
                </div>
            `;
            menuContaSim.classList.add('hidden');
        });
        listaContaSim.appendChild(li);
    });
    
    // Recupera a conta salva ou seta a primeira como padrão
    let hol = configHoleriteGlobal[window.chaveMes(dataFiltro)];
    let idSelecionado = (hol && hol.contaSalario) ? hol.contaSalario : (contasGlobais.length > 0 ? contasGlobais[0].id : '');
    
    if (idSelecionado) {
        let cSelecionada = contasGlobais.find(x => x.id === idSelecionado) || contasGlobais[0];
        let bSelecionado = BANCOS[cSelecionada.banco || 'carteira'] || BANCOS['outros'];
        inputContaSim.value = cSelecionada.id;
        lblContaSim.innerHTML = `
            <div class="flex items-center gap-2.5 truncate">
                <div class="w-5 h-5 shrink-0">${renderBankLogo(bSelecionado)}</div>
                <span class="truncate mt-0.5">${cSelecionada.nome}</span>
            </div>
        `;
    }

    window.abrirModalGenerico('modalSalvarSimulacao');
}

window.fecharModalSimulacao = function() {
    window.fecharModalGenerico('modalSalvarSimulacao');
}

document.getElementById('btnAplicarFolha').addEventListener('click', function() {
    // 🎯 Antes de salvar, grava os dados de férias (se o toggle estiver ativo)
    // para que o PRÓXIMO mês saiba que deve mostrar salário proporcional.
    const feriasAtivas = document.getElementById('checkFerias')?.checked;
    if (feriasAtivas && meuPerfil.regime === 'CLT') {
        const diasFerias = parseInt(document.getElementById('holDiasFerias')?.value) || 30;
        const diaInicio = parseInt(document.getElementById('holDiaInicioFerias')?.value) || 1;
        // 🎯 O spillover usa o CALENDÁRIO REAL do mês de partida (Dez=31, Fev=28)
        // para saber quantos dias "transbordam" para o mês seguinte.
        // Assim, férias de 30 dias começando em 07/dez terminam em 05/jan
        // (não 06/jan), e o funcionário volta em 06/jan — que é o que o
        // calendário real dita.
        const diasNoMesReal = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() + 1, 0).getDate();
        const fimVacCom = diaInicio + diasFerias - 1;
        const spilloverDias = Math.max(0, fimVacCom - diasNoMesReal);
        const diasFeriasNoMesComercial = Math.min(diasFerias, 30 - (diaInicio - 1));
        const diasTrabalhadosMes = 30 - diasFeriasNoMesComercial;
        simulacaoAtualGlobal.temFerias = true;
        simulacaoAtualGlobal.diasFerias = diasFerias;
        simulacaoAtualGlobal.diaInicioFerias = diaInicio;
        simulacaoAtualGlobal.diasTrabalhadosNoMes = diasTrabalhadosMes;
        simulacaoAtualGlobal.spilloverDias = spilloverDias;
        simulacaoAtualGlobal.brutoFerias = simulacaoAtualGlobal.bruto;
    } else {
        // 🎯 Este mês não tem férias próprias. Deriva os dias trabalhados
        // DIRETAMENTE do spillover do mês anterior — NÃO lê o config
        // deste mês (que pode estar desatualizado com dados antigos de
        // quando o toggle estava ligado). Ex: se o usuário acabou de
        // DESLIGAR férias de Dezembro e salvar, Dezembro tem 30 dias
        // trabalhados (mês normal) — não 6 (o valor antigo).
        simulacaoAtualGlobal.temFerias = false;
        const mesAntSalvar = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() - 1, 1);
        const cfgAntSalvar = configHoleriteGlobal[window.chaveMes(mesAntSalvar)];
        let spilloverAntSalvar = 0;
        if (cfgAntSalvar && cfgAntSalvar.temFerias) {
            const df = parseInt(cfgAntSalvar.diasFerias) || 30;
            const di = parseInt(cfgAntSalvar.diaInicioFerias) || 1;
            const dn = new Date(mesAntSalvar.getFullYear(), mesAntSalvar.getMonth() + 1, 0).getDate();
            spilloverAntSalvar = Math.max(0, (di + df - 1) - dn);
        }
        simulacaoAtualGlobal.diasTrabalhadosNoMes = 30 - spilloverAntSalvar;
        simulacaoAtualGlobal.spilloverDias = 0;
    }

    // Salva a simulação diretamente, sem abrir o modal de conta
    configHoleriteGlobal[window.chaveMes(dataFiltro)] = simulacaoAtualGlobal;
    
    let chave = window.chaveMes(dataFiltro); 
    if (!saldoBaseMensalGlobal[chave]) saldoBaseMensalGlobal[chave] = {};
    
    // Como não há mais conta de destino, salvamos apenas os valores.
    // 🎯 Guardamos `valor13` também, para que o fallback consiga
    // reproduzir a transferência do 13º (Salário → Vale) sem depender
    // exclusivamente do `configHoleriteGlobal`.
    saldoBaseMensalGlobal[chave].vale = simulacaoAtualGlobal.valeAdiantamento || 0;
    saldoBaseMensalGlobal[chave].salario = simulacaoAtualGlobal.salarioLiquido || 0;
    saldoBaseMensalGlobal[chave].valor13 = simulacaoAtualGlobal.valor13 || 0;
    
    syncToFirebase();
    
    // Atualiza a tela de contas e o carrossel com o dinheiro novo
    if(typeof renderizarCarrosselContas === 'function') renderizarCarrosselContas();
    if(typeof renderTabelaContasTela === 'function') renderTabelaContasTela();
    atualizarTabela();
    
    // ✅ Salvo! O aviso de "não salvo" some imediatamente.
    simulacaoTemAlteracoesNaoSalvas = false;
    atualizarAvisoNaoSalvo();

    window.mostrarAviso("Simulação salva com sucesso!", "sucesso");
    window.mudarParaAbaCaixa();
});
// Conecta o novo menu no motor de fechamento
document.getElementById('btnContaSimulacao')?.addEventListener('click', (e) => { 
    window.abrirMenuExclusivo('menuContaSimulacao', e); 
});

// Garante que clicar fora feche a lista
document.addEventListener('click', (e) => {
    const btn = document.getElementById('btnContaSimulacao');
    const menu = document.getElementById('menuContaSimulacao');
    if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        menu.classList.add('hidden');
    }
});

document.getElementById('btnConfirmarSalvarSimulacao').addEventListener('click', function() {
    const contaEscolhida = document.getElementById('contaDestinoSimulacao').value;
    
    // Atualiza a simulacao atual com a conta escolhida
    simulacaoAtualGlobal.contaVale = contaEscolhida;
    simulacaoAtualGlobal.contaSalario = contaEscolhida;

    configHoleriteGlobal[window.chaveMes(dataFiltro)] = simulacaoAtualGlobal;
    let chave = window.chaveMes(dataFiltro); if (!saldoBaseMensalGlobal[chave]) saldoBaseMensalGlobal[chave] = {};
    
    // Salvando as contas destino escolhidas no cofre do mês!
    saldoBaseMensalGlobal[chave].contaVale = contaEscolhida;
    saldoBaseMensalGlobal[chave].contaSalario = contaEscolhida;

    syncToFirebase();
    
    const btnConfirmar = document.getElementById('btnConfirmarSalvarSimulacao');
    const oText = btnConfirmar.textContent;
    btnConfirmar.textContent = "Salvo!";
    btnConfirmar.classList.replace('bg-[#0F172A]', 'bg-green-600');
    btnConfirmar.classList.replace('dark:bg-cyan-600', 'dark:bg-green-600');
    
    // Atualiza a tela de contas e o carrossel com o dinheiro novo
    if(typeof renderizarCarrosselContas === 'function') renderizarCarrosselContas();
    if(typeof renderTabelaContasTela === 'function') renderTabelaContasTela();

    // Animação e redirecionamento para o Resumo
    setTimeout(() => { 
        btnConfirmar.textContent = oText;
        btnConfirmar.classList.replace('bg-green-600', 'bg-[#0F172A]');
        btnConfirmar.classList.replace('dark:bg-green-600', 'dark:bg-cyan-600');
        window.fecharModalSimulacao();
        window.mudarParaAbaCaixa(); 
    }, 600);
});

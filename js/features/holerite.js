// Holerite e calendário
'use strict';

// ===================== MOTOR DE HOLERITE E CALENDÁRIO =====================
function obterFeriados(ano, cidade = 'Iperó - SP') { 
    let feriados = [
        { data: `${ano}-01-01`, nome: 'Confraternização Universal' }, 
        { data: `${ano}-04-03`, nome: 'Paixão de Cristo' }, 
        { data: `${ano}-04-21`, nome: 'Tiradentes' }, 
        { data: `${ano}-05-01`, nome: 'Dia do Trabalho' }, 
        { data: `${ano}-06-04`, nome: 'Corpus Christi' }, 
        { data: `${ano}-07-09`, nome: 'Rev. Constitucionalista (SP)' }, 
        { data: `${ano}-09-07`, nome: 'Independência do Brasil' }, 
        { data: `${ano}-10-12`, nome: 'Nossa Senhora Aparecida' }, 
        { data: `${ano}-11-02`, nome: 'Finados' }, 
        { data: `${ano}-11-15`, nome: 'Proclamação da República' }, 
        { data: `${ano}-11-20`, nome: 'Consciência Negra' }, 
        { data: `${ano}-12-25`, nome: 'Natal' }
    ]; 
    if (cidade === 'Iperó - SP') {
        feriados.push({ data: `${ano}-03-21`, nome: 'Aniversário de Iperó' });
        feriados.push({ data: `${ano}-06-13`, nome: 'Santo Antônio' });
    } else if (cidade === 'Sorocaba - SP') {
        feriados.push({ data: `${ano}-08-15`, nome: 'Aniversário de Sorocaba' });
    }
    return feriados;
}

function getPeriodoApurado(mesFiltro, anoFiltro) { return { mes: mesFiltro === 0 ? 11 : mesFiltro - 1, ano: mesFiltro === 0 ? anoFiltro - 1 : anoFiltro }; }

function calcularMotorCalendario(ano, mes) {
    let diasNoMes = new Date(ano, mes + 1, 0).getDate(); let domingos = 0; let feriadosNoMes = []; 
    let feriadosOficiais = obterFeriados(ano, meuPerfil.cidade || 'Iperó - SP');
    for(let i=1; i<=diasNoMes; i++) {
        let dA = new Date(ano, mes, i); let ehDom = dA.getDay() === 0; let ehSab = dA.getDay() === 6; let dS = `${ano}-${String(mes+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        let f = feriadosOficiais.find(x => x.data === dS);
        if(ehDom) domingos++; else if(f) feriadosNoMes.push({ dia: String(i).padStart(2,'0'), nome: f.nome, isFDS: ehSab ? '(Caiu no Sábado)' : '' });
    }
    let feriadosUteis = feriadosNoMes.filter(f => f.isFDS === '').length;
    return { uteis: diasNoMes - (domingos + feriadosUteis), dsr: domingos + feriadosUteis, listaFeriados: feriadosNoMes };
}

function getQuintoDiaUtil(ano, mes) {
    let dia = 1, diasUteis = 0; let feriados = obterFeriados(ano, meuPerfil.cidade || 'Iperó - SP').map(f => f.data);
    while (diasUteis < 5) {
        let d = new Date(ano, mes, dia); let dS = `${ano}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        let ehFeriado = feriados.includes(dS);
        if (d.getDay() !== 0 && !ehFeriado) diasUteis++;
        if (diasUteis < 5) dia++;
    }
    return new Date(ano, mes, dia);
}

function getDiaValeEfetivo(ano, mes) {
    const feriados = obterFeriados(ano, meuPerfil.cidade || 'Iperó - SP').map(f => f.data);
    let dia = 20;
    while (dia >= 1) {
        const d = new Date(ano, mes, dia);
        const dS = `${ano}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
        const ehDomingo = d.getDay() === 0;
        const ehFeriado = feriados.includes(dS);
        if (!ehDomingo && !ehFeriado) return new Date(ano, mes, dia);
        dia--;
    }
    // Fallback (nunca deve acontecer): dia 20 literal.
    return new Date(ano, mes, 20);
}

function getMotivoValeEfetivo(ano, mes) {
    const feriados = obterFeriados(ano, meuPerfil.cidade || 'Iperó - SP');
    const feriadosMap = {};
    feriados.forEach(f => { feriadosMap[f.data] = f.nome; });

    const d20 = new Date(ano, mes, 20);
    const d20Str = `${ano}-${String(mes+1).padStart(2,'0')}-20`;
    const domingo20 = d20.getDay() === 0;
    const feriado20 = feriadosMap[d20Str];

    // Dia 20 é útil (sábado conta) → não há nada a avisar.
    if (!domingo20 && !feriado20) return null;

    const dVale = getDiaValeEfetivo(ano, mes);
    const diaEfetivo = dVale.getDate();

    const motivos = [];
    for (let d = 20; d > diaEfetivo; d--) {
        const dd = new Date(ano, mes, d);
        const ddStr = `${ano}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        if (dd.getDay() === 0) motivos.push(`dia ${d} cai no domingo`);
        else if (feriadosMap[ddStr]) motivos.push(`dia ${d} é ${feriadosMap[ddStr]}`);
    }

    if (motivos.length === 0) return null;
    return `⚠️ ${motivos.join(' e ')} — antecipado.`;
}

function determinarOrigem(dataStr, natureza = 'Despesa', override = null) {
    if (override && override !== 'Auto') return override;
    if (meuPerfil.regime === 'PJ') return natureza === 'Receita' ? 'Recebimento' : 'Caixa';
    if (meuPerfil.temVale === 'Não') return 'Salário';
    if (!dataStr || typeof dataStr !== 'string') return 'Salário';
    const p = dataStr.split('/');
    if (p.length !== 3) return 'Salário';
    const dV = new Date(p[2], p[1] - 1, p[0]);
    if (isNaN(dV.getTime())) return 'Salário';
    const qDU = getQuintoDiaUtil(p[2], p[1] - 1);
    const diaValeEfetivo = getDiaValeEfetivo(p[2], p[1] - 1).getDate();
    return (parseInt(p[0]) >= diaValeEfetivo || dV < qDU) ? 'Vale' : 'Salário';
}

// 🎯 Atualiza os chips de Origem (Auto/Vale/Salário/Extra).
// Cada modal tem seu próprio par inputId/prefix para não conflitar.
window.selecionarOrigem = function(valor, inputId, prefix) {
    const input = document.getElementById(inputId);
    if (input) input.value = valor;
    const btns = document.querySelectorAll(`[data-origem-prefix="${prefix}"]`);
    const ativo = ['bg-slate-900', 'text-white', 'shadow-sm'];
    const inativo = ['text-slate-500', 'dark:text-gray-400', 'hover:text-slate-700', 'dark:hover:text-gray-200'];
    btns.forEach(btn => {
        const isAtivo = btn.dataset.origemValor === valor;
        btn.classList.remove(...ativo, ...inativo);
        btn.classList.add(...(isAtivo ? ativo : inativo));
    });
};

let simulacaoAtualGlobal = {};
// ⚠️ Flag: usuário mexeu em algum campo do simulador sem salvar?
// Controla a exibição do banner âmbar + o pulso no botão "Salvar Projeção".
let simulacaoTemAlteracoesNaoSalvas = false;

// Aplica o estado do aviso à UI. Chamada por calcularMotorFolha (após
// recalcular), pelo botão de salvar (para esconder) e ao recarregar o mês.
function atualizarAvisoNaoSalvo() {
    const avisoEl = document.getElementById('avisoAlteracoesNaoSalvas');
    const btnSalvar = document.getElementById('btnAplicarFolha');
    if (!avisoEl || !btnSalvar) return;
    if (simulacaoTemAlteracoesNaoSalvas) {
        avisoEl.classList.remove('hidden');
        btnSalvar.classList.add('anim-pulse-save');
    } else {
        avisoEl.classList.add('hidden');
        btnSalvar.classList.remove('anim-pulse-save');
    }
}

function calcularINSS(base) {
    // 🎯 INSS progressivo por faixas — cada alíquota incide SÓ sobre a
    // parcela da base que cai dentro da faixa. Correto em qualquer valor,
    // inclusive acima do teto (onde a fórmula antiga errava).
    //
    // Faixas 2026:
    //   1ª faixa: até R$ 1.621,00         → 7,5%
    //   2ª faixa: de 1.621,01 a 2.902,84  → 9,0%
    //   3ª faixa: de 2.902,85 a 4.354,27  → 12,0%
    //   4ª faixa: de 4.354,28 a 8.475,55  → 14,0%
    //   Teto: R$ 8.475,55 — nada acima disso é contribuído.
    const FAIXA1 = 1621.00;
    const FAIXA2 = 2902.84;
    const FAIXA3 = 4354.27;
    const FAIXA4 = 8475.55;

    if (base <= 0) return 0;

    if (base <= FAIXA1) {
        return base * 0.075;
    } else if (base <= FAIXA2) {
        return (FAIXA1 * 0.075) + ((base - FAIXA1) * 0.09);
    } else if (base <= FAIXA3) {
        return (FAIXA1 * 0.075) + ((FAIXA2 - FAIXA1) * 0.09) + ((base - FAIXA2) * 0.12);
    } else if (base <= FAIXA4) {
        return (FAIXA1 * 0.075) + ((FAIXA2 - FAIXA1) * 0.09) + ((FAIXA3 - FAIXA2) * 0.12) + ((base - FAIXA3) * 0.14);
    } else {
        // Base acima do teto → contribuição máxima (teto da 4ª faixa)
        return (FAIXA1 * 0.075) + ((FAIXA2 - FAIXA1) * 0.09) + ((FAIXA3 - FAIXA2) * 0.12) + ((FAIXA4 - FAIXA3) * 0.14);
    }
}
function calcularIRRF(baseTributavel, qtdDependentes) {
    // 🎯 IRRF 2026 — com redutor da Lei 15.079/2024.
    //
    // A regra correta é:
    //   1. Calcula o IRRF pela TABELA PROGRESSIVA CLÁSSICA (que sempre existiu)
    //   2. Aplica o REDUTOR por cima, subtraindo do valor apurado
    //   3. O resultado nunca fica negativo
    //
    // O redutor zera a cobrança até R$ 5.000 e vai diminuindo
    // linearmente até R$ 7.350. Acima disso, o redutor é zero.

    const inss = calcularINSS(baseTributavel);
    const deducaoDep = (parseInt(qtdDependentes) || 0) * 189.59;
    const baseIRRF = baseTributavel - inss - deducaoDep;

    if (baseIRRF <= 0) return 0;

    // 1) IRRF pela tabela progressiva clássica
    let irrfTabela = 0;
    if (baseIRRF <= 2428.80)      irrfTabela = 0;
    else if (baseIRRF <= 2826.65) irrfTabela = (baseIRRF * 0.075) - 182.16;
    else if (baseIRRF <= 3751.05) irrfTabela = (baseIRRF * 0.15)  - 394.16;
    else if (baseIRRF <= 4664.68) irrfTabela = (baseIRRF * 0.225) - 675.49;
    else                          irrfTabela = (baseIRRF * 0.275) - 908.73;
    irrfTabela = Math.max(0, irrfTabela);

    // 2) Redutor 2026 — só incide até R$ 7.350
    let redutor = 0;
    if (baseIRRF <= 7350.00) {
        redutor = Math.max(0, 978.62 - (0.133145 * baseIRRF));
    }

    // 3) Resultado final
    return Math.max(0, irrfTabela - redutor);
}

const chkFerias = document.getElementById('checkFerias');
const boxFerias = document.getElementById('boxDiasFerias');
const boxDiaInicioFerias = document.getElementById('boxDiaInicioFerias');
const lblMesAnoFerias = document.getElementById('lblMesAnoFerias');

// 🎯 Atualiza o sufixo "/MM/AAAA" com base no mês visualizado no header.
// Chamado sempre que o usuário troca de mês (via carregarOuCalcularFolha).
function atualizarLabelMesAnoFerias() {
    if (!lblMesAnoFerias) return;
    const m = String(dataFiltro.getMonth() + 1).padStart(2, '0');
    const a = dataFiltro.getFullYear();
    lblMesAnoFerias.textContent = `/${m}/${a}`;
}

chkFerias.addEventListener('change', function() {
    if(this.checked) { 
        boxFerias.classList.remove('invisible');
        setTimeout(() => boxFerias.classList.remove('opacity-0'), 10);
        boxDiaInicioFerias.classList.remove('hidden');
        atualizarLabelMesAnoFerias();
    } 
    else { 
        boxFerias.classList.add('opacity-0'); 
        setTimeout(() => { boxFerias.classList.add('invisible'); }, 300); 
        boxDiaInicioFerias.classList.add('hidden');
    }
    simulacaoTemAlteracoesNaoSalvas = true;
    calcularMotorFolha();
});
// Arrow function: calcularMotorFolha é declarada em ferias.js, carregado depois deste arquivo.
document.getElementById('holDiasFerias')?.addEventListener('input', () => calcularMotorFolha());

// Listener do campo "Dia de Início" — aceita apenas 1..31
document.getElementById('holDiaInicioFerias')?.addEventListener('input', function() {
    let v = parseInt(this.value);
    if (isNaN(v)) return;
    if (v < 1) v = 1;
    if (v > 31) v = 31;
    this.value = v;
    calcularMotorFolha();
});

function carregarOuCalcularFolha() {
    const elsCLT = document.querySelectorAll('.clt-only');
    const elsPJ = document.querySelectorAll('.pj-only');
    const boxDatas = document.getElementById('boxDatasCreditoFolha');
    const cardVale = document.getElementById('cardCreditoVale');
    const btnAplicar = document.getElementById('btnAplicarFolha');
    
    if (meuPerfil.regime === 'PJ') {
        elsCLT.forEach(el => el.classList.add('hidden'));
        elsPJ.forEach(el => el.classList.remove('hidden'));
        if(boxDatas) boxDatas.classList.add('hidden');
        document.getElementById('lblSalarioBruto').textContent = 'Faturamento Bruto (R$)';
        document.getElementById('lblDescontosAvulsos').textContent = 'Gastos e Despesas do Mês:';
        btnAplicar.classList.add('hidden'); 
    } else {
        elsCLT.forEach(el => el.classList.remove('hidden'));
        elsPJ.forEach(el => el.classList.add('hidden'));
        if(boxDatas) boxDatas.classList.remove('hidden');
        document.getElementById('lblSalarioBruto').textContent = 'Salário Bruto do Mês Anterior (R$)';
        document.getElementById('lblDescontosAvulsos').textContent = 'Descontos Avulsos (Faltas, etc):';
        btnAplicar.classList.remove('hidden');
        if (meuPerfil.temVale === 'Não' && cardVale) cardVale.classList.add('hidden');
        else if (cardVale) cardVale.classList.remove('hidden');
    }

    let apurado = getPeriodoApurado(dataFiltro.getMonth(), dataFiltro.getFullYear()); let diasCalc = calcularMotorCalendario(apurado.ano, apurado.mes);
    const strMes = String(apurado.mes+1).padStart(2,'0'); const diasNoMesTotal = new Date(apurado.ano, apurado.mes + 1, 0).getDate();
    let feriadosHtml = diasCalc.listaFeriados.length > 0 ? `• Feriados: ${diasCalc.listaFeriados.map(f => `${f.dia} ${f.nome} <span class="text-slate-900 dark:text-cyan-500">${f.isFDS}</span>`).join(' | ')}` : 'Nenhum feriado no período';
    
    if (meuPerfil.regime === 'PJ') {
        let diasCalcPJ = calcularMotorCalendario(dataFiltro.getFullYear(), dataFiltro.getMonth());
        let feriadosPJ = diasCalcPJ.listaFeriados.length > 0 ? `• Feriados do mês: ${diasCalcPJ.listaFeriados.map(f => `${f.dia} ${f.nome} <span class="text-slate-900 dark:text-cyan-500">${f.isFDS}</span>`).join(' | ')}` : '• Nenhum feriado neste mês';
        document.getElementById('lblInfoCalendario').innerHTML = `<span class="opacity-80 text-[12px] font-semibold">${feriadosPJ}</span>`;
    } else {
        document.getElementById('lblInfoCalendario').innerHTML = `Período Apurado: <strong>01/${strMes} a ${diasNoMesTotal}/${strMes}</strong> &nbsp;•&nbsp; <strong>${diasCalc.uteis} Úteis</strong> &nbsp;•&nbsp; <strong>${diasCalc.dsr} DSR</strong><br><span class="opacity-80 text-[10.5px] font-semibold uppercase tracking-wider mt-1 block">${feriadosHtml}</span>`;
    }
    
    document.getElementById('holDiasUteis').value = diasCalc.uteis; document.getElementById('holDiasNaoUteis').value = diasCalc.dsr;
    document.getElementById('holExt50').value = ''; document.getElementById('holExt100').value = ''; document.getElementById('holBonusNome').value = ''; document.getElementById('holBonusVal').value = ''; document.getElementById('holDescNome1').value = ''; document.getElementById('holDescVal1').value = ''; document.getElementById('holDescNome2').value = ''; document.getElementById('holDescVal2').value = ''; document.getElementById('holDescNome3').value = ''; document.getElementById('holDescVal3').value = ''; 
    
    const dNome4 = document.getElementById('holDescNome4'); if(dNome4) dNome4.value = ''; 
    const dVal4 = document.getElementById('holDescVal4'); if(dVal4) dVal4.value = ''; 
    const dNome5 = document.getElementById('holDescNome5'); if(dNome5) dNome5.value = ''; 
    const dVal5 = document.getElementById('holDescVal5'); if(dVal5) dVal5.value = ''; 
    
    const inputHolDespesasPJ = document.getElementById('holDespesasPJ');
    if (inputHolDespesasPJ) inputHolDespesasPJ.value = '';

    // Atualiza o sufixo "/MM/AAAA" do campo de férias conforme o mês visualizado
    if (typeof atualizarLabelMesAnoFerias === 'function') atualizarLabelMesAnoFerias();

    let hol = configHoleriteGlobal[window.chaveMes(dataFiltro)];
    if(hol) {
        document.getElementById('holBruto').value = formatarParaMascara(hol.bruto); document.getElementById('holHoras').value = hol.horasMensais || meuPerfil.horas || '220';
        document.getElementById('holConvMed').value = formatarParaMascara(hol.convMed); document.getElementById('holConvOdo').value = formatarParaMascara(hol.convOdo);
        document.getElementById('holFretadoPct').value = hol.fretadoPct || ''; document.getElementById('holExt50').value = hol.ext50 || ''; document.getElementById('holExt100').value = hol.ext100 || ''; document.getElementById('holBonusNome').value = hol.bonusNome || ''; document.getElementById('holBonusVal').value = formatarParaMascara(hol.bonusVal); document.getElementById('holDescNome1').value = hol.descNome1 || ''; document.getElementById('holDescVal1').value = formatarParaMascara(hol.descVal1); document.getElementById('holDescNome2').value = hol.descNome2 || ''; document.getElementById('holDescVal2').value = formatarParaMascara(hol.descVal2); document.getElementById('holDescNome3').value = hol.descNome3 || ''; document.getElementById('holDescVal3').value = formatarParaMascara(hol.descVal3); 
        
        if(dNome4) dNome4.value = hol.descNome4 || ''; 
        if(dVal4) dVal4.value = formatarParaMascara(hol.descVal4); 
        if(dNome5) dNome5.value = hol.descNome5 || ''; 
        if(dVal5) dVal5.value = formatarParaMascara(hol.descVal5);
        
        if (inputHolDespesasPJ) inputHolDespesasPJ.value = formatarParaMascara(hol.despesasPJ);
    } else {
        document.getElementById('holBruto').value = formatarParaMascara(meuPerfil.salario); document.getElementById('holHoras').value = meuPerfil.horas || '220';
        document.getElementById('holConvMed').value = ''; document.getElementById('holConvOdo').value = ''; document.getElementById('holFretadoPct').value = '';
        if (inputHolDespesasPJ) inputHolDespesasPJ.value = '';
    }

    // Sincroniza o toggle de férias com o que foi salvo para o mês.
    const feriasSalvasDoMes = hol && hol.temFerias;
    if (feriasSalvasDoMes) {
        chkFerias.checked = true;
        boxFerias.classList.remove('invisible');
        boxDiaInicioFerias.classList.remove('hidden');
        setTimeout(() => boxFerias.classList.remove('opacity-0'), 10);
        document.getElementById('holDiasFerias').value = hol.diasFerias || 30;
        document.getElementById('holDiaInicioFerias').value = hol.diaInicioFerias || 1;
        atualizarLabelMesAnoFerias();
    } else {
        chkFerias.checked = false;
        boxFerias.classList.add('opacity-0');
        boxDiaInicioFerias.classList.add('hidden');
        setTimeout(() => boxFerias.classList.add('invisible'), 300);
        document.getElementById('holDiasFerias').value = 30;
        document.getElementById('holDiaInicioFerias').value = 1;
    }

    simulacaoTemAlteracoesNaoSalvas = false;

    calcularMotorFolha();
}

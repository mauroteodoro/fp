// Calculadora visual
'use strict';

// ===================== MOTOR CALCULADORA VISUAL =====================
let calcTargetInput = null; let calcExpressao = ""; let calcValor = "0"; let calcAcumulado = null; let calcOperador = null; let calcNovaEntrada = false;

window.abrirCalculadora = function(inp) {
    calcTargetInput = inp;
    let valOriginal = inp.value.replace(/\./g, '').trim();
    calcValor = valOriginal ? valOriginal : "0";
    calcAcumulado = null; calcOperador = null; calcExpressao = ""; calcNovaEntrada = false;
    atualizarVisorCalc();
    
    window.abrirModalGenerico('modalCalculadora');
    inp.blur();
}

window.fecharCalculadora = function() {
    const modal = document.getElementById('modalCalculadora');
    if(!modal || modal.classList.contains('hidden')) return;
    window.fecharModalGenerico('modalCalculadora', 'flex', null, () => { calcTargetInput = null; });
}

function parseMoeda(str) { return window.paraFloat(str); }
function formatMoedaCalc(num) { return window.paraMoedaBR(num); }

function resolveOperacaoPrevia() {
    if (calcOperador && calcAcumulado !== null) {
        let numAtual = parseMoeda(calcValor);
        let res = 0;
        switch(calcOperador) {
            case '+': res = calcAcumulado + numAtual; break;
            case '-': res = calcAcumulado - numAtual; break;
            case '*': res = calcAcumulado * numAtual; break;
            case '/': res = numAtual !== 0 ? calcAcumulado / numAtual : 0; break;
        }
        calcValor = formatMoedaCalc(res); calcAcumulado = res;
    } else { calcAcumulado = parseMoeda(calcValor); }
}

window.calcAction = function(btn) {
    if (!calcTargetInput) return;
    if (/[0-9]/.test(btn) || btn === '00' || btn === ',') {
        if (calcNovaEntrada) { calcValor = btn === ',' ? "0," : btn; calcNovaEntrada = false; } else {
            if (calcValor === "0" && btn !== ',') calcValor = btn === '00' ? "0" : btn;
            else { if (btn === ',' && calcValor.includes(',')) return; calcValor += btn; }
        }
    }
    else if (btn === 'C') { calcValor = "0"; calcExpressao = ""; calcAcumulado = null; calcOperador = null; calcNovaEntrada = false; }
    else if (btn === 'DEL') {
        if (calcNovaEntrada) return;
        if (calcValor.length > 1) calcValor = calcValor.slice(0, -1); else calcValor = "0";
    }
    else if (['+', '-', '*', '/'].includes(btn)) {
        if (calcNovaEntrada && calcOperador) { calcOperador = btn; } else {
            resolveOperacaoPrevia(); calcOperador = btn; calcNovaEntrada = true;
        }
        let sinalVisual = btn === '*' ? 'x' : (btn === '/' ? '÷' : btn);
        calcExpressao = formatMoedaCalc(calcAcumulado) + ' ' + sinalVisual + ' ';
    }
    else if (btn === '%') {
        let num = parseMoeda(calcValor);
        if (calcAcumulado !== null && calcOperador !== null) {
            calcValor = formatMoedaCalc(calcAcumulado * (num / 100));
        } else { calcValor = formatMoedaCalc(num / 100); }
        calcNovaEntrada = true; 
    }
    else if (btn === 'CONFIRM') {
        if (calcOperador) {
            resolveOperacaoPrevia(); calcExpressao = ""; calcOperador = null; calcNovaEntrada = true;
        } else {
            let finalFloat = parseMoeda(calcValor);
            calcTargetInput.value = formatMoedaCalc(finalFloat);
            calcTargetInput.dispatchEvent(new Event('input')); 
            calcTargetInput.dispatchEvent(new Event('blur')); // <-- Dispara o evento que recoloca os pontos!
            fecharCalculadora();
        }
    }
    atualizarVisorCalc();
}

function atualizarVisorCalc() {
    document.getElementById('calcDisplay').textContent = calcValor;
    document.getElementById('calcExpressao').textContent = calcExpressao;
    if (calcOperador) { document.getElementById('iconCalcCheck').classList.add('hidden'); document.getElementById('iconCalcEqual').classList.remove('hidden'); } else { document.getElementById('iconCalcCheck').classList.remove('hidden'); document.getElementById('iconCalcEqual').classList.add('hidden'); }
}

document.addEventListener('keydown', function(e) {
    const modalCalc = document.getElementById('modalCalculadora');
    
    // 1. Calculadora (Se ela estiver aberta, intercepta tudo)
    if (modalCalc && !modalCalc.classList.contains('hidden')) {
        e.preventDefault(); const key = e.key;
        if (/[0-9]/.test(key)) calcAction(key);
        else if (key === ',' || key === '.') calcAction(',');
        else if (key === '+') calcAction('+');
        else if (key === '-') calcAction('-');
        else if (key === '*') calcAction('*');
        else if (key === '/') calcAction('/');
        else if (key === 'Enter') { calcAction('CONFIRM'); if (document.activeElement) document.activeElement.blur(); }
        else if (key === 'Backspace') calcAction('DEL');
        else if (key === 'Escape') fecharCalculadora();
        else if (key === '%') calcAction('%');
        return; // Bloqueia para não fechar o que está atrás
    } 
    
    // ═══════════════════════════════════════════════════════════
    // 2. Sistema Global de ESC — fecha o elemento do TOPO, em ordem
    //    de prioridade: painel interno → dropdown → modal.
    // ═══════════════════════════════════════════════════════════
    if (e.key === 'Escape') {
        // ═══ Camada 1: painéis internos do modal de lançamento ═══
        // "Mais opções" (novo) e "Mais informações" (edição) vivem
        // DENTRO dos respectivos modais. Se um deles está aberto,
        // é a primeira coisa a fechar — o usuário está "dentro" dele.
        const panelMaisNovo = document.getElementById('panelMaisInfosForm');
        if (panelMaisNovo && !panelMaisNovo.classList.contains('hidden')) {
            panelMaisNovo.classList.add('hidden');
            const colDir = document.getElementById('colunaDireitaForm');
            if (colDir) colDir.classList.remove('invisible');
            document.querySelectorAll('#modalNovoLancamento svg.seta').forEach(s => s.classList.remove('rotate-180'));
            return;
        }
        const panelMaisEdit = document.getElementById('panelMaisInfosEdit');
        if (panelMaisEdit && !panelMaisEdit.classList.contains('hidden')) {
            panelMaisEdit.classList.add('hidden');
            document.querySelectorAll('#modalEdicao svg.seta-edit, #modalEdicao button svg.transition-transform').forEach(s => s.classList.remove('rotate-180'));
            return;
        }

        // ═══ Camada 2: dropdowns suspensos (acordeão) ═══
        // Cobre 4 famílias: TODOS_OS_MENUS, kebab do extrato,
        // dropdowns de ano e o autocomplete da Descrição.
        let fechouDropdown = false;

        TODOS_OS_MENUS.forEach(item => {
            const m = document.getElementById(item.m);
            if (m && !m.classList.contains('hidden')) {
                m.classList.add('hidden');
                fechouDropdown = true;
            }
        });

        document.querySelectorAll('.menu-acoes-extrato').forEach(m => {
            if (!m.classList.contains('hidden')) { m.classList.add('hidden'); fechouDropdown = true; }
        });

        document.querySelectorAll('.ano-dropdown').forEach(m => {
            if (!m.classList.contains('hidden')) { m.classList.add('hidden'); fechouDropdown = true; }
        });

        if (fechouDropdown) return;

        // ═══ Camada 3: modais ═══
        // 🎯 Ordem do topo pra base. O calendário usa `style.display`
        // (não classe `hidden`), então checamos por ele —
        // era aqui que a cadeia `else if` morria antes.
        const calEl = document.getElementById('modalCalendarioGrande');
        if (calEl && calEl.style.display === 'flex') window.fecharCalendarioGrande();
        else if (!document.getElementById('modalBuscaGlobal').classList.contains('hidden')) fecharBuscaGlobal();
        else if (!document.getElementById('modalNovoLancamento').classList.contains('hidden')) fecharModalLancamento();
        else if (!document.getElementById('modalTransferencia').classList.contains('hidden')) fecharModalTransferencia();
        else if (!document.getElementById('modalSalvarSimulacao').classList.contains('hidden')) fecharModalSimulacao();
        else if (!document.getElementById('modalCategorias').classList.contains('hidden')) fecharModalCategorias();
        else if (!document.getElementById('modalContas').classList.contains('hidden')) fecharModalContas();
        else if (!document.getElementById('modalPerfil').classList.contains('hidden')) fecharModalPerfil();
        else if (!document.getElementById('modalOrcamentos').classList.contains('hidden')) fecharModalOrcamentos();
        else if (!document.getElementById('modalEdicao').classList.contains('hidden')) fecharModalEdicao();
        else if (!document.getElementById('modalApagar').classList.contains('hidden')) fecharModalApagar();
        else if (!document.getElementById('modalEncerrar').classList.contains('hidden')) fecharModalEncerrar();
        else if (!document.getElementById('modalAjuste').classList.contains('hidden')) fecharModalAjuste();
        else if (!document.getElementById('modalImportar').classList.contains('hidden')) fecharModalImportar();
        else if (!document.getElementById('modalBackups').classList.contains('hidden')) fecharModalBackups();
        else if (!document.getElementById('modalReset').classList.contains('hidden')) fecharModalReset();
        else if (!document.getElementById('modalExplicacao').classList.contains('hidden')) fecharModalExplicacao();
    }
});

// Máscaras de campos
'use strict';

// ===================== MÁSCARAS =====================
function configurarEventosMascaraMoeda(inp) {
    inp.addEventListener('input', function(e) {
        let v = e.target.value;

        // 🎯 Normaliza o que o usuário (ou a calculadora) injetou, sem
        // destruir valores já formatados:
        //
        //   • Se JÁ existe vírgula, então os pontos são separadores de
        //     MILHAR (formatação PT-BR). Removemos TODOS.
        //     Ex: "1.000,00" → "1000,00"
        //
        //   • Se NÃO existe vírgula mas existe ponto, o último ponto é
        //     o separador decimal (Android geralmente envia ponto).
        //     Pontos anteriores são milhar.
        //     Ex: "10.5" → "10,5"   |   "1.000.5" → "1000,5"
        //
        // O código antigo fazia `replace(/\./g, ',')` em TUDO — o que
        // transformava "1.000,00" em "1,000,00" e depois em "1,00"
        // após o blur. Resultado: digitar "1000" virava R$ 1,00.
        v = v.replace(/[^0-9.,]/g, "");

        if (v.includes(',')) {
            v = v.replace(/\./g, '');
        } else {
            const lastDot = v.lastIndexOf('.');
            if (lastDot > -1) {
                v = v.substring(0, lastDot).replace(/\./g, '') + ',' + v.substring(lastDot + 1);
            }
        }

        // Garante que existe no máximo UMA vírgula
        const parts = v.split(',');
        if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('');

        e.target.value = v;
    });
    inp.addEventListener('blur', function(e) {
        if (!e.target.value) return;
        e.target.value = window.paraMoedaBR(window.paraFloat(e.target.value));
    });
    inp.addEventListener('focus', function(e) {
        if (e.target.value) { e.target.value = e.target.value.replace(/\./g, ''); }
        setTimeout(() => { e.target.select(); }, 10);
    });
}

function aplicarMascaraCalculadora(inp) {
    if (!inp) return;
    configurarEventosMascaraMoeda(inp);

    if (!inp.parentNode.classList.contains('has-calc-wrapper')) {
        // Inputs com border-b (minimalistas) usam posicionamento compacto.
        const ehMinimalista = inp.classList.contains('border-b') && !inp.classList.contains('border');

        const wrapper = document.createElement('div');
        wrapper.className = 'relative w-full has-calc-wrapper';
        inp.parentNode.insertBefore(wrapper, inp);
        wrapper.appendChild(inp);

        const btnCalc = document.createElement('button');
        btnCalc.type = 'button';

        if (ehMinimalista) {
            // Alinhado à direita, verticalmente centrado na linha do border-b
            inp.style.paddingRight = '1.75rem';
            btnCalc.className = 'absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-cyan-500 transition-colors p-0.5 active:scale-90 z-10';
            btnCalc.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>`;
        } else {
            // Posicionamento tradicional para inputs em "caixa"
            inp.style.paddingRight = '2.5rem';
            btnCalc.className = 'absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-cyan-500 transition-colors p-1 active:scale-90 z-10';
            btnCalc.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>`;
        }

        btnCalc.addEventListener('click', function(e) { e.stopPropagation(); abrirCalculadora(inp); });
        wrapper.appendChild(btnCalc);
    }
}

function aplicarMascaraSimples(inp) {
    if (!inp) return;
    configurarEventosMascaraMoeda(inp);
}
// 🎯 Expõe as funções críticas em `window` para que possam ser
//    chamadas de dentro de funções `window.*` (como as do modal
//    de Orçamentos) — que vivem fora do escopo deste módulo.
//    Sem isso: `renderListaOrcamentos` quebra ao tentar aplicar a
//    máscara nos inputs, e o modal nunca chega a abrir.
window.aplicarMascaraSimples = aplicarMascaraSimples;
window.syncToFirebase = syncToFirebase;

aplicarMascaraCalculadora(document.getElementById('valor')); 
aplicarMascaraCalculadora(document.getElementById('editValor')); 
aplicarMascaraCalculadora(document.getElementById('holDespesasPJ')); 
aplicarMascaraCalculadora(document.getElementById('holBruto')); 
aplicarMascaraCalculadora(document.getElementById('transfValor')); 

aplicarMascaraSimples(document.getElementById('perfilSalario')); 
aplicarMascaraSimples(document.getElementById('holConvMed')); 
aplicarMascaraSimples(document.getElementById('holConvOdo')); 
aplicarMascaraSimples(document.getElementById('holBonusVal')); 
aplicarMascaraSimples(document.getElementById('holDescVal1')); 
aplicarMascaraSimples(document.getElementById('holDescVal2')); 
aplicarMascaraSimples(document.getElementById('holDescVal3'));
aplicarMascaraSimples(document.getElementById('holDescVal4'));
aplicarMascaraSimples(document.getElementById('holDescVal5'));
aplicarMascaraSimples(document.getElementById('inputAjusteBase'));

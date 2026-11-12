// Ajuste automático do tamanho dos saldos
'use strict';

// ===================== AJUSTE INTELIGENTE DE FONTES (SALDOS) =====================
const observadorDeSaldos = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
            const el = mutation.target.nodeType === 3 ? mutation.target.parentNode : mutation.target;
            if (el.classList && el.classList.contains('valor-sensivel')) {
                // 🎯 Quando o valor está mascarado, o texto atual é
                // "••••••" (6 chars) — mas o tamanho da fonte deve
                // considerar o valor REAL para o layout não dançar
                // entre oculto e visível. `data-valor-real` guarda
                // essa referência; sem ele, cai no texto atual.
                const texto = (el.getAttribute('data-valor-real') || el.textContent).trim();
                el.classList.remove('text-xl', 'xl:text-2xl', 'text-lg', 'xl:text-xl', 'text-base', 'xl:text-lg', 'text-sm', 'xl:text-base', 'text-xs', 'text-[10px]');
                
                if (el.dataset.tamanhoFixo === 'xxs') {
                    el.classList.add('text-[11px]', 'sm:text-sm');
                } else if (el.dataset.tamanhoFixo === 'xs') {
                    el.classList.add('text-base');
                } else if (texto.length >= 14) { el.classList.add('text-sm', 'xl:text-base'); } else if (texto.length >= 11) { el.classList.add('text-base', 'xl:text-lg'); } else if (texto.length >= 9) { el.classList.add('text-lg', 'xl:text-xl'); } else { el.classList.add('text-xl', 'xl:text-2xl'); }
            }
        }
    });
});

document.querySelectorAll('.valor-sensivel').forEach(el => {
    const container = el.parentElement; if (container) { container.classList.remove('pr-6', 'pr-2'); container.classList.add('pr-1'); }
    // 🎯 Cards com TAMANHO FIXO por design — não devem passar pelo
    //    ajuste automático de fonte:
    //      • cardSaldoGeral   → hero, número principal da tela
    //      • cardDespesasMes  → mostra total consolidado do mês;
    //        ocupa 1/3 do grid e TEM espaço horizontal de sobra.
    //        Sem a exclusão, "R$ 1.368,40" (11 chars) era reduzido
    //        para `text-base`, ficando visivelmente menor que os
    //        cards irmãos (Salário e Vale, que ficam em `text-2xl`
    //        porque são mais curtos). Excluir mantém consistência.
    if (el.id !== 'cardSaldoGeral' && el.id !== 'cardDespesasMes') {
        observadorDeSaldos.observe(el, { childList: true, characterData: true, subtree: true });
        el.textContent = el.textContent;
    }
});

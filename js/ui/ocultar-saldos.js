// Ocultar saldos e barras de consumo
'use strict';

// ===================== MOTOR DE OCULTAR SALDOS =====================
let saldosOcultos = false;

const _largurasBarrasCache = {};

window.aplicarMascaraValores = function() {
    document.querySelectorAll('.valor-sensivel').forEach(el => {
        if (saldosOcultos) {
            // Sempre atualiza o valor real ANTES de mascarar — assim,
            // se o texto foi alterado por algum update do app enquanto
            // estava oculto, o "restaurar" pega o valor fresco.
            if (!el.textContent.startsWith('•')) {
                el.setAttribute('data-valor-real', el.textContent);
            }
            // 🎯 Sempre 4 bolinhas — comprimento fixo, independente
            //    do valor. Uniformiza a leitura (nada vaza do valor
            //    real) e mantém o layout estável entre cards de
            //    ordens de grandeza diferentes.
            const masked = '••••';
            if (el.textContent !== masked) el.textContent = masked;
            el.classList.add('valor-borrado');
        } else {
            if (el.hasAttribute('data-valor-real')) {
                const original = el.getAttribute('data-valor-real');
                el.textContent = original;
                el.removeAttribute('data-valor-real');
            }
            el.classList.remove('valor-borrado');
        }
    });
};

document.getElementById('btnOcultarSaldos')?.addEventListener('click', function() {
    saldosOcultos = !saldosOcultos;

    const iconAberto = document.getElementById('iconOlhoAberto');
    const iconFechado = document.getElementById('iconOlhoFechado');

    // Alterna os ícones. Quando oculto → olho FECHADO (pálpebra).
    // Quando visível → olho ABERTO.
    if (saldosOcultos) {
        iconAberto.classList.add('hidden');
        iconFechado.classList.remove('hidden');
    } else {
        iconFechado.classList.add('hidden');
        iconAberto.classList.remove('hidden');
    }

    window.aplicarMascaraValores();

    // ═══════════════════════════════════════════════════════════
    // 🎯 BARRAS DE CONSUMO — Zerar ao ocultar, subir ao restaurar
    // ═══════════════════════════════════════════════════════════
    // Ao esconder os valores, a barra some (width: 0%). Ao mostrar,
    // a barra sobe lentamente até o valor real — a transição CSS
    // de 1.4s faz o efeito "encher" ficar bem evidente.
    //
    // O cache `_largurasBarrasCache` é populado a cada recálculo
    // (atualizarBarraConsumo) e guarda o pct REAL do momento,
    // mesmo enquanto as barras estão visualmente em 0%.
    const barraSal = document.getElementById('barraConsumoSalario');
    const barraVale = document.getElementById('barraConsumoVale');

    if (saldosOcultos) {
        // 🎯 Recolher via WAAPI: lê a largura atual em pixels,
        // converte para %, e anima até 0%. Sem CSS transition
        // envolvida — só um motor de animação comandando a barra.
        const recolherBarra = (barra) => {
            if (!barra) return;
            if (barra._animAtual) {
                try { barra._animAtual.cancel(); } catch(_) {}
                barra._animAtual = null;
            }
            // Lê a largura ATUAL em % (via getBoundingClientRect +
            // largura do trilho pai). Fallback para `style.width`
            // se o layout ainda não estiver pronto.
            const parentW = barra.parentElement ? barra.parentElement.getBoundingClientRect().width : 0;
            const atualPct = parentW > 0
                ? (barra.getBoundingClientRect().width / parentW) * 100
                : (parseFloat(barra.style.width) || 0);

            const anim = barra.animate(
                [{ width: atualPct + '%' }, { width: '0%' }],
                { duration: 1200, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' }
            );
            barra._animAtual = anim;
            anim.onfinish = () => {
                barra.style.width = '0%';
                try { anim.cancel(); } catch(_) {}
                barra._animAtual = null;
            };
        };
        recolherBarra(barraSal);
        recolherBarra(barraVale);
    } else {
        // Restaura a barra via WAAPI (CSS transition desligada durante a animação).
        const restaurarBarra = (barra) => {
            if (!barra) return;
            const cache = _largurasBarrasCache[barra.id];
            if (!cache) return;
            if (barra._animAtual) {
                try { barra._animAtual.cancel(); } catch(_) {}
                barra._animAtual = null;
            }
            // Cor baseada no pct (verde/âmbar/vermelho). A classe
            // é definida, mas não contém mais `transition` (a CSS
            // do topo foi alterada para não ter transition).
            barra.className = 'h-full rounded-full';
            if (cache.bgImage) barra.style.backgroundImage = cache.bgImage;
            // Ponto de partida: 0%.
            barra.style.width = '0%';
            void barra.offsetWidth;
            // WAAPI: 0% → pct, em 3s. Único motor de animação
            // atuando na barra.
            const anim = barra.animate(
                [
                    { width: '0%' },
                    { width: cache.pct + '%' }
                ],
                {
                    duration: 3000,
                    easing: 'cubic-bezier(0.34, 1.15, 0.64, 1)',
                    fill: 'forwards'
                }
            );
            barra._animAtual = anim;
            anim.onfinish = () => {
                barra.style.width = cache.pct + '%';
                try { anim.cancel(); } catch(_) {}
                barra._animAtual = null;
            };
        };
        restaurarBarra(barraSal);
        restaurarBarra(barraVale);
    }
});

// Reaplica a máscara quando o DOM é reconstruído (ex: carrossel).
const observadorMascara = new MutationObserver(() => {
    if (!saldosOcultos) return;
    window.aplicarMascaraValores();
});
const _alvoObsMascara = document.getElementById('appWrapper') || document.body;
observadorMascara.observe(_alvoObsMascara, {
    childList: true,
    subtree: true,
    characterData: true
});

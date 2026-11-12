// Alinhamento do conteúdo com o menu
'use strict';

// ═══════════════════════════════════════════════════════════
// 🎯 ALINHAMENTO RUNTIME — Conteúdo × Menu Lateral
// ═══════════════════════════════════════════════════════════
// Mede a posição REAL do primeiro botão do menu lateral
// (Resumo) e aplica como `padding-top` no wrapper de conteúdo.
// Resultado: o topo do primeiro card de cada aba (SALDOS
// PROJETADOS, EXTRATO MENSAL, MINHAS CONTAS, etc) fica na
// MESMA linha horizontal que o botão Resumo — independente de:
//   • largura da viewport
//   • altura real do header renderizado (fontes custom,
//     flex-wrap, zoom do SO)
//   • conflitos de especificidade entre Tailwind CDN e <style>
//   • atraso no carregamento das fontes do Google Fonts
//
// Guarda-corpos:
//   • Só age em desktop (≥768px) — em mobile o menu lateral
//     não existe e o override é removido.
//   • Ignora medições absurdas (<40px ou >300px), que
//     aconteceriam em estados transitórios (app oculto,
//     header em fade, etc).
//   • Não mexe no layout enquanto há modal aberto (body com
//     overflow travado).
//   • Só re-aplica se o valor mudou (evita repaints).
function alinharConteudoComMenu() {
    const conteudo = document.getElementById('conteudoPrincipal');
    if (!conteudo) return;

    // Não mexe no layout com modal aberto
    if (document.body.style.overflow === 'hidden') return;

    let offset = 0;

    if (window.innerWidth >= 768) {
        // ═══════════════════════════════════════════════════
        // DESKTOP / TABLET (≥768px) — alinha com o menu lateral
        // ═══════════════════════════════════════════════════
        // Referência: topo do primeiro botão do <nav> do aside
        // ("Resumo"). O wrapper de conteúdo recebe esse offset
        // como `padding-top`, garantindo que o primeiro card
        // (SALDOS PROJETADOS, EXTRATO MENSAL, MINHAS CONTAS…)
        // nasça na MESMA linha horizontal que o botão.
        const aside = conteudo.querySelector(':scope > aside');
        if (!aside) return;

        const primeiroBtn = aside.querySelector('nav > button');
        if (!primeiroBtn) return;

        const btnTop = primeiroBtn.getBoundingClientRect().top;
        const conteudoTop = conteudo.getBoundingClientRect().top;
        offset = btnTop - conteudoTop;

        if (offset < 40 || offset > 300) return;
    } else {
        // ═══════════════════════════════════════════════════
        // MOBILE (<768px) — alinha com a base real do header
        // ═══════════════════════════════════════════════════
        // Sem menu lateral. A referência passa a ser a altura
        // REAL do header fixo + um respiro curto. Usamos
        // `offsetHeight` (altura de layout, imune a scroll) em
        // vez de `--header-h` (declaração que pode divergir da
        // altura renderizada por causa de fontes customizadas
        // carregando depois, wrapping do flexbox, ou o botão ✨
        // extra na linha 2 do header em mobile).
        const header = document.getElementById('mainHeader');
        if (!header) return;

        const GAP_MOBILE = 12; // respiro entre header e 1º card
        offset = header.offsetHeight + GAP_MOBILE;

        if (offset < 60 || offset > 400) return;
    }

    // Só aplica se mudou (evita repaint desnecessário)
    const atual = parseFloat(conteudo.style.paddingTop) || 0;
    if (Math.abs(atual - offset) < 0.5) return;

    conteudo.style.setProperty('padding-top', offset + 'px', 'important');
}
window.alinharConteudoComMenu = alinharConteudoComMenu;

// 🎯 Observa mudanças de altura do header em tempo real.
//    Ex: quando o Google Fonts termina de carregar e o texto
//    do nome cresce, o header fica mais alto e o padding-top
//    do conteúdo precisa acompanhar — sem esperar por resize.
//    O header é `fixed` (fora do fluxo), então o observer não
//    entra em loop com a mudança de padding do conteúdo.
if (window.ResizeObserver) {
    const _headerEl = document.getElementById('mainHeader');
    if (_headerEl) {
        const _roHeader = new ResizeObserver(() => alinharConteudoComMenu());
        _roHeader.observe(_headerEl);
    }
}

// 🎯 Reajusta o tamanho do nome no header E realinha o conteúdo
// ao redimensionar / rotacionar. O realinhamento é necessário
// porque o header pode mudar de altura (wrapping do flexbox
// em larguras intermediárias) e o menu lateral acompanha.
let _timerResizeNome = null;
window.addEventListener('resize', () => {
    clearTimeout(_timerResizeNome);
    _timerResizeNome = setTimeout(() => {
        if (typeof ajustarFonteNomeHeader === 'function') {
            ajustarFonteNomeHeader(meuPerfil.nome || 'Mauro Santos');
        }
        alinharConteudoComMenu();
    }, 150);
});

setTimeout(() => { renderizarCarrosselContas(); }, 1500);

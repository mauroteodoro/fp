// Menu kebab do extrato (mobile)
'use strict';

// ===================== KEBAB MENU DO EXTRATO (MOBILE) =====================
// 🎯 Helper central: fecha todos os kebabs E baixa o z-index das
//    linhas que foram elevadas. Sem isso, uma linha "esquecida"
//    com z-index alto continuaria a flutuar sobre as demais.
function fecharTodosKebabsExtrato() {
    document.querySelectorAll('.menu-acoes-extrato').forEach(m => {
        m.classList.add('hidden');
        const linha = m.closest('.linha-extrato');
        if (linha) linha.style.zIndex = '';
    });
}

window.toggleMenuAcoesExtrato = function(e, menuId) {
    if (e) e.stopPropagation();
    const alvo = document.getElementById(menuId);
    if (!alvo) return;
    const estavaAberto = !alvo.classList.contains('hidden');
    // Fecha todos os outros (e limpa o z-index de suas linhas)
    fecharTodosKebabsExtrato();
    // Alterna
    if (!estavaAberto) {
        alvo.classList.remove('hidden');
        // Promove a linha inteira: o z-[9999] do menu só vale dentro dela.
        const linha = alvo.closest('.linha-extrato');
        if (linha) linha.style.zIndex = '40';
    }
};

window.fecharMenusExtrato = function() {
    fecharTodosKebabsExtrato();
};

document.addEventListener('click', (e) => {
    const dentroMenu = e.target.closest('.menu-acoes-extrato');
    const noBotaoKebab = e.target.closest('button[onclick*="toggleMenuAcoesExtrato"]');
    if (!dentroMenu && !noBotaoKebab) {
        fecharTodosKebabsExtrato();
    }
});

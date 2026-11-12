// ESC e cliques fora para fechar modais
'use strict';

// ═══════════════════════════════════════════════════════════
// 🖱️ FECHAR MODAL CLICANDO NO BACKDROP
// ═══════════════════════════════════════════════════════════
// Cada modal tem seu próprio "backdrop" — que pode ser o próprio
// `#modalX` (a maioria) OU um wrapper interno (no caso do
// `modalNovoLancamento`, que tem uma camada de padding). Mapeamos
// ID → nome de função de fechamento e ligamos um listener que
// só dispara quando o clique caiu EXATAMENTE no backdrop (nunca
// no card de conteúdo).
//
// Para blindar um modal específico desse comportamento (ex: um
// form longo que não deve fechar por acidente), basta adicionar
// o atributo `data-no-backdrop-close` no elemento raiz dele.
(function ativarFechamentoPorBackdrop() {
    const mapa = {
        'modalCalculadora': 'fecharCalculadora',
        'modalCategorias': 'fecharModalCategorias',
        'modalContas': 'fecharModalContas',
        'modalPerfil': 'fecharModalPerfil',
        'modalOrcamentos': 'fecharModalOrcamentos',
        'modalSalvarSimulacao': 'fecharModalSimulacao',
        'modalEdicao': 'fecharModalEdicao',
        'modalApagar': 'fecharModalApagar',
        'modalAjuste': 'fecharModalAjuste',
        'modalEncerrar': 'fecharModalEncerrar',
        'modalImportar': 'fecharModalImportar',
        'modalBuscaGlobal': 'fecharBuscaGlobal',
        'modalExplicacao': 'fecharModalExplicacao',
        'modalBackups': 'fecharModalBackups',
        'modalReset': 'fecharModalReset',
        'modalTransferencia': 'fecharModalTransferencia',
        'modalNovoLancamento': 'fecharECancelarLancamento'
    };

    Object.entries(mapa).forEach(([idModal, nomeFn]) => {
        const modal = document.getElementById(idModal);
        if (!modal) return;
        if (modal.hasAttribute('data-no-backdrop-close')) return;

        // Descobre qual elemento é o "backdrop":
        //   • Se o modal tem um wrapper `h-full w-full` como filho
        //     direto (ex: modalNovoLancamento), é o wrapper.
        //   • Senão, é o próprio modal.
        // 🎯 Detecção robusta do backdrop + do card de conteúdo.
        //   • `modal.children` em vez de `:scope > ...` — funciona em
        //     qualquer navegador e sobrevive a reordenação de classes.
        //   • O critério de "clique fora" agora é `card.contains(ev.target)`,
        //     que é à prova de balas: só ignora se o clique caiu DENTRO
        //     do card de conteúdo. Funciona mesmo se o alvo for o wrapper,
        //     o próprio modal ou algum elemento intermediário.
        const wrapper = Array.from(modal.children).find(c =>
            c.classList && c.classList.contains('h-full') && c.classList.contains('w-full')
        );
        const backdrop = wrapper || modal;
        const card = wrapper ? wrapper.firstElementChild : modal.firstElementChild;

        backdrop.addEventListener('click', (ev) => {
            if (card && card.contains(ev.target)) return;
            // 🎯 Clique FORA da aba de lançamentos → fecha a aba INTEIRA
            // (incluindo qualquer painel interno que esteja aberto).
            // O fechamento "só do painel" acontece quando o clique é
            // DENTRO do card, tratado pelo listener do formArea.
            const fn = window[nomeFn];
            if (typeof fn === 'function') fn();
        });
    });
})();

// ═══════════════════════════════════════════════════════════
// 🖱️ CLIQUE DENTRO DO CARD → FECHA PAINEL INTERNO (Esc-like)
// ═══════════════════════════════════════════════════════════
// Quando "Mais opções" (novo) ou "Mais informações" (edição) estão
// abertos, qualquer clique dentro do card que NÃO seja dentro do
// painel nem no botão de toggle fecha o painel — e SÓ o painel.
// É o mesmo comportamento do Esc.
//
// A hierarquia completa fica:
//   • Clique DENTRO do card, fora do painel → fecha só o painel.
//   • Clique no BACKDROP (fora do card)     → fecha o modal todo.
//   • Tecla Esc                             → fecha painel → depois modal.
(function ativarFechamentoPainelInterno() {
    const configs = [
        {
            panelId: 'panelMaisInfosForm',
            cardId: 'formArea',
            colDirId: 'colunaDireitaForm',
            setaSel: '#modalNovoLancamento svg.seta'
        },
        {
            panelId: 'panelMaisInfosEdit',
            cardId: null,   // derivado do painel via closest()
            colDirId: null,
            setaSel: '#modalEdicao button svg.transition-transform'
        }
    ];

    configs.forEach(cfg => {
        const panel = document.getElementById(cfg.panelId);
        if (!panel) return;
        const card = cfg.cardId
            ? document.getElementById(cfg.cardId)
            : panel.closest('.rounded-2xl, .rounded-3xl');
        if (!card) return;

        card.addEventListener('click', (ev) => {
            if (panel.classList.contains('hidden')) return;                  // painel já fechado
            if (panel.contains(ev.target)) return;                           // clique dentro do painel
            if (ev.target.closest(`button[onclick*="${cfg.panelId}"]`)) return;  // clique no toggle

            panel.classList.add('hidden');
            if (cfg.colDirId) {
                const colDir = document.getElementById(cfg.colDirId);
                if (colDir) colDir.classList.remove('invisible');
            }
            if (cfg.setaSel) {
                document.querySelectorAll(cfg.setaSel).forEach(s => s.classList.remove('rotate-180'));
            }
        });
    });
})();

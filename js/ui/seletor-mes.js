// Seletor de mês
'use strict';

// ===================== SELETOR DE MÊS =====================
let dataFiltro = new Date(); let anoSeletor = dataFiltro.getFullYear();
const displayMes = document.getElementById('mesAtualDisplay'); const btnAbrirSeletorMes = document.getElementById('btnAbrirSeletorMes'); const painelSeletorMes = document.getElementById('painelSeletorMes'); const anoSeletorDisplay = document.getElementById('anoSeletorDisplay'); const gridMeses = document.getElementById('gridMeses');
const nomeMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function renderizarMesTopo() {
    const isMobile = window.innerWidth < 640;
    displayMes.textContent = isMobile
        ? `${nomeMeses[dataFiltro.getMonth()].substring(0, 3)} ${dataFiltro.getFullYear()}`
        : `${nomeMeses[dataFiltro.getMonth()]} ${dataFiltro.getFullYear()}`;

    // Aplica o fade suave no conteúdo da view ativa.
    // O `trocando-mes` reduz a opacidade; removemos depois que a
    // re-renderização terminou, causando um "breath" suave.
    const viewAtiva = document.querySelector('#viewResumo:not(.hidden), #viewExtrato:not(.hidden), #viewContas:not(.hidden), #abaProjecao:not(.hidden)');
    if (viewAtiva) {
        viewAtiva.classList.add('trocando-mes');
        requestAnimationFrame(() => {
            setTimeout(() => viewAtiva.classList.remove('trocando-mes'), 250);
        });
    }

    if(document.getElementById('abaCaixa').classList.contains('block')) atualizarTabela();
    if(document.getElementById('abaProjecao').classList.contains('block')) carregarOuCalcularFolha();

    // 🎯 Atualiza o subtítulo do card "Gastos do mês" no Assistente em
    //    tempo real. Protegido por typeof porque a função é definida
    //    depois de `renderizarMesTopo` no arquivo — na primeira
    //    execução (durante o boot) ela já existirá, mas mantemos a
    //    defesa para evitar erro em qualquer ordem de carregamento.
    if (typeof window.asAtualizarMesAtualCard === 'function') window.asAtualizarMesAtualCard();

    // 🎯 Redesenha os gráficos se a aba Gráficos estiver visível.
    //    Garante que trocar o mês no header atualize o doughnut de
    //    categorias (que é do mês corrente) sem precisar sair e
    //    voltar da aba.
    if (typeof window.renderizarGraficos === 'function'
        && !document.getElementById('abaGraficos')?.classList.contains('hidden')) {
        window.renderizarGraficos();
    }
}
function renderizarPainelMes() {
    anoSeletorDisplay.textContent = anoSeletor; gridMeses.innerHTML = '';
    nomeMeses.forEach((nome, idx) => {
        const btn = document.createElement('button'); const ativo = (idx === dataFiltro.getMonth() && anoSeletor === dataFiltro.getFullYear());
        btn.type = 'button'; 
        // Atualizado para rounded-full e hover azuladinho
        btn.className = `text-xs font-semibold py-2 rounded-full transition-colors ${ativo ? 'bg-[#4D6BFE] text-white shadow-md shadow-[#4D6BFE]/20' : 'hover:bg-[#4D6BFE]/10 text-slate-600'}`;
        btn.textContent = nome.substring(0, 3);
        btn.addEventListener('click', () => { dataFiltro.setFullYear(anoSeletor); dataFiltro.setMonth(idx); renderizarMesTopo(); fecharPainelMes(); });
        gridMeses.appendChild(btn);
    });
}
window.abrirPainelMes = function() { anoSeletor = dataFiltro.getFullYear(); renderizarPainelMes(); painelSeletorMes.classList.remove('hidden'); }
function fecharPainelMes() { painelSeletorMes.classList.add('hidden'); }

btnAbrirSeletorMes.addEventListener('click', (e) => { e.stopPropagation(); painelSeletorMes.classList.contains('hidden') ? window.abrirPainelMes() : fecharPainelMes(); });
document.getElementById('btnAnoAnt').addEventListener('click', (e) => { e.stopPropagation(); anoSeletor--; renderizarPainelMes(); });
document.getElementById('btnAnoProx').addEventListener('click', (e) => { e.stopPropagation(); anoSeletor++; renderizarPainelMes(); });
document.getElementById('btnHoje').addEventListener('click', (e) => { e.stopPropagation(); dataFiltro = new Date(); renderizarMesTopo(); fecharPainelMes(); });

document.getElementById('btnMesAnt').addEventListener('click', () => { dataFiltro.setMonth(dataFiltro.getMonth() - 1); renderizarMesTopo(); });
document.getElementById('btnMesProx').addEventListener('click', () => { dataFiltro.setMonth(dataFiltro.getMonth() + 1); renderizarMesTopo(); });

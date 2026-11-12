// Autocomplete
'use strict';

// ===================== AUTOCOMPLETE INTELIGENTE =====================
const inputDesc = document.getElementById('descricao');
const menuAuto = document.getElementById('menuAutocomplete');
const listaAuto = document.getElementById('listaAutocomplete');

// ============ AUTOCOMPLETE COM Z-INDEX CORRETO ============
// Sobe o container da Descrição para z-index 999 quando o menu abre,
// fazendo o dropdown sobrepor Repetição, Parcelamento, Vencimento etc.
const autocompleteContainer = menuAuto.parentElement.parentElement;

function mostrarAutocomplete() {
    autocompleteContainer.style.zIndex = '999';
    menuAuto.classList.remove('hidden');
}
function esconderAutocomplete() {
    menuAuto.classList.add('hidden');
    autocompleteContainer.style.zIndex = '';
}

inputDesc.addEventListener('input', function() {
    const val = this.value.toLowerCase().trim();
    if (val.length < 2) {
        esconderAutocomplete();
        return;
    }

    let encontrados = [];
    let descricoesVistas = new Set();
    let bancoInvertido = [...bancoDeDados].reverse();
    
    for (let d of bancoInvertido) {
        let descOriginal = d.descricaoOriginal || d.descricao;
        if (descOriginal.toLowerCase().includes(val)) {
            if (!descricoesVistas.has(descOriginal.toLowerCase())) {
                descricoesVistas.add(descOriginal.toLowerCase());
                encontrados.push(d);
            }
        }
        if (encontrados.length >= 5) break;
    }

    if (encontrados.length > 0) {
        listaAuto.innerHTML = '';
        encontrados.forEach(item => {
            let descDisplay = item.descricaoOriginal || item.descricao;
            let li = document.createElement('li');
            li.className = "cursor-pointer px-4 py-3 hover:bg-slate-100 dark:hover:bg-[#1a2639] border-b border-slate-100 dark:border-[#1e2a40] transition-colors";
            li.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-bold text-slate-700 dark:text-gray-200">${descDisplay}</span>
                    <span class="text-xs text-slate-400 font-semibold">${formatMoeda(item.valor)}</span>
                </div>
                <div class="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                    ${item.categoria} ${item.subcategoria ? ' › ' + item.subcategoria : ''}
                </div>
            `;
            li.addEventListener('click', () => {
                inputDesc.value = descDisplay;
                
                const inputValorForm = document.getElementById('valor');
                inputValorForm.value = formatarParaMascara(item.valor);
                inputValorForm.dispatchEvent(new Event('blur'));
                
                document.getElementById('categoria').value = item.categoria;
                const catObj = categoriasGlobais.find(c => c.nome === item.categoria);
                const iconeStr = catObj ? catObj.icon : 'tag';
                document.getElementById('lblCategoria').innerHTML = `<span class="text-slate-900 dark:text-cyan-400">${getSVGIcon(iconeStr, 'w-4 h-4')}</span> <span>${item.categoria}</span>`;
                
                renderSubcategoriaDropdown(item.categoria, 'subcategoria', 'lblSubcategoria', 'listaSubcategoria', false);
                if(item.subcategoria) {
                    document.getElementById('subcategoria').value = item.subcategoria;
                    document.getElementById('lblSubcategoria').innerHTML = `<span>${item.subcategoria}</span>`;
                }

                esconderAutocomplete();
            });
            listaAuto.appendChild(li);
        });
        mostrarAutocomplete();
    } else {
        esconderAutocomplete();
    }
});

// Fecha ao perder o foco (com pequeno delay para o clique no item funcionar)
inputDesc.addEventListener('blur', () => {
    setTimeout(() => esconderAutocomplete(), 200);
});

// Fecha ao clicar fora
document.addEventListener('click', (e) => {
    if (menuAuto && !menuAuto.contains(e.target) && e.target !== inputDesc) {
        esconderAutocomplete();
    }
});

// Garante que fechar o modal também fecha o autocomplete
window.fecharModalLancamento = (function(orig) {
    return function() {
        esconderAutocomplete();
        return orig.apply(this, arguments);
    };
})(window.fecharModalLancamento);

// Conecta os botões da aba Relatórios ao motor exclusivo para abrirem as listas
document.getElementById('btnFiltroPeriodo')?.addEventListener('click', (e) => window.abrirCalendarioRelatorio(e));
document.getElementById('btnFiltroTipo')?.addEventListener('click', (e) => window.abrirMenuExclusivo('menuFiltroTipo', e));
document.getElementById('btnFiltroConta')?.addEventListener('click', (e) => window.abrirMenuExclusivo('menuFiltroConta', e));
document.getElementById('btnFiltroCategoria')?.addEventListener('click', (e) => window.abrirMenuExclusivo('menuFiltroCategoria', e));
document.getElementById('btnFiltroOrigem')?.addEventListener('click', (e) => window.abrirMenuExclusivo('menuFiltroOrigem', e));
document.getElementById('btnFiltroStatus')?.addEventListener('click', (e) => window.abrirMenuExclusivo('menuFiltroStatus', e));

// Atualiza o preview do parcelamento em tempo real
['valor', 'qtdParcelas', 'parcAtual'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', () => window.atualizarHintValorParcelado());
        el.addEventListener('blur', () => window.atualizarHintValorParcelado());
    }
});

// Busca textual no Extrato (com debounce de 200ms para não travar em listas longas)
let timerBuscaExtrato = null;
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'buscaExtrato') {
        clearTimeout(timerBuscaExtrato);
        timerBuscaExtrato = setTimeout(() => {
            if (document.getElementById('abaCaixa').classList.contains('block')) {
                atualizarTabela();
            }
        }, 200);
    }
});

// Orçamentos
'use strict';

// ═══════════════════════════════════════════════════════════════
// 🎯 ORÇAMENTOS — cadastro e persistência
// ═══════════════════════════════════════════════════════════════
// Cada categoria existente vira uma linha com um input de valor.
// O salvamento é AUTOMÁTICO no `blur`/`change` — sem botão "Salvar",
// sem friction. O valor 0 ou vazio remove o orçamento daquela
// categoria (fica sem teto).
window.abrirModalOrcamentos = function() {
    // 🎯 Ordem importa: abre o modal PRIMEIRO, renderiza DEPOIS.
    //    Se algo falhar no render (input inválido, categoria corrompida,
    //    etc), o modal já está visível e o usuário vê o problema —
    //    em vez de clicar e "não acontecer nada".
    //    O try/catch evita que um erro no render quebre a função
    //    inteira; o modal permanece aberto e o console mostra o
    //    motivo real do problema.
    window.abrirModalGenerico('modalOrcamentos');
    try {
        window.renderListaOrcamentos();
    } catch (e) {
        console.error('Erro ao renderizar orçamentos:', e);
    }
};

window.fecharModalOrcamentos = function() {
    window.fecharModalGenerico('modalOrcamentos');
};

window.renderListaOrcamentos = function() {
    const container = document.getElementById('listaOrcamentos');
    if (!container) return;

    // Ordena categorias alfabeticamente para consistência.
    const cats = [...categoriasGlobais].sort((a, b) => a.nome.localeCompare(b.nome));
    if (cats.length === 0) {
        container.innerHTML = '<p class="text-center text-slate-400 text-sm py-8">Nenhuma categoria cadastrada ainda.</p>';
        return;
    }

    container.innerHTML = cats.map(cat => {
        const valorAtual = orcamentosGlobais[cat.nome] || 0;
        const iconeStr = getSVGIcon(cat.icon, 'w-4 h-4');
        // 🎯 A lixeira só faz sentido se a categoria TEM teto definido.
        //    Sem valor, o botão fica invisível (`invisible` preserva o
        //    layout — sem "salto" no input quando o botão aparece/some).
        //    Quando o teto é limpo, o botão some automaticamente no
        //    próximo render — feedback visual imediato do "apagou".
        const temTeto = valorAtual > 0.005;
        return `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#1a2639] flex items-center justify-center text-slate-600 dark:text-gray-300 shrink-0">
                    ${iconeStr}
                </div>
                <div class="flex-1 min-w-0">
                    <label class="block text-[12.5px] font-semibold text-slate-700 dark:text-gray-200 truncate">${cat.nome}</label>
                    <span class="text-[10px] text-slate-400 dark:text-gray-500">teto mensal</span>
                </div>
                <div class="relative w-28 shrink-0">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">R$</span>
                    <input type="text" inputmode="decimal"
                           data-orc-cat="${cat.nome}"
                           value="${valorAtual > 0 ? window.formatarParaMascara(valorAtual) : ''}"
                           placeholder="0,00"
                           class="w-full border border-slate-200 dark:border-[#1e2a40] bg-slate-50 dark:bg-[#0b1120] rounded-lg py-2 pl-8 pr-2 text-right text-[12.5px] font-bold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-0 focus:border-[#4D6BFE] dark:focus:border-[#4D6BFE] transition-all">
                </div>
                <button type="button" data-orc-clear="${cat.nome}" title="Apagar limite de ${cat.nome}"
                        class="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center transition-all active:scale-90 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${temTeto ? '' : 'hidden'}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
        `;
    }).join('');

    // Aplica a máscara de moeda em todos os inputs recém-criados
    // e registra o evento de salvar no blur.
    container.querySelectorAll('input[data-orc-cat]').forEach(inp => {
        window.aplicarMascaraSimples(inp);
        inp.addEventListener('blur', () => {
            const catNome = inp.dataset.orcCat;
            const v = window.paraFloat(inp.value);
            if (v > 0.005) {
                orcamentosGlobais[catNome] = v;
            } else {
                // 0 ou vazio = remove o orçamento daquela categoria
                delete orcamentosGlobais[catNome];
            }

            // 🎯 Toggle da lixeira da linha. Sem re-renderizar a
            //    lista inteira — isso perderia o foco se o usuário
            //    estivesse tabulando entre campos. Aqui só mexemos
            //    no botão desta linha específica.
            //
            //    • v > 0  → lixeira visível (o usuário pode apagar)
            //    • v ≤ 0  → lixeira some (não há o que apagar)
            const btnTrash = inp.closest('.flex.items-center')?.querySelector('button[data-orc-clear]');
            if (btnTrash) {
                if (v > 0.005) btnTrash.classList.remove('hidden');
                else btnTrash.classList.add('hidden');
            }

            // 🎯 Persiste no Firestore
            window.syncToFirebase();

            // 🎯 REPINTA A UI imediatamente — não espera reload.
            //    Chama `atualizarTabela()`, que por sua vez:
            //      1. Recalcula `catsEstouradas` (usado nos chips do Extrato)
            //      2. Re-renderiza o carrossel de contas
            //      3. Chama `atualizarCardOrcamentoResumo()` (painel do Resumo)
            //    Resultado: assim que o usuário sai do input, o card
            //    do Resumo reflete o novo valor — sem F5.
            if (typeof atualizarTabela === 'function') {
                atualizarTabela();
            }
        });
        // Também salva no Enter (teclado físico)
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
        });
    });

    // 🎯 Botões de lixeira — limpeza rápida de um teto
    container.querySelectorAll('button[data-orc-clear]').forEach(btn => {
        btn.addEventListener('click', () => {
            const catNome = btn.dataset.orcClear;
            // Remove o teto do estado e persiste.
            delete orcamentosGlobais[catNome];
            window.syncToFirebase();
            // Atualiza a UI em cascata (Resumo, Extrato, Assistente).
            if (typeof atualizarTabela === 'function') atualizarTabela();
            // Re-renderiza o MODAL para o input da categoria ficar
            // vazio e a lixeira sumir (feedback visual de "apagou").
            window.renderListaOrcamentos();
        });
    });
};

window.abrirModalCategorias = function() {
    renderListaCategoriasModal();
    viewCatList.classList.remove('hidden'); viewCatEdit.classList.add('hidden');
    window.abrirModalGenerico('modalCategorias');
}

window.fecharModalCategorias = function() {
    window.fecharModalGenerico('modalCategorias', 'flex', null, () => { setupDropdownCategorias(); });
}

window.renderListaCategoriasModal = function() {
    const container = document.getElementById('containerListaCategorias');
    container.innerHTML = '';
    let catsOrdenadas = [...categoriasGlobais].sort((a, b) => a.nome.localeCompare(b.nome));
    catsOrdenadas.forEach(cat => {
        const div = document.createElement('div');
        div.className = "flex items-center justify-between bg-slate-50 dark:bg-[#0b1120] border border-slate-200 dark:border-[#1e2a40] p-4 rounded-xl";
        
        let subCount = cat.subcategorias ? cat.subcategorias.length : 0;
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-slate-900/10 dark:bg-cyan-500/10 flex items-center justify-center text-slate-900 dark:text-cyan-400">
                    ${getSVGIcon(cat.icon, 'w-5 h-5')}
                </div>
                <div>
                    <p class="font-bold text-slate-800 dark:text-gray-200 text-sm">${cat.nome}</p>
                    <p class="text-xs font-semibold text-slate-400 dark:text-gray-500">${subCount} subcategorias</p>
                </div>
            </div>
            <button type="button" onclick="abrirEdicaoCategoria('${cat.id}')" class="text-slate-400 hover:text-slate-900 dark:hover:text-cyan-400 transition-colors p-2 active:scale-90">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
        `;
        container.appendChild(div);
    });
}

window.abrirEdicaoCategoria = function(idCat) {
    editandoCatId = idCat;
    const nomeInput = document.getElementById('catEditNome'); const gridIcones = document.getElementById('gridIcones'); const iconeInput = document.getElementById('catEditIconSelected');
    const btnApagar = document.getElementById('btnApagarCategoria');
    
    gridIcones.innerHTML = '';
    
    let iconeAtual = 'tag';
    if(idCat) {
        const cat = categoriasGlobais.find(c => c.id === idCat);
        nomeInput.value = cat.nome;
        iconeAtual = cat.icon || 'tag';
        subcatsTemp = [...(cat.subcategorias || [])];
        btnApagar.classList.remove('hidden');
    } else {
        nomeInput.value = '';
        subcatsTemp = [];
        btnApagar.classList.add('hidden');
    }
    
    iconeInput.value = iconeAtual;

    Object.keys(ICONES_SVG).forEach(key => {
        const btn = document.createElement('button');
        const ativo = key === iconeAtual;
        
        // Mágica do Tooltip
        const iconData = ICONES_SVG[key];
        const tooltipText = (iconData && iconData.label) ? iconData.label : key;

        btn.type = 'button';
        btn.title = tooltipText; // <-- O texto ao passar o mouse entra aqui!
        btn.className = `p-3 flex items-center justify-center rounded-xl transition-all border-2 ${ativo ? 'border-slate-900 bg-slate-900/5 dark:border-cyan-500 dark:bg-cyan-500/10 text-slate-900 dark:text-cyan-400' : 'border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a2639]'}`;
        btn.innerHTML = getSVGIcon(key, 'w-6 h-6');
        btn.onclick = () => {
            iconeInput.value = key;
            Array.from(gridIcones.children).forEach(b => { b.className = `p-3 flex items-center justify-center rounded-xl transition-all border-2 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1a2639]`; });
            btn.className = `p-3 flex items-center justify-center rounded-xl transition-all border-2 border-slate-900 bg-slate-900/5 dark:border-cyan-500 dark:bg-cyan-500/10 text-slate-900 dark:text-cyan-400`;
        };
        gridIcones.appendChild(btn);
    });

    renderizarSubcatsEdicao();
    viewCatList.classList.add('hidden'); viewCatEdit.classList.remove('hidden');
}

window.renderizarSubcatsEdicao = function() {
    const ul = document.getElementById('listaSubcatsEdicao');
    ul.innerHTML = '';
    if(subcatsTemp.length === 0) {
        ul.innerHTML = `<li class="text-xs text-slate-400 italic">Nenhuma subcategoria cadastrada.</li>`;
        return;
    }
    subcatsTemp.forEach((sub, index) => {
        const li = document.createElement('li');
        li.className = "flex justify-between items-center bg-slate-100 dark:bg-[#1a2639] p-2.5 rounded-lg border border-slate-200 dark:border-[#1e2a40]";
        li.innerHTML = `
            <span class="text-sm font-medium text-slate-500 dark:text-gray-200 pl-1">${sub}</span>
            <button type="button" onclick="removerSubcatNaEdicao(${index})" class="text-red-400 hover:text-red-600 transition-colors p-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
        `;
        ul.appendChild(li);
    });
}

window.adicionarSubcatNaEdicao = function() {
    const input = document.getElementById('novaSubcatNome');
    const val = input.value.trim();
    if(val && !subcatsTemp.includes(val)) { subcatsTemp.push(val); input.value = ''; renderizarSubcatsEdicao(); }
}

window.removerSubcatNaEdicao = function(index) { subcatsTemp.splice(index, 1); renderizarSubcatsEdicao(); }

window.voltarParaListaCat = function() { viewCatEdit.classList.add('hidden'); viewCatList.classList.remove('hidden'); }

window.salvarEdicaoCategoria = function() {
    const nome = document.getElementById('catEditNome').value.trim();
    const icon = document.getElementById('catEditIconSelected').value;
    
    if(!nome) { window.mostrarAviso("O nome da categoria é obrigatório!", "erro"); return; }
    
    let catObj;
    if(editandoCatId) {
        catObj = categoriasGlobais.find(c => c.id === editandoCatId);
        if(catObj) { catObj.nome = nome; catObj.icon = icon; catObj.subcategorias = [...subcatsTemp]; }
    } else { 
        catObj = { id: `c_${Date.now()}`, nome, icon, subcategorias: [...subcatsTemp] };
        categoriasGlobais.push(catObj); 
    }
    
    salvarCategoriaFirestore(catObj); window.mostrarAviso("Categoria salva com sucesso!");
    renderListaCategoriasModal(); voltarParaListaCat();
}

window.apagarCategoriaAtual = function() {
    if(confirm("Apagar esta categoria permanentemente? Seus lançamentos não serão apagados, mas ficarão sem ícone.")) {
        apagarCategoriaFirestore(editandoCatId);
        categoriasGlobais = categoriasGlobais.filter(c => c.id !== editandoCatId);
        window.mostrarAviso("Categoria removida.");
        renderListaCategoriasModal(); voltarParaListaCat();
    }
}

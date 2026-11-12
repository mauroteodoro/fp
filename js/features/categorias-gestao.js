// Gestão de categorias e subcategorias
'use strict';

// ===================== GESTÃO DE CATEGORIAS E SUBCATEGORIAS =====================
let editandoCatId = null;
let subcatsTemp = [];

function renderSubcategoriaDropdown(catNome, inputId, lblId, listId, isEditContext = false) {
    const list = document.getElementById(listId); const input = document.getElementById(inputId); const lbl = document.getElementById(lblId);
    list.innerHTML = ''; input.value = '';
    
    const catInfo = categoriasGlobais.find(c => c.nome === catNome);
    if(!catInfo || !catInfo.subcategorias || catInfo.subcategorias.length === 0) {
        lbl.innerHTML = `<span class="text-slate-400">Nenhuma subcategoria</span>`;
        return;
    }
    
    let subsOrdenadas = [...catInfo.subcategorias].sort((a, b) => a.localeCompare(b));

    if(!isEditContext) {
        input.value = subsOrdenadas[0]; 
        lbl.innerHTML = `<span>${subsOrdenadas[0]}</span>`;
    } else {
        lbl.innerHTML = `<span>Selecione...</span>`;
    }
    
    subsOrdenadas.forEach(sub => {
        const li = document.createElement('li');
        li.className = "cursor-pointer px-4 py-3 sm:py-2 hover:bg-slate-100 dark:hover:bg-[#1a2639] flex items-center gap-2 transition-colors border-b border-slate-100 dark:border-[#1e2a40] last:border-0";
        li.innerHTML = `<span>${sub}</span>`;
        li.addEventListener('click', () => {
            input.value = sub; lbl.innerHTML = `<span>${sub}</span>`;
            document.getElementById(listId.replace('lista', 'menu')).classList.add('hidden');
        });
        list.appendChild(li);
    });
}

function setupDropdownCategorias() {
    const builds = [
        { btn: 'btnCategoria', menu: 'menuCategoria', lista: 'listaCategoria', inputC: 'categoria', lblC: 'lblCategoria', inputS: 'subcategoria', lblS: 'lblSubcategoria', listS: 'listaSubcategoria', isEdit: false },
        { btn: 'btnEditCategoria', menu: 'menuEditCategoria', lista: 'listaEditCategoria', inputC: 'editCategoria', lblC: 'lblEditCategoria', inputS: 'editSubcategoria', lblS: 'lblEditSubcategoria', listS: 'listaEditSubcategoria', isEdit: true }
    ];

    let isReceita = document.getElementById('naturezaLancamento')?.value === 'Receita';
let catsParaExibir = categoriasGlobais;

// NOVO FILTRO FLEXÍVEL: Oculta apenas os padrões irrelevantes, liberando as customizadas (como Pet Sitter) para aparecerem!
const despesasPadrao = ["Moradia", "Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Pagto. Dívida"];
const receitasPadrao = ["Renda Extra"];

if (isReceita) {
    catsParaExibir = categoriasGlobais.filter(c => !despesasPadrao.includes(c.nome));
    if (catsParaExibir.length === 0) catsParaExibir = [{nome: "Receita", icon: "cash", subcategorias: ["Geral"]}];
} else {
    catsParaExibir = categoriasGlobais.filter(c => !receitasPadrao.includes(c.nome));
}

// Garante a ordem alfabética ANTES de pegar o primeiro item padrão
catsParaExibir.sort((a, b) => a.nome.localeCompare(b.nome));

    builds.forEach(b => {
        const btnVelho = document.getElementById(b.btn); 
        const btnNovo = btnVelho.cloneNode(true); 
        btnVelho.parentNode.replaceChild(btnNovo, btnVelho);
        
        const menu = document.getElementById(b.menu); 
        const list = document.getElementById(b.lista);
        const inputC = document.getElementById(b.inputC); 
        const lblC = document.getElementById(b.lblC);
        
        list.innerHTML = '';
        
        // Usa apenas as categorias filtradas para o formulário principal, mas deixa tudo para o formulário de Edição
        let arrayUsado = b.isEdit ? [...categoriasGlobais].sort((a, b) => a.nome.localeCompare(b.nome)) : catsParaExibir;

        arrayUsado.forEach(cat => {
            const li = document.createElement('li'); 
            li.className = "cursor-pointer px-4 py-3 sm:py-2 hover:bg-slate-100 dark:hover:bg-[#1a2639] flex items-center gap-2 transition-colors border-b border-slate-100 dark:border-[#1e2a40] last:border-0";
            li.innerHTML = `<span class="text-slate-500 dark:text-gray-400">${getSVGIcon(cat.icon, 'w-4 h-4')}</span> <span class="font-medium text-slate-700 dark:text-gray-200">${cat.nome}</span>`;
            li.addEventListener('click', () => { 
                inputC.value = cat.nome; 
                lblC.innerHTML = `<span class="text-slate-900 dark:text-cyan-400">${getSVGIcon(cat.icon, 'w-4 h-4')}</span> <span>${cat.nome}</span>`; 
                menu.classList.add('hidden');
                renderSubcategoriaDropdown(cat.nome, b.inputS, b.lblS, b.listS, b.isEdit);
            });
            list.appendChild(li);
        });
        
        // Aplica o clique exclusivo
        btnNovo.addEventListener('click', (e) => { window.abrirMenuExclusivo(b.menu, e); });
    });
    
    if(catsParaExibir.length > 0) {
        const first = catsParaExibir[0];
        document.getElementById('categoria').value = first.nome;
        document.getElementById('lblCategoria').innerHTML = `<span class="text-slate-900 dark:text-cyan-400">${getSVGIcon(first.icon, 'w-4 h-4')}</span> <span>${first.nome}</span>`;
        renderSubcategoriaDropdown(first.nome, 'subcategoria', 'lblSubcategoria', 'listaSubcategoria', false);
    }
}

// --- SISTEMA DE ABERTURA EXCLUSIVA DE MENUS (FECHA OS OUTROS E LIMITA ALTURA) ---
window.abrirMenuExclusivo = function(menuId, e) {
    if(e) e.stopPropagation();
    
    const menuAlvo = document.getElementById(menuId);
    if (!menuAlvo) return;
    
    const estavaEscondido = menuAlvo.classList.contains('hidden');
    
    // Fecha todos
    TODOS_OS_MENUS.forEach(item => {
        const m = document.getElementById(item.m);
        if (m) {
            m.classList.add('hidden');
            // Limpa estilos forçados da tentativa anterior para restaurar fluxo normal
            m.style.top = '100%';
            m.style.bottom = 'auto';
        }
    });
    
    // Abre o alvo se estava fechado
    if (estavaEscondido) {
        menuAlvo.classList.remove('hidden');
        
        // Força o limite de altura e aplica a barra inteligente
        const ul = menuAlvo.querySelector('ul');
        if (ul) {
            // Volta para um tamanho que não corte no modal (240px)
            ul.style.maxHeight = '240px'; 
            // Remove bloqueios e injeta a barra de rolagem que só aparece no mouse
            ul.classList.remove('no-scrollbar');
            ul.classList.add('hover-scrollbar', 'overflow-y-auto');
        }
    }
};

// --- SISTEMA DE FECHAMENTO AO CLICAR FORA ---
document.addEventListener('click', (e) => { 
    TODOS_OS_MENUS.forEach(par => {
        const menu = document.getElementById(par.m);
        const btn = document.getElementById(par.b);
        if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
            menu.classList.add('hidden');
        }
    });
});

// Conecta as subcategorias e perfil no motor exclusivo
document.getElementById('btnSubcategoria').addEventListener('click', (e) => window.abrirMenuExclusivo('menuSubcategoria', e));
document.getElementById('btnEditSubcategoria').addEventListener('click', (e) => window.abrirMenuExclusivo('menuEditSubcategoria', e));
document.getElementById('btnPerfilRegime').addEventListener('click', (e) => window.abrirMenuExclusivo('menuPerfilRegime', e));
document.getElementById('btnPerfilTemVale').addEventListener('click', (e) => window.abrirMenuExclusivo('menuPerfilTemVale', e));
document.getElementById('btnPerfilCidade').addEventListener('click', (e) => window.abrirMenuExclusivo('menuPerfilCidade', e));

const btnAcaoPrincipal = document.getElementById('btnAcaoPrincipal');
if (btnAcaoPrincipal) btnAcaoPrincipal.addEventListener('click', (e) => window.abrirMenuExclusivo('menuAcaoPrincipal', e));

const modalCategorias = document.getElementById('modalCategorias');
const viewCatList = document.getElementById('viewCatList');
const viewCatEdit = document.getElementById('viewCatEdit');

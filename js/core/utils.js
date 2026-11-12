// Utilidades e parser numérico brasileiro
'use strict';

// ===================== FUNÇÕES DE UTILIDADE =====================
window.paraFloat = function(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let str = String(val).trim().replace(/r\$\s*/gi, '');
    if (str === '') return 0;

    // ═══════════════════════════════════════════════════════════
    // 🎯 PARSER UNIVERSAL EM FORMATO BRASILEIRO
    // ═══════════════════════════════════════════════════════════
    // Antes: só removia pontos quando havia vírgula. Sem vírgula,
    // `parseFloat("10.000")` parava no primeiro ponto e retornava 10.
    // Bug em TODO valor BR sem centavos: R$ 10.000, R$ 1.200, etc.
    //
    // Agora entende os 4 formatos que o usuário costuma digitar:
    //
    //   1. Com vírgula (decimal explícito):
    //        "10.000,50" → 10000.5
    //        "1.200,00"  → 1200
    //        "5,5"       → 5.5
    //      Regra: vírgula é decimal, pontos são milhar.
    //
    //   2. Padrão de milhar sem vírgula (grupos de 3 dígitos):
    //        "10.000"     → 10000
    //        "1.200"      → 1200
    //        "1.000.000"  → 1000000
    //      Regra: todo grupo após ponto tem EXATAMENTE 3 dígitos.
    //
    //   3. Decimal com ponto (raro, mas acontece em mobile/teclado EN):
    //        "10.5"  → 10.5
    //        "0.5"   → 0.5
    //      Regra: não casa o padrão de milhar, então ponto é decimal.
    //
    //   4. Inteiro puro:
    //        "5000"  → 5000
    //        "400"   → 400
    if (str.includes(',')) {
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }
    if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
        return parseFloat(str.replace(/\./g, '')) || 0;
    }
    return parseFloat(str) || 0;
};

window.paraMoedaBR = function(num) {
    let p = parseFloat(num);
    if (isNaN(p)) p = 0;
    return p.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatMoeda = (val) => { let p = parseFloat(val); if (isNaN(p) || Math.abs(p) < 0.005) p = 0; return p.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); };
const valorFloat = (val) => { return window.paraFloat(val); };
window.formatarParaMascara = function(valor) {
    if (valor === null || valor === undefined || valor === '') return "";
    let num = parseFloat(valor); if (isNaN(num)) return "";
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
window.chaveMes = function(data) { return `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`; }
function getHojeFormatado() { const h = new Date(); return `${String(h.getDate()).padStart(2, '0')}/${String(h.getMonth() + 1).padStart(2, '0')}/${h.getFullYear()}`; }
function getTimestampAtual() {
    const now = new Date();
    return `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} às ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

// Converte "DD/MM/AAAA" em número comparável (AAAAMMDD). Útil para ordenar/comparar datas.
const dataParaNum = (str) => {
    if (!str || typeof str !== 'string' || str.length !== 10) return 0;
    const p = str.split('/');
    if (p.length !== 3) return 0;
    return parseInt(p[2] + p[1] + p[0], 10) || 0;
};

const travarScroll = () => { document.body.style.overflow = 'hidden'; };
const destravScroll = () => { document.body.style.overflow = ''; };

window.abrirModalGenerico = function(idModal, displayClass = 'flex', idConteudo = null) {
    const modal = document.getElementById(idModal);
    if (!modal) return;
    const content = idConteudo ? document.getElementById(idConteudo) : modal.children[0];
    
    // Move o modal para o <body> (escapa do stacking context do wrapper).
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }
    
    travarScroll();
    
    // Fade + scale: duplo requestAnimationFrame garante a transição.
    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
    const dur = '280ms';
    
    modal.style.transition = `opacity ${dur} ${ease}`;
    modal.style.opacity = '0';
    if (content) {
        content.style.transition = `opacity ${dur} ${ease}, transform ${dur} ${ease}`;
        content.style.transform = 'scale(0.96)';
        content.style.opacity = '0';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add(displayClass);
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            if (content) {
                content.style.transform = 'scale(1)';
                content.style.opacity = '1';
            }
        });
    });
};

window.fecharModalGenerico = function(idModal, displayClass = 'flex', idConteudo = null, callback = null) {
    const modal = document.getElementById(idModal);
    if (!modal) return;
    const content = idConteudo ? document.getElementById(idConteudo) : modal.children[0];
    
    modal.style.opacity = '0';
    if (content) {
        content.style.transform = 'scale(0.96)';
        content.style.opacity = '0';
    }
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove(displayClass);
        
        // 🧹 Limpa inline styles — a próxima abertura parte do zero.
        modal.style.opacity = '';
        modal.style.transition = '';
        if (content) {
            content.style.transform = '';
            content.style.opacity = '';
            content.style.transition = '';
        }
        
        // Só destrava o scroll se não houver mais nenhum modal aberto.
        const restantes = Array.from(document.querySelectorAll('[id^="modal"]'))
            .filter(m => m.id !== idModal
                      && m.classList.contains('fixed')
                      && m.classList.contains('inset-0')
                      && !m.classList.contains('hidden'));
        if (restantes.length === 0) destravScroll();
        
        if (callback) callback();
    }, 280);
};



window.mostrarAviso = function(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('toast-container'); const toast = document.createElement('div');
    let corFundo = tipo === 'sucesso' ? 'bg-[#4D6BFE] dark:bg-[#4338CA]' : (tipo === 'info' ? 'bg-slate-600 dark:bg-[#1e3a8a]' : 'bg-red-500 dark:bg-red-900');
    const svgIcone = tipo === 'sucesso'
        ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
        : (tipo === 'info'
            ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
            : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>');
    toast.className = `flex items-center gap-3 ${corFundo} text-white px-6 py-3.5 rounded-full shadow-xl transform transition-all duration-300 translate-x-full opacity-0 pointer-events-auto z-[9999] relative pr-12`;
    toast.innerHTML = `
        <div class="shrink-0 flex items-center justify-center">${svgIcone}</div><div class="text-sm font-medium flex-1">${mensagem}</div>
        <button type="button" onclick="this.parentElement.remove()" class="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors active:scale-90 p-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-x-full', 'opacity-0'), 10);
    setTimeout(() => { if(container.contains(toast)) { toast.classList.add('translate-x-full', 'opacity-0'); setTimeout(() => { if(container.contains(toast)) toast.remove(); }, 300); } }, 4000);
}

window.mostrarObservacao = function(texto) {
    const container = document.getElementById('toast-obs-container');
    const toast = document.createElement('div');
    toast.className = "bg-[#4D6BFE] dark:bg-[#4338CA] text-white px-5 py-3.5 rounded-full shadow-2xl text-sm font-medium transform transition-all duration-300 translate-y-full opacity-0 w-full flex items-center gap-3";
    toast.innerHTML = `
        <svg class="w-5 h-5 text-white/90 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        <div class="flex-1 leading-relaxed truncate">${texto}</div>
    `;
    container.appendChild(toast);
    void toast.offsetWidth;
    toast.classList.remove('translate-y-full', 'opacity-0');
    setTimeout(() => {
        if(container.contains(toast)) {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => { if(container.contains(toast)) toast.remove(); }, 300);
        }
    }, 4500);
}
// --- INÍCIO DA CIRURGIA 2: FUNÇÃO DE TIPO DE LANÇAMENTO ---
window.setNatureza = function(nat) {
    document.getElementById('naturezaLancamento').value = nat;
    const tituloModal = document.getElementById('tituloModalLancamento');
    const lblData = document.getElementById('lblDataForm');
    const lblDesc = document.getElementById('lblDescForm');
    const btnLancar = document.getElementById('btnLancar');

    const lblVenc = document.getElementById('lblVencimentoForm');
    const lblOrigem = document.getElementById('lblOrigemForm');
    const boxCompoe = document.getElementById('boxCompoeSaldo');

    if (nat === 'Despesa') {
        if(tituloModal) tituloModal.textContent = "Nova Despesa";
        lblData.textContent = "Data de Lançamento";
        if (lblVenc) lblVenc.textContent = "Data de Vencimento";
        lblDesc.textContent = "Descrição da Despesa";
        // 🎯 Despesa: o dinheiro SAI — "Origem".
        if (lblOrigem) lblOrigem.textContent = "Origem";
        btnLancar.innerHTML = "LANÇAR DESPESA";
        btnLancar.className = "w-full bg-[#4D6BFE] hover:bg-[#4338CA] text-white font-extrabold py-4 px-4 rounded-full transition-all duration-300 shadow-lg shadow-[#4D6BFE]/20 tracking-wide font-montserrat active:scale-95 mt-2";
        if (boxCompoe) boxCompoe.classList.add('hidden');
    } else {
        if(tituloModal) tituloModal.textContent = "Nova Receita";
        lblData.textContent = "Data de Lançamento";
        if (lblVenc) lblVenc.textContent = "Data de Vencimento";
        lblDesc.textContent = "Descrição da Receita";
        // 🎯 Receita: o dinheiro ENTRA — "Destino".
        if (lblOrigem) lblOrigem.textContent = "Destino";
        btnLancar.innerHTML = "LANÇAR RECEITA";
        btnLancar.className = "w-full bg-[#00A650] hover:bg-[#008f45] text-white font-extrabold py-4 px-4 rounded-full transition-all duration-300 shadow-lg shadow-[#00A650]/20 tracking-wide font-montserrat active:scale-95 mt-2";
        if (boxCompoe) boxCompoe.classList.remove('hidden');
    }
    
    // Recarrega as categorias baseadas na escolha
    if (typeof setupDropdownCategorias === 'function') {
        setupDropdownCategorias(); 
    }
    // Sincroniza o ícone Efetivada/Pendente
    if (typeof atualizarLabelEfetivada === 'function') atualizarLabelEfetivada();
}

// Máscara DD/MM/AAAA para campos de data (usada por extrato-crud.js e transferencias.js).
function aplicarMascaraData(inp) { 
    inp.addEventListener('input', function(e) { 
        let cursorPosition = e.target.selectionStart;
        let valorAtual = e.target.value;
        let v = valorAtual.replace(/\D/g, ""); 
        let formatado = v.replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2").substring(0, 10); 
        e.target.value = formatado; 
        if (valorAtual.length < formatado.length && (cursorPosition === 3 || cursorPosition === 6)) { cursorPosition++; }
        e.target.setSelectionRange(cursorPosition, cursorPosition);
    }); 
}
// Contas e carteiras
'use strict';

// ===================== MOTOR DE CONTAS E CARTEIRAS =====================
window.abrirNovaContaDireto = function() {
    document.getElementById('menuAcoesContas').classList.add('hidden');
    if (!document.getElementById('modalNovoLancamento').classList.contains('hidden')) fecharModalLancamento();
    if (!document.getElementById('modalPerfil').classList.contains('hidden')) fecharModalPerfil();
    if (!document.getElementById('modalEdicao').classList.contains('hidden')) fecharModalEdicao();
    renderListaContasModal();
    abrirEdicaoConta(null);
    window.abrirModalGenerico('modalContas');
};

window.abrirGerenciarConta = function() {
    document.getElementById('menuAcoesContas').classList.add('hidden');
    if (!document.getElementById('modalNovoLancamento').classList.contains('hidden')) fecharModalLancamento();
    if (!document.getElementById('modalPerfil').classList.contains('hidden')) fecharModalPerfil();
    if (!document.getElementById('modalEdicao').classList.contains('hidden')) fecharModalEdicao();
    
    renderListaContasModal();
    document.getElementById('viewContaList').classList.remove('hidden'); 
    document.getElementById('viewContaEdit').classList.add('hidden');
    window.abrirModalGenerico('modalContas');
};

window.apagarContaDireto = function(id) {
    if (contasGlobais.length <= 1) {
        window.mostrarAviso("Você precisa ter pelo menos uma conta!", "erro");
        return;
    }
    const conta = contasGlobais.find(c => c.id === id);
    if (!conta) return;
    if (confirm(`Apagar a conta "${conta.nome}"?\n\nOs lançamentos antigos atrelados a ela continuarão existindo, mas ficarão vinculados à Carteira Física.`)) {
        apagarContaFirestore(id);
        contasGlobais = contasGlobais.filter(c => c.id !== id);
        window.mostrarAviso("Conta excluída.");
        renderListaContasModal();
        if (typeof renderTabelaContasTela === 'function') renderTabelaContasTela();
        if (typeof renderizarCarrosselContas === 'function') renderizarCarrosselContas();
    }
};

window.abrirModalContas = function() {
    // Garante que outras telas sejam fechadas primeiro para não encavalar
    if (!document.getElementById('modalNovoLancamento').classList.contains('hidden')) fecharModalLancamento();
    if (!document.getElementById('modalPerfil').classList.contains('hidden')) fecharModalPerfil();
    if (!document.getElementById('modalEdicao').classList.contains('hidden')) fecharModalEdicao();

    renderListaContasModal();
    document.getElementById('viewContaList').classList.remove('hidden'); 
    document.getElementById('viewContaEdit').classList.add('hidden');
    window.abrirModalGenerico('modalContas');
}

window.fecharModalContas = function() {
    window.fecharModalGenerico('modalContas', 'flex', null, () => { 
        renderizarCarrosselContas(); 
        if (typeof renderTabelaContasTela === 'function') renderTabelaContasTela();
    });
}

let editandoContaId = null;
window.renderListaContasModal = function() {
    const container = document.getElementById('listaContasModal');
    container.innerHTML = '';
    contasGlobais.forEach(c => {
        let b = BANCOS[c.banco || 'carteira'] || BANCOS['outros'];
        const div = document.createElement('div');
        div.className = "flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-xl";
        div.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden pr-2">
                <div class="w-10 h-10 shrink-0">
                    ${renderBankLogo(b)}
                </div>
                <div class="truncate">
                    <p class="font-bold text-slate-800 text-sm truncate">${c.nome}</p>
                    <p class="text-xs font-semibold text-slate-400">Inicial: ${formatMoeda(c.saldoInicial || 0)}</p>
                </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button type="button" onclick="abrirEdicaoConta('${c.id}')" title="Editar conta" class="text-slate-400 hover:text-[#4D6BFE] transition-colors p-2 active:scale-90 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button type="button" onclick="apagarContaDireto('${c.id}')" title="Apagar conta" class="text-slate-400 hover:text-red-500 transition-colors p-2 active:scale-90 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

window.renderGridBancos = function(bancoSelecionado) {
    const grid = document.getElementById('gridBancos');
    grid.innerHTML = '';
    Object.values(BANCOS).forEach(b => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.title = b.nome;
        const isSelected = bancoSelecionado === b.id;
        btn.className = `p-1 flex flex-col items-center justify-center rounded-lg transition-all border-2 ${isSelected ? 'border-[#4D6BFE] bg-[#4D6BFE]/5' : 'border-transparent hover:bg-[#4D6BFE]/5'}`;
        btn.innerHTML = `
            <div class="w-7 h-7 mb-0.5 shrink-0">
                ${renderBankLogo(b)}
            </div>
            <span class="text-[7.5px] font-semibold leading-tight ${isSelected ? 'text-[#4D6BFE]' : 'text-slate-500'} truncate w-full text-center">${b.nome}</span>
        `;
        // stopPropagation: botão é recriado no clique — sem isso o backdrop fecharia o modal.
        btn.onclick = (e) => {
            if (e) e.stopPropagation();
            document.getElementById('contaEditBanco').value = b.id;
            renderGridBancos(b.id);
        };
        grid.appendChild(btn);
    });
}

window.abrirEdicaoConta = function(idConta) {
    if (idConta) {
        const conta = contasGlobais.find(c => c.id === idConta);
        if (!conta) { 
            window.mostrarAviso("Esta conta não existe mais. Atualize a lista.", "erro"); 
            renderListaContasModal();
            return;
        }
    }
    
    editandoContaId = idConta;
    const nomeInput = document.getElementById('contaEditNome');
    const saldoInput = document.getElementById('contaEditSaldo');
    const bancoInput = document.getElementById('contaEditBanco');
    const btnApagar = document.getElementById('btnApagarConta');
    
    aplicarMascaraSimples(saldoInput);

    if(idConta) {
        const conta = contasGlobais.find(c => c.id === idConta);
        nomeInput.value = conta.nome;
        saldoInput.value = formatarParaMascara(conta.saldoInicial);
        bancoInput.value = conta.banco || 'carteira';
        btnApagar.classList.remove('hidden');
    } else {
        nomeInput.value = '';
        saldoInput.value = '';
        bancoInput.value = 'itau';
        btnApagar.classList.add('hidden');
    }
    
    renderGridBancos(bancoInput.value);

    document.getElementById('viewContaList').classList.add('hidden'); 
    document.getElementById('viewContaEdit').classList.remove('hidden');
}

window.voltarParaListaContas = function() { 
    document.getElementById('viewContaEdit').classList.add('hidden'); 
    document.getElementById('viewContaList').classList.remove('hidden'); 
}

window.salvarEdicaoConta = function() {
    const bancoId = document.getElementById('contaEditBanco').value;
    let nome = document.getElementById('contaEditNome').value.trim();
    if(!nome) nome = BANCOS[bancoId].nome;
    
    let saldoIni = valorFloat(document.getElementById('contaEditSaldo').value);
    if(isNaN(saldoIni)) saldoIni = 0;
    
    let contaObj;
    if(editandoContaId) {
        contaObj = contasGlobais.find(c => c.id === editandoContaId);
        if(contaObj) { contaObj.nome = nome; contaObj.saldoInicial = saldoIni; contaObj.banco = bancoId; }
    } else { 
        let maxOrdem = -1;
        contasGlobais.forEach(c => { if((c.ordem ?? -1) > maxOrdem) maxOrdem = c.ordem; });
        contaObj = { id: `conta_${Date.now()}`, nome, saldoInicial: saldoIni, banco: bancoId, ordem: maxOrdem + 1 };
        contasGlobais.push(contaObj); 
    }
    
    contasGlobais.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    salvarContaFirestore(contaObj); window.mostrarAviso("Conta salva com sucesso!");
    renderListaContasModal(); voltarParaListaContas();
}

window.apagarContaAtual = function() {
    if(contasGlobais.length <= 1) {
        window.mostrarAviso("Você precisa ter pelo menos uma conta!", "erro"); return;
    }
    if(confirm("Apagar esta conta? Os lançamentos antigos atrelados a ela continuarão existindo (mas a conta voltará ao padrão).")) {
        apagarContaFirestore(editandoContaId);
        contasGlobais = contasGlobais.filter(c => c.id !== editandoContaId);
        window.mostrarAviso("Conta excluída.");
        renderListaContasModal(); voltarParaListaContas();
        if (typeof renderTabelaContasTela === 'function') renderTabelaContasTela();
        if (typeof renderizarCarrosselContas === 'function') renderizarCarrosselContas();
    }
}

window.abrirEdicaoContaPelaTela = function(idConta) {
    const conta = contasGlobais.find(c => c.id === idConta);
    if (!conta) { 
        window.mostrarAviso("Esta conta não existe mais.", "erro"); 
        if (typeof renderTabelaContasTela === 'function') renderTabelaContasTela();
        return;
    }
    abrirEdicaoConta(idConta);
    window.abrirModalGenerico('modalContas');
}

window.renderTabelaContasTela = function() {
    const corpoTabela = document.getElementById('tabelaContasTela');
    if (!corpoTabela) return;
    corpoTabela.innerHTML = '';

    const mesAnoFiltro = window.chaveMes(dataFiltro);
    let totRec = 0, totDesp = 0, totSaldo = 0;

    // Garante que a ordem é a mesma do carrossel (ordem manual definida pelo usuário)
    contasGlobais.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

    contasGlobais.forEach(c => {
        let b = BANCOS[c.banco || 'carteira'] || BANCOS['outros'];
        let saldoIni = parseFloat(c.saldoInicial || 0);

        let recMes = 0; let despMes = 0;
        let recMesPendente = 0; let despMesPendente = 0;
        let saldoReal = saldoIni;

        // SOMA APENAS A REALIDADE: Ignora o Salário/Vale do holerite
        bancoDeDados.forEach(d => {
            let idAlvo = d.contaId || 'c_padrao';
            if (idAlvo !== c.id) return;

            let val = parseFloat(d.valor);
            let isR = d.tipo === 'Receita' || d.natureza === 'Receita';
            let noMes = false;
            
            // 🎯 Sempre pelo VENCIMENTO — parcelado, à vista ou recorrente.
            // Uma conta vence em outubro → entra nas receitas/despesas
            // de outubro, mesmo que tenha sido lançada em outro mês.
            let dataRefConta = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
            if (dataRefConta) {
                noMes = formatarDataComparacao(dataRefConta).substring(3) === mesAnoFiltro;
            }

            let ehAjusteSilencioso = d.isAjuste || d.ocultoExtrato;
            
            if (d.pago) {
                if (isR) saldoReal += val; else saldoReal -= val;
                if (noMes && !ehAjusteSilencioso && !d.isTransferencia) { if (isR) recMes += val; else despMes += val; }
            } else {
                if (noMes && !ehAjusteSilencioso && !d.isTransferencia) { if (isR) recMesPendente += val; else despMesPendente += val; }
            }
        });

        let saldoInicialMes = saldoReal - recMes + despMes;

        totRec += recMes; totDesp += despMes; totSaldo += saldoReal;

        const div = document.createElement('div');
        div.className = "hidden md:grid grid-cols-[minmax(180px,2fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)_minmax(100px,1fr)] gap-3 p-4 border-b border-slate-100 dark:border-[#1e2a40] hover:bg-slate-50 dark:hover:bg-[#1a2639] transition-colors items-center last:border-0";
        div.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden pr-2">
                <div class="w-8 h-8 shrink-0">${renderBankLogo(b)}</div>
                <span class="font-bold text-sm text-slate-700 dark:text-gray-200 truncate">${c.nome}</span>
            </div>
            <div class="text-center text-slate-500 dark:text-gray-400 font-medium valor-sensivel">${formatMoeda(saldoInicialMes)}</div>
            <div class="text-center text-green-600 dark:text-green-500 font-medium valor-sensivel">${formatMoeda(recMes)}</div>
            <div class="text-center text-red-600 dark:text-red-400 font-medium valor-sensivel">${formatMoeda(despMes)}</div>
            <div class="text-center font-bold text-[#0F172A] dark:text-indigo-400 valor-sensivel">${formatMoeda(saldoReal)}</div>
        `;
        corpoTabela.appendChild(div);

        const divMob = document.createElement('div');
        divMob.className = "md:hidden flex flex-col p-4 border-b border-slate-100 dark:border-[#1e2a40] gap-3 last:border-0";
        divMob.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-8 h-8 shrink-0">${renderBankLogo(b)}</div>
                    <span class="font-bold text-sm text-slate-700 dark:text-gray-200 truncate">${c.nome}</span>
                </div>
                <button type="button" onclick="abrirEdicaoContaPelaTela('${c.id}')" class="text-slate-400 hover:text-slate-900 dark:hover:text-cyan-400 p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                </button>
            </div>
            <div class="flex justify-between text-xs text-slate-500 dark:text-gray-400">
                <span>Inicial: <span class="valor-sensivel">${formatMoeda(saldoInicialMes)}</span></span>
            </div>
            <div class="flex justify-between items-end">
                <div class="flex flex-col gap-1 text-xs">
                    <span class="text-green-600 dark:text-green-500">Rec: <span class="valor-sensivel">${formatMoeda(recMes)}</span></span>
                    <span class="text-red-600 dark:text-red-400">Desp: <span class="valor-sensivel">${formatMoeda(despMes)}</span></span>
                </div>
                <div class="font-bold text-lg text-[#0F172A] dark:text-indigo-400 valor-sensivel">${formatMoeda(saldoReal)}</div>
            </div>
        `;
        corpoTabela.appendChild(divMob);
    });

    if(document.getElementById('rodapeContasRec')) document.getElementById('rodapeContasRec').textContent = formatMoeda(totRec);
    if(document.getElementById('rodapeContasDesp')) document.getElementById('rodapeContasDesp').textContent = formatMoeda(totDesp);
    if(document.getElementById('rodapeContasSaldo')) document.getElementById('rodapeContasSaldo').textContent = formatMoeda(totSaldo);
}

let dragState = null;
let dragHandlersAttached = false;

function ativarDrag(div, e) {
    const container = document.getElementById('containerContas');
    if (!container) return;
    const rect = div.getBoundingClientRect();

    dragState.offsetX = e.clientX - rect.left;
    dragState.offsetY = e.clientY - rect.top;

    const _allCards = Array.from(container.querySelectorAll('[data-conta-id]'));
    const _origIdx = _allCards.indexOf(div);
    dragState.origIndex = _origIdx >= 0 ? _origIdx : 0;
    dragState.lastTarget = dragState.origIndex;

    // Salva estilos que serão modificados
    dragState.savedStyles = {
        position: div.style.position,
        left: div.style.left,
        top: div.style.top,
        width: div.style.width,
        height: div.style.height,
        margin: div.style.margin,
        zIndex: div.style.zIndex,
        boxShadow: div.style.boxShadow,
        transform: div.style.transform,
        cursor: div.style.cursor,
        pointerEvents: div.style.pointerEvents,
        transition: div.style.transition,
        borderColor: div.style.borderColor,   // ← preserva a cor da borda
        hadCardTilt: div.classList.contains('card-tilt')
    };

    // Cria placeholder no lugar do card
    const ph = document.createElement('div');
    ph.style.minWidth = rect.width + 'px';
    ph.style.width = rect.width + 'px';
    ph.style.height = rect.height + 'px';
    ph.style.flexShrink = '0';
    ph.style.marginTop = '4px';
    ph.className = '';
    container.insertBefore(ph, div);
    dragState.placeholder = ph;

    // Remove card-tilt e zera transition ANTES de mover (evita jank de repintura)
    div.classList.remove('card-tilt');
    div.style.transition = 'none';

    // Reparenta para o <body> (ancestral com transform quebraria position:fixed).
    document.body.appendChild(div);

    // Aplica o estado flutuante (agora sim, ancorado na viewport)
    div.style.position = 'fixed';
    div.style.left = rect.left + 'px';
    div.style.top = rect.top + 'px';
    div.style.width = rect.width + 'px';
    div.style.height = rect.height + 'px';
    div.style.margin = '0';
    div.style.zIndex = '9999';
    div.style.pointerEvents = 'none';
    div.style.cursor = 'grabbing';
    div.style.transform = 'scale(1.08) rotate(2deg)';
    div.style.boxShadow = '0 16px 32px -10px rgba(0, 0, 0, 0.22), 0 28px 56px -16px rgba(0, 0, 0, 0.28)';
    div.style.background = 'var(--drag-card-bg)';   
}

function restaurarCard(div, estavaArrastando) {
    if (!div || !dragState || !dragState.savedStyles) return;
    const s = dragState.savedStyles;
    const ph = dragState.placeholder;
    const container = document.getElementById('containerContas');

    // Devolve ao container (o card está no <body> desde o ativarDrag)
    if (container) {
        if (ph && ph.parentNode === container) {
            container.insertBefore(div, ph);
        } else if (!container.contains(div)) {
            container.appendChild(div);
        }
    }
    if (ph) ph.remove();

    div.style.position = s.position;
    div.style.left = s.left;
    div.style.top = s.top;
    div.style.width = s.width;
    div.style.height = s.height;
    div.style.margin = s.margin;
    div.style.zIndex = s.zIndex;
    div.style.boxShadow = s.boxShadow;
    div.style.transform = s.transform;
    div.style.cursor = s.cursor;
    div.style.pointerEvents = s.pointerEvents;
    div.style.transition = s.transition;
    div.style.borderColor = s.borderColor;   // ← restaura a cor da borda
    div.style.removeProperty('background');
    if (s.hadCardTilt) div.classList.add('card-tilt');
}

function attachDragHandlers() {
    if (dragHandlersAttached) return;
    dragHandlersAttached = true;

    document.addEventListener('pointermove', (e) => {
        if (!dragState) return;
        const div = dragState.card;
        if (!div || !div.isConnected) { finalizarDrag(); return; }
        const container = document.getElementById('containerContas');
        if (!container) return;

        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        if (!dragState.active) {
            // 📱 Touch: ainda aguardando o long-press. Se o dedo deslizou
            // mais que 10px, o usuário quer scroll — cancela e sai do fluxo.
            if (dragState.isTouch && !dragState.longPressReady) {
                if (Math.hypot(dx, dy) > 10) {
                    if (dragState.longPressTimer) {
                        clearTimeout(dragState.longPressTimer);
                        dragState.longPressTimer = null;
                    }
                    if (div) {
                        div.style.transform = '';
                        div.style.transition = '';
                        div.style.boxShadow = '';
                    }
                    dragState = null;
                }
                return;
            }
            // 🖱️ Mouse: ativa ao passar de 6px (comportamento original).
            if (!dragState.isTouch && Math.hypot(dx, dy) < 6) return;

            // 📱 Touch com long-press já disparado: ativa ao primeiro movimento.
            dragState.active = true;
            // Limpa o feedback visual do long-press antes do drag assumir.
            div.style.transform = '';
            div.style.transition = '';
            div.style.boxShadow = '';
            ativarDrag(div, e);
            // Recalcula o offset após o reparent (o card virou position:fixed).
            const rect = div.getBoundingClientRect();
            dragState.offsetX = e.clientX - rect.left;
            dragState.offsetY = e.clientY - rect.top;
        }

        if (dragState.active && dragState.placeholder) {
            // Move o card flutuante com o cursor
            div.style.left = (e.clientX - dragState.offsetX) + 'px';
            div.style.top = (e.clientY - dragState.offsetY) + 'px';

            const otherCards = Array.from(container.querySelectorAll('[data-conta-id]'))
                .filter(el => el !== div);
            const FOLGA = 24;
            const P = (dragState.lastTarget !== undefined && dragState.lastTarget !== null)
                ? dragState.lastTarget
                : (dragState.origIndex || 0);

            let novoAlvo = 0;
            for (let i = 0; i < otherCards.length; i++) {
                const r = otherCards[i].getBoundingClientRect();
                const midX = r.left + r.width / 2;
                const boundary = (P <= i) ? (midX + FOLGA) : (midX - FOLGA);
                if (e.clientX > boundary) novoAlvo = i + 1;
            }

            if (dragState.lastTarget !== novoAlvo) {
                // Captura posições ANTES da reordenação
                const cardsBefore = {};
                otherCards.forEach(el => {
                    cardsBefore[el.dataset.contaId] = el.getBoundingClientRect().left;
                });

                dragState.lastTarget = novoAlvo;

                // Posiciona o placeholder no novo slot
                if (novoAlvo >= otherCards.length) {
                    container.appendChild(dragState.placeholder);
                } else {
                    container.insertBefore(dragState.placeholder, otherCards[novoAlvo]);
                }

                // FLIP: cada card que mudou de posição é animado de
                // volta à posição antiga — o navegador interpola até a
                // nova naturalmente. Se um card já tinha uma animação
                // rodando, o `.animate()` cancela a anterior e a nova
                // parte da posição atual.
                otherCards.forEach(el => {
                    const oldLeft = cardsBefore[el.dataset.contaId];
                    if (oldLeft === undefined) return;
                    const newLeft = el.getBoundingClientRect().left;
                    const dxFlip = oldLeft - newLeft;
                    if (Math.abs(dxFlip) > 1) {
                        el.animate(
                            [{ transform: `translateX(${dxFlip}px)` }, { transform: 'translateX(0)' }],
                            { duration: 380, easing: 'cubic-bezier(0.34, 1.15, 0.64, 1)', fill: 'none' }
                        );
                    }
                });
            }
        }
    }, { passive: true });

    // Só bloqueia o touchmove depois que o drag começou (long-press já disparou).
    document.addEventListener('touchmove', (e) => {
        if (dragState && (dragState.active || dragState.longPressReady)) {
            e.preventDefault();
        }
    }, { passive: false });

    document.addEventListener('pointerup', finalizarDrag);
    document.addEventListener('pointercancel', finalizarDrag);

    window.addEventListener('blur', () => {
        if (!dragState) return;
        if (dragState.longPressTimer) {
            clearTimeout(dragState.longPressTimer);
            dragState.longPressTimer = null;
        }
        const div = dragState.card;
        restaurarCard(div, dragState.active);
        dragState = null;
    });
}

function finalizarDrag() {
    if (!dragState) return;

    // Cancela o timer de long-press, se ainda estiver pendente.
    if (dragState.longPressTimer) {
        clearTimeout(dragState.longPressTimer);
        dragState.longPressTimer = null;
    }

    const div = dragState.card;
    const wasActive = dragState.active;
    const container = document.getElementById('containerContas');

    // Long-press sem arraste: limpa o feedback visual do card.
    if (!wasActive && div) {
        div.style.transform = '';
        div.style.transition = '';
        div.style.boxShadow = '';
    }

    // Reordena contas antes de restaurar o card
    if (wasActive && container && dragState.placeholder) {
        const children = Array.from(container.children);
        const novaOrdem = [];
        children.forEach(child => {
            if (child === div) return; // Ignora o card arrastado (posição definida pelo placeholder)
            if (child === dragState.placeholder) {
                const ct = contasGlobais.find(x => x.id === div.dataset.contaId);
                if (ct) novaOrdem.push(ct);
            } else if (child.dataset && child.dataset.contaId) {
                const ct = contasGlobais.find(x => x.id === child.dataset.contaId);
                if (ct) novaOrdem.push(ct);
            }
        });
        if (novaOrdem.length === contasGlobais.length) {
            let mudou = false;
            for (let i = 0; i < novaOrdem.length; i++) {
                if (novaOrdem[i].id !== contasGlobais[i]?.id) { mudou = true; break; }
            }
            if (mudou) {
                contasGlobais = novaOrdem;
                contasGlobais.forEach((ct, i) => { ct.ordem = i; salvarContaFirestore(ct); });
                window.mostrarAviso("Ordem das contas atualizada!", "sucesso");
            }
        }
    }

    restaurarCard(div, wasActive);
    dragState = null;
}

        let _navContasScrollHandler = null;

function configurarNavContasMobile() {
    const nav = document.getElementById('navContasMobile');
    const container = document.getElementById('containerContas');
    if (!nav || !container) return;

    const isMobile = window.innerWidth < 768;
    const totalContas = contasGlobais.length;

    // style.display inline evita conflito de especificidade do Tailwind.
    if (!isMobile || totalContas < 1) {
        nav.style.display = 'none';
        return;
    }
    nav.style.display = 'flex';

    // Remove o listener antigo (evita acúmulo em re-renders)
    if (_navContasScrollHandler) {
        container.removeEventListener('scroll', _navContasScrollHandler);
        _navContasScrollHandler = null;
    }

    let dotsHtml = '';
    for (let i = 0; i < totalContas; i++) {
        dotsHtml += `<button type="button" data-dot-index="${i}" class="nav-conta-dot w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-[#3a4860] transition-all duration-300 ease-out" aria-label="Ir para conta ${i + 1}"></button>`;
    }

    nav.innerHTML = `
        <button type="button" id="navContaPrev" class="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2639] transition-colors active:scale-90 disabled:opacity-30 disabled:pointer-events-none" aria-label="Conta anterior">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div class="flex items-center gap-1.5" id="navContasDots">${dotsHtml}</div>
        <button type="button" id="navContaNext" class="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1a2639] transition-colors active:scale-90 disabled:opacity-30 disabled:pointer-events-none" aria-label="Próxima conta">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
    `;

    const calcularIndiceAtivo = () => {
        const cards = container.querySelectorAll('[data-conta-id]');
        if (cards.length === 0) return 0;
        const containerCenter = container.scrollLeft + container.clientWidth / 2;
        let melhor = 0, menorDist = Infinity;
        cards.forEach((c, i) => {
            const centro = c.offsetLeft + c.offsetWidth / 2;
            const dist = Math.abs(centro - containerCenter);
            if (dist < menorDist) { menorDist = dist; melhor = i; }
        });
        return melhor;
    };

    const atualizarDots = (idx) => {
        const dots = nav.querySelectorAll('.nav-conta-dot');
        dots.forEach((dot, i) => {
            if (i === idx) {
                // Ativo: traço alongado, roxo-marca, transição longa
                dot.className = 'nav-conta-dot w-7 h-2.5 rounded-full bg-[#4D6BFE] transition-all duration-300 ease-out';
            } else {
                // Inativo: bolinha cinza média — visível o suficiente
                // para o usuário saber que a conta existe, apagado o
                // suficiente para o ativo se destacar.
                dot.className = 'nav-conta-dot w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-[#3a4860] transition-all duration-300 ease-out';
            }
        });
        const prevBtn = document.getElementById('navContaPrev');
        const nextBtn = document.getElementById('navContaNext');
        if (prevBtn) prevBtn.disabled = (idx === 0);
        if (nextBtn) nextBtn.disabled = (idx === totalContas - 1);
    };

    // Snap desligado durante a animação; religa 40ms após o último frame.
    let _animAtual = null;
    let _snapRestoreTimer = null;
    let _snapScrollendListener = null;

    const _limparNavegacaoPendente = () => {
        if (_animAtual) { cancelAnimationFrame(_animAtual); _animAtual = null; }
        if (_snapRestoreTimer) { clearTimeout(_snapRestoreTimer); _snapRestoreTimer = null; }
        if (_snapScrollendListener) {
            container.removeEventListener('scrollend', _snapScrollendListener);
            _snapScrollendListener = null;
        }
    };

    const irParaCard = (idx) => {
        const cards = container.querySelectorAll('[data-conta-id]');
        const card = cards[idx];
        if (!card) return;

        const scrollPadLeft = parseFloat(getComputedStyle(container).paddingLeft) || 0;
        const containerRect = container.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const targetScroll = Math.round(
            container.scrollLeft + (cardRect.left - containerRect.left) - scrollPadLeft
        );

        const startScroll = container.scrollLeft;
        const distance = targetScroll - startScroll;
        if (Math.abs(distance) < 1) return;

        _limparNavegacaoPendente();
        container.style.setProperty('scroll-snap-type', 'none', 'important');

        const restaurarSnap = () => {
            _limparNavegacaoPendente();
            container.scrollLeft = targetScroll;
            requestAnimationFrame(() => {
                container.style.removeProperty('scroll-snap-type');
            });
        };

        // Native smooth scroll (GPU). scrollend restaura o snap no momento exato.
        if ('scrollBehavior' in document.documentElement.style) {
            if ('onscrollend' in window) {
                _snapScrollendListener = restaurarSnap;
                container.addEventListener('scrollend', _snapScrollendListener, { once: true });
            }
            // Fallback por timeout — protege navegadores sem
            // `scrollend` e cobre scrolls longos (distâncias grandes).
            _snapRestoreTimer = setTimeout(restaurarSnap, 600);
            container.scrollTo({ left: targetScroll, behavior: 'smooth' });
        } else {
            // ─── Fallback legado: RAF para Safari < 15.4 ───
            const duration = 450;
            const startTime = performance.now();
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                container.scrollLeft = startScroll + distance * easeOutCubic(progress);
                if (progress < 1) {
                    _animAtual = requestAnimationFrame(animate);
                } else {
                    _animAtual = null;
                    restaurarSnap();
                }
            };
            _animAtual = requestAnimationFrame(animate);
        }
    };

    // Enforcer: só age em desvio > 25% do card, com debounce de 300ms.
    let _snapDebounceId = null;
    let _isDragging = false;

    const _snapEnforcer = () => {
        if (_animAtual) return; // animação de seta em andamento
        const cards = container.querySelectorAll('[data-conta-id]');
        if (cards.length === 0) return;

        const scrollPadLeft = parseFloat(getComputedStyle(container).paddingLeft) || 0;
        const containerLeft = container.getBoundingClientRect().left;
        const cardWidth = cards[0].offsetWidth;

        let bestDist = Infinity, bestDelta = 0;
        cards.forEach((card) => {
            const cardLeft = card.getBoundingClientRect().left;
            const diff = cardLeft - (containerLeft + scrollPadLeft);
            if (Math.abs(diff) < bestDist) {
                bestDist = Math.abs(diff);
                bestDelta = diff;
            }
        });

        if (bestDist < cardWidth * 0.25) return;

        container.style.setProperty('scroll-snap-type', 'none', 'important');

        const startScroll = container.scrollLeft;
        const distance = bestDelta;
        const duration = 280;
        const startTime = performance.now();
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

        const animateSnap = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            container.scrollLeft = startScroll + distance * easeOutCubic(progress);
            if (progress < 1) {
                _animAtual = requestAnimationFrame(animateSnap);
            } else {
                _animAtual = null;
                // Restaura o snap depois que o navegador assentou
                // na posição nova.
                setTimeout(() => {
                    container.style.removeProperty('scroll-snap-type');
                }, 40);
            }
        };
        _animAtual = requestAnimationFrame(animateSnap);
    };

    container.addEventListener('touchstart', () => { _isDragging = true; }, { passive: true });
    container.addEventListener('touchend', () => {
        _isDragging = false;
        clearTimeout(_snapDebounceId);
        _snapDebounceId = setTimeout(_snapEnforcer, 300);
    }, { passive: true });
    container.addEventListener('touchcancel', () => {
        _isDragging = false;
        clearTimeout(_snapDebounceId);
        _snapDebounceId = setTimeout(_snapEnforcer, 300);
    }, { passive: true });

    let rafId = null;
    _navContasScrollHandler = () => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
            atualizarDots(calcularIndiceAtivo());
        });

        if (!_isDragging) {
            clearTimeout(_snapDebounceId);
            _snapDebounceId = setTimeout(_snapEnforcer, 300);
        }
    };
    container.addEventListener('scroll', _navContasScrollHandler, { passive: true });

    nav.querySelectorAll('.nav-conta-dot').forEach((dot) => {
        dot.addEventListener('click', () => {
            const idx = parseInt(dot.dataset.dotIndex, 10);
            irParaCard(idx);
        });
    });

    document.getElementById('navContaPrev')?.addEventListener('click', () => {
        const idx = calcularIndiceAtivo();
        if (idx > 0) irParaCard(idx - 1);
    });
    document.getElementById('navContaNext')?.addEventListener('click', () => {
        const idx = calcularIndiceAtivo();
        if (idx < totalContas - 1) irParaCard(idx + 1);
    });

    atualizarDots(calcularIndiceAtivo());
}

window.renderizarCarrosselContas = function() {
    attachDragHandlers();
    const container = document.getElementById('containerContas');
    if (!container) return;
    container.innerHTML = '';
    
    let saldosContas = {};
    contasGlobais.forEach(c => {
        saldosContas[c.id] = parseFloat(c.saldoInicial || 0);
    });

    // SOMA APENAS A REALIDADE: Despesas e Receitas Manuais Pagas
    bancoDeDados.forEach(d => {
        let idAlvo = d.contaId || 'c_padrao'; 
        if (saldosContas[idAlvo] !== undefined && d.pago) {
            let val = parseFloat(d.valor);
            if (d.tipo === 'Receita' || d.natureza === 'Receita') saldosContas[idAlvo] += val;
            else saldosContas[idAlvo] -= val;
        }
    });

    contasGlobais.forEach(c => {
        let saldoReal = saldosContas[c.id];
        let isNeg = saldoReal < 0;
        let b = BANCOS[c.banco || 'carteira'] || BANCOS['outros'];

        let div = document.createElement('div');
        div.className = "w-full sm:w-auto sm:min-w-[240px] snap-start flex-shrink-0 flex flex-col justify-between cursor-grab active:cursor-grabbing select-none relative rounded-xl px-5 py-4 bg-transparent hover:bg-slate-50 dark:hover:bg-[#1a2639] gap-3";
        div.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease, background-color 0.2s ease';
        div.dataset.contaId = c.id;
        div.style.scrollSnapStop = 'always';

        div.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if (e.target.closest('button')) return;

            const isTouch = e.pointerType === 'touch' || e.pointerType === 'pen';

            dragState = {
                card: div,
                startX: e.clientX,
                startY: e.clientY,
                offsetX: 0,
                offsetY: 0,
                active: false,
                placeholder: null,
                savedStyles: null,
                isTouch: isTouch,
                longPressReady: false,
                longPressTimer: null
            };

            if (isTouch) {
                // 📱 Feedback visual imediato: card "ergue" ao toque.
                div.style.transform = hoverTransform;
                div.style.boxShadow = hoverShadow;
                setTimeout(() => {
                    if (!dragState || dragState.card !== div) {
                        div.style.transform = repousoTransform;
                        div.style.boxShadow = repousoShadow;
                    }
                }, 350);

                dragState.longPressTimer = setTimeout(() => {
                    if (!dragState || dragState.card !== div) return;
                    dragState.longPressReady = true;
                    if (navigator.vibrate) {
                        try { navigator.vibrate([18, 40, 22]); } catch(_) {}
                    }
                    div.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
                    div.style.transform = 'scale(0.94)';
                    div.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15), 0 18px 36px -10px rgba(0,0,0,0.22)';
                }, 200);
            }
        });

        const hoverTransform = 'translateY(-1px)';
        const hoverShadow    = '0 5px 12px -5px rgba(15, 23, 42, 0.16)';
        const repousoTransform = '';
        const repousoShadow    = '';

        div.addEventListener('mouseenter', () => {
            if (!dragState && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                div.style.transform = hoverTransform;
                div.style.boxShadow = hoverShadow;
            }
        });
        div.addEventListener('mouseleave', () => {
            if (!dragState || dragState.card !== div) {
                div.style.transform = repousoTransform;
                div.style.boxShadow = repousoShadow;
            }
        });

        div.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-3 overflow-hidden">
                    <div class="w-9 h-9 shrink-0">${renderBankLogo(b)}</div>
                    <span class="font-semibold text-sm text-slate-600 dark:text-gray-300 truncate">${c.nome}</span>
                </div>
                <button type="button" onclick="abrirModalAjuste('Conta|${c.id}')" title="Reajustar" class="p-1.5 text-slate-300 dark:text-gray-500 hover:text-[#4D6BFE] transition-colors active:scale-90 rounded-full hover:bg-[#4D6BFE]/10 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
            </div>
            <div class="flex flex-col mt-auto">
                <p class="font-montserrat font-bold ${isNeg ? 'text-red-600 dark:text-red-500' : 'text-slate-900 dark:text-white'} valor-sensivel text-xl tracking-tight">
                    ${formatMoeda(saldoReal)}
                </p>
            </div>
        `;
        container.appendChild(div);
    });

    // Scroll horizontal só se o conteúdo estourar a largura disponível.
    requestAnimationFrame(() => {
        const precisaRolar = container.scrollWidth > container.clientWidth + 2;
        if (precisaRolar) {
            container.style.overflowX = 'auto';
            const isMobile = window.innerWidth < 768;
            container.style.scrollSnapType = isMobile ? 'x mandatory' : 'x proximity';
        } else {
            container.style.overflowX = 'hidden';
            container.style.scrollSnapType = 'none';
        }
    });

    renderDropdownContas('listaContaDropdown', 'contaSelecionada', 'lblConta', 'menuConta');
    renderDropdownContas('listaEditContaDropdown', 'editContaSelecionada', 'lblEditConta', 'menuEditConta');

    configurarNavContasMobile();
}

// 🗑️ renderizarCarrosselContasProjetado foi removida nesta versão.
//    O HTML não tem mais `containerContasProjetado` nem os IDs
//    `cardSaldo*Proj` — a função rodava como no-op. Se a projeção
//    for reintroduzida no futuro, deve nascer como feature nova
//    (com seção dedicada no HTML), não ressuscitando este bloco.

window.zerarProjecaoMes = function() {
    if(confirm("Deseja zerar a simulação deste mês? Os valores voltarão a espelhar apenas a realidade do seu Extrato.")) {
        let chave = window.chaveMes(dataFiltro);
        
        if(configHoleriteGlobal[chave]) delete configHoleriteGlobal[chave];
        if(saldoBaseMensalGlobal[chave]) delete saldoBaseMensalGlobal[chave];
        
        syncToFirebase();
        carregarOuCalcularFolha();
        atualizarTabela();
        
        window.mostrarAviso("Simulação zerada com sucesso!", "sucesso");
    }
}

window.renderDropdownContas = function(listId, inputId, lblId, menuId) {
    const list = document.getElementById(listId);
    const input = document.getElementById(inputId);
    const lbl = document.getElementById(lblId);
    if (!list) return;
    
    list.innerHTML = '';
    contasGlobais.forEach(c => {
        let b = BANCOS[c.banco || 'carteira'] || BANCOS['outros'];
        let li = document.createElement('li');
        li.className = "cursor-pointer px-4 py-2 hover:bg-slate-100 flex items-center gap-3 transition-colors border-b border-slate-100 last:border-0";
        li.innerHTML = `
            <div class="w-6 h-6 shrink-0">
                ${renderBankLogo(b)}
            </div>
            <span class="font-medium text-slate-700 truncate">${c.nome}</span>
        `;
        li.addEventListener('click', () => {
            input.value = c.id;
            lbl.innerHTML = `
                <div class="flex items-center gap-2.5 truncate">
                    <div class="w-5 h-5 shrink-0">
                        ${renderBankLogo(b)}
                    </div>
                    <span class="truncate mt-0.5">${c.nome}</span>
                </div>
            `;
            document.getElementById(menuId).classList.add('hidden');
        });
        list.appendChild(li);
    });

    if (!input.value && contasGlobais.length > 0) {
        let cPrimeira = contasGlobais[0];
        let b = BANCOS[cPrimeira.banco || 'carteira'] || BANCOS['outros'];
        input.value = cPrimeira.id;
        lbl.innerHTML = `
            <div class="flex items-center gap-2.5 truncate">
                <div class="w-5 h-5 shrink-0">
                    ${renderBankLogo(b)}
                </div>
                <span class="truncate mt-0.5">${cPrimeira.nome}</span>
            </div>
        `;
    } else if (input.value) {
        let cSelecionada = contasGlobais.find(x => x.id === input.value) || contasGlobais[0];
        let b = BANCOS[cSelecionada.banco || 'carteira'] || BANCOS['outros'];
        lbl.innerHTML = `
            <div class="flex items-center gap-2.5 truncate">
                <div class="w-5 h-5 shrink-0">
                    ${renderBankLogo(b)}
                </div>
                <span class="truncate mt-0.5">${cSelecionada.nome}</span>
            </div>
        `;
    }
}

// Usa o motor exclusivo nas Contas
document.getElementById('btnConta')?.addEventListener('click', (e) => { window.abrirMenuExclusivo('menuConta', e); });
document.getElementById('btnEditConta')?.addEventListener('click', (e) => { window.abrirMenuExclusivo('menuEditConta', e); });
document.getElementById('btnAcoesContas')?.addEventListener('click', (e) => { window.abrirMenuExclusivo('menuAcoesContas', e); });

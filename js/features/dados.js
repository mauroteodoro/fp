// Exportar/importar, backups e reset
'use strict';

// ===================== EXPORTAR E IMPORTAR =====================
window.exportarBackup = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bancoDeDados));
    const a = document.createElement('a'); a.setAttribute("href", dataStr); a.setAttribute("download", "financas_backup.json"); a.click();
    window.mostrarAviso("Backup exportado!", "sucesso");
}

const modalImportar = document.getElementById('modalImportar');
window.abrirModalImportar = function() {
    window.abrirModalGenerico('modalImportar');
}
window.fecharModalImportar = function() {
    window.fecharModalGenerico('modalImportar');
}
document.getElementById('btnConfirmarImportar').addEventListener('click', function() { document.getElementById('inputImportar').click(); window.fecharModalImportar(); });
document.getElementById('inputImportar').addEventListener('change', function(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const lido = JSON.parse(e.target.result);
            if(Array.isArray(lido)) {
                // 0. Snapshot de segurança antes de importar
                try { await criarBackup('Antes de Importar'); } catch(err) { console.error(err); }
                
                // 1. Apaga tudo que existe no Firestore atual
                bancoDeDados.forEach(d => apagarDespesaFirestore(d.id));
                
                // 2. Recebe os novos dados e salva na subcoleção
                bancoDeDados = lido; 
                bancoDeDados.forEach(d => salvarDespesaFirestore(d));
                
                syncToFirebase(); // Apenas para salvar as demais configs globais se necessário
                atualizarTabela(); window.mostrarAviso("Backup restaurado da nuvem!", "sucesso");
            } else { window.mostrarAviso("Arquivo de backup inválido.", "erro"); }
        } catch (err) { window.mostrarAviso("Erro ao ler o arquivo.", "erro"); }
    };
    reader.readAsText(file);
});
// ===================== BACKUPS / CHECKPOINTS =====================
// Automáticos têm cota própria (3); manuais e de segurança cabem na cota total (10).
const MAX_BACKUPS = 10;
const MAX_AUTOMATICOS = 3;
const INTERVALO_AUTO_BACKUP_MS = 24 * 60 * 60 * 1000; // 24h

function capturarSnapshot() {
    return {
        bancoDeDados: JSON.parse(JSON.stringify(bancoDeDados)),
        categoriasGlobais: JSON.parse(JSON.stringify(categoriasGlobais)),
        contasGlobais: JSON.parse(JSON.stringify(contasGlobais)),
        meuPerfil: JSON.parse(JSON.stringify(meuPerfil)),
        configHoleriteGlobal: JSON.parse(JSON.stringify(configHoleriteGlobal)),
        saldoBaseMensalGlobal: JSON.parse(JSON.stringify(saldoBaseMensalGlobal))
    };
}

async function carregarBackups() {
    if (!currentUserUID) return [];
    const snap = await getDocs(collection(db, "userData", currentUserUID, "backups"));
    const lista = [];
    snap.forEach(d => lista.push(d.data()));
    lista.sort((a, b) => parseInt(b.id) - parseInt(a.id));
    return lista;
}

async function limparBackupsAntigos() {
    if (!currentUserUID) return;
    // `carregarBackups` já retorna ordenado (mais recente primeiro).
    const lista = await carregarBackups();
    const idsParaRemover = new Set();

    const automaticos = lista.filter(b => b.nome === 'Automático');
    if (automaticos.length > MAX_AUTOMATICOS) {
        automaticos.slice(MAX_AUTOMATICOS).forEach(b => idsParaRemover.add(b.id));
    }

    // Considera apenas os que não foram marcados na camada 1 (evita contar em dobro).
    const restantes = lista.filter(b => !idsParaRemover.has(b.id));
    if (restantes.length > MAX_BACKUPS) {
        restantes.slice(MAX_BACKUPS).forEach(b => idsParaRemover.add(b.id));
    }

    // Executa a remoção (silenciosa em erros individuais — um
    // backup que não puder ser apagado não bloqueia os outros).
    for (const id of idsParaRemover) {
        try { await deleteDoc(doc(db, "userData", currentUserUID, "backups", id)); } catch(e) {}
    }
}

async function criarBackup(nome) {
    if (!currentUserUID) return null;
    try {
        const snapshot = capturarSnapshot();
        const id = Date.now().toString();
        const payload = {
            id,
            data: getTimestampAtual(),
            nome: nome || 'Manual',
            resumo: {
                despesas: snapshot.bancoDeDados.length,
                contas: snapshot.contasGlobais.length,
                categorias: snapshot.categoriasGlobais.length
            },
            dados: JSON.stringify(snapshot)
        };
        await setDoc(doc(db, "userData", currentUserUID, "backups", id), payload);
        await limparBackupsAntigos();
        return id;
    } catch(e) {
        console.error("Erro ao criar backup:", e);
        return null;
    }
}

async function criarBackupAutomaticoSeNecessario() {
    if (!currentUserUID) return;
    try {
        const lista = await carregarBackups();
        const agora = Date.now();
        if (lista.length === 0) { await criarBackup('Automático'); return; }
        const ultimo = parseInt(lista[0].id);
        if (agora - ultimo > INTERVALO_AUTO_BACKUP_MS) { await criarBackup('Automático'); }
    } catch(e) { console.error("Erro no auto-backup:", e); }
}

window.criarBackupManual = async function() {
    const id = await criarBackup('Manual');
    if (id) {
        window.mostrarAviso("Checkpoint criado!", "sucesso");
        await renderListaBackups();
    } else {
        window.mostrarAviso("Erro ao criar checkpoint.", "erro");
    }
};

window.renderListaBackups = async function() {
    const container = document.getElementById('listaBackups');
    if (!container) return;
    container.innerHTML = '<p class="text-center py-8 text-slate-400 text-sm">Carregando...</p>';
    const lista = await carregarBackups();
    if (lista.length === 0) {
        container.innerHTML = '<p class="text-center py-8 text-slate-400 text-sm">Nenhum checkpoint salvo ainda.<br><span class="text-[10px]">Crie um agora para garantir.</span></p>';
        return;
    }
    container.innerHTML = '';
    lista.forEach(b => {
        const div = document.createElement('div');
        div.dataset.backupId = b.id;
        div.className = "bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#1e2a40] p-3.5 rounded-xl flex flex-col gap-2.5 shadow-sm";
        div.innerHTML = `
            <div class="flex justify-between items-start gap-2">
                <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-slate-800 dark:text-gray-200 truncate">${b.data}</p>
                    <p class="text-[10px] uppercase tracking-wider font-bold text-slate-900 dark:text-cyan-400 mt-0.5">${b.nome}</p>
                </div>
                <span class="text-[10px] text-slate-400 font-semibold whitespace-nowrap shrink-0">${b.resumo.despesas} lanç. · ${b.resumo.contas} contas</span>
            </div>
            <div class="flex gap-2">
                <button type="button" onclick="restaurarBackup('${b.id}')" class="flex-1 bg-[#4D6BFE] hover:bg-[#4338CA] text-white font-bold py-2 rounded-lg text-xs transition-all active:scale-95">Restaurar</button>
                <button type="button" onclick="apagarBackup('${b.id}')" class="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/30 font-bold py-2 px-3 rounded-lg text-xs transition-colors active:scale-95">Apagar</button>
            </div>
        `;
        container.appendChild(div);
    });
};

window.abrirModalBackups = function() {
    if (!document.getElementById('modalPerfil').classList.contains('hidden')) fecharModalPerfil();
    setTimeout(() => {
        window.abrirModalGenerico('modalBackups');
        renderListaBackups();
    }, 160);
};

window.fecharModalBackups = function() {
    window.fecharModalGenerico('modalBackups');
};

window.apagarBackup = async function(id) {
    if (!confirm("Apagar este checkpoint permanentemente?")) return;
    try {
        await deleteDoc(doc(db, "userData", currentUserUID, "backups", id));

        // Remoção otimista: card sai do DOM direto (sem refetch).
        const card = document.querySelector(`[data-backup-id="${id}"]`);
        if (card) card.remove();

        // Se a lista ficou vazia, mostra a mensagem padrão de
        // "nenhum checkpoint salvo" — mesma string usada por
        // `renderListaBackups` quando detecta lista vazia.
        const container = document.getElementById('listaBackups');
        if (container && container.querySelectorAll('[data-backup-id]').length === 0) {
            container.innerHTML = '<p class="text-center py-8 text-slate-400 text-sm">Nenhum checkpoint salvo ainda.<br><span class="text-[10px]">Crie um agora para garantir.</span></p>';
        }

        window.mostrarAviso("Checkpoint removido.");
    } catch(e) {
        console.error("Erro ao apagar backup:", e);
        window.mostrarAviso("Erro ao apagar.", "erro");
        // Fallback: se a remoção otimista falhou por algum
        // motivo, re-renderiza para refletir o estado real do
        // servidor.
        await renderListaBackups();
    }
};

window.restaurarBackup = async function(id) {
    if (!confirm(
        "Restaurar este checkpoint?\n\n" +
        "✅ Lançamentos, simulações, categorias e perfil serão restaurados.\n" +
        "⛔ Os SALDOS INICIAIS DAS CONTAS NÃO serão tocados — eles permanecem como estão agora.\n\n" +
        "Um backup de segurança do estado atual será criado antes, então você pode reverter."
    )) return;
    
    window.mostrarAviso("Restaurando...", "info");
    
    try {
        // 1. Backup de segurança do estado atual
        await criarBackup('Segurança (pré-restauração)');
        
        // 2. Lê o snapshot escolhido
        const snap = await getDoc(doc(db, "userData", currentUserUID, "backups", id));
        if (!snap.exists()) { window.mostrarAviso("Checkpoint não encontrado.", "erro"); return; }
        const dados = JSON.parse(snap.data().dados);
        
                        // Restaurar NÃO toca em contas: saldos iniciais preservados.
        // 3. Apaga do Firestore atual (EXCETO contas)
        for (const d of bancoDeDados) await apagarDespesaFirestore(d.id);
        for (const c of categoriasGlobais) await apagarCategoriaFirestore(c.id);
        // 🎯 contas NÃO são apagadas — permanecem intactas.
        
        // 4. Aplica o snapshot (EXCETO contas)
        bancoDeDados = dados.bancoDeDados || [];
        categoriasGlobais = dados.categoriasGlobais || [];
        // 🎯 contasGlobais NÃO é tocada — segue com o estado atual.
        meuPerfil = dados.meuPerfil || meuPerfil;
        configHoleriteGlobal = dados.configHoleriteGlobal || {};
        saldoBaseMensalGlobal = dados.saldoBaseMensalGlobal || {};
        cacheSaldoAcumulado = {};
        
        // 5. Repopula o Firestore com os dados restaurados (EXCETO contas)
        for (const d of bancoDeDados) await salvarDespesaFirestore(d);
        for (const c of categoriasGlobais) await salvarCategoriaFirestore(c);
        // 🎯 contas NÃO são re-salvas — nunca foram mexidas.
        await syncToFirebase();
        
        // 6. Atualiza toda a UI
        aplicarPerfilVisual();
        setupDropdownCategorias();
        renderizarCarrosselContas();
        atualizarTabela();
        if (typeof renderTabelaContasTela === 'function') renderTabelaContasTela();
        
        window.mostrarAviso("Checkpoint restaurado. Os saldos das contas foram preservados.", "sucesso");
        window.fecharModalBackups();
    } catch(e) {
        console.error("Erro ao restaurar:", e);
        window.mostrarAviso("Erro ao restaurar checkpoint.", "erro");
    }
};

// ===================== RESET DO SISTEMA =====================
const modalReset = document.getElementById('modalReset');
window.abrirModalReset = function() {
    fecharModalPerfil(); // Fecha o modal de perfil para não sobrepor
    setTimeout(() => {
        window.abrirModalGenerico('modalReset');
    }, 160);
}

window.fecharModalReset = function() {
    window.fecharModalGenerico('modalReset');
}

document.getElementById('btnConfirmarReset').addEventListener('click', async function() {
    if(confirm("ÚLTIMO AVISO: Tem certeza ABSOLUTA que deseja apagar todos os dados da nuvem? Esta ação não tem volta!\n\nUm checkpoint automático será criado antes, então você poderá restaurar depois.")) {
        
        // 0. Snapshot de segurança (sobrevive ao reset — fica na subcoleção "backups")
        try { await criarBackup('Antes do Hard Reset'); } catch(e) { console.error(e); }
        
        // 1. Apaga todas as subcoleções conhecidas no Firestore
        bancoDeDados.forEach(d => apagarDespesaFirestore(d.id));
        categoriasGlobais.forEach(c => apagarCategoriaFirestore(c.id));
        contasGlobais.forEach(c => apagarContaFirestore(c.id));

        // 1. Zera as variáveis globais do sistema
        bancoDeDados = [];
        configHoleriteGlobal = {};
        saldoBaseMensalGlobal = {};
        categoriasGlobais = JSON.parse(JSON.stringify(CATEGORIAS_PADRAO)); // Clona as originais
        contasGlobais = [{ id: 'c_padrao', nome: 'Carteira Física', saldoInicial: 0 }];
        meuPerfil = { nome: 'Mauro Santos', email: '', cargo: 'Finanças Pessoais', foto: '', salario: '', horas: '220', dependentes: '0', regime: 'CLT', temVale: 'Sim', cidade: 'Iperó - SP' };
        
        // 2. Recria os padrões nas subcoleções e manda o restante para a nuvem
        categoriasGlobais.forEach(c => salvarCategoriaFirestore(c));
        contasGlobais.forEach(c => salvarContaFirestore(c));
        syncToFirebase();
        
        // 3. Atualiza os visuais e as contas matemáticas da tela
        aplicarPerfilVisual();
        atualizarTabela();
        setupDropdownCategorias();
        
        // 4. Se estiver na aba projeção, recalcula (zera) a folha de pagamento
        const abaProjecao = document.getElementById('abaProjecao'); 
        if(abaProjecao.classList.contains('block')) carregarOuCalcularFolha();
        
        fecharModalReset();
        window.mostrarAviso("Sistema zerado com sucesso. De volta às configurações de fábrica.", "info");
    }
});

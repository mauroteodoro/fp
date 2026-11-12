// Sincronização com a nuvem (Firestore)
'use strict';

// ===================== SINCRONIZAÇÃO COM A NUVEM =====================
async function salvarDespesaFirestore(despesa) {
    if (!currentUserUID) return;
    cacheSaldoAcumulado = {}; // Invalida o cache
    try {
        await setDoc(doc(db, "userData", currentUserUID, "despesas", despesa.id.toString()), despesa);
    } catch (e) {
        console.error("Erro ao salvar despesa na nuvem:", e);
    }
}

async function apagarDespesaFirestore(idDespesa) {
    if (!currentUserUID) return;
    cacheSaldoAcumulado = {}; // Invalida o cache
    try {
        await deleteDoc(doc(db, "userData", currentUserUID, "despesas", idDespesa.toString()));
    } catch (e) {
        console.error("Erro ao apagar despesa na nuvem:", e);
    }
}

async function salvarCategoriaFirestore(categoria) {
    if (!currentUserUID) return;
    try { await setDoc(doc(db, "userData", currentUserUID, "categorias", categoria.id.toString()), categoria); } 
    catch (e) { console.error("Erro ao salvar categoria:", e); }
}

async function apagarCategoriaFirestore(idCategoria) {
    if (!currentUserUID) return;
    try { await deleteDoc(doc(db, "userData", currentUserUID, "categorias", idCategoria.toString())); } 
    catch (e) { console.error("Erro ao apagar categoria:", e); }
}

async function salvarContaFirestore(conta) {
    if (!currentUserUID) return;
    try { await setDoc(doc(db, "userData", currentUserUID, "contas", conta.id.toString()), conta); } 
    catch (e) { console.error("Erro ao salvar conta:", e); }
}

async function apagarContaFirestore(idConta) {
    if (!currentUserUID) return;
    try { await deleteDoc(doc(db, "userData", currentUserUID, "contas", idConta.toString())); } 
    catch (e) { console.error("Erro ao apagar conta:", e); }
}

async function syncToFirebase() {
    if (!currentUserUID) return;
    cacheSaldoAcumulado = {}; // Invalida o cache (pois altera holerite ou base mensal)
    try {
        // 🎯 `merge: true` é ESSENCIAL aqui. Sem ele, o setDoc
        // SUBSTITUI o documento inteiro e apaga campos gravados
        // por outras funções — o mais crítico é o `tema`
        // (gravado por `aplicarTema` com merge). Resultado do
        // bug antigo: toda vez que o usuário salvava o perfil
        // ou uma simulação, o tema era DELETADO do Firestore
        // e o próximo dispositivo abria no tema padrão.
        await setDoc(doc(db, "userData", currentUserUID), {
            perfil: meuPerfil,
            configHolerite: configHoleriteGlobal,
            saldoBaseMensal: saldoBaseMensalGlobal,
            orcamentos: orcamentosGlobais
        }, { merge: true });
    } catch (e) {
        console.error("Erro ao salvar na nuvem:", e);
        window.mostrarAviso("Falha ao salvar na nuvem! Verifique o console.", "erro");
    }
}

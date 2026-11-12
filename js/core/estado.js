// Estado global, menus e proteção de foco no iOS
'use strict';

// Firebase vem de js/core/firebase.js (ES module carregado antes).
const { initializeApp, getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, getStorage, ref, uploadString, getDownloadURL, app, auth, db, storage } = window.__fb;

// Evita que iOS Safari auto-foque inputs de login antes da 1ª interação.
let _usuarioInteragiu = false;
const _marcarInteracao = () => { _usuarioInteragiu = true; };
document.addEventListener('touchstart', _marcarInteracao, { once: true, passive: true });
document.addEventListener('mousedown', _marcarInteracao, { once: true, passive: true });
document.addEventListener('keydown', _marcarInteracao, { once: true });

document.addEventListener('focusin', (e) => {
    if (_usuarioInteragiu) return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        setTimeout(() => { try { e.target.blur(); } catch (_) {} }, 0);
    }
});

// ===================== VARIÁVEIS GLOBAIS DE DADOS =====================
const TODOS_OS_MENUS = [
    { m: 'menuCategoria', b: 'btnCategoria' },
    { m: 'menuSubcategoria', b: 'btnSubcategoria' },
    { m: 'menuEditCategoria', b: 'btnEditCategoria' },
    { m: 'menuEditSubcategoria', b: 'btnEditSubcategoria' },
    { m: 'menuTipoCompra', b: 'btnTipoCompra' },
    { m: 'menuPeriodicidade', b: 'btnPeriodicidade' },
    { m: 'menuConta', b: 'btnConta' },
    { m: 'menuEditConta', b: 'btnEditConta' },
    { m: 'menuContaSimulacao', b: 'btnContaSimulacao' },
    { m: 'menuPerfilRegime', b: 'btnPerfilRegime' },
    { m: 'menuPerfilTemVale', b: 'btnPerfilTemVale' },
    { m: 'menuPerfilCidade', b: 'btnPerfilCidade' },
    { m: 'painelSeletorMes', b: 'btnAbrirSeletorMes' },
    { m: 'menuAcaoPrincipal', b: 'btnAcaoPrincipal' },
    { m: 'menuAcoesContas', b: 'btnAcoesContas' },
    { m: 'menuAutocomplete', b: 'descricao' },
    { m: 'menuFiltroPeriodo', b: 'btnFiltroPeriodo' },
    { m: 'menuFiltroTipo', b: 'btnFiltroTipo' },
    { m: 'menuFiltroConta', b: 'btnFiltroConta' },
    { m: 'menuFiltroCategoria', b: 'btnFiltroCategoria' },
    { m: 'menuFiltroOrigem', b: 'btnFiltroOrigem' },
    { m: 'menuFiltroStatus', b: 'btnFiltroStatus' },
    { m: 'menuTransfContaOrigem', b: 'btnTransfContaOrigem' },
    { m: 'menuTransfContaDestino', b: 'btnTransfContaDestino' },
    { m: 'menuFiltroChipTipo', b: 'btnFiltroChipTipo' },
    { m: 'menuFiltroChipOrdem', b: 'btnFiltroChipOrdem' }
];
let currentUserUID = null;
let bancoDeDados = [];
let configHoleriteGlobal = {};
let saldoBaseMensalGlobal = {};
let contasGlobais = []; // Armazena as carteiras/bancos
// 🎯 Orçamento mensal por categoria — um teto opcional por categoria.
//    Estrutura: { "Alimentação": 800, "Transporte": 500, ... }
//    Categorias sem entrada simplesmente não têm orçamento definido
//    (são ignoradas nas barras de progresso).
//    Uma chave especial `_total` permite definir um teto GLOBAL de
//    gastos por mês — o valor máximo que o usuário quer gastar no
//    total, somando todas as categorias.
let orcamentosGlobais = {};
let meuPerfil = { nome: 'Mauro Santos', email: '', cargo: 'Finanças Pessoais', foto: '', salario: '', horas: '220', dependentes: '0', regime: 'CLT', temVale: 'Sim', cidade: 'Iperó - SP' };
let cacheSaldoAcumulado = {};

let anexoAtualBase64 = null;
let anexoEditBase64 = null;

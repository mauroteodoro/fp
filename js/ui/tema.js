// Tema claro/escuro
'use strict';

// ===================== TEMA (CLARO / ESCURO) =====================
// 🎨 O tema vive em <html class="dark"> — aproveitando o Tailwind
// configurado com darkMode: 'class'. A preferência é lida do
// localStorage (aplicação instantânea) e sincronizada com o
// Firestore (persistência entre dispositivos).
window.temaAtual = localStorage.getItem('temaApp') || 'light';

window.aplicarTema = function(tema) {
    window.temaAtual = tema;
    localStorage.setItem('temaApp', tema);

    // Se há modal aberto, troca instantânea (evita "flash preto").
    const temModalAberto = Array.from(document.querySelectorAll('[id^="modal"]'))
        .some(m => !m.classList.contains('hidden') && m.style.display !== 'none');

    if (!temModalAberto) {
        document.documentElement.classList.add('theme-transitioning');
        setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 400);
    } else {
        document.documentElement.classList.add('theme-transitioning-instant');
        setTimeout(() => document.documentElement.classList.remove('theme-transitioning-instant'), 50);
    }

    if (tema === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    atualizarBotoesTema();

    // Redesenha os gráficos (Chart.js lê as cores só na criação).
    if (typeof window.renderizarGraficos === 'function'
        && !document.getElementById('abaGraficos')?.classList.contains('hidden')) {
        setTimeout(() => window.renderizarGraficos(), 450);
    }

    // 🔄 Sincroniza com a nuvem
    if (currentUserUID) {
        setDoc(doc(db, "userData", currentUserUID), { tema: tema }, { merge: true })
            .catch(e => console.error("Erro ao salvar tema:", e));
    }
};

function atualizarBotoesTema() {
    const btnClaro = document.getElementById('btnTemaClaro');
    const btnEscuro = document.getElementById('btnTemaEscuro');
    if (!btnClaro || !btnEscuro) return;

    const ativoClasses = ['bg-[#4D6BFE]', 'text-white', 'border-[#4D6BFE]', 'shadow-md', 'shadow-[#4D6BFE]/30'];
    const inativoClasses = ['bg-slate-100', 'dark:bg-[#1a2639]', 'text-slate-700', 'dark:text-gray-300', 'border-slate-200', 'dark:border-[#1e2a40]'];

    const marcar = (btn, isAtivo) => {
        btn.classList.remove(...ativoClasses, ...inativoClasses);
        btn.classList.add(...(isAtivo ? ativoClasses : inativoClasses));
    };

    marcar(btnClaro, window.temaAtual === 'light');
    marcar(btnEscuro, window.temaAtual === 'dark');
}

// Watchdog: limpa modais "fantasma" e destrava o scroll do body.
setInterval(() => {
    // ─── 1) Limpa modais "fantasma" ──────────────────────────
    document.querySelectorAll('[id^="modal"]').forEach(m => {
        if (m.classList.contains('hidden')) return;       // já fechado corretamente
        if (m.style.display === 'none') return;            // calendário grande fechado
        const op = parseFloat(m.style.opacity);
        // Só considera "fantasma" quem TEM opacity definida e ela está ~0.
        // NaN (opacity não setada) significa modal normal — ignorar.
        if (!isNaN(op) && op < 0.05) {
            const frames = (parseInt(m.dataset.stuckFrames) || 0) + 1;
            if (frames >= 3) {
                m.classList.add('hidden');
                delete m.dataset.stuckFrames;
            } else {
                m.dataset.stuckFrames = frames;
            }
        } else {
            delete m.dataset.stuckFrames;
        }
    });

    // ─── 2) Sincroniza o scroll com a realidade visível ──────
    if (document.body.style.overflow === 'hidden') {
        const algumVisivel = Array.from(document.querySelectorAll('[id^="modal"]'))
            .some(m => !m.classList.contains('hidden') && m.style.display !== 'none');
        if (!algumVisivel) {
            document.body.style.overflow = '';
        }
    }
}, 500);

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserUID = user.uid;
        loaderInicial.classList.remove('hidden');
        
        try {
            const docRef = doc(db, "userData", currentUserUID);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                const despesasRef = collection(db, "userData", currentUserUID, "despesas");
                const despesasSnap = await getDocs(despesasRef);
                bancoDeDados = [];
                despesasSnap.forEach(docItem => {
                    bancoDeDados.push(docItem.data());
                });

                meuPerfil = data.perfil || meuPerfil;
                configHoleriteGlobal = data.configHolerite || {};
                saldoBaseMensalGlobal = data.saldoBaseMensal || {};
                // 🎯 Carrega os orçamentos por categoria. Se o usuário
                //    ainda não configurou nada, fica objeto vazio
                //    (nenhum alerta, nenhuma barra de progresso).
                orcamentosGlobais = data.orcamentos || {};

                // 🎨 Sincroniza tema salvo na nuvem (sobrepõe o localStorage)
                if (data.tema && data.tema !== window.temaAtual) {
                    window.aplicarTema(data.tema);
                } else {
                    atualizarBotoesTema();
                }
                
                // Lendo Categorias
                const catsSnap = await getDocs(collection(db, "userData", currentUserUID, "categorias"));
                categoriasGlobais = [];
                catsSnap.forEach(docItem => categoriasGlobais.push(docItem.data()));
                
                if (categoriasGlobais.length === 0) {
                    categoriasGlobais = JSON.parse(JSON.stringify(CATEGORIAS_PADRAO));
                    categoriasGlobais.forEach(c => salvarCategoriaFirestore(c));
                }

                // Lendo Contas
                const contasSnap = await getDocs(collection(db, "userData", currentUserUID, "contas"));
                contasGlobais = [];
                contasSnap.forEach(docItem => contasGlobais.push(docItem.data()));
                
                if (contasGlobais.length === 0) {
                    contasGlobais = [{ id: 'c_padrao', nome: 'Carteira Física', saldoInicial: 0 }];
                    contasGlobais.forEach(c => salvarContaFirestore(c));
                }

                if (contasGlobais.some(c => c.ordem === undefined)) {
                    contasGlobais.sort((a, b) => a.nome.localeCompare(b.nome));
                    contasGlobais.forEach((c, i) => { c.ordem = i; salvarContaFirestore(c); });
                }
                contasGlobais.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
            } else {
                categoriasGlobais = JSON.parse(JSON.stringify(CATEGORIAS_PADRAO));
                categoriasGlobais.forEach(c => salvarCategoriaFirestore(c));
                
                contasGlobais = [{ id: 'c_padrao', nome: 'Carteira Física', saldoInicial: 0 }];
                contasGlobais.forEach(c => salvarContaFirestore(c));
                
                await syncToFirebase();
            }
        } catch(e) { console.error("Erro ao baixar dados:", e); }
        
        loginScreen.classList.add('opacity-0');
        setTimeout(() => { 
            loginScreen.classList.add('hidden'); 
            appWrapper.classList.remove('hidden');
            setTimeout(() => appWrapper.classList.remove('opacity-0'), 50);
            
            aplicarPerfilVisual();
            renderizarMesTopo();
            setupDropdownCategorias();
            renderizarCarrosselContas();
            
            // 🚨 Alerta de vencimentos — mostra uma vez por dia,
            // depois que a UI assentou. O delay evita o modal
            // "brigar" com o fade-in do app.
            // O sino flutuante é atualizado aqui E dentro de
            // `atualizarTabela()` — assim reflete o estado atual
            // em qualquer momento, sem depender do modal.
            setTimeout(() => {
                if (typeof window.atualizarIconeAlertaVencimento === 'function') {
                    window.atualizarIconeAlertaVencimento();
                }
                if (typeof window.verificarAlertasVencimento === 'function') {
                    window.verificarAlertasVencimento();
                }
            }, 1200);
            
            // 🎯 Alinha o conteúdo principal com o menu lateral.
            // Três camadas de disparo, porque cada uma cobre um
            // cenário diferente de carregamento:
            //   1. requestAnimationFrame — layout já calculado
            //      pelo browser, medição confiável.
            //   2. document.fonts.ready — quando o Google Fonts
            //      entrega Plus Jakarta e Inter, o header pode
            //      crescer e o alinhamento precisa ser recalculado.
            //   3. setTimeout 300ms — fallback de segurança caso
            //      a API `document.fonts` não exista no browser.
            requestAnimationFrame(() => {
                alinharConteudoComMenu();
                setTimeout(alinharConteudoComMenu, 300);
                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(() => alinharConteudoComMenu());
                }
            });
            
            // Auto-backup: cria um checkpoint se o último tiver mais de 24h
            setTimeout(() => { criarBackupAutomaticoSeNecessario(); }, 3000);
        }, 500);

    } else {
        currentUserUID = null;
        appWrapper.classList.add('opacity-0');
        setTimeout(() => {
            appWrapper.classList.add('hidden');
            loginScreen.classList.remove('hidden');
            loaderInicial.classList.add('hidden');
            setTimeout(() => loginScreen.classList.remove('opacity-0'), 50);
        }, 500);
    }
});


document.addEventListener('wheel', function(event) { if (document.activeElement.type === 'number') document.activeElement.blur(); }, { passive: true });

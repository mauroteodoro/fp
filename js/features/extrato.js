// Meu Caixa (extrato): renderização e filtros
'use strict';

// ===================== LÓGICA DO MEU CAIXA (Extrato) =====================
function formatarDataComparacao(dataStr) {
    let p = dataStr.split('/'); if(p.length !== 3) return dataStr;
    return `${p[0].padStart(2,'0')}/${p[1].padStart(2,'0')}/${p[2]}`;
}

// Retorna true se o lançamento pertence ao mês/ano (MM/AAAA).
// Trata recorrente, parcelado e à vista de forma unificada.
// Normaliza a data antes de comparar (padding defensivo).
function itemPertenceAoMes(item, mes, ano) {
    const chave = `${String(mes+1).padStart(2,'0')}/${ano}`;
    const alvoNum = ano * 100 + (mes + 1);
    const dataRef = item.vencimento || item.vencimentoOriginal || item.dataLancamento;
    if (!dataRef) return false;

    if (item.isRecorrente) {
        if (!item.vencimentoOriginal) return false;
        const p = item.vencimentoOriginal.split('/');
        if (p.length !== 3) return false;
        const inicioNum = parseInt(p[2]) * 100 + parseInt(p[1]);
        if (inicioNum > alvoNum) return false;
        if (item.encerradoEm && alvoNum >= item.encerradoEm) return false;
        if (item.mesesOcultos && item.mesesOcultos.includes(alvoNum)) return false;
        return true;
    }

    const dNorm = formatarDataComparacao(dataRef);
    return dNorm.length === 10 && dNorm.substring(3) === chave;
}

const modalEncerrar = document.getElementById('modalEncerrar'); let idRecorrenteParaEncerrar = null;
window.encerrarRecorrencia = function(idMestre) {
    idRecorrenteParaEncerrar = idMestre;
    window.abrirModalGenerico('modalEncerrar');
}
window.fecharModalEncerrar = function() {
    window.fecharModalGenerico('modalEncerrar', 'flex', null, () => { idRecorrenteParaEncerrar = null; });
}
document.getElementById('btnConfirmarEncerrar').addEventListener('click', () => {
    if(!idRecorrenteParaEncerrar) return;
    let nextM = dataFiltro.getMonth() + 2; 
    let nextY = dataFiltro.getFullYear();
    if (nextM > 12) { nextM = 1; nextY++; } 
    
    const anoMesEncerrarNum = nextY * 100 + nextM;
    
    bancoDeDados.forEach(d => { 
        if((d.transacaoId || d.id) === idRecorrenteParaEncerrar && d.isRecorrente) { 
            d.encerradoEm = anoMesEncerrarNum; 
            salvarDespesaFirestore(d);
        } 
    });
    
    atualizarTabela(); window.fecharModalEncerrar(); window.mostrarAviso("Recorrência encerrada!", "info");
});

function ajustarVencimentosRecorrentes(lista, filtroDate) {
    const anoMesFiltroNum = filtroDate.getFullYear() * 100 + (filtroDate.getMonth() + 1);
    lista.forEach(despesa => {
        if (despesa.isRecorrente && despesa.vencimentoOriginal) {
            const p = despesa.vencimentoOriginal.split('/'); const anoMesInicioNum = parseInt(p[2]) * 100 + parseInt(p[1]);
            if (anoMesInicioNum <= anoMesFiltroNum && (!despesa.encerradoEm || anoMesFiltroNum < despesa.encerradoEm) && (!despesa.mesesOcultos || !despesa.mesesOcultos.includes(anoMesFiltroNum))) {
                let diaAjustado = Math.min(parseInt(p[0]), new Date(filtroDate.getFullYear(), filtroDate.getMonth() + 1, 0).getDate());
                despesa.vencimento = `${String(diaAjustado).padStart(2,'0')}/${String(filtroDate.getMonth()+1).padStart(2,'0')}/${filtroDate.getFullYear()}`;
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════
// 🎯 FILTROS DO EXTRATO — Tipo (Entradas/Saídas) + Ordem
// ═══════════════════════════════════════════════════════════════
// Dois filtros independentes, cada um controlado por um dropdown.
//   • filtroChipTipo  → 'todas' | 'entradas' | 'saidas'
//   • filtroChipOrdem → 'recentes' | 'antigos'
//
// O botão "Todas" é o RESET: volta ambos para o padrão. Fica
// destacado (azul) somente quando os dois estão no default.
let filtroChipTipo = 'todas';
let filtroChipOrdem = 'recentes';
let filtroChipOrigem = 'todas';

function _obterOrigemEfetiva(transacao) {
    if (transacao.isTransferencia) return '';

    let txtOrigem = transacao.origem || '';

    if (meuPerfil.regime === 'PJ') {
        const ehReceita = transacao.tipo === 'Receita' || transacao.natureza === 'Receita';
        return ehReceita ? 'Recebimento' : 'Caixa';
    }

    const valeRespeitavel = (txtOrigem === 'Vale' && meuPerfil.temVale !== 'Não');
    const origemRespeitavel = txtOrigem === 'Salário' || txtOrigem === 'Ajuste' || valeRespeitavel;
    if (!origemRespeitavel) {
        const dataRefOrig = transacao.vencimento || transacao.dataLancamento;
        return determinarOrigem(dataRefOrig, transacao.natureza || 'Despesa', null);
    }
    return txtOrigem;
}

function _atualizarChipsExtrato() {
    const wrapOrigem = document.getElementById('wrapFiltroChipOrigem');
    const btnTipo  = document.getElementById('btnFiltroChipTipo');
    const btnOrdem = document.getElementById('btnFiltroChipOrdem');
    const btnOrigem = document.getElementById('btnFiltroChipOrigem');
    const lblTipo  = document.getElementById('lblFiltroChipTipo');
    const lblOrdem = document.getElementById('lblFiltroChipOrdem');
    const lblOrigem = document.getElementById('lblFiltroChipOrigem');
    const optVale = document.getElementById('btnOptValeChip');

    const ativoFlex   = 'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors bg-[#4D6BFE] text-white shadow-sm shadow-[#4D6BFE]/20 whitespace-nowrap';
    const inativoFlex = 'flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 whitespace-nowrap';

    // Origem visível só em CLT com vale (PJ e sem-vale não têm os 2 buckets).
    const mostrarOrigem = (meuPerfil.regime !== 'PJ' && meuPerfil.temVale !== 'Não');
    if (wrapOrigem) {
        wrapOrigem.style.display = mostrarOrigem ? '' : 'none';
    }

    if (optVale) {
        optVale.style.display = (meuPerfil.temVale === 'Não' || meuPerfil.regime === 'PJ') ? 'none' : '';
    }

    // Se o filtro estava em "vale" mas o perfil mudou e o vale
    // sumiu, reseta para "todas" — senão a lista ficaria vazia
    // sem o usuário entender o porquê.
    if (filtroChipOrigem === 'vale' && !mostrarOrigem) {
        filtroChipOrigem = 'todas';
    }

    if (btnTipo) {
        btnTipo.className = (filtroChipTipo !== 'todas') ? ativoFlex : inativoFlex;
    }
    if (lblTipo) {
        lblTipo.textContent = filtroChipTipo === 'entradas' ? 'Entradas'
                            : filtroChipTipo === 'saidas'   ? 'Saídas'
                            : 'Tipo';
    }
    if (btnOrigem) {
        btnOrigem.className = (filtroChipOrigem !== 'todas') ? ativoFlex : inativoFlex;
    }
    if (lblOrigem) {
        lblOrigem.textContent = filtroChipOrigem === 'salario' ? 'Salário'
                              : filtroChipOrigem === 'vale'    ? 'Vale'
                              : 'Origem';
    }
    if (btnOrdem) {
        btnOrdem.className = (filtroChipOrdem === 'antigos') ? ativoFlex : inativoFlex;
    }
    if (lblOrdem) {
        lblOrdem.textContent = filtroChipOrdem === 'antigos' ? 'Mais antigos' : 'Mais recentes';
    }
}

// Tipo: todas / entradas / saidas
window.setFiltroChipTipo = function(valor) {
    filtroChipTipo = valor;
    document.getElementById('menuFiltroChipTipo')?.classList.add('hidden');
    _atualizarChipsExtrato();
    atualizarTabela();
};

// Ordem: recentes / antigos
window.setFiltroChipOrdem = function(valor) {
    filtroChipOrdem = valor;
    document.getElementById('menuFiltroChipOrdem')?.classList.add('hidden');
    _atualizarChipsExtrato();
    atualizarTabela();
};

// Origem: todas / salario / vale
window.setFiltroChipOrigem = function(valor) {
    filtroChipOrigem = valor;
    document.getElementById('menuFiltroChipOrigem')?.classList.add('hidden');
    _atualizarChipsExtrato();
    atualizarTabela();
};

// position:fixed nas coordenadas do botão — evita clipping do overflow-x-auto.
window.abrirMenuChipFiltro = function(menuId, btnId, e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById(menuId);
    const btn = document.getElementById(btnId);
    if (!menu || !btn) return;

    const estavaFechado = menu.classList.contains('hidden');

    // Fecha todos os menus conhecidos (exceto o alvo, que vamos
    // reabrir logo abaixo).
    TODOS_OS_MENUS.forEach(par => {
        const m = document.getElementById(par.m);
        if (m && m.id !== menuId) m.classList.add('hidden');
    });
    document.getElementById('menuFiltroChipTipo')?.classList.add('hidden');
    document.getElementById('menuFiltroChipOrigem')?.classList.add('hidden');
    document.getElementById('menuFiltroChipOrdem')?.classList.add('hidden');

    if (!estavaFechado) return;

    // Posiciona em coordenadas da tela. `getBoundingClientRect`
    // sempre retorna coordenadas de viewport — casam com fixed.
    const rect = btn.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = (rect.bottom + 6) + 'px';

    // Enconsta na borda direita se o menu estouraria a tela.
    const menuW = (menuId === 'menuFiltroChipOrdem') ? 176 : 160;
    const maxLeft = window.innerWidth - menuW - 12;
    menu.style.left = Math.min(rect.left, maxLeft) + 'px';

    menu.classList.remove('hidden');
};

// Fecha os chips ao redimensionar (evita menu "preso" no lugar
// errado depois de um rotate do celular ou mudança de viewport).
window.addEventListener('resize', () => {
    document.getElementById('menuFiltroChipTipo')?.classList.add('hidden');
    document.getElementById('menuFiltroChipOrdem')?.classList.add('hidden');
});

function atualizarTabela() {
    const corpoTabela = document.getElementById('tabelaDespesas'); const mensagemVazio = document.getElementById('mensagemVazio');
    const labelMesTabela = document.getElementById('labelMesTabela'); const cardDespesasMes = document.getElementById('cardDespesasMes');
    corpoTabela.innerHTML = ''; let totalDespesasDoMes = 0; let totalReceitasDoMes = 0;
    // Declarado aqui no topo para não virar variable out-of-scope no rodapé
    let totalRecFiltro = 0; let totalDespFiltro = 0;
    const mesAnoFiltro = window.chaveMes(dataFiltro); labelMesTabela.textContent = mesAnoFiltro;

    const anoMesStr = `${dataFiltro.getFullYear()}${String(dataFiltro.getMonth()+1).padStart(2,'0')}`;

    ajustarVencimentosRecorrentes(bancoDeDados, dataFiltro);

    const despesasFiltradas = bancoDeDados.filter(d => itemPertenceAoMes(d, dataFiltro.getMonth(), dataFiltro.getFullYear()));

    // Set de categorias que estouraram o teto neste mês (chip no Extrato).
    let catsEstouradas = new Set();
    try {
        const _status = asCalcularStatusOrcamentos('todos');
        if (!_status.vazio) {
            _status.itens.forEach(it => { if (it.excedeu) catsEstouradas.add(it.cat); });
        }
    } catch(e) { /* sem orçamentos configurados — segue sem alertas */ }

    if (despesasFiltradas.length === 0) {
        mensagemVazio.classList.remove('hidden'); corpoTabela.classList.add('hidden');
    } else {
        mensagemVazio.classList.add('hidden'); corpoTabela.classList.remove('hidden');
        let transacoesAgrupadas = {};
        despesasFiltradas.forEach(despesa => {
            let idGrupo = despesa.transacaoId || despesa.id;
            if (!transacoesAgrupadas[idGrupo]) {
                let isPago = false; let timestampPgto = "";
                if(despesa.isRecorrente) {
                    let statusRec = despesa.pagamentos && despesa.pagamentos[anoMesStr];
                    isPago = !!statusRec; timestampPgto = typeof statusRec === 'string' ? statusRec : '';
                } else {
                    isPago = despesa.pago; timestampPgto = despesa.dataPagamento || '';
                }
                transacoesAgrupadas[idGrupo] = {
                    id: despesa.id, transacaoId: idGrupo, dataLancamento: formatarDataComparacao(despesa.dataLancamento),
                    descricao: despesa.descricao.replace(/\s\d+\/\d+$/, ''), descricaoOriginal: despesa.descricaoOriginal, tipo: despesa.tipo,
                    natureza: despesa.natureza || 'Despesa', // <--- NOVO REGISTRO: Natureza (Receita/Despesa)
                    categoria: despesa.categoria, subcategoria: despesa.subcategoria, origem: despesa.origem, vencimento: despesa.vencimento,
                    valorTotalNoMes: 0, totalParcelas: despesa.totalParcelas, parcelaAtual: despesa.parcelaAtual, valorCompraOriginal: despesa.valorCompraOriginal,
                    isRecorrente: despesa.isRecorrente, encerradoEm: despesa.encerradoEm, observacao: despesa.observacao, pago: isPago, dataPagamento: timestampPgto,
                    anexo: despesa.anexo || null,
                    valorParcela: despesa.valor,
                    isAjuste: despesa.isAjuste,
                    ocultoExtrato: despesa.ocultoExtrato,
                    isTransferencia: despesa.isTransferencia,
                    isTerceiro: !!despesa.isTerceiro,
                    terceiroNome: despesa.terceiroNome || ''
                };
            }
            transacoesAgrupadas[idGrupo].valorTotalNoMes += valorFloat(despesa.valor);
            let isR = despesa.tipo === 'Receita' || despesa.natureza === 'Receita';
            // 🎯 Card "Despesas do Mês" conta TODAS as despesas (pendentes + efetivadas).
            // A efetivação é critério apenas das CONTAS.
            // Receitas no card só somam se o usuário ativou 'Compor Resumo do Mês'.
            // 🎯 Terceiro saída é despesa REAL (dinheiro sai do seu mundo).
            //    Próprio continua fora (é só dinheiro trocando de bolso).
            if(!isR && !despesa.isAjuste && (!despesa.isTransferencia || despesa.isTerceiro)) totalDespesasDoMes += valorFloat(despesa.valor);
            if(isR && !despesa.isAjuste && !despesa.ocultoExtrato && despesa.compoeResumo) totalReceitasDoMes += valorFloat(despesa.valor);
        }); 

        const _chaveOrdenacao = (t) => {
            const dt = (t.vencimento && t.vencimento.length === 10) ? t.vencimento : t.dataLancamento;
            if (!dt || dt.length !== 10) return 0;
            const p = dt.split('/');
            return new Date(p[2], p[1] - 1, p[0]).getTime();
        };

        let arrayTransacoes = Object.values(transacoesAgrupadas);
        arrayTransacoes.sort((a, b) => {
            // Pendentes primeiro (data ASC), efetivadas depois (data DESC).
            const aPago = a.pago ? 1 : 0;
            const bPago = b.pago ? 1 : 0;
            if (aPago !== bPago) return aPago - bPago;

            const dtA = _chaveOrdenacao(a);
            const dtB = _chaveOrdenacao(b);
            // 🎯 Filtro de ordem — inverte o eixo de datas dentro
            //    de cada grupo (pendentes / efetivadas).
            //      recentes → pendentes ASC, efetivadas DESC (padrão)
            //      antigos  → pendentes DESC, efetivadas ASC
            const inverter = (filtroChipOrdem === 'antigos');

            if (aPago === 0) {
                // Pendente — padrão crescente; invertido decrescente
                if (dtA !== dtB) return inverter ? (dtB - dtA) : (dtA - dtB);
            } else {
                // Efetivada — padrão decrescente; invertido crescente
                if (dtA !== dtB) return inverter ? (dtA - dtB) : (dtB - dtA);
            }

            // Desempate estável — mesma data + mesmo status
            return inverter ? (a.transacaoId - b.transacaoId) : (b.transacaoId - a.transacaoId);
        });

        // Filtro de busca textual
        const termoBuscaExtrato = (document.getElementById('buscaExtrato')?.value || '').toLowerCase().trim();
        if (termoBuscaExtrato) {
            arrayTransacoes = arrayTransacoes.filter(t => {
                const desc = (t.descricaoOriginal || t.descricao || '').toLowerCase();
                const cat = (t.categoria || '').toLowerCase();
                const sub = (t.subcategoria || '').toLowerCase();
                const obs = (t.observacao || '').toLowerCase();
                const valStr = String(t.valorTotalNoMes.toFixed(2));
                return desc.includes(termoBuscaExtrato)
                    || cat.includes(termoBuscaExtrato)
                    || sub.includes(termoBuscaExtrato)
                    || obs.includes(termoBuscaExtrato)
                    || valStr.includes(termoBuscaExtrato);
            });
        }

        // ═══════════════════════════════════════════════════════
        // 🎯 FILTRO RÁPIDO POR CHIP — Tipo (Entradas/Saídas)
        // ═══════════════════════════════════════════════════════
        // Entradas = transações com sinal positivo (Receita).
        // Saídas   = transações com sinal negativo (Despesa).
        if (filtroChipTipo !== 'todas') {
            arrayTransacoes = arrayTransacoes.filter(t => {
                const isR = (t.tipo === 'Receita' || t.natureza === 'Receita');
                if (filtroChipTipo === 'entradas') return isR;
                if (filtroChipTipo === 'saidas')   return !isR;
                return true;
            });
        }

        // ═══════════════════════════════════════════════════════
        // 🎯 FILTRO DE ORIGEM — Salário / Vale
        // ═══════════════════════════════════════════════════════
        // Transferências não têm origem Salário/Vale (são movimento
        // entre contas ou com terceiros) — ficam fora quando o
        // filtro está ativo. A origem é normalizada pelo mesmo
        // helper que o render usa, garantindo consistência total
        // entre o que a linha mostra e o que o filtro considera.
        if (filtroChipOrigem !== 'todas') {
            arrayTransacoes = arrayTransacoes.filter(t => {
                if (t.isTransferencia) return false;
                const origem = _obterOrigemEfetiva(t);
                if (filtroChipOrigem === 'salario') return origem === 'Salário';
                if (filtroChipOrigem === 'vale')    return origem === 'Vale';
                return true;
            });
        }

        // Totais baseados no filtro ativo (para o rodapé do Extrato)
        arrayTransacoes.forEach(t => {
            if (t.ocultoExtrato || t.isAjuste) return;
            if (t.isTransferencia && !t.isTerceiro) return;
            const isR = (t.tipo === 'Receita' || t.natureza === 'Receita');
            if (isR) totalRecFiltro += t.valorTotalNoMes;
            else totalDespFiltro += t.valorTotalNoMes;
        });

                        let diaAnterior = null;
        let jaMudouParaEfetivadas = false;
        let jaMostrouHeaderPendentes = false;
        const nomesDiasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

        // 🎯 Headers de seção — só aparecem quando os DOIS grupos
        // coexistem. Se a lista tem apenas pendentes (ou só
        // efetivadas), os cabeçalhos seriam ruído visual sem função.
        const itensVisiveis = arrayTransacoes.filter(t => !t.ocultoExtrato);
        const temPendentes = itensVisiveis.some(t => !t.pago);
        const temEfetivadas = itensVisiveis.some(t => t.pago);
        const mostrarHeadersGrupos = temPendentes && temEfetivadas;

        // 🎯 Helper: divisor de seção (linha — rótulo — linha).
        // Visualmente distinto do separador de dia (que tem fundo
        // slate-50 e é sticky). Aqui é uma faixa neutra, marcando
        // a troca de GRUPO (pendentes → efetivadas). A cor do
        // rótulo comunica o estado: âmbar = a fazer, verde = feito.
        const criarHeaderGrupo = (texto, cor) => {
            const div = document.createElement('div');
            div.className = "flex items-center gap-3 px-5 py-3";
            div.innerHTML = `
                <div class="h-px flex-1 bg-slate-200 dark:bg-[#1e2a40]"></div>
                <span class="text-[10px] font-bold uppercase tracking-wider ${cor}">${texto}</span>
                <div class="h-px flex-1 bg-slate-200 dark:bg-[#1e2a40]"></div>
            `;
            return div;
        };

        itensVisiveis.forEach(transacao => {
            // ═══════════════════════════════════════════════════════
            // 🎯 HEADERS DE SEÇÃO — Pendentes / Efetivadas
            // ═══════════════════════════════════════════════════════
            // "Pendentes" aparece antes do primeiro pendente.
            // "Efetivadas" aparece no instante em que o loop cruza do
            // grupo dos pendentes para o das efetivadas.
            // ═══════════════════════════════════════════════════════
            if (!transacao.pago && !jaMostrouHeaderPendentes && mostrarHeadersGrupos) {
                jaMostrouHeaderPendentes = true;
                corpoTabela.appendChild(criarHeaderGrupo('Pendentes', 'text-amber-600 dark:text-amber-400'));
            }
            if (transacao.pago && !jaMudouParaEfetivadas) {
                jaMudouParaEfetivadas = true;
                // 🎯 Reset do separador de dia: o primeiro efetivado
                // precisa ganhar seu próprio cabeçalho de dia, mesmo
                // que o dia bata com o último pendente (ex: ambos
                // em 02/10). Sem isso, os dois "grupos" do mesmo dia
                // ficariam visualmente fundidos.
                diaAnterior = null;
                if (mostrarHeadersGrupos) {
                    corpoTabela.appendChild(criarHeaderGrupo('Efetivadas', 'text-green-600 dark:text-green-400'));
                }
            }

            // 🎯 Separador de dia — agrupa pelo vencimento. Como a
            //    ordenação é em duas camadas (pendentes ASC, efetivadas
            //    DESC), cada grupo mostra seus dias na direção correta:
            //      • Pendentes: 02/10 → 05/10 → 10/10 (crescente)
            //      • Efetivadas: 28/09 → 25/09 → 20/09 (decrescente)
            const diaAtual = (transacao.vencimento && transacao.vencimento.length === 10)
                ? transacao.vencimento
                : transacao.dataLancamento;
            if (diaAtual !== diaAnterior && diaAtual && diaAtual.length === 10) {
                const partesData = diaAtual.split('/');
                const dtObj = new Date(partesData[2], partesData[1] - 1, partesData[0]);
                const nomeDia = nomesDiasSemana[dtObj.getDay()];

                const nomeDiaCapitalizado = nomeDia.charAt(0).toUpperCase() + nomeDia.slice(1);
                const separador = document.createElement('div');
                // 🎯 A faixa sticky NÃO tem backdrop-blur de propósito.
                // O backdrop-filter cria um "backdrop root" que promove a faixa
                // ACIMA de qualquer z-index dentro do mesmo contexto — inclusive
                // do menu kebab (Editar/Encerrar/Apagar) e de modais.
                separador.className = "flex items-center gap-2.5 px-5 py-2.5 bg-slate-50 dark:bg-[#0b1120] border-b border-slate-200/70 dark:border-[#1e2a40] sticky top-[calc(var(--header-h)+var(--safe-top))] z-[5]";
                separador.innerHTML = `
                    <span class="text-[11px] font-bold text-slate-600 dark:text-gray-300 tracking-wide">${diaAtual}</span>
                    <span class="text-slate-300 dark:text-gray-600 text-[10px]">•</span>
                    <span class="text-[11px] font-medium text-slate-400 dark:text-gray-500">${nomeDiaCapitalizado}</span>
                `;
                corpoTabela.appendChild(separador);
                diaAnterior = diaAtual;
            }

            const linha = document.createElement('div'); 
            // 🎯 `linha-extrato` + `relative` — âncora para o kebab menu
            // poder elevar esta linha acima das irmãs quando aberto.
            // Sem `relative`, o `z-index` inline aplicado pelo JS não
            // teria efeito (só funciona em elementos posicionados).
            linha.className = "linha-extrato relative flex flex-col md:grid md:grid-cols-[3rem_minmax(150px,2fr)_minmax(80px,1fr)_minmax(80px,1fr)_minmax(90px,1fr)_minmax(100px,1fr)_5.5rem] gap-3 md:items-center p-4 border-b border-slate-100 dark:border-[#1e2a40] hover:bg-slate-50 dark:hover:bg-[#1a2639] transition-colors last:border-0 anim-fade-in";
            // 🎯 `data-transacao-id` — identificador da linha para o
            //    destaque após a navegação via busca global. Sem isso,
            //    o `destacarLancamentoNoExtrato` não tem como localizar
            //    a linha específica no DOM.
            linha.dataset.transacaoId = transacao.id;
            
            let ehReceita = transacao.tipo === 'Receita' || transacao.natureza === 'Receita';
            let isTransf = !!transacao.isTransferencia;

            // 🎯 Sinaliza a linha no DOM para o CSS aplicar a barra
            //    lateral âmbar + fundo destacado. Sem isso, a linha
            //    de transferência fica visualmente idêntica a uma
            //    despesa/receita comum, e o usuário precisa ler o
            //    texto pra perceber a diferença.
            if (isTransf) linha.classList.add('transferencia-row');
            
            // Tags agora são texto discreto — cor fica reservada para semântica de valor
            let textoTag = isTransf
                ? (transacao.isTerceiro ? 'Terceiro' : 'Transferência')
                : (transacao.isAjuste ? 'Ajuste' : transacao.tipo);
            
            // ORIGEM — calculada pelo helper compartilhado com o
            // filtro de chips. Transferências mantêm seus rótulos
            // específicos ("Transferência", "Enviado", "Recebido").
            let txtOrigem;
            if (isTransf) {
                txtOrigem = transacao.isTerceiro
                    ? (transacao.direcao === 'saida' ? 'Enviado' : 'Recebido')
                    : 'Transferência';
            } else {
                txtOrigem = _obterOrigemEfetiva(transacao);
            }

            // Origem exibida como texto discreto — sem cor de fundo.
            // A diferenciação visual entre Vale/Salário/Extra é feita pelo contexto da linha.
            // (a variável corOrigem foi removida; a renderização não a usa mais)
            
            let obsTexto = transacao.observacao ? transacao.observacao.replace(/'/g, "\\'") : '';
            let obsIcon = transacao.observacao ? `<button type="button" onclick="mostrarObservacao('${obsTexto}')" class="text-slate-400 hover:text-[#4D6BFE] transition-colors p-1 shrink-0 active:scale-90"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></button>` : '';
            let anexoIcon = transacao.anexo ? `<button type="button" onclick="visualizarAnexo(${transacao.id})" title="Visualizar Anexo" class="text-slate-400 hover:text-[#4D6BFE] transition-colors p-1 shrink-0 active:scale-90"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></button>` : '';
            let infoIcons = (obsIcon || anexoIcon) ? `<div class="flex items-center ml-1">${obsIcon}${anexoIcon}</div>` : '';
            
            let descDisplay = `<span class="flex-wrap">${transacao.descricaoOriginal || transacao.descricao}</span>${infoIcons}`;
            if (transacao.totalParcelas > 1 && !transacao.isRecorrente) descDisplay += ` <span class="text-[11px] text-slate-400 font-semibold ml-1 shrink-0">(${transacao.parcelaAtual}/${transacao.totalParcelas})</span>`;
            
            const catObj = categoriasGlobais.find(c => c.nome === transacao.categoria); const iconeSvgStr = catObj ? catObj.icon : 'tag';
            const subVal = transacao.subcategoria ? `<span class="opacity-40 mx-1.5 font-normal">›</span><span class="opacity-75 text-[9.5px] uppercase font-bold tracking-wider">${transacao.subcategoria}</span>` : '';

            // 🎯 Chip de orçamento estourado — desktop. Aparece só
            //    quando a categoria do lançamento está no Set de
            //    categorias que passaram do teto. É um selo pequeno
            //    com fundo vermelho translúcido, que NÃO rouba a
            //    atenção da descrição — só informa.
            //    O `title` traz o detalhe do estouro ao passar o
            //    mouse, sem precisar abrir a Assistente.
            const chipOrcamento = catsEstouradas.has(transacao.categoria)
                ? `<span title="Orçamento estourado em ${transacao.categoria}" class="inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold uppercase tracking-wider shrink-0"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Orçamento</span>`
                : '';

            const catDisplay = `<div class="opacity-80 flex-shrink-0 flex items-center justify-center mr-1.5">${getSVGIcon(iconeSvgStr, 'w-3.5 h-3.5')}</div><div class="text-xs truncate flex-1 min-w-0 pt-[1px] flex items-center">${transacao.categoria || 'Outros'}${subVal}${chipOrcamento}</div>`;
            
            // Versão mobile: sem truncate, sem uppercase, com quebra de linha
            const subValMobile = transacao.subcategoria ? `<span class="opacity-50 px-2.5 shrink-0">›</span><span class="opacity-80 font-semibold">${transacao.subcategoria}</span>` : '';

            // 🎯 Chip de orçamento estourado — mobile. Versão mais
            //    compacta: só o ícone de alerta, sem a palavra
            //    "Orçamento". Em telas pequenas, o espaço horizontal
            //    é precioso; o tooltip via `title` já complementa
            //    a informação em toque longo / hover do mouse.
            const chipOrcamentoMobile = catsEstouradas.has(transacao.categoria)
                ? `<span title="Orçamento estourado em ${transacao.categoria}" class="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shrink-0"><svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></span>`
                : '';

            const catDisplayMobile = `<div class="opacity-70 flex-shrink-0 self-center">${getSVGIcon(iconeSvgStr, 'w-4 h-4')}</div><div class="text-[11.5px] flex-1 min-w-0 leading-snug break-words flex items-center flex-wrap">${transacao.categoria || 'Outros'}${subValMobile}${chipOrcamentoMobile}</div>`;
            
            let htmlValor;
            if (isTransf) {
                htmlValor = `<div class="font-bold tracking-tight valor-sensivel text-slate-600 dark:text-gray-300">${formatMoeda(transacao.valorTotalNoMes)}</div>`;
                htmlValor += `<div class="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 font-normal leading-tight">Transferência</div>`;
            } else {
                htmlValor = `<div class="font-bold tracking-tight valor-sensivel ${ehReceita ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400'}">${ehReceita ? '+' : '-'} ${formatMoeda(transacao.valorTotalNoMes)}</div>`;
            }
            if (!isTransf && transacao.totalParcelas > 1 && !transacao.isRecorrente) {
                let valorTotalDaCompra = parseFloat(transacao.valorCompraOriginal);
                let valorDaParcela = parseFloat(transacao.valorParcela);
                let indicativoEditado = Math.abs(valorTotalDaCompra / transacao.totalParcelas - valorDaParcela) > 0.01 ? '<span class="text-amber-500 ml-0.5" title="Valor alterado neste mês">*</span>' : '';
                
                htmlValor += `<div class="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5 font-normal leading-tight valor-sensivel">${transacao.totalParcelas}x de ${formatMoeda(valorDaParcela)}${indicativoEditado}</div>`;
                htmlValor += `<div class="text-[10px] text-slate-400/80 dark:text-gray-500 mt-0.5 font-normal leading-tight valor-sensivel" title="Valor total da compra">Total: ${formatMoeda(valorTotalDaCompra)}</div>`;
            }

            // 🎯 Só Ajustes Manuais são imutáveis. Qualquer outro lançamento pode alternar pago/pendente.
            let isImutavel = transacao.subcategoria === 'Ajuste Manual' || transacao.isAjuste;
            let iconeCheck = `<svg class="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>`;
            let iconeClock = `<svg class="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
            
            let statusTooltip = isImutavel ? 'Lançamento gerado por reajuste de saldo. Não pode ser alterado.' : (transacao.pago ? (transacao.dataPagamento ? `Pago em ${transacao.dataPagamento}. Clique p/ reabrir.` : `Efetuado. Clique p/ reabrir.`) : `Pendente. Clique para marcar como efetuado.`);
            let statusBtnClass = transacao.pago ? `text-green-500 ${!isImutavel ? 'hover:text-green-600 dark:text-green-400' : ''}` : `text-amber-500 hover:text-green-500 dark:text-amber-500 dark:hover:text-green-400`;
            let cursorClass = isImutavel ? 'cursor-not-allowed opacity-80' : 'cursor-pointer';
            let disabledAttr = isImutavel ? 'disabled' : '';
            
            let statusIcon;
            if (isTransf) {
                // 🎯 Transferência agora tem status CLICÁVEL, igual às
                //    despesas/receitas. Clicar alterna o par (saída +
                //    entrada) via `togglePago` — que trata transferências
                //    atomicamente. O título muda conforme o estado para
                //    dar feedback claro do que o clique faz.
                const statusTransfTooltip = transacao.pago
                    ? 'Transferência efetivada. Clique para marcar como pendente.'
                    : 'Transferência pendente (não afeta saldos). Clique para efetivar.';
                const classeTransf = transacao.pago
                    ? 'text-green-500 hover:text-green-600 dark:text-green-400'
                    : 'text-amber-500 hover:text-green-500 dark:text-amber-500 dark:hover:text-green-400';
                statusIcon = `<button type="button" onclick="togglePago(${transacao.id}, '${anoMesStr}')" title="${statusTransfTooltip}" class="check-anim transition-colors p-1 sm:p-1 cursor-pointer ${classeTransf}">${transacao.pago ? iconeCheck : iconeClock}</button>`;
            } else {
                statusIcon = `<button type="button" onclick="togglePago(${transacao.id}, '${anoMesStr}')" title="${statusTooltip}" class="check-anim transition-colors p-1 ${statusBtnClass} ${cursorClass}" ${disabledAttr}>${transacao.pago ? iconeCheck : iconeClock}</button>`;
            }

            // --- INÍCIO: LÓGICA DE CONTA ATRASADA ---
            let htmlVencimentoDesktop = `<div class="text-slate-600 dark:text-gray-400 font-medium text-sm whitespace-nowrap text-center">${transacao.vencimento}</div>`;
            let htmlVencimentoMobile = `<div class="flex items-center gap-1.5"><span class="w-[60px] inline-block font-semibold">Venc:</span> ${transacao.vencimento}</div>`;
            
            if (!transacao.pago && transacao.vencimento && transacao.vencimento !== '--/--/----') {
                let pV = transacao.vencimento.split('/');
                if (pV.length === 3) {
                    let dtVenc = new Date(pV[2], pV[1] - 1, pV[0]);
                    let dtHoje = new Date(); dtHoje.setHours(0,0,0,0);
                    
                    if (dtVenc < dtHoje) {
                        let iconeAtraso = `<svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
                        htmlVencimentoDesktop = `<div class="text-red-600 dark:text-red-500 font-bold text-sm whitespace-nowrap flex items-center justify-center gap-1.5" title="Atrasado!">${iconeAtraso} ${transacao.vencimento}</div>`;
                        htmlVencimentoMobile = `<div class="flex items-center gap-1.5 text-red-600 dark:text-red-500 font-bold" title="Atrasado!"><span class="w-[60px] inline-block font-semibold text-slate-400">Venc:</span> ${iconeAtraso} ${transacao.vencimento}</div>`;
                    }
                }
            }
            // --- FIM: LÓGICA DE CONTA ATRASADA ---

            let btnAcaoEspecial = "";
            if (isTransf) {
                btnAcaoEspecial += `<button type="button" onclick="abrirModalTransferencia(${transacao.id})" class="text-slate-400 hover:text-[#4D6BFE] transition-colors p-2 md:p-1.5" title="Editar transferência"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-4 md:w-4 block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>`;
            } else {
                btnAcaoEspecial += `<button type="button" onclick="abrirModalEdicao(${transacao.id})" class="text-slate-400 hover:text-[#4D6BFE] transition-colors p-2 md:p-1.5" title="Editar"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-4 md:w-4 block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>`;
                if (transacao.isRecorrente && !transacao.encerradoEm) { btnAcaoEspecial += `<button type="button" onclick="encerrarRecorrencia(${transacao.transacaoId})" class="text-orange-500 hover:text-orange-700 dark:text-slate-400 dark:hover:text-orange-400 transition-colors p-2 md:p-1.5" title="Encerrar Recorrência"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-4 md:w-4 block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>`; }
            }
            btnAcaoEspecial += `<button type="button" onclick="abrirModalApagar(${transacao.id})" class="text-red-500 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-400 transition-colors p-2 md:p-1.5" title="Apagar"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 md:h-4 md:w-4 block" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;

            // ====== KEBAB MENU (mobile) ======
            const menuKebabId = `menuAcoesExtrato_${transacao.id}`;
            let kebabItens = '';
            if (isTransf) {
                kebabItens += `<button type="button" onclick="fecharMenusExtrato(); abrirModalTransferencia(${transacao.id})" class="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#4D6BFE]/10 hover:text-[#4D6BFE] flex items-center gap-3 transition-colors">
                    <svg class="w-4 h-4 text-[#4D6BFE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Editar
                </button>`;
            } else {
                kebabItens += `<button type="button" onclick="fecharMenusExtrato(); abrirModalEdicao(${transacao.id})" class="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#4D6BFE]/10 hover:text-[#4D6BFE] flex items-center gap-3 transition-colors">
                    <svg class="w-4 h-4 text-[#4D6BFE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    Editar
                </button>`;
                if (transacao.isRecorrente && !transacao.encerradoEm) {
                    kebabItens += `<button type="button" onclick="fecharMenusExtrato(); encerrarRecorrencia(${transacao.transacaoId})" class="w-full text-left px-4 py-2.5 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-[#1e2a40]">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        Encerrar Recorrência
                    </button>`;
                }
            }
            kebabItens += `<button type="button" onclick="fecharMenusExtrato(); abrirModalApagar(${transacao.id})" class="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors border-t border-slate-100 dark:border-[#1e2a40]">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Apagar
            </button>`;

            const kebabMenuMobile = `
                <div class="relative inline-block">
                    <button type="button" onclick="toggleMenuAcoesExtrato(event, '${menuKebabId}')" class="text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors p-1.5 -mr-1 active:scale-90 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                    </button>
                    <div id="${menuKebabId}" class="menu-acoes-extrato hidden absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#121b2b] border border-slate-200 dark:border-[#1e2a40] rounded-xl shadow-2xl overflow-hidden z-[9999]">
                        ${kebabItens}
                    </div>
                </div>
            `;
            // ====== FIM KEBAB MENU ======

            linha.innerHTML = `
                <div class="hidden md:contents">
                    <div class="text-center flex justify-center">${statusIcon}</div>
                    <div class="min-w-0">
                        <div class="font-semibold text-slate-800 dark:text-gray-200 flex items-center flex-wrap break-words">${descDisplay}</div>
                        <div class="text-slate-500 dark:text-gray-400 mt-1 flex items-center font-medium w-full">${catDisplay}</div>
                    </div>
                    <div class="text-center">${isTransf ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider"><svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>Transf.</span>` : `<span class="block text-[11px] font-medium text-slate-500 dark:text-gray-400 tracking-wide">${textoTag}</span>`}</div>
                    <div class="text-center"><span class="block text-[11px] font-medium text-slate-500 dark:text-gray-400 tracking-wide">${txtOrigem}</span></div>
                    ${htmlVencimentoDesktop}
                    <div class="text-right flex flex-col items-end justify-center">${htmlValor}</div>
                    <div class="flex justify-center items-center gap-1">${btnAcaoEspecial}</div>
                </div>

                <div class="flex flex-col md:hidden w-full gap-2">
                    <div class="flex justify-between items-start w-full gap-3">
                        <div class="flex flex-col items-center justify-start gap-2 pt-0.5 shrink-0 w-8">
                            ${statusIcon}
                        </div>
                        <div class="flex flex-col flex-1 min-w-0">
                        <div class="font-semibold text-slate-800 dark:text-gray-200 text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                            ${isTransf ? '<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">Transf.</span>' : ''}
                            ${descDisplay}
                        </div>
                            <div class="text-slate-500 dark:text-gray-400 mt-1.5 flex items-center gap-4 font-medium w-full">
                                ${catDisplayMobile}
                            </div>
                        </div>
                        <div class="flex flex-col items-end shrink-0">
                            <div class="-mt-1 -mr-1">${kebabMenuMobile}</div>
                        </div>
                    </div>
                    <div class="flex items-end justify-between gap-3 pl-11">
                        <div class="text-[11px] text-slate-400 font-medium space-y-0.5 min-w-0">
                            ${htmlVencimentoMobile}
                        </div>
                        <div class="flex flex-col items-end shrink-0 min-w-[70px]">
                            ${htmlValor}
                        </div>
                    </div>
                </div>
            `;
            corpoTabela.appendChild(linha);
        });
    }
    cardDespesasMes.textContent = formatMoeda(totalDespesasDoMes);
    // 🎯 Espelha o valor no hero compacto (regime sem vale/PJ).
    //    Mesmo dado, lugar diferente — quando o grid está oculto,
    //    é aqui que o usuário vê o total de despesas do mês.
    const heroDespEl = document.getElementById('heroDespesasMes');
    if (heroDespEl) heroDespEl.textContent = formatMoeda(totalDespesasDoMes);
    cardDespesasMes.className = 'text-2xl font-bold font-montserrat tracking-tight text-[#E11D48] valor-sensivel mb-3';
    if (totalDespesasDoMes > 0.005) cardDespesasMes.style.color = '#E11D48';
    else cardDespesasMes.style.color = '';
    
    // Totalizador do rodapé do Extrato — reflete o filtro ativo
    const elRodRec = document.getElementById('rodapeExtratoRec');
    const elRodDesp = document.getElementById('rodapeExtratoDesp');
    const elRodSaldo = document.getElementById('rodapeExtratoSaldo');
    if (elRodRec) elRodRec.textContent = formatMoeda(totalRecFiltro);
    if (elRodDesp) elRodDesp.textContent = formatMoeda(totalDespFiltro);
    if (elRodSaldo) {
        const saldoMes = totalRecFiltro - totalDespFiltro;
        elRodSaldo.textContent = formatMoeda(saldoMes);
        elRodSaldo.className = 'text-slate-900 dark:text-gray-200 font-bold valor-sensivel';
        if (saldoMes < -0.005) elRodSaldo.classList.add('text-red-600', 'dark:text-red-400');
        else if (saldoMes > 0.005) elRodSaldo.classList.add('text-green-600', 'dark:text-green-500');
    }
    
    atualizarCardsSaldo(despesasFiltradas, mesAnoFiltro, totalDespesasDoMes);
    if(typeof renderizarCarrosselContas === 'function') renderizarCarrosselContas();
    if(typeof window.renderTabelaContasTela === 'function') window.renderTabelaContasTela();

    // 🎯 Repinta o painel de Orçamento do Resumo. Fica dentro de
    //    `atualizarTabela` porque esse é o ponto único de atualização
    //    quando o mês muda, quando um lançamento é criado/editado/
    //    apagado e quando os orçamentos são editados no modal
    //    (que chama `atualizarTabela` indiretamente via sync).
    //    Precisamos disso porque o card mostra dados mês-dependentes.
    if (typeof atualizarCardOrcamentoResumo === 'function') atualizarCardOrcamentoResumo();

    // 🔔 Mantém o sino flutuante sincronizado com o estado atual.
    //    Quando a última conta pendente é paga/apagada, o ícone
    //    desaparece sozinho no próximo repaint.
    if (typeof window.atualizarIconeAlertaVencimento === 'function') {
        window.atualizarIconeAlertaVencimento();
    }
}
        // 🗑️ `calcularSaldoTotalMesHistorico()` + `obterSaldoAcumuladoAnterior()`
//    removidas — só se chamavam entre si, e o recurso de "saldo
//    acumulado entre meses" foi desligado por decisão de produto
//    (cada mês é independente).

// Modo PJ: Hero = Líquido, Faturamento = Bruto + Bônus, Barra = Custos.
function atualizarCardsSaldoPJ(totalDespesasDoMes) {
    const chave = window.chaveMes(dataFiltro);
    const cfgPJ = configHoleriteGlobal[chave] || {};
    const mesSimulacaoBate = simulacaoAtualGlobal &&
        simulacaoAtualGlobal.ano === dataFiltro.getFullYear() &&
        simulacaoAtualGlobal.mes === dataFiltro.getMonth();
    const fonte = (mesSimulacaoBate && simulacaoAtualGlobal) ? simulacaoAtualGlobal : cfgPJ;

    const brutoPJ = parseFloat(fonte.bruto || 0);
    const bonusPJ = parseFloat(fonte.bonusVal || 0);
    const custosPJ = parseFloat(fonte.despesasPJ || 0);
    const faturamentoBruto = brutoPJ + bonusPJ;
    const lucroLiquido = faturamentoBruto - custosPJ;

    // Override manual (mesmo schema do Salário CLT)
    const overridePJ = saldoBaseMensalGlobal[chave]?.overrideSalario;
    const temOverridePJ = (overridePJ !== undefined && overridePJ !== null);
    let lucroFinal = lucroLiquido;
    if (temOverridePJ && typeof overridePJ === 'object' && overridePJ.valor !== undefined) {
        lucroFinal = parseFloat(overridePJ.valor);
    } else if (temOverridePJ) {
        lucroFinal = parseFloat(overridePJ);
    }

    // Estatísticas globais usadas pelo modal de explicação
    window.saldoGeralAtualCalculado = lucroFinal;
    window.saldoSalarioAtualCalculado = faturamentoBruto;
    window.saldoValeAtualCalculado = 0;

    // Hero — Total do Mês
    const elTotal = document.getElementById('cardSaldoGeral');
    if (elTotal) {
        elTotal.textContent = formatMoeda(lucroFinal);
        elTotal.className = 'text-4xl font-bold font-montserrat tracking-tight valor-sensivel leading-none';
        if (lucroFinal < -0.005) elTotal.style.color = '#E11D48';
        else if (lucroFinal > 0.005) elTotal.style.color = '#059669';
        else elTotal.style.color = '';
    }

    // Card "Faturamento" (slot do antigo "Salário")
    const elFat = document.getElementById('cardSaldoSalario');
    if (elFat) {
        elFat.textContent = formatMoeda(faturamentoBruto);
        elFat.className = 'text-2xl font-bold font-montserrat tracking-tight valor-sensivel mb-3';
        if (faturamentoBruto > 0.005) elFat.style.color = '#059669';
        else elFat.style.color = '';
    }

    // Matemática exposta ao modal de explicação (mesmo formato
    // do CLT para o `mostrarExplicacao('geral')` continuar
    // funcionando sem alteração).
    window.mathReal = {
        desp: totalDespesasDoMes,
        vale: { base: 0, rec: 0, ajuste: 0, desp: 0, total: 0 },
        sal: {
            base: faturamentoBruto,
            rec: 0,
            ajuste: 0,
            desp: custosPJ,
            total: lucroFinal,
            override: temOverridePJ ? { valor: lucroFinal, data: '' } : null
        },
        geral: {
            base: faturamentoBruto,
            rec: 0,
            ajuste: 0,
            desp: custosPJ,
            acumuladoAnterior: 0,
            total: lucroFinal
        }
    };

    // Barra de consumo: quanto do faturamento já virou custo.
    const barraSal = document.getElementById('barraConsumoSalario');
    if (barraSal) {
        const disponivel = faturamentoBruto;
        // 🎯 SEM `transition-all duration-500`.
        //
        // A barra é animada exclusivamente pela Web Animations API
        // (`element.animate`), que já cobre TODAS as mudanças de
        // largura — recolher ao ocultar e crescer ao reexibir.
        //
        // Quando a classe trazia `transition-all`, a CSS transition
        // disparava em paralelo à WAAPI em mobile. No iOS Safari,
        // os dois motores competiam e o resultado era a barra
        // repetir a subida em velocidade 6× (500ms da CSS vs 3000ms
        // da WAAPI). Era esse o "sobe, repete mais rápido" reportado.
        let classe = 'h-full bg-gradient-to-r from-[#059669] to-[#047857] rounded-full';
        let pct = 0;
        if (disponivel > 0) {
            pct = Math.min(100, (custosPJ / disponivel) * 100);
            if (pct >= 90) classe = 'h-full bg-gradient-to-r from-[#E11D48] to-[#BE123C] rounded-full';
            else if (pct >= 70) classe = 'h-full bg-gradient-to-r from-[#D97706] to-[#B45309] rounded-full';
        }
        _largurasBarrasCache['barraConsumoSalario'] = { pct, classe };
        barraSal.className = classe;
        if (!saldosOcultos) barraSal.style.width = pct + '%';

        const wrapperBar = barraSal.closest('.group\\/barSal') || barraSal.parentElement?.parentElement;
        if (wrapperBar) {
            if (disponivel > 0 && custosPJ > 0) wrapperBar.classList.remove('hidden');
            else wrapperBar.classList.add('hidden');
        }
    }
}

function atualizarCardsSaldo(despesasFiltradas, mesAnoFiltro, totalDespesasDoMes) {
    // 🎯 PJ/Autônomo tem modelo próprio — vai por caminho separado.
    if (meuPerfil.regime === 'PJ') {
        atualizarCardsSaldoPJ(totalDespesasDoMes);
        return;
    }
    let baseVale = 0; 
    let baseSalario = 0; 
    
    // Base = Líquido do Simulador do mês (usa simulação viva se for o mês visualizado).
    let chave = window.chaveMes(dataFiltro);

    // Só conta como simulação "viva" se houver config ou base mensal salva.
    const mesTemSimulacaoSalva = !!(configHoleriteGlobal[chave] || saldoBaseMensalGlobal[chave]);
    const mesSimulacaoBate = mesTemSimulacaoSalva && simulacaoAtualGlobal &&
        simulacaoAtualGlobal.ano === dataFiltro.getFullYear() &&
        simulacaoAtualGlobal.mes === dataFiltro.getMonth();

    // 🎯 O 13º Salário (líquido) sai do bucket "Salário" e vai para o "Vale".
    // Motivo: em nov/dez o 13º cai junto com o adiantamento (dia 20),
    // então conceitualmente pertence ao caixa do Vale, não do salário.
    // `valor13` já é o líquido (proventos − INSS − IRRF), então a
    // subtração de `salarioLiquido` não deixa resíduo tributário.
    // Nov: 13º cai no bucket Vale. Dez: cai no bucket Salário.
    const ehDez = dataFiltro.getMonth() === 11;
    const valor13VaiParaSalario = ehDez;

    let salarioLiquidoBase = 0;
    let valeAdiantamentoBase = 0;
    let valor13Base = 0;

    if (mesSimulacaoBate && simulacaoAtualGlobal.salarioLiquido !== undefined) {
        salarioLiquidoBase = parseFloat(simulacaoAtualGlobal.salarioLiquido || 0);
        valeAdiantamentoBase = parseFloat(simulacaoAtualGlobal.valeAdiantamento ?? simulacaoAtualGlobal.valeDescontado ?? 0);
        valor13Base = parseFloat(simulacaoAtualGlobal.valor13 || 0);
    } else if (configHoleriteGlobal[chave]) {
        salarioLiquidoBase = parseFloat(configHoleriteGlobal[chave].salarioLiquido || 0);
        valeAdiantamentoBase = parseFloat(configHoleriteGlobal[chave].valeAdiantamento || 0);
        valor13Base = parseFloat(configHoleriteGlobal[chave].valor13 || 0);
    } else if (saldoBaseMensalGlobal[chave]) {
        salarioLiquidoBase = parseFloat(saldoBaseMensalGlobal[chave].salario || 0);
        valeAdiantamentoBase = parseFloat(saldoBaseMensalGlobal[chave].vale || 0);
        valor13Base = parseFloat(saldoBaseMensalGlobal[chave].valor13 || 0);
    }

    // Sem vale: zera o bucket do Vale (evita "vale fantasma" no Total).
    const semVale = (meuPerfil.temVale === 'Não');
    if (semVale) {
        valeAdiantamentoBase = 0;
        valor13Base = 0;
    }

    // 🎯 Cálculo original — sem ramificação por perfil. O valor
    //    base de cada bucket vem do que foi SALVO no config do
    //    Simulador, independente do perfil atual. Trocar "Recebe
    //    Vale" não altera cálculo — é decisão de apresentação.
    if (valor13VaiParaSalario) {
        // Dezembro: 13º fica no Salário.
        baseSalario = salarioLiquidoBase;
        baseVale = valeAdiantamentoBase;
    } else {
        // Novembro e demais: 13º vai para o Vale.
        baseSalario = salarioLiquidoBase - valor13Base;
        baseVale = valeAdiantamentoBase + valor13Base;
    }
    
    // 🎯 Ajustes silenciosos COMPÕEM os cards (é para isso que servem),
    // mas NÃO aparecem no Extrato/Relatório (isso é filtrado lá, não aqui).
    // O `alvoComposicao` distribui cada ajuste para o card certo
    // (Vale / Salário / Extra), inclusive os silenciosos.
    //
    // Cards usam pendentes (projeção). Transferência própria fica fora; terceiro entra.
    const visiveis = despesasFiltradas.filter(d => {
        if (!d.isTransferencia) return true;
        return !!d.isTerceiro;
    });
    const isRec = d => (d.tipo === 'Receita' || d.natureza === 'Receita');

    // 🎯 REGRA: os cards do Resumo representam a FOTOGRAFIA do mês.
    // Despesas pendentes SÃO incluídas (elas vão sair). Receitas pendentes só entram
    // se o usuário ativou 'Compor Resumo do Mês'. A efetivação é critério apenas das CONTAS.

    // AJUSTES: respeitam SEMPRE o alvo escolhido (Salário, Vale, ou Extra para Geral/Conta).
    // DESPESAS: compõem pela origem (Vale/Salário/Extra), pendentes ou efetivadas.
    // RECEITAS: só compõem se o usuário ativou o toggle 'Compor Resumo do Mês'.
    // 🎯 Volta ao comportamento original: cada lançamento cai no
    // bucket que lhe foi atribuído (via chip de Origem ou pela
    // data de vencimento). Trocar "Recebe Vale" no perfil NÃO
    // altera onde um lançamento cai — só a APRESENTAÇÃO muda.
    const alvoComposicao = d => {
        // 🎯 Em modo sem-vale, qualquer alvo "Vale" é redirecionado
        //    para "Salário". Sem isso, um lançamento com `origem:
        //    'Vale'` (criado quando o usuário tinha vale) ficaria
        //    órfão do bucket dele — cairia num Vale invisível e
        //    inflaria o Total sem aparecer em lugar nenhum.
        //    Mesmo redirect que o Extrato já faz.
        const redir = (alvo) => (semVale && alvo === 'Vale') ? 'Salário' : alvo;
        if (d.isAjuste) {
            if (d.alvoAjuste === 'Vale') return redir('Vale');
            if (d.alvoAjuste === 'Salário') return 'Salário';
            // 🎯 Ajustes de CONTA específica (alvoAjuste começa com
            //    'Conta|') NÃO compõem nenhum bucket projetado.
            //
            //    Eles nascem quando o usuário ajusta o saldo pelo
            //    lápis do card da conta (Itaú, Cofrinho, etc.). A
            //    intenção é só corrigir o saldo REAL daquela conta
            //    — nada a ver com projeção de Salário/Vale/Total.
            //
            //    Antes, esse tipo caía no `return 'Salário'` abaixo,
            //    fazendo o Saldo do Salário subir toda vez que uma
            //    conta era ajustada. Bug clássico de "comportamento
            //    vazando entre camadas".
            //
            //    O carrossel e a aba Contas continuam lendo esses
            //    ajustes normalmente (eles checam `d.pago` direto,
            //    sem passar pelo alvoComposicao).
            if (typeof d.alvoAjuste === 'string' && d.alvoAjuste.startsWith('Conta|')) return 'Nenhum';
            // Fallback restante: ajustes "Geral" e formatos legados
            // sem alvoAjuste — historicamente vão pro Salário.
            return 'Salário';
        }
        if (isRec(d) && !d.compoeResumo) return 'Nenhum';
        if (d.origem === 'Vale') return redir('Vale');
        if (d.origem === 'Salário') return 'Salário';
        const dataRef = d.vencimento || d.vencimentoOriginal || d.dataLancamento;
        return redir(determinarOrigem(dataRef, d.natureza || d.tipo || 'Despesa', null));
    };

    // === SALÁRIO ===
    // 🎯 Ajustes silenciosos são AGRUPADOS à parte (`ajusteX`) — eles movem
    // o saldo final, mas NÃO contaminam `receitaX`/`gastoX`, que alimentam
    // a barra de consumo e o modal de explicação. Consequência: um ajuste
    // silencioso de +R$100 muda o card de R$500→R$600, mas a barra de
    // consumo continua medindo o gasto contra a renda REAL declarada.
    const receitaSalarioItens = visiveis.filter(d => isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Salário');
    const receitaSalario = receitaSalarioItens.reduce((s, d) => s + valorFloat(d.valor), 0);
    const gastoSalario = visiveis.filter(d => !isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Salário').reduce((s, d) => s + valorFloat(d.valor), 0);
    const ajusteSalario = visiveis.filter(d => d.isAjuste && alvoComposicao(d) === 'Salário')
        .reduce((s, d) => s + (isRec(d) ? valorFloat(d.valor) : -valorFloat(d.valor)), 0);

    // === VALE ===
    const gastoVale = visiveis.filter(d => !isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Vale').reduce((s, d) => s + valorFloat(d.valor), 0);
    const receitaVale = visiveis.filter(d => isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Vale').reduce((s, d) => s + valorFloat(d.valor), 0);
    const ajusteVale = visiveis.filter(d => d.isAjuste && alvoComposicao(d) === 'Vale')
        .reduce((s, d) => s + (isRec(d) ? valorFloat(d.valor) : -valorFloat(d.valor)), 0);
    
    // === EXTRA ===
    const rendaExtra = visiveis.filter(d => isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Extra').reduce((s, d) => s + valorFloat(d.valor), 0);
    const gastoExtra = visiveis.filter(d => !isRec(d) && !d.isAjuste && alvoComposicao(d) === 'Extra').reduce((s, d) => s + valorFloat(d.valor), 0);
    const ajusteExtra = visiveis.filter(d => d.isAjuste && alvoComposicao(d) === 'Extra')
        .reduce((s, d) => s + (isRec(d) ? valorFloat(d.valor) : -valorFloat(d.valor)), 0);
    
    // 🎯 Override de Salário desativado. O card sempre mostra o cálculo automático.
    // Override: se o usuário fixou manualmente o saldo do Salário, respeita.
    const overrideSalvo = saldoBaseMensalGlobal[chave]?.overrideSalario;
    let saldoSalario = baseSalario + receitaSalario - gastoSalario + ajusteSalario;
    let overrideDetalhes = null;
    if (overrideSalvo) {
        if (typeof overrideSalvo === 'object' && overrideSalvo.valor !== undefined) {
            saldoSalario = parseFloat(overrideSalvo.valor);
            overrideDetalhes = overrideSalvo;
        } else {
            // Formato legado: valor numérico direto, sem metadados.
            saldoSalario = parseFloat(overrideSalvo);
            overrideDetalhes = { valor: saldoSalario, data: null, _legado: true };
        }
    }

    const saldoVale = baseVale + receitaVale - gastoVale + ajusteVale;
    // 🎯 O Saldo Total é SEMPRE a soma dos dois buckets — em
    //    todos os perfis. Se o usuário não recebe vale, o bucket
    //    do Vale naturalmente fica zerado (não há lançamentos
    //    com origem Vale nem config de holerite com vale), então
    //    a soma é a mesma coisa. Sem ramificação por perfil.
    const saldoGeralDesteMes = saldoVale + saldoSalario;

    // Acúmulo entre meses removido por decisão de produto — cada mês é independente
    const acumuladoAnterior = 0;
    const saldoGeral = saldoGeralDesteMes;
    
    window.saldoGeralAtualCalculado = saldoGeral; 
    window.saldoValeAtualCalculado = saldoVale;
    window.saldoSalarioAtualCalculado = saldoSalario;

    // Salva a matemática do Real
    window.mathReal = {
        desp: totalDespesasDoMes,
        vale: { base: baseVale, rec: receitaVale, ajuste: ajusteVale, desp: gastoVale, total: saldoVale },
        // 🎯 O Salário agrega também rendaExtra/gastoExtra/ajusteExtra — por isso
        // `rec`, `desp` e `ajuste` somam os pares (Salário + Extra). Sem isso, o
        // modal mostraria números que não compõem o card.
        sal: {
            base: baseSalario,
            rec: receitaSalario,
            ajuste: ajusteSalario,
            desp: gastoSalario,
            total: saldoSalario,
            override: overrideDetalhes
        },
        geral: {
            base: baseVale + baseSalario,
            rec: receitaVale + receitaSalario + rendaExtra,
            ajuste: ajusteVale + ajusteSalario + ajusteExtra,
            desp: gastoVale + gastoSalario + gastoExtra,
            acumuladoAnterior: acumuladoAnterior,
            total: saldoGeral
        }
    };
    
    // Controle visual dos 3 cards de valor (hero + 2 secundários)
    const elVale = document.getElementById('cardSaldoVale');
    if(elVale) {
        elVale.textContent = formatMoeda(saldoVale);
        elVale.className = 'text-2xl font-bold font-montserrat tracking-tight valor-sensivel mb-3';
        if (saldoVale < -0.005) elVale.style.color = '#E11D48';
        else if (saldoVale > 0.005) elVale.style.color = '#059669';
        else elVale.style.color = ''; // deixa o CSS decidir (dark:text-gray-100)
    }

    const elSalario = document.getElementById('cardSaldoSalario');
    if(elSalario) {
        elSalario.textContent = formatMoeda(saldoSalario);
        elSalario.className = 'text-2xl font-bold font-montserrat tracking-tight valor-sensivel mb-3';
        if (saldoSalario < -0.005) elSalario.style.color = '#E11D48';
        else if (saldoSalario > 0.005) elSalario.style.color = '#059669';
        else elSalario.style.color = '';
    }

    const elGeral = document.getElementById('cardSaldoGeral');
    if(elGeral) {
        elGeral.textContent = formatMoeda(saldoGeral);
        elGeral.className = 'text-4xl font-bold font-montserrat tracking-tight valor-sensivel leading-none';
        if (saldoGeral < -0.005) elGeral.style.color = '#E11D48';
        else if (saldoGeral > 0.005) elGeral.style.color = '#059669';
        else elGeral.style.color = '';
    }

                // ===== BARRA DE CONSUMO: Salário e Vale =====
                const atualizarBarraConsumo = (idBarra, gasto, disponivel) => {
        const barra = document.getElementById(idBarra);
        if (!barra) return;
        const pctEl = document.getElementById(idBarra === 'barraConsumoSalario' ? 'pctConsumoSalario' : 'pctConsumoVale');

        // 🎯 Aplicação DIRETA do gradiente via style inline.
        // Sem Tailwind, sem CDN, sem timing. O gradiente está
        // no próprio elemento — sempre funciona.
        if (disponivel <= 0) {
            _largurasBarrasCache[idBarra] = {
                pct: 0,
                classe: 'h-full rounded-full',
                bgImage: ''
            };
            barra.className = 'h-full rounded-full';
            barra.style.backgroundColor = 'rgb(203 213 225)'; // slate-300
            barra.style.backgroundImage = '';
            if (!saldosOcultos) barra.style.width = '0%';
            if (pctEl) pctEl.textContent = '0%';
            return;
        }

        const pct = Math.min(100, (gasto / disponivel) * 100);
        let bgImage;
        if (pct >= 90) {
            bgImage = 'linear-gradient(to right, #E11D48, #BE123C)';
        } else if (pct >= 70) {
            bgImage = 'linear-gradient(to right, #D97706, #B45309)';
        } else {
            bgImage = 'linear-gradient(to right, #059669, #047857)';
        }

        _largurasBarrasCache[idBarra] = { pct, classe: 'h-full rounded-full', bgImage };
        barra.className = 'h-full rounded-full';
        barra.style.backgroundColor = 'transparent';
        barra.style.backgroundImage = bgImage;

        if (!saldosOcultos) barra.style.width = pct + '%';
        if (pctEl) pctEl.textContent = Math.round(pct) + '%';
    };
    // 🎯 Barra de consumo: mede gasto real contra renda REAL declarada.
    // Ajustes silenciosos movem o saldo (linha acima), mas NÃO aparecem
    // aqui — eles representam correção de valor, não consumo.
    // O Salário agrega também rendaExtra/gastoExtra (coerente com o card).
    // 🎯 Barra do Salário mede só o bucket Salário — Extra não entra,
    // porque agora o Extra vive apenas no card do Total.
    const dispSal = baseSalario + receitaSalario;
    const dispVale = baseVale + receitaVale;
    atualizarBarraConsumo('barraConsumoSalario', gastoSalario, dispSal);
    atualizarBarraConsumo('barraConsumoVale', gastoVale, dispVale);

    // 🎯 Esconde a barra quando:
    //   • não há disponível NEM gasto (trilho cinza puro), OU
    //   • não há GASTO (trilho vazio + 0% — parece bug visual).
    // Só vale a pena mostrar a barra quando há consumo a comunicar.
    // Se o Vale ficar "vazio" em algum mês porque nenhuma despesa
    // foi alocada ao bucket do Vale, a barra some em vez de
    // aparecer como um trilho fantasma.
    const esconderSeZerado = (idBarra, gasto, disponivel) => {
        const barra = document.getElementById(idBarra);
        if (!barra) return;
        const track = barra.parentElement;
        const wrapper = track ? track.parentElement : null;
        if (!wrapper) return;
        if (disponivel <= 0 || gasto <= 0) {
            wrapper.classList.add('hidden');
        } else {
            wrapper.classList.remove('hidden');
        }
    };
    esconderSeZerado('barraConsumoSalario', gastoSalario, dispSal);
    esconderSeZerado('barraConsumoVale', gastoVale, dispVale);


}

// Painel "Orçamento do Mês" do Resumo (oculto quando não há tetos).
function atualizarCardOrcamentoResumo() {
    const card = document.getElementById('cardOrcamentoResumo');
    if (!card) return;

    let status;
    try {
        status = asCalcularStatusOrcamentos('todos');
    } catch (e) {
        card.classList.add('hidden');
        return;
    }

    // Sem orçamentos configurados → oculta o painel inteiro.
    if (status.vazio) {
        card.classList.add('hidden');
        return;
    }
    card.classList.remove('hidden');

    // ─── Cabeçalho: gasto / teto / barra consolidada ───
    document.getElementById('orcResumoGasto').textContent = formatMoeda(status.totalGasto);
    document.getElementById('orcResumoTeto').textContent = 'de ' + formatMoeda(status.totalTeto);

    const pctTotal = status.pctTotal;
    const pctCapTotal = Math.min(100, pctTotal);
    const barra = document.getElementById('orcResumoBarra');
    barra.style.width = pctCapTotal + '%';

    // Cor da barra consolidada
    let corBarraTotal = '#059669';
    if (pctTotal >= 100) corBarraTotal = '#E11D48';
    else if (pctTotal >= 85) corBarraTotal = '#D97706';
    else if (pctTotal >= 70) corBarraTotal = '#D97706';
    barra.style.backgroundColor = corBarraTotal;

    // ─── Lista: top 4 categorias por consumo ───
    const itens = status.itens.slice(0, 4);
    const restante = status.itens.length - itens.length;
    const lista = document.getElementById('orcResumoLista');

    let html = itens.map(it => {
        const pctIt = Math.min(100, it.pct);
        let corIt, corTexto;
        if (it.excedeu) { corIt = '#E11D48'; corTexto = 'text-red-600 dark:text-red-400'; }
        else if (it.pct >= 70) { corIt = '#D97706'; corTexto = 'text-amber-600 dark:text-amber-400'; }
        else { corIt = '#059669'; corTexto = 'text-slate-400 dark:text-gray-500'; }

        const label = it.excedeu
            ? `+${formatMoeda(Math.abs(it.restante))}`
            : `faltam ${formatMoeda(it.restante)}`;

        return `
            <div>
                <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="text-[11.5px] font-semibold text-slate-600 dark:text-gray-300 truncate flex-1">${it.cat}</span>
                    <span class="text-[10.5px] font-bold ${corTexto} tabular-nums whitespace-nowrap">${it.pct.toFixed(0)}%</span>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex-1 h-1.5 bg-slate-100 dark:bg-[#1a2639] rounded-full overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500" style="width: ${pctIt}%; background-color: ${corIt};"></div>
                    </div>
                    <span class="text-[9.5px] ${corTexto} font-semibold whitespace-nowrap tabular-nums">${label}</span>
                </div>
            </div>
        `;
    }).join('');

    if (restante > 0) {
        html += `<p class="text-[10px] text-slate-400 dark:text-gray-500 italic text-center pt-1">+ ${restante} categoria${restante === 1 ? '' : 's'} com teto definido</p>`;
    }

    lista.innerHTML = html;

    // Realinha o conteúdo: aparecer/sumir este card muda a altura do Resumo.
    if (typeof window.alinharConteudoComMenu === 'function') {
        requestAnimationFrame(() => window.alinharConteudoComMenu());
    }
}
window.atualizarCardOrcamentoResumo = atualizarCardOrcamentoResumo;

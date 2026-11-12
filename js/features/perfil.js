// Perfil do usuário
'use strict';

// ===================== PERFIL =====================
function ajustarFonteNomeHeader(nome) {
    // 🎯 Ajusta o tamanho do nome no desktop conforme o comprimento,
    // mantendo-o em uma linha. No mobile o nome nem é exibido.
    const el = document.getElementById('headerNome');
    if (!el) return;

    const comprimento = (nome || '').length;

    let tamanho;
    if (comprimento <= 6)       tamanho = 1.25;   // ex: "Mauro"
    else if (comprimento <= 10) tamanho = 1.1875; // ex: "Mauro Silva"
    else if (comprimento <= 14) tamanho = 1.125;  // ex: "Mauro Santos"
    else if (comprimento <= 18) tamanho = 1.0625; // ex: "Isabella Ribeiro"
    else if (comprimento <= 22) tamanho = 1.0;    // ex: "Isabella Ribeiro Silva"
    else                        tamanho = 0.9375; // ex: nomes muito longos

    el.style.fontSize = tamanho + 'rem';
}

function aplicarPerfilVisual() {
    const nomeCompleto = meuPerfil.nome || 'Mauro Santos';
    if(document.getElementById('headerNome')) document.getElementById('headerNome').textContent = nomeCompleto;
    ajustarFonteNomeHeader(nomeCompleto);

    const wrapSalario = document.querySelector('[data-card-bucket="salario"]');
    const wrapVale = document.querySelector('[data-card-bucket="vale"]');
    const wrapDespesas = document.querySelector('[data-card-bucket="despesas"]');
    const gridCards = wrapSalario?.parentElement || null;

    const lblSalario = document.getElementById('lblSaldoSalario');
    const lblVale = document.getElementById('lblSaldoVale');
    const lblDespesas = document.getElementById('lblDespesasMes');

    // Hero compacto de despesas: só em regimes sem Salário/Vale.
    const heroLinha = document.getElementById('heroLinhaDespesas');
    const ocultarGrid = (ocultar) => {
        if (!gridCards) return;
        gridCards.classList.toggle('hidden', ocultar);
        if (heroLinha) heroLinha.classList.toggle('hidden', !ocultar);
    };

    if (meuPerfil.regime === 'PJ') {
        // PJ: hero + linha de despesas (faturamento/custos são
        // resolvidos em `atualizarCardsSaldoPJ` via hero).
        if (wrapVale) wrapVale.classList.add('hidden');
        if (wrapSalario) wrapSalario.classList.add('hidden');
        if (wrapDespesas) wrapDespesas.classList.add('hidden');
        ocultarGrid(true);
    } else if (meuPerfil.temVale === 'Não') {
        // CLT sem vale: hero + linha de despesas (sem grid).
        if (wrapVale) wrapVale.classList.add('hidden');
        if (wrapSalario) wrapSalario.classList.add('hidden');
        if (wrapDespesas) wrapDespesas.classList.add('hidden');
        ocultarGrid(true);
    } else {
        // CLT com vale: grid completo de 3 cards.
        if (wrapVale) wrapVale.classList.remove('hidden');
        if (wrapSalario) wrapSalario.classList.remove('hidden');
        if (wrapDespesas) wrapDespesas.classList.remove('hidden');
        if (lblSalario) lblSalario.textContent = 'Saldo do Salário';
        if (lblVale) lblVale.textContent = 'Saldo do Vale';
        if (lblDespesas) lblDespesas.textContent = 'Despesas do Mês';
        ocultarGrid(false);
    }

    // Chip "Vale" oculto em PJ e CLT-sem-vale (não faz sentido no perfil).
    const ocultarVale = (meuPerfil.regime === 'PJ') || (meuPerfil.temVale === 'Não');
    document.querySelectorAll('[data-origem-valor="Vale"]').forEach(btn => {
        btn.classList.toggle('hidden', ocultarVale);
    });

    if (typeof renderListaTiposCompra === 'function') renderListaTiposCompra(); 

    // 🎯 Sincroniza a visibilidade do chip Origem com o perfil atual
    // (esconde em PJ e em CLT sem vale). Também reaplica o estado
    // visual dos chips, porque o perfil pode ter mudado.
    if (typeof _atualizarChipsExtrato === 'function') _atualizarChipsExtrato();
}
window.selecionarRegime = function(valor, rotulo) {
    document.getElementById('perfilRegime').value = valor;
    document.getElementById('lblPerfilRegime').textContent = rotulo;
    document.getElementById('menuPerfilRegime').classList.add('hidden');
    alternarRegimePerfil();
}

window.selecionarTemVale = function(valor) {
    document.getElementById('perfilTemVale').value = valor;
    document.getElementById('lblPerfilTemVale').textContent = valor;
    document.getElementById('menuPerfilTemVale').classList.add('hidden');
}

window.selecionarCidade = function(valor) {
    document.getElementById('perfilCidade').value = valor;
    document.getElementById('lblPerfilCidade').textContent = valor;
    document.getElementById('menuPerfilCidade').classList.add('hidden');
}

window.alternarRegimePerfil = function() {
    const regime = document.getElementById('perfilRegime').value;
    const boxVale = document.getElementById('boxPerfilVale');
    const boxPadroes = document.getElementById('boxPerfilPadroes');
    const gridRegimeCidade = document.getElementById('gridRegimeCidade');
    
    if (regime === 'PJ') {
        if(boxVale) boxVale.classList.add('hidden');
        if(boxPadroes) boxPadroes.classList.add('hidden');
        if(gridRegimeCidade) { gridRegimeCidade.classList.remove('sm:grid-cols-3'); gridRegimeCidade.classList.add('sm:grid-cols-2'); }
    } else {
        if(boxVale) boxVale.classList.remove('hidden');
        if(boxPadroes) boxPadroes.classList.remove('hidden');
        if(gridRegimeCidade) { gridRegimeCidade.classList.remove('sm:grid-cols-2'); gridRegimeCidade.classList.add('sm:grid-cols-3'); }
    }
}

const modalPerfil = document.getElementById('modalPerfil');
window.abrirModalPerfil = function() {
    // Garante que outras telas sejam fechadas primeiro para não encavalar
    if (!document.getElementById('modalNovoLancamento').classList.contains('hidden')) fecharModalLancamento();
    if (!document.getElementById('modalContas').classList.contains('hidden')) fecharModalContas();
    if (!document.getElementById('modalEdicao').classList.contains('hidden')) fecharModalEdicao();

    travarScroll();
    document.getElementById('perfilNome').value = meuPerfil.nome || ''; 
    
    const reg = meuPerfil.regime || 'CLT';
    const val = meuPerfil.temVale || 'Sim';
    const cid = meuPerfil.cidade || 'Iperó - SP';
    
    document.getElementById('perfilRegime').value = reg;
    document.getElementById('lblPerfilRegime').textContent = reg === 'CLT' ? 'CLT' : 'Autônomo';
    
    document.getElementById('perfilTemVale').value = val;
    document.getElementById('lblPerfilTemVale').textContent = val;

    if (document.getElementById('perfilCidade')) {
        document.getElementById('perfilCidade').value = cid;
        document.getElementById('lblPerfilCidade').textContent = cid;
    }
    
    document.getElementById('perfilSalario').value = formatarParaMascara(meuPerfil.salario);
        document.getElementById('perfilHoras').value = meuPerfil.horas || '220'; 
        document.getElementById('perfilDependentes').value = meuPerfil.dependentes || '0';
        
        alternarRegimePerfil();
        
        // 🎨 Marca o botão de tema correto antes de mostrar o modal
        atualizarBotoesTema();
        
        window.abrirModalGenerico('modalPerfil');
    }

window.fecharModalPerfil = function() {
        window.fecharModalGenerico('modalPerfil');
    }

    // Sim→Não devolve o vale ao líquido. Não→Sim recalcula e subtrai. Resto intacto.
function migrarProjecoesPorVale(temValeAntes, temValeDepois) {
    if (temValeAntes === temValeDepois) return 0;

    const agoraTemVale = (temValeDepois === 'Sim');
    let mesesMigrados = 0;

    // ─── 1. configHoleriteGlobal: salarioLiquido + valeAdiantamento ───
    const chavesConfig = Object.keys(configHoleriteGlobal);
    for (const chave of chavesConfig) {
        const cfg = configHoleriteGlobal[chave];
        if (!cfg) continue;
        const liq = parseFloat(cfg.salarioLiquido) || 0;
        const valeAtual = parseFloat(cfg.valeAdiantamento) || 0;

        if (agoraTemVale) {
            // Não → Sim: recalcula o vale pela mesma fórmula do motor.
            // O vale do mês M é 40% × (bruto do M-1 / 30) × dias_trab em M-1.
            const [mm, aa] = chave.split('/');
            const mesM = parseInt(mm, 10) - 1;    // 0-indexed
            const anoM = parseInt(aa, 10);
            const mesAnt = new Date(anoM, mesM - 1, 1);
            const chaveAnt = `${String(mesAnt.getMonth()+1).padStart(2,'0')}/${mesAnt.getFullYear()}`;
            const cfgAnt = configHoleriteGlobal[chaveAnt];
            const brutoBase = parseFloat(cfgAnt?.bruto) || parseFloat(cfg.bruto) || 0;
            const diasTrabAnt = (typeof getDiasTrabalhadosDoMes === 'function')
                ? getDiasTrabalhadosDoMes(mesAnt)
                : 30;
            const novoVale = (brutoBase / 30) * diasTrabAnt * 0.40;

            cfg.valeAdiantamento = novoVale;
            cfg.valeDescontado = novoVale;
            cfg.salarioLiquido = liq - novoVale;
        } else {
            // Sim → Não: devolve o vale ao salário, zera o vale.
            cfg.salarioLiquido = liq + valeAtual;
            cfg.valeAdiantamento = 0;
            cfg.valeDescontado = 0;
        }
        mesesMigrados++;
    }

    // ─── 2. saldoBaseMensalGlobal: salario + vale (espelho) ───
    for (const chave in saldoBaseMensalGlobal) {
        const bm = saldoBaseMensalGlobal[chave];
        if (!bm) continue;
        const liq = parseFloat(bm.salario) || 0;
        const valeAtual = parseFloat(bm.vale) || 0;

        if (agoraTemVale) {
            // Espelha o valor calculado acima em configHoleriteGlobal
            const cfgIrm = configHoleriteGlobal[chave];
            const novoVale = cfgIrm ? (parseFloat(cfgIrm.valeAdiantamento) || 0) : valeAtual;
            bm.vale = novoVale;
            bm.salario = liq - novoVale;
        } else {
            bm.salario = liq + valeAtual;
            bm.vale = 0;
        }
    }

    // ─── 3. Invalida cache + repinta as telas afetadas ───
    cacheSaldoAcumulado = {};
    return mesesMigrados;
}

document.getElementById('btnSalvarPerfil').addEventListener('click', () => {
    const salarioAntigo = valorFloat(meuPerfil.salario);
    const salarioNovo = valorFloat(document.getElementById('perfilSalario').value);
    const salarioMudou = Math.abs(salarioNovo - salarioAntigo) > 0.005;

    const temValeAntes = meuPerfil.temVale || 'Sim';
    const regimeAntes = meuPerfil.regime || 'CLT';

    meuPerfil = {
        nome: document.getElementById('perfilNome').value,
        regime: document.getElementById('perfilRegime') ? document.getElementById('perfilRegime').value : 'CLT',
        temVale: document.getElementById('perfilTemVale') ? document.getElementById('perfilTemVale').value : 'Sim',
        cidade: document.getElementById('perfilCidade') ? document.getElementById('perfilCidade').value : 'Iperó - SP',
        salario: salarioNovo.toString(),
        horas: document.getElementById('perfilHoras').value, 
        dependentes: document.getElementById('perfilDependentes').value,
        email: '', foto: '' 
    };

    // Migração de vale só entre CLT↔CLT (PJ não tem o conceito).
    if (regimeAntes === 'CLT' && meuPerfil.regime === 'CLT'
        && temValeAntes !== meuPerfil.temVale) {
        const meses = migrarProjecoesPorVale(temValeAntes, meuPerfil.temVale);
        if (meses > 0) {
            // Aviso informativo DEPOIS do toast de "Configurações
            // salvas" (que aparece no fim do handler). Como os dois
            // vão para o mesmo canto, o de migração cai em segundo
            // — o usuário lê os dois em sequência.
            setTimeout(() => {
                window.mostrarAviso(
                    `${meses} projeç${meses === 1 ? 'ão' : 'ões'} recalculada${meses === 1 ? '' : 's'} para o novo perfil de vale.`,
                    "info"
                );
            }, 400);
        }
    }

    if (salarioMudou) {
        // Alvo: mês seguinte ao visualizado (histórico fica intacto).
        const mesAlvo = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() + 1, 1);
        const mesAlvoNum = mesAlvo.getFullYear() * 100 + (mesAlvo.getMonth() + 1);

        let mesesAtualizados = 0;
        for (const chave in configHoleriteGlobal) {
            const p = chave.split('/');
            if (p.length !== 2) continue;
            const chaveNum = parseInt(p[1]) * 100 + parseInt(p[0]);
            if (chaveNum >= mesAlvoNum) {
                configHoleriteGlobal[chave].bruto = salarioNovo;
                mesesAtualizados++;
            }
        }

        // Meses SEM simulação salva puxam direto de `meuPerfil.salario`
        // quando o usuário abre o simulador — então já refletem o novo valor.
        // Se o usuário já estiver com o simulador aberto, força a releitura.
        const abaProjecao = document.getElementById('abaProjecao');
        if (abaProjecao && abaProjecao.classList.contains('block')) {
            carregarOuCalcularFolha();
        }

        if (mesesAtualizados > 0) {
            window.mostrarAviso(
                `Salário atualizado. ${mesesAtualizados} simulaç${mesesAtualizados === 1 ? 'ão' : 'ões'} futura${mesesAtualizados === 1 ? '' : 's'} receberam o novo valor.`,
                "info"
            );
        }
    }

    syncToFirebase(); 
    aplicarPerfilVisual(); 
    atualizarTabela();
    // 🎯 Notifica a Assistente — se a aba estiver só com boas-vindas,
    //    regenera para refletir o novo nome imediatamente. Sem isso,
    //    a saudação ficava "congelada" com o nome antigo até o usuário
    //    clicar na lixeira ou recarregar a página.
    if (typeof window.asAtualizarSaudacaoPerfil === 'function') {
        window.asAtualizarSaudacaoPerfil();
    }
    window.fecharModalPerfil(); 
    window.mostrarAviso("Configurações salvas com sucesso!", "sucesso");
    const abaProjecao = document.getElementById('abaProjecao'); 
    if(abaProjecao.classList.contains('block')) carregarOuCalcularFolha();
});

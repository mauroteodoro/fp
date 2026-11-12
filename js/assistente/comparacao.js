// Assistente: comparação entre meses e projeção
'use strict';

// ═══════════════════════════════════════════════════════════════
// 📊 COMPARAÇÃO ENTRE MESES — "Compare outubro com setembro"
// ═══════════════════════════════════════════════════════════════
// Extrai DOIS meses da frase, separando pelos conectores usuais
// ("com", "e", "vs", "versus", "contra"). Cada metade é analisada
// por `asExtrairMesAno`, que já cuida de sinônimos como "este mês"
// e "mês passado".
//
// Não funciona quando falta um dos dois lados — nesse caso, o
// parser cai nas intents seguintes (o usuário pode estar pedindo
// outra coisa com "comparar" no meio).

function asExtrairDoisMeses(texto) {
    const t = texto.toLowerCase();
    // Conectores: exigem espaços dos dois lados para evitar casar
    // com pedaços internos de palavras (ex: "e" dentro de "sete").
    const partes = t.split(/\s+(?:com|e|vs\.?|versus|contra)\s+/);
    if (partes.length < 2) return null;

    // Varre par a par, do primeiro que casar com dois meses distintos
    for (let i = 0; i < partes.length - 1; i++) {
        const m1 = asExtrairMesAno(partes[i]);
        const m2 = asExtrairMesAno(partes[i + 1]);
        if (m1 && m2 && !(m1.mes === m2.mes && m1.ano === m2.ano)) {
            return { m1, m2 };
        }
    }
    return null;
}

function asRespCompararMeses(m1, a1, m2, a2) {
    const d1 = asCalcularTotaisMes(m1, a1, 'todos');
    const d2 = asCalcularTotaisMes(m2, a2, 'todos');
    const n1 = nomeMeses[m1];
    const n2 = nomeMeses[m2];
    const label1 = `${n1.substring(0,3)}/${String(a1).substring(2)}`;
    const label2 = `${n2.substring(0,3)}/${String(a2).substring(2)}`;

    // Percentual de variação do mês 1 vs mês 2.
    // Devolve null quando a base é zero (divisão indefinida) —
    // nesse caso, mostramos "novo" em vez de "+∞%".
    const variacao = (v1, v2) => {
        if (Math.abs(v2) < 0.005) return null;
        return ((v1 - v2) / Math.abs(v2)) * 100;
    };

    // Bloco reutilizável: um indicador (Receitas/Despesas/Saldo)
    // com valor em cada mês + variação. Cores semânticas:
    // verde quando a variação é favorável, vermelho quando não.
    // Para receitas, "subiu" é bom. Para despesas, "subiu" é ruim.
    // Para saldo, "subiu" é bom. Tratamos com um parâmetro `inverte`.
    const bloco = (titulo, v1, v2, inverte) => {
        const pct = variacao(v1, v2);
        const subiu = v1 > v2;
        const bom = inverte ? !subiu : subiu;
        const corDelta = bom ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-400';
        const seta = subiu ? '▲' : (v1 < v2 ? '▼' : '=');
        const pctStr = pct === null
            ? (v1 > 0 ? 'novo' : '—')
            : `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;

        return `
            <div class="py-2 border-b border-slate-200 dark:border-[#2a3850]/60 last:border-0">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">${titulo}</p>
                <div class="flex justify-between gap-2 text-[12.5px] items-baseline">
                    <span class="text-slate-500 dark:text-gray-400 min-w-[52px]">${label1}</span>
                    <span class="font-bold text-slate-800 dark:text-gray-100 flex-1 text-right">${formatMoeda(v1)}</span>
                </div>
                <div class="flex justify-between gap-2 text-[12.5px] items-baseline mt-1">
                    <span class="text-slate-500 dark:text-gray-400 min-w-[52px]">${label2}</span>
                    <span class="font-bold text-slate-500 dark:text-gray-400 flex-1 text-right">${formatMoeda(v2)}</span>
                </div>
                <div class="flex justify-end mt-1">
                    <span class="text-[11px] font-bold ${corDelta}">${seta} ${pctStr}</span>
                </div>
            </div>
        `;
    };

    const saldo1 = d1.saldo;
    const saldo2 = d2.saldo;

    // ═══════════════════════════════════════════════════════════
    // 🎯 PROJEÇÃO — base lida do Simulador, não do Extrato
    // ═══════════════════════════════════════════════════════════
    // O card "Receitas" acima lê transações do bancoDeDados — o que
    // EFETIVAMENTE foi lançado. Esta linha lê do Simulador
    // (configHoleriteGlobal + saldoBaseMensalGlobal) — o que foi
    // PROJETADO para o mês.
    //
    // Juntas, as duas visões respondem "o que aconteceu vs o que eu
    // projetei" no mesmo card. Útil para o usuário perceber quando
    // o mês real ficou abaixo/acima do planejado.
    //
    // `asCalcularSaldoBucket(..., 'Total')` devolve base (salário +
    // vale) + receitas + gastos + ajustes + total. Aqui usamos só
    // `base` (a soma do que entrou pelo holerite) e `total` (a
    // sobra projetada após gastos).
    const proj1 = asCalcularSaldoBucket(m1, a1, 'Total');
    const proj2 = asCalcularSaldoBucket(m2, a2, 'Total');
    const baseProj1 = proj1.base || 0;
    const baseProj2 = proj2.base || 0;
    const totalProj1 = proj1.total || 0;
    const totalProj2 = proj2.total || 0;

    // Top categorias onde o mês 1 gastou MAIS do que o mês 2
    // (variação absoluta positiva). Útil para o usuário enxergar
    // "o que puxou o mês pra cima".
    const catDiff = [];
    for (const cat in d1.categorias) {
        const v1 = d1.categorias[cat] || 0;
        const v2 = d2.categorias[cat] || 0;
        const diff = v1 - v2;
        if (Math.abs(diff) > 0.5) catDiff.push({ cat, v1, v2, diff });
    }
    // Também categorias que existiam no mês 2 e sumiram no mês 1
    for (const cat in d2.categorias) {
        if (!(cat in d1.categorias)) {
            const v2 = d2.categorias[cat] || 0;
            if (v2 > 0.5) catDiff.push({ cat, v1: 0, v2, diff: -v2 });
        }
    }
    catDiff.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    const topCat = catDiff.slice(0, 3);

    let extraCat = '';
    if (topCat.length > 0) {
        extraCat = `
            <div class="mt-3 pt-3 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1.5">Maiores variações por categoria</p>
                <div class="space-y-1 text-[12px]">
                    ${topCat.map(c => {
                        const sinal = c.diff > 0 ? '+' : '-';
                        const cor = c.diff > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-500';
                        return `<div class="flex justify-between gap-3">
                            <span class="truncate text-slate-600 dark:text-gray-300">${c.cat}</span>
                            <span class="whitespace-nowrap font-semibold ${cor}">${sinal} ${formatMoeda(Math.abs(c.diff))}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">📊 Comparação · ${n1}/${a1} vs ${n2}/${a2}</p>
        <div class="space-y-0">
            ${bloco('Receitas', d1.receitas, d2.receitas, false)}
            ${bloco('Despesas', d1.despesas, d2.despesas, true)}
            ${bloco('Saldo', saldo1, saldo2, false)}
        </div>

        <!-- ═══ PROJEÇÃO (Simulador) ═══ -->
        ${(baseProj1 > 0.005 || baseProj2 > 0.005 || totalProj1 !== 0 || totalProj2 !== 0) ? `
            <div class="mt-3 pt-3 border-t border-slate-300/60 dark:border-[#2a3850]/60">
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-2">🎯 Projeção (Simulador)</p>
                <div class="space-y-0">
                    ${bloco('Base (Salário + Vale)', baseProj1, baseProj2, false)}
                    ${bloco('Total projetado', totalProj1, totalProj2, false)}
                </div>
                <p class="text-[10px] text-slate-400 dark:text-gray-500 mt-2 leading-snug">
                    Valores lidos do Simulador. Meses sem projeção salva usam o perfil como estimativa.
                </p>
            </div>
        ` : ''}

        ${extraCat}
        ${asSugestoes([
            { txt: 'Ver gastos do mês', q: `Quanto gastei em ${n1.toLowerCase()}?` },
            { txt: 'Maiores gastos',    q: `Quais os maiores gastos de ${n1.toLowerCase()}?` }
        ])}
    `;
}

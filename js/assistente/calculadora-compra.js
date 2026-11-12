// Assistente: "Posso comprar X?"
'use strict';

// ═══════════════════════════════════════════════════════════════
// 🎯 CALCULADORA DE COMPRA — "Posso comprar X?"
// ═══════════════════════════════════════════════════════════════
// Analisa se uma compra cabe no orçamento projetado do usuário,
// considerando:
//   • Saldo do mês (Salário + Vale consolidados)
//   • Reserva mínima que o usuário quer manter de sobra por mês
//   • Alternativas de parcelamento (testa de 12x até 2x)
//   • Se não cabe hoje, busca o primeiro mês futuro que comporta
//     (até 24 meses à frente)
//
// A projeção futura lê `configHoleriteGlobal` e `saldoBaseMensalGlobal`
// via `asCalcularSaldoBucket`. Quando um mês não tem simulação salva,
// ela cai no perfil do usuário como estimativa — e a resposta avisa.

function asExtrairValorCompra(texto) {
    const t = texto.toLowerCase();
    // Aceita: "de 4000", "por 4 mil", "de R$ 4.000", "custando 4k"
    const m = t.match(/(?:de|por|no valor de|custa(?:ndo)?)\s*(?:r\$\s*)?([\d.,]+)\s*(mil|k)?\b/i)
           || t.match(/(?:r\$\s*)([\d.,]+)\s*(mil|k)?\b/i)
           || t.match(/\b([\d.,]+)\s*(mil|k)\b/i);
    if (!m) return 0;
    let v = valorFloat(m[1]);
    if (m[2]) v *= 1000;
    return v;
}

function asExtrairParcelas(texto) {
    const m = texto.match(/(?:em\s*)?(\d{1,2})\s*(?:x|vezes|parcelas)/i);
    if (m) return { n: Math.min(12, Math.max(1, parseInt(m[1]))), exato: true };
    if (/\bparcelad[oa]\b|\bparcelar\b/i.test(texto)) return { n: 12, exato: false };
    return { n: 1, exato: true };
}

function asExtrairMesInicio(texto) {
    const t = texto.toLowerCase();
    const temGatilho = /a\s*partir\s*d[eoa]?\s*|come[çc]ando\s+(?:em|no|a\s+partir\s+de)\s*|in[íi]cio\s+em\s*/.test(t);
    if (!temGatilho) return null;

    const info = asExtrairMesAno(t);
    if (info) return info;

    // "mês que vem" / "próximo mês"
    if (/m[êe]s\s+que\s+vem|pr[óo]ximo\s+m[êe]s/i.test(t)) {
        const d = new Date(dataFiltro.getFullYear(), dataFiltro.getMonth() + 1, 1);
        return { mes: d.getMonth(), ano: d.getFullYear() };
    }
    return null;
}

// Extrai "sobrando X" / "manter X" / "reserva de X".
function asExtrairReservaMinima(texto) {
    const patterns = [
        /sobrando\s*(?:ao menos\s*)?(?:r\$\s*)?([\d.,]+)/i,
        /sobrar\s*(?:ao menos\s*)?(?:r\$\s*)?([\d.,]+)/i,
        /manter\s*(?:ao menos\s*)?(?:r\$\s*)?([\d.,]+)/i,
        /(?:sem|n[ãa]o)\s*(?:ficar\s*)?(?:abaixo|menos)\s*de\s*(?:r\$\s*)?([\d.,]+)/i
    ];
    for (const p of patterns) {
        const m = texto.match(p);
        if (m) return valorFloat(m[1]);
    }
    return 0;
}

function asExtrairNomeItem(texto) {
    const m = texto.match(/(?:comprar|adquirir|gastar em|investir em|pegar)\s+(?:um[a]?\s+)?([a-zà-ú][a-zà-ú\s]{2,25}?)\s+(?:de|por|no valor|custando)/i);
    return m ? m[1].trim() : '';
}

// Fase 1: exato do usuário. Fase 2: maior aberto. Fase 3: fallback reduzindo parcelas.
function asAnalisarCompra(valor, parcelasMaximas, reservaMin, opts) {
    opts = opts || {};
    const parcelasExatas = opts.parcelasExatas === true;
    const mesInicial = opts.mesInicial || null;

    const mesBase = mesInicial ? mesInicial.mes : dataFiltro.getMonth();
    const anoBase = mesInicial ? mesInicial.ano : dataFiltro.getFullYear();
    const r = { avista: null, parcelado: null, mesInicial };

    const verificarParcelas = (n, offset) => {
        const parcela = valor / n;
        let folgaAcumulada = 0;
        let precisouFolga = false;

        for (let p = 0; p < n; p++) {
            const dtP = new Date(anoBase, mesBase + offset + p, 1);
            const saldoP = asCalcularSaldoBucket(dtP.getMonth(), dtP.getFullYear(), 'Total').total;

            // Sobra do mês SEM usar folga anterior
            const sobraIsolada = saldoP - reservaMin - parcela;
            // Sobra do mês USANDO folga acumulada
            const sobraComFolga = sobraIsolada + folgaAcumulada;

            if (sobraComFolga < 0) return null;   // nem com folga → inviável
            if (sobraIsolada < 0) precisouFolga = true; // este mês precisou do carryover

            folgaAcumulada = sobraComFolga;
        }

        const dt = new Date(anoBase, mesBase + offset, 1);
        const chave = window.chaveMes(dt);
        const temSimulacao = !!(configHoleriteGlobal[chave] || saldoBaseMensalGlobal[chave]);
        return { offset, mes: dt.getMonth(), ano: dt.getFullYear(), parcelas: n, parcela, temSimulacao, precisouFolga };
    };

    // ═══ FASE 0 — À vista: primeiro mês que comporta ═══
    for (let offset = 0; offset < 24; offset++) {
        const dt = new Date(anoBase, mesBase + offset, 1);
        const chave = window.chaveMes(dt);
        const saldo = asCalcularSaldoBucket(dt.getMonth(), dt.getFullYear(), 'Total').total;
        const temSimulacao = !!(configHoleriteGlobal[chave] || saldoBaseMensalGlobal[chave]);
        if (saldo - valor >= reservaMin) {
            r.avista = { offset, mes: dt.getMonth(), ano: dt.getFullYear(), saldo, temSimulacao, sobra: saldo - valor };
            break;
        }
    }

    // ═══ FASE 1 — Parcelado com número EXATO em todos os offsets ═══
    if (parcelasMaximas > 1 && parcelasExatas) {
        for (let offset = 0; offset < 24; offset++) {
            const resultado = verificarParcelas(parcelasMaximas, offset);
            if (resultado) { r.parcelado = resultado; break; }
        }
    }

    // ═══ FASE 2 — Parcelado com número ABERTO (12x → 2x) ═══
    if (parcelasMaximas > 1 && !parcelasExatas && !r.parcelado) {
        for (let offset = 0; offset < 24 && !r.parcelado; offset++) {
            for (let n = parcelasMaximas; n >= 2; n--) {
                const resultado = verificarParcelas(n, offset);
                if (resultado) { r.parcelado = resultado; break; }
            }
        }
    }

    // ═══ FASE 3 — Fallback: reduzir parcelas se o exato falhou ═══
    if (parcelasMaximas > 1 && parcelasExatas && !r.parcelado) {
        for (let offset = 0; offset < 24 && !r.parcelado; offset++) {
            for (let n = parcelasMaximas - 1; n >= 2; n--) {
                const resultado = verificarParcelas(n, offset);
                if (resultado) {
                    resultado.fallback = true;
                    r.parcelado = resultado;
                    break;
                }
            }
        }
    }

    return r;
}

function asRespAnaliseCompra(valor, parcelasMaximas, reservaMin, nomeItem, opts) {
    opts = opts || {};
    const r = asAnalisarCompra(valor, parcelasMaximas, reservaMin, opts);
    const nome = nomeItem ? nomeItem.charAt(0).toUpperCase() + nomeItem.slice(1) : 'Compra';
    const fmtMes = (m, a) => `${nomeMeses[m]}/${a}`;
    const mesInicial = opts.mesInicial || null;

    let html = `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">${nomeItem ? '💻 Análise · ' + nome : '🛒 Análise de compra'}</p>
        <p class="text-2xl font-bold text-[#4D6BFE] font-montserrat tracking-tight mb-1">${formatMoeda(valor)}</p>
        ${reservaMin > 0 ? `<p class="text-[11px] text-slate-500 dark:text-gray-400 mb-3">Reserva mínima mensal: <strong>${formatMoeda(reservaMin)}</strong></p>` : '<div class="mb-3"></div>'}
    `;

    // ── À vista ────────────────────────────────────────────────
    if (r.avista && r.avista.offset === 0) {
        const labelQuando = mesInicial ? `em ${fmtMes(r.avista.mes, r.avista.ano)}` : 'este mês';
        html += `
            <div class="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-900/40">
                <span class="text-2xl shrink-0">✅</span>
                <div class="min-w-0">
                    <p class="font-bold text-green-700 dark:text-green-400 text-sm">Cabe à vista ${labelQuando}!</p>
                    <p class="text-[12px] text-slate-600 dark:text-gray-300 mt-1">
                        Saldo projetado: <strong>${formatMoeda(r.avista.saldo)}</strong> · Após a compra: <strong>${formatMoeda(r.avista.sobra)}</strong>
                    </p>
                </div>
            </div>
        `;
    } else if (r.avista) {
        const m = fmtMes(r.avista.mes, r.avista.ano);
        html += `
            <div class="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-900/40">
                <span class="text-2xl shrink-0">⚠️</span>
                <div class="min-w-0">
                    <p class="font-bold text-amber-700 dark:text-amber-400 text-sm">À vista só em ${m}</p>
                    <p class="text-[12px] text-slate-600 dark:text-gray-300 mt-1">
                        Neste mês seu saldo não comporta. No cenário projetado, você conseguiria em <strong>${m}</strong>, deixando <strong>${formatMoeda(r.avista.sobra)}</strong> de sobra.
                    </p>
                    ${!r.avista.temSimulacao ? '<p class="text-[10px] text-amber-600 dark:text-amber-400 mt-1">⚠️ Mês sem simulação salva — projeção baseada no perfil.</p>' : ''}
                </div>
            </div>
        `;
    }

    // ── Parcelado ──────────────────────────────────────────────
    if (r.parcelado) {
        const noInicio = r.parcelado.offset === 0;
        const m = fmtMes(r.parcelado.mes, r.parcelado.ano);
        const labelInicio = mesInicial ? `em ${m}` : 'agora';
        const caiuParaMenos = r.parcelado.parcelas < parcelasMaximas;
        const titulo = noInicio
            ? (caiuParaMenos
                ? `Sugestão: parcele ${labelInicio} em ${r.parcelado.parcelas}x`
                : (mesInicial ? `Parcele ${labelInicio}` : 'Ou parcele agora'))
            : `Parcelado a partir de ${m}`;

        // 🎯 A frase de rodapé muda conforme o cenário:
        //   • precisouFolga → a folga de meses anteriores foi essencial.
        //     O usuário precisa saber que a reserva mensal será usada
        //     como colchão de alguns meses apertados.
        //   • caiuParaMenos → o número exato não cabia.
        //   • padrão → tudo uniforme.
        let fraseRodape;
        if (r.parcelado.precisouFolga) {
            fraseRodape = reservaMin > 0
                ? `Alguns meses ficam abaixo da reserva de ${formatMoeda(reservaMin)} — a folga dos meses anteriores cobre essa diferença.`
                : 'A folga dos primeiros meses cobre os meses mais apertados.';
        } else if (reservaMin > 0) {
            fraseRodape = `Cada mês fica com pelo menos ${formatMoeda(reservaMin)} de reserva.`;
        } else {
            fraseRodape = 'Cada mês fica com saldo positivo.';
        }

        html += `
            <div class="flex items-start gap-3 p-3 mt-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-900/40">
                <span class="text-2xl shrink-0">${noInicio ? '💳' : '📅'}</span>
                <div class="min-w-0">
                    <p class="font-bold text-blue-700 dark:text-blue-400 text-sm">${titulo}</p>
                    <p class="text-[12px] text-slate-600 dark:text-gray-300 mt-1">
                        <strong>${r.parcelado.parcelas}x de ${formatMoeda(r.parcelado.parcela)}</strong> — ${fraseRodape}
                    </p>
                    ${caiuParaMenos ? `<p class="text-[10px] text-amber-600 dark:text-amber-400 mt-1">⚠️ ${parcelasMaximas}x não cabe em nenhum mês — ${r.parcelado.parcelas}x é o máximo viável.</p>` : ''}
                    ${!r.parcelado.temSimulacao ? '<p class="text-[10px] text-blue-600 dark:text-blue-400 mt-1">⚠️ Projeção baseada no perfil.</p>' : ''}
                </div>
            </div>
        `;
    }

    // ── Nem à vista nem parcelado ──────────────────────────────
    if (!r.avista && !r.parcelado) {
        html += `
            <div class="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-900/40">
                <span class="text-2xl shrink-0">❌</span>
                <div class="min-w-0">
                    <p class="font-bold text-red-700 dark:text-red-400 text-sm">Não cabe nos próximos 24 meses</p>
                    <p class="text-[12px] text-slate-600 dark:text-gray-300 mt-1">
                        Nem à vista, nem parcelado em até ${parcelasMaximas}x. Considere reduzir o valor, aumentar o prazo ou revisar a reserva mínima.
                    </p>
                </div>
            </div>
        `;
    }

    html += `
        <p class="text-[10.5px] text-slate-400 dark:text-gray-500 mt-3 leading-snug">
            Análise baseada no saldo projetado (Salário + Vale) dos próximos meses. Meses sem simulação salva usam o perfil como estimativa.
        </p>
    `;

    html += asSugestoes([
        { txt: 'E em 10x?', q: 'E se eu parcelar em 10x?' },
        { txt: 'E sobrando 500?', q: 'E sobrando 500?' },
        { txt: 'Ver saldo projetado', q: 'Qual meu saldo projetado?' }
    ]);

    asUltimoContexto = {
        tipo: 'analise-compra',
        valor,
        parcelasMaximas,
        parcelasExatas: opts.parcelasExatas === true,
        reservaMin,
        nomeItem,
        mesInicial: opts.mesInicial || null
    };

    return html;
}

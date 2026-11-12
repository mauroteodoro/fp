// Exportar recibo em PDF
'use strict';

// ===================== EXPORTAR RECIBO PDF =====================
window.exportarReciboPDF = function() {
    const corpo = document.getElementById('corpoHoleritePremium');
    const totProv = document.getElementById('totProv')?.textContent || '—';
    const totDesc = document.getElementById('totDesc')?.textContent || '—';
    const liq = document.getElementById('liqReceber')?.textContent || '—';
    if (!corpo) return;

    const nome = meuPerfil.nome || 'Usuário';
    const mesRef = `${nomeMeses[dataFiltro.getMonth()]} ${dataFiltro.getFullYear()}`;

    const linhasHTML = corpo.innerHTML;

    const html = `
<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>Recibo — ${mesRef}</title>
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; padding: 40px; color: #0B1120; background: #fff; }
    .header { border-bottom: 2px solid #0B1120; padding-bottom: 20px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 4px; }
    .header p { font-size: 12px; color: #64748B; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #94A3B8; margin-bottom: 12px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
    .row span:first-child { color: #475569; }
    .row span:last-child { font-weight: 600; }
    .totais { display: flex; gap: 20px; margin-top: 24px; }
    .totais > div { flex: 1; padding: 16px; background: #F7F8FB; border-radius: 12px; }
    .totais p:first-child { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #94A3B8; margin-bottom: 6px; }
    .totais p:last-child { font-size: 18px; font-weight: 800; }
    .liquido { margin-top: 20px; padding: 20px; background: #0B1120; color: #fff; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
    .liquido span:first-child { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; opacity: 0.7; }
    .liquido span:last-child { font-size: 24px; font-weight: 800; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 10px; color: #94A3B8; text-align: center; }
    .prov { color: #059669; }
    .desc { color: #E11D48; }
</style></head>
<body>
    <div class="header">
<h1>Recibo de Pagamento</h1>
<p>${nome} · ${mesRef}</p>
    </div>
    <div class="section">
<p class="section-title">Composição</p>
${linhasHTML.replace(/text-green-600|text-green-500/g, 'prov').replace(/text-red-600|text-red-400/g, 'desc').replace(/class="[^"]*"/g, (m) => m.includes('prov') || m.includes('desc') ? m : 'class="row"').replace(/<div/g, '<div').replace(/dark:[^ "]*/g, '').replace(/hover:[^ "]*/g, '')}
    </div>
    <div class="totais">
<div><p>Total Proventos</p><p class="prov">${totProv}</p></div>
<div><p>Total Descontos</p><p class="desc">${totDesc}</p></div>
    </div>
    <div class="liquido"><span>Líquido a Receber</span><span>${liq}</span></div>
    <div class="footer">Gerado por Finanças Pessoais · ${getTimestampAtual()}</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (!win) { window.mostrarAviso('Permita pop-ups para exportar o recibo.', 'erro'); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 400);
};

// Motor de categorias e ícones
'use strict';

// ===================== MOTOR DE CATEGORIAS E ÍCONES =====================
const ICONES_SVG = {
    // == ALIMENTAÇÃO E BEBIDAS ==
    'shopping-cart': { label: 'Mercado / Carrinho', path: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>' },
    'shopping-bag': { label: 'Compras / Sacola', path: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>' },
    'pizza': { label: 'Fast Food / Lanches', path: '<path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/>' },
    'coffee': { label: 'Café / Padaria', path: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2"/><path d="M10 2v2"/><path d="M14 2v2"/>' },
    'beer': { label: 'Bar / Bebidas', path: '<path d="M17 11h1a3 3 0 0 1 0 6h-1"/><path d="M9 12v6"/><path d="M13 12v6"/><path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/>' },
    'cake': { label: 'Festa / Bolo', path: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"/><path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1"/><path d="M2 21h20"/><path d="M7 8v3"/><path d="M12 8v3"/><path d="M17 8v3"/><path d="M7 4h.01"/><path d="M12 4h.01"/><path d="M17 4h.01"/>' },
    'utensils': { label: 'Restaurante / Refeição', path: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>' },
    'apple': { label: 'Frutas / Feira', path: '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>' },
    'cup': { label: 'Taça / Bebida Quente', path: '<path d="m14 4-2.81 2.81a4 4 0 0 0-1.16 2.45l-.47 3.52c-.17 1.25.7 2.41 1.95 2.53l.36.03c1.27.1 2.37-.8 2.53-2.07l.2-1.46"/><path d="m17 4-2.81 2.81a4 4 0 0 0-1.16 2.45l-.47 3.52c-.17 1.25.7 2.41 1.95 2.53l.36.03c1.27.1 2.37-.8 2.53-2.07l.2-1.46"/><path d="M4.83 15.3c-.5-.73-.5-1.74-.08-2.58l.75-1.5c.34-.69.95-1.2 1.7-1.42l3.47-.98c2.4-.68 4.94 1.05 5.17 3.57.17 1.93-1.32 3.61-3.23 3.61H6.5c-1.3 0-2.31-.69-2.83-1.85z"/>' },
    'ice-cream': { label: 'Sorvete / Sobremesa', path: '<path d="m7 11 4.08 10.35a1 1 0 0 0 1.84 0L17 11"/><path d="M17 7A5 5 0 0 0 7 7c0 2 2 4 5 4s5-2 5-4Z"/>' },

    // == MORADIA E UTILIDADES DOMÉSTICAS ==
    'home': { label: 'Moradia / Casa', path: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>' },
    'office-building': { label: 'Condomínio / Prédio', path: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>' },
    'lightning-bolt': { label: 'Conta de Luz / Energia', path: '<path d="M11 21l-1-7H5l10-12 1 7h5L11 21z"/>' },
    'water': { label: 'Conta de Água', path: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>' },
    'fire': { label: 'Gás / Aquecimento', path: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>' },
    'wifi': { label: 'Internet / Wi-Fi', path: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/>' },
    'phone': { label: 'Telefone / Celular', path: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>' },
    'trash': { label: 'Lixo / Taxas de Descarte', path: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>' },
    'key': { label: 'Aluguel / Chaves', path: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>' },
    'shield-check': { label: 'Seguro Residencial', path: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>' },

    // == TRANSPORTES E VEÍCULOS ==
    'car': { label: 'Carro / Combustível', path: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>' },
    'truck': { label: 'Caminhão / Frete', path: '<path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><path d="M9 18h6"/><circle cx="17" cy="18" r="2"/>' },
    'motorcycle': { label: 'Moto / Motocicleta', path: '<path d="m10.5 9.5 5 1.5M16 11l-2.5-4.5M13.5 6.5h3.5M2 13h1M11 11.5l1.5-3.5M15 17.5 13 14M20 12.5v1M6.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/>' },
    'airplane': { label: 'Avião / Passagens', path: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-.9-.5-2.9 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-1.3 2.6c-.2.4-.1 1 .3 1.3L9 14l-4 4-3-1-2 2 5 2 2 5 2-2-1-3 4-4 3.2 6.3c.3.4.9.5 1.3.3l2.6-1.3c.5-.2.8-.7.7-1.1Z"/>' },
    'bus': { label: 'Ônibus / Transporte Público', path: '<path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>' },
    'train': { label: 'Trem / Metrô', path: '<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/><path d="M8 14h.01"/><path d="M16 14h.01"/>' },
    'map': { label: 'Mapa / Viagem', path: '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/>' },
    'map-pin': { label: 'Local / Destino', path: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>' },
    'globe': { label: 'Mundo / Internacional', path: '<circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/>' },
    'gas-station': { label: 'Posto / Pedágio', path: '<path d="M3 22V6c0-1.1.9-2 2-2h4a2 2 0 0 1 2 2v16"/><path d="M11 22H3"/><path d="M14 10v4"/><path d="M11 13h5.5a2.5 2.5 0 0 0 0-5H14"/><path d="M7 10h.01"/><path d="M7 14h.01"/>' },
    'bicycle': { label: 'Bicicleta / Ciclovia', path: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 11.5V14l-3-3 4-3 2 3h2"/><path d="M12 17.5 10 14"/>' },

    // == SAÚDE, PETS E CUIDADO PESSOAL ==
    'heart': { label: 'Saúde / Bem-Estar', path: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>' },
    'plus-circle': { label: 'Clínica / Pronto Socorro', path: '<circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>' },
    'stethoscope': { label: 'Médico / Consulta', path: '<path d="M11 2v2"/><path d="M5 2v2"/><path d="M5 3H6a2 2 0 0 1 2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 1 2-2h1"/><path d="M8 15a6 6 0 0 0 12 0v-3"/><circle cx="11" cy="19" r="2"/>' },
    'pill': { label: 'Farmácia / Remédios', path: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/>' },
    'tooth': { label: 'Dentista / Ortodontia', path: '<path d="M12 22s-2.8-1-3.6-2.5c-.8-1.5-.7-4.1-1-6.1-.2-1.7-1.1-2.9-2.5-3.6C3.5 9.1 2.2 7.7 2 5.8 1.8 3.5 3.5 2 5.5 2c1.7 0 3.2 1.1 3.8 2.7.3.7.8 1.3 1.5 1.3H13.2c.7 0 1.2-.6 1.5-1.3.6-1.6 2.1-2.7 3.8-2.7 2 0 3.7 1.5 3.5 3.8-.2 1.9-1.5 3.3-2.9 4-1.4.7-2.3 1.9-2.5 3.6-.3 2-.2 4.6-1 6.1C14.8 21 12 22 12 22Z"/>' },
    'eye': { label: 'Oftalmologista / Óculos', path: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>' },
    'scissors': { label: 'Cabeleireiro / Estética', path: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" x2="8.12" y1="4" y2="15.88"/><line x1="14.47" x2="20" y1="14.48" y2="20"/><line x1="8.12" x2="12" y1="8.12" y2="12"/>' },
    'sparkles': { label: 'Beleza / Limpeza', path: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>' },
    'fitness': { label: 'Academia / Esporte', path: '<path d="M18 20V4"/><path d="M6 20V4"/><path d="m14 14-4-4"/><path d="m6 16 6-6 6 6"/><path d="M6 10v4"/><path d="M18 10v4"/>' },
    'paw': { label: 'Pet Shop / Veterinário', path: '<path d="M12 5c.67 0 1.25.43 1.83 1.16.59.74 1.17 1.84 1.17 3.34 0 2.5-1.34 4.5-3 4.5s-3-2-3-4.5c0-1.5.58-2.6 1.17-3.34C10.75 5.43 11.33 5 12 5z"/><path d="M18.8 8.6c.2.6.4 1.3.4 2.1 0 2-1 3.8-2.3 4.5-1.2.6-2.5.4-3.3-.3-.8-.7-1.1-1.8-1.1-3.8 0-1 .1-1.8.3-2.5.2-.6.5-1.1-.9-1.4-.8-.6 1.9-.4 2.7.2.5.4-.9.9-1 1.5z"/><path d="M5.2 8.6c-.2.6-.4 1.3-.4 2.1 0 2 1 3.8 2.3 4.5 1.2.6 2.5.4 3.3-.3.8-.7 1.1-1.8 1.1-3.8 0-1-.1-1.8-.3-2.5-.2-.6-.5-1.1-.9-1.4-.8-.6-1.9-.4-2.7.2-.5.4-.9.9-1 1.5z"/><path d="M12 21c-2.3 0-4.4-.7-6-2-1.5-1.3-2.5-3-2.5-4.8 0-2.2 1.3-4.2 3.3-5.2C8 8.4 9.5 8 11 8h2c1.5 0 3 .4 4.2 1 2 1 3.3 3 3.3 5.2 0 1.8-1 3.5-2.5 4.8-1.6 1.3-3.7 2-6 2z"/>' },

    // == CONTAS, FINANÇAS E NEGÓCIOS ==
    'cash': { label: 'Dinheiro / Notas', path: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>' },
    'currency-dollar': { label: 'Renda / Pagamento', path: '<path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>' },
    'credit-card': { label: 'Cartão de Crédito', path: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>' },
    'wallet': { label: 'Carteira / Despesas', path: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>' },
    'piggy-bank': { label: 'Poupança / Guardar Dinheiro', path: '<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h.01"/>' },
    'chart-pie': { label: 'Porcentagem / Investimento', path: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>' },
    'chart-bar': { label: 'Estatísticas / Gráficos', path: '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>' },
    'trending-up': { label: 'Lucro / Alta', path: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>' },
    'trending-down': { label: 'Prejuízo / Baixa', path: '<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>' },
    'receipt-tax': { label: 'Impostos / Tributos', path: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17V7"/>' },
    'calculator': { label: 'Calculadora / Contabilidade', path: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>' },
    'briefcase': { label: 'Maleta / Trabalho Emprego', path: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>' },
    'scale': { label: 'Justiça / Leis e Advogado', path: '<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>' },
    'document-text': { label: 'Contrato / Documento', path: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>' },

    // == LAZER, EVENTOS, MÍDIA E ESTUDOS ==
    'film': { label: 'Cinema / Filmes', path: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 7h4"/><path d="M3 12h18"/><path d="M3 17h4"/><path d="M17 7h4"/><path d="M17 17h4"/>' },
    'tv': { label: 'TV / Streaming', path: '<rect width="20" height="15" x="2" y="7" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>' },
    'music-note': { label: 'Música / Shows', path: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>' },
    'ticket': { label: 'Ingressos / Parques', path: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>' },
    'camera': { label: 'Fotografia / Câmera', path: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' },
    'video-camera': { label: 'Vídeo / Edição', path: '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>' },
    'book': { label: 'Livros / Revistas', path: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>' },
    'book-open': { label: 'Estudos / Leitura', path: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>' },
    'academic-cap': { label: 'Faculdade / Escola / Formatura', path: '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>' },
    'puzzle': { label: 'Jogos / Console', path: '<rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 12h4"/><path d="M8 10v4"/><path d="M15 13h.01"/><path d="M18 11h.01"/>' },
    'color-swatch': { label: 'Artes / Pintura / Design', path: '<path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/>' },

    // == TECNOLOGIA, GADGETS E FERRAMENTAS ==
    'device-mobile': { label: 'Celular / Assinatura de Telefone', path: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>' },
    'computer-desktop': { label: 'Computador / Peças / Setup', path: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>' },
    'printer': { label: 'Impressora / Gráfica', path: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>' },
    'server': { label: 'Servidor / Hospedagem / Nuvem', path: '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>' },
    'database': { label: 'Banco de Dados / Softwares', path: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>' },
    'cloud': { label: 'Nuvem / Google Drive / iCloud', path: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>' },
    'download': { label: 'Download / Baixar Compras', path: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>' },
    'cog': { label: 'Engrenagem / Manutenção', path: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>' },
    'wrench': { label: 'Chave Inglesa / Conserto', path: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>' },
    'hammer': { label: 'Martelo / Obra / Marcenaria', path: '<path d="m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16 4.6V3.86a2.92 2.92 0 0 0-.86-2.25L13.89.36l-4.25 4.25c-.8.8-1.25 1.9-1.25 3v.86L6.14 10.7c-.4.4-.6.9-.6 1.5v.8c0 .5.2 1.1.6 1.5l2.4 2.4c.4.4.9.6 1.5.6h.8c.6 0 1.1-.2 1.5-.6l2.26-2.26v-.86c0-.85.33-1.65.93-2.25l1.25-1.25Z"/>' },

    // == COMUNICAÇÃO, EVENTOS E GERAL ==
    'mail': { label: 'Correios / E-mail / Carta', path: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>' },
    'chat': { label: 'Bate-papo / Chat / Atendimento', path: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    'paper-airplane': { label: 'Envio / Mensagem Enviada', path: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>' },
    'speakerphone': { label: 'Megafone / Anúncio / Marketing', path: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>' },
    'microphone': { label: 'Microfone / Podcast / Voz', path: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>' },
    'user': { label: 'Usuário / Cliente / Pessoa', path: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
    'user-group': { label: 'Comunidade / Sócios / Grupo', path: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>' },
    'clock': { label: 'Relógio / Mensalidade / Tempo', path: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
    'calendar': { label: 'Calendário / Evento / Data', path: '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>' },
    'flag': { label: 'Bandeira / Meta / Objetivo', path: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>' },
    'cube': { label: 'Cubo / Caixa / Encomenda', path: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" x2="12" y1="22.08" y2="12"/>' },
    'sun': { label: 'Sol / Lazer Diurno / Clima', path: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>' },
    'moon': { label: 'Lua / Lazer Noturno / Balada', path: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>' },
    'star': { label: 'Estrela / Favorito / Prêmio', path: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>' },
    'tag': { label: 'Etiqueta / Categoria Genérica', path: '<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/>' }
};

const CATEGORIAS_PADRAO = [
    { id: "c1", nome: "Moradia", icon: "home", subcategorias: ["Aluguel", "Condomínio", "Energia", "Água", "Internet"] },
    { id: "c2", nome: "Alimentação", icon: "shopping-bag", subcategorias: ["Supermercado", "Delivery", "Restaurantes", "Padaria"] },
    { id: "c3", nome: "Transporte", icon: "car", subcategorias: ["Combustível", "Aplicativo", "Transporte Público", "Manutenção"] },
    { id: "c4", nome: "Saúde", icon: "heart", subcategorias: ["Convênio", "Farmácia", "Consultas", "Exames"] },
    { id: "c5", nome: "Educação", icon: "book", subcategorias: ["Faculdade", "Cursos", "Material Escolar"] },
    { id: "c6", nome: "Lazer", icon: "film", subcategorias: ["Assinaturas", "Saídas", "Viagens", "Hobbies"] },
    { id: "c7", nome: "Pagto. Dívida", icon: "credit-card", subcategorias: ["Cartão de Crédito", "Empréstimo", "Financiamento"] },
    { id: "c8", nome: "Renda Extra", icon: "currency-dollar", subcategorias: ["Freelance", "Vendas", "Rendimentos"] },
    { id: "c9", nome: "Outros", icon: "tag", subcategorias: ["Pets", "Presentes", "Impostos", "Taxas Bancárias"] }
];

let categoriasGlobais = [];
const BANCOS = {
    'itau': { id: 'itau', nome: 'Itaú', domain: 'itau.com.br' },
    'nubank': { id: 'nubank', nome: 'Nubank', domain: 'nubank.com.br', customImg: 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Nubank_logo_2021.svg' },
    'inter': { id: 'inter', nome: 'Inter', domain: 'bancointer.com.br', customImg: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Bancointer_oficial.png' },
    // bgFixo: envolve o PNG em selo branco (funde no light, destaca no dark).
    'mp': { id: 'mp', nome: 'Mercado Pago', domain: 'mercadopago.com.br', customImg: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Mercado_Pago_logo.svg' },
    'bradesco': { id: 'bradesco', nome: 'Bradesco', domain: 'bradesco.com.br' },
    'santander': { id: 'santander', nome: 'Santander', domain: 'santander.com.br' },
    'bb': { id: 'bb', nome: 'B. do Brasil', domain: 'bb.com.br' },
    'caixa': { id: 'caixa', nome: 'Caixa', domain: 'caixa.gov.br', customImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Caixa_Econ%C3%B4mica_Federal_logo.svg/512px-Caixa_Econ%C3%B4mica_Federal_logo.svg.png' },
    // bgFixoDark: fundo branco só no dark (logo escuro sumiria no fundo escuro).
    'c6': { id: 'c6', nome: 'C6 Bank', domain: 'c6bank.com.br', customImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/C6_Bank_logo.svg/512px-C6_Bank_logo.svg.png', bgFixoDark: '#ffffff' },
    'sicredi': { id: 'sicredi', nome: 'Sicredi', domain: 'sicredi.com.br', customImg: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Sicredi_logo.svg/512px-Sicredi_logo.svg.png' },
    'carteira': { id: 'carteira', nome: 'Carteira Física', isIcon: true, svg: '<svg class="w-full h-full text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>' },
    'outros': { id: 'outros', nome: 'Outra Conta', isIcon: true, svg: '<svg class="w-full h-full text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>' }
};

function renderBankLogo(b) {
    // Logo sem moldura — tamanho natural, limitado ao container.

    // 1. Ícones SVG genéricos (Carteira, Outros) — herdam a cor do próprio SVG
    if (b.isIcon) {
        return `<div class="w-full h-full flex items-center justify-center">${b.svg}</div>`;
    }

    // 2. SVG Nativo injetado direto no código
    if (b.isRawSvg) {
        return `<div class="w-full h-full flex items-center justify-center">${b.svg}</div>`;
    }

    // 3. Imagens externas (Clearbit, custom ou fallback Google)
    const imgSource = b.customImg ? b.customImg : `https://logo.clearbit.com/${b.domain}`;
    const classeInversao = b.logoEscuro ? ' logo-invert-light' : '';

    // no-referrer evita bloqueio de hotlink em logodownload.org.
    const imgTag = `<img src="${imgSource}" referrerpolicy="no-referrer" onload="this.style.opacity='1'" onerror="this.onerror=null; this.src='https://www.google.com/s2/favicons?domain=${b.domain}&sz=128';" alt="${b.nome}" style="opacity:0; transition: opacity 0.25s ease;" class="w-full h-full object-contain${classeInversao}">`;

    // PNG com fundo branco embutido → wrapper com bgFixo + cantos arredondados.
    if (b.bgFixo) {
        return `<div class="w-full h-full rounded-md overflow-hidden flex items-center justify-center" style="background-color: ${b.bgFixo};">${imgTag}</div>`;
    }

    // Fundo condicional por tema: cor só no dark mode.
    if (b.bgFixoDark) {
        return `<div class="w-full h-full rounded-md overflow-hidden flex items-center justify-center banco-bg-fixo-dark" style="--bg-fixo-cor: ${b.bgFixoDark};">${imgTag}</div>`;
    }

    return imgTag;
}

function getSVGIcon(name, classes = "w-5 h-5") {
    const iconObj = ICONES_SVG[name] || ICONES_SVG['tag'];
    const path = iconObj.path || iconObj;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="${classes}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

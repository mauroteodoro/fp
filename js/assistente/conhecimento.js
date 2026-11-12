// Assistente: base de conhecimento
'use strict';

// ═══════════════════════════════════════════════════════════════
// 📚 BASE DE CONHECIMENTO — Dúvidas sobre o app
// ═══════════════════════════════════════════════════════════════
// Cada tópico tem 3 partes:
//   • chaves  → palavras/frases que disparam este tópico
//   • titulo  → cabeçalho da resposta
//   • corpo   → HTML conciso, sem crases (template literal!)
//   • sug     → botões de follow-up (opcional)
//
// O motor de busca escolhe o tópico que tiver a MAIOR soma de
// comprimentos das chaves casadas — assim "saldo do salário"
// (16 chars) vence "saldo" (5) quando ambos casam.
//
// Expandir = adicionar um objeto nesta lista. Nada mais.
const AS_KB_APP = [
    // ═══════════ RESUMO ═══════════
    {
        chaves: ['saldo projetado', 'saldo do mês', 'saldo total do mês', 'saldos projetados'],
        titulo: '📊 Saldos Projetados',
        corpo: '<p>É a <strong>previsão</strong> de quanto você terá no fim do mês. Soma o salário líquido + vale + receitas que compõem o resumo, menos todas as despesas (pagas e pendentes).</p><p class="mt-2">O <strong>Saldo Total</strong> é sempre a soma do Saldo do Salário + Saldo do Vale. Cada card tem um botão (i) com o cálculo detalhado.</p>',
        sug: [
            { txt: 'Qual meu saldo?', q: 'Qual meu saldo projetado?' },
            { txt: 'Compor projeção', q: 'O que é Compor Projeção do Mês?' }
        ]
    },
    {
        chaves: ['saldo do salário', 'card do salário', 'saldo salario'],
        titulo: '💰 Saldo do Salário',
        corpo: '<p>Mostra quanto sobra do <strong>salário líquido</strong> depois de pagar as despesas do ciclo do Salário.</p><p class="mt-2">Uma despesa entra nesse ciclo quando o vencimento é <strong>antes do dia 20 e antes do 5º dia útil</strong> — ou quando você fixa a Origem como "Salário" no lançamento.</p>',
        sug: [{ txt: 'Saldo do Vale', q: 'O que é o Saldo do Vale?' }]
    },
    {
        chaves: ['saldo do vale', 'card do vale'],
        titulo: '💵 Saldo do Vale',
        corpo: '<p>Mostra quanto sobra do <strong>vale adiantamento</strong> (os ~40% creditados no dia 20) depois de pagar as despesas do ciclo do Vale.</p><p class="mt-2">Uma despesa entra aqui quando o vencimento é <strong>no dia 20 ou depois</strong>, ou quando a Origem foi fixada como "Vale".</p>',
        sug: [{ txt: 'Saldo do Salário', q: 'O que é o Saldo do Salário?' }]
    },
    {
        chaves: ['barra de consumo', 'barra verde', 'barra vermelha', 'barra de gastos'],
        titulo: '📈 Barra de consumo',
        corpo: '<p>Mede quanto do disponível do mês já foi gasto. A cor muda conforme o percentual:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Verde</strong> até 70% — tranquilo</li><li><strong>Âmbar</strong> de 70% a 90% — atenção</li><li><strong>Vermelho</strong> acima de 90% — apertado</li></ul>',
        sug: [{ txt: 'Saldo projetado', q: 'Qual meu saldo projetado?' }]
    },
    {
        chaves: ['ajuste manual', 'ajustar saldo', 'reajustar saldo', 'ajuste silencioso'],
        titulo: '🔧 Ajuste de Saldo',
        corpo: '<p>Você pode reajustar o saldo de qualquer card ou conta para um valor fixo. Existem dois modos:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Ajuste silencioso</strong> (padrão) — move o saldo sem criar histórico no Extrato.</li><li><strong>Ajuste com motivo</strong> — cria um lançamento no Extrato com a descrição informada.</li></ul><p class="mt-2">No card do Salário há o botão <strong>Restaurar</strong> para voltar ao cálculo automático.</p>',
        sug: [{ txt: 'Como ocultar valores?', q: 'Como ocultar os valores?' }]
    },
    {
        chaves: ['saldos das contas', 'saldo das contas', 'saldo real'],
        titulo: '🏦 Saldos das Contas',
        corpo: '<p>Mostra o saldo <strong>real</strong> de cada conta agora — só considera movimentações <strong>já pagas</strong>.</p><p class="mt-2">É diferente do Saldo Projetado, que inclui pendentes. Aqui é "quanto tem na conta AGORA".</p>',
        sug: [{ txt: 'Como criar conta?', q: 'Como crio uma nova conta?' }]
    },
    // ═══════════ EXTRATO / LANÇAMENTOS ═══════════
    {
        chaves: ['como lançar', 'como lanço', 'criar despesa', 'criar receita', 'nova despesa', 'nova receita', 'fazer lançamento'],
        titulo: '✏️ Como lançar',
        corpo: '<p>Toque no <strong>+</strong> do header (ou no + Nova ação) e escolha <strong>Despesa</strong> ou <strong>Receita</strong>. Preencha:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Descrição, Valor, Repetição</li><li>Data de lançamento e vencimento</li><li>Categoria, Conta, Status</li></ul><p class="mt-2">O botão <strong>Mais opções</strong> abre data de efetivação, observações e anexo.</p>',
        sug: [{ txt: 'Tipos de lançamento', q: 'Quais são os tipos de lançamento?' }]
    },
    {
        chaves: ['tipos de lançamento', 'à vista', 'a prazo', 'recorrente', 'parcelado', 'repetição'],
        titulo: '🔁 Tipos de lançamento',
        corpo: '<p>São três, definidos no campo <strong>Repetição</strong>:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Não recorrente (À Vista)</strong> — um único lançamento.</li><li><strong>Parcelar (A Prazo)</strong> — divide em N parcelas, cada uma com vencimento próprio.</li><li><strong>Fixa mensal (Recorrente)</strong> — repete todo mês até você encerrar.</li></ul>',
        sug: [{ txt: 'Encerrar recorrência', q: 'Como encerro uma recorrência?' }]
    },
    {
        chaves: ['pendente', 'efetivada', 'efetivado', 'status', 'pago'],
        titulo: '✅ Pendente vs Efetivada',
        corpo: '<p>Status de cada lançamento:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Efetivada</strong> (✓ verde) — já saiu/entrou do dinheiro. Conta no saldo real das contas.</li><li><strong>Pendente</strong> (⏱ âmbar) — ainda vai acontecer. Entra na projeção, mas NÃO no saldo das contas.</li></ul><p class="mt-2">Toque no ícone (✓ ou ⏱) para alternar o status.</p>',
        sug: [{ txt: 'Saldo das Contas', q: 'O que é o Saldo das Contas?' }]
    },
    {
        chaves: ['origem', 'compor projeção', 'compor resumo'],
        titulo: '🎯 Origem e Compor Projeção',
        corpo: '<p>A <strong>Origem</strong> define de qual bolso a despesa sai:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Auto</strong> — o app decide pela data do vencimento</li><li><strong>Salário</strong> — antes do dia 20</li><li><strong>Vale</strong> — no dia 20 ou depois</li></ul><p class="mt-2"><strong>Compor Projeção</strong> (só para receitas): se ligado, a receita entra no Saldo Projetado do mês. Desligue se a simulação já cobre esse valor.</p>',
        sug: [{ txt: 'Como funciona o Salário?', q: 'O que é o Saldo do Salário?' }]
    },
    {
        chaves: ['editar lançamento', 'editar despesa', 'editar receita', 'alterar valor'],
        titulo: '✏️ Editar lançamento',
        corpo: '<p>No Extrato, toque no menu <strong>⋮</strong> do lançamento → <strong>Editar</strong>. Você pode alterar descrição, valor, categoria, vencimento, observações e anexo.</p><p class="mt-2">Em lançamentos <strong>parcelados</strong>, você escolhe se a mudança vale só nesta parcela ou em todas as futuras.</p>',
        sug: [{ txt: 'Apagar lançamento', q: 'Como apago um lançamento?' }]
    },
    {
        chaves: ['apagar lançamento', 'deletar lançamento', 'excluir lançamento', 'remover'],
        titulo: '🗑 Apagar lançamento',
        corpo: '<p>No Extrato, kebab (⋮) → <strong>Apagar</strong>. Em parcelados, escolha se apaga <strong>só esta parcela</strong> ou <strong>a compra inteira</strong>.</p><p class="mt-2">Em recorrentes, você pode apagar só o mês ou encerrar a série.</p>',
        sug: [{ txt: 'Encerrar recorrência', q: 'Como encerro uma recorrência?' }]
    },
    {
        chaves: ['encerrar recorrência', 'parar recorrência', 'encerrar recorrência', 'acabar com fixa'],
        titulo: '🔚 Encerrar recorrência',
        corpo: '<p>No Extrato, kebab (⋮) de uma cobrança recorrente → <strong>Encerrar Recorrência</strong>. O lançamento para de aparecer a partir do mês seguinte — os meses anteriores ficam preservados.</p><p class="mt-2">Se quiser apagar tudo (passado e futuro), use <strong>Apagar → Compra inteira</strong>.</p>',
        sug: [{ txt: 'Tipos de lançamento', q: 'Quais são os tipos de lançamento?' }]
    },
    {
        chaves: ['chips', 'filtro do extrato', 'filtrar extrato', 'buscar extrato'],
        titulo: '🔎 Filtros do Extrato',
        corpo: '<p>No topo do Extrato há 4 chips: <strong>Todas</strong>, <strong>Receitas</strong>, <strong>Despesas</strong> e <strong>Pendentes</strong>. Toque para filtrar a lista na hora.</p><p class="mt-2">A <strong>busca</strong> (lupa) pesquisa por descrição, categoria, observação e valor.</p>',
        sug: [{ txt: 'Como lançar', q: 'Como lanço uma despesa?' }]
    },
    // ═══════════ CONTAS ═══════════
    {
        chaves: ['criar conta', 'nova conta', 'adicionar conta'],
        titulo: '➕ Criar conta',
        corpo: '<p>Vá em <strong>Contas</strong> → <strong>Gerenciar</strong> → <strong>Nova Conta</strong>. Defina:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Nome (ex: Nubank, Carteira)</li><li>Saldo inicial</li><li>Ícone do banco</li></ul>',
        sug: [{ txt: 'Reordenar contas', q: 'Como reordeno minhas contas?' }]
    },
    {
        chaves: ['reordenar contas', 'mudar ordem contas', 'arrastar conta'],
        titulo: '↔️ Reordenar contas',
        corpo: '<p>No carrossel de contas (aba <strong>Contas</strong> ou <strong>Resumo</strong>), <strong>segure e arraste</strong> um card para a posição desejada. A nova ordem é salva automaticamente.</p><p class="mt-2">No mobile, um toque longo (400ms) ativa o modo arraste.</p>',
        sug: [{ txt: 'Criar conta', q: 'Como crio uma nova conta?' }]
    },
    // ═══════════ TRANSFERÊNCIAS ═══════════
    {
        chaves: ['transferência', 'transferencia', 'transferir', 'mover dinheiro'],
        titulo: '🔄 Transferência entre contas',
        corpo: '<p>Toque no <strong>+ → Transferência</strong>. Escolha origem, destino, valor e vencimento.</p><p class="mt-2">Em <strong>Mais opções</strong> você define data de lançamento, data de efetivação e o status. Transferências <strong>pendentes não afetam os saldos</strong> até serem efetivadas.</p>',
        sug: [{ txt: 'Transferências pendentes', q: 'Tenho transferências pendentes?' }]
    },
    // ═══════════ SIMULADOR ═══════════
    {
        chaves: ['simulador', 'projeção salarial', 'simular salário', 'simular salario'],
        titulo: '🧮 Simulador',
        corpo: '<p>Calcula seu <strong>salário líquido</strong> do mês (CLT ou PJ), com INSS, IRRF, horas extras, DSR, férias, 13º e descontos avulsos.</p><p class="mt-2">O resultado alimenta o <strong>Valor Base</strong> dos cards de Salário e Vale no Resumo.</p>',
        sug: [{ txt: 'O que é INSS?', q: 'O que é INSS?' }, { txt: 'Salvar projeção', q: 'Como salvar a projeção?' }]
    },
    {
        chaves: ['inss', 'previdência', 'previdencia'],
        titulo: '📋 INSS',
        corpo: '<p>Contribuição à Previdência Social, calculada <strong>por faixas progressivas</strong> sobre o salário bruto. Cada alíquota (7,5% / 9% / 12% / 14%) incide só sobre a parcela que cai na faixa.</p><p class="mt-2">Existe um teto — acima dele, nada é contribuído.</p>',
        sug: [{ txt: 'O que é IRRF?', q: 'O que é IRRF?' }]
    },
    {
        chaves: ['irrf', 'imposto de renda'],
        titulo: '📋 IRRF',
        corpo: '<p>Imposto de Renda Retido na Fonte. Calculado sobre a base tributável (bruto − INSS − dependentes), seguindo a <strong>tabela progressiva</strong>.</p><p class="mt-2">O app já aplica o <strong>redutor 2026</strong> — que zera o imposto para rendas menores e reduz gradualmente até R$ 7.350.</p>',
        sug: [{ txt: 'O que é INSS?', q: 'O que é INSS?' }]
    },
    {
        chaves: ['dsr', 'descanso semanal'],
        titulo: '📋 DSR',
        corpo: '<p>Descanso Semanal Remunerado. Quando você faz horas extras, o DSR <strong>também incide sobre elas</strong> — é um valor adicional calculado a partir do total de extras do mês, distribuído pelos dias úteis e repassado aos dias de descanso.</p>',
        sug: [{ txt: 'Horas extras', q: 'Como funcionam as horas extras?' }]
    },
    {
        chaves: ['férias', 'ferias', 'tirar férias'],
        titulo: '🏖️ Férias',
        corpo: '<p>No Simulador, ative <strong>Férias no Período?</strong>, informe os dias e o dia de início. O app calcula:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Férias (dias × salário diário)</li><li>1/3 Constitucional</li><li>INSS e IRRF sobre o total</li></ul><p class="mt-2">O <strong>mês seguinte</strong> recebe salário proporcional aos dias trabalhados.</p>',
        sug: [{ txt: 'Quando tiro férias?', q: 'Quando tiro férias?' }]
    },
    {
        chaves: ['13º', 'decimo terceiro', 'décimo terceiro', 'gratificação natalina'],
        titulo: '🎁 13º Salário',
        corpo: '<p>Pago em duas parcelas:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>1ª parcela</strong> até 30/nov — sem desconto</li><li><strong>2ª parcela</strong> até 20/dez — com INSS + IRRF</li></ul><p class="mt-2">No Resumo, o líquido do 13º é direcionado ao card do Vale (Nov) ou do Salário (Dez), conforme o calendário de pagamento.</p>',
        sug: [{ txt: 'Quanto vou receber de 13º?', q: 'Quanto vou receber de 13º?' }]
    },
    {
        chaves: ['horas extras', 'hora extra', 'adicional'],
        titulo: '⏰ Horas Extras',
        corpo: '<p>Preencha no Simulador a quantidade de <strong>horas extras 50%</strong> e <strong>100%</strong>. O app calcula o valor-hora + adicional e aplica o DSR sobre o total.</p>',
        sug: [{ txt: 'O que é DSR?', q: 'O que é DSR?' }]
    },
    {
        chaves: ['salvar projeção', 'salvar projecao', 'gravar simulação', 'aplicar folha'],
        titulo: '💾 Salvar Projeção',
        corpo: '<p>No Simulador, após ajustar os valores, toque em <strong>Salvar Projeção</strong>. O cálculo passa a alimentar os cards do Resumo do mês correspondente.</p><p class="mt-2">O botão pulsa quando há alterações não salvas.</p>',
        sug: [{ txt: 'Zerar simulação', q: 'Como zero a simulação?' }]
    },
    {
        chaves: ['zerar simulação', 'limpar simulação', 'resetar simulação'],
        titulo: '🗑 Zerar Simulação',
        corpo: '<p>No topo do Simulador, toque no ícone da lixeira. Os valores do mês voltam a espelhar apenas o perfil (padrões do simulador).</p>',
        sug: [{ txt: 'Salvar projeção', q: 'Como salvar a projeção?' }]
    },
    {
        chaves: ['recibo pdf', 'exportar recibo', 'imprimir recibo'],
        titulo: '📄 Recibo em PDF',
        corpo: '<p>No topo do card <strong>Recibo de Pagamento</strong>, toque no ícone de download. Abre uma versão formatada para impressão — de lá você pode salvar como PDF.</p>',
        sug: [{ txt: 'Simulador', q: 'Como funciona o Simulador?' }]
    },
    // ═══════════ RELATÓRIOS ═══════════
    {
        chaves: ['relatórios', 'relatorios', 'gerar relatório', 'gerar relatorio'],
        titulo: '📊 Relatórios',
        corpo: '<p>Escolha os filtros (Período, Natureza, Conta, Categoria, Origem) e toque em <strong>Gerar Relatório</strong>. A lista mostra tudo que casa com os filtros, com totais consolidados no topo.</p>',
        sug: [{ txt: 'Filtrar por período', q: 'Como filtro por período?' }]
    },
    // ═══════════ CONFIGURAÇÕES ═══════════
    {
        chaves: ['backup', 'checkpoint', 'exportar dados', 'salvar backup'],
        titulo: '💾 Backups',
        corpo: '<p>Em <strong>Configurações → Backups</strong> você cria checkpoints manuais. O app também cria <strong>automaticamente</strong> a cada 24h. São guardados até 10 — os mais antigos saem.</p><p class="mt-2">Também dá para <strong>exportar</strong> um JSON em Extrato → ícone de download.</p>',
        sug: [{ txt: 'Importar backup', q: 'Como importo um backup?' }]
    },
    {
        chaves: ['importar backup', 'restaurar backup', 'restaurar checkpoint'],
        titulo: '📥 Importar / Restaurar',
        corpo: '<p><strong>Importar</strong>: Extrato → ícone de upload → selecione o JSON. Substitui todos os dados atuais.</p><p class="mt-2"><strong>Restaurar checkpoint</strong>: Configurações → Backups → Restaurar. Um backup de segurança é criado antes — você pode reverter.</p>',
        sug: [{ txt: 'Como faço backup?', q: 'Como faço um backup?' }]
    },
    {
        chaves: ['tema', 'modo escuro', 'modo claro', 'dark mode'],
        titulo: '🌓 Tema Claro/Escuro',
        corpo: '<p>Em <strong>Configurações → Aparência</strong>, escolha Claro ou Escuro. A preferência sincroniza com a nuvem e é aplicada automaticamente em todos os dispositivos.</p>',
        sug: [{ txt: 'Ocultar valores', q: 'Como oculto os valores?' }]
    },
    {
        chaves: ['ocultar valores', 'esconder saldos', 'botão do olho', 'olho'],
        titulo: '👁 Ocultar valores',
        corpo: '<p>No header, o botão do <strong>olho</strong> substitui todos os valores por bolinhas (••••). Excelente para mostrar o app para alguém sem revelar saldos.</p><p class="mt-2">Ao mostrar de novo, as barras de consumo crescem lentamente até o valor real.</p>',
        sug: [{ txt: 'Barra de consumo', q: 'O que é a barra de consumo?' }]
    },
    {
        chaves: ['regime clt', 'regime pj', 'autônomo', 'clt', 'pj'],
        titulo: '💼 Regime CLT / PJ',
        corpo: '<p>Em <strong>Configurações → Regime</strong>. CLT aplica INSS, IRRF, DSR, férias e 13º. PJ/Autônomo substitui os descontos por uma calculadora de gastos mensais.</p>',
        sug: [{ txt: 'O que é INSS?', q: 'O que é INSS?' }]
    },
    {
        chaves: ['zerar sistema', 'hard reset', 'apagar tudo', 'limpar dados'],
        titulo: '⚠️ Zerar Sistema',
        corpo: '<p>Em <strong>Configurações → Zerar Sistema</strong>. Apaga lançamentos, categorias personalizadas e contas. Um checkpoint automático é criado antes — você pode restaurar depois.</p>',
        sug: [{ txt: 'Como faço backup?', q: 'Como faço um backup?' }]
    },
    {
        chaves: ['alterar nome', 'mudar nome', 'nome do perfil'],
        titulo: '👤 Nome do perfil',
        corpo: '<p>Em <strong>Configurações → Nome no Sistema</strong>. O nome aparece no header e nas saudações da Assistente.</p>',
        sug: [{ txt: 'Tema', q: 'Como mudo o tema?' }]
    },
    // ═══════════ ASSISTENTE ═══════════
    {
        chaves: ['o que você faz', 'o que voce faz', 'o que sabe fazer', 'suas funções', 'ajuda do assistente'],
        titulo: '🤖 O que a Assistente faz',
        corpo: '<p>Respondo perguntas sobre seus dados e sobre o app. Cobre:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Saldos, gastos, receitas, transferências</li><li>Salário, vale, 13º, férias, descontos</li><li>Planejamento de metas e análise de compras</li><li>Como usar qualquer parte do app</li></ul><p class="mt-2">Sou por regras — respondo com seus dados reais, sem inventar.</p>',
        sug: [{ txt: 'Ver tudo', q: 'ajuda' }]
    },
    {
        chaves: ['limpar conversa', 'apagar conversa', 'resetar conversa'],
        titulo: '🗑 Limpar conversa',
        corpo: '<p>No cabeçalho da aba Assistente, o ícone da lixeira limpa o histórico e traz de volta a tela de boas-vindas.</p>',
        sug: [{ txt: 'O que você faz?', q: 'O que a Assistente faz?' }]
    },
    {
        chaves: ['comprar', 'posso comprar', 'consigo comprar', 'análise de compra', 'analise de compra'],
        titulo: '🛒 Análise de Compra',
        corpo: '<p>Pergunte algo como "Consigo comprar um celular de 2000?". Eu analiso à vista e parcelado, considerando seu saldo projetado e a reserva mínima que você quer manter.</p><p class="mt-2">Se não couber este mês, mostro em qual mês futuro cabe.</p>',
        sug: [{ txt: 'Exemplo', q: 'Consigo comprar um celular de 2000?' }]
    },
    {
        chaves: ['meta', 'juntar', 'guardar', 'planejar', 'poupar'],
        titulo: '🎯 Planejar Meta',
        corpo: '<p>Diga algo como <strong>"Quero juntar R$ 5.000,00 até dezembro, sobrando R$ 400,00 por mês"</strong>. Eu calculo:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Plano uniforme (mesmo valor todo mês)</li><li>Plano proporcional (poupa mais quando sobra mais)</li><li>Caminhos alternativos se a meta não fechar</li></ul><p class="mt-2 text-[12px] text-slate-500 dark:text-gray-400">Aceito valores como <em>5000</em>, <em>5.000</em>, <em>R$ 5000</em> ou <em>5 mil</em> — e datas como <em>dezembro</em>, <em>dez/26</em> ou <em>março de 2027</em>.</p>',
        sug: [{ txt: 'Exemplo', q: 'Quero juntar 5000 até dezembro sobrando 400 por mês' }]
    },
    // ═══════════ GERAL ═══════════
    {
        chaves: ['como funciona o app', 'como funciona o aplicativo', 'sobre o app'],
        titulo: '📱 Sobre o app',
        corpo: '<p>App pessoal de finanças com 6 áreas:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Resumo</strong> — visão geral do mês</li><li><strong>Extrato</strong> — lançamentos dia a dia</li><li><strong>Contas</strong> — saldo real por conta</li><li><strong>Relatórios</strong> — consultas filtradas</li><li><strong>Simulador</strong> — cálculo do salário líquido</li><li><strong>Assistente</strong> — eu!</li></ul>',
        sug: [{ txt: 'Saldos Projetados', q: 'O que é o Saldo Projetado?' }]
    },
    // ═══════════ CATEGORIAS E SUBCATEGORIAS ═══════════
    {
        chaves: ['categoria', 'categorias', 'subcategoria', 'subcategorias', 'classificar'],
        titulo: '📁 Categorias e Subcategorias',
        corpo: '<p>Cada lançamento é classificado em uma <strong>categoria</strong> (ex: Moradia) e, opcionalmente, em uma <strong>subcategoria</strong> (ex: Aluguel). Isso permite relatórios precisos por área de gasto.</p><p class="mt-2">O app vem com categorias padrão (Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Pagto. Dívida, Renda Extra, Outros). Você pode criar as suas.</p>',
        sug: [{ txt: 'Criar categoria', q: 'Como crio uma nova categoria?' }]
    },
    {
        chaves: ['criar categoria', 'nova categoria', 'adicionar categoria'],
        titulo: '➕ Criar categoria',
        corpo: '<p>Em <strong>Nova Despesa/Receita → Categoria → Gerenciar</strong>. Toque em <strong>Criar Nova Categoria</strong>, defina nome, ícone e subcategorias.</p><p class="mt-2">A categoria fica disponível imediatamente em todos os lançamentos.</p>',
        sug: [{ txt: 'Apagar categoria', q: 'Como apago uma categoria?' }]
    },
    {
        chaves: ['apagar categoria', 'excluir categoria', 'remover categoria', 'editar categoria'],
        titulo: '✏️ Editar ou apagar categoria',
        corpo: '<p>Em <strong>Gerenciar Categorias</strong>, toque no lápis de qualquer categoria para editar nome, ícone e subcategorias.</p><p class="mt-2">Para excluir, use o botão <strong>Excluir</strong> — os lançamentos antigos NÃO são apagados, mas ficam sem ícone até você reclassificá-los.</p>',
        sug: [{ txt: 'Criar categoria', q: 'Como crio uma nova categoria?' }]
    },
    // ═══════════ DATAS DO LANÇAMENTO ═══════════
    {
        chaves: ['data de lançamento', 'data de vencimento', 'data de efetivação', 'diferença entre datas', 'qual a diferença entre as datas'],
        titulo: '📅 As 3 datas de um lançamento',
        corpo: '<p>Um lançamento pode ter três datas diferentes:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Lançamento</strong> — quando você registrou no app (a data "do papel").</li><li><strong>Vencimento</strong> — quando deve ser pago/recebido. É a data que define o mês em que o lançamento aparece no Extrato e nas projeções.</li><li><strong>Efetivação</strong> — quando o dinheiro realmente saiu/entrou. Só preenchida depois que você marca o lançamento como pago.</li></ul>',
        sug: [{ txt: 'Pendente vs Efetivada', q: 'O que é Pendente e Efetivada?' }]
    },
    // ═══════════ CICLO SALÁRIO x VALE ═══════════
    {
        chaves: ['ciclo do salário', 'ciclo do vale', 'como o app decide a origem', 'auto origem', '5º dia útil', 'quinto dia útil'],
        titulo: '🎯 Como o app decide Salário ou Vale',
        corpo: '<p>Quando você deixa a <strong>Origem em Auto</strong>, o app olha a data do vencimento:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Vencimento <strong>antes do 5º dia útil e antes do dia 20</strong> → ciclo do <strong>Salário</strong></li><li>Vencimento <strong>no dia 20 ou depois</strong> → ciclo do <strong>Vale</strong></li></ul><p class="mt-2">O 5º dia útil é calculado respeitando fins de semana e feriados de <strong>Iperó/Sorocaba</strong>. É a data em que o salário do mês anterior cai — por isso as contas do começo do mês saem do salário.</p>',
        sug: [{ txt: 'Saldo do Salário', q: 'O que é o Saldo do Salário?' }, { txt: 'Saldo do Vale', q: 'O que é o Saldo do Vale?' }]
    },
    {
        chaves: ['feriados', 'feriado', 'dia útil', 'dias úteis'],
        titulo: '🎉 Feriados e dias úteis',
        corpo: '<p>O app conhece os feriados nacionais + os municipais de <strong>Iperó</strong> (Aniversário, Santo Antônio) e <strong>Sorocaba</strong> (Aniversário). Isso é usado para calcular:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>5º dia útil (data do salário)</li><li>DSR sobre horas extras</li><li>Dias úteis e não úteis do mês</li></ul><p class="mt-2">A cidade base fica em <strong>Configurações → Cidade Base</strong>.</p>',
        sug: [{ txt: 'Regime CLT', q: 'O que é o regime CLT?' }]
    },
    // ═══════════ APLICATIVO / PWA ═══════════
    {
        chaves: ['offline', 'sem internet', 'funciona offline', 'pwa', 'instalar', 'app no celular', 'adicionar à tela'],
        titulo: '📲 Instalar como aplicativo',
        corpo: '<p>O app é um <strong>PWA</strong>. Dá para instalá-lo como aplicativo na tela inicial:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>iPhone (Safari)</strong> — Compartilhar → Adicionar à Tela de Início</li><li><strong>Android (Chrome)</strong> — menu (⋮) → Instalar aplicativo</li></ul><p class="mt-2">Os dados ficam em nuvem (Firebase), então sincronizam entre dispositivos automaticamente após login.</p>',
        sug: [{ txt: 'Sincronização', q: 'Como funciona a sincronização?' }]
    },
    // ═══════════ LOGIN / SEGURANÇA ═══════════
    {
        chaves: ['login', 'senha', 'esqueci a senha', 'recuperar senha', 'entrar', 'acesso'],
        titulo: '🔐 Login e senha',
        corpo: '<p>Você entra com <strong>e-mail + senha</strong> cadastrados no Firebase. Se esquecer:</p><ol class="list-decimal pl-5 mt-2 space-y-1"><li>Na tela de login, digite seu e-mail</li><li>Toque em <strong>Esqueceu a senha?</strong></li><li>Você recebe um link no e-mail para criar uma nova</li></ol>',
        sug: [{ txt: 'Sincronização', q: 'Como funciona a sincronização?' }]
    },
    {
        chaves: ['segurança', 'seguro', 'privacidade', 'meus dados', 'compartilhar app'],
        titulo: '🔒 Privacidade e segurança',
        corpo: '<p>Seus dados vivem em nuvem privada (Firebase) da SUA conta. Ninguém mais acessa sem o login.</p><p class="mt-2">Se for mostrar o app para alguém, use o botão do <strong>olho</strong> para ocultar todos os valores — não é preciso esconder a tela.</p>',
        sug: [{ txt: 'Ocultar valores', q: 'Como oculto os valores?' }]
    },
    {
        chaves: ['sincronização', 'sincronizar', 'sincronizar dispositivos', 'nuvem'],
        titulo: '☁️ Sincronização em nuvem',
        corpo: '<p>Tudo que você faz é salvo na nuvem em tempo real. Se entrar com o mesmo e-mail no celular e no computador, os dados aparecem iguais nos dois.</p><p class="mt-2">A sincronização acontece automaticamente — sem botão de "salvar na nuvem".</p>',
        sug: [{ txt: 'Backups', q: 'Como faço um backup?' }]
    },
    // ═══════════ CARTEIRA / CONTAS ═══════════
    {
        chaves: ['carteira física', 'carteira fisica', 'dinheiro em espécie', 'dinheiro na mão'],
        titulo: '👛 Carteira Física',
        corpo: '<p>É uma conta especial para o <strong>dinheiro em espécie</strong>. Vem criada por padrão e funciona como qualquer conta: tem saldo inicial e recebe/sofre movimentações.</p><p class="mt-2">Se você saca dinheiro no caixa eletrônico, faça uma <strong>transferência</strong> do banco para a Carteira Física.</p>',
        sug: [{ txt: 'Transferência', q: 'Como faço uma transferência?' }]
    },
    {
        chaves: ['anexo', 'comprovante', 'comprovantes', 'foto do recibo', 'recibo'],
        titulo: '📎 Anexos e comprovantes',
        corpo: '<p>Em <strong>Novo Lançamento → Mais opções → Comprovante</strong> (ou no modal de Edição), você anexa a foto do recibo ou PDF. Ficará vinculado ao lançamento.</p><p class="mt-2">Toque no ícone de clipe no Extrato para abrir o comprovante depois.</p>',
        sug: [{ txt: 'Como lanço uma despesa?', q: 'Como lanço uma despesa?' }]
    },
    // ═══════════ COMPORTAMENTO DO EXTRATO ═══════════
    {
        chaves: ['ordem do extrato', 'como o extrato ordena', 'ordenação', 'por que os pendentes vêm primeiro'],
        titulo: '📋 Ordem do Extrato',
        corpo: '<p>A lista é organizada em <strong>duas seções</strong>:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Pendentes primeiro</strong> — do mais próximo ao mais distante (crescente). O urgente fica no topo.</li><li><strong>Efetivadas depois</strong> — da mais recente à mais antiga (decrescente). Histórico lido do fresquinho ao antigo.</li></ul><p class="mt-2">Empate de data → o lançamento cadastrado por último aparece primeiro.</p>',
        sug: [{ txt: 'Pendente vs Efetivada', q: 'O que é Pendente e Efetivada?' }]
    },
    {
        chaves: ['marcar pago', 'efetivar', 'marcar como pago', 'quitar'],
        titulo: '✓ Marcar como pago',
        corpo: '<p>No Extrato, cada lançamento tem um <strong>ícone de status</strong> à esquerda:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>⏱ âmbar</strong> — pendente. Toque para marcar como pago.</li><li><strong>✓ verde</strong> — já pago. Toque para reabrir.</li></ul><p class="mt-2">O status muda o <strong>saldo real</strong> das contas e a cor de alguns alertas.</p>',
        sug: [{ txt: 'O que é o Saldo das Contas?', q: 'O que é o Saldo das Contas?' }]
    },
    // ═══════════ COMPORTAMENTO DOS CARDS ═══════════
    {
        chaves: ['valor base', 'valor do salário no resumo', 'de onde vem o salário do resumo'],
        titulo: '💵 De onde vem o valor do Salário no Resumo',
        corpo: '<p>Os cards do Resumo puxam o <strong>líquido a receber</strong> direto do Simulador do mês. Se você salvar uma nova projeção no Simulador, o card do Resumo atualiza automaticamente.</p><p class="mt-2">Quando não há simulação salva, o app usa o <strong>perfil</strong> como estimativa — e o valor do card pode vir do padrão do Salário Bruto em Configurações.</p>',
        sug: [{ txt: 'Simulador', q: 'Como funciona o Simulador?' }]
    },
    {
        chaves: ['salário sumiu', 'card do salário oculto', 'sem vale', 'não recebo vale', 'regime sem vale'],
        titulo: '👀 Card do Vale sumido?',
        corpo: '<p>Se você marcou em <strong>Configurações → Recebe Vale? → Não</strong>, o card do Vale desaparece — faz sentido, já que não há adiantamento.</p><p class="mt-2">Do mesmo jeito, se o <strong>Regime é PJ</strong>, tanto Salário quanto Vale desaparecem (não há folha CLT).</p>',
        sug: [{ txt: 'Regime CLT / PJ', q: 'O que é o regime CLT e PJ?' }]
    },
    // ═══════════ RECORRÊNCIA / PARCELAMENTO ═══════════
    {
        chaves: ['diferença entre parcelado e recorrente', 'parcelado ou recorrente'],
        titulo: '🔁 Parcelado x Recorrente',
        corpo: '<p>Apesar de parecerem iguais, são diferentes:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li><strong>Parcelado</strong> — tem <strong>fim definido</strong> (ex: 12x sem juros). Cada parcela tem seu próprio valor e vencimento.</li><li><strong>Recorrente</strong> — não tem fim. Repete todo mês até você encerrar (ex: Netflix). Ajustes no valor só valem do mês em diante.</li></ul>',
        sug: [{ txt: 'Tipos de lançamento', q: 'Quais são os tipos de lançamento?' }]
    },
    {
        chaves: ['quitar parcela', 'adiantar parcela', 'antecipar parcela', 'pagar tudo'],
        titulo: '⚡ Antecipar parcela',
        corpo: '<p>Não existe um botão específico de "quitar". O caminho é:</p><ol class="list-decimal pl-5 mt-2 space-y-1"><li>Apague as parcelas futuras (Apagar → Compra inteira, ou cada uma)</li><li>Ou edite a parcela atual para o valor total</li></ol><p class="mt-2">A primeira opção é mais limpa quando você quita antecipado.</p>',
        sug: [{ txt: 'Apagar lançamento', q: 'Como apago um lançamento?' }]
    },
    {
        chaves: ['pular mês', 'não pagar este mês', 'esconder um mês', 'cancelar um mês'],
        titulo: '📆 Pular uma parcela',
        corpo: '<p>Em uma recorrência, é possível <strong>pular só um mês</strong> sem encerrar a série: no Extrato, kebab (⋮) → <strong>Apagar</strong> → <strong>Somente este mês</strong>. A cobrança volta a aparecer no mês seguinte.</p>',
        sug: [{ txt: 'Encerrar recorrência', q: 'Como encerro uma recorrência?' }]
    },
    // ═══════════ CARTÃO / INVESTIMENTOS ═══════════
    {
        chaves: ['cartão de crédito', 'cartao de credito', 'fatura', 'despesa cartão'],
        titulo: '💳 Cartão de Crédito',
        corpo: '<p>O app ainda <strong>não tem gestão de fatura de cartão</strong>. Por enquanto, quando você paga a fatura, lance como despesa normal na categoria "Pagto. Dívida → Cartão de Crédito".</p><p class="mt-2">Cada compra no cartão pode ser lançada individualmente (com vencimento no dia da fatura) para aparecer corretamente no mês do pagamento.</p>',
        sug: [{ txt: 'Como lanço uma despesa?', q: 'Como lanço uma despesa?' }]
    },
    {
        chaves: ['investimento', 'investimentos', 'render', 'rendimento', 'poupança rende'],
        titulo: '📈 Investimentos',
        corpo: '<p>O app é focado em <strong>fluxo de caixa do mês</strong> (quanto entra, quanto sai). Não tem módulo de renda variável.</p><p class="mt-2">Para poupança/CDB, o caminho é tratar a aplicação como <strong>transferência</strong> para uma conta "Cofrinho" ou "Investimentos". O rendimento entra como <strong>receita</strong> com categoria "Renda Extra → Rendimentos".</p>',
        sug: [{ txt: 'Transferência', q: 'Como faço uma transferência?' }]
    },
    {
        chaves: ['reserva de emergência', 'fundo de emergência', 'guardar para emergência'],
        titulo: '🛡 Reserva de Emergência',
        corpo: '<p>Boa prática: manter 3 a 6 meses do seu custo de vida em uma conta de fácil acesso. Use a Assistente para planejar:</p><p class="mt-2">"Quero juntar 15000 até dezembro, sobrando 400 por mês"</p>',
        sug: [{ txt: 'Planejar meta', q: 'Quero juntar 5000 até dezembro sobrando 400 por mês' }]
    },
    // ═══════════ RECEITAS E ORIGEM MANUAL ═══════════
    {
        chaves: ['receita extra', 'dinheiro extra', 'freelance', 'venda', 'renda extra'],
        titulo: '💸 Receitas extras',
        corpo: '<p>Lance como <strong>Receita</strong> (botão + → Receita). Na categoria, escolha "Renda Extra" ou crie uma própria.</p><p class="mt-2">Ative <strong>Compor Projeção do Mês</strong> se quiser que essa receita entre nos cards do Resumo. Deixe desligado se a simulação do Simulador já cobre o valor — assim você evita contar duas vezes.</p>',
        sug: [{ txt: 'Compor projeção', q: 'O que é Compor Projeção do Mês?' }]
    },
    // ═══════════ SIDEBAR / NAVEGAÇÃO ═══════════
    {
        chaves: ['menu lateral', 'sidebar', 'navegação', 'mudar de aba', 'voltar para o resumo'],
        titulo: '🧭 Navegação',
        corpo: '<p><strong>Desktop</strong>: menu lateral à esquerda, com Resumo, Extrato, Contas, Relatórios, Simulador e Assistente.</p><p class="mt-2"><strong>Mobile</strong>: barra inferior com as 5 áreas principais + Assistente no header (✨).</p>',
        sug: [{ txt: 'O que é o Resumo?', q: 'O que é o Saldo Projetado?' }]
    },
    {
        chaves: ['seletor de mês', 'mudar de mês', 'mês anterior', 'próximo mês', 'ir para hoje'],
        titulo: '📅 Seletor de mês',
        corpo: '<p>No centro do header, os botões <strong>‹</strong> e <strong>›</strong> navegam entre meses. Toque no nome do mês (ex: "Setembro 2026") para abrir o seletor — que permite pular direto para qualquer mês e ano, ou usar o botão <strong>Ir para o mês atual</strong>.</p>',
        sug: [{ txt: 'Como o mês afeta os dados?', q: 'Como funciona o Simulador?' }]
    },
    // ═══════════ MODO FAMÍLIA / MULTIUSUÁRIO ═══════════
    {
        chaves: ['família', 'familia', 'casal', 'outro usuário', 'compartilhar conta', 'multiusuário'],
        titulo: '👨‍👩‍👧 Compartilhar com família',
        corpo: '<p>O app é <strong>mono-usuário</strong> — cada login tem seus próprios dados isolados. Não tem um modo "casal" ou "família" compartilhando as mesmas contas.</p><p class="mt-2">Uma alternativa é compartilhar o login (mesmo e-mail) — os dois aparelhos verão exatamente os mesmos dados sincronizados.</p>',
        sug: [{ txt: 'Sincronização', q: 'Como funciona a sincronização?' }]
    },
    // ═══════════ FERRAMENTAS DE MANUTENÇÃO ═══════════
    {
        chaves: ['exportar json', 'exportar dados', 'baixar dados'],
        titulo: '📤 Exportar dados (JSON)',
        corpo: '<p>No <strong>Extrato</strong>, ao lado da busca, o ícone de <strong>download</strong> exporta um JSON com todos os lançamentos. Ótimo para backup manual ou análise externa.</p><p class="mt-2">O formato é o mesmo aceito pelo botão de <strong>importar</strong> — você pode reimportar depois.</p>',
        sug: [{ txt: 'Importar', q: 'Como importo um backup?' }]
    },
    {
        chaves: ['aniversário da conta', 'primeiro dia', 'saldo inicial', 'quando comecei'],
        titulo: '📌 Saldo inicial das contas',
        corpo: '<p>O <strong>saldo inicial</strong> de cada conta é a base para todos os cálculos. Ajuste em <strong>Contas → Gerenciar → editar conta</strong>.</p><p class="mt-2">Se errar o saldo inicial, o desvio aparece em todas as movimentações daquela conta. Melhor ajustar lá do que criar lançamentos de correção.</p>',
        sug: [{ txt: 'Criar conta', q: 'Como crio uma nova conta?' }]
    },
    // ═══════════ MISC ═══════════
    {
        chaves: ['em breve', 'novidades', 'roadmap', 'o que vai ter'],
        titulo: '🚧 O que ainda vem por aí',
        corpo: '<p>Algumas ideias já mapeadas para o futuro:</p><ul class="list-disc pl-5 mt-2 space-y-1"><li>Gestão de fatura de cartão de crédito</li><li>Notificações de vencimento</li><li>Gráficos históricos de evolução</li><li>Modo família / casal</li></ul>',
        sug: [{ txt: 'Sobre o app', q: 'Sobre o que é o app?' }]
    },
    {
        chaves: ['limpar filtro', 'remover filtro', 'tirar filtro'],
        titulo: '🔄 Limpar filtros',
        corpo: '<p>Em <strong>Relatórios</strong>, cada filtro tem uma opção <strong>"Todos(as)"</strong> no topo. Em <strong>Extrato</strong>, o chip <strong>Todas</strong> limpa o filtro rápido, e apagar o texto da busca limpa o filtro textual.</p>',
        sug: [{ txt: 'Relatórios', q: 'Como gero um relatório?' }]
    }
];

// 🎯 Busca na base: escolhe o tópico com maior soma de comprimentos
//    das chaves casadas. Chaves longas vencem — "saldo do salário"
//    (16 chars) bate "saldo" (5 chars). Garante que a resposta seja
//    a MAIS ESPECÍFICA disponível.
function asBuscarNaBase(texto) {
    const t = texto.toLowerCase();
    let melhor = null, melhorScore = 0;
    for (const item of AS_KB_APP) {
        let score = 0;
        for (const ch of item.chaves) {
            if (t.includes(ch)) score += ch.length;
        }
        if (score > melhorScore) { melhorScore = score; melhor = item; }
    }
    return melhor;
}

function asRenderRespostaKB(item) {
    return `
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400 mb-1">${item.titulo}</p>
        <div class="text-[13px] text-slate-700 dark:text-gray-200 leading-relaxed">${item.corpo}</div>
        ${asSugestoes(item.sug || [])}
    `;
}

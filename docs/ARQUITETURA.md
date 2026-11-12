# Arquitetura do app

App estático (HTML + CSS + JS), **sem etapa de build**: o que está no repositório é o que vai para o ar. Os dados ficam no Firebase (Auth, Firestore e Storage).

## Estrutura

```
index.html              Marcação de todas as telas e modais + ordem de carregamento
sw.js                   Service worker (PWA/offline)
assets/icons/           Favicon e ícone do iPhone
css/
  tokens.css            ★ Design tokens: cores, raios, sombras, fontes (claro/escuro)
  base.css              Fontes, campos, cards, animações, barra de rolagem
  loader.css            Tela de carregamento (porquinho)
  formularios.css       Foco e aparência dos campos
  layout.css            Header, menu lateral, conteúdo, ajustes de mobile
  tema-escuro.css       Regras do tema escuro
  interacoes.css        Hover (desktop) e active (toque)
  ajustes.css           Ajustes finos (alinhamento, logos, transferências)
  tipografia.css        Hierarquia de pesos de fonte
  utilitarios.css       ★ Classes prontas com os tokens (para a nova interface)
js/
  boot/                 Config do Tailwind (antes do CDN) e registro do service worker
  core/                 Firebase, estado global, categorias, utilidades
  services/             Upload (Storage) e sincronização (Firestore)
  ui/                   Tema, abas/modais, máscaras, autocomplete, layout…
  features/             Uma pasta por funcionalidade: extrato, contas, holerite, férias…
  assistente/           Assistente financeiro (núcleo, metas, comparação, base de conhecimento…)
```

Para achar onde algo está: procure pelo nome da função (`Ctrl+Shift+F`) ou pelo `id` do elemento no HTML.

## Como o JavaScript funciona

- `js/core/firebase.js` é o único **ES module** (precisa de `import`). Ele inicializa o Firebase e publica tudo em `window.__fb`.
- Todos os outros arquivos são **scripts clássicos** com `defer`. Eles compartilham o mesmo escopo global: uma `function` ou `const` declarada em um arquivo pode ser usada em qualquer outro. Foi assim que o código original (um único `<script>`) continuou funcionando sem reescrita.
- Os scripts rodam **na ordem em que aparecem no `index.html`**, depois que o HTML termina de carregar.

### Regras ao mexer no JS

1. **Código que roda no carregamento** (fora de funções) só pode usar o que foi declarado no mesmo arquivo ou em arquivos **anteriores**. Dentro de funções chamadas depois (cliques, eventos, timers), pode usar qualquer coisa.
   - Exemplo real: `holerite.js` usa `() => calcularMotorFolha()` em vez de passar `calcularMotorFolha` direto, porque essa função é de `ferias.js`, que carrega depois.
2. Funções chamadas por `onclick="..."` no HTML precisam estar em `window` (`window.minhaFuncao = function…`) ou ser `function` de nível superior.
3. Arquivo novo: crie em `js/<pasta>/`, comece com `'use strict';` e adicione um `<script defer src="…">` no `index.html`, na posição certa da ordem.
4. Ao terminar, abra o app e confira o Console do navegador: erro de ordem aparece como `ReferenceError` ou `… is not a function`.

## CSS e Tailwind

- O Tailwind vem do CDN (`cdn.tailwindcss.com`) e gera as classes **no navegador, em lotes**, conforme lê o HTML e conforme o JS altera classes. A ordem dos lotes define qual classe vence quando um elemento tem duas da mesma família (ex.: `text-xl` + `text-2xl`).
- Por isso, algumas coisas no `<head>` e no fim do `<body>` estão onde estão de propósito. Mexer nelas pode mudar o visual:
  - `js/boot/tailwind-config.js` antes do CDN, e o script de "reforço" logo depois: igual ao original.
  - Os CSS do app **no fim do `<body>`**. Assim eles vêm depois das regras do Tailwind (vencem os empates), e o navegador lê todo o HTML de uma vez, sem pausas no meio.
  - O listener de sessão (`onAuthStateChanged`) em `js/ui/tema.js`. Ele pertenceria a `features/login.js`, mas mudá-lo de arquivo antecipa quando a tela de login altera classes e muda a ordem do Tailwind. Deixe para quando o Tailwind for compilado.
- Por esse mesmo motivo, os tokens **não** entram no `tailwind.config`: mudar a configuração reordena as regras. As classes dos tokens ficam em `css/utilitarios.css`.

## Tokens e a nova interface

`css/tokens.css` concentra as decisões visuais em variáveis CSS, em dois níveis:

- **Paleta** (`--azul-500`, `--noite-850`…): cores brutas.
- **Semânticos** (`--cor-fundo`, `--cor-superficie`, `--cor-texto`, `--cor-marca`, `--cor-sucesso`…): o significado. Mudam sozinhos entre claro e escuro (`html.dark`).

`css/utilitarios.css` traz classes prontas com os tokens, que **já funcionam nos dois temas sem `dark:`**:

| Classe | Uso |
|---|---|
| `bg-fundo`, `bg-superficie`, `bg-superficie-elevada`, `bg-superficie-sutil` | Fundos |
| `text-texto`, `text-texto-suave` | Textos |
| `border-borda`, `border-marca` | Bordas |
| `bg-marca`, `text-marca`, `bg-marca-suave`, `hover:bg-marca-forte` | Cor da marca |
| `text-sucesso`, `text-perigo`, `text-alerta` e versões `bg-…-suave` | Receita / despesa / aviso |
| `rounded-sm-app`, `rounded-md-app`, `rounded-card`, `rounded-painel` | Raios |
| `shadow-card`, `shadow-elevada` | Sombras |
| `font-app`, `font-titulo`, `transicao-suave` | Fontes e transição |

Elas convivem com as classes do Tailwind (`p-4`, `flex`, `gap-2`…), que continuam valendo para espaçamento e layout.

Caminho sugerido para a nova interface:

1. Ajuste a paleta e os semânticos em `tokens.css` para a nova identidade.
2. Redesenhe uma tela por vez, trocando cores fixas (`bg-white dark:bg-[#121b2b]`) pelas classes semânticas (`bg-superficie`).
3. Conforme cada tela migrar, apague as regras correspondentes de `tema-escuro.css`, que hoje "corrige" o escuro na marra com `!important`.
4. Remova os itens de compatibilidade abaixo.

## Compatibilidade com o visual antigo

O `index.html` original tinha caracteres invisíveis (BOM) antes do `<!DOCTYPE>`. Isso fazia o navegador renderizar em **modo de compatibilidade (quirks mode)**. A refatoração corrigiu isso, e o app agora roda em modo padrão. Para o visual não mudar, três ajustes reproduzem o comportamento antigo:

- `css/base.css`: `form { margin-block-end: 1em; }` (margem que o quirks mode dava aos formulários).
- `css/base.css`: `body::before` com 24px (a "linha" que os caracteres invisíveis criavam no topo).
- `js/features/extrato.js`: ícones dos botões de ação com `block` e rótulos de tipo/origem com `span.block` (alturas de linha do quirks mode).

Na nova interface, esses ajustes podem sair. Ao editar arquivos, salve em **UTF-8 sem BOM**: o `.editorconfig` já pede isso aos editores.

## Service worker

- Arquivos do próprio app: **rede primeiro**, com o cache como reserva offline. Assim, um deploy novo nunca mistura HTML novo com JS antigo.
- Bibliotecas externas (Tailwind, Chart.js, fontes, SDK): cache primeiro, atualizando em segundo plano.
- Firebase (dados/login): sempre rede.

Ao mudar a estratégia de cache, incremente `CACHE` em `sw.js`.

## Problemas conhecidos (já existiam antes da refatoração)

- **Classes conflitantes**: alguns elementos recebem duas classes da mesma família ao mesmo tempo. O resultado depende da ordem em que o Tailwind gerou as regras, então pode variar entre aberturas do app ou entre aparelhos:
  - `#rodapeExtratoSaldo` e `#liqReceber`: `text-slate-900` + `text-green-600` (o saldo às vezes aparece escuro, às vezes verde);
  - `#cardSaldoSalario` e `#cardSaldoVale`: `text-xl` + `text-2xl`.

  Na nova interface, deixe só uma classe de cada família.
- **Tailwind via CDN**: o próprio Tailwind avisa que o CDN não é para produção. Ele gera o CSS no navegador a cada abertura, e é a causa da variação acima. Um próximo passo natural é compilar o CSS (Tailwind CLI) e remover o CDN.

## Próximos passos possíveis

- Converter os scripts em ES modules (`import`/`export`) aos poucos, começando pelos mais isolados (`ui/mascaras.js`, `features/recibo.js`), para deixar explícito quem depende de quem.
- Compilar o Tailwind (remove o CDN e o aviso, e deixa o CSS determinístico). Depois disso, os tokens podem ir para o `theme.extend` e ganhar variantes (`hover:`, `md:`, `/50`), e o listener de sessão pode ir para `features/login.js`.
- Mover os modais do `index.html` para templates por funcionalidade.

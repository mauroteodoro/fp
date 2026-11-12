# Finanças Pessoais

App web (PWA) de controle financeiro pessoal: extrato, contas, holerite/férias, relatórios e um assistente financeiro. Dados no Firebase.

## Rodar localmente

Não há build. Basta servir a pasta com qualquer servidor estático, por exemplo:

```bash
npx serve .
```

ou

```bash
python -m http.server 8080
```

Abrir `index.html` direto pelo arquivo (`file://`) não funciona, porque o service worker e os módulos exigem `http://`.

## Organização

- `index.html`: telas e modais, e a ordem de carregamento dos scripts
- `css/`: estilos; `css/tokens.css` é a base do visual
- `js/`: código, separado por `core/`, `services/`, `ui/`, `features/` e `assistente/`
- `sw.js`: service worker

Detalhes, regras para mexer no código e o plano para a nova interface: [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

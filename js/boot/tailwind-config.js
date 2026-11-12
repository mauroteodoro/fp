// Configura Tailwind antes do CDN (necessário para darkMode: 'class').
// Mantido idêntico ao original e como arquivo separado (não inline): a forma e o
// momento da configuração mudam a ordem em que o Tailwind gera as regras — e,
// com ela, qual classe vence quando um elemento tem duas conflitantes.
window.tailwind = window.tailwind || {};
window.tailwind.config = {
    darkMode: 'class'
};

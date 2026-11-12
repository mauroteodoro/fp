// Login e sessão
'use strict';

// ===================== LÓGICA DE LOGIN E TEMA =====================
const formLogin = document.getElementById('formLogin');
const loginScreen = document.getElementById('telaLogin');
const appWrapper = document.getElementById('appWrapper');
const loaderInicial = document.getElementById('loaderInicial');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    const btnText = document.getElementById('txtBtnLogin');
    const spinner = document.getElementById('spinLogin');
    const errMsg = document.getElementById('loginError');
    
    btnText.classList.add('hidden'); spinner.classList.remove('hidden'); errMsg.classList.add('hidden');
    
    try { await signInWithEmailAndPassword(auth, email, pass); } 
    catch (error) { errMsg.classList.remove('hidden'); } 
    finally { btnText.classList.remove('hidden'); spinner.classList.add('hidden'); }
});

const btnTogglePassword = document.getElementById('btnTogglePassword');
const inputPassword = document.getElementById('loginPassword');
const iconHidden = document.getElementById('iconPassHidden');
const iconVisible = document.getElementById('iconPassVisible');

btnTogglePassword.addEventListener('click', () => {
    if (inputPassword.type === 'password') {
        inputPassword.type = 'text';
        iconHidden.classList.add('hidden');
        iconVisible.classList.remove('hidden');
    } else {
        inputPassword.type = 'password';
        iconVisible.classList.add('hidden');
        iconHidden.classList.remove('hidden');
    }
});

const btnEsqueciSenha = document.getElementById('btnEsqueciSenha');
btnEsqueciSenha.addEventListener('click', async () => {
    const emailInput = document.getElementById('loginEmail').value.trim();
    const errMsg = document.getElementById('loginError');
    
    if (!emailInput) {
        errMsg.textContent = "Digite seu e-mail no campo acima para recuperar a senha.";
        errMsg.classList.remove('hidden');
        return;
    }
    
    try {
        btnEsqueciSenha.textContent = "Enviando...";
        btnEsqueciSenha.disabled = true;
        await sendPasswordResetEmail(auth, emailInput);
        errMsg.classList.add('hidden');
        alert("E-mail de recuperação enviado! Verifique sua caixa de entrada e spam.");
    } catch (error) {
        console.error("Erro ao recuperar senha:", error);
        errMsg.textContent = "Erro ao enviar. Verifique se o e-mail está correto e cadastrado.";
        errMsg.classList.remove('hidden');
    } finally {
        btnEsqueciSenha.textContent = "Esqueceu a senha?";
        btnEsqueciSenha.disabled = false;
    }
});

window.fazerLogout = function() { signOut(auth); }

// Firebase: SDK, configuração e inicialização.
// É o único arquivo carregado como ES module (precisa de `import`).
// Expõe tudo em window.__fb para os demais scripts (scripts clássicos com escopo global compartilhado).

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAGMWr0bZyNhiuquF1RKS-OnP_-76n1cjo",
    authDomain: "financas-pessoais-mauro.firebaseapp.com",
    projectId: "financas-pessoais-mauro",
    storageBucket: "financas-pessoais-mauro.firebasestorage.app",
    messagingSenderId: "186869635998",
    appId: "1:186869635998:web:b903b899944a98853d148f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

window.__fb = { initializeApp, getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, getStorage, ref, uploadString, getDownloadURL, app, auth, db, storage };

// Compressão e upload de imagens (Firebase Storage)
'use strict';

// ===================== MOTOR DE COMPRESSÃO E UPLOAD (STORAGE) =====================
async function processarAnexo(file) {
    if (!file) return null;
    let base64Compactado = null;
    let extensao = file.type === 'application/pdf' ? 'pdf' : 'jpg';
    
    // Tratamento para PDF
    if (file.type === 'application/pdf') {
        if (file.size > 250 * 1024) { 
            window.mostrarAviso("PDF muito grande. O limite é 250KB.", "erro");
            return null;
        }
        base64Compactado = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    } 
    // Tratamento para Imagens
    else if (file.type.startsWith('image/')) {
        base64Compactado = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800; 
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.6));
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        });
    } else {
        window.mostrarAviso("Formato não suportado. Use JPG, PNG ou PDF.", "erro");
        return null;
    }

    if (!base64Compactado || !currentUserUID) return null;

    try {
        window.mostrarAviso("Enviando anexo para a nuvem...", "info");
        const fileName = `${Date.now()}_${Math.floor(Math.random()*1000)}.${extensao}`;
        const storageRef = ref(storage, `anexos/${currentUserUID}/${fileName}`);
        await uploadString(storageRef, base64Compactado, 'data_url');
        const downloadURL = await getDownloadURL(storageRef);
        window.mostrarAviso("Anexo salvo com sucesso!", "sucesso");
        return downloadURL;
    } catch (error) {
        console.error("Erro no upload do anexo:", error);
        window.mostrarAviso("Erro ao enviar anexo.", "erro");
        return null;
    }
}

document.getElementById('anexoLivre').addEventListener('change', async function() {
    const file = this.files[0];
    if (file) {
        const urlAnexo = await processarAnexo(file);
        if (urlAnexo) {
            document.getElementById('nomeAnexoLivre').textContent = file.name;
            anexoAtualBase64 = urlAnexo;
        } else {
            this.value = '';
            document.getElementById('nomeAnexoLivre').textContent = '';
            anexoAtualBase64 = null;
        }
    } else {
        document.getElementById('nomeAnexoLivre').textContent = '';
        anexoAtualBase64 = null;
    }
});

document.getElementById('editAnexoLivre').addEventListener('change', async function() {
    const file = this.files[0];
    if (file) {
        const urlAnexo = await processarAnexo(file);
        if (urlAnexo) {
            document.getElementById('nomeEditAnexoLivre').textContent = file.name;
            anexoEditBase64 = urlAnexo;
        } else {
            this.value = '';
            document.getElementById('nomeEditAnexoLivre').textContent = itemSendoEditado && itemSendoEditado.anexo ? '(Anexo atual salvo)' : '';
            anexoEditBase64 = itemSendoEditado ? itemSendoEditado.anexo : null;
        }
    } else {
        document.getElementById('nomeEditAnexoLivre').textContent = itemSendoEditado && itemSendoEditado.anexo ? '(Anexo atual salvo)' : '';
        anexoEditBase64 = itemSendoEditado ? itemSendoEditado.anexo : null;
    }
});

window.visualizarAnexo = function(idUnico) {
    const item = bancoDeDados.find(d => d.id === idUnico);
    if (item && item.anexo) {
        window.open(item.anexo, '_blank');
    }
};

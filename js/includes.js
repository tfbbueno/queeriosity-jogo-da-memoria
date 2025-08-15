// js/includes.js
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper: dá timeout em uma promise (padrão 10s)
function withTimeout(promise, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ]);
}

// Mensagens de alerta no seletor informado 
function showMessage(message, id = "erro", type = "warning") {
    document.getElementById(id).innerHTML = `
      <div class="alert alert-${type} text-center mt-4" role="alert">
          ${message}
      </div>
    `;
}
 
function loadComponent(id, file) {
  const el = document.getElementById(id); 

  fetch(file)
    .then(res => {
      if (!res.ok) throw new Error(`Erro ao carregar ${file}`);
      return res.text();
    })
    .then(html => {
      if (el) el.innerHTML = html;
    })
    .catch(err => {  
        showMessage("Falha ao carregar componente. Tente novamente mais tarde.", "erro", "danger");
      
    });
}

// Busca conteúdos estáticos no Firestore com timeout + loader local
async function carregarTexto(pagina, chave, seletor) {
  const el = document.querySelector(seletor);

  try {
    const snap = await withTimeout(getDocs(collection(db, "conteudoEstatico")), 10000);
    const conteudoEstatico = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (conteudoEstatico.length > 0) {
      const data = conteudoEstatico[0];
      if (data[pagina] && data[pagina][chave]) {
        if (el) el.innerHTML = data[pagina][chave];
        return;
      }
    }
    // Sem dados úteis
    showMessage("Erro ao carregar conteúdo. Tente novamente mais tarde.");
  } catch (err) {
    showMessage("Erro ao carregar conteúdo. Tente novamente mais tarde.", "erro", "danger");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadComponent("navbar", "partials/navbar.html");
  loadComponent("footer", "partials/footer.html");

  const path = window.location.pathname;

  if (path.endsWith("/") || path.endsWith("/index") || path.endsWith("/index.html")) {
    carregarTexto("index", "divInstrucoes", "#divInstrucoes");
  }

  if (path.includes("about.html")) {
    carregarTexto("about", "about", "#about");
  }

  carregarTexto("footer", "textoRodape", "#textoRodape");
});

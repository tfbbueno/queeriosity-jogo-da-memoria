// js/includes.js
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";


const SECOND = 1_000;
// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper: dá timeout em uma promise (padrão 10s)
function withTimeout(promise, ms = SECOND) {
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
    const q = query(collection(db, "conteudoEstatico"), limit(1));
    const snap = await withTimeout(getDocs(q), SECOND);
    if (snap.empty) throw new Error("coleção vazia");

    const data = snap.docs[0].data() || {};
    const html = data?.[pagina]?.[chave];

    if (typeof html === "string") {
      if (el) el.innerHTML = html;
      return;
    }

    // Sem dados úteis
    throw new Error(`campo ausente: ${pagina}.${chave}`);
  } catch (err) {
    console.error("carregarTexto:", err);
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
  if (path.includes("cartas.html")) {
    carregarTexto("about", "about", "#about");
  }

  carregarTexto("footer", "textoRodape", "#textoRodape");
});

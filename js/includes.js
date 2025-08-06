// js/includes.js
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Carrega HTML externo
function loadComponent(id, file) {
  fetch(file)
    .then(res => {
      if (!res.ok) throw new Error(`Erro ao carregar ${file}`);
      return res.text();
    })
    .then(html => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    })
    .catch(err => console.error(err));
}

async function carregarTexto(pagina, chave, seletor) {
  try {
    const snap = await getDocs(collection(db, "conteudoEstatico"));
    const conteudoEstatico = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log("Texto carregado:", conteudoEstatico);

    if (conteudoEstatico.length > 0) {
      const data = conteudoEstatico[0];

      if (data[pagina] && data[pagina][chave]) {
        const el = document.querySelector(seletor);
        if (el) el.innerHTML = data[pagina][chave]; 
      }
    }
  } catch (err) {
    console.error("Erro ao carregar texto do Firestore:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadComponent("navbar", "partials/navbar.html");
  loadComponent("footer", "partials/footer.html");

  const path = window.location.pathname; 

  if (path.endsWith("/") || path.endsWith("/index") || path.endsWith("/index.html") ) {
    carregarTexto("index", "divInstrucoes", "#divInstrucoes");
  }
 
  if (path.includes("about.html")) {
    carregarTexto("about", "about", "#about");
  }

  carregarTexto("footer", "textoRodape", "#textoRodape");
});

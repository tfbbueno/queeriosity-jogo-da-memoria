/* --- Firebase --- */
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, limit } from
    "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let CARDS = [];
let amountOfCards;

const SECOND = 1_000;

// Helper: dá timeout em uma promise
function withTimeout(promise, ms = SECOND) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
}


async function fetchCards() {
    const loadingEl = document.getElementById("loading");
    loadingEl?.classList.remove("hidden"); // mostra o loader

    const today = new Date();
    try {
        const snap = await withTimeout(getDocs(collection(db, "cards")), SECOND);

        CARDS = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(card => !card.dataLimite || card.dataLimite.toDate() >= today);

        if (!CARDS || CARDS.length === 0) {
            showMessage("Nenhum cartão encontrado 🥲. Tente novamente mais tarde.");
        }
        amountOfCards = CARDS.length;

        criarCartõesUI();
        criarModais(); 
    } catch (error) {
        console.error("Falha ao carregar Firestore:", error);
        // mostra sua mensagem quando falhar (inclui timeout)
        showMessage("Nenhum cartão encontrado 🥲. Tente novamente mais tarde.", "danger");
    } finally {
        loadingEl?.classList.add("hidden"); // esconde o loader
    }
}

function showMessage(message, type = "warning") {
    document.getElementById("erro").innerHTML = `
      <div class="alert alert-${type} text-center mt-4" role="alert">
          ${message}
      </div>
    `;
}

// criar html com todos os cartões
function criarCartõesUI() {
    const boardEl = document.querySelector('#cartoes-cientistas');
    var column = Math.ceil(Math.sqrt(amountOfCards));

    var tabuleiroResultadoHtml = `
  <div class="container centralizado">
  
  <div id="cartoes" class="row row-cols-sm-2 row-cols-md-${column} row-cols-lg-${column} justify-content-center">
  `;
    // ordena por nome (A→Z), ignora acentos e usa ordenação numérica quando houver números no nome
    const cartasOrdenadas = [...CARDS].sort((a, b) =>
        (a?.nome || "").localeCompare(b?.nome || "", "pt-BR", {
            sensitivity: "base",   // ignora acentos/maiúsculas
            numeric: true          // 2 < 10 corretamente
        })
    );

    cartasOrdenadas.forEach(card => {
        tabuleiroResultadoHtml += `  
        <div id="card-${card.id}" class="card cardResultado" >
        <img src="${card.imagem}" class="card-img-top" alt="${card.nome}">
        <div class="card-body">
          <div class="texto-centralizado"><h5 class="card-title">${card.nome}</h5> </div>
          <p class="card-text">
            ${card.texto.substring(0, 100) + "..."}
          </p> 
          <button type="button" class="btn btn-primary"  onclick="abrirModalInfo('modal_${card.id}')" >
            Leia mais
          </button>
        </div>
      </div>
    `;
    });

    tabuleiroResultadoHtml += '</div></div>';
    boardEl.innerHTML = tabuleiroResultadoHtml;
}
 
function criarModais() {
  const modaisEl = document.querySelector('#modais');
  let modaisHtml = '';

  CARDS.forEach(card => {
    // Ordena os links por título (A→Z)
    const linksOrdenados = (Array.isArray(card.links) ? card.links : [])
      .slice()
      .sort((a, b) => (a?.titulo || '').localeCompare(b?.titulo || '', 'pt-BR', {
        sensitivity: 'base',
        numeric: true
      }));

    let btnSaibaMais = '';
    if (linksOrdenados.length > 0) {
      if (linksOrdenados.length <= 2) {
        linksOrdenados.forEach(link => {
          btnSaibaMais += `<span><a class="btn btn-primary" target="_blank" href="${link.url}">${link.titulo}</a></span>`;
        });
      } else {
        btnSaibaMais += `
          <div class="btn-group" role="group">
            <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              Saiba mais
            </button>
            <ul class="dropdown-menu">
              ${linksOrdenados.map(link => `<li><a class="dropdown-item" target="_blank" href="${link.url}">${link.titulo}</a></li>`).join('')}
            </ul>
          </div>
        `;
      }
    }

    const modalId = `modal_${card.id}`;
    const labelId = `label_${card.id}`;
    const bodyId  = `body_${card.id}`;

    modaisHtml += `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${labelId}" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
        <div class="modal-dialog modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 id="${labelId}" class="modal-title"></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                </div>
                <div class="modal-body" id="${bodyId}">
                    <div class="div-img-info">
                        <img src="${card.imagem}" alt="${card.nome}" class="img-info">
                    </div>
                    <div class="texto-centralizado"><h2>${card.nome}</h2></div>
                    <div class="div-text-info">${card.texto}</div>
                </div>
                <div class="modal-footer rodapeModalCientista">
                    <div id="divSaibaMais">${btnSaibaMais}</div>
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Voltar</button>
                </div>
            </div> 
        </div>
      </div>
    `;
  });

  modaisEl.innerHTML = modaisHtml;
}

function abrirModalInfo(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  const instance = bootstrap.Modal.getOrCreateInstance(el);
  instance.show();
}

function fecharModalInfo(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  const instance = bootstrap.Modal.getInstance(el);
  if (instance) instance.hide();
}

window.abrirModalInfo = abrirModalInfo;
window.fecharModalInfo = fecharModalInfo; 

fetchCards();
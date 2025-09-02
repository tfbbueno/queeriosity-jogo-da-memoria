/* --- Firebase --- */
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, limit } from
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let CARDS = [];

const SECOND = 1_000;
let amountOfCards;
let primeiraCarta;
let segundaCarta;
let plays = 0;
let hits = 0;
let cartasSelecionadas = [];
let gameFinished = false;

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
    } else {
      document.getElementById("divTelaInicial").classList.remove("hidden");
    }
  } catch (error) {
    console.error("Falha ao carregar Firestore:", error);
    // mostra sua mensagem quando falhar (inclui timeout)
    showMessage("Nenhum cartão encontrado 🥲. Tente novamente mais tarde.", "danger");
  } finally {
    loadingEl?.classList.add("hidden"); // esconde o loader
  }
}

// Lê amountOfCards do Firestore 
async function resolveAmountOfCards() {
  const FALLBACK = 8;
  try {
    const q = query(collection(db, "conteudoEstatico"), limit(1));
    const snap = await withTimeout(getDocs(q), SECOND);
    if (snap.empty) return FALLBACK;

    const data = snap.docs[0].data() || {};
    const raw = Number(data.amountOfCards);

    // valida e normaliza
    let n = (Number.isFinite(raw) && raw > 0) ? Math.floor(raw) : FALLBACK;

    // não pedir mais do que há de cartas únicas 
    if (Array.isArray(CARDS) && CARDS.length) n = Math.min(n, CARDS.length);

    // pelo menos 1
    n = Math.max(1, n);

    return n;
  } catch (e) {
    console.error("Erro lendo amountOfCards:", e);
    return FALLBACK;
  }
}

// jogo 
function loadGame() {
  let cards = sortCardsDisposal();
  insertCardsIntoTheBoard(cards);
}

function showMessage(message, type = "warning") {
  document.getElementById("erro").innerHTML = `
      <div class="alert alert-${type} text-center mt-4" role="alert">
          ${message}
      </div>
    `;
}

function sortCardsDisposal() {
  amountOfCards = Math.min(CARDS.length, amountOfCards);
  cartasSelecionadas = getRandomCards(amountOfCards);
  const cardsDisposal = cartasSelecionadas.flatMap(card => [card, card]);
  return cardsDisposal.sort(randomOrderCriteria);
}

// Persistência de cartas vistas (cache local)  
const SEEN_KEY = 'qrs_seen_card_ids_v1';

function loadSeenSet(allCards = []) {
  const idsValidos = new Set(allCards.map(c => c.id));
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set((Array.isArray(arr) ? arr : []).filter(id => idsValidos.size ? idsValidos.has(id) : true));
  } catch {
    return new Set();
  }
}

function saveSeenSet(set) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(set)));
  } catch { }
}

// Marca uma carta como vista 
function markCardSeen(cardId, allCards = []) {
  if (!cardId) return;
  const cartasVistas = loadSeenSet(allCards);
  cartasVistas.add(cardId);
  // se já vimos tudo, não limpamos agora; deixamos o getRandomCards gerenciar o ciclo
  saveSeenSet(cartasVistas);
}

// limpar histórico via console ou por botão de UI
window.resetCardHistory = function resetCardHistory() {
  localStorage.removeItem(SEEN_KEY);
  // feedback simples opcional
  try { alert('Histórico de cartas vistas apagado.'); } catch { }
};


function getRandomCards(amount) {
  // Conjunto de já vistas (filtrado para cartas existentes)
  const cartasVistas = loadSeenSet(CARDS);

  // Particiona em inéditas vs. já vistas
  const cards_NaoVistas = CARDS.filter(c => !cartasVistas.has(c.id)).sort(randomOrderCriteria);
  const cards_Vistas = CARDS.filter(c => cartasVistas.has(c.id)).sort(randomOrderCriteria);

  let cartasEscolhidas = [];

  if (cards_NaoVistas.length >= amount) {
    // Ainda dá pra variar 100%: pega só inéditas
    cartasEscolhidas = cards_NaoVistas.slice(0, amount);
  } else {
    // Pega todas as inéditas + o restante das já vistas
    const need = amount - cards_NaoVistas.length;
    cartasEscolhidas = cards_NaoVistas.concat(cards_Vistas.slice(0, need));
  }

  // Atualiza histórico com as cartas desta rodada
  const novaListaCartasVistas = new Set(cartasVistas);
  cartasEscolhidas.forEach(c => novaListaCartasVistas.add(c.id));

  if (novaListaCartasVistas.size >= CARDS.length) {
    // Todas já foram vistas pelo menos uma vez:
    // limpar o ciclo e reiniciar do zero (próxima partida começa "limpa")
    try { localStorage.removeItem(SEEN_KEY); } catch { }
  } else {
    // Ainda não vimos todas, persiste progresso normalmente
    saveSeenSet(novaListaCartasVistas);
  }

  return cartasEscolhidas;
}

function getColumnAmount(amountOfCards) {
  let column = Math.ceil(Math.sqrt(amountOfCards * 2));

  // garante que seja sempre par
  if (column % 2 !== 0) {
    column++;
  }
  return column;
}

function insertCardsIntoTheBoard(cards) {
  const boardEl = document.querySelector('#tabuleiro');
  let column = getColumnAmount(cards.length);

  const tabuleiro = `
    <div class="container text-center">
      <!-- xs: 2 colunas; sm+: 2; md+ e lg+: 'column' (sempre par) -->
      <div class="row g-3 row-cols-4 row-cols-sm-4 row-cols-md-${column} row-cols-lg-${column} justify-content">
        ${cards.map(card => `
          <div class="col d-flex justify-content-center">
            <div class="cartao" id="card-${card.id}" data-id="${card.id}">
              <div class="cartao-front">
                <img src="./files/front.png" class="img-cartao">
              </div>
              <div class="cartao-back">
                <div><img src="${card.imagem}" class="img-cartao"></div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  boardEl.innerHTML = tabuleiro;
}

function flipCard(card) {
  const cardId = card.getAttribute("data-id");
  if (isCardAlreadyFlipped(card) || areBothCardsFlipped()) return;

  card.classList.add('is-flipped');

  const isFirstCard = primeiraCarta === undefined;
  if (isFirstCard) {
    primeiraCarta = card;
    return;
  } else {
    segundaCarta = card;
    plays++;
  }

  const isMatch = primeiraCarta.dataset.id === segundaCarta.dataset.id;

  if (isMatch) {
    hits++;

    document.querySelectorAll(`.cartao[data-id="${primeiraCarta.dataset.id}"]`)
      .forEach(el => el.classList.add('is-matched'));

    abrirModalInfo(cardId);
    resetPlay();
  } else {
    setTimeout(unflipCardsAndResetPlay, SECOND);
  }
}

function isCardAlreadyFlipped(card) {
  return card.classList.contains("is-flipped")
}

function areBothCardsFlipped() {
  return primeiraCarta !== undefined && segundaCarta !== undefined;
}

function unflipCardsAndResetPlay() {
  primeiraCarta.classList.remove('is-flipped');
  segundaCarta.classList.remove('is-flipped');
  resetPlay();
}

function resetPlay() {
  primeiraCarta = undefined;
  segundaCarta = undefined;
}

function checkEndOfGame() {
  const gotAllCards = hits === amountOfCards;
  if (gotAllCards) {
    setTimeout(finishGame, SECOND / 2);
  }
}

function finishGame() {
  gameFinished = true;
  sessionStorage.setItem("plays", plays);
  document.getElementById("txtResultado").innerText = plays ? `Você ganhou em ${plays} jogadas!` : "";
  document.getElementById("divResultado").classList.remove("hidden");
  document.getElementById("divTelaInicial").classList.add("hidden");
  document.getElementById("divInstrucoes").classList.add("hidden");
}

function randomOrderCriteria() {
  return Math.random() - 0.5;
}

function abrirModalInfo(cardId) {
  var modal = new bootstrap.Modal(document.getElementById("modalInfo"));
  var card = CARDS.find(card => card.id == cardId); 

  const divSaibaMais = document.getElementById("divSaibaMais");
  var btnSaibaMais = "";

  if (card.links.length > 0) {
    // ordena pelos títulos (A→Z), ignorando acentos/maiúsculas e com ordenação numérica
    var linksOrdenados = (Array.isArray(card.links) ? card.links : []).slice().sort((a, b) =>
      (a?.titulo || "").localeCompare(b?.titulo || "", "pt-BR", {
        sensitivity: "base",
        numeric: true
      })
    );

    if (linksOrdenados.length <= 2) {
      linksOrdenados.forEach(link => {
        btnSaibaMais += `<span><a class="btn btn-primary" target="_blank" href="${link.url}">${link.titulo}</a></span>`;
      });
    } else if (linksOrdenados.length > 1) {
      btnSaibaMais += `
      <div class="btn-group" role="group">
        <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
          Saiba mais
        </button>
        <ul class="dropdown-menu">
      `;
      linksOrdenados.forEach(link => {
        btnSaibaMais += `<li><a class="dropdown-item" target="_blank" href="${link.url}">${link.titulo}</a></li>`;
      });
      btnSaibaMais += ` </ul></div>`;
    }
  }

  divSaibaMais.innerHTML = btnSaibaMais;

  const modalInfoBody = document.getElementById("modalInfoBody");
  modalInfoBody.innerHTML = ` 
    <div class="div-img-info"><img src="${card.imagem}" alt="${card.nome}" class="img-info"><div>
    <h2>${card.nome}</h2>
    <div class="div-text-info" id="div-text-info">${card.texto}<div>`;
  modal.show();
}

function aoFecharModalInfo() {
  if (!gameFinished) checkEndOfGame();
}


// Resultados
function loadCardsPlayed() {
  const boardEl = document.querySelector('#cartoes-cientistas');
  var column = Math.ceil(Math.sqrt(amountOfCards * 2));

  var tabuleiroResultadoHtml = `
  <div class="container centralizado">
  
  <div id="cartoes" class="row row-cols-sm-2 row-cols-md-${column} row-cols-lg-${column} justify-content-center">
  `;
  // ordena por nome (A→Z), ignora acentos e usa ordenação numérica quando houver números no nome
  const cartasOrdenadas = [...cartasSelecionadas].sort((a, b) =>
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
          <button type="button" class="btn btn-primary"  onclick="abrirModalInfo('${card.id}')" >
            Leia mais
          </button>
        </div>
      </div>
    `;
  });

  tabuleiroResultadoHtml += '</div></div>';
  boardEl.innerHTML = tabuleiroResultadoHtml;
}

document.getElementById('modalInfo').addEventListener('hidden.bs.modal', () => {
  aoFecharModalInfo();
});

await fetchCards();
if (CARDS.length > 0) {
  amountOfCards = await resolveAmountOfCards();
  loadGame();
  loadCardsPlayed();
}
document.querySelector('#tabuleiro').addEventListener('click', (e) => {
  const card = e.target.closest('.cartao');

  if (!card) return;

  const cardId = card.getAttribute('data-id');
  markCardSeen(cardId, CARDS);

  // Se já foi acertada, apenas abre o modal e não deixa virar de novo
  if (card.classList.contains('is-matched')) {
    abrirModalInfo(cardId);
    return;
  }

  // Caso contrário, segue o fluxo normal de virar/checar par
  flipCard(card);
});

window.abrirModalInfo = abrirModalInfo;



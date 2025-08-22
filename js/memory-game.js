/* --- Firebase --- */
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";  

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
let CARDS = [];

const SECOND = 1_000;
let amountOfCards = 8;
let firstCard;
let secondCard;
let plays = 0;
let hits = 0;
let selectedCards = [];
let gameFinished = false;

// Helper: dá timeout em uma promise
function withTimeout(promise, ms = 10000) {
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
    // getDocs com timeout de 10s
    const snap = await withTimeout(getDocs(collection(db, "cards")), 10000);

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
  selectedCards = getRandomCards(amountOfCards);
  const cardsDisposal = selectedCards.flatMap(card => [card, card]);
  return cardsDisposal.sort(randomOrderCriteria);
} 

function getRandomCards(amount) {
  const shuffled = [...CARDS].sort(randomOrderCriteria);
  return shuffled.slice(0, amount);
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

  const isFirstCard = firstCard === undefined;
  if (isFirstCard) {
    firstCard = card;
    return;
  } else {
    secondCard = card;
    plays++;
  }

  const isMatch = firstCard.dataset.id === secondCard.dataset.id;

  if (isMatch) {
    hits++; 
    
    document.querySelectorAll(`.cartao[data-id="${firstCard.dataset.id}"]`)
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
  return firstCard !== undefined && secondCard !== undefined;
}

function unflipCardsAndResetPlay() {
  firstCard.classList.remove('is-flipped');
  secondCard.classList.remove('is-flipped');
  resetPlay();
}

function resetPlay() {
  firstCard = undefined;
  secondCard = undefined;
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
  document.getElementById("txtResultado").innerText = plays ? `Você ganhou em ${plays} jogadas!`: "";
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
   
  /*const modalInfoLabel = document.getElementById("modalInfoLabel"); 
  modalInfoLabel.innerHTML =`${card.nome}`;*/
 
  const divSaibaMais = document.getElementById("divSaibaMais"); 
  var btnSaibaMais = "";
   if(card.links.length <=2) {
        card.links.forEach(link => {
      btnSaibaMais += `<span><a class="btn btn-primary" target="_blank" href="${link.url}">${link.titulo}</a></span>`;
    });
  } else if(card.links.length > 1) {
    btnSaibaMais += `
     <div class="btn-group" role="group">
      <button type="button" class="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
        Saiba mais
      </button>
      <ul class="dropdown-menu">
    `;
    card.links.forEach(link => {
      btnSaibaMais += `<li><a class="dropdown-item" target="_blank" href="${link.url}">${link.titulo}</a></li>`;
    });    
    btnSaibaMais += ` </ul></div>`;
  }  

  divSaibaMais.innerHTML = btnSaibaMais;

  const modalInfoBody = document.getElementById("modalInfoBody"); 
  modalInfoBody.innerHTML= ` 
    <div class="div-img-info"><img src="${card.imagem}" alt="${card.nome}" class="img-info"><div>
    <h2>${card.nome}</h2>
    <div class="div-text-info" id="div-text-info">${card.texto}<div>`;
  modal.show();
}

function aoFecharModalInfo() {   
  if(!gameFinished) checkEndOfGame();  
}
 

// Resultados
function loadCardsPlayed(){ 
  const boardEl = document.querySelector('#cartoes-cientistas');
  var column = Math.ceil(Math.sqrt(amountOfCards*2)); 

  var tabuleiroResultadoHtml = `
  <div class="container centralizado">
  
  <div id="cartoes" class="row row-cols-sm-2 row-cols-md-${column} row-cols-lg-${column} justify-content-center"">
  `;

  selectedCards.forEach(card => {
    tabuleiroResultadoHtml += `  
        <div id="card-${card.id}" class="card cardResultado" >
        <img src="${card.imagem}" class="card-img-top" alt="${card.nome}">
        <div class="card-body">
          <h5 class="card-title">${card.nome}</h5> 
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

  tabuleiroResultadoHtml+='</div></div>';
  boardEl.innerHTML = tabuleiroResultadoHtml;
}

document.getElementById('modalInfo').addEventListener('hidden.bs.modal', () => {
  aoFecharModalInfo(); 
}); 

await fetchCards(); 
if(CARDS.length > 0) {
  loadGame();  
  loadCardsPlayed();
}  
document.querySelector('#tabuleiro').addEventListener('click', (e) => {
  const card = e.target.closest('.cartao');
  if (!card) return;

  const cardId = card.getAttribute('data-id');

  // Se já foi acertada, apenas abre o modal e não deixa virar de novo
  if (card.classList.contains('is-matched')) {
    abrirModalInfo(cardId);
    return;
  }

  // Caso contrário, segue o fluxo normal de virar/checar par
  flipCard(card);
});

window.abrirModalInfo = abrirModalInfo; 



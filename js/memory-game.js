/* --- Firebase --- */
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getFirestore, collection, getDocs } from
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";  

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
let CARDS = [];

async function fetchCards() {
  const snap = await getDocs(collection(db, "cards"));
  CARDS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
}                            

const SECOND = 1_000;

let amountOfCards = 8;
let firstCard;
let secondCard;
let plays = 0;
let hits = 0;
let selectedCards = [];
let gameFinished = false;

// jogo
function loadGame() {
  let cards = sortCardsDisposal();
  insertCardsIntoTheBoard(cards);
}

function sortCardsDisposal() { 
  console.log("Cards:");
  console.log(CARDS);
  amountOfCards = Math.min(CARDS.length, amountOfCards);
  selectedCards = getRandomCards(amountOfCards);
  const cardsDisposal = selectedCards.flatMap(card => [card, card]);
  return cardsDisposal.sort(randomOrderCriteria);
} 

function getRandomCards(amount) {
  const shuffled = [...CARDS].sort(randomOrderCriteria);
  return shuffled.slice(0, amount);
}

function insertCardsIntoTheBoard(cards) {
  const boardEl = document.querySelector('#tabuleiro');
  var column = Math.ceil(Math.sqrt(amountOfCards*2)); 

  var tabuleiro = `
  <div class="container text-center">
  
  <div class="row row-cols-sm-2 row-cols-md-${column} row-cols-lg-${column}">
  `;
  tabuleiro += cards.map(card => `
    <div class="col d-flex justify-content-center">
    <div class="cartao" id="card-${card.id}" data-id="${card.id}">
      <div class="cartao-front">
        <img src="./files/front.png" class="img-cartao">
      </div>
      <div class="cartao-back">
        <img src="${card.imagem}" class="img-cartao">
      </div>
    </div>
    </div>
  `).join('');
  tabuleiro+='</div></div>';
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
  document.getElementById("tabuleiro").classList.add("hidden");
  document.getElementById("divInstrucoes").classList.add("hidden");
}

function randomOrderCriteria() {
  return Math.random() - 0.5;
}

function abrirModalInfo(cardId) { 
  var modal = new bootstrap.Modal(document.getElementById("modalInfo"));
  var card = CARDS.find(card => card.id == cardId);
  
  const modalInfoLabel = document.getElementById("modalInfoLabel"); 
  modalInfoLabel.innerHTML =`${card.nome}`;
 
  const divSaibaMais = document.getElementById("divSaibaMais"); 
  var btnSaibaMais = "";
  if(card.links.length > 1) {
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
  } else if(card.links.length == 1) {
    btnSaibaMais += `<a class="btn btn-primary" target="_blank" href="${card.links[0].url}">Saiba mais</a>`;
  }

  divSaibaMais.innerHTML = btnSaibaMais;

  const modalInfoBody = document.getElementById("modalInfoBody"); 
  modalInfoBody.innerHTML= ` 
    <div class="div-img-info"><img src="${card.imagem}" alt="${card.nome}" class="img-info"><div>
    <div class="div-text-info" id="div-text-info">${card.texto}<div>`;
  modal.show();
}

function aoFecharModalInfo() {   
  if(!gameFinished) checkEndOfGame();  
}
 

// Resultados
function loadCardsPlayed(){ 
  const boardEl = document.querySelector('#cartoes-cientistas');
  boardEl.innerHTML = '';

  selectedCards.forEach(card => {
    boardEl.innerHTML += `  
        <div id="card-${card.id}" class="card cardResultado" >
        <img src="${card.imagem}" class="card-img-top" alt="${card.nome}">
        <div class="card-body">
          <h5 class="card-title">${card.nome}</h5> 
          <p class="card-text">
            ${card.texto.substring(0, 100) + "..."}
          </p> 
          <button type="button" class="btn btn-primary"  onclick="abrirModalInfo(${card.id})" >
            Leia mais
          </button>
        </div>
      </div>
    `;
  });
}

document.getElementById('modalInfo').addEventListener('hidden.bs.modal', () => {
  aoFecharModalInfo(); 
}); 

await fetchCards();    
loadGame();  
loadCardsPlayed();
document.querySelector('#tabuleiro').addEventListener('click', (e) => {
  const card = e.target.closest('.cartao');
  if (card) flipCard(card);
});
window.abrirModalInfo = abrirModalInfo;



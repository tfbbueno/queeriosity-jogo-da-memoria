const CARDS_IMGS = [
  "./cards/success-kid.jpg",
  "./cards/hide-in-pain.jpg",
  "./cards/nazare.jpg",
  "./cards/fry.jpg",
  "./cards/patrick.jpg",
  "./cards/pikachu.jpg",
];

const SECOND = 1_000;

let firstCard;
let secondCard;
let plays = 0;
let hits = 0;

function loadGame() {
  let cards = sortCardsDisposal();
  insertCardsIntoTheBoard(cards);
}

function sortCardsDisposal() {
  const cardsDisposal = [];

  CARDS_IMGS.forEach(card => {
    cardsDisposal.push(card);
    cardsDisposal.push(card);
  });

  return cardsDisposal.sort(randomOrderCriteria);
}

function insertCardsIntoTheBoard(cards) {
  const boardEl = document.querySelector('.board');
  boardEl.innerHTML = '';

  cards.forEach(card => {
    boardEl.innerHTML += `
        <div class="card" onclick="flipCard(this)">
          <div class="card-front">
            <img src='./cards/front.png'>
          </div>
          <div class="card-back">
            <img src='${card}'>
          </div>
        </div>    
    `;
  });
}

function flipCard(card) {
  if (isCardAlreadyFlipped(card) || isBothCardAlreadyFlipped()) return;

  card.classList.add('is-flipped');

  //sets card
  const isFirstCard = firstCard === undefined;
  if (isFirstCard) {
    firstCard = card;
    return;
  } else {
    secondCard = card;
    plays++;
  }

  const isMatch = firstCard.innerHTML === secondCard.innerHTML;
  if (isMatch) {
    hits++;
    resetPlay();
  } else {
    setTimeout(unflipCardsAndResetPlay, SECOND);
  }

  checkEndOfGame();
}

function isCardAlreadyFlipped(card) {
  return card.classList.contains("is-flipped")
}

function isBothCardAlreadyFlipped() {
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
  const gotAllCards = hits === CARDS_IMGS.length;
  if (gotAllCards) {
    setTimeout(finishGame, SECOND / 2);
  }
}

function finishGame() {
  alert(`Parabéns! Você ganhou em ${plays} jogada(s)!`);
}


function randomOrderCriteria() {
  return Math.random() - 0.5;
}

loadGame();
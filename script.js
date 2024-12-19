const CARDS_IMGS = [
  "./cards/bobrossparrot.gif",
  "./cards/explodyparrot.gif",
  "./cards/fiestaparrot.gif",
  "./cards/metalparrot.gif",
  "./cards/revertitparrot.gif",
  "./cards/tripletsparrot.gif",
  "./cards/unicornparrot.gif",
];

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

  for (let i = 0; i < CARDS_IMGS.length; i++) {
    const card = CARDS_IMGS[i];

    // pair
    cardsDisposal.push(card);
    cardsDisposal.push(card);
  }

  return cardsDisposal.sort(randomOrderCriteria);
}

function insertCardsIntoTheBoard(cards) {
  const boardEl = document.querySelector('.board');
  boardEl.innerHTML = '';
  for (let i = 0; i < cards.length; i++) {
    boardEl.innerHTML += `
      <div class="card">
        <div class="card-inner" onclick="flipCard(this)">
          <div class="card-front">
            <img src='./cards/front.png'>
          </div>
          <div class="card-back">
            <img src='${cards[i]}'>
          </div>
        </div>    
      </div>
    `;
  }
}

function flipCard(card) {
  if (card.classList.contains("is-flipped")) {
    return;
  }

  if (firstCard !== undefined) {
    if (secondCard !== undefined) {
      return;
    }
  }

  plays++;
  card.classList.add('is-flipped');

  const isFirstCard = firstCard === undefined;
  if (isFirstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;

  const sameCards = firstCard.innerHTML === secondCard.innerHTML;
  if (!sameCards) {
    setTimeout(unflipCards, 1000);
    return;
  }

  firstCard = undefined;
  secondCard = undefined;
  hits++;

  checkEndOfGame();
}

function flipIfIsDiffentCard(card) {
  if (card.classList.contains("is-flipped")) {
    return;
  }

  if (firstCard !== undefined) {
    if (secondCard !== undefined) {
      return;
    }
  }

  plays++;
  card.classList.add('is-flipped');

}

function unflipCards() {
  firstCard.classList.remove('is-flipped');
  secondCard.classList.remove('is-flipped');
  firstCard = undefined;
  secondCard = undefined;
}

function checkEndOfGame() {
  if (hits === CARDS_IMGS.length) {
    setTimeout(finishGame, 500);
  }
}

function finishGame() {
  alert(`Parabéns! Você ganhou em ${hits} jogada(s)!`);
}


function randomOrderCriteria() {
  return Math.random() - 0.5;
}

loadGame();
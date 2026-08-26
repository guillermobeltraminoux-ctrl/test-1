'use strict';

/* ===========================
   WORD LIST  (50 x 5-letter superhero words)
   Marvel heroes, DC heroes, villains, powers, locations
   =========================== */
const WORD_LIST = [
    // Marvel heroes / characters
    'STORM', 'ROGUE', 'LOGAN', 'STARK', 'GROOT',
    'WANDA', 'BLADE', 'GHOST', 'OKOYE', 'SCOTT',
    'ORORO', 'NAMOR', 'SHURI', 'MILES', 'CAROL',
    'PETER', 'BRUCE', 'CLOAK', 'QUAKE', 'THANE',

    // Marvel villains / organizations / places
    'VENOM', 'HYDRA', 'TITAN', 'SWARM', 'NEXUS',
    'BLAZE', 'TOXIN', 'KAINE', 'TIGRA', 'SIMON',

    // DC heroes / characters
    'DIANA', 'BARRY', 'ROBIN', 'RAVEN', 'STEEL',
    'ARROW', 'FLASH', 'FROST', 'ATLAS', 'VALOR',

    // DC villains
    'JOKER', 'TALON', 'CIRCE', 'DONNA', 'BARDA',

    // Powers / concepts / locations
    'SPEED', 'LASER', 'MAGIC', 'WITCH', 'CHAOS',
    'FORCE', 'PRISM', 'NIGHT', 'LASSO', 'EMBER'
];

/* ===========================
   WIN / LOSE MESSAGES
   =========================== */
const WIN_MESSAGES = [
    'OMNISCIENT! Are you even mortal?!',
    'LEGENDARY! Superhero instincts!',
    'AMAZING! Worthy of the mantle!',
    'HEROIC! Justice is served!',
    'CLOSE CALL! The hero prevails!',
    'PHEW! Saved in the nick of time!'
];

const WIN_ICONS  = ['&#129351;', '&#9889;', '&#127775;', '&#127942;', '&#128170;', '&#9876;'];
const LOSE_ICONS = ['&#128128;', '&#9760;', '&#128165;'];

/* ===========================
   GAME STATE
   =========================== */
let targetWord   = '';
let currentRow   = 0;
let currentCol   = 0;
let currentGuess = [];
let gameOver     = false;
let tileGrid     = [];   // tileGrid[row][col] → <div class="tile">
let keyElements  = {};   // letter → <button class="key">

/* ===========================
   INITIALISE
   =========================== */
function init() {
    targetWord = pickWord();
    buildBoard();
    buildKeyboard();
    document.addEventListener('keydown', onPhysicalKey);
    document.getElementById('play-again').addEventListener('click', resetGame);
}

function pickWord() {
    return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

/* ===========================
   BUILD DOM
   =========================== */
function buildBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    tileGrid = [];

    for (let r = 0; r < 6; r++) {
        const rowEl = document.createElement('div');
        rowEl.classList.add('board-row');
        tileGrid[r] = [];

        for (let c = 0; c < 5; c++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            rowEl.appendChild(tile);
            tileGrid[r][c] = tile;
        }

        board.appendChild(rowEl);
    }
}

function buildKeyboard() {
    const keyboard = document.getElementById('keyboard');
    keyboard.innerHTML = '';
    keyElements = {};

    const rows = [
        ['Q','W','E','R','T','Y','U','I','O','P'],
        ['A','S','D','F','G','H','J','K','L'],
        ['ENTER','Z','X','C','V','B','N','M','DEL']
    ];

    rows.forEach(keys => {
        const rowEl = document.createElement('div');
        rowEl.classList.add('keyboard-row');

        keys.forEach(k => {
            const btn = document.createElement('button');
            btn.classList.add('key');
            btn.textContent = k;
            btn.dataset.key = k;
            if (k === 'ENTER' || k === 'DEL') btn.classList.add('wide');
            btn.addEventListener('click', () => handleKey(k));
            rowEl.appendChild(btn);
            if (k.length === 1) keyElements[k] = btn;
        });

        keyboard.appendChild(rowEl);
    });
}

/* ===========================
   INPUT HANDLING
   =========================== */
function onPhysicalKey(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const key = e.key.toUpperCase();
    if (key === 'ENTER')                handleKey('ENTER');
    else if (key === 'BACKSPACE')       handleKey('DEL');
    else if (/^[A-Z]$/.test(key))      handleKey(key);
}

function handleKey(key) {
    if (gameOver) return;
    if (key === 'ENTER')           submitGuess();
    else if (key === 'DEL')        deleteLetter();
    else if (/^[A-Z]$/.test(key)) addLetter(key);
}

function addLetter(letter) {
    if (currentCol >= 5) return;
    const tile = tileGrid[currentRow][currentCol];
    tile.textContent = letter;
    tile.classList.add('filled');
    currentGuess.push(letter);
    currentCol++;
}

function deleteLetter() {
    if (currentCol <= 0) return;
    currentCol--;
    currentGuess.pop();
    const tile = tileGrid[currentRow][currentCol];
    tile.textContent = '';
    tile.classList.remove('filled');
}

/* ===========================
   GUESS SUBMISSION
   =========================== */
function submitGuess() {
    if (currentCol < 5) {
        shakeTiles(currentRow);
        showToast('Not enough letters!');
        return;
    }

    const guess   = currentGuess.join('');
    const results = evaluateGuess(guess, targetWord);
    const row     = currentRow;
    const won     = results.every(r => r === 'correct');

    // Advance state before the async reveal
    currentRow++;
    currentCol   = 0;
    currentGuess = [];

    revealTiles(row, results, () => {
        updateKeyboard(guess, results);

        if (won) {
            gameOver = true;
            setTimeout(() => showModal(true, row), 350);
        } else if (currentRow >= 6) {
            gameOver = true;
            setTimeout(() => showModal(false, row), 350);
        }
    });
}

/* ===========================
   GUESS EVALUATION
   =========================== */
function evaluateGuess(guess, target) {
    const result    = Array(5).fill('absent');
    const targetArr = target.split('');
    const guessArr  = guess.split('');

    // Pass 1 – exact matches (green)
    for (let i = 0; i < 5; i++) {
        if (guessArr[i] === targetArr[i]) {
            result[i]    = 'correct';
            targetArr[i] = null;
            guessArr[i]  = null;
        }
    }

    // Pass 2 – wrong position (yellow)
    for (let i = 0; i < 5; i++) {
        if (guessArr[i] === null) continue;
        const idx = targetArr.indexOf(guessArr[i]);
        if (idx !== -1) {
            result[i]      = 'present';
            targetArr[idx] = null;
        }
    }

    return result;
}

/* ===========================
   ANIMATIONS
   =========================== */
const FLIP_DURATION = 550;   // ms – must match CSS animation duration
const TILE_DELAY    = 300;   // ms between each tile flip

function revealTiles(row, results, onComplete) {
    const tiles = tileGrid[row];

    tiles.forEach((tile, i) => {
        setTimeout(() => {
            tile.classList.add('flip');

            // At the midpoint the tile is invisible → swap colour class
            setTimeout(() => {
                tile.classList.remove('filled');
                tile.classList.add(results[i]);
            }, FLIP_DURATION * 0.45);

            tile.addEventListener('animationend', () => {
                tile.classList.remove('flip');
            }, { once: true });
        }, i * TILE_DELAY);
    });

    const totalTime = (tiles.length - 1) * TILE_DELAY + FLIP_DURATION;
    setTimeout(onComplete, totalTime + 100);
}

function shakeTiles(row) {
    tileGrid[row].forEach(tile => {
        tile.classList.add('shake');
        tile.addEventListener('animationend', () => tile.classList.remove('shake'), { once: true });
    });
}

/* ===========================
   KEYBOARD COLOUR TRACKING
   Priority: correct > present > absent
   =========================== */
const STATE_PRIORITY = { correct: 3, present: 2, absent: 1 };

function updateKeyboard(guess, results) {
    for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const btn    = keyElements[letter];
        if (!btn) continue;

        const current  = btn.dataset.state || '';
        const incoming = results[i];

        if (!current || STATE_PRIORITY[incoming] > (STATE_PRIORITY[current] || 0)) {
            btn.dataset.state = incoming;
            btn.classList.remove('correct', 'present', 'absent');
            btn.classList.add(incoming);
        }
    }
}

/* ===========================
   TOAST NOTIFICATION
   =========================== */
let toastTimer = null;

function showToast(msg, duration = 1600) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

/* ===========================
   WIN / LOSE MODAL
   =========================== */
function showModal(won, rowIndex) {
    const modal   = document.getElementById('modal');
    const iconEl  = document.getElementById('modal-icon');
    const titleEl = document.getElementById('modal-title');
    const msgEl   = document.getElementById('modal-message');
    const wordEl  = document.getElementById('modal-word');

    if (won) {
        iconEl.innerHTML  = WIN_ICONS[rowIndex] || WIN_ICONS[5];
        titleEl.innerHTML = '&#9889; VICTORY! &#9889;';
        titleEl.className = 'win-title';
        msgEl.textContent = WIN_MESSAGES[rowIndex] || WIN_MESSAGES[5];
    } else {
        iconEl.innerHTML  = LOSE_ICONS[Math.floor(Math.random() * LOSE_ICONS.length)];
        titleEl.innerHTML = '&#128165; DEFEATED &#128165;';
        titleEl.className = 'lose-title';
        msgEl.textContent = 'Even the mightiest heroes fall... Train harder!';
    }

    wordEl.innerHTML = `The word was:<span class="highlight-word">${targetWord}</span>`;
    modal.classList.remove('hidden');
}

/* ===========================
   RESET / NEW GAME
   =========================== */
function resetGame() {
    document.getElementById('modal').classList.add('hidden');
    targetWord   = pickWord();
    currentRow   = 0;
    currentCol   = 0;
    currentGuess = [];
    gameOver     = false;
    buildBoard();
    buildKeyboard();
}

/* ===========================
   START
   =========================== */
init();

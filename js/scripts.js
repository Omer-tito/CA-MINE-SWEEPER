'use strict'

// ICONS - These ARE used for rendering the UI
const BOMB_ICON = '💣'
const FLAG_ICON = '🚩'
const EXPLOSION_ICON = '💥'

// LEVEL Difficulty
var gLevel = {
    SIZE: 7,
    MINES: 8
}

// STATE
var gTimerInterval
var gBoard = []
var gLives = 0
var gBombs = gLevel.MINES
var gClueActive = false
var gLastClueBtn = null
var gHistory

var gGame = {
    isOn: true,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0
}

// Reset Game State
function onInitGame() {
    // Stop any previous timer
    stopTimer()
    gGame.secsPassed = 0
    const elSeconds = document.querySelector('.seconds')
    if (elSeconds) elSeconds.innerText = 0

    gHistory = []
    gGame.isOn = true
    gGame.revealedCount = 0
    gGame.markedCount = 0
    gLives = 3
    gBombs = gLevel.MINES
    gClueActive = false
    gLastClueBtn = null



    // Update UI 
    document.querySelector('.status-button-smiley').innerText = '😊'
    document.querySelector('.hint-container').innerHTML = ''
    const elLives = document.querySelector('.lives-count')
    if (elLives) elLives.innerText = gLives

    // Build Board
    createTable()
    renderTable()
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {

    const cellSelector = '.' + getClassName(location)
    const elCell = document.querySelector(cellSelector)

    elCell.innerHTML = value
}


function createTable() {
    for (let i = 0; i < gLevel.SIZE; i++) {
        gBoard[i] = []
        for (let j = 0; j < gLevel.SIZE; j++) {
            gBoard[i][j] = {
                minesAroundCount: 0,
                isRevealed: false,
                isMine: false,
                isMarked: false
            }
        }
    }
}

function renderTable() {
    var elTable = document.querySelector('table')
    var strHTML = ''
    for (let i = 0; i < gLevel.SIZE; i++) {
        strHTML += '<tr>'
        for (let j = 0; j < gLevel.SIZE; j++) {
            strHTML +=
                `<td class="cell cell-${i}-${j}" 
                    onclick="onClick(${i},${j})"
                    oncontextmenu="onRightClick(event, ${i}, ${j})"> </td>`
        }
        strHTML += '</tr>'
    }
    elTable.innerHTML = strHTML
}

function placeBombs(firstClickI, firstClickJ) {
    var bombsPlaced = 0

    while (bombsPlaced < gLevel.MINES) {
        var emptyCells = getEmptyCells()

        // Filter out the first clicked cell so a bomb is never placed there
        emptyCells = emptyCells.filter(cell => cell.i !== firstClickI || cell.j !== firstClickJ)

        if (emptyCells.length === 0) break

        var idx = getRandomInt(0, emptyCells.length)
        var chosenCellPos = emptyCells[idx]

        // UPDATE MODEL
        gBoard[chosenCellPos.i][chosenCellPos.j].isMine = true
        bombsPlaced++

    }
}
function placeNumbers() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isMine) {
                currCell.minesAroundCount = countBombsAround(i, j)
            }
        }
    }
}


function getEmptyCells() {
    var emptyCells = []
    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            var currCell = gBoard[i][j]
            // check if it's NOT a mine and NOT already revealed
            if (!currCell.isMine && !currCell.isRevealed) {
                emptyCells.push({ i, j })
            }
        }
    }
    return emptyCells
}


function onClick(i, j) {

    // Guard clauses
    if (!gGame.isOn) return
    var currCell = gBoard[i][j]
    if (currCell.isRevealed || currCell.isMarked) return
    if (gClueActive) {
        revealHint(i, j)
        return // Stop regular click logic
    }
    
    
    // Action: Mine vs Safe Space
    if (currCell.isMine) {
        saveHistory()
        handleBomb(i, j)
    } else {
        // START TIMER on first move
        if (gGame.revealedCount === 0 && !gTimerInterval) {
            placeBombs(i, j)
            placeNumbers()
            startTimer()
            renderClueButtons()
            saveHistory()
        }
        // Start the expansion (this will handle the reveal of the clicked cell too)
        saveHistory()
        expandReveal(i, j)
        checkWin()
    }
}

function countBombsAround(cellI, cellJ) {
    var count = 0
    var neighbors = getNeighbors(cellI, cellJ)

    for (var i = 0; i < neighbors.length; i++) {
        var pos = neighbors[i]
        if (gBoard[pos.i][pos.j].isMine) count++
    }

    return count
}

function onRightClick(ev, i, j) {
    ev.preventDefault()
    var currCell = gBoard[i][j]

    if (currCell.isRevealed || !gGame.isOn) return
    saveHistory()

    // Toggle
    currCell.isMarked = !currCell.isMarked

    // Render based on boolean
    var icon = (currCell.isMarked) ? FLAG_ICON : ''
    renderCell({ i, j }, icon)
    checkWin()
}

function handleBomb(i, j) {
    gLives--
    const elLives = document.querySelector('.lives-count')
    if (elLives) elLives.innerText = gLives

    if (gLives === 0) {
        gameOver(false)
        stopTimer()
        renderCell({ i, j }, EXPLOSION_ICON)
        document.querySelector('.status-button-smiley').innerText = '🤯';
    } else {
        document.querySelector('.status-button-smiley').innerText = '🤕';
        renderCell({ i, j }, EXPLOSION_ICON)
        const elCell = document.querySelector('.' + getClassName({ i, j }))
    }
}


function revealAllBombs() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            // CHANGE THIS LINE:
            if (gBoard[i][j].isMine && !gBoard[i][j].isRevealed) {
                renderCell({ i, j }, BOMB_ICON)
            }
        }
    }
}


function checkWin() {
    const totalSafeCells = (gLevel.SIZE * gLevel.SIZE) - gLevel.MINES

    // Check 1: Are all safe cells revealed?
    if (gGame.revealedCount !== totalSafeCells) return

    // Check 2: Are all mines marked?
    var correctlyMarkedCount = 0
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var currCell = gBoard[i][j]
            if (currCell.isMine && currCell.isMarked) {
                correctlyMarkedCount++
            }
        }
    }

    if (correctlyMarkedCount === gLevel.MINES) {
        gGame.isOn = false
        stopTimer()
        gameOver(true)
        document.querySelector('.status-button-smiley').innerText = '😎';

    }
}


function gameOver(isWon) {
    const elModal = document.querySelector('.game-over-modal')
    const elTitle = document.querySelector('.game-over-title')

    if (isWon) {
        elTitle.innerText = 'YOU ARE VICTORIOUS!'
        document.querySelector('.status-button-smiley').innerText = '😎'
    } else {
        gGame.isOn = false
        revealAllBombs()
        elTitle.innerText = 'You Went KaBoom....'
        document.querySelector('.status-button-smiley').innerText = '🤯'
    }

    elModal.classList.remove('hidden')
    stopTimer()
}

function expandReveal(cellI, cellJ) {
    var currCell = gBoard[cellI][cellJ]

    if (currCell.isRevealed || currCell.isMarked) return

    // Model
    currCell.isRevealed = true
    gGame.revealedCount++

    // DOM
    const elCell = document.querySelector('.' + getClassName({ i: cellI, j: cellJ }))
    elCell.classList.add('revealed')

    var value = (currCell.minesAroundCount > 0) ? currCell.minesAroundCount : ''
    renderCell({ i: cellI, j: cellJ }, value)

    if (value) {
        elCell.style.color = getNumberColor(currCell.minesAroundCount)
        return // Stop recursion if we hit a number
    }

    // Get neighbors and expand
    var neighbors = getNeighbors(cellI, cellJ)

    for (var i = 0; i < neighbors.length; i++) {
        var pos = neighbors[i]
        // Recurse into non-mine neighbors
        if (!gBoard[pos.i][pos.j].isMine) {
            expandReveal(pos.i, pos.j)
        }
    }
}



function startTimer() {
    var elSeconds = document.querySelector('.seconds')
    var startTime = Date.now()

    gTimerInterval = setInterval(() => {
        gGame.secsPassed = Math.floor((Date.now() - startTime) / 1000)
        elSeconds.innerText = gGame.secsPassed
    }, 1000)
}

function stopTimer() {
    clearInterval(gTimerInterval)
    gTimerInterval = null
}

function resetGame(SmileyClicked) {
    if (SmileyClicked) {
        onInitGame()
        document.querySelector('.game-over-modal').classList.add('hidden')
        return
    }
    document.querySelector('.game-over-modal').classList.toggle('hidden')
    onInitGame()
}


function renderClueButtons() {
    var strHTML = ''
    for (let i = 0; i < 3; i++) {
        strHTML +=
            `<button class="hint-button" onclick="activateClue(this)">💡</button>`
    }
    document.querySelector('.hint-container').innerHTML = strHTML
}

function activateClue(elClue) {
    if (!gGame.isOn || gClueActive) return;

    // Visual feedback that a hint is "primed"
    elClue.classList.add('hint-active');
    elClue.innerText = '🧐';
    gClueActive = true;

    // Store the element so we can remove it after use
    gLastClueBtn = elClue;
}

function revealHint(cellI, cellJ) {
    gClueActive = false;
    if (gLastClueBtn) gLastClueBtn.style.visibility = 'hidden'; // Hide the used bulb

    const cellsToFlash = getNeighbors(cellI, cellJ);
    cellsToFlash.push({ i: cellI, j: cellJ });

    cellsToFlash.forEach(pos => {
        const currCell = gBoard[pos.i][pos.j];
        if (!currCell.isRevealed) {
            visualReveal(pos.i, pos.j);
        }
    });

    setTimeout(() => {
        cellsToFlash.forEach(pos => {
            const currCell = gBoard[pos.i][pos.j];
            if (!currCell.isRevealed) {
                visualHide(pos.i, pos.j);
            }
        });
    }, 1000);
}

function visualReveal(i, j) {
    const currCell = gBoard[i][j]
    const elCell = document.querySelector('.' + getClassName({ i, j }))

    elCell.classList.add('revealed-hint') // Use a specific class for hints

    let value = ''
    if (currCell.isMine) value = BOMB_ICON
    else value = (currCell.minesAroundCount > 0) ? currCell.minesAroundCount : ''

    elCell.innerHTML = value
}

function visualHide(i, j) {
    const elCell = document.querySelector('.' + getClassName({ i, j }))
    elCell.classList.remove('revealed-hint')
    elCell.innerHTML = ''
}

function undo() {
    if (gHistory.length === 0) return

    const prevState = gHistory.pop()

    // Restore Model
    gBoard = prevState.board
    gGame.revealedCount = prevState.revealedCount
    gGame.markedCount = prevState.markedCount
    gLives = prevState.lives
    gGame.isOn = prevState.isOn

    // Restore Clue State
    gClueActive = prevState.gClueActive

    // Restore UI
    document.querySelector('.lives-count').innerText = gLives
    document.querySelector('.hint-container').innerHTML = prevState.hintsHTML // Restores the bulbs

    // Restore Smiley
    const elSmiley = document.querySelector('.status-button-smiley')
    if (gLives === 3) elSmiley.innerText = '😊'
    else if (gLives > 0) elSmiley.innerText = '🤕'
    else elSmiley.innerText = '🤯'

    document.querySelector('.game-over-modal').classList.add('hidden')
    renderUndoedBoard()
}

// Special render function for Undo to update DOM classes
function renderUndoedBoard() {
    for (let i = 0; i < gLevel.SIZE; i++) {
        for (let j = 0; j < gLevel.SIZE; j++) {
            const cell = gBoard[i][j]
            const elCell = document.querySelector(`.cell-${i}-${j}`)

            // Sync classes
            if (cell.isRevealed) {
                elCell.classList.add('revealed')
                let value = (cell.minesAroundCount > 0) ? cell.minesAroundCount : ''
                elCell.innerText = value
                if (value) elCell.style.color = getNumberColor(cell.minesAroundCount)
            } else {
                elCell.classList.remove('revealed')
                elCell.innerText = cell.isMarked ? FLAG_ICON : ''
            }
        }
    }
}

function saveHistory() {
    const snapshot = {
        board: JSON.parse(JSON.stringify(gBoard)),
        revealedCount: gGame.revealedCount,
        markedCount: gGame.markedCount,
        lives: gLives,
        isOn: gGame.isOn,
        // Add these:
        hintsHTML: document.querySelector('.hint-container').innerHTML,
        gClueActive: gClueActive
    }
    gHistory.push(snapshot)
}

function updateUndoButton() {
    const elUndoBtn = document.querySelector('.undo-button');
    // Disable if no moves have been made yet
    if (gHistory.length === 0) {
        elUndoBtn.disabled = true;
        elUndoBtn.classList.add('disabled');
    } else {
        elUndoBtn.disabled = false;
        elUndoBtn.classList.remove('disabled');
    }
}
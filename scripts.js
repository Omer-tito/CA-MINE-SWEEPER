'use strict'

// ICONS - These ARE used for rendering the UI
const BOMB_ICON = '💣'
const FLAG_ICON = '🚩'
const EXPLOSION_ICON = '💥'

// LEVEL Difficulty
var gLevel = {
    SIZE: 8,
    MINES: 6
}

// STATE
var gTimerInterval
var gBoard = []
var gLives = 1
var gBombs = gLevel.MINES

var gGame = {
    isOn: true,
    revealedCount: 0,
    markedCount: 0,
    secsPassed: 0
}

function onInitGame() {
    // Reset Game State
    stopTimer() // Stop any previous timer
    gGame.secsPassed = 0
    const elSeconds = document.querySelector('.seconds')
    if (elSeconds) elSeconds.innerText = 0
    gGame.isOn = true
    gGame.revealedCount = 0
    gGame.markedCount = 0
    gLives = 1
    gBombs = gLevel.MINES

    // Update UI Lives
    const elLives = document.querySelector('.lives-count')
    if (elLives) elLives.innerText = gLives

    // Build Board
    createTable()
    placeBombs()
    placeNumbers()
    renderTable()
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {

    const cellSelector = '.' + getClassName(location)
    const elCell = document.querySelector(cellSelector)

    elCell.innerHTML = value
}


// Returns the class name for a specific cell
function getClassName(position) {
    const cellClass = `cell-${position.i}-${position.j}`
    return cellClass
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

function placeBombs() {
    for (let i = 0; i < gBombs; i++) {
        var emptyCells = getEmptyCells()

        // If no empty cells left, stop trying to place bombs
        if (emptyCells.length === 0) break

        var chosenCellPos = emptyCells[getRandomInt(0, emptyCells.length)]

        // UPDATE MODEL
        gBoard[chosenCellPos.i][chosenCellPos.j].isMine = true

        // Note: I removed the renderCell here so bombs stay hidden!
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

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

function onClick(i, j) {
    // 1. Guard clauses
    if (!gGame.isOn) return
    var currCell = gBoard[i][j]
    if (currCell.isRevealed || currCell.isMarked) return

    // 2. Action: Mine vs Safe Space
    if (currCell.isMine) {
        handleBomb(i, j)
    } else {
        // START TIMER on first move
        if (gGame.revealedCount === 0 && !gTimerInterval) {
            startTimer()
        }
        // Start the expansion (this will handle the reveal of the clicked cell too)
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

function getNumberColor(count) {
    switch (count) {
        case 1: return '#0000FF'; // Blue
        case 2: return '#008000'; // Green
        case 3: return '#FF0000'; // Red
        case 4: return '#000080'; // Dark Blue
        case 5: return '#800000'; // Maroon
        case 6: return '#008080'; // Teal
        case 7: return '#000000'; // Black
        case 8: return '#808080'; // Gray
        default: return 'black';
    }
}

function onRightClick(ev, i, j) {
    ev.preventDefault()
    var currCell = gBoard[i][j]

    if (currCell.isRevealed || !gGame.isOn) return

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
        gGame.isOn = false
        stopTimer()
        renderCell({ i, j }, EXPLOSION_ICON)
        revealAllBombs()
        console.log('Game Over!')
    } else {
        renderCell({ i, j }, EXPLOSION_ICON)
        const elCell = document.querySelector('.' + getClassName({ i, j }))
        elCell.style.backgroundColor = 'red'
    }
}


function revealAllBombs() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            // CHANGE THIS LINE:
            if (gBoard[i][j].isMine) {
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
        console.log('VICTORY! All mines flagged and board cleared.')
    }
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


function getNeighbors(cellI, cellJ) {
    var neighbors = []
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gLevel.SIZE) continue

        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gLevel.SIZE) continue
            if (i === cellI && j === cellJ) continue

            neighbors.push({ i: i, j: j })
        }
    }
    return neighbors
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
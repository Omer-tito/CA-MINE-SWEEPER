'use strict'


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

// Returns the class name for a specific cell
function getClassName(position) {
    const cellClass = `cell-${position.i}-${position.j}`
    return cellClass
}

function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
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

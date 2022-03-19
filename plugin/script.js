/**
 * Cheatle Scraper
 *
 * To clear local storage:
 * localStorage.removeItem("nyt-wordle-state");location.reload()
 */

const WORDLES = [
  "https://www.nytimes.com/games/wordle/index.html",
  "https://www.wordleunlimited.com/"
]

const GUESS_STATE = {
  correct: "correct",
  present: "present",
  absent: "absent"
}

const getElement = {
  game: () => {
    switch (window.location.href) {
      case WORDLES[1]:
        return document.querySelector(".Game")
      default:
        return document
          .querySelector("game-app")
          .shadowRoot.querySelector("game-theme-manager")
          .querySelector("#game")
    }
  },
  keyboard: game => {
    switch (window.location.href) {
      case WORDLES[1]:
        return game.querySelector(".Game-keyboard")
      default:
        return game
          .querySelector("game-keyboard")
          .shadowRoot.querySelector("#keyboard")
    }
  },
  submit: keyboard => {
    switch (window.location.href) {
      case WORDLES[1]:
        return keyboard.querySelector(
          ".Game-keyboard-button.Game-keyboard-button-wide"
        )
      default:
        return keyboard.querySelector('button[data-key="↵"]')
    }
  },
  rows: game => {
    switch (window.location.href) {
      case WORDLES[1]:
        return game.querySelectorAll(".RowL")
      default:
        return game.querySelectorAll("game-row")
    }
  },
  columns: rows => {
    switch (window.location.href) {
      case WORDLES[1]:
        return rows[0].querySelectorAll(".RowL-letter")
      default:
        return rows[0].shadowRoot.querySelectorAll("game-tile")
    }
  },
  tiles: row => {
    switch (window.location.href) {
      case WORDLES[1]:
        return row.querySelectorAll(".RowL-letter")
      default:
        return row.shadowRoot.querySelectorAll("game-tile")
    }
  },
  letter: tile => {
    switch (window.location.href) {
      case WORDLES[1]:
        return tile.innerHTML
      default:
        return tile.getAttribute("letter")
    }
  },
  evaluation: tile => {
    switch (window.location.href) {
      case WORDLES[1]:
        let evaluation
        if (tile.classList.contains("letter-correct")) {
          evaluation = GUESS_STATE.correct
        } else if (tile.classList.contains("letter-elsewhere")) {
          evaluation = GUESS_STATE.present
        } else {
          evaluation = GUESS_STATE.absent
        }
        return evaluation
      default:
        return tile.getAttribute("evaluation")
    }
  },
  revelation: tiles => {
    switch (window.location.href) {
      case WORDLES[1]:
        return (
          tiles[0].parentNode.classList.contains("RowL-locked-in") &&
          [...tiles].every(
            tile =>
              tile.classList.contains("letter-correct") ||
              tile.classList.contains("letter-elsewhere") ||
              tile.classList.contains("letter-absent")
          )
        )
      default:
        return (
          [...tiles].filter(tile => tile.hasAttribute("reveal"))
            .length === config.columnCount
        )
    }
  },
  emptyTiles: tiles => {
    switch (window.location.href) {
      case WORDLES[1]:
        return (
          !tiles[0].parentNode.classList.contains("RowL-locked-in") |
          ![...tiles].every(
            tile =>
              tile.classList.contains("letter-correct") ||
              tile.classList.contains("letter-elsewhere") ||
              tile.classList.contains("letter-absent")
          )
        )
      default:
        return (
          [...tiles].filter(tile => !tile.hasAttribute("evaluation"))
            .length > 0
        )
    }
  },
  keyboardTarget: game => {
    switch (window.location.href) {
      case WORDLES[1]:
        return game
      default:
        return window
    }
  }
}

const game = getElement.game()
if (!game) {
  console.error("Invalid URL")
  exit()
}

const keyboard = getElement.keyboard(game)
const submit = getElement.submit(keyboard)
const rows = getElement.rows(game)
const cols = getElement.columns(rows)

/// Data
const config = {
  rowCount: rows.length,
  columnCount: cols.length
}
const gameData = {
  currentRow: 0,
  guesses: Array(),
  emojis: Array(),
  correct: Array(config.columnCount),
  absent: Array(),
  present: Object()
}

const typeLetter = (l, i) => {
  setTimeout(() => {
    getElement.keyboardTarget(game).dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: l,
        bubbles: true
      })
    )
  }, i * 80)
}

/**
 * Parse Row
 */
const parseRow = (callAPI = true) => {
  let currentGuess = ""
  let currentEmoji = ""
  const tiles = getElement.tiles(rows[gameData.currentRow])

  let rowData = {
    correct: Array(config.columnCount),
    absent: Array(),
    present: Object()
  }
  for (const [tileIdx, tile] of tiles.entries()) {
    const letter = getElement.letter(tile)
    const evaluation = getElement.evaluation(tile)

    switch (evaluation) {
      case GUESS_STATE.correct:
        currentEmoji += "🟩"

        gameData.correct[tileIdx] = letter
        if (letter in gameData.present) {
          delete gameData.present[letter]
        }
        break

      case GUESS_STATE.present:
        currentEmoji += "🟨"

        if (rowData.present[letter] === undefined) {
          rowData.present[letter] = {
            letter,
            notIn: [tileIdx]
          }
        } else {
          if (!rowData.present[letter].notIn.includes(tileIdx)) {
            rowData.present[letter].notIn.push(tileIdx)
          }
        }
        break

      case GUESS_STATE.absent:
        currentEmoji += "⬜️"

        if (
          !rowData.absent.includes(letter) &&
          !(letter in rowData.present)
        ) {
          rowData.absent.push(letter)
        }
        break
    }

    currentGuess += letter
  }

  /// Add notIn positions to present letters
  /// based on correct positions
  for (const [correctIdx, correctLetter] of rowData.correct.entries()) {
    if (correctLetter === undefined) {
      continue
    }

    for (const presentLetter of Object.keys(rowData.present)) {
      if (!rowData.present[presentLetter].notIn.includes(correctIdx)) {
        rowData.present[presentLetter].notIn.push(correctIdx)
      }
    }
  }

  for (const presentLetter in rowData.present) {
    if (![...gameData.correct].includes(presentLetter)) {
      if (presentLetter in gameData.present) {
        gameData.present[presentLetter].notIn = [
          ...gameData.present[presentLetter].notIn,
          ...rowData.present[presentLetter].notIn
        ]
      } else {
        gameData.present[presentLetter] = rowData.present[presentLetter]
      }
    }
  }
  for (const absentLetter of rowData.absent) {
    if (
      ![...gameData.correct].includes(absentLetter) &&
      ![...gameData.absent].includes(absentLetter)
    ) {
      gameData.absent.push(absentLetter)
    }
  }
  gameData.guesses.push(currentGuess)
  gameData.emojis.push(currentEmoji)

  if (callAPI) {
    fetch(
      "https://corsanywhere.herokuapp.com/https://wrdl.glitch.me/guess",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(gameData)
      }
    )
      .then(response => response.json())
      .then(data => {
        console.log("Cheatle guess: ", data[0].word)
        const c = gameData.correct.filter(d => d !== null)
        if (gameData.correct.filter(d => d !== null).length === 5) {
          console.log("VICTORY!")
          return
        }

        const word = data[0].word
        word.split("").forEach((l, i) => {
          typeLetter(l, i)
        })
        setTimeout(() => {
          getElement.keyboardTarget(game).dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "Enter",
              bubbles: true
            })
          )
          setTimeout(() => {
            waitForAnimations().then(() => parseRow())
          }, 500)
        }, 1000)
      })
      .catch(error => {
        console.error("Error:", error)
      })
  }
  gameData.currentRow++
}

/**
 * Wait For Animations
 *
 * @param {NodeList} tiles
 * @returns resolve
 */
const waitForAnimations = () => {
  const tiles = getElement.tiles(rows[gameData.currentRow])
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const allTilesRevealed = getElement.revelation(tiles)
      if (allTilesRevealed) {
        clearInterval(interval)
        resolve()
      }
    }, 1500)
  })
}

/**
 * Get Current Round
 */
const getCurrentRound = () => {
  for (const row of rows) {
    const tiles = getElement.tiles(row)

    const hasEmptyTiles = getElement.emptyTiles(tiles)
    if (hasEmptyTiles) {
      break
    }

    parseRow(false)
  }
}

getCurrentRound()
submit.addEventListener("click", () => {
  waitForAnimations().then(() => parseRow())
})

window.addEventListener("keyup", e => {
  if (e.key !== "Enter") {
    return
  }
  waitForAnimations().then(() => parseRow())
})

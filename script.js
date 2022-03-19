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
        // @WORK
        return null
      default:
        return tile.getAttribute("letter")
    }
  },
  evaluation: tile => {
    switch (window.location.href) {
      case WORDLES[1]:
        // @WORK
        return null
      default:
        return tile.getAttribute("evaluation")
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
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: l
      })
    )
  }, i * 80)
}

/**
 * Parse Row
 */
const parseRow = () => {
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
      case "correct":
        currentEmoji += "🟩"

        gameData.correct[tileIdx] = letter
        break

      case "present":
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

      case "absent":
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
      gameData.present[presentLetter] = rowData.present[presentLetter]
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

  console.log("******************")
  console.log("gameData")
  console.log(gameData)

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
      console.log(c)
      if (gameData.correct.filter(d => d !== null).length === 5) {
        console.log("DONE!")
        return
      }

      const word = data[0].word
      word.split("").forEach((l, i) => {
        typeLetter(l, i)
      })
      setTimeout(() => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter"
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
      const allTilesRevealed =
        [...tiles].filter(tile => tile.hasAttribute("reveal"))
          .length === config.columnCount

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

    const hasEmptyTiles =
      [...tiles].filter(tile => !tile.hasAttribute("evaluation"))
        .length > 0
    if (hasEmptyTiles) {
      break
    }

    parseRow()
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

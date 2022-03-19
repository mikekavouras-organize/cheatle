/**
 * Cheatle Scraper
 *
 * To clear local storage:
 * localStorage.removeItem("nyt-wordle-state");location.reload()
 */

/// Elements
const game = document
  .querySelector("game-app")
  .shadowRoot.querySelector("game-theme-manager")
  .querySelector("#game")
const keyboard = game
  .querySelector("game-keyboard")
  .shadowRoot.querySelector("#keyboard")
const submit = keyboard.querySelector('button[data-key="↵"]')
const rows = game.querySelectorAll("game-row")

/// Config constants
const CONFIG_ROWS = rows.length
const CONFIG_COLS =
  rows[0].shadowRoot.querySelectorAll("game-tile").length

/// Data
const gameData = {
  currentRow: 0,
  guesses: Array(),
  emojis: Array(),
  correct: Array(CONFIG_COLS),
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
const parseRow = (callAPI = true) => {
  let currentGuess = ""
  let currentEmoji = ""
  const row = rows[gameData.currentRow]
  const tiles = row.shadowRoot.querySelectorAll("game-tile")

  let rowData = {
    correct: Array(CONFIG_COLS),
    absent: Array(),
    present: Object()
  }
  for (const [tileIdx, tile] of tiles.entries()) {
    const letter = tile.getAttribute("letter")
    const evaluation = tile.getAttribute("evaluation")

    switch (evaluation) {
      case "correct":
        currentEmoji += "🟩"

        gameData.correct[tileIdx] = letter
        if (letter in gameData.present) {
          delete gameData.present[letter]
        }
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

  console.log("******************")
  console.log("gameData")
  console.log(gameData)

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
  gameData.currentRow++
}

/**
 * Wait For Animations
 *
 * @param {NodeList} tiles
 * @returns resolve
 */
const waitForAnimations = () => {
  const row = rows[gameData.currentRow]
  const tiles = row.shadowRoot.querySelectorAll("game-tile")

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const allTilesRevealed =
        [...tiles].filter(tile => tile.hasAttribute("reveal"))
          .length === CONFIG_COLS

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
    const tiles = row.shadowRoot.querySelectorAll("game-tile")

    const hasEmptyTiles =
      [...tiles].filter(tile => !tile.hasAttribute("evaluation"))
        .length > 0
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

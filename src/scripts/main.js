/**
 * Cheatle Scraper
 *
 * To clear local storage:
 * localStorage.removeItem("nyt-wordle-state");location.reload()
 */

import Axios from "axios"
import GameConfig from "./utils/game-config"

const config = new GameConfig({
  location: window.location.href,
  wordles: [
    "https://www.nytimes.com/games/wordle/index.html",
    "https://www.wordleunlimited.com/"
  ],
  api: "https://corsanywhere.herokuapp.com/https://wrdl.glitch.me/guess",
  states: {
    correct: "correct",
    present: "present",
    absent: "absent"
  }
})
const elements = config.setupElements()

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
const config2 = {
  rowCount: rows.length,
  columnCount: cols.length
}
const gameData = {
  currentRow: 0,
  guesses: Array(),
  emojis: Array(),
  correct: Array(config2.columnCount),
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
    correct: Array(config2.columnCount),
    absent: Array(),
    present: Object()
  }
  for (const [tileIdx, tile] of tiles.entries()) {
    const letter = getElement.letter(tile)
    const evaluation = getElement.evaluation(tile)

    switch (evaluation) {
      case config.states.correct:
        currentEmoji += "🟩"

        gameData.correct[tileIdx] = letter
        if (letter in gameData.present) {
          delete gameData.present[letter]
        }
        break

      case config.states.present:
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

      case config.states.absent:
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
    Axios.post(config.api, gameData)
      .then(response => {
        const word = response.data[0].word
        console.log("Cheatle guess: ", word)
        const c = gameData.correct.filter(d => d !== null)
        if (gameData.correct.filter(d => d !== null).length === 5) {
          console.log("VICTORY!")
          return
        }

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

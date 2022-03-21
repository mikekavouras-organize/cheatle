/**
 * Cheatle Scraper
 *
 * To clear local storage:
 * localStorage.removeItem("nyt-wordle-state");location.reload()
 */

import Axios from "axios"

import GameConfig from "./utils/game-config"
import typeLetter from "./utils/type-letter"
import states from "./constants/states"

const API_URL =
  "https://corsanywhere.herokuapp.com/http://localhost:8080/v1/guess/get-word"
// const API_URL =
//   "https://corsanywhere.herokuapp.com/https://wrdl.glitch.me/guess"

console.log("******************")
console.log("API_URL")
console.log(API_URL)

/// Configuration
const config = new GameConfig({
  location: window.location.href,
  wordles: {
    official: "https://www.nytimes.com/games/wordle/index.html",
    unlimited: "https://www.wordleunlimited.com/"
  },
  api: API_URL
})

/// Initialize config
config.initSettings()
const elements = config.initElements()

/// Elements
const game = elements.game()
const keyboard = elements.keyboard(game)
const submit = elements.submit(keyboard)
const rows = elements.rows(game)
const cols = elements.columns(rows)

/// Data
const gameData = {
  location: config.location,
  currentRow: 0,
  guesses: Array(),
  emojis: Array(),
  correct: Array(cols.length),
  absent: Array(),
  present: Object()
}

/**
 * Parse Row
 */
const parseRow = (callAPI = true) => {
  let currentGuess = ""
  let currentEmoji = ""
  const tiles = elements.tiles(rows[gameData.currentRow])

  let rowData = {
    correct: Array(cols.length),
    absent: Array(),
    present: Object()
  }
  for (const [tileIdx, tile] of tiles.entries()) {
    const letter = elements.letter(tile)
    const evaluation = elements.evaluation(tile)

    switch (evaluation) {
      /// Correct
      /// - Add to `correct` array
      /// - Remove letter from `present` object
      case states.correct.name:
        gameData.correct[tileIdx] = letter
        if (letter in gameData.present) {
          delete gameData.present[letter]
        }
        break

      /// Present
      /// - If the letter is not `present` yet,
      ///   add it to the `present` array,
      ///   otherwise update the `notIn` array.
      case states.present.name:
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

      /// Absent
      /// - If the letter is already in the `absent` array,
      ///   or if the letter is `present`, then
      ///   we don't need to add it
      case states.absent.name:
        if (
          rowData.absent.includes(letter) ||
          letter in rowData.present
        ) {
          break
        }

        rowData.absent.push(letter)
        break
    }

    currentEmoji += config.addEmoji(evaluation)
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

  /// For each present letter, update the `notIn` array
  /// or the `present` array
  for (const presentLetter in rowData.present) {
    /// If the letter is already in the `correct` array, skip
    if ([...gameData.correct].includes(presentLetter)) {
      continue
    }

    if (presentLetter in gameData.present) {
      gameData.present[presentLetter].notIn = [
        ...gameData.present[presentLetter].notIn,
        ...rowData.present[presentLetter].notIn
      ]
    } else {
      gameData.present[presentLetter] = rowData.present[presentLetter]
    }
  }

  /// Add absent letters to the `absent` array
  /// as long as they are not in the `correct` array
  /// or already in the `absent` array
  for (const absentLetter of rowData.absent) {
    if (
      [...gameData.correct].includes(absentLetter) ||
      [...gameData.absent].includes(absentLetter)
    ) {
      continue
    }

    gameData.absent.push(absentLetter)
  }

  /// Add the guess to the `guesses` array
  /// and the emoji to the `emojis` array
  gameData.guesses.push(currentGuess)
  gameData.emojis.push(currentEmoji)

  /// Make API call with gameData to get next suggestion
  if (callAPI) {
    Axios.post(config.api, gameData)
      .then(response => {
        const word = response.data[0]?.word || null
        if (!word) {
          return
        }

        console.log("Cheatle guess: ", word)
        const c = gameData.correct.filter(d => d !== null)
        if (
          gameData.correct.filter(d => d !== null).length ===
          cols.length
        ) {
          console.log("VICTORY!")

          localStorage.removeItem("nyt-wordle-state")
          location.reload()
          return
        }

        word.split("").forEach((key, idx) => {
          typeLetter(elements.keyboardTarget(game), key, idx)
        })
        setTimeout(() => {
          typeLetter(elements.keyboardTarget(game), "Enter")
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

const randomFirstWord = () => {
  const word =
    config.startingWords()[
      Math.floor(Math.random() * config.startingWords().length)
    ]
  word.split("").forEach((key, idx) => {
    typeLetter(elements.keyboardTarget(game), key, idx)
  })
  setTimeout(() => {
    typeLetter(elements.keyboardTarget(game), "Enter")
    setTimeout(() => {
      waitForAnimations().then(() => parseRow())
    }, 500)
  }, 1000)
}

/**
 * Wait For Animations
 *
 * @returns resolve
 */
const waitForAnimations = () => {
  const tiles = elements.tiles(rows[gameData.currentRow])
  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      const allTilesRevealed = elements.revelation(tiles)
      if (allTilesRevealed) {
        clearInterval(interval)
        resolve()
      }
    }, 1500)
  })
}

/**
 * Get Current Round
 *
 * At page load, check if there are already
 * guesses on the board. Call the `parseRow`
 * function with the false argument to avoid
 * making an API call.
 */
const getCurrentRound = () => {
  for (const row of rows) {
    const tiles = elements.tiles(row)

    const hasEmptyTiles = elements.emptyTiles(tiles)
    if (hasEmptyTiles) {
      break
    }

    parseRow(false)
  }
}

/// Entry Point
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

randomFirstWord()

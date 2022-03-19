/**
 * Game Config
 *
 * To allow function with multiple sites,
 * we need to customize the way each
 * game board is parsed. Using the
 * Config.get.<element>() functions, we
 * can customize what is returned based
 * on which site you are on.
 *
 * @since 1.0.0
 */

const WORDLES = [
  "https://www.nytimes.com/games/wordle/index.html",
  "https://www.wordleunlimited.com/"
]

export default class GameConfig {
  constructor(settings) {
    this.location = settings.location
    this.wordles = settings.wordles
    this.api = settings.api
    this.states = settings.states
  }

  setupElements() {}
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

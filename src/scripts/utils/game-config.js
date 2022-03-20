/**
 * Game Config
 *
 * Setup the game configuration for
 * the current game depending on which
 * url is being used.
 *
 * @since 1.0.0
 */

import states from "../constants/states"

export default class GameConfig {
  constructor(settings) {
    this.location = settings.location
    this.wordles = settings.wordles
    this.api = settings.api
    this.columns = 6
    this.rows = 5
  }

  /**
   * Setup Elements
   *
   * To allow function with multiple sites,
   * we need to customize the way each
   * game board is parsed. Using the
   * Config.get.<element>() functions, we
   * can customize what is returned based
   * on which site you are on.
   *
   * @since 1.0.0
   * @return {Object}
   */
  initElements() {
    return {
      game: () => {
        switch (this.location) {
          case this.wordles.unlimited:
            return document.querySelector(".Game")
          default:
            return document
              .querySelector("game-app")
              .shadowRoot.querySelector("game-theme-manager")
              .querySelector("#game")
        }
      },
      keyboard: game => {
        switch (this.location) {
          case this.wordles.unlimited:
            return game.querySelector(".Game-keyboard")
          default:
            return game
              .querySelector("game-keyboard")
              .shadowRoot.querySelector("#keyboard")
        }
      },
      submit: keyboard => {
        switch (this.location) {
          case this.wordles.unlimited:
            return keyboard.querySelector(
              ".Game-keyboard-button.Game-keyboard-button-wide"
            )
          default:
            return keyboard.querySelector('button[data-key="↵"]')
        }
      },
      rows: game => {
        switch (this.location) {
          case this.wordles.unlimited:
            return game.querySelectorAll(".RowL")
          default:
            return game.querySelectorAll("game-row")
        }
      },
      columns: rows => {
        switch (this.location) {
          case this.wordles.unlimited:
            return rows[0].querySelectorAll(".RowL-letter")
          default:
            return rows[0].shadowRoot.querySelectorAll("game-tile")
        }
      },
      tiles: row => {
        switch (this.location) {
          case this.wordles.unlimited:
            return row.querySelectorAll(".RowL-letter")
          default:
            return row.shadowRoot.querySelectorAll("game-tile")
        }
      },
      letter: tile => {
        switch (this.location) {
          case this.wordles.unlimited:
            return tile.innerHTML
          default:
            return tile.getAttribute("letter")
        }
      },
      evaluation: tile => {
        switch (this.location) {
          case this.wordles.unlimited:
            let evaluation
            if (tile.classList.contains("letter-correct")) {
              evaluation = states.correct.name
            } else if (tile.classList.contains("letter-elsewhere")) {
              evaluation = states.present.name
            } else {
              evaluation = states.absent.name
            }
            return evaluation
          default:
            return tile.getAttribute("evaluation")
        }
      },
      revelation: tiles => {
        switch (this.location) {
          case this.wordles.unlimited:
            return (
              tiles[0].parentNode.classList.contains(
                "RowL-locked-in"
              ) &&
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
                .length === this.columns
            )
        }
      },
      emptyTiles: tiles => {
        switch (this.location) {
          case this.wordles.unlimited:
            return (
              !tiles[0].parentNode.classList.contains(
                "RowL-locked-in"
              ) |
              ![...tiles].every(
                tile =>
                  tile.classList.contains("letter-correct") ||
                  tile.classList.contains("letter-elsewhere") ||
                  tile.classList.contains("letter-absent")
              )
            )
          default:
            return (
              [...tiles].filter(
                tile => !tile.hasAttribute("evaluation")
              ).length > 0
            )
        }
      },
      keyboardTarget: game => {
        switch (this.location) {
          case this.wordles.unlimited:
            return game
          default:
            return window
        }
      }
    }
  }

  initSettings() {
    const game = this.initElements().game()
    const rows = this.initElements().rows(game)
    const cols = this.initElements().columns(rows)

    this.rows = rows.length
    this.columns = cols.length
  }

  addEmoji(state) {
    return states[state].emoji.default
  }
}

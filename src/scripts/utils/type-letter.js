/**
 * Type Letter
 *
 * @param {string} key letter to be typed
 * @param {int} index index of tile
 */

export default (target, key, idx = 1) => {
  setTimeout(() => {
    target.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key,
        bubbles: true
      })
    )
  }, idx * 80)
}

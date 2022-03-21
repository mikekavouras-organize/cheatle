/**
 * Word Ranker
 *
 * @since 1.0.0
 */

const scores = require("../words/letter-scores")

// words: {string: int} where the key is a word and the value is a score
//
// Returns [word]
module.exports = words => {
  let weighWord = word => {
    let score = word.split("").reduce((prev, curr) => {
      let t = (prev += scores[curr] / 100.0)
      return t
    }, 0)

    return score
  }

  let list = Object.keys(words)

  list.sort((a, b) => {
    let score1 = weighWord(a) * words[a]
    let score2 = weighWord(b) * words[b]
    return score1 > score2 ? -1 : 1
  })

  return list
}

/**
 * Algorithm
 *
 * @since 1.0.0
 */

const allWords = require("./words/words")
const bradWords = require("./words/brad-words")
const maWords = require("./words/ma-words")

const WORD_LIST = allWords

module.exports = (wordList = WORD_LIST) => {
  return ({ correct, present, absent }) => {
    const correctByIdx = correct.reduce((prev, curr, idx) => {
      if (curr === null) return prev
      prev[curr] = idx
      return prev
    }, {})
    const presentByIdx = Object.entries(present).reduce(
      (prev, entry) => {
        let [key, value] = entry
        prev[key] = value.notIn
        return prev
      },
      {}
    )
    const absentCache = absent.reduce((prev, curr) => {
      prev[curr] = true
      return prev
    }, {})

    // filter returns a new array with results that PASS the test

    const list = wordList
    const result = list.filter(word => {
      let matchesCorrect = true // default to true if there aren't any greenies
      matchesCorrect = Object.keys(correctByIdx).every(key => {
        return word.charAt(correctByIdx[key]) == key
      })

      let matchesPresent = true // default to true if there aren't any yellows

      matchesPresent = !Object.keys(presentByIdx).some(key => {
        let idxs = presentByIdx[key]
        return idxs.some(i => {
          return word.charAt(i) == key
        })
      })

      const matchesAbsent = !word.split("").some(letter => {
        return absentCache[letter] == true
      })

      return matchesCorrect && matchesPresent && matchesAbsent
    })

    return result
  }
}

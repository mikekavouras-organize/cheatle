/**
 * Word Finder
 *
 * @since 1.0.0
 */

const axios = require("axios")
const applyGameStateToWordList = require("../algo")
const rank = require("./word-ranker")

const WordFinder = () => {
  return {
    // Steps:
    //    1. Filter word list against current game state
    //    2. Fetch results from Datamuse based on current game state
    //    3. Filter API results against current game state
    //    4. Rank API results
    //    5. Include words from word list that are present in filtered + ranked API results
    run: async gameState => {
      let start = new Date()

      // Step 1
      let words = applyGameStateToWordList()(gameState)

      let end = new Date()
      let elapsed = (end - start) / 1000.0

      console.log(`Found ${words.length} words in ${elapsed}s`)

      // Step 2
      //
      // c: the value of `correct` from the game state
      // p: the value of `present` from the game state
      // a: the value of `absent` from the game state
      //
      // Returns [{word: string, score: int}]
      const APIData = await (async function ({
        correct,
        present,
        absent
      }) {
        let yl = Object.keys(present)
        let g = correct.map(l => (l === null ? "?" : l)).join("")
        let url = `https://api.datamuse.com/words?max=1000&sp=${g}`
        if (absent.length) {
          url += `-${absent.join("")}`
        }
        if (yl.length) {
          url += `,${yl
            .map(l => `*${l}*`)
            .flat()
            .join(",")}`
        }

        let apiResponse = await axios.get(url)
        return apiResponse.data
      })(gameState)

      // scoreMap flattens APIData from [{word: string, score: int}] -> {string: int}
      // for quick score lookups
      let scoreMap = APIData.reduce((prev, curr) => {
        prev[curr.word] = curr.score
        return prev
      }, {})

      // Step 3
      //
      // `filteredAPIResponse` filters the words returned from datamuse against
      // the current game state
      //
      // Returns {string: int} where the key is a word and the value is a score
      const filteredAPIResponse = (function () {
        let wordList = APIData.map(r => r.word)
        return applyGameStateToWordList(wordList)(gameState).reduce(
          (prev, curr) => {
            prev[curr] = scoreMap[curr]
            return prev
          },
          {}
        )
      })()

      // Step 4
      let ranked = rank(filteredAPIResponse)

      // Step 5
      let final = ranked.filter(i => words.includes(i)).splice(0, 10)

      return final.map(word => {
        return { word: word, score: scoreMap[word] }
      })
    }
  }
}

module.exports = WordFinder

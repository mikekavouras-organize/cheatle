const axios = require('axios')
const algo = require('./algo')
const rank = require('./word-ranker')

const App = () => {
  // guess: [Char]
  // absent: [Char]
  // present: { Char: { notIn: [Int] } }
  const FindWords = (correct, absent, present, words = null) => {
    return algo(correct, absent, present, words)
  }
  
  return {
    run: async (obj) => {
      let {correct, absent, present} = obj
      let start = new Date()

      let words = FindWords(correct, absent, present)

      let end = new Date()
      let elapsed = (end - start) / 1000.0

      console.log(`Found ${words.length} words in ${elapsed}s`)

      let yl = Object.keys(present)
      let g = correct.map(l => l === null ? '?' : l).join('')
      let url = `https://api.datamuse.com/words?max=1000&sp=${g}`
      if (absent.length) {
        url += `-${absent.join('')}`
      }
      if (yl.length) {
        url += `,${yl.map(l => `*${l}*`).flat().join(',')}`
      }

      let response = await axios.get(url)
      
      // [{word: string, score: int}]
      let data = response.data
      
      // {word: score}
      let dataMap = data.reduce((prev, curr) => {
        prev[curr.word] = curr.score
        return prev
      }, {})
      
      let results = FindWords(correct, absent, present, response.data.map(r => r.word))
    
      let resultsMap = results.reduce((prev, curr) => {
        prev[curr] = dataMap[curr]
        return prev
      }, {})
      let ranked = rank(resultsMap)
      
      let final = ranked.filter(i => words.includes(i)).splice(0, 10)
      return final.map(word => {
        return {word: word, score: dataMap[word]}
      })
    }
  }
}

module.exports = App


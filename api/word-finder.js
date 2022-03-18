const axios = require('axios')
const algo = require('./algo')

const App = () => {
  const FindWords = (guess, absent, present) => {
    return algo(guess, absent, present)
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
      if (yl.length > 0) {
        url += `,${yl.map(l => `*${l}*`).flat().join(',')}`
      }

      let response = await axios.get(url)
      let result = response.data.filter(i => words.includes(i.word)).splice(0, 10)

      return result
    }
  }
}

module.exports = App

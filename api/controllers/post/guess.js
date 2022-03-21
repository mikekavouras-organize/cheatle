/**
 * Guess Post Controllers
 *
 * Routes and functions for guesses
 *
 * @since 1.0.0
 */

const WordFinder = require("../../lib/managers/word-finder")

exports.requestScreenplay = async (req, res) => {
  const state = req.body
  let result = await WordFinder().run(state)

  res.json(result)
}

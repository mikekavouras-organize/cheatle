const router = require("express").Router()

const guessPostController = require("../../controllers/post/guess")

// POST requests
router.post("/get-word", guessPostController.requestScreenplay)
router.get("/test", (req, res) => {
  res.json("on")
})

module.exports = router

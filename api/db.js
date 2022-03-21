/**
 * Server
 *
 * @since 1.0.0
 */

const MongoClient = require("mongodb").MongoClient
require("dotenv").config(
  process.env.NODE_ENV === "development"
    ? {
        path: "../.env"
      }
    : {}
)

MongoClient.connect(process.env.MONGODB_CONNECTION, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(client => {
    module.exports = client
    const server = require("./server")
    server.listen(process.env.PORT)
  })
  .catch(err => console.error(err))

// fastify.post("/guess", async function(request, reply) {
//   const state = request.body
//   let result = await App().run(state)
//   reply.send(result)
// });

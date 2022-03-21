/**
 * Server
 *
 * @since 1.0.0
 */

require("dotenv").config()

import { MongoClient } from "mongodb"

MongoClient.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(client => {
    module.exports = client
    const server = require("server")
    server.listen(process.env.PORT)
  })
  .catch(err => console.error(err))

// fastify.post("/guess", async function(request, reply) {
//   const state = request.body
//   let result = await App().run(state)
//   reply.send(result)
// });

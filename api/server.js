fastify.post("/guess", async function(request, reply) {
  const state = request.body
  let result = await App().run(state)
  reply.send(result)
});

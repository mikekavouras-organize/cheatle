const express = require("express")
const app = express()
const glob = require("glob")

// Express Settings
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

// API routes
const apiVersions = glob.sync("routes/*/")
for (let i = 0; i < apiVersions.length; i++) {
  const v = apiVersions[i]
    .substring(apiVersions[i].lastIndexOf("/") - 2)
    .slice(0, -1)
  const apiRoutes = glob.sync(`routes/${v}/*`)
  for (let i = 0; i < apiRoutes.length; i++) {
    const path = `${apiRoutes[i].split(".")[0]}`
    const r = path.match(/([^\/]*)\/*$/)[1]
    app.use(`/${v}/${r}`, require(`./routes/${v}/${r}`))
  }
}

// Server
const server = require("http").createServer(app)

module.exports = server

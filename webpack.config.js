const path = require("path")

module.exports = {
  mode: "production",
  entry: "./src/scripts/main.js",
  output: {
    filename: "script.js",
    path: path.resolve(__dirname, "plugin")
  }
}

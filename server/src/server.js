import "dotenv/config"
import app from "./app.js"

const PORT = Number(process.env.PORT) || 5000

const server = app.listen(PORT, () => {
  console.log`(RealConnect API running at http://localhost:${PORT})`
  console.log`(Health check: http://localhost:${PORT}/api/health)`
})

server.on("error", (error) => {
  console.error("Failed to start RealConnect API:", error.message)
  process.exitCode = 1
})

function shutdown() {
  console.log("Shutting down RealConnect API...")

  server.close((error) => {
    if (error) {
      console.error("Error while closing the server:", error)
      process.exitCode = 1
      return
    }

    process.exitCode = 0
  })
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
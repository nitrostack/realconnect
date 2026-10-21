import express from "express"
import cors from "cors"
import helmet from "helmet"

const app = express()

// Add common HTTP security headers.
app.use(helmet())

// Permit requests from the configured React frontend.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
)

// Parse JSON request bodies.
app.use(express.json({ limit: "1mb" }))

// Temporary health check to confirm the API is running.
app.get("/api/health", (request, response) => {
  response.status(200).json({
    success: true,
    message: "RealConnect API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  })
})

// Return a constant response for unknown routes.
app.use((request, response) => {
  response.status(404).json({
    success: false,
    message: "API route not found",
  })
})

// Handle unexpected errors without exposing internal details.
app.use((error, request, response, next) => {
  console.error("API error:", error)

  if (response.headersSent) {
    return next(error)
  }

  response.status(error.status || 500).json({
    success: false,
    message:
      error.status && error.status < 500
        ? error.message
        : "An unexpected server error occurred",
  })
})

export default app
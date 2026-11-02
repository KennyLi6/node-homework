const express = require("express");
const pool = require("./db/pg-pool");

const app = express();

const authMiddleware = require("./middleware/auth");
const userRouter = require("./routes/userRoutes");
const taskRouter = require("./routes/taskRoutes");
const { notFound } = require("./middleware/not-found");
const { errorHandler } = require("./middleware/error-handler");

global.user_id = null;
global.users = [];
global.tasks = [];

app.use(express.json());

app.use("/api/users", userRouter);
app.use("/api/tasks", authMiddleware, taskRouter);

app.use("/api", notFound);
app.use("/api", errorHandler);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

let isShuttingDown = false;

async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Shutting down gracefully...");

  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log("HTTP server closed.");

    // Close all PostgreSQL connections after the HTTP server has stopped.
    await pool.end();
    console.log("PostgreSQL connection pool closed.");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

module.exports = { app, server };
const express = require("express");
const dogsRouter = require("./routes/dogs");
const { randomUUID } = require("crypto");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.
app.use((req, res, next) => { // Request ID
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use((req, res, next) => { // Logger
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

app.use(express.json());
app.use(express.static(__dirname + '/public'))


app.use("/", dogsRouter);// Do not remove this line

app.use((req, res) => { // 404
  res.status(404).json({
  "error": "Route not found",
  "requestId": req.requestId
  })
});

app.use((err, req, res, next) => { //error handler
  res.status(500).json({
    "error": "Internal Server Error",
    "requestId": req.requestId
  })
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;


const express = require("express");
const logger = require("morgan");
const cors = require("cors");

const contactsRouter = require("./routes/api/contacts");
const { default: mongoose } = require("mongoose");

const connectionString =
  "mongodb+srv://adriantopa04:adiadi@goit0.t06usgd.mongodb.net/?retryWrites=true&w=majority&appName=Goit0";

  mongoose
  .connect(connectionString, {
    dbName: "db-contacts",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database connection successful");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
    process.exit(1);
  });

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

app.use("/api/contacts", contactsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;

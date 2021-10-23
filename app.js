require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/iam", (req, res) => {
  // res.json({ message: "Welcome from iam app" });
  res.send(
    `<h1 style="height: 100vh; display: flex; justify-content: center; align-items: center">Welcome from iam app</h1>`
  );
});

app.use("/iam/auth", require("./controllers/UserController"));

mongoose.connect(process.env.DB_CONNECTION).then(() => {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
});

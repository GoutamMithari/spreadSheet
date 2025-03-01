const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

app.use(cors());
app.use(bodyParser.json());

let spreadsheetData = {};

app.post("/save", (req, res) => {
  spreadsheetData = req.body;
  res.json({ message: "Spreadsheet data saved successfully!" });
});

app.get("/", (req, res) => {
  res.json(spreadsheetData);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
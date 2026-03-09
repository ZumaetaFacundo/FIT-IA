const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const API_KEY = "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";
app.post("/api/chat", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("✅ Servidor corriendo en http://localhost:3001"));
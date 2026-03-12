const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const GEMINI_KEY = "AIzaSyDGErr2pufPW6_Uupf6byjuBewQZZ9Zuk4";

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, system, max_tokens } = req.body;

    // Armar el historial para Gemini
    const contents = [];

    // Agregar system prompt como primer mensaje de usuario si existe
    const allMessages = system
      ? [{ role: "user", content: system }, { role: "assistant", content: "Entendido, seré tu coach." }, ...messages]
      : messages;

    for (const msg of allMessages) {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: typeof msg.content === "string" ? msg.content : msg.content }]
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: { maxOutputTokens: max_tokens || 3000 }
        })
      }
    );

    const data = await response.json();
    console.log("Gemini status:", response.status);

    if (data.error) {
      console.log("Gemini error:", data.error.message);
      return res.status(500).json({ error: data.error.message });
    }

    // Convertir respuesta de Gemini al formato de Anthropic
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ content: [{ type: "text", text }] });

  } catch (err) {
    console.log("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3002, () => console.log("✅ Servidor corriendo en http://localhost:3002"));

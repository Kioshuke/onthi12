require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hubie API is running 🚀");
});

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;
    const useSearch = req.body.useSearch;

    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

    /* ===== 🔍 1. SEARCH GOOGLE ===== */
    let searchText = "";

    if (useSearch) {
      try {
        const search = await axios.get("https://serpapi.com/search.json", {
          params: {
            q: question,
            api_key: process.env.SERP_API_KEY
          }
        });

        const results = search.data?.organic_results || [];

        searchText = results
          .slice(0, 3)
          .map(r => `- ${r.snippet || r.title}`)
          .join("\n");

        console.log("🔍 Search OK");

      } catch (err) {
        console.warn("⚠️ Search lỗi:", err.message);
      }
    }

    /* ===== 🤖 2. GỌI GROQ ===== */
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          temperature: 0.2,
          messages: [
            {
              role: "system",
              content: `
Bạn là Hubie – trợ lý AI học tập của LearnHub Platform.

NHIỆM VỤ:
- Trả lời câu hỏi học tập chính xác mức độ câu hỏi nằm vào cấp trung học phổ thông
- Nếu là bài tập → giải từng bước
- Nếu là trò chuyện → tự nhiên

PHONG CÁCH:
- Ngắn gọn, dễ hiểu
- Có thể dùng emoji nhẹ (📘 ⚡ 🧠 ✅)
- Không spam emoji

QUAN TRỌNG:
- Nếu có dữ liệu Google → ưu tiên dùng
- Nếu KHÔNG có → không được bịa
- Nếu không chắc → nói "Mình chưa chắc"

PHÂN BIỆT:
- Nếu là câu hỏi:
  ✅ Đáp án:
  📘 Giải thích:
  🎯 Mức độ chắc chắn (%):

- Nếu là trò chuyện:
  → trả lời tự nhiên, có thể thêm emoji

Dữ liệu Google:
${searchText || "Không có"}
`
            },
            {
              role: "user",
              content: question
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);
      return res.status(500).json({ error: "AI API error" });
    }

    const answer = data?.choices?.[0]?.message?.content;

    if (!answer) {
      return res.status(500).json({ error: "No answer from AI" });
    }

    res.json({
      answer: answer.trim()
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server chạy tại port ${PORT}`);
});

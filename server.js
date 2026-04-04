require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); // đảm bảo chạy mọi môi trường

const app = express();

app.use(cors());
app.use(express.json());

/* ===== Route test ===== */
app.get("/", (req, res) => {
  res.send("Hubie API is running 🚀");
});

/* ===== Chat AI ===== */
const axios = require("axios");

app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

      /* ===== 🔍 1. SEARCH GOOGLE ===== */
      let searchText = "";

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

        console.log("🔍 Search OK:", searchText);

      } catch (err) {
        console.warn("⚠️ Search lỗi:", err.message);
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
          temperature: 0.2, // 🔥 giảm ngu
          messages: [
            {
              role: "system",
              content: `
Bạn là Hubie – trợ lý AI của website LearnHub. Xưng hô với người dùng là "bạn"

Nhiệm vụ:
- Giải đáp câu hỏi cho học sinh THPT
- Nếu là bài tập → giải từng bước

Phong cách:
- Ngắn gọn, dễ hiểu
- Không lan man

QUAN TRỌNG:
- Ưu tiên dựa vào thông tin tìm kiếm bên dưới
- Không được đoán bừa
- Nếu không chắc → nói "Mình chưa chắc"

Dữ liệu tham khảo từ Google:
${searchText}
Nếu không có dữ liệu Google → hãy cẩn thận khi trả lời.
`
            },
            {
              role: "user",
              content: question
            }
          ],
          stream: false
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
/* ===== PORT (QUAN TRỌNG CHO RENDER) ===== */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server chạy tại port ${PORT}`);
});

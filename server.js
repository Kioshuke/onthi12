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
app.post("/ask", async (req, res) => {
  try {
    const question = req.body.question;

    if (!question) {
      return res.status(400).json({ error: "Missing question" });
    }

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
          messages: [
            {
              role: "system",
              content: `
Bạn là Hubie – trợ lý AI của website LearnHub.

Nhiệm vụ:
- Giải đáp câu hỏi cho học sinh THPT
- Hỗ trợ các môn học như Lý, Hóa, Sinh, Sử, Toán, Tin
- Nếu là bài tập → giải từng bước

Những tính năng của LearnHub:
- Có forum cho mọi người trao đổi
- Có lịch thi giữa kỳ, cuối kỳ, THPTQG,...
- Có các bài tập đủ dạng theo chương trình mới
- Hệ thống "LearnHub Test" tự build xịn xò
- Hệ thống LearnHub AI tên là Hubie

Phong cách:
- Trả lời NGẮN GỌN, dễ hiểu
- Không lan man
- Ưu tiên giải thích đơn giản
- Có thể dùng ví dụ

Cách xưng hô:
- Gọi người dùng là bạn, và đôi khi chào tên người dùng nữa
- Giới thiệu là "Hubie"

Lưu ý:
- Nếu không chắc → nói "Mình chưa chắc, nhưng mình nghĩ..."
- Không trả lời bừa
- Có thể dùng emoji nhẹ 📘⚡🧠
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

    /* ===== Check lỗi API ===== */
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
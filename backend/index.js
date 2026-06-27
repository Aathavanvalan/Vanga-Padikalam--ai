const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// File upload (memory)
const upload = multer({ storage: multer.memoryStorage() });


// ─────────────────────────────────────────────
// ROUTE 1: GENERATE STUDY PLAN
// ─────────────────────────────────────────────
app.post("/api/generate-plan", upload.single("pdf"), async (req, res) => {
  try {
    let syllabusText = "";

    // Extract syllabus
    if (req.file) {
      const pdfData = await pdfParse(req.file.buffer);
      syllabusText = pdfData.text;
    } else if (req.body.text) {
      syllabusText = req.body.text;
    } else {
      return res.status(400).json({ error: "No syllabus provided." });
    }

    const hoursPerDay = req.body.hoursPerDay || 2;
    const examDate = req.body.examDate || "2 weeks from now";

    // 🔥 OpenRouter API Call
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: `You are a smart study planner AI.

Syllabus:
${syllabusText}

Rules:
- Student studies ${hoursPerDay} hours per day
- Exam is on: ${examDate}
- Break topics into small daily tasks

Return ONLY valid JSON. No explanation.

Format:
{
  "topics": ["topic1", "topic2"],
  "plan": [
    {
      "day": "Day 1",
      "date": "Mon",
      "tasks": ["Task 1", "Task 2"],
      "hours": 2
    }
  ]
}`
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const raw = response.data.choices[0].message.content;

    // Clean response (remove markdown if any)
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch (err) {
      return res.status(500).json({
        error: "AI returned invalid JSON",
        raw: raw
      });
    }

    res.json(plan);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to generate plan." });
  }
});


// ─────────────────────────────────────────────
// ROUTE 2: EXPLAIN TOPIC
// ─────────────────────────────────────────────
app.post("/api/explain", async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: "No topic provided." });
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "user",
            content: `Explain this topic in simple English in 3-5 sentences: ${topic}`
          }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const explanation = response.data.choices[0].message.content;

    res.json({ explanation });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to explain topic." });
  }
});


// ─────────────────────────────────────────────
// TEST ROUTE
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("🚀 StudyMate AI Backend Running");
});


// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
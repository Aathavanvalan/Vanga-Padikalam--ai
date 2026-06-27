const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function callAI(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log("🔑 API Key loaded:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
      console.log(`🤖 Generating content (attempt ${attempt})`);
      const result = await model.generateContent(prompt);
      console.log("✅ Gemini API response received");
      const response = await result.response;
      console.log("📄 Response text extracted");
      const text = response.text();
      console.log("✅ Text extracted successfully");
      return text;
    } catch (apiErr) {
      const status = apiErr?.status || apiErr?.statusCode || apiErr?.code;
      console.error(`❌ Gemini API Error (attempt ${attempt}):`, status || apiErr.message);

      // If rate limited, retry with exponential backoff
      if (status === 429 && attempt < maxRetries) {
        const delayMs = 1000 * Math.pow(2, attempt - 1);
        console.log(`⏳ Rate limited. Retrying in ${delayMs}ms...`);
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }

      // Provide clearer guidance for quota/billing issues
      if (status === 429) {
        const msg = "Quota exceeded for Google Generative AI (429). Check your project billing and quota, or try again later. See https://ai.google.dev/gemini-api/docs/rate-limits";
        const err = new Error(msg);
        err.original = apiErr;
        throw err;
      }

      // For other errors, rethrow the original error
      throw apiErr;
    }
  }
}

// Local fallback planner when AI quota is exceeded or API is unavailable
function localPlanner(syllabusText, studyHours, weeks) {
  const topics = [];
  // Try to extract headings or short lines as topics
  const lines = syllabusText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (topics.length >= 20) break;
    if (line.length < 120 && /[A-Za-z]/.test(line)) {
      // skip very long descriptive lines
      topics.push(line.replace(/\s+/g, ' ').slice(0, 120));
    }
  }
  // Fallback: split by sentences
  if (topics.length === 0) {
    const sentences = syllabusText.split(/[\.\n]+/).map(s => s.trim()).filter(Boolean);
    for (const s of sentences) {
      if (topics.length >= 20) break;
      if (s.length < 120) topics.push(s.slice(0, 120));
    }
  }
  if (topics.length === 0) topics.push('General review');

  // Build a simple day-by-day plan distributing topics evenly
  const totalDays = Math.max(1, weeks * 7);
  const plan = [];
  let topicIdx = 0;
  for (let d = 0; d < totalDays; d++) {
    const dayNum = d + 1;
    const tasks = [];
    // Assign up to 2 small tasks per day
    for (let t = 0; t < 2; t++) {
      tasks.push(topics[topicIdx % topics.length]);
      topicIdx++;
    }
    const date = new Date();
    date.setDate(date.getDate() + d);
    plan.push({ day: `Day ${dayNum}`, date: date.toLocaleDateString(), tasks, hours: studyHours });
  }

  return { topics, plan };
}

function localExplain(topic) {
  const normalized = topic.trim();
  if (!normalized) {
    return "This topic needs a short request to explain it clearly. Please enter a study subject like 'data structures' or 'calculus.'";
  }

  const lower = normalized.toLowerCase();
  if (lower.includes("array")) {
    return "An array is a list of items stored one after another in memory. It is useful for fast access by position, and each element can be read using an index number.";
  }
  if (lower.includes("linked list")) {
    return "A linked list is a sequence of nodes where each node points to the next one. It is good for inserts and deletes because you can change links instead of moving many items.";
  }
  if (lower.includes("algorithm")) {
    return "An algorithm is a series of steps that solve a problem. It should be clear, ordered, and efficient so your program works quickly and correctly.";
  }
  if (lower.includes("function")) {
    return "A function is a named block of code that performs a task and can be reused. You give it inputs, it does work, and it may return a result.";
  }
  if (lower.includes("calculus")) {
    return "Calculus studies change and motion using limits, derivatives, and integrals. It helps you understand how values grow, move, and accumulate over time.";
  }

  return `Here is a simple explanation of '${normalized}': it is a study topic you can break into smaller ideas and practice step by step. Start with the definition, why it matters, and one example.`;
}

// ─── ROUTE 1: Generate Study Plan ─────────────────────────
app.post("/api/generate-plan", upload.single("syllabus"), async (req, res) => {
  try {
    const studyHours = parseInt(req.body.studyHours) || 3;
    const weeks = parseInt(req.body.weeks) || 4;
    let text = "";

    console.log("📥 Received request - studyHours:", studyHours, "weeks:", weeks, "file:", req.file ? "yes" : "no");

    // Extract text from PDF file
    if (!req.file) {
      console.error("❌ No file uploaded");
      return res.status(400).json({ error: "No file uploaded." });
    }

    try {
      const data = await pdfParse(req.file.buffer);
      text = data.text;
      console.log("📄 PDF extracted successfully! Length:", text.length);
    } catch (pdfErr) {
      console.error("PDF parsing error:", pdfErr.message);
      return res.status(400).json({ error: "Failed to parse PDF file." });
    }

    if (!text || text.trim().length === 0) {
      console.error("❌ PDF appears to be empty — using local fallback planner");
      const fallback = localPlanner(text || "", studyHours, weeks);
      return res.json(fallback);
    }

    // Calculate exam date
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + weeks * 7);
    const examDateStr = examDate.toLocaleDateString();

    const prompt = `You are a study planner AI. Based on the syllabus below, create a weekly study plan.

Syllabus:
${text}

Rules:
- Student has ${studyHours} hours per day to study
- Exam is on: ${examDateStr}
- Study period is ${weeks} weeks
- Break topics into small subtasks
- Respond ONLY with this exact JSON format, no extra text:
{
  "topics": ["topic1", "topic2"],
  "plan": [
    { "day": "Day 1", "date": "Mon", "tasks": ["Task 1", "Task 2"], "hours": 2 }
  ]
}`;

    console.log("🤖 Calling AI...");
    let aiResponse;
    try {
      aiResponse = await callAI(prompt);
      console.log("📝 AI Response:", aiResponse);
      const cleaned = aiResponse.replace(/```json|```/g, "").trim();
      console.log("🔧 Cleaned Response:", cleaned);
      const plan = JSON.parse(cleaned);
      console.log("✅ Plan generated!");
      return res.json(plan);
    } catch (aiErr) {
      console.error('AI call failed:', aiErr.message || aiErr);
      // If quota/billing issue, rate limit, or model not found, use local fallback planner
      const msg = (aiErr && aiErr.message) ? aiErr.message : '';
      const statusCode = aiErr?.status || aiErr?.statusCode || aiErr?.code;
      if (msg.includes('Quota') || statusCode === 429 || statusCode === 404 || msg.toLowerCase().includes('not found')) {
        console.log('⚠️ Using local fallback planner due to AI error or quota issue');
        const fallback = localPlanner(text, studyHours, weeks);
        return res.json(fallback);
      }
      throw aiErr;
    }

  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    console.error("❌ Full Error Stack:", err);
    res.status(500).json({ error: err.message || "Failed to generate plan." });
  }
});

// ─── ROUTE 2: Explain a Topic ──────────────────────────────
app.post("/api/explain", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "No topic provided." });
    }

    const prompt = `Explain this topic in simple English for a student: "${topic}". Keep it short (3-5 sentences), clear and friendly.`;

    console.log(`💡 Explaining: ${topic}`);
    try {
      const explanation = await callAI(prompt);
      return res.json({ explanation });
    } catch (aiErr) {
      console.error("❌ AI explain failed:", aiErr.message || aiErr);
      const fallback = localExplain(topic);
      return res.json({ explanation: fallback, fallback: true });
    }

  } catch (err) {
    console.error("❌ Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message || "Failed to explain topic." });
  }
});

app.get("/", (req, res) => {
  res.send("✅ StudyMate AI backend is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
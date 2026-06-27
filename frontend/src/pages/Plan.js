import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Plan() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [completed, setCompleted] = useState({});
  const [question, setQuestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [streak, setStreak] = useState(0);
  const [streakMessage, setStreakMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("studyPlan");
    if (saved) setPlan(JSON.parse(saved));
    const savedProgress = localStorage.getItem("studyProgress");
    if (savedProgress) setCompleted(JSON.parse(savedProgress));

    const todayKey = new Date().toISOString().slice(0, 10);
    const lastVisit = localStorage.getItem("studyLastVisit");
    let currentStreak = parseInt(localStorage.getItem("studyStreak") || "0", 10);

    if (lastVisit === todayKey) {
      // same day, no change
    } else if (lastVisit === new Date(Date.now() - 86400000).toISOString().slice(0, 10)) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    localStorage.setItem("studyLastVisit", todayKey);
    localStorage.setItem("studyStreak", String(currentStreak));
    setStreak(currentStreak);

    if (currentStreak === 1) {
      setStreakMessage("Great beginning — keep your Gotham streak alive!");
    } else if (currentStreak < 5) {
      setStreakMessage("Nice! Your daily study streak is building momentum.");
    } else {
      setStreakMessage("Legendary! Your Gotham streak is strong. Keep pushing forward.");
    }
  }, []);

  const toggleTask = (dayIndex, taskIndex) => {
    const key = `${dayIndex}-${taskIndex}`;
    const updated = { ...completed, [key]: !completed[key] };
    setCompleted(updated);
    localStorage.setItem("studyProgress", JSON.stringify(updated));
  };

  const handleExplain = async () => {
    if (!question.trim()) return;
    setLoadingExplain(true);
    setExplanation("");
    try {
      const res = await axios.post("http://localhost:5000/api/explain", { topic: question });
      setExplanation(res.data.explanation || "No explanation returned.");
    } catch (err) {
      const msg = err.response?.data?.error || "Could not get explanation. Check backend.";
      setExplanation(msg);
    }
    setLoadingExplain(false);
  };

  const safeDays = Array.isArray(plan?.plan) ? plan.plan : [];
  const totalTasks = safeDays.reduce((acc, day) => acc + (Array.isArray(day.tasks) ? day.tasks.length : 0), 0);
  const doneTasks = Object.values(completed).filter(Boolean).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const isComplete = totalTasks > 0 && progress === 100;

  if (!plan) return (
    <div style={styles.center}>
      <p>No plan found. <button onClick={() => navigate("/")} style={styles.linkBtn}>Go back</button></p>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.badge}>Gotham Ops</div>
          <h1 style={styles.logo}>📚 StudyMate AI</h1>
        </div>
        <button onClick={() => navigate("/")} style={styles.backBtn}>← New Plan</button>
      </div>

      {isComplete && (
        <div style={styles.celebrationCard}>
          <div style={styles.celebrationTitle}>🎉 Mission Accomplished!</div>
          <p style={styles.celebrationText}>You completed every task — your Gotham streak is legendary. Share your victory and start a new plan to keep the momentum alive.</p>
        </div>
      )}

      <div style={styles.streakCard}>
        <div style={styles.streakHeader}>
          <span style={styles.streakLabel}>Daily Streak</span>
          <span style={styles.streakValue}>{streak} days</span>
        </div>
        <p style={styles.streakText}>{streakMessage}</p>
      </div>
      <div style={styles.missionCard}>
        <h3 style={styles.sectionTitle}>🦇 Gotham Daily Quest</h3>
        <p style={styles.missionText}>Finish one task today, then use the Explain box to deepen your knowledge. Every return visit protects your streak and sharpens your skills.</p>
      </div>
      <div style={styles.progressCard}>
        <div style={styles.progressRow}>
          <span style={styles.progressLabel}>Overall Progress</span>
          <span style={styles.progressPct}>{progress}%</span>
        </div>
        <div style={styles.barBg}>
          <div style={{ ...styles.barFill, width: `${progress}%` }} />
        </div>
        <p style={styles.progressSub}>{doneTasks} of {totalTasks} tasks completed</p>
      </div>

      {plan.topics && (
        <div style={styles.topicsCard}>
          <h3 style={styles.sectionTitle}>📋 Topics Covered</h3>
          <div style={styles.topicsGrid}>
            {plan.topics.map((t, i) => (
              <span key={i} style={styles.topicBadge}>{t}</span>
            ))}
          </div>
        </div>
      )}

      <h3 style={styles.sectionTitle}>📅 Weekly Schedule</h3>
      <div style={styles.dayGrid}>
        {safeDays.map((day, di) => (
          <div key={di} style={styles.dayCard}>
            <div style={styles.dayHeader}>
              <span style={styles.dayTitle}>{day.day}</span>
              <span style={styles.dayBadge}>{day.hours}h</span>
            </div>
            {day.tasks.map((task, ti) => {
              const key = `${di}-${ti}`;
              const done = !!completed[key];
              return (
                <div key={ti} onClick={() => toggleTask(di, ti)}
                  style={{ ...styles.taskRow, background: done ? "#f0fdf4" : "#fff" }}>
                  <span style={styles.checkbox}>{done ? "✅" : "⬜"}</span>
                  <span style={{ ...styles.taskText, textDecoration: done ? "line-through" : "none", color: done ? "#6b7280" : "#111827" }}>
                    {task}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={styles.explainCard}>
        <h3 style={styles.sectionTitle}>🤖 Ask AI to Explain a Topic</h3>
        <div style={styles.explainRow}>
          <input
            type="text"
            placeholder="e.g. What is a linked list?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExplain()}
            style={styles.explainInput}
          />
          <button onClick={handleExplain} disabled={loadingExplain} style={styles.explainBtn}>
            {loadingExplain ? "..." : "Ask"}
          </button>
        </div>
        {explanation && (
          <div style={styles.explanationBox}>
            <p style={styles.explanationText}>{explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #020408 0%, #0b101f 48%, #070a12 100%)",
    padding: "2rem",
    maxWidth: "1080px",
    margin: "0 auto",
    color: "#f3f3f7",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  center: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", color: "#f3f3f7" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" },
  headerLeft: { display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" },
  badge: { background: "rgba(255, 214, 0, 0.14)", color: "#ffd600", padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", border: "1px solid rgba(255,214,0,0.18)" },
  logo: { fontSize: "2rem", fontWeight: 800, color: "#ffd500", margin: 0, letterSpacing: "-0.04em" },
  backBtn: {
    background: "rgba(255, 214, 0, 0.12)",
    border: "1px solid rgba(255, 214, 0, 0.4)",
    color: "#ffd600",
    padding: "10px 18px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  linkBtn: { background: "none", border: "none", color: "#ffd600", cursor: "pointer", textDecoration: "underline" },
  streakCard: {
    background: "rgba(255, 214, 0, 0.08)",
    borderRadius: "24px",
    padding: "1.25rem 1.4rem",
    marginBottom: "1.25rem",
    border: "1px solid rgba(255, 214, 0, 0.14)",
  },
  streakHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" },
  streakLabel: { fontSize: "0.95rem", color: "#e8e8ef", fontWeight: 600 },
  streakValue: { fontSize: "1.15rem", fontWeight: 800, color: "#ffd600" },
  streakText: { margin: 0, color: "#edf0ff", lineHeight: 1.7, fontSize: "0.96rem" },
  progressCard: {
    background: "rgba(18, 22, 38, 0.95)",
    border: "1px solid rgba(255, 214, 0, 0.12)",
    borderRadius: "28px",
    padding: "1.75rem",
    marginBottom: "1.75rem",
    boxShadow: "0 28px 88px rgba(0, 0, 0, 0.33)",
  },
  progressRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "1rem", flexWrap: "wrap" },
  progressLabel: { fontSize: "14px", fontWeight: "600", color: "#c9c9d6" },
  progressPct: { fontSize: "18px", fontWeight: "800", color: "#ffd600" },
  barBg: { background: "rgba(255, 255, 255, 0.08)", borderRadius: "999px", height: "12px", overflow: "hidden" },
  barFill: { background: "linear-gradient(90deg, #ffd600, #f5da21)", height: "100%", borderRadius: "999px", transition: "width 0.4s ease" },
  progressSub: { fontSize: "13px", color: "#9b9bb0", marginTop: "10px" },
  topicsCard: {
    background: "rgba(12, 15, 28, 0.96)",
    borderRadius: "22px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    border: "1px solid rgba(255, 214, 0, 0.12)",
  },
  sectionTitle: { fontSize: "1.05rem", fontWeight: "700", color: "#f8f8fb", marginBottom: "0.75rem", marginTop: 0 },
  topicsGrid: { display: "flex", flexWrap: "wrap", gap: "10px" },
  topicBadge: {
    background: "rgba(255, 214, 0, 0.14)",
    color: "#ffd600",
    padding: "7px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
    border: "1px solid rgba(255, 214, 0, 0.22)",
  },
  dayGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "1.75rem" },
  dayCard: {
    background: "rgba(9, 12, 20, 0.95)",
    borderRadius: "28px",
    padding: "1.4rem",
    border: "1px solid rgba(255, 214, 0, 0.12)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
  },
  dayHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" },
  dayTitle: { fontWeight: "800", fontSize: "15px", color: "#ffffff" },
  dayBadge: { background: "rgba(255, 214, 0, 0.14)", color: "#ffd600", fontSize: "11px", padding: "4px 10px", borderRadius: "999px", fontWeight: 700 },
  taskRow: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", borderRadius: "18px", cursor: "pointer", marginBottom: "10px", border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)", minHeight: "60px", flexWrap: "wrap" },
  checkbox: { fontSize: "16px", flexShrink: 0, marginTop: "3px" },
  taskText: { fontSize: "14px", lineHeight: 1.75, color: "#e6e6ff", whiteSpace: "pre-wrap", wordBreak: "break-word", flex: 1 },
  missionCard: { background: "rgba(255, 214, 0, 0.08)", borderRadius: "24px", padding: "1.4rem 1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(255, 214, 0, 0.16)" },
  missionText: { margin: 0, color: "#e7e7f0", lineHeight: 1.75, fontSize: "0.95rem" },
  explainCard: {
    background: "rgba(12, 15, 28, 0.95)",
    borderRadius: "24px",
    padding: "1.5rem",
    boxShadow: "0 18px 36px rgba(0,0,0,0.24)",
    marginBottom: "2rem",
    border: "1px solid rgba(255, 214, 0, 0.1)",
  },
  explainRow: { display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginTop: "0.5rem" },
  explainInput: {
    flex: 1,
    minWidth: 0,
    padding: "14px 16px",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "16px",
    fontSize: "14px",
    background: "rgba(255,255,255,0.04)",
    color: "#f5f5f7",
    outline: "none",
  },
  explainBtn: {
    background: "#ffd600",
    color: "#06101c",
    border: "none",
    padding: "14px 22px",
    borderRadius: "16px",
    fontWeight: 700,
    cursor: "pointer",
    minWidth: "100px",
    boxShadow: "0 14px 30px rgba(255, 214, 0, 0.18)",
  },
  explanationBox: { marginTop: "1rem", background: "rgba(255, 214, 0, 0.08)", border: "1px solid rgba(255, 214, 0, 0.18)", borderRadius: "16px", padding: "1rem" },
  explanationText: { fontSize: "14px", color: "#f8f8fb", lineHeight: 1.7, margin: 0 },
  celebrationCard: {
    background: "linear-gradient(135deg, rgba(255,214,0,0.18), rgba(70,70,90,0.92))",
    border: "1px solid rgba(255,214,0,0.24)",
    borderRadius: "28px",
    padding: "1.4rem 1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 22px 46px rgba(0, 0, 0, 0.28)",
  },
  celebrationTitle: { margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#fff" },
  celebrationText: { margin: "0.85rem 0 0", color: "#e9e8f8", lineHeight: 1.75, fontSize: "0.96rem" },
};
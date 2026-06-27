import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

function Home() {
  const [file, setFile] = useState(null);
  const [studyHours, setStudyHours] = useState(3);
  const [weeks, setWeeks] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setError("Please upload a PDF file.");
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("syllabus", file);
      formData.append("studyHours", studyHours);
      formData.append("weeks", weeks);
      const res = await axios.post(`${API}/api/generate-plan`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      localStorage.setItem("studyPlan", JSON.stringify(res.data));
      navigate("/plan");
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Something went wrong. Make sure the backend is running.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.heroBanner}>
        <div style={styles.batSignal}>
          <svg viewBox="0 0 64 64" style={styles.batSvg} xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="#ffd600" />
            <path d="M32 14c-7 0-10 3-12 5-3 2-5 5-5 9 0 2 1 4 1 5-4-2-6-5-6-5s-3 5-3 11c0 8 6 15 14 15 3 0 6-2 8-4 2 2 5 4 8 4 8 0 14-7 14-15 0-6-3-11-3-11s-2 3-6 5c0-1 1-3 1-5 0-4-2-7-5-9-2-2-5-5-12-5z" fill="#111" />
          </svg>
        </div>
        <span style={styles.heroLabel}>Gotham Study Command</span>
      </div>
      <h1 style={styles.title}>📚 Vanga Padikalam</h1>
      <p style={styles.subtitle}>Upload your syllabus and get a personalised study plan</p>
      <div style={styles.encourageCard}>
        <h2 style={styles.encourageTitle}>Your Gotham Study Mission</h2>
        <p style={styles.encourageText}>Turn every syllabus into a winning study plan. Build momentum, stay consistent, and complete your mission one day at a time.</p>
      </div>
      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.label}>Upload Syllabus (PDF)</label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={styles.input}
        />
        <label style={styles.label}>Study Hours Per Day: {studyHours}h</label>
        <input
          type="range" min="1" max="10" value={studyHours}
          onChange={(e) => setStudyHours(e.target.value)}
          style={styles.input}
        />
        <label style={styles.label}>Number of Weeks: {weeks}</label>
        <input
          type="range" min="1" max="12" value={weeks}
          onChange={(e) => setWeeks(e.target.value)}
          style={styles.input}
        />
        {error && <p style={styles.error}>{error}</p>}
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "⏳ Generating Plan..." : "🚀 Generate Study Plan"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 620,
    margin: "42px auto",
    padding: 42,
    minHeight: "calc(100vh - 84px)",
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    textAlign: "center",
    background: "radial-gradient(circle at top, rgba(255,215,0,0.12), transparent 34%), linear-gradient(180deg, #050608 0%, #0e1221 100%)",
    borderRadius: 30,
    boxShadow: "0 28px 96px rgba(0, 0, 0, 0.35)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#f5f5f7",
  },
  title: { fontSize: 44, marginBottom: 8, letterSpacing: "-0.04em", color: "#ffe066" },
  subtitle: { color: "#c7c7d6", marginBottom: 34, fontSize: 16, lineHeight: 1.75, maxWidth: 520, margin: "0 auto 34px" },
  form: { display: "flex", flexDirection: "column", gap: 20, textAlign: "left" },
  label: { fontWeight: 700, fontSize: 14, color: "#e8e8ef" },
  input: {
    padding: 16,
    fontSize: 15,
    borderRadius: 18,
    border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#f7f7ff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    marginTop: 16,
    padding: "18px 28px",
    backgroundColor: "#ffd600",
    color: "#08101e",
    border: "none",
    borderRadius: 18,
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 18px 35px rgba(255, 214, 0, 0.22)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
    alignSelf: "center",
    minWidth: 240,
  },
  error: { color: "#ff6b6b", fontSize: 13, marginTop: 4, textAlign: "left" },
  heroBanner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 28, padding: "14px 18px", background: "rgba(255, 214, 0, 0.08)", borderRadius: 18, border: "1px solid rgba(255, 214, 0, 0.18)", boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.04)" },
  batSignal: { width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 28px rgba(0,0,0,0.22)" },
  batSvg: { width: 34, height: 34 },
  heroLabel: { fontSize: 15, letterSpacing: "0.02em", fontWeight: 700, color: "#ffe066", textTransform: "uppercase" },
  encourageCard: { background: "rgba(255, 214, 0, 0.08)", border: "1px solid rgba(255, 214, 0, 0.16)", borderRadius: 22, padding: "1.4rem 1.5rem", marginBottom: 28, textAlign: "left" },
  encourageTitle: { margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#f8f8fb" },
  encourageText: { margin: "0.8rem 0 0", color: "#e2e2eb", lineHeight: 1.75, fontSize: "0.96rem" },
};

export default Home;
import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Home, Star, Zap } from "lucide-react";
import socket from "../socket";

const OPTION_COLORS = {
  A: { bg: "linear-gradient(135deg, #dc2626, #ef4444)", label: "A", emoji: "🔴" },
  B: { bg: "linear-gradient(135deg, #2563eb, #3b82f6)", label: "B", emoji: "🔵" },
  C: { bg: "linear-gradient(135deg, #059669, #10b981)", label: "C", emoji: "🟢" },
  D: { bg: "linear-gradient(135deg, #d97706, #f59e0b)", label: "D", emoji: "🟡" },
};

function TimerBar({ timeLeft, maxTime = 20 }) {
  const pct = (timeLeft / maxTime) * 100;
  const color = timeLeft > 10 ? "#10b981" : timeLeft > 5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="progress-bar" style={{ height: 10, borderRadius: 100 }}>
      <div
        className="progress-fill"
        style={{ width: `${pct}%`, background: color, transition: "width 1s linear, background 0.5s ease" }}
      />
    </div>
  );
}

export default function PlayerView() {
  const { roomCode } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const playerName = location.state?.name || "Player";

  const [phase, setPhase] = useState("lobby"); // lobby | question | feedback | leaderboard | finished
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const [gameOver, setGameOver] = useState(false);
  const [myRank, setMyRank] = useState(null);
  const [floatingPoints, setFloatingPoints] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    // socket should already be connected from PlayerJoin
    if (!socket.connected) {
      navigate("/join");
      return;
    }

    socket.on("question_start", (data) => {
      setQuestion(data);
      setQuestionIdx(data.index);
      setTotalQuestions(data.total);
      setPhase("question");
      setSelectedAnswer(null);
      setFeedback(null);
      setTimeLeft(data.timeLimit || 20);
    });

    socket.on("answer_feedback", (data) => {
      setFeedback(data);
      setScore(data.totalScore);
      setPhase("feedback");
      setFloatingPoints(data.points);
      clearInterval(timerRef.current);
      // Clear floating points after animation
      setTimeout(() => setFloatingPoints(null), 1500);
    });

    socket.on("question_end", (data) => {
      if (phase !== "feedback") {
        setPhase("feedback");
        setFeedback(null); // time ran out without answering
      }
      clearInterval(timerRef.current);
    });

    socket.on("show_leaderboard", (data) => {
      setLeaderboard(data.leaderboard || []);
      const me = data.leaderboard?.find((p) => p.id === socket.id);
      setMyRank(me?.rank || null);
      setPhase("leaderboard");
    });

    socket.on("game_over", (data) => {
      setLeaderboard(data.leaderboard || []);
      const me = data.leaderboard?.find((p) => p.id === socket.id);
      setMyRank(me?.rank || null);
      setGameOver(true);
      setPhase("finished");
      clearInterval(timerRef.current);
    });

    socket.on("host_disconnected", () => {
      alert("The host has disconnected. Game over!");
      navigate("/");
    });

    socket.on("game_restarted", () => {
      setPhase("lobby");
      setScore(0);
      setGameOver(false);
      setQuestion(null);
      setFeedback(null);
      setSelectedAnswer(null);
    });

    return () => {
      clearInterval(timerRef.current);
      socket.off("question_start");
      socket.off("answer_feedback");
      socket.off("question_end");
      socket.off("show_leaderboard");
      socket.off("game_over");
      socket.off("host_disconnected");
      socket.off("game_restarted");
    };
  }, [navigate, roomCode]);

  // Client-side countdown
  useEffect(() => {
    if (phase === "question") {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, question]);

  const handleAnswer = (key) => {
    if (selectedAnswer || phase !== "question") return;
    setSelectedAnswer(key);
    socket.emit("submit_answer", { roomCode, answer: key });
  };

  // ── LOBBY ──────────────────────────────────
  if (phase === "lobby") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="glass-card animate-bounce-in" style={{ padding: 48, textAlign: "center", maxWidth: 420, width: "100%" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎮</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
            You're in!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
            Hey <strong style={{ color: "#a78bfa" }}>{playerName}</strong>! Waiting for the host to start the game…
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "glow-pulse 1s ease-in-out infinite" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Connected to Room {roomCode}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME OVER ─────────────────────────────
  if (gameOver) {
    const isTop3 = myRank && myRank <= 3;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="glass-card animate-bounce-in" style={{ padding: 40, textAlign: "center", maxWidth: 420, width: "100%" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>
            {isTop3 ? (myRank === 1 ? "🏆" : myRank === 2 ? "🥈" : "🥉") : "🎉"}
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>
            Game Over!
          </h2>

          {myRank && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: 4 }}>Your final rank</div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "3rem", fontWeight: 900,
                background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                #{myRank}
              </div>
            </div>
          )}

          <div className="score-badge" style={{ display: "inline-flex", fontSize: "1.1rem", padding: "10px 24px", marginBottom: 28 }}>
            <Star size={16} fill="white" /> {score.toLocaleString()} points
          </div>

          <div style={{ marginBottom: 24 }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginBottom: 12 }}>Top Players</p>
            {leaderboard.slice(0, 5).map((p) => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 16px", borderRadius: 10, marginBottom: 6,
                background: p.id === socket.id ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                border: p.id === socket.id ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.06)",
              }}>
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>#{p.rank} {p.name} {p.id === socket.id ? "← you" : ""}</span>
                <span style={{ fontWeight: 800, color: "#a78bfa", fontFamily: "'Space Grotesk', sans-serif" }}>{p.score}</span>
              </div>
            ))}
          </div>

          <button className="btn-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => navigate("/")}>
            <Home size={18} /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── QUESTION ──────────────────────────────
  if (phase === "question") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="score-badge"><Zap size={14} fill="white" /> {score.toLocaleString()}</div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Q{questionIdx + 1}/{totalQuestions}</span>
          <div style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: "1.5rem",
            color: timeLeft > 10 ? "#10b981" : timeLeft > 5 ? "#f59e0b" : "#ef4444",
          }}>
            {timeLeft}s
          </div>
        </div>

        {/* Timer bar */}
        <TimerBar timeLeft={timeLeft} maxTime={question?.timeLimit || 20} />

        {/* Question card */}
        <div className="glass-card animate-slide-in" style={{
          padding: "24px", margin: "16px 0",
          textAlign: "center",
          fontSize: "clamp(1rem, 3vw, 1.25rem)",
          fontWeight: 700, lineHeight: 1.5,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          {question?.question}
        </div>

        {/* Options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1, alignContent: "start" }}>
          {question && Object.entries(question.options).map(([key, value]) => {
            const style = OPTION_COLORS[key];
            const isSelected = selectedAnswer === key;
            return (
              <button
                key={key}
                className={`option-btn option-${key.toLowerCase()}`}
                onClick={() => handleAnswer(key)}
                disabled={!!selectedAnswer}
                style={{
                  opacity: selectedAnswer && !isSelected ? 0.5 : 1,
                  outline: isSelected ? "4px solid white" : "none",
                  transform: isSelected ? "scale(0.97)" : undefined,
                  minHeight: 80,
                }}
              >
                <div className="option-label">{key}</div>
                <span style={{ fontSize: "clamp(0.8rem, 2.5vw, 1rem)", textAlign: "left", flex: 1 }}>{value}</span>
              </button>
            );
          })}
        </div>

        {selectedAnswer && (
          <div className="animate-slide-in" style={{ textAlign: "center", marginTop: 16, color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
            ✅ Answer submitted. Waiting for others…
          </div>
        )}
      </div>
    );
  }

  // ── FEEDBACK ──────────────────────────────
  if (phase === "feedback") {
    const isCorrect = feedback?.isCorrect;
    const didAnswer = !!feedback;

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div
          className={`glass-card animate-bounce-in ${isCorrect ? "feedback-correct" : "feedback-wrong"}`}
          style={{ padding: 48, textAlign: "center", maxWidth: 400, width: "100%", position: "relative" }}
        >
          {/* Floating points */}
          {floatingPoints !== null && floatingPoints > 0 && (
            <div style={{
              position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 900,
              color: "#10b981",
              animation: "float-up 1.5s ease forwards",
              pointerEvents: "none",
            }}>
              +{floatingPoints}
            </div>
          )}

          <div style={{ fontSize: "4rem", marginBottom: 16 }}>
            {!didAnswer ? "⏰" : isCorrect ? "✅" : "❌"}
          </div>

          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>
            {!didAnswer ? "Time's Up!" : isCorrect ? "Correct!" : "Wrong!"}
          </h2>

          {feedback ? (
            <>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>
                {isCorrect
                  ? `+${feedback.points} points (answered in ${feedback.timeTaken}s)`
                  : "Better luck next time!"}
              </p>
              <div style={{
                padding: "20px 32px",
                borderRadius: 16,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: 4 }}>Your total score</div>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.5rem", fontWeight: 900,
                  background: "linear-gradient(135deg, #a78bfa, #ec4899)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {score.toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.5)" }}>You didn't answer in time. 0 points.</p>
          )}

          <p style={{ color: "rgba(255,255,255,0.3)", marginTop: 24, fontSize: "0.85rem" }}>
            Waiting for the host to continue…
          </p>
        </div>
      </div>
    );
  }

  // ── LEADERBOARD (mid-game) ────────────────
  if (phase === "leaderboard") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.8rem", fontWeight: 800, textAlign: "center", marginBottom: 8 }}>
            🏆 Leaderboard
          </h2>
          {myRank && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginBottom: 24, fontSize: "0.9rem" }}>
              You're ranked <strong style={{ color: "#fbbf24" }}>#{myRank}</strong>
            </p>
          )}
          <div className="glass-card" style={{ padding: 20 }}>
            {leaderboard.slice(0, 10).map((p) => {
              const isMe = p.id === socket.id;
              const rankStyle = p.rank <= 3 ? { 1: "#fbbf24", 2: "#9ca3af", 3: "#b45309" }[p.rank] : "rgba(255,255,255,0.1)";
              return (
                <div
                  key={p.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 12, marginBottom: 8,
                    background: isMe ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                    border: isMe ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: rankStyle, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", color: p.rank <= 3 ? "#000" : "#fff", flexShrink: 0 }}>
                    {p.rank <= 3 ? ["🥇","🥈","🥉"][p.rank-1] : `#${p.rank}`}
                  </div>
                  <div style={{ flex: 1, fontWeight: isMe ? 700 : 500 }}>{p.name} {isMe && "← you"}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: "#a78bfa" }}>{p.score}</div>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 20, fontSize: "0.85rem" }}>
            Waiting for host to continue…
          </p>
        </div>
      </div>
    );
  }

  return null;
}

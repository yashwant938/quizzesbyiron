import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Home, Star, Zap } from "lucide-react";
import socket from "../socket";

const OPTION_COLORS = {
  A: { bg: "linear-gradient(135deg, #dc2626, #ef4444)" },
  B: { bg: "linear-gradient(135deg, #2563eb, #3b82f6)" },
  C: { bg: "linear-gradient(135deg, #059669, #10b981)" },
  D: { bg: "linear-gradient(135deg, #d97706, #f59e0b)" },
};

function TimerBar({ timeLeft, maxTime = 20 }) {
  const pct = (timeLeft / maxTime) * 100;
  const color = timeLeft > 10 ? "#10b981" : timeLeft > 5 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ height: 10, borderRadius: 100, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 100, transition: "width 1s linear, background 0.5s ease" }} />
    </div>
  );
}

export default function PlayerView() {
  const { roomCode: rawCode } = useParams();
  const roomCode = rawCode?.toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();
  const playerName = location.state?.name || sessionStorage.getItem("playerName") || "";

  const [phase, setPhase] = useState("lobby");
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
  const [joinName, setJoinName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const timerRef = useRef(null);
  const feedbackRef = useRef(null);

  // Save name to sessionStorage so it survives navigation
  useEffect(() => {
    if (playerName) sessionStorage.setItem("playerName", playerName);
  }, [playerName]);

  useEffect(() => {
    // If not connected, connect now (handles direct URL navigation from phone)
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("player_joined", (data) => {
      setJoining(false);
      sessionStorage.setItem("playerName", data.name);
      setPhase("lobby");
    });

    socket.on("join_error", (data) => {
      setJoining(false);
      setJoinError(data.message);
    });

    socket.on("question_start", (data) => {
      setQuestion(data);
      setQuestionIdx(data.index);
      setTotalQuestions(data.total);
      setPhase("question");
      setSelectedAnswer(null);
      setFeedback(null);
      feedbackRef.current = null;
      setTimeLeft(data.timeLimit || 20);
    });

    socket.on("answer_feedback", (data) => {
      setFeedback(data);
      feedbackRef.current = data;
      setScore(data.totalScore);
      setPhase("feedback");
      setFloatingPoints(data.points);
      clearInterval(timerRef.current);
      setTimeout(() => setFloatingPoints(null), 1500);
    });

    socket.on("question_end", () => {
      // If we haven't received feedback yet, it means time ran out without an answer
      if (!feedbackRef.current) {
        setPhase("feedback");
        setFeedback(null);
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
      socket.off("player_joined");
      socket.off("join_error");
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

  const handleInlineJoin = () => {
    const name = joinName.trim();
    if (!name || name.length < 2) { setJoinError("Enter a name with at least 2 characters."); return; }
    if (name.length > 20) { setJoinError("Name must be 20 characters or less."); return; }
    setJoining(true);
    setJoinError("");
    socket.emit("player_join", { roomCode, name });
  };

  // ── INLINE JOIN (arrived via QR with no name) ──────────────
  if (!playerName && phase === "lobby") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="glass-card animate-bounce-in" style={{ padding: 40, maxWidth: 380, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>⚡</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.6rem", fontWeight: 800, marginBottom: 4 }}>
            Join Room
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginBottom: 24 }}>
            Room <strong style={{ color: "#a78bfa" }}>{roomCode}</strong> — enter your name to play
          </p>
          <input
            className="input-field"
            placeholder="Your name"
            value={joinName}
            onChange={(e) => { setJoinName(e.target.value); setJoinError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleInlineJoin()}
            maxLength={20}
            style={{ marginBottom: 12 }}
            autoFocus
          />
          {joinError && (
            <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: "0.85rem", marginBottom: 12 }}>
              ⚠️ {joinError}
            </div>
          )}
          <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleInlineJoin} disabled={joining}>
            {joining ? "Joining…" : "Join Game →"}
          </button>
        </div>
      </div>
    );
  }

  // ── LOBBY ──────────────────────────────────────────────────
  if (phase === "lobby") {
    const displayName = playerName || sessionStorage.getItem("playerName") || "Player";
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="glass-card animate-bounce-in" style={{ padding: 48, textAlign: "center", maxWidth: 420, width: "100%" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎮</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem", fontWeight: 800, marginBottom: 8 }}>
            You're in!
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>
            Hey <strong style={{ color: "#a78bfa" }}>{displayName}</strong>! Waiting for the host to start the game…
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "glow-pulse 1s ease-in-out infinite", display: "inline-block" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Connected · Room {roomCode}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── GAME OVER ──────────────────────────────────────────────
  if (gameOver) {
    const isTop3 = myRank && myRank <= 3;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="glass-card animate-bounce-in" style={{ padding: 40, textAlign: "center", maxWidth: 420, width: "100%" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: 16 }}>
            {isTop3 ? (myRank === 1 ? "🏆" : myRank === 2 ? "🥈" : "🥉") : "🎉"}
          </div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>Game Over!</h2>
          {myRank && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginBottom: 4 }}>Your final rank</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "3rem", fontWeight: 900, background: "linear-gradient(135deg, #fbbf24, #f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
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
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>#{p.rank} {p.name}{p.id === socket.id ? " ← you" : ""}</span>
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

  // ── QUESTION ───────────────────────────────────────────────
  if (phase === "question") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "16px", userSelect: "none" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="score-badge"><Zap size={14} fill="white" /> {score.toLocaleString()}</div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Q{questionIdx + 1}/{totalQuestions}</span>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, fontSize: "1.5rem", color: timeLeft > 10 ? "#10b981" : timeLeft > 5 ? "#f59e0b" : "#ef4444" }}>
            {timeLeft}s
          </div>
        </div>

        <TimerBar timeLeft={timeLeft} maxTime={question?.timeLimit || 20} />

        {/* Question */}
        <div className="glass-card animate-slide-in" style={{ padding: "20px 24px", margin: "14px 0", textAlign: "center", fontSize: "clamp(0.95rem, 3vw, 1.2rem)", fontWeight: 700, lineHeight: 1.5, fontFamily: "'Space Grotesk', sans-serif" }}>
          {question?.question}
        </div>

        {/* Options — touch-friendly large buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, flex: 1, alignContent: "start" }}>
          {question && Object.entries(question.options).map(([key, value]) => {
            const col = OPTION_COLORS[key];
            const isSelected = selectedAnswer === key;
            return (
              <button
                key={key}
                onClick={() => handleAnswer(key)}
                disabled={!!selectedAnswer}
                style={{
                  background: col.bg,
                  border: isSelected ? "4px solid white" : "4px solid transparent",
                  borderRadius: 16,
                  padding: "18px 14px",
                  color: "white",
                  fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                  cursor: selectedAnswer ? "default" : "pointer",
                  opacity: selectedAnswer && !isSelected ? 0.45 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 80,
                  boxShadow: isSelected ? "0 0 0 4px rgba(255,255,255,0.5)" : "0 4px 16px rgba(0,0,0,0.3)",
                  transform: isSelected ? "scale(0.96)" : "scale(1)",
                  transition: "all 0.15s ease",
                  WebkitTapHighlightColor: "transparent",
                  outline: "none",
                  textAlign: "left",
                }}
              >
                <div style={{ background: "rgba(0,0,0,0.25)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.9rem", flexShrink: 0 }}>
                  {key}
                </div>
                <span style={{ flex: 1, lineHeight: 1.3 }}>{value}</span>
              </button>
            );
          })}
        </div>

        {selectedAnswer && (
          <div style={{ textAlign: "center", marginTop: 16, color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
            ✅ Answer submitted. Waiting for others…
          </div>
        )}
      </div>
    );
  }

  // ── FEEDBACK ───────────────────────────────────────────────
  if (phase === "feedback") {
    const isCorrect = feedback?.isCorrect;
    const didAnswer = !!feedback;
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div
          className="glass-card animate-bounce-in"
          style={{
            padding: 48, textAlign: "center", maxWidth: 400, width: "100%", position: "relative",
            background: isCorrect ? "rgba(6,95,70,0.25)" : didAnswer ? "rgba(127,29,29,0.25)" : "rgba(30,30,30,0.4)",
            border: `2px solid ${isCorrect ? "rgba(16,185,129,0.5)" : didAnswer ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          {floatingPoints !== null && floatingPoints > 0 && (
            <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 900, color: "#10b981", animation: "float-up 1.5s ease forwards", pointerEvents: "none" }}>
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
                {isCorrect ? `+${feedback.points} points — answered in ${feedback.timeTaken}s` : "Better luck next time!"}
              </p>
              <div style={{ padding: "20px 32px", borderRadius: 16, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", marginBottom: 4 }}>Total score</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.5rem", fontWeight: 900, background: "linear-gradient(135deg, #a78bfa, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {score.toLocaleString()}
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.5)" }}>You didn't answer in time. 0 points.</p>
          )}
          <p style={{ color: "rgba(255,255,255,0.3)", marginTop: 24, fontSize: "0.85rem" }}>Waiting for host…</p>
        </div>
      </div>
    );
  }

  // ── LEADERBOARD ────────────────────────────────────────────
  if (phase === "leaderboard") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.8rem", fontWeight: 800, textAlign: "center", marginBottom: 8 }}>🏆 Leaderboard</h2>
          {myRank && (
            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", marginBottom: 24, fontSize: "0.9rem" }}>
              You're ranked <strong style={{ color: "#fbbf24" }}>#{myRank}</strong>
            </p>
          )}
          <div className="glass-card" style={{ padding: 20 }}>
            {leaderboard.slice(0, 10).map((p) => {
              const isMe = p.id === socket.id;
              const rankBg = { 1: "#fbbf24", 2: "#9ca3af", 3: "#b45309" }[p.rank] || "rgba(255,255,255,0.1)";
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, marginBottom: 8, background: isMe ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)", border: isMe ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: rankBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", color: p.rank <= 3 ? "#000" : "#fff", flexShrink: 0 }}>
                    {p.rank <= 3 ? ["🥇", "🥈", "🥉"][p.rank - 1] : `#${p.rank}`}
                  </div>
                  <div style={{ flex: 1, fontWeight: isMe ? 700 : 500 }}>{p.name}{isMe ? " ← you" : ""}</div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: "#a78bfa" }}>{p.score}</div>
                </div>
              );
            })}
          </div>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 20, fontSize: "0.85rem" }}>Waiting for host to continue…</p>
        </div>
      </div>
    );
  }

  return null;
}

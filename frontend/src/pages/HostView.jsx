import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Users, Play, ChevronRight, Trophy, SkipForward, RotateCcw, Home } from "lucide-react";
import socket from "../socket";

const OPTION_COLORS = {
  A: { bg: "linear-gradient(135deg, #dc2626, #ef4444)", shadow: "rgba(239,68,68,0.3)", icon: "🔴" },
  B: { bg: "linear-gradient(135deg, #2563eb, #3b82f6)", shadow: "rgba(59,130,246,0.3)", icon: "🔵" },
  C: { bg: "linear-gradient(135deg, #059669, #10b981)", shadow: "rgba(16,185,129,0.3)", icon: "🟢" },
  D: { bg: "linear-gradient(135deg, #d97706, #f59e0b)", shadow: "rgba(245,158,11,0.3)", icon: "🟡" },
};

const RANK_STYLES = {
  1: { bg: "#fbbf24", icon: "🥇" },
  2: { bg: "#9ca3af", icon: "🥈" },
  3: { bg: "#b45309", icon: "🥉" },
};

function TimerRing({ timeLeft, maxTime = 20 }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / maxTime;
  const strokeDashoffset = circumference * (1 - progress);
  const color = timeLeft > 10 ? "#10b981" : timeLeft > 5 ? "#f59e0b" : "#ef4444";

  return (
    <div className="timer-ring" style={{ width: 130, height: 130 }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="65" cy="65" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>
      <div className="timer-text" style={{ color }}>
        {timeLeft}
      </div>
    </div>
  );
}

export default function HostView() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState("lobby");
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answerData, setAnswerData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(20);
  const timerRef = useRef(null);

  const joinUrl = `${window.location.origin}/join/${roomCode}`;

  useEffect(() => {
    socket.connect();
    socket.emit("host_join", { roomCode });

    socket.on("host_joined", (data) => {
      setPlayers(data.players || []);
      setPhase(data.phase || "lobby");
    });

    socket.on("player_list_update", (data) => {
      setPlayers(data.players || []);
    });

    socket.on("question_start", (data) => {
      setQuestion(data);
      setQuestionIdx(data.index);
      setTotalQuestions(data.total);
      setPhase("question");
      setAnswerData(null);
      setAnsweredCount(0);
      setShowLeaderboard(false);
      setTimeLeft(data.timeLimit || 20);
    });

    socket.on("question_end", (data) => {
      setAnswerData(data);
      setPhase("answer");
      clearInterval(timerRef.current);
    });

    socket.on("answer_count_update", (data) => {
      setAnsweredCount(data.answered);
    });

    socket.on("show_leaderboard", (data) => {
      setLeaderboard(data.leaderboard || []);
      setShowLeaderboard(true);
    });

    socket.on("game_over", (data) => {
      setLeaderboard(data.leaderboard || []);
      setGameOver(true);
      setPhase("finished");
      clearInterval(timerRef.current);
    });

    socket.on("host_disconnected", () => {});

    return () => {
      clearInterval(timerRef.current);
      socket.off("host_joined");
      socket.off("player_list_update");
      socket.off("question_start");
      socket.off("question_end");
      socket.off("answer_count_update");
      socket.off("show_leaderboard");
      socket.off("game_over");
    };
  }, [roomCode]);

  // Client-side countdown timer
  useEffect(() => {
    if (phase === "question") {
      clearInterval(timerRef.current);
      setTimeLeft(question?.timeLimit || 20);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, question]);

  const handleStartGame = () => {
    socket.emit("start_game", { roomCode });
  };

  const handleShowLeaderboard = () => {
    socket.emit("show_leaderboard", { roomCode });
  };

  const handleNextQuestion = () => {
    setShowLeaderboard(false);
    socket.emit("next_question", { roomCode });
  };

  const handleRestart = () => {
    socket.emit("restart_game", { roomCode });
    setGameOver(false);
    setPhase("lobby");
    setPlayers([]);
    setQuestion(null);
    setAnswerData(null);
    setLeaderboard([]);
    setAnsweredCount(0);
    setQuestionIdx(0);
  };

  // ── LOBBY ───────────────────────────────────
  if (phase === "lobby") {
    return (
      <div style={{ minHeight: "100vh", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 900 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.2rem", fontWeight: 800, marginBottom: 8 }}>
              🎮 Game Lobby
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Waiting for players to join…</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
            {/* Room Code */}
            <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Room PIN</p>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "3.5rem", fontWeight: 900,
                letterSpacing: "0.12em",
                background: "linear-gradient(135deg, #fff, #a78bfa)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                marginBottom: 12,
              }}>
                {roomCode}
              </div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8rem" }}>Share this code with players</p>
            </div>

            {/* QR Code */}
            <div className="glass-card" style={{ padding: 32, textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Scan to Join</p>
              <div style={{
                background: "white",
                borderRadius: 16,
                padding: 12,
                display: "inline-block",
                boxShadow: "0 0 30px rgba(139,92,246,0.3)",
              }}>
                <QRCodeSVG value={joinUrl} size={140} />
              </div>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem", marginTop: 12 }}>{joinUrl}</p>
            </div>
          </div>

          {/* Players list */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: "1rem" }}>
                <Users size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />
                Players ({players.length})
              </h3>
              <span className="score-badge">{players.length} joined</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 48 }}>
              {players.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>No players yet. Share the code!</p>
              ) : (
                players.map((p) => (
                  <div key={p.id} className="player-chip">
                    <span style={{ fontSize: "1rem" }}>👤</span> {p.name}
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            className="btn-success"
            style={{ width: "100%", justifyContent: "center", fontSize: "1.1rem", padding: "18px 32px" }}
            onClick={handleStartGame}
            disabled={players.length === 0}
          >
            <Play size={20} fill="white" />
            Start Game ({players.length} {players.length === 1 ? "player" : "players"})
          </button>
        </div>
      </div>
    );
  }

  // ── GAME OVER ──────────────────────────────
  if (gameOver) {
    return (
      <div style={{ minHeight: "100vh", padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 600 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: "4rem", marginBottom: 16 }}>🏆</div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.5rem", fontWeight: 800, marginBottom: 8 }}>
              Game Over!
            </h1>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>Final Leaderboard</p>
          </div>
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            {leaderboard.slice(0, 10).map((p) => (
              <div key={p.id} className={`leaderboard-item rank-${p.rank}`} style={{ marginBottom: 10 }}>
                <div className="rank-badge" style={{ background: RANK_STYLES[p.rank]?.bg || "rgba(255,255,255,0.1)", color: p.rank <= 3 ? "#000" : "#fff" }}>
                  {RANK_STYLES[p.rank]?.icon || `#${p.rank}`}
                </div>
                <div style={{ flex: 1, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "#a78bfa" }}>
                  {p.score.toLocaleString()} pts
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => navigate("/")}>
              <Home size={18} /> Home
            </button>
            <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={handleRestart}>
              <RotateCcw size={18} /> Play Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION / ANSWER / LEADERBOARD ───────
  return (
    <div style={{ minHeight: "100vh", padding: "24px", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, maxWidth: 1000, width: "100%", margin: "0 auto 24px" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.1rem" }}>
          ⚡ QuizBlitz
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="score-badge"><Users size={14} />{players.length} players</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
            Q{questionIdx + 1}/{totalQuestions}
          </span>
          <div className="glass-card" style={{ padding: "6px 14px", borderRadius: 10, fontSize: "0.8rem" }}>
            📌 {roomCode}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ maxWidth: 1000, width: "100%", margin: "0 auto 32px" }}>
        <div className="progress-fill" style={{ width: `${((questionIdx + 1) / totalQuestions) * 100}%` }} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1000 }}>

          {/* Question phase */}
          {!showLeaderboard && question && (
            <>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 36 }}>
                <div className="glass-card animate-slide-in" style={{
                  padding: 32, flex: 1,
                  fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
                  fontWeight: 700, lineHeight: 1.4,
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                    Question {questionIdx + 1} of {totalQuestions}
                  </div>
                  {question.question}
                </div>
                {phase === "question" && (
                  <div style={{ flexShrink: 0 }}>
                    <TimerRing timeLeft={timeLeft} maxTime={question.timeLimit || 20} />
                  </div>
                )}
              </div>

              {/* Answers count */}
              {phase === "question" && (
                <div style={{ textAlign: "center", marginBottom: 20, color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
                  {answeredCount} / {players.length} answered
                </div>
              )}

              {/* Options grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {Object.entries(question.options).map(([key, value]) => {
                  const style = OPTION_COLORS[key];
                  const isCorrect = phase === "answer" && answerData?.correct === key;
                  const isWrong = phase === "answer" && answerData?.correct !== key;

                  return (
                    <div
                      key={key}
                      className="option-btn"
                      style={{
                        background: style.bg,
                        boxShadow: `0 4px 20px ${style.shadow}`,
                        opacity: phase === "answer" && isWrong ? 0.35 : 1,
                        transform: isCorrect ? "scale(1.02)" : "scale(1)",
                        outline: isCorrect ? "4px solid #10b981" : "none",
                        cursor: "default",
                        userSelect: "none",
                      }}
                    >
                      <div className="option-label">{key}</div>
                      <span style={{ flex: 1 }}>{value}</span>
                      {isCorrect && <span style={{ fontSize: "1.4rem" }}>✅</span>}
                    </div>
                  );
                })}
              </div>

              {/* Answer phase controls */}
              {phase === "answer" && (
                <div className="animate-slide-in" style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
                  <button className="btn-secondary" onClick={handleShowLeaderboard}>
                    <Trophy size={18} /> Show Leaderboard
                  </button>
                  <button className="btn-primary" onClick={handleNextQuestion}>
                    {questionIdx + 1 >= totalQuestions ? "Final Results" : "Next Question"}
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Leaderboard phase */}
          {showLeaderboard && (
            <div className="animate-slide-in">
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 800, textAlign: "center", marginBottom: 8 }}>
                🏆 Leaderboard
              </h2>
              <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)", marginBottom: 32, fontSize: "0.9rem" }}>
                After Question {questionIdx + 1}
              </p>
              <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
                {leaderboard.slice(0, 10).map((p) => (
                  <div key={p.id} className={`leaderboard-item rank-${p.rank}`} style={{ marginBottom: 10 }}>
                    <div className="rank-badge" style={{ background: RANK_STYLES[p.rank]?.bg || "rgba(255,255,255,0.1)", color: p.rank <= 3 ? "#000" : "#fff", fontSize: p.rank <= 3 ? "1.1rem" : "0.85rem" }}>
                      {RANK_STYLES[p.rank]?.icon || `#${p.rank}`}
                    </div>
                    <div style={{ flex: 1, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#a78bfa" }}>
                      {p.score.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button className="btn-primary" style={{ fontSize: "1.05rem", padding: "16px 40px" }} onClick={handleNextQuestion}>
                  {questionIdx + 1 >= totalQuestions ? "🏁 Final Results" : "▶ Next Question"}
                  <SkipForward size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

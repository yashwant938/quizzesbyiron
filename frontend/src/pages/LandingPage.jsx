import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Users, PlayCircle, QrCode } from "lucide-react";

const TECH_QUOTES = [
  "\"Talk is cheap. Show me the code.\" – Linus Torvalds",
  "\"First, solve the problem. Then, write the code.\" – John Johnson",
  "\"Any fool can write code that a computer can understand.\" – Martin Fowler",
  "\"Make it work, make it right, make it fast.\" – Kent Beck",
  "\"Experience is the name everyone gives to their mistakes.\" – Oscar Wilde",
  "\"Code is like humor. When you have to explain it, it's bad.\" – Cory House"
];

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  `http://${window.location.hostname}:3001`;

export default function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Cycle through quotes every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % TECH_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleHostGame = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/create-room`, { method: "POST" });
      const data = await res.json();
      navigate(`/host/${data.roomCode}`);
    } catch (e) {
      setError("Could not connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (joinCode.trim().length < 4) {
      setError("Please enter a valid room code.");
      return;
    }
    navigate(`/join/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 80,
          height: 80,
          borderRadius: 24,
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
          marginBottom: 20,
          boxShadow: "0 0 40px rgba(124,58,237,0.4)",
          animation: "glow-pulse 2s ease-in-out infinite",
        }}>
          <Zap size={40} color="white" fill="white" />
        </div>
        <h1 style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(2.5rem, 6vw, 4rem)",
          fontWeight: 800,
          background: "linear-gradient(135deg, #fff 0%, #a78bfa 50%, #ec4899 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1.1,
          marginBottom: 12,
        }}>
          YashQuizX
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.2rem", fontWeight: 600, marginBottom: 16 }}>
          Real-time multiplayer quiz battles ⚡
        </p>

        {/* Dynamic Quote Section */}
        <div style={{
          height: "30px", // Fixed height to prevent layout shift
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <p
            key={quoteIdx} // Key changes force re-animation
            className="animate-slide-in"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.95rem",
              fontStyle: "italic",
              margin: 0,
            }}
          >
            {TECH_QUOTES[quoteIdx]}
          </p>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 24,
        width: "100%",
        maxWidth: 680,
      }}>
        {/* Host Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #7c3aed, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <PlayCircle size={22} color="white" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 700 }}>Host a Game</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>Control the quiz session</p>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", marginBottom: 24, lineHeight: 1.6 }}>
            Create a room, share the code or QR with players, and run the game at your own pace.
          </p>
          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={handleHostGame}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite", width: 18, height: 18, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
            ) : (
              <PlayCircle size={18} />
            )}
            {loading ? "Creating…" : "Host New Game"}
          </button>
        </div>

        {/* Join Card */}
        <div className="glass-card" style={{ padding: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "linear-gradient(135deg, #0891b2, #06b6d4)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Users size={22} color="white" />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 700 }}>Join a Game</h2>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.8rem" }}>Enter the room code</p>
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.9rem", marginBottom: 20, lineHeight: 1.6 }}>
            Have a room code? Enter it below and jump straight into the action!
          </p>
          <input
            className="input-field"
            placeholder="Room code (e.g. AB12CD)"
            value={joinCode}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
            maxLength={6}
            style={{ marginBottom: 12, textAlign: "center", fontSize: "1.4rem", letterSpacing: "0.15em", fontWeight: 700 }}
          />
          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", background: "linear-gradient(135deg, #0891b2, #06b6d4)", boxShadow: "0 4px 20px rgba(6,182,212,0.4)" }}
            onClick={handleJoinGame}
          >
            <Users size={18} />
            Join Game
          </button>
        </div>
      </div>

      {error && (
        <div className="animate-slide-in" style={{
          marginTop: 20,
          padding: "12px 20px",
          borderRadius: 12,
          background: "rgba(239,68,68,0.15)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: "#fca5a5",
          fontSize: "0.9rem",
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Features row */}
      <div style={{
        display: "flex",
        gap: 32,
        marginTop: 56,
        flexWrap: "wrap",
        justifyContent: "center",
        opacity: 0.5,
      }}>
        {[
          { icon: "⚡", text: "Speed scoring" },
          { icon: "🏆", text: "Live leaderboard" },
          { icon: "📱", text: "QR code join" },
          { icon: "👥", text: "Up to 50 players" },
        ].map((f) => (
          <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem" }}>
            <span style={{ fontSize: "1.1rem" }}>{f.icon}</span>
            {f.text}
          </div>
        ))}
      </div>
    </div>
  );
}

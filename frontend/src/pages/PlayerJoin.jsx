import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, ArrowRight, Zap } from "lucide-react";
import socket from "../socket";

export default function PlayerJoin() {
  const { roomCode: paramCode } = useParams();
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(paramCode || "");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.connect();

    socket.on("player_joined", (data) => {
      setLoading(false);
      navigate(`/play/${data.roomCode}`, { state: { name: data.name } });
    });

    socket.on("join_error", (data) => {
      setLoading(false);
      setError(data.message);
    });

    return () => {
      socket.off("player_joined");
      socket.off("join_error");
    };
  }, [navigate]);

  const handleJoin = () => {
    const code = roomCode.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!code || code.length < 4) {
      setError("Please enter a valid room code.");
      return;
    }
    if (!trimmedName || trimmedName.length < 2) {
      setError("Enter a name with at least 2 characters.");
      return;
    }
    if (trimmedName.length > 20) {
      setError("Name must be 20 characters or less.");
      return;
    }

    setLoading(true);
    setError("");
    socket.emit("player_join", { roomCode: code, name: trimmedName });
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    }}>
      <div className="glass-card animate-bounce-in" style={{ width: "100%", maxWidth: 420, padding: 40 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 60, height: 60, borderRadius: 18,
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            marginBottom: 16,
            boxShadow: "0 0 30px rgba(124,58,237,0.3)",
          }}>
            <Zap size={30} color="white" fill="white" />
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.8rem", fontWeight: 800, marginBottom: 4,
          }}>Join YashQuizX</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
            Enter the room code and your name
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Room Code
            </label>
            <input
              className="input-field"
              placeholder="ABCDEF"
              value={roomCode}
              onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(""); }}
              maxLength={6}
              style={{ textAlign: "center", fontSize: "1.6rem", letterSpacing: "0.2em", fontWeight: 800, textTransform: "uppercase" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Your Name
            </label>
            <div style={{ position: "relative" }}>
              <User size={18} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
              <input
                className="input-field"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                maxLength={20}
                style={{ paddingLeft: 44 }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              fontSize: "0.85rem",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite", width: 18, height: 18, border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%" }} />
            ) : (
              <ArrowRight size={18} />
            )}
            {loading ? "Joining…" : "Join Game"}
          </button>
        </div>
      </div>
    </div>
  );
}

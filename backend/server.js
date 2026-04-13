const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const questions = require("./questions");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory room state
const rooms = {};

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function calculatePoints(timeTaken, maxTime = 20) {
  // timeTaken in seconds
  const maxPoints = 1000;
  const minPoints = 50;
  const ratio = 1 - timeTaken / maxTime;
  return Math.max(minPoints, Math.round(maxPoints * ratio));
}

function getLeaderboard(room) {
  return Object.values(room.players)
    .sort((a, b) => b.score - a.score)
    .map((p, idx) => ({
      rank: idx + 1,
      name: p.name,
      score: p.score,
      id: p.id,
    }));
}

function startQuestionTimer(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  room.questionStartTime = Date.now();
  room.phase = "question";
  room.answers = {};

  const q = questions[room.currentQuestion];
  const questionData = {
    index: room.currentQuestion,
    total: questions.length,
    question: q.question,
    options: q.options,
    timeLimit: 20,
  };

  io.to(roomCode).emit("question_start", questionData);

  // Clear any old timer
  if (room.timer) clearTimeout(room.timer);

  room.timer = setTimeout(() => {
    endQuestion(roomCode);
  }, 20000);
}

function endQuestion(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }

  room.phase = "answer";
  const q = questions[room.currentQuestion];

  // Award points to players who haven't answered
  // (they get 0 - already default)

  const answerStats = {
    correct: q.correct,
    correctAnswer: q.options[q.correct],
    answers: room.answers,
    leaderboard: getLeaderboard(room),
  };

  io.to(roomCode).emit("question_end", answerStats);
}

// REST: Create room
app.post("/api/create-room", (req, res) => {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms[code]);

  rooms[code] = {
    code,
    hostId: null,
    players: {},
    phase: "lobby", // lobby | question | answer | leaderboard | finished
    currentQuestion: 0,
    answers: {},
    questionStartTime: null,
    timer: null,
  };

  res.json({ roomCode: code });
});

// REST: Get room info
app.get("/api/room/:code", (req, res) => {
  const room = rooms[req.params.code.toUpperCase()];
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json({
    code: room.code,
    phase: room.phase,
    playerCount: Object.keys(room.players).length,
    currentQuestion: room.currentQuestion,
    totalQuestions: questions.length,
  });
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Host joins room
  socket.on("host_join", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }
    room.hostId = socket.id;
    socket.join(roomCode);
    socket.emit("host_joined", {
      roomCode,
      players: Object.values(room.players),
      phase: room.phase,
    });
  });

  // Player joins room
  socket.on("player_join", ({ roomCode, name }) => {
    const code = roomCode.toUpperCase();
    const room = rooms[code];
    if (!room) {
      socket.emit("join_error", { message: "Room not found. Check the code." });
      return;
    }
    if (room.phase !== "lobby") {
      socket.emit("join_error", { message: "Game already in progress." });
      return;
    }
    // Check for duplicate names
    const existingNames = Object.values(room.players).map((p) => p.name.toLowerCase());
    if (existingNames.includes(name.toLowerCase())) {
      socket.emit("join_error", { message: "That name is already taken. Choose another." });
      return;
    }

    room.players[socket.id] = {
      id: socket.id,
      name,
      score: 0,
      streak: 0,
    };

    socket.join(code);
    socket.emit("player_joined", {
      name,
      roomCode: code,
      score: 0,
    });

    // Notify host
    io.to(room.hostId).emit("player_list_update", {
      players: Object.values(room.players),
    });
  });

  // Host starts game
  socket.on("start_game", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;
    if (Object.keys(room.players).length < 1) {
      socket.emit("error", { message: "At least 1 player needed" });
      return;
    }
    room.currentQuestion = 0;
    startQuestionTimer(roomCode);
  });

  // Player submits answer
  socket.on("submit_answer", ({ roomCode, answer }) => {
    const code = roomCode.toUpperCase();
    const room = rooms[code];
    if (!room || room.phase !== "question") return;
    if (room.answers[socket.id]) return; // Already answered

    const timeTaken = (Date.now() - room.questionStartTime) / 1000;
    const q = questions[room.currentQuestion];
    const isCorrect = answer === q.correct;
    const points = isCorrect ? calculatePoints(timeTaken) : 0;

    room.answers[socket.id] = { answer, isCorrect, points, timeTaken };

    if (room.players[socket.id]) {
      room.players[socket.id].score += points;
      if (isCorrect) {
        room.players[socket.id].streak = (room.players[socket.id].streak || 0) + 1;
      } else {
        room.players[socket.id].streak = 0;
      }
    }

    // Send immediate feedback to player
    socket.emit("answer_feedback", {
      isCorrect,
      points,
      totalScore: room.players[socket.id]?.score || 0,
      timeTaken: Math.round(timeTaken * 10) / 10,
    });

    // Inform host of answer count
    const answeredCount = Object.keys(room.answers).length;
    const totalPlayers = Object.keys(room.players).length;
    io.to(room.hostId).emit("answer_count_update", {
      answered: answeredCount,
      total: totalPlayers,
    });

    // Auto-end if everyone answered
    if (answeredCount >= totalPlayers) {
      endQuestion(code);
    }
  });

  // Host moves to next question or leaderboard
  socket.on("next_question", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;

    room.currentQuestion++;

    if (room.currentQuestion >= questions.length) {
      // Game over
      room.phase = "finished";
      io.to(roomCode).emit("game_over", {
        leaderboard: getLeaderboard(room),
      });
    } else {
      startQuestionTimer(roomCode);
    }
  });

  // Host shows leaderboard manually
  socket.on("show_leaderboard", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;
    room.phase = "leaderboard";
    io.to(roomCode).emit("show_leaderboard", {
      leaderboard: getLeaderboard(room),
      currentQuestion: room.currentQuestion,
      totalQuestions: questions.length,
    });
  });

  // Host restarts game
  socket.on("restart_game", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;
    // Reset all scores
    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.streak = 0;
    });
    room.currentQuestion = 0;
    room.phase = "lobby";
    room.answers = {};
    io.to(roomCode).emit("game_restarted", {
      players: Object.values(room.players),
    });
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Remove from all rooms
    for (const [code, room] of Object.entries(rooms)) {
      if (room.players[socket.id]) {
        const name = room.players[socket.id].name;
        delete room.players[socket.id];
        io.to(room.hostId).emit("player_list_update", {
          players: Object.values(room.players),
        });
        io.to(room.hostId).emit("player_left", { name });
      }
      if (room.hostId === socket.id) {
        // Notify all players host left
        io.to(code).emit("host_disconnected");
        if (room.timer) clearTimeout(room.timer);
        delete rooms[code];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Quiz server running on http://localhost:${PORT}`);
});

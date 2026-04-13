# YashQuizX 🎮⚡

A real-time multiplayer Kahoot-style quiz app built with React + Vite + Socket.IO.

## Folder Structure
```
quize/
├── backend/         # Node.js + Express + Socket.IO server
│   ├── server.js
│   ├── questions.js
│   └── package.json
└── frontend/        # React + Vite frontend
    ├── src/
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── HostView.jsx
    │   │   ├── PlayerJoin.jsx
    │   │   └── PlayerView.jsx
    │   ├── socket.js
    │   ├── App.jsx
    │   └── index.css
    └── package.json
```

## Setup & Run

### Terminal 1 — Backend
```bash
cd backend
npm install
npm start
# Server runs on http://localhost:3001
```

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## How to Play
1. Open `http://localhost:5173` in a browser → **Host New Game**
2. Share the **6-letter room code** or **QR code** with players
3. Players open the URL on their device → **Join Game** → enter code + name
4. Host presses **Start Game**
5. 20 questions, 20 seconds each. Faster answers = more points (max 1000)
6. Leaderboard shown after each question

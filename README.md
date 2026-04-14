<div align="center">
  <h1>🎮 YashQuizX</h1>
  <p><strong>A highly concurrent, real-time multiplayer quiz engine built with WebSockets.</strong></p>

  <!-- Badges -->
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
</div>

<br />

## 📖 Table of Contents
- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [How to Play](#-how-to-play)
- [Project Structure](#-project-structure)

## 🌟 Overview
YashQuizX is a Kahoot-style real-time multiplayer quiz application focusing on C++ Standard Template Library (STL) and Compiler Design concepts. Engineered for low-latency synchronization between hosts and multiple clients, the platform provides an interactive, visually engaging, and competitive learning experience.

## 🏗 Architecture
The application follows a decoupled client-server architecture:
- **Client (Frontend):** A Single Page Application (SPA) built with React and bundled via Vite, providing a seamless and highly responsive user interface without page reloads.
- **Server (Backend):** An Express.js REST API layer paired with a Socket.IO WebSocket server, ensuring bidirectional, event-driven communication for live game state management.

## ✨ Features
- **Real-Time Synchronization:** Sub-millisecond latency for game state propagation using Socket.IO.
- **Interactive Host Dashboard:** A centralized screen to manage game states, view active players, and progress through questions.
- **Dynamic Leaderboards:** Real-time score calculations considering answer accuracy and response speed.
- **QR Code Joining:** Frictionless player onboarding via auto-generated QR codes and 6-letter room pins.
- **Responsive Design:** Optimized for all screen sizes, perfect for mobile players.

## 💻 Tech Stack

### Frontend
* **Core:** React 19, JavaScript (ES6+)
* **Build Tool:** Vite
* **Routing:** React Router v7
* **WebSockets:** Socket.IO-Client
* **Styling:** Vanilla CSS3 with modern UI/UX principles (Glassmorphism, animations)
* **Icons & Components:** Lucide-React, qrcode.react

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **WebSockets:** Socket.IO
* **CORS:** Configured for strict origin validation in production

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18.x or higher)
- npm or yarn

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yashwant938/quizzesbyiron.git
   cd quizzesbyiron
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   > The server will start on `http://localhost:3001` (hot-reloading enabled via nodemon).

3. **Setup the Frontend**
   Open a new terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   > The application will be accessible at `http://localhost:5173`.

## ☁️ Deployment

This project is tailored for instant deployment on modern cloud providers.

- **Frontend (Vercel):** The React frontend is optimized and CI/CD pipelines are fully supported via Vercel. Connect your repository and select the `frontend` root directory.
- **Backend (Render / Railway):** The Node server exposes standard web ports and can be spun up as a web service. Ensure that the Environment Variables (`PORT`, `FRONTEND_URL`) are correctly mapped for production.

---

## 🎮 How to Play

1. **Host a Match:** The host navigates to the landing page and selects **"Host New Game"**.
2. **Invite Players:** The host shares their screen displaying the unique **6-letter room code** or **QR code**.
3. **Join Match:** Players scan the QR code or enter the code manually after selecting **"Join Game"**.
4. **Compete:** Once the host clicks Start, players have 20 seconds per question. Faster answers earn higher points (up to 1,000 points per question).
5. **Win:** A live podium and leaderboard is presented after each round!

---

## 📂 Project Structure

```text
quize/
├── backend/                  # Application core logic and socket handlers
│   ├── questions.js          # Encapsulated question data (C++ STL etc.)
│   ├── server.js             # Entry point & socket event bindings
│   └── package.json          
└── frontend/                 # UI components and client logic
    ├── public/               # Static assets
    ├── src/                  
    │   ├── pages/            # View layer (LandingPage, HostView, PlayerView)
    │   ├── App.jsx           # App wrapper & unified routing
    │   ├── index.css         # Global design tokens
    │   └── socket.js         # Singleton socket client instance
    ├── vercel.json           # Cloud deployment config
    ├── vite.config.js        # Build pipeline configuration
    └── package.json          
```

<br />
<div align="center">
  <p>Engineered with ❤️ for interactive learning.</p>
</div>

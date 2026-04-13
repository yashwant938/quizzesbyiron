import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HostView from "./pages/HostView";
import PlayerJoin from "./pages/PlayerJoin";
import PlayerView from "./pages/PlayerView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/host/:roomCode" element={<HostView />} />
        <Route path="/join" element={<PlayerJoin />} />
        <Route path="/join/:roomCode" element={<PlayerJoin />} />
        <Route path="/play/:roomCode" element={<PlayerView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

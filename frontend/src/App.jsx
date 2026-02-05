import { useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useUser } from "./contexts/UserContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import SessionPage from "./pages/SessionPage";
import LoginPage from "./pages/LoginPage";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const { isSignedIn } = useUser();
  // const { isSignedIn } = useState(false);


  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!isSignedIn ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/session/:id" element={isSignedIn ? <SessionPage /> : <Navigate to="/login" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

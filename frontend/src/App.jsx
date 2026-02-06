import { useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { useUser } from "./contexts/UserContext";
import HomePage from "./pages/HomePage";
import ErrorBoundary from "./components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy load heavy pages
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const SessionPage = lazy(() => import("./pages/SessionPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

// Loading fallback
const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-[#202124]">
    <Loader2 className="w-10 h-10 text-white animate-spin" />
  </div>
);

function App() {
  const { isSignedIn } = useUser();

  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to="/dashboard" />} />
          <Route path="/login" element={!isSignedIn ? <LoginPage /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> : <Navigate to="/login" />} />
          <Route path="/session/:id" element={isSignedIn ? <SessionPage /> : <Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;

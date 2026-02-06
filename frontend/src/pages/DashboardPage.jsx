import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveSessions, useCreateSession, useMyRecentSessions } from "../hooks/useSessions";
import { useSocket } from "../hooks/useSocket";
import { useUser } from "../contexts/UserContext";

import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import CreateSessionModal from "../components/CreateSessionModal";

function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ sessionName: "" });

  // Get socket connection for real-time updates
  const { socket, isConnected } = useSocket(user?.id, user?.fullName || user?.name);

  const createSessionMutation = useCreateSession();

  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();

  // Subscribe to dashboard updates for real-time session visibility
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Subscribe to dashboard updates
    socket.emit("dashboard:subscribe");

    // Listen for new session created
    const handleSessionCreated = (data) => {
      console.log("New session created:", data.session?.sessionName);
      // Invalidate the queries to refetch the latest sessions
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
      queryClient.invalidateQueries({ queryKey: ["myRecentSessions"] });
    };

    // Listen for session updated
    const handleSessionUpdated = (data) => {
      console.log("Session updated:", data.session?._id);
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
      queryClient.invalidateQueries({ queryKey: ["myRecentSessions"] });
    };

    // Listen for session ended
    const handleSessionEnded = (data) => {
      console.log("Session ended:", data.sessionId);
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
      queryClient.invalidateQueries({ queryKey: ["myRecentSessions"] });
    };

    socket.on("session:created", handleSessionCreated);
    socket.on("session:updated", handleSessionUpdated);
    socket.on("session:ended", handleSessionEnded);

    return () => {
      socket.emit("dashboard:unsubscribe");
      socket.off("session:created", handleSessionCreated);
      socket.off("session:updated", handleSessionUpdated);
      socket.off("session:ended", handleSessionEnded);
    };
  }, [socket, isConnected, queryClient]);

  const handleCreateRoom = () => {
    if (!roomConfig.sessionName) return;

    createSessionMutation.mutate(
      {
        sessionName: roomConfig.sessionName,
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          navigate(`/session/${data.session._id}`);
        },
      }
    );
  };

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-100 to-primary/10">
        <Navbar />
        <WelcomeSection onCreateSession={() => setShowCreateModal(true)} />

        {/* Grid layout */}
        <div className="container mx-auto px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatsCards
              activeSessionsCount={activeSessions.length}
              recentSessionsCount={recentSessions.length}
            />
            <ActiveSessions
              sessions={activeSessions}
              isLoading={loadingActiveSessions}
            />
          </div>

          <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
        </div>
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
      />
    </>
  );
}

export default DashboardPage;

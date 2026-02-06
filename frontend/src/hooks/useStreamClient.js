import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, user) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);

  useEffect(() => {
    let videoCall = null;

    const initCall = async () => {
      if (!session?.callId || !user) return;
      if (session.status === "completed") return;

      try {
        const { token, userId, userName, userImage } = await sessionApi.getStreamToken(
          user.id,
          user.fullName || user.name
        );

        const client = await initializeStreamClient(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );

        setStreamClient(client);

        videoCall = client.call("default", session.callId);

        await videoCall.join({ create: true });
        setCall(videoCall);

        // Apply device preferences AFTER joining to ensure tracks are published
        const savedMicState = localStorage.getItem('micEnabled');
        const savedCamState = localStorage.getItem('camEnabled');

        if (savedMicState === 'false') {
          console.log("Initializing call with Mic OFF (Post-Join)");
          await videoCall.microphone.disable();
        }

        if (savedCamState === 'false') {
          console.log("Initializing call with Cam OFF (Post-Join)");
          await videoCall.camera.disable();
        }
      } catch (error) {
        toast.error(`Video call error: ${error.response?.data?.error || error.message}`);
        console.error("Error init call", error);
      } finally {
        setIsInitializingCall(false);
      }
    };

    if (session && !loadingSession) initCall();

    // cleanup - performance reasons
    return () => {
      (async () => {
        try {
          if (videoCall) {
            await videoCall.leave().catch(err => console.warn("Video call leave error:", err));
          }
          await disconnectStreamClient();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  }, [session, loadingSession, user]);

  return {
    streamClient,
    call,
    isInitializingCall,
  };
}

export default useStreamClient;

import { useUser } from "../contexts/UserContext";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useEndSession, useSessionById } from "../hooks/useSessions";
import { useSocket } from "../hooks/useSocket";
import { useLanguage } from "../hooks/useLanguage";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import useStreamClient from "../hooks/useStreamClient";
import Navbar from "../components/Navbar";
import MeetingNotesPanel from "../components/meeting/MeetingNotesPanel";
import CaptionOverlay from "../components/meeting/CaptionOverlay";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// Stream.io Video SDK
import {
  StreamVideo,
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  CallControls,
  CallingState,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

import {
  Loader2Icon,
  LogOutIcon,
  VideoIcon,
  MicIcon,
  MicOffIcon,
  VideoOffIcon,
  GlobeIcon,
  UsersIcon,
  SettingsIcon,
  MessageSquareIcon,
  HandIcon,
  MonitorUp,
  PhoneOff,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import ChatPanel from "../components/meeting/ChatPanel";
import toast from "react-hot-toast";

function SessionPage() {
  const navigate = useNavigate();
  const { id: sessionId } = useParams();
  const { t } = useTranslation();
  const { user } = useUser();
  const { language, changeLanguage, availableLanguages } = useLanguage();

  // Session data
  const { data: sessionData, isLoading: loadingSession } = useSessionById(sessionId);
  const endSessionMutation = useEndSession();
  const session = sessionData?.session;

  // Stream.io Video Client (Chat is handled by Socket.IO now)
  const { streamClient, call, isInitializingCall } = useStreamClient(
    session,
    loadingSession,
    user
  );

  // Ensure we have a user identity (handling Guests)
  const guestUserRef = useRef({
    id: `guest-${Math.random().toString(36).substr(2, 9)}`,
    name: "Guest"
  });
  const effectiveUser = user || guestUserRef.current;

  // Socket connection (Use corrected user properties)
  const {
    socket,
    isConnected,
    joinMeeting,
    sendCaption,
    endMeeting,
    raiseHand,
    updateLanguage
  } = useSocket(effectiveUser?.id, effectiveUser?.fullName || effectiveUser?.name);

  // Speech recognition for live captions
  const { startListening, stopListening, isListening, captions, transcript, resetTranscript, interimTranscript } = useSpeechRecognition(socket, sessionId, effectiveUser?.fullName || effectiveUser?.name || "Participant", language, effectiveUser?.id);

  const [showCaptions, setShowCaptions] = useState(true);
  const [participants, setParticipants] = useState([]);
  const lastTranscriptRef = useRef("");
  const lastInterimRef = useRef("");
  const interimThrottleRef = useRef(null);

  // Join meeting when connected
  useEffect(() => {
    if (socket && isConnected && sessionId) {
      console.log("Joing meeting:", sessionId, "as", effectiveUser?.id);
      joinMeeting(sessionId, language);
    } else {
      console.log("Waiting to join meeting...", { socket: !!socket, isConnected, sessionId });
    }
  }, [socket, isConnected, sessionId, effectiveUser, joinMeeting]);

  // Update backend when language changes (for real-time translation)
  const prevLanguageRef = useRef(language);
  useEffect(() => {
    if (socket && isConnected && sessionId && language !== prevLanguageRef.current) {
      updateLanguage(sessionId, language);
      prevLanguageRef.current = language;
      console.log(`Language updated to: ${language}`);
    }
  }, [socket, isConnected, sessionId, language, updateLanguage]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = (data) => {
      setParticipants((prev) => {
        if (!prev.find(p => p.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    };

    const handleMeetingEnded = () => {
      navigate("/dashboard");
    };



    const handleHandRaised = (data) => {
      toast(`${data.userName} raised their hand! ✋`, {
        icon: '✋',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    };

    socket.on("participant:joined", handleParticipantJoined);
    socket.on("meeting:ended", handleMeetingEnded);
    socket.on("hand:raised", handleHandRaised);

    return () => {
      socket.off("participant:joined", handleParticipantJoined);
      socket.off("meeting:ended", handleMeetingEnded);
      socket.off("hand:raised", handleHandRaised);
    };
  }, [socket, navigate]);

  // (Stream Chat is no longer used - chat is handled by Socket.IO)

  const [activeTab, setActiveTab] = useState('notes');

  // Captions are now handled entirely by the useSpeechRecognition hook
  // No need for duplicate transcript emission logic here

  // Redirect when session ends
  useEffect(() => {
    if (!session || loadingSession) return;
    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);


  const handleEndSession = () => {
    // Confirm logic handled by button component
    console.log("Ending meeting...");
    try {
      // End meeting via socket (triggers email sending)
      endMeeting(sessionId);
      console.log("Socket event emitted");

      endSessionMutation.mutate(sessionId, {
        onSuccess: () => {
          console.log("Mutation success, navigating...");
          navigate("/dashboard");
        },
        onError: (err) => {
          console.error("Mutation failed:", err);
        }
      });
    } catch (e) {
      console.error("Critical error in handleEndSession:", e);
    }
  };

  // Loading state
  if (loadingSession || isInitializingCall) {
    return (
      <div className="h-screen bg-base-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-lg">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Session not found
  if (!session) {
    return (
      <div className="h-screen bg-base-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg">{t("common.error")}: Session not found</p>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-primary mt-4"
            >
              {t("nav.dashboard")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-900 flex flex-col overflow-hidden">
      {/* Navbar hidden during call for extra space */}

      {/* Main Content with Resizable Panels */}
      <div className="flex-1 overflow-hidden relative">
        <PanelGroup autoSaveId="session-layout" direction="horizontal">
          {/* Left Panel - Tabs for Notes / Chat */}
          <Panel defaultSize={30} minSize={20} className="m-2 bg-base-100/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-none">
            <div className="flex border-b border-white/10">
              <button
                className={`flex-1 p-3 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'notes' ? 'bg-white/10 text-primary border-b-2 border-primary backdrop-blur-md' : 'text-base-content/60 hover:bg-white/5'}`}
                onClick={() => setActiveTab('notes')}
              >
                <MessageSquareIcon className="w-4 h-4" />
                {t("meeting.notes", "Notes")}
              </button>
              <button
                className={`flex-1 p-3 text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'chat' ? 'bg-white/10 text-primary border-b-2 border-primary backdrop-blur-md' : 'text-base-content/60 hover:bg-white/5'}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquareIcon className="w-4 h-4" />
                Chat
                {/* Badge if unread? (Future) */}
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {activeTab === 'notes' ? (
                <MeetingNotesPanel
                  meetingId={sessionId}
                  userId={user?.id}
                  userLanguage={language}
                  socket={socket}
                />
              ) : (
                <ChatPanel
                  meetingId={sessionId}
                  userId={user?.id}
                  userName={user?.fullName || user?.name}
                  userLanguage={language}
                  socket={socket}
                />
              )}
            </div>
          </Panel>

          <PanelResizeHandle className="resize-handle group">
            <div className="w-1 h-8 rounded-full bg-base-content/20 group-hover:bg-primary transition-colors duration-300" />
          </PanelResizeHandle>

          {/* Right Panel - Video & Controls */}
          <Panel minSize={30} className="m-2 bg-base-100/60 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col shadow-none">
            {/* Session Header */}
            <div className="px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-md rounded-t-2xl relative z-50">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-base-content">
                    {session.sessionName}
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-xs text-base-content/60">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success shadow-[0_0_10px_theme(colors.success)]' : 'bg-error shadow-[0_0_10px_theme(colors.error)]'}`} />
                      {isConnected ? "Connected" : "Connecting..."}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-base-content/60">
                      <GlobeIcon className="w-3 h-3" />
                      {language}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Raise Hand Button */}
                  <button
                    onClick={() => raiseHand(sessionId)}
                    className="btn btn-ghost btn-sm btn-circle-corner gap-2 tooltip tooltip-bottom hover:bg-white/10"
                    data-tip="Raise Hand"
                  >
                    <HandIcon className="w-4 h-4 text-warning" />
                    <span className="hidden xl:inline text-xs">Raise Hand</span>
                  </button>

                  {/* Language Switcher */}
                  <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle-corner gap-2 hover:bg-white/10">
                      <GlobeIcon className="w-4 h-4" />
                      {language}
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[9999] menu p-2 shadow-xl bg-base-200/90 backdrop-blur-xl rounded-box w-52 border border-white/10">
                      {availableLanguages.map((lang) => (
                        <li key={lang.code}>
                          <button
                            onClick={() => changeLanguage(lang.code)}
                            className={language === lang.code ? "active" : ""}
                          >
                            {lang.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Share Link */}
                  <button
                    className="btn btn-ghost btn-sm btn-circle-corner gap-2 hover:bg-white/10"
                    onClick={async () => {
                      try {
                        const baseUrl = import.meta.env.VITE_CLIENT_URL || window.location.origin;
                        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                        const shareUrl = `${cleanBaseUrl}/session/${sessionId}`;

                        await navigator.clipboard.writeText(shareUrl);
                        toast.success("Public meeting link copied!", { icon: '🔗', style: { borderRadius: '10px', background: '#333', color: '#fff' } });
                      } catch (err) {
                        console.error('Failed to copy link:', err);
                        toast.error("Failed to copy link.");
                      }
                    }}
                    title="Copy Meeting Link"
                  >
                    <UsersIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </button>

                  {/* End Session */}
                  {session.status === "active" && (
                    <EndMeetingButton
                      onConfirm={handleEndSession}
                      isPending={endSessionMutation.isPending}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Video Area */}
            <div className="flex-1 relative overflow-hidden flex flex-col rounded-b-2xl">
              {streamClient && call ? (
                <StreamVideo client={streamClient}>
                  <StreamTheme className="h-full w-full custom-stream-theme">
                    <StreamCall call={call}>
                      <ActiveMeetingView
                        sessionId={sessionId}
                        handleEndSession={handleEndSession}
                        endSessionMutation={endSessionMutation}
                        showCaptions={showCaptions}
                        setShowCaptions={setShowCaptions}
                        captions={captions}
                        language={language}
                        isListening={isListening}
                        startListening={startListening}
                        stopListening={stopListening}
                      />
                    </StreamCall>
                  </StreamTheme>
                </StreamVideo>
              ) : (
                <div className="h-full flex items-center justify-center bg-base-300/30 backdrop-blur-sm">
                  <div className="text-center">
                    <Loader2Icon className="w-8 h-8 mx-auto animate-spin text-primary mb-2" />
                    <p>Connecting to video call...</p>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div >
  );
}

function ActiveMeetingView({
  sessionId,
  handleEndSession,
  endSessionMutation,
  showCaptions,
  setShowCaptions,
  captions,
  language,
  isListening,
  startListening,
  stopListening
}) {
  const { useCameraState, useMicrophoneState, useParticipantCount } = useCallStateHooks();
  const { camera, isMute: isCamMuted } = useCameraState();
  const { microphone, isMute: isMicMuted } = useMicrophoneState();
  const participantCount = useParticipantCount();
  const call = useCall();

  const [isDeafened, setIsDeafened] = useState(false);

  const isCamOn = !isCamMuted;
  const isMicOn = !isMicMuted;

  // Handle local audio output mute (Deafen) - Polling approach for performance
  useEffect(() => {
    const handleMute = () => {
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach(audio => {
        if (audio.muted !== isDeafened) {
          audio.muted = isDeafened;
        }
      });
    };

    // Initial check
    handleMute();

    // Poll every 2 seconds to catch new streams (lightweight)
    const interval = setInterval(handleMute, 2000);

    return () => clearInterval(interval);
  }, [isDeafened]);

  // Sync Speech Recognition with Mic State
  useEffect(() => {
    if (isMicOn) {
      startListening();
    } else {
      stopListening();
    }
  }, [isMicOn, startListening, stopListening]);

  // Restore device preferences on mount
  const preferencesRestored = useRef(false);
  useEffect(() => {
    if (preferencesRestored.current) return;

    if (microphone && camera) {
      console.log("Devices available, checking preferences...");
      const savedMicState = localStorage.getItem('micEnabled');
      const savedCamState = localStorage.getItem('camEnabled');
      console.log(`Preferences - Mic: ${savedMicState}, Cam: ${savedCamState}`);

      if (savedMicState === 'false' && !microphone.isMute) {
        console.log("Restoring Mic: OFF");
        microphone.disable();
        stopListening(); // Ensure speech recog stops
      }

      if (savedCamState === 'false' && !camera.isMute) {
        console.log("Restoring Cam: OFF");
        camera.disable();
      }

      preferencesRestored.current = true;
    } else {
      console.log("Devices not yet available for restore:", { microphone: !!microphone, camera: !!camera });
    }
  }, [microphone, camera, stopListening]);

  const toggleCamera = async () => {
    try {
      await camera?.toggle();
      // Save new state (inverse of current mute state because we just toggled)
      localStorage.setItem('camEnabled', isCamMuted ? 'true' : 'false');
    } catch (err) {
      console.error("Error toggling camera:", err);
    }
  };

  const toggleMic = async () => {
    try {
      await microphone?.toggle();
      if (microphone?.isMute) {
        stopListening();
        localStorage.setItem('micEnabled', 'false');
      } else {
        startListening();
        localStorage.setItem('micEnabled', 'true');
      }
    } catch (err) {
      console.error("Error toggling microphone:", err);
    }
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
  };

  return (
    <div className="h-full flex flex-col bg-[#202124] relative">
      {/* Video Grid Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4">
        <div
          className="w-full h-full"
          style={{
            '--str-video__primary-color': 'transparent',
            '--str-video__ring-color': 'transparent',
            // Restore speaker border but make it subtle/inset if handled by CSS, 
            // for now keep global variables neutral and use specific class overrides in index.css
            '--str-video__speaker-border-color': 'transparent'
          }}
        >
          <SpeakerLayout />
        </div>

        {/* Live Captions Overlay */}
        {showCaptions && (
          <div className="absolute bottom-4 left-4 right-4 z-[100] pointer-events-none">
            <CaptionOverlay
              captions={captions}
              userLanguage={language}
              isSpeaking={isListening}
            />
          </div>
        )}
      </div>

      {/* Google Meet Style Bottom Bar */}
      <div className="h-20 bg-[#202124] flex items-center justify-between px-6 shrink-0 z-20">
        <div className="hidden md:flex items-center text-white/90 text-sm font-medium">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="w-px h-4 bg-white/20 mx-4" />
          <span>{sessionId}</span>
          <div className="w-px h-4 bg-white/20 mx-4" />
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-white/70" />
            <span>{participantCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Deafen Button */}
          <button
            onClick={toggleDeafen}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${isDeafened ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' : 'bg-[#3c4043] hover:bg-[#474a4d] text-white border border-gray-600'}`}
            title={isDeafened ? "Unmute incoming audio" : "Mute incoming audio (Deafen)"}
          >
            {isDeafened ? <VolumeXIcon className="w-5 h-5" /> : <Volume2Icon className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${!isMicOn ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' : 'bg-[#3c4043] hover:bg-[#474a4d] text-white border border-gray-600'}`}
            title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
          >
            {!isMicOn ? <MicOffIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${!isCamOn ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' : 'bg-[#3c4043] hover:bg-[#474a4d] text-white border border-gray-600'}`}
            title={isCamOn ? "Turn off camera" : "Turn on camera"}
          >
            {!isCamOn ? <VideoOffIcon className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowCaptions(!showCaptions)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${showCaptions ? 'bg-blue-300 text-gray-900' : 'bg-[#3c4043] hover:bg-[#474a4d] text-white border border-gray-600'}`}
            title="Toggle captions"
          >
            <MessageSquareIcon className="w-5 h-5" />
          </button>

          <button
            className="w-12 h-12 rounded-full flex items-center justify-center bg-[#3c4043] hover:bg-[#474a4d] text-white border border-gray-600 transition-all duration-200"
            title="Present screen (Not fully implemented)"
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          <div className="ml-2">
            <EndMeetingButton
              onConfirm={handleEndSession}
              isPending={endSessionMutation.isPending}
              customStyle="w-16 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white"
              iconOnly={true}
            />
          </div>
        </div>

        <div className="hidden md:flex items-center justify-end w-[120px]">
          <button className="p-3 hover:bg-[#3c4043] rounded-full text-white/90">
            <UsersIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function EndMeetingButton({ onConfirm, isPending, customStyle }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  if (customStyle) {
    if (confirming) {
      return (
        <button
          onClick={onConfirm}
          disabled={isPending}
          className={customStyle}
          title="Confirm End Call"
        >
          {isPending ? <Loader2Icon className="w-5 h-5 animate-spin" /> : <LogOutIcon className="w-5 h-5" />}
        </button>
      );
    }
    return (
      <button
        onClick={() => setConfirming(true)}
        disabled={isPending}
        className={customStyle}
        title="Leave Call"
      >
        <PhoneOff className="w-5 h-5" />
      </button>
    );
  }

  if (confirming) {
    return (
      <button
        onClick={onConfirm}
        disabled={isPending}
        className="btn btn-error btn-sm gap-2 animate-pulse font-bold"
      >
        {isPending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : <LogOutIcon className="w-4 h-4" />}
        {t("meeting.confirmEnd", "Click to Confirm")}
      </button>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      disabled={isPending}
      className="btn btn-error btn-sm gap-2"
    >
      <LogOutIcon className="w-4 h-4" />
      {t("meeting.endMeeting")}
    </button>
  );
}

export default SessionPage;

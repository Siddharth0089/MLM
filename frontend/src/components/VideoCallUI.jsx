import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamTheme,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { Loader2Icon, MessageSquareIcon, UsersIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Channel, Chat, MessageInput, MessageList, Thread, Window } from "stream-chat-react";
import CaptionOverlay from "./meeting/CaptionOverlay";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import "stream-chat-react/dist/css/v2/index.css";

function VideoCallUI({ chatClient, channel, captions = [], userLanguage = "en-US" }) {
  const navigate = useNavigate();
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (callingState === CallingState.JOINING) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-lg">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme className="h-full flex gap-3 relative str-video">
      <div className="flex-1 flex flex-col gap-3">
        {/* Participants count badge and Chat Toggle */}
        <div className="flex items-center justify-between gap-2 bg-base-100 p-3 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-primary" />
            <span className="font-semibold">
              {participantCount} {participantCount === 1 ? "participant" : "participants"}
            </span>
          </div>
          {chatClient && channel && (
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`btn btn-sm gap-2 ${isChatOpen ? "btn-primary" : "btn-ghost"}`}
              title={isChatOpen ? "Hide chat" : "Show chat"}
            >
              <MessageSquareIcon className="size-4" />
              <span className="hidden sm:inline">{isChatOpen ? "Hide chat" : "Show chat"}</span>
            </button>
          )}
        </div>

        {/* Video layout with caption overlay */}
        <div className="flex-1 bg-base-300 rounded-lg overflow-hidden relative">
          <SpeakerLayout />

          {/* Caption Overlay - positioned at bottom of video */}
          {captions.length > 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl z-10">
              <CaptionOverlay captions={captions} userLanguage={userLanguage} />
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="bg-base-100 p-3 rounded-lg">
          <CallControls onLeave={() => navigate("/dashboard")} />
        </div>
      </div>

      {/* Chat sidebar */}
      {chatClient && channel && isChatOpen && (
        <div className="w-96 bg-base-100 rounded-lg shadow-lg relative">
          <button
            onClick={() => setIsChatOpen(false)}
            className="absolute top-2 right-2 z-10 btn btn-ghost btn-sm btn-circle"
          >
            <XIcon className="size-4" />
          </button>

          <Chat client={chatClient} theme="str-chat__theme-light">
            <Channel channel={channel}>
              <Window>
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-auto">
                    <MessageList />
                  </div>
                  <MessageInput />
                </div>
              </Window>
              <Thread />
            </Channel>
          </Chat>
        </div>
      )}
    </StreamTheme>
  );
}

export default VideoCallUI;

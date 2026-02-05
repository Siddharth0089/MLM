import React from "react";
import {
  ArrowRightIcon,
  Code2Icon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
  LoaderIcon,
  PowerIcon,
} from "lucide-react";
import { Link } from "react-router";
import { useEndSession } from "../hooks/useSessions";
import { useQueryClient } from "@tanstack/react-query";

function ActiveSessions({ sessions, isLoading, isUserInSession }) {
  const endSessionMutation = useEndSession();
  const queryClient = useQueryClient();

  /* Removed handleDeactivate logic */

  return (
    <div className="lg:col-span-2 glass-panel rounded-2xl border-0 h-full">
      <div className="card-body">
        {/* HEADERS SECTION */}
        <div className="flex items-center justify-between mb-6">
          {/* TITLE AND ICON */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
              <ZapIcon className="size-5 text-white" />
            </div>
            <h2 className="text-2xl font-black">Live Sessions</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="size-2 bg-success rounded-full" />
            <span className="text-sm font-medium text-success">{sessions.length} active</span>
          </div>
        </div>

        {/* SESSIONS LIST */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderIcon className="size-10 animate-spin text-primary" />
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session._id}
                className="glass-panel-dark border-0 hover:bg-white/10 transition-colors rounded-xl"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
                  {/* LEFT SIDE */}
                  <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
                    <div className="relative size-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                      <Code2Icon className="size-7 text-white" />
                      <div className="absolute -top-1 -right-1 size-4 bg-success rounded-full border-2 border-base-100" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg truncate">{session.sessionName}</h3>
                        <span className="badge badge-sm badge-success">
                          Active
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm opacity-80">
                        <div className="flex items-center gap-1.5">
                          <UsersIcon className="size-4" />
                          <span className="text-xs">{session.participants?.length || 0} participant(s)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/session/${session._id}`} className="btn btn-primary btn-sm gap-2">
                      Join
                      <ArrowRightIcon className="size-4" />
                    </Link>

                    <DeleteSessionButton
                      sessionId={session._id}
                      onConfirm={() => {
                        endSessionMutation.mutate(session._id, {
                          onSuccess: () => {
                            queryClient.invalidateQueries(["activeSessions"]);
                            queryClient.invalidateQueries(["myRecentSessions"]);
                          }
                        });
                      }}
                      isPending={endSessionMutation.isPending}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center">
                <SparklesIcon className="w-10 h-10 text-primary/50" />
              </div>
              <p className="text-lg font-semibold opacity-70 mb-1">No active sessions</p>
              <p className="text-sm opacity-50">Be the first to create one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteSessionButton({ sessionId, onConfirm, isPending }) {
  const [confirming, setConfirming] = React.useState(false);

  // Reset confirmation state after 3 seconds if not clicked
  React.useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => setConfirming(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirming]);

  if (confirming) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onConfirm();
        }}
        disabled={isPending}
        className="btn btn-error btn-sm gap-1 animate-pulse"
        title="Click again to confirm"
      >
        {isPending ? <LoaderIcon className="size-4 animate-spin" /> : <PowerIcon className="size-4" />}
        <span className="text-xs">Confirm?</span>
      </button>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      disabled={isPending}
      className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10 tooltip tooltip-left"
      data-tip="Deactivate Session"
    >
      <PowerIcon className="size-4" />
    </button>
  );
}

export default ActiveSessions;

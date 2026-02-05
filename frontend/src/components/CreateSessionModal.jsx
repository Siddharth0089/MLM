import { Code2Icon, LoaderIcon, PlusIcon } from "lucide-react";

function CreateSessionModal({
  isOpen,
  onClose,
  roomConfig,
  setRoomConfig,
  onCreateRoom,
  isCreating,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-6">Create New Session</h3>

        <div className="space-y-8">
          {/* SESSION NAME INPUT */}
          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-semibold">Session Name</span>
              <span className="label-text-alt text-error">*</span>
            </label>

            <input
              type="text"
              placeholder="Enter session name (e.g., Team Standup, Code Review)"
              className="input input-bordered w-full"
              value={roomConfig.sessionName || ""}
              onChange={(e) => {
                setRoomConfig({
                  ...roomConfig,
                  sessionName: e.target.value,
                });
              }}
            />
          </div>

          {/* ROOM SUMMARY */}
          {roomConfig.sessionName && (
            <div className="alert alert-success">
              <Code2Icon className="size-5" />
              <div>
                <p className="font-semibold">Room Summary:</p>
                <p>
                  Session: <span className="font-medium">{roomConfig.sessionName}</span>
                </p>
                <p>
                  Max Participants: <span className="font-medium">2 (1-on-1 session)</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            className="btn btn-primary gap-2"
            onClick={onCreateRoom}
            disabled={isCreating || !roomConfig.sessionName}
          >
            {isCreating ? (
              <LoaderIcon className="size-5 animate-spin" />
            ) : (
              <PlusIcon className="size-5" />
            )}

            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
export default CreateSessionModal;

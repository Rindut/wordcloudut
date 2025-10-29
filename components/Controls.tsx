"use client";

import { useState } from "react";

interface ControlsProps {
  sessionId: string;
  status: "draft" | "live" | "closed";
  onStatusChange: (status: "draft" | "live" | "closed") => Promise<void>;
  participantCount?: number;
}

export default function Controls({
  sessionId,
  status,
  onStatusChange,
  participantCount = 0,
}: ControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: "draft" | "live" | "closed") => {
    setIsUpdating(true);
    try {
      await onStatusChange(newStatus);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const copyJoinLink = () => {
    const url = `${window.location.origin}/join/${sessionId}`;
    navigator.clipboard.writeText(url);
    alert("Join link copied to clipboard!");
  };

  return (
    <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
      <div className="flex flex-col gap-3">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Status:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              status === "live"
                ? "bg-green-100 text-green-800"
                : status === "draft"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status.toUpperCase()}
          </span>
        </div>

        {/* Participant Count */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">
            Participants:
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            {participantCount}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col gap-2">
          {status === "draft" && (
            <button
              onClick={() => handleStatusChange("live")}
              disabled={isUpdating}
              className="px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors text-sm"
            >
              Start Session
            </button>
          )}

          {status === "live" && (
            <button
              onClick={() => handleStatusChange("closed")}
              disabled={isUpdating}
              className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-300 transition-colors text-sm"
            >
              Stop Session
            </button>
          )}

          {status === "closed" && (
            <button
              onClick={() => handleStatusChange("live")}
              disabled={isUpdating}
              className="px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 transition-colors text-sm"
            >
              Reopen Session
            </button>
          )}

          <button
            onClick={copyJoinLink}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
          >
            Copy Join Link
          </button>
        </div>
      </div>

      {/* Session ID */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-600">
          Session ID:{" "}
          <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono break-all">
            {sessionId}
          </code>
        </p>
      </div>
    </div>
  );
}


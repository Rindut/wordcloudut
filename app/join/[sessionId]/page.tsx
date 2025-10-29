"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import JoinForm from "@/components/JoinForm";
import { generateUserHash } from "@/lib/wordcloud-utils";
import type { WordCloudSession } from "@/lib/types";

export default function JoinPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<WordCloudSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [userHash, setUserHash] = useState("");
  const [submittedCount, setSubmittedCount] = useState(0);

  // Generate or retrieve user hash
  useEffect(() => {
    const storageKey = `wordcloud_user_${sessionId}`;
    let hash = localStorage.getItem(storageKey);
    
    if (!hash) {
      hash = generateUserHash();
      localStorage.setItem(storageKey, hash);
    }
    
    setUserHash(hash);
  }, [sessionId]);

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      const response = await fetch(`/api/wordcloud/${sessionId}/status`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
      setLoading(false);
    };

    fetchSession();
  }, [sessionId]);

  const handleSubmit = async (word: string) => {
    const response = await fetch(`/api/wordcloud/${sessionId}/entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_hash: userHash, word }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit word");
    }

    setSubmittedCount((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Session Not Found
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            This word cloud session doesn't exist or has been deleted.
          </p>
        </div>
      </div>
    );
  }

  if (session.status === "closed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Session Closed
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            This session is no longer accepting submissions.
          </p>
        </div>
      </div>
    );
  }

  if (session.status === "draft") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Session Not Started
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            The presenter hasn't started this session yet. Please wait.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-6 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {session.question}
          </h1>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Share your thoughts by submitting up to {session.max_entries_per_user} words
          </p>
        </div>

        {/* Form */}
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <JoinForm
            sessionId={sessionId}
            userHash={userHash}
            maxEntries={session.max_entries_per_user}
            onSubmit={handleSubmit}
            submittedCount={submittedCount}
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Powered by Word Cloud UT
          </p>
        </div>
      </div>
    </div>
  );
}


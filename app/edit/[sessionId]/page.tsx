"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { WordCloudSession } from "@/lib/types";

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<WordCloudSession | null>(null);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [maxEntriesPerUser, setMaxEntriesPerUser] = useState(3);
  const [cooldownHours, setCooldownHours] = useState(24);
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/wordcloud/${sessionId}/status`);
        if (response.ok) {
          const data = await response.json();
          setSession(data);
          setQuestion(data.question || "");
          setDescription(data.description || "");
          setBackgroundImageUrl(data.background_image_url || "");
          setMaxEntriesPerUser(data.max_entries_per_user || 3);
          setCooldownHours(data.cooldown_hours || 24);
          
          // Set preview if there's already a background image
          if (data.background_image_url) {
            setImagePreview(data.background_image_url);
          }
        } else {
          setError("Session not found");
        }
      } catch (err) {
        setError("Failed to load session");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();
      setBackgroundImageUrl(data.url);
      setBackgroundImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/wordcloud/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          description: description.trim(),
          background_image_url: backgroundImageUrl.trim(),
          max_entries_per_user: maxEntriesPerUser,
          cooldown_hours: cooldownHours,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update session");
      }

      router.push(`/presenter/${sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update session");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>Loading session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Raleway, sans-serif' }}>
            Session Not Found
          </h1>
          <p className="text-gray-600 mb-4" style={{ fontFamily: 'Raleway, sans-serif' }}>{error}</p>
          <button
            onClick={() => router.push('/list-session')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            style={{ fontFamily: 'Raleway, sans-serif' }}
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[420px] mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Raleway, sans-serif' }}>
            Edit Session
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>
            Update your word cloud session
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdateSession} className="space-y-6">
          {/* Question */}
          <div>
            <label
              htmlFor="question"
              className="block text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            >
              Question *
            </label>
            <input
              type="text"
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What's your question?"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              style={{ fontFamily: 'Raleway, sans-serif' }}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            >
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description or tagline"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            />
          </div>

          {/* Max Entries Per User */}
          <div>
            <label
              htmlFor="maxEntriesPerUser"
              className="block text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            >
              Max Entries Per User *
            </label>
            <input
              type="number"
              id="maxEntriesPerUser"
              value={maxEntriesPerUser}
              onChange={(e) => setMaxEntriesPerUser(parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              style={{ fontFamily: 'Raleway, sans-serif' }}
              required
            />
            <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Maximum number of entries each user can submit (1-10)
            </p>
          </div>

          {/* Cooldown Hours */}
          <div>
            <label
              htmlFor="cooldownHours"
              className="block text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            >
              Cooldown Period (Minutes) *
            </label>
            <input
              type="number"
              id="cooldownHours"
              value={cooldownHours}
              onChange={(e) => setCooldownHours(parseInt(e.target.value) || 30)}
              min="1"
              max="10080"
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              style={{ fontFamily: 'Raleway, sans-serif' }}
              required
            />
            <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Minutes users must wait after reaching max entries (1-10080 minutes)
            </p>
          </div>

          {/* Background Image */}
          <div>
            <label
              htmlFor="backgroundImage"
              className="block text-sm font-medium text-gray-700 mb-2"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            >
              Background Image (optional)
            </label>
            
            {/* File Upload */}
            <div className="mb-3">
              <input
                type="file"
                id="backgroundImage"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                style={{ fontFamily: 'Raleway, sans-serif' }}
                disabled={isUploading}
              />
              {isUploading && (
                <p className="text-xs text-blue-600 mt-1" style={{ fontFamily: 'Raleway, sans-serif' }}>
                  Uploading image...
                </p>
              )}
            </div>

            {/* OR URL Input */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2" style={{ fontFamily: 'Raleway, sans-serif' }}>
                Or enter image URL:
              </p>
              <input
                type="url"
                value={backgroundImageUrl}
                onChange={(e) => setBackgroundImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                style={{ fontFamily: 'Raleway, sans-serif' }}
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2" style={{ fontFamily: 'Raleway, sans-serif' }}>
                  Preview:
                </p>
                <img
                  src={imagePreview}
                  alt="Background preview"
                  className="w-full max-w-xs h-32 object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}

            <p className="text-xs text-gray-500" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Recommended: 400x300px or 4:3 aspect ratio for best results. Max file size: 5MB
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600" style={{ fontFamily: 'Raleway, sans-serif' }}>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isUpdating}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            >
              {isUpdating ? "Updating..." : "Update Session"}
            </button>

            <button
              type="button"
              onClick={() => {
                // Clear all cooldowns for this session from localStorage
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                  if (key.startsWith(`cooldown_${sessionId}_`)) {
                    localStorage.removeItem(key);
                  }
                });
                alert("Cooldown untuk semua user telah direset!");
              }}
              className="w-full bg-orange-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-orange-600 transition-colors"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            >
              Reset Cooldown All Users
            </button>

            <button
              type="button"
              onClick={() => router.push(`/presenter/${sessionId}`)}
              className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              style={{ fontFamily: 'Raleway, sans-serif' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

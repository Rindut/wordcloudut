"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreateSessionRequest } from "@/lib/types";

export default function CreateSessionPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [maxEntries, setMaxEntries] = useState(3);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [groupingEnabled, setGroupingEnabled] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    setIsCreating(true);

    try {
      const body: CreateSessionRequest = {
        question: question.trim(),
        description: description.trim(),
        background_image_url: backgroundImageUrl.trim(),
        max_entries_per_user: maxEntries,
        time_limit_sec: timeLimit,
        grouping_enabled: groupingEnabled,
      };

      const response = await fetch("/api/wordcloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      router.push(`/presenter/${data.session_id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create session");
      setIsCreating(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-[420px] mx-auto flex flex-col items-center justify-center p-6 gap-6 min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-[420px] mx-auto flex flex-col items-center p-6 gap-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg mb-3">
              <span className="text-3xl">☁️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Raleway, sans-serif' }}>
            Word Cloud UT
          </h1>
          <p className="text-base text-gray-600 px-4" style={{ fontFamily: 'Raleway, sans-serif' }}>
            Create engaging live word clouds for your presentations
          </p>
        </div>

        {/* Create Session Form */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Raleway, sans-serif' }}>
            Create New Session
          </h2>

          <form onSubmit={handleCreateSession} className="space-y-4">
            {/* Question */}
            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Question or Prompt
              </label>
              <input
                type="text"
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., Describe your mood today in one word"
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
                style={{ fontFamily: 'Raleway, sans-serif' }}
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context or instructions for participants..."
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={3}
                maxLength={500}
                style={{ fontFamily: 'Raleway, sans-serif' }}
              />
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

            {/* Max Entries */}
            <div>
              <label
                htmlFor="maxEntries"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Max words per participant
              </label>
              <input
                type="number"
                id="maxEntries"
                value={maxEntries}
                onChange={(e) => setMaxEntries(parseInt(e.target.value) || 3)}
                min={1}
                max={10}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Time Limit */}
            <div>
              <label
                htmlFor="timeLimit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Time limit (seconds, optional)
              </label>
              <input
                type="number"
                id="timeLimit"
                value={timeLimit || ""}
                onChange={(e) =>
                  setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)
                }
                placeholder="No limit"
                min={30}
                max={3600}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            {/* Grouping */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="grouping"
                checked={groupingEnabled}
                onChange={(e) => setGroupingEnabled(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
              />
              <label
                htmlFor="grouping"
                className="ml-3 text-sm font-medium text-gray-700 leading-relaxed"
              >
                Enable smart word grouping (groups similar words together)
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-base hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? "Creating..." : "Create Session"}
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Real-time Updates</h3>
            <p className="text-xs text-gray-600">
              See words appear instantly as participants submit them
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Beautiful Visuals</h3>
            <p className="text-xs text-gray-600">
              Dynamic word clouds with colors and sizes based on frequency
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm">Moderation</h3>
            <p className="text-xs text-gray-600">
              Built-in profanity filter and manual word deletion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

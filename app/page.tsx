"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(true);
  const [goingToWait, setGoingToWait] = useState(false);

  useEffect(() => {
    setMounted(true);
    // On homepage, redirect to first session's presenter view based on order
    const goToFirstSession = async () => {
      try {
        const res = await fetch('/api/wordcloud/order', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const first = Array.isArray(data.order) && data.order.length > 0 ? data.order[0] : null;
          const firstSessionId = first?.session_id;
          if (firstSessionId) {
            router.replace(`/presenter/${firstSessionId}`);
            return;
          } else {
            // If session_order is empty, redirect to wait page
            setGoingToWait(true);
            router.replace('/wait');
            return;
          }
        }
      } catch (e) {
        // On error, redirect to wait page
        setGoingToWait(true);
        router.replace('/wait');
      } finally {
        // Keep redirecting=true while navigating to avoid homepage flash
      }
    };
    goToFirstSession();
  }, [router]);

  if (!mounted || redirecting) {
    // Special loading page for wait page with same background
    if (goingToWait) {
      return (
        <div 
          className="min-h-screen flex items-center justify-center"
          style={{
            backgroundImage: 'url(https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="max-w-[420px] mx-auto flex flex-col items-center justify-center p-6 gap-6" style={{ backgroundColor: 'transparent' }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>Loading...</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Default loading for presenter redirect
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-md mx-auto px-4 py-6">
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

        {/* Main Actions */}
        <div className="space-y-4">
          <button
            onClick={() => router.push("/create")}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg"
            style={{ fontFamily: 'Raleway, sans-serif' }}
          >
            Create New Session
          </button>

          <button
            onClick={() => router.push("/list-session")}
            className="w-full bg-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg"
            style={{ fontFamily: 'Raleway, sans-serif' }}
          >
            View All Sessions
          </button>

          <div className="bg-white rounded-xl shadow-lg p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Join Existing Session
            </h3>
            <p className="text-sm text-gray-600 mb-4" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Have a session ID? Enter it below to join an active word cloud session.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter session ID..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                style={{ fontFamily: 'Raleway, sans-serif' }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const sessionId = e.currentTarget.value.trim();
                    if (sessionId) {
                      router.push(`/join/${sessionId}`);
                    }
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  const sessionId = input.value.trim();
                  if (sessionId) {
                    router.push(`/join/${sessionId}`);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                style={{ fontFamily: 'Raleway, sans-serif' }}
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm" style={{ fontFamily: 'Raleway, sans-serif' }}>Real-time Updates</h3>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>
              See words appear instantly as participants submit them
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm" style={{ fontFamily: 'Raleway, sans-serif' }}>Beautiful Visuals</h3>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Dynamic word clouds with colors and sizes based on frequency
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="font-bold text-gray-900 mb-2 text-sm" style={{ fontFamily: 'Raleway, sans-serif' }}>Moderation</h3>
            <p className="text-xs text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>
              Built-in profanity filter and manual word deletion
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

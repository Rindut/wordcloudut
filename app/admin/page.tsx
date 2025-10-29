"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundImage: 'url(https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-[420px] mx-auto flex flex-col items-center justify-center p-6 gap-6 min-h-screen" style={{ backgroundColor: 'transparent' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-[420px] mx-auto flex flex-col items-center p-6 gap-6" style={{ backgroundColor: 'transparent' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img 
              src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-logo-03.png" 
              alt="DUKCATIL Logo" 
              className="h-20 w-auto mx-auto mb-4"
              style={{ maxWidth: '100%', transform: 'scale(0.8)' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
            <span className="text-3xl" style={{ display: 'none' }}>🐱</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', letterSpacing: '5px', fontSize: 'calc(2.25rem + 5px)', textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
            ADMINISTRATOR
          </h1>
        </div>

        {/* Spacing Container */}
        <div style={{ height: '20px' }}></div>

        {/* Action Links */}
        <div className="w-full space-y-6">
          {/* Session List Link */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push("/list-session")}>
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Fredoka, sans-serif', color: '#ffd942', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '600' }}>
                Session List
              </h2>
              <p className="text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                View and manage all your word cloud sessions
              </p>
            </div>
          </div>

          {/* Create New Session Link */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => router.push("/create")}>
            <div className="text-center">
              <div className="text-5xl mb-4">➕</div>
              <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Fredoka, sans-serif', color: '#ffd942', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '600' }}>
                Create New Session
              </h2>
              <p className="text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Start a new word cloud session
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


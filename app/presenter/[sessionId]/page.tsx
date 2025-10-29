"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WordCloudCanvas from "@/components/WordCloudCanvas";
import type { WordCloudSession, WordCloudSummary } from "@/lib/types";

export default function PresenterPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<WordCloudSession | null>(null);
  const [words, setWords] = useState<WordCloudSummary[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch summary
  const fetchSummary = async () => {
    const response = await fetch(`/api/wordcloud/${sessionId}/summary`);
    if (response.ok) {
      const data = await response.json();
      setWords(data.items);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [sessionId]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`wordcloud_summary:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wordcloud_summary",
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchSummary();
        }
      )
      .subscribe();


    return () => {
      channel.unsubscribe();
    };
  }, [sessionId]);


  if (loading) {
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
                 <p className="text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
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
                 <h1 className="text-2xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Raleway, sans-serif' }}>
                   Session Not Found
                 </h1>
                 <p className="text-gray-600" style={{ fontFamily: 'Raleway, sans-serif' }}>This session doesn't exist.</p>
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
        {/* Header Section */}
        <div className="text-center">
          <img 
            src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-logo-03.png" 
            alt="DUKCATIL Logo" 
            className="h-20 w-auto mx-auto mb-4"
            style={{ maxWidth: '100%', transform: 'scale(0.8)' }}
            onError={(e) => {
              // Fallback to cat emoji if logo doesn't exist
              e.currentTarget.style.display = 'none';
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.style.display = 'block';
              }
            }}
          />
          <span className="text-3xl" style={{ display: 'none' }}>🐱</span>
        </div>

        {/* Title Section */}
        <div className="text-center">
          <h2 className="text-sm sm:text-base font-semibold text-center mt-4" style={{ color: '#ffd942', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontFamily: 'Fredoka, sans-serif', fontWeight: '600' }}>
            {session.question}
          </h2>
          
          {session.description && (
            <p className="text-xs text-center mt-2" style={{ color: '#000000', fontFamily: 'Fredoka, sans-serif' }}>
              {session.description}
            </p>
          )}
        </div>

        {/* Spacing Container */}
        <div style={{ height: '10px' }}></div>

        {/* Word Cloud Container */}
        <div 
          className="w-full aspect-[4/3] rounded-xl shadow-sm flex items-center justify-center overflow-hidden py-4 px-[5px]"
          style={{
            background: session.background_image_url 
              ? `url(${session.background_image_url})` 
              : '#ffffff',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '2px solid #d1d5db'
          }}
        >
          <WordCloudCanvas
            words={words}
            width={Math.min(window.innerWidth - 80, 350)}
            height={Math.min(window.innerHeight * 0.3, 200)}
          />
        </div>

        {/* Spacing Container */}
        <div style={{ height: '10px' }}></div>

        {/* Combined Info and Instruction Section */}
        <div className="bg-white w-full rounded-xl shadow-sm p-4 text-center">
          <div className="text-sm font-medium mb-2" style={{ color: '#374151', fontFamily: 'Fredoka, sans-serif' }}>
            Total ada {words.length} kucing yang sudah terdata.
          </div>
          <div className="text-sm" style={{ color: '#000000', fontFamily: 'Fredoka, sans-serif' }}>
            Mau tambahkan nama kucing kamu?<br />
            Klik tombol di bawah ini.
          </div>
        </div>

        {/* Action Buttons */}
        <img
          src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/tambah-kucing-0.png"
          alt="TAMBAH KUCING"
          className="w-full cursor-pointer transition-all duration-300 transform hover:scale-105"
          style={{ transform: 'scale(0.5)' }}
          onClick={() => {
            const url = `${window.location.origin}/join2/${sessionId}`;
            window.location.href = url;
          }}
          onError={(e) => {
            // Fallback to button if image doesn't load
            e.currentTarget.style.display = 'none';
            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
            if (nextElement) {
              nextElement.style.display = 'block';
            }
          }}
        />
        <button
          onClick={() => {
            const url = `${window.location.origin}/join2/${sessionId}`;
            window.location.href = url;
          }}
          className="w-full font-semibold rounded-xl py-3 text-base shadow-md transition-all"
          style={{ backgroundColor: '#7c3aed', color: '#ffffff', fontFamily: 'Fredoka, sans-serif', display: 'none' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6d28d9'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
        >
          JOIN KUCING SIGMA
        </button>


      </div>
    </div>
  );
}


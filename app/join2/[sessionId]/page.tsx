"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getUserHash } from "@/lib/user-hash";

interface RPCResponse {
  ok: boolean;
  message: string;
  attempts_left: number;
  cooldown_remaining_seconds: number;
}

export default function Join2Page() {
  // Force cache busting
  const cacheBuster = Date.now();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [question, setQuestion] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [maxEntriesPerUser, setMaxEntriesPerUser] = useState(3);
  const [cooldownMinutes, setCooldownMinutes] = useState(30);
  const [isClient, setIsClient] = useState(false);
  const [lastSubmittedName, setLastSubmittedName] = useState("");
  const [previousAttempts, setPreviousAttempts] = useState(10);
  
  // Debug-only visuals toggle. Keep false for production; switch to true when debugging UI.
  const showDebugInfo = false;
  
  // Handle hydration
  useEffect(() => {
    setIsClient(true);
    console.log("🔄 PAGE LOADED - Cache buster:", cacheBuster);
    console.log("🔄 INITIAL STATE - attemptsLeft:", attemptsLeft);
  }, []);

  // Track attemptsLeft changes
  useEffect(() => {
    console.log("🔄 ATTEMPTS CHANGED - attemptsLeft:", attemptsLeft);
  }, [attemptsLeft]);
  
  // Fetch session question and quota status
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session
        const sessionResponse = await fetch(`/api/wordcloud/${sessionId}/status`);
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setQuestion(sessionData.question || "Masukkan Nama");
          if (sessionData.max_entries_per_user) {
            setMaxEntriesPerUser(sessionData.max_entries_per_user);
          }
          if (sessionData.cooldown_hours) { // Note: ini sebenarnya minutes di database
            setCooldownMinutes(sessionData.cooldown_hours);
          }
        }

        // Fetch quota status
        const quotaResponse = await fetch(`/api/wordcloud/${sessionId}/quota?user_hash=${getUserHash()}`);
        if (quotaResponse.ok) {
          const quotaResult = await quotaResponse.json();
          
          // If user is in cooldown, set the timer
          if (quotaResult.cooldown_remaining_seconds > 0) {
            setCooldownSeconds(quotaResult.cooldown_remaining_seconds);
          }
          
          // Update attempts left
          if (quotaResult.attempts_left !== undefined) {
            setAttemptsLeft(quotaResult.attempts_left);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, [sessionId]);

  // Cooldown countdown timer (only runs when cooldown is active)
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // Auto-close success popup after 3 seconds
  useEffect(() => {
    if (showSuccessPopup) {
      console.log("Auto-close effect triggered, setting timer for 3 seconds");
      const timer = setTimeout(() => {
        console.log("Auto-close timer expired, closing popup");
        setShowSuccessPopup(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  // Validate word: 1-10 chars, letters only
  const validateWord = (word: string): { valid: boolean; error?: string } => {
    const trimmed = word.trim();
    
    if (!trimmed) {
      return { valid: false, error: "Nama tidak boleh kosong" };
    }

    if (trimmed.length < 1 || trimmed.length > 10) {
      return { valid: false, error: "Nama harus 1-10 karakter" };
    }

    if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
      return { valid: false, error: "Nama hanya boleh huruf" };
    }

    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setMessage("");

    // Validate word
    const validation = validateWord(name);
    if (!validation.valid) {
      setMessage(validation.error || "Invalid input");
      return;
    }

    setIsSubmitting(true);

    try {
      const word = name.trim().toLowerCase();
      
      // Use API endpoint instead of direct RPC call
      const response = await fetch(`/api/wordcloud/${sessionId}/entry?v=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_hash: getUserHash(),
          word: word
        })
      });

      const result = await response.json();
      console.log("🚀 API Response:", { result, status: response.status });
      console.log("🚀 Attempts left from API:", result.attempts_left);

      if (!response.ok) {
        console.error("API Error:", result);
        
        // Handle specific error cases
        if (result.error?.includes('function')) {
          setMessage("Server error: Please install RPC function");
        } else {
          setMessage(`Error: ${result.error || result.message || 'Unknown error'}`);
        }
        setIsSubmitting(false);
        return;
      }

      if (!result.success) {
        setMessage(result.message || "Failed to submit");
        setIsSubmitting(false);
        return;
      }

      // Handle COOLDOWN response
      if (result.message === 'COOLDOWN') {
        setCooldownSeconds(result.cooldown_remaining_seconds || 0);
        setMessage(`Sedang cooldown. Tunggu ${Math.floor(result.cooldown_remaining_seconds / 60)} menit`);
        setIsSubmitting(false);
        return;
      }

      // Handle success
      if (result.success) {
        console.log("✅ SUCCESS - Setting showSuccessPopup to TRUE");
        console.log("Success result:", result);
        console.log("Attempts left from API:", result.attempts_left);
        
        // Store previous attempts and last submitted name
        console.log("🔄 BEFORE UPDATE - attemptsLeft:", attemptsLeft, "result.attempts_left:", result.attempts_left);
        setPreviousAttempts(attemptsLeft);
        setLastSubmittedName(name.trim());
        
        // Update attemptsLeft and show popup
        console.log("🚀 Setting attemptsLeft to:", result.attempts_left);
        setAttemptsLeft(result.attempts_left);
        console.log("🔄 AFTER UPDATE - attemptsLeft should be:", result.attempts_left);
        console.log("Before setShowSuccessPopup, current value:", showSuccessPopup);
        setShowSuccessPopup(true);
        console.log("After setShowSuccessPopup(true)");
        setName("");
        
        // If attempts reach 0, start cooldown
        if (result.attempts_left === 0 && result.cooldown_remaining_seconds > 0) {
          setCooldownSeconds(result.cooldown_remaining_seconds);
        }
      } else {
        // Handle other errors
        console.log("Error result:", result);
        setMessage(result.message || "Failed to submit");
      }
      
      setIsSubmitting(false);
    } catch (err: any) {
      console.error("Submit error:", err);
      setMessage(err.message || "Error submitting");
      setIsSubmitting(false);
    }
  };

  // Format cooldown timer as mm:ss
  const formatCooldown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Format minutes to hours & minutes if > 59
  const formatTimeLimit = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} menit`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours} jam`;
    }
    return `${hours} jam ${mins} menit`;
  };

  const isInCooldown = cooldownSeconds > 0;
  const canSubmit = !isSubmitting && !isInCooldown && name.trim().length > 0;

  return (
    <>
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
              e.currentTarget.nextElementSibling.style.display = 'block';
            }}
          />
          <span className="text-3xl" style={{ display: 'none' }}>🐱</span>
        </div>

        {/* Question Section */}
        <div className="text-center" style={{ padding: '5px' }}>
          <h2 className="text-sm sm:text-base font-semibold text-center mt-4" style={{ color: '#ffd942', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontFamily: 'Fredoka, sans-serif', fontWeight: '600' }}>
            {question}
          </h2>
        </div>

        {/* Spacing Container */}
        <div style={{ height: '10px' }}></div>

        {/* Form */}
        <div className="bg-white p-4 rounded-xl shadow-lg w-full">
          {/* Attempts Left Indicator */}
          {!isInCooldown && (
            <p className="text-xs text-center mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#779848' }}>
              Kamu masih punya {attemptsLeft} kesempatan. {/* Debug: attemptsLeft={attemptsLeft} */}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" suppressHydrationWarning>
            {/* Spacing Container */}
            <div style={{ height: '5px' }}></div>
            
            <div style={{ padding: '5px 40px' }}>
              {isClient ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="nama kucing kamu"
                  maxLength={10}
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
                  style={{ 
                    fontFamily: 'Fredoka, sans-serif', 
                    padding: '12px 17px', 
                    fontSize: '20px',
                    color: '#ffd942',
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
                    fontWeight: '600'
                  }}
                  disabled={isSubmitting || isInCooldown}
                />
              ) : (
                <div 
                  className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg text-center"
                  style={{ 
                    fontFamily: 'Fredoka, sans-serif', 
                    padding: '12px 17px', 
                    fontSize: '20px',
                    color: '#9ca3af',
                    fontWeight: '400',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Loading...
                </div>
              )}
              <style jsx>{`
                input::placeholder {
                  font-family: 'Fredoka', sans-serif;
                  color: #9ca3af;
                  text-shadow: none;
                  font-weight: 400;
                  font-size: 16px;
                }
              `}</style>
              {message && (
                <p className="mt-2 text-sm text-red-600 text-center" style={{ fontFamily: 'Fredoka, sans-serif' }}>{message}</p>
              )}
              {isInCooldown && (
                <p className="text-sm text-center mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#FF6B6B' }}>
                  Cooldown: {formatCooldown(cooldownSeconds)}
                </p>
              )}
            </div>

            <img
              src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/submit.png"
              alt="Submit Word"
              className="w-full transition-all duration-300 transform"
              style={{ 
                transform: 'scale(0.5)',
                cursor: !canSubmit ? 'not-allowed' : 'pointer',
                opacity: !canSubmit ? 0.5 : 1
              }}
              onClick={(e) => {
                if (canSubmit) {
                  const form = e.currentTarget.closest('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }
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
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
              style={{ fontFamily: 'Fredoka, sans-serif', display: 'none' }}
            >
              {isSubmitting ? "Mengirim..." : "Kirim"}
            </button>

            {/* Info text */}
            <div className="text-center mt-2">
              <p className="text-xs" style={{ fontFamily: 'Fredoka, sans-serif', color: '#779848' }}>
                Limit {maxEntriesPerUser} nama per {formatTimeLimit(cooldownMinutes)}
              </p>
              <p className="text-xs mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#779848' }}>
                pilih nama kucingmu dengan bijak! 🐈✨
              </p>
              <Link 
                href={`/presenter/${sessionId}`}
                className="text-xs mt-2 block underline hover:no-underline"
                style={{ fontFamily: 'Fredoka, sans-serif', color: '#60a5fa' }}
              >
                Klik di sini untuk hasilnya.
              </Link>
          {/* Remaining attempts display (hidden by default, keep for future debug) */}
          {showDebugInfo && !isInCooldown && (
            <p className="text-xs mt-1 font-semibold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#ffd942', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
              Sisa: {attemptsLeft} kesempatan
            </p>
          )}
              
          {/* Last submitted name and attempt comparison (hidden by default, keep for future debug) */}
          {showDebugInfo && lastSubmittedName && (
            <div className="mt-2">
              <p className="text-xs" style={{ fontFamily: 'Fredoka, sans-serif', color: '#4ade80' }}>
                ✅ Berhasil tersimpan: <span className="font-semibold">{lastSubmittedName}</span>
              </p>
              <p className="text-xs mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#60a5fa' }}>
                Attempt sebelumnya: {previousAttempts} → Attempt sekarang: {attemptsLeft}
              </p>
            </div>
          )}
            </div>
          </form>
        </div>
      </div>
      </div>

      {/* Success Popup - Auto close after 3 seconds */}
      {(() => {
        console.log("RENDERING POPUP - showSuccessPopup:", showSuccessPopup);
        return showSuccessPopup && (
          <div 
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
            style={{ 
              zIndex: 999999,
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <div 
              className="max-w-sm mx-4"
              style={{
                zIndex: 1000000
              }}
            >
              <img
                src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/submit-berhasil.png"
                alt="Berhasil dikirim!"
                className="h-auto"
                style={{ width: '70%', display: 'block', margin: '0 auto' }}
                onError={(e) => {
                  // Fallback to text if image doesn't load
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'block';
                  }
                }}
              />
              <div 
                className="rounded-xl shadow-lg p-6 bg-white text-center"
                style={{ display: 'none' }}
              >
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Berhasil dikirim!
                </h3>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

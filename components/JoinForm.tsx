"use client";

import { useState, useEffect } from "react";

interface JoinFormProps {
  sessionId: string;
  userHash: string;
  maxEntries: number;
  cooldownHours?: number;
  onSubmit: (word: string) => Promise<void>;
  submittedCount: number;
}

interface QuotaStatus {
  attempts_left: number;
  cooldown_remaining_seconds: number;
  cooldown_until: string | null;
}

export default function JoinForm({
  sessionId,
  userHash,
  maxEntries,
  cooldownHours = 1,
  onSubmit,
  submittedCount,
}: JoinFormProps) {
  const [word, setWord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Helper function to check if user is in cooldown
  const isInCooldown = () => quota ? quota.cooldown_remaining_seconds > 0 : false;
  
  const remainingEntries = quota?.attempts_left ?? maxEntries;

  // Format cooldown end time as date and time
  const formatCooldownEndTime = (cooldownUntil: string | null) => {
    if (!cooldownUntil) return '';
    const date = new Date(cooldownUntil);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Fetch quota from server
  const fetchQuota = async () => {
    try {
      const response = await fetch(`/api/wordcloud/${sessionId}/quota?user_hash=${userHash}`);
      if (response.ok) {
        const data = await response.json();
        setQuota(data);
        if (data.cooldown_remaining_seconds > 0) {
          setCooldownSeconds(data.cooldown_remaining_seconds);
        }
      }
    } catch (error) {
      console.error("Error fetching quota:", error);
    }
  };

  // Load quota on mount
  useEffect(() => {
    fetchQuota();
  }, [sessionId, userHash]);

  // Cooldown countdown timer
  useEffect(() => {
    if (!quota || quota.cooldown_remaining_seconds <= 0) {
      setCooldownSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 0) {
          clearInterval(interval);
          fetchQuota(); // Refresh quota when cooldown expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quota]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!word.trim()) {
      setError("Tulis nama kucing kamu");
      return;
    }

    if (word.length > 10) {
      setError("Nama kucing harus 10 karakter atau kurang");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(word.trim());
      setWord("");
      
      // Refresh quota after successful submission
      await fetchQuota();
    } catch (err: any) {
      setError(err.message || "Gagal mengirim nama kucing");
      
      // Refresh quota on error too (in case of cooldown or quota errors)
      await fetchQuota();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (remainingEntries <= 0) {
    return (
      <div className="max-w-md mx-auto p-4 bg-green-50 rounded-lg" style={{ padding: '10px' }}>
        <div className="text-center">
          <h2 className="text-xl font-bold text-green-800 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Terima Kasih!
          </h2>
          <p className="text-sm text-green-700 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Kamu sudah tambah nama kucing kamu.
          </p>
          <p className="text-sm text-green-700 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Lihat hasilnya di{" "}
            <a 
              href={`/presenter/${sessionId}`} 
              className="text-blue-600 underline hover:text-blue-800"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              sini
            </a>
            !
          </p>
          
          {isInCooldown() && quota && (
            <>
              <p className="text-xs text-center mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#779848' }}>
                Kamu bisa input lagi pada {formatCooldownEndTime(quota.cooldown_until)}
              </p>
              <p className="text-xs text-center mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#779848' }}>
                (Masih {Math.floor(cooldownSeconds / 60)} menit {cooldownSeconds % 60} detik)
              </p>
            </>
          )}
        </div>

        {/* Cooldown Status Footer */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-center" style={{ fontFamily: 'Fredoka, sans-serif', color: isInCooldown() ? '#ef4444' : '#779848', fontWeight: '600' }}>
            Status: {isInCooldown() ? 'COOLDOWN' : 'Tidak sedang cooldown'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Spacing Container */}
        <div style={{ height: '5px' }}></div>
        
        <div style={{ padding: '5px 40px' }}>
        <input
          type="text"
          id="word"
          value={word}
          onChange={(e) => setWord(e.target.value)}
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
          disabled={isSubmitting}
        />
        <style jsx>{`
          input::placeholder {
            font-family: 'Fredoka', sans-serif;
            color: #9ca3af;
            text-shadow: none;
            font-weight: 400;
            font-size: 16px;
          }
        `}</style>
          {error && (
            <p className="mt-2 text-sm text-red-600 text-center" style={{ fontFamily: 'Fredoka, sans-serif' }}>{error}</p>
          )}
          {remainingEntries > 0 && !isInCooldown() && (
            <p className="text-xs text-center mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#779848' }}>
              Kamu masih punya {remainingEntries} kesempatan.
            </p>
          )}
          {isInCooldown() && (
            <p className="text-xs text-center mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#ef4444' }}>
              Cooldown: {Math.floor(cooldownSeconds / 60)}:{String(cooldownSeconds % 60).padStart(2, '0')}
            </p>
          )}
        </div>

        <div style={{ paddingTop: '0' }}>
          <img
            src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/submit.png"
            alt="Submit Word"
            className="w-full transition-all duration-300 transform"
            style={{ 
              transform: 'scale(0.5)',
              cursor: (isSubmitting || isInCooldown() || !word.trim()) ? 'not-allowed' : 'pointer',
              opacity: (isSubmitting || isInCooldown() || !word.trim()) ? 0.5 : 1
            }}
            onClick={(e) => {
              if (!isSubmitting && !isInCooldown() && word.trim()) {
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
            disabled={isSubmitting || isInCooldown() || !word.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
            style={{ fontFamily: 'Fredoka, sans-serif', display: 'none' }}
          >
            {isSubmitting ? "Mengirim..." : "Kirim Nama Kucing"}
          </button>
          
          {/* Max Entries Info */}
          <p className="text-xs text-center mt-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#779848' }}>
            Maksimal input {maxEntries} nama kucing per hari
          </p>
        </div>

        {/* Cooldown Status Footer */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-center" style={{ fontFamily: 'Fredoka, sans-serif', color: isInCooldown() ? '#ef4444' : '#779848', fontWeight: '600' }}>
            Status: {isInCooldown() ? 'COOLDOWN' : 'Tidak sedang cooldown'}
          </p>
        </div>

      </form>
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";

interface TimerBadgeProps {
  startTime: string;
  timeLimitSec: number | null;
}

export default function TimerBadge({ startTime, timeLimitSec }: TimerBadgeProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!timeLimitSec) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const elapsed = Math.floor((now - start) / 1000);
      const remaining = timeLimitSec - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, timeLimitSec]);

  if (!timeLimitSec || timeRemaining === null) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div
      className={`px-3 py-2 rounded-lg font-mono text-sm font-bold ${
        timeRemaining < 60
          ? "bg-red-100 text-red-800"
          : timeRemaining < 180
          ? "bg-yellow-100 text-yellow-800"
          : "bg-green-100 text-green-800"
      }`}
    >
      ⏱️ {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}


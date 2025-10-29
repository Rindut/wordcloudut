"use client";

import { useEffect, useRef, useState } from "react";
import type { WordCloudSummary } from "@/lib/types";
import { calculateFontSize } from "@/lib/wordcloud-utils";

interface WordCloudCanvasProps {
  words: WordCloudSummary[];
  width?: number;
  height?: number;
  onWordClick?: (word: string) => void;
}

export default function WordCloudCanvas({
  words,
  width = 800,
  height = 600,
  onWordClick,
}: WordCloudCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current || words.length === 0) return;

    // Dynamic import to avoid SSR issues
    import("wordcloud").then((WordCloud) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Create a bold pastel color palette
      const colorPalette = [
        "#FF6B9D", "#FFB347", "#FFD93D", "#6BCF7F", "#4DABF7",
        "#FF8CC8", "#9775FA", "#51CF66", "#FFD43B", "#FF8787",
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57",
        "#FF9FF3", "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43",
        "#FF6348", "#2ED573", "#1E90FF", "#FF4757", "#FFA502",
        "#FF6B35", "#F8B500", "#00D2D3", "#FF3838", "#3742FA",
        "#2F3542", "#FF4757", "#2ED573", "#1E90FF", "#FF6348",
        "#FF9F43", "#5F27CD", "#54A0FF", "#FF9FF3", "#FECA57",
        "#96CEB4", "#45B7D1", "#4ECDC4", "#FF6B6B", "#FF8787",
        "#FFD43B", "#51CF66", "#9775FA", "#FF8CC8", "#4DABF7",
        "#6BCF7F", "#FFD93D", "#FFB347", "#FF6B9D", "#FF6B35"
      ];

      // Prepare word list for wordcloud library
      // Format: [[word, size], [word, size], ...]
      const wordList = words.map((item) => [
        item.display_word,
        calculateFontSize(item.count),
      ]) as [string, number][];

      // Create a color map for each word
      const colorMap = new Map<string, string>();
      words.forEach((item) => {
        let color = item.color;
        
        // If no color assigned, generate one based on word hash
        if (!color) {
          let hash = 0;
          for (let i = 0; i < item.display_word.length; i++) {
            hash = item.display_word.charCodeAt(i) + ((hash << 5) - hash);
          }
          color = colorPalette[Math.abs(hash) % colorPalette.length];
        }
        
        console.log(`Assigning color ${color} to word: ${item.display_word}`);
        colorMap.set(item.display_word, color);
      });

      // Configure wordcloud with minimal options
      WordCloud.default(canvas, {
        list: wordList,
        fontFamily: "Fredoka, sans-serif",
        fontWeight: "bold",
        color: function (word: string, weight: number, fontSize: number, distance: number, theta: number) {
          // Generate consistent color based on word hash
          let hash = 0;
          for (let i = 0; i < word.length; i++) {
            hash = word.charCodeAt(i) + ((hash << 5) - hash);
          }
          const color = colorPalette[Math.abs(hash) % colorPalette.length];
          return color;
        },
        backgroundColor: "transparent",
        click: function (item) {
          if (onWordClick && item) {
            onWordClick(item[0] as string);
          }
        },
      });
    });
  }, [mounted, words, width, height, onWordClick]);

  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300"
        style={{ width, height, backgroundColor: 'transparent' }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300"
        style={{ width, height, backgroundColor: 'transparent' }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🐱</div>
          <p className="text-gray-400 text-sm">No words submitted yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg shadow-sm"
        style={{ backgroundColor: 'transparent' }}
      />
    </div>
  );
}


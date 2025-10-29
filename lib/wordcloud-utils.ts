/**
 * Word Cloud Utilities
 * Normalization, profanity filtering, and text processing
 */

// Profanity filter word list (English + Indonesian)
const PROFANITY_LIST = [
  // English
  "fuck", "shit", "damn", "bitch", "ass", "bastard", "hell", "crap",
  "piss", "dick", "cock", "pussy", "whore", "slut", "fag", "nigger",
  // Indonesian
  "anjing", "babi", "kontol", "memek", "pepek", "jancok", "bangsat",
  "kampret", "tolol", "goblok", "tai", "asu", "kimak", "bajingan",
];

/**
 * Normalize text: lowercase, trim, strip punctuation
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " "); // Normalize whitespace
}

/**
 * Check if word contains profanity
 */
export function isProfane(word: string): boolean {
  const normalized = normalizeText(word);
  return PROFANITY_LIST.some((profane) => normalized.includes(profane));
}

/**
 * Generate cluster key for word grouping
 * Basic implementation - can be enhanced with Levenshtein distance
 */
export function getClusterKey(word: string): string {
  const normalized = normalizeText(word);
  
  // Basic stemming for common patterns
  let stemmed = normalized
    .replace(/ies$/, "y") // happiness -> happy
    .replace(/s$/, "") // cats -> cat
    .replace(/ed$/, "") // loved -> love
    .replace(/ing$/, ""); // loving -> love
  
  return stemmed;
}

/**
 * Generate color for word cloud based on word hash for consistency
 */
export function generateColor(word?: string): string {
  const colors = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
    "#F8C471", "#82E0AA", "#F1948A", "#85C1E9", "#D7BDE2",
    "#A9DFBF", "#F9E79F", "#AED6F1", "#D5DBDB", "#FADBD8",
    "#E8DAEF", "#D1F2EB", "#FCF3CF", "#D6EAF8", "#FADBD8",
    "#E8F8F5", "#FEF9E7", "#EBF5FB", "#FDF2E9", "#EAF2F8"
  ];
  
  if (word) {
    // Generate consistent color based on word hash
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = word.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Calculate font size based on word frequency
 */
export function calculateFontSize(count: number): number {
  const base = 16;
  const scale = 10;
  const min = 12;
  const max = 72;
  
  const size = base + Math.log(count + 1) * scale;
  return Math.min(Math.max(size, min), max);
}

/**
 * Validate word submission
 */
export function validateWord(word: string): {
  valid: boolean;
  error?: string;
} {
  if (!word || word.trim().length === 0) {
    return { valid: false, error: "Word cannot be empty" };
  }
  
  if (word.length > 25) {
    return { valid: false, error: "Word must be 25 characters or less" };
  }
  
  // Temporarily disable profanity filter for testing
  // if (isProfane(word)) {
  //   return { valid: false, error: "Word contains inappropriate content" };
  // }
  
  return { valid: true };
}

/**
 * Generate user hash for anonymous participants
 */
export function generateUserHash(): string {
  return `anon_${Math.random().toString(36).substring(2, 15)}`;
}



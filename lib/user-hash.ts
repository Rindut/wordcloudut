/**
 * User hash utilities for persistent user identification
 */

const USER_HASH_KEY = 'wordcloud_user_hash';

/**
 * Get or generate a persistent user hash for the current session
 * This ensures the same user gets the same hash across page reloads
 */
export function getUserHash(): string {
  // Check if we already have a user hash in localStorage
  if (typeof window !== 'undefined') {
    const existingHash = localStorage.getItem(USER_HASH_KEY);
    if (existingHash) {
      return existingHash;
    }
    
    // Generate a new hash and store it
    const newHash = `anon_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(USER_HASH_KEY, newHash);
    return newHash;
  }
  
  // Fallback for server-side rendering
  return `anon_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generate a new user hash (for testing or reset purposes)
 */
export function generateNewUserHash(): string {
  const newHash = `anon_${Math.random().toString(36).substring(2, 15)}`;
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_HASH_KEY, newHash);
  }
  return newHash;
}

/**
 * Clear the stored user hash
 */
export function clearUserHash(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_HASH_KEY);
  }
}


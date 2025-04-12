import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to format seconds into m:ss
export function formatTime(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || isNaN(totalSeconds) || totalSeconds < 0) {
    return ''; // Return empty string for null/invalid for input display
  }
  totalSeconds = Math.max(0, totalSeconds); // Ensure non-negative
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Utility function to parse time string (m:ss or seconds) into seconds
export function parseTime(timeString: string | null | undefined): number | null {
  if (timeString === null || timeString === undefined || timeString.trim() === '') {
    return null;
  }
  timeString = timeString.trim();
  const parts = timeString.split(':');

  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    // Validate minutes >= 0, seconds 0-59
    if (!isNaN(minutes) && !isNaN(seconds) && minutes >= 0 && seconds >= 0 && seconds < 60) {
      return minutes * 60 + seconds;
    }
  } else if (parts.length === 1 && timeString.indexOf(':') === -1) { // Ensure it's not just a colon or partial
    const totalSeconds = parseInt(parts[0], 10);
    if (!isNaN(totalSeconds) && totalSeconds >= 0) {
      return totalSeconds;
    }
  }
  return null; // Return null if format is invalid
}

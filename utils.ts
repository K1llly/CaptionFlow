import { StyleConfig, Caption } from './types';

export const parseTime = (timeStr: string | number | undefined): number => {
  if (timeStr === undefined || timeStr === null) return 0;
  if (typeof timeStr === 'number') return timeStr;
  
  // Normalize: remove generic whitespace, handle commas (Turkish locale often uses commas for decimals)
  const normalized = String(timeStr).replace(',', '.').trim();
  
  if (!normalized) return 0;
  
  // Check for simple number (seconds or milliseconds as string)
  if (!normalized.includes(':')) {
      const val = parseFloat(normalized);
      if (isNaN(val)) return 0;
      // Heuristic: if it's a huge integer string like "1500" but meant to be seconds? 
      // Usually simple numbers without colons are seconds in our app context unless > 10000 implies ms?
      // We'll stick to treating it as seconds unless it's clearly ms context (not handled here).
      return val;
  }

  const parts = normalized.split(':').map(p => parseFloat(p));
  
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    // HH:MM:SS.mmm
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS.mmm
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // SS
    return parts[0];
  }
  return 0;
};

export const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return "00:00:00.000";
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  // Format seconds with 3 decimal places
  const sFormatted = s.toFixed(3).padStart(6, '0');
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sFormatted}`;
};

export const getEffectiveStyle = (globalStyle: StyleConfig, caption?: Caption): StyleConfig => {
  if (!caption || !caption.style) return globalStyle;
  return { ...globalStyle, ...caption.style };
};
export interface Caption {
  id: string;
  start: string; // "HH:MM:SS.mmm"
  end: string;   // "HH:MM:SS.mmm"
  text: string;
  style?: Partial<StyleConfig>;
}

export enum AnimationType {
  NONE = 'NONE',
  FADE_IN = 'FADE_IN',
  SLIDE_UP = 'SLIDE_UP',
  SCALE_UP = 'SCALE_UP',
  KARAOKE_HIGHLIGHT = 'KARAOKE_HIGHLIGHT', // Highlights active word/phrase
}

export interface StyleConfig {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  backgroundOpacity: number;
  animationType: AnimationType;
  positionY: number; // % from top
  positionX: number; // % from left
  fontWeight: string;
}

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'transcribing' | 'success' | 'error';
  message?: string;
  progress?: number;
}
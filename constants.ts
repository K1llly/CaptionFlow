import { StyleConfig, AnimationType } from './types';

export const DEFAULT_STYLE: StyleConfig = {
  fontFamily: 'Montserrat',
  fontSize: 32,
  textColor: '#FFFFFF',
  borderColor: '#000000',
  borderWidth: 4,
  backgroundColor: '#000000',
  backgroundOpacity: 0.0, // Transparent background by default for "Reels" look
  animationType: AnimationType.SCALE_UP,
  positionY: 70,
  positionX: 50,
  fontWeight: '900',
};

export const FONTS = [
  'Montserrat',
  'Bebas Neue',
  'Inter',
  'Roboto Mono',
  'Arial',
  'Comic Sans MS',
];

export const ANIMATIONS = [
  { value: AnimationType.NONE, label: 'None' },
  { value: AnimationType.FADE_IN, label: 'Fade In' },
  { value: AnimationType.SLIDE_UP, label: 'Slide Up' },
  { value: AnimationType.SCALE_UP, label: 'Pop (TikTok)' },
  { value: AnimationType.KARAOKE_HIGHLIGHT, label: 'Karaoke Active' },
];
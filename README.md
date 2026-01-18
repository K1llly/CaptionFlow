<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CaptionFlow Pro

**AI-Powered Video Caption Generator**

Generate, edit, and export professional video captions automatically using Google's Gemini AI.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-2.5_Flash-4285F4?logo=google)](https://ai.google.dev/)

---

## Overview

CaptionFlow Pro is a modern web application that automatically generates captions for videos using Google's Gemini 2.5 Flash AI model. Upload your video, let AI transcribe the audio, customize the caption styling, and export a fully captioned video — all from your browser.

Perfect for content creators, social media managers, and anyone looking to add professional captions to their videos quickly.

**View in AI Studio:** https://ai.studio/apps/drive/18ADmVW3-RSWKtPlHkqeRp_LAOE81by6a

## Features

### AI-Powered Transcription
- Automatic caption generation using **Gemini 2.5 Flash**
- Accurate speech-to-text conversion with timestamps
- Support for Turkish language transcription

### Video Support
- **Supported formats:** MP4, MOV, WebM
- **Maximum file size:** 1GB
- Real-time video preview with caption overlay

### Caption Editing
- Edit caption text and timing directly
- Add manual captions at current playback position
- Split captions to divide timing segments
- Delete or reorder captions as needed

### Styling & Customization
- **Fonts:** Montserrat, Bebas Neue, Inter, Roboto Mono, Arial, Comic Sans MS
- **Colors:** Customize text, border, and background colors
- **Positioning:** Precise X/Y placement control (percentage-based)
- **Typography:** Adjustable font size, weight, and border width
- **Background opacity:** Control caption background transparency

### Animations
| Animation | Description |
|-----------|-------------|
| None | Static captions |
| Fade In | Smooth opacity transition |
| Slide Up | Captions slide in from below |
| Pop (TikTok) | Scale-up effect popular on social media |
| Karaoke Highlight | Word-by-word highlighting during playback |

### Export
- Export captioned videos as **WebM format**
- High-quality rendering at **30fps**
- Captions burned directly into video

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type-safe development |
| Vite | Build tool & dev server |
| Google GenAI SDK | Gemini AI integration |
| Lucide React | Icon components |
| clsx | Conditional CSS classes |

## Project Structure

```
captionflow-pro/
├── components/
│   ├── CaptionList.tsx      # Caption list with editing controls
│   ├── StyleToolbar.tsx     # Caption styling panel
│   ├── Timeline.tsx         # Video timeline scrubber
│   └── VideoPlayer.tsx      # Video player with caption overlay
├── services/
│   └── geminiService.ts     # Gemini AI API integration
├── App.tsx                  # Main application component
├── index.tsx                # Application entry point
├── constants.ts             # Default styles and configuration
├── types.ts                 # TypeScript type definitions
├── utils.ts                 # Utility functions
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Google AI Studio API Key](https://aistudio.google.com/app/apikey)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/K1llly/CaptionFlow.git
   cd CaptionFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to `http://localhost:5173` (or the URL shown in terminal)

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

## Usage

1. **Upload a Video**
   - Click the upload area or drag and drop a video file
   - Supported formats: MP4, MOV, WebM (max 1GB)

2. **Generate Captions**
   - Click "Generate Captions" to start AI transcription
   - Wait for Gemini AI to process the audio

3. **Edit Captions**
   - Click on any caption to edit text or timing
   - Use the split button to divide captions
   - Add manual captions at the current playback position

4. **Customize Styling**
   - Use the right panel to adjust fonts, colors, and positioning
   - Select animation effects for caption appearance
   - Preview changes in real-time on the video

5. **Export Video**
   - Click "Export Video" when satisfied with your captions
   - The video will be rendered with burned-in captions
   - Download as `captioned_video.webm`

## Default Caption Style

The application comes with a TikTok-inspired default style:

| Property | Default Value |
|----------|---------------|
| Font | Montserrat |
| Size | 32px |
| Weight | 900 (Black) |
| Text Color | White |
| Border | 4px Black |
| Background | Transparent |
| Position | Center (X: 50%, Y: 70%) |
| Animation | Pop (Scale Up) |

## API Reference

### Caption Object
```typescript
interface Caption {
  id: string;
  start: string;      // Format: "HH:MM:SS.mmm"
  end: string;        // Format: "HH:MM:SS.mmm"
  text: string;
  style?: StyleConfig;
}
```

### Style Configuration
```typescript
interface StyleConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  backgroundOpacity: number;
  positionX: number;  // Percentage (0-100)
  positionY: number;  // Percentage (0-100)
  animation: AnimationType;
}
```

### Animation Types
```typescript
enum AnimationType {
  NONE = 'none',
  FADE_IN = 'fade_in',
  SLIDE_UP = 'slide_up',
  SCALE_UP = 'scale_up',
  KARAOKE_HIGHLIGHT = 'karaoke_highlight'
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private. All rights reserved.

## Acknowledgments

- Built with [Google Gemini AI](https://ai.google.dev/)
- Generated from [google-gemini/aistudio-repository-template](https://github.com/google-gemini/aistudio-repository-template)
- Icons by [Lucide](https://lucide.dev/)

---

<div align="center">

**[Report Bug](https://github.com/K1llly/CaptionFlow/issues)** | **[Request Feature](https://github.com/K1llly/CaptionFlow/issues)**

</div>

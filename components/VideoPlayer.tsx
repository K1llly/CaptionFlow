import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Caption, StyleConfig, AnimationType } from '../types';
import { parseTime, getEffectiveStyle } from '../utils';
import { Play, Pause } from 'lucide-react';

interface VideoPlayerProps {
  videoSrc: string | null;
  captions: Caption[];
  styleConfig: StyleConfig;
  onStyleChange: (newConfig: StyleConfig) => void;
  onCaptionChange: (id: string, updates: Partial<Caption>) => void; // Added for individual drag updates
  currentTime: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onEnded: () => void;
  onPlayToggle: () => void;
}

export interface VideoPlayerHandle {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({
  videoSrc,
  captions,
  styleConfig,
  onStyleChange,
  onCaptionChange,
  currentTime,
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onEnded,
  onPlayToggle,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined);
  
  // Drag state
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [activeCaptionId, setActiveCaptionId] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    videoElement: videoRef.current,
    canvasElement: canvasRef.current,
  }));

  // Sync Play/Pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.error("Play error:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    onDurationChange(video.duration);
    if (video.videoWidth && video.videoHeight) {
        setAspectRatio(video.videoWidth / video.videoHeight);
    }
  };

  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
        videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Helper to find caption based on a specific time (not just state)
  const findCaptionAtTime = (time: number) => {
    return captions.find(c => {
        const start = parseTime(c.start);
        const end = parseTime(c.end);
        return time >= start && time <= end;
    });
  };

  // Canvas Drawing & Animation Loop
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');

      if (video && canvas && ctx) {
        if (video.videoWidth && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        if (canvas.width > 0 && canvas.height > 0) {
            // 1. Clear & Draw Video
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // 2. Draw Caption using LIVE video time for perfect sync
            // We use video.currentTime instead of the 'currentTime' prop which might be slightly lagged via React state
            const liveTime = video.currentTime;
            const activeCaption = findCaptionAtTime(liveTime);

            if (activeCaption) {
                // Merge global style with individual caption style
                const effectiveStyle = getEffectiveStyle(styleConfig, activeCaption);
                drawCaption(ctx, activeCaption.text, canvas.width, canvas.height, effectiveStyle);
            }
        }
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [captions, styleConfig]); // Removed currentTime from dependency to avoid loop re-creation, we read live time inside loop

  const drawCaption = (
    ctx: CanvasRenderingContext2D,
    text: string,
    width: number,
    height: number,
    config: StyleConfig
  ) => {
    const {
      fontFamily,
      fontSize,
      textColor,
      borderColor,
      borderWidth,
      backgroundColor,
      backgroundOpacity,
      positionY,
      positionX,
      fontWeight,
      animationType
    } = config;

    // Responsive Scaling
    const scaleFactor = Math.min(width, height) / 720;
    const scaledFontSize = fontSize * scaleFactor;

    ctx.font = `${fontWeight} ${scaledFontSize}px "${fontFamily}"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Word Wrapping
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];
    const maxLineWidth = width * 0.9; 

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width < maxLineWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);

    const lineHeight = scaledFontSize * 1.3;
    const totalBlockHeight = lines.length * lineHeight;
    
    // Position Calculation (Coordinates)
    const x = (positionX / 100) * width;
    const y = (positionY / 100) * height;

    // Background
    if (backgroundOpacity > 0) {
      ctx.save();
      ctx.fillStyle = backgroundColor;
      ctx.globalAlpha = backgroundOpacity;
      
      const maxWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
      const padding = 20 * scaleFactor;
      
      const bgX = x - (maxWidth / 2) - padding;
      const bgY = y - (totalBlockHeight / 2) - padding;
      const bgW = maxWidth + padding * 2;
      const bgH = totalBlockHeight + padding * 2;
      
      // Rounded rect simple approx
      ctx.fillRect(bgX, bgY, bgW, bgH);
      ctx.restore();
    }

    let fill = textColor;
    if (animationType === AnimationType.KARAOKE_HIGHLIGHT) {
       fill = '#34d399'; 
    }

    // Shadow
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 4 * scaleFactor;
    ctx.shadowOffsetX = 2 * scaleFactor;
    ctx.shadowOffsetY = 2 * scaleFactor;

    lines.forEach((line, index) => {
      // Center vertical alignment of block around Y
      // We start drawing from top of the block + half line height
      const startY = y - ((lines.length - 1) * lineHeight) / 2;
      const lineY = startY + (index * lineHeight);
      
      if (borderWidth > 0) {
        ctx.lineWidth = borderWidth * scaleFactor;
        ctx.strokeStyle = borderColor;
        ctx.strokeText(line, x, lineY);
      }
      
      ctx.fillStyle = fill;
      ctx.fillText(line, x, lineY);
    });
    
    ctx.shadowColor = "transparent";
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onTimeUpdate(time);
    }
  };

  // Dragging Logic
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if(!canvas || !videoRef.current) return;

    // Use live time for hit testing too
    const activeCaption = findCaptionAtTime(videoRef.current.currentTime);
    if (!activeCaption) return;

    const effectiveStyle = getEffectiveStyle(styleConfig, activeCaption);

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert click to percentage of the visual element
    const clickPercX = (clickX / rect.width) * 100;
    const clickPercY = (clickY / rect.height) * 100;

    // Hit tolerance
    const hitToleranceX = 20; 
    const hitToleranceY = 15;

    if (Math.abs(clickPercX - effectiveStyle.positionX) < hitToleranceX && 
        Math.abs(clickPercY - effectiveStyle.positionY) < hitToleranceY) {
        setIsDraggingText(true);
        setActiveCaptionId(activeCaption.id);
    } else {
        // Toggle play if not clicking text
        onPlayToggle();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingText || !canvasRef.current || !activeCaptionId) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    // Convert to percentage
    const newPercX = Math.max(0, Math.min(100, (currentX / rect.width) * 100));
    const newPercY = Math.max(0, Math.min(100, (currentY / rect.height) * 100));

    // Update INDIVIDUAL caption style, not global
    const activeCaption = captions.find(c => c.id === activeCaptionId);
    if (activeCaption) {
        onCaptionChange(activeCaption.id, {
            style: {
                ...activeCaption.style, // Preserve other overrides
                positionX: newPercX,
                positionY: newPercY
            }
        });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingText(false);
    setActiveCaptionId(null);
  };

  if (!videoSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 border-2 border-dashed border-slate-700 rounded-lg text-slate-500">
        <p>No video selected</p>
      </div>
    );
  }

  return (
    <div 
        className="relative flex flex-col bg-black rounded-lg overflow-hidden group shadow-2xl max-h-full max-w-full"
        style={{ aspectRatio: aspectRatio ? `${aspectRatio}` : 'auto' }}
    >
      <div ref={containerRef} className="relative flex-grow flex items-center justify-center bg-black w-full h-full">
        <video
          ref={videoRef}
          src={videoSrc}
          className="hidden"
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={onEnded}
          crossOrigin="anonymous"
          playsInline
        />
        <canvas 
          ref={canvasRef} 
          className={`w-full h-full object-contain block ${isDraggingText ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
        <input
          type="range"
          min={0}
          max={videoRef.current?.duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full mb-2 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500 pointer-events-auto"
        />
        <div className="flex items-center justify-between text-white pointer-events-auto">
          <button onClick={onPlayToggle} className="p-2 hover:bg-white/10 rounded-full">
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <span className="text-sm font-mono">
            {new Date(currentTime * 1000).toISOString().substr(14, 5)} / 
            {videoRef.current?.duration ? new Date(videoRef.current.duration * 1000).toISOString().substr(14, 5) : "00:00"}
          </span>
        </div>
      </div>
    </div>
  );
});

export default VideoPlayer;
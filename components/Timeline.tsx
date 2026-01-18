import React, { useRef, useState, useEffect } from 'react';
import { Caption } from '../types';
import { parseTime, formatTime } from '../utils';
import { ZoomIn, ZoomOut, Plus } from 'lucide-react';

interface TimelineProps {
  duration: number;
  currentTime: number;
  captions: Caption[];
  onCaptionChange: (id: string, updates: Partial<Caption>) => void;
  onSeek: (time: number) => void;
  onAddCaption: () => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  captions,
  onCaptionChange,
  onSeek,
  onAddCaption,
  onScrubStart,
  onScrubEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(60); // pixels per second - slightly zoomed in by default
  const [dragging, setDragging] = useState<{
    id?: string;
    type: 'move' | 'resize-left' | 'resize-right' | 'playhead';
    startX: number;
    initialStart?: number;
    initialEnd?: number;
  } | null>(null);

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(10, Math.min(300, prev + delta)));
  };

  const pixelsToTime = (px: number) => px / zoom;
  const timeToPixels = (time: number) => time * zoom;

  // Calculate the maximum extent of the timeline content
  // This ensures that even if 'duration' is reported incorrectly (e.g., 0), 
  // we still show enough timeline to edit the existing captions.
  const maxCaptionTime = captions.reduce((max, c) => Math.max(max, parseTime(c.end)), 0);
  const effectiveDuration = Math.max(duration || 0, maxCaptionTime + 5); // +5s padding
  const totalWidth = Math.max(containerRef.current?.clientWidth || 0, effectiveDuration * zoom);

  const handleMouseDown = (
    e: React.MouseEvent,
    id: string,
    type: 'move' | 'resize-left' | 'resize-right',
    start: number,
    end: number
  ) => {
    e.stopPropagation();
    setDragging({
      id,
      type,
      startX: e.clientX,
      initialStart: start,
      initialEnd: end,
    });
  };

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onScrubStart) onScrubStart();
    setDragging({
        type: 'playhead',
        startX: e.clientX,
    });
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (dragging) return;
    if (!containerRef.current) return;
    
    // Simple click-to-seek logic
    const rect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const newTime = Math.max(0, Math.min(effectiveDuration, pixelsToTime(offsetX)));
    onSeek(newTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;

      // Handle Playhead Dragging
      if (dragging.type === 'playhead') {
          if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const offsetX = e.clientX - rect.left + containerRef.current.scrollLeft;
              // Clamp to duration to prevent dragging into void
              const newTime = Math.max(0, Math.min(effectiveDuration, pixelsToTime(offsetX)));
              onSeek(newTime);
          }
          return;
      }

      // Handle Caption Dragging
      if (!dragging.id || dragging.initialStart === undefined || dragging.initialEnd === undefined) return;

      const deltaPixels = e.clientX - dragging.startX;
      const deltaTime = pixelsToTime(deltaPixels);

      let newStart = dragging.initialStart;
      let newEnd = dragging.initialEnd;

      if (dragging.type === 'move') {
        newStart = Math.max(0, dragging.initialStart + deltaTime);
        newEnd = Math.max(newStart + 0.1, dragging.initialEnd + deltaTime); 
      } else if (dragging.type === 'resize-left') {
        newStart = Math.max(0, Math.min(dragging.initialEnd - 0.2, dragging.initialStart + deltaTime));
      } else if (dragging.type === 'resize-right') {
        newEnd = Math.max(dragging.initialStart + 0.2, dragging.initialEnd + deltaTime);
      }

      onCaptionChange(dragging.id, {
        start: formatTime(newStart),
        end: formatTime(newEnd),
      });
    };

    const handleMouseUp = () => {
      if (dragging?.type === 'playhead' && onScrubEnd) {
        onScrubEnd();
      }
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, zoom, onCaptionChange, onSeek, effectiveDuration, onScrubEnd]);

  return (
    <div className="flex flex-col h-56 bg-slate-900 border-t border-slate-700 select-none">
      <div className="h-10 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900 z-10">
        <div className="flex items-center gap-4">
             <span className="text-xs text-slate-400 font-mono">Timeline</span>
             <button 
                onClick={onAddCaption}
                className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
            >
                <Plus size={12} /> Add
            </button>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => handleZoom(-10)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                <ZoomOut size={16} />
            </button>
            <span className="text-xs text-slate-500 w-12 text-center">{zoom}px/s</span>
            <button onClick={() => handleZoom(10)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                <ZoomIn size={16} />
            </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-grow overflow-x-auto overflow-y-hidden relative bg-slate-950 custom-scrollbar"
        onMouseDown={handleTimelineClick}
      >
        <div 
            className="relative h-full"
            style={{ width: `${totalWidth}px`, minWidth: '100%' }}
        >
            {/* Time Ruler */}
            <div className="absolute top-0 left-0 right-0 h-6 border-b border-slate-800 pointer-events-none z-10 bg-slate-900/50 backdrop-blur-sm">
                {Array.from({ length: Math.ceil(effectiveDuration) + 1 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="absolute top-0 bottom-0 border-l border-slate-700/50 text-[10px] text-slate-500 pl-1 select-none"
                        style={{ left: `${timeToPixels(i)}px` }}
                    >
                        {i % 2 === 0 && <span>{formatTime(i).split('.')[0]}</span>}
                        {/* Sub-markers */}
                        <div className="absolute top-4 left-1/2 w-px h-1 bg-slate-800" style={{ transform: `translateX(${timeToPixels(0.5)}px)` }} />
                    </div>
                ))}
            </div>

            {/* Captions Track */}
            <div className="absolute top-8 left-0 right-0 h-full">
                {captions.map((caption) => {
                    const start = parseTime(caption.start);
                    const end = parseTime(caption.end);
                    const width = Math.max(10, timeToPixels(end - start));
                    const left = timeToPixels(start);
                    const isSelected = dragging?.id === caption.id;

                    return (
                        <div
                            key={caption.id}
                            className={`absolute top-2 h-10 rounded-lg overflow-hidden group border cursor-pointer select-none shadow-sm transition-opacity ${
                                isSelected 
                                    ? 'bg-blue-600 border-blue-400 z-30 opacity-100 ring-2 ring-blue-400/50' 
                                    : 'bg-blue-900/60 border-blue-500/50 hover:bg-blue-800 hover:border-blue-400 z-20'
                            }`}
                            style={{ left: `${left}px`, width: `${width}px` }}
                            onMouseDown={(e) => handleMouseDown(e, caption.id, 'move', start, end)}
                        >
                            {/* Drag Handle Left */}
                            <div 
                                className="absolute left-0 top-0 bottom-0 w-3 cursor-w-resize hover:bg-white/20 z-20 flex items-center justify-center"
                                onMouseDown={(e) => handleMouseDown(e, caption.id, 'resize-left', start, end)}
                            >
                                <div className="w-0.5 h-4 bg-white/20 rounded-full" />
                            </div>
                            
                            <div className="px-4 py-1 text-[11px] text-white/90 truncate w-full h-full pointer-events-none flex items-center justify-center font-medium leading-tight">
                                {caption.text}
                            </div>

                            {/* Drag Handle Right */}
                            <div 
                                className="absolute right-0 top-0 bottom-0 w-3 cursor-e-resize hover:bg-white/20 z-20 flex items-center justify-center"
                                onMouseDown={(e) => handleMouseDown(e, caption.id, 'resize-right', start, end)}
                            >
                                <div className="w-0.5 h-4 bg-white/20 rounded-full" />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Playhead */}
            <div 
                className="absolute top-0 bottom-0 w-0 z-50 cursor-ew-resize group/playhead"
                style={{ left: `${timeToPixels(currentTime)}px` }}
                onMouseDown={handlePlayheadMouseDown}
            >
                 {/* Hit area for easier grabbing (extended width) */}
                <div className="absolute top-0 bottom-0 -left-4 w-8 bg-transparent hover:bg-white/5" />
                
                {/* Visual Line */}
                <div className="absolute top-0 bottom-0 left-0 w-px bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />

                {/* Top Handle */}
                <div className="absolute -top-1.5 -left-2 w-4 h-4 bg-red-500 rounded-full shadow-md shadow-red-500/50 flex items-center justify-center transform group-hover/playhead:scale-125 transition-transform">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </div>
                
                {/* Gradient Dropdown */}
                <div className="absolute top-0 bottom-0 w-px left-0 bg-gradient-to-b from-red-500/50 to-transparent" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
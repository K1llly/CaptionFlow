import React, { useRef, useEffect } from 'react';
import { Caption } from '../types';
import { parseTime } from '../utils';
import { Clock, Type as TypeIcon, Trash2, SplitSquareHorizontal } from 'lucide-react';
import clsx from 'clsx';

interface CaptionListProps {
  captions: Caption[];
  currentTime: number;
  onCaptionChange: (id: string, updates: Partial<Caption>) => void;
  onCaptionDelete: (id: string) => void;
  onCaptionSplit: (id: string) => void;
  onSeek: (time: number) => void;
}

const CaptionList: React.FC<CaptionListProps> = ({
  captions,
  currentTime,
  onCaptionChange,
  onCaptionDelete,
  onCaptionSplit,
  onSeek
}) => {
  const activeCaptionId = captions.find(c => {
    const start = parseTime(c.start);
    const end = parseTime(c.end);
    return currentTime >= start && currentTime <= end;
  })?.id;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeCaptionId && scrollRef.current) {
        const activeEl = document.getElementById(`caption-${activeCaptionId}`);
        if (activeEl) {
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
  }, [activeCaptionId]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700 w-96 flex-shrink-0">
      <div className="p-4 border-b border-slate-700 bg-slate-900 z-10">
        <h3 className="text-white font-semibold flex items-center gap-2">
           <TypeIcon size={18} className="text-green-400" /> Captions ({captions.length})
        </h3>
      </div>
      
      <div className="flex-grow overflow-y-auto p-2 space-y-2" ref={scrollRef}>
        {captions.length === 0 ? (
           <div className="text-slate-500 text-center mt-10 text-sm p-4">
              No captions yet. <br/>Upload a video and generate captions to see them here.
           </div>
        ) : (
          captions.map((caption) => (
            <div
              key={caption.id}
              id={`caption-${caption.id}`}
              className={clsx(
                "p-3 rounded-lg border transition-all duration-200 group relative",
                activeCaptionId === caption.id
                  ? "bg-blue-900/20 border-blue-500/50 shadow-lg shadow-blue-500/10"
                  : "bg-slate-800 border-slate-700 hover:border-slate-600"
              )}
            >
              <div className="flex items-center gap-2 mb-2 text-xs text-slate-400 font-mono">
                <Clock size={12} />
                <input
                    type="text"
                    value={caption.start}
                    onChange={(e) => onCaptionChange(caption.id, { start: e.target.value })}
                    className="bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-20 text-center"
                    onBlur={() => onSeek(parseTime(caption.start))}
                />
                <span>→</span>
                <input
                    type="text"
                    value={caption.end}
                    onChange={(e) => onCaptionChange(caption.id, { end: e.target.value })}
                    className="bg-transparent border-b border-transparent focus:border-blue-500 outline-none w-20 text-center"
                />
                 <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onCaptionSplit(caption.id)}
                        className="p-1 text-blue-400 hover:bg-blue-500/10 rounded"
                        title="Split Caption"
                    >
                        <SplitSquareHorizontal size={14} />
                    </button>
                    <button 
                        onClick={() => onCaptionDelete(caption.id)}
                        className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                        title="Delete Caption"
                    >
                        <Trash2 size={14} />
                    </button>
                 </div>
              </div>
              <textarea
                value={caption.text}
                onChange={(e) => onCaptionChange(caption.id, { text: e.target.value })}
                className="w-full bg-slate-900/50 text-slate-200 text-sm p-2 rounded border border-transparent focus:border-blue-500 focus:bg-slate-900 outline-none resize-none"
                rows={2}
              />
              {activeCaptionId === caption.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CaptionList;
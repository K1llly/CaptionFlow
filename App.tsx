import React, { useState, useRef } from 'react';
import { FileVideo, AlertCircle, Loader2, Download, RotateCcw } from 'lucide-react';
import VideoPlayer, { VideoPlayerHandle } from './components/VideoPlayer';
import StyleToolbar from './components/StyleToolbar';
import CaptionList from './components/CaptionList';
import Timeline from './components/Timeline';
import { generateCaptions } from './services/geminiService';
import { Caption, StyleConfig, ProcessingState } from './types';
import { DEFAULT_STYLE } from './constants';
import { parseTime, formatTime } from './utils';

const App: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(DEFAULT_STYLE);
  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle' });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playerRef = useRef<VideoPlayerHandle>(null);

  // Derive active caption for Toolbar context
  const activeCaption = captions.find(c => {
    const start = parseTime(c.start);
    const end = parseTime(c.end);
    return currentTime >= start && currentTime <= end;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 1024) { 
        alert("File size exceeds 1GB limit.");
        return;
      }
      setVideoFile(file);
      setVideoSrc(URL.createObjectURL(file));
      setProcessing({ status: 'idle' });
      setCaptions([]);
    }
  };

  const handleProcessVideo = async () => {
    if (!videoFile) return;
    
    setProcessing({ status: 'transcribing', message: 'Analyzing audio with Gemini 2.5 Flash...' });

    try {
      const result = await generateCaptions(videoFile, process.env.API_KEY || '');
      setCaptions(result);
      setProcessing({ status: 'success', message: 'Captions generated successfully!' });
    } catch (error: any) {
      console.error(error);
      let errorMsg = 'Failed to generate captions. Please try again.';
      if (error.message?.includes('API Key')) {
        errorMsg = 'API Key missing. Please configure process.env.API_KEY.';
      } else if (error.message?.includes('413')) {
        errorMsg = 'Video too large for direct processing.';
      }
      setProcessing({ status: 'error', message: errorMsg });
    }
  };

  const handleAddCaption = () => {
      const start = currentTime;
      const end = Math.min(duration, start + 2); // Default 2s duration
      const newCaption: Caption = {
          id: `manual-${Date.now()}`,
          start: formatTime(start),
          end: formatTime(end),
          text: "New Caption"
      };
      setCaptions(prev => [...prev, newCaption].sort((a,b) => parseTime(a.start) - parseTime(b.start)));
  };

  const handleSplitCaption = (id: string) => {
      const captionToSplit = captions.find(c => c.id === id);
      if(!captionToSplit) return;

      const start = parseTime(captionToSplit.start);
      const end = parseTime(captionToSplit.end);
      const mid = start + (end - start) / 2;

      const part1: Caption = {
          ...captionToSplit,
          end: formatTime(mid),
      };
      const part2: Caption = {
          ...captionToSplit,
          id: `${captionToSplit.id}-split`,
          start: formatTime(mid),
          text: captionToSplit.text + " (Part 2)"
      };

      setCaptions(prev => prev.map(c => c.id === id ? part1 : c).concat(part2).sort((a,b) => parseTime(a.start) - parseTime(b.start)));
  };

  // Centralized handler for caption updates (text, timing, style)
  const handleCaptionChange = (id: string, updates: Partial<Caption>) => {
      setCaptions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleExport = async () => {
    const player = playerRef.current;
    if (!player || !player.videoElement || !player.canvasElement) return;

    setProcessing({ status: 'transcribing', message: 'Rendering video... Do not close this tab.' });
    setIsPlaying(false);

    const video = player.videoElement;
    const canvas = player.canvasElement;
    const stream = canvas.captureStream(30); 
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'captioned_video.webm';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setProcessing({ status: 'success', message: 'Video exported successfully!' });
        
        video.currentTime = currentTime; 
        video.muted = false;
        video.playbackRate = 1.0;
    };

    mediaRecorder.start();

    const originalTime = video.currentTime;
    const originalMuted = video.muted;
    
    video.currentTime = 0;
    video.muted = true; 
    
    await new Promise(r => {
        const onSeek = () => {
            video.removeEventListener('seeked', onSeek);
            r(true);
        }
        video.addEventListener('seeked', onSeek);
    });

    try {
        await video.play();
        await new Promise((resolve) => {
            video.onended = resolve;
        });
        mediaRecorder.stop();
    } catch(e) {
        console.error("Export failed", e);
        setProcessing({ status: 'error', message: 'Export failed during rendering.' });
        mediaRecorder.stop();
    } finally {
        video.onended = null;
        video.muted = originalMuted;
        video.currentTime = originalTime;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-slate-900/50 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">CF</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight">CaptionFlow <span className="text-blue-400">Pro</span></h1>
        </div>
        <div className="flex items-center gap-4">
             {videoFile && processing.status === 'transcribing' && (
                <div className="flex items-center gap-2 text-blue-400 animate-pulse text-sm">
                    <Loader2 size={16} className="animate-spin" />
                    {processing.message}
                </div>
            )}
             {videoFile && processing.status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    {processing.message}
                </div>
            )}
            
            {videoFile && (
                <button
                    onClick={handleExport}
                    disabled={processing.status === 'transcribing'}
                    className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold hover:bg-slate-200 disabled:opacity-50 transition-colors text-sm"
                >
                    <Download size={16} /> Export Video
                </button>
            )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex overflow-hidden">
        
        {/* Left Sidebar: Captions */}
        <CaptionList
            captions={captions}
            currentTime={currentTime}
            onCaptionChange={handleCaptionChange}
            onCaptionDelete={(id) => setCaptions(prev => prev.filter(c => c.id !== id))}
            onCaptionSplit={handleSplitCaption}
            onSeek={(time) => {
                setCurrentTime(time);
                if (playerRef.current?.videoElement) {
                    playerRef.current.videoElement.currentTime = time;
                }
            }}
        />

        {/* Center: Video Workspace + Timeline */}
        <div className="flex-grow flex flex-col min-w-0">
            {/* Video Area */}
            <div className="flex-grow bg-slate-950 p-6 flex flex-col items-center justify-center relative min-h-0">
                {!videoFile ? (
                    <div className="text-center p-10 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50 hover:bg-slate-900/80 transition-colors">
                        <FileVideo size={64} className="mx-auto text-slate-600 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Upload your video</h2>
                        <p className="text-slate-400 mb-6 max-w-md">
                            Supports MP4, MOV, WebM. Automated Turkish transcription included.
                        </p>
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-transform active:scale-95 inline-block">
                            <input type="file" className="hidden" accept="video/*" onChange={handleFileUpload} />
                            Choose File
                        </label>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col">
                        {captions.length === 0 && processing.status !== 'transcribing' && processing.status !== 'success' && (
                             <div className="absolute top-10 left-1/2 -translate-x-1/2 z-20">
                                 <button 
                                    onClick={handleProcessVideo}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full shadow-lg shadow-purple-500/20 hover:scale-105 transition-transform font-medium"
                                >
                                    <RotateCcw size={16} /> Generate Captions (Turkish)
                                 </button>
                             </div>
                        )}
                        
                        <div className="flex-grow relative flex items-center justify-center overflow-hidden p-4">
                            <VideoPlayer
                                ref={playerRef}
                                videoSrc={videoSrc}
                                captions={captions}
                                styleConfig={styleConfig}
                                onStyleChange={setStyleConfig}
                                onCaptionChange={handleCaptionChange} // Passed for drag updates
                                currentTime={currentTime}
                                isPlaying={isPlaying}
                                onTimeUpdate={setCurrentTime}
                                onDurationChange={setDuration}
                                onEnded={() => setIsPlaying(false)}
                                onPlayToggle={() => setIsPlaying(!isPlaying)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Timeline Area (Fixed Height at Bottom of Center Col) */}
            {videoFile && (
                <Timeline 
                    duration={duration}
                    currentTime={currentTime}
                    captions={captions}
                    onCaptionChange={handleCaptionChange}
                    onAddCaption={handleAddCaption}
                    onScrubStart={() => setIsPlaying(false)}
                    onScrubEnd={() => { /* Option to resume if desired, but typically better to stay paused */ }}
                    onSeek={(time) => {
                        setCurrentTime(time);
                        if (playerRef.current?.videoElement) {
                            playerRef.current.videoElement.currentTime = time;
                        }
                    }}
                />
            )}
        </div>

        {/* Right Sidebar: Styles */}
        <StyleToolbar 
            globalConfig={styleConfig} 
            activeCaption={activeCaption}
            onGlobalChange={setStyleConfig} 
            onCaptionChange={handleCaptionChange}
        />
      </main>
    </div>
  );
};

export default App;
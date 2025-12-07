import React, { useState, useRef } from 'react';
import ReactWebcam from 'react-webcam';
import { HandState, HandGesture, PhotoData } from '../types';
import { Volume2, VolumeX, Upload, Camera, Music } from 'lucide-react';
import { AUDIO_URL } from '../constants';

interface UIProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  handState: HandState;
  isPlaying: boolean;
  setIsPlaying: (val: boolean) => void;
  onPhotoUpload: (url: string) => void;
}

export const UI: React.FC<UIProps> = ({ 
  videoRef, 
  handState, 
  isPlaying, 
  setIsPlaying,
  onPhotoUpload
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [started, setStarted] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(AUDIO_URL);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Autoplay blocked", e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleStart = () => {
    setStarted(true);
    if(audioRef.current) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          onPhotoUpload(url);
      }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const url = URL.createObjectURL(file);
        setCurrentAudio(url);
        // Auto play new music
        setIsPlaying(true);
        setTimeout(() => {
             if (audioRef.current) audioRef.current.play().catch(console.error);
        }, 100);
    }
  };

  if (!started) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white p-8 text-center font-sans">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 mb-2 tracking-tight">
          Alice
        </h1>
        <h2 className="text-2xl font-light tracking-[0.2em] text-white/90 mb-12">
          MERRY CHRISTMAS
        </h2>
        
        <p className="max-w-md text-gray-400 mb-12 leading-relaxed text-sm font-light">
           An interactive 3D particle experience.
           <br/><br/>
           🖐 <b>Spread Hand</b> to Scatter Lights<br/>
           ✊ <b>Fist</b> to Collect Gifts<br/>
           👋 <b>Tilt Hand</b> to Rotate Tree<br/>
           🤏 <b>Pinch</b> to View Memory<br/>
        </p>
        <button 
          onClick={handleStart}
          className="px-10 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm font-medium tracking-widest transition-all backdrop-blur-md border border-white/20 hover:scale-105"
        >
          ENTER EXPERIENCE
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-6 font-sans flex flex-col">
      <audio ref={audioRef} src={currentAudio} loop />

      {/* Header - Centered */}
      <header className="w-full text-center mt-2 relative z-0">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-100 via-yellow-300 to-amber-600 drop-shadow-2xl tracking-tighter leading-none">
          Alice
        </h1>
        <h2 className="text-2xl md:text-3xl font-light text-yellow-100/80 tracking-[0.2em] mt-1 uppercase">
          Merry Christmas
        </h2>
      </header>

      {/* Webcam - Top Right, Smaller */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <div className="relative group">
          <div className="w-24 h-20 md:w-32 md:h-24 bg-black/40 rounded-xl overflow-hidden border border-white/10 backdrop-blur-sm shadow-xl relative transition-transform hover:scale-105">
             <ReactWebcam
              ref={videoRef as any}
              className="w-full h-full object-cover transform scale-x-[-1] opacity-80"
              mirrored
              screenshotFormat="image/jpeg"
             />
             <div className="absolute bottom-1 left-1 flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${handState.gesture !== 'NONE' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-[8px] text-white/70 font-mono uppercase tracking-wider">
                  {handState.gesture === 'NONE' ? '-' : handState.gesture}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Controls Container - Bottom Right */}
      <div className="mt-auto flex justify-end items-center gap-4 w-full pointer-events-auto">
             {/* Music Upload - NEW */}
             <label className="bg-black/30 hover:bg-white/10 p-3 rounded-full backdrop-blur-md cursor-pointer transition-all border border-white/10 group relative">
                <input type="file" accept="audio/*" onChange={handleMusicUpload} className="hidden" />
                <Music className="w-5 h-5 text-purple-200/80" />
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white/80 px-2 py-1 rounded-md text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Change Music
                </span>
             </label>

             {/* Photo Upload */}
             <label className="bg-black/30 hover:bg-white/10 p-3 rounded-full backdrop-blur-md cursor-pointer transition-all border border-white/10 group relative">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <Upload className="w-5 h-5 text-yellow-200/80" />
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white/80 px-2 py-1 rounded-md text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Upload Memory
                </span>
             </label>

            {/* Music Toggle */}
            <button 
                onClick={toggleMusic}
                className="bg-black/30 hover:bg-white/10 p-3 rounded-full backdrop-blur-md transition-all border border-white/10"
            >
                {isPlaying ? <Volume2 className="w-5 h-5 text-green-400/80" /> : <VolumeX className="w-5 h-5 text-red-400/80" />}
            </button>
      </div>
    </div>
  );
};
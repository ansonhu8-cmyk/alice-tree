import React, { useRef, useState } from 'react';
import { Scene } from './components/Scene';
import { UI } from './components/UI';
import { useMediaPipe } from './hooks/useMediaPipe';

function App() {
  const webcamRef = useRef<HTMLVideoElement>(null);
  
  // Hand tracking logic hooks
  const handState = useMediaPipe(webcamRef);
  
  // App state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Scene handState={handState} activePhoto={activePhoto} />
      </div>

      {/* UI Overlay */}
      <UI 
        videoRef={webcamRef} 
        handState={handState} 
        isPlaying={isPlaying} 
        setIsPlaying={setIsPlaying}
        onPhotoUpload={setActivePhoto}
      />
    </div>
  );
}

export default App;
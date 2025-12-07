import { useEffect, useRef, useState } from 'react';
import { detectGesture, calculateHandRotation } from '../utils/handLogic';
import { HandState, HandGesture } from '../types';

// We access the global window object for MediaPipe as it's loaded via CDN
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

export const useMediaPipe = (videoRef: React.RefObject<any>) => {
  const [handState, setHandState] = useState<HandState>({
    gesture: HandGesture.NONE,
    x: 0,
    y: 0,
    rotation: 0,
  });

  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    let isCanceled = false;

    const startMediaPipe = async () => {
      if (!window.Hands || !window.Camera) {
        console.warn("MediaPipe scripts not loaded yet.");
        return;
      }

      // Check if we have the specific video element from ReactWebcam
      // react-webcam exposes the video node under .video property of the ref
      const videoElement = videoRef.current?.video;

      if (!videoElement) {
        return;
      }

      handsRef.current = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      handsRef.current.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      handsRef.current.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          const landmarks = results.multiHandLandmarks[0];
          
          const gesture = detectGesture(landmarks);
          const rotation = calculateHandRotation(landmarks);

          // Center point (approximate palm center)
          const palmX = landmarks[9].x; 
          const palmY = landmarks[9].y;

          // Map 0..1 to -1..1 (inverted X because webcam is mirrored usually)
          const x = (1 - palmX) * 2 - 1; 
          const y = -(palmY * 2 - 1);

          setHandState({
            gesture,
            x,
            y,
            rotation
          });
        } else {
          setHandState(prev => ({ ...prev, gesture: HandGesture.NONE }));
        }
      });

      cameraRef.current = new window.Camera(videoElement, {
        onFrame: async () => {
          if (videoElement && handsRef.current) {
            await handsRef.current.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480
      });

      cameraRef.current.start();
    };

    // Retry loop to wait for webcam to be ready
    const intervalId = setInterval(() => {
        const videoElement = videoRef.current?.video;
        if (videoElement && videoElement.readyState === 4) { // HAVE_ENOUGH_DATA
            clearInterval(intervalId);
            if (!isCanceled && !cameraRef.current) {
                startMediaPipe();
            }
        }
    }, 500);

    return () => {
      isCanceled = true;
      clearInterval(intervalId);
      if (cameraRef.current) cameraRef.current.stop();
      if (handsRef.current) handsRef.current.close();
    };
  }, [videoRef]);

  return handState;
};
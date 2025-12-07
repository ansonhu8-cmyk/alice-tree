import { HandGesture } from '../types';

// Landmarks: 0=wrist, 4=thumb_tip, 8=index_tip, 12=mid_tip, 16=ring_tip, 20=pinky_tip
// 9=middle_mcp (base of middle finger)

export const detectGesture = (landmarks: any[]): HandGesture => {
  if (!landmarks || landmarks.length === 0) return HandGesture.NONE;

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const middleMcp = landmarks[9];

  // Calculate distance between thumb and index tip
  const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

  // Calculate average distance of fingertips from wrist (simplified openness check)
  const tips = [indexTip, middleTip, ringTip, pinkyTip];
  let avgDistFromWrist = 0;
  tips.forEach(tip => {
    avgDistFromWrist += Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
  });
  avgDistFromWrist /= 4;

  // Reference distance (wrist to middle knuckle) to normalize scale
  const palmScale = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y);
  
  // Normalized metrics
  const normalizedSpread = avgDistFromWrist / palmScale;
  const normalizedPinch = pinchDist / palmScale;

  // Logic Tree
  if (normalizedSpread < 1.0) {
    return HandGesture.FIST; // Fingers curled in
  } else if (normalizedPinch < 0.2) {
    return HandGesture.PINCH; // Thumb and index close
  } else {
    return HandGesture.OPEN; // Hand spread
  }
};

export const calculateHandRotation = (landmarks: any[]): number => {
  // Use Wrist (0) and Middle Finger MCP (9) to determine upright rotation
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const dx = middleMcp.x - wrist.x;
  const dy = middleMcp.y - wrist.y;
  // Calculate angle, roughly 0 when upright vertical
  return Math.atan2(dx, -dy); 
};

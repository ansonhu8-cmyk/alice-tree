export enum HandGesture {
  NONE = 'NONE',
  OPEN = 'OPEN',     // Spread fingers -> Scatter tree
  FIST = 'FIST',     // Closed fist -> Contract tree
  PINCH = 'PINCH',   // Index+Thumb -> Grab/Zoom Photo
}

export interface TreeConfig {
  particleCount: number;
  colors: string[];
  height: number;
  radius: number;
}

export interface HandState {
  gesture: HandGesture;
  x: number; // Normalized -1 to 1 (screen center 0)
  y: number; // Normalized -1 to 1
  rotation: number; // Hand rotation roll
}

export interface PhotoData {
  id: string;
  url: string;
}

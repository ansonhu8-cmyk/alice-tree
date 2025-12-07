import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { TreeParticles } from './TreeParticles';
import { HandState, PhotoData } from '../types';

interface SceneProps {
  handState: HandState;
  activePhoto: string | null;
}

export const Scene: React.FC<SceneProps> = ({ handState, activePhoto }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 18], fov: 40 }}
      gl={{ antialias: false, toneMappingExposure: 1.5 }}
      dpr={[1, 2]} 
    >
      <Suspense fallback={null}>
        <color attach="background" args={['#020205']} />
        
        {/* Background Environment */}
        <Stars radius={150} depth={50} count={3000} factor={4} saturation={0.5} fade speed={0.5} />
        <Sparkles count={250} scale={15} size={4} speed={0.3} opacity={0.6} color="#FFD700" />

        {/* Lighting - Warm and Dramatic */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 20, 10]} angle={0.3} penumbra={1} intensity={25} color="#ffeedd" castShadow />
        <pointLight position={[-10, 0, -10]} intensity={8} color="#ffd700" />
        <pointLight position={[0, -5, 8]} intensity={5} color="#ff4400" />

        {/* PBR Environment Reflection */}
        <Environment preset="city" blur={0.5} background={false} />

        {/* The Tree */}
        <TreeParticles handState={handState} photoUrl={activePhoto} />

        {/* Post Processing */}
        <EffectComposer disableNormalPass>
          {/* Strong bloom for the lights */}
          <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={2.5} 
            radius={0.4} 
          />
          <Vignette eskil={false} offset={0.1} darkness={0.5} />
        </EffectComposer>

        <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            minPolarAngle={Math.PI / 2.5} 
            maxPolarAngle={Math.PI / 1.5}
            dampingFactor={0.05}
        />
      </Suspense>
    </Canvas>
  );
};
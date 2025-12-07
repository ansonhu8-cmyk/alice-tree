import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HandState, HandGesture } from '../types';
import { TREE_COLORS } from '../constants';

interface TreeParticlesProps {
  handState: HandState;
  photoUrl?: string | null;
}

const OBJ_COUNT = 2500; // Increased count for higher coverage
const LIGHT_COUNT = 1500; // More lights
const DUMMY = new THREE.Object3D();
const COLOR = new THREE.Color();

export const TreeParticles: React.FC<TreeParticlesProps> = ({ handState, photoUrl }) => {
  const sphereMesh = useRef<THREE.InstancedMesh>(null);
  const cubeMesh = useRef<THREE.InstancedMesh>(null);
  const lightMesh = useRef<THREE.InstancedMesh>(null);
  
  // State for smooth transitions
  const expansionRef = useRef(1); // 0 = contracted (fist), 1 = normal, 2+ = exploded
  const rotationGroupRef = useRef<THREE.Group>(null);
  const targetRotationRef = useRef(0);
  const pinchScaleRef = useRef(0);

  // Memoize texture loading to prevent per-frame reloading
  const photoTexture = useMemo(() => {
    if (!photoUrl) return null;
    return new THREE.TextureLoader().load(photoUrl);
  }, [photoUrl]);

  // Generate main geometry particles
  const particles = useMemo(() => {
    const temp = [];
    // Tree Dimensions - Made smaller to not overlap text
    const treeHeight = 9; 
    const maxRadius = 3.5;

    for (let i = 0; i < OBJ_COUNT; i++) {
      // Golden Spiral / Cone distribution
      const y = Math.random() * treeHeight; 
      const radiusAtHeight = (treeHeight - y) * (maxRadius / treeHeight); 
      
      const angle = i * 2.4; 
      const r = radiusAtHeight + (Math.random() - 0.5) * 0.6; 
      
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      
      // Much smaller particles for "glitter" look
      const scale = Math.random() * 0.08 + 0.02;
      const type = Math.random() > 0.6 ? 'cube' : 'sphere'; 
      const color = TREE_COLORS[Math.floor(Math.random() * TREE_COLORS.length)];

      // Center the tree vertically around 0 relative to the group
      temp.push({ x, y: y - (treeHeight/2), z, scale, type, color, angle, r, originalY: y - (treeHeight/2), speed: Math.random() });
    }
    return temp;
  }, []);

  // Generate fairy light particles
  const lightParticles = useMemo(() => {
    const temp = [];
    const treeHeight = 9.5;
    const maxRadius = 3.8;

    for (let i = 0; i < LIGHT_COUNT; i++) {
        const y = Math.random() * treeHeight;
        const radiusAtHeight = (treeHeight - y) * (maxRadius / treeHeight);
        const angle = i * 0.5 + Math.random(); 
        const r = radiusAtHeight + (Math.random() - 0.5) * 0.4;

        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        
        // Tiny lights
        const scale = Math.random() * 0.04 + 0.01;
        
        temp.push({ x, y: y - (treeHeight/2), z, scale, angle, r, originalY: y - (treeHeight/2), speed: Math.random() * 2 + 1 });
    }
    return temp;
  }, []);

  // Set colors once
  useEffect(() => {
    if (!sphereMesh.current || !cubeMesh.current) return;
    
    let sphereIdx = 0;
    let cubeIdx = 0;

    particles.forEach((p) => {
      COLOR.set(p.color);
      // Brighter colors
      COLOR.multiplyScalar(1.5);
      
      if (p.type === 'sphere' && sphereMesh.current) {
        sphereMesh.current.setColorAt(sphereIdx++, COLOR);
      } else if (p.type === 'cube' && cubeMesh.current) {
        cubeMesh.current.setColorAt(cubeIdx++, COLOR);
      }
    });

    if (sphereMesh.current) sphereMesh.current.instanceColor!.needsUpdate = true;
    if (cubeMesh.current) cubeMesh.current.instanceColor!.needsUpdate = true;
    
    // Set Light colors (Warm Glow)
    if (lightMesh.current) {
        const warmColors = [new THREE.Color("#FFD700"), new THREE.Color("#FFCC00"), new THREE.Color("#FF4400"), new THREE.Color("#FFFFDD")];
        for (let i = 0; i < LIGHT_COUNT; i++) {
            lightMesh.current.setColorAt(i, warmColors[Math.floor(Math.random() * warmColors.length)]);
        }
        lightMesh.current.instanceColor!.needsUpdate = true;
    }

  }, [particles, lightParticles]);

  useFrame((state, delta) => {
    // 1. Handle Hand State -> Expansion Factor
    let targetExpansion = 1.0;
    if (handState.gesture === HandGesture.FIST) {
      targetExpansion = 0.1; // Tight cluster
    } else if (handState.gesture === HandGesture.OPEN) {
      targetExpansion = 2.8; // Big Explosion
    } else if (handState.gesture === HandGesture.PINCH) {
        targetExpansion = 1.0; 
    }

    // Smooth lerp for expansion
    expansionRef.current = THREE.MathUtils.lerp(expansionRef.current, targetExpansion, delta * 3);

    // 2. Handle Rotation (Hand Tilt controls spin speed)
    let rotInput = 0;
    if (Math.abs(handState.rotation) > 0.3) {
        rotInput = handState.rotation * 0.5; // Slowed down manual control
    }
    
    const autoSpeed = 0.05; // Slowed down auto-rotation
    targetRotationRef.current += (autoSpeed + rotInput) * delta;
    
    if (rotationGroupRef.current) {
        rotationGroupRef.current.rotation.y = THREE.MathUtils.lerp(
            rotationGroupRef.current.rotation.y, 
            targetRotationRef.current, 
            0.1
        );
    }

    // Pinch Zoom effect
    const targetPinch = handState.gesture === HandGesture.PINCH ? 1 : 0;
    pinchScaleRef.current = THREE.MathUtils.lerp(pinchScaleRef.current, targetPinch, delta * 4);


    const time = state.clock.getElapsedTime();
    const exp = expansionRef.current;

    // 3. Update Main Particles (Spheres/Cubes)
    let sphereIdx = 0;
    let cubeIdx = 0;

    particles.forEach((p, i) => {
      const { angle, r, originalY, scale, type, speed } = p;
      
      const currentR = r * exp;
      const currentY = originalY * (exp < 0.5 ? 0.3 + exp : 1); 

      // Organic floating
      const floatY = Math.sin(time * speed + i * 0.05) * 0.1 * exp;
      
      DUMMY.position.set(
        Math.cos(angle) * currentR,
        currentY + floatY,
        Math.sin(angle) * currentR
      );

      // Rotate individual pieces
      DUMMY.rotation.set(time * 0.5 * speed, time * 0.3 * speed, 0);
      
      // Scale down when fist closed to avoid clipping artifacts
      DUMMY.scale.setScalar(scale * (exp < 0.2 ? exp * 5 : 1));
      DUMMY.updateMatrix();

      if (type === 'sphere' && sphereMesh.current) {
        sphereMesh.current.setMatrixAt(sphereIdx++, DUMMY.matrix);
      } else if (type === 'cube' && cubeMesh.current) {
        cubeMesh.current.setMatrixAt(cubeIdx++, DUMMY.matrix);
      }
    });

    // 4. Update Fairy Lights
    if (lightMesh.current) {
        lightParticles.forEach((p, i) => {
            const { angle, r, originalY, scale, speed } = p;
            
            // Lights scatter slightly more
            const currentR = r * (exp * 1.1);
            const currentY = originalY * (exp < 0.5 ? 0.4 + exp : 1);
            
            // Twinkle effect
            const twinkle = Math.sin(time * speed * 3 + i) * 0.3 + 0.7;

            DUMMY.position.set(
                Math.cos(angle + time * 0.1) * currentR, // Lights orbit slowly
                currentY + Math.cos(time * speed) * 0.1,
                Math.sin(angle + time * 0.1) * currentR
            );
            DUMMY.scale.setScalar(scale * twinkle * (exp < 0.1 ? 0 : 1));
            DUMMY.updateMatrix();
            lightMesh.current!.setMatrixAt(i, DUMMY.matrix);
        });
        lightMesh.current.instanceMatrix.needsUpdate = true;
    }

    if (sphereMesh.current) sphereMesh.current.instanceMatrix.needsUpdate = true;
    if (cubeMesh.current) cubeMesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    // Move the entire tree down slightly so it doesn't hit the top text
    <group ref={rotationGroupRef} position={[0, -2.0, 0]}>
      {/* Metallic Spheres - Glowing */}
      <instancedMesh ref={sphereMesh} args={[undefined, undefined, OBJ_COUNT]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial 
            roughness={0.1} 
            metalness={1.0} 
            envMapIntensity={2.0}
            emissive="#B8860B"
            emissiveIntensity={0.5}
        />
      </instancedMesh>
      
      {/* Metallic Cubes - Glowing */}
      <instancedMesh ref={cubeMesh} args={[undefined, undefined, OBJ_COUNT]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial 
            roughness={0.05} 
            metalness={1.0} 
            envMapIntensity={2.5}
            emissive="#8B0000"
            emissiveIntensity={0.3}
        />
      </instancedMesh>

      {/* Fairy Lights (Glowing Points) */}
      <instancedMesh ref={lightMesh} args={[undefined, undefined, LIGHT_COUNT]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial 
            toneMapped={false}
            color="#FFD700"
        />
      </instancedMesh>

      {/* Top Decoration - Diamond/Octahedron - Moved relative to new tree height */}
      <mesh position={[0, 4.8, 0]}>
        <octahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial 
            color="#FFFF00" 
            emissive="#FFFF00"
            emissiveIntensity={4}
            toneMapped={false}
        />
      </mesh>

        {/* Photo Display Interaction */}
       {photoTexture && (
          <group scale={pinchScaleRef.current}>
             <mesh position={[0, 0, 4]}>
                <planeGeometry args={[5, 5]} />
                <meshBasicMaterial side={THREE.DoubleSide} transparent opacity={pinchScaleRef.current} map={photoTexture} />
             </mesh>
             {/* Frame for photo */}
             <mesh position={[0, 0, 3.99]}>
                <planeGeometry args={[5.2, 5.2]} />
                <meshStandardMaterial color="#B8860B" metalness={1} roughness={0.2} transparent opacity={pinchScaleRef.current} />
             </mesh>
          </group>
       )}
    </group>
  );
};
'use client';

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useHelper, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export default function Lighting() {
  const lampRef = useRef();
  const windowRef = useRef();
  const rimLeftRef = useRef();
  const rimRightRef = useRef();
  const { scene } = useThree();
  
  useHelper(lampRef, THREE.SpotLightHelper, 'gold');
  useHelper(windowRef, THREE.SpotLightHelper, 'cyan');
  useHelper(rimLeftRef, THREE.SpotLightHelper, 'white');
  useHelper(rimRightRef, THREE.SpotLightHelper, 'blue');

  useEffect(() => {
    if (lampRef.current && lampRef.current.shadow) {
      const helper = new THREE.CameraHelper(lampRef.current.shadow.camera);
      scene.add(helper);
      return () => scene.remove(helper);
    }
  }, [scene]);

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={0.06} color="#ffffff" />

      {/* Dominant Left Lamp */}
      <spotLight 
        ref={lampRef}
        position={[-10, 5, 5]} 
        angle={0.8}
        penumbra={1}
        intensity={3200} 
        decay={2}
        color="#ffcc88" 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.05}
      >
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 0.1, 50]} />
      </spotLight>

      {/* Ambient Right Window (Subtle Fill) */}
      <spotLight 
        ref={windowRef}
        position={[20, 0, 5]} 
        angle={0.6}
        penumbra={1}
        intensity={4500} 
        decay={2}
        color="#80a0ff" 
        castShadow={false}
      />

      {/* RIM LIGHT (Back Light) - Positioned behind/beside items to catch the curl */}
      <spotLight 
        ref={rimLeftRef}
        position={[0, 0, -10]} 
        angle={0.9}
        penumbra={1}
        intensity={10000} 
        decay={2}
        color="#ffffff" 
        castShadow={false}
        target-position={[0, 0, 0]}
      />

      <spotLight 
        ref={rimRightRef}
        position={[12, -8, -1]} 
        angle={0.4}
        penumbra={1}
        intensity={8000} 
        decay={2}
        color="#80a0ff" 
        castShadow={false}
        target-position={[0, 0, 0]}
      />

      <ContactShadows 
        position={[0, 0, -0.01]} 
        opacity={0.5} 
        scale={20} 
        blur={3} 
        far={1} 
        resolution={1024} 
        color="#000000"
      />
      <Environment preset="night" />
    </>
  );
}

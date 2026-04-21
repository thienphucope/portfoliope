'use client';

import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useHelper, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

export default function Lighting({ editMode = false, config = {} }) {
  const lampRef = useRef();
  const windowRef = useRef();
  const rimLeftRef = useRef();
  const rimRightRef = useRef();
  const { scene } = useThree();
  
  // Helpers only show if editMode is true
  useHelper(editMode && lampRef, THREE.SpotLightHelper, 'gold');
  useHelper(editMode && windowRef, THREE.SpotLightHelper, 'cyan');
  useHelper(editMode && rimLeftRef, THREE.SpotLightHelper, 'white');
  useHelper(editMode && rimRightRef, THREE.SpotLightHelper, 'blue');

  useEffect(() => {
    if (editMode && lampRef.current && lampRef.current.shadow) {
      const helper = new THREE.CameraHelper(lampRef.current.shadow.camera);
      scene.add(helper);
      return () => scene.remove(helper);
    }
  }, [scene, editMode]);

  return (
    <>
      <color attach="background" args={['#000000']} />
      <ambientLight intensity={config.ambientIntensity ?? 0.1} color="#ffffff" />
      
      {config.useFog && <fog attach="fog" args={['#000', 10, 30]} />}

      {/* Dominant Left Lamp */}
      <spotLight 
        ref={lampRef}
        position={config.lampPos || [-10, 5, 5]} 
        angle={0.8}
        penumbra={1}
        intensity={config.lampIntensity ?? 1000} 
        decay={2}
        color="#ecc798" 
        castShadow 
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.05}
      >
        <orthographicCamera attach="shadow-camera" args={[-15, 15, 15, -15, 0.1, 50]} />
      </spotLight>

      {/* Ambient Right Window */}
      <spotLight 
        ref={windowRef}
        position={config.windowPos || [20, 0, 5]} 
        angle={0.6}
        penumbra={1}
        intensity={config.windowIntensity ?? 1000} 
        decay={2}
        color="#80a0ff" 
        castShadow={false}
      />

      {/* RIM LIGHTS */}
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

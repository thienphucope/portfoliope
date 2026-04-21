'use client';

import { useState, useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

export default function MinecraftControls({ enabled }) {
  const { camera } = useThree();
  const maxSpeed = 0.15;
  const verticalSpeed = 0.25;
  const acceleration = 2.8;
  const friction = 0.65;
  const [keys, setKeys] = useState({});

  const velocity = useRef(new THREE.Vector3());
  const desiredVelocity = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => setKeys((prev) => ({ ...prev, [e.code]: true }));
    const handleKeyUp = (e) => setKeys((prev) => ({ ...prev, [e.code]: false }));

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);

  useFrame((state, delta) => {
    if (!enabled) return;

    desiredVelocity.current.set(0, 0, 0);

    if (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']) {
      const camDir = new THREE.Vector3();
      camera.getWorldDirection(camDir);
      camDir.y = 0;
      camDir.normalize();

      const camSide = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

      if (keys['KeyW']) desiredVelocity.current.add(camDir);
      if (keys['KeyS']) desiredVelocity.current.sub(camDir);
      if (keys['KeyA']) desiredVelocity.current.add(camSide);
      if (keys['KeyD']) desiredVelocity.current.sub(camSide);

      if (desiredVelocity.current.length() > 0) {
        desiredVelocity.current.normalize().multiplyScalar(maxSpeed);
      }
    }

    // Vertical movement with acceleration/friction
    if (keys['Space']) desiredVelocity.current.y = Math.min(desiredVelocity.current.y + acceleration * delta, verticalSpeed);
    else if (keys['ShiftLeft']) desiredVelocity.current.y = Math.max(desiredVelocity.current.y - acceleration * delta, -verticalSpeed);
    else desiredVelocity.current.y *= friction;

    // Smooth acceleration/deceleration
    velocity.current.lerp(desiredVelocity.current, acceleration * delta);
    camera.position.add(velocity.current);
  });

  if (!enabled) return null;

  return <PointerLockControls />;
}

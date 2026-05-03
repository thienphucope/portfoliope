'use client';

import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function MobileControls({ enabled }) {
  const { camera } = useThree();
  const [isMobile, setIsMobile] = useState(false);

  const leftTouchRef = useRef(null);
  const rightTouchRef = useRef(null);
  const keysRef = useRef({});
  const cameraRotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!enabled || !isMobile) return;

    const handleTouchStart = (e) => {
      for (let touch of e.touches) {
        const x = touch.clientX;
        const w = window.innerWidth;

        if (x < w / 2) {
          leftTouchRef.current = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
        } else {
          rightTouchRef.current = { x: touch.clientX, y: touch.clientY, id: touch.identifier };
        }
      }
    };

    const handleTouchMove = (e) => {
      for (let touch of e.touches) {
        if (leftTouchRef.current && touch.identifier === leftTouchRef.current.id) {
          const dx = touch.clientX - leftTouchRef.current.x;
          const dy = touch.clientY - leftTouchRef.current.y;
          const threshold = 30;

          keysRef.current['KeyW'] = dy < -threshold;
          keysRef.current['KeyS'] = dy > threshold;
          keysRef.current['KeyA'] = dx < -threshold;
          keysRef.current['KeyD'] = dx > threshold;
        }

        if (rightTouchRef.current && touch.identifier === rightTouchRef.current.id) {
          const dx = touch.clientX - rightTouchRef.current.x;
          const dy = touch.clientY - rightTouchRef.current.y;

          cameraRotationRef.current.x += dy * 0.003;
          cameraRotationRef.current.y += dx * 0.003;

          rightTouchRef.current.x = touch.clientX;
          rightTouchRef.current.y = touch.clientY;
        }
      }
    };

    const handleTouchEnd = (e) => {
      for (let touch of e.changedTouches) {
        if (leftTouchRef.current && touch.identifier === leftTouchRef.current.id) {
          leftTouchRef.current = null;
          keysRef.current = {};
        }
        if (rightTouchRef.current && touch.identifier === rightTouchRef.current.id) {
          rightTouchRef.current = null;
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, false);
    window.addEventListener('touchmove', handleTouchMove, false);
    window.addEventListener('touchend', handleTouchEnd, false);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, isMobile]);

  useEffect(() => {
    if (!enabled || !isMobile) return;

    const moveSpeed = 0.15;
    const verticalSpeed = 0.25;
    const acceleration = 2.8;
    const friction = 0.65;

    const velocity = new THREE.Vector3();
    const desiredVelocity = new THREE.Vector3();

    const animationFrame = setInterval(() => {
      desiredVelocity.set(0, 0, 0);

      if (keysRef.current['KeyW'] || keysRef.current['KeyS'] || keysRef.current['KeyA'] || keysRef.current['KeyD']) {
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();

        const camSide = new THREE.Vector3().crossVectors(camera.up, camDir).normalize();

        if (keysRef.current['KeyW']) desiredVelocity.add(camDir);
        if (keysRef.current['KeyS']) desiredVelocity.sub(camDir);
        if (keysRef.current['KeyA']) desiredVelocity.add(camSide);
        if (keysRef.current['KeyD']) desiredVelocity.sub(camSide);

        if (desiredVelocity.length() > 0) {
          desiredVelocity.normalize().multiplyScalar(moveSpeed);
        }
      } else {
        desiredVelocity.y *= friction;
      }

      velocity.lerp(desiredVelocity, acceleration * 0.016);
      camera.position.add(velocity);

      if (cameraRotationRef.current.x !== 0 || cameraRotationRef.current.y !== 0) {
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(camera.quaternion);
        euler.rotateY(-cameraRotationRef.current.y);
        euler.rotateX(-cameraRotationRef.current.x);
        camera.quaternion.setFromEuler(euler);

        cameraRotationRef.current.x *= 0.9;
        cameraRotationRef.current.y *= 0.9;
      }
    }, 16);

    return () => clearInterval(animationFrame);
  }, [enabled, isMobile, camera]);

  return null;
}

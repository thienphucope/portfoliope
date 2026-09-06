"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { makeDeskTextures, disposeDeskTextures } from './deskTextures';
import { Casebook, PaperClutter, DeskLamp, Mug, Stationery, Organizer, Calendar, Radio, DeskClock } from './DeskObjects';
import { DeskFurniture, Room } from './DeskRoom';

function CameraRig({ compact }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    // A fixed viewpoint closer to the desk and lower, as seen from the chair.
    camera.position.set(0.1, 3.8, 6.95);
    camera.fov = compact ? 51 : 46;
    const target = new THREE.Vector3(0, 0.38, -0.3);
    if (aspect < 1) {
      camera.fov = 54;
      target.set(0, 0.45, -0.3);
      const direction = new THREE.Vector3(0, 0.48, 0.88).normalize();
      const horizontalHalfFov = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect;
      const distance = 4.2 / horizontalHalfFov + 1.8;
      camera.position.copy(target).addScaledVector(direction, distance);
    } else if (aspect < 1.5) {
      camera.position.sub(target).multiplyScalar(1.5 / aspect).add(target);
    }
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, compact, invalidate, size]);
  return null;
}

function Lighting({ compact }) {
  const keyTarget = useMemo(() => {
    const object = new THREE.Object3D(); object.position.set(-0.05, 0.05, 0.5); return object;
  }, []);
  const sunTarget = useMemo(() => {
    const object = new THREE.Object3D(); object.position.set(-1.6, -0.3, 1.1); return object;
  }, []);
  return <>
    <ambientLight color="#93b8b9" intensity={0.4} />
    <hemisphereLight args={['#bbd8d9', '#3c514a', 1.2]} />
    <primitive object={keyTarget} />
    <primitive object={sunTarget} />
    <spotLight position={[-1.91, 2.18, -0.28]} target={keyTarget} color="#ffd29a"
      intensity={36} distance={10} decay={2} angle={0.91} penumbra={0.8} castShadow
      shadow-mapSize={[compact ? 1024 : 2048, compact ? 1024 : 2048]}
      shadow-bias={-0.00015} shadow-normalBias={0.02} shadow-radius={3}
      shadow-camera-near={0.1} shadow-camera-far={11} />
    <directionalLight position={[5.8, 5.4, -1.6]} target={sunTarget} color="#aed8e2" intensity={1.7}
      castShadow={!compact} shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7}
      shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={0.2} shadow-camera-far={18}
      shadow-bias={-0.0003} shadow-normalBias={0.025} shadow-radius={2} />
    <pointLight position={[2.8, 3.1, -0.9]} color="#a0cfd0" intensity={5} distance={10} decay={2} />
    <pointLight position={[-1.05, 0.72, 0.45]} color="#e3b76e" intensity={0.95} distance={4} decay={2} />
  </>;
}

function SceneContent({ compact, onReady, onContextLost }) {
  const [resources, setResources] = useState(null);
  const { invalidate, gl } = useThree();
  const ready = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', onContextLost);
    return () => canvas.removeEventListener('webglcontextlost', onContextLost);
  }, [gl, onContextLost]);

  useEffect(() => {
    const textures = makeDeskTextures();
    const woodMaterial = new THREE.MeshStandardMaterial({ map: textures.wood, roughness: 0.86, color: '#dad0b8' });
    setResources({ textures, woodMaterial });
    return () => {
      disposeDeskTextures(textures);
      woodMaterial.dispose();
    };
  }, []);

  useEffect(() => {
    if (!resources) return;
    invalidate();
    const frame = requestAnimationFrame(() => {
      if (!ready.current) { ready.current = true; onReady(); }
    });
    return () => cancelAnimationFrame(frame);
  }, [resources, invalidate, onReady]);

  return <>
    <color attach="background" args={['#344c46']} />
    <fog attach="fog" args={['#344c46', 17, 38]} />
    <CameraRig compact={compact} />
    <Lighting compact={compact} />
    {resources && <group>
      <Room {...resources} compact={compact} />
      <DeskFurniture {...resources} />
      <PaperClutter textures={resources.textures} compact={compact} />
      <Casebook textures={resources.textures} />
      <DeskLamp />
      <Organizer {...resources} />
      <Calendar texture={resources.textures.calendar} />
      <Radio />
      <Mug />
      <Stationery />
      <DeskClock />
    </group>}
  </>;
}

export default function DeskScene({ onReady, onContextLost }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return <Canvas
    shadows={THREE.PCFSoftShadowMap}
    dpr={compact ? [1, 1.2] : [1, 1.6]}
    frameloop="demand"
    camera={{ position: [0.1, 3.8, 6.95], fov: 46, near: 0.1, far: 60 }}
    gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
    onCreated={({ gl }) => {
      gl.domElement.setAttribute('aria-label', 'A three-dimensional detective’s desk beside rain-streaked Venetian blinds, covered in notes, books and evidence.');
      gl.domElement.setAttribute('role', 'img');
    }}
    onContextMenu={(event) => event.preventDefault()}
  >
    <SceneContent compact={compact} onReady={onReady} onContextLost={onContextLost} />
  </Canvas>;
}

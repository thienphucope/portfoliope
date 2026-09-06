"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { makeDeskTextures, disposeDeskTextures } from './deskTextures';
import { OrbitControls, Center, Bounds } from '@react-three/drei';
import { Casebook, paperItems, DeskLamp, Mug, PenCup, Scissors, Magnifier, Stapler, DeskScatter, Organizer, Calendar, Radio, DeskClock } from './items';
import { DeskFurniture, Room } from './DeskRoom';
import { Interactive } from './Interactive';

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
      const distance = 3.3 / horizontalHalfFov + 1.4;
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
    <ambientLight color="#93b8b9" intensity={0.22} />
    <hemisphereLight args={['#bbd8d9', '#3c514a', 0.5]} />
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

// A single item on its own: recentred, auto-framed and free to orbit 360°.
function InspectView({ children }) {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
    const frame = requestAnimationFrame(() => invalidate());
    return () => cancelAnimationFrame(frame);
  }, [invalidate]);
  return <>
    <ambientLight intensity={0.7} />
    <hemisphereLight args={['#d4e4e0', '#3c4a44', 1.0]} />
    <directionalLight position={[4, 6, 5]} intensity={2.2} />
    <directionalLight position={[-5, 3, -4]} intensity={0.9} color="#a9d2dc" />
    <OrbitControls makeDefault enablePan={false} enableDamping={false} minDistance={0.6} maxDistance={40} />
    <Bounds fit observe margin={1.2}>
      <Center>{children}</Center>
    </Bounds>
  </>;
}

function SceneContent({ compact, onReady, onContextLost, inspecting, onInspect }) {
  const [resources, setResources] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const { invalidate, gl } = useThree();
  const ready = useRef(false);
  const clearRef = useRef();

  // Single source of truth for which item is lit. onPointerMove re-asserts it,
  // so moving onto another item always corrects a hover that lost its out event.
  const handleHover = useCallback((id, leaving) => {
    if (leaving) {
      clearRef.current = requestAnimationFrame(() => setHoveredId((cur) => (cur === id ? null : cur)));
    } else {
      cancelAnimationFrame(clearRef.current);
      setHoveredId(id);
    }
  }, []);

  useEffect(() => {
    document.body.style.cursor = hoveredId && !inspecting ? 'pointer' : 'auto';
    return () => { document.body.style.cursor = 'auto'; };
  }, [hoveredId, inspecting]);

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

  // Repaint on every desk <-> inspect switch (frameloop is on demand), and drop
  // any hover so an item doesn't come back from inspection already glowing.
  useEffect(() => { setHoveredId(null); invalidate(); }, [inspecting, invalidate]);

  const items = useMemo(() => {
    if (!resources) return [];
    const { textures } = resources;
    return [
      { id: 'casebook', label: 'Casebook', node: <Casebook textures={textures} /> },
      ...paperItems(textures, compact),
      { id: 'lamp', label: 'Desk lamp', node: <DeskLamp /> },
      { id: 'organizer', label: 'Paper tray', node: <Organizer {...resources} /> },
      { id: 'calendar', label: 'Calendar', node: <Calendar texture={textures.calendar} /> },
      { id: 'radio', label: 'Radio', node: <Radio /> },
      { id: 'mug', label: 'Mug', node: <Mug /> },
      { id: 'pencup', label: 'Pen cup', node: <PenCup /> },
      { id: 'scissors', label: 'Scissors', node: <Scissors /> },
      { id: 'magnifier', label: 'Magnifier', node: <Magnifier /> },
      { id: 'stapler', label: 'Stapler', node: <Stapler /> },
      { id: 'scatter', label: 'Pencils & clips', node: <DeskScatter /> },
      { id: 'clock', label: 'Desk clock', node: <DeskClock texture={textures.clock} /> },
    ];
  }, [resources, compact]);

  const inspected = inspecting ? items.find((item) => item.id === inspecting) : null;

  return <>
    <color attach="background" args={[inspecting ? '#26332f' : '#344c46']} />
    {!inspecting && <fog attach="fog" args={['#344c46', 24, 42]} />}
    {inspected
      ? <InspectView key={inspected.id}>{inspected.node}</InspectView>
      : <>
          <CameraRig compact={compact} />
          <Lighting compact={compact} />
          {resources && <group>
            <Room {...resources} compact={compact} />
            <DeskFurniture {...resources} />
            {items.map(({ id, label, node }) => <Interactive key={id} id={id} active={hoveredId === id} onHover={handleHover} onSelect={() => onInspect({ id, label })}>{node}</Interactive>)}
          </group>}
        </>}
  </>;
}

export default function DeskScene({ onReady, onContextLost, inspecting, onInspect }) {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(query.matches);
    sync(); query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return <Canvas
    shadows={THREE.PCFSoftShadowMap}
    dpr={compact ? [1, 2] : [1, 2]}
    frameloop="demand"
    camera={{ position: [0.1, 3.8, 6.95], fov: 46, near: 0.1, far: 60 }}
    gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
    onCreated={({ gl }) => {
      gl.domElement.setAttribute('aria-label', 'A three-dimensional detective’s desk beside rain-streaked Venetian blinds, covered in notes, books and evidence.');
      gl.domElement.setAttribute('role', 'img');
    }}
    onContextMenu={(event) => event.preventDefault()}
  >
    <SceneContent compact={compact} onReady={onReady} onContextLost={onContextLost} inspecting={inspecting} onInspect={onInspect} />
  </Canvas>;
}

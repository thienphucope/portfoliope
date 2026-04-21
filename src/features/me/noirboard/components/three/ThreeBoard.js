'use client';

import { Suspense, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useTexture, Preload } from '@react-three/drei';
import { useControls, Leva } from 'leva';
import * as THREE from 'three';
import ThreeItem from './ThreeItem';
import ThreeEditor from './ThreeEditor';
import MinecraftControls from './parts/MinecraftControls';
import MobileControls from './parts/MobileControls';
import Lighting from './parts/Lighting';
import { useItems } from '../../hooks/useItems';
import { getItemLayout } from '../../utils/seedLayout';

const SCALE_FACTOR = 0.01;

function Scene({ items, selectedId, setSelectedId, editMode, isMobile, lightingConfig, initialPov, povRef, onUpdateItem }) {
  const { camera, controls, raycaster, scene } = useThree();
  const [hoveredId, setHoveredId] = useState(null);
  const mousePos = useRef({ x: 0, y: 0 });

  // 1. POV Init (Chạy 1 lần duy nhất)
  useEffect(() => {
    if (initialPov) {
      camera.position.set(...initialPov.position);
      camera.lookAt(new THREE.Vector3(...initialPov.target));
      povRef.current = JSON.parse(JSON.stringify(initialPov));
    }
  }, [initialPov, camera]);

  // 2. Mouse Tracking (Chỉ dùng cho hover khi không Edit)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (editMode) return;
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [editMode]);

  // 3. Frame Loop: Sync POV + Hover Raycasting
  useFrame(() => {
    // Sync POV
    povRef.current.position = [camera.position.x, camera.position.y, camera.position.z];
    if (editMode && controls) {
      povRef.current.target = [controls.target.x, controls.target.y, controls.target.z];
    } else {
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      povRef.current.target = [
        camera.position.x + dir.x * 5,
        camera.position.y + dir.y * 5,
        camera.position.z + dir.z * 5
      ];

      // Hover Detection (Chỉ khi không edit)
      raycaster.setFromCamera(mousePos.current, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      let foundId = null;
      if (intersects.length > 0) {
        for (let i = 0; i < intersects.length; i++) {
          let hitObj = intersects[i].object;
          while (hitObj && !hitObj.userData?.itemId) hitObj = hitObj.parent;
          if (hitObj?.userData?.itemId) {
            foundId = hitObj.userData.itemId;
            break;
          }
        }
      }
      if (hoveredId !== foundId) setHoveredId(foundId);
    }
  });

  const layouts = useMemo(() => {
    return items.reduce((acc, item, i) => {
      const defaultLayout = getItemLayout(item.id, i, items.length, 2500, 1700);
      acc[item.id] = { ...defaultLayout, ...item };
      return acc;
    }, {});
  }, [items]);

  return (
    <>
      <Lighting editMode={editMode} config={lightingConfig} />
      <Suspense fallback={null}>
        <mesh receiveShadow position={[0, 0, 0]}>
          <planeGeometry args={[2500 * SCALE_FACTOR, 1700 * SCALE_FACTOR]} />
          <meshStandardMaterial map={useTexture('/mapimage.png')} color="#666" />
        </mesh>
        {items.map(item => (
          <ThreeItem
            key={item.id}
            item={item}
            layout={layouts[item.id]}
            scaleFactor={SCALE_FACTOR}
            isSelected={selectedId === item.id}
            isHovered={hoveredId === item.id}
            onSelect={() => editMode && setSelectedId(item.id)}
          />
        ))}
      </Suspense>

      {editMode ? (
        <OrbitControls 
          makeDefault 
          target={new THREE.Vector3(...povRef.current.target)} 
          enableDamping 
        />
      ) : (
        <>
          <MinecraftControls enabled={true} />
          <MobileControls enabled={true} />
        </>
      )}
    </>
  );
}

export default function ThreeBoard() {
  const { items: initialItems, config: initialConfig, loading } = useItems();
  const [localItems, setLocalItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const povRef = useRef({ position: [0, 0, 15], target: [0, 0, 0] });

  useEffect(() => {
    if (!loading) {
      setLocalItems(initialItems || []);
      if (initialConfig?.pov) povRef.current = initialConfig.pov;
    }
  }, [loading, initialItems, initialConfig]);

  const handleUpdateItem = useCallback((id, updates) => {
    setLocalItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
  }, []);

  const handleSavePov = async () => {
    await fetch('/api/noir/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'pov', config: { pov: povRef.current } }),
    });
    alert('POV saved!');
  };

  const [{ ambientIntensity, useFog }] = useControls(() => ({
    'Atmosphere': {
      value: {
        ambientIntensity: initialConfig?.atmosphere?.ambientIntensity ?? 0.1,
        useFog: initialConfig?.atmosphere?.useFog ?? false
      },
      collapsed: true,
    }
  }), [initialConfig]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000' }}>
      <button 
        onClick={() => { setEditMode(!editMode); setSelectedId(null); }}
        style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000, background: editMode ? '#d4920f' : '#222', color: '#fff', border: '1px solid #444', padding: '8px 20px', borderRadius: '20px', cursor: 'pointer' }}
      >
        {editMode ? 'EXIT' : 'EDIT'}
      </button>

      <Leva hidden={!editMode} theme={{ colors: { accent1: '#d4920f' } }} />

      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <PerspectiveCamera makeDefault fov={40} />
        {!loading && (
          <Scene
            items={localItems}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            editMode={editMode}
            lightingConfig={{ ambientIntensity, useFog }}
            initialPov={initialConfig?.pov}
            povRef={povRef}
            onUpdateItem={handleUpdateItem}
          />
        )}
        {editMode && (
          <ThreeEditor
            editMode={editMode}
            items={localItems}
            onUpdateItem={handleUpdateItem}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            povRef={povRef}
            onSaveItems={() => console.log('Save items')}
            onSavePov={handleSavePov}
          />
        )}
        <Preload all />
      </Canvas>
    </div>
  );
}

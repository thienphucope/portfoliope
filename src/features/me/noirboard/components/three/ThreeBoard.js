'use client';

import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  useTexture,
  Preload,
  TransformControls,
} from '@react-three/drei';
import { useControls, button, folder, Leva } from 'leva';
import * as THREE from 'three';
import ThreeItem from './ThreeItem';
import ThreeConnections from './ThreeConnections';
import Lighting from './parts/Lighting';
import { useItems } from '../../hooks/useItems';
import { getItemLayout } from '../../utils/seedLayout';

const CANVAS_W = 2500;
const CANVAS_H = 1700;
const SCALE_FACTOR = 0.01;

function Room() {
  return (
    <group>
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#050505" roughness={1} />
      </mesh>
      <mesh position={[0, -60, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#020202" roughness={1} />
      </mesh>
    </group>
  );
}

function BoardBackground() {
  const texture = useTexture('/mapimage.png');
  texture.anisotropy = 16;
  return (
    <mesh receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[CANVAS_W * SCALE_FACTOR, CANVAS_H * SCALE_FACTOR]} />
      <meshStandardMaterial map={texture} color="#666" roughness={1} metalness={0} />
    </mesh>
  );
}

function Scene({ items, onUpdateItem, selectedId, setSelectedId, povConfig }) {
  const orbitRef = useRef();
  const { camera } = useThree();
  const initialPovApplied = useRef(false);

  useEffect(() => {
    if (povConfig && orbitRef.current && !initialPovApplied.current) {
      camera.position.set(povConfig.position[0], povConfig.position[1], povConfig.position[2]);
      orbitRef.current.target.set(povConfig.target[0], povConfig.target[1], povConfig.target[2]);
      orbitRef.current.update();
      initialPovApplied.current = true;
    }
  }, [povConfig, camera]);

  const layouts = useMemo(() => {
    return items.reduce((acc, item, i) => {
      const defaultLayout = getItemLayout(item.id, i, items.length, CANVAS_W, CANVAS_H);
      acc[item.id] = {
        ...defaultLayout,
        x: item.x !== undefined ? item.x : defaultLayout.x,
        y: item.y !== undefined ? item.y : defaultLayout.y,
        z: item.z !== undefined ? item.z : defaultLayout.z,
      };
      return acc;
    }, {});
  }, [items]);

  const selectedItem = items.find(it => it.id === selectedId);

  return (
    <>
      <Lighting />
      <Room />
      <Suspense fallback={null}>
        <BoardBackground />
        {items.map(item => (
          <ThreeItem 
            key={item.id} 
            item={item} 
            layout={layouts[item.id]} 
            scaleFactor={SCALE_FACTOR}
            isSelected={selectedId === item.id}
            onSelect={() => setSelectedId(item.id)}
          />
        ))}
      </Suspense>

      {selectedId && selectedItem && (
        <TransformControls 
          position={[
            (selectedItem.x - 1250) * SCALE_FACTOR,
            -(selectedItem.y - 850) * SCALE_FACTOR,
            selectedItem.z * 0.005 + 0.1
          ]}
          mode="translate"
          onMouseDown={() => { if(orbitRef.current) orbitRef.current.enabled = false }}
          onMouseUp={() => { if(orbitRef.current) orbitRef.current.enabled = true }}
          onObjectChange={(e) => {
            const target = e.target.object;
            const newX = target.position.x / SCALE_FACTOR + 1250;
            const newY = -target.position.y / SCALE_FACTOR + 850;
            onUpdateItem(selectedId, { x: newX, y: newY });
          }}
        />
      )}

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableRotate={true}
        enableDamping={true}
        screenSpacePanning={true}
      />
    </>
  );
}

export default function ThreeBoard() {
  const { items: initialItems, config: initialConfig, loading } = useItems();
  const [localItems, setLocalItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  
  // REAL-TIME POV SYNC: This ref is updated 60 times a second by CameraSync component
  const livePovRef = useRef({ position: [0, 0, 15], target: [0, 0, 0] });
  const [boardConfig, setBoardConfig] = useState(null);

  useEffect(() => {
    if (!loading) {
      setLocalItems(initialItems.map(it => ({
        ...it,
        x: it.x || 1250,
        y: it.y || 850,
        z: it.z || 10,
        scale: it.scale || 1.0,
        rotation: it.rotation || 0
      })));
      if (initialConfig?.pov) {
        setBoardConfig(initialConfig);
        livePovRef.current = initialConfig.pov;
      }
    }
  }, [loading, initialItems, initialConfig]);

  const selectedItem = localItems.find(it => it.id === selectedId);

  // Leva Controls
  const [, set] = useControls(() => ({
    'Actions': folder({
      'Save Item Positions': button(() => handleSaveItems()),
      'Save Board POV': button(() => handleSavePov()),
      'Copy Current POV JSON': button(() => {
        const json = JSON.stringify({ pov: livePovRef.current }, null, 2);
        navigator.clipboard.writeText(json);
        alert('POV JSON Copied to Clipboard!');
      }),
      'Import Items JSON': button(() => {
        const input = prompt('Paste your items JSON array here:');
        if (input) {
          try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
              setLocalItems(prev => prev.map(item => {
                const config = parsed.find(c => c.name === item.imageUrl?.split('/').pop());
                return config ? { ...item, ...config } : item;
              }));
            }
          } catch (e) { alert('Invalid JSON'); }
        }
      }),
    }),
    'Live POV Stats': folder({
      'Cam Pos': { value: [0, 0, 15], editable: false },
      'Target Pos': { value: [0, 0, 0], editable: false },
    }),
    'Selected Item': folder({
      'Title': { value: selectedItem?.title || '', editable: false },
      'X': {
        value: selectedItem ? Math.round(selectedItem.x) : 0,
        onChange: (v) => { if (selectedId) handleUpdateItem(selectedId, { x: v }) },
        transient: false
      },
      'Y': {
        value: selectedItem ? Math.round(selectedItem.y) : 0,
        onChange: (v) => { if (selectedId) handleUpdateItem(selectedId, { y: v }) },
        transient: false
      },
      'Z': {
        value: selectedItem ? Math.round(selectedItem.z) : 0,
        onChange: (v) => { if (selectedId) handleUpdateItem(selectedId, { z: v }) },
        transient: false
      },
      'Scale': {
        value: selectedItem?.scale || 1.0,
        min: 0.1, max: 10, step: 0.1,
        onChange: (v) => { if (selectedId) handleUpdateItem(selectedId, { scale: v }) },
        transient: false
      },
      'Rotation': {
        value: selectedItem?.rotation || 0,
        min: -180, max: 180, step: 1,
        onChange: (v) => { if (selectedId) handleUpdateItem(selectedId, { rotation: v }) },
        transient: false
      }
    }, { render: () => !!selectedId })
  }), [selectedId, localItems]);

  // Sync Leva for selected item
  useEffect(() => {
    if (selectedItem) {
      set({
        'Title': selectedItem.title,
        'X': Math.round(selectedItem.x),
        'Y': Math.round(selectedItem.y),
        'Z': Math.round(selectedItem.z),
        'Scale': selectedItem.scale,
        'Rotation': Math.round(selectedItem.rotation || 0)
      });
    }
  }, [selectedId, selectedItem, set]);

  const handleUpdateItem = (id, updates) => {
    setLocalItems(prev => prev.map(it => it.id === id ? { ...it, ...updates } : it));
  };

  const handleSaveItems = async () => {
    const itemsToSave = localItems.map(it => ({
      name: it.imageUrl?.split('/').pop() || '',
      title: it.title,
      scale: parseFloat(it.scale.toFixed(2)),
      rotation: it.rotation || 0,
      x: Math.round(it.x),
      y: Math.round(it.y),
      z: Math.round(it.z)
    }));

    try {
      const response = await fetch('/api/noir/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'items', items: itemsToSave }),
      });
      const result = await response.json();
      if (result.success) alert('Items saved successfully!');
      else alert('Save failed: ' + result.error);
    } catch (e) {
      alert('Error saving items.');
    }
  };

  const handleSavePov = async () => {
    const payload = { type: 'pov', config: { pov: livePovRef.current } };
    console.log('Saving POV:', payload);
    try {
      const response = await fetch('/api/noir/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) alert('Board POV saved successfully!');
      else alert('Save failed: ' + result.error);
    } catch (e) {
      alert('Error saving POV.');
    }
  };

  const defaultPos = boardConfig?.pov?.position || [0, 0, 15];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: '#000' }}>
      <Leva theme={{
        colors: {
          accent1: '#d4920f',
          accent2: '#a37010',
          accent3: '#1a0f00',
        }
      }} />
      <Canvas 
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 3]} 
        gl={{ antialias: true, alpha: true, precision: 'highp', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.65 }}
        onPointerMissed={() => setSelectedId(null)}
      >
        <PerspectiveCamera makeDefault position={defaultPos} fov={40} />
        <CameraSync setLeva={set} povRef={livePovRef} />
        {!loading && (
          <Scene 
            items={localItems} 
            onUpdateItem={handleUpdateItem} 
            selectedId={selectedId} 
            setSelectedId={setSelectedId}
            povConfig={boardConfig?.pov}
          />
        )}
        <Preload all />
      </Canvas>
    </div>
  );
}

/**
 * Robustly syncs Three.js state to Leva and a local Ref for instant saving.
 */
function CameraSync({ setLeva, povRef }) {
  const { camera, controls } = useThree();
  const lastUpdate = useRef(0);

  useFrame((state) => {
    if (!controls) return;

    // 1. Update the mutable POV Ref (Always exact, no throttling here for accuracy)
    povRef.current = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z]
    };

    // 2. Throttle Leva UI updates to avoid lag
    const now = state.clock.getElapsedTime();
    if (now - lastUpdate.current < 0.1) return; // 10 FPS for UI is enough
    lastUpdate.current = now;

    setLeva({
      'Cam Pos': [
        parseFloat(camera.position.x.toFixed(2)),
        parseFloat(camera.position.y.toFixed(2)),
        parseFloat(camera.position.z.toFixed(2))
      ],
      'Target Pos': [
        parseFloat(controls.target.x.toFixed(2)),
        parseFloat(controls.target.y.toFixed(2)),
        parseFloat(controls.target.z.toFixed(2))
      ]
    });
  });

  return null;
}

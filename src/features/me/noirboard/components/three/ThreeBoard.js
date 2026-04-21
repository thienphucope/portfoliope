'use client';

import { Suspense, useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  useTexture,
  Preload,
} from '@react-three/drei';
import { useControls, Leva } from 'leva';
import * as THREE from 'three';
import ThreeItem from './ThreeItem';
import ThreeConnections from './ThreeConnections';
import ThreeEditor from './ThreeEditor';
import MinecraftControls from './parts/MinecraftControls';
import MobileControls from './parts/MobileControls';
import Lighting from './parts/Lighting';
import { useItems } from '../../hooks/useItems';
import { getItemLayout } from '../../utils/seedLayout';

const CANVAS_W = 2500;
const CANVAS_H = 1700;
const SCALE_FACTOR = 0.01;

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

function Scene({ items, onUpdateItem, selectedId, setSelectedId, povConfig, editMode, lightingConfig }) {
  const orbitRef = useRef();
  const { camera } = useThree();
  const initialApplied = useRef(false);

  // FORCE POV on startup and on config changes
  useEffect(() => {
    if (povConfig && !initialApplied.current) {
      console.log('Force Applying POV:', povConfig);
      camera.position.set(...povConfig.position);
      if (editMode && orbitRef.current) {
        orbitRef.current.target.set(...povConfig.target);
        orbitRef.current.update();
      } else {
        camera.lookAt(...povConfig.target);
      }
      initialApplied.current = true;
    }
  }, [povConfig, camera, editMode]);

  const layouts = useMemo(() => {
    return items.reduce((acc, item, i) => {
      const defaultLayout = getItemLayout(item.id, i, items.length, CANVAS_W, CANVAS_H);
      acc[item.id] = {
        ...defaultLayout,
        x: item.x !== undefined ? item.x : defaultLayout.x,
        y: item.y !== undefined ? item.y : defaultLayout.y,
        z: item.z !== undefined ? item.z : defaultLayout.z,
        rotation: item.rotation !== undefined ? item.rotation : defaultLayout.rotation,
      };
      return acc;
    }, {});
  }, [items]);

  return (
    <>
      <Lighting editMode={editMode} config={lightingConfig} />
      <Suspense fallback={null}>
        <BoardBackground />
        {items.map(item => (
          <ThreeItem 
            key={item.id} 
            item={item} 
            layout={layouts[item.id]} 
            scaleFactor={SCALE_FACTOR}
            isSelected={selectedId === item.id}
            onSelect={() => {
              if (editMode) setSelectedId(item.id);
            }}
          />
        ))}
      </Suspense>

      {editMode ? (
        <OrbitControls
          ref={orbitRef}
          makeDefault
          enableRotate={true}
          enableDamping={true}
          screenSpacePanning={true}
          target={povConfig?.target || [0, 0, 0]}
        />
      ) : (
        <>
          <MinecraftControls enabled={!editMode} />
          <MobileControls enabled={!editMode} />
        </>
      )}
    </>
  );
}

export default function ThreeBoard() {
  const { items: initialItems, config: initialConfig, loading } = useItems();
  const [localItems, setLocalItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [boardConfig, setBoardConfig] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const livePovRef = useRef({ position: [0, 0, 15], target: [0, 0, 0] });

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [history, setHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  const saveHistory = useCallback((items) => {
    const newHistory = history.slice(0, historyPointer + 1);
    newHistory.push(JSON.stringify(items));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryPointer(newHistory.length - 1);
  }, [history, historyPointer]);

  const undo = useCallback(() => {
    if (historyPointer > 0) {
      const prev = JSON.parse(history[historyPointer - 1]);
      setLocalItems(prev);
      setHistoryPointer(historyPointer - 1);
    }
  }, [history, historyPointer]);

  const redo = useCallback(() => {
    if (historyPointer < history.length - 1) {
      const next = JSON.parse(history[historyPointer + 1]);
      setLocalItems(next);
      setHistoryPointer(historyPointer + 1);
    }
  }, [history, historyPointer]);

  // Atmosphere controls
  const [{ ambientIntensity, useFog }] = useControls(() => ({
    'Atmosphere': {
      value: { 
        ambientIntensity: initialConfig?.atmosphere?.ambientIntensity ?? 0.1, 
        useFog: initialConfig?.atmosphere?.useFog ?? false 
      },
      collapsed: true,
      hidden: !editMode
    }
  }), [initialConfig, editMode]);

  useEffect(() => {
    if (!loading) {
      setLocalItems(initialItems);
      setBoardConfig(initialConfig);
      if (initialConfig?.pov) livePovRef.current = initialConfig.pov;
      setHistory([JSON.stringify(initialItems)]);
      setHistoryPointer(0);
    }
  }, [loading, initialItems, initialConfig]);

  const handleUpdateItem = useCallback((id, updates, commitHistory = false) => {
    setLocalItems(prev => {
      const next = prev.map(it => it.id === id ? { ...it, ...updates } : it);
      if (commitHistory) saveHistory(next);
      return next;
    });
  }, [saveHistory]);

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
      if (result.success) alert('Items saved!');
    } catch (e) { alert('Save error'); }
  };

  const handleSavePov = async () => {
    const povToSave = {
      position: [...livePovRef.current.position],
      target: [...livePovRef.current.target]
    };
    
    try {
      const response = await fetch('/api/noir/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'config', 
          config: { 
            pov: povToSave,
            atmosphere: { ambientIntensity, useFog }
          } 
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Board POV saved successfully!');
        setBoardConfig(prev => ({ ...prev, pov: povToSave }));
      }
    } catch (e) { alert('Save error'); }
  };

  // Ensure camera starts at saved position before children render
  const defaultPos = initialConfig?.pov?.position || [0, 0, 15];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: '#000' }}>
      {!editMode && !isMobile && (
        <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px', pointerEvents: 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 22px)', gap: '3px' }}>
            <div style={{ gridColumn: '2', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px', textAlign: 'center', color: '#fff', fontSize: '9px', fontWeight: 'bold', borderRadius: '3px' }}>W</div>
            <div style={{ gridColumn: '1 / 2', gridRow: '2', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px', textAlign: 'center', color: '#fff', fontSize: '9px', fontWeight: 'bold', borderRadius: '3px' }}>A</div>
            <div style={{ gridColumn: '2 / 3', gridRow: '2', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px', textAlign: 'center', color: '#fff', fontSize: '9px', fontWeight: 'bold', borderRadius: '3px' }}>S</div>
            <div style={{ gridColumn: '3 / 4', gridRow: '2', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px', textAlign: 'center', color: '#fff', fontSize: '9px', fontWeight: 'bold', borderRadius: '3px' }}>D</div>
          </div>
          <div style={{ display: 'flex', gap: '3px', fontSize: '8px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 6px', textAlign: 'center', color: '#fff', fontWeight: 'bold', borderRadius: '3px' }}>⇧</div>
            <div style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', padding: '4px 6px', textAlign: 'center', color: '#fff', fontWeight: 'bold', borderRadius: '3px' }}>⎵</div>
          </div>
        </div>
      )}

      {!editMode && isMobile && (
        <>
          <div style={{ position: 'fixed', bottom: '30px', left: '30px', zIndex: 999, pointerEvents: 'none' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>MOVE</div>
          </div>
          <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 999, pointerEvents: 'none' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginTop: '8px', textAlign: 'center' }}>LOOK</div>
          </div>
        </>
      )}

      <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1000, display: 'flex', gap: '10px' }}>
        {editMode && (
          <>
            <button onClick={undo} disabled={historyPointer <= 0} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', opacity: historyPointer <= 0 ? 0.5 : 1 }}>UNDO</button>
            <button onClick={redo} disabled={historyPointer >= history.length - 1} style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', opacity: historyPointer >= history.length - 1 ? 0.5 : 1 }}>REDO</button>
          </>
        )}
      </div>

      <button 
        onClick={() => {
          setEditMode(!editMode);
          if (editMode) setSelectedId(null);
        }}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          background: editMode ? '#d4920f' : 'transparent',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '5px 12px',
          fontSize: '11px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.2s ease'
        }}
      >
        {editMode ? 'EXIT' : 'EDIT'}
      </button>

      <Leva 
        hidden={!editMode}
        theme={{ colors: { accent1: '#d4920f' } }} 
      />

      <Canvas 
        shadows={{ type: THREE.PCFSoftShadowMap }}
        dpr={[1, 3]} 
        gl={{ antialias: true, alpha: true, precision: 'highp', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.65 }}
        onPointerMissed={() => editMode && setSelectedId(null)}
      >
        {/* Pass initialConfig specifically for startup position */}
        <PerspectiveCamera makeDefault position={defaultPos} fov={40} />
        
        {!loading && (
          <>
            <Scene 
              items={localItems} 
              onUpdateItem={handleUpdateItem} 
              selectedId={selectedId} 
              setSelectedId={setSelectedId}
              povConfig={boardConfig?.pov}
              editMode={editMode}
              lightingConfig={{ ambientIntensity, useFog }}
            />
            <ThreeEditor 
              editMode={editMode}
              items={localItems}
              onUpdateItem={handleUpdateItem}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              povRef={livePovRef}
              onSaveItems={handleSaveItems}
              onSavePov={handleSavePov}
            />
          </>
        )}
        <Preload all />
      </Canvas>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import { useControls, button, folder } from 'leva';

const SCALE_FACTOR = 0.01;

export default function ThreeEditor({ 
  editMode, 
  items, 
  onUpdateItem, 
  selectedId, 
  setSelectedId, 
  povRef, 
  onSaveItems, 
  onSavePov 
}) {
  const { camera, controls } = useThree();
  const lastUpdate = useRef(0);

  const selectedItem = items.find(it => it.id === selectedId);

  const [, set] = useControls(() => ({
    'Editor': folder({
      'Save Items': button(() => onSaveItems()),
      'Save POV': button(() => onSavePov()),
      'Copy POV JSON': button(() => {
        const json = JSON.stringify({ pov: povRef.current }, null, 2);
        navigator.clipboard.writeText(json);
        alert('POV JSON Copied!');
      }),
    }),
    'POV Stats': folder({
      'Cam Pos': { value: [0, 0, 15], editable: false },
      'Target Pos': { value: [0, 0, 0], editable: false },
    }),
    'Selection': folder({
      'Title': { value: selectedItem?.title || '', editable: false },
      'X': {
        value: selectedItem ? Math.round(selectedItem.x) : 0,
        onChange: (v) => { if (selectedId && editMode) onUpdateItem(selectedId, { x: v }) },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      },
      'Y': {
        value: selectedItem ? Math.round(selectedItem.y) : 0,
        onChange: (v) => { if (selectedId && editMode) onUpdateItem(selectedId, { y: v }) },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      },
      'Z': {
        value: selectedItem ? Math.round(selectedItem.z) : 0,
        onChange: (v) => { if (selectedId && editMode) onUpdateItem(selectedId, { z: v }) },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      },
      'Scale': {
        value: selectedItem?.scale || 1.0,
        min: 0.1, max: 10, step: 0.1,
        onChange: (v) => { if (selectedId && editMode) onUpdateItem(selectedId, { scale: v }) },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      },
      'Rotation': {
        value: selectedItem?.rotation || 0,
        min: -180, max: 180, step: 1,
        onChange: (v) => { if (selectedId && editMode) onUpdateItem(selectedId, { rotation: v }) },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      }
    }, { render: () => !!selectedId && editMode })
  }), [selectedId, editMode]); // Dependencies simplified to avoid re-creation loops

  // Sync Leva for selection
  useEffect(() => {
    if (selectedItem && editMode) {
      set({
        'Title': selectedItem.title,
        'X': Math.round(selectedItem.x),
        'Y': Math.round(selectedId === selectedItem.id ? selectedItem.y : 0), // Simple check to trigger update
        'Y': Math.round(selectedItem.y),
        'Z': Math.round(selectedItem.z),
        'Scale': selectedItem.scale,
        'Rotation': Math.round(selectedItem.rotation || 0)
      });
    }
  }, [selectedId, selectedItem, set, editMode]);

  // Live Sync POV to Leva
  useFrame((state) => {
    if (!controls) return;

    povRef.current = {
      position: [camera.position.x, camera.position.y, camera.position.z],
      target: [controls.target.x, controls.target.y, controls.target.z]
    };

    if (!editMode) return;

    const now = state.clock.getElapsedTime();
    if (now - lastUpdate.current < 0.1) return; 
    lastUpdate.current = now;

    set({
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

  if (!editMode) return null;

  return (
    <>
      {selectedId && selectedItem && (
        <TransformControls 
          position={[
            (selectedItem.x - 1250) * SCALE_FACTOR,
            -(selectedItem.y - 850) * SCALE_FACTOR,
            selectedItem.z * 0.005 + 0.1
          ]}
          mode="translate"
          onMouseDown={() => { if(controls) controls.enabled = false }}
          onMouseUp={() => { 
            if(controls) controls.enabled = true;
            onUpdateItem(selectedId, {}, true); // Commit history on drag end
          }}
          onObjectChange={(e) => {
            const target = e.target.object;
            const newX = target.position.x / SCALE_FACTOR + 1250;
            const newY = -target.position.y / SCALE_FACTOR + 850;
            onUpdateItem(selectedId, { x: newX, y: newY }, false); // Real-time update, no history commit yet
          }}
        />
      )}
    </>
  );
}

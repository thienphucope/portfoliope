'use client';

import { useEffect, useRef, useMemo } from 'react';
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
  onSavePov,
  onAutoLayout
}) {
  const { camera, controls, scene } = useThree();
  const lastUpdate = useRef(0);
  const isSetting = useRef(false);
  const isDragging = useRef(false);
  
  // Prevent Leva from teleporting items using cached values on selection change
  const prevSelectedId = useRef(selectedId);
  if (prevSelectedId.current !== selectedId) {
    prevSelectedId.current = selectedId;
    isSetting.current = true;
  }

  const selectedItem = items.find(it => it.id === selectedId);

  // Find the actual 3D object in the scene to attach TransformControls
  const selectedObject = useMemo(() => {
    if (!selectedId || !scene) return null;
    let found = null;
    // Tìm object Group chứa itemId, tránh tìm nhầm vào mesh con bên trong
    scene.traverse(obj => {
      if (obj.userData?.itemId === selectedId && obj.type === 'Group') {
        found = obj;
      }
    });
    return found;
  }, [scene, selectedId]);

  const [, set] = useControls(() => ({
    'Editor': folder({
      'Auto Layout': button(() => onAutoLayout()),
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
        onChange: (v) => { 
          if (!isSetting.current && !isDragging.current && selectedId && editMode) {
            onUpdateItem(selectedId, { x: v });
          }
        },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      },
      'Y': {
        value: selectedItem ? Math.round(selectedItem.y) : 0,
        onChange: (v) => { 
          if (!isSetting.current && !isDragging.current && selectedId && editMode) {
            onUpdateItem(selectedId, { y: v });
          }
        },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      },
      'Z': {
        value: selectedItem ? Math.round(selectedItem.z) : 0,
        onChange: (v) => { 
          if (!isSetting.current && !isDragging.current && selectedId && editMode) {
            onUpdateItem(selectedId, { z: v });
          }
        },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      },
      'Scale': {
        value: selectedItem?.scale || 1.0,
        min: 0.1, max: 10, step: 0.1,
        onChange: (v) => { 
          if (!isSetting.current && !isDragging.current && selectedId && editMode) {
            onUpdateItem(selectedId, { scale: v });
          }
        },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      },
      'Rotation': {
        value: selectedItem?.rotation || 0,
        min: -180, max: 180, step: 1,
        onChange: (v) => { 
          if (!isSetting.current && !isDragging.current && selectedId && editMode) {
            onUpdateItem(selectedId, { rotation: v });
          }
        },
        onEditEnd: () => { if (selectedId && editMode) onUpdateItem(selectedId, {}, true) },
        transient: false
      }
    }, { render: () => !!selectedId && editMode })
  }), [selectedId, editMode]);

  // Sync Leva when selection changes
  useEffect(() => {
    if (selectedItem && editMode && !isDragging.current) {
      isSetting.current = true;
      set({
        'Title': selectedItem.title || '',
        'X': Math.round(selectedItem.x),
        'Y': Math.round(selectedItem.y),
        'Z': Math.round(selectedItem.z),
        'Scale': selectedItem.scale || 1.0,
        'Rotation': Math.round(selectedItem.rotation || 0)
      });
      setTimeout(() => { isSetting.current = false; }, 50);
    }
  }, [selectedId, selectedItem, set, editMode]);

  // Sync Camera POV to Leva and Ref
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
      {selectedId && selectedItem && selectedObject && (
        <TransformControls 
          key={selectedId}
          object={selectedObject}
          mode="translate"
          onMouseDown={() => { 
            isDragging.current = true;
            if(controls) controls.enabled = false; 
          }}
          onMouseUp={() => { 
            isDragging.current = false;
            if(controls) controls.enabled = true;
            
            if (selectedObject) {
              const rawX = selectedObject.position.x / SCALE_FACTOR + 1250;
              const rawY = -selectedObject.position.y / SCALE_FACTOR + 850;
              const rawZ = (selectedObject.position.z - 0.002) / 0.005;

              const finalX = Math.max(0, Math.min(2500, Math.round(rawX)));
              const finalY = Math.max(0, Math.min(1700, Math.round(rawY)));
              const finalZ = Math.max(-100, Math.min(500, Math.round(rawZ)));

              onUpdateItem(selectedId, { 
                x: finalX, 
                y: finalY, 
                z: finalZ 
              }, true);
            } else {
              onUpdateItem(selectedId, {}, true);
            }
          }}
          onObjectChange={(e) => {
            if (isSetting.current || !isDragging.current) return;
            const target = e.target.object;
            if (!target) return;

            // Chuyển đổi ngược từ tọa độ 3D về tọa độ Canvas
            const rawX = target.position.x / SCALE_FACTOR + 1250;
            const rawY = -target.position.y / SCALE_FACTOR + 850;
            const rawZ = (target.position.z - 0.002) / 0.005;

            if (isNaN(rawX) || isNaN(rawY) || isNaN(rawZ)) return;

            // Clamping an toàn để item không bao giờ thoát khỏi phạm vi Board
            const finalX = Math.max(0, Math.min(2500, Math.round(rawX)));
            const finalY = Math.max(0, Math.min(1700, Math.round(rawY)));
            const finalZ = Math.max(-100, Math.min(500, Math.round(rawZ)));

            // Update UI only, don't trigger re-render on object position
            set({
              'X': finalX,
              'Y': finalY,
              'Z': finalZ
            });
          }}
        />
      )}
    </>
  );
}

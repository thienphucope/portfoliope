'use client';

import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function PolaroidContent({ item, size, geometry }) {
  const texture = useTexture(item.imageUrl || '/placeholder.jpg');
  
  const photoTexture = useMemo(() => {
    const tex = texture.clone();
    tex.anisotropy = 16;
    // Use RepeatWrapping but we will control transparency to "cut" the edges
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    
    const padding = 0.05;
    
    const repeatX = 1 / ((size[0] - padding * 2) / size[0]);
    const repeatY = 1 / ((size[1] - padding * 2) / size[1]);
    
    tex.repeat.set(repeatX, repeatY);
    tex.offset.set(
      -(padding / size[0]) * repeatX, 
      -(padding / size[1]) * repeatY
    );
    
    tex.needsUpdate = true;
    return tex;
  }, [texture, size]);

  return (
    <group>
      {/* The Frame (White Body) */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial 
          color="#f2ece0" 
          roughness={1}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* The Photo - Uses custom onBeforeCompile to discard pixels outside [0,1] UV range */}
      <mesh geometry={geometry} position={[0, 0, 0.002]}>
        <meshStandardMaterial 
          map={photoTexture} 
          toneMapped={true}
          transparent={true}
          roughness={1}
          metalness={0}
          onBeforeCompile={(shader) => {
            // This small shader tweak discards pixels that would normally be 'clamped' or 'stretched'
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              `
              #include <map_fragment>
              // Get the transformed UV from the repeat/offset
              vec2 transformedUV = vMapUv; 
              if (transformedUV.x < 0.0 || transformedUV.x > 1.0 || transformedUV.y < 0.0 || transformedUV.y > 1.0) {
                diffuseColor.a = 0.0;
              }
              `
            );
          }}
        />
      </mesh>
    </group>
  );
}

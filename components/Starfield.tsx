
import React, { useMemo, useRef } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';

// Correctly extend React.JSX for React 18+ and R3F support
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

export const Starfield: React.FC<{ effectiveResolution: number }> = ({ effectiveResolution }) => {
  const starCount = 40000;
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const [positions, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    const sz = new Float32Array(starCount);
    const col = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2000 + Math.random() * 4000;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      sz[i] = 0.5 + Math.random() * 1.5;

      const rand = Math.random();
      if (rand < 0.2) { col[i*3]=0.6; col[i*3+1]=0.8; col[i*3+2]=1.0; }
      else if (rand < 0.4) { col[i*3]=1.0; col[i*3+1]=1.0; col[i*3+2]=1.0; }
      else if (rand < 0.6) { col[i*3]=1.0; col[i*3+1]=0.9; col[i*3+2]=0.6; }
      else { col[i*3]=1.0; col[i*3+1]=0.4; col[i*3+2]=0.4; }
    }
    return [pos, sz, col];
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uVelocity: { value: new THREE.Vector3(0, 0, -1) },
    uSpeed: { value: 0 },
    uResolution: { value: effectiveResolution }
  }), []);

  const vertexShader = `
    uniform float uTime;
    uniform vec3 uVelocity;
    uniform float uSpeed;
    uniform float uResolution;
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vColor = color;
      vec3 pos = position;
      
      float stretch = uSpeed * 0.08;
      vec3 vDir = normalize(uVelocity);
      float alignment = dot(vDir, normalize(pos));
      vec3 offset = vDir * alignment * stretch;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos + offset, 1.0);
      gl_PointSize = size * (1.0 + uSpeed * 0.02) * (800.0 / -mvPosition.z);
      
      vAlpha = clamp(1.2 / (uResolution + 0.1), 0.4, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float r = length(gl_PointCoord - vec2(0.5));
      if (r > 0.5) discard;
      float mask = pow(1.0 - r * 2.0, 2.0);
      gl_FragColor = vec4(vColor * 2.5, vAlpha * mask);
    }
  `;

  useFrame((state) => {
    if (materialRef.current) {
      const speed = (state.scene as any).__shipSpeed || 0;
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uSpeed.value = speed;
      materialRef.current.uniforms.uResolution.value = effectiveResolution;
    }
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

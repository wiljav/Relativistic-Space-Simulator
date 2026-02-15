
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { Hud, OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

interface RelativisticOverlayProps {
  gamma: number;
  resolution: number;
  active: boolean;
}

export const RelativisticOverlay: React.FC<RelativisticOverlayProps> = ({ gamma, resolution, active }) => {
  const { viewport } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    uTime: { value: 0.0 },
    uSaturation: { value: 0.0 },
    uGamma: { value: 1.0 }
  }), [viewport.width, viewport.height]);

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uSaturation;
    uniform float uGamma;
    varying vec2 vUv;

    float random(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec2 uv = vUv;
      vec2 center = vec2(0.5);
      vec2 distVec = uv - center;
      float dist = length(distVec);
      
      // Smooth Chromatic Dispersion (Atmospheric)
      float dispersion = (uGamma - 1.0) * 0.015;
      
      // Static noise for "quantum grain"
      float noise = random(uv + uTime * 0.05) * (uSaturation * 0.12);
      
      // Subtle Star-Speed streaks
      float streak = step(0.9992, fract(uv.x * 100.0 + uv.y * 2.0 + uTime * 2.0)) * uSaturation * 0.3;
      
      vec3 tint = vec3(0.0, 0.7, 1.0);
      float alpha = noise + streak + (dist * uSaturation * 0.15);

      // Smooth circular vignette to keep the center clear
      float vignette = smoothstep(0.8, 0.2, dist);
      alpha *= (1.0 - vignette * 0.5);

      gl_FragColor = vec4(tint, alpha * 0.3);
    }
  `;

  useFrame((state) => {
    if (!materialRef.current || !active) return;
    const safeGamma = Math.max(1.0, gamma);
    // Effects start scaling after 10% of C
    const sat = Math.max(0, Math.min(1.0, (safeGamma - 1.005) / 5.0));
    
    materialRef.current.uniforms.uSaturation.value = sat;
    materialRef.current.uniforms.uGamma.value = safeGamma;
    materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  if (!active) return null;

  return (
    <Hud>
      <OrthographicCamera makeDefault position={[0, 0, 10]} />
      <mesh pointerEvents="none">
        <planeGeometry args={[2, 2]} />
        <shaderMaterial
          ref={materialRef}
          transparent={true}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </Hud>
  );
};

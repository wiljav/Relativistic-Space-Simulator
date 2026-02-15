
import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { UNIVERSAL_CONSTANTS } from '../constants';
import { calculateGravityForce, checkMeasurement } from '../services/physicsEngine';

// Correctly extend React.JSX for React 18+ and R3F support
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

export const Fuzzball: React.FC<{ resetTrigger?: number }> = ({ resetTrigger = 0 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = UNIVERSAL_CONSTANTS.ATOM_COUNT;
  const velocities = useRef(new Float32Array(count * 3));

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 40 + Math.random() * 60;
      const angle = Math.random() * Math.PI * 2;
      pos[i*3] = Math.cos(angle) * r; pos[i*3+1] = (Math.random()-0.5)*10; pos[i*3+2] = Math.sin(angle) * r;
    }
    return pos;
  }, [count]);

  useEffect(() => {
    if (!pointsRef.current) return;
    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const r = 2 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      posArr[i*3] = r * Math.sin(phi) * Math.cos(theta);
      posArr[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      posArr[i*3+2] = r * Math.cos(phi);
      const s = UNIVERSAL_CONSTANTS.INFLATION_FORCE * (0.5 + Math.random());
      velocities.current[i*3] = (posArr[i*3]/r)*s; velocities.current[i*3+1] = (posArr[i*3+1]/r)*s; velocities.current[i*3+2] = (posArr[i*3+2]/r)*s;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  }, [resetTrigger, count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArr = posAttr.array as Float32Array;
    const vArr = velocities.current;
    const dt = Math.min(delta, 0.03);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const x = posArr[i3], y = posArr[i3+1], z = posArr[i3+2];
      const dist = Math.sqrt(x*x + y*y + z*z);
      const f = calculateGravityForce(1, 1, checkMeasurement(dist));
      vArr[i3] -= (x/dist)*f*dt; vArr[i3+1] -= (y/dist)*f*dt; vArr[i3+2] -= (z/dist)*f*dt;
      vArr[i3]*=0.99; vArr[i3+1]*=0.99; vArr[i3+2]*=0.99;
      posArr[i3]+=vArr[i3]*dt; posArr[i3+1]+=vArr[i3+1]*dt; posArr[i3+2]+=vArr[i3+2]*dt;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[2.5, 32, 32]} />
        <meshBasicMaterial color={UNIVERSAL_CONSTANTS.FUZZBALL_CORE_COLOR} />
        <pointLight intensity={300} color={UNIVERSAL_CONSTANTS.FUZZBALL_CORE_COLOR} distance={400} />
      </mesh>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={count} array={initialPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.8} color={UNIVERSAL_CONSTANTS.ATOM_COLOR} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </group>
  );
};

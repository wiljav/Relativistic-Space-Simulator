
import React, { useRef, useState } from 'react';
import { useFrame, ThreeElements } from '@react-three/fiber';
import * as THREE from 'three';
import { UNIVERSAL_CONSTANTS } from '../constants';

// Correctly extend React.JSX for React 18+ and R3F support
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

interface Photon {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: string;
}

export const PhotonCollider: React.FC<{ active: boolean; onCollision: (density: number) => void }> = ({ active, onCollision }) => {
  const [burst, setBurst] = useState<{ pos: THREE.Vector3; time: number } | null>(null);
  const photon1 = useRef<Photon>({
    pos: new THREE.Vector3(-100, 10, 0),
    vel: new THREE.Vector3(UNIVERSAL_CONSTANTS.CONSTANT_C, 0, 0),
    color: '#00f2ff'
  });
  const photon2 = useRef<Photon>({
    pos: new THREE.Vector3(100, 10, 0),
    vel: new THREE.Vector3(-UNIVERSAL_CONSTANTS.CONSTANT_C, 0, 0),
    color: '#ff00ff'
  });

  const mesh1 = useRef<THREE.Mesh>(null);
  const mesh2 = useRef<THREE.Mesh>(null);
  const burstRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!active) return;

    // Movement at CONST_C
    const dt = Math.min(delta, 0.05);
    photon1.current.pos.add(photon1.current.vel.clone().multiplyScalar(dt));
    photon2.current.pos.add(photon2.current.vel.clone().multiplyScalar(dt));

    const diff = new THREE.Vector3().subVectors(photon1.current.pos, photon2.current.pos);
    const dist = diff.length();
    
    // Collision Density Calculation: Flat-lines at 1.0 (Resolution Floor)
    const density = 1.0 / Math.max(dist, 1.0);
    onCollision(density);

    // Hardcoded Repulsive Force at distance < 1.0 Lp
    if (dist < 1.0) {
      // Calculate repulsion vector
      const repulsionDir = diff.clone().normalize();
      // Strong repulsive force to counter momentum and prevent overlap
      const forceMag = UNIVERSAL_CONSTANTS.CONSTANT_C * 15.0 * (1.1 - dist);
      
      const p1Repulsion = repulsionDir.clone().multiplyScalar(forceMag);
      const p2Repulsion = repulsionDir.clone().multiplyScalar(-forceMag);

      // Forcefully adjust velocity to avoid dropping below 1.0 Lp
      photon1.current.vel.add(p1Repulsion);
      photon2.current.vel.add(p2Repulsion);

      // Fix: Call dot() on the velocity (Vector3) property, not on the Photon object
      if (photon1.current.vel.dot(repulsionDir) < 0) {
        const scatterDir1 = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(UNIVERSAL_CONSTANTS.CONSTANT_C);
        
        photon1.current.vel.copy(scatterDir1);
        photon2.current.vel.copy(scatterDir1.clone().multiplyScalar(-1));
        
        setBurst({ pos: photon1.current.pos.clone(), time: state.clock.elapsedTime });
      }
    }

    // Reset if they drift too far
    if (photon1.current.pos.length() > 400) {
       photon1.current.pos.set(-100, 10, 0);
       photon1.current.vel.set(UNIVERSAL_CONSTANTS.CONSTANT_C, 0, 0);
       photon2.current.pos.set(100, 10, 0);
       photon2.current.vel.set(-UNIVERSAL_CONSTANTS.CONSTANT_C, 0, 0);
    }

    if (mesh1.current) mesh1.current.position.copy(photon1.current.pos);
    if (mesh2.current) mesh2.current.position.copy(photon2.current.pos);
    
    if (burstRef.current && burst) {
      const age = state.clock.elapsedTime - burst.time;
      const scale = 1 + age * 25;
      burstRef.current.position.copy(burst.pos);
      burstRef.current.scale.set(scale, scale, scale);
      (burstRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 1 - age * 3);
    }
  });

  if (!active) return null;

  return (
    <group>
      <mesh ref={mesh1}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={photon1.current.color} emissive={photon1.current.color} emissiveIntensity={15} />
        <pointLight color={photon1.current.color} intensity={8} distance={15} />
      </mesh>
      <mesh ref={mesh2}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={photon2.current.color} emissive={photon2.current.color} emissiveIntensity={15} />
        <pointLight color={photon2.current.color} intensity={8} distance={15} />
      </mesh>
      <mesh ref={burstRef} visible={!!burst}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff" 
          emissiveIntensity={30} 
          transparent 
          opacity={0.8} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

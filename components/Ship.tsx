
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { UNIVERSAL_CONSTANTS, CameraMode } from '../constants';
import { KeyboardState } from '../types';
import { 
  getRelativisticForce, 
  getGamma,
  calculateEffectiveResolution,
  calculateGravityForce,
  checkMeasurement
} from '../services/physicsEngine';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

interface GravitySource {
  id: string;
  position: [number, number, number];
  size: number;
  isCore?: boolean;
}

interface ShipProps {
  keys: KeyboardState;
  cameraMode: CameraMode;
  onStateUpdate: (v: number, p: [number, number, number], res: number) => void;
  resetTrigger?: number;
  uiNavIntent?: { x: number; y: number; z: number; boost: boolean } | null;
  gravitySources?: GravitySource[];
}

export const Ship: React.FC<ShipProps> = ({ 
  keys, 
  cameraMode, 
  onStateUpdate, 
  resetTrigger, 
  uiNavIntent,
  gravitySources = []
}) => {
  const { camera, scene } = useThree();
  const visualGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  
  const [ref, api] = useBox(() => ({
    mass: UNIVERSAL_CONSTANTS.SHIP_MASS,
    position: [0, 5, 200],
    linearDamping: 0.95, 
    angularDamping: 0.995, 
    allowSleep: false,
    args: [4, 2, 8],
  }));

  const velocity = useRef([0, 0, 0]);
  const position = useRef([0, 5, 200]);
  const rotation = useRef([0, 0, 0]);

  useEffect(() => {
    const unsubPos = api.position.subscribe(v => (position.current = v));
    const unsubVel = api.velocity.subscribe(v => (velocity.current = v));
    const unsubRot = api.rotation.subscribe(v => (rotation.current = v));
    return () => {
      unsubPos(); unsubVel(); unsubRot();
    };
  }, [api]);

  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      api.position.set(0, 5, 200);
      api.velocity.set(0, 0, 0);
      api.rotation.set(0, 0, 0);
    }
  }, [resetTrigger, api]);

  const smoothedCamPos = useMemo(() => new THREE.Vector3(0, 5, 230), []);
  const shipWorldPos = useMemo(() => new THREE.Vector3(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const currentV = Math.sqrt(velocity.current[0] ** 2 + velocity.current[1] ** 2 + velocity.current[2] ** 2);
    const gamma = getGamma(currentV);
    const effectiveRes = calculateEffectiveResolution(gamma);

    onStateUpdate(currentV, position.current as [number, number, number], effectiveRes);
    
    (scene as any).__shipVelocity = new THREE.Vector3(...velocity.current);
    (scene as any).__shipSpeed = currentV;

    // --- GRAVITY CALCULATION ---
    shipWorldPos.set(...(position.current as [number, number, number]));
    
    gravitySources.forEach(source => {
      const sourcePos = new THREE.Vector3(...source.position);
      const direction = new THREE.Vector3().subVectors(sourcePos, shipWorldPos);
      const distance = checkMeasurement(direction.length());
      
      // Calculate mass based on size. Planets are much denser than the ship.
      // Use a volumetric mass scale: size^3 / factor
      const bodyMass = source.isCore 
        ? UNIVERSAL_CONSTANTS.GRAVITY_STRENGTH 
        : (Math.pow(source.size, 3) / 100);

      const forceMagnitude = calculateGravityForce(UNIVERSAL_CONSTANTS.SHIP_MASS, bodyMass, distance);
      const gravityForceVector = direction.normalize().multiplyScalar(forceMagnitude * 0.1); // Scaled for playability
      
      api.applyForce(gravityForceVector.toArray(), [0, 0, 0]);
    });

    // --- MOVEMENT PHYSICS ---
    const boostActive = keys.boost || uiNavIntent?.boost;
    const thrustMultiplier = boostActive ? 40.0 : 16.0;
    const adjustedThrust = getRelativisticForce(UNIVERSAL_CONSTANTS.THRUST * thrustMultiplier, currentV);
    
    const shipRotation = new THREE.Euler(...rotation.current);
    const shipQuaternion = new THREE.Quaternion().setFromEuler(shipRotation);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(shipQuaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(shipQuaternion);

    const moveZ = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0) + (uiNavIntent?.z || 0);
    const moveY = (keys.up ? 1 : 0) - (keys.down ? 1 : 0) + (uiNavIntent?.y || 0);
    const moveX = (keys.left ? 1 : 0) - (keys.right ? 1 : 0) + (uiNavIntent?.x || 0);

    if (moveZ !== 0) api.applyForce(forward.clone().multiplyScalar(adjustedThrust * moveZ).toArray(), [0, 0, 0]);
    if (moveY !== 0) api.applyForce(up.clone().multiplyScalar(adjustedThrust * moveY * 0.5).toArray(), [0, 0, 0]);
    
    const rotForce = getRelativisticForce(UNIVERSAL_CONSTANTS.ROTATION_SPEED * 80, currentV);
    if (moveX !== 0) api.applyTorque(up.clone().multiplyScalar(-moveX * rotForce).toArray());

    // Core pulsing effect
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 4.0;
      const pulse = Math.sin(state.clock.elapsedTime * 10) * 0.15 + 1;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }

    // Camera follow
    if (cameraMode === CameraMode.SHIP) {
      const camOffset = new THREE.Vector3(0, 6, 26).applyQuaternion(shipQuaternion);
      const targetCamPos = shipWorldPos.clone().add(camOffset);
      const lerpFactor = Math.min(1, delta * 12);
      smoothedCamPos.lerp(targetCamPos, lerpFactor);
      camera.position.copy(smoothedCamPos);
      camera.lookAt(shipWorldPos);
    }

    if (shipWorldPos.length() > UNIVERSAL_CONSTANTS.MAX_BOUNDS) {
       api.position.set(0, 5, 200);
       api.velocity.set(0, 0, 0);
    }
  });

  return (
    <group ref={ref as any}>
      <group ref={visualGroupRef}>
        <mesh castShadow>
          <cylinderGeometry args={[1.1, 1.5, 6, 32]} rotation={[Math.PI / 2, 0, 0]} />
          <meshPhysicalMaterial 
            color="#ffffff" 
            roughness={0.0} 
            metalness={1.0} 
            reflectivity={1.0}
            clearcoat={1.0}
          />
        </mesh>
        
        <mesh position={[2.8, 0, 1.5]}>
          <boxGeometry args={[3.2, 0.4, 2.2]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2.5} metalness={0.9} />
        </mesh>
        <mesh position={[-2.8, 0, 1.5]}>
          <boxGeometry args={[3.2, 0.4, 2.2]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2.5} metalness={0.9} />
        </mesh>

        <mesh position={[0, 0, 3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.3, 1.4, 1.4, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={1} />
        </mesh>

        <mesh position={[0, 0, 3.8]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.2, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        <mesh position={[0, 0.8, -2.4]} rotation={[0.4, 0, 0]}>
          <sphereGeometry args={[1.0, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color="#00f2ff" transparent opacity={0.3} transmission={1.0} emissiveIntensity={1.0} />
        </mesh>

        <mesh position={[4.5, 0, 2.8]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
        <mesh position={[-4.5, 0, 2.8]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color="#ff00ff" />
        </mesh>

        <mesh ref={coreRef} position={[0, 0, 0]}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color="#ffffff" emissive="#00f2ff" emissiveIntensity={120} wireframe />
        </mesh>
        
        <pointLight position={[0, 0, 6]} intensity={200} color="#00ffff" distance={120} />
      </group>
    </group>
  );
};

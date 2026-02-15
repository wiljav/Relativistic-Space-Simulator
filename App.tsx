
import React, { useState, Suspense, useRef, useCallback, useMemo } from 'react';
import { Canvas, useFrame, ThreeElements } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { OrbitControls, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Ship } from './components/Ship';
import { Starfield } from './components/Starfield';
import { UIOverlay } from './components/UIOverlay';
import { RelativisticOverlay } from './components/RelativisticOverlay';
import { Fuzzball } from './components/Fuzzball';
import { PhotonCollider } from './components/PhotonCollider';
import { useKeyboard } from './hooks/useKeyboard';
import { ShipState } from './types';
import { CameraMode, UNIVERSAL_CONSTANTS } from './constants';
import { getGamma, calculateEffectiveResolution } from './services/physicsEngine';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements {}
    }
  }
}

// Define the "Truth" for all celestial bodies
const CELESTIAL_BODIES = [
  { id: 'sun', position: [150, 80, -200] as [number, number, number], size: 45, color: "#ff4d00", emissive: true },
  { id: 'cyan-giant', position: [-400, -100, -800] as [number, number, number], size: 55, color: "#00ffff", emissive: true },
  { id: 'fuchsia-giant', position: [500, 300, -2000] as [number, number, number], size: 90, color: "#ff00ff", emissive: true },
  { id: 'singularity', position: [-1200, 600, -5000] as [number, number, number], size: 400, color: "#ffffff", emissive: true },
  { id: 'yellow-world', position: [300, -400, -1200] as [number, number, number], size: 40, color: "#ffff00", emissive: true },
  { id: 'green-moon', position: [-100, 500, -1500] as [number, number, number], size: 30, color: "#00ff00", emissive: true },
  // The central Fuzzball (Black Hole) is at [0,0,0] with size 2.5 conceptually, but high mass
  { id: 'central-blackhole', position: [0, 0, 0] as [number, number, number], size: 25, color: "#ff00ff", emissive: false, isCore: true }
];

const CelestialBody: React.FC<{ position: [number, number, number], size: number, color: string, emissive?: boolean }> = ({ position, size, color, emissive }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const speed = (state.scene as any).__shipSpeed || 0;
      const gamma = getGamma(speed);
      
      if (gamma > 1.01) {
        const s = 1.0 / gamma;
        meshRef.current.scale.set(1, 1, s);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 64, 64]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={emissive ? 25 : 5} 
        roughness={0.1} 
        metalness={0.2}
      />
      <pointLight color={color} intensity={emissive ? 800 : 300} distance={size * 40} decay={2} />
    </mesh>
  );
};

const App: React.FC = () => {
  const [shipState, setShipState] = React.useState<ShipState>({
    velocity: 0,
    position: [0, 5, 200],
    resolution: UNIVERSAL_CONSTANTS.MIN_RESOLUTION,
  });
  const [cameraMode, setCameraMode] = React.useState<CameraMode>(CameraMode.SHIP);
  const [simulatedVelocity, setSimulatedVelocity] = React.useState(0); 
  const [bigBangTrigger, setBigBangTrigger] = React.useState(0);
  const [photonActive, setPhotonActive] = React.useState(false);
  const [collisionDensity, setCollisionDensity] = React.useState(0);
  const [navIntent, setNavIntent] = React.useState<{ x: number; y: number; z: number; boost: boolean } | null>(null);
  const keys = useKeyboard();
  
  const controlsRef = React.useRef<any>(null);

  const gamma = useMemo(() => getGamma(simulatedVelocity * UNIVERSAL_CONSTANTS.CONSTANT_C), [simulatedVelocity]);
  const effectiveRes = useMemo(() => calculateEffectiveResolution(gamma), [gamma]);

  const handleShipStateUpdate = useCallback((v: number, p: [number, number, number], res: number) => {
    setShipState({ velocity: v, position: p, resolution: res });
  }, []);

  const triggerBigBang = useCallback(() => {
    setBigBangTrigger(prev => prev + 1);
  }, []);

  const controlsAPI = useMemo(() => ({
    zoom: (delta: number) => {
      if (controlsRef.current) {
        const camera = controlsRef.current.object;
        if (camera) {
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          camera.position.addScaledVector(direction, -delta);
          controlsRef.current.update();
        }
      }
    },
    rotate: (azimuth: number, polar: number) => {
      if (controlsRef.current) {
        controlsRef.current.rotateLeft(azimuth * 5);
        controlsRef.current.rotateUp(polar * 5);
        controlsRef.current.update();
      }
    },
    reset: () => {
      if (controlsRef.current) {
        controlsRef.current.reset();
        controlsRef.current.object.position.set(300, 300, 300);
        controlsRef.current.update();
      }
    }
  }), []);

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <Canvas shadows camera={{ fov: 65, position: [0, 5, 240] }}>
        <Suspense fallback={null}>
          <color attach="background" args={['#000000']} />
          
          <OrbitControls 
            ref={controlsRef}
            enabled={cameraMode === CameraMode.GOD} 
            makeDefault
          />

          <RelativisticOverlay 
            active={cameraMode === CameraMode.SHIP} 
            gamma={gamma} 
            resolution={effectiveRes} 
          />

          <ambientLight intensity={0.5} />
          
          <Physics 
            gravity={[0, 0, 0]} 
            defaultContactMaterial={{ friction: 0 }}
            stepSize={1/60}
          >
            <Ship 
              keys={keys} 
              cameraMode={cameraMode} 
              onStateUpdate={handleShipStateUpdate}
              resetTrigger={bigBangTrigger}
              uiNavIntent={navIntent}
              gravitySources={CELESTIAL_BODIES}
            />
            
            <Fuzzball resetTrigger={bigBangTrigger} />
            <PhotonCollider active={photonActive} onCollision={setCollisionDensity} />

            {/* Render all celestial bodies from the source list */}
            {CELESTIAL_BODIES.filter(b => !b.isCore).map(body => (
              <CelestialBody 
                key={body.id} 
                position={body.position} 
                size={body.size} 
                color={body.color} 
                emissive={body.emissive} 
              />
            ))}
          </Physics>

          <Starfield effectiveResolution={effectiveRes} />
          <Stars radius={4000} depth={500} count={20000} factor={8} saturation={1} fade speed={4} />
          <Environment preset="city" />
        </Suspense>
      </Canvas>

      <UIOverlay 
        shipState={shipState} 
        cameraMode={cameraMode} 
        setCameraMode={setCameraMode} 
        controlsAPI={controlsAPI}
        simulatedVelocity={simulatedVelocity}
        setSimulatedVelocity={setSimulatedVelocity}
        onResetUniverse={triggerBigBang}
        photonActive={photonActive}
        setPhotonActive={setPhotonActive}
        collisionDensity={collisionDensity}
        onNavIntent={setNavIntent}
      />
    </div>
  );
};

export default App;

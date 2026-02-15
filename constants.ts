
export const UNIVERSAL_CONSTANTS = {
  CONSTANT_C: 300, // Speed of Light (scaled units/s)
  MIN_RESOLUTION: 1.0, // The Planck Floor
  G: 6.674, // Gravitational Constant
  MAX_BOUNDS: 15000, 
  THRUST: 1800, 
  ROTATION_SPEED: 6.0, // Reduced from 15.0 for much smoother handling
  DAMPING: 0.96, // Slightly higher damping for "heavy" cinematic feel
  SHIP_MASS: 1.5,
  
  // Black Hole / Singularity Constants
  GRAVITY_STRENGTH: 45000, 
  EVENT_HORIZON_RADIUS: 25,
  ATOM_COUNT: 2000,
  FUZZBALL_CORE_COLOR: '#ff00ff',
  ATOM_COLOR: '#00f2ff',

  // Big Bang / Inflation Constants
  INFLATION_FORCE: 1500,
  BIG_BANG_INITIAL_RADIUS: 10
};

export enum CameraMode {
  SHIP = 'SHIP',
  GOD = 'GOD'
}

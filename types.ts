
export interface ShipState {
  velocity: number;
  position: [number, number, number];
  resolution: number;
}

export interface KeyboardState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  boost: boolean;
}

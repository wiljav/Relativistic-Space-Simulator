
import { UNIVERSAL_CONSTANTS } from "../constants";

/**
 * The Resolution Floor Equation (Planck Length scaling)
 * effective_res = max(1.0, 1.616 / gamma)
 * As v -> C, gamma increases, and the apparent size of the Planck floor contracts.
 */
export const calculatePlanckResolution = (velocity: number): number => {
  const beta = Math.min(velocity / UNIVERSAL_CONSTANTS.CONSTANT_C, 0.9999);
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const contractedLp = 1.616 / gamma;
  
  // Logical Rule: Hard cap at 1.000
  return Math.max(1.0, contractedLp);
};

/**
 * The Capped Eye Rule for Simulation Geometry
 */
export const calculateEffectiveResolution = (gamma: number): number => {
  const predicted = 1.0 / gamma;
  return Math.max(predicted, UNIVERSAL_CONSTANTS.MIN_RESOLUTION);
};

/**
 * Capped Eye Check Function
 */
export const checkMeasurement = (value: number): number => {
  return Math.max(value, UNIVERSAL_CONSTANTS.MIN_RESOLUTION);
};

/**
 * Relativistic Gamma Factor
 */
export const getGamma = (velocity: number): number => {
  const beta = Math.min(velocity / UNIVERSAL_CONSTANTS.CONSTANT_C, 0.9999);
  return 1 / Math.sqrt(Math.max(0.0001, 1 - beta * beta));
};

/**
 * Final Physics: Gravity Plateau
 * Force = G / Math.max(r_squared, 1.0)
 */
export const calculateGravityForce = (m1: number, m2: number, distance: number): number => {
  const distSq = distance * distance;
  const clampedDenominator = Math.max(distSq, 1.0);
  return (UNIVERSAL_CONSTANTS.G * m1 * m2) / clampedDenominator;
};

/**
 * Relativistic Acceleration Adjustment
 */
export const getRelativisticForce = (baseForce: number, velocity: number): number => {
  const gamma = getGamma(velocity);
  return baseForce / gamma;
};

/**
 * Time Dilation Logic
 */
export const getShipDelta = (worldDelta: number, velocity: number): number => {
  const gamma = getGamma(velocity);
  return worldDelta / gamma;
};

// Unit conversion utilities
export type UnitSystem = 'imperial' | 'metric';

// 1 foot = 0.3048 meters
const FEET_TO_METERS = 0.3048;
// 1 inch = 2.54 centimeters
const INCHES_TO_CM = 2.54;

export function convertLength(value: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to) return value;
  
  if (from === 'imperial' && to === 'metric') {
    // Convert feet to meters
    return value * FEET_TO_METERS;
  } else {
    // Convert meters to feet
    return value / FEET_TO_METERS;
  }
}

export function formatLength(inches: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const feet = Math.floor(inches / 12);
    const remainingInches = inches % 12;
    
    // Truncate to 2 decimal places (not round)
    const truncatedInches = Math.floor(remainingInches * 100) / 100;
    
    if (feet === 0) {
      return `${truncatedInches.toFixed(2)}"`;
    } else if (truncatedInches === 0) {
      return `${feet}'`;
    } else {
      return `${feet}'-${truncatedInches.toFixed(2)}"`;
    }
  } else {
    // Convert to metric (cm)
    const totalCm = inches * INCHES_TO_CM;
    
    // Truncate to 2 decimal places (not round)
    const truncatedCm = Math.floor(totalCm * 100) / 100;
    
    const meters = Math.floor(truncatedCm / 100);
    const remainingCm = truncatedCm % 100;
    
    if (meters === 0) {
      return `${truncatedCm.toFixed(2)} cm`;
    } else {
      const totalMeters = truncatedCm / 100;
      // Truncate meters to 2 decimal places
      const truncatedMeters = Math.floor(totalMeters * 100) / 100;
      return `${truncatedMeters.toFixed(2)} m`;
    }
  }
}

export function formatArea(sqFeet: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${sqFeet.toFixed(2)} sq ft`;
  } else {
    // Convert sq ft to sq m (1 sq ft = 0.092903 sq m)
    const sqMeters = sqFeet * 0.092903;
    
    // Truncate to 2 decimal places (not round)
    const truncatedSqMeters = Math.floor(sqMeters * 100) / 100;
    
    return `${truncatedSqMeters.toFixed(2)} sq m`;
  }
}
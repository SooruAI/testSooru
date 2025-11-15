import { formatLength, formatArea } from './unitConversion';

export const formatImperialLength = (totalFeet: number, unitSystem: 'imperial' | 'metric' = 'imperial'): string => {
  if (unitSystem === 'metric') {
    return formatLength(totalFeet * 12, unitSystem); // Convert feet to inches first
  }
  const feet = Math.floor(totalFeet);
  const remainingInches = ((totalFeet - feet) * 12);
  
  // Format inches to 2 decimal places
  const inchesFormatted = remainingInches.toFixed(2);
  
  if (feet === 0) {
    return `${inchesFormatted}"`;
  } else if (parseFloat(inchesFormatted) === 0) {
    return `${feet}'`;
  } else {
    return `${feet}'-${inchesFormatted}"`;
  }
};

export const formatImperialArea = (squareFeet: number, unitSystem: 'imperial' | 'metric' = 'imperial'): string => {
  if (unitSystem === 'metric') {
    return formatArea(squareFeet, unitSystem);
  }
  return `${squareFeet.toFixed(2)} sq ft`;
};

export const coordToInches = (coordValue: number): number => {
  return coordValue;
};
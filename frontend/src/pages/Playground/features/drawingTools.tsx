// features/drawingTools.tsx
import { Point } from './types';

export interface DrawingState {
  isActive: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  tool: 'wall' | 'room' | null;
  previewPoints: Point[];
}


export function calculateDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
}


export function generateRoomPolygon(startPoint: Point, endPoint: Point): Point[] {
  return [
    { x: startPoint.x, z: startPoint.z },
    { x: endPoint.x, z: startPoint.z },   
    { x: endPoint.x, z: endPoint.z },     
    { x: startPoint.x, z: endPoint.z }    
  ];
}

export function generateUniqueId(prefix: string): string {
  return `${prefix}|${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function createWallPolygon(startPoint: Point, endPoint: Point): Point[] {
    return [
      { x: startPoint.x, z: startPoint.z },
      { x: endPoint.x, z: endPoint.z }
    ];
  }
  
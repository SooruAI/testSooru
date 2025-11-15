// features/coordinates.tsx
import { useCallback } from "react";

interface Point {
  x: number;
  z: number;
}

interface Room {
  id: string;
  room_type: string;
  area: number;
  height: number;
  width: number;
  floor_polygon: Point[];
}

export function calculateBounds(rooms: Room[]) {
  const validRooms = rooms.filter(room => 
    room && 
    room.floor_polygon && 
    Array.isArray(room.floor_polygon) && 
    room.floor_polygon.length > 0
  );
  
  if (validRooms.length === 0) {
    return { minX: 0, maxX: 100, minZ: 0, maxZ: 100 };
  }
  
  const allPoints = validRooms.flatMap((room) => 
    room.floor_polygon.filter(point => 
      point && 
      typeof point.x === 'number' && 
      typeof point.z === 'number' &&
      !isNaN(point.x) &&
      !isNaN(point.z)
    )
  );
  
  if (allPoints.length === 0) {
    return { minX: 0, maxX: 100, minZ: 0, maxZ: 100 };
  }
  
  const minX = Math.min(...allPoints.map((p) => p.x));
  const maxX = Math.max(...allPoints.map((p) => p.x));
  const minZ = Math.min(...allPoints.map((p) => p.z));
  const maxZ = Math.max(...allPoints.map((p) => p.z));
  
  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minZ) || !isFinite(maxZ)) {
    return { minX: 0, maxX: 100, minZ: 0, maxZ: 100 };
  }
  
  return { minX, maxX, minZ, maxZ };
}

export function useCoordinateTransforms(bounds: { minX: number; minZ: number; maxX: number; maxZ: number }, padding: number, scale: number) {
  const transformCoordinates = useCallback(
    (point: Point) => {
      if (!point || typeof point.x !== 'number' || typeof point.z !== 'number') {
        return { x: 0, y: 0 };
      }
      
      return {
        x: (point.x - bounds.minX + padding) * scale,
        y: (point.z - bounds.minZ + padding) * scale,
      };
    },
    [bounds.minX, bounds.minZ, padding, scale]
  );

  const reverseTransformCoordinates = useCallback(
    (x: number, y: number) => {
      return {
        x: x / scale + bounds.minX - padding,
        z: y / scale + bounds.minZ - padding,
      };
    },
    [bounds.minX, bounds.minZ, padding, scale]
  );

  return { transformCoordinates, reverseTransformCoordinates };
}
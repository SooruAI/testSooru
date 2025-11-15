import React from "react";

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
  isBoundary?: boolean;
}

interface FloorPlanData {
  room_count: number;
  total_area: number;
  room_types: string[];
  rooms: Room[];
}

function rotatePoint(point: Point, center: { x: number, z: number }, angleDegrees: number): Point {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  
  const translatedX = point.x - center.x;
  const translatedZ = point.z - center.z;
  
  const rotatedX = translatedX * Math.cos(angleRadians) - translatedZ * Math.sin(angleRadians);
  const rotatedZ = translatedX * Math.sin(angleRadians) + translatedZ * Math.cos(angleRadians);
  
  return {
    x: rotatedX + center.x,
    z: rotatedZ + center.z
  };
}

function getPolygonCenter(polygon: Point[]): { x: number, z: number } {
  const sumX = polygon.reduce((sum, p) => sum + p.x, 0);
  const sumZ = polygon.reduce((sum, p) => sum + p.z, 0);
  return {
    x: sumX / polygon.length,
    z: sumZ / polygon.length
  };
}

export function applyRotationToPolygon(polygon: Point[], rotation: number): Point[] {
  if (rotation === 0) return polygon; 
  
  const center = getPolygonCenter(polygon);
  return polygon.map(point => rotatePoint(point, center, rotation));
}

export function checkRoomOverlap(
  floorPlanData: FloorPlanData, 
  roomRotations: { [key: string]: number } = {}
): string[][] {
  const overlaps: string[][] = [];

  const isPointInPolygon = (point: Point, polygon: Point[]) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].z;
      const xj = polygon[j].x,
        yj = polygon[j].z;

      const intersect =
        yi > point.z !== yj > point.z &&
        point.x < ((xj - xi) * (point.z - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }
    return inside;
  };

  const doLineSegmentsIntersect = (
    p1: Point,
    p2: Point,
    p3: Point,
    p4: Point
  ) => {
    const d1x = p2.x - p1.x;
    const d1z = p2.z - p1.z;
    const d2x = p4.x - p3.x;
    const d2z = p4.z - p3.z;
    const det = d1x * d2z - d1z * d2x;

    if (det === 0) return false; 

    const dx = p3.x - p1.x;
    const dz = p3.z - p1.z;

    const t1 = (dx * d2z - dz * d2x) / det;
    const t2 = (dx * d1z - dz * d1x) / det;

    return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
  };

  const doPolygonsIntersect = (poly1: Point[], poly2: Point[]) => {
    for (let i = 0; i < poly1.length; i++) {
      const i2 = (i + 1) % poly1.length;

      for (let j = 0; j < poly2.length; j++) {
        const j2 = (j + 1) % poly2.length;

        if (
          doLineSegmentsIntersect(poly1[i], poly1[i2], poly2[j], poly2[j2])
        ) {
          return true;
        }
      }
    }

    if (
      isPointInPolygon(poly1[0], poly2) ||
      isPointInPolygon(poly2[0], poly1)
    ) {
      return true;
    }

    return false;
  };

  for (let i = 0; i < floorPlanData.rooms.length; i++) {
    for (let j = i + 1; j < floorPlanData.rooms.length; j++) {
      const room1 = floorPlanData.rooms[i];
      const room2 = floorPlanData.rooms[j];

if (room1.room_type === "Wall" || room2.room_type === "Wall" || 
    room1.room_type === "Reference" || room2.room_type === "Reference" ||
    room1.isBoundary === true || room2.isBoundary === true) {
  continue;
}

      const rotation1 = roomRotations[room1.id] || 0;
      const rotation2 = roomRotations[room2.id] || 0;
      
      const poly1 = applyRotationToPolygon(room1.floor_polygon, rotation1);
      const poly2 = applyRotationToPolygon(room2.floor_polygon, rotation2);

      const xCoords1 = poly1.map((p) => p.x);
      const zCoords1 = poly1.map((p) => p.z);
      const minX1 = Math.min(...xCoords1);
      const maxX1 = Math.max(...xCoords1);
      const minZ1 = Math.min(...zCoords1);
      const maxZ1 = Math.max(...zCoords1);

      const xCoords2 = poly2.map((p) => p.x);
      const zCoords2 = poly2.map((p) => p.z);
      const minX2 = Math.min(...xCoords2);
      const maxX2 = Math.max(...xCoords2);
      const minZ2 = Math.min(...zCoords2);
      const maxZ2 = Math.max(...zCoords2);

      const tolerance = 1.0;
      const boxesOverlap = !(
        maxX1 <= minX2 + tolerance ||
        minX1 >= maxX2 - tolerance ||
        maxZ1 <= minZ2 + tolerance ||
        minZ1 >= maxZ2 - tolerance
      );

      if (!boxesOverlap) continue;

      if (doPolygonsIntersect(poly1, poly2)) {
        overlaps.push([room1.id, room2.id]);
      }
    }
  }

  return overlaps;
}
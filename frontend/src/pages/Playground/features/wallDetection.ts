// features/wallDetection.ts
import { Point, Room } from './types';

export interface WallInfo {
  roomId: string;
  wallIndex: number;
  position: Point;
  rotation: number;
  isVertical: boolean;
  wallStart: Point;
  wallEnd: Point;
}

export function detectWallFromClick(
  clickPoint: Point,
  rooms: Room[],
  tolerance: number = 10
): WallInfo | null {
  for (const room of rooms) {
    if (room.room_type === "Wall") continue;

    const polygon = room.floor_polygon;

    for (let i = 0; i < polygon.length; i++) {
      const currentPoint = polygon[i];
      const nextPoint = polygon[(i + 1) % polygon.length];
      const wallInfo = checkPointOnWallSegment(
        clickPoint,
        currentPoint,
        nextPoint,
        tolerance,
        room.id,
        i
      );

      if (wallInfo) {
        return wallInfo;
      }
    }
  }

  return null;
}

function checkPointOnWallSegment(
  clickPoint: Point,
  wallStart: Point,
  wallEnd: Point,
  tolerance: number,
  roomId: string,
  wallIndex: number
): WallInfo | null {
  const distance = distancePointToLineSegment(clickPoint, wallStart, wallEnd);

  if (distance <= tolerance) {
    const closestPoint = getClosestPointOnLineSegment(clickPoint, wallStart, wallEnd);
    const dx = wallEnd.x - wallStart.x;
    const dz = wallEnd.z - wallStart.z;

    let rotation = Math.atan2(dz, dx) * (180 / Math.PI);

    if (rotation < 0) rotation += 360;

    const isVertical = Math.abs(dx) < Math.abs(dz);

    return {
      roomId,
      wallIndex,
      position: closestPoint,
      rotation,
      isVertical,
      wallStart,
      wallEnd
    };
  }

  return null;
}

function distancePointToLineSegment(point: Point, lineStart: Point, lineEnd: Point): number {
  const A = point.x - lineStart.x;
  const B = point.z - lineStart.z;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.z - lineStart.z;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) {
    return Math.sqrt(A * A + B * B);
  }

  let param = dot / lenSq;

  let xx, zz;

  if (param < 0) {
    xx = lineStart.x;
    zz = lineStart.z;
  } else if (param > 1) {
    xx = lineEnd.x;
    zz = lineEnd.z;
  } else {
    xx = lineStart.x + param * C;
    zz = lineStart.z + param * D;
  }

  const dx = point.x - xx;
  const dz = point.z - zz;

  return Math.sqrt(dx * dx + dz * dz);
}

function getClosestPointOnLineSegment(point: Point, lineStart: Point, lineEnd: Point): Point {
  const A = point.x - lineStart.x;
  const B = point.z - lineStart.z;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.z - lineStart.z;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) {
    return lineStart;
  }

  let param = dot / lenSq;

  param = Math.max(0, Math.min(1, param));

  return {
    x: lineStart.x + param * C,
    z: lineStart.z + param * D
  };
}

export function getWallDirection(wallStart: Point, wallEnd: Point): 'horizontal' | 'vertical' | 'diagonal' {
  const dx = Math.abs(wallEnd.x - wallStart.x);
  const dz = Math.abs(wallEnd.z - wallStart.z);

  if (dx > dz * 2) {
    return 'horizontal';
  } else if (dz > dx * 2) {
    return 'vertical';
  } else {
    return 'diagonal';
  }
}

export function calculateDoorWindowRotation(wallStart: Point, wallEnd: Point): number {
  const dx = wallEnd.x - wallStart.x;
  const dz = wallEnd.z - wallStart.z;

  let angle = Math.atan2(dz, dx) * (180 / Math.PI);

  if (angle < 0) angle += 360;

  angle = Math.round(angle / 90) * 90;

  return angle % 360;
}
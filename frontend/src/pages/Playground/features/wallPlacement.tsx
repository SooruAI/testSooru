// features/wallPlacement.ts
import { Point, Room, FloorPlanData } from "./types";

export interface WallSegment {
  roomId: string;
  start: Point;
  end: Point;
  midpoint: Point;
  length: number;
  angle: number;
}

export interface SnapResult {
  isOnWall: boolean;
  snappedPosition?: Point;
  wallSegment?: WallSegment;
  distance?: number;
  suggestedRotation?: number;
}

function distancePointToLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): { distance: number; closestPoint: Point; isOnSegment: boolean } {
  const A = point.x - lineStart.x;
  const B = point.z - lineStart.z;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.z - lineStart.z;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;

  if (lenSq === 0) {
    const distance = Math.sqrt(A * A + B * B);
    return {
      distance,
      closestPoint: { x: lineStart.x, z: lineStart.z },
      isOnSegment: true,
    };
  }

  let param = dot / lenSq;
  let closestPoint: Point;
  let isOnSegment = false;

  if (param < 0) {
    closestPoint = { x: lineStart.x, z: lineStart.z };
  } else if (param > 1) {
    closestPoint = { x: lineEnd.x, z: lineEnd.z };
  } else {
    isOnSegment = true;
    closestPoint = {
      x: lineStart.x + param * C,
      z: lineStart.z + param * D,
    };
  }

  const distance = Math.sqrt(
    Math.pow(point.x - closestPoint.x, 2) +
    Math.pow(point.z - closestPoint.z, 2)
  );

  return { distance, closestPoint, isOnSegment };
}

export function getAllWallSegments(
  floorPlanData: FloorPlanData,
  roomRotations: { [key: string]: number } = {}
): WallSegment[] {
  const wallSegments: WallSegment[] = [];

  floorPlanData.rooms.forEach((room) => {
    if (room.room_type === "Wall" && room.floor_polygon.length === 2) {
      const [start, end] = room.floor_polygon;
      const rotation = roomRotations[room.id] || 0;

      let wallStart = start;
      let wallEnd = end;

      if (rotation !== 0) {
        const radians = (rotation * Math.PI) / 180;
        const centroid = {
          x: (start.x + end.x) / 2,
          z: (start.z + end.z) / 2,
        };

        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        const startDx = start.x - centroid.x;
        const startDz = start.z - centroid.z;
        const endDx = end.x - centroid.x;
        const endDz = end.z - centroid.z;

        wallStart = {
          x: centroid.x + startDx * cos - startDz * sin,
          z: centroid.z + startDx * sin + startDz * cos,
        };

        wallEnd = {
          x: centroid.x + endDx * cos - endDz * sin,
          z: centroid.z + endDx * sin + endDz * cos,
        };
      }

      const length = Math.sqrt(
        Math.pow(wallEnd.x - wallStart.x, 2) +
        Math.pow(wallEnd.z - wallStart.z, 2)
      );

      if (length >= 0.5) {
        const midpoint = {
          x: (wallStart.x + wallEnd.x) / 2,
          z: (wallStart.z + wallEnd.z) / 2,
        };

        const angle = Math.atan2(
          wallEnd.z - wallStart.z,
          wallEnd.x - wallStart.x
        );

        wallSegments.push({
          roomId: room.id,
          start: wallStart,
          end: wallEnd,
          midpoint,
          length,
          angle,
        });
      }

      return;
    }

    if (room.room_type === "Wall") return;

    if (room.floor_polygon.length < 3) return;

    const rotation = roomRotations[room.id] || 0;
    const radians = (rotation * Math.PI) / 180;

    const centroid = {
      x:
        room.floor_polygon.reduce((sum, p) => sum + p.x, 0) /
        room.floor_polygon.length,
      z:
        room.floor_polygon.reduce((sum, p) => sum + p.z, 0) /
        room.floor_polygon.length,
    };

    const rotatedPolygon = room.floor_polygon.map((point) => {
      if (rotation === 0) return point;

      const cos = Math.cos(radians);
      const sin = Math.sin(radians);
      const dx = point.x - centroid.x;
      const dz = point.z - centroid.z;

      return {
        x: centroid.x + dx * cos - dz * sin,
        z: centroid.z + dx * sin + dz * cos,
      };
    });

    for (let i = 0; i < rotatedPolygon.length; i++) {
      const start = rotatedPolygon[i];
      const end = rotatedPolygon[(i + 1) % rotatedPolygon.length];

      const length = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2)
      );

      if (length < 0.5) continue;

      const midpoint = {
        x: (start.x + end.x) / 2,
        z: (start.z + end.z) / 2,
      };

      const angle = Math.atan2(end.z - start.z, end.x - start.x);

      wallSegments.push({
        roomId: room.id,
        start,
        end,
        midpoint,
        length,
        angle,
      });
    }
  });

  return wallSegments;
}

function calculateDoorWindowRotation(wallAngle: number): number {
  let rotationDegrees = (wallAngle * 180) / Math.PI;

  while (rotationDegrees < 0) rotationDegrees += 360;
  while (rotationDegrees >= 360) rotationDegrees -= 360;

  if (rotationDegrees > 135 && rotationDegrees < 225) {
    if (rotationDegrees > 135 && rotationDegrees <= 180) {
      rotationDegrees = 0;
    } else {
      rotationDegrees = 0;
    }
  }

  if (rotationDegrees === 180) {
    rotationDegrees = 0;
  }

  return rotationDegrees;
}

export function findNearestWall(
  position: Point,
  floorPlanData: FloorPlanData,
  roomRotations: { [key: string]: number } = {},
  snapTolerance: number = 2.0
): SnapResult {
  const wallSegments = getAllWallSegments(floorPlanData, roomRotations);

  let nearestWall: WallSegment | null = null;
  let nearestDistance = Infinity;
  let nearestSnapPoint: Point | null = null;

  for (const wall of wallSegments) {
    const result = distancePointToLineSegment(position, wall.start, wall.end);
    if (result.isOnSegment && result.distance < nearestDistance) {
      nearestDistance = result.distance;
      nearestWall = wall;
      nearestSnapPoint = result.closestPoint;
    }
  }

  if (!nearestWall || nearestDistance > snapTolerance || !nearestSnapPoint) {
    return {
      isOnWall: false,
      distance: nearestDistance,
    };
  }

  const suggestedRotation = calculateDoorWindowRotation(nearestWall.angle);

  return {
    isOnWall: true,
    snappedPosition: nearestSnapPoint,
    wallSegment: nearestWall,
    distance: nearestDistance,
    suggestedRotation,
  };
}

export function isValidPlacementPosition(
  position: Point,
  floorPlanData: FloorPlanData,
  roomRotations: { [key: string]: number } = {},
  snapTolerance: number = 2.0
): boolean {
  const snapResult = findNearestWall(
    position,
    floorPlanData,
    roomRotations,
    snapTolerance
  );
  return snapResult.isOnWall;
}

export function getSnappedPlacementResult(
  position: Point,
  floorPlanData: FloorPlanData,
  roomRotations: { [key: string]: number } = {},
  snapTolerance: number = 2.0
): { position: Point; rotation: number } {
  const snapResult = findNearestWall(
    position,
    floorPlanData,
    roomRotations,
    snapTolerance
  );

  if (
    snapResult.isOnWall &&
    snapResult.snappedPosition &&
    snapResult.suggestedRotation !== undefined
  ) {
    return {
      position: snapResult.snappedPosition,
      rotation: snapResult.suggestedRotation,
    };
  }

  return {
    position,
    rotation: 0,
  };
}

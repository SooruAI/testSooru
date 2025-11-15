// features/wallUtils.ts
import { Point, Room, FloorPlanData } from "./types";

export function isExternalWallSegment(
  roomId: string,
  wallIndex: number,
  floorPlanData: FloorPlanData,
  roomRotations: { [key: string]: number } = {}
): boolean {
  const room = floorPlanData.rooms.find((r) => r.id === roomId);
  if (!room || room.room_type === "Wall") return false;

  const polygon = room.floor_polygon;
  if (wallIndex >= polygon.length) return false;

  const startPoint = polygon[wallIndex];
  const endPoint = polygon[(wallIndex + 1) % polygon.length];

  const rotation = roomRotations[roomId] || 0;
  const rotatedStart = applyRotation(startPoint, rotation);
  const rotatedEnd = applyRotation(endPoint, rotation);

  return !isWallCompletelyCovered(
    rotatedStart,
    rotatedEnd,
    roomId,
    floorPlanData,
    roomRotations
  );
}

function applyRotation(point: Point, angleDegrees: number): Point {
  if (angleDegrees === 0) return point;

  const angleRad = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  return {
    x: point.x * cos - point.z * sin,
    z: point.x * sin + point.z * cos,
  };
}

function isWallCompletelyCovered(
  wallStart: Point,
  wallEnd: Point,
  currentRoomId: string,
  floorPlanData: FloorPlanData,
  roomRotations: { [key: string]: number }
): boolean {
  const coveringSegments = getCoveringSegments(
    wallStart,
    wallEnd,
    currentRoomId,
    floorPlanData,
    roomRotations
  );

  return isWallFullyCoveredBySegments(wallStart, wallEnd, coveringSegments);
}

function getCoveringSegments(
  wallStart: Point,
  wallEnd: Point,
  currentRoomId: string,
  floorPlanData: FloorPlanData,
  roomRotations: { [key: string]: number },
  tolerance: number = 1.0
): Array<{ start: Point; end: Point }> {
  const coveringSegments: Array<{ start: Point; end: Point }> = [];

  const otherRooms = floorPlanData.rooms.filter(
    (r) => r.id !== currentRoomId && r.room_type !== "Wall"
  );

  for (const otherRoom of otherRooms) {
    const otherRotation = roomRotations[otherRoom.id] || 0;

    for (let i = 0; i < otherRoom.floor_polygon.length; i++) {
      const otherStart = applyRotation(
        otherRoom.floor_polygon[i],
        otherRotation
      );
      const otherEnd = applyRotation(
        otherRoom.floor_polygon[(i + 1) % otherRoom.floor_polygon.length],
        otherRotation
      );

      if (
        areSegmentsCollinear(
          wallStart,
          wallEnd,
          otherStart,
          otherEnd,
          tolerance
        )
      ) {
        const overlap = getOverlappingSegment(
          wallStart,
          wallEnd,
          otherStart,
          otherEnd,
          tolerance
        );
        if (overlap) {
          coveringSegments.push(overlap);
        }
      }
    }
  }

  return coveringSegments;
}

function areSegmentsCollinear(
  seg1Start: Point,
  seg1End: Point,
  seg2Start: Point,
  seg2End: Point,
  tolerance: number
): boolean {
  if (
    Math.abs(seg1Start.z - seg1End.z) < tolerance &&
    Math.abs(seg2Start.z - seg2End.z) < tolerance &&
    Math.abs(seg1Start.z - seg2Start.z) < tolerance
  ) {
    return true;
  }

  if (
    Math.abs(seg1Start.x - seg1End.x) < tolerance &&
    Math.abs(seg2Start.x - seg2End.x) < tolerance &&
    Math.abs(seg1Start.x - seg2Start.x) < tolerance
  ) {
    return true;
  }

  return false;
}

function getOverlappingSegment(
  wall1Start: Point,
  wall1End: Point,
  wall2Start: Point,
  wall2End: Point,
  tolerance: number
): { start: Point; end: Point } | null {
  const isHorizontal = Math.abs(wall1Start.z - wall1End.z) < tolerance;

  if (isHorizontal) {
    const wall1Min = Math.min(wall1Start.x, wall1End.x);
    const wall1Max = Math.max(wall1Start.x, wall1End.x);
    const wall2Min = Math.min(wall2Start.x, wall2End.x);
    const wall2Max = Math.max(wall2Start.x, wall2End.x);

    const overlapMin = Math.max(wall1Min, wall2Min);
    const overlapMax = Math.min(wall1Max, wall2Max);

    if (overlapMin <= overlapMax + tolerance) {
      const z = wall1Start.z;
      return {
        start: { x: overlapMin, z },
        end: { x: overlapMax, z },
      };
    }
  } else {
    const wall1Min = Math.min(wall1Start.z, wall1End.z);
    const wall1Max = Math.max(wall1Start.z, wall1End.z);
    const wall2Min = Math.min(wall2Start.z, wall2End.z);
    const wall2Max = Math.max(wall2Start.z, wall2End.z);

    const overlapMin = Math.max(wall1Min, wall2Min);
    const overlapMax = Math.min(wall1Max, wall2Max);

    if (overlapMin <= overlapMax + tolerance) {
      const x = wall1Start.x;
      return {
        start: { x, z: overlapMin },
        end: { x, z: overlapMax },
      };
    }
  }

  return null;
}

function isWallFullyCoveredBySegments(
  wallStart: Point,
  wallEnd: Point,
  coveringSegments: Array<{ start: Point; end: Point }>,
  tolerance: number = 1.0
): boolean {
  if (coveringSegments.length === 0) {
    return false;
  }
  const isHorizontal = Math.abs(wallStart.z - wallEnd.z) < tolerance;

  const wallMin = isHorizontal
    ? Math.min(wallStart.x, wallEnd.x)
    : Math.min(wallStart.z, wallEnd.z);
  const wallMax = isHorizontal
    ? Math.max(wallStart.x, wallEnd.x)
    : Math.max(wallStart.z, wallEnd.z);

  const intervals = coveringSegments.map((seg) => {
    const min = isHorizontal
      ? Math.min(seg.start.x, seg.end.x)
      : Math.min(seg.start.z, seg.end.z);
    const max = isHorizontal
      ? Math.max(seg.start.x, seg.end.x)
      : Math.max(seg.start.z, seg.end.z);
    return { min, max };
  });

  intervals.sort((a, b) => a.min - b.min);

  const mergedIntervals = mergeIntervals(intervals, tolerance);

  return intervalsCoversRange(mergedIntervals, wallMin, wallMax, tolerance);
}

function mergeIntervals(
  intervals: Array<{ min: number; max: number }>,
  tolerance: number
): Array<{ min: number; max: number }> {
  if (intervals.length === 0) return [];

  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];

    if (current.min <= last.max + tolerance) {
      last.max = Math.max(last.max, current.max);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function intervalsCoversRange(
  intervals: Array<{ min: number; max: number }>,
  rangeMin: number,
  rangeMax: number,
  tolerance: number
): boolean {
  if (intervals.length === 0) return false;

  if (intervals[0].min > rangeMin + tolerance) return false;

  const lastInterval = intervals[intervals.length - 1];
  if (lastInterval.max < rangeMax - tolerance) return false;

  for (let i = 1; i < intervals.length; i++) {
    const prevEnd = intervals[i - 1].max;
    const currentStart = intervals[i].min;

    if (currentStart > prevEnd + tolerance) {
      return false;
    }
  }

  return true;
}

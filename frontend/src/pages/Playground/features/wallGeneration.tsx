// Updated features/wallGeneration.ts
import { Point, Room, FloorPlanData } from "./types";
import { generateUniqueId } from "./drawingTools";

export interface Wall {
  id: string;
  room_type: "Wall";
  area: 0;
  height: number;
  width: number;
  floor_polygon: Point[];
  parentRoomId?: string;
  sharedWith?: string[];
  wallType: "interior" | "exterior" | "shared";
  length: number;
  originalLine?: [Point, Point];
  hasMiteredCorners: boolean;
}

function createWallParallelogram(
  start: Point,
  end: Point,
  width: number,
  prevWallDirection?: { dx: number; dz: number },
  nextWallDirection?: { dx: number; dz: number }
): Point[] {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz);

  if (length === 0) return [start, end, end, start];

  const dirX = dx / length;
  const dirZ = dz / length;
  const perpX = -dirZ;
  const perpZ = dirX;

  const halfWidth = width / 2;

  const baseCutDistance = halfWidth;

  let startCutDistance = baseCutDistance;
  let endCutDistance = baseCutDistance;

  if (prevWallDirection) {
    const prevLength = Math.sqrt(
      prevWallDirection.dx * prevWallDirection.dx +
        prevWallDirection.dz * prevWallDirection.dz
    );
    if (prevLength > 0) {
      const prevDirX = prevWallDirection.dx / prevLength;
      const prevDirZ = prevWallDirection.dz / prevLength;

      const dotProduct = dirX * prevDirX + dirZ * prevDirZ;
      const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

      if (angle > 0.1) {
        const adjustedCut = halfWidth / Math.sin(angle / 2);
        startCutDistance = Math.min(adjustedCut, length / 3);
        startCutDistance = Math.max(startCutDistance, baseCutDistance);
      }
    }
  }

  if (nextWallDirection) {
    const nextLength = Math.sqrt(
      nextWallDirection.dx * nextWallDirection.dx +
        nextWallDirection.dz * nextWallDirection.dz
    );
    if (nextLength > 0) {
      const nextDirX = nextWallDirection.dx / nextLength;
      const nextDirZ = nextWallDirection.dz / nextLength;

      const dotProduct = -dirX * nextDirX + -dirZ * nextDirZ;
      const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

      if (angle > 0.1) {
        const adjustedCut = halfWidth / Math.sin(angle / 2);
        endCutDistance = Math.min(adjustedCut, length / 3);
        endCutDistance = Math.max(endCutDistance, baseCutDistance);
      }
    }
  }

  const topStart: Point = {
    x: start.x + perpX * halfWidth + dirX * startCutDistance,
    z: start.z + perpZ * halfWidth + dirZ * startCutDistance,
  };
  const topEnd: Point = {
    x: end.x + perpX * halfWidth - dirX * endCutDistance,
    z: end.z + perpZ * halfWidth - dirZ * endCutDistance,
  };
  const bottomStart: Point = {
    x: start.x - perpX * halfWidth + dirX * startCutDistance,
    z: start.z - perpZ * halfWidth + dirZ * startCutDistance,
  };
  const bottomEnd: Point = {
    x: end.x - perpX * halfWidth - dirX * endCutDistance,
    z: end.z - perpZ * halfWidth - dirZ * endCutDistance,
  };

  return [topStart, topEnd, bottomEnd, bottomStart];
}

export interface WallGenerationOptions {
  wallThickness: number;
  mergeSharedWalls: boolean;
  generateExteriorWalls: boolean;
  use45DegreeCuts: boolean;
  guaranteeMiters: boolean;
}

export function generateWallsFromRooms(
  floorPlanData: FloorPlanData,
  options: WallGenerationOptions = {
    wallThickness: 5,
    mergeSharedWalls: true,
    generateExteriorWalls: true,
    use45DegreeCuts: true,
    guaranteeMiters: true,
  }
): FloorPlanData {
  const walls: Wall[] = [];
  const roomsOnly = floorPlanData.rooms.filter(
    (room) => room.room_type !== "Wall"
  );

  roomsOnly.forEach((room) => {
    const roomWalls = generateWallsForRoom(room, options);
    walls.push(...roomWalls);
  });

  const processedWalls = options.mergeSharedWalls
    ? mergeSharedWalls(walls, roomsOnly, options.wallThickness)
    : walls;

  const existingWalls = floorPlanData.rooms.filter(
    (room) => room.room_type === "Wall"
  );

  return {
    ...floorPlanData,
    rooms: [
      ...roomsOnly.map((room) => ({
        ...room,
        hasIndividualWalls: true,
      })),
      ...existingWalls,
      ...processedWalls,
    ],
  };
}

function generateWallsForRoom(
  room: Room,
  options: WallGenerationOptions
): Wall[] {
  const walls: Wall[] = [];
  const polygon = room.floor_polygon;

  for (let i = 0; i < polygon.length; i++) {
    const startPoint = polygon[i];
    const endPoint = polygon[(i + 1) % polygon.length];

    const length = calculateDistance(startPoint, endPoint);

    if (length < 0.1) continue;

    let prevWallDirection: { dx: number; dz: number } | undefined = undefined;
    let nextWallDirection: { dx: number; dz: number } | undefined = undefined;

    if (options.guaranteeMiters && polygon.length > 2) {
      const prevIndex = i === 0 ? polygon.length - 1 : i - 1;
      const nextIndex = (i + 2) % polygon.length;

      const prevStart = polygon[prevIndex];
      const prevEnd = startPoint;
      prevWallDirection = {
        dx: prevEnd.x - prevStart.x,
        dz: prevEnd.z - prevStart.z,
      };

      const nextStart = endPoint;
      const nextEnd = polygon[nextIndex];
      nextWallDirection = {
        dx: nextEnd.x - nextStart.x,
        dz: nextEnd.z - nextStart.z,
      };
    }

    const wallPolygon =
      options.use45DegreeCuts || options.guaranteeMiters
        ? createWallParallelogram(
            startPoint,
            endPoint,
            options.wallThickness,
            prevWallDirection,
            nextWallDirection
          )
        : [startPoint, endPoint];

    const wall: Wall = {
      id: generateUniqueId("wall"),
      room_type: "Wall",
      area: 0,
      height: room.height || 3,
      width: options.wallThickness,
      floor_polygon: wallPolygon,
      originalLine: [startPoint, endPoint],
      parentRoomId: room.id,
      sharedWith: [],
      wallType: "interior",
      length,
      hasMiteredCorners: options.use45DegreeCuts || options.guaranteeMiters,
    };

    walls.push(wall);
  }

  return walls;
}

function mergeSharedWalls(
  walls: Wall[],
  rooms: Room[],
  wallThickness: number
): Wall[] {
  const processedWalls: Wall[] = [];
  const usedWallIds = new Set<string>();

  walls.forEach((wall) => {
    if (usedWallIds.has(wall.id)) return;

    const sharedWalls = walls.filter(
      (otherWall) =>
        otherWall.id !== wall.id &&
        !usedWallIds.has(otherWall.id) &&
        areWallsShared(wall, otherWall)
    );

    if (sharedWalls.length > 0) {
      const allSharedWalls = [wall, ...sharedWalls];
      const sharedRoomIds = allSharedWalls
        .map((w) => w.parentRoomId)
        .filter((id): id is string => Boolean(id));

      const mergedWall: Wall = {
        ...wall,
        id: generateUniqueId("shared_wall"),
        sharedWith: sharedRoomIds,
        wallType: sharedRoomIds.length > 1 ? "shared" : "interior",
        hasMiteredCorners: wall.hasMiteredCorners,
      };

      processedWalls.push(mergedWall);

      allSharedWalls.forEach((w) => usedWallIds.add(w.id));
    } else {
      processedWalls.push({
        ...wall,
        wallType: isExteriorWall(wall, rooms) ? "exterior" : "interior",
      });
      usedWallIds.add(wall.id);
    }
  });

  return processedWalls;
}

function areWallsShared(wall1: Wall, wall2: Wall, tolerance = 0.1): boolean {
  const line1 = wall1.originalLine || [
    wall1.floor_polygon[0],
    wall1.floor_polygon[1],
  ];
  const line2 = wall2.originalLine || [
    wall2.floor_polygon[0],
    wall2.floor_polygon[1],
  ];

  const [start1, end1] = line1;
  const [start2, end2] = line2;

  const sameDirection =
    pointsEqual(start1, start2, tolerance) &&
    pointsEqual(end1, end2, tolerance);

  const reverseDirection =
    pointsEqual(start1, end2, tolerance) &&
    pointsEqual(end1, start2, tolerance);

  return sameDirection || reverseDirection;
}

function isExteriorWall(wall: Wall, rooms: Room[]): boolean {
  const line = wall.originalLine || [
    wall.floor_polygon[0],
    wall.floor_polygon[1],
  ];
  const [start, end] = line;

  let containingRooms = 0;

  rooms.forEach((room) => {
    if (room.id === wall.parentRoomId) return;

    if (isEdgeOnPolygonBoundary(start, end, room.floor_polygon)) {
      containingRooms++;
    }
  });

  return containingRooms === 0;
}

function isEdgeOnPolygonBoundary(
  edgeStart: Point,
  edgeEnd: Point,
  polygon: Point[],
  tolerance = 0.1
): boolean {
  for (let i = 0; i < polygon.length; i++) {
    const polyStart = polygon[i];
    const polyEnd = polygon[(i + 1) % polygon.length];

    if (
      areEdgesOverlapping(edgeStart, edgeEnd, polyStart, polyEnd, tolerance)
    ) {
      return true;
    }
  }
  return false;
}

function areEdgesOverlapping(
  edge1Start: Point,
  edge1End: Point,
  edge2Start: Point,
  edge2End: Point,
  tolerance = 0.1
): boolean {
  return (
    (pointsEqual(edge1Start, edge2Start, tolerance) &&
      pointsEqual(edge1End, edge2End, tolerance)) ||
    (pointsEqual(edge1Start, edge2End, tolerance) &&
      pointsEqual(edge1End, edge2Start, tolerance))
  );
}

function calculateDistance(point1: Point, point2: Point): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.z - point1.z, 2)
  );
}

function pointsEqual(point1: Point, point2: Point, tolerance = 0.1): boolean {
  return (
    Math.abs(point1.x - point2.x) < tolerance &&
    Math.abs(point1.z - point2.z) < tolerance
  );
}

export function regenerateAllWalls(
  floorPlanData: FloorPlanData,
  options: WallGenerationOptions
): FloorPlanData {
  const roomsWithoutWalls = floorPlanData.rooms.filter(
    (room) => room.room_type !== "Wall"
  );

  const dataWithoutWalls = {
    ...floorPlanData,
    rooms: roomsWithoutWalls,
  };

  return generateWallsFromRooms(dataWithoutWalls, options);
}

export function updateWallsForRoom(
  floorPlanData: FloorPlanData,
  modifiedRoomId: string,
  options: WallGenerationOptions
): FloorPlanData {
  const roomsWithoutModifiedWalls = floorPlanData.rooms.filter(
    (room) =>
      !(
        room.room_type === "Wall" &&
        (room as Wall).parentRoomId === modifiedRoomId
      )
  );
  const modifiedRoom = roomsWithoutModifiedWalls.find(
    (room) => room.id === modifiedRoomId
  );
  if (!modifiedRoom) return floorPlanData;

  const newWalls = generateWallsForRoom(modifiedRoom, options);

  const updatedData = {
    ...floorPlanData,
    rooms: [...roomsWithoutModifiedWalls, ...newWalls],
  };

  if (options.mergeSharedWalls) {
    return regenerateAllWalls(updatedData, options);
  }

  return updatedData;
}

export function ensureMiteredCornersOnAllWalls(
  floorPlanData: FloorPlanData,
  wallThickness: number = 5
): FloorPlanData {
  const updatedRooms = floorPlanData.rooms.map((room) => {
    if (room.room_type === "Wall") {
      const wall = room as Wall;

      if (!wall.hasMiteredCorners && wall.originalLine) {
        const [start, end] = wall.originalLine;
        const miteredPolygon = createWallParallelogram(start, end, wall.width);

        return {
          ...wall,
          floor_polygon: miteredPolygon,
          hasMiteredCorners: true,
        };
      }
    }
    return room;
  });

  return {
    ...floorPlanData,
    rooms: updatedRooms,
  };
}

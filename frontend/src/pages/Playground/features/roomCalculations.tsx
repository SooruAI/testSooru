import React from "react";

interface Point {
  x: number;
  z: number;
}

export function calculateRoomCentroid(points: { x: number; y: number }[]) {
  if (points.length === 0) return { x: 0, y: 0 };

  let sumX = 0;
  let sumY = 0;

  points.forEach((point) => {
    sumX += point.x;
    sumY += point.y;
  });

  return {
    x: sumX / points.length,
    y: sumY / points.length,
  };
}

export function calculateRoomArea(polygon: Point[]) {
  if (polygon.length < 3) return 0;

  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].z;
    area -= polygon[j].x * polygon[i].z;
  }

  area = Math.abs(area) / 2;
  return area / 100;
}

export function calculateRoomDimensions(polygon: Point[]) {
  if (polygon.length < 3) return { width: 0, height: 0 };

  const xCoords = polygon.map((p) => p.x);
  const zCoords = polygon.map((p) => p.z);

  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minZ = Math.min(...zCoords);
  const maxZ = Math.max(...zCoords);

  return {
    width: (maxX - minX) / 10,
    height: (maxZ - minZ) / 10,
  };
}
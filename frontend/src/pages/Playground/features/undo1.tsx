// features/undo1.tsx
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
}

interface FloorPlanData {
  room_count: number;
  total_area: number;
  room_types: string[];
  rooms: Room[];
}

export function handleUndoChanges(
  initialFloorPlanData: FloorPlanData,
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
  setSelectedRoomId: React.Dispatch<React.SetStateAction<string | null>>, 
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  setRoomRotations: React.Dispatch<React.SetStateAction<{ [key: string]: number }>>
) {
  setFloorPlanData(JSON.parse(JSON.stringify(initialFloorPlanData)));
  setSelectedRoomId(null); 
  setHasChanges(false);
  setRoomRotations({});
}
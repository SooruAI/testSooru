interface Point {
  x: number;
  z: number;
}

interface FloorPlanObject {
  id: string;
  objectPath: string;
  position: Point;
  rotation: number;
  scale: number;
}

interface Room {
  id: string;
  room_type: string;
  area: number;
  height: number;
  width: number;
  floor_polygon: Point[];
  is_regular?: number;
}

export interface FloorPlanData {
  room_count: number;
  total_area: number;
  room_types: string[];
  rooms: Room[];
  objects?: FloorPlanObject[];
}

export const ensureCoordinateSystem = (data: any): any => {
  const visibleRooms = data.rooms?.filter((room: any) => room.room_type !== "Reference") || [];
  
  const referencePoints = [
    {
      id: "invisible-reference-point-1",
      room_type: "Reference",
      area: 0,
      height: 0,
      width: 0,
      floor_polygon: [
        { x: 0, z: 0 },
        { x: 0, z: 0 }
      ],
      is_regular: 0
    }
  ];
  
  return {
    ...data,
    rooms: [...visibleRooms, ...referencePoints],
    room_count: visibleRooms.filter((room: any) => room.room_type !== "Reference" && !room.isBoundary).length,
    total_area: visibleRooms.filter((room: any) => room.room_type !== "Reference" && !room.isBoundary).reduce((sum: number, room: any) => sum + (room.area || 0), 0)
  };
};

const blankData: FloorPlanData = {
  room_count: 0,
  total_area: 0,
  room_types: [],
  rooms: [],
  objects: []
};

export const initialFloorPlanData = ensureCoordinateSystem(blankData) as FloorPlanData;
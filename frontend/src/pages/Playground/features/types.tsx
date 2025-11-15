// features/types.tsx
export interface Point {
  x: number;
  z: number;
}

export interface Room {
  id: string;
  room_type: string;
  area: number;
  height: number;
  width: number;
  floor_polygon: Point[];
  is_regular?: number;
  isBoundary?: boolean; 
}

export interface Wall {
  id: string;
  room_type: "Wall";
  area: 0;
  height: number;
  width: number;
  floor_polygon: [Point, Point];
  parentRoomId?: string;
  sharedWith?: string[];
  wallType: "interior" | "exterior" | "shared";
  length: number;
}

export interface WallGenerationOptions {
  wallThickness: number;
  mergeSharedWalls: boolean;
  generateExteriorWalls: boolean;
  exteriorWallExtraThickness?: number;
}

export interface Label {
  id: string;
  text: string;
  position: Point;
  fontSize?: number;
  color?: string;
}

export interface FloorPlanObject {
  id: string;
  objectPath: string;
  position: Point;
  rotation?: number;
  scale?: number;
}

export interface FloorPlanDoor {
  id: string;
  doorPath: string;
  position: Point;
  rotation?: number;
  scale?: number;
  width?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export interface FloorPlanWindow {
  id: string;
  windowPath: string;
  position: Point;
  rotation?: number;
  scale?: number;
  width?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export interface DimensionLine {
  id: string;
  startPoint: Point;
  endPoint: Point;
  distance: number;
  midPoint: Point;
}

export interface FloorPlanData {
  room_count: number;
  total_area: number;
  room_types: string[];
  rooms: Room[];
  labels?: Label[];
  objects?: FloorPlanObject[];
  doors?: FloorPlanDoor[];
  windows?: FloorPlanWindow[];
  dimensionLines?: DimensionLine[];
  wallWidths?: { [key: string]: number };
}

export interface DragState {
  active: boolean;
  roomId: string | null;
  roomIds: string[];
  vertexIndex: number | null;
  edgeIndices: number[] | null;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  isResizing: boolean;
  isEdgeResizing: boolean;
  isGroupOperation: boolean;
  initialPolygons?: Record<string, Point[]>;
  isLabelDragging?: boolean;
  labelId?: string | null;
  initialLabelPosition?: Point;
  isObjectDragging?: boolean;
  objectId?: string | null;
  initialObjectPosition?: Point;
  isDoorDragging?: boolean;
  doorId?: string | null;
  initialDoorPosition?: Point;
  isWindowDragging?: boolean;
  windowId?: string | null;
  initialWindowPosition?: Point;
}

export interface VisualizationOptions {
  showMeasurements: boolean;
  showRoomLabels: boolean;
  showGrid: boolean;
  colorScheme: "standard" | "monochrome" | "pastel" | "contrast";
  darkMode?: boolean;
}

export type ActiveTool =
  | "design"
  | "build"
  | "project"
  | "info"
  | "objects"
  | "styleboards"
  | "exports"
  | "help"
  | "colors";

export type BuildTool =
  | "drawRoom"
  | "drawWall"
  | "drawBoundry"  
  | "drawCorner"  
  | "placeDoors"
  | "placeWindows"
  | null;

export interface FloorPlanContextType {
  floorPlanData: FloorPlanData;
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>;

  visualizationOptions: VisualizationOptions;
  setVisualizationOptions: React.Dispatch<
    React.SetStateAction<VisualizationOptions>
  >;

  activeTool: ActiveTool;
  setActiveTool: React.Dispatch<React.SetStateAction<ActiveTool>>;

  activeBuildTool: BuildTool;
  setActiveBuildTool: React.Dispatch<React.SetStateAction<BuildTool>>;

  isDrawingActive: boolean;
  setIsDrawingActive: React.Dispatch<React.SetStateAction<boolean>>;
}
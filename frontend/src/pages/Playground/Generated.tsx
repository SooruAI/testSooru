import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import "./Generated.css";
import ReactDOM from "react-dom";
import {
  renderOverlapAlert,
  getOverlappingRoomNames,
  isRoomOverlapping,
} from "./features/warning";
import { formatImperialLength, formatImperialArea, coordToInches } from "./features/imperialUtils";
import {
  handleMouseDown,
  handleVertexMouseDown,
  handleTouchStart,
  handleVertexTouchStart,
  handleEdgeMouseDown,
  handleEdgeTouchStart,
  renderEdgeHandles,
} from "./features/resizing";
//import { ensureCoordinateSystem } from "./features/initialData";

import { handleUndoChanges } from "./features/undo1";
import WallThicknessPanel from "./components/WallThicknessPanel";
import {
  calculateRoomCentroid,
  calculateRoomArea,
  calculateRoomDimensions,
} from "./features/roomCalculations";
import {
  calculateBounds,
  useCoordinateTransforms,
} from "./features/coordinates";
import { roomColors, floorPlanStyles, wallStyles } from "./features/styles";
import { useInterval } from "./features/intervalHooks";
import {
  useEventHandlers,
  handleRoomSelection,
  getLabelPlacementState,
  setLabelPlacementState,
  getInfoToolPanelState,
  getGlobalSelectedRoomType,
  handleLabelMouseDown,
  handleLabelTouchStart,
  getObjectPlacementState,
  setObjectPlacementState,
  handleObjectMouseDown,
  handleObjectTouchStart,
  getDoorPlacementState,
  setDoorPlacementState,
  getWindowPlacementState,
  setWindowPlacementState,
  handleDoorMouseDown,
  handleDoorTouchStart,
  handleWindowMouseDown,
  handleWindowTouchStart,
  getCornerPlacementState,
  setCornerPlacementState,
  addCornerToRoom,
} from "./features/eventHandlers";
import { isExternalWallSegment } from "./features/wallUtils";
import { saveFloorPlan } from "./features/save";
//import { initialFloorPlanData } from "./features/initialData";
import {
  handleRotateRoom,
  checkAndUpdateOverlaps as checkRoomOverlaps,
} from "./features/rotation";
import { useSimpleUndoHistory, useUndoShortcut } from "./features/history";
import { useFloorPlan } from "./FloorPlanContext";
import WallDrawingTool from "./components/WallDrawingTool";
import RoomDrawingTool from "./components/RoomDrawingTool";
import BoundaryDrawingTool from "./components/BoundaryDrawingTool";
import {
  generateUniqueId,
  createWallPolygon,
  generateRoomPolygon,
} from "./features/drawingTools";
import {
  findNearestWall,
  isValidPlacementPosition,
  getSnappedPlacementResult,
  getAllWallSegments,
} from "./features/wallPlacement";
import {
  Point,
  Room,
  FloorPlanData,
  DragState,
  VisualizationOptions,
  Wall,
} from "./features/types";
import { view } from "framer-motion";

declare global {
  interface Window {
    dimensionFirstPoint?: Point;
    isRoomDraggingLocked?: boolean;
  }
}


const ensureCoordinateSystem = (data: any): any => {
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

const getFallbackInitialData = (): FloorPlanData => {
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
    room_count: 0,
    total_area: 0,
    room_types: [],
    rooms: referencePoints,
    objects: []
  };
};

export default function InteractiveFloorPlan({
  rotation = 0,
  visualizationOptions: propVisualizationOptions = {},
  viewOnly = false
}: {
  rotation?: number;
  visualizationOptions?: Partial<VisualizationOptions>;
  viewOnly?: boolean;
}) {
  const {
    floorPlanData: contextFloorPlanData,
    setFloorPlanData: setContextFloorPlanData,
    activeBuildTool,
    isDrawingActive,
    setIsDrawingActive,
    handleRoomTypeUpdate,
    addLabel,
    addObject,
    updateObject,
    setHasChanges,
    roomRotations,
    setRoomRotations,
    hasChanges,
    captureOriginalState,
    selectedRoomIds: contextSelectedRoomIds,
    setSelectedRoomIds: setContextSelectedRoomIds,
    activeTool,
    setActiveTool,
    openProjectPanel,
    visualizationOptions: contextVisualizationOptions,
    drawingWallWidth,
    updateLabel,
    addDoor,
    addWindow,
    updateDoor,
    updateWindow,
    addDimensionLine,
    updateDimensionLine,
    doorWidths,
    setDoorWidths,
    windowWidths,
    setWindowWidths,
    showIndividualWalls,
    flipDoorHorizontal,
    flipDoorVertical,
    flipWindowHorizontal,
    flipWindowVertical,
    wallWidths,
    setWallWidths,
    updateWallWidth,
    unitSystem
  } = useFloorPlan();

  const options: VisualizationOptions = {
    ...contextVisualizationOptions,
    ...propVisualizationOptions,
  };

  const [leftPosition, setLeftPosition] = useState("10%");
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData>(
    contextFloorPlanData || getFallbackInitialData()
  );

  const [position, setPosition] = useState({ x: 0, y: 0 });

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [scale, setScale] = useState(window.innerWidth < 850 ? 1 : 1.5);
  const floorPlanRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [isLabelPlacementMode, setIsLabelPlacementMode] = useState(false);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedDoorId, setSelectedDoorId] = useState<string | null>(null);
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);
  const [isObjectPlacementMode, setIsObjectPlacementMode] = useState(false);
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(
    null
  );
  const [objectRotations, setObjectRotations] = useState<{
    [key: string]: number;
  }>({});
  const [isRotatingObject, setIsRotatingObject] = useState(false);
  const [rotatingObjectId, setRotatingObjectId] = useState<string | null>(null);
  const [rotationStartAngle, setRotationStartAngle] = useState<number>(0);
  const [initialObjectRotation, setInitialObjectRotation] = useState<number>(0);

  const [isDimensionDrawing, setIsDimensionDrawing] = useState(false);
  const [dimensionStartPoint, setDimensionStartPoint] = useState<Point | null>(
    null
  );
  const [dimensionCurrentPoint, setDimensionCurrentPoint] =
    useState<Point | null>(null);

  const [overlappingRooms, setOverlappingRooms] = useState<string[][]>([]);
  const [lastModifiedRoomId, setLastModifiedRoomId] = useState<string | null>(
    null
  );
  const [doorFlipStates, setDoorFlipStates] = useState<{
    [key: string]: { flipH: boolean; flipV: boolean };
  }>({});
  const [windowFlipStates, setWindowFlipStates] = useState<{
    [key: string]: { flipH: boolean; flipV: boolean };
  }>({});
  const [isDraggingWallWidth, setIsDraggingWallWidth] = useState(false);
  const [isModifyingWall, setIsModifyingWall] = useState(false);
  const [draggingWallId, setDraggingWallId] = useState<string | null>(null);
  const [initialWallWidth, setInitialWallWidth] = useState<number>(0);
  const [showWallThicknessPanel, setShowWallThicknessPanel] = useState(false);

  const [dragState, setDragState] = useState<DragState>({
    active: false,
    roomId: null,
    roomIds: [],
    vertexIndex: null,
    edgeIndices: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    isResizing: false,
    isEdgeResizing: false,
    isGroupOperation: false,
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const [parentScale, setParentScale] = useState(1);

  useEffect(() => {
    const updateParentScale = () => {
      const parent = parentRef.current?.parentElement;
      if (parent) {
        const transform = window.getComputedStyle(parent).transform;
        if (transform && transform !== "none") {
          const matrix = transform.match(/matrix.*\((.+)\)/)?.[1].split(", ");
          if (matrix && matrix.length >= 6) {
            const scaleX = parseFloat(matrix[0]);
            setParentScale(scaleX);
          }
        }
      }
    };

    updateParentScale();

    const observer = new MutationObserver(() => {
      updateParentScale();
    });

    if (parentRef.current?.parentElement) {
      observer.observe(parentRef.current.parentElement, {
        attributes: true,
        attributeFilter: ["style"],
      });
    }

    return () => observer.disconnect();
  }, []);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current && contextFloorPlanData) {
      setFloorPlanData(contextFloorPlanData);
      isInitialMount.current = false;
    }
  }, [contextFloorPlanData]);

  useEffect(() => {
    if (floorPlanData.rooms) {
      floorPlanData.rooms.forEach((room) => {
        if (room.room_type === "Wall" && !(room.id in wallWidths)) {
          setWallWidths((prev) => ({ ...prev, [room.id]: room.width || 6 }));
        }
      });

      floorPlanData.rooms.forEach((room) => {
        if (room.room_type !== "Wall" && room.floor_polygon.length > 2) {
          for (let i = 0; i < room.floor_polygon.length; i++) {
            const wallId = `${room.id}-wall-${i}`;
            if (!(wallId in wallWidths)) {
              setWallWidths((prev) => ({ ...prev, [wallId]: 4 }));
            }
          }
        }
      });
    }
  }, [floorPlanData.rooms, wallWidths, setWallWidths]);

  useEffect(() => {
    if (floorPlanData.doors) {
      floorPlanData.doors.forEach((door) => {
        if (!(door.id in doorWidths)) {
          setDoorWidths((prev) => ({ ...prev, [door.id]: door.width || 2 }));
        }
      });
    }

    if (floorPlanData.windows) {
      floorPlanData.windows.forEach((window) => {
        if (!(window.id in windowWidths)) {
          setWindowWidths((prev) => ({
            ...prev,
            [window.id]: window.width || 2,
          }));
        }
      });
    }
  }, [floorPlanData.doors, floorPlanData.windows, doorWidths, windowWidths]);

  useEffect(() => {
    if (selectedRoomIds.length === 1) {
      setSelectedRoomId(selectedRoomIds[0]);

      const selectedRoom = floorPlanData.rooms.find(
        (room) => room.id === selectedRoomIds[0]
      );
      if (
        selectedRoom &&
        selectedRoom.room_type === "Wall" &&
        selectedRoom.floor_polygon.length === 2
      ) {
        setShowWallThicknessPanel(true);
      } else {
        setShowWallThicknessPanel(false);
      }
    } else {
      setSelectedRoomId(null);
      setShowWallThicknessPanel(false);
    }
  }, [selectedRoomIds, floorPlanData.rooms]);

  const { saveState, undo, hasUndoState } = useSimpleUndoHistory();

  const handleUndo = useCallback(() => {
    undo((state) => {
      if (state) {
        const undoData = JSON.parse(JSON.stringify(state.floorPlanData));
        const undoRotations = JSON.parse(JSON.stringify(state.roomRotations));

        setFloorPlanData(state.floorPlanData);
        setRoomRotations(state.roomRotations);
      }
    });
  }, [undo]);

  useUndoShortcut(handleUndo);

  const isCapturingState = useRef(false);

  const captureStateBeforeChange = () => {
    if (!isCapturingState.current) {
      isCapturingState.current = true;
      saveState({
        floorPlanData: JSON.parse(JSON.stringify(floorPlanData)),
        roomRotations: { ...roomRotations },
      });
    }
  };

  useEffect(() => {
    if (!dragState.active) {
      isCapturingState.current = false;

      setTimeout(() => {
        setIsModifyingWall(false);
        checkWallModificationAndFormRooms();

        setFloorPlanData((prevData) => {
          const totalArea = calculateTotalArea(prevData.rooms, roomRotations);
          return {
            ...prevData,
            total_area: parseFloat(totalArea.toFixed(2)),
          };
        });
      }, 100);
    }
  }, [dragState.active, roomRotations]);

  const handleWallThicknessChange = useCallback(
    (newWidth: number) => {
      if (selectedRoomIds.length === 1) {
        const wallId = selectedRoomIds[0];

        if (!hasChanges) {
          captureOriginalState();
        }
        captureStateBeforeChange();

        updateWallWidth(wallId, newWidth);
        setHasChanges(true);
      }
    },
    [
      selectedRoomIds,
      hasChanges,
      captureOriginalState,
      captureStateBeforeChange,
      updateWallWidth,
    ]
  );

  const handleMouseDownWithHistory = (
    event: React.MouseEvent,
    roomId: string,
    svgRef: React.RefObject<SVGSVGElement | null>,
    setDragState: React.Dispatch<React.SetStateAction<DragState>>,
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
    selectedRoomIds: string[]
  ) => {
    if (viewOnly) {
      event.stopPropagation();
      return;
    }

    if (
      dragState.isDoorDragging ||
      dragState.isWindowDragging ||
      dragState.isLabelDragging ||
      dragState.isObjectDragging
    ) {
      event.stopPropagation();
      return;
    }

    if (
      isDrawingActive ||
      activeBuildTool === "drawWall" ||
      activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry"
    ) {
      return;
    }

    if (window.isRoomDraggingLocked) {
      event.stopPropagation();

      if (
        !selectedRoomIds.includes(roomId) &&
        !(event.ctrlKey || event.metaKey)
      ) {
        setSelectedRoomIds([roomId]);
      }
      return;
    }

    if (!hasChanges) {
      captureOriginalState();
    }

    captureStateBeforeChange();
    setLastModifiedRoomId(roomId);

    handleMouseDown(
      event,
      roomId,
      svgRef,
      setDragState,
      setHasChanges,
      setSelectedRoomIds,
      selectedRoomIds
    );
  };

  const handleVertexMouseDownWithHistory = (
    event: React.MouseEvent,
    roomId: string,
    vertexIndex: number,
    svgRef: React.RefObject<SVGSVGElement | null>,
    setDragState: React.Dispatch<React.SetStateAction<DragState>>,
    setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
    selectedRoomIds: string[],
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (viewOnly) {
      event.stopPropagation();
      return;
    }

    if (
      isDrawingActive ||
      activeBuildTool === "drawWall" ||
      activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry"
    ) {
      return;
    }

    if (!hasChanges) {
      captureOriginalState();
    }

    captureStateBeforeChange();
    setLastModifiedRoomId(roomId);

    const room = floorPlanData.rooms.find((r) => r.id === roomId);
    if (room && room.room_type === "Wall") {
      setIsModifyingWall(true);
    }

    handleVertexMouseDown(
      event,
      roomId,
      vertexIndex,
      svgRef,
      setDragState,
      setSelectedRoomIds,
      selectedRoomIds,
      setHasChanges,
      floorPlanData
    );
  };

  const getResponsiveSize = (baseSize: number, currentScale: number) => {
    return baseSize * (currentScale / 2.5);
  };

  const handleEdgeMouseDownWithHistory = (
    event: React.MouseEvent,
    roomId: string,
    edgeIndices: number[],
    svgRef: React.RefObject<SVGSVGElement | null>,
    setDragState: React.Dispatch<React.SetStateAction<DragState>>,
    setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
    selectedRoomIds: string[],
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (viewOnly) {
      event.stopPropagation();
      return;
    }
    if (
      isDrawingActive ||
      activeBuildTool === "drawWall" ||
      activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry"
    ) {
      return;
    }

    if (!hasChanges) {
      captureOriginalState();
    }

    captureStateBeforeChange();
    setLastModifiedRoomId(roomId);

    const room = floorPlanData.rooms.find((r) => r.id === roomId);
    if (room && room.room_type === "Wall") {
      setIsModifyingWall(true);
    }

    handleEdgeMouseDown(
      event,
      roomId,
      edgeIndices,
      svgRef,
      setDragState,
      setSelectedRoomIds,
      selectedRoomIds,
      setHasChanges,
      floorPlanData
    );
  };

  const shouldShowRotationIcon = () => {
    const infoPanelState = getInfoToolPanelState();
    return !infoPanelState.isActive;
  };

  const handleTouchStartWithHistory = (
    event: React.TouchEvent,
    roomId: string,
    svgRef: React.RefObject<SVGSVGElement | null>,
    setDragState: React.Dispatch<React.SetStateAction<DragState>>,
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
    setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
    selectedRoomIds: string[]
  ) => {
    if (
      isDrawingActive ||
      activeBuildTool === "drawWall" ||
      activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry"
    ) {
      return;
    }

    if (window.isRoomDraggingLocked) {
      event.stopPropagation();

      if (selectedRoomIds.length > 0) {
        if (!selectedRoomIds.includes(roomId)) {
          setSelectedRoomIds([...selectedRoomIds, roomId]);
        }
      } else {
        setSelectedRoomIds([roomId]);
      }
      return;
    }

    if (!hasChanges) {
      captureOriginalState();
    }

    captureStateBeforeChange();

    handleTouchStart(
      event,
      roomId,
      svgRef,
      setDragState,
      setHasChanges,
      setSelectedRoomIds,
      selectedRoomIds
    );
  };

  const findRoomAtPosition = (
    point: Point,
    floorPlanData: FloorPlanData,
    roomRotations: { [key: string]: number }
  ): Room | null => {
    const candidateRooms: { room: Room; area: number }[] = [];

    for (const room of floorPlanData.rooms) {
      if (room.room_type === "Wall" || room.room_type === "Reference" || room.floor_polygon.length < 3) continue;

      const roomRotation = roomRotations[room.id] || 0;
      const centroid = {
        x: room.floor_polygon.reduce((sum, p) => sum + p.x, 0) / room.floor_polygon.length,
        z: room.floor_polygon.reduce((sum, p) => sum + p.z, 0) / room.floor_polygon.length,
      };

      let adjustedPoint = point;
      if (roomRotation !== 0) {
        const radians = (-roomRotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const dx = point.x - centroid.x;
        const dz = point.z - centroid.z;

        adjustedPoint = {
          x: centroid.x + dx * cos - dz * sin,
          z: centroid.z + dx * sin + dz * cos,
        };
      }

      const polygon = room.floor_polygon;
      const wallDetectionDistance = 8.0;
      for (let i = 0; i < polygon.length; i++) {
        const startPoint = polygon[i];
        const endPoint = polygon[(i + 1) % polygon.length];

        const A = adjustedPoint.x - startPoint.x;
        const B = adjustedPoint.z - startPoint.z;
        const C = endPoint.x - startPoint.x;
        const D = endPoint.z - startPoint.z;

        const dot = A * C + B * D;
        const lenSquared = C * C + D * D;

        if (lenSquared === 0) continue;

        let param = dot / lenSquared;
        param = Math.max(0, Math.min(1, param));

        const closestX = startPoint.x + param * C;
        const closestZ = startPoint.z + param * D;

        const distance = Math.sqrt(
          Math.pow(closestX - adjustedPoint.x, 2) +
          Math.pow(closestZ - adjustedPoint.z, 2)
        );

        if (distance <= wallDetectionDistance) {
          candidateRooms.push({ room, area: room.area });
          break;
        }
      }

      if (candidateRooms.length === 0 || candidateRooms[candidateRooms.length - 1].room.id !== room.id) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
          const condition1 = polygon[i].z > adjustedPoint.z;
          const condition2 = polygon[j].z > adjustedPoint.z;
          const crossProduct = ((polygon[j].x - polygon[i].x) * (adjustedPoint.z - polygon[i].z)) / (polygon[j].z - polygon[i].z) + polygon[i].x;

          if (condition1 !== condition2 && adjustedPoint.x < crossProduct) {
            inside = !inside;
          }
        }

        if (inside) {
          candidateRooms.push({ room, area: room.area });
        }
      }
    }

    if (candidateRooms.length === 0) return null;

    candidateRooms.sort((a, b) => a.area - b.area);
    return candidateRooms[0].room;
  };

  const handleVertexTouchStartWithHistory = (
    event: React.TouchEvent,
    roomId: string,
    vertexIndex: number,
    svgRef: React.RefObject<SVGSVGElement | null>,
    setDragState: React.Dispatch<React.SetStateAction<DragState>>,
    setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
    selectedRoomIds: string[],
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (
      isDrawingActive ||
      activeBuildTool === "drawWall" ||
      activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry"
    ) {
      return;
    }

    if (!hasChanges) {
      captureOriginalState();
    }

    captureStateBeforeChange();

    handleVertexTouchStart(
      event,
      roomId,
      vertexIndex,
      svgRef,
      setDragState,
      setSelectedRoomIds,
      selectedRoomIds,
      setHasChanges,
      floorPlanData
    );
  };

  const handleEdgeTouchStartWithHistory = (
    event: React.TouchEvent,
    roomId: string,
    edgeIndices: number[],
    svgRef: React.RefObject<SVGSVGElement | null>,
    setDragState: React.Dispatch<React.SetStateAction<DragState>>,
    setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
    selectedRoomIds: string[],
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    if (
      isDrawingActive ||
      activeBuildTool === "drawWall" ||
      activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry"
    ) {
      return;
    }

    if (!hasChanges) {
      captureOriginalState();
    }

    captureStateBeforeChange();

    handleEdgeTouchStart(
      event,
      roomId,
      edgeIndices,
      svgRef,
      setDragState,
      setSelectedRoomIds,
      selectedRoomIds,
      setHasChanges,
      floorPlanData
    );
  };

  const handleRotateRoomWithHistory = (
    roomId: string,
    direction: "left" | "right",
    roomRotations: { [key: string]: number },
    setRoomRotations: React.Dispatch<
      React.SetStateAction<{ [key: string]: number }>
    >,
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
    checkAndUpdateOverlaps: () => void
  ) => {
    if (!hasChanges) {
      captureOriginalState();
    }

    captureStateBeforeChange();

    handleRotateRoom(
      roomId,
      direction,
      roomRotations,
      setRoomRotations,
      setHasChanges,
      checkAndUpdateOverlaps,
      selectedRoomIds
    );

    setTimeout(() => {
      isCapturingState.current = false;
    }, 10);
  };

  const checkAndUpdateOverlaps = useCallback(() => {
    return checkRoomOverlaps(floorPlanData, roomRotations, setOverlappingRooms);
  }, [floorPlanData, roomRotations]);

  useEffect(() => {
    checkAndUpdateOverlaps();
  }, []);

  useInterval(() => {
    const hadOverlaps = overlappingRooms.length > 0;
    checkAndUpdateOverlaps();

    setTimeout(() => {
      if (hadOverlaps && overlappingRooms.length === 0 && lastModifiedRoomId) {
        setLastModifiedRoomId(null);
      }
    }, 500);
  }, 100);

  const getRoomType = (roomId: string) => {
    const room = floorPlanData.rooms.find((r) => r.id === roomId);
    return room?.room_type;
  };

  useEffect(() => {
    const handleResize = () => {
      setScale(window.innerWidth < 850 ? 1.8 : 2.5);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        !dragState.active &&
        !isDrawingActive &&
        !(activeBuildTool === "drawWall" || activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry")
      ) {
        const target = event.target as HTMLElement;

        const isClickInsideRoom = target.closest(".room-polygon");
        const isClickOnRotateButton = target.closest(".rotate-button");
        const isClickOnResizeHandle = target.closest(
          ".resize-handle, .resize-edge"
        );
        const isClickOnToolbar = target.closest(".selection-toolbar");
        const isClickOnLabel = target.closest(".floor-plan-label");
        const isClickOnObject = target.closest(".floor-plan-object");
        const isClickOnDoor = target.closest(".floor-plan-door");
        const isClickOnWindow = target.closest(".floor-plan-window");
        const isClickOnDimension = target.closest(".dimension-line");

        const isClickOnDoorControls = target.closest(
          ".floor-plan-door rect, .floor-plan-door circle"
        );
        const isClickOnWindowControls = target.closest(
          ".floor-plan-window rect"
        );

        if (
          !isClickInsideRoom &&
          !isClickOnRotateButton &&
          !isClickOnResizeHandle &&
          !isClickOnToolbar &&
          !isClickOnLabel &&
          !isClickOnObject &&
          !isClickOnDoor &&
          !isClickOnWindow &&
          selectedRoomIds.length > 0
        ) {
          setSelectedRoomIds([]);
        }

        if (
          !isClickOnLabel &&
          !isClickOnDoorControls &&
          !isClickOnWindowControls &&
          selectedLabelId !== null
        ) {
          setSelectedLabelId(null);
        }

        if (!isClickOnObject && selectedObjectId !== null) {
          setSelectedObjectId(null);
        }

        if (
          !isClickOnDoor &&
          !isClickOnDoorControls &&
          selectedDoorId !== null
        ) {
          setSelectedDoorId(null);
        }

        if (
          !isClickOnWindow &&
          !isClickOnWindowControls &&
          selectedWindowId !== null
        ) {
          setSelectedWindowId(null);
        }

        if (!isClickOnDimension && selectedDimensionId !== null) {
          setSelectedDimensionId(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [
    selectedRoomIds,
    selectedLabelId,
    selectedObjectId,
    selectedDoorId,
    selectedWindowId,
    selectedDimensionId,
    dragState.active,
    isDrawingActive,
    activeBuildTool,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedLabelId) {
          captureStateBeforeChange();
          setFloorPlanData((prevData) => {
            const updatedData = {
              ...prevData,
              labels: prevData.labels
                ? prevData.labels.filter(
                  (label) => label.id !== selectedLabelId
                )
                : [],
            };
            if (setContextFloorPlanData) {
              setTimeout(() => {
                setContextFloorPlanData(updatedData);
              }, 0);
            }
            return updatedData;
          });
          setSelectedLabelId(null);
          setHasChanges(true);
        } else if (selectedObjectId) {
          if (isRotatingObject && rotatingObjectId === selectedObjectId) {
            setIsRotatingObject(false);
            setRotatingObjectId(null);
            setRotationStartAngle(0);
            setInitialObjectRotation(0);
          }

          captureStateBeforeChange();
          setFloorPlanData((prevData) => {
            const updatedData = {
              ...prevData,
              objects: prevData.objects
                ? prevData.objects.filter((obj) => obj.id !== selectedObjectId)
                : [],
            };
            if (setContextFloorPlanData) {
              setTimeout(() => {
                setContextFloorPlanData(updatedData);
              }, 0);
            }
            return updatedData;
          });
          setSelectedObjectId(null);
          setHasChanges(true);
        } else if (selectedDoorId) {
          captureStateBeforeChange();
          setFloorPlanData((prevData) => {
            const updatedData = {
              ...prevData,
              doors: prevData.doors
                ? prevData.doors.filter((door) => door.id !== selectedDoorId)
                : [],
            };
            if (setContextFloorPlanData) {
              setTimeout(() => {
                setContextFloorPlanData(updatedData);
              }, 0);
            }
            return updatedData;
          });

          setDoorWidths((prev) => {
            const newWidths = { ...prev };
            delete newWidths[selectedDoorId];
            return newWidths;
          });

          setSelectedDoorId(null);
          setHasChanges(true);
        } else if (selectedWindowId) {
          captureStateBeforeChange();
          setFloorPlanData((prevData) => {
            const updatedData = {
              ...prevData,
              windows: prevData.windows
                ? prevData.windows.filter(
                  (window) => window.id !== selectedWindowId
                )
                : [],
            };
            if (setContextFloorPlanData) {
              setTimeout(() => {
                setContextFloorPlanData(updatedData);
              }, 0);
            }
            return updatedData;
          });

          setWindowWidths((prev) => {
            const newWidths = { ...prev };
            delete newWidths[selectedWindowId];
            return newWidths;
          });

          setSelectedWindowId(null);
          setHasChanges(true);
        } else if (selectedDimensionId) {
          captureStateBeforeChange();
          setFloorPlanData((prevData) => {
            const updatedData = {
              ...prevData,
              dimensionLines: prevData.dimensionLines
                ? prevData.dimensionLines.filter(
                  (dim) => dim.id !== selectedDimensionId
                )
                : [],
            };
            if (setContextFloorPlanData) {
              setTimeout(() => {
                setContextFloorPlanData(updatedData);
              }, 0);
            }
            return updatedData;
          });
          setSelectedDimensionId(null);
          setHasChanges(true);
        } else if (selectedRoomIds.length > 0) {
          captureStateBeforeChange();

          const wallSegmentIds = selectedRoomIds.filter((id) =>
            id.includes("-wall-")
          );
          const roomIds = selectedRoomIds.filter(
            (id) => !id.includes("-wall-") && !floorPlanData.rooms.find(r => r.id === id)?.isBoundary
          );

          setFloorPlanData((prevData) => {
            let updatedRooms = [...prevData.rooms];

            if (wallSegmentIds.length > 0) {
              wallSegmentIds.forEach((wallSegmentId) => {
                const parts = wallSegmentId.split("-wall-");
                if (parts.length === 2) {
                  const roomId = parts[0];
                  const segmentIndex = parseInt(parts[1]);

                  const roomIndex = updatedRooms.findIndex(
                    (room) => room.id === roomId
                  );
                  if (roomIndex !== -1) {
                    const room = updatedRooms[roomIndex];

                    if (room.room_type !== "Wall") {
                      const roomPolygon = room.floor_polygon;
                      const newWallRooms = [];

                      for (let i = 0; i < roomPolygon.length; i++) {
                        if (i === segmentIndex) continue;

                        const startPoint = roomPolygon[i];
                        const endPoint =
                          roomPolygon[(i + 1) % roomPolygon.length];
                        const wallRoom = {
                          id: generateUniqueId("wall"),
                          room_type: "Wall",
                          area: 0,
                          height: 0,
                          width: 6,
                          floor_polygon: [startPoint, endPoint],
                        };

                        newWallRooms.push(wallRoom);
                      }
                      updatedRooms.splice(roomIndex, 1);
                      updatedRooms.push(...newWallRooms);
                    }
                  }
                }
              });
            }

            if (roomIds.length > 0) {
              updatedRooms = updatedRooms.filter(
                (room) => !roomIds.includes(room.id)
              );
            }
            const tempData = {
              ...prevData,
              rooms: updatedRooms,
            };

            const updatedData = ensureCoordinateSystem(tempData);

            if (setContextFloorPlanData) {
              setTimeout(() => {
                setContextFloorPlanData(updatedData);
              }, 0);
            }
            return updatedData;
          });

          setWallWidths((prev) => {
            const newWallWidths = { ...prev };
            wallSegmentIds.forEach((wallSegmentId) => {
              delete newWallWidths[wallSegmentId];
            });
            return newWallWidths;
          });

          setSelectedRoomIds([]);
          setSelectedRoomId(null);
          setHasChanges(true);
          checkAndUpdateOverlaps();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    selectedRoomIds,
    selectedLabelId,
    selectedObjectId,
    selectedDoorId,
    selectedWindowId,
    selectedDimensionId,
    isRotatingObject,
    rotatingObjectId,
    captureStateBeforeChange,
    setContextFloorPlanData,
    checkAndUpdateOverlaps,
    setDoorWidths,
    setWindowWidths,
    setWallWidths,
    wallWidths,
    generateUniqueId,
  ]);

  const bounds = useMemo(
    () => {
      const visibleRooms = floorPlanData.rooms.filter(room =>
        room.room_type !== "Reference"
      );
      if (visibleRooms.length === 0) {
        return { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
      }
      return calculateBounds(visibleRooms);
    },
    [floorPlanData.rooms, roomRotations]
  );
  const tlength = bounds.maxZ - bounds.minZ;
  const twidth = bounds.maxX - bounds.minX;

  const padding = 1000;
  const contentWidth = bounds.maxX - bounds.minX + 2 * padding;
  const contentHeight = bounds.maxZ - bounds.minZ + 2 * padding;
  const isMobile = window.innerWidth < 850;

  const {
    transformCoordinates,
    reverseTransformCoordinates: originalReverseTransform,
  } = useCoordinateTransforms(bounds, padding, scale);

  const reverseTransformCoordinates = useCallback(
    (x: number, y: number) => {
      const correctedX = x / parentScale;
      const correctedY = y / parentScale;
      return originalReverseTransform(correctedX, correctedY);
    },
    [originalReverseTransform, parentScale]
  );

  useEffect(() => {
    const handleFloorPlanClick = (e: MouseEvent) => {
      const labelState = getLabelPlacementState();
      const doorState = getDoorPlacementState();
      const windowState = getWindowPlacementState();

      if (labelState.isPlacing && labelState.text) {
        const isObject = labelState.text.startsWith("/Objects/");

        if (isObject) {
          setIsObjectPlacementMode(true);
          if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const floorPlanCoords = reverseTransformCoordinates(x, y);

            if (!hasChanges) {
              captureOriginalState();
            }
            captureStateBeforeChange();
            addObject(labelState.text, floorPlanCoords);

            setHasChanges(true);
            setLabelPlacementState(false, null);
            setIsObjectPlacementMode(false);
            window.dispatchEvent(new CustomEvent("labelPlaced"));

            e.stopPropagation();
            e.preventDefault();
          }
        } else {
          setIsLabelPlacementMode(true);
          if (svgRef.current) {
            const rect = svgRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const floorPlanCoords = reverseTransformCoordinates(x, y);

            if (!hasChanges) {
              captureOriginalState();
            }
            captureStateBeforeChange();
            addLabel(labelState.text, floorPlanCoords);

            setHasChanges(true);
            setLabelPlacementState(false, null);
            setIsLabelPlacementMode(false);
            window.dispatchEvent(new CustomEvent("labelPlaced"));

            e.stopPropagation();
            e.preventDefault();
          }
        }
      }

      if (doorState.isPlacing && doorState.doorPath) {
        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const floorPlanCoords = reverseTransformCoordinates(x, y);

          const isValid = isValidPlacementPosition(
            floorPlanCoords,
            floorPlanData,
            roomRotations,
            3.0
          );

          if (!isValid) {
            showPlacementError("Doors must be placed on walls only.");
            e.stopPropagation();
            e.preventDefault();
            return;
          }

          const placementResult = getSnappedPlacementResult(
            floorPlanCoords,
            floorPlanData,
            roomRotations,
            3.0
          );

          if (!hasChanges) {
            captureOriginalState();
          }
          captureStateBeforeChange();

          const doorId = `door-${Date.now()}`;
          const newDoor = {
            id: doorId,
            doorPath: doorState.doorPath,
            position: placementResult.position,
            rotation: placementResult.rotation,
            scale: 1,
            width: 2,
            flipHorizontal: false,
            flipVertical: false,
          };

          setFloorPlanData((prevData) => {
            const doors = prevData.doors || [];
            setDoorWidths((prev) => ({ ...prev, [doorId]: 2 }));

            const newData = {
              ...prevData,
              doors: [...doors, newDoor],
            };

            if (setContextFloorPlanData) {
              setTimeout(() => {
                setContextFloorPlanData(newData);
              }, 0);
            }

            return newData;
          });

          setHasChanges(true);
          setDoorPlacementState(false, null);
          window.dispatchEvent(new CustomEvent("doorPlaced"));

          e.stopPropagation();
          e.preventDefault();
        }
      }

      if (windowState.isPlacing && windowState.windowPath) {
        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const floorPlanCoords = reverseTransformCoordinates(x, y);

          const isValid = isValidPlacementPosition(
            floorPlanCoords,
            floorPlanData,
            roomRotations,
            3.0
          );

          if (!isValid) {
            showPlacementError("Windows must be placed on walls only.");
            e.stopPropagation();
            e.preventDefault();
            return;
          }

          const placementResult = getSnappedPlacementResult(
            floorPlanCoords,
            floorPlanData,
            roomRotations,
            3.0
          );

          if (!hasChanges) {
            captureOriginalState();
          }
          captureStateBeforeChange();

          const windowId = `window-${Date.now()}`;
          const newWindow = {
            id: windowId,
            windowPath: windowState.windowPath,
            position: placementResult.position,
            rotation: placementResult.rotation,
            scale: 1,
            width: 2,
            flipHorizontal: false,
            flipVertical: false,
          };

          setFloorPlanData((prevData) => {
            const windows = prevData.windows || [];
            setWindowWidths((prev) => ({ ...prev, [windowId]: 1 }));

            const newData = {
              ...prevData,
              windows: [...windows, newWindow],
            };

            if (setContextFloorPlanData) {
              setTimeout(() => {
                setContextFloorPlanData(newData);
              }, 0);
            }

            return newData;
          });

          setHasChanges(true);
          setWindowPlacementState(false, null);
          window.dispatchEvent(new CustomEvent("windowPlaced"));

          e.stopPropagation();
          e.preventDefault();
        }
      }
    };

    const handleFloorPlanDragOver = (e: DragEvent) => {
      if (
        e.dataTransfer?.types.includes("application/x-floor-plan-object") ||
        e.dataTransfer?.types.includes("application/x-floor-plan-door") ||
        e.dataTransfer?.types.includes("application/x-floor-plan-window")
      ) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    };

    const handleFloorPlanDrop = (e: DragEvent) => {
      const objectPath = e.dataTransfer?.getData(
        "application/x-floor-plan-object"
      );
      if (objectPath && svgRef.current) {
        e.preventDefault();
        e.stopPropagation();

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);

        if (!hasChanges) {
          captureOriginalState();
        }
        captureStateBeforeChange();

        addObject(objectPath, floorPlanCoords);
        setHasChanges(true);

        window.dispatchEvent(new CustomEvent("labelPlaced"));
        return;
      }

      const doorPath = e.dataTransfer?.getData("application/x-floor-plan-door");
      if (doorPath && svgRef.current) {
        e.preventDefault();
        e.stopPropagation();

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);

        const isValid = isValidPlacementPosition(
          floorPlanCoords,
          floorPlanData,
          roomRotations,
          8.0
        );

        if (!isValid) {
          showPlacementError("Doors must be placed on walls only.");
          return;
        }

        const placementResult = getSnappedPlacementResult(
          floorPlanCoords,
          floorPlanData,
          roomRotations,
          8.0
        );

        if (!hasChanges) {
          captureOriginalState();
        }
        captureStateBeforeChange();

        const doorId = `door-${Date.now()}`;
        const newDoor = {
          id: doorId,
          doorPath: doorPath,
          position: placementResult.position,
          rotation: placementResult.rotation,
          scale: 1,
          width: 2,
          flipHorizontal: false,
          flipVertical: false,
        };

        setFloorPlanData((prevData) => {
          const doors = prevData.doors || [];
          setDoorWidths((prev) => ({ ...prev, [doorId]: 1 }));

          const newData = {
            ...prevData,
            doors: [...doors, newDoor],
          };

          if (setContextFloorPlanData) {
            setTimeout(() => {
              setContextFloorPlanData(newData);
            }, 0);
          }

          return newData;
        });

        setHasChanges(true);
        window.dispatchEvent(new CustomEvent("doorPlaced"));
        return;
      }

      const windowPath = e.dataTransfer?.getData(
        "application/x-floor-plan-window"
      );
      if (windowPath && svgRef.current) {
        e.preventDefault();
        e.stopPropagation();

        const rect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);
        const isValid = isValidPlacementPosition(
          floorPlanCoords,
          floorPlanData,
          roomRotations,
          8.0
        );

        if (!isValid) {
          showPlacementError("Windows must be placed on walls only.");
          return;
        }

        const placementResult = getSnappedPlacementResult(
          floorPlanCoords,
          floorPlanData,
          roomRotations,
          8.0
        );

        if (!hasChanges) {
          captureOriginalState();
        }
        captureStateBeforeChange();

        const windowId = `window-${Date.now()}`;
        const newWindow = {
          id: windowId,
          windowPath: windowPath,
          position: placementResult.position,
          rotation: placementResult.rotation,
          scale: 1,
          width: 2,
          flipHorizontal: false,
          flipVertical: false,
        };

        setFloorPlanData((prevData) => {
          const windows = prevData.windows || [];
          setWindowWidths((prev) => ({ ...prev, [windowId]: 2 }));

          const newData = {
            ...prevData,
            windows: [...windows, newWindow],
          };

          if (setContextFloorPlanData) {
            setTimeout(() => {
              setContextFloorPlanData(newData);
            }, 0);
          }

          return newData;
        });

        setHasChanges(true);
        window.dispatchEvent(new CustomEvent("windowPlaced"));
        return;
      }
    };

    const showPlacementError = (message: string) => {
      const errorDiv = document.createElement("div");
      errorDiv.textContent = message;
      errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #f44336;
      color: white;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: 500;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
      border: 1px solid #d32f2f;
      min-width: 350px;
      white-space: nowrap;
      text-align: center;
      animation: slideDown 0.3s ease-out;
    `;

      if (!document.getElementById("error-animation-styles")) {
        const styleSheet = document.createElement("style");
        styleSheet.id = "error-animation-styles";
        styleSheet.textContent = `
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `;
        document.head.appendChild(styleSheet);
      }

      document.body.appendChild(errorDiv);

      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.style.animation = "slideDown 0.3s ease-out reverse";
          setTimeout(() => {
            if (errorDiv.parentNode) {
              errorDiv.parentNode.removeChild(errorDiv);
            }
          }, 300);
        }
      }, 2000);
    };

    const handleTouchObjectDrop = (e: CustomEvent) => {
      const { objectPath, clientX, clientY } = e.detail;

      if (objectPath && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);

        if (!hasChanges) {
          captureOriginalState();
        }
        captureStateBeforeChange();

        addObject(objectPath, floorPlanCoords);
        setHasChanges(true);

        window.dispatchEvent(new CustomEvent("labelPlaced"));
      }
    };

    const handleTouchDoorDrop = (e: CustomEvent) => {
      const { itemPath, clientX, clientY } = e.detail;

      if (itemPath && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);

        const isValid = isValidPlacementPosition(
          floorPlanCoords,
          floorPlanData,
          roomRotations,
          8.0
        );

        if (!isValid) {
          showPlacementError("Doors must be placed on walls only.");
          return;
        }

        const placementResult = getSnappedPlacementResult(
          floorPlanCoords,
          floorPlanData,
          roomRotations,
          8.0
        );

        if (!hasChanges) {
          captureOriginalState();
        }
        captureStateBeforeChange();

        const doorId = `door-${Date.now()}`;
        const newDoor = {
          id: doorId,
          doorPath: itemPath,
          position: placementResult.position,
          rotation: placementResult.rotation,
          scale: 1,
          width: 2,
          flipHorizontal: false,
          flipVertical: false,
        };

        setFloorPlanData((prevData) => {
          const doors = prevData.doors || [];
          setDoorWidths((prev) => ({ ...prev, [doorId]: 1 }));

          const newData = {
            ...prevData,
            doors: [...doors, newDoor],
          };

          if (setContextFloorPlanData) {
            setTimeout(() => {
              setContextFloorPlanData(newData);
            }, 0);
          }

          return newData;
        });

        setHasChanges(true);
        window.dispatchEvent(new CustomEvent("doorPlaced"));
      }
    };

    const handleTouchWindowDrop = (e: CustomEvent) => {
      const { itemPath, clientX, clientY } = e.detail;

      if (itemPath && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);

        const isValid = isValidPlacementPosition(
          floorPlanCoords,
          floorPlanData,
          roomRotations,
          8.0
        );

        if (!isValid) {
          showPlacementError("Windows must be placed on walls only.");
          return;
        }

        const placementResult = getSnappedPlacementResult(
          floorPlanCoords,
          floorPlanData,
          roomRotations,
          8.0
        );

        if (!hasChanges) {
          captureOriginalState();
        }
        captureStateBeforeChange();

        const windowId = `window-${Date.now()}`;
        const newWindow = {
          id: windowId,
          windowPath: itemPath,
          position: placementResult.position,
          rotation: placementResult.rotation,
          scale: 1,
          width: 2,
          flipHorizontal: false,
          flipVertical: false,
        };

        setFloorPlanData((prevData) => {
          const windows = prevData.windows || [];
          setWindowWidths((prev) => ({ ...prev, [windowId]: 2 }));

          const newData = {
            ...prevData,
            windows: [...windows, newWindow],
          };

          if (setContextFloorPlanData) {
            setTimeout(() => {
              setContextFloorPlanData(newData);
            }, 0);
          }

          return newData;
        });

        setHasChanges(true);
        window.dispatchEvent(new CustomEvent("windowPlaced"));
      }
    };

    document.addEventListener("click", handleFloorPlanClick, { capture: true });
    document.addEventListener("dragover", handleFloorPlanDragOver, {
      capture: true,
    });
    document.addEventListener("drop", handleFloorPlanDrop, { capture: true });
    document.addEventListener(
      "touchObjectDrop",
      handleTouchObjectDrop as EventListener
    );
    document.addEventListener(
      "touchDoorDrop",
      handleTouchDoorDrop as EventListener
    );
    document.addEventListener(
      "touchWindowDrop",
      handleTouchWindowDrop as EventListener
    );

    return () => {
      document.removeEventListener("click", handleFloorPlanClick, {
        capture: true,
      });
      document.removeEventListener("dragover", handleFloorPlanDragOver, {
        capture: true,
      });
      document.removeEventListener("drop", handleFloorPlanDrop, {
        capture: true,
      });
      document.removeEventListener(
        "touchObjectDrop",
        handleTouchObjectDrop as EventListener
      );
      document.removeEventListener(
        "touchDoorDrop",
        handleTouchDoorDrop as EventListener
      );
      document.removeEventListener(
        "touchWindowDrop",
        handleTouchWindowDrop as EventListener
      );
    };
  }, [
    reverseTransformCoordinates,
    addLabel,
    addObject,
    addDoor,
    addWindow,
    setHasChanges,
    floorPlanData,
    roomRotations,
    hasChanges,
    captureOriginalState,
    captureStateBeforeChange,
    setDoorWidths,
    setWindowWidths,
    setContextFloorPlanData,
  ]);

  useEffect(() => {
    const handleCornerPlacement = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".back-button")) {
        return;
      }

      const cornerState = getCornerPlacementState();

      if (cornerState.isPlacing) {
        e.stopPropagation();
        e.preventDefault();

        if (svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          const floorPlanCoords = reverseTransformCoordinates(x, y);

          const clickedRoom = findRoomAtPosition(
            floorPlanCoords,
            floorPlanData,
            roomRotations
          );

          if (clickedRoom) {
            const success = addCornerToRoom(
              clickedRoom.id,
              floorPlanCoords,
              floorPlanData,
              setFloorPlanData,
              setHasChanges,
              captureStateBeforeChange,
              hasChanges,
              captureOriginalState,
              calculateRoomArea,
              calculateRoomDimensions
            );

            if (success) {
              const successDiv = document.createElement("div");
              successDiv.textContent = "Corner added successfully!";
              successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4CAF50;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  `;

              document.body.appendChild(successDiv);

              setTimeout(() => {
                if (successDiv.parentNode) {
                  successDiv.parentNode.removeChild(successDiv);
                }
              }, 2000);

              setSelectedRoomIds([clickedRoom.id]);

              checkAndUpdateOverlaps();

              if (setContextFloorPlanData) {
                setTimeout(() => {
                  setFloorPlanData((currentData) => {
                    setContextFloorPlanData(currentData);
                    return currentData;
                  });
                }, 50);
              }
              setCornerPlacementState(false);

              setTimeout(() => {
                const backButton = document.querySelector(
                  ".back-button"
                ) as HTMLButtonElement;
                if (backButton) {
                  backButton.click();
                }
              }, 100);
            }
          } else {
            const errorDiv = document.createElement("div");
            errorDiv.textContent =
              "Cannot add corner here. Click on a room wall to add a corner";
            errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #f44336;
    color: white;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
  `;

            document.body.appendChild(errorDiv);

            setTimeout(() => {
              if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
              }
            }, 2000);
          }
        }
      }
    };

    document.addEventListener("click", handleCornerPlacement, {
      capture: true,
    });

    return () => {
      document.removeEventListener("click", handleCornerPlacement, {
        capture: true,
      });
    };
  }, [
    reverseTransformCoordinates,
    floorPlanData,
    roomRotations,
    setFloorPlanData,
    setHasChanges,
    captureStateBeforeChange,
    hasChanges,
    captureOriginalState,
    checkAndUpdateOverlaps,
    setContextFloorPlanData,
  ]);

  useEffect(() => {
    if (activeBuildTool !== "drawCorner") {
      setCornerPlacementState(false);
    }
  }, [activeBuildTool]);

  useEffect(() => {
    const handleDimensionClick = (e: CustomEvent) => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.detail.clientX - rect.left;
        const y = e.detail.clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);

        if (e.detail.pointsCount === 0) {
          window.dimensionFirstPoint = {
            x: floorPlanCoords.x,
            z: floorPlanCoords.z,
          };
        } else if (window.dimensionFirstPoint) {
          const firstPoint = window.dimensionFirstPoint;
          const secondPoint = { x: floorPlanCoords.x, z: floorPlanCoords.z };

          if (!hasChanges) {
            captureOriginalState();
          }
          captureStateBeforeChange();

          addDimensionLine(firstPoint, secondPoint);
          setHasChanges(true);

          delete window.dimensionFirstPoint;
        }
      }
    };

    window.addEventListener(
      "dimensionClick",
      handleDimensionClick as EventListener
    );
    return () => {
      window.removeEventListener(
        "dimensionClick",
        handleDimensionClick as EventListener
      );
    };
  }, [
    reverseTransformCoordinates,
    addDimensionLine,
    setHasChanges,
    captureStateBeforeChange,
    captureOriginalState,
    hasChanges,
  ]);

  const renderPreviewDimensionLine = () => {
    if (!isDimensionDrawing || !dimensionStartPoint || !dimensionCurrentPoint) {
      return null;
    }

    const startPos = transformCoordinates(dimensionStartPoint);
    const endPos = transformCoordinates(dimensionCurrentPoint);

    const distance = Math.sqrt(
      Math.pow(dimensionCurrentPoint.x - dimensionStartPoint.x, 2) +
      Math.pow(dimensionCurrentPoint.z - dimensionStartPoint.z, 2)
    );

    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const offsetMidX = (startPos.x + endPos.x) / 2;
    const offsetMidY = (startPos.y + endPos.y) / 2;

    return (
      <g className="dimension-preview" style={{ opacity: 0.7 }}>
        <line
          x1={startPos.x}
          y1={startPos.y}
          x2={endPos.x}
          y2={endPos.y}
          stroke="#2196F3"
          strokeWidth="0.8"
          markerStart="url(#dimensionArrowStart)"
          markerEnd="url(#dimensionArrowEnd)"
        />

        <text
          x={offsetMidX}
          y={
            offsetMidY +
            (Math.abs(angle) < 45 || Math.abs(angle) > 135 ? 15 : -10)
          }
          fill="#2196F3"
          fontSize="9"
          fontWeight="500"
          textAnchor="middle"
          transform={`rotate(${angle > 90 || angle < -90 ? angle + 180 : angle
            }, ${offsetMidX}, ${offsetMidY - 8})`}
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
          }}
        >
          {formatImperialLength(coordToInches(distance / 10), unitSystem)}
        </text>
      </g>
    );
  };

  const calculateAngle = (
    centerX: number,
    centerY: number,
    mouseX: number,
    mouseY: number
  ) => {
    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;
    return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
  };

  const handleRotationStart = useCallback(
    (
      e: React.MouseEvent,
      objectId: string,
      centerX: number,
      centerY: number
    ) => {
      e.stopPropagation();
      e.preventDefault();

      if (!hasChanges) {
        captureOriginalState();
      }
      captureStateBeforeChange();

      const svgElement = svgRef.current;
      if (!svgElement) return;

      const rect = svgElement.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / parentScale;
      const mouseY = (e.clientY - rect.top) / parentScale;

      const startAngle = calculateAngle(centerX, centerY, mouseX, mouseY);
      const currentRotation = objectRotations[objectId] || 0;

      setIsRotatingObject(true);
      setRotatingObjectId(objectId);
      setRotationStartAngle(startAngle);
      setInitialObjectRotation(currentRotation);
      setHasChanges(true);
    },
    [
      hasChanges,
      captureOriginalState,
      captureStateBeforeChange,
      objectRotations,
      svgRef,
      parentScale,
    ]
  );

  const handleRotationTouchStart = useCallback(
    (
      e: React.TouchEvent,
      objectId: string,
      centerX: number,
      centerY: number
    ) => {
      e.stopPropagation();
      e.preventDefault();

      if (!hasChanges) {
        captureOriginalState();
      }
      captureStateBeforeChange();

      if (e.touches.length !== 1) return;

      const svgElement = svgRef.current;
      if (!svgElement) return;

      const rect = svgElement.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = (touch.clientX - rect.left) / parentScale;
      const touchY = (touch.clientY - rect.top) / parentScale;

      const startAngle = calculateAngle(centerX, centerY, touchX, touchY);
      const currentRotation = objectRotations[objectId] || 0;

      setIsRotatingObject(true);
      setRotatingObjectId(objectId);
      setRotationStartAngle(startAngle);
      setInitialObjectRotation(currentRotation);
      setHasChanges(true);

      document.body.setAttribute("data-object-touch-interaction", "true");
    },
    [
      hasChanges,
      captureOriginalState,
      captureStateBeforeChange,
      objectRotations,
      svgRef,
      parentScale,
    ]
  );

  const renderWallHighlights = () => {
    const doorState = getDoorPlacementState();
    const windowState = getWindowPlacementState();

    if (!doorState.isPlacing && !windowState.isPlacing) {
      return null;
    }

    const wallSegments = getAllWallSegments(floorPlanData, roomRotations);

    return (
      <g className="wall-highlights">
        {wallSegments.map((wall, index) => {
          const startPos = transformCoordinates(wall.start);
          const endPos = transformCoordinates(wall.end);

          return (
            <line
              key={`wall-highlight-${index}`}
              x1={startPos.x}
              y1={startPos.y}
              x2={endPos.x}
              y2={endPos.y}
              stroke="#4CAF50"
              strokeWidth="3"
              strokeOpacity="0.6"
              strokeDasharray="5,5"
              pointerEvents="none"
              style={{
                animation: "wall-pulse 2s infinite",
              }}
            />
          );
        })}
        <style>{`
        @keyframes wall-pulse {
          0%, 100% { stroke-opacity: 0.3; }
          50% { stroke-opacity: 0.8; }
        }
      `}</style>
      </g>
    );
  };

  useEffect(() => {
    const handleRotationMove = (e: MouseEvent) => {
      if (!isRotatingObject || !rotatingObjectId) return;

      const object = floorPlanData.objects?.find(
        (obj) => obj.id === rotatingObjectId
      );
      if (!object) return;

      const position = transformCoordinates(object.position);

      const svgElement = svgRef.current;
      if (!svgElement) return;

      const rect = svgElement.getBoundingClientRect();

      const mouseX = (e.clientX - rect.left) / parentScale;
      const mouseY = (e.clientY - rect.top) / parentScale;

      const currentAngle = calculateAngle(
        position.x,
        position.y,
        mouseX,
        mouseY
      );

      let angleDiff = currentAngle - rotationStartAngle;

      if (angleDiff > 180) {
        angleDiff -= 360;
      } else if (angleDiff < -180) {
        angleDiff += 360;
      }

      const sensitivity = 3.0;
      const adjustedAngleDiff = angleDiff * sensitivity;

      let newRotation = initialObjectRotation + adjustedAngleDiff;

      while (newRotation < 0) newRotation += 360;
      while (newRotation >= 360) newRotation -= 360;

      setObjectRotations((prev) => ({
        ...prev,
        [rotatingObjectId]: newRotation,
      }));

      setFloorPlanData((prevData) => {
        const updatedObjects = (prevData.objects || []).map((obj) => {
          if (obj.id === rotatingObjectId) {
            return { ...obj, rotation: newRotation };
          }
          return obj;
        });

        const updatedData = {
          ...prevData,
          objects: updatedObjects,
        };

        return updatedData;
      });
    };

    const handleRotationTouchMove = (e: TouchEvent) => {
      if (!isRotatingObject || !rotatingObjectId) return;

      e.preventDefault();

      if (e.touches.length !== 1) return;

      const object = floorPlanData.objects?.find(
        (obj) => obj.id === rotatingObjectId
      );
      if (!object) return;

      const position = transformCoordinates(object.position);

      const svgElement = svgRef.current;
      if (!svgElement) return;

      const rect = svgElement.getBoundingClientRect();
      const touch = e.touches[0];

      const touchX = (touch.clientX - rect.left) / parentScale;
      const touchY = (touch.clientY - rect.top) / parentScale;

      const currentAngle = calculateAngle(
        position.x,
        position.y,
        touchX,
        touchY
      );

      let angleDiff = currentAngle - rotationStartAngle;

      if (angleDiff > 180) {
        angleDiff -= 360;
      } else if (angleDiff < -180) {
        angleDiff += 360;
      }

      const sensitivity = 3.0;
      const adjustedAngleDiff = angleDiff * sensitivity;

      let newRotation = initialObjectRotation + adjustedAngleDiff;

      while (newRotation < 0) newRotation += 360;
      while (newRotation >= 360) newRotation -= 360;

      setObjectRotations((prev) => ({
        ...prev,
        [rotatingObjectId]: newRotation,
      }));

      setFloorPlanData((prevData) => {
        const updatedObjects = (prevData.objects || []).map((obj) => {
          if (obj.id === rotatingObjectId) {
            return { ...obj, rotation: newRotation };
          }
          return obj;
        });

        const updatedData = {
          ...prevData,
          objects: updatedObjects,
        };

        return updatedData;
      });
    };

    const handleRotationEnd = () => {
      if (isRotatingObject && rotatingObjectId) {
        if (setContextFloorPlanData) {
          const object = floorPlanData.objects?.find(
            (obj) => obj.id === rotatingObjectId
          );
          if (object) {
            const finalRotation = objectRotations[rotatingObjectId] || 0;
            setFloorPlanData((prevData) => {
              const updatedObjects = (prevData.objects || []).map((obj) => {
                if (obj.id === rotatingObjectId) {
                  return { ...obj, rotation: finalRotation };
                }
                return obj;
              });

              const updatedData = {
                ...prevData,
                objects: updatedObjects,
              };

              setTimeout(() => {
                setContextFloorPlanData(updatedData);
              }, 0);

              return updatedData;
            });
          }
        }
      }

      document.body.removeAttribute("data-object-touch-interaction");

      setIsRotatingObject(false);
      setRotatingObjectId(null);
      setRotationStartAngle(0);
      setInitialObjectRotation(0);
    };

    if (isRotatingObject) {
      document.addEventListener("mousemove", handleRotationMove);
      document.addEventListener("mouseup", handleRotationEnd);
      document.addEventListener("mouseleave", handleRotationEnd);
      document.addEventListener("touchmove", handleRotationTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleRotationEnd);
      document.addEventListener("touchcancel", handleRotationEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleRotationMove);
      document.removeEventListener("mouseup", handleRotationEnd);
      document.removeEventListener("mouseleave", handleRotationEnd);

      document.removeEventListener("touchmove", handleRotationTouchMove);
      document.removeEventListener("touchend", handleRotationEnd);
      document.removeEventListener("touchcancel", handleRotationEnd);
    };
  }, [
    isRotatingObject,
    rotatingObjectId,
    rotationStartAngle,
    initialObjectRotation,
    floorPlanData.objects,
    transformCoordinates,
    objectRotations,
    setContextFloorPlanData,
    svgRef,
    parentScale,
  ]);

  useEffect(() => {
    const handleDimensionMouseDown = (e: CustomEvent) => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.detail.clientX - rect.left;
        const y = e.detail.clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);

        setIsDimensionDrawing(true);
        setDimensionStartPoint({ x: floorPlanCoords.x, z: floorPlanCoords.z });
        setDimensionCurrentPoint({
          x: floorPlanCoords.x,
          z: floorPlanCoords.z,
        });

        window.dispatchEvent(new CustomEvent("dimensionDragStart"));
      }
    };

    const handleDimensionMouseMove = (e: CustomEvent) => {
      if (isDimensionDrawing && svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        const x = e.detail.clientX - rect.left;
        const y = e.detail.clientY - rect.top;

        const floorPlanCoords = reverseTransformCoordinates(x, y);
        setDimensionCurrentPoint({
          x: floorPlanCoords.x,
          z: floorPlanCoords.z,
        });
      }
    };

    const handleDimensionMouseUp = (e: CustomEvent) => {
      if (isDimensionDrawing && dimensionStartPoint && dimensionCurrentPoint) {
        const distance = Math.sqrt(
          Math.pow(dimensionCurrentPoint.x - dimensionStartPoint.x, 2) +
          Math.pow(dimensionCurrentPoint.z - dimensionStartPoint.z, 2)
        );

        if (distance > 0.1) {
          if (!hasChanges) {
            captureOriginalState();
          }
          captureStateBeforeChange();

          addDimensionLine(dimensionStartPoint, dimensionCurrentPoint);
          setHasChanges(true);
        }

        setIsDimensionDrawing(false);
        setDimensionStartPoint(null);
        setDimensionCurrentPoint(null);

        window.dispatchEvent(new CustomEvent("dimensionDragEnd"));
        window.dispatchEvent(new CustomEvent("resetDimensionTool"));
      }
    };

    window.addEventListener(
      "dimensionMouseDown",
      handleDimensionMouseDown as EventListener
    );
    window.addEventListener(
      "dimensionMouseMove",
      handleDimensionMouseMove as EventListener
    );
    window.addEventListener(
      "dimensionMouseUp",
      handleDimensionMouseUp as EventListener
    );

    return () => {
      window.removeEventListener(
        "dimensionMouseDown",
        handleDimensionMouseDown as EventListener
      );
      window.removeEventListener(
        "dimensionMouseMove",
        handleDimensionMouseMove as EventListener
      );
      window.removeEventListener(
        "dimensionMouseUp",
        handleDimensionMouseUp as EventListener
      );
    };
  }, [
    isDimensionDrawing,
    dimensionStartPoint,
    dimensionCurrentPoint,
    reverseTransformCoordinates,
    addDimensionLine,
    setHasChanges,
    captureStateBeforeChange,
    captureOriginalState,
    hasChanges,
  ]);

  useEffect(() => {
    const handleDragEnd = (e: DragEvent) => {
      setDragState({
        active: false,
        roomId: null,
        roomIds: [],
        vertexIndex: null,
        edgeIndices: null,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        isResizing: false,
        isEdgeResizing: false,
        isGroupOperation: false,
      });
      e.preventDefault();
      e.stopPropagation();

      document.body.style.pointerEvents = "none";
      setTimeout(() => {
        document.body.style.pointerEvents = "";
      }, 100);
    };

    document.addEventListener("dragend", handleDragEnd);
    document.addEventListener("drop", handleDragEnd);

    return () => {
      document.removeEventListener("dragend", handleDragEnd);
      document.removeEventListener("drop", handleDragEnd);
    };
  }, []);

  useEffect(() => {
    if (floorPlanData && setContextFloorPlanData && !dragState.active) {
      setContextFloorPlanData(floorPlanData);
    }
  }, [floorPlanData, setContextFloorPlanData, dragState.active]);

  const isContextInitialized = useRef(false);
  const prevRoomTypesRef = useRef<string[]>([]);

  useEffect(() => {
    if (!contextFloorPlanData) return;
    const contextRoomTypes = contextFloorPlanData.rooms.map(
      (r) => `${r.id}-${r.room_type}`
    );

    const isInitialLoad = !isContextInitialized.current;
    const hasLabelChange =
      floorPlanData?.labels?.length !== contextFloorPlanData?.labels?.length;
    const hasObjectChange =
      floorPlanData?.objects?.length !== contextFloorPlanData?.objects?.length;
    const hasDoorChange =
      floorPlanData?.doors?.length !== contextFloorPlanData?.doors?.length;
    const hasWindowChange =
      floorPlanData?.windows?.length !== contextFloorPlanData?.windows?.length;
    const hasDimensionChange =
      floorPlanData?.dimensionLines?.length !==
      contextFloorPlanData?.dimensionLines?.length;
    const hasRoomTypeChange =
      JSON.stringify(contextRoomTypes) !==
      JSON.stringify(prevRoomTypesRef.current);

    if (
      isInitialLoad ||
      hasLabelChange ||
      hasObjectChange ||
      hasDoorChange ||
      hasWindowChange ||
      hasDimensionChange ||
      hasRoomTypeChange
    ) {
      prevRoomTypesRef.current = contextRoomTypes;
      isContextInitialized.current = true;
      setFloorPlanData(contextFloorPlanData);
    }
  }, [contextFloorPlanData]);

  useEffect(() => {
    if (contextSelectedRoomIds && contextSelectedRoomIds.length > 0) {
      setSelectedRoomIds(contextSelectedRoomIds);
    }
  }, [contextSelectedRoomIds]);


  useEffect(() => {
  // Only update context if the values are actually different
  if (JSON.stringify(contextSelectedRoomIds) !== JSON.stringify(selectedRoomIds)) {
    setContextSelectedRoomIds(selectedRoomIds);
  }
}, [selectedRoomIds]); 


  useEffect(() => {
    const handleFloorPlanReset = (event: CustomEvent) => {
      if (event.detail) {
        setFloorPlanData(event.detail);
        checkAndUpdateOverlaps();
      }
    };

    window.addEventListener(
      "floorPlanReset",
      handleFloorPlanReset as EventListener
    );

    return () => {
      window.removeEventListener(
        "floorPlanReset",
        handleFloorPlanReset as EventListener
      );
    };
  }, [checkAndUpdateOverlaps]);

  useEffect(() => {
    const labelState = getLabelPlacementState();
    setIsLabelPlacementMode(labelState.isPlacing);
  }, [getLabelPlacementState().isPlacing]);

  useEffect(() => {
    if (contextFloorPlanData && floorPlanData) {
      const contextLabelsLength = contextFloorPlanData.labels?.length || 0;
      const currentLabelsLength = floorPlanData.labels?.length || 0;
      const contextObjectsLength = contextFloorPlanData.objects?.length || 0;
      const currentObjectsLength = floorPlanData.objects?.length || 0;
      const contextDoorsLength = contextFloorPlanData.doors?.length || 0;
      const currentDoorsLength = floorPlanData.doors?.length || 0;
      const contextWindowsLength = contextFloorPlanData.windows?.length || 0;
      const currentWindowsLength = floorPlanData.windows?.length || 0;
      const contextDimensionsLength =
        contextFloorPlanData.dimensionLines?.length || 0;
      const currentDimensionsLength = floorPlanData.dimensionLines?.length || 0;

      if (
        contextLabelsLength !== currentLabelsLength ||
        contextObjectsLength !== currentObjectsLength ||
        contextDoorsLength !== currentDoorsLength ||
        contextWindowsLength !== currentWindowsLength ||
        contextDimensionsLength !== currentDimensionsLength
      ) {
        setHasChanges(true);
      }
    }
  }, [
    floorPlanData?.labels,
    floorPlanData?.objects,
    floorPlanData?.doors,
    floorPlanData?.windows,
    floorPlanData?.dimensionLines,
    contextFloorPlanData?.labels,
    contextFloorPlanData?.objects,
    contextFloorPlanData?.doors,
    contextFloorPlanData?.windows,
    contextFloorPlanData?.dimensionLines,
  ]);

  /*   useEffect(() => {
      const handleTemporaryBoundsUpdate = (event: CustomEvent) => {
        if (!event.detail) return;
  
        const tempBounds = event.detail;
  
        const paddedBounds = {
          minX: tempBounds.minX - padding,
          maxX: tempBounds.maxX + padding,
          minZ: tempBounds.minZ - padding,
          maxZ: tempBounds.maxZ + padding,
        };
  
        const newContentWidth = paddedBounds.maxX - paddedBounds.minX;
        const newContentHeight = paddedBounds.maxZ - paddedBounds.minZ;
  
        if (floorPlanRef.current) {
          floorPlanRef.current.style.width = `${newContentWidth * scale}px`;
          floorPlanRef.current.style.height = `${newContentHeight * scale}px`;
        }
      };
  
      window.addEventListener(
        "temporaryBoundsUpdate",
        handleTemporaryBoundsUpdate as EventListener
      );
  
      return () => {
        window.removeEventListener(
          "temporaryBoundsUpdate",
          handleTemporaryBoundsUpdate as EventListener
        );
      };
    }, [padding, scale]); */

  const positionWallMeasurements = (
    transformedPoints: { x: number; y: number }[],
    room: Room
  ) => {
    if (transformedPoints.length < 3) return null;

    const result = [];

    for (let i = 0; i < transformedPoints.length; i++) {
      const nextIndex = (i + 1) % transformedPoints.length;
      const point1 = transformedPoints[i];
      const point2 = transformedPoints[nextIndex];

      const dx = point2.x - point1.x;
      const dy = point2.y - point1.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length < 20) continue;

      const midpoint = {
        x: (point1.x + point2.x) / 2,
        y: (point1.y + point2.y) / 2,
      };

      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const wallLength = Math.sqrt(
        Math.pow(room.floor_polygon[(i + 1) % room.floor_polygon.length].x - room.floor_polygon[i].x, 2) +
        Math.pow(room.floor_polygon[(i + 1) % room.floor_polygon.length].z - room.floor_polygon[i].z, 2)
      ) / 10;
      const centroid = {
        x: transformedPoints.reduce((sum, p) => sum + p.x, 0) / transformedPoints.length,
        y: transformedPoints.reduce((sum, p) => sum + p.y, 0) / transformedPoints.length,
      };

      const dx2 = centroid.x - midpoint.x;
      const dy2 = centroid.y - midpoint.y;
      const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      const dirX = dx2 / dist;
      const dirY = dy2 / dist;

      const offsetDistance = 7;

      let labelAngle = angle;
      if (labelAngle > 90 || labelAngle < -90) {
        labelAngle += 180;
      }

      result.push({
        position: {
          x: midpoint.x + dirX * offsetDistance,
          y: midpoint.y + dirY * offsetDistance,
        },
        angle: labelAngle,
        value: wallLength.toString(),
        isWidth: false,
      });
    }

    return result;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingWallWidth || !draggingWallId) return;

      const deltaX = e.movementX;
      const sensitivity = 0.1;
      const widthChange = deltaX * sensitivity;

      const currentWidth = wallWidths[draggingWallId] || 4;
      const newWidth = Math.max(1, Math.min(50, currentWidth + widthChange));

      updateWallWidth(draggingWallId, Math.round(newWidth));
    };

    const handleMouseUp = () => {
      if (isDraggingWallWidth) {
        setIsDraggingWallWidth(false);
        setDraggingWallId(null);
        setInitialWallWidth(0);
        setHasChanges(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingWallWidth || !draggingWallId || e.touches.length !== 1)
        return;

      e.preventDefault();
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    if (isDraggingWallWidth) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    isDraggingWallWidth,
    draggingWallId,
    initialWallWidth,
    updateWallWidth,
    wallWidths,
  ]);

  const detectAndConvertWallsToRooms = (
    floorPlanData: FloorPlanData,
    setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
    calculateRoomArea: (polygon: Point[]) => number,
    calculateRoomDimensions: (polygon: Point[]) => {
      width: number;
      height: number;
    },
    generateUniqueId: (prefix: string) => string
  ) => {
    const wallRooms = floorPlanData.rooms.filter(
      (room: Room) => room.room_type === "Wall"
    );

    if (wallRooms.length < 3) return;

    const connectedWallGroups = findConnectedWallGroups(wallRooms);

    connectedWallGroups.forEach((wallGroup: Room[]) => {
      if (wallGroup.length >= 3) {
        const closedPolygon = attemptToFormClosedPolygon(wallGroup);

        if (closedPolygon) {
          convertWallsToRoom(
            closedPolygon,
            wallGroup,
            floorPlanData,
            setFloorPlanData,
            setHasChanges,
            calculateRoomArea,
            calculateRoomDimensions,
            generateUniqueId
          );
        }
      }
    });
  };

  const findConnectedWallGroups = (wallRooms: Room[]): Room[][] => {
    const visited = new Set<number>();
    const groups: Room[][] = [];
    const tolerance = 0.1;

    wallRooms.forEach((wall: Room, index: number) => {
      if (visited.has(index)) return;

      const group: Room[] = [];
      const stack = [index];

      while (stack.length > 0) {
        const currentIndex = stack.pop();
        if (currentIndex === undefined || visited.has(currentIndex)) continue;

        visited.add(currentIndex);
        const currentWall = wallRooms[currentIndex];
        group.push(currentWall);

        wallRooms.forEach((otherWall: Room, otherIndex: number) => {
          if (visited.has(otherIndex) || currentIndex === otherIndex) return;

          if (areWallsConnected(currentWall, otherWall, tolerance)) {
            stack.push(otherIndex);
          }
        });
      }

      if (group.length > 0) {
        groups.push(group);
      }
    });

    return groups;
  };

  const isPointsClose = (
    point1: Point,
    point2: Point,
    tolerance: number
  ): boolean => {
    const dx = point1.x - point2.x;
    const dz = point1.z - point2.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance <= tolerance;
  };

  const attemptToFormClosedPolygon = (
    wallGroup: Room[]
  ): { polygon: Point[]; walls: string[] } | null => {
    if (wallGroup.length < 3) return null;

    const tolerance = 1.46;

    for (let startIndex = 0; startIndex < wallGroup.length; startIndex++) {
      const result = tryFormPolygonFromStart(wallGroup, startIndex, tolerance);
      if (result) {
        return result;
      }
    }
    return null;
  };

  const calculateTotalArea = (rooms: Room[], roomRotations: { [key: string]: number }) => {
    const boundaries = rooms.filter(room => room.isBoundary);
    const regularRooms = rooms.filter(room =>
      room.room_type !== "Wall" &&
      room.room_type !== "Reference" &&
      !room.isBoundary
    );

    if (boundaries.length === 0) {
      return regularRooms.reduce((sum, room) => sum + room.area, 0);
    }

    if (boundaries.length > 1) {
      const boundariesOutsideOthers: Room[] = [];

      boundaries.forEach(boundary => {
        const boundaryCenter = {
          x: boundary.floor_polygon.reduce((sum, p) => sum + p.x, 0) / boundary.floor_polygon.length,
          z: boundary.floor_polygon.reduce((sum, p) => sum + p.z, 0) / boundary.floor_polygon.length,
        };

        const isInsideAnotherBoundary = boundaries.some(otherBoundary =>
          otherBoundary.id !== boundary.id &&
          isPointInsidePolygon(boundaryCenter, otherBoundary.floor_polygon)
        );

        if (!isInsideAnotherBoundary) {
          boundariesOutsideOthers.push(boundary);
        }
      });

      const boundariesArea = boundariesOutsideOthers.reduce((sum, boundary) => sum + boundary.area, 0);

      const roomsOutsideAllBoundaries: Room[] = [];

      regularRooms.forEach(room => {
        const roomRotation = roomRotations[room.id] || 0;
        let roomPolygon = room.floor_polygon;

        if (roomRotation !== 0) {
          const centroid = {
            x: roomPolygon.reduce((sum, p) => sum + p.x, 0) / roomPolygon.length,
            z: roomPolygon.reduce((sum, p) => sum + p.z, 0) / roomPolygon.length,
          };
          const radians = (roomRotation * Math.PI) / 180;
          const cos = Math.cos(radians);
          const sin = Math.sin(radians);

          roomPolygon = roomPolygon.map(point => {
            const dx = point.x - centroid.x;
            const dz = point.z - centroid.z;
            return {
              x: centroid.x + dx * cos - dz * sin,
              z: centroid.z + dx * sin + dz * cos,
            };
          });
        }

        const roomCenter = {
          x: roomPolygon.reduce((sum, p) => sum + p.x, 0) / roomPolygon.length,
          z: roomPolygon.reduce((sum, p) => sum + p.z, 0) / roomPolygon.length,
        };

        const isInsideAnyBoundary = boundaries.some(boundary =>
          isPointInsidePolygon(roomCenter, boundary.floor_polygon)
        );

        if (!isInsideAnyBoundary) {
          roomsOutsideAllBoundaries.push(room);
        }
      });

      const outsideRoomsArea = roomsOutsideAllBoundaries.reduce((sum: number, room: Room) => sum + room.area, 0);
      return boundariesArea + outsideRoomsArea;
    }

    const boundary = boundaries[0];
    const roomsOutsideBoundary: Room[] = [];

    regularRooms.forEach(room => {
      const roomRotation = roomRotations[room.id] || 0;
      let roomPolygon = room.floor_polygon;

      if (roomRotation !== 0) {
        const centroid = {
          x: roomPolygon.reduce((sum, p) => sum + p.x, 0) / roomPolygon.length,
          z: roomPolygon.reduce((sum, p) => sum + p.z, 0) / roomPolygon.length,
        };
        const radians = (roomRotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);

        roomPolygon = roomPolygon.map(point => {
          const dx = point.x - centroid.x;
          const dz = point.z - centroid.z;
          return {
            x: centroid.x + dx * cos - dz * sin,
            z: centroid.z + dx * sin + dz * cos,
          };
        });
      }

      const roomCenter = {
        x: roomPolygon.reduce((sum, p) => sum + p.x, 0) / roomPolygon.length,
        z: roomPolygon.reduce((sum, p) => sum + p.z, 0) / roomPolygon.length,
      };

      if (!isPointInsidePolygon(roomCenter, boundary.floor_polygon)) {
        roomsOutsideBoundary.push(room);
      }
    });

    if (roomsOutsideBoundary.length > 0) {
      return boundary.area + roomsOutsideBoundary.reduce((sum: number, room: Room) => sum + room.area, 0);
    } else {
      return boundary.area;
    }
  };

  const tryFormPolygonFromStart = (
    wallGroup: Room[],
    startIndex: number,
    tolerance: number
  ): { polygon: Point[]; walls: string[] } | null => {
    const polygon: Point[] = [];
    const usedWalls = new Set<string>();

    let currentWall = wallGroup[startIndex];
    usedWalls.add(currentWall.id);

    const directions = [
      {
        start: currentWall.floor_polygon[0],
        end: currentWall.floor_polygon[1],
      },
      {
        start: currentWall.floor_polygon[1],
        end: currentWall.floor_polygon[0],
      },
    ];

    for (const direction of directions) {
      const tempPolygon: Point[] = [
        { ...direction.start },
        { ...direction.end },
      ];
      const tempUsedWalls = new Set([currentWall.id]);
      let tempCurrentEndPoint = { ...direction.end };

      let attempts = 0;
      const maxAttempts = wallGroup.length * 5;

      while (tempUsedWalls.size < wallGroup.length && attempts < maxAttempts) {
        attempts++;

        let bestConnection = findBestConnection(
          wallGroup,
          tempCurrentEndPoint,
          tempUsedWalls,
          Math.min(tolerance, 6.0)
        );
        if (bestConnection) {
          const { wall, connectPoint, nextPoint } = bestConnection;
          tempPolygon.push({ ...nextPoint });
          tempUsedWalls.add(wall.id);
          tempCurrentEndPoint = { ...nextPoint };
        } else {
          break;
        }
      }

      if (tempUsedWalls.size >= 3) {
        const firstPoint = tempPolygon[0];
        const distanceToClose = Math.sqrt(
          Math.pow(tempCurrentEndPoint.x - firstPoint.x, 2) +
          Math.pow(tempCurrentEndPoint.z - firstPoint.z, 2)
        );

        if (
          distanceToClose <= tolerance ||
          tempUsedWalls.size === wallGroup.length
        ) {
          if (tempPolygon.length > 3) {
            tempPolygon.pop();
          }

          return {
            polygon: tempPolygon,
            walls: Array.from(tempUsedWalls),
          };
        }
      }
    }

    return null;
  };

  const findBestConnection = (
    wallGroup: Room[],
    fromPoint: Point,
    usedWalls: Set<string>,
    tolerance: number
  ): { wall: Room; connectPoint: Point; nextPoint: Point } | null => {
    let bestConnection: {
      wall: Room;
      connectPoint: Point;
      nextPoint: Point;
      distance: number;
    } | null = null;

    for (const wall of wallGroup) {
      if (usedWalls.has(wall.id)) continue;

      const wallStart = wall.floor_polygon[0];
      const wallEnd = wall.floor_polygon[1];

      const connections = [
        {
          connectPoint: wallStart,
          nextPoint: wallEnd,
          distance: getDistance(fromPoint, wallStart),
        },
        {
          connectPoint: wallEnd,
          nextPoint: wallStart,
          distance: getDistance(fromPoint, wallEnd),
        },
      ];

      for (const conn of connections) {
        if (conn.distance <= tolerance) {
          if (!bestConnection || conn.distance < bestConnection.distance) {
            bestConnection = { wall, ...conn };
          }
        }
      }
    }

    if (bestConnection && bestConnection.distance <= tolerance) {
      return {
        wall: bestConnection.wall,
        connectPoint: bestConnection.connectPoint,
        nextPoint: bestConnection.nextPoint,
      };
    }

    return null;
  };

  const forceConnectWalls = (
    wallGroup: Room[],
    tolerance: number
  ): { polygon: Point[]; walls: string[] } | null => {
    const allPoints: Point[] = [];

    wallGroup.forEach((wall) => {
      allPoints.push({ ...wall.floor_polygon[0] });
      allPoints.push({ ...wall.floor_polygon[1] });
    });

    const uniquePoints: Point[] = [];
    const pointTolerance = 5.0;

    for (const point of allPoints) {
      const isDuplicate = uniquePoints.some(
        (existing) => getDistance(point, existing) <= pointTolerance
      );

      if (!isDuplicate) {
        uniquePoints.push(point);
      }
    }

    if (uniquePoints.length >= 3) {
      const center = {
        x: uniquePoints.reduce((sum, p) => sum + p.x, 0) / uniquePoints.length,
        z: uniquePoints.reduce((sum, p) => sum + p.z, 0) / uniquePoints.length,
      };

      uniquePoints.sort((a, b) => {
        const angleA = Math.atan2(a.z - center.z, a.x - center.x);
        const angleB = Math.atan2(b.z - center.z, b.x - center.x);
        return angleA - angleB;
      });

      return {
        polygon: uniquePoints,
        walls: wallGroup.map((w) => w.id),
      };
    }

    return null;
  };

  const getDistance = (point1: Point, point2: Point): number => {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.z - point2.z, 2)
    );
  };

  const areWallsConnected = (
    wall1: Room,
    wall2: Room,
    tolerance: number
  ): boolean => {
    const wall1Start = wall1.floor_polygon[0];
    const wall1End = wall1.floor_polygon[1];
    const wall2Start = wall2.floor_polygon[0];
    const wall2End = wall2.floor_polygon[1];

    const connectionTolerance = 50.0;

    const connected =
      getDistance(wall1Start, wall2Start) <= connectionTolerance ||
      getDistance(wall1Start, wall2End) <= connectionTolerance ||
      getDistance(wall1End, wall2Start) <= connectionTolerance ||
      getDistance(wall1End, wall2End) <= connectionTolerance;

    return connected;
  };

  const convertWallsToRoom = (
    closedPolygon: { polygon: Point[]; walls: string[] },
    wallGroup: Room[],
    floorPlanData: FloorPlanData,
    setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
    calculateRoomArea: (polygon: Point[]) => number,
    calculateRoomDimensions: (polygon: Point[]) => {
      width: number;
      height: number;
    },
    generateUniqueId: (prefix: string) => string
  ) => {
    const polygon = closedPolygon.polygon;
    const usedWallIds = closedPolygon.walls;

    const area = calculateRoomArea(polygon);
    const dimensions = calculateRoomDimensions(polygon);

    const newRoom: Room = {
      id: generateUniqueId("room"),
      room_type: "",
      area: area,
      height: dimensions.height,
      width: dimensions.width,
      floor_polygon: polygon,
      is_regular: 1,
    };

    setFloorPlanData((prevData: FloorPlanData) => {
      const updatedRooms = prevData.rooms.filter(
        (room: Room) =>
          !(room.room_type === "Wall" && usedWallIds.includes(room.id))
      );

      updatedRooms.push(newRoom);

      const totalArea = calculateTotalArea(updatedRooms, roomRotations);

      const actualRoomCount = updatedRooms.filter(
        (room: Room) => room.room_type !== "Wall" && room.room_type !== "Reference" && room.room_type !== "Boundary"
      ).length;

      let updatedRoomTypes = prevData.room_types ? [...prevData.room_types] : [];
      if (!updatedRoomTypes.includes("SecondRoom")) {
        updatedRoomTypes.push("SecondRoom");
      }

      const updatedData: FloorPlanData = {
        ...prevData,
        rooms: updatedRooms,
        room_count: actualRoomCount,
        room_types: updatedRoomTypes,
        total_area: parseFloat(totalArea.toFixed(2)),
      };

      setTimeout(() => {
        if (setContextFloorPlanData) {
          setContextFloorPlanData(updatedData);
        }
      }, 0);

      return updatedData;
    });

    setHasChanges(true);
  };

  const findRoomNamePosition = (
    transformedPoints: { x: number; y: number }[],
    centroid: { x: number; y: number },
    roomType: string
  ) => {
    if (transformedPoints.length < 3) return centroid;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    transformedPoints.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    const width = maxX - minX;
    const height = maxY - minY;

    const roomNamePadding = 8;

    const isSmallRoom = width < 60 || height < 60;
    const isNarrowRoom = width < height * 0.5 || height < width * 0.5;
    const isWideRoom = width > height * 1.5;

    if (roomType === "SecondRoom" || roomType === "Kitchen") {
      return {
        x: centroid.x,
        y: centroid.y - height * 0.08,
      };
    }

    if (isSmallRoom || isNarrowRoom || isWideRoom) {
      let bestPosition = { ...centroid };

      if (width < height * 0.5) {
        bestPosition.y = centroid.y - height * 0.08;
      }

      if (height < width * 0.5) {
        bestPosition.y = centroid.y - height * 0.08;
      }

      if (width < 40 && height < 40) {
        bestPosition = {
          x: (minX + maxX) / 2,
          y: (minY + maxY) / 2 - roomNamePadding / 3,
        };
      }

      return bestPosition;
    }

    return {
      x: centroid.x,
      y: centroid.y - roomNamePadding / 2,
    };
  };

  const eventHandlers = useEventHandlers(
    dragState,
    svgRef as React.RefObject<SVGSVGElement>,
    scale,
    reverseTransformCoordinates,
    calculateRoomDimensions,
    calculateRoomArea,
    setFloorPlanData,
    setDragState,
    checkAndUpdateOverlaps
  );

  useEffect(() => {
    const updateLeft = () => {
      if (window.innerWidth > 850) {
        setLeftPosition("23%");
      } else {
        setLeftPosition("17.5%");
      }
    };

    updateLeft();
    window.addEventListener("resize", updateLeft);

    return () => window.removeEventListener("resize", updateLeft);
  }, []);

  const getOverlappingRoomNamesHelper = () => {
    return getOverlappingRoomNames(overlappingRooms, getRoomType);
  };

  const rotateAllSelectedRooms = (direction: "left" | "right") => {
    if (selectedRoomIds.length <= 1) return;

    captureStateBeforeChange();
    const newRotations = { ...roomRotations };

    selectedRoomIds.forEach((roomId) => {
      const currentRotation = roomRotations[roomId] || 0;
      const rotationAmount = direction === "right" ? 90 : -90;
      newRotations[roomId] = (currentRotation + rotationAmount) % 360;
    });

    setRoomRotations(newRotations);
    setHasChanges(true);
    checkAndUpdateOverlaps();
  };

  const doesWallCrossRoom = (
    wallStart: Point,
    wallEnd: Point,
    roomPolygon: Point[]
  ): boolean => {
    const touchTolerance = 5.0;
    const touchedEdges = new Set();

    for (let i = 0; i < roomPolygon.length; i++) {
      const edgeStart = roomPolygon[i];
      const edgeEnd = roomPolygon[(i + 1) % roomPolygon.length];

      let edgeTouched = false;

      const startDistToEdge = distancePointToLineSegment(
        wallStart,
        edgeStart,
        edgeEnd
      );
      const endDistToEdge = distancePointToLineSegment(
        wallEnd,
        edgeStart,
        edgeEnd
      );

      if (
        startDistToEdge <= touchTolerance ||
        endDistToEdge <= touchTolerance
      ) {
        edgeTouched = true;
      }

      const intersection = getLineIntersectionPoint(
        wallStart,
        wallEnd,
        edgeStart,
        edgeEnd
      );
      if (
        intersection &&
        isPointOnLineSegment(intersection, edgeStart, edgeEnd)
      ) {
        edgeTouched = true;
      }

      if (edgeTouched) {
        touchedEdges.add(i);
      }
    }
    return touchedEdges.size >= 2;
  };

  const distancePointToLineSegment = (
    point: Point,
    segStart: Point,
    segEnd: Point
  ): number => {
    const A = point.x - segStart.x;
    const B = point.z - segStart.z;
    const C = segEnd.x - segStart.x;
    const D = segEnd.z - segStart.z;

    const dot = A * C + B * D;
    const lenSquared = C * C + D * D;

    if (lenSquared === 0) {
      return Math.sqrt(A * A + B * B);
    }

    let param = dot / lenSquared;
    param = Math.max(0, Math.min(1, param));

    const closestX = segStart.x + param * C;
    const closestZ = segStart.z + param * D;

    return Math.sqrt(
      Math.pow(closestX - point.x, 2) + Math.pow(closestZ - point.z, 2)
    );
  };
  const isPointOnLineSegment = (
    point: Point,
    segStart: Point,
    segEnd: Point
  ): boolean => {
    const tolerance = 0.01;

    const minX = Math.min(segStart.x, segEnd.x) - tolerance;
    const maxX = Math.max(segStart.x, segEnd.x) + tolerance;
    const minZ = Math.min(segStart.z, segEnd.z) - tolerance;
    const maxZ = Math.max(segStart.z, segEnd.z) + tolerance;

    return (
      point.x >= minX && point.x <= maxX && point.z >= minZ && point.z <= maxZ
    );
  };

  const isPointInsidePolygon = (point: Point, polygon: Point[]): boolean => {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const zi = polygon[i].z;
      const xj = polygon[j].x;
      const zj = polygon[j].z;

      if (
        zi > point.z !== zj > point.z &&
        point.x < ((xj - xi) * (point.z - zi)) / (zj - zi) + xi
      ) {
        inside = !inside;
      }
    }

    return inside;
  };

  const doLinesIntersect = (
    p1: Point,
    q1: Point,
    p2: Point,
    q2: Point
  ): boolean => {
    const orientation = (p: Point, q: Point, r: Point): number => {
      const val = (q.z - p.z) * (r.x - q.x) - (q.x - p.x) * (r.z - q.z);
      if (Math.abs(val) < 0.001) return 0;
      return val > 0 ? 1 : 2;
    };

    const onSegment = (p: Point, q: Point, r: Point): boolean => {
      return (
        q.x <= Math.max(p.x, r.x) + 0.001 &&
        q.x >= Math.min(p.x, r.x) - 0.001 &&
        q.z <= Math.max(p.z, r.z) + 0.001 &&
        q.z >= Math.min(p.z, r.z) - 0.001
      );
    };

    const o1 = orientation(p1, q1, p2);
    const o2 = orientation(p1, q1, q2);
    const o3 = orientation(p2, q2, p1);
    const o4 = orientation(p2, q2, q1);

    if (o1 !== o2 && o3 !== o4) return true;

    if (o1 === 0 && onSegment(p1, p2, q1)) return true;
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    return false;
  };

  const getLineIntersectionPoint = (
    p1: Point,
    q1: Point,
    p2: Point,
    q2: Point
  ): Point | null => {
    const denom = (p1.x - q1.x) * (p2.z - q2.z) - (p1.z - q1.z) * (p2.x - q2.x);

    if (Math.abs(denom) < 0.001) return null;

    const t =
      ((p1.x - p2.x) * (p2.z - q2.z) - (p1.z - p2.z) * (p2.x - q2.x)) / denom;
    const u =
      -((p1.x - q1.x) * (p1.z - p2.z) - (p1.z - q1.z) * (p1.x - p2.x)) / denom;

    if (t >= -0.001 && t <= 1.001 && u >= -0.001 && u <= 1.001) {
      return {
        x: p1.x + t * (q1.x - p1.x),
        z: p1.z + t * (q1.z - p1.z),
      };
    }

    return null;
  };

  const divideRoomPolygon = (
    roomPolygon: Point[],
    wallStart: Point,
    wallEnd: Point,
    calculateRoomArea: (polygon: Point[]) => number,
    calculateRoomDimensions: (polygon: Point[]) => {
      width: number;
      height: number;
    },
    generateUniqueId: (prefix: string) => string
  ): Room[] | null => {
    const wallDx = wallEnd.x - wallStart.x;
    const wallDz = wallEnd.z - wallStart.z;
    const wallLength = Math.sqrt(wallDx * wallDx + wallDz * wallDz);

    if (wallLength === 0) return null;

    const wallDirX = wallDx / wallLength;
    const wallDirZ = wallDz / wallLength;

    const intersections: Array<{
      point: Point;
      edgeIndex: number;
      distance: number;
    }> = [];

    const extendedStart = {
      x: wallStart.x - wallDirX * 1000,
      z: wallStart.z - wallDirZ * 1000,
    };
    const extendedEnd = {
      x: wallStart.x + wallDirX * 1000,
      z: wallStart.z + wallDirZ * 1000,
    };

    for (let i = 0; i < roomPolygon.length; i++) {
      const edgeStart = roomPolygon[i];
      const edgeEnd = roomPolygon[(i + 1) % roomPolygon.length];

      const intersection = getLineIntersectionPoint(
        extendedStart,
        extendedEnd,
        edgeStart,
        edgeEnd
      );
      if (
        intersection &&
        isPointOnLineSegment(intersection, edgeStart, edgeEnd)
      ) {
        const distanceX = intersection.x - wallStart.x;
        const distanceZ = intersection.z - wallStart.z;
        const distance = distanceX * wallDirX + distanceZ * wallDirZ;

        intersections.push({
          point: intersection,
          edgeIndex: i,
          distance: distance,
        });
      }
    }

    if (intersections.length < 2) {
      return null;
    }

    intersections.sort((a, b) => a.distance - b.distance);

    let entryIntersection = intersections[0];
    let exitIntersection = intersections[1];

    if (intersections.length > 2) {
      for (let i = 0; i < intersections.length - 1; i++) {
        const int1 = intersections[i];
        const int2 = intersections[i + 1];

        if (int1.distance <= 0 && int2.distance >= 0) {
          entryIntersection = int1;
          exitIntersection = int2;
          break;
        }
      }
    }

    const snappedWallStart = entryIntersection.point;
    const snappedWallEnd = exitIntersection.point;

    const polygon1: Point[] = [];

    polygon1.push({ ...snappedWallStart });

    let currentIndex = (entryIntersection.edgeIndex + 1) % roomPolygon.length;
    while (
      currentIndex !==
      (exitIntersection.edgeIndex + 1) % roomPolygon.length
    ) {
      polygon1.push({ ...roomPolygon[currentIndex] });
      currentIndex = (currentIndex + 1) % roomPolygon.length;
    }

    polygon1.push({ ...snappedWallEnd });

    const polygon2: Point[] = [];

    polygon2.push({ ...snappedWallStart });

    currentIndex = entryIntersection.edgeIndex;
    while (currentIndex !== exitIntersection.edgeIndex) {
      polygon2.push({ ...roomPolygon[currentIndex] });
      currentIndex =
        (currentIndex - 1 + roomPolygon.length) % roomPolygon.length;
    }

    polygon2.push({ ...snappedWallEnd });

    const validRooms: Room[] = [];

    [polygon1, polygon2].forEach((polygon, index) => {
      if (polygon.length >= 3) {
        const area = calculateRoomArea(polygon);

        if (area > 0.1) {
          const dimensions = calculateRoomDimensions(polygon);

          validRooms.push({
            id: generateUniqueId("room"),
            room_type: "",
            area: area,
            height: dimensions.height,
            width: dimensions.width,
            floor_polygon: polygon,
            is_regular: 1,
          });
        }
      }
    });

    return validRooms.length === 2 ? validRooms : null;
  };

  const divideRoomByWall = (
    newWall: Room,
    floorPlanData: FloorPlanData,
    setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
    calculateRoomArea: (polygon: Point[]) => number,
    calculateRoomDimensions: (polygon: Point[]) => {
      width: number;
      height: number;
    },
    generateUniqueId: (prefix: string) => string,
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
    roomRotations: { [key: string]: number },
    setContextFloorPlanData?: React.Dispatch<
      React.SetStateAction<FloorPlanData>
    >
  ): boolean => {
    const wallStart = newWall.floor_polygon[0];
    const wallEnd = newWall.floor_polygon[1];

    const candidateRooms = floorPlanData.rooms.filter((room: Room) => {
      if (room.room_type === "Wall" || room.floor_polygon.length < 3)
        return false;

      const roomRotation = roomRotations[room.id] || 0;
      if (roomRotation !== 0) return false;
      const intersectionCount = countWallRoomIntersections(
        wallStart,
        wallEnd,
        room.floor_polygon
      );
      return intersectionCount >= 2;
    });

    if (candidateRooms.length === 0) return false;

    let roomWasDivided = false;

    const roomToDivide = candidateRooms[0];

    const result = divideRoomWithSnappedWall(
      roomToDivide.floor_polygon,
      wallStart,
      wallEnd,
      calculateRoomArea,
      calculateRoomDimensions,
      generateUniqueId
    );

    if (result && result.dividedRooms.length === 2) {
      setFloorPlanData((prevData: FloorPlanData) => {
        const updatedRooms = prevData.rooms.filter(
          (r: Room) => r.id !== roomToDivide.id && r.id !== newWall.id
        );

        result.dividedRooms.forEach((dividedRoom: Room) => {
          updatedRooms.push(dividedRoom);
        });

        const totalArea = calculateTotalArea(updatedRooms, roomRotations);

        const actualRoomCount = updatedRooms.filter(
          (r: Room) => r.room_type !== "Wall" && r.room_type !== "Reference" && r.room_type !== "Boundary"
        ).length;

        const updatedData = {
          ...prevData,
          rooms: updatedRooms,
          room_count: actualRoomCount,
          total_area: parseFloat(totalArea.toFixed(2)),
        };

        if (setContextFloorPlanData) {
          setTimeout(() => setContextFloorPlanData(updatedData), 0);
        }

        return updatedData;
      });

      setHasChanges(true);
      roomWasDivided = true;
    }

    return roomWasDivided;
  };

  const countWallRoomIntersections = (
    wallStart: Point,
    wallEnd: Point,
    roomPolygon: Point[]
  ): number => {
    let intersectionCount = 0;
    const tolerance = 2.0;

    const wallDx = wallEnd.x - wallStart.x;
    const wallDz = wallEnd.z - wallStart.z;
    const wallLength = Math.sqrt(wallDx * wallDx + wallDz * wallDz);

    if (wallLength === 0) return 0;

    const wallDirX = wallDx / wallLength;
    const wallDirZ = wallDz / wallLength;

    const extendedStart = {
      x: wallStart.x - wallDirX * tolerance,
      z: wallStart.z - wallDirZ * tolerance,
    };
    const extendedEnd = {
      x: wallEnd.x + wallDirX * tolerance,
      z: wallEnd.z + wallDirZ * tolerance,
    };

    for (let i = 0; i < roomPolygon.length; i++) {
      const edgeStart = roomPolygon[i];
      const edgeEnd = roomPolygon[(i + 1) % roomPolygon.length];

      const intersection = getLineIntersectionPoint(
        extendedStart,
        extendedEnd,
        edgeStart,
        edgeEnd
      );

      if (
        intersection &&
        isPointOnLineSegment(intersection, edgeStart, edgeEnd)
      ) {
        intersectionCount++;
      }
    }

    return intersectionCount;
  };

  const divideRoomWithSnappedWall = (
    roomPolygon: Point[],
    wallStart: Point,
    wallEnd: Point,
    calculateRoomArea: (polygon: Point[]) => number,
    calculateRoomDimensions: (polygon: Point[]) => {
      width: number;
      height: number;
    },
    generateUniqueId: (prefix: string) => string
  ): {
    snappedWallStart: Point;
    snappedWallEnd: Point;
    dividedRooms: Room[];
  } | null => {
    const wallDx = wallEnd.x - wallStart.x;
    const wallDz = wallEnd.z - wallStart.z;
    const wallLength = Math.sqrt(wallDx * wallDx + wallDz * wallDz);

    if (wallLength === 0) return null;

    const wallDirX = wallDx / wallLength;
    const wallDirZ = wallDz / wallLength;
    const intersections: Array<{
      point: Point;
      edgeIndex: number;
      distance: number;
    }> = [];

    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    roomPolygon.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    });

    const roomDiagonal = Math.sqrt(
      Math.pow(maxX - minX, 2) + Math.pow(maxZ - minZ, 2)
    );
    const extensionLength = roomDiagonal * 2;

    const extendedStart = {
      x: wallStart.x - wallDirX * extensionLength,
      z: wallStart.z - wallDirZ * extensionLength,
    };
    const extendedEnd = {
      x: wallStart.x + wallDirX * extensionLength,
      z: wallStart.z + wallDirZ * extensionLength,
    };

    const wallCenterX = (wallStart.x + wallEnd.x) / 2;
    const wallCenterZ = (wallStart.z + wallEnd.z) / 2;

    const useWallCenter = wallLength < 10;
    const referenceX = useWallCenter ? wallCenterX : wallStart.x;
    const referenceZ = useWallCenter ? wallCenterZ : wallStart.z;

    for (let i = 0; i < roomPolygon.length; i++) {
      const edgeStart = roomPolygon[i];
      const edgeEnd = roomPolygon[(i + 1) % roomPolygon.length];

      const intersection = getLineIntersectionPoint(
        extendedStart,
        extendedEnd,
        edgeStart,
        edgeEnd
      );
      if (
        intersection &&
        isPointOnLineSegment(intersection, edgeStart, edgeEnd)
      ) {
        const distanceX = intersection.x - referenceX;
        const distanceZ = intersection.z - referenceZ;
        const distance = distanceX * wallDirX + distanceZ * wallDirZ;

        intersections.push({ point: intersection, edgeIndex: i, distance });
      }
    }

    if (intersections.length < 2) return null;

    intersections.sort((a, b) => a.distance - b.distance);

    let entryIntersection: any;
    let exitIntersection: any;

    if (intersections.length === 2) {
      entryIntersection = intersections[0];
      exitIntersection = intersections[1];
    } else if (intersections.length > 2) {
      const wallCenterX = (wallStart.x + wallEnd.x) / 2;
      const wallCenterZ = (wallStart.z + wallEnd.z) / 2;

      let closestToCenter = intersections[0];
      let minDistanceToCenter = Infinity;

      intersections.forEach((intersection) => {
        const distToCenter = Math.sqrt(
          Math.pow(intersection.point.x - wallCenterX, 2) +
          Math.pow(intersection.point.z - wallCenterZ, 2)
        );
        if (distToCenter < minDistanceToCenter) {
          minDistanceToCenter = distToCenter;
          closestToCenter = intersection;
        }
      });

      const centerDistance = closestToCenter.distance;

      let beforeCenter = null;
      let afterCenter = null;

      for (const intersection of intersections) {
        if (intersection.distance < centerDistance) {
          if (!beforeCenter || intersection.distance > beforeCenter.distance) {
            beforeCenter = intersection;
          }
        } else if (intersection.distance > centerDistance) {
          if (!afterCenter || intersection.distance < afterCenter.distance) {
            afterCenter = intersection;
          }
        }
      }

      entryIntersection = beforeCenter || intersections[0];
      exitIntersection = afterCenter || intersections[intersections.length - 1];

      if (entryIntersection === exitIntersection) {
        entryIntersection = intersections[0];
        exitIntersection = intersections[intersections.length - 1];
      }
    } else {
      entryIntersection = intersections[0];
      exitIntersection = intersections[intersections.length - 1];
    }

    const polygon1: Point[] = [];
    const polygon2: Point[] = [];

    polygon1.push({ ...entryIntersection.point });
    let currentIndex = (entryIntersection.edgeIndex + 1) % roomPolygon.length;
    while (
      currentIndex !==
      (exitIntersection.edgeIndex + 1) % roomPolygon.length
    ) {
      polygon1.push({ ...roomPolygon[currentIndex] });
      currentIndex = (currentIndex + 1) % roomPolygon.length;
    }
    polygon1.push({ ...exitIntersection.point });

    polygon2.push({ ...entryIntersection.point });
    currentIndex = entryIntersection.edgeIndex;
    while (currentIndex !== exitIntersection.edgeIndex) {
      polygon2.push({ ...roomPolygon[currentIndex] });
      currentIndex =
        (currentIndex - 1 + roomPolygon.length) % roomPolygon.length;
    }
    polygon2.push({ ...exitIntersection.point });

    const dividedRooms: Room[] = [];
    [polygon1, polygon2].forEach((polygon) => {
      if (polygon.length >= 3) {
        const area = calculateRoomArea(polygon);
        if (area > 0.1) {
          const dimensions = calculateRoomDimensions(polygon);
          dividedRooms.push({
            id: generateUniqueId("room"),
            room_type: "",
            area,
            height: dimensions.height,
            width: dimensions.width,
            floor_polygon: polygon,
            is_regular: 1,
          });
        }
      }
    });

    return dividedRooms.length === 2
      ? {
        snappedWallStart: entryIntersection.point,
        snappedWallEnd: exitIntersection.point,
        dividedRooms,
      }
      : null;
  };

  const straightenWallIfNeeded = (
    start: Point,
    end: Point,
    toleranceAngle: number = 10
  ) => {
    const dx = end.x - start.x;
    const dz = end.z - start.z;

    const angle = Math.atan2(dz, dx) * (180 / Math.PI);
    const normalizedAngle = ((angle % 180) + 180) % 180;

    if (
      normalizedAngle <= toleranceAngle ||
      normalizedAngle >= 180 - toleranceAngle
    ) {
      return {
        start: start,
        end: { x: end.x, z: start.z },
      };
    }

    if (Math.abs(normalizedAngle - 90) <= toleranceAngle) {
      return {
        start: start,
        end: { x: start.x, z: end.z },
      };
    }

    if (Math.abs(normalizedAngle - 45) <= toleranceAngle) {
      const length = Math.sqrt(dx * dx + dz * dz);
      const diagLength = length / Math.sqrt(2);
      return {
        start: start,
        end: {
          x: start.x + (dx > 0 ? diagLength : -diagLength),
          z: start.z + (dz > 0 ? diagLength : -diagLength),
        },
      };
    }

    if (Math.abs(normalizedAngle - 135) <= toleranceAngle) {
      const length = Math.sqrt(dx * dx + dz * dz);
      const diagLength = length / Math.sqrt(2);
      return {
        start: start,
        end: {
          x: start.x + (dx > 0 ? -diagLength : diagLength),
          z: start.z + (dz > 0 ? diagLength : -diagLength),
        },
      };
    }

    return { start, end };
  };

  const findBestRoomToDivide = (
    wallStart: Point,
    wallEnd: Point,
    floorPlanData: FloorPlanData,
    roomRotations: { [key: string]: number }
  ): Room | null => {
    const candidateRooms = floorPlanData.rooms.filter((room: Room) => {
      if (room.room_type === "Wall" || room.floor_polygon.length < 3)
        return false;

      const roomRotation = roomRotations[room.id] || 0;
      if (roomRotation !== 0) return false;

      const intersectionCount = countWallRoomIntersections(
        wallStart,
        wallEnd,
        room.floor_polygon
      );

      return intersectionCount >= 2;
    });

    if (candidateRooms.length === 0) return null;

    if (candidateRooms.length > 1) {
      const wallMidpoint = {
        x: (wallStart.x + wallEnd.x) / 2,
        z: (wallStart.z + wallEnd.z) / 2,
      };

      let bestRoom = candidateRooms[0];
      let minDistanceToCenter = Infinity;

      for (const room of candidateRooms) {
        const roomCenter = {
          x:
            room.floor_polygon.reduce((sum: number, p: Point) => sum + p.x, 0) /
            room.floor_polygon.length,
          z:
            room.floor_polygon.reduce((sum: number, p: Point) => sum + p.z, 0) /
            room.floor_polygon.length,
        };

        const distance = Math.sqrt(
          Math.pow(wallMidpoint.x - roomCenter.x, 2) +
          Math.pow(wallMidpoint.z - roomCenter.z, 2)
        );

        if (distance < minDistanceToCenter) {
          minDistanceToCenter = distance;
          bestRoom = room;
        }
      }

      return bestRoom;
    }

    return candidateRooms[0];
  };

  const handleWallCreated = (wallPoints: Point[]) => {
    captureStateBeforeChange();

    const start = wallPoints[0];
    const end = wallPoints[wallPoints.length - 1];

    const straightened = straightenWallIfNeeded(start, end, 15);
    const straightenedStart = straightened.start;
    const straightenedEnd = straightened.end;

    const simpleLine = [straightenedStart, straightenedEnd];

    const newWall: Room = {
      id: generateUniqueId("wall"),
      room_type: "Wall",
      area: 0,
      height: 0,
      width: drawingWallWidth,
      floor_polygon: simpleLine,
    };

    const roomDivided = divideRoomByWall(
      newWall,
      floorPlanData,
      setFloorPlanData,
      calculateRoomArea,
      calculateRoomDimensions,
      generateUniqueId,
      setHasChanges,
      roomRotations,
      setContextFloorPlanData
    );

    if (!roomDivided) {
      setFloorPlanData((prevData) => {
        const updatedRooms = [...prevData.rooms, newWall];
        const actualRoomCount = updatedRooms.filter(
          (room) => room.room_type !== "Wall" && room.room_type !== "Reference" && room.room_type !== "Boundary"
        ).length;

        const updatedData = {
          ...prevData,
          rooms: updatedRooms,
          room_count: actualRoomCount,
          total_area: prevData.total_area,
        };

        return updatedData;
      });

      setHasChanges(true);
      checkAndUpdateOverlaps();

      setTimeout(() => {
        setFloorPlanData((currentData) => {
          const wallRooms = currentData.rooms.filter(
            (room: Room) => room.room_type === "Wall"
          );

          if (wallRooms.length >= 3) {
            const connectedGroups = findConnectedWallGroups(wallRooms);

            connectedGroups.forEach((group, index) => {
              if (group.length >= 3) {
                const closedPolygon = attemptToFormClosedPolygon(group);
                if (closedPolygon) {
                  const polygon = closedPolygon.polygon;
                  const usedWallIds = closedPolygon.walls;

                  const area = calculateRoomArea(polygon);
                  const dimensions = calculateRoomDimensions(polygon);

                  const newRoom: Room = {
                    id: generateUniqueId("room"),
                    room_type: "",
                    area: area,
                    height: dimensions.height,
                    width: dimensions.width,
                    floor_polygon: polygon,
                    is_regular: 1,
                  };

                  const filteredRooms = currentData.rooms.filter(
                    (room: Room) =>
                      !(
                        room.room_type === "Wall" &&
                        usedWallIds.includes(room.id)
                      )
                  );

                  filteredRooms.push(newRoom);

                  const totalArea = filteredRooms.reduce(
                    (sum: number, room: Room) => {
                      if (room.room_type !== "Wall") {
                        return sum + room.area;
                      }
                      return sum;
                    },
                    0
                  );

                  const actualRoomCount = filteredRooms.filter(
                    (room: Room) => room.room_type !== "Wall" && room.room_type !== "Reference" && room.room_type !== "Boundary"
                  ).length;

                  let updatedRoomTypes = [...currentData.room_types];
                  if (!updatedRoomTypes.includes("SecondRoom")) {
                    updatedRoomTypes.push("SecondRoom");
                  }

                  const finalData = {
                    ...currentData,
                    rooms: filteredRooms,
                    room_count: actualRoomCount,
                    room_types: updatedRoomTypes,
                    total_area: parseFloat(totalArea.toFixed(2)),
                  };

                  setTimeout(() => {
                    if (setContextFloorPlanData) {
                      setContextFloorPlanData(finalData);
                    }
                  }, 0);

                  setHasChanges(true);
                  return finalData;
                }
              }
            });
          }

          return currentData;
        });
      }, 150);
    }
  };

  const checkWallModificationAndFormRooms = () => {
    //////////////////////////////////////
    if (isModifyingWall) {
      return;
    }
    setTimeout(() => {
      setFloorPlanData((currentData) => {
        let hasChanges = false;
        let updatedData = { ...currentData };

        const wallRooms = currentData.rooms.filter(
          (room: Room) => room.room_type === "Wall"
        );

        wallRooms.forEach((wall) => {
          if (wall.floor_polygon.length === 2) {
            const wallStart = wall.floor_polygon[0];
            const wallEnd = wall.floor_polygon[1];

            const roomsToCheck = currentData.rooms.filter((room: Room) => {
              if (room.room_type === "Wall" || room.floor_polygon.length < 3)
                return false;
              const roomRotation = roomRotations[room.id] || 0;
              if (roomRotation !== 0) return false;

              const intersectionCount = countWallRoomIntersections(
                wallStart,
                wallEnd,
                room.floor_polygon
              );
              return intersectionCount >= 2;
            });

            if (roomsToCheck.length > 0) {
              const roomToDivide = roomsToCheck[0];

              const result = divideRoomWithSnappedWall(
                roomToDivide.floor_polygon,
                wallStart,
                wallEnd,
                calculateRoomArea,
                calculateRoomDimensions,
                generateUniqueId
              );

              if (result && result.dividedRooms.length === 2) {
                updatedData.rooms = updatedData.rooms.filter(
                  (r: Room) => r.id !== roomToDivide.id && r.id !== wall.id
                );

                updatedData.rooms.push(...result.dividedRooms);

                hasChanges = true;
              }
            }
          }
        });

        if (!hasChanges) {
          const remainingWallRooms = updatedData.rooms.filter(
            (room: Room) => room.room_type === "Wall"
          );

          if (remainingWallRooms.length >= 3) {
            const connectedGroups = findConnectedWallGroups(remainingWallRooms);

            connectedGroups.forEach((group) => {
              if (group.length >= 3) {
                const closedPolygon = attemptToFormClosedPolygon(group);
                if (closedPolygon) {
                  const polygon = closedPolygon.polygon;
                  const usedWallIds = closedPolygon.walls;
                  const area = calculateRoomArea(polygon);
                  const dimensions = calculateRoomDimensions(polygon);

                  const newRoom: Room = {
                    id: generateUniqueId("room"),
                    room_type: "",
                    area: area,
                    height: dimensions.height,
                    width: dimensions.width,
                    floor_polygon: polygon,
                    is_regular: 1,
                  };

                  const filteredRooms = updatedData.rooms.filter(
                    (room: Room) =>
                      !(
                        room.room_type === "Wall" &&
                        usedWallIds.includes(room.id)
                      )
                  );
                  filteredRooms.push(newRoom);

                  const totalArea = filteredRooms.reduce(
                    (sum: number, room: Room) => {
                      if (room.room_type !== "Wall") return sum + room.area;
                      return sum;
                    },
                    0
                  );

                  const actualRoomCount = filteredRooms.filter(
                    (room: Room) => room.room_type !== "Wall" && room.room_type !== "Reference" && room.room_type !== "Boundary"
                  ).length;

                  let updatedRoomTypes = [...updatedData.room_types];
                  if (!updatedRoomTypes.includes("SecondRoom")) {
                    updatedRoomTypes.push("SecondRoom");
                  }

                  updatedData = {
                    ...updatedData,
                    rooms: filteredRooms,
                    room_count: actualRoomCount,
                    room_types: updatedRoomTypes,
                    total_area: parseFloat(totalArea.toFixed(2)),
                  };

                  hasChanges = true;
                }
              }
            });
          }
        }

        if (hasChanges) {
          setTimeout(() => {
            if (setContextFloorPlanData) {
              setContextFloorPlanData(updatedData);
            }
          }, 0);
          setHasChanges(true);
        }

        return updatedData;
      });
    }, 150);
  };

  const handleRoomCreated = (roomPolygon: Point[]) => {
    captureStateBeforeChange();

    const dimensions = calculateRoomDimensions(roomPolygon);
    const area = calculateRoomArea(roomPolygon);

    const newRoom: Room = {
      id: generateUniqueId("room"),
      room_type: "",
      area: area,
      height: dimensions.height,
      width: dimensions.width,
      floor_polygon: roomPolygon,
      is_regular: 1,
    };

    setFloorPlanData((prevData) => {
      const updatedRooms = [...prevData.rooms, newRoom];
      const totalArea = calculateTotalArea(updatedRooms, roomRotations);

      const actualRoomCount = updatedRooms.filter(
        (room) => room.room_type !== "Wall" && room.room_type !== "Reference" && room.room_type !== "Boundary"
      ).length;

      let updatedRoomTypes = prevData.room_types ? [...prevData.room_types] : [];
      if (!updatedRoomTypes.includes("SecondRoom")) {
        updatedRoomTypes.push("SecondRoom");
      }

      return {
        ...prevData,
        rooms: updatedRooms,
        room_count: actualRoomCount,
        room_types: updatedRoomTypes,
        total_area: parseFloat(totalArea.toFixed(2)),
      };
    });

    setHasChanges(true);
    checkAndUpdateOverlaps();
  };

  const handleBoundaryCreated = (boundaryPolygon: Point[]) => {
    captureStateBeforeChange();

    const dimensions = calculateRoomDimensions(boundaryPolygon);
    const area = calculateRoomArea(boundaryPolygon);

    const newBoundary: Room = {
      id: generateUniqueId("boundary"),
      room_type: "Boundary",
      area: area,
      height: dimensions.height,
      width: dimensions.width,
      floor_polygon: boundaryPolygon,
      is_regular: 1,
      isBoundary: true,
    };

    setFloorPlanData((prevData) => {
      const updatedRooms = [...prevData.rooms, newBoundary];
      const nonBoundaryRooms = updatedRooms.filter(room =>
        !room.isBoundary &&
        room.room_type !== "Wall" &&
        room.room_type !== "Reference" &&
        room.room_type !== "Boundary"
      );
      const totalArea = calculateTotalArea(updatedRooms, roomRotations);

      return {
        ...prevData,
        rooms: updatedRooms,
        room_count: nonBoundaryRooms.length,
        total_area: parseFloat(totalArea.toFixed(2)),
      };
    });

    setHasChanges(true);
    checkAndUpdateOverlaps();
  };

  const renderAllWallSegments = () => {
    if (!showIndividualWalls) return null;

    const allWallSegments: Array<{
      wallId: string;
      roomId: string;
      start: { x: number; y: number };
      end: { x: number; y: number };
      isWallSelected: boolean;
      isRoomSelected: boolean;
      wallWidth: number;
      isExternal: boolean;
      segmentIndex: number;
      roomRotation: number;
      roomCentroid: { x: number; y: number };
    }> = [];

    floorPlanData.rooms.forEach((room) => {
      if (room.room_type === "Wall") return;

      const transformedPoints = room.floor_polygon.map(transformCoordinates);
      if (transformedPoints.length < 3) return;

      const isRoomSelected = selectedRoomIds.includes(room.id);
      const roomCentroid = {
        x:
          transformedPoints.reduce((sum, p) => sum + p.x, 0) /
          transformedPoints.length,
        y:
          transformedPoints.reduce((sum, p) => sum + p.y, 0) /
          transformedPoints.length,
      };
      const roomRotation = roomRotations[room.id] || 0;

      const rotatedPoints = transformedPoints.map((point) => {
        if (roomRotation === 0) return point;

        const radians = (roomRotation * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const dx = point.x - roomCentroid.x;
        const dy = point.y - roomCentroid.y;

        return {
          x: roomCentroid.x + dx * cos - dy * sin,
          y: roomCentroid.y + dx * sin + dy * cos,
        };
      });

      for (let i = 0; i < rotatedPoints.length; i++) {
        const start = rotatedPoints[i];
        const end = rotatedPoints[(i + 1) % rotatedPoints.length];
        const wallId = `${room.id}-wall-${i}`;
        const isWallSelected = selectedRoomIds.includes(wallId);
        const isExternal = isExternalWallSegment(
          room.id,
          i,
          floorPlanData,
          roomRotations
        );
        const baseWidth = wallWidths[wallId] || 4;
        const finalWidth = isExternal ? baseWidth + 3 : baseWidth;

        allWallSegments.push({
          wallId,
          roomId: room.id,
          start,
          end,
          isWallSelected,
          isRoomSelected,
          wallWidth: finalWidth,
          isExternal,
          segmentIndex: i,
          roomRotation,
          roomCentroid,
        });
      }
    });

    const wallsByRoom = new Map<string, typeof allWallSegments>();
    allWallSegments.forEach((wall) => {
      if (!wallsByRoom.has(wall.roomId)) {
        wallsByRoom.set(wall.roomId, []);
      }
      wallsByRoom.get(wall.roomId)!.push(wall);
    });

    const roomWallPolygons = new Map<string, React.ReactElement[]>();

    wallsByRoom.forEach((roomWalls, roomId) => {
      const sortedWalls = roomWalls.sort(
        (a, b) => a.segmentIndex - b.segmentIndex
      );

      const miteredCorners = calculateMiteredCorners(sortedWalls);

      const wallElements = sortedWalls.map((wall, index) => {
        const { wallId, isWallSelected, isRoomSelected, wallWidth } = wall;

        const corners = miteredCorners[index];
        if (!corners) return null;

        const polygonPoints = `${corners.topStart.x},${corners.topStart.y} ${corners.topEnd.x},${corners.topEnd.y} ${corners.bottomEnd.x},${corners.bottomEnd.y} ${corners.bottomStart.x},${corners.bottomStart.y}`;

        return (
          <g key={wallId}>
            {isWallSelected && (
              <polygon
                points={polygonPoints}
                fill="#2196F3"
                fillOpacity="0.3"
                style={{ pointerEvents: "none" }}
              />
            )}

            <polygon
              points={polygonPoints}
              fill="black"
              filter={isWallSelected ? "drop-shadow(0 0 6px #2196F3)" : "none"}
              style={{
                cursor: "pointer",
                pointerEvents: isRoomSelected ? "none" : "auto",
              }}
              onClick={(e) => {
                if (viewOnly) {
                  e.stopPropagation();
                  return;
                }
                e.stopPropagation();
                e.preventDefault();

                if (!isRoomSelected) {
                  const isMultiSelect = e.ctrlKey || e.metaKey;
                  if (isMultiSelect) {
                    setSelectedRoomIds((prev) =>
                      prev.includes(wallId)
                        ? prev.filter((id) => id !== wallId)
                        : [...prev, wallId]
                    );
                  } else {
                    setSelectedRoomIds([wallId]);
                  }
                }
              }}
            />
          </g>
        );
      });

      roomWallPolygons.set(
        roomId,
        wallElements.filter(Boolean) as React.ReactElement[]
      );
    });

    const allWalls: React.ReactElement[] = [];
    roomWallPolygons.forEach((walls, roomId) => {
      allWalls.push(...walls.map((wall, index) =>
        React.cloneElement(wall, { key: `${roomId}-wall-segment-${index}` })
      ));
    });

    return <g key="all-wall-segments">{allWalls}</g>;
  };

  function calculateMiteredCorners(
    walls: Array<{
      start: { x: number; y: number };
      end: { x: number; y: number };
      wallWidth: number;
    }>
  ) {
    const corners = [];

    for (let i = 0; i < walls.length; i++) {
      const currentWall = walls[i];
      const prevWall = walls[i === 0 ? walls.length - 1 : i - 1];
      const nextWall = walls[(i + 1) % walls.length];

      const { start, end, wallWidth } = currentWall;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) {
        corners.push(null);
        continue;
      }

      const dirX = dx / length;
      const dirY = dy / length;
      const perpX = -dirY;
      const perpY = dirX;
      const halfWidth = wallWidth / 2;

      let topStart = {
        x: start.x + perpX * halfWidth,
        y: start.y + perpY * halfWidth,
      };
      let topEnd = {
        x: end.x + perpX * halfWidth,
        y: end.y + perpY * halfWidth,
      };
      let bottomStart = {
        x: start.x - perpX * halfWidth,
        y: start.y - perpY * halfWidth,
      };
      let bottomEnd = {
        x: end.x - perpX * halfWidth,
        y: end.y - perpY * halfWidth,
      };

      if (prevWall) {
        const prevDx = prevWall.end.x - prevWall.start.x;
        const prevDy = prevWall.end.y - prevWall.start.y;
        const prevLength = Math.sqrt(prevDx * prevDx + prevDy * prevDy);

        if (prevLength > 0) {
          const prevDirX = prevDx / prevLength;
          const prevDirY = prevDy / prevLength;
          const prevPerpX = -prevDirY;
          const prevPerpY = prevDirX;
          const prevHalfWidth = prevWall.wallWidth / 2;

          const topIntersection = getLineIntersection(
            {
              x: prevWall.start.x + prevPerpX * prevHalfWidth,
              y: prevWall.start.y + prevPerpY * prevHalfWidth,
            },
            {
              x: prevWall.end.x + prevPerpX * prevHalfWidth,
              y: prevWall.end.y + prevPerpY * prevHalfWidth,
            },
            topStart,
            topEnd
          );

          const bottomIntersection = getLineIntersection(
            {
              x: prevWall.start.x - prevPerpX * prevHalfWidth,
              y: prevWall.start.y - prevPerpY * prevHalfWidth,
            },
            {
              x: prevWall.end.x - prevPerpX * prevHalfWidth,
              y: prevWall.end.y - prevPerpY * prevHalfWidth,
            },
            bottomStart,
            bottomEnd
          );

          if (topIntersection) topStart = topIntersection;
          if (bottomIntersection) bottomStart = bottomIntersection;
        }
      }

      if (nextWall) {
        const nextDx = nextWall.end.x - nextWall.start.x;
        const nextDy = nextWall.end.y - nextWall.start.y;
        const nextLength = Math.sqrt(nextDx * nextDx + nextDy * nextDy);

        if (nextLength > 0) {
          const nextDirX = nextDx / nextLength;
          const nextDirY = nextDy / nextLength;
          const nextPerpX = -nextDirY;
          const nextPerpY = nextDirX;
          const nextHalfWidth = nextWall.wallWidth / 2;

          const topIntersection = getLineIntersection(
            topStart,
            topEnd,
            {
              x: nextWall.start.x + nextPerpX * nextHalfWidth,
              y: nextWall.start.y + nextPerpY * nextHalfWidth,
            },
            {
              x: nextWall.end.x + nextPerpX * nextHalfWidth,
              y: nextWall.end.y + nextPerpY * nextHalfWidth,
            }
          );

          const bottomIntersection = getLineIntersection(
            bottomStart,
            bottomEnd,
            {
              x: nextWall.start.x - nextPerpX * nextHalfWidth,
              y: nextWall.start.y - nextPerpY * nextHalfWidth,
            },
            {
              x: nextWall.end.x - nextPerpX * nextHalfWidth,
              y: nextWall.end.y - nextPerpY * nextHalfWidth,
            }
          );

          if (topIntersection) topEnd = topIntersection;
          if (bottomIntersection) bottomEnd = bottomIntersection;
        }
      }

      corners.push({
        topStart,
        topEnd,
        bottomStart,
        bottomEnd,
      });
    }

    return corners;
  }

  function getLineIntersection(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number }
  ) {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);

    if (Math.abs(denom) < 0.0001) return null;

    const t =
      ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;

    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    };
  }

  const renderRoomWalls = (room: any) => {
    return null;
  };

  const getRoomColor = (roomType: string) => {
    if (roomType === "Wall") {
      return "black";
    }

    const baseColors = "#D0D0D0";

    switch (options.colorScheme) {
      case "monochrome":
        return "#B5DBFF";

      case "pastel":
        const lightenColor = (color: string) => {
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);

          const mixAmount = 0.4;
          const newR = Math.floor(r + (255 - r) * mixAmount);
          const newG = Math.floor(g + (255 - g) * mixAmount);
          const newB = Math.floor(b + (255 - b) * mixAmount);

          return `#${newR.toString(16).padStart(2, "0")}${newG
            .toString(16)
            .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
        };
        return lightenColor(baseColors);

      case "contrast":
        // Load existing maps from localStorage if present
        let contrastMap: { [key: string]: string } = JSON.parse(localStorage.getItem("contrastMap") || "{}");
        let moreColors: string[] = JSON.parse(localStorage.getItem("moreColors") || JSON.stringify([
          "#F7C8E0", "#C5E8E7", "#FFD6A5", "#BDE0FE", "#C8F7C5", "#EAD7F7", "#FFF5BA",
          "#FDC5F5", "#C9F5E9", "#F7D9C4", "#C4E3F7", "#F7EAC8", "#E2C5F7", "#BFFCC6",
          "#FFCBC1", "#C6F0FC", "#F5CFEA", "#FCE2CE", "#D5F6CE", "#D8C9FC", "#F0E4A8",
          "#C1E1DC", "#E8C6FF", "#FFD7D0", "#C6F7F3", "#FAE1B5", "#E4D1F9", "#BFE1B0",
          "#FCD4B2", "#D2E0FB", "#EFC6C4", "#B9F8F4", "#FDE6D9", "#E6F0BD", "#D3E8F8"
        ]));

        // Initialize default colors if they aren't already stored
        const defaultContrastMap: { [key: string]: string } = {
          LivingRoom: "#FFBDB9",
          Bathroom: "#A0D0F0",
          MasterRoom: "#FFDCC5",
          Kitchen: "#E2CCE2",
          SecondRoom: "#F9DD7D",
          ChildRoom: "#DFBDFF",
          DiningRoom: "#BADEBC",
          Balcony: "#C2E5E2",
          PoojaRoom: "#CDE6F9",
          Wall: "#333333",
        };

        // Merge defaults (without overwriting saved values)
        contrastMap = { ...defaultContrastMap, ...contrastMap };

        // Assign new color if needed
        if (!contrastMap[roomType]) {
          const color = moreColors.pop() || "#000000";
          contrastMap[roomType] = color;
          // Persist both mappings and remaining colors
          localStorage.setItem("contrastMap", JSON.stringify(contrastMap));
          localStorage.setItem("moreColors", JSON.stringify(moreColors));
        }

        return contrastMap[roomType] || "#E8E8E8";

      default:
        return baseColors;
    }
  };

  const sortedRooms = useMemo(() => {
    return [...floorPlanData.rooms]
      .filter(room => room.room_type !== "Reference")
      .sort((a, b) => {
        const aSelected = selectedRoomIds.includes(a.id);
        const bSelected = selectedRoomIds.includes(b.id);
        const aOverlapping = isRoomOverlapping(a.id, overlappingRooms);
        const bOverlapping = isRoomOverlapping(b.id, overlappingRooms);
        const aLastModified = a.id === lastModifiedRoomId;
        const bLastModified = b.id === lastModifiedRoomId;

        if (a.isBoundary && !b.isBoundary) return -1;
        if (!a.isBoundary && b.isBoundary) return 1;

        if (aLastModified && !bLastModified) return 1;
        if (!aLastModified && bLastModified) return -1;

        // CHANGED: Selected rooms render FIRST (at bottom), not last
        if (aSelected && !bSelected) return -1;  // ← CHANGED from return 1
        if (!aSelected && bSelected) return 1;   // ← CHANGED from return -1

        if (aOverlapping && !bOverlapping) return 1;
        if (!aOverlapping && bOverlapping) return -1;

        if (a.room_type === "Wall" && b.room_type !== "Wall") return 1;
        if (a.room_type !== "Wall" && b.room_type === "Wall") return -1;

        return 0;
      });
  }, [
    floorPlanData.rooms,
    selectedRoomIds,
    overlappingRooms,
    lastModifiedRoomId,
  ]);

  const labelStyles = `
  .floor-plan-label.selected-label {
    cursor: move;
  }
  
  .floor-plan-label:not(.selected-label) {
    cursor: pointer;
  }
  
  .floor-plan-label.dragging {
    opacity: 0.7;
  }
`;

  return (
    <div className={`generated-container`} ref={parentRef}>
      {renderOverlapAlert({
        overlappingRooms,
        getOverlappingRoomNames: getOverlappingRoomNamesHelper,
      })}

      <div>
        <style>{floorPlanStyles}</style>
        <style>{wallStyles}</style>
        <style>{labelStyles}</style>

        <div
          ref={floorPlanRef}
          className="floor-plan-container"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: isMobile
              ? "translate(-50%, -50%)"
              : "translate(-50%, -50%)",
            width: `${contentWidth * scale}px`,
            height: `${contentHeight * scale}px`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onMouseDown={(e) => {
            if (document.body.classList.contains("drag-completed")) {
              e.stopPropagation();
              e.preventDefault();
              return;
            }
          }}
        >
          {options.showMeasurements && floorPlanData.total_area > 0 && (
            <span
              style={{
                position: "absolute",
                top:
                  transformCoordinates({ x: bounds.minX, z: bounds.minZ }).y - 50,
                left: "50%",
                transform: "translateX(-50%)",
                textAlign: "center",
                marginBottom: "-25px",
                color: "#000",
                fontSize: "small",
                width: "100%",
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                pointerEvents: "none",
              }}
              className="always-black-text"
            >
              <span
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  padding: "5px",
                }}
              >
                <b>Total Area:</b> {formatImperialArea(floorPlanData.total_area, unitSystem)}
                &nbsp;|&nbsp; <b>Total Rooms:</b> {floorPlanData.room_count}
              </span>
            </span>
          )}

          <svg
            width="100%"
            height="100%"
            ref={svgRef}
            style={{
              touchAction: "none",

              backgroundColor: "transparent",
              transition: "background-color 0.2s ease",
            }}
            onClick={(e) => {
              // Deselect room on any click (will be stopped by rooms/objects if they're clicked)
              if (selectedRoomId || selectedRoomIds.length > 0) {
                setSelectedRoomId(null);
                setSelectedRoomIds([]);
                if (setContextSelectedRoomIds) {
                  setContextSelectedRoomIds([]);
                }
              }
            }}
          >
            <g
              transform={`rotate(${rotation}, ${(contentWidth * scale) / 2}, ${(contentHeight * scale) / 2
                })`}
            >
              <defs>
                <marker
                  id="arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="5"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 0 0 L 10 5 L 0 10 Z" fill={"black"} />
                </marker>

                <marker
                  id="arrow1"
                  markerWidth="10"
                  markerHeight="10"
                  refX="5"
                  refY="5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 10 0 L 0 5 L 10 10 Z" fill={"black"} />
                </marker>

                <marker
                  id="dimensionArrowStart"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 5 0 L 0 3 L 5 6 Z" fill="#000" />
                </marker>

                <marker
                  id="dimensionArrowEnd"
                  markerWidth="6"
                  markerHeight="6"
                  refX="1"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M 1 0 L 6 3 L 1 6 Z" fill="#000" />
                </marker>
              </defs>

              {/* 
            {coordinateSystem}
            */}


              {options.showMeasurements && floorPlanData.total_area > 0 && (
                <>
                  <line
                    x1={
                      transformCoordinates({
                        x: bounds.minX - 10,
                        z: bounds.minZ,
                      }).x
                    }
                    y1={
                      transformCoordinates({ x: bounds.minX, z: bounds.minZ })
                        .y + 2
                    }
                    x2={
                      transformCoordinates({
                        x: bounds.minX - 10,
                        z: bounds.maxZ,
                      }).x
                    }
                    y2={
                      transformCoordinates({ x: bounds.minX, z: bounds.maxZ })
                        .y - 2
                    }
                    stroke={"black"}
                    strokeWidth="1"
                    markerStart="url(#arrow1)"
                    markerEnd="url(#arrow)"
                  />
                  <text
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      MozUserSelect: "none",
                      msUserSelect: "none",
                    }}
                    x={
                      transformCoordinates({
                        x: bounds.minX - 10,
                        z: (bounds.minZ + bounds.maxZ) / 2,
                      }).x
                    }
                    y={
                      transformCoordinates({
                        x: bounds.minX,
                        z: (bounds.minZ + bounds.maxZ) / 2,
                      }).y
                    }
                    fontSize="11"
                    fill={"black"}
                    textAnchor="middle"
                    transform={`
        rotate(
          -90,
          ${transformCoordinates({
                      x: bounds.minX - 12,
                      z: (bounds.minZ + bounds.maxZ) / 2,
                    }).x
                      },
          ${transformCoordinates({
                        x: bounds.minX - 12,
                        z: (bounds.minZ + bounds.maxZ) / 2,
                      }).y
                      }
        )
      `}
                  >
                    {formatImperialLength(tlength / 10, unitSystem)}
                  </text>

                  <line
                    x1={
                      transformCoordinates({
                        x: bounds.minX,
                        z: bounds.maxZ + 10,
                      }).x + 3
                    }
                    y1={
                      transformCoordinates({
                        x: bounds.minX,
                        z: bounds.maxZ + 10,
                      }).y
                    }
                    x2={
                      transformCoordinates({
                        x: bounds.maxX,
                        z: bounds.maxZ + 10,
                      }).x - 2
                    }
                    y2={
                      transformCoordinates({
                        x: bounds.maxX,
                        z: bounds.maxZ + 10,
                      }).y
                    }
                    stroke="black"
                    strokeWidth="1"
                    markerStart="url(#arrow1)"
                    markerEnd="url(#arrow)"
                  />
                  <text
                    style={{
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      MozUserSelect: "none",
                      msUserSelect: "none",
                    }}
                    x={
                      transformCoordinates({
                        x: (bounds.minX + bounds.maxX) / 2,
                        z: bounds.maxZ + 20,
                      }).x
                    }
                    y={
                      transformCoordinates({
                        x: (bounds.minX + bounds.maxX) / 2,
                        z: bounds.maxZ + 16,
                      }).y
                    }
                    fontSize="11"
                    fill="black"
                    textAnchor="middle"
                  >
                    {formatImperialLength(twidth / 10, unitSystem)}
                  </text>
                </>
              )}

              {sortedRooms.map((room) => {
                const transformedPoints =
                  room.floor_polygon.map(transformCoordinates);

                if (
                  room.room_type === "Wall" &&
                  room.floor_polygon.length === 2
                ) {
                  const startPoint = transformedPoints[0];
                  const endPoint = transformedPoints[1];
                  const isSelected = selectedRoomIds.includes(room.id);
                  const midpoint = {
                    x: (startPoint.x + endPoint.x) / 2,
                    y: (startPoint.y + endPoint.y) / 2,
                  };

                  const wallWidth = wallWidths[room.id] || room.width || 4;

                  const dx = endPoint.x - startPoint.x;
                  const dy = endPoint.y - startPoint.y;
                  const length = Math.sqrt(dx * dx + dy * dy);

                  if (length === 0) return null;

                  const perpX = -dy / length;
                  const perpY = dx / length;
                  const halfWidth = wallWidth / 2;

                  const topStart = {
                    x: startPoint.x + perpX * halfWidth,
                    y: startPoint.y + perpY * halfWidth,
                  };
                  const topEnd = {
                    x: endPoint.x + perpX * halfWidth,
                    y: endPoint.y + perpY * halfWidth,
                  };
                  const bottomStart = {
                    x: startPoint.x - perpX * halfWidth,
                    y: startPoint.y - perpY * halfWidth,
                  };
                  const bottomEnd = {
                    x: endPoint.x - perpX * halfWidth,
                    y: endPoint.y - perpY * halfWidth,
                  };

                  const polygonPoints = `${topStart.x},${topStart.y} ${topEnd.x},${topEnd.y} ${bottomEnd.x},${bottomEnd.y} ${bottomStart.x},${bottomStart.y}`;

                  return (
                    <g
                      key={room.id}
                      transform={`rotate(${roomRotations[room.id] || 0}, ${midpoint.x
                        }, ${midpoint.y})`}
                    >
                      {isSelected && (
                        <polygon
                          points={polygonPoints}
                          fill="none"
                          stroke="#2196F3"
                          strokeWidth="3"
                          strokeOpacity="0.5"
                          style={{ pointerEvents: "none" }}
                        />
                      )}

                      <polygon
                        id={room.id}
                        className={`wall-polygon ${isSelected ? "selected-wall" : ""
                          }`}
                        points={polygonPoints}
                        fill="black"
                        stroke="none"
                        onClick={(e) => {
                          if (getLabelPlacementState().isPlacing) return;
                          if (getDoorPlacementState().isPlacing) return;
                          if (getWindowPlacementState().isPlacing) return;
                          if (
                            isDrawingActive ||
                            activeBuildTool === "drawWall" ||
                            activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry" ||
                            isLabelPlacementMode
                          )
                            return;

                          setSelectedRoomIds((prev) =>
                            prev.filter((id) => !id.includes("-wall-"))
                          );

                          handleRoomSelection(
                            room.id,
                            e,
                            selectedRoomIds,
                            setSelectedRoomIds,
                            handleRoomTypeUpdate,
                            openProjectPanel
                          );
                        }}
                        onMouseDown={(e) =>
                          handleMouseDownWithHistory(
                            e,
                            room.id,
                            svgRef,
                            setDragState,
                            setHasChanges,
                            setSelectedRoomIds,
                            selectedRoomIds
                          )
                        }
                        onTouchStart={(e) =>
                          handleTouchStartWithHistory(
                            e,
                            room.id,
                            svgRef,
                            setDragState,
                            setHasChanges,
                            setSelectedRoomIds,
                            selectedRoomIds
                          )
                        }
                      />

                      {isSelected && (
                        <>
                          <circle
                            cx={startPoint.x}
                            cy={startPoint.y}
                            r={isMobile ? 8 : 6}
                            className="resize-handle"
                            onMouseDown={(e) =>
                              handleVertexMouseDownWithHistory(
                                e,
                                room.id,
                                0,
                                svgRef,
                                setDragState,
                                setSelectedRoomIds,
                                selectedRoomIds,
                                setHasChanges
                              )
                            }
                            onTouchStart={(e) =>
                              handleVertexTouchStartWithHistory(
                                e,
                                room.id,
                                0,
                                svgRef,
                                setDragState,
                                setSelectedRoomIds,
                                selectedRoomIds,
                                setHasChanges
                              )
                            }
                          />

                          <circle
                            cx={endPoint.x}
                            cy={endPoint.y}
                            r={isMobile ? 8 : 6}
                            className="resize-handle"
                            onMouseDown={(e) =>
                              handleVertexMouseDownWithHistory(
                                e,
                                room.id,
                                1,
                                svgRef,
                                setDragState,
                                setSelectedRoomIds,
                                selectedRoomIds,
                                setHasChanges
                              )
                            }
                            onTouchStart={(e) =>
                              handleVertexTouchStartWithHistory(
                                e,
                                room.id,
                                1,
                                svgRef,
                                setDragState,
                                setSelectedRoomIds,
                                selectedRoomIds,
                                setHasChanges
                              )
                            }
                          />
                        </>
                      )}
                      {(() => {
                        const wallLength = Math.sqrt(
                          Math.pow(room.floor_polygon[1].x - room.floor_polygon[0].x, 2) +
                          Math.pow(room.floor_polygon[1].z - room.floor_polygon[0].z, 2)
                        ) / 10;

                        const startPos = transformCoordinates(room.floor_polygon[0]);
                        const endPos = transformCoordinates(room.floor_polygon[1]);

                        const midX = (startPos.x + endPos.x) / 2;
                        const midY = (startPos.y + endPos.y) / 2;

                        const dx = endPos.x - startPos.x;
                        const dy = endPos.y - startPos.y;
                        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

                        const offsetDistance = 8;
                        const isVertical = Math.abs(angle) > 45 && Math.abs(angle) < 135;

                        const labelX = midX + (isVertical ? offsetDistance : 0);
                        const labelY = midY + (isVertical ? 0 : -offsetDistance);

                        return (
                          <text
                            key={`wall-measurement-${room.id}`}
                            x={labelX}
                            y={labelY}
                            fontSize="8"
                            fontWeight="bold"
                            fill="black"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${angle > 90 || angle < -90 ? angle + 180 : angle}, ${labelX}, ${labelY})`}
                            style={{
                              userSelect: "none",
                              WebkitUserSelect: "none",
                              MozUserSelect: "none",
                              msUserSelect: "none",
                            }}
                          >
                            {formatImperialLength(coordToInches(wallLength), unitSystem)}
                          </text>
                        );
                      })()}
                    </g>
                  );
                }

                const polygonPoints = transformedPoints
                  .map((p) => `${p.x},${p.y}`)
                  .join(" ");
                const centroid = calculateRoomCentroid(transformedPoints);
                const isOverlapping = isRoomOverlapping(
                  room.id,
                  overlappingRooms
                );
                const isSelected = selectedRoomIds.includes(room.id);
                const isPrimarySelection =
                  selectedRoomIds.length > 0 && selectedRoomIds[0] === room.id;
                const isWall = room.room_type === "Wall";

                return (
                  <g
                    key={room.id}
                    transform={`rotate(${roomRotations[room.id] || 0}, ${centroid.x
                      }, ${centroid.y})`}
                  >
                    <polygon
                      id={room.id}
                      key={`${room.id}-${room.room_type}`}
                      className={`room-polygon ${isSelected
                        ? isPrimarySelection
                          ? "primary-selection"
                          : "secondary-selection"
                        : ""
                        } ${isOverlapping ? "overlapping" : ""} ${isWall ? "wall-polygon" : ""
                        } ${isLabelPlacementMode ||
                          getDoorPlacementState().isPlacing ||
                          getWindowPlacementState().isPlacing
                          ? "disable-interaction"
                          : ""
                        }`}
                      points={polygonPoints}
                      fill={room.isBoundary ? "transparent" : getRoomColor(room.room_type)}
                      stroke={room.isBoundary ? "#ff6b00" : "none"}
                      strokeWidth={room.isBoundary ? "3" : "0"}
                      strokeDasharray={room.isBoundary ? "8,4" : "none"}
                      style={{
                        strokeWidth: room.isBoundary ? "3px" : "0px",
                        stroke: room.isBoundary ? "#ff6b00" : "none",
                      }}
                      onClick={(e) => {
                        if (viewOnly) {
                          e.stopPropagation();
                          e.preventDefault();
                          return;
                        }
                        if (getLabelPlacementState().isPlacing) {
                          return;
                        }
                        if (getDoorPlacementState().isPlacing) {
                          return;
                        }
                        if (getWindowPlacementState().isPlacing) {
                          return;
                        }
                        if (
                          isDrawingActive ||
                          activeBuildTool === "drawWall" ||
                          activeBuildTool === "drawRoom" || activeBuildTool === "drawBoundry"
                        ) {
                          return;
                        }

                        handleRoomSelection(
                          room.id,
                          e,
                          selectedRoomIds,
                          setSelectedRoomIds,
                          handleRoomTypeUpdate,
                          openProjectPanel
                        );
                      }}
                      onDragOver={(e) => {
                        if (!isWall) {
                          e.preventDefault();
                          e.currentTarget.classList.add("drop-target");
                        }
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("drop-target");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.currentTarget.classList.remove("drop-target");

                        const roomType = e.dataTransfer.getData("roomType");

                        if (
                          roomType &&
                          room.room_type !== roomType &&
                          !isWall
                        ) {
                          if (!hasChanges) {
                            captureOriginalState();
                          }

                          handleRoomTypeUpdate(room.id, roomType);
                          setHasChanges(true);

                          const svgElement =
                            e.currentTarget as SVGPolygonElement;
                          svgElement.classList.add("room-updated");
                          setTimeout(() => {
                            svgElement.classList.remove("room-updated");
                          }, 300);
                        }
                      }}
                      onMouseDown={(e) =>
                        handleMouseDownWithHistory(
                          e,
                          room.id,
                          svgRef,
                          setDragState,
                          setHasChanges,
                          setSelectedRoomIds,
                          selectedRoomIds
                        )
                      }
                      onTouchStart={(e) =>
                        handleTouchStartWithHistory(
                          e,
                          room.id,
                          svgRef,
                          setDragState,
                          setHasChanges,
                          setSelectedRoomIds,
                          selectedRoomIds
                        )
                      }
                    />
                    {isSelected &&
                      !isWall &&
                      renderEdgeHandles(
                        room,
                        transformCoordinates,
                        handleEdgeMouseDownWithHistory,
                        handleEdgeTouchStartWithHistory,
                        svgRef,
                        setDragState,
                        setSelectedRoomIds,
                        selectedRoomIds,
                        setHasChanges,
                        isMobile,
                        floorPlanData
                      )}
                    {isSelected &&
                      !isWall &&
                      transformedPoints.map((point, index) => (
                        <circle
                          key={`handle-${room.id}-${index}`}
                          cx={point.x}
                          cy={point.y}
                          r={isMobile ? 8 : 6}
                          className="resize-handle"
                          onMouseDown={(e) =>
                            handleVertexMouseDownWithHistory(
                              e,
                              room.id,
                              index,
                              svgRef,
                              setDragState,
                              setSelectedRoomIds,
                              selectedRoomIds,
                              setHasChanges
                            )
                          }
                          onTouchStart={(e) =>
                            handleVertexTouchStartWithHistory(
                              e,
                              room.id,
                              index,
                              svgRef,
                              setDragState,
                              setSelectedRoomIds,
                              selectedRoomIds,
                              setHasChanges
                            )
                          }
                        />
                      ))}
                    {isSelected && !isWall && !room.isBoundary && shouldShowRotationIcon() && (
                      <foreignObject
                        x={centroid.x - (isMobile ? 8 : 10)}
                        y={centroid.y - (isMobile ? 8 : 10)}
                        width={isMobile ? "20" : "20"}
                        height={isMobile ? "20" : "20"}
                      >
                        <button
                          className="rotate-button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const direction =
                              (navigator.platform.indexOf("Mac") !== -1
                                ? e.metaKey
                                : e.ctrlKey || e.metaKey) || e.altKey
                                ? "left"
                                : "right";

                            if (selectedRoomIds.length > 1) {
                              rotateAllSelectedRooms(direction);
                            } else {
                              handleRotateRoomWithHistory(
                                room.id,
                                direction,
                                roomRotations,
                                setRoomRotations,
                                setHasChanges,
                                checkAndUpdateOverlaps
                              );
                            }
                          }}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            if (selectedRoomIds.length > 1) {
                              rotateAllSelectedRooms("left");
                            } else {
                              handleRotateRoomWithHistory(
                                room.id,
                                "left",
                                roomRotations,
                                setRoomRotations,
                                setHasChanges,
                                checkAndUpdateOverlaps
                              );
                            }
                          }}
                          style={{
                            width: isMobile ? "20px" : "30px",
                            height: isMobile ? "20px" : "30px",
                            position: "relative",
                            right: isMobile ? "8px" : "12px",
                            bottom: "5px",
                            borderRadius: "50%",
                            zIndex: "100",
                            background: "transparent",
                            color: "#333333",
                            fontWeight: "bolder",
                            fontSize: isMobile ? "15px" : "20px",
                            border: "none",
                            cursor: "pointer",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            MozUserSelect: "none",
                            msUserSelect: "none",
                          }}
                          title={
                            selectedRoomIds.length > 1
                              ? "Rotate all selected rooms"
                              : "Left-click to rotate clockwise, Right-click to rotate counter-clockwise"
                          }
                        >
                          <b>↻</b>
                        </button>
                      </foreignObject>
                    )}
                    {isSelected && room.isBoundary && (
                      <>
                        {(() => {
                          const bottomRightVertex = transformedPoints.reduce((bottomRight, point) => {
                            if (point.x >= bottomRight.x && point.y >= bottomRight.y) {
                              return point;
                            }
                            return bottomRight;
                          }, transformedPoints[0]);

                          const handleDeleteClick = (e: React.MouseEvent) => {
                            if (viewOnly) {
                              return;
                            }
                            e.stopPropagation();
                            e.preventDefault();

                            captureStateBeforeChange();

                            setFloorPlanData((prevData) => {
                              const updatedRooms = prevData.rooms.filter(r => r.id !== room.id);
                              const nonBoundaryRooms = updatedRooms.filter(r =>
                                r.room_type !== "Wall" && r.room_type !== "Reference" && !r.isBoundary
                              );

                              const updatedData = {
                                ...prevData,
                                rooms: updatedRooms,
                                room_count: nonBoundaryRooms.length,
                                total_area: nonBoundaryRooms.reduce((sum, r) => sum + r.area, 0),
                              };

                              if (setContextFloorPlanData) {
                                setTimeout(() => {
                                  setContextFloorPlanData(updatedData);
                                }, 0);
                              }

                              return updatedData;
                            });

                            setSelectedRoomIds([]);
                            setHasChanges(true);
                          };
                          if (viewOnly) return null;
                          else {

                            return (
                              <g
                                className="delete-boundary-icon"
                                transform={`translate(${bottomRightVertex.x + 15}, ${bottomRightVertex.y + 15})`}
                                onMouseDown={handleDeleteClick}
                                style={{ cursor: "pointer" }}
                              >
                                <circle
                                  cx="0"
                                  cy="0"
                                  r="12"
                                  fill="#ff4444"
                                  stroke="white"
                                  strokeWidth="2"
                                />
                                <svg
                                  x="-8"
                                  y="-8"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="white"
                                >
                                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                                </svg>
                              </g>
                            );
                          }
                        })()}
                      </>
                    )}

                    {options.showRoomLabels && !isWall && !room.isBoundary && (
                      <>
                        {(() => {
                          const adjustedPosition = findRoomNamePosition(
                            transformedPoints,
                            centroid,
                            room.room_type
                          );

                          return (
                            <text
                              className="room-label room-name1"
                              x={adjustedPosition.x}
                              y={adjustedPosition.y}
                              pointerEvents="none"
                              fill={"black"}
                              textAnchor="middle"
                            >
                              {room.room_type}
                            </text>
                          );
                        })()}
                      </>
                    )}

                    {options.showRoomLabels && !isWall && (
                      <>
                        {(() => {
                          const wallLabels = positionWallMeasurements(
                            transformedPoints,
                            room
                          );

                          if (wallLabels && wallLabels.length > 0) {
                            return wallLabels.map((label, index) => (
                              <text
                                key={`wall-label-${room.id}-${index}`}
                                className="room-label dimension-label"
                                x={label.position.x}
                                y={label.position.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                pointerEvents="none"
                                fill={"black"}
                                transform={`rotate(${label.angle}, ${label.position.x}, ${label.position.y})`}
                                style={{
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                }}
                              >
                                {formatImperialLength(coordToInches(parseFloat(label.value)), unitSystem)}
                              </text>
                            ));
                          }

                          return null;
                        })()}
                      </>
                    )}
                    {renderRoomWalls(room)}
                  </g>
                );
              })}

              {renderAllWallSegments()}

              {activeBuildTool === "drawWall" && (
                <WallDrawingTool
                  isActive={activeBuildTool === "drawWall"}
                  svgRef={svgRef}
                  reverseTransformCoordinates={reverseTransformCoordinates}
                  transformCoordinates={transformCoordinates}
                  scale={scale}
                  onWallCreated={handleWallCreated}
                  onDrawingStateChange={setIsDrawingActive}
                />
              )}
              {activeBuildTool === "drawRoom" && (
                <RoomDrawingTool
                  isActive={activeBuildTool === "drawRoom"}
                  svgRef={svgRef}
                  reverseTransformCoordinates={reverseTransformCoordinates}
                  transformCoordinates={transformCoordinates}
                  onRoomCreated={handleRoomCreated}
                  onDrawingStateChange={setIsDrawingActive}
                />
              )}
              {activeBuildTool === "drawBoundry" && (
                <BoundaryDrawingTool
                  isActive={activeBuildTool === "drawBoundry"}
                  svgRef={svgRef}
                  reverseTransformCoordinates={reverseTransformCoordinates}
                  transformCoordinates={transformCoordinates}
                  onBoundaryCreated={handleBoundaryCreated}
                  onDrawingStateChange={setIsDrawingActive}
                />
              )}

              {floorPlanData.labels &&
                floorPlanData.labels.map((label) => {
                  const position = transformCoordinates(label.position);
                  const currentFontSize = getResponsiveSize(
                    label.fontSize || 12,
                    scale
                  );

                  const isSvgPath =
                    label.text.startsWith("/Signs/") ||
                    label.text.startsWith("/Symbols/");

                  const handleLabelDrag = (
                    e: React.MouseEvent | React.TouchEvent
                  ) => {
                    e.stopPropagation();
                    if (selectedLabelId === label.id) {
                      if (!hasChanges) {
                        captureOriginalState();
                      }
                      captureStateBeforeChange();

                      if ("touches" in e) {
                        handleLabelTouchStart(
                          e,
                          label.id,
                          svgRef,
                          label,
                          setDragState,
                          setHasChanges
                        );
                      } else {
                        handleLabelMouseDown(
                          e,
                          label.id,
                          svgRef,
                          label,
                          setDragState,
                          setHasChanges
                        );
                      }
                    }
                  };

                  if (isSvgPath) {
                    return (
                      <g
                        key={label.id}
                        className={`floor-plan-label ${selectedLabelId === label.id ? "selected-label" : ""
                          } ${dragState.isLabelDragging &&
                            dragState.labelId === label.id
                            ? "dragging"
                            : ""
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLabelId(
                            selectedLabelId === label.id ? null : label.id
                          );
                        }}
                        onMouseDown={(e) => handleLabelDrag(e)}
                        onTouchStart={(e) => handleLabelDrag(e)}
                        style={{
                          cursor:
                            selectedLabelId === label.id ? "move" : "pointer",
                        }}
                      >
                        <image
                          href={label.text}
                          x={position.x - currentFontSize}
                          y={position.y - currentFontSize}
                          width={currentFontSize * 2}
                          height={currentFontSize * 2}
                          preserveAspectRatio="xMidYMid meet"
                          pointerEvents="all"
                        />
                        {selectedLabelId === label.id && (
                          <>
                            <rect
                              x={
                                position.x -
                                currentFontSize -
                                getResponsiveSize(5, scale)
                              }
                              y={
                                position.y -
                                currentFontSize -
                                getResponsiveSize(5, scale)
                              }
                              width={
                                currentFontSize * 2 +
                                getResponsiveSize(10, scale)
                              }
                              height={
                                currentFontSize * 2 +
                                getResponsiveSize(10, scale)
                              }
                              fill="none"
                              stroke="#2196F3"
                              strokeWidth={getResponsiveSize(1.5, scale)}
                              rx={getResponsiveSize(3, scale)}
                              ry={getResponsiveSize(3, scale)}
                            />

                            <g
                              onClick={(e) => {
                                e.stopPropagation();
                                if (updateLabel) {
                                  if (!hasChanges) {
                                    captureOriginalState();
                                  }
                                  captureStateBeforeChange();

                                  const updatedLabel = {
                                    ...label,
                                    fontSize: Math.max(
                                      8,
                                      (label.fontSize || 12) - 1
                                    ),
                                  };

                                  updateLabel(label.id, updatedLabel);
                                  setFloorPlanData((prevData) => {
                                    const updatedLabels = (
                                      prevData.labels || []
                                    ).map((l) =>
                                      l.id === label.id ? updatedLabel : l
                                    );
                                    return {
                                      ...prevData,
                                      labels: updatedLabels,
                                    };
                                  });
                                  setHasChanges(true);
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <circle
                                cx={
                                  position.x -
                                  currentFontSize -
                                  getResponsiveSize(18, scale)
                                }
                                cy={position.y}
                                r={getResponsiveSize(8, scale)}
                                fill="white"
                                stroke="black"
                                strokeWidth={getResponsiveSize(1, scale)}
                              />
                              <text
                                x={
                                  position.x -
                                  currentFontSize -
                                  getResponsiveSize(18, scale)
                                }
                                y={position.y + getResponsiveSize(5, scale)}
                                fill="black"
                                fontSize={getResponsiveSize(14, scale)}
                                fontWeight="bold"
                                textAnchor="middle"
                                pointerEvents="none"
                                style={{
                                  userSelect: "none",
                                  WebkitUserSelect: "none",
                                  MozUserSelect: "none",
                                  msUserSelect: "none",
                                }}
                              >
                                −
                              </text>
                            </g>

                            <g
                              onClick={(e) => {
                                e.stopPropagation();
                                if (updateLabel) {
                                  if (!hasChanges) {
                                    captureOriginalState();
                                  }
                                  captureStateBeforeChange();

                                  const updatedLabel = {
                                    ...label,
                                    fontSize: Math.min(
                                      48,
                                      (label.fontSize || 12) + 1
                                    ),
                                  };

                                  updateLabel(label.id, updatedLabel);
                                  setFloorPlanData((prevData) => {
                                    const updatedLabels = (
                                      prevData.labels || []
                                    ).map((l) =>
                                      l.id === label.id ? updatedLabel : l
                                    );
                                    return {
                                      ...prevData,
                                      labels: updatedLabels,
                                    };
                                  });
                                  setHasChanges(true);
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <circle
                                cx={
                                  position.x +
                                  currentFontSize +
                                  getResponsiveSize(18, scale)
                                }
                                cy={position.y}
                                r={getResponsiveSize(8, scale)}
                                fill="white"
                                stroke="black"
                                strokeWidth={getResponsiveSize(1, scale)}
                              />
                              <text
                                x={
                                  position.x +
                                  currentFontSize +
                                  getResponsiveSize(18, scale)
                                }
                                y={position.y + getResponsiveSize(5, scale)}
                                fill="black"
                                fontSize={getResponsiveSize(14, scale)}
                                fontWeight="bold"
                                textAnchor="middle"
                                pointerEvents="none"
                                style={{
                                  userSelect: "none",
                                  WebkitUserSelect: "none",
                                  MozUserSelect: "none",
                                  msUserSelect: "none",
                                }}
                              >
                                +
                              </text>
                            </g>
                          </>
                        )}
                      </g>
                    );
                  } else {
                    const charWidth = currentFontSize * 0.6;
                    const boxPadding = getResponsiveSize(8, scale);
                    const boxWidth =
                      label.text.length * charWidth + boxPadding * 2;
                    const boxHeight = currentFontSize + boxPadding;

                    return (
                      <g
                        key={label.id}
                        className={`floor-plan-label ${selectedLabelId === label.id ? "selected-label" : ""
                          } ${dragState.isLabelDragging &&
                            dragState.labelId === label.id
                            ? "dragging"
                            : ""
                          }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLabelId(
                            selectedLabelId === label.id ? null : label.id
                          );
                        }}
                        onMouseDown={(e) => handleLabelDrag(e)}
                        onTouchStart={(e) => handleLabelDrag(e)}
                        style={{
                          cursor:
                            selectedLabelId === label.id ? "move" : "pointer",
                        }}
                      >
                        <rect
                          x={position.x - boxWidth / 2}
                          y={position.y - boxHeight / 2}
                          width={boxWidth}
                          height={boxHeight}
                          fill={
                            selectedLabelId === label.id
                              ? "rgba(33, 150, 243, 0.3)"
                              : "rgba(255, 255, 255, 0.7)"
                          }
                          rx={getResponsiveSize(3, scale)}
                          ry={getResponsiveSize(3, scale)}
                          stroke={
                            selectedLabelId === label.id ? "#2196F3" : "#000000"
                          }
                          strokeWidth={
                            selectedLabelId === label.id
                              ? getResponsiveSize(1.5, scale)
                              : getResponsiveSize(0.5, scale)
                          }
                          opacity="0.8"
                        />
                        <text
                          x={position.x}
                          y={position.y + currentFontSize * 0.35}
                          fill={label.color || "#000000"}
                          fontSize={currentFontSize}
                          fontWeight="bold"
                          textAnchor="middle"
                          pointerEvents="none"
                          style={{
                            userSelect: "none",
                            WebkitUserSelect: "none",
                            MozUserSelect: "none",
                            msUserSelect: "none",
                          }}
                        >
                          {label.text}
                        </text>

                        {selectedLabelId === label.id && (
                          <>
                            <g
                              onClick={(e) => {
                                e.stopPropagation();
                                if (updateLabel) {
                                  if (!hasChanges) {
                                    captureOriginalState();
                                  }
                                  captureStateBeforeChange();

                                  const updatedLabel = {
                                    ...label,
                                    fontSize: Math.max(
                                      8,
                                      (label.fontSize || 12) - 1
                                    ),
                                  };

                                  updateLabel(label.id, updatedLabel);
                                  setFloorPlanData((prevData) => {
                                    const updatedLabels = (
                                      prevData.labels || []
                                    ).map((l) =>
                                      l.id === label.id ? updatedLabel : l
                                    );
                                    return {
                                      ...prevData,
                                      labels: updatedLabels,
                                    };
                                  });
                                  setHasChanges(true);
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <circle
                                cx={
                                  position.x -
                                  boxWidth / 2 -
                                  getResponsiveSize(10, scale)
                                }
                                cy={position.y}
                                r={getResponsiveSize(8, scale)}
                                fill="white"
                                stroke="black"
                                strokeWidth={getResponsiveSize(1, scale)}
                              />
                              <text
                                x={
                                  position.x -
                                  boxWidth / 2 -
                                  getResponsiveSize(10, scale)
                                }
                                y={position.y + getResponsiveSize(5, scale)}
                                fill="black"
                                fontSize={getResponsiveSize(14, scale)}
                                fontWeight="bold"
                                textAnchor="middle"
                                pointerEvents="none"
                                style={{
                                  userSelect: "none",
                                  WebkitUserSelect: "none",
                                  MozUserSelect: "none",
                                  msUserSelect: "none",
                                }}
                              >
                                −
                              </text>
                            </g>

                            <g
                              onClick={(e) => {
                                e.stopPropagation();
                                if (updateLabel) {
                                  if (!hasChanges) {
                                    captureOriginalState();
                                  }
                                  captureStateBeforeChange();

                                  const updatedLabel = {
                                    ...label,
                                    fontSize: Math.min(
                                      24,
                                      (label.fontSize || 12) + 1
                                    ),
                                  };

                                  updateLabel(label.id, updatedLabel);
                                  setFloorPlanData((prevData) => {
                                    const updatedLabels = (
                                      prevData.labels || []
                                    ).map((l) =>
                                      l.id === label.id ? updatedLabel : l
                                    );
                                    return {
                                      ...prevData,
                                      labels: updatedLabels,
                                    };
                                  });
                                  setHasChanges(true);
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              <circle
                                cx={
                                  position.x +
                                  boxWidth / 2 +
                                  getResponsiveSize(10, scale)
                                }
                                cy={position.y}
                                r={getResponsiveSize(8, scale)}
                                fill="white"
                                stroke="black"
                                strokeWidth={getResponsiveSize(1, scale)}
                              />
                              <text
                                x={
                                  position.x +
                                  boxWidth / 2 +
                                  getResponsiveSize(10, scale)
                                }
                                y={position.y + getResponsiveSize(5, scale)}
                                fill="black"
                                fontSize={getResponsiveSize(14, scale)}
                                fontWeight="bold"
                                textAnchor="middle"
                                pointerEvents="none"
                                style={{
                                  userSelect: "none",
                                  WebkitUserSelect: "none",
                                  MozUserSelect: "none",
                                  msUserSelect: "none",
                                }}
                              >
                                +
                              </text>
                            </g>
                          </>
                        )}
                      </g>
                    );
                  }
                })}

              {floorPlanData.objects &&
                (() => {
                  // Sort objects so selected object renders last (on top)
                  const sortedObjects = [...(floorPlanData.objects || [])].sort((a, b) => {
                    if (a.id === selectedObjectId) return 1; // Selected object goes to end
                    if (b.id === selectedObjectId) return -1;
                    return 0; // Keep other objects in original order
                  });

                  // Filter out objects in selected room
                  const filteredObjects = sortedObjects.filter((obj) => {
                    // If no room is selected, show all objects
                    if (!selectedRoomId && selectedRoomIds.length === 0) return true;

                    // Check if object is inside any selected room
                    const selectedRooms = floorPlanData.rooms?.filter(r =>
                      r.id === selectedRoomId || selectedRoomIds.includes(r.id)
                    ) || [];

                    const objPos = obj.position;

                    for (const room of selectedRooms) {
                      const poly = room.floor_polygon || [];
                      let inside = false;

                      for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                        if (((poly[i].z > objPos.z) !== (poly[j].z > objPos.z)) &&
                          (objPos.x < (poly[j].x - poly[i].x) * (objPos.z - poly[i].z) / (poly[j].z - poly[i].z) + poly[i].x)) {
                          inside = !inside;
                        }
                      }

                      if (inside) return false; // Object is in selected room, don't render it
                    }

                    return true; // Object not in selected room, render it
                  });

                  return filteredObjects;
                })().map((object) => {
                  const position = transformCoordinates(object.position);
                  const currentObjectSize = getResponsiveSize(150, scale);
                  const objectRotation =
                    objectRotations[object.id] || object.rotation || 0;

                  const handleObjectDrag = (
                    e: React.MouseEvent | React.TouchEvent
                  ) => {
                    e.stopPropagation();
                    if (viewOnly) return;
                    if (selectedObjectId === object.id && !isRotatingObject) {
                      if (!hasChanges) {
                        captureOriginalState();
                      }
                      captureStateBeforeChange();

                      if ("touches" in e) {
                        handleObjectTouchStart(
                          e,
                          object.id,
                          svgRef,
                          object,
                          setDragState,
                          setHasChanges
                        );
                      } else {
                        handleObjectMouseDown(
                          e,
                          object.id,
                          svgRef,
                          object,
                          setDragState,
                          setHasChanges
                        );
                      }
                    }
                  };

                  return (
<g
  key={object.id}
  className={`floor-plan-object ${selectedObjectId === object.id ? "selected-object" : ""
    } ${dragState.isObjectDragging &&
      dragState.objectId === object.id
      ? "dragging"
      : ""
    }`}
  onClick={(e) => {
    e.stopPropagation();
    if (!isRotatingObject && !viewOnly) {
      // Get click coordinates
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert click position to floor plan coordinates
      const floorPlanCoords = reverseTransformCoordinates(clickX, clickY);

      // Find the room at the exact click position
      const roomAtClick = findRoomAtPosition(
        floorPlanCoords,
        floorPlanData,
        roomRotations
      );

      // Find the object closest to click point
      let closestObjectId: string | null = null;
      let closestDistance: number = Infinity;
      const CLICK_THRESHOLD = 50; // pixels - only consider objects within this radius

      (floorPlanData.objects || []).forEach((obj) => {
        const objPos = transformCoordinates(obj.position);
        const objSize = getResponsiveSize(150, scale);

        // Calculate distance from click to object center
        const dx = clickX - objPos.x;
        const dy = clickY - objPos.y;
        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

        // Only consider if click is reasonably close to the object
        if (distanceFromCenter <= objSize && distanceFromCenter < closestDistance) {
          closestObjectId = obj.id;
          closestDistance = distanceFromCenter;
        }
      });

      // Determine selection based on click proximity to object center
      const isClickNearObjectCenter = closestDistance < getResponsiveSize(50, scale);

      if (isClickNearObjectCenter && closestObjectId !== null) {
        // Click is near the center of an object - select the object
        setSelectedObjectId(
          selectedObjectId === closestObjectId ? null : closestObjectId
        );
      } else if (roomAtClick) {
        // Click is not near object center but is over a room - select the room
        setSelectedObjectId(null);
        setSelectedRoomId(roomAtClick.id);
        setSelectedRoomIds([roomAtClick.id]);
        if (setContextSelectedRoomIds) {
          setContextSelectedRoomIds([roomAtClick.id]);
        }
      } else {
        // Click is not near any object center and not over a room - deselect
        setSelectedObjectId(null);
      }
    }
  }}
  onMouseDown={(e) => handleObjectDrag(e)}
  onTouchStart={(e) => handleObjectDrag(e)}
  style={{
    cursor:
      selectedObjectId === object.id && !isRotatingObject
        ? "move"
        : "pointer",
  }}
>
                      <g
                        transform={`rotate(${objectRotation}, ${position.x}, ${position.y})`}
                      >
                        <image
                          href={object.objectPath}
                          x={position.x - currentObjectSize}
                          y={position.y - currentObjectSize}
                          width={currentObjectSize * 2}
                          height={currentObjectSize * 2}
                          preserveAspectRatio="xMidYMid meet"
                          pointerEvents="all"
                        />
                      </g>

                      {selectedObjectId === object.id && (
                        <>
                          {/* Center selection indicator circle with rotation control */}
                          <g
                            onMouseDown={(e) =>
                              handleRotationStart(
                                e,
                                object.id,
                                position.x,
                                position.y
                              )
                            }
                            onTouchStart={(e) =>
                              handleRotationTouchStart(
                                e,
                                object.id,
                                position.x,
                                position.y
                              )
                            }
                            style={{ cursor: "grab" }}
                          >
                            <circle
                              cx={position.x}
                              cy={position.y}
                              r={getResponsiveSize(12, scale)}
                              fill="white"
                              stroke="#2196F3"
                              strokeWidth={getResponsiveSize(4, scale)}
                            />
                            <text
                              x={position.x}
                              y={position.y + getResponsiveSize(5, scale)}
                              fill="#2196F3"
                              fontSize={getResponsiveSize(14, scale)}
                              fontWeight="bold"
                              textAnchor="middle"
                              pointerEvents="none"
                              style={{
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                MozUserSelect: "none",
                                msUserSelect: "none",
                              }}
                            >
                              ↻
                            </text>
                          </g>

                          {isRotatingObject &&
                            rotatingObjectId === object.id && (
                              <line
                                x1={position.x}
                                y1={position.y}
                                x2={
                                  position.x +
                                  currentObjectSize +
                                  getResponsiveSize(5, scale)
                                }
                                y2={
                                  position.y -
                                  currentObjectSize -
                                  getResponsiveSize(5, scale)
                                }
                                stroke="#2196F3"
                                strokeWidth={getResponsiveSize(1, scale)}
                                strokeDasharray={`${getResponsiveSize(
                                  3,
                                  scale
                                )},${getResponsiveSize(3, scale)}`}
                                opacity="0.5"
                              />
                            )}
                        </>
                      )}
                    </g>
                  );
                })}

              {floorPlanData.doors &&
                floorPlanData.doors.map((door) => {
                  const position = transformCoordinates(door.position);
                  const currentDoorSize = getResponsiveSize(32, scale);
                  const doorWidth = doorWidths[door.id] || door.width || 2;
                  const actualWidth = currentDoorSize * doorWidth;
                  const doorRotation = door.rotation || 0;
                  const flipState = doorFlipStates[door.id] || {
                    flipH: false,
                    flipV: false,
                  };
                  const scaleX = flipState.flipH ? -1 : 1;
                  const scaleY = flipState.flipV ? -1 : 1;
                  const resizeHandleY = position.y - currentDoorSize;
                  const resizeHandleHeight = currentDoorSize * 2;
                  const leftControlX =
                    position.x - actualWidth - getResponsiveSize(2, scale);
                  const rightControlX =
                    position.x + actualWidth + getResponsiveSize(2, scale);
                  const flipIconY =
                    resizeHandleY - getResponsiveSize(12, scale);

                  const handleDoorDrag = (
                    e: React.MouseEvent | React.TouchEvent
                  ) => {
                    e.stopPropagation();
                    e.preventDefault();

                    if (selectedDoorId === door.id) {
                      if (!hasChanges) {
                        captureOriginalState();
                      }
                      captureStateBeforeChange();

                      if (!svgRef.current) return;

                      const isTouch = "touches" in e;
                      const clientX = isTouch
                        ? e.touches[0].clientX
                        : e.clientX;
                      const clientY = isTouch
                        ? e.touches[0].clientY
                        : e.clientY;

                      const rect = svgRef.current.getBoundingClientRect();
                      const startX = clientX - rect.left;
                      const startY = clientY - rect.top;

                      setDragState((prevState) => ({
                        ...prevState,
                        active: true,
                        roomId: null,
                        roomIds: [],
                        vertexIndex: null,
                        edgeIndices: null,
                        startX,
                        startY,
                        lastX: startX,
                        lastY: startY,
                        isResizing: false,
                        isEdgeResizing: false,
                        isGroupOperation: false,
                        isDoorDragging: true,
                        doorId: door.id,
                        isWindowDragging: false,
                        windowId: null,
                        isLabelDragging: false,
                        labelId: null,
                        isObjectDragging: false,
                        objectId: null,
                      }));

                      const handleMove = (
                        moveEvent: MouseEvent | TouchEvent
                      ) => {
                        moveEvent.preventDefault();

                        if (!svgRef.current) return;

                        const rect = svgRef.current.getBoundingClientRect();
                        const isTouchMove = "touches" in moveEvent;
                        const clientX = isTouchMove
                          ? moveEvent.touches[0].clientX
                          : moveEvent.clientX;
                        const clientY = isTouchMove
                          ? moveEvent.touches[0].clientY
                          : moveEvent.clientY;

                        const currentX = clientX - rect.left;
                        const currentY = clientY - rect.top;

                        const floorPlanCoords = reverseTransformCoordinates(
                          currentX,
                          currentY
                        );

                        const snapResult = findNearestWall(
                          floorPlanCoords,
                          floorPlanData,
                          roomRotations,
                          8.0
                        );

                        if (
                          snapResult.isOnWall &&
                          snapResult.snappedPosition &&
                          snapResult.suggestedRotation !== undefined
                        ) {
                          setFloorPlanData((prevData) => {
                            const updatedDoors = (prevData.doors || []).map(
                              (d) => {
                                if (d.id === door.id) {
                                  return {
                                    ...d,
                                    position: snapResult.snappedPosition!,
                                    rotation: snapResult.suggestedRotation!,
                                  };
                                }
                                return d;
                              }
                            );
                            return { ...prevData, doors: updatedDoors };
                          });
                        }
                      };

                      const handleEnd = () => {
                        setDragState({
                          active: false,
                          roomId: null,
                          roomIds: [],
                          vertexIndex: null,
                          edgeIndices: null,
                          startX: 0,
                          startY: 0,
                          lastX: 0,
                          lastY: 0,
                          isResizing: false,
                          isEdgeResizing: false,
                          isGroupOperation: false,
                          isDoorDragging: false,
                          doorId: null,
                          isWindowDragging: false,
                          windowId: null,
                          isLabelDragging: false,
                          labelId: null,
                          isObjectDragging: false,
                          objectId: null,
                        });

                        if (setContextFloorPlanData) {
                          setTimeout(
                            () => setContextFloorPlanData(floorPlanData),
                            0
                          );
                        }

                        setHasChanges(true);

                        document.removeEventListener(
                          "mousemove",
                          handleMove as any
                        );
                        document.removeEventListener("mouseup", handleEnd);
                        document.removeEventListener(
                          "touchmove",
                          handleMove as any
                        );
                        document.removeEventListener("touchend", handleEnd);
                        document.removeEventListener("touchcancel", handleEnd);
                      };

                      if (isTouch) {
                        document.addEventListener(
                          "touchmove",
                          handleMove as any,
                          { passive: false }
                        );
                        document.addEventListener("touchend", handleEnd);
                        document.addEventListener("touchcancel", handleEnd);
                      } else {
                        document.addEventListener(
                          "mousemove",
                          handleMove as any
                        );
                        document.addEventListener("mouseup", handleEnd);
                      }
                    }
                  };

                  /*     if (isTouch) {
                        document.addEventListener(
                          "touchmove",
                          handleMove as any,
                          { passive: false }
                        );
                        document.addEventListener("touchend", handleEnd);
                      } else {
                        document.addEventListener(
                          "mousemove",
                          handleMove as any
                        );
                        document.addEventListener("mouseup", handleEnd);
                      }
                    }
                  };
 */
                  const handleLeftResize = (
                    e: React.MouseEvent | React.TouchEvent
                  ) => {
                    e.stopPropagation();

                    if (!hasChanges) {
                      captureOriginalState();
                    }
                    captureStateBeforeChange();

                    const startX =
                      "touches" in e ? e.touches[0].clientX : e.clientX;
                    const startY =
                      "touches" in e ? e.touches[0].clientY : e.clientY;
                    const startWidth = doorWidth;

                    const handleMouseMove = (
                      moveE: MouseEvent | TouchEvent
                    ) => {
                      const currentX =
                        "touches" in moveE
                          ? (moveE as TouchEvent).touches[0].clientX
                          : (moveE as MouseEvent).clientX;
                      const currentY =
                        "touches" in moveE
                          ? (moveE as TouchEvent).touches[0].clientY
                          : (moveE as MouseEvent).clientY;

                      const deltaX =
                        (currentX - startX) / (scale * parentScale);
                      const deltaY =
                        (currentY - startY) / (scale * parentScale);

                      let distanceFromCenter;

                      if (
                        Math.abs(doorRotation - 90) < 10 ||
                        Math.abs(doorRotation - 270) < 10
                      ) {
                        distanceFromCenter = -deltaY;
                      } else {
                        distanceFromCenter = -deltaX;
                      }

                      const newWidth = Math.max(
                        0.5,
                        Math.min(
                          3,
                          startWidth + distanceFromCenter / currentDoorSize
                        )
                      );

                      setDoorWidths((prev) => ({
                        ...prev,
                        [door.id]: newWidth,
                      }));
                      updateDoor(door.id, { width: newWidth });
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                      document.removeEventListener(
                        "touchmove",
                        handleMouseMove as any
                      );
                      document.removeEventListener("touchend", handleMouseUp);
                      setHasChanges(true);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                    document.addEventListener(
                      "touchmove",
                      handleMouseMove as any,
                      { passive: false }
                    );
                    document.addEventListener("touchend", handleMouseUp);
                  };

                  const handleRightResize = (
                    e: React.MouseEvent | React.TouchEvent
                  ) => {
                    e.stopPropagation();

                    if (!hasChanges) {
                      captureOriginalState();
                    }
                    captureStateBeforeChange();

                    const startX =
                      "touches" in e ? e.touches[0].clientX : e.clientX;
                    const startY =
                      "touches" in e ? e.touches[0].clientY : e.clientY;
                    const startWidth = doorWidth;

                    const handleMouseMove = (
                      moveE: MouseEvent | TouchEvent
                    ) => {
                      const currentX =
                        "touches" in moveE
                          ? (moveE as TouchEvent).touches[0].clientX
                          : (moveE as MouseEvent).clientX;
                      const currentY =
                        "touches" in moveE
                          ? (moveE as TouchEvent).touches[0].clientY
                          : (moveE as MouseEvent).clientY;

                      const deltaX =
                        (currentX - startX) / (scale * parentScale);
                      const deltaY =
                        (currentY - startY) / (scale * parentScale);

                      let distanceFromCenter;

                      if (
                        Math.abs(doorRotation - 90) < 10 ||
                        Math.abs(doorRotation - 270) < 10
                      ) {
                        distanceFromCenter = deltaY;
                      } else {
                        distanceFromCenter = deltaX;
                      }

                      const newWidth = Math.max(
                        0.5,
                        Math.min(
                          3,
                          startWidth + distanceFromCenter / currentDoorSize
                        )
                      );

                      setDoorWidths((prev) => ({
                        ...prev,
                        [door.id]: newWidth,
                      }));
                      updateDoor(door.id, { width: newWidth });
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                      document.removeEventListener(
                        "touchmove",
                        handleMouseMove as any
                      );
                      document.removeEventListener("touchend", handleMouseUp);
                      setHasChanges(true);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                    document.addEventListener(
                      "touchmove",
                      handleMouseMove as any,
                      { passive: false }
                    );
                    document.addEventListener("touchend", handleMouseUp);
                  };

                  const handleHorizontalFlip = (e: React.MouseEvent) => {
                    e.stopPropagation();

                    setDoorFlipStates((prev) => ({
                      ...prev,
                      [door.id]: {
                        flipH: !flipState.flipH,
                        flipV: flipState.flipV,
                      },
                    }));
                  };

                  const handleVerticalFlip = (e: React.MouseEvent) => {
                    e.stopPropagation();

                    setDoorFlipStates((prev) => ({
                      ...prev,
                      [door.id]: {
                        flipH: flipState.flipH,
                        flipV: !flipState.flipV,
                      },
                    }));
                  };

                  return (
                    <g
                      key={door.id}
                      className={`floor-plan-door ${selectedDoorId === door.id ? "selected-door" : ""
                        } ${dragState.isDoorDragging && dragState.doorId === door.id
                          ? "dragging"
                          : ""
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoorId(
                          selectedDoorId === door.id ? null : door.id
                        );
                      }}
                      onMouseDown={(e) => handleDoorDrag(e)}
                      onTouchStart={(e) => handleDoorDrag(e)}
                      style={{
                        cursor: selectedDoorId === door.id ? "move" : "pointer",
                      }}
                    >
                      <g
                        transform={`rotate(${doorRotation}, ${position.x}, ${position.y})`}
                      >
                        <g
                          transform={`translate(${position.x}, ${position.y
                            }) scale(${scaleX}, ${scaleY}) translate(${-position.x}, ${-position.y})`}
                        >
                          <image
                            href={door.doorPath}
                            x={position.x - actualWidth}
                            y={position.y - currentDoorSize}
                            width={actualWidth * 2}
                            height={currentDoorSize * 2}
                            preserveAspectRatio="none"
                            pointerEvents="all"
                          />
                        </g>

                        {selectedDoorId === door.id && (
                          <rect
                            x={
                              position.x -
                              actualWidth -
                              getResponsiveSize(1, scale)
                            }
                            y={
                              position.y -
                              currentDoorSize -
                              getResponsiveSize(1, scale)
                            }
                            width={
                              actualWidth * 2 + getResponsiveSize(4, scale)
                            }
                            height={
                              currentDoorSize * 2 + getResponsiveSize(4, scale)
                            }
                            fill="none"
                            stroke="#2196F3"
                            strokeWidth={getResponsiveSize(1.5, scale)}
                            rx={getResponsiveSize(3, scale)}
                            ry={getResponsiveSize(3, scale)}
                            pointerEvents="none"
                          />
                        )}

                        {selectedDoorId === door.id && (
                          <>
                            <g
                              onClick={handleHorizontalFlip}
                              style={{ cursor: "pointer" }}
                            >
                              <circle
                                cx={leftControlX}
                                cy={flipIconY}
                                r={getResponsiveSize(10, scale)}
                                fill="white"
                                stroke="#2196F3"
                                strokeWidth={getResponsiveSize(2, scale)}
                              />
                              <text
                                x={leftControlX}
                                y={flipIconY + getResponsiveSize(4, scale)}
                                fill="#2196F3"
                                fontSize={getResponsiveSize(12, scale)}
                                fontWeight="bold"
                                textAnchor="middle"
                                pointerEvents="none"
                                style={{
                                  userSelect: "none",
                                  WebkitUserSelect: "none",
                                  MozUserSelect: "none",
                                  msUserSelect: "none",
                                }}
                              >
                                ↔
                              </text>
                            </g>

                            <g
                              onClick={handleVerticalFlip}
                              style={{ cursor: "pointer" }}
                            >
                              <circle
                                cx={rightControlX}
                                cy={flipIconY}
                                r={getResponsiveSize(10, scale)}
                                fill="white"
                                stroke="#2196F3"
                                strokeWidth={getResponsiveSize(2, scale)}
                              />
                              <text
                                x={rightControlX}
                                y={flipIconY + getResponsiveSize(4, scale)}
                                fill="#2196F3"
                                fontSize={getResponsiveSize(12, scale)}
                                fontWeight="bold"
                                textAnchor="middle"
                                pointerEvents="none"
                                style={{
                                  userSelect: "none",
                                  WebkitUserSelect: "none",
                                  MozUserSelect: "none",
                                  msUserSelect: "none",
                                }}
                              >
                                ↕
                              </text>
                            </g>
                            <rect
                              x={
                                position.x -
                                actualWidth -
                                getResponsiveSize(4, scale)
                              }
                              y={resizeHandleY}
                              width={getResponsiveSize(4, scale)}
                              height={resizeHandleHeight}
                              fill="#2196F3"
                              stroke="#1976D2"
                              strokeWidth={getResponsiveSize(0.5, scale)}
                              rx={getResponsiveSize(1, scale)}
                              style={{
                                cursor:
                                  Math.abs(doorRotation - 90) < 10 ||
                                    Math.abs(doorRotation - 270) < 10
                                    ? "ns-resize"
                                    : "ew-resize",
                              }}
                              onMouseDown={handleLeftResize}
                              onTouchStart={handleLeftResize}
                            />

                            <rect
                              x={position.x + actualWidth}
                              y={resizeHandleY}
                              width={getResponsiveSize(4, scale)}
                              height={resizeHandleHeight}
                              fill="#2196F3"
                              stroke="#1976D2"
                              strokeWidth={getResponsiveSize(0.5, scale)}
                              rx={getResponsiveSize(1, scale)}
                              style={{
                                cursor:
                                  Math.abs(doorRotation - 90) < 10 ||
                                    Math.abs(doorRotation - 270) < 10
                                    ? "ns-resize"
                                    : "ew-resize",
                              }}
                              onMouseDown={handleRightResize}
                              onTouchStart={handleRightResize}
                            />
                          </>
                        )}
                      </g>
                    </g>
                  );
                })}
              {floorPlanData.windows &&
                floorPlanData.windows.map((window) => {
                  const position = transformCoordinates(window.position);
                  const currentWindowSize = getResponsiveSize(24, scale);
                  const windowWidth =
                    windowWidths[window.id] || window.width || 2;
                  const actualWidth = currentWindowSize * windowWidth;
                  const windowRotation = window.rotation || 0;

                  const handleWindowDrag = (
                    e: React.MouseEvent | React.TouchEvent
                  ) => {
                    e.stopPropagation();
                    e.preventDefault();

                    if (selectedWindowId === window.id) {
                      if (!hasChanges) {
                        captureOriginalState();
                      }
                      captureStateBeforeChange();

                      if (!svgRef.current) return;

                      const isTouch = "touches" in e;
                      const clientX = isTouch
                        ? e.touches[0].clientX
                        : e.clientX;
                      const clientY = isTouch
                        ? e.touches[0].clientY
                        : e.clientY;

                      const rect = svgRef.current.getBoundingClientRect();
                      const startX = clientX - rect.left;
                      const startY = clientY - rect.top;

                      setDragState((prevState) => ({
                        ...prevState,
                        active: true,
                        roomId: null,
                        roomIds: [],
                        vertexIndex: null,
                        edgeIndices: null,
                        startX,
                        startY,
                        lastX: startX,
                        lastY: startY,
                        isResizing: false,
                        isEdgeResizing: false,
                        isGroupOperation: false,
                        isDoorDragging: false,
                        doorId: null,
                        isWindowDragging: true,
                        windowId: window.id,
                        isLabelDragging: false,
                        labelId: null,
                        isObjectDragging: false,
                        objectId: null,
                      }));

                      const handleMove = (
                        moveEvent: MouseEvent | TouchEvent
                      ) => {
                        moveEvent.preventDefault();

                        if (!svgRef.current) return;

                        const rect = svgRef.current.getBoundingClientRect();
                        const isTouchMove = "touches" in moveEvent;
                        const clientX = isTouchMove
                          ? moveEvent.touches[0].clientX
                          : moveEvent.clientX;
                        const clientY = isTouchMove
                          ? moveEvent.touches[0].clientY
                          : moveEvent.clientY;

                        const currentX = clientX - rect.left;
                        const currentY = clientY - rect.top;

                        const floorPlanCoords = reverseTransformCoordinates(
                          currentX,
                          currentY
                        );

                        const snapResult = findNearestWall(
                          floorPlanCoords,
                          floorPlanData,
                          roomRotations,
                          8.0
                        );

                        if (
                          snapResult.isOnWall &&
                          snapResult.snappedPosition &&
                          snapResult.suggestedRotation !== undefined
                        ) {
                          setFloorPlanData((prevData) => {
                            const updatedWindows = (prevData.windows || []).map(
                              (w) => {
                                if (w.id === window.id) {
                                  return {
                                    ...w,
                                    position: snapResult.snappedPosition!,
                                    rotation: snapResult.suggestedRotation!,
                                  };
                                }
                                return w;
                              }
                            );
                            return { ...prevData, windows: updatedWindows };
                          });
                        }
                      };

                      const handleEnd = () => {
                        setDragState({
                          active: false,
                          roomId: null,
                          roomIds: [],
                          vertexIndex: null,
                          edgeIndices: null,
                          startX: 0,
                          startY: 0,
                          lastX: 0,
                          lastY: 0,
                          isResizing: false,
                          isEdgeResizing: false,
                          isGroupOperation: false,
                          isDoorDragging: false,
                          doorId: null,
                          isWindowDragging: false,
                          windowId: null,
                          isLabelDragging: false,
                          labelId: null,
                          isObjectDragging: false,
                          objectId: null,
                        });

                        if (setContextFloorPlanData) {
                          setTimeout(
                            () => setContextFloorPlanData(floorPlanData),
                            0
                          );
                        }

                        setHasChanges(true);

                        document.removeEventListener(
                          "mousemove",
                          handleMove as any
                        );
                        document.removeEventListener("mouseup", handleEnd);
                        document.removeEventListener(
                          "touchmove",
                          handleMove as any
                        );
                        document.removeEventListener("touchend", handleEnd);
                        document.removeEventListener("touchcancel", handleEnd);
                      };

                      if (isTouch) {
                        document.addEventListener(
                          "touchmove",
                          handleMove as any,
                          { passive: false }
                        );
                        document.addEventListener("touchend", handleEnd);
                        document.addEventListener("touchcancel", handleEnd);
                      } else {
                        document.addEventListener(
                          "mousemove",
                          handleMove as any
                        );
                        document.addEventListener("mouseup", handleEnd);
                      }
                    }
                  };

                  const handleLeftResize = (
                    e: React.MouseEvent | React.TouchEvent
                  ) => {
                    e.stopPropagation();

                    if (!hasChanges) {
                      captureOriginalState();
                    }
                    captureStateBeforeChange();

                    const startX =
                      "touches" in e ? e.touches[0].clientX : e.clientX;
                    const startY =
                      "touches" in e ? e.touches[0].clientY : e.clientY;
                    const startWidth = windowWidth;

                    const handleMouseMove = (
                      moveE: MouseEvent | TouchEvent
                    ) => {
                      const currentX =
                        "touches" in moveE
                          ? (moveE as TouchEvent).touches[0].clientX
                          : (moveE as MouseEvent).clientX;
                      const currentY =
                        "touches" in moveE
                          ? (moveE as TouchEvent).touches[0].clientY
                          : (moveE as MouseEvent).clientY;

                      const deltaX =
                        (currentX - startX) / (scale * parentScale);
                      const deltaY =
                        (currentY - startY) / (scale * parentScale);

                      let distanceFromCenter;

                      if (
                        Math.abs(windowRotation - 90) < 10 ||
                        Math.abs(windowRotation - 270) < 10
                      ) {
                        distanceFromCenter = -deltaY;
                      } else {
                        distanceFromCenter = -deltaX;
                      }

                      const newWidth = Math.max(
                        0.5,
                        Math.min(
                          3,
                          startWidth + distanceFromCenter / currentWindowSize
                        )
                      );

                      setWindowWidths((prev) => ({
                        ...prev,
                        [window.id]: newWidth,
                      }));
                      updateWindow(window.id, { width: newWidth });
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                      document.removeEventListener(
                        "touchmove",
                        handleMouseMove as any
                      );
                      document.removeEventListener("touchend", handleMouseUp);
                      setHasChanges(true);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                    document.addEventListener(
                      "touchmove",
                      handleMouseMove as any,
                      { passive: false }
                    );
                    document.addEventListener("touchend", handleMouseUp);
                  };

                  const handleRightResize = (
                    e: React.MouseEvent | React.TouchEvent
                  ) => {
                    e.stopPropagation();

                    if (!hasChanges) {
                      captureOriginalState();
                    }
                    captureStateBeforeChange();

                    const startX =
                      "touches" in e ? e.touches[0].clientX : e.clientX;
                    const startY =
                      "touches" in e ? e.touches[0].clientY : e.clientY;
                    const startWidth = windowWidth;

                    const handleMouseMove = (
                      moveE: MouseEvent | TouchEvent
                    ) => {
                      const currentX =
                        "touches" in moveE
                          ? (moveE as TouchEvent).touches[0].clientX
                          : (moveE as MouseEvent).clientX;
                      const currentY =
                        "touches" in moveE
                          ? (moveE as TouchEvent).touches[0].clientY
                          : (moveE as MouseEvent).clientY;

                      const deltaX =
                        (currentX - startX) / (scale * parentScale);
                      const deltaY =
                        (currentY - startY) / (scale * parentScale);

                      let distanceFromCenter;

                      if (
                        Math.abs(windowRotation - 90) < 10 ||
                        Math.abs(windowRotation - 270) < 10
                      ) {
                        distanceFromCenter = deltaY;
                      } else {
                        distanceFromCenter = deltaX;
                      }

                      const newWidth = Math.max(
                        0.5,
                        Math.min(
                          3,
                          startWidth + distanceFromCenter / currentWindowSize
                        )
                      );

                      setWindowWidths((prev) => ({
                        ...prev,
                        [window.id]: newWidth,
                      }));
                      updateWindow(window.id, { width: newWidth });
                    };

                    const handleMouseUp = () => {
                      document.removeEventListener(
                        "mousemove",
                        handleMouseMove
                      );
                      document.removeEventListener("mouseup", handleMouseUp);
                      document.removeEventListener(
                        "touchmove",
                        handleMouseMove as any
                      );
                      document.removeEventListener("touchend", handleMouseUp);
                      setHasChanges(true);
                    };

                    document.addEventListener("mousemove", handleMouseMove);
                    document.addEventListener("mouseup", handleMouseUp);
                    document.addEventListener(
                      "touchmove",
                      handleMouseMove as any,
                      { passive: false }
                    );
                    document.addEventListener("touchend", handleMouseUp);
                  };

                  return (
                    <g
                      key={window.id}
                      className={`floor-plan-window ${selectedWindowId === window.id ? "selected-window" : ""
                        } ${dragState.isWindowDragging &&
                          dragState.windowId === window.id
                          ? "dragging"
                          : ""
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWindowId(
                          selectedWindowId === window.id ? null : window.id
                        );
                      }}
                      onMouseDown={(e) => handleWindowDrag(e)}
                      onTouchStart={(e) => handleWindowDrag(e)}
                      style={{
                        cursor:
                          selectedWindowId === window.id ? "move" : "pointer",
                      }}
                    >
                      <g
                        transform={`rotate(${windowRotation}, ${position.x}, ${position.y})`}
                      >
                        <image
                          href={window.windowPath}
                          x={position.x - actualWidth}
                          y={position.y - currentWindowSize}
                          width={actualWidth * 2}
                          height={currentWindowSize * 2}
                          preserveAspectRatio="none"
                          pointerEvents="all"
                        />

                        {selectedWindowId === window.id && (
                          <>
                            <rect
                              x={
                                position.x -
                                actualWidth -
                                getResponsiveSize(2, scale)
                              }
                              y={
                                position.y -
                                currentWindowSize -
                                getResponsiveSize(2, scale)
                              }
                              width={
                                actualWidth * 2 + getResponsiveSize(4, scale)
                              }
                              height={
                                currentWindowSize * 2 +
                                getResponsiveSize(4, scale)
                              }
                              fill="none"
                              stroke="#2196F3"
                              strokeWidth={getResponsiveSize(1.5, scale)}
                              rx={getResponsiveSize(3, scale)}
                              ry={getResponsiveSize(3, scale)}
                              pointerEvents="none"
                            />

                            <rect
                              x={
                                position.x -
                                actualWidth -
                                getResponsiveSize(4, scale)
                              }
                              y={position.y - currentWindowSize}
                              width={getResponsiveSize(4, scale)}
                              height={currentWindowSize * 2}
                              fill="#2196F3"
                              stroke="#1976D2"
                              strokeWidth={getResponsiveSize(0.5, scale)}
                              rx={getResponsiveSize(1, scale)}
                              style={{
                                cursor:
                                  Math.abs(windowRotation - 90) < 10 ||
                                    Math.abs(windowRotation - 270) < 10
                                    ? "ns-resize"
                                    : "ew-resize",
                              }}
                              onMouseDown={handleLeftResize}
                              onTouchStart={handleLeftResize}
                            />

                            <rect
                              x={position.x + actualWidth}
                              y={position.y - currentWindowSize}
                              width={getResponsiveSize(4, scale)}
                              height={currentWindowSize * 2}
                              fill="#2196F3"
                              stroke="#1976D2"
                              strokeWidth={getResponsiveSize(0.5, scale)}
                              rx={getResponsiveSize(1, scale)}
                              style={{
                                cursor:
                                  Math.abs(windowRotation - 90) < 10 ||
                                    Math.abs(windowRotation - 270) < 10
                                    ? "ns-resize"
                                    : "ew-resize",
                              }}
                              onMouseDown={handleRightResize}
                              onTouchStart={handleRightResize}
                            />
                          </>
                        )}
                      </g>
                    </g>
                  );
                })}

              {renderPreviewDimensionLine()}

              {floorPlanData.dimensionLines &&
                floorPlanData.dimensionLines.map((dimension) => {
                  const startPos = transformCoordinates(dimension.startPoint);
                  const endPos = transformCoordinates(dimension.endPoint);
                  const midPos = transformCoordinates(dimension.midPoint);

                  const dx = endPos.x - startPos.x;
                  const dy = endPos.y - startPos.y;
                  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

                  const offsetStartX = startPos.x;
                  const offsetStartY = startPos.y;
                  const offsetEndX = endPos.x;
                  const offsetEndY = endPos.y;
                  const offsetMidX = midPos.x;
                  const offsetMidY = midPos.y;

                  const isSelected = selectedDimensionId === dimension.id;

                  return (
                    <g
                      key={dimension.id}
                      className="dimension-line"
                      style={{ cursor: "pointer" }}
                    >
                      <line
                        x1={offsetStartX}
                        y1={offsetStartY}
                        x2={offsetEndX}
                        y2={offsetEndY}
                        stroke="transparent"
                        strokeWidth={getResponsiveSize(10, scale)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDimensionId(
                            selectedDimensionId === dimension.id
                              ? null
                              : dimension.id
                          );
                        }}
                        style={{ cursor: "pointer" }}
                      />

                      <line
                        x1={offsetStartX}
                        y1={offsetStartY}
                        x2={offsetEndX}
                        y2={offsetEndY}
                        stroke={isSelected ? "#2196F3" : "#000"}
                        strokeWidth={
                          isSelected
                            ? getResponsiveSize(1.5, scale)
                            : getResponsiveSize(0.8, scale)
                        }
                        markerStart="url(#dimensionArrowStart)"
                        markerEnd="url(#dimensionArrowEnd)"
                        pointerEvents="none"
                      />

                      <text
                        x={offsetMidX}
                        y={
                          offsetMidY +
                          (Math.abs(angle) < 45 || Math.abs(angle) > 135
                            ? getResponsiveSize(15, scale)
                            : getResponsiveSize(-10, scale))
                        }
                        fill={isSelected ? "#2196F3" : "#000"}
                        fontSize={getResponsiveSize(9, scale)}
                        fontWeight="500"
                        textAnchor="middle"
                        transform={`rotate(${angle > 90 || angle < -90 ? angle + 180 : angle
                          }, ${offsetMidX}, ${offsetMidY - getResponsiveSize(8, scale)
                          })`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDimensionId(
                            selectedDimensionId === dimension.id
                              ? null
                              : dimension.id
                          );
                        }}
                        style={{
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none",
                          cursor: "pointer",
                        }}
                      >
                        {formatImperialLength(coordToInches(dimension.distance / 10), unitSystem)}
                      </text>

                      {isSelected && (
                        <rect
                          x={
                            Math.min(offsetStartX, offsetEndX) -
                            getResponsiveSize(10, scale)
                          }
                          y={
                            Math.min(offsetStartY, offsetEndY) -
                            getResponsiveSize(10, scale)
                          }
                          width={
                            Math.abs(offsetEndX - offsetStartX) +
                            getResponsiveSize(20, scale)
                          }
                          height={
                            Math.abs(offsetEndY - offsetStartY) +
                            getResponsiveSize(20, scale)
                          }
                          fill="none"
                          stroke="#2196F3"
                          strokeWidth={getResponsiveSize(1, scale)}
                          strokeDasharray={`${getResponsiveSize(
                            3,
                            scale
                          )},${getResponsiveSize(3, scale)}`}
                          opacity="0.5"
                          pointerEvents="none"
                        />
                      )}
                    </g>
                  );
                })}
              {renderWallHighlights()}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
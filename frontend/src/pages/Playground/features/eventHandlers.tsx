// features/eventHandlers.tsx
import React, { useCallback, RefObject, useEffect } from "react";
import {
  handleMouseMove,
  handleTouchMove,
  handleMouseUp,
  handleTouchEnd,
  useNonPassiveTouchHandling,
} from "./resizing";
import {
  Label,
  FloorPlanObject,
  FloorPlanDoor,
  FloorPlanWindow,
} from "./types";

interface Point {
  x: number;
  z: number;
}

interface DragState {
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
  labels?: Label[];
  objects?: FloorPlanObject[];
  doors?: FloorPlanDoor[];
  windows?: FloorPlanWindow[];
}

let globalSelectedRoomType: string | null = null;

export function setGlobalSelectedRoomType(roomType: string | null) {
  globalSelectedRoomType = roomType;
}

export function getGlobalSelectedRoomType() {
  return globalSelectedRoomType;
}

export function useEventHandlers(
  dragState: DragState,
  svgRef: RefObject<SVGSVGElement>,
  scale: number,
  reverseTransformCoordinates: (
    x: number,
    y: number
  ) => { x: number; z: number },
  calculateRoomDimensions: (polygon: Point[]) => {
    width: number;
    height: number;
  },
  calculateRoomArea: (polygon: Point[]) => number,
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  checkAndUpdateOverlaps: () => boolean | void
) {
  useNonPassiveTouchHandling(svgRef);

  const handleMouseMoveCallback = useCallback(
    (event: MouseEvent) => {
      handleMouseMove(
        event,
        dragState,
        svgRef,
        scale,
        reverseTransformCoordinates,
        calculateRoomDimensions,
        calculateRoomArea,
        setFloorPlanData,
        setDragState,
        checkAndUpdateOverlaps
      );
    },
    [
      dragState,
      reverseTransformCoordinates,
      scale,
      calculateRoomDimensions,
      calculateRoomArea,
      setFloorPlanData,
      checkAndUpdateOverlaps,
    ]
  );

  const handleTouchMoveCallback = useCallback(
    (event: TouchEvent) => {
      handleTouchMove(
        event,
        dragState,
        svgRef,
        scale,
        reverseTransformCoordinates,
        calculateRoomDimensions,
        calculateRoomArea,
        setFloorPlanData,
        setDragState,
        checkAndUpdateOverlaps
      );
    },
    [
      dragState,
      reverseTransformCoordinates,
      scale,
      calculateRoomDimensions,
      calculateRoomArea,
      setFloorPlanData,
      checkAndUpdateOverlaps,
    ]
  );

  const handleMouseUpCallback = useCallback(() => {
    handleMouseUp(setDragState, checkAndUpdateOverlaps);
  }, [checkAndUpdateOverlaps, setDragState]);

  const handleTouchEndCallback = useCallback(() => {
    handleTouchEnd(setDragState, checkAndUpdateOverlaps);
  }, [checkAndUpdateOverlaps, setDragState]);

  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      if (
        dragState.active ||
        document.body.hasAttribute("data-room-touch-interaction") ||
        document.body.hasAttribute("data-label-touch-interaction") ||
        dragState.isLabelDragging ||
        dragState.isDoorDragging ||
        dragState.isWindowDragging
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventScroll);
    };
  }, [
    dragState.active,
    dragState.isLabelDragging,
    dragState.isDoorDragging,
    dragState.isWindowDragging,
  ]);

  useEffect(() => {
    if (dragState.active) {
      document.addEventListener("mousemove", handleMouseMoveCallback);
      document.addEventListener("mouseup", handleMouseUpCallback);

      document.addEventListener("touchmove", handleTouchMoveCallback, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEndCallback);
      document.addEventListener("touchcancel", handleTouchEndCallback);

      return () => {
        document.removeEventListener("mousemove", handleMouseMoveCallback);
        document.removeEventListener("mouseup", handleMouseUpCallback);
        document.removeEventListener("touchmove", handleTouchMoveCallback);
        document.removeEventListener("touchend", handleTouchEndCallback);
        document.removeEventListener("touchcancel", handleTouchEndCallback);
      };
    }
  }, [
    dragState.active,
    handleMouseMoveCallback,
    handleMouseUpCallback,
    handleTouchMoveCallback,
    handleTouchEndCallback,
  ]);

  return {
    handleMouseMoveCallback,
    handleTouchMoveCallback,
    handleMouseUpCallback,
    handleTouchEndCallback,
  };
}

let infoToolPanelActive = false;
let activeInfoOption: string | null = null;

export function setInfoToolPanelState(
  isActive: boolean,
  option: string | null
) {
  infoToolPanelActive = isActive;
  activeInfoOption = option;

  if (isActive && option === "setRoomtype") {
    document.body.classList.add("roomtype-mode");
  } else {
    document.body.classList.remove("roomtype-mode");
  }
}

export function getInfoToolPanelState() {
  return { isActive: infoToolPanelActive, activeOption: activeInfoOption };
}

export function handleRoomSelection(
  roomId: string,
  event: React.MouseEvent | React.TouchEvent,
  selectedRoomIds: string[],
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
  handleRoomTypeUpdate?: (roomId: string, roomType: string) => void,
  openProjectPanel?: (roomId: string) => void
) {
  event.stopPropagation();

  const infoPanelState = getInfoToolPanelState();

  if ("ctrlKey" in event) {
    const isMultiSelectMode = event.ctrlKey || event.metaKey;

    if (isMultiSelectMode) {
      setSelectedRoomIds((prev) => {
        if (prev.includes(roomId)) {
          return prev.filter((id) => id !== roomId);
        } else {
          return [...prev, roomId];
        }
      });
    } else {
      const isNewSelection =
        selectedRoomIds.length !== 1 || selectedRoomIds[0] !== roomId;

      setSelectedRoomIds([roomId]);

      if (isNewSelection && openProjectPanel) {
        openProjectPanel(roomId);
      }
    }
  } else if ("touches" in event) {
    if (selectedRoomIds.length > 0) {
      if (!selectedRoomIds.includes(roomId)) {
        setSelectedRoomIds([...selectedRoomIds, roomId]);

        if (openProjectPanel) {
          openProjectPanel(roomId);
        }
      }
    } else {
      setSelectedRoomIds([roomId]);

      if (openProjectPanel) {
        openProjectPanel(roomId);
      }
    }
  }
}

let isPlacingLabel = false;
let pendingLabelText: string | null = null;

export function setLabelPlacementState(
  isPlacing: boolean,
  text: string | null
) {
  isPlacingLabel = isPlacing;
  pendingLabelText = text;
}

export function getLabelPlacementState() {
  return { isPlacing: isPlacingLabel, text: pendingLabelText };
}

let isPlacingObject = false;
let pendingObjectPath: string | null = null;

export function setObjectPlacementState(
  isPlacing: boolean,
  objectPath: string | null
) {
  isPlacingObject = isPlacing;
  pendingObjectPath = objectPath;
}

export function getObjectPlacementState() {
  return { isPlacing: isPlacingObject, objectPath: pendingObjectPath };
}

let isPlacingDoor = false;
let pendingDoorPath: string | null = null;

export function setDoorPlacementState(
  isPlacing: boolean,
  doorPath: string | null
) {
  isPlacingDoor = isPlacing;
  pendingDoorPath = doorPath;
}

export function getDoorPlacementState() {
  return { isPlacing: isPlacingDoor, doorPath: pendingDoorPath };
}

let isPlacingWindow = false;
let pendingWindowPath: string | null = null;

export function setWindowPlacementState(
  isPlacing: boolean,
  windowPath: string | null
) {
  isPlacingWindow = isPlacing;
  pendingWindowPath = windowPath;
}

export function getWindowPlacementState() {
  return { isPlacing: isPlacingWindow, windowPath: pendingWindowPath };
}

let isPlacingCorner = false;

export function setCornerPlacementState(isPlacing: boolean) {
  isPlacingCorner = isPlacing;

  if (isPlacing) {
    setInfoToolPanelState(true, "addCorner");
    document.body.setAttribute("data-corner-placement-active", "true");
  } else {
    setInfoToolPanelState(false, null);
    document.body.removeAttribute("data-corner-placement-active");
  }
}

export function getCornerPlacementState() {
  return { isPlacing: isPlacingCorner };
}

export function getClosestPointOnLineSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
) {
  const A = point.x - lineStart.x;
  const B = point.z - lineStart.z;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.z - lineStart.z;

  const dot = A * C + B * D;
  const lenSquared = C * C + D * D;

  if (lenSquared === 0) return { ...lineStart, param: 0 };

  let param = dot / lenSquared;
  param = Math.max(0, Math.min(1, param));

  return {
    x: lineStart.x + param * C,
    z: lineStart.z + param * D,
    param: param,
  };
}

export function addCornerToRoom(
  roomId: string,
  clickPoint: Point,
  floorPlanData: FloorPlanData,
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  captureStateBeforeChange: () => void,
  hasChanges: boolean,
  captureOriginalState: () => void,
  calculateRoomAreaFn: (polygon: Point[]) => number,
  calculateRoomDimensionsFn: (polygon: Point[]) => {
    width: number;
    height: number;
  }
): boolean {
  const room = floorPlanData.rooms.find((r: Room) => r.id === roomId);
  if (!room || room.room_type === "Wall" || room.floor_polygon.length < 3) {
    console.log("Cannot add corner to this room");
    return false;
  }

  let closestDistance = Infinity;
  let closestSegmentIndex = -1;
  let closestPoint: Point | null = null;
  let insertParam = 0;

  for (let i = 0; i < room.floor_polygon.length; i++) {
    const startPoint = room.floor_polygon[i];
    const endPoint = room.floor_polygon[(i + 1) % room.floor_polygon.length];

    const result = getClosestPointOnLineSegment(
      clickPoint,
      startPoint,
      endPoint
    );
    const distance = Math.sqrt(
      Math.pow(result.x - clickPoint.x, 2) +
      Math.pow(result.z - clickPoint.z, 2)
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestSegmentIndex = i;
      closestPoint = { x: result.x, z: result.z };
      insertParam = result.param;
    }
  }

  const maxDistance = 3.0;
  if (closestDistance > maxDistance || !closestPoint) {
    console.log("Click too far from any wall");
    return false;
  }

  const minDistanceFromVertices = 0.3;
  const startVertex = room.floor_polygon[closestSegmentIndex];
  const endVertex =
    room.floor_polygon[(closestSegmentIndex + 1) % room.floor_polygon.length];

  const distanceFromStart = Math.sqrt(
    Math.pow(closestPoint.x - startVertex.x, 2) +
    Math.pow(closestPoint.z - startVertex.z, 2)
  );
  const distanceFromEnd = Math.sqrt(
    Math.pow(closestPoint.x - endVertex.x, 2) +
    Math.pow(closestPoint.z - endVertex.z, 2)
  );

  if (
    distanceFromStart < minDistanceFromVertices ||
    distanceFromEnd < minDistanceFromVertices
  ) {
    console.log("New corner too close to existing vertices");
    return false;
  }

  if (!hasChanges) {
    captureOriginalState();
  }
  captureStateBeforeChange();

  setFloorPlanData((prevData) => {
    const updatedRooms = prevData.rooms.map((r) => {
      if (r.id === roomId) {
        const newPolygon = [...r.floor_polygon];
        newPolygon.splice(closestSegmentIndex + 1, 0, closestPoint!);

        return {
          ...r,
          floor_polygon: newPolygon,
        };
      }
      return r;
    });

    const totalArea = updatedRooms.reduce((sum, room) => {
      if (room.room_type !== "Wall") {
        return sum + room.area;
      }
      return sum;
    }, 0);

    return {
      ...prevData,
      rooms: updatedRooms,
      total_area: parseFloat(totalArea.toFixed(2)),
    };
  });

  setHasChanges(true);
  return true;
}

export function handleLabelMouseDown(
  event: React.MouseEvent,
  labelId: string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  label: Label,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
) {
  event.stopPropagation();
  event.preventDefault();

  if (!svgRef.current) return;

  const rect = svgRef.current.getBoundingClientRect();
  const startX = event.clientX - rect.left;
  const startY = event.clientY - rect.top;

  setDragState({
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
    isLabelDragging: true,
    labelId: labelId,
    initialLabelPosition: { ...label.position },
  });

  setHasChanges(true);
}

export function handleLabelTouchStart(
  event: React.TouchEvent,
  labelId: string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  label: Label,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
) {
  event.stopPropagation();

  if (!svgRef.current) return;

  const touch = event.touches[0];
  const rect = svgRef.current.getBoundingClientRect();
  const startX = touch.clientX - rect.left;
  const startY = touch.clientY - rect.top;

  setDragState({
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
    isLabelDragging: true,
    labelId: labelId,
    initialLabelPosition: { ...label.position },
  });

  document.body.setAttribute("data-label-touch-interaction", "true");
  setHasChanges(true);
}

export function handleObjectMouseDown(
  event: React.MouseEvent,
  objectId: string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  object: FloorPlanObject,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
) {
  event.stopPropagation();
  event.preventDefault();

  if (!svgRef.current) return;

  const rect = svgRef.current.getBoundingClientRect();
  const startX = event.clientX - rect.left;
  const startY = event.clientY - rect.top;

  setDragState({
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
    isObjectDragging: true,
    objectId: objectId,
    initialObjectPosition: { ...object.position },
  });

  setHasChanges(true);
}

export function handleObjectTouchStart(
  event: React.TouchEvent,
  objectId: string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  object: FloorPlanObject,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
) {
  event.stopPropagation();

  if (!svgRef.current) return;

  const touch = event.touches[0];
  const rect = svgRef.current.getBoundingClientRect();
  const startX = touch.clientX - rect.left;
  const startY = touch.clientY - rect.top;

  setDragState({
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
    isObjectDragging: true,
    objectId: objectId,
    initialObjectPosition: { ...object.position },
  });

  document.body.setAttribute("data-object-touch-interaction", "true");
  setHasChanges(true);
}

export function handleDoorMouseDown(
  event: React.MouseEvent,
  doorId: string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  door: FloorPlanDoor,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
) {
  event.stopPropagation();
  event.preventDefault();

  if (!svgRef.current) return;

  const rect = svgRef.current.getBoundingClientRect();
  const startX = event.clientX - rect.left;
  const startY = event.clientY - rect.top;

  setDragState({
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
    doorId: doorId,
    initialDoorPosition: { ...door.position },
  });

  setHasChanges(true);
}

export function handleDoorTouchStart(
  event: React.TouchEvent,
  doorId: string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  door: FloorPlanDoor,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
) {
  event.stopPropagation();

  if (!svgRef.current) return;

  const touch = event.touches[0];
  const rect = svgRef.current.getBoundingClientRect();
  const startX = touch.clientX - rect.left;
  const startY = touch.clientY - rect.top;

  setDragState({
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
    doorId: doorId,
    initialDoorPosition: { ...door.position },
  });

  document.body.setAttribute("data-door-touch-interaction", "true");
  setHasChanges(true);
}

export function handleWindowMouseDown(
  event: React.MouseEvent,
  windowId: string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  window: FloorPlanWindow,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
) {
  event.stopPropagation();
  event.preventDefault();

  if (!svgRef.current) return;

  const rect = svgRef.current.getBoundingClientRect();
  const startX = event.clientX - rect.left;
  const startY = event.clientY - rect.top;

  setDragState({
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
    isWindowDragging: true,
    windowId: windowId,
    initialWindowPosition: { ...window.position },
  });

  setHasChanges(true);
}

export function handleWindowTouchStart(
  event: React.TouchEvent,
  windowId: string,
  svgRef: React.RefObject<SVGSVGElement | null>,
  window: FloorPlanWindow,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>
) {
  event.stopPropagation();

  if (!svgRef.current) return;

  const touch = event.touches[0];
  const rect = svgRef.current.getBoundingClientRect();
  const startX = touch.clientX - rect.left;
  const startY = touch.clientY - rect.top;

  setDragState({
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
    isWindowDragging: true,
    windowId: windowId,
    initialWindowPosition: { ...window.position },
  });

  document.body.setAttribute("data-window-touch-interaction", "true");
  setHasChanges(true);
}

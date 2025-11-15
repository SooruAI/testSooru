import React, { useState, useCallback, RefObject, useEffect } from "react";
import { Label, FloorPlanObject, FloorPlanDoor, FloorPlanWindow } from "./types";

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
  labels?: Label[];
  objects?: FloorPlanObject[];
  doors?: FloorPlanDoor[];
  windows?: FloorPlanWindow[];
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

type SVGRef = RefObject<SVGSVGElement | null>;

export function showLongPressIndicator(roomId: string, show: boolean) {
  const roomElement = document.getElementById(roomId);
  if (roomElement) {
    if (show) {
      roomElement.classList.add("long-press-highlight");
    } else {
      roomElement.classList.remove("long-press-highlight");
    }
  }
}

export function useNonPassiveTouchHandling(svgRef: SVGRef) {
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (
        e.target &&
        ((e.target as HTMLElement).classList.contains("resize-handle") ||
          (e.target as HTMLElement).classList.contains("resize-edge") ||
          (e.target as HTMLElement).classList.contains("room-polygon"))
      ) {
        e.preventDefault();
        document.body.setAttribute("data-room-touch-interaction", "true");
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (document.body.hasAttribute("data-room-touch-interaction")) {
        e.preventDefault();
      }
    };

    svgElement.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      svgElement.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [svgRef]);
}

export function handleMouseDown(
  event: React.MouseEvent,
  roomId: string,
  svgRef: SVGRef,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
  selectedRoomIds: string[]
) {
  event.stopPropagation();

  if (event.button !== 0) return;

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();
  const mouseX = event.clientX - svgRect.left;
  const mouseY = event.clientY - svgRect.top;

  if (!selectedRoomIds.includes(roomId) && !(event.ctrlKey || event.metaKey)) {
    setSelectedRoomIds([roomId]);
  }

  setDragState({
    active: true,
    roomId,
    roomIds: selectedRoomIds.includes(roomId) ? selectedRoomIds : [roomId],
    vertexIndex: null,
    edgeIndices: null,
    startX: mouseX,
    startY: mouseY,
    lastX: mouseX,
    lastY: mouseY,
    isResizing: false,
    isEdgeResizing: false,
    isGroupOperation:
      selectedRoomIds.length > 1 && selectedRoomIds.includes(roomId),
  });

  setHasChanges(true);
}

export function handleVertexMouseDown(
  event: React.MouseEvent,
  roomId: string,
  vertexIndex: number,
  svgRef: SVGRef,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
  selectedRoomIds: string[],
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  floorPlanData: FloorPlanData
) {
  event.stopPropagation();

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();
  const mouseX = event.clientX - svgRect.left;
  const mouseY = event.clientY - svgRect.top;

  const initialPolygons: Record<string, Point[]> = {};
  const roomIds = selectedRoomIds.includes(roomId) ? selectedRoomIds : [roomId];

  roomIds.forEach((id) => {
    const room = floorPlanData.rooms.find((r) => r.id === id);
    if (room) {
      initialPolygons[id] = [...room.floor_polygon];
    }
  });

  setDragState({
    active: true,
    roomId,
    roomIds,
    vertexIndex,
    edgeIndices: null,
    startX: mouseX,
    startY: mouseY,
    lastX: mouseX,
    lastY: mouseY,
    isResizing: true,
    isEdgeResizing: false,
    isGroupOperation:
      selectedRoomIds.length > 1 && selectedRoomIds.includes(roomId),
    initialPolygons,
  });

  if (!selectedRoomIds.includes(roomId)) {
    setSelectedRoomIds([roomId]);
  }

  setHasChanges(true);
}

export function handleEdgeMouseDown(
  event: React.MouseEvent,
  roomId: string,
  edgeIndices: number[],
  svgRef: SVGRef,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
  selectedRoomIds: string[],
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  floorPlanData: FloorPlanData
) {
  event.stopPropagation();

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();
  const mouseX = event.clientX - svgRect.left;
  const mouseY = event.clientY - svgRect.top;

  const initialPolygons: Record<string, Point[]> = {};
  const roomIds = selectedRoomIds.includes(roomId) ? selectedRoomIds : [roomId];

  roomIds.forEach((id) => {
    const room = floorPlanData.rooms.find((r) => r.id === id);
    if (room) {
      initialPolygons[id] = [...room.floor_polygon];
    }
  });

  setDragState({
    active: true,
    roomId,
    roomIds,
    vertexIndex: null,
    edgeIndices,
    startX: mouseX,
    startY: mouseY,
    lastX: mouseX,
    lastY: mouseY,
    isResizing: true,
    isEdgeResizing: true,
    isGroupOperation:
      selectedRoomIds.length > 1 && selectedRoomIds.includes(roomId),
    initialPolygons,
  });

  if (!selectedRoomIds.includes(roomId)) {
    setSelectedRoomIds([roomId]);
  }

  setHasChanges(true);
}

export function handleTouchStart(
  event: React.TouchEvent,
  roomId: string,
  svgRef: SVGRef,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
  selectedRoomIds: string[]
) {
  event.stopPropagation();

  if (event.touches.length !== 1) return;

  document.body.setAttribute("data-room-touch-interaction", "true");

  const touch = event.touches[0];
  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();
  const touchX = touch.clientX - svgRect.left;
  const touchY = touch.clientY - svgRect.top;

  if (selectedRoomIds.length > 0) {
    if (!selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds([...selectedRoomIds, roomId]);
    }
  } else {
    setSelectedRoomIds([roomId]);
  }

  setDragState({
    active: true,
    roomId,
    roomIds: selectedRoomIds.includes(roomId) ? selectedRoomIds : [roomId],
    vertexIndex: null,
    edgeIndices: null,
    startX: touchX,
    startY: touchY,
    lastX: touchX,
    lastY: touchY,
    isResizing: false,
    isEdgeResizing: false,
    isGroupOperation:
      selectedRoomIds.length > 1 && selectedRoomIds.includes(roomId),
  });

  setHasChanges(true);
}

export function handleVertexTouchStart(
  event: React.TouchEvent,
  roomId: string,
  vertexIndex: number,
  svgRef: SVGRef,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
  selectedRoomIds: string[],
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  floorPlanData: FloorPlanData
) {
  event.stopPropagation();

  if (event.touches.length !== 1) return;

  document.body.setAttribute("data-room-touch-interaction", "true");

  const touch = event.touches[0];
  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();
  const touchX = touch.clientX - svgRect.left;
  const touchY = touch.clientY - svgRect.top;

  const initialPolygons: Record<string, Point[]> = {};
  const roomIds = selectedRoomIds.includes(roomId) ? selectedRoomIds : [roomId];

  roomIds.forEach((id) => {
    const room = floorPlanData.rooms.find((r) => r.id === id);
    if (room) {
      initialPolygons[id] = [...room.floor_polygon];
    }
  });

  setDragState({
    active: true,
    roomId,
    roomIds,
    vertexIndex,
    edgeIndices: null,
    startX: touchX,
    startY: touchY,
    lastX: touchX,
    lastY: touchY,
    isResizing: true,
    isEdgeResizing: false,
    isGroupOperation:
      selectedRoomIds.length > 1 && selectedRoomIds.includes(roomId),
    initialPolygons,
  });

  if (!selectedRoomIds.includes(roomId)) {
    setSelectedRoomIds([roomId]);
  }

  setHasChanges(true);
}

export function handleEdgeTouchStart(
  event: React.TouchEvent,
  roomId: string,
  edgeIndices: number[],
  svgRef: SVGRef,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
  selectedRoomIds: string[],
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  floorPlanData: FloorPlanData
) {
  event.stopPropagation();

  if (event.touches.length !== 1) return;

  document.body.setAttribute("data-room-touch-interaction", "true");

  const touch = event.touches[0];
  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();
  const touchX = touch.clientX - svgRect.left;
  const touchY = touch.clientY - svgRect.top;

  const initialPolygons: Record<string, Point[]> = {};
  const roomIds = selectedRoomIds.includes(roomId) ? selectedRoomIds : [roomId];

  roomIds.forEach((id) => {
    const room = floorPlanData.rooms.find((r) => r.id === id);
    if (room) {
      initialPolygons[id] = [...room.floor_polygon];
    }
  });

  setDragState({
    active: true,
    roomId,
    roomIds,
    vertexIndex: null,
    edgeIndices,
    startX: touchX,
    startY: touchY,
    lastX: touchX,
    lastY: touchY,
    isResizing: true,
    isEdgeResizing: true,
    isGroupOperation:
      selectedRoomIds.length > 1 && selectedRoomIds.includes(roomId),
    initialPolygons,
  });

  if (!selectedRoomIds.includes(roomId)) {
    setSelectedRoomIds([roomId]);
  }

  setHasChanges(true);
}

export function getEdgeMidpoint(point1: Point, point2: Point): Point {
  return {
    x: (point1.x + point2.x) / 2,
    z: (point1.z + point2.z) / 2,
  };
}

export function getEdgeNormal(
  point1: Point,
  point2: Point
): { x: number; z: number } {
  const dx = point2.x - point1.x;
  const dz = point2.z - point1.z;

  const length = Math.sqrt(dx * dx + dz * dz);
  if (length === 0) return { x: 0, z: 0 };

  return {
    x: -dz / length,
    z: dx / length,
  };
}

export function updateLabelDragPosition(
  event: MouseEvent | TouchEvent,
  dragState: DragState,
  svgRef: SVGRef,
  scale: number,
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) {
  if (
    !dragState.active ||
    !dragState.isLabelDragging ||
    !dragState.labelId ||
    !dragState.initialLabelPosition
  ) {
    return;
  }

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();

  let cursorX: number;
  let cursorY: number;

  if ("clientX" in event) {
    cursorX = event.clientX - svgRect.left;
    cursorY = event.clientY - svgRect.top;
  } else {
    const touch = event.touches[0];
    cursorX = touch.clientX - svgRect.left;
    cursorY = touch.clientY - svgRect.top;
  }

  const deltaX = cursorX - dragState.lastX;
  const deltaY = cursorY - dragState.lastY;

  const scaledDeltaX = deltaX / scale;
  const scaledDeltaY = deltaY / scale;

  setFloorPlanData((prevData) => {
    const updatedLabels = (prevData.labels || []).map((label) => {
      if (label.id === dragState.labelId) {
        return {
          ...label,
          position: {
            x: label.position.x + scaledDeltaX,
            z: label.position.z + scaledDeltaY,
          },
        };
      }
      return label;
    });
    return {
      ...prevData,
      labels: updatedLabels,
    };
  });

  setDragState((prev) => ({
    ...prev,
    lastX: cursorX,
    lastY: cursorY,
  }));
}

export function updateObjectDragPosition(
  event: MouseEvent | TouchEvent,
  dragState: DragState,
  svgRef: SVGRef,
  scale: number,
  reverseTransformCoordinates: (x: number, y: number) => { x: number; z: number },
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) {
  if (
    !dragState.active ||
    !dragState.isObjectDragging ||
    !dragState.objectId ||
    !dragState.initialObjectPosition
  ) {
    return;
  }

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();

  let cursorX: number;
  let cursorY: number;

  if ("clientX" in event) {
    cursorX = event.clientX - svgRect.left;
    cursorY = event.clientY - svgRect.top;
  } else {
    const touch = event.touches[0];
    cursorX = touch.clientX - svgRect.left;
    cursorY = touch.clientY - svgRect.top;
  }

  const newPosition = reverseTransformCoordinates(cursorX, cursorY);

  setFloorPlanData((prevData) => {
    const updatedObjects = (prevData.objects || []).map((obj) => {
      if (obj.id === dragState.objectId) {
        return {
          ...obj,
          position: newPosition,
        };
      }
      return obj;
    });
    return {
      ...prevData,
      objects: updatedObjects,
    };
  });

  setDragState((prev) => ({
    ...prev,
    lastX: cursorX,
    lastY: cursorY,
  }));
}

export function updateDoorDragPosition(
  event: MouseEvent | TouchEvent,
  dragState: DragState,
  svgRef: SVGRef,
  scale: number,
  reverseTransformCoordinates: (x: number, y: number) => { x: number; z: number },
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) {
  if (
    !dragState.active ||
    !dragState.isDoorDragging ||
    !dragState.doorId ||
    !dragState.initialDoorPosition
  ) {
    return;
  }

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();

  let cursorX: number;
  let cursorY: number;

  if ("clientX" in event) {
    cursorX = event.clientX - svgRect.left;
    cursorY = event.clientY - svgRect.top;
  } else {
    const touch = event.touches[0];
    cursorX = touch.clientX - svgRect.left;
    cursorY = touch.clientY - svgRect.top;
  }

  const newPosition = reverseTransformCoordinates(cursorX, cursorY);

  setFloorPlanData((prevData) => {
    const updatedDoors = (prevData.doors || []).map((door) => {
      if (door.id === dragState.doorId) {
        return {
          ...door,
          position: newPosition,
        };
      }
      return door;
    });
    return {
      ...prevData,
      doors: updatedDoors,
    };
  });

  setDragState((prev) => ({
    ...prev,
    lastX: cursorX,
    lastY: cursorY,
  }));
}

export function updateWindowDragPosition(
  event: MouseEvent | TouchEvent,
  dragState: DragState,
  svgRef: SVGRef,
  scale: number,
  reverseTransformCoordinates: (x: number, y: number) => { x: number; z: number },
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) {
  if (
    !dragState.active ||
    !dragState.isWindowDragging ||
    !dragState.windowId ||
    !dragState.initialWindowPosition
  ) {
    return;
  }

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();

  let cursorX: number;
  let cursorY: number;

  if ("clientX" in event) {
    cursorX = event.clientX - svgRect.left;
    cursorY = event.clientY - svgRect.top;
  } else {
    const touch = event.touches[0];
    cursorX = touch.clientX - svgRect.left;
    cursorY = touch.clientY - svgRect.top;
  }

  const newPosition = reverseTransformCoordinates(cursorX, cursorY);

  setFloorPlanData((prevData) => {
    const updatedWindows = (prevData.windows || []).map((window) => {
      if (window.id === dragState.windowId) {
        return {
          ...window,
          position: newPosition,
        };
      }
      return window;
    });
    return {
      ...prevData,
      windows: updatedWindows,
    };
  });

  setDragState((prev) => ({
    ...prev,
    lastX: cursorX,
    lastY: cursorY,
  }));
}

export function handleMouseMove(
  event: MouseEvent,
  dragState: DragState,
  svgRef: SVGRef,
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
  checkAndUpdateOverlaps?: () => boolean | void
) {
  if (!dragState.active) return;

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();
  const mouseX = event.clientX - svgRect.left;
  const mouseY = event.clientY - svgRect.top;

  const deltaX = mouseX - dragState.lastX;
  const deltaY = mouseY - dragState.lastY;

  if (
    dragState.isLabelDragging &&
    dragState.labelId &&
    dragState.initialLabelPosition
  ) {
    updateLabelDragPosition(
      event,
      dragState,
      svgRef,
      scale,
      setFloorPlanData,
      setDragState
    );
    return;
  }

  if (
    dragState.isObjectDragging &&
    dragState.objectId &&
    dragState.initialObjectPosition
  ) {
    updateObjectDragPosition(
      event,
      dragState,
      svgRef,
      scale,
      reverseTransformCoordinates,
      setFloorPlanData,
      setDragState
    );
    return;
  }

  if (
    dragState.isDoorDragging &&
    dragState.doorId &&
    dragState.initialDoorPosition
  ) {
    updateDoorDragPosition(
      event,
      dragState,
      svgRef,
      scale,
      reverseTransformCoordinates,
      setFloorPlanData,
      setDragState
    );
    return;
  }

  if (
    dragState.isWindowDragging &&
    dragState.windowId &&
    dragState.initialWindowPosition
  ) {
    updateWindowDragPosition(
      event,
      dragState,
      svgRef,
      scale,
      reverseTransformCoordinates,
      setFloorPlanData,
      setDragState
    );
    return;
  }

  if (!dragState.roomId) return;

  const totalDeltaX = mouseX - dragState.startX;
  const totalDeltaY = mouseY - dragState.startY;

  if (!dragState.isResizing) {
    updateMultipleRoomPositions(
      dragState,
      mouseX,
      mouseY,
      deltaX,
      deltaY,
      scale,
      reverseTransformCoordinates,
      calculateRoomDimensions,
      calculateRoomArea,
      setFloorPlanData,
      setDragState
    );
  } else if (dragState.isGroupOperation && dragState.initialPolygons) {
    updateGroupRoomResize(
      dragState,
      mouseX,
      mouseY,
      totalDeltaX,
      totalDeltaY,
      scale,
      reverseTransformCoordinates,
      calculateRoomDimensions,
      calculateRoomArea,
      setFloorPlanData,
      setDragState
    );
  } else {
    updateRoomResize(
      dragState,
      mouseX,
      mouseY,
      deltaX,
      deltaY,
      scale,
      reverseTransformCoordinates,
      calculateRoomDimensions,
      calculateRoomArea,
      setFloorPlanData,
      setDragState
    );
  }
  if (checkAndUpdateOverlaps) {
    checkAndUpdateOverlaps();
  }
}

export function handleTouchMove(
  event: TouchEvent,
  dragState: DragState,
  svgRef: SVGRef,
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
  checkAndUpdateOverlaps?: () => boolean | void
) {
  if (!dragState.active) return;

  event.preventDefault();
  event.stopPropagation();

  if (
    dragState.isLabelDragging &&
    dragState.labelId &&
    dragState.initialLabelPosition
  ) {
    updateLabelDragPosition(
      event,
      dragState,
      svgRef,
      scale,
      setFloorPlanData,
      setDragState
    );
    return;
  }

  if (
    dragState.isObjectDragging &&
    dragState.objectId &&
    dragState.initialObjectPosition
  ) {
    updateObjectDragPosition(
      event,
      dragState,
      svgRef,
      scale,
      reverseTransformCoordinates,
      setFloorPlanData,
      setDragState
    );
    return;
  }

  if (
    dragState.isDoorDragging &&
    dragState.doorId &&
    dragState.initialDoorPosition
  ) {
    updateDoorDragPosition(
      event,
      dragState,
      svgRef,
      scale,
      reverseTransformCoordinates,
      setFloorPlanData,
      setDragState
    );
    return;
  }

  if (
    dragState.isWindowDragging &&
    dragState.windowId &&
    dragState.initialWindowPosition
  ) {
    updateWindowDragPosition(
      event,
      dragState,
      svgRef,
      scale,
      reverseTransformCoordinates,
      setFloorPlanData,
      setDragState
    );
    return;
  }

  const touch = event.touches[0];

  const initialTouchX = touch.clientX;
  const initialTouchY = touch.clientY;
  const initialDeltaX = initialTouchX - dragState.startX;
  const initialDeltaY = initialTouchY - dragState.startY;

  if (event.touches.length !== 1) return;

  const svgElement = svgRef.current;
  if (!svgElement) return;

  const svgRect = svgElement.getBoundingClientRect();
  const touchX = touch.clientX - svgRect.left;
  const touchY = touch.clientY - svgRect.top;

  const deltaX = touchX - dragState.lastX;
  const deltaY = touchY - dragState.lastY;

  const totalDeltaX = touchX - dragState.startX;
  const totalDeltaY = touchY - dragState.startY;

  if (Math.abs(deltaX) < 0.1 && Math.abs(deltaY) < 0.1) return;

  if (!dragState.isResizing) {
    updateMultipleRoomPositions(
      dragState,
      touchX,
      touchY,
      deltaX,
      deltaY,
      scale,
      reverseTransformCoordinates,
      calculateRoomDimensions,
      calculateRoomArea,
      setFloorPlanData,
      setDragState
    );
  } else if (dragState.isGroupOperation && dragState.initialPolygons) {
    updateGroupRoomResize(
      dragState,
      touchX,
      touchY,
      totalDeltaX,
      totalDeltaY,
      scale,
      reverseTransformCoordinates,
      calculateRoomDimensions,
      calculateRoomArea,
      setFloorPlanData,
      setDragState
    );
  } else {
    updateRoomResize(
      dragState,
      touchX,
      touchY,
      deltaX,
      deltaY,
      scale,
      reverseTransformCoordinates,
      calculateRoomDimensions,
      calculateRoomArea,
      setFloorPlanData,
      setDragState
    );
  }
  if (checkAndUpdateOverlaps) {
    checkAndUpdateOverlaps();
  }
}

function updateRoomResize(
  dragState: DragState,
  cursorX: number,
  cursorY: number,
  deltaX: number,
  deltaY: number,
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
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) {
  setFloorPlanData((prevData) => {
    const updatedRooms = [...prevData.rooms];
    const roomIndex = updatedRooms.findIndex(
      (room) => room.id === dragState.roomId
    );

    if (roomIndex === -1) return prevData;

    const room = { ...updatedRooms[roomIndex] };
    const updatedPolygon = [...room.floor_polygon];

    if (dragState.vertexIndex !== null) {
  const vertexIndex = dragState.vertexIndex;
  let point = reverseTransformCoordinates(cursorX, cursorY);
  
  // Snap to grid (10 units = 1 foot)
  // Snap to nearest 5 units (0.5 feet / 6 inches)
  const snapThreshold = 5; // snap to 0.5 feet (6 inches)
  point = {
    x: Math.round(point.x / snapThreshold) * snapThreshold,
    z: Math.round(point.z / snapThreshold) * snapThreshold,
  };
  
  updatedPolygon[vertexIndex] = point;
}else if (dragState.isEdgeResizing && dragState.edgeIndices) {
      const [idx1, idx2] = dragState.edgeIndices;

      const vertex1 = updatedPolygon[idx1];
      const vertex2 = updatedPolygon[idx2];

      const normal = getEdgeNormal(vertex1, vertex2);

      const cursorPoint = reverseTransformCoordinates(cursorX, cursorY);
      const prevCursorPoint = reverseTransformCoordinates(
        dragState.lastX,
        dragState.lastY
      );
      const movementX = cursorPoint.x - prevCursorPoint.x;
      const movementZ = cursorPoint.z - prevCursorPoint.z;

      const movementAlongNormal = movementX * normal.x + movementZ * normal.z;

      updatedPolygon[idx1] = {
        x: vertex1.x + normal.x * movementAlongNormal,
        z: vertex1.z + normal.z * movementAlongNormal,
      };

      updatedPolygon[idx2] = {
        x: vertex2.x + normal.x * movementAlongNormal,
        z: vertex2.z + normal.z * movementAlongNormal,
      };
    }

    const dimensions = calculateRoomDimensions(updatedPolygon);
    const area = calculateRoomArea(updatedPolygon);

    room.floor_polygon = updatedPolygon;
    room.width = dimensions.width;
    room.height = dimensions.height;
    room.area = area;

    updatedRooms[roomIndex] = room;

    const totalArea = updatedRooms.reduce((sum, room) => sum + room.area, 0);

    return {
      ...prevData,
      rooms: updatedRooms,
      total_area: parseFloat(totalArea.toFixed(2)),
    };
  });

  setDragState((prev) => ({
    ...prev,
    lastX: cursorX,
    lastY: cursorY,
  }));
}

export function handleMouseUp(
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  checkAndUpdateOverlaps: () => boolean | void
) {
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
    initialPolygons: undefined,
    isLabelDragging: false,
    labelId: null,
    initialLabelPosition: undefined,
    isObjectDragging: false,
    objectId: null,
    initialObjectPosition: undefined,
  });

  checkAndUpdateOverlaps();
}

export function renderEdgeHandles(
  room: Room,
  transformCoordinates: (point: Point) => { x: number; y: number },
  handleEdgeMouseDown: (
    event: React.MouseEvent,
    roomId: string,
    edgeIndices: number[],
    svgRef: RefObject<SVGSVGElement | null>,
    setDragState: React.Dispatch<React.SetStateAction<DragState>>,
    setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
    selectedRoomIds: string[],
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
    floorPlanData: FloorPlanData
  ) => void,
  handleEdgeTouchStart: (
    event: React.TouchEvent,
    roomId: string,
    edgeIndices: number[],
    svgRef: RefObject<SVGSVGElement | null>,
    setDragState: React.Dispatch<React.SetStateAction<DragState>>,
    setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
    selectedRoomIds: string[],
    setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
    floorPlanData: FloorPlanData
  ) => void,
  svgRef: RefObject<SVGSVGElement | null>,
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>,
  selectedRoomIds: string[],
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  isMobile: boolean,
  floorPlanData: FloorPlanData
) {
  const edgeHandles = [];
  const polygon = room.floor_polygon;
  const transformedPolygon = polygon.map(transformCoordinates);

  for (let i = 0; i < polygon.length; i++) {
    const nextIndex = (i + 1) % polygon.length;
    const point1 = transformedPolygon[i];
    const point2 = transformedPolygon[nextIndex];

    const midX = (point1.x + point2.x) / 2;
    const midY = (point1.y + point2.y) / 2;

    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;

    const edgeLength = Math.sqrt(dx * dx + dy * dy);

    if (edgeLength < 15) continue;

    const dirX = dx / edgeLength;
    const dirY = dy / edgeLength;

    const handleWidth = Math.min(edgeLength * 0.9, isMobile ? 60 : 40);

    const x1 = midX - (handleWidth / 2) * dirX;
    const y1 = midY - (handleWidth / 2) * dirY;
    const x2 = midX + (handleWidth / 2) * dirX;
    const y2 = midY + (handleWidth / 2) * dirY;

    edgeHandles.push(
      <line
        key={`edge-handle-${room.id}-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className="resize-edge"
        strokeWidth={isMobile ? 30 : 16}
        stroke="rgba(0,0,255,0.2)"
        strokeLinecap="round"
        onMouseDown={(e) =>
          handleEdgeMouseDown(
            e,
            room.id,
            [i, nextIndex],
            svgRef,
            setDragState,
            setSelectedRoomIds,
            selectedRoomIds,
            setHasChanges,
            floorPlanData
          )
        }
        onTouchStart={(e) =>
          handleEdgeTouchStart(
            e,
            room.id,
            [i, nextIndex],
            svgRef,
            setDragState,
            setSelectedRoomIds,
            selectedRoomIds,
            setHasChanges,
            floorPlanData
          )
        }
      />
    );

    edgeHandles.push(
      <line
        key={`edge-indicator-${room.id}-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className="edge-indicator"
        strokeWidth={isMobile ? 3 : 4}
        strokeDasharray={isMobile ? "2,2" : "3,3"}
        stroke="rgba(0,0,0,0.6)"
        strokeLinecap="round"
        pointerEvents="none"
      />
    );
  }

  return edgeHandles;
}

export function handleTouchEnd(
  setDragState: React.Dispatch<React.SetStateAction<DragState>>,
  checkAndUpdateOverlaps: () => boolean | void
) {
  document.body.removeAttribute("data-room-touch-interaction");
  document.body.removeAttribute("data-label-touch-interaction");
  document.body.removeAttribute("data-object-touch-interaction");

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
    initialPolygons: undefined,
    isLabelDragging: false,
    labelId: null,
    initialLabelPosition: undefined,
    isObjectDragging: false,
    objectId: null,
    initialObjectPosition: undefined,
  });

  checkAndUpdateOverlaps();
}

function updateMultipleRoomPositions(
  dragState: DragState,
  cursorX: number,
  cursorY: number,
  deltaX: number,
  deltaY: number,
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
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) {
  setFloorPlanData((prevData) => {
    const updatedRooms = [...prevData.rooms];
    const roomsToUpdate = dragState.roomIds;
    const point1 = reverseTransformCoordinates(0, 0);
    const point2 = reverseTransformCoordinates(deltaX, deltaY);

    const floorPlanDeltaX = point2.x - point1.x;
    const floorPlanDeltaZ = point2.z - point1.z;
    const originalRooms = [...prevData.rooms];

    for (const roomId of roomsToUpdate) {
      const roomIndex = updatedRooms.findIndex((room) => room.id === roomId);
      if (roomIndex === -1) continue;

      const room = { ...updatedRooms[roomIndex] };
      const updatedPolygon = [...room.floor_polygon];
      for (let i = 0; i < updatedPolygon.length; i++) {
        updatedPolygon[i] = {
          x: updatedPolygon[i].x + floorPlanDeltaX,
          z: updatedPolygon[i].z + floorPlanDeltaZ,
        };
      }

      room.floor_polygon = updatedPolygon;
      updatedRooms[roomIndex] = room;
    }

    const updatedDoors = (prevData.doors || []).map((door) => {
      const doorRoom = findRoomContainingPoint(door.position, originalRooms);
      if (doorRoom && roomsToUpdate.includes(doorRoom.id)) {
        return {
          ...door,
          position: {
            x: door.position.x + floorPlanDeltaX,
            z: door.position.z + floorPlanDeltaZ,
          },
        };
      }
      return door;
    });

    const updatedWindows = (prevData.windows || []).map((window) => {
      const windowRoom = findRoomContainingPoint(window.position, originalRooms);
      if (windowRoom && roomsToUpdate.includes(windowRoom.id)) {
        return {
          ...window,
          position: {
            x: window.position.x + floorPlanDeltaX,
            z: window.position.z + floorPlanDeltaZ,
          },
        };
      }
      return window;
    });

    const updatedObjects = (prevData.objects || []).map((object) => {
      const objectRoom = findRoomContainingPoint(object.position, originalRooms);
      if (objectRoom && roomsToUpdate.includes(objectRoom.id)) {
        return {
          ...object,
          position: {
            x: object.position.x + floorPlanDeltaX,
            z: object.position.z + floorPlanDeltaZ,
          },
        };
      }
      return object;
    });

    const updatedLabels = (prevData.labels || []).map((label) => {
      const labelRoom = findRoomContainingPoint(label.position, originalRooms);
      if (labelRoom && roomsToUpdate.includes(labelRoom.id)) {
        return {
          ...label,
          position: {
            x: label.position.x + floorPlanDeltaX,
            z: label.position.z + floorPlanDeltaZ,
          },
        };
      }
      return label;
    });

    const totalArea = updatedRooms.reduce((sum, room) => sum + room.area, 0);

    return {
      ...prevData,
      rooms: updatedRooms,
      doors: updatedDoors,
      windows: updatedWindows,
      objects: updatedObjects,
      labels: updatedLabels,
      total_area: parseFloat(totalArea.toFixed(2)),
    };
  });

  setDragState((prev) => ({
    ...prev,
    lastX: cursorX,
    lastY: cursorY,
  }));
}

function isPointInsidePolygon(point: Point, polygon: Point[]): boolean {
  if (!point || typeof point.x !== 'number' || typeof point.z !== 'number') {
    return false;
  }
  
  if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
    return false;
  }
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const currentPoint = polygon[i];
    const prevPoint = polygon[j];
    
    if (!currentPoint || typeof currentPoint.x !== 'number' || typeof currentPoint.z !== 'number' ||
        !prevPoint || typeof prevPoint.x !== 'number' || typeof prevPoint.z !== 'number') {
      continue;
    }
    
    const xi = currentPoint.x;
    const zi = currentPoint.z;
    const xj = prevPoint.x;
    const zj = prevPoint.z;
    
    if (
      zi > point.z !== zj > point.z &&
      point.x < ((xj - xi) * (point.z - zi)) / (zj - zi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function findRoomContainingPoint(point: Point, rooms: Room[]): Room | null {
  if (!point || typeof point.x !== 'number' || typeof point.z !== 'number') {
    return null;
  }
  
  for (const room of rooms) {
    if (!room || !room.floor_polygon || 
        room.room_type === "Wall" ||
        room.room_type === "Boundary" ||
        room.floor_polygon.length < 3) continue;
        
    if (isPointInsidePolygon(point, room.floor_polygon)) {
      return room;
    }
  }
  return null;
}

function updateGroupRoomResize(
  dragState: DragState,
  cursorX: number,
  cursorY: number,
  totalDeltaX: number,
  totalDeltaY: number,
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
  setDragState: React.Dispatch<React.SetStateAction<DragState>>
) {
  if (!dragState.initialPolygons) return;

  setFloorPlanData((prevData) => {
    const updatedRooms = [...prevData.rooms];

    const primaryRoomIndex = updatedRooms.findIndex(
      (room) => room.id === dragState.roomId
    );
    if (primaryRoomIndex === -1) return prevData;

    const primaryRoom = { ...updatedRooms[primaryRoomIndex] };
    const primaryInitialPolygon =
      dragState.initialPolygons?.[dragState.roomId!] || [];

    let scaleFactorX = 1.0;
    let scaleFactorY = 1.0;
    let translationX = 0;
    let translationY = 0;

    if (dragState.vertexIndex !== null) {
      const vertexIndex = dragState.vertexIndex;
      const initialVertex = primaryInitialPolygon[vertexIndex];
      const cursorPoint = reverseTransformCoordinates(cursorX, cursorY);

      const scaledDeltaX = totalDeltaX / scale;
      const scaledDeltaY = totalDeltaY / scale;

      dragState.roomIds.forEach((roomId) => {
        const roomIndex = updatedRooms.findIndex((room) => room.id === roomId);
        if (roomIndex === -1 || !dragState.initialPolygons?.[roomId]) return;

        const initialPolygon = dragState.initialPolygons[roomId];
        const room = { ...updatedRooms[roomIndex] };
        const updatedPolygon = [...initialPolygon];

        if (roomId === dragState.roomId) {
          updatedPolygon[vertexIndex] = cursorPoint;
        } else {
          if (vertexIndex < updatedPolygon.length) {
            updatedPolygon[vertexIndex] = {
              x: initialPolygon[vertexIndex].x + scaledDeltaX,
              z: initialPolygon[vertexIndex].z + scaledDeltaY,
            };
          }
        }

        const dimensions = calculateRoomDimensions(updatedPolygon);
        const area = calculateRoomArea(updatedPolygon);

        room.floor_polygon = updatedPolygon;
        room.width = dimensions.width;
        room.height = dimensions.height;
        room.area = area;

        updatedRooms[roomIndex] = room;
      });
    } else if (dragState.isEdgeResizing && dragState.edgeIndices) {
      const [idx1, idx2] = dragState.edgeIndices;

      const primaryEdgeVertex1 = primaryInitialPolygon[idx1];
      const primaryEdgeVertex2 = primaryInitialPolygon[idx2];

      const normal = getEdgeNormal(primaryEdgeVertex1, primaryEdgeVertex2);

      const cursorPoint = reverseTransformCoordinates(cursorX, cursorY);
      const startPoint = reverseTransformCoordinates(
        dragState.startX,
        dragState.startY
      );
      const movementX = cursorPoint.x - startPoint.x;
      const movementZ = cursorPoint.z - startPoint.z;

      const movementAlongNormal = movementX * normal.x + movementZ * normal.z;

      dragState.roomIds.forEach((roomId) => {
        const roomIndex = updatedRooms.findIndex((room) => room.id === roomId);
        if (roomIndex === -1 || !dragState.initialPolygons?.[roomId]) return;

        const initialPolygon = dragState.initialPolygons[roomId];
        const room = { ...updatedRooms[roomIndex] };
        const updatedPolygon = [...initialPolygon];

        if (idx1 < updatedPolygon.length && idx2 < updatedPolygon.length) {
          const vertex1 = initialPolygon[idx1];
          const vertex2 = initialPolygon[idx2];
          updatedPolygon[idx1] = {
            x: vertex1.x + normal.x * movementAlongNormal,
            z: vertex1.z + normal.z * movementAlongNormal,
          };

          updatedPolygon[idx2] = {
            x: vertex2.x + normal.x * movementAlongNormal,
            z: vertex2.z + normal.z * movementAlongNormal,
          };
        }

        const dimensions = calculateRoomDimensions(updatedPolygon);
        const area = calculateRoomArea(updatedPolygon);

        room.floor_polygon = updatedPolygon;
        room.width = dimensions.width;
        room.height = dimensions.height;
        room.area = area;

        updatedRooms[roomIndex] = room;
      });
    }

    const totalArea = updatedRooms.reduce((sum, room) => sum + room.area, 0);

    return {
      ...prevData,
      rooms: updatedRooms,
      total_area: parseFloat(totalArea.toFixed(2)),
    };
  });

  setDragState((prev) => ({
    ...prev,
    lastX: cursorX,
    lastY: cursorY,
  }));
}

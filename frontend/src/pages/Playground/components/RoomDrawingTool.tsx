// components/RoomDrawingTool.tsx
import React, { useEffect, useState } from "react";
import { Point } from "../features/types";
import { generateRoomPolygon } from "../features/drawingTools";
import { useFloorPlan } from "../FloorPlanContext";
import { calculateBounds } from "../features/coordinates";
import { formatImperialLength, coordToInches } from "../features/imperialUtils";

interface RoomDrawingToolProps {
  isActive: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  reverseTransformCoordinates: (x: number, y: number) => Point;
  transformCoordinates: (point: Point) => { x: number; y: number };
  onRoomCreated: (roomPolygon: Point[]) => void;
  onDrawingStateChange: (isDrawing: boolean) => void;
}

const RoomDrawingTool: React.FC<RoomDrawingToolProps> = ({
  isActive,
  svgRef,
  reverseTransformCoordinates,
  transformCoordinates,
  onRoomCreated,
  onDrawingStateChange,
}) => {
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { setActiveBuildTool, floorPlanData, setFloorPlanData, unitSystem } = useFloorPlan();

  useEffect(() => {
    if (!isActive) {
      setStartPoint(null);
      setCurrentPoint(null);
      setIsDrawing(false);
      onDrawingStateChange(false);
    }
  }, [isActive, onDrawingStateChange]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    
    if (isActive) {
      svg.style.setProperty('cursor', 'crosshair', 'important');
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        svg * {
          cursor: crosshair !important;
        }
      `;
      styleSheet.id = 'room-drawing-cursor-override';
      document.head.appendChild(styleSheet);
    } else {
      svg.style.removeProperty('cursor');  
      const existingStyle = document.getElementById('room-drawing-cursor-override');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
    return () => {
      if (svg) {
        svg.style.removeProperty('cursor');
      }
      const existingStyle = document.getElementById('room-drawing-cursor-override');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isActive, svgRef]);

  const exitDrawingMode = () => {
    setActiveBuildTool(null);
  };

  const renderRoomMeasurements = () => {
    if (!startPoint || !currentPoint || !isDrawing) return null;

    const roomPolygon = generateRoomPolygon(startPoint, currentPoint);
    const transformedPolygon = roomPolygon.map(transformCoordinates);

    const measurements = [];

    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.z - startPoint.z);

    measurements.push({
      start: transformedPolygon[0],
      end: transformedPolygon[1],
      distance: width,
      linePosition: {
        x1: transformedPolygon[0].x,
        y1: transformedPolygon[0].y - 20,
        x2: transformedPolygon[1].x,
        y2: transformedPolygon[0].y - 20,
      },
      textPosition: {
        x: (transformedPolygon[0].x + transformedPolygon[1].x) / 2,
        y: transformedPolygon[0].y - 35,
      },
      angle: 0,
      isHorizontal: true,
    });

    measurements.push({
      start: transformedPolygon[1],
      end: transformedPolygon[2],
      distance: height,
      linePosition: {
        x1: transformedPolygon[1].x + 20,
        y1: transformedPolygon[1].y,
        x2: transformedPolygon[1].x + 20,
        y2: transformedPolygon[2].y,
      },
      textPosition: {
        x: transformedPolygon[1].x + 35,
        y: (transformedPolygon[1].y + transformedPolygon[2].y) / 2,
      },
      angle: -90,
      isHorizontal: false,
    });

    measurements.push({
      start: transformedPolygon[2],
      end: transformedPolygon[3],
      distance: width,
      linePosition: {
        x1: transformedPolygon[2].x,
        y1: transformedPolygon[2].y + 20,
        x2: transformedPolygon[3].x,
        y2: transformedPolygon[2].y + 20,
      },
      textPosition: {
        x: (transformedPolygon[2].x + transformedPolygon[3].x) / 2,
        y: transformedPolygon[2].y + 35,
      },
      angle: 0,
      isHorizontal: true,
    });

    measurements.push({
      start: transformedPolygon[3],
      end: transformedPolygon[0],
      distance: height,
      linePosition: {
        x1: transformedPolygon[3].x - 20,
        y1: transformedPolygon[3].y,
        x2: transformedPolygon[3].x - 20,
        y2: transformedPolygon[0].y,
      },
      textPosition: {
        x: transformedPolygon[3].x - 35,
        y: (transformedPolygon[3].y + transformedPolygon[0].y) / 2,
      },
      angle: 90,
      isHorizontal: false,
    });

    return (
      <g className="room-measurements-preview" style={{ opacity: 0.8 }}>
        {measurements.map((measurement, index) => (
          <g key={`room-measurement-${index}`}>
            {/* Measurement line */}
            <line
              x1={measurement.linePosition.x1}
              y1={measurement.linePosition.y1}
              x2={measurement.linePosition.x2}
              y2={measurement.linePosition.y2}
              stroke="#2196F3"
              strokeWidth="1"
              markerStart="url(#dimensionArrowStart)"
              markerEnd="url(#dimensionArrowEnd)"
            />

            {/* Extension lines */}
            <line
              x1={measurement.start.x}
              y1={measurement.start.y}
              x2={measurement.linePosition.x1}
              y2={measurement.linePosition.y1}
              stroke="#2196F3"
              strokeWidth="1"
              strokeDasharray="2,2"
            />
            <line
              x1={measurement.end.x}
              y1={measurement.end.y}
              x2={measurement.linePosition.x2}
              y2={measurement.linePosition.y2}
              stroke="#2196F3"
              strokeWidth="1"
              strokeDasharray="2,2"
            />

            {/* Text background */}
            <rect
              x={measurement.textPosition.x - 20}
              y={measurement.textPosition.y - 7}
              width={40}
              height={14}
              fill="rgba(255, 255, 255, 0.9)"
              stroke="#2196F3"
              strokeWidth="0.5"
              rx={2}
              transform={`rotate(${measurement.angle}, ${measurement.textPosition.x}, ${measurement.textPosition.y})`}
            />

            {/* Measurement text */}
            <text
              x={measurement.textPosition.x}
              y={measurement.textPosition.y}
              fill="#2196F3"
              fontSize="9"
              fontWeight="600"
              textAnchor="middle"
              dominantBaseline="middle"
              transform={`rotate(${measurement.angle}, ${measurement.textPosition.x}, ${measurement.textPosition.y})`}
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {formatImperialLength(coordToInches(measurement.distance / 10), unitSystem)}
            </text>
          </g>
        ))}

        {/* Area measurement in the center with background */}
        <rect
          x={(transformedPolygon[0].x + transformedPolygon[2].x) / 2 - 30}
          y={(transformedPolygon[0].y + transformedPolygon[2].y) / 2 - 8}
          width={60}
          height={16}
          fill="rgba(255, 255, 255, 0.9)"
          stroke="#2196F3"
          strokeWidth="0.5"
          rx={3}
        />
        <text
          x={(transformedPolygon[0].x + transformedPolygon[2].x) / 2}
          y={(transformedPolygon[0].y + transformedPolygon[2].y) / 2}
          fill="#2196F3"
          fontSize="10"
          fontWeight="700"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          Area: {formatImperialArea((width * height) / 100 )}
        </text>
      </g>
    );
  };

const formatImperialArea = (sqFeet: number): string => {
  if (unitSystem === 'metric') {
    // Convert sq ft to sq m (1 sq ft = 0.092903 sq m)
    const sqMeters = sqFeet * 0.092903;
    // Truncate to 2 decimal places (not round)
    const truncatedSqMeters = Math.floor(sqMeters * 100) / 100;
    return `${truncatedSqMeters.toFixed(2)} sq m`;
  }
  
  if (sqFeet < 1) {
    const sqInches = Math.round(sqFeet * 144);
    return `${sqInches} sq in`;
  }
  return `${sqFeet.toFixed(1)} sq ft`;
};
  useEffect(() => {
    if (!isActive || !svgRef.current) return;

    const svg = svgRef.current;

    const handleSvgMouseDown = (e: MouseEvent) => {
      if (!isActive) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const point = reverseTransformCoordinates(x, y);

      if (!isDrawing) {
        setStartPoint(point);
        setCurrentPoint(point);
        setIsDrawing(true);
        onDrawingStateChange(true);
      } else {
        setIsDrawing(false);
        onDrawingStateChange(false);

        if (startPoint && calculateDistance(startPoint, point) > 10) {
          const roomPolygon = generateRoomPolygon(startPoint, point);
          onRoomCreated(roomPolygon);
        }

        setStartPoint(null);
        setCurrentPoint(null);
        exitDrawingMode();
      }
    };

    const handleSvgMouseMove = (e: MouseEvent) => {
      if (!isActive || !isDrawing) return;

      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const point = reverseTransformCoordinates(x, y);
      setCurrentPoint(point);

      if (startPoint) {
        const temporaryRoomPolygon = generateRoomPolygon(startPoint, point);
        const tempRoom = {
          id: "temp-drawing-room",
          room_type: "TempRoom",
          area: 0,
          height: 0,
          width: 0,
          floor_polygon: temporaryRoomPolygon,
        };

        const tempRooms = [...floorPlanData.rooms, tempRoom];
        const newBounds = calculateBounds(tempRooms);

        const boundsEvent = new CustomEvent("temporaryBoundsUpdate", {
          detail: newBounds,
        });
        window.dispatchEvent(boundsEvent);
      }
    };

    const handleSvgTouchStart = (e: TouchEvent) => {
      if (!isActive) return;
      e.preventDefault();

      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const rect = svg.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const point = reverseTransformCoordinates(x, y);

      if (!isDrawing) {
        setStartPoint(point);
        setCurrentPoint(point);
        setIsDrawing(true);
        onDrawingStateChange(true);
      } else {
        setIsDrawing(false);
        onDrawingStateChange(false);

        if (startPoint && calculateDistance(startPoint, point) > 10) {
          const roomPolygon = generateRoomPolygon(startPoint, point);
          onRoomCreated(roomPolygon);
        }

        setStartPoint(null);
        setCurrentPoint(null);
        exitDrawingMode();
      }
    };

    const handleSvgTouchMove = (e: TouchEvent) => {
      if (!isActive || !isDrawing) return;
      e.preventDefault();

      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const rect = svg.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const point = reverseTransformCoordinates(x, y);
      setCurrentPoint(point);

      if (startPoint) {
        const temporaryRoomPolygon = generateRoomPolygon(startPoint, point);
        const tempRoom = {
          id: "temp-drawing-room",
          room_type: "TempRoom",
          area: 0,
          height: 0,
          width: 0,
          floor_polygon: temporaryRoomPolygon,
        };

        const tempRooms = [...floorPlanData.rooms, tempRoom];
        const newBounds = calculateBounds(tempRooms);

        const boundsEvent = new CustomEvent("temporaryBoundsUpdate", {
          detail: newBounds,
        });
        window.dispatchEvent(boundsEvent);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawing) {
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
        onDrawingStateChange(false);
        exitDrawingMode();
      }
    };

    svg.addEventListener("mousedown", handleSvgMouseDown);
    svg.addEventListener("mousemove", handleSvgMouseMove);
    svg.addEventListener("touchstart", handleSvgTouchStart);
    svg.addEventListener("touchmove", handleSvgTouchMove);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      svg.removeEventListener("mousedown", handleSvgMouseDown);
      svg.removeEventListener("mousemove", handleSvgMouseMove);
      svg.removeEventListener("touchstart", handleSvgTouchStart);
      svg.removeEventListener("touchmove", handleSvgTouchMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isActive,
    isDrawing,
    startPoint,
    reverseTransformCoordinates,
    svgRef,
    onRoomCreated,
    onDrawingStateChange,
    setActiveBuildTool,
    floorPlanData,
    setFloorPlanData,
  ]);

  if (!isActive || !startPoint || !currentPoint || !isDrawing) return null;

  const roomPolygon = generateRoomPolygon(startPoint, currentPoint);
  const transformedPolygon = roomPolygon.map(transformCoordinates);
  const polygonPoints = transformedPolygon.map((p) => `${p.x},${p.y}`).join(" ");

  function calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
  }

  return (
    <>
      <polygon
        points={polygonPoints}
        fill="rgba(0, 102, 204, 0.3)"
        stroke="#0066cc"
        strokeWidth={2}
        strokeDasharray="5,5"
      />
      {renderRoomMeasurements()}
    </>
  );
};

export default RoomDrawingTool;
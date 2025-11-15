// components/WallDrawingTool.tsx
import React, { useEffect, useState, useRef } from "react";
import { Point } from "../features/types";
import { createWallPolygon } from "../features/drawingTools";
import { useFloorPlan } from "../FloorPlanContext";
import { calculateBounds } from "../features/coordinates";
import { formatImperialLength, coordToInches } from "../features/imperialUtils";

interface WallDrawingToolProps {
  isActive: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  reverseTransformCoordinates: (x: number, y: number) => Point;
  transformCoordinates: (point: Point) => { x: number; y: number };
  scale: number;
  onWallCreated: (wallPolygon: Point[]) => void;
  onDrawingStateChange: (isDrawing: boolean) => void;
}

const WallDrawingTool: React.FC<WallDrawingToolProps> = ({
  isActive,
  svgRef,
  reverseTransformCoordinates,
  transformCoordinates,
  scale,
  onWallCreated,
  onDrawingStateChange,
}) => {
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { setActiveBuildTool, floorPlanData, drawingWallWidth, unitSystem } = useFloorPlan();

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
      styleSheet.id = 'wall-drawing-cursor-override';
      document.head.appendChild(styleSheet);
    } else {
      svg.style.removeProperty('cursor');

      const existingStyle = document.getElementById('wall-drawing-cursor-override');
      if (existingStyle) {
        existingStyle.remove();
      }
    }
    return () => {
      if (svg) {
        svg.style.removeProperty('cursor');
      }
      const existingStyle = document.getElementById('wall-drawing-cursor-override');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isActive, svgRef]);

  const exitDrawingMode = () => {
    setActiveBuildTool(null);
  };
  const renderWallMeasurement = () => {
    if (!startPoint || !currentPoint || !isDrawing) return null;

    const transformedStart = transformCoordinates(startPoint);
    const transformedEnd = transformCoordinates(currentPoint);
    
    const distance = Math.sqrt(
      Math.pow(currentPoint.x - startPoint.x, 2) +
      Math.pow(currentPoint.z - startPoint.z, 2)
    );

    const dx = transformedEnd.x - transformedStart.x;
    const dy = transformedEnd.y - transformedStart.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    
    const isNearVertical = Math.abs(angle) > 45 && Math.abs(angle) < 135;
    const offset = 20;
    
    const measurementLineStart = {
      x: transformedStart.x + (isNearVertical ? offset : 0),
      y: transformedStart.y + (isNearVertical ? 0 : -offset),
    };
    
    const measurementLineEnd = {
      x: transformedEnd.x + (isNearVertical ? offset : 0),
      y: transformedEnd.y + (isNearVertical ? 0 : -offset),
    };
    
    const textPosition = {
      x: (measurementLineStart.x + measurementLineEnd.x) / 2 + (isNearVertical ? 15 : 0),
      y: (measurementLineStart.y + measurementLineEnd.y) / 2 + (isNearVertical ? 0 : -15),
    };

    return (
      <g className="wall-measurement-preview" style={{ opacity: 0.8 }}>
        {/* Measurement line */}
        <line
          x1={measurementLineStart.x}
          y1={measurementLineStart.y}
          x2={measurementLineEnd.x}
          y2={measurementLineEnd.y}
          stroke="#ff6b00"
          strokeWidth="1"
          markerStart="url(#dimensionArrowStart)"
          markerEnd="url(#dimensionArrowEnd)"
        />
        
        {/* Extension lines */}
        <line
          x1={transformedStart.x}
          y1={transformedStart.y}
          x2={measurementLineStart.x}
          y2={measurementLineStart.y}
          stroke="#ff6b00"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={transformedEnd.x}
          y1={transformedEnd.y}
          x2={measurementLineEnd.x}
          y2={measurementLineEnd.y}
          stroke="#ff6b00"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* Text background */}
        <rect
          x={textPosition.x - 20}
          y={textPosition.y - 7}
          width={40}
          height={14}
          fill="rgba(255, 255, 255, 0.9)"
          stroke="#ff6b00"
          strokeWidth="0.5"
          rx={2}
          transform={`rotate(${angle > 90 || angle < -90 ? angle + 180 : angle}, ${textPosition.x}, ${textPosition.y})`}
        />

        {/* Measurement text */}
        <text
          x={textPosition.x}
          y={textPosition.y}
          fill="#ff6b00"
          fontSize="9"
          fontWeight="600"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(${angle > 90 || angle < -90 ? angle + 180 : angle}, ${textPosition.x}, ${textPosition.y})`}
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        >
          {formatImperialLength(coordToInches(distance / 10), unitSystem)}
        </text>
      </g>
    );
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

        if (startPoint && calculateDistance(startPoint, point) > 5 / scale) {
          const wallPolygon = createWallPolygon(startPoint, point);
          onWallCreated(wallPolygon);
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
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      svg.removeEventListener("mousedown", handleSvgMouseDown);
      svg.removeEventListener("mousemove", handleSvgMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isActive,
    isDrawing,
    startPoint,
    reverseTransformCoordinates,
    scale,
    svgRef,
    onWallCreated,
    onDrawingStateChange,
    setActiveBuildTool,
  ]);

  if (!isActive || !startPoint || !currentPoint || !isDrawing) return null;

  const wallPoints = createWallPolygon(startPoint, currentPoint);
  const transformedStart = transformCoordinates(wallPoints[0]);
  const transformedEnd = transformCoordinates(wallPoints[1]);

  function calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2));
  }

  return (
    <>
      <line
        x1={transformedStart.x}
        y1={transformedStart.y}
        x2={transformedEnd.x}
        y2={transformedEnd.y}
        stroke="black"
        strokeWidth={drawingWallWidth}
        strokeDasharray="5,5"
      />
      <circle cx={transformedStart.x} cy={transformedStart.y} r={5} fill="#0066cc" />
      <circle cx={transformedEnd.x} cy={transformedEnd.y} r={5} fill="#0066cc" />
      {renderWallMeasurement()}
    </>
  );
};

export default WallDrawingTool;
import React, { useState, useEffect } from "react";
import "./BuildToolsPanel.css";
import { useFloorPlan } from "../FloorPlanContext";
import { BuildTool } from "../features/types";
import { coordToInches, formatImperialLength } from "../features/imperialUtils";
import {
  setInfoToolPanelState,
  setLabelPlacementState,
  setDoorPlacementState,
  setWindowPlacementState,
  setCornerPlacementState,
} from "../features/eventHandlers";

interface BuildToolsProps {
  onSelectTool: (tool: string) => void;
}

const BuildToolsPanel: React.FC<BuildToolsProps> = ({ onSelectTool }) => {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [draggedDoor, setDraggedDoor] = useState<string | null>(null);
  const [draggedWindow, setDraggedWindow] = useState<string | null>(null);
  const [touchDragging, setTouchDragging] = useState<{
    item: string;
    type: "door" | "window";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const {
    setActiveBuildTool,
    activeBuildTool,
    setIsDrawingActive,
    visualizationOptions,
    drawingWallWidth,
    setDrawingWallWidth,
    unitSystem
  } = useFloorPlan();

  useEffect(() => {
    setIsDrawingActive(false);
  }, [activeBuildTool, setIsDrawingActive]);

  useEffect(() => {
    if (activeSubmenu === "doors") {
      setInfoToolPanelState(true, "placeDoors");
      document.body.setAttribute("data-doors-panel-active", "true");
    } else if (activeSubmenu === "windows") {
      setInfoToolPanelState(true, "placeWindows");
      document.body.setAttribute("data-windows-panel-active", "true");
    } else if (activeSubmenu === "corners") {
      setCornerPlacementState(true);
      setInfoToolPanelState(true, "addCorner");
      document.body.setAttribute("data-corner-placement-active", "true");
    }

    return () => {
      if (activeSubmenu === "doors") {
        setInfoToolPanelState(false, null);
        document.body.removeAttribute("data-doors-panel-active");
      } else if (activeSubmenu === "windows") {
        setInfoToolPanelState(false, null);
        document.body.removeAttribute("data-windows-panel-active");
      } else if (activeSubmenu === "corners") {
        setCornerPlacementState(false);
        setInfoToolPanelState(false, null);
        document.body.removeAttribute("data-corner-placement-active");
      }
    };
  }, [activeSubmenu]);

  const buildTools = [
    { id: "drawBoundry", label: "Draw Boundary", icon: "📦" },
    { id: "drawRoom", label: "Draw Room", icon: "📦" },
    { id: "drawWall", label: "Draw Wall", icon: "🧱" },
    { id: "drawCorner", label: "Add Corner", icon: "📐" },
    { id: "placeDoors", label: "Place Doors", icon: "🚪", hasSubmenu: true },
    {
      id: "placeWindows",
      label: "Place Windows",
      icon: "🪟",
      hasSubmenu: true,
    },
  ];

  const doorTypes = [
    "Frame1",
    "Frame2",
    "Frame3",
    "Frame4",
    "Frame5",
    "Frame6",
  ];

  const windowTypes = [
    "Frame7",
    "Frame8",
    "Frame9",
    "Frame10",
    "Frame11",
    "Frame12",
  ];

  const handleToolClick = (toolId: string) => {
    if (toolId === "placeDoors") {
      setActiveSubmenu("doors");
      setDraggedDoor(null);
      setDraggedWindow(null);
      setActiveBuildTool(null);
      setDrawingWallWidth(6);
    } else if (toolId === "placeWindows") {
      setActiveSubmenu("windows");
      setDraggedDoor(null);
      setDraggedWindow(null);
      setActiveBuildTool(null);
      setDrawingWallWidth(6);
    } else if (toolId === "drawBoundry") {
  setDrawingWallWidth(6);
  onSelectTool(toolId);
  setActiveBuildTool(toolId as BuildTool);
    } else if (toolId === "drawCorner") {
      setActiveSubmenu("corners");
      setDraggedDoor(null);
      setDraggedWindow(null);
      setActiveBuildTool(null);
      setDrawingWallWidth(6);
    } else {
      if (toolId !== "drawWall") {
        setDrawingWallWidth(6);
      }
      onSelectTool(toolId);
      setActiveBuildTool(toolId as BuildTool);
    }
  };

  const handleBackFromSubmenu = () => {
    if (activeSubmenu === "corners") {
      setCornerPlacementState(false);
      setInfoToolPanelState(false, null);
      document.body.removeAttribute("data-corner-placement-active");
    }

    setActiveSubmenu(null);
    setActiveBuildTool(null);
    setDraggedDoor(null);
    setDraggedWindow(null);
    setTouchDragging(null);
  };

  const createDragImage = (
    e: React.DragEvent,
    item: string,
    type: "door" | "window"
  ) => {
    const isDoor = type === "door";
    const containerSize = isDoor ? 80 : 60;
    const imageSize = isDoor ? 70 : 48;
    const emojiSize = isDoor ? 32 : 24;
    const centerPoint = isDoor ? 40 : 30;

    const dragElement = document.createElement("div");
    dragElement.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    width: ${containerSize}px;
    height: ${containerSize}px;
    background: transparent;
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

    const img = document.createElement("img");
    img.src = `/doors/${item}.png`;
    img.style.cssText = `
    max-width: ${imageSize}px;
    max-height: ${imageSize}px;
    object-fit: contain;
    pointer-events: none;
  `;

    img.onerror = () => {
      img.style.display = "none";
      const fallbackText = document.createElement("div");
      fallbackText.textContent = type === "door" ? "🚪" : "🪟";
      fallbackText.style.cssText = `
      font-size: ${emojiSize}px;
      text-align: center;
    `;
      dragElement.appendChild(fallbackText);
    };

    dragElement.appendChild(img);
    document.body.appendChild(dragElement);

    try {
      e.dataTransfer.setDragImage(dragElement, centerPoint, centerPoint);
    } catch (error) {
      console.warn("Could not set drag image:", error);
    }

    setTimeout(() => {
      if (dragElement.parentNode) {
        dragElement.parentNode.removeChild(dragElement);
      }
    }, 100);
  };

  const handleDoorDragStart = (e: React.DragEvent, item: string) => {
    e.stopPropagation();
    const doorPath = `/doors/${item}.png`;

    e.dataTransfer.setData("application/x-floor-plan-door", doorPath);
    e.dataTransfer.setData("text/plain", doorPath);
    e.dataTransfer.effectAllowed = "copy";

    setDraggedDoor(item);

    createDragImage(e, item, "door");
  };

  const handleDoorDragEnd = () => {
    setDraggedDoor(null);
  };

  const handleWindowDragStart = (e: React.DragEvent, item: string) => {
    e.stopPropagation();
    const windowPath = `/doors/${item}.png`;

    e.dataTransfer.setData("application/x-floor-plan-window", windowPath);
    e.dataTransfer.setData("text/plain", windowPath);
    e.dataTransfer.effectAllowed = "copy";

    setDraggedWindow(item);

    createDragImage(e, item, "window");
  };

  const handleWindowDragEnd = () => {
    setDraggedWindow(null);
  };

  const handleTouchStart = (
    e: React.TouchEvent,
    item: string,
    type: "door" | "window"
  ) => {
    if (e.touches.length !== 1) return;

    const touch = e.touches[0];

    setTouchDragging({
      item,
      type,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });

    if (type === "door") {
      setDraggedDoor(item);
    } else {
      setDraggedWindow(item);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragging || e.touches.length !== 1) return;

    const touch = e.touches[0];

    setTouchDragging((prev) =>
      prev
        ? {
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY,
        }
        : null
    );
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchDragging) return;

    const touch = e.changedTouches[0];

    const elementUnderTouch = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );
    const floorPlanContainer = elementUnderTouch?.closest(
      ".floor-plan-container, svg"
    );

    if (floorPlanContainer) {
      const itemPath = `/doors/${touchDragging.item}.png`;

      const customDropEvent = new CustomEvent(
        `touch${touchDragging.type.charAt(0).toUpperCase() +
        touchDragging.type.slice(1)
        }Drop`,
        {
          detail: {
            itemPath,
            clientX: touch.clientX,
            clientY: touch.clientY,
          },
        }
      );

      document.dispatchEvent(customDropEvent);
    }

    setTouchDragging(null);
    setDraggedDoor(null);
    setDraggedWindow(null);
  };

  const adjustWallWidth = (delta: number) => {
    const newWidth = Math.max(1, Math.min(10, drawingWallWidth + delta));
    setDrawingWallWidth(newWidth);
  };

  if (activeSubmenu === "doors") {
    return (
      <div
        className="panel-options doors-panel"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        <div
          className="submenu-header"
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            marginBottom: "8px",
            paddingBottom: "8px",
          }}
        >
          <button
            className="back-button"
            onClick={handleBackFromSubmenu}
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
              color: "#2196F3",
            }}
          >
            ←
          </button>
          <span
            className="submenu-title"
            style={{
              fontWeight: "bold",
              marginLeft: "10px",
            }}
          >
            Door Types
          </span>
        </div>

        <div className="doors-grid" style={{ overflowX: "hidden" }}>
          {doorTypes.map((item) => {
            const isDragging = draggedDoor === item;
            const isTouchDragging =
              touchDragging?.item === item && touchDragging?.type === "door";

            return (
              <div
                key={item}
                className="door-item"
                draggable={true}
                onDragStart={(e) => handleDoorDragStart(e, item)}
                onDragEnd={handleDoorDragEnd}
                onTouchStart={(e) => handleTouchStart(e, item, "door")}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  cursor: isDragging || isTouchDragging ? "grabbing" : "grab",
                  backgroundColor:
                    isDragging || isTouchDragging ? "#f0f0f0" : "#f8f8f8",
                  border:
                    isDragging || isTouchDragging
                      ? "2px dashed #8B4513"
                      : "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "4px",
                  transition: "all 0.2s",
                  opacity: isDragging || isTouchDragging ? 0.7 : 1,
                  transform:
                    isDragging || isTouchDragging ? "scale(0.95)" : "scale(1)",
                  touchAction: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isDragging && !isTouchDragging) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(139, 69, 19, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragging && !isTouchDragging) {
                    e.currentTarget.style.backgroundColor = "#f8f8f8";
                  }
                }}
              >
                <img
                  src={`/doors/${item}.png`}
                  alt={item}
                  style={{
                    maxWidth: "60px",
                    maxHeight: "60px",
                    objectFit: "contain",
                    transform:
                      item === "Frame1" || item === "Frame2"
                        ? "translateY(6px)"
                        : item === "Frame3"
                          ? "translateY(3px)"
                          : "none",
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='10'%3E🚪%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            );
          })}
        </div>

        {touchDragging && touchDragging.type === "door" && (
          <div
            style={{
              position: "fixed",
              left: touchDragging.currentX - 30,
              top: touchDragging.currentY - 30,
              width: "60px",
              height: "60px",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <img
              src={`/doors/${touchDragging.item}.png`}
              alt={touchDragging.item}
              style={{
                maxWidth: "48px",
                maxHeight: "48px",
                objectFit: "contain",
              }}
            />
          </div>
        )}
      </div>
    );
  }

  if (activeSubmenu === "corners") {
    return (
      <div
        className="panel-options corners-panel"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        <div
          className="submenu-header"
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            marginBottom: "8px",
            paddingBottom: "8px",
          }}
        >
          <button
            className="back-button"
            onClick={handleBackFromSubmenu}
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
              color: "#2196F3",
            }}
          >
            ←
          </button>
          <span
            className="submenu-title"
            style={{
              fontWeight: "bold",
              marginLeft: "10px",
            }}
          >
            Add Corner
          </span>
        </div>

        <div
          className="corner-placement-instructions"
          style={{
            marginLeft: "10px",
            backgroundColor: "#e3f2fd",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "8px",
          }}
        >
          <div
          className="cmode"
            style={{
              display: "flex",
              alignItems: "center",
              textAlign: "center",
              marginBottom: "12px",
              fontSize: "14px",
              fontWeight: "700",
            }}
          >
            Corner Placement Mode
          </div>

          <p
            style={{
              fontSize: "13px",
              color: "#666",
              margin: "0 0 12px 0",
              lineHeight: "1.4",
            }}
          >
            Click on any room wall to add a new corner point at that location.
          </p>
        </div>
      </div>
    );
  }

  if (activeSubmenu === "windows") {
    return (
      <div
        className="panel-options windows-panel"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        <div
          className="submenu-header"
          style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #eee",
            marginBottom: "8px",
            paddingBottom: "8px",
          }}
        >
          <button
            className="back-button"
            onClick={handleBackFromSubmenu}
            style={{
              background: "none",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
              color: "#2196F3",
            }}
          >
            ←
          </button>
          <span
            className="submenu-title"
            style={{
              fontWeight: "bold",
              marginLeft: "10px",
            }}
          >
            Window Types
          </span>
        </div>

        <div className="windows-grid" style={{ overflowX: "hidden" }}>
          {windowTypes.map((item) => {
            const isDragging = draggedWindow === item;
            const isTouchDragging =
              touchDragging?.item === item && touchDragging?.type === "window";

            return (
              <div
                key={item}
                className="window-item"
                draggable={true}
                onDragStart={(e) => handleWindowDragStart(e, item)}
                onDragEnd={handleWindowDragEnd}
                onTouchStart={(e) => handleTouchStart(e, item, "window")}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                  cursor: isDragging || isTouchDragging ? "grabbing" : "grab",
                  backgroundColor:
                    isDragging || isTouchDragging ? "#f0f0f0" : "#f8f8f8",
                  border:
                    isDragging || isTouchDragging
                      ? "2px dashed #4169E1"
                      : "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "4px",
                  transition: "all 0.2s",
                  opacity: isDragging || isTouchDragging ? 0.7 : 1,
                  transform:
                    isDragging || isTouchDragging ? "scale(0.95)" : "scale(1)",
                  touchAction: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isDragging && !isTouchDragging) {
                    e.currentTarget.style.backgroundColor =
                      "rgba(65, 105, 225, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDragging && !isTouchDragging) {
                    e.currentTarget.style.backgroundColor = "#f8f8f8";
                  }
                }}
              >
                <img
                  src={`/doors/${item}.png`}
                  alt={item}
                  style={{
                    maxWidth: "60px",
                    maxHeight: "60px",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='10'%3E🪟%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            );
          })}
        </div>

        {touchDragging && touchDragging.type === "window" && (
          <div
            style={{
              position: "fixed",
              left: touchDragging.currentX - 30,
              top: touchDragging.currentY - 30,
              width: "60px",
              height: "60px",
              backgroundColor: "transparent",
              border: "none",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <img
              src={`/doors/${touchDragging.item}.png`}
              alt={touchDragging.item}
              style={{
                maxWidth: "48px",
                maxHeight: "48px",
                objectFit: "contain",
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="build-tools-panel">
      {buildTools.map((tool) => (
        <div
          key={tool.id}
          className={`build-tool-item ${activeBuildTool === tool.id ? "active" : ""
            }`}
          onClick={() => handleToolClick(tool.id)}
        >
          <div className="build-tool-icon">
            {tool.id === "drawBoundry" && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5V5h14v14z"
                  fill="currentColor"
                />
              </svg>
            )}
            {tool.id === "drawRoom" && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="3" y="3" width="18" height="18" fill="#d3d3d3" rx="2" />
                <path
                  d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5V5h14v14z"
                  fill="currentColor"
                />
              </svg>
            )}
            {tool.id === "drawWall" && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 4h20v3H2V4zm0 5h9v3H2V9zm11 0h9v3h-9V9zM2 14h20v3H2v-3zm0 5h9v3H2v-3zm11 0h9v3h-9v-3z"
                  fill="currentColor"
                />
              </svg>
            )}
            {tool.id === "drawCorner" && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <circle cx="12" cy="12" r="4" fill="currentColor" />
              </svg>
            )}
            {tool.id === "placeDoors" && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 19V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v14H3v2h18v-2h-2zm-6 0H7V5h6v14zm4-8h2v2h-2v-2z"
                  fill="currentColor"
                />
              </svg>
            )}
            {tool.id === "placeWindows" && (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 8h-6V5h6v6zm-8-6v6H5V5h6zm-6 8h6v6H5v-6zm8 6v-6h6v6h-6z"
                  fill="currentColor"
                />
              </svg>
            )}
          </div>
          <div className="build-tool-label">{tool.label}</div>
          {tool.hasSubmenu && <div className="submenu-indicator">›</div>}
        </div>
      ))}

      {activeBuildTool === "drawWall" && (
        <div
          className="wall-width-control"
          style={{
            padding: "8px",
            margin: "4px 0",
            backgroundColor: "#f8f9fa",
            borderRadius: "6px",
            border: "1px solid black",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: "14px",
              fontWeight: "600",
              textAlign: "center",
              color: "#333",
            }}
          >
            Wall Width
          </h4>
          <div
            className="wall-width-adjuster"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <button
              className="wall-width-button"
              onClick={() => adjustWallWidth(-1)}
              disabled={drawingWallWidth <= 1}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                cursor: drawingWallWidth <= 1 ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                color: drawingWallWidth <= 1 ? "#999" : "#333",
              }}
            >
              -
            </button>
<div
  className="wall-width-display"
  style={{
    minWidth: "60px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  }}
>
  {formatImperialLength(coordToInches(drawingWallWidth / 10), unitSystem)}
</div>

            <button
              className="wall-width-button"
              onClick={() => adjustWallWidth(1)}
              disabled={drawingWallWidth >= 10}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                cursor: drawingWallWidth >= 10 ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                color: drawingWallWidth >= 10 ? "#999" : "#333",
              }}
            >
              +
            </button>
          </div>
          <div
            className="wall-preview"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              className="wall-preview-line"
              style={{
                height: `${drawingWallWidth}px`,
                width: "120px",
                backgroundColor: "#666",
                borderRadius: "2px",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildToolsPanel;

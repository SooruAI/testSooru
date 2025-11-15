import React, { useState, useEffect, useRef } from "react";
import "./ToolPanel.css";
import {
  setInfoToolPanelState,
  setLabelPlacementState,
} from "../features/eventHandlers";

interface ObjectsPanelProps {
  onSelectObject?: (objectId: string) => void;
}

interface ExtendedCSSProperties extends React.CSSProperties {
  WebkitOverflowScrolling?: "auto" | "touch";
}

const ObjectsPanel: React.FC<ObjectsPanelProps> = ({ onSelectObject }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [draggedObject, setDraggedObject] = useState<string | null>(null);
  const [preloadedImages, setPreloadedImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [preloadedTopImages, setPreloadedTopImages] = useState<Map<string, HTMLImageElement>>(new Map());
  const [touchDragging, setTouchDragging] = useState<{
    item: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [activeView, setActiveView] = useState<"top" | "front">("front");
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [modalPosition, setModalPosition] = useState<{top: number, left: number} | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const objectCategories = {
    "Seating & Beds": [
      "bed-1", "bed-2", "bed-3", "bed-4", "bed-5", "bed-6", "bed-7", "bed-8",
      "bed-9", "bed-10", "bed-11", "bed-12", "bed-13", "bed-14", "bed-15",
      "bed-16", "bed-17", "bed-18", "bed-19", "bed-20", "bed-21", "bed-22",
      "sofa-1", "sofa-2", "sofa-3", "sofa-4", "sofa-5", "sofa-6", "sofa-7",
      "sofa-8", "sofa-10", "sofa-13", "sofa-14",
      "sofa-15", "sofa-16", "sofa-17", "sofa-18", "sofa-19", "sofa-20"
    ],
    "Furniture & Seating": [
      "chair-1", "chair-2", "chair-3", "chair-4", "chair-5", "chair-6",
      "chair-7", "chair-8", "chair-9", "chair-10", "chair-11", "chair-12",
      "chair-13", "chair-14", "chair-15", "chair-16", "chair-17", "chair-18",
      "chair-19", "chair-20", "chair-21", "chair-22", "chair-23", "chair-24",
      "chair-25", "chair-26", "chair-27", "chair-28", "chair-29", "chair-30", "chair-31",
      "table-1", "table-2", "table-3", "table-4", "table-5", "table-6",
      "table-7", "table-8", "table-9", "table-10", "table-11", "table-12",
      "table-13", "table-14", "table-15", "table-16", "diningtable-1",
      "dressingtable-1", "dressingtable-2",
      "cupboard-1",
      "tv-1", "tv-2"
    ],
    "Kitchen Appliances": [
      "fridge-1", "fridge-2", "stove-1", "kitchen-1", "wash-1", "wash-2"
    ],
    "Bathroom Fixtures": [
      "toilet-1", "basin-1", "tap-1", "tub-1"
    ],
    "Building Access": [
      "elevator-1", "elevator-2", "stairs-1", "stairs-2"
    ],
    "Vehicles": [
      "car-1", "car-2", "bike-1", "bike-2"
    ]
  };

const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
  new Set(Object.keys(objectCategories))
);
const gridRef = useRef<HTMLDivElement>(null);

  const allObjects = Object.values(objectCategories).flat();

  const filteredCategories = searchQuery
    ? Object.entries(objectCategories).reduce((acc, [category, items]) => {
        const filtered = items.filter((item) =>
          item.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[category] = filtered;
        }
        return acc;
      }, {} as Record<string, string[]>)
    : objectCategories;

  const filteredObjects = searchQuery
    ? allObjects.filter((item) =>
        item.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allObjects;

  useEffect(() => {
    const currentViewImageMap = new Map<string, HTMLImageElement>();
    const topViewImageMap = new Map<string, HTMLImageElement>();
    let currentViewLoaded = 0;
    let topViewLoaded = 0;

    filteredObjects.forEach((item) => {
      const currentImg = new Image();
      currentImg.onload = () => {
        currentViewImageMap.set(item, currentImg);
        currentViewLoaded++;
        if (currentViewLoaded === filteredObjects.length) {
          setPreloadedImages(new Map(currentViewImageMap));
        }
      };
      currentImg.src =
        activeView === "top"
          ? `/Objects/image-top/${item}.png`
          : `/Objects/image-view/${item}.png`;
      const topImg = new Image();
      topImg.onload = () => {
        topViewImageMap.set(item, topImg);
        topViewLoaded++;
        if (topViewLoaded === filteredObjects.length) {
          setPreloadedTopImages((prev) => {
            const newMap = new Map(prev);
            topViewImageMap.forEach((img, key) => {
              newMap.set(key, img);
            });
            return newMap;
          });
        }
      };
      topImg.src = `/Objects/image-top/${item}.png`;
    });
  }, [filteredObjects, activeView]);

  useEffect(() => {
    setInfoToolPanelState(true, "placeObjects");
    document.body.setAttribute("data-objects-panel-active", "true");

    return () => {
      setInfoToolPanelState(false, null);
      document.body.removeAttribute("data-objects-panel-active");
    };
  }, []);

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const createDragImage = (e: React.DragEvent, item: string) => {
    const dragElement = document.createElement("div");
    dragElement.style.cssText = `
    position: absolute;
    top: -1000px;
    left: -1000px;
    width: 120px;
    height: 120px;
    background: transparent;
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

    const img = document.createElement("img");
    img.style.cssText = `
    max-width: 180px;
    max-height: 180px;
    object-fit: contain;
    pointer-events: none;
  `;

    const preloadedTopImage = preloadedTopImages.get(item);
    if (preloadedTopImage) {
      img.src = preloadedTopImage.src;
    } else {
      img.src = `/Objects/image-top/${item}.png`;
    }

    img.onerror = () => {
      img.style.display = "none";
      const fallbackText = document.createElement("div");
      fallbackText.textContent = "📦";
      fallbackText.style.cssText = `
        font-size: 32px;
        text-align: center;
      `;
      dragElement.appendChild(fallbackText);
    };

    dragElement.appendChild(img);
    document.body.appendChild(dragElement);

    try {
      e.dataTransfer.setDragImage(dragElement, 60, 60);
    } catch (error) {
      console.warn("Could not set drag image:", error);
    }

    setTimeout(() => {
      if (dragElement.parentNode) {
        dragElement.parentNode.removeChild(dragElement);
      }
    }, 100);
  };

  const handleDragStart = (e: React.DragEvent, item: string) => {
    e.stopPropagation();
    setIsDragging(true);
    const objectPath = `/Objects/image-top/${item}.png`;

    e.dataTransfer.setData("application/x-floor-plan-object", objectPath);
    e.dataTransfer.setData("text/plain", objectPath);
    e.dataTransfer.effectAllowed = "copy";

    setDraggedObject(item);

    createDragImage(e, item);
  };

  const handleDragEnd = () => {
    setDraggedObject(null);
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleClick = (item: string, event: React.MouseEvent) => {
    if (!isDragging) {
      const modalWidth = 250;
      const modalHeight = 250;
      
      const left = window.innerWidth - modalWidth - 50; 
      const top = (window.innerHeight - modalHeight) / 2; 
      
      setModalPosition({ top, left });
      setSelectedObject(item);
    }
  };

  const handleTouchStart = (e: React.TouchEvent, item: string) => {
    if (e.touches.length !== 1) return;

    e.preventDefault();
    const touch = e.touches[0];

    setTouchDragging({
      item,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });

    setDraggedObject(item);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragging || e.touches.length !== 1) return;

    e.preventDefault();
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

    e.preventDefault();
    const touch = e.changedTouches[0];

    const elementUnderTouch = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    );
    const floorPlanContainer = elementUnderTouch?.closest(
      ".floor-plan-container, svg"
    );

    if (floorPlanContainer) {
      const objectPath = `/Objects/image-top/${touchDragging.item}.png`;

      const customDropEvent = new CustomEvent("touchObjectDrop", {
        detail: {
          objectPath,
          clientX: touch.clientX,
          clientY: touch.clientY,
        },
      });

      document.dispatchEvent(customDropEvent);
    }

    setTouchDragging(null);
    setDraggedObject(null);
  };

const renderObjectItem = (item: string) => {
  const isCurrentlyDragging = draggedObject === item;
  const isTouchDragging = touchDragging?.item === item;

  return (
    <div
      key={item}
      className="object-item"
      draggable={true}
      onDragStart={(e) => handleDragStart(e, item)}
      onDragEnd={handleDragEnd}
      onTouchStart={(e) => handleTouchStart(e, item)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => handleClick(item, e)}
      style={{
        width: "67px",
        height: "90px", // Increased to fit image + text
        backgroundColor:
          isCurrentlyDragging || isTouchDragging ? "#f0f0f0" : "#f8f8f8",
        border:
          isCurrentlyDragging || isTouchDragging
            ? "2px dashed #999"
            : "1px solid #ddd",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: isCurrentlyDragging || isTouchDragging ? "grabbing" : "grab",
        transition: "all 0.2s",
        opacity: isCurrentlyDragging || isTouchDragging ? 0.7 : 1,
        transform:
          isCurrentlyDragging || isTouchDragging ? "scale(0.95)" : "scale(1)",
        touchAction: "none",
        overflow: "visible",
        padding: "2px",
      }}
      onMouseEnter={(e) => {
        if (!isCurrentlyDragging && !isTouchDragging) {
          e.currentTarget.style.backgroundColor = "#e0e0e0";
          e.currentTarget.style.borderColor = "#999";
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrentlyDragging && !isTouchDragging) {
          e.currentTarget.style.backgroundColor = "#f8f8f8";
          e.currentTarget.style.borderColor = "#ddd";
        }
      }}
    >
      <img
        src={
          activeView === "top"
            ? `/Objects/image-top/${item}.png`
            : `/Objects/image-view/${item}.png`
        }
        alt={item}
        style={{
          width: "75px",
          height: "75px",
          objectFit: "contain",
        }}
        onError={(e) => {
          e.currentTarget.src =
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='75' height='75'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='18'%3E%3F%3C/text%3E%3C/svg%3E";
        }}
      />
      <span
        style={{
          fontSize: "7px",
          color: "#666",
          textAlign: "center",
          marginTop: "1px",
          maxWidth: "100%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: "1",
        }}
      >
        {item}
      </span>
    </div>
  );
};

  return (
    <>
      <div
        className="panel-options objects-panel"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        <div
          className="search-container"
          style={{
            borderBottom: "1px solid #eee",
            marginBottom: "4px",
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search objects..."
            className="search-input"
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              fontSize: "14px",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            marginBottom: "8px",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <button
            onClick={() => setActiveView("front")}
            style={{
              flex: 1,
              padding: "8px 8px",
              backgroundColor: activeView === "front" ? "#000" : "#fff",
              color: activeView === "front" ? "#fff" : "#000",
              border: "none",
              fontSize: "14px",
              fontWeight: activeView === "front" ? "700" : "400",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Front View
          </button>
          <button
            onClick={() => setActiveView("top")}
            style={{
              flex: 1,
              padding: "8px 8px",
              backgroundColor: activeView === "top" ? "#000" : "#fff",
              color: activeView === "top" ? "#fff" : "#000",
              border: "none",
              borderLeft: "1px solid #ddd",
              fontSize: "14px",
              fontWeight: activeView === "top" ? "700" : "400",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Top View
          </button>
        </div>

        <div
          ref={gridRef}
          className="objects-grid scrollable-grid"
          style={{
            padding: "0px",
            position: "relative",
            left: "0.3rem",
            maxHeight: "calc(60vh - 180px)",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {Object.entries(filteredCategories).map(([category, items]) => (
            <div key={category} style={{ marginBottom: "12px" }}>
              <div
                onClick={() => toggleCategory(category)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  backgroundColor: "#f0f0f0",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginBottom: "6px",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#333",
                  }}
                >
                  {category} ({items.length})
                </span>
                <span
                  style={{
                    fontSize: "16px",
                    color: "#000",
                    transform: collapsedCategories.has(category)
                      ? "rotate(-90deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  ▼
                </span>
              </div>

              {!collapsedCategories.has(category) && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "6px",
                  
                  }}
                >
                  {items.map((item) => renderObjectItem(item))}
                </div>
              )}
            </div>
          ))}
        </div>

        {touchDragging && (
          <div
            style={{
              position: "fixed",
              left: touchDragging.currentX - 50,
              top: touchDragging.currentY - 50,
              width: "100px",
              height: "100px",
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
              src={`/Objects/image-top/${touchDragging.item}.png`}
              alt={touchDragging.item}
              style={{
                maxWidth: "100px",
                maxHeight: "100px",
                objectFit: "contain",
              }}
            />
          </div>
        )}
      </div>

      {selectedObject && modalPosition && (
        <div
          style={{
            position: "fixed",
            top: modalPosition.top,
            left: modalPosition.left,
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "15px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            border: "1px solid #ddd",
            zIndex: 10000,
            width: "250px",
            height: "250px",
          }}
          onClick={() => {
            setSelectedObject(null);
            setModalPosition(null);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedObject(null);
              setModalPosition(null);
            }}
            style={{
              position: "absolute",
              top: "5px",
              right: "5px",
              width: "25px",
              height: "25px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#f0f0f0",
              cursor: "pointer",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666",
            }}
          >
            ×
          </button>
          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: "14px",
              color: "#333",
              textAlign: "center",
            }}
          >
            {selectedObject}
          </h4>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "calc(100% - 40px)",
            }}
          >
            <img
              src={
                activeView === "top"
                  ? `/Objects/image-top/${selectedObject}.png`
                  : `/Objects/image-view/${selectedObject}.png`
              }
              alt={selectedObject}
              style={{
                maxWidth: "200px",
                maxHeight: "180px",
                objectFit: "contain",
              }}
              onError={(e) => {
                e.currentTarget.src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='180'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='24'%3E%3F%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ObjectsPanel;
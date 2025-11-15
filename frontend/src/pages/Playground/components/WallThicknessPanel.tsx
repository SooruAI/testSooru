import React from "react";
import { useFloorPlan } from "../FloorPlanContext";
import { isExternalWallSegment } from "../features/wallUtils";
import { formatImperialLength, coordToInches } from "../features/imperialUtils";
import "./WallThicknessPanel.css";

interface WallThicknessPanelProps {
  selectedWallId?: string;
  wallWidth?: number;
  onWidthChange?: (newWidth: number) => void;
}

const WallThicknessPanel: React.FC<WallThicknessPanelProps> = () => {
  const {
    selectedRoomIds,
    floorPlanData,
    wallWidths,
    updateWallWidth,
    hasChanges,
    captureOriginalState,
    setHasChanges,
    roomRotations,
    unitSystem
  } = useFloorPlan();

  const selectedWallId =
    selectedRoomIds.length === 1 ? selectedRoomIds[0] : null;
  const selectedRoom = selectedWallId
    ? floorPlanData.rooms.find((room) => room.id === selectedWallId)
    : null;
  const isStandaloneWall =
    selectedRoom &&
    selectedRoom.room_type === "Wall" &&
    selectedRoom.floor_polygon.length === 2;

  const isIndividualWallSegment =
    selectedWallId && selectedWallId.includes("-wall-");
  let isExternalWall = false;
  let roomId = "";
  let wallIndex = -1;

  if (isIndividualWallSegment) {
    const parts = selectedWallId.split("-wall-");
    roomId = parts[0];
    wallIndex = parseInt(parts[1]);
    isExternalWall = isExternalWallSegment(
      roomId,
      wallIndex,
      floorPlanData,
      roomRotations
    );
  }

  const isWallSelected = isStandaloneWall || isIndividualWallSegment;

  const baseWidth = selectedWallId
    ? wallWidths[selectedWallId] ||
      selectedRoom?.width ||
      (isStandaloneWall ? 6 : isExternalWall ? 2 : 4)
    : isStandaloneWall
    ? 6
    : isExternalWall
    ? 2
    : 4;

  const displayWidth = isExternalWall ? baseWidth + 3 : baseWidth;

  const handleWidthChange = (newWidth: number) => {
    if (!selectedWallId) return;

    if (!hasChanges) {
      captureOriginalState();
    }

    if (isIndividualWallSegment) {
      const storeWidth = isExternalWall ? newWidth - 2 : newWidth;
      const minStoreWidth = isExternalWall ? 1 : 4;
      updateWallWidth(selectedWallId, Math.max(minStoreWidth, storeWidth));
    } else if (isStandaloneWall) {
      updateWallWidth(selectedWallId, Math.max(4, newWidth));
    }

    setHasChanges(true);
  };

const handleIncrease = (e: React.MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();
  const newWidth = isExternalWall 
    ? Math.min(20, displayWidth) 
    : Math.min(20, displayWidth + 1);
  handleWidthChange(newWidth);
};

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const newWidth = Math.max(2, displayWidth-2 );
    handleWidthChange(newWidth);
  };

  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  if (!isWallSelected || !selectedWallId) {
    return null;
  }

  let wallType = "Wall Thickness";
  if (isStandaloneWall) {
    wallType = "Standalone Wall";
  } else if (isExternalWall) {
    wallType = "External Wall";
  } else if (isIndividualWallSegment) {
    wallType = "Internal Wall";
  }

  const thicknessInInches = coordToInches(displayWidth / 10);
  const formattedThickness = formatImperialLength(thicknessInInches, unitSystem);

  return (
    <div
      className="wall-thickness-panel"
      onClick={handlePanelClick}
      onMouseDown={handlePanelClick}
      onTouchStart={handleTouchStart}
    >
      <div className="panel-header">
        <p className="hh" style={{ position: "relative", left: "25px" }}>Wall Thickness</p>
      </div>
      <div className="width-display">{formattedThickness}</div>
      <div className="width-controls">
        <button
          className="control-button decrease"
          onClick={handleDecrease}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={displayWidth <= 4}
        >
          -
        </button>
        <div className="width-bar">
          <div
            className="width-indicator"
            style={{ width: `${(displayWidth / 20) * 100}%` }}
          ></div>
        </div>
        <button
          className="control-button increase"
          onClick={handleIncrease}
          onMouseDown={(e) => e.stopPropagation()}
          disabled={displayWidth >= 20}
        >
          +
        </button>
      </div>
    </div>
  );
};

export default WallThicknessPanel;
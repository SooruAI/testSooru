// features/styles.tsx
export const roomColors: Record<string, string> = {
  MasterRoom: "#FFD3B6",
  LivingRoom: "#FFAAA5",
  ChildRoom: "#D5AAFF",
  Kitchen: "#FFCC5C",
  Bathroom: "#85C1E9",
  Balcony: "#B2DFDB",
  SecondRoom: "#F6D55C",
  PoojaRoom: "#CDE6F9",
  DiningRoom: "#A5D6A7",
};

export const floorPlanStyles = `
.floor-plan {
  position: relative;
  background-color: #f8f8f8 !important;
  border: 2px solid #000 !important;
  overflow: hidden;
}

.room-polygon {
  opacity: 0.9 !important;
  stroke: #000 !important;  
  stroke-width: 4px;  
  cursor: move;
  transition: all 0.2s ease;
  stroke-linejoin: miter !important; 
  shape-rendering: crispEdges;
  touch-action: none !important; 
}

svg {
  vector-effect: non-scaling-stroke;
  touch-action: none !important; 
}

.floor-plan-container {
  touch-action: none !important;
}

.room-polygon.selected {
  fill: rgba(224, 224, 255, 0.8) !important;
  stroke: #0000ff !important;
  stroke-width: 4px; 
  filter: drop-shadow(0px 0px 3px rgba(0, 0, 255, 0.3)) !important;
}

.room-polygon.primary-selection {
  stroke: #1e88e5 !important;
  stroke-width: 4px;
  filter: drop-shadow(0px 0px 5px rgba(30, 136, 229, 0.5)) !important;
}

.room-polygon.secondary-selection {
  stroke: #0000ff !important;
  stroke-width: 3px;
  stroke-dasharray: 0 !important;
}

.room-polygon.overlapping {
  stroke: #ff0000 !important;
  stroke-width: 4px;
  stroke-dasharray: 5,5 !important;
}

.multi-select-indicator {
  fill: rgba(66, 133, 244, 0.1) !important;
  stroke: #4285F4 !important;
  stroke-width: 1px !important;
  stroke-dasharray: 5,3 !important;
  pointer-events: none;
}

.selection-badge {
  fill: #4285F4 !important;
  stroke: white !important;
  stroke-width: 1px !important;
  font-size: 12px !important;
  font-weight: bold;
  text-anchor: middle;
  pointer-events: none;
}

.resize-edge {
  cursor: move;
  stroke-opacity: 0.1 !important; 
  transition: stroke-opacity 0.2s;
  touch-action: none !important;
}

.resize-edge:hover {
  stroke-opacity: 0.3 !important;
  stroke: #0000ff !important;
}

.edge-indicator {
  stroke-opacity: 0 !important;
  transition: stroke-opacity 0.2s ease-in-out;
  pointer-events: none;
}

.resize-edge:hover + .edge-indicator,
.resize-edge:active + .edge-indicator {
  stroke-opacity: 1 !important;
  stroke: #0000ff !important;
}

.resize-handle {
  fill: white !important;
  stroke: black !important;
  stroke-width: 2px !important;
  cursor: nwse-resize;
  touch-action: none !important;
}

.resize-handle:hover {
  fill: #ffcc00 !important;
}

.room-label {
  pointer-events: none;
  user-select: none;
  font-size: 8px !important;
  text-anchor: middle;
  fill: #000000 !important;
}

.room-name {
  font-weight: bold;
  font-size: 14px !important;
  fill: #000000 !important;
}
.room-name1 {
  font-weight: bold;
  font-size: 9px !important;
  fill: #000000 !important;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.room-info {
  margin-top: 20px;
  border: 1px solid #ccc !important;
  border-radius: 5px;
}

.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.input-group label {
  width: 100px;
  font-weight: bold;
  color: #000000 !important;
}

.input-group input {
  padding: 5px;
  border: 1px solid #ccc !important;
  border-radius: 3px;
  background-color: #ffffff !important;
  color: #000000 !important;
}

button {
  padding: 8px 16px;
  margin: 0 5px;
  border: none !important;
  border-radius: 4px;
  cursor: pointer;
}

.save-button {
  background-color: rgba(0, 0, 0, 0.9) !important;
  color: white !important;
}

.save-button:hover {
  background-color: #444444 !important;
  border: 1px solid #000000 !important;t;
}

.undo-button {
  background-color: white !important;
  color: black !important;
  border: 1px solid #000000 !important;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: none;
  outline: none;
  text-transform: none;
}

.undo-button:hover {
  background-color: #F0F0F0 !important;
}

.buttons-container {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.overlap-alert {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: rgba(244, 67, 54, 0.8) !important; 
  color: white !important;
  padding: 10px 15px;
  text-align: center;
  font-weight: bold;
  z-index: 9999;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
  pointer-events: none;
}

.selection-toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.9) !important;
  border-radius: 8px;
  padding: 8px 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2) !important;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}

.selection-count {
  font-weight: bold;
  color: #4285F4 !important;
  margin-right: 8px;
}

.selection-action-button {
  padding: 4px 12px;
  border-radius: 4px;
  border: none !important;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.selection-action-button.group {
  background-color: #4285F4 !important;
  color: white !important;
}

.selection-action-button.ungroup {
  background-color: #EA4335 !important;
  color: white !important;
}

.selection-action-button:hover {
  filter: brightness(1.1);
}

.selection-action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 850px) {
  .room-label {
    font-size: 6px !important;
    fill: #000000 !important;
  }
  
  .room-name {
    font-size: 11px !important;
    fill: #000000 !important;
  }
  .room-name1 {
    font-size: 7px !important;
    fill: #000000 !important;

  }

  .resize-handle {
    r: 8 !important; 
    fill: white !important;
    stroke: black !important;
  }
  
  .resize-edge {
    stroke-width: 20px; 
    stroke-opacity: 0.15 !important;
  }
  
  .edge-indicator {
    stroke-width: 3px;
    stroke-opacity: 0.6 !important; 
  }
  
  .room-polygon {
    stroke-width: 4px; 
    stroke: #000 !important;
  }
  
  .selection-toolbar {
    padding: 6px 12px;
    background-color: rgba(255, 255, 255, 0.9) !important;
  }
  
  .selection-action-button {
    padding: 3px 8px;
    font-size: 12px;
  }

  .save-button {
  font-size: 11px;
  padding: 8px 6px;
}

.undo-button {
  font-size: 11px;
  padding: 8px 6px;
}
}

@media (max-width: 550px) {
  .save-button {
  font-size: 10px;
  padding: 7px 5px;
  width: 90px;
}

.undo-button {
  font-size: 10px;
  padding: 7px 5px;
  width: 90px;
}
}

.room-polygon.long-press-highlight {
  filter: brightness(1.1) drop-shadow(0 0 8px rgba(255, 255, 0, 0.8)) !important;
  stroke: #FFD700 !important;
  stroke-width: 3 !important;
  animation: pulse 0.5s infinite alternate;
}

@keyframes pulse {
  from { filter: brightness(1.1) drop-shadow(0 0 8px rgba(255, 255, 0, 0.8)) !important; }
  to { filter: brightness(1.2) drop-shadow(0 0 12px rgba(255, 255, 0, 0.9)) !important; }
}
`;

export const wallStyles = `
  .wall-polygon {
    fill-opacity: 0.9;
    stroke-linecap: square;
  }
`;
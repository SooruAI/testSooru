import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

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

interface OverlaySettings {
    showOverlays: boolean;
    showTotalArea: boolean;
    showRoomCount: boolean;
    showRoomDetails: boolean;
    showRoomTypes: boolean;
    showDimensions: boolean;
    showPlotDimensions: boolean;
    showRoomAreas: boolean;
    showRoomLabels: boolean;
    overlayOpacity: number;
    overlaySize: 'small' | 'medium' | 'large';
}

interface PropertyOverlay3DProps {
    floorPlanData: any;
    camera: THREE.PerspectiveCamera | null;
    scene: THREE.Scene | null;
    renderer: THREE.WebGLRenderer | null;
    overlaySettings: OverlaySettings;
    cameraMode: string; // 'orbit' or 'player'
    playerPosition?: THREE.Vector3; // Player's current position
}

const PropertyOverlay3D: React.FC<PropertyOverlay3DProps> = ({
    floorPlanData,
    camera,
    scene,
    renderer,
    overlaySettings,
    cameraMode,
    playerPosition
}) => {
    const [overlayPositions, setOverlayPositions] = useState<{ [key: string]: { x: number, y: number } }>({});
    const [dimensionLinePositions, setDimensionLinePositions] = useState<{
        width: { start: { x: number, y: number }, end: { x: number, y: number }, center: { x: number, y: number } },
        length: { start: { x: number, y: number }, end: { x: number, y: number }, center: { x: number, y: number } }
    } | null>(null);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const dimensionLinesRef = useRef<THREE.Group | null>(null);

    // Size configurations
    const sizeConfig = {
        small: { fontSize: '10px', padding: '4px 6px', minWidth: '100px' },
        medium: { fontSize: '11px', padding: '6px 8px', minWidth: '120px' },
        large: { fontSize: '12px', padding: '8px 10px', minWidth: '140px' }
    };

    const currentSize = sizeConfig[overlaySettings.overlaySize];

    // Function to check if a point is inside a polygon (room)
    const isPointInPolygon = (point: { x: number, z: number }, polygon: Point[]): boolean => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].z;
            const xj = polygon[j].x, yj = polygon[j].z;
            
            if (((yi > point.z) !== (yj > point.z)) && 
                (point.x < (xj - xi) * (point.z - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    };

    // Find which room the player is currently in
    const findPlayerRoom = (): Room | null => {
        if (!playerPosition || !floorPlanData?.rooms || cameraMode !== 'person') return null;

        const playerPoint = { x: playerPosition.x, z: playerPosition.z };
        
        for (const room of floorPlanData.rooms) {
            if (room.room_type === "Wall" || room.room_type === "Boundary") continue;
            
            if (isPointInPolygon(playerPoint, room.floor_polygon)) {
                return room;
            }
        }
        return null;
    };

    // Update current room when player position changes
    useEffect(() => {
        if (cameraMode === 'person' && playerPosition) {
            const room = findPlayerRoom();
            setCurrentRoom(room);
        } else {
            setCurrentRoom(null);
        }
    }, [playerPosition, cameraMode, floorPlanData]);

    // Convert 3D world position to screen coordinates
    const worldToScreen = (worldPosition: THREE.Vector3) => {
        if (!camera || !renderer) return { x: 0, y: 0 };

        const vector = worldPosition.clone();
        vector.project(camera);

        const canvas = renderer.domElement;
        const rect = canvas.getBoundingClientRect();

        return {
            x: (vector.x * 0.5 + 0.5) * rect.width + rect.left,
            y: (-vector.y * 0.5 + 0.5) * rect.height + rect.top
        };
    };

    // Calculate room center position in 3D space
    const getRoomCenter = (room: Room) => {
        if (!room.floor_polygon || room.floor_polygon.length === 0) {
            return new THREE.Vector3(0, 0, 0);
        }

        let centerX = 0;
        let centerZ = 0;
        
        room.floor_polygon.forEach(point => {
            centerX += point.x;
            centerZ += point.z;
        });

        centerX /= room.floor_polygon.length;
        centerZ /= room.floor_polygon.length;

        return new THREE.Vector3(centerX, 60, centerZ);
    };

    // Calculate plot dimensions and create dimension lines
    const createDimensionLines = () => {
        if (!floorPlanData?.rooms || !scene || !overlaySettings.showPlotDimensions) {
            if (dimensionLinesRef.current) {
                if (scene) {
                    scene.remove(dimensionLinesRef.current);
                }
                dimensionLinesRef.current = null;
            }
            return null;
        }

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        
        floorPlanData.rooms.forEach((room: Room) => {
            room.floor_polygon.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minZ = Math.min(minZ, point.z);
                maxZ = Math.max(maxZ, point.z);
            });
        });
        
        const width = maxX - minX;
        const length = maxZ - minZ;
        const offset = 30;

        if (dimensionLinesRef.current) {
            scene.remove(dimensionLinesRef.current);
        }

        const dimensionGroup = new THREE.Group();
        dimensionGroup.name = 'dimensionLines';

        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x2563eb, 
            linewidth: 3,
            transparent: true,
            opacity: overlaySettings.overlayOpacity 
        });

        // Width dimension line
        const widthPoints = [
            new THREE.Vector3(minX, 1, minZ - offset),
            new THREE.Vector3(maxX, 1, minZ - offset)
        ];
        const widthGeometry = new THREE.BufferGeometry().setFromPoints(widthPoints);
        const widthLine = new THREE.Line(widthGeometry, lineMaterial);
        dimensionGroup.add(widthLine);

        // Width tick marks
        const tickHeight = 5;
        const widthStartTick = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(minX, 1, minZ - offset - tickHeight),
            new THREE.Vector3(minX, 1, minZ - offset + tickHeight)
        ]);
        const widthEndTick = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(maxX, 1, minZ - offset - tickHeight),
            new THREE.Vector3(maxX, 1, minZ - offset + tickHeight)
        ]);
        dimensionGroup.add(new THREE.Line(widthStartTick, lineMaterial));
        dimensionGroup.add(new THREE.Line(widthEndTick, lineMaterial));

        // Length dimension line
        const lengthPoints = [
            new THREE.Vector3(minX - offset, 1, minZ),
            new THREE.Vector3(minX - offset, 1, maxZ)
        ];
        const lengthGeometry = new THREE.BufferGeometry().setFromPoints(lengthPoints);
        const lengthLine = new THREE.Line(lengthGeometry, lineMaterial);
        dimensionGroup.add(lengthLine);

        // Length tick marks
        const lengthStartTick = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(minX - offset - tickHeight, 1, minZ),
            new THREE.Vector3(minX - offset + tickHeight, 1, minZ)
        ]);
        const lengthEndTick = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(minX - offset - tickHeight, 1, maxZ),
            new THREE.Vector3(minX - offset + tickHeight, 1, maxZ)
        ]);
        dimensionGroup.add(new THREE.Line(lengthStartTick, lineMaterial));
        dimensionGroup.add(new THREE.Line(lengthEndTick, lineMaterial));

        scene.add(dimensionGroup);
        dimensionLinesRef.current = dimensionGroup;

        return {
            width,
            length,
            area: width * length,
            widthCenter: new THREE.Vector3((minX + maxX) / 2, 1, minZ - offset),
            lengthCenter: new THREE.Vector3(minX - offset, 1, (minZ + maxZ) / 2)
        };
    };

    // Update overlay positions and dimension lines
    const updateOverlayPositions = () => {
        if (!floorPlanData?.rooms || !camera || !renderer || !overlaySettings.showOverlays) return;

        // Only update room positions in orbit mode
        if (cameraMode === 'orbit') {
            const newPositions: { [key: string]: { x: number, y: number } } = {};

            floorPlanData.rooms.forEach((room: Room) => {
                if (room.room_type === "Wall") return;

                const worldCenter = getRoomCenter(room);
                const screenPos = worldToScreen(worldCenter);
                newPositions[room.id] = screenPos;
            });

            setOverlayPositions(newPositions);
        }

        // Update dimension line positions for both modes
        const plotInfo = createDimensionLines();
        if (plotInfo && overlaySettings.showPlotDimensions) {
            const widthLabelPos = worldToScreen(plotInfo.widthCenter);
            const lengthLabelPos = worldToScreen(plotInfo.lengthCenter);
            
            setDimensionLinePositions({
                width: {
                    start: worldToScreen(new THREE.Vector3(plotInfo.widthCenter.x - plotInfo.width/2, 1, plotInfo.widthCenter.z)),
                    end: worldToScreen(new THREE.Vector3(plotInfo.widthCenter.x + plotInfo.width/2, 1, plotInfo.widthCenter.z)),
                    center: widthLabelPos
                },
                length: {
                    start: worldToScreen(new THREE.Vector3(plotInfo.lengthCenter.x, 1, plotInfo.lengthCenter.z - plotInfo.length/2)),
                    end: worldToScreen(new THREE.Vector3(plotInfo.lengthCenter.x, 1, plotInfo.lengthCenter.z + plotInfo.length/2)),
                    center: lengthLabelPos
                }
            });
        }
    };

    // Update positions when camera moves
    useEffect(() => {
        if (!overlaySettings.showOverlays) {
            if (dimensionLinesRef.current && scene) {
                scene.remove(dimensionLinesRef.current);
                dimensionLinesRef.current = null;
            }
            return;
        }

        const animate = () => {
            updateOverlayPositions();
            requestAnimationFrame(animate);
        };
        
        const animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [overlaySettings.showOverlays, camera, renderer, floorPlanData, overlaySettings.showPlotDimensions, cameraMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (dimensionLinesRef.current && scene) {
                scene.remove(dimensionLinesRef.current);
            }
        };
    }, [scene]);

    if (!overlaySettings.showOverlays || !floorPlanData) return null;

    const plotInfo = (() => {
        if (!floorPlanData?.rooms) return null;
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        floorPlanData.rooms.forEach((room: Room) => {
            room.floor_polygon.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minZ = Math.min(minZ, point.z);
                maxZ = Math.max(maxZ, point.z);
            });
        });
        return {
            width: maxX - minX,
            length: maxZ - minZ,
            area: (maxX - minX) * (maxZ - minZ)
        };
    })();

    const totalRooms = floorPlanData.rooms.filter((room: Room) => room.room_type !== "Wall").length;

    return (
        <>
            {/* Dimension Line Labels - shown in both modes */}
            {overlaySettings.showPlotDimensions && dimensionLinePositions && plotInfo && (
                <>
                    <div
                        className="dimension-label-3d"
                        style={{
                            position: 'fixed',
                            left: dimensionLinePositions.width.center.x - 40,
                            top: dimensionLinePositions.width.center.y + 10,
                            zIndex: 1500,
                            opacity: overlaySettings.overlayOpacity,
                            fontSize: currentSize.fontSize
                        }}
                    >
                        <div className="dimension-badge">
                            {plotInfo.width.toFixed(1)}m
                        </div>
                    </div>

                    <div
                        className="dimension-label-3d"
                        style={{
                            position: 'fixed',
                            left: dimensionLinePositions.length.center.x - 40,
                            top: dimensionLinePositions.length.center.y - 10,
                            zIndex: 1500,
                            opacity: overlaySettings.overlayOpacity,
                            fontSize: currentSize.fontSize
                        }}
                    >
                        <div className="dimension-badge">
                            {plotInfo.length.toFixed(1)}m
                        </div>
                    </div>
                </>
            )}

            {/* Summary Panel - content varies by mode */}
            <div
                className="summary-overlay-3d"
                style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    zIndex: 1500,
                    opacity: overlaySettings.overlayOpacity,
                    fontSize: currentSize.fontSize
                }}
            >
                <div className={`overlay-card ${cameraMode === 'person' ? 'player-mode-card' : 'summary-card'}`}>
                    <div className="overlay-header">
                        <span className="overlay-icon">
                            {cameraMode === 'person' ? '🚶' : '📊'}
                        </span>
                        <span>{cameraMode === 'person' ? 'Current Location' : 'Summary'}</span>
                    </div>
                    <div className="overlay-content">
                        {cameraMode === 'person' ? (
                            // Player mode - show current room info
                            <>
                                {currentRoom ? (
                                    <>
                                        <div className="overlay-item">
                                            <span className="label">Room:</span>
                                            <span className="value">{currentRoom.room_type}</span>
                                        </div>
                                        {overlaySettings.showRoomAreas && (
                                            <div className="overlay-item">
                                                <span className="label">Area:</span>
                                                <span className="value">{currentRoom.area?.toFixed(2)} m²</span>
                                            </div>
                                        )}
                                        {overlaySettings.showDimensions && (
                                            <div className="overlay-item">
                                                <span className="label">Size:</span>
                                                <span className="value">
                                                    {currentRoom.width?.toFixed(1)}m × {currentRoom.height?.toFixed(1)}m
                                                </span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="overlay-item">
                                        <span className="label">Status:</span>
                                        <span className="value">Outside rooms</span>
                                    </div>
                                )}
                                {/* Separator */}
                                <div className="overlay-separator"></div>
                                {/* Total info */}
                                {overlaySettings.showTotalArea && (
                                    <div className="overlay-item">
                                        <span className="label">Total Area:</span>
                                        <span className="value">{floorPlanData.total_area.toFixed(2)} m²</span>
                                    </div>
                                )}
                                {overlaySettings.showRoomCount && (
                                    <div className="overlay-item">
                                        <span className="label">Total Rooms:</span>
                                        <span className="value">{totalRooms}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            // Orbit mode - show summary info
                            <>
                                {overlaySettings.showTotalArea && (
                                    <div className="overlay-item">
                                        <span className="label">Total Area:</span>
                                        <span className="value">{floorPlanData.total_area.toFixed(2)} m²</span>
                                    </div>
                                )}
                                {overlaySettings.showRoomCount && (
                                    <div className="overlay-item">
                                        <span className="label">Rooms:</span>
                                        <span className="value">{totalRooms}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Room Information Overlays - only shown in orbit mode */}
            {cameraMode === 'orbit' && floorPlanData.rooms.map((room: Room) => {
                if (room.room_type === "Wall" || !overlayPositions[room.id]) return null;
                
                const hasVisibleContent = overlaySettings.showRoomLabels || 
                                        overlaySettings.showRoomAreas || 
                                        overlaySettings.showDimensions;

                if (!hasVisibleContent) return null;

                return (
                    <div
                        key={`overlay-${room.id}`}
                        className="room-overlay-3d"
                        style={{
                            position: 'fixed',
                            left: Math.min(overlayPositions[room.id].x + 10, window.innerWidth - 160),
                            top: Math.max(overlayPositions[room.id].y - 30, 20),
                            zIndex: 1400,
                            opacity: overlaySettings.overlayOpacity,
                            fontSize: currentSize.fontSize,
                            minWidth: currentSize.minWidth
                        }}
                    >
                        <div className="overlay-card room-card">
                            {overlaySettings.showRoomLabels && (
                                <div className="overlay-header">
                                    <span className="overlay-icon">📍</span>
                                    <span>{room.room_type || 'Unnamed Room'}</span>
                                </div>
                            )}
                            <div className="overlay-content">
                                {overlaySettings.showRoomAreas && (
                                    <div className="overlay-item">
                                        <span className="label">Area:</span>
                                        <span className="value">{room.area?.toFixed(2)} m²</span>
                                    </div>
                                )}
                                {overlaySettings.showDimensions && (
                                    <div className="overlay-item">
                                        <span className="label">Size:</span>
                                        <span className="value">
                                            {room.width?.toFixed(1)}m × {room.height?.toFixed(1)}m
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* CSS Styles */}
            <style>{`
                .room-overlay-3d, .summary-overlay-3d, .dimension-label-3d {
                    pointer-events: none;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    transition: opacity 0.3s ease;
                }

                .overlay-card {
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    overflow: hidden;
                    animation: fadeInScale 0.3s ease-out;
                }

                .summary-card {
                    border-left: 3px solid #3b82f6;
                    min-width: 140px;
                }

                .player-mode-card {
                    border-left: 3px solid #f59e0b;
                    min-width: 160px;
                }

                .room-card {
                    border-left: 3px solid #10b981;
                }

                .overlay-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: ${currentSize.padding};
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                    font-weight: 600;
                    color: #1e293b;
                    font-size: ${currentSize.fontSize};
                }

                .overlay-icon {
                    font-size: 12px;
                }

                .overlay-content {
                    padding: ${currentSize.padding};
                }

                .overlay-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                    gap: 8px;
                }

                .overlay-item:last-child {
                    margin-bottom: 0;
                }

                .overlay-item .label {
                    color: #64748b;
                    font-weight: 500;
                    flex-shrink: 0;
                    font-size: ${currentSize.fontSize};
                }

                .overlay-item .value {
                    color: #1e293b;
                    font-weight: 600;
                    text-align: right;
                    font-size: ${currentSize.fontSize};
                }

                .overlay-separator {
                    height: 1px;
                    background: #e2e8f0;
                    margin: 8px 0;
                }

                .dimension-badge {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: ${currentSize.fontSize};
                    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
                    text-align: center;
                    min-width: 50px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.9) translateY(5px);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1) translateY(0);
                    }
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .room-overlay-3d {
                        left: 10px !important;
                        right: 10px !important;
                        min-width: auto !important;
                        max-width: calc(100vw - 20px) !important;
                    }
                    
                    .summary-overlay-3d {
                        right: 10px !important;
                        left: auto !important;
                    }
                    
                    .dimension-label-3d {
                        transform: scale(0.9);
                    }
                }
            `}</style>
        </>
    );
};

export default PropertyOverlay3D;
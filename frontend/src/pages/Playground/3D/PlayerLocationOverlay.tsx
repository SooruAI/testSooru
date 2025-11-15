import React from 'react';
import { MapPin } from 'lucide-react';

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
}

interface PlayerLocationOverlayProps {
    visible: boolean;
    currentRoom: Room | null;
    floorPlanData: FloorPlanData | null;
}

const PlayerLocationOverlay: React.FC<PlayerLocationOverlayProps> = ({
    visible,
    currentRoom,
    floorPlanData
}) => {
    if (!visible) return null;

    const totalRooms = floorPlanData?.rooms.filter(room => room.room_type !== "Wall").length || 0;

    return (
        <div className="player-location-overlay">
            <div className="location-header">
                <MapPin size={16} />
                <span>Current Location</span>
            </div>
            <div className="location-content">
                {currentRoom ? (
                    <>
                        <div className="location-item">
                            <span className="location-label">Room Type:</span>
                            <span className="location-value">{currentRoom.room_type}</span>
                        </div>
                        <div className="location-item">
                            <span className="location-label">Area:</span>
                            <span className="location-value">{currentRoom.area?.toFixed(2)} m²</span>
                        </div>
                        {/* <div className="location-separator"></div> */}
                        {/* <div className="location-item">
                            <span className="location-label">Total Area:</span>
                            <span className="location-value">{floorPlanData?.total_area.toFixed(2)} m²</span>
                        </div>
                        <div className="location-item">
                            <span className="location-label">Total Rooms:</span>
                            <span className="location-value">{totalRooms}</span>
                        </div> */}
                    </>
                ) : (
                    <>
                        <div className="location-item">
                            <span className="location-label">Status:</span>
                            <span className="location-value">Outside rooms</span>
                        </div>
                        <div className="location-separator"></div>
                        <div className="location-item">
                            <span className="location-label">Total Area:</span>
                            <span className="location-value">{floorPlanData?.total_area.toFixed(2)} m²</span>
                        </div>
                        <div className="location-item">
                            <span className="location-label">Total Rooms:</span>
                            <span className="location-value">{totalRooms}</span>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .player-location-overlay {
                    position: fixed;
                    top: 90px;
                    right: 20px;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    z-index: 1000;
                    min-width: 220px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    animation: slideIn 0.3s ease-out;
                }

                .location-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    background: rgba(59, 130, 246, 0.1);
                    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
                    border-radius: 12px 12px 0 0;
                    font-weight: 600;
                    font-size: 14px;
                    color: #1e40af;
                }

                .location-content {
                    padding: 12px 16px;
                }

                .location-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    font-size: 13px;
                }

                .location-item:last-child {
                    margin-bottom: 0;
                }

                .location-separator {
                    height: 1px;
                    background: rgba(0, 0, 0, 0.1);
                    margin: 10px 0;
                }

                .location-label {
                    font-weight: 500;
                    color: #6b7280;
                    flex-shrink: 0;
                }

                .location-value {
                    font-weight: 600;
                    color: #111827;
                    text-align: right;
                    margin-left: 12px;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(20px) translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) translateY(0);
                    }
                }

                @media (max-width: 768px) {
                    .player-location-overlay {
                        // top: 10px;
                        right: 10px;
                        min-width: 200px;
                        font-size: 12px;
                    }
                    
                    .location-header {
                        padding: 10px 12px;
                        font-size: 13px;
                    }
                    
                    .location-content {
                        padding: 10px 12px;
                    }
                    
                    .location-item {
                        font-size: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

export default PlayerLocationOverlay;
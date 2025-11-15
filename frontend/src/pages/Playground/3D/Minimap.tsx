import React, { useEffect, useRef, useState } from 'react';
import * as t from 'three';
import './Minimap.css';

interface Point {
    x: number;
    z: number;
}

interface Room {
    id: string;
    room_type: string;
    floor_polygon: Point[];
}

interface FloorPlanData {
    rooms: Room[];
}

interface MinimapProps {
    playerPosition: t.Vector3 | null;
    playerRotation: number;
    visible: boolean;
    currentRoom?: Room | null;
    floorPlanData: FloorPlanData | null;
}

interface Dimensions {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
}

const Minimap: React.FC<MinimapProps> = ({
    playerPosition,
    playerRotation,
    visible,
    currentRoom,
    floorPlanData
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState<Dimensions>({
        minX: 0,
        maxX: 100,
        minZ: 0,
        maxZ: 100
    });

    const [canvasSize] = useState({
        width: window.innerWidth <= 1024 ? 130 : 200,
        height: window.innerWidth <= 1024 ? 130 : 200
    });

    const isPointInPolygon = (point: Point, polygon: Point[]): boolean => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i].z > point.z) !== (polygon[j].z > point.z)) &&
                (point.x < (polygon[j].x - polygon[i].x) * (point.z - polygon[i].z) / (polygon[j].z - polygon[i].z) + polygon[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    };

    const findPlayerRoom = (): Room | null => {
        if (!playerPosition || !floorPlanData?.rooms) return null;

        const playerPoint = { x: playerPosition.x, z: playerPosition.z };

        for (const room of floorPlanData.rooms) {
            if (room.room_type === "Wall" || room.room_type === "Reference") continue;

            if (isPointInPolygon(playerPoint, room.floor_polygon)) {
                return room;
            }
        }
        return null;
    };

    const getCurrentRoom = (): Room | null => {
        return currentRoom || findPlayerRoom();
    };

    useEffect(() => {
        if (!floorPlanData?.rooms?.length) {
            console.log('No floor plan data available for minimap');
            return;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;
        let roomCount = 0;

        floorPlanData.rooms.forEach((room) => {
            if (room.room_type === "Wall" || room.room_type === "Reference") return;

            roomCount++;
            room.floor_polygon.forEach((point) => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minZ = Math.min(minZ, point.z);
                maxZ = Math.max(maxZ, point.z);
            });
        });

        if (minX === Infinity || maxX === -Infinity || minZ === Infinity || maxZ === -Infinity) {
            console.warn('Invalid floor plan bounds detected, using fallback');
            setDimensions({ minX: -50, maxX: 50, minZ: -50, maxZ: 50 });
            return;
        }

        const padding = Math.max(20, (maxX - minX) * 0.1, (maxZ - minZ) * 0.1);
        setDimensions({
            minX: minX - padding,
            maxX: maxX + padding,
            minZ: minZ - padding,
            maxZ: maxZ + padding
        });

        console.log('Minimap bounds calculated:', {
            roomCount,
            bounds: { minX, maxX, minZ, maxZ },
            withPadding: {
                minX: minX - padding,
                maxX: maxX + padding,
                minZ: minZ - padding,
                maxZ: maxZ + padding
            }
        });
    }, [floorPlanData]);

    useEffect(() => {
        if (!canvasRef.current || !visible) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvasSize;

        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#000';
        const fontSize = Math.max(12, width / 12);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const compassOffset = Math.max(15, width / 12);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        [
            { x: width / 2, y: compassOffset },
            { x: width / 2, y: height - compassOffset },
            { x: width - compassOffset, y: height / 2 },
            { x: compassOffset, y: height / 2 }
        ].forEach(pos => {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, fontSize * 1.2, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = '#000';
        ctx.fillText('S', width / 2, compassOffset);
        ctx.fillText('N', width / 2, height - compassOffset);
        ctx.fillText('W', width - compassOffset, height / 2);
        ctx.fillText('E', compassOffset, height / 2);

        if (!floorPlanData?.rooms?.length) {
            console.log('Drawing minimap without floor plan data');

            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, width / 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            if (playerPosition) {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(width / 2, height / 2, 8, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(width / 2, height / 2);
                ctx.rotate(playerRotation);
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(0, -12);
                ctx.lineTo(-6, 6);
                ctx.lineTo(6, 6);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            return;
        }

        const mapWidth = dimensions.maxX - dimensions.minX;
        const mapHeight = dimensions.maxZ - dimensions.minZ;
        const mapCenterX = (dimensions.minX + dimensions.maxX) / 2;
        const mapCenterZ = (dimensions.minZ + dimensions.maxZ) / 2;

        if (mapWidth <= 0 || mapHeight <= 0) {
            console.warn('Invalid map dimensions:', { mapWidth, mapHeight });
            return;
        }

        const mapScale = Math.min(width, height) * 0.7 / Math.max(mapWidth, mapHeight);

        // Draw walls first (as lines)
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        floorPlanData.rooms.forEach((room) => {
            if (room.room_type !== "Wall") return;
            if (!room.floor_polygon?.length || room.floor_polygon.length !== 2) return;

            const start = room.floor_polygon[0];
            const end = room.floor_polygon[1];

            const x1 = (start.x - mapCenterX) * mapScale + width / 2;
            const y1 = (start.z - mapCenterZ) * mapScale + height / 2;
            const x2 = (end.x - mapCenterX) * mapScale + width / 2;
            const y2 = (end.z - mapCenterZ) * mapScale + height / 2;

            if (isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2)) {
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        });

        // Draw rooms
        let roomsDrawn = 0;
        const currentRoomId = getCurrentRoom()?.id;

        floorPlanData.rooms.forEach((room) => {
            if (room.room_type === "Wall" || room.room_type === "Reference") return;
            if (!room.floor_polygon?.length) return;

            const isCurrentRoom = room.id === currentRoomId;
            const isBoundaryRoom = room.room_type?.toLowerCase() === 'boundary';

            ctx.beginPath();
            if (isBoundaryRoom) {
                ctx.fillStyle = 'transparent';
            } else {
                ctx.fillStyle = isCurrentRoom ? 'rgba(100, 150, 255, 0.8)' : 'rgba(180, 180, 180, 0.8)';
            }
            ctx.strokeStyle = isCurrentRoom ? '#0066cc' : '#333';
            ctx.lineWidth = isCurrentRoom ? 3 : 2;

            let validPoints = 0;
            room.floor_polygon.forEach((point, pointIndex) => {
                const x = (point.x - mapCenterX) * mapScale + width / 2;
                const y = (point.z - mapCenterZ) * mapScale + height / 2;

                if (isFinite(x) && isFinite(y)) {
                    if (pointIndex === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    validPoints++;
                }
            });

            if (validPoints >= 3) {
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                roomsDrawn++;
            }
        });

        if (playerPosition) {
            const playerWorldX = playerPosition.x;
            const playerWorldZ = playerPosition.z;
            const playerX = (playerWorldX - mapCenterX) * mapScale + width / 2;
            const playerY = (playerWorldZ - mapCenterZ) * mapScale + height / 2;

            if (isFinite(playerX) && isFinite(playerY)) {
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(playerX, playerY, 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(playerX, playerY);
                ctx.rotate(-playerRotation + Math.PI);
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.moveTo(0, -10);
                ctx.lineTo(-5, 5);
                ctx.lineTo(5, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else {
                console.warn('Invalid player screen coordinates:', { playerX, playerY });
            }
        }

    }, [visible, playerPosition, playerRotation, dimensions, canvasSize, currentRoom, floorPlanData]);

    if (!visible) return null;

    return (
        <div className="minimap-container">
            <div className="minimap-content">
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                />
            </div>
        </div>
    );
};

export default Minimap;
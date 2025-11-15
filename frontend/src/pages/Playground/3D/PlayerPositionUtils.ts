// PlayerPositionUtils.ts
import * as THREE from 'three';

interface Point {
    x: number;
    z: number;
}

interface Room {
    id: string;
    room_type: string;
    area?: number;
    height?: number;
    width?: number;
    floor_polygon: Point[];
}

interface FloorPlanData {
    rooms: Room[];
}

interface PlayerPositionInfo {
    position: THREE.Vector3;
    orientation: number;
    floorPlanBounds: {
        minX: number;
        maxX: number;
        minZ: number;
        maxZ: number;
        centerX: number;
        centerZ: number;
        width: number;
        depth: number;
    };
}

export class PlayerPositionUtils {
    
    /**
     * Calculate the optimal initial player position based on floor plan data
     */
    static calculateOptimalPlayerPosition(floorPlanData: FloorPlanData): PlayerPositionInfo {
        // Validate floor plan data
        if (!floorPlanData?.rooms || floorPlanData.rooms.length === 0) {
            console.warn('No valid floor plan data for player positioning');
            return this.getFallbackPositionInfo();
        }

        const bounds = this.calculateFloorPlanBounds(floorPlanData);
        
        // Check if bounds are valid
        if (!isFinite(bounds.width) || !isFinite(bounds.depth) || bounds.width <= 0 || bounds.depth <= 0) {
            console.warn('Invalid floor plan bounds, using fallback position');
            return this.getFallbackPositionInfo();
        }
        
        // Find the best starting position
        const startPosition = this.findOptimalStartPosition(floorPlanData, bounds);
        
        // Calculate orientation to face the building center
        const orientation = this.calculateOptimalOrientation(startPosition, bounds);
        
        console.log('Calculated optimal player position:', {
            position: startPosition,
            orientation: orientation,
            bounds: bounds
        });
        
        return {
            position: startPosition,
            orientation: orientation,
            floorPlanBounds: bounds
        };
    }

    /**
     * Get fallback position when calculations fail
     */
    private static getFallbackPositionInfo(): PlayerPositionInfo {
        return {
            position: new THREE.Vector3(0, 0, 100),
            orientation: Math.PI,
            floorPlanBounds: {
                minX: -50, maxX: 50, minZ: -50, maxZ: 50,
                centerX: 0, centerZ: 0,
                width: 100, depth: 100
            }
        };
    }

    /**
     * Calculate the bounds of the entire floor plan
     */
    private static calculateFloorPlanBounds(floorPlanData: FloorPlanData) {
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        // Calculate bounds from all rooms (except Wall type)
        floorPlanData.rooms.forEach(room => {
            if (room.room_type === "Wall" || room.room_type === "Reference") return;
            
            room.floor_polygon.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minZ = Math.min(minZ, point.z);
                maxZ = Math.max(maxZ, point.z);
            });
        });

        // Fallback to default bounds if no valid rooms found
        if (!isFinite(minX)) {
            minX = -50; maxX = 50; minZ = -50; maxZ = 50;
        }

        const centerX = (minX + maxX) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const width = maxX - minX;
        const depth = maxZ - minZ;

        return {
            minX, maxX, minZ, maxZ,
            centerX, centerZ,
            width, depth
        };
    }

    /**
     * Find the optimal starting position for the player
     * Priority: 1) Front of building, 2) Side with most space, 3) Fallback
     */
    private static findOptimalStartPosition(floorPlanData: FloorPlanData, bounds: any): THREE.Vector3 {
        const { centerX, centerZ, width, depth, minX, maxX, minZ, maxZ } = bounds;
        
        // Calculate offset distance based on building size
        const offsetDistance = Math.max(width, depth) * 0.4 + 30; // At least 30 units away
        
        // Define potential starting positions (front, back, left, right)
        const candidatePositions = [
            // Front (south) - usually the main entrance
            { pos: new THREE.Vector3(centerX, 0, maxZ + offsetDistance), priority: 1 },
            // Back (north)
            { pos: new THREE.Vector3(centerX, 0, minZ - offsetDistance), priority: 3 },
            // Right (east)
            { pos: new THREE.Vector3(maxX + offsetDistance, 0, centerZ), priority: 2 },
            // Left (west)
            { pos: new THREE.Vector3(minX - offsetDistance, 0, centerZ), priority: 2 },
        ];

        // Find the position with the most clearance from rooms
        let bestPosition = candidatePositions[0]; // Default to front
        let bestClearance = 0;

        candidatePositions.forEach(candidate => {
            const clearance = this.calculatePositionClearance(candidate.pos, floorPlanData);
            const adjustedScore = clearance - (candidate.priority * 10); // Prefer front position
            
            if (adjustedScore > bestClearance) {
                bestClearance = adjustedScore;
                bestPosition = candidate;
            }
        });

        return bestPosition.pos;
    }

    /**
     * Calculate how much clearance a position has from all rooms
     */
    private static calculatePositionClearance(position: THREE.Vector3, floorPlanData: FloorPlanData): number {
        let minDistance = Infinity;

        floorPlanData.rooms.forEach(room => {
            if (room.room_type === "Wall" || room.room_type === "Reference") return;
            
            room.floor_polygon.forEach(point => {
                const distance = Math.sqrt(
                    Math.pow(position.x - point.x, 2) + 
                    Math.pow(position.z - point.z, 2)
                );
                minDistance = Math.min(minDistance, distance);
            });
        });

        return minDistance;
    }

    /**
     * Calculate the optimal orientation to face the building center
     */
    private static calculateOptimalOrientation(playerPosition: THREE.Vector3, bounds: any): number {
        const { centerX, centerZ } = bounds;
        
        // Calculate angle from player position to building center
        const dx = centerX - playerPosition.x;
        const dz = centerZ - playerPosition.z;
        
        // Use atan2 to get the angle, then adjust for Three.js coordinate system
        let angle = Math.atan2(dx, dz);
        
        return angle;
    }

    /**
     * Check if a position is inside any room
     */
    private static isPositionInRoom(position: THREE.Vector3, floorPlanData: FloorPlanData): boolean {
        const point = { x: position.x, z: position.z };
        
        for (const room of floorPlanData.rooms) {
            if (room.room_type === "Wall" || room.room_type === "Reference") continue;
            
            if (this.isPointInPolygon(point, room.floor_polygon)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Point-in-polygon test
     */
    private static isPointInPolygon(point: Point, polygon: Point[]): boolean {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            if (((polygon[i].z > point.z) !== (polygon[j].z > point.z)) &&
                (point.x < (polygon[j].x - polygon[i].x) * (point.z - polygon[i].z) / (polygon[j].z - polygon[i].z) + polygon[i].x)) {
                inside = !inside;
            }
        }
        return inside;
    }

    /**
     * Find a safe spawn position that's not inside any room
     */
    static findSafeSpawnPosition(floorPlanData: FloorPlanData): PlayerPositionInfo {
        const optimalPosition = this.calculateOptimalPlayerPosition(floorPlanData);
        
        // If the optimal position is inside a room, try to find alternatives
        if (this.isPositionInRoom(optimalPosition.position, floorPlanData)) {
            const bounds = optimalPosition.floorPlanBounds;
            const offsetDistance = Math.max(bounds.width, bounds.depth) * 0.6 + 50; // Increase offset
            
            // Try positions further away
            const alternativePositions = [
                new THREE.Vector3(bounds.centerX, 0, bounds.maxZ + offsetDistance),
                new THREE.Vector3(bounds.centerX, 0, bounds.minZ - offsetDistance),
                new THREE.Vector3(bounds.maxX + offsetDistance, 0, bounds.centerZ),
                new THREE.Vector3(bounds.minX - offsetDistance, 0, bounds.centerZ),
            ];
            
            for (const altPos of alternativePositions) {
                if (!this.isPositionInRoom(altPos, floorPlanData)) {
                    return {
                        position: altPos,
                        orientation: this.calculateOptimalOrientation(altPos, bounds),
                        floorPlanBounds: bounds
                    };
                }
            }
        }
        
        return optimalPosition;
    }
}
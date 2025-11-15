import React, { useState, useEffect } from 'react';
import NorthIcon from '@mui/icons-material/North';
import SouthIcon from '@mui/icons-material/South';
import EastIcon from '@mui/icons-material/East';
import WestIcon from '@mui/icons-material/West';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import NorthWestIcon from '@mui/icons-material/NorthWest';
import SouthEastIcon from '@mui/icons-material/SouthEast';
import SouthWestIcon from '@mui/icons-material/SouthWest';
import VerticalAlignTopIcon from '@mui/icons-material/VerticalAlignTop';
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import './ElevationControls.css';
import { Eye } from 'lucide-react';

interface FloorPlanData {
    rooms: Array<{
        id: string;
        room_type: string;
        floor_polygon: Array<{ x: number; z: number }>;
    }>;
}

interface ElevationControlsProps {
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    mode: string;
    visible?: boolean;
    floorPlanData?: FloorPlanData | null;
}

interface Direction {
    id: string;
    label: string;
    tooltip: string;
    icon: React.ReactNode;
    position: (target: THREE.Vector3) => THREE.Vector3;
    gridArea: string;
}

const ElevationControls: React.FC<ElevationControlsProps> = ({
    camera,
    controls,
    mode,
    visible = true,
    floorPlanData
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [previewActive, setPreviewActive] = useState(false);
    const [activeDirection, setActiveDirection] = useState<string | null>(null);
    const [originalCameraState, setOriginalCameraState] = useState<{
        position: THREE.Vector3;
        target: THREE.Vector3;
    } | null>(null);

    const handleMenuLeave = () => {
        if (previewActive && originalCameraState && camera && controls) {
            camera.position.copy(originalCameraState.position);
            controls.target.copy(originalCameraState.target);
            camera.lookAt(originalCameraState.target);
            controls.update();
        }
        setPreviewActive(false);
        setOriginalCameraState(null);
    };

    // Calculate dynamic camera distance based on floor plan size
    const calculateCameraDistance = () => {
        if (!floorPlanData?.rooms || floorPlanData.rooms.length === 0) {
            console.log("NAI MILA DISTANCE");
            return 200; // Default fallback
        }

        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

        floorPlanData.rooms.forEach(room => {
            if (room.room_type === "Wall" || room.room_type === "Reference") return;
            
            room.floor_polygon.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minZ = Math.min(minZ, point.z);
                maxZ = Math.max(maxZ, point.z);
            });
        });

        const width = maxX - minX;
        const depth = maxZ - minZ;
        const diagonal = Math.sqrt(width * width + depth * depth);

        console.log("Diagonal", {diagonal});
        // Distance should be 3x the diagonal to ensure full view with large margin
        return diagonal * 0.8;
    };

    const detectCurrentDirection = () => {
        if (!camera || !controls) return null;

        const target = controls.target;
        const position = camera.position;
        const direction = new THREE.Vector3().subVectors(position, target).normalize();
        
        const tolerance = 0.3;
        
        if (Math.abs(direction.x) < tolerance && Math.abs(direction.z) < tolerance) {
            return direction.y > 0 ? 'top' : null;
        }
        
        if (Math.abs(direction.x) < tolerance) {
            return direction.z > 0 ? 'n' : 's';
        }
        if (Math.abs(direction.z) < tolerance) {
            return direction.x > 0 ? 'e' : 'w';
        }
        
        if (direction.x > tolerance && direction.z > tolerance) return 'ne';
        if (direction.x < -tolerance && direction.z > tolerance) return 'nw';
        if (direction.x > tolerance && direction.z < -tolerance) return 'se';
        if (direction.x < -tolerance && direction.z < -tolerance) return 'sw';
        
        return null;
    };

    useEffect(() => {
        if (!camera || !controls || mode !== 'orbit') return;

        let animationId: number;
        let lastPosition = camera.position.clone();
        let lastTarget = controls.target.clone();

        const checkCameraChange = () => {
            const currentPosition = camera.position;
            const currentTarget = controls.target;
            
            if (lastPosition.distanceTo(currentPosition) > 0.1 || 
                lastTarget.distanceTo(currentTarget) > 0.1) {
                
                if (!previewActive) {
                    const detected = detectCurrentDirection();
                    setActiveDirection(detected);
                }
                
                lastPosition.copy(currentPosition);
                lastTarget.copy(currentTarget);
            }
            
            animationId = requestAnimationFrame(checkCameraChange);
        };

        const timeoutId = setTimeout(() => {
            const initial = detectCurrentDirection();
            setActiveDirection(initial);
            checkCameraChange();
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(animationId);
        };
    }, [camera, controls, mode, previewActive]);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const menu = document.querySelector('.elevation-menu');
            const trigger = document.querySelector('.elevation-trigger');
            
            if (menu && trigger && 
                !menu.contains(event.target as Node) && 
                !trigger.contains(event.target as Node)) {
                setIsMenuOpen(false);
                handleMenuLeave();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    if (mode !== 'orbit' || !visible) return null;

    const distance = calculateCameraDistance();

    const directions: Direction[] = [
        {
            id: 'nw',
            label: 'NW',
            tooltip: 'View from North-West corner',
            icon: <NorthWestIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x - distance, target.y, target.z + distance),
            gridArea: 'nw'
        },
        {
            id: 'n',
            label: 'N',
            tooltip: 'View from North (front)',
            icon: <NorthIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x, target.y, target.z + distance),
            gridArea: 'n'
        },
        {
            id: 'ne',
            label: 'NE',
            tooltip: 'View from North-East corner',
            icon: <NorthEastIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x + distance, target.y, target.z + distance),
            gridArea: 'ne'
        },
        {
            id: 'w',
            label: 'W',
            tooltip: 'View from West (left)',
            icon: <WestIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x - distance, target.y, target.z),
            gridArea: 'w'
        },
        {
            id: 'top',
            label: 'Top',
            tooltip: 'Top-down view',
            icon: <VerticalAlignTopIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x, target.y + distance * 0.7, target.z),
            gridArea: 'center'
        },
        {
            id: 'e',
            label: 'E',
            tooltip: 'View from East (right)',
            icon: <EastIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x + distance, target.y, target.z),
            gridArea: 'e'
        },
        {
            id: 'sw',
            label: 'SW',
            tooltip: 'View from South-West corner',
            icon: <SouthWestIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x - distance, target.y, target.z - distance),
            gridArea: 'sw'
        },
        {
            id: 's',
            label: 'S',
            tooltip: 'View from South (back)',
            icon: <SouthIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x, target.y, target.z - distance),
            gridArea: 's'
        },
        {
            id: 'se',
            label: 'SE',
            tooltip: 'View from South-East corner',
            icon: <SouthEastIcon style={{ fontSize: 16 }} />,
            position: (target) => new THREE.Vector3(target.x + distance, target.y, target.z - distance),
            gridArea: 'se'
        }
    ];

    const handleDirectionClick = (direction: Direction) => {
        if (!camera || !controls) return;

        const target = controls.target.clone();
        const newPosition = direction.position(target);
        
        camera.position.copy(newPosition);
        camera.lookAt(target);
        controls.update();

        console.log(`Elevation view changed to: ${direction.label}`);
        console.log({ newPosition, target });
        
        setActiveDirection(direction.id);
        setIsMenuOpen(false);
        setPreviewActive(false);
        setOriginalCameraState(null);
    };

    const handleDirectionHover = (direction: Direction) => {
        if (!camera || !controls || !previewActive) return;

        if (!originalCameraState) {
            setOriginalCameraState({
                position: camera.position.clone(),
                target: controls.target.clone()
            });
        }

        const target = controls.target.clone();
        const newPosition = direction.position(target);
        
        camera.position.copy(newPosition);
        camera.lookAt(target);
        controls.update();
    };

    return (
        <div className="elevation-controls">
            <button
                className="elevation-trigger"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Elevation Views"
            >
                <Eye style={{ fontSize: 18 }} />
                <span className="elevation-label">Elevation</span>
            </button>

            {isMenuOpen && (
                <div 
                    className="elevation-menu"
                    onMouseLeave={handleMenuLeave}
                    onMouseEnter={() => setPreviewActive(true)}
                >
                    <div className="elevation-grid">
                        {directions.map((direction) => (
                            <button
                                key={direction.id}
                                className={`elevation-direction elevation-${direction.gridArea} ${
                                    activeDirection === direction.id ? 'elevation-active' : ''
                                }`}
                                onClick={() => handleDirectionClick(direction)}
                                onMouseEnter={() => handleDirectionHover(direction)}
                                title={direction.tooltip}
                                style={{
                                    gridArea: direction.gridArea
                                }}
                            >
                                <div className="elevation-icon">
                                    {direction.icon}
                                </div>
                                <span className="elevation-text">{direction.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ElevationControls;
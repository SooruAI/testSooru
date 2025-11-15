import CameraIcon from '@mui/icons-material/Camera';
import PersonIcon from '@mui/icons-material/Person';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { RotateCcw, Save, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as t from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { initialFloorPlanData } from "../features/initialData";
import Compass from './Compass';
import { DoorWindowManager } from './DoorWindowManager';
import ElevationControls from './ElevationControls';
import GameControls from './GameControls';
import Minimap from './Minimap';
import { useModelExporter } from './ModelExporter';
import { Object3DData, Object3DManager } from './Object3DManager';
import ObjectControlPanel from './ObjectControlPanel';
import { Player } from "./Player";
import PlayerLocationOverlay from './PlayerLocationOverlay';
import PropertyOverlay3D from './PropertyOverlay3D';
import room, { MaterialConfig, MaterialManager } from "./Room";
import ShareButton from './ShareButton';
import { SidePanel } from './SidePanel';
import { UnifiedWallSystem } from './UnifiedWallSystem';
import "./View3D.css";

import UnifiedControlPanel from './UnifiedControlPanel';
import { API_URL } from '../../../config';

// Add API configuration
const API_BASE_URL = API_URL;

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
    objects?: Array<{
        id: string;
        objectPath: string;
        position: { x: number; z: number; };
        rotation: number;
        scale: number;
    }>;
    doors?: Array<{
        id: string;
        doorPath: string;
        position: { x: number; z: number };
        rotation: number;
        scale: number;
        width: number;
        flipHorizontal: boolean;
        flipVertical: boolean;
    }>;
    windows?: Array<{
        id: string;
        windowPath: string;
        position: { x: number; z: number };
        rotation: number;
        scale: number;
        width: number;
        flipHorizontal: boolean;
        flipVertical: boolean;
    }>;
    wallWidths?: Record<string, number>;
}

interface PlanApiResponse {
    id: number;
    project: number;
    plan_name: string;
    created_date: string;
    coordinates: any;
    objects?: Array<{
        id: string;
        objectPath: string;
        position: { x: number; z: number; };
        rotation: number;
        scale: number;
    }>;
}

interface WallWidthData {
    [wallId: string]: number;
}

interface CameraState {
    position: t.Vector3;
    quaternion: t.Quaternion;
    target: t.Vector3;
    distance: number;
}

interface DoorData {
    id: string;
    doorPath: string;
    position: { x: number; z: number };
    rotation: number;
    scale: number;
    width: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
}

interface WindowData {
    id: string;
    windowPath: string;
    position: { x: number; z: number };
    rotation: number;
    scale: number;
    width: number;
    flipHorizontal: boolean;
    flipVertical: boolean;
}

// Material presets
const MATERIAL_PRESETS = {
    wall: [
        { id: 'brick', name: 'Brick Wall 1', color: '#b49684', texture: 'brick_wall_2_diff', roughness: 0.9 },
        { id: 'brick2', name: 'Brick Wall 2', color: '#5a4b3a', texture: 'brick_wall_diff', roughness: 0.9 },
        { id: 'paintbrick', name: 'Painted Brick', color: '#61949f', texture: 'painted_brick_diff', roughness: 0.4 },
        { id: 'plaster', name: 'Plastered Wall', color: '#bbb1a5', texture: 'plastered_wall_diff', roughness: 0.3 },
        { id: 'yplaster', name: 'Yellow Plastered Wall', color: '#8f7a4d', texture: 'yellow_plaster_diff', roughness: 0.3 },
        { id: 'sqtile', name: 'Square Tiled', color: '#847464', texture: 'rounded_square_tiled_wall_diff', roughness: 0.2 },
        { id: 'sttile', name: 'Stone Tiled', color: '#ada9a1', texture: 'stone_tile_wall_diff', roughness: 0.7 },
        { id: 'swood', name: 'Synthetic Wood', color: '#76533b', texture: 'synthetic_wood_diff', roughness: 0.2 },
        { id: 'woodpl', name: 'Wood Planks', color: '#46352d', texture: 'wood_plank_wall_diff', roughness: 0.6 },
    ],
    floor: [
        { id: 'asphalt', name: 'Asphalt', color: '#988f80', texture: 'asphalt_floor_diff', roughness: 0.8 },
        { id: 'tiles', name: 'Ceramic Tile', color: '#c6a376', texture: 'floor_tiles_diff', roughness: 0.1 },
        { id: 'marble', name: 'Marble', color: '#beae8c', texture: 'marble_diff', roughness: 0.05 },
        { id: 'rubber', name: 'Rubber Tiles', color: '#212025', texture: 'rubber_tiles_diff', roughness: 0.6 },
        { id: 'tiled', name: 'Tiled Floor', color: '#705540', texture: 'tiled_floor_diffuse', roughness: 0.2 },
        { id: 'wood', name: 'Wood', color: '#7f5d42', texture: 'wood_floor_diffuse', roughness: 0.4 },
        { id: 'granite', name: 'Granite', color: '#665d54', texture: 'granite_tile_diff', roughness: 0.3 },
        { id: 'plank', name: 'Plank', color: '#705039', texture: 'plank_flooring_diff', roughness: 0.5 }
    ],
    roof: [
        { id: 'swood', name: 'Synthetic Wood', color: '#76533b', texture: 'synthetic_wood_diff', roughness: 0.3 },
        { id: 'woodpl', name: 'Wood Planks', color: '#46352d', texture: 'wood_plank_wall_diff', roughness: 0.7 },
    ]
};

function getCenter(points: Array<Point>) {
    const center = new t.Vector3();
    for (let i = 0; i < points.length; i++) {
        center.x += points[i].x;
        center.z += points[i].z;
    }
    center.x /= points.length;
    center.z /= points.length;
    return center;
}

let player: Player;
let controls: OrbitControls;
let center: t.Vector3;
let cameraState: CameraState | null = null;
let scene: t.Scene;
let camera: t.PerspectiveCamera;
let renderer: t.WebGLRenderer;
let rooms: room[] = [];
let roofMeshes: t.Mesh[] = [];
let materialManager: MaterialManager;
let initialZoomDistance: number;

// 3D Object Manager
let objectManager: Object3DManager;
let raycaster: t.Raycaster;
let mouse: t.Vector2;

function saveCameraState(camera: t.PerspectiveCamera) {
    cameraState = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
        target: controls.target.clone(),
        distance: controls.getDistance()
    };
}

function restoreCameraState(camera: t.PerspectiveCamera) {
    if (!cameraState) return;

    camera.position.copy(cameraState.position);
    camera.quaternion.copy(cameraState.quaternion);
    controls.target.copy(cameraState.target);
    controls.update();
}

function enableCameraMode(camera: t.PerspectiveCamera) {
    if (player && player.model)
        player.model.visible = false;

    if (cameraState) {
        restoreCameraState(camera);
        const direction = new t.Vector3().subVectors(camera.position, controls.target).normalize();
        camera.position.copy(controls.target.clone().add(direction.multiplyScalar(200)));
    } else {
        controls.target.set(center.x, center.y, center.z);
        camera.position.set(center.x, center.y + 200, center.z);
        initialZoomDistance = controls.getDistance();
        const euler = new t.Euler(-Math.PI / 2, 0, 0, 'YXZ');
        camera.quaternion.setFromEuler(euler);
        controls.update();
    }

    controls.enableZoom = true;
    controls.maxDistance = 1000;
    controls.minDistance = 10;

    if (roofMeshes) {
        roofMeshes.forEach(mesh => {
            mesh.visible = false;
        });
    }
}

function enablePlayerMode(camera: t.PerspectiveCamera, playerScale: number) {
    if (!player || !player.model) return;
    saveCameraState(camera);

    player.model.visible = true;

    const playerPos = player.model.position.clone();
    const lookTarget = playerPos.clone();

    // Adjust camera positioning based on player scale
    const cameraHeightOffset = 6 + (playerScale / 100) * 40;
    const cameraDistance = 30 + (playerScale / 100) * 40;

    const playerOrientation = (player.playerControl?.bodyOrientation || 0) + Math.PI;
    console.log("Player orientation:", playerOrientation);
    // Position camera behind the player
    const cameraOffsetX = Math.sin(playerOrientation) * cameraDistance;
    const cameraOffsetZ = Math.cos(playerOrientation) * cameraDistance;

    camera.position.set(
        playerPos.x + cameraOffsetX,
        playerPos.y + cameraHeightOffset,
        playerPos.z + cameraOffsetZ
    );

    // Set look target in front of the player
    lookTarget.x = playerPos.x + Math.sin(playerOrientation) * 20;
    lookTarget.z = playerPos.z + Math.cos(playerOrientation) * 20;
    lookTarget.y = playerPos.y + cameraHeightOffset * 0.125;

    controls.target.copy(lookTarget);
    controls.enableZoom = false;
    controls.maxDistance = 25;
    controls.update();

    if (roofMeshes) {
        roofMeshes.forEach(mesh => {
            mesh.visible = true;
        });
    }
}

export default function View3D({ viewOnly = false }: { viewOnly?: boolean }) {
    const { projectId, planId } = useParams();
    const navigate = useNavigate();

    const containerRef = useRef<HTMLDivElement>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(65);
    const [setCamera] = useState<t.PerspectiveCamera | null>(null);
    let camera: t.PerspectiveCamera;
    let standaloneWalls: t.Group[] = [];
    const cameraRef = useRef<t.PerspectiveCamera | null>(null);
    const [mode, setMode] = useState("orbit");
    const [fieldOfView, setFieldOfView] = useState(60);
    const [playerScale, setPlayerScale] = useState(50);
    const [showRoof, setShowRoof] = useState(false);
    const [sceneRef, setSceneRef] = useState<t.Scene | null>(null);
    const [rendererRef, setRendererRef] = useState<t.WebGLRenderer | null>(null);
    const [floorPlanDataState, setFloorPlanDataState] = useState<FloorPlanData>({
        room_count: 0,
        total_area: 0,
        room_types: [],
        rooms: []
    });
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [dataError, setDataError] = useState<string | null>(null);
    const [overlaySettings, setOverlaySettings] = useState({
        showOverlays: false,
        showTotalArea: true,
        showRoomCount: true,
        showRoomDetails: false,
        showRoomTypes: true,
        showDimensions: true,
        showPlotDimensions: true,
        showRoomAreas: true,
        showRoomLabels: true,
        overlayOpacity: 0.9,
        overlaySize: 'medium' as const
    });
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [wallRenderingMode, setWallRenderingMode] = useState<'solid' | 'transparent'>('solid');
    const [wallTransparency, setWallTransparency] = useState(0.3);
    const roomsRef = useRef<any[]>([]);
    const [shouldUpdatePlayerPosition, setShouldUpdatePlayerPosition] = useState(false);

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [originalFloorPlanData, setOriginalFloorPlanData] = useState<any>(null);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
    const doorWindowManagerRef = useRef<DoorWindowManager | null>(null);

    useEffect(() => {
        if (floorPlanDataState && !originalFloorPlanData) {
            setOriginalFloorPlanData(JSON.parse(JSON.stringify(floorPlanDataState)));
            repositionPlayerForFloorPlan(floorPlanDataState);
        }
    }, [floorPlanDataState, originalFloorPlanData]);

    useEffect(() => {
        if (originalFloorPlanData && floorPlanDataState) {
            const hasChanges = JSON.stringify(originalFloorPlanData) !== JSON.stringify(floorPlanDataState);
            setHasUnsavedChanges(hasChanges);
        }
    }, [floorPlanDataState, originalFloorPlanData]);

    const handleSaveChanges = () => {
        console.log('Saving floor plan data:', JSON.stringify(floorPlanDataState));

        // Update original data to current state
        setOriginalFloorPlanData(JSON.parse(JSON.stringify(floorPlanDataState)));
        setHasUnsavedChanges(false);

        // Here you would typically save to API or localStorage
        // Example:
        // if (projectId && planId) {
        //     savePlanToAPI(projectId, planId, floorPlanDataState);
        // } else {
        //     saveToLocalStorage(floorPlanDataState);
        // }
    };

    const handleResetChanges = () => {
        if (originalFloorPlanData) {
            setFloorPlanDataState(JSON.parse(JSON.stringify(originalFloorPlanData)));
            setHasUnsavedChanges(false);

            // Clear any selected objects or states
            setSelectedObjectId(null);
            setObjectControlMode(null);
            setHasObjectChanges(false);
            setOriginalObjectState(null);

            if (objectManager) {
                objectManager.selectObject(null);
            }

            console.log('Floor plan reset to original state');
        }
    };

    // Add keyboard shortcuts effect
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl+Z or Cmd+Z for reset/undo
            if ((event.ctrlKey || event.metaKey) && event.key === 'z' && hasUnsavedChanges) {
                event.preventDefault();
                handleResetChanges();
            }

            // Ctrl+S or Cmd+S for save
            if ((event.ctrlKey || event.metaKey) && event.key === 's' && hasUnsavedChanges) {
                event.preventDefault();
                handleSaveChanges();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasUnsavedChanges, originalFloorPlanData, floorPlanDataState]);

    // Add beforeunload handler to show browser dialog
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                event.preventDefault();
                event.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    const SaveResetControls = () => {
        if (!hasUnsavedChanges) return null;

        return (
            <div className="save-reset-controls">
                <button
                    onClick={handleSaveChanges}
                    className="save-button"
                    title="Save changes (Ctrl+S)"
                >
                    <Save size={16} />
                    Save Changes
                </button>

                <button
                    onClick={handleResetChanges}
                    className="reset-button"
                    title="Reset changes (Ctrl+Z)"
                >
                    <RotateCcw size={16} />
                    Reset Changes
                </button>
            </div>
        );
    };

    // Unsaved Changes Dialog Component
    const UnsavedChangesDialog = () => {
        if (!showUnsavedDialog) return null;

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowUnsavedDialog(false)} />

                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                    <div className="p-6">
                        <button
                            onClick={() => setShowUnsavedDialog(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Unsaved Changes
                        </h2>

                        <p className="text-gray-600 mb-6">
                            Save changes to the floor plan before leaving?
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => {
                                    setShowUnsavedDialog(false);
                                    if (pendingNavigation) {
                                        // Handle navigation without saving
                                        window.location.href = pendingNavigation;
                                    }
                                }}
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Don't Save
                            </button>
                            <button
                                onClick={() => {
                                    handleSaveChanges();
                                    setShowUnsavedDialog(false);
                                    if (pendingNavigation) {
                                        // Handle navigation after saving
                                        window.location.href = pendingNavigation;
                                    }
                                }}
                                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Add data fetching function
    const fetchFloorPlanData = async (): Promise<FloorPlanData> => {
        if (!projectId || !planId) {
            throw new Error('Missing project or plan ID');
        }

        try {
            let plan: string = '';

            const cachedPlans = localStorage.getItem(`currentPlan`);
            const plans = JSON.parse(cachedPlans || "{}");
            console.log("Cached plans:", plans);
            plan = JSON.stringify(plans[`${projectId}/${planId}`]);
            console.log("Using cached plan data:", plan);

            const planData: PlanApiResponse = JSON.parse(plan);
            if (!planData) {
                window.location.href = `/view/playground/${projectId}/${planId}`;
            }

            // Extract coordinates from the API response
            // If coordinates is empty or null, return default empty data
            if (!planData.coordinates || Object.keys(planData.coordinates).length === 0) {
                return {
                    room_count: 0,
                    total_area: 0,
                    room_types: [],
                    rooms: [],
                    objects: []
                };
            }

            // Convert coordinates to FloorPlanData format
            const floorPlanData = planData.coordinates as FloorPlanData;

            // HANDLE OBJECTS - Add this block to your existing function
            if (!floorPlanData.objects) {
                // Look for objects in different possible locations
                if (planData.objects && Array.isArray(planData.objects)) {
                    floorPlanData.objects = planData.objects;
                } else if (planData.coordinates.objects && Array.isArray(planData.coordinates.objects)) {
                    floorPlanData.objects = planData.coordinates.objects;
                } else {
                    floorPlanData.objects = [];
                }
            }

            // Validate objects array
            if (floorPlanData.objects && Array.isArray(floorPlanData.objects)) {
                floorPlanData.objects = floorPlanData.objects.filter(obj =>
                    obj && obj.id && obj.objectPath && obj.position &&
                    typeof obj.position.x === 'number' && typeof obj.position.z === 'number'
                );
                // console.log(`Loaded ${floorPlanData.objects.length} objects from API`);
            }

            return floorPlanData;

        } catch (error) {
            console.error('Error fetching floor plan data:', error);
            throw error;
        }
    };

    const loadObjectsFromFloorPlan = async (floorPlanData: FloorPlanData, objectManager: Object3DManager) => {
        if (!floorPlanData.objects || floorPlanData.objects.length === 0) {
            console.log('No objects to load');
            return;
        }

        console.log(`Loading ${floorPlanData.objects.length} objects...`);

        objectManager.dispose();

        const loadPromises = floorPlanData.objects.map(async (obj) => {
            try {
                const filename = obj.objectPath.split('/').pop()?.replace('.png', '') || 'unknown';
                const glbPath = `/model/model/${filename}.glb`;

                const modelData = {
                    name: filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    modelPath: glbPath,
                    imagePath: obj.objectPath,
                    description: `${filename} object`,
                    author: 'System',
                    license: 'Internal'
                };

                const position = new t.Vector3(obj.position.x, 0, obj.position.z);
                const rotation = obj.rotation !== 0 ?
                    new t.Euler(0, -obj.rotation * (Math.PI / 180), 0) :
                    new t.Euler(0, 0, 0);
                const scale = obj.scale !== 1 ?
                    new t.Vector3(obj.scale, obj.scale, obj.scale) :
                    new t.Vector3(1, 1, 1);

                await objectManager.addObject(obj.id, modelData, position, rotation, scale);
                if (obj.scale !== 1) {
                    objectManager.updateObjectScale(obj.id, new t.Vector3(obj.scale, obj.scale, obj.scale));
                }

                console.log(`Loaded object: ${modelData.name}`);
            } catch (error) {
                console.error(`Failed to load object ${obj.id}:`, error);
            }
        });

        await Promise.all(loadPromises);
        console.log('All objects loaded');
    };

    const handleOverlaySettingsChange = (settings: any) => {
        setOverlaySettings(settings);
    };

    const registerRoom = useCallback((room: any) => {
        roomsRef.current.push(room);
        // console.log(`Registered room. Total rooms: ${roomsRef.current.length}`);
    }, []);

    const clearRooms = useCallback(() => {
        roomsRef.current = [];
        // console.log('Cleared all registered rooms');
    }, []);

    const handleWallRenderingChange = useCallback((mode: 'solid' | 'transparent', transparency: number) => {
        // console.log(`Changing wall rendering to ${mode} with transparency ${transparency}`);
        // console.log(`Number of rooms to update: ${roomsRef.current.length}`);

        setWallRenderingMode(mode);
        setWallTransparency(transparency);

        // Update all existing rooms
        roomsRef.current.forEach((room, index) => {
            if (room && room.setWallRenderingMode) {
                // console.log(`Updating room ${index}:`, room.getRoomId?.() || 'unknown');
                room.setWallRenderingMode(mode, transparency);
            } else {
                console.warn(`Room ${index} doesn't have setWallRenderingMode method:`, room);
            }
        });
    }, []);

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

    const findPlayerRoom = (): Room | null => {
        if (!playerPosition || !floorPlanDataState || !floorPlanDataState.rooms) return null;

        const playerPoint = { x: playerPosition.x, z: playerPosition.z };

        for (const room of floorPlanDataState.rooms) { // Use floorPlanDataState instead of initialFloorPlanData
            if (room.room_type === "Wall" || room.room_type === "Boundary") continue;

            if (isPointInPolygon(playerPoint, room.floor_polygon)) {
                return room;
            }
        }
        return null;
    };

    const useDeviceType = () => {
        const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

        useEffect(() => {
            const checkDevice = () => {
                const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                const screenWidth = window.innerWidth;
                const isMobileSize = screenWidth <= 1024; // Include tablets up to 1024px

                setIsMobileOrTablet(isTouchDevice && isMobileSize);
            };

            checkDevice();
            window.addEventListener('resize', checkDevice);

            return () => window.removeEventListener('resize', checkDevice);
        }, []);

        return isMobileOrTablet;
    };

    const handleFieldOfViewChange = (value: number) => {
        setFieldOfView(value);
        if (cameraRef.current) {
            cameraRef.current.fov = value;
            cameraRef.current.updateProjectionMatrix();
        }
    };

    const handlePlayerScaleChange = (value: number) => {
        setPlayerScale(value);
        if (player && player.model && player.playerControl) {
            const scale = (value / 100) * 0.04 + 0.01; // Linear mapping
            player.model.scale.set(scale, scale, scale);
        }
    };

    // Object management state
    const [placedObjects, setPlacedObjects] = useState<Array<{
        id: string;
        name: string;
        modelPath: string;
        imagePath: string;
        description: string;
        author: string;
        license: string;
        position: any;
    }>>([]);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [isPlacingObject, setIsPlacingObject] = useState<boolean>(false);
    const [pendingObjectData, setPendingObjectData] = useState<any>(null);

    const [objectControlMode, setObjectControlMode] = useState<'move' | 'rotate' | 'scale' | 'info' | null>(null);
    const [hasObjectChanges, setHasObjectChanges] = useState(false);
    const [originalObjectState, setOriginalObjectState] = useState<any>(null);
    const [isObjectPanelLocked, setIsObjectPanelLocked] = useState(false);
    const [isDraggingObject, setIsDraggingObject] = useState(false);

    // Helper function to convert Object3DData to PlacedObject format
    const convertToPlacedObjects = (objects: Object3DData[]) => {
        return objects.map(obj => ({
            id: obj.id,
            name: obj.name,
            modelPath: obj.modelPath,
            imagePath: obj.imagePath,
            description: obj.description,
            author: obj.author,
            license: obj.license,
            position: obj.position
        }));
    };

    const handleObjectModeChange = (mode: 'move' | 'rotate' | 'scale' | 'info' | null) => {
        // Save original state when starting to edit
        if (mode && !originalObjectState && selectedObjectId && objectManager) {
            const selectedObject = objectManager.getSelectedObject();
            if (selectedObject) {
                setOriginalObjectState({
                    position: selectedObject.position.clone(),
                    rotation: selectedObject.rotation.clone(),
                    scale: selectedObject.scale.clone()
                });
            }
        }

        setObjectControlMode(mode);

        // Enable/disable object dragging based on mode
        setIsDraggingObject(mode === 'move');
    };

    const handleObjectRotate = (rotationY: number) => {
        if (selectedObjectId && objectManager) {
            const selectedObject = objectManager.getSelectedObject();
            if (selectedObject) {
                const newRotation = new t.Euler(
                    selectedObject.rotation.x,
                    rotationY,
                    selectedObject.rotation.z
                );
                objectManager.updateObjectRotation(selectedObjectId, newRotation);
                setHasObjectChanges(true);
                setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
            }
        }
    };

    const handleObjectScale = (scale: number) => {
        if (selectedObjectId && objectManager) {
            const selectedObject = objectManager.getSelectedObject();
            if (selectedObject) {
                const newScale = new t.Vector3(scale, scale, scale);
                objectManager.updateObjectScale(selectedObjectId, newScale);
                setHasObjectChanges(true);
                setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
            }
        }
    };

    const handleSaveObjectChanges = () => {
        setHasObjectChanges(false);
        setOriginalObjectState(null);
        // Changes are already applied, just confirm them
    };

    const handleDiscardObjectChanges = () => {
        if (originalObjectState && selectedObjectId && objectManager) {
            objectManager.updateObjectPosition(selectedObjectId, originalObjectState.position);
            objectManager.updateObjectRotation(selectedObjectId, originalObjectState.rotation);
            objectManager.updateObjectScale(selectedObjectId, originalObjectState.scale);
            setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
        }

        setHasObjectChanges(false);
        setOriginalObjectState(null);
    };

    const handleTogglePanelLock = () => {
        setIsObjectPanelLocked(!isObjectPanelLocked);
    };

    // Player position and orientation for minimap
    const [playerPosition, setPlayerPosition] = useState<t.Vector3 | null>(null);
    const [playerRotation, setPlayerRotation] = useState<number>(0);

    // Current material configurations
    const [currentMaterials, setCurrentMaterials] = useState({
        innerWall: { ...MATERIAL_PRESETS.wall[4], useTexture: false },
        outerWall: { ...MATERIAL_PRESETS.wall[0], useTexture: false },
        floor: { ...MATERIAL_PRESETS.floor[0], useTexture: false },
        roof: { ...MATERIAL_PRESETS.roof[0], useTexture: false }
    });

    const [gameControlsVisible, setGameControlsVisible] = useState(false);

    const isPlacingObjectRef = useRef(isPlacingObject);
    const pendingObjectDataRef = useRef(pendingObjectData);
    const selectedObjectIdRef = useRef(selectedObjectId);
    const modeRef = useRef(mode);

    useEffect(() => {
        isPlacingObjectRef.current = isPlacingObject;
    }, [isPlacingObject]);

    useEffect(() => {
        pendingObjectDataRef.current = pendingObjectData;
    }, [pendingObjectData]);

    useEffect(() => {
        selectedObjectIdRef.current = selectedObjectId;
    }, [selectedObjectId]);

    useEffect(() => {
        modeRef.current = mode;
    }, [mode]);

    // Initialize raycaster and mouse for object interaction
    useEffect(() => {
        raycaster = new t.Raycaster();
        mouse = new t.Vector2();
    }, []);

    // Add redirect effect for missing parameters
    useEffect(() => {
        if (!projectId || !planId) {
            // console.log('Missing projectId or planId, using fallback data');
            // Use initialFloorPlanData as fallback when no projectId/planId
            setFloorPlanDataState(initialFloorPlanData);
            setIsLoadingData(false);
            return;
        }
    }, [projectId, planId]);

    // Add WASD key event listeners
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (mode !== 'person') return;

            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                case 'ArrowDown':
                case 'KeyS':
                case 'ArrowLeft':
                case 'KeyA':
                case 'ArrowRight':
                case 'KeyD':
                    setShouldUpdatePlayerPosition(true);
                    break;
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (mode !== 'person') return;

            // Check if player is still moving by checking the PlayerControl state
            setTimeout(() => {
                if (player && player.playerControl) {
                    const controls = player.playerControl.controls;
                    const isMoving = controls.moveForward || controls.moveBackward ||
                        controls.moveLeft || controls.moveRight;
                    setShouldUpdatePlayerPosition(isMoving);
                }
            }, 10); // Small delay to ensure PlayerControl has processed the key up
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [mode, player]);

    useEffect(() => {
        if (!player || !player.model || mode !== 'person') return;

        let updateInterval: NodeJS.Timeout | undefined;

        if (shouldUpdatePlayerPosition) {
            updateInterval = setInterval(() => {
                // console.log('Updating player position and rotation');
                if (player.model && player.playerControl) {
                    setPlayerPosition(player.model.position.clone());
                    setPlayerRotation(player.playerControl.bodyOrientation);
                }
            }, 100);
        }

        return () => {
            if (updateInterval) {
                clearInterval(updateInterval);
            }
        };
    }, [player, mode, shouldUpdatePlayerPosition]);

    const isMobileOrTablet = useDeviceType();

    useEffect(() => {
        setGameControlsVisible(mode === 'person' && isMobileOrTablet);
    }, [mode, isMobileOrTablet]);

    useEffect(() => {
        if (mode === 'person' && playerPosition) {
            const room = findPlayerRoom();
            setCurrentRoom(room);
        } else {
            setCurrentRoom(null);
        }
    }, [playerPosition, mode, floorPlanDataState]);

    const handleCameraHeightChange = (value: number) => {
        setPlayerScale(value);
        if (player && player.model) {
            const scale = (value / 100) * 0.04 + 0.01;
            player.model.scale.set(scale, scale, scale);
        }
    };

    const handleGameControlMovement = (direction: 'forward' | 'backward' | 'left' | 'right', active: boolean) => {
        if (!player || !player.playerControl) return;

        const controls = player.playerControl.controls;

        switch (direction) {
            case 'forward':
                controls.moveForward = active;
                break;
            case 'backward':
                controls.moveBackward = active;
                break;
            case 'left':
                controls.moveLeft = active;
                break;
            case 'right':
                controls.moveRight = active;
                break;
        }
        setShouldUpdatePlayerPosition(active);
    };

    const handleResetRotation = () => {
        if (mode === 'orbit' && cameraRef.current && controls) {
            const target = controls.target.clone();
            cameraRef.current.position.set(center.x, center.y + 225, center.z);
            controls.target.set(center.x, center.y, center.z);
            cameraRef.current.lookAt(target);
            controls.update();
        }
    };

    // Object placement handler
    const handleObjectPlace = async (modelPath: string, modelData: any) => {
        console.log('handleObjectPlace called:', { modelPath, modelData, mode });
        if (mode !== 'orbit') {
            console.log('Not in orbit mode, cannot place object');
            return;
        }

        // Generate unique ID for the object
        const objectId = `object_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        console.log('Starting object placement mode with ID:', objectId);

        // Start object placement mode
        setIsPlacingObject(true);
        setPendingObjectData({ id: objectId, ...modelData });

        // Change cursor to indicate placement mode
        if (renderer && renderer.domElement) {
            renderer.domElement.style.cursor = 'crosshair';
            console.log('Changed cursor to crosshair');
        }
    };

    // Object selection handler
    const handleObjectSelect = (objectId: string | null) => {
        setSelectedObjectId(objectId);
        if (objectManager) {
            objectManager.selectObject(objectId);
        }
    };

    // Handle mouse clicks for object placement and selection
    const handleCanvasClick = (event: MouseEvent) => {
        // console.log('Canvas click detected:', {
        //     isPlacingObject: isPlacingObjectRef.current,
        //     pendingObjectData: !!pendingObjectDataRef.current,
        //     mode: modeRef.current,
        //     objectManager: !!objectManager,
        //     controlMode: objectControlMode
        // });

        // Don't handle clicks if object control panel is active and not in move mode
        if (selectedObjectIdRef.current && objectControlMode && objectControlMode !== 'move') {
            // console.log('Ignoring canvas click - object control active');
            return;
        }

        if (!renderer || !cameraRef.current || !objectManager) {
            console.log('Missing required components:', {
                renderer: !!renderer,
                camera: !!cameraRef.current,
                objectManager: !!objectManager
            });
            return;
        }

        // Calculate mouse position in normalized device coordinates
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // console.log('Mouse coordinates:', { x: mouse.x, y: mouse.y });

        if (isPlacingObjectRef.current && pendingObjectDataRef.current && modeRef.current === 'orbit') {
            console.log('Attempting to place object...');

            const position = objectManager.getPlacementPosition(mouse);
            console.log('Placement position:', position);

            if (position) {
                console.log('Valid position found, adding object...');
                objectManager.addObject(pendingObjectDataRef.current.id, pendingObjectDataRef.current, position)
                    .then(() => {
                        console.log('Object added successfully');
                        setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
                        setIsPlacingObject(false);
                        setPendingObjectData(null);

                        if (renderer && renderer.domElement) {
                            renderer.domElement.style.cursor = 'default';
                        }
                    })
                    .catch((error) => {
                        console.error('Failed to add object:', error);
                    });
            } else {
                console.log('Invalid placement position');
            }
        } else if (modeRef.current === 'orbit' && objectManager) {
            // console.log('Handling object selection...');

            // // Determine if dragging should be allowed based on control mode
            // const allowDragging = objectControlMode === 'move' || objectControlMode === null;

            // // Only allow selection if not locked or no panel is open
            // if (!isObjectPanelLocked || !selectedObjectIdRef.current) {
            //     const handled = objectManager.handleMouseDown(event, mouse, allowDragging);
            //     if (!handled && !isObjectPanelLocked) {
            //         console.log('No object intersected, deselecting');
            //         setSelectedObjectId(null);
            //         setObjectControlMode(null);
            //         setHasObjectChanges(false);
            //         setOriginalObjectState(null);
            //         objectManager.selectObject(null);
            //     }
            // }
        }
    };


    // Handle mouse move for object dragging
    const handleCanvasMouseMove = (event: MouseEvent) => {
        if (!renderer || !cameraRef.current || mode !== 'orbit') return;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        if (objectManager) {
            objectManager.handleMouseMove(event, mouse);
            setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
        }
    };

    // Handle mouse up for object dragging
    const handleCanvasMouseUp = (event: MouseEvent) => {
        if (objectManager && mode === 'orbit') {
            objectManager.handleMouseUp(event);
            setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
        }
    };

    useEffect(() => {
        if (containerRef.current?.firstChild) return;

        // Add a flag to prevent multiple simultaneous initializations
        let isInitializing = false;

        const initializeScene = async () => {
            if (isInitializing) return;
            isInitializing = true;

            try {
                setIsLoadingData(true);
                setDataError(null);

                // Clear existing rooms first
                clearRooms();

                // Try to get from localStorage first (using userProjects structure) or API
                const cachedProjects = localStorage.getItem("userProjects");
                let floorPlanData;

                if (projectId && planId && cachedProjects) {
                    const projects = JSON.parse(cachedProjects);
                    const foundProject = projects.find((p: any) => p.id.toString() === projectId);
                    if (foundProject && foundProject.plans) {
                        const foundPlan = foundProject.plans.find((plan: any) => plan.id.toString() === planId);
                        if (foundPlan && foundPlan.coordinates) {
                            floorPlanData = foundPlan.coordinates;
                            setFloorPlanDataState(floorPlanData);
                        } else {
                            // Fallback to API
                            floorPlanData = await fetchFloorPlanData();
                            setFloorPlanDataState(floorPlanData);
                        }
                    } else {
                        // Fallback to API
                        floorPlanData = await fetchFloorPlanData();
                        setFloorPlanDataState(floorPlanData);
                    }
                } else if (projectId && planId) {
                    // Fallback to API
                    floorPlanData = await fetchFloorPlanData();
                    setFloorPlanDataState(floorPlanData);
                } else {
                    // Use initial data when no projectId/planId
                    floorPlanData = initialFloorPlanData;
                    setFloorPlanDataState(floorPlanData);
                }

                console.log('Floor plan data loaded:', floorPlanData);

                // Initialize MaterialManager
                materialManager = MaterialManager.getInstance();

                scene = new t.Scene();
                scene.background = new t.Color(0xf1f0ec);
                setSceneRef(scene);

                doorWindowManagerRef.current = new DoorWindowManager(scene);

                // Lighting setup
                const ambientLight = new t.AmbientLight(0xffffff, 0.6);
                scene.add(ambientLight);

                // Main directional light with improved shadow settings
                const mainLight = new t.DirectionalLight(0xffffff, 0.8);
                mainLight.position.set(100, 200, 100);
                mainLight.castShadow = true;
                mainLight.shadow.mapSize.width = 4096;  // Higher resolution
                mainLight.shadow.mapSize.height = 4096;
                mainLight.shadow.camera.near = 0.5;
                mainLight.shadow.camera.far = 1000;
                mainLight.shadow.camera.left = -500;
                mainLight.shadow.camera.right = 500;
                mainLight.shadow.camera.top = 500;
                mainLight.shadow.camera.bottom = -500;
                mainLight.shadow.bias = 0.0001;
                mainLight.shadow.radius = 4; // Softer shadow edges
                scene.add(mainLight);

                // Fill light to reduce harsh shadows
                const fillLight = new t.DirectionalLight(0xffffff, 0.4);
                fillLight.position.set(-100, 100, -100);
                scene.add(fillLight);

                // Hemisphere light for natural lighting
                const hemisphereLight = new t.HemisphereLight(0x87CEEB, 0x8B7355, 0.3);
                scene.add(hemisphereLight);

                renderer = new t.WebGLRenderer({ antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = t.PCFSoftShadowMap;

                // Add these new lines for better rendering
                renderer.toneMapping = t.ACESFilmicToneMapping;
                renderer.toneMappingExposure = 1.0;
                renderer.outputColorSpace = t.SRGBColorSpace;

                setRendererRef(renderer);

                camera = new t.PerspectiveCamera(
                    60,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000,
                );
                camera.position.set(30, 40, 10);
                cameraRef.current = camera;

                controls = new OrbitControls(camera, renderer.domElement);
                controls.minPolarAngle = 0;
                controls.maxPolarAngle = Math.PI * 0.5;

                // Initialize Object Manager - ensure it's only created once
                if (!objectManager) {
                    objectManager = new Object3DManager({
                        scene,
                        camera,
                        raycaster
                    });

                    objectManager.setCallbacks(
                        (objectId) => setSelectedObjectId(objectId),
                        (objectId, data) => {
                            setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
                        }
                    );
                } else {
                    // If objectManager already exists, just update its scene reference
                    objectManager.scene = scene;
                    objectManager.camera = camera;
                }

                // Add event listeners for object interaction
                const canvas = renderer.domElement;

                // Use a slight delay to ensure everything is properly initialized
                setTimeout(() => {
                    canvas.addEventListener('click', handleCanvasClick);
                    canvas.addEventListener('mousemove', handleCanvasMouseMove);
                    canvas.addEventListener('mouseup', handleCanvasMouseUp);
                    console.log('Event listeners attached to canvas');
                }, 100);

                // Define setRooms function
                const extractWallSegments = (rooms: Room[]) => {
                    const wallSegments: Array<{
                        start: t.Vector3;
                        end: t.Vector3;
                        index: number;
                    }> = [];

                    rooms.forEach((roomData) => {
                        if (roomData.room_type === "Wall" || roomData.room_type === "Boundary") return;

                        const corners = roomData.floor_polygon;
                        for (let i = 0; i < corners.length; i++) {
                            const nextI = (i + 1) % corners.length;
                            const start = new t.Vector3(corners[i].x, 0, corners[i].z);
                            const end = new t.Vector3(corners[nextI].x, 0, corners[nextI].z);

                            wallSegments.push({
                                start,
                                end,
                                index: wallSegments.length
                            });
                        }
                    });

                    return wallSegments;
                };

                const setRooms = async (data: FloorPlanData) => {
                    const points: Array<t.Vector3> = [];

                    // Clear existing rooms from scene
                    rooms.forEach(room => {
                        if (room.group && room.group.parent) {
                            scene.remove(room.group);
                        }
                    });
                    rooms = [];
                    roofMeshes = [];

                    // Separate wall segments from rooms
                    const wallSegments: Array<any> = [];
                    const actualRooms: Array<any> = [];

                    for (let i = 0; i < data.rooms.length; i++) {
                        const roomData = data.rooms[i];

                        if (roomData.room_type === 'Wall') {
                            // Handle individual walls
                            if (roomData.floor_polygon.length === 2) {
                                wallSegments.push(roomData);
                                // Add wall points for center calculation
                                points.push(
                                    new t.Vector3(roomData.floor_polygon[0].x, 0, roomData.floor_polygon[0].z),
                                    new t.Vector3(roomData.floor_polygon[1].x, 0, roomData.floor_polygon[1].z)
                                );
                            }
                            continue;
                        }

                        if (roomData.room_type?.includes('reference') || roomData.floor_polygon.length < 3) {
                            console.log(`Skipping invalid room: ${roomData.id} (${roomData.room_type}, ${roomData.floor_polygon.length} corners)`);
                            continue;
                        }

                        actualRooms.push(roomData);
                    }

                    // Create rooms first
                    for (let i = 0; i < actualRooms.length; i++) {
                        const roomData = actualRooms[i];
                        const rp = roomData.floor_polygon.map((pos: Point) => new t.Vector3(pos.x, 0, pos.z));
                        const isBoundary = roomData.room_type?.toLowerCase() === 'boundary';

                        const defaultOuterWallConfig: MaterialConfig = {
                            id: `outer-wall-${roomData.id}`,
                            name: 'Default Outer Wall',
                            color: isBoundary ? '#ffe5d2' : '#dacba5',
                            roughness: 0.3,
                            useTexture: isBoundary,
                            texture: isBoundary ? 'fence' : undefined
                        };

                        const defaultInnerWallConfig: MaterialConfig = {
                            id: `inner-wall-${roomData.id}`,
                            name: 'Default Inner Wall',
                            color: isBoundary ? '#ffe5d2' : '#dacba5',
                            roughness: 0.8,
                            useTexture: isBoundary,
                            texture: isBoundary ? 'fence' : undefined
                        };

                        const defaultRoofConfig: MaterialConfig = {
                            id: `roof-${roomData.id}`,
                            name: 'Default Roof',
                            color: '#eaeaea',
                            roughness: 0.8,
                            useTexture: false
                        };

                        const defaultFloorConfig: MaterialConfig = {
                            id: `floor-${roomData.id}`,
                            name: 'Default Floor',
                            color: isBoundary ? '#fff5f5' : '#d8d5d5',
                            roughness: 0.4,
                            useTexture: false
                        };

                        const r = new room(
                            rp,
                            defaultInnerWallConfig,
                            defaultOuterWallConfig,
                            defaultRoofConfig,
                            defaultFloorConfig,
                            {
                                id: roomData.id,
                                room_type: roomData.room_type,
                                wallWidths: data.wallWidths,
                                isBoundary: isBoundary
                            },
                            {
                                mode: wallRenderingMode,
                                transparency: wallTransparency
                            }
                        );

                        if (doorWindowManagerRef.current && r.getWallSystem()) {
                            r.getWallSystem().setDoorWindowManager(doorWindowManagerRef.current);
                        }
                        registerRoom(r);

                        scene.add(r.group);
                        points.push(...rp);
                        rooms.push(r);

                        r.group.traverse((child) => {
                            if (child instanceof t.Mesh && child.material &&
                                (child.material as any).color &&
                                (child.material as any).color.getHex() === 0x2F4F4F) {
                                roofMeshes.push(child);
                            }
                        });
                    }

                    // Helper function to create individual walls using UnifiedWallSystem
                    const createIndividualWallWithUnifiedSystem = async (wallData: any, floorPlanData: FloorPlanData) => {
                        if (wallData.floor_polygon.length !== 2) return;

                        const start = wallData.floor_polygon[0];
                        const end = wallData.floor_polygon[1];

                        // Calculate wall direction and normal for creating a minimal polygon
                        const wallLength = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.z - start.z, 2));
                        const wallDirection = { x: (end.x - start.x) / wallLength, z: (end.z - start.z) / wallLength };
                        const wallNormal = { x: -wallDirection.z, z: wallDirection.x };

                        // Create a very thin rectangle polygon (minimal thickness for UnifiedWallSystem)
                        const thickness = 0.1; // Minimal thickness
                        const halfThickness = thickness / 2;

                        // Create 4 corners for a rectangular polygon
                        const wallCorners: Point[] = [
                            { x: start.x + wallNormal.x * halfThickness, z: start.z + wallNormal.z * halfThickness },
                            { x: end.x + wallNormal.x * halfThickness, z: end.z + wallNormal.z * halfThickness },
                            { x: end.x - wallNormal.x * halfThickness, z: end.z - wallNormal.z * halfThickness },
                            { x: start.x - wallNormal.x * halfThickness, z: start.z - wallNormal.z * halfThickness }
                        ];

                        // Create material configs for the individual wall
                        const defaultWallConfig: MaterialConfig = {
                            id: `individual-wall-${wallData.id}`,
                            name: `Individual Wall ${wallData.id}`,
                            color: '#dacba5',
                            roughness: 0.8,
                            useTexture: false
                        };

                        // Create material arrays for all 4 walls of the rectangle
                        const innerMaterials = [defaultWallConfig, defaultWallConfig, defaultWallConfig, defaultWallConfig];
                        const outerMaterials = [defaultWallConfig, defaultWallConfig, defaultWallConfig, defaultWallConfig];

                        // Import MaterialManager for consistency
                        const { MaterialManager } = await import('./Room');
                        const materialManager = MaterialManager.getInstance();

                        // Create UnifiedWallSystem for this individual wall
                        const wallSystem = new UnifiedWallSystem(
                            wallCorners,
                            innerMaterials,
                            outerMaterials,
                            materialManager,
                            `individual_wall_${wallData.id}`,
                            'Wall',
                            {
                                mode: wallRenderingMode,
                                transparency: wallTransparency
                            }
                        );

                        scene.add(wallSystem.group);

                        // Store reference for wall rendering mode changes
                        if (!scene.userData.individualWalls) {
                            scene.userData.individualWalls = [];
                        }
                        scene.userData.individualWalls.push(wallSystem);
                    };

                    // Create individual wall segments using UnifiedWallSystem
                    for (const wallData of wallSegments) {
                        await createIndividualWallWithUnifiedSystem(wallData, data);
                    }

                    console.log(`Created ${rooms.length} rooms and ${wallSegments.length} individual walls with ${points.length} points`);

                    // Camera positioning and center calculation
                    if (points.length > 0) {
                        center = getCenter(points);
                        controls.target.set(center.x, center.y, center.z);
                        if (camera) {
                            camera.position.set(center.x, center.y + 220, center.z + 160);
                        }
                        controls.update();
                        console.log('Camera positioned at center:', center);
                    } else {
                        // Default center position if no rooms or walls
                        center = new t.Vector3(0, 0, 0);
                        controls.target.set(0, 0, 0);
                        if (camera) {
                            camera.position.set(0, 225, 0);
                        }
                        controls.update();
                        console.log('Using default camera position');
                    }

                    // Process doors and windows
                    if (doorWindowManagerRef.current && (data.doors || data.windows)) {
                        console.log('Processing doors and windows:', {
                            doors: data.doors?.length || 0,
                            windows: data.windows?.length || 0
                        });

                        // Extract wall segments from all rooms for positioning
                        const allWallSegments = extractWallSegments(data.rooms);

                        await doorWindowManagerRef.current.processDoorWindows(
                            data.doors?.map(door => ({ ...door, type: 'door' as const })) || [],
                            data.windows?.map(window => ({ ...window, type: 'window' as const })) || [],
                            allWallSegments
                        );

                        // Connect doorWindowManager to rooms and force wall rebuild
                        for (const room of rooms) {
                            if (room && doorWindowManagerRef.current) {
                                room.setDoorWindowManager(doorWindowManagerRef.current);
                                const wallSystem = room.getWallSystem();
                                await wallSystem.rebuildWallsFromArrays();
                            }
                        }
                    }
                };

                // Initialize rooms with fetched data
                await setRooms(floorPlanData);

                if (roofMeshes) {
                    roofMeshes.forEach(mesh => {
                        mesh.visible = false;
                    });
                }

                const handleResize = () => {
                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(window.innerWidth, window.innerHeight);
                };

                player = new Player(scene, floorPlanData);
                player.setCameraReferences(cameraRef.current, controls);

                setTimeout(() => {
                    if (player && player.model) {
                        const positionInfo = player.getPositionInfo();
                        if (positionInfo.position) {
                            setPlayerPosition(positionInfo.position.clone());
                        }
                        if (positionInfo.orientation !== null) {
                            setPlayerRotation(positionInfo.orientation);
                        }
                        console.log('Initial player position set:', positionInfo);
                    }
                }, 500);

                window.addEventListener("resize", handleResize);

                const clock = new t.Clock();
                const animate = function () {
                    if (player.model && player.model.visible) {
                        player.update(clock.getDelta());
                        const ppos = player.model.position.clone();

                        const cameraHeightOffset = 6 + (playerScale / 100) * 40; // Base 6 + up to 8 more units
                        ppos.y += cameraHeightOffset;

                        controls.target.set(ppos.x, ppos.y, ppos.z);

                        if (controls && mode === 'person') {
                            const optimalDistance = 15 + (playerScale / 100) * 10; // Base 15 + up to 10 more units
                            const currentDistance = controls.getDistance();

                            // Smoothly adjust camera distance if too far from optimal
                            if (Math.abs(currentDistance - optimalDistance) > 2) {
                                const direction = new t.Vector3().subVectors(
                                    cameraRef.current!.position,
                                    controls.target
                                ).normalize();

                                cameraRef.current!.position.copy(
                                    controls.target.clone().add(direction.multiplyScalar(optimalDistance))
                                );
                            }
                        }
                    }
                    controls.update();
                    renderer.render(scene, camera!);
                }

                renderer.setAnimationLoop(animate);
                containerRef.current?.appendChild(renderer.domElement);

                // Ensure objectManager is properly initialized before loading objects
                if (objectManager && floorPlanData) {
                    // Clear any existing objects first
                    objectManager.dispose();
                    // Update floor plan data
                    objectManager.updateFloorPlanData(floorPlanData);
                    // Load objects from floor plan
                    await loadObjectsFromFloorPlan(floorPlanData, objectManager);
                }

                console.log('3D Scene initialized successfully');
                setIsLoadingData(false);

            } catch (error) {
                console.error('Failed to initialize 3D scene:', error);
                setDataError(error instanceof Error ? error.message : 'Failed to load 3D scene');
                setIsLoadingData(false);
            } finally {
                isInitializing = false;
            }
        };

        initializeScene();

        // Cleanup function
        return () => {
            isInitializing = false;
            materialManager?.disposeAll();
            if (objectManager) {
                objectManager.dispose();
            }
            const canvas = renderer?.domElement;
            if (canvas) {
                canvas.removeEventListener('click', handleCanvasClick);
                canvas.removeEventListener('mousemove', handleCanvasMouseMove);
                canvas.removeEventListener('mouseup', handleCanvasMouseUp);
            }
            // DISPOSE OF DOOR/WINDOW MANAGER
            if (doorWindowManagerRef.current) {
                doorWindowManagerRef.current.dispose();
            }
        };
    }, []);

    useEffect(() => {
        if (player && cameraRef.current && controls && mode === 'person') {
            player.setCameraReferences(cameraRef.current, controls);
        }
    }, [mode, player, cameraRef.current, controls]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                if (selectedObjectIdRef.current && objectManager) {
                    objectManager.removeObject(selectedObjectIdRef.current);
                    setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
                    setSelectedObjectId(null);
                    setObjectControlMode(null);
                    setHasObjectChanges(false);
                    setOriginalObjectState(null);
                }
            }

            // ESC key to cancel object placement or exit control mode
            if (event.key === 'Escape') {
                if (isPlacingObjectRef.current) {
                    setIsPlacingObject(false);
                    setPendingObjectData(null);
                    if (renderer && renderer.domElement) {
                        renderer.domElement.style.cursor = 'default';
                    }
                } else if (selectedObjectIdRef.current) {
                    // Exit control mode
                    setSelectedObjectId(null);
                    setObjectControlMode(null);
                    setHasObjectChanges(false);
                    setOriginalObjectState(null);
                    if (objectManager) {
                        objectManager.selectObject(null);
                    }
                }
            }

            // Toggle panel lock with 'L' key
            if (event.key === 'l' || event.key === 'L') {
                if (selectedObjectIdRef.current) {
                    setIsObjectPanelLocked(!isObjectPanelLocked);
                }
            }

            // Quick rotation with R key (only if object is selected and panel is open)
            if ((event.key === 'r' || event.key === 'R') && selectedObjectIdRef.current && objectManager) {
                const selectedObject = objectManager.getSelectedObject();
                if (selectedObject) {
                    const newRotation = new t.Euler(
                        selectedObject.rotation.x,
                        selectedObject.rotation.y + Math.PI / 2, // 90 degrees
                        selectedObject.rotation.z
                    );
                    objectManager.updateObjectRotation(selectedObjectIdRef.current, newRotation);
                    setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
                    setHasObjectChanges(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isObjectPanelLocked]);

    const repositionPlayerForFloorPlan = (newFloorPlanData: any) => {
        if (player && newFloorPlanData) {
            // Update the floor plan data in the player
            player.setFloorPlanData(newFloorPlanData);

            // Update position tracking
            setTimeout(() => {
                if (player && player.model) {
                    const positionInfo = player.getPositionInfo();
                    if (positionInfo.position) {
                        setPlayerPosition(positionInfo.position.clone());
                    }
                    if (positionInfo.orientation !== null) {
                        setPlayerRotation(positionInfo.orientation);
                    }
                }
            }, 100);
        }
    };

    // Handle material changes from the settings panel
    const handleMaterialChange = async (component: string, materialData: any) => {
        // console.log('Material change:', component, materialData);

        try {
            for (const room of rooms) {
                if (component === 'innerWall') {
                    await room.updateWallMaterials('inner', materialData);
                } else if (component === 'outerWall') {
                    await room.updateWallMaterials('outer', materialData);
                } else if (component === 'floor' || component === 'roof') {
                    await room.updateMaterial(component, materialData);
                }
            }
        } catch (error) {
            console.error('Failed to apply material change:', error);
        }
    };

    const handleZoomChange = (value: number) => {
        setZoomLevel(value);
        if (controls && cameraRef.current) {
            const camera = cameraRef.current;
            const direction = new t.Vector3().subVectors(camera.position, controls.target).normalize();
            const distance = ((100 - value) / 100) * 500 + 50;
            camera.position.copy(controls.target.clone().add(direction.multiplyScalar(distance)));
            controls.update();
        }
    };

    const handleRoofToggle = (visible: boolean) => {
        if (roofMeshes) {
            roofMeshes.forEach(mesh => {
                mesh.visible = visible;
            });
        }
    };

    const { exportModel, isExporting, exportProgress, error, clearError } = useModelExporter();

    const handleExport = async (format: string) => {
        if (!renderer || !scene || !cameraRef.current) {
            throw new Error('Missing required components for export');
        }

        try {
            if (['png', 'jpeg', 'pdf'].includes(format)) {
                return;
            }

            if (['glb', 'gltf', 'obj'].includes(format)) {
                console.log(`Exporting ${format.toUpperCase()} model...`);

                if (typeof exportModel === 'function') {
                    await exportModel({
                        format,
                        scene,
                        camera: cameraRef.current,
                        fileName: `floor-plan-3d.${format}`,
                        quality: 'high',
                        includeTextures: true,
                        includeObjects: true,
                        includeFloorPlan: true
                    });
                } else {
                    // Fallback implementation for 3D export
                    throw new Error(`${format.toUpperCase()} export not yet implemented`);
                }
                return;
            }

            throw new Error(`Unsupported export format: ${format}`);
        } catch (error) {
            console.error(`${format.toUpperCase()} export failed:`, error);
            throw error; // Re-throw to let ShareButton handle the error display
        }
    };
    const handleShare = async (method: string) => {
        try {
            if (method === 'link') {
                // Construct the share URL with the view prefix
                const baseUrl = window.location.origin;
                const shareUrl = `${baseUrl}/view/playground/${projectId}/${planId}`;

                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareUrl);
                    alert('Link copied to clipboard!');
                } else {
                    // Fallback for browsers without clipboard API
                    const textArea = document.createElement('textarea');
                    textArea.value = shareUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    alert('Link copied to clipboard!');
                }
            } else if (method === 'social') {
                // Construct the share URL with the view prefix
                const baseUrl = window.location.origin;
                const shareUrl = `${baseUrl}/view/playground/${projectId}/${planId}`;

                if (navigator.share) {
                    await navigator.share({
                        title: '3D Floor Plan',
                        text: 'Check out this amazing 3D floor plan!',
                        url: shareUrl
                    });
                } else {
                    // Fallback - copy to clipboard and show social sharing suggestion
                    await navigator.clipboard.writeText(shareUrl);
                    alert('Link copied to clipboard! You can now paste it on your social media platform.');
                }
            } else {
                throw new Error(`Unsupported share method: ${method}`);
            }
        } catch (error) {
            console.error('Share failed:', error);
            throw error; // Re-throw to let ShareButton handle the error display
        }
    };

    function CameraSwitchToggle() {
        function onCameraModeChange(_event: React.MouseEvent<HTMLElement, MouseEvent>, newMode: string) {
            console.log("Camera mode changed to:", newMode);
            if (newMode == null || newMode === mode) return;
            const camera = cameraRef.current;
            if (!camera) return;

            if (newMode === "orbit") {
                enableCameraMode(camera);
                setMode(newMode);
            } else if (newMode === "person") {
                enablePlayerMode(camera, playerScale);
                setMode(newMode);
            }

            setMode(newMode);
        }

        return (
            <div>
                <ToggleButtonGroup className="camera-toggle-group"
                    value={mode}
                    exclusive
                    onChange={onCameraModeChange}
                    style={{ zIndex: 1000 }}
                >
                    <ToggleButton
                        value="orbit"
                        aria-label="orbit camera"
                        selected={mode === "orbit"}
                    >
                        <CameraIcon />
                    </ToggleButton>
                    <ToggleButton
                        value="person"
                        aria-label="person camera"
                        selected={mode === "person"}
                    >
                        <PersonIcon />
                    </ToggleButton>
                </ToggleButtonGroup>
            </div>
        );
    }

    const handleRoomTypeUpdate = (roomId: string, newType: string) => {
        setFloorPlanDataState(prevData => ({
            ...prevData,
            rooms: prevData.rooms.map(room =>
                room.id === roomId ? { ...room, room_type: newType } : room
            )
        }));
    };

    return (
        <>
            <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />
            {/* <SaveResetControls />
            <UnsavedChangesDialog /> */}
            <CameraSwitchToggle />

            {/* New Side Panel Component */}
            <SidePanel
                onMaterialChange={handleMaterialChange}
                onObjectPlace={handleObjectPlace}
                placedObjects={placedObjects}
                onObjectSelect={handleObjectSelect}
                selectedObjectId={selectedObjectId ?? undefined}
                onZoomChange={handleZoomChange}
                onToggleRoof={handleRoofToggle}
                onFieldOfViewChange={handleFieldOfViewChange}
                fieldOfView={fieldOfView}
                playerScale={playerScale}
                showRoof={showRoof}
                onDirectionClick={(axis) => {
                    if (!cameraRef.current || !controls) return;
                    const target = controls.target.clone();
                    if (axis === 'x') cameraRef.current.position.set(target.x + 200, target.y, target.z);
                    if (axis === 'y') cameraRef.current.position.set(target.x, target.y + 200, target.z);
                    if (axis === 'z') cameraRef.current.position.set(target.x, target.y, target.z + 200);
                    cameraRef.current.lookAt(target);
                    controls.update();
                }}
                onResetRotation={handleResetRotation}
                cameraMode={mode}
                scene={sceneRef ?? undefined}
                renderer={rendererRef ?? undefined}
                floorPlanData={floorPlanDataState}
                camera={cameraRef.current ?? undefined}
                onOverlaySettingsChange={handleOverlaySettingsChange}
                onCameraHeightChange={handleCameraHeightChange}
                viewOnly={viewOnly}
            />

            <Compass
                camera={cameraRef.current}
                mode={mode}
                onDirectionClick={(axis) => {
                    if (!cameraRef.current || !controls) return;
                    const target = controls.target.clone();
                    if (axis === 'x') cameraRef.current.position.set(target.x + 200, target.y, target.z);
                    if (axis === 'y') cameraRef.current.position.set(target.x, target.y + 200, target.z);
                    if (axis === 'z') cameraRef.current.position.set(target.x, target.y, target.z + 200);
                    cameraRef.current.lookAt(target);
                    controls.update();
                }}
            />

            <ElevationControls
                camera={cameraRef.current}
                controls={controls}
                mode={mode}
                visible={mode === 'orbit'}
                floorPlanData={floorPlanDataState}
            />

            <Minimap
                playerPosition={playerPosition}
                playerRotation={playerRotation}
                visible={mode === 'person'}
                currentRoom={currentRoom}
                floorPlanData={floorPlanDataState} // Pass the actual loaded floor plan data
            />

            <PlayerLocationOverlay
                visible={mode === 'person'}
                currentRoom={currentRoom}
                floorPlanData={floorPlanDataState}
            />

            {/* Game Controls for Person Mode */}
            <GameControls
                visible={gameControlsVisible}
                onMovement={handleGameControlMovement}
            />

            {/* Object placement indicator */}
            {isPlacingObject && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    zIndex: 1001,
                    fontSize: '14px',
                    pointerEvents: 'none'
                }}>
                    Click to place {pendingObjectData?.name} • Press ESC to cancel
                </div>
            )}

            <PropertyOverlay3D
                floorPlanData={floorPlanDataState}
                camera={cameraRef.current}
                scene={sceneRef}
                renderer={rendererRef}
                overlaySettings={overlaySettings}
                cameraMode={mode} // Pass the current camera mode
                playerPosition={playerPosition ?? undefined}
            />

            <UnifiedControlPanel
                navigate={navigate}
                wallRenderingMode={wallRenderingMode}
                wallTransparency={wallTransparency}
                onWallRenderingChange={handleWallRenderingChange}
                ShareButtonComponent={ShareButton}
                shareProps={{
                    onExport: handleExport,
                    onShare: handleShare,
                    scene: scene,
                    camera: cameraRef.current ?? undefined,
                    renderer: renderer,
                    isExporting: isExporting,
                    exportProgress: exportProgress
                }}
                projectId={projectId}
                planId={planId}
                viewOnly={viewOnly}
            />

            <ObjectControlPanel
                selectedObject={selectedObjectId && objectManager ? objectManager.getSelectedObject() : null}
                onModeChange={handleObjectModeChange}
                onDelete={() => {
                    if (selectedObjectId && objectManager) {
                        objectManager.removeObject(selectedObjectId);
                        setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
                        setSelectedObjectId(null);
                        setObjectControlMode(null);
                        setHasObjectChanges(false);
                        setOriginalObjectState(null);
                    }
                }}
                onDuplicate={() => {
                    if (selectedObjectId && objectManager) {
                        const newId = objectManager.duplicateObject(selectedObjectId);
                        if (newId) {
                            setPlacedObjects(convertToPlacedObjects(objectManager.getObjects()));
                            setSelectedObjectId(newId);
                        }
                    }
                }}
                onSave={handleSaveObjectChanges}
                onDiscard={handleDiscardObjectChanges}
                onRotate={handleObjectRotate}
                onScale={handleObjectScale}
                currentMode={objectControlMode}
                hasChanges={hasObjectChanges}
                isLocked={isObjectPanelLocked}
                onToggleLock={handleTogglePanelLock}
            />
        </>
    );
}
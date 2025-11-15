import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings, Package, Camera, Eye, EyeOff, PaintBucket, Pencil } from 'lucide-react';
import ObjectPanel from './ObjectPanel';
import { CustomizationPanel } from './CustomizationPanel'; // Import the separate component
import * as t from 'three';

// Material presets with optimized textures
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

export type PanelType = 'customization' | 'edit' | 'objects' | 'camera' | null;

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

interface SidePanelProps {
    onMaterialChange: (component: string, materialData: any) => void;
    onObjectPlace?: (modelPath: string, modelData: any) => void;
    placedObjects?: Array<{
        id: string;
        name: string;
        modelPath: string;
        imagePath: string;
        description: string;
        author: string;
        license: string;
        position: any;
    }>;
    onObjectSelect?: (objectId: string) => void;
    selectedObjectId?: string;
    onZoomChange: (value: number) => void;
    onToggleRoof: (visible: boolean) => void;
    onDirectionClick: (axis: 'x' | 'y' | 'z') => void;
    onResetRotation?: () => void;
    onFieldOfViewChange: (value: number) => void;
    fieldOfView: number;
    playerScale: number;
    showRoof: boolean;
    onCameraHeightChange?: (value: number) => void;
    cameraMode: string;
    scene?: t.Scene;
    renderer?: t.WebGLRenderer;
    floorPlanData?: FloorPlanData;
    camera?: t.PerspectiveCamera;
    onOverlaySettingsChange?: (settings: any) => void;
    viewOnly?: boolean;
}

interface MaterialOption {
    id: string;
    name: string;
    color: string;
    texture: string;
    roughness: number;
}

// Material Preview Component
function MaterialPreview({
    material,
    selected,
    onClick
}: {
    material: MaterialOption,
    selected: boolean,
    onClick: () => void
}) {
    return (
        <div
            className={`material-preview ${selected ? 'material-preview--selected' : ''}`}
            onClick={onClick}
        >
            <div
                className="material-preview__swatch"
                style={{
                    backgroundColor: material.color,
                    backgroundImage: material.texture ? `url(/textures/${material.texture}.jpg)` : 'none'
                }}
            />
            <div className="material-preview__name">{material.name}</div>
        </div>
    );
}

// Color Picker Component
function ColorPicker({ value, onChange, label }: { value: string, onChange: (color: string) => void, label: string }) {
    return (
        <div className="color-picker">
            <label className="color-picker__label">{label}</label>
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="color-picker__input"
            />
            <div
                className="color-picker__preview"
                style={{ backgroundColor: value }}
            />
        </div>
    );
}

// Collapsible Section Component
function CollapsibleSection({
    title,
    children,
    defaultExpanded = true
}: {
    title: string,
    children: React.ReactNode,
    defaultExpanded?: boolean
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="collapsible-section">
            <button
                className="collapsible-section__header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="collapsible-section__title">{title}</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {isExpanded && (
                <div className="collapsible-section__content">
                    {children}
                </div>
            )}
        </div>
    );
}

// Edit Panel Component
function EditPanel({ onClose, onMaterialChange }: { onClose: () => void, onMaterialChange: (component: string, materialData: any) => void }) {
    const [selectedMaterials, setSelectedMaterials] = useState({
        innerWall: 'plaster',
        outerWall: 'brick',
        floor: 'wood',
        roof: 'swood'
    });

    const [customColors, setCustomColors] = useState({
        innerWall: '#e1ded1',
        outerWall: '#dad3c2',
        floor: '#f0f0f0',
        roof: '#eaeaea'
    });

    const [useTexture, setUseTexture] = useState({
        innerWall: false,
        outerWall: false,
        floor: false,
        roof: false
    });

    const panelRef = useRef<HTMLDivElement>(null);

    const blockAllEvents = (e: React.MouseEvent | React.WheelEvent) => {
        e.stopPropagation();
    };

    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;

        const handleWheel = (e: WheelEvent) => {
            e.stopPropagation();
            e.preventDefault();
        };

        panel.addEventListener('wheel', handleWheel, { passive: false });
        return () => panel.removeEventListener('wheel', handleWheel);
    }, []);

    const handleMaterialSelect = (component: string, materialId: string) => {
        setSelectedMaterials(prev => ({ ...prev, [component]: materialId }));

        let materialData;
        if (component.includes('Wall')) {
            materialData = MATERIAL_PRESETS.wall.find(m => m.id === materialId);
        } else if (component === 'floor') {
            materialData = MATERIAL_PRESETS.floor.find(m => m.id === materialId);
        } else if (component === 'roof') {
            materialData = MATERIAL_PRESETS.roof.find(m => m.id === materialId);
        }

        if (materialData) {
            onMaterialChange(component, {
                ...materialData,
                useTexture: useTexture[component as keyof typeof useTexture]
            });
        }
    };

    const handleColorChange = (component: string, color: string) => {
        setCustomColors(prev => ({ ...prev, [component]: color }));
        onMaterialChange(component, {
            id: `${component}-custom`,
            name: `Custom ${component}`,
            color,
            roughness: 0.5,
            useTexture: false
        });
    };

    const handleTextureToggle = (component: string, enabled: boolean) => {
        setUseTexture(prev => ({ ...prev, [component]: enabled }));

        if (enabled) {
            handleMaterialSelect(component, selectedMaterials[component as keyof typeof selectedMaterials]);
        } else {
            handleColorChange(component, customColors[component as keyof typeof customColors]);
        }
    };

    return (
        <div
            ref={panelRef}
            className="modern-panel"
            onMouseDown={blockAllEvents}
            onMouseMove={blockAllEvents}
            onMouseUp={blockAllEvents}
            onClick={blockAllEvents}
            onDoubleClick={blockAllEvents}
            onWheel={blockAllEvents}
        >
            <div className="modern-panel__header">
                <div className="modern-panel__header-content">
                    <PaintBucket size={20} className="modern-panel__header-icon" />
                    <h2 className="modern-panel__title">Materials</h2>
                </div>
                <button onClick={onClose} className="modern-panel__close">
                    ×
                </button>
            </div>

            <div className="modern-panel__content">
                <CollapsibleSection title="Walls" defaultExpanded={false}>
                    <div className="section-group">
                        <h4 className="section-subtitle">Outdoor Walls</h4>

                        <label className="modern-checkbox">
                            <input
                                type="checkbox"
                                checked={useTexture.innerWall}
                                onChange={(e) => handleTextureToggle('innerWall', e.target.checked)}
                            />
                            <span className="modern-checkbox__checkmark"></span>
                            <span className="modern-checkbox__label">Use Material Texture</span>
                        </label>

                        {useTexture.innerWall ? (
                            <div className="material-grid">
                                {MATERIAL_PRESETS.wall.map((material) => (
                                    <MaterialPreview
                                        key={material.id}
                                        material={material}
                                        selected={selectedMaterials.innerWall === material.id}
                                        onClick={() => handleMaterialSelect('innerWall', material.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <ColorPicker
                                value={customColors.innerWall}
                                onChange={(color) => handleColorChange('innerWall', color)}
                                label="Wall Color"
                            />
                        )}

                        <div className="section-divider" />

                        <h4 className="section-subtitle">Indoor Walls</h4>

                        <label className="modern-checkbox">
                            <input
                                type="checkbox"
                                checked={useTexture.outerWall}
                                onChange={(e) => handleTextureToggle('outerWall', e.target.checked)}
                            />
                            <span className="modern-checkbox__checkmark"></span>
                            <span className="modern-checkbox__label">Use Material Texture</span>
                        </label>

                        {useTexture.outerWall ? (
                            <div className="material-grid">
                                {MATERIAL_PRESETS.wall.map((material) => (
                                    <MaterialPreview
                                        key={material.id}
                                        material={material}
                                        selected={selectedMaterials.outerWall === material.id}
                                        onClick={() => handleMaterialSelect('outerWall', material.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <ColorPicker
                                value={customColors.outerWall}
                                onChange={(color) => handleColorChange('outerWall', color)}
                                label="Wall Color"
                            />
                        )}
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Floor" defaultExpanded={false}>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={useTexture.floor}
                            onChange={(e) => handleTextureToggle('floor', e.target.checked)}
                        />
                        <span className="modern-checkbox__checkmark"></span>
                        <span className="modern-checkbox__label">Use Material Texture</span>
                    </label>

                    {useTexture.floor ? (
                        <div className="material-grid">
                            {MATERIAL_PRESETS.floor.map((material) => (
                                <MaterialPreview
                                    key={material.id}
                                    material={material}
                                    selected={selectedMaterials.floor === material.id}
                                    onClick={() => handleMaterialSelect('floor', material.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <ColorPicker
                            value={customColors.floor}
                            onChange={(color) => handleColorChange('floor', color)}
                            label="Floor Color"
                        />
                    )}
                </CollapsibleSection>

                <CollapsibleSection title="Roof" defaultExpanded={false}>
                    <label className="modern-checkbox">
                        <input
                            type="checkbox"
                            checked={useTexture.roof}
                            onChange={(e) => handleTextureToggle('roof', e.target.checked)}
                        />
                        <span className="modern-checkbox__checkmark"></span>
                        <span className="modern-checkbox__label">Use Material Texture</span>
                    </label>

                    {useTexture.roof ? (
                        <div className="material-grid">
                            {MATERIAL_PRESETS.roof.map((material) => (
                                <MaterialPreview
                                    key={material.id}
                                    material={material}
                                    selected={selectedMaterials.roof === material.id}
                                    onClick={() => handleMaterialSelect('roof', material.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <ColorPicker
                            value={customColors.roof}
                            onChange={(color) => handleColorChange('roof', color)}
                            label="Roof Color"
                        />
                    )}
                </CollapsibleSection>
            </div>
        </div>
    );
}

// Camera Panel Component
function CameraPanel({
    onClose,
    onZoomChange,
    onToggleRoof,
    onDirectionClick,
    onResetRotation,
    onFieldOfViewChange,
    fieldOfView,
    playerScale,
    showRoof,
    onCameraHeightChange,
    cameraMode
}: {
    onClose: () => void;
    onZoomChange: (value: number) => void;
    onToggleRoof: (visible: boolean) => void;
    onDirectionClick: (axis: 'x' | 'y' | 'z') => void;
    onResetRotation?: () => void;
    onFieldOfViewChange?: (value: number) => void;
    onCameraHeightChange?: (value: number) => void;
    cameraMode: string;
    fieldOfView?: number;
    playerScale?: number;
    showRoof?: boolean;
}) {
    const [zoomLevel, setZoomLevel] = useState(65);

    const panelRef = useRef<HTMLDivElement>(null);

    const blockAllEvents = (e: React.MouseEvent | React.WheelEvent) => {
        e.stopPropagation();
    };

    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;

        const handleWheel = (e: WheelEvent) => {
            e.stopPropagation();
            e.preventDefault();
        };

        panel.addEventListener('wheel', handleWheel, { passive: false });
        return () => panel.removeEventListener('wheel', handleWheel);
    }, []);

    useEffect(() => {
        if (cameraMode === "orbit") {
            onToggleRoof(false);
        } else if (cameraMode === "person") {
            onToggleRoof(true);
        }
    }, [cameraMode, onToggleRoof]);

    const handleZoomChange = (value: number) => {
        setZoomLevel(value);
        onZoomChange(value);
    };

    const handleRoofToggle = (visible: boolean) => {
        onToggleRoof(visible);
    };

    const handleCameraHeightChange = (value: number) => {
        if (onCameraHeightChange) {
            onCameraHeightChange(value);
        }
    };

    const handleFieldOfViewChange = (value: number) => {
        if (onFieldOfViewChange) {
            onFieldOfViewChange(value);
        }
    };

    return (
        <div
            ref={panelRef}
            className="modern-panel"
            onMouseDown={blockAllEvents}
            onMouseMove={blockAllEvents}
            onMouseUp={blockAllEvents}
            onClick={blockAllEvents}
            onDoubleClick={blockAllEvents}
            onWheel={blockAllEvents}
        >
            {/* <div className="modern-panel__header">
                <div className="modern-panel__header-content">
                    <Camera size={20} className="modern-panel__header-icon" />
                    <h2 className="modern-panel__title">Camera</h2>
                </div>
                <button onClick={onClose} className="modern-panel__close">
                    ×
                </button>
            </div> */}

            <div className="modern-panel__content">
                {cameraMode === 'orbit' && (
                    <CollapsibleSection title="Zoom Control" defaultExpanded={false}>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="1"
                                value={zoomLevel}
                                onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                                className="modern-slider"
                            />
                            <div className="slider-labels">
                                <span>Far</span>
                                <span>Close</span>
                            </div>
                            <div className="slider-value">
                                Zoom: {zoomLevel}%
                            </div>
                        </div>
                    </CollapsibleSection>
                )}

                {cameraMode === 'person' && (
                    <CollapsibleSection title="Camera Height" defaultExpanded={false}>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={playerScale || 50}
                                onChange={(e) => handleCameraHeightChange(parseInt(e.target.value))}
                                className="modern-slider"
                            />
                            <div className="slider-labels">
                                <span>Low</span>
                                <span>High</span>
                            </div>
                            <div className="slider-value">
                                Height: {playerScale || 50}%
                            </div>
                        </div>
                    </CollapsibleSection>
                )}

                {cameraMode === 'person' && (
                    <CollapsibleSection title="Field of View" defaultExpanded={false}>
                        <div className="slider-container">
                            <input
                                type="range"
                                min="30"
                                max="120"
                                step="5"
                                value={fieldOfView || 60}
                                onChange={(e) => handleFieldOfViewChange(parseInt(e.target.value))}
                                className="modern-slider"
                            />
                            <div className="slider-labels">
                                <span>Narrow</span>
                                <span>Wide</span>
                            </div>
                            <div className="slider-value">
                                FOV: {(fieldOfView ?? 60)}°
                            </div>
                        </div>
                    </CollapsibleSection>
                )}

                {/* {cameraMode === 'person' && (
                    <CollapsibleSection title="Roof Visibility" defaultExpanded={false}>
                        <label className="modern-checkbox">
                            <input
                                type="checkbox"
                                checked={showRoof || true}
                                onChange={(e) => handleRoofToggle(e.target.checked)}
                            />
                            <span className="modern-checkbox__checkmark"></span>
                            <span className="modern-checkbox__label">Show Roof</span>
                        </label>
                    </CollapsibleSection>
                )} */}
            </div>
        </div>
    );
}

// Main Side Panel Component
export const SidePanel: React.FC<SidePanelProps> = ({
    onMaterialChange,
    onObjectPlace,
    placedObjects,
    onObjectSelect,
    selectedObjectId,
    onZoomChange,
    onToggleRoof,
    onDirectionClick,
    onResetRotation,
    onFieldOfViewChange,
    fieldOfView,
    playerScale,
    showRoof,
    onCameraHeightChange,
    cameraMode,
    scene,
    renderer,
    floorPlanData,
    camera,
    onOverlaySettingsChange,
    viewOnly = false
}) => {
    const [activePanel, setActivePanel] = useState<PanelType>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                const target = event.target as HTMLElement;
                if (!target.closest('.side-panel-icons')) {
                    setActivePanel(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActivePanel(null);
            }
        };

        if (activePanel) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [activePanel]);

    const handleIconClick = (panelType: PanelType) => {
        if (activePanel === panelType) {
            setActivePanel(null);
        } else {
            setActivePanel(panelType);
        }
    };

    const renderActivePanel = () => {
        switch (activePanel) {
            case 'customization':
                return (
                    <CustomizationPanel
                        onClose={() => setActivePanel(null)}
                        scene={scene}
                        renderer={renderer}
                        floorPlanData={floorPlanData}
                        camera={camera}
                        onOverlaySettingsChange={onOverlaySettingsChange}
                    />
                );
            // case 'edit':
            //     return (
            //         <EditPanel
            //             onClose={() => setActivePanel(null)}
            //             onMaterialChange={onMaterialChange}
            //         />
            //     );
            case 'objects':
                return (
                    <ObjectPanel
                        onClose={() => setActivePanel(null)}
                        onObjectPlace={onObjectPlace}
                        cameraMode={cameraMode}
                        placedObjects={placedObjects}
                        onObjectSelect={onObjectSelect}
                        selectedObjectId={selectedObjectId}
                    />
                );
            case 'camera':
                return (
                    <CameraPanel
                        onClose={() => setActivePanel(null)}
                        onZoomChange={onZoomChange}
                        onToggleRoof={onToggleRoof}
                        onDirectionClick={onDirectionClick}
                        onResetRotation={onResetRotation}
                        onFieldOfViewChange={onFieldOfViewChange}
                        fieldOfView={fieldOfView}
                        playerScale={playerScale}
                        showRoof={showRoof}
                        onCameraHeightChange={onCameraHeightChange}
                        cameraMode={cameraMode}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div ref={panelRef}>
            <div className="side-panel-icons">
                {/* <div
                    className={`side-panel-icon ${activePanel === 'customization' ? 'active' : ''}`}
                    onClick={() => handleIconClick('customization')}
                    title="Customization"
                >
                    <Pencil size={24} />
                </div> */}
                {!viewOnly && (
                    <>
                        {/* <div
                            className={`side-panel-icon ${activePanel === 'edit' ? 'active' : ''}`}
                            onClick={() => handleIconClick('edit')}
                            title="Edit Materials"
                        >
                            <PaintBucket size={24} />
                        </div> */}
                        {/* <div
                            className={`side-panel-icon ${activePanel === 'objects' ? 'active' : ''}`}
                            onClick={() => handleIconClick('objects')}
                            title="Place Objects"
                        >
                            <Package size={24} />
                        </div> */}
                        <div
                            className={`side-panel-icon ${activePanel === 'camera' ? 'active' : ''}`}
                            onClick={() => handleIconClick('camera')}
                            title="Camera Settings"
                        >
                            <Camera size={24} />
                        </div>
                    </>
                )}
            </div>

            {renderActivePanel()}

            <style>{`
                /* Side Panel Icons */
                .side-panel-icons {
                    position: fixed;
                    left: 20px;
                    bottom: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    z-index: 1000;
                    user-select: none;
                }

                .side-panel-icon {
                    width: 54px;
                    height: 54px;
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    border: 1px solid #e0e7ff;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    color: #64748b;
                    backdrop-filter: blur(10px);
                }

                .side-panel-icon:hover {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    border-color: #3b82f6;
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
                    color: #3b82f6;
                }

                .side-panel-icon.active {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-color: #2563eb;
                    color: white;
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
                    transform: translateY(-2px);
                }

                .side-panel-icon.active:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: translateY(-2px) scale(1.05);
                }

                /* Modern Panel Styles */
                .modern-panel {
                    position: fixed;
                    left: 85px;
                    bottom: 20px;
                    width: 360px;
                    max-height: 75vh;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(224, 231, 255, 0.8);
                    border-radius: 20px;
                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    z-index: 999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    user-select: none;
                    display: flex;
                    flex-direction: column;
                    animation: slideInPanel 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes slideInPanel {
                    from {
                        transform: translateX(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                .modern-panel__header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px 24px;
                    border-bottom: 1px solid rgba(224, 231, 255, 0.5);
                    background: linear-gradient(135deg, rgba(248, 249, 250, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%);
                    backdrop-filter: blur(10px);
                    flex-shrink: 0;
                }

                .modern-panel__header-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .modern-panel__header-icon {
                    color: #3b82f6;
                }

                .modern-panel__title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1e293b;
                    letter-spacing: -0.025em;
                }

                .modern-panel__close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    color: #64748b;
                    line-height: 1;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                }

                .modern-panel__close:hover {
                    background-color: #f1f5f9;
                    color: #1e293b;
                }

                .modern-panel__content {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    min-height: 0;
                    padding: 0;
                }

                /* Collapsible Section */
                .collapsible-section {
                    border-bottom: 1px solid rgba(224, 231, 255, 0.3);
                }

                .collapsible-section__header {
                    width: 100%;
                    background: none;
                    border: none;
                    padding: 20px 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: left;
                }

                .collapsible-section__header:hover {
                    background: rgba(59, 130, 246, 0.05);
                }

                .collapsible-section__title {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e293b;
                    letter-spacing: -0.025em;
                }

                .collapsible-section__content {
                    padding: 0 24px 20px;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Section Groups */
                .section-group {
                    margin-bottom: 0;
                }

                .section-subtitle {
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                    margin: 0 0 16px 0;
                    letter-spacing: -0.025em;
                }

                .section-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(224, 231, 255, 0.5) 50%, transparent 100%);
                    margin: 20px 0;
                    border: none;
                }

                /* Modern Checkbox */
                .modern-checkbox {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
                    margin-bottom: 16px;
                    gap: 12px;
                }

                .modern-checkbox input {
                    position: absolute;
                    opacity: 0;
                }

                .modern-checkbox__checkmark {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #d1d5db;
                    border-radius: 6px;
                    background: #ffffff;
                    position: relative;
                    transition: all 0.2s ease;
                    flex-shrink: 0;
                }

                .modern-checkbox input:checked + .modern-checkbox__checkmark {
                    background: #3b82f6;
                    border-color: #3b82f6;
                }

                .modern-checkbox input:checked + .modern-checkbox__checkmark::after {
                    content: '';
                    position: absolute;
                    left: 6px;
                    top: 2px;
                    width: 6px;
                    height: 10px;
                    border: solid white;
                    border-width: 0 2px 2px 0;
                    transform: rotate(45deg);
                }

                .modern-checkbox__label {
                    font-size: 14px;
                    color: #374151;
                    font-weight: 500;
                }

                /* Material Grid */
                .material-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin: 16px 0;
                }

                .material-preview {
                    cursor: pointer;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 12px;
                    text-align: center;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    background: #ffffff;
                    position: relative;
                    overflow: hidden;
                }

                .material-preview::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .material-preview:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
                    border-color: #3b82f6;
                }

                .material-preview:hover::before {
                    opacity: 1;
                }

                .material-preview--selected {
                    border-color: #3b82f6;
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
                    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
                }

                .material-preview__swatch {
                    width: 48px;
                    height: 48px;
                    border-radius: 8px;
                    margin: 0 auto 8px;
                    background-size: cover;
                    background-repeat: repeat;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    position: relative;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .material-preview__name {
                    font-size: 11px;
                    color: #374151;
                    font-weight: 500;
                    line-height: 1.3;
                }

                .material-preview--selected .material-preview__name {
                    font-weight: 600;
                    color: #1e293b;
                }

                /* Color Picker */
                .color-picker {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin: 16px 0;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }

                .color-picker__label {
                    font-size: 14px;
                    color: #374151;
                    font-weight: 500;
                    min-width: 80px;
                }

                .color-picker__input {
                    width: 48px;
                    height: 48px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    background: none;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s ease;
                }

                .color-picker__input:hover {
                    transform: scale(1.05);
                }

                .color-picker__preview {
                    width: 32px;
                    height: 32px;
                    border-radius: 6px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }

                /* Modern Slider */
                .slider-container {
                    margin: 16px 0;
                }

                .modern-slider {
                    width: 100%;
                    height: 6px;
                    border-radius: 3px;
                    background: #e2e8f0;
                    outline: none;
                    transition: background 0.2s ease;
                    -webkit-appearance: none;
                    appearance: none;
                    margin-bottom: 12px;
                }

                .modern-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                .modern-slider::-webkit-slider-thumb:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }

                .modern-slider::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                .modern-slider::-moz-range-thumb:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: scale(1.1);
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                }

                .slider-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 12px;
                    color: #64748b;
                    margin-bottom: 8px;
                }

                .slider-value {
                    text-align: center;
                    font-size: 14px;
                    padding: 8px 12px;
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    border-radius: 8px;
                    color: #1e293b;
                    font-weight: 500;
                    border: 1px solid #e2e8f0;
                }

                /* Objects Info */
                .objects-info {
                    padding: 40px 24px;
                    text-align: center;
                    color: #64748b;
                    font-size: 14px;
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border-radius: 12px;
                    margin: 20px;
                    border: 1px solid #e2e8f0;
                }

                /* Scrollbar */
                .modern-panel__content::-webkit-scrollbar {
                    width: 4px;
                }

                .modern-panel__content::-webkit-scrollbar-track {
                    background: transparent;
                }

                .modern-panel__content::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.3);
                    border-radius: 2px;
                }

                .modern-panel__content::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.5);
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .side-panel-icons {
                        left: 15px;
                        top: 90px;
                    }
                    
                    .side-panel-icon {
                        width: 48px;
                        height: 48px;
                    }
                    
                    .modern-panel {
                        left: 75px;
                        width: calc(100vw - 200px);
                        // max-height: 70vh;
                        top: 90px;
                        bottom: auto;
                        z-index: 1001;
                    }
                    
                    .material-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `}</style>
        </div>
    );
};
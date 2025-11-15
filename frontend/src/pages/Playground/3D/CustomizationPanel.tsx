import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Pencil, Info, BarChart3, Home, Grid3X3 } from 'lucide-react';
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

interface FloorPlanData {
    room_count: number;
    total_area: number;
    room_types: string[];
    rooms: Room[];
}

interface CustomizationPanelProps {
    onClose: () => void;
    scene?: THREE.Scene;
    renderer?: THREE.WebGLRenderer;
    floorPlanData?: FloorPlanData;
    camera?: THREE.PerspectiveCamera;
    onOverlaySettingsChange?: (settings: OverlaySettings) => void;
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

// Collapsible Section Component
function CollapsibleSection({
    title,
    children,
    defaultExpanded = true,
    icon
}: {
    title: string,
    children: React.ReactNode,
    defaultExpanded?: boolean,
    icon?: React.ReactNode
}) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="collapsible-section">
            <button
                className="collapsible-section__header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="collapsible-section__title-group">
                    {icon && <span className="collapsible-section__icon">{icon}</span>}
                    <span className="collapsible-section__title">{title}</span>
                </div>
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

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
    onClose,
    scene,
    renderer,
    floorPlanData,
    camera,
    onOverlaySettingsChange
}) => {
    const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
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
        overlaySize: 'medium'
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

    // Calculate room statistics
    const roomStats = floorPlanData ? {
        totalArea: floorPlanData.total_area,
        roomCount: floorPlanData.room_count,
        roomTypes: floorPlanData.room_types,
        rooms: floorPlanData.rooms.filter(room => room.room_type !== 'Wall'),
        largestRoom: floorPlanData.rooms.reduce((largest, room) =>
            room.area > largest.area ? room : largest,
            { area: 0, room_type: '', width: 0, height: 0 }
        ),
        smallestRoom: floorPlanData.rooms.filter(room => room.room_type !== 'Wall').reduce((smallest, room) =>
            room.area < smallest.area ? room : smallest,
            { area: Infinity, room_type: '', width: 0, height: 0 }
        )
    } : null;

    const updateOverlaySetting = <K extends keyof OverlaySettings>(
        key: K,
        value: OverlaySettings[K]
    ) => {
        const newSettings = { ...overlaySettings, [key]: value };
        setOverlaySettings(newSettings);
        onOverlaySettingsChange?.(newSettings);
    };

    // Calculate plot dimensions
    const plotDimensions = floorPlanData ? (() => {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

        floorPlanData.rooms.forEach(room => {
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
    })() : null;

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
                    <Pencil size={20} className="modern-panel__header-icon" />
                    <h2 className="modern-panel__title">Customization</h2>
                </div>
                <button onClick={onClose} className="modern-panel__close">
                    ×
                </button>
            </div>

            <div className="modern-panel__content">
                {floorPlanData && (
                    <CollapsibleSection
                        title="3D Information Overlays"
                        defaultExpanded={false}
                        icon={<Grid3X3 size={16} />}
                    >
                        <div className="section-group">
                            {/* Master Toggle */}
                            <div className="master-toggle">
                                <label className="modern-checkbox large">
                                    <input
                                        type="checkbox"
                                        checked={overlaySettings.showOverlays}
                                        onChange={(e) => updateOverlaySetting('showOverlays', e.target.checked)}
                                    />
                                    <span className="modern-checkbox__checkmark"></span>
                                    <span className="modern-checkbox__label">Enable 3D Information Overlays</span>
                                </label>
                            </div>

                            {overlaySettings.showOverlays && (
                                <>
                                    {/* Display Options */}
                                    <h4 className="section-subtitle">What to Display</h4>
                                    <div className="overlay-toggles">
                                        <label className="modern-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={overlaySettings.showRoomLabels}
                                                onChange={(e) => updateOverlaySetting('showRoomLabels', e.target.checked)}
                                            />
                                            <span className="modern-checkbox__checkmark"></span>
                                            <span className="modern-checkbox__label">Room Names</span>
                                        </label>

                                        <label className="modern-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={overlaySettings.showRoomAreas}
                                                onChange={(e) => updateOverlaySetting('showRoomAreas', e.target.checked)}
                                            />
                                            <span className="modern-checkbox__checkmark"></span>
                                            <span className="modern-checkbox__label">Room Areas</span>
                                        </label>

                                        <label className="modern-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={overlaySettings.showDimensions}
                                                onChange={(e) => updateOverlaySetting('showDimensions', e.target.checked)}
                                            />
                                            <span className="modern-checkbox__checkmark"></span>
                                            <span className="modern-checkbox__label">Room Dimensions</span>
                                        </label>

                                        <label className="modern-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={overlaySettings.showPlotDimensions}
                                                onChange={(e) => updateOverlaySetting('showPlotDimensions', e.target.checked)}
                                            />
                                            <span className="modern-checkbox__checkmark"></span>
                                            <span className="modern-checkbox__label">Plot Dimensions</span>
                                        </label>

                                        <label className="modern-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={overlaySettings.showTotalArea}
                                                onChange={(e) => updateOverlaySetting('showTotalArea', e.target.checked)}
                                            />
                                            <span className="modern-checkbox__checkmark"></span>
                                            <span className="modern-checkbox__label">Total Plot Area</span>
                                        </label>

                                        <label className="modern-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={overlaySettings.showRoomCount}
                                                onChange={(e) => updateOverlaySetting('showRoomCount', e.target.checked)}
                                            />
                                            <span className="modern-checkbox__checkmark"></span>
                                            <span className="modern-checkbox__label">Room Count</span>
                                        </label>
                                    </div>

                                    {/* Overlay Appearance */}
                                    <h4 className="section-subtitle">Overlay Appearance</h4>

                                    {/* Size Control */}
                                    <div className="control-group">
                                        <label className="control-label">Overlay Size</label>
                                        <div className="size-buttons">
                                            {(['small', 'medium', 'large'] as const).map(size => (
                                                <button
                                                    key={size}
                                                    className={`size-btn ${overlaySettings.overlaySize === size ? 'active' : ''}`}
                                                    onClick={() => updateOverlaySetting('overlaySize', size)}
                                                >
                                                    {size.charAt(0).toUpperCase() + size.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Opacity Control */}
                                    <div className="control-group">
                                        <label className="control-label">Overlay Opacity</label>
                                        <div className="slider-container">
                                            <input
                                                type="range"
                                                min="0.3"
                                                max="1"
                                                step="0.1"
                                                value={overlaySettings.overlayOpacity}
                                                onChange={(e) => updateOverlaySetting('overlayOpacity', parseFloat(e.target.value))}
                                                className="modern-slider"
                                            />
                                            <span className="slider-value">
                                                {Math.round(overlaySettings.overlayOpacity * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {/* Floor Plan Statistics Section */}
                {floorPlanData && (
                    <CollapsibleSection
                        title="Statistics"
                        defaultExpanded={false}
                        icon={<BarChart3 size={16} />}
                    >
                        <div className="section-group">
                            {roomStats && (
                                <div className="statistics-grid">
                                    <div className="stat-card">
                                        <div className="stat-number">{roomStats.totalArea.toFixed(1)}</div>
                                        <div className="stat-label">Total Area (m²)</div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-number">{roomStats.roomCount}</div>
                                        <div className="stat-label">Total Rooms</div>
                                    </div>

                                    <div className="stat-card">
                                        <div className="stat-number">{roomStats.roomTypes.length}</div>
                                        <div className="stat-label">Room Types</div>
                                    </div>

                                    {roomStats.largestRoom.area > 0 && (
                                        <div className="stat-card">
                                            <div className="stat-number">{roomStats.largestRoom.area.toFixed(1)}</div>
                                            <div className="stat-label">Largest Room (m²)</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}
            </div>

            {/* Styles */}
            <style>{`
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

                .collapsible-section__title-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .collapsible-section__icon {
                    color: #3b82f6;
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

                .info-subtitle {
                    font-size: 13px;
                    font-weight: 600;
                    color: #475569;
                    margin: 16px 0 12px 0;
                    letter-spacing: -0.025em;
                }

                /* Info toggles */
                .info-toggles {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                /* Statistics grid */
                .statistics-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }

                .stat-card {
                    background: #f8fafc;
                    border-radius: 12px;
                    padding: 16px;
                    text-align: center;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s ease;
                }

                .stat-card:hover {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    transform: translateY(-2px);
                }

                .stat-number {
                    font-size: 24px;
                    font-weight: 700;
                    color: #1e293b;
                    margin-bottom: 4px;
                }

                .stat-label {
                    font-size: 11px;
                    color: #64748b;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                
                .selected-indicator {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 20px;
                    height: 20px;
                    background: #10b981;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 12px;
                    font-weight: bold;
                }

                .loading-indicator {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px;
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    border-radius: 10px;
                    margin-bottom: 16px;
                }

                .spinner {
                    width: 20px;
                    height: 20px;
                    border: 2px solid #e2e8f0;
                    border-top: 2px solid #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .intensity-control, .background-mode-control {
                    margin-top: 20px;
                }

                .control-label {
                    display: block;
                    font-size: 12px;
                    color: #64748b;
                    margin-bottom: 8px;
                    font-weight: 500;
                }

                .slider-container {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .modern-slider {
                    flex: 1;
                    height: 6px;
                    border-radius: 3px;
                    background: #e2e8f0;
                    outline: none;
                    transition: background 0.2s ease;
                    -webkit-appearance: none;
                    appearance: none;
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

                .slider-value {
                    min-width: 50px;
                    text-align: center;
                    font-size: 12px;
                    padding: 6px 10px;
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    border-radius: 6px;
                    color: #1e293b;
                    font-weight: 500;
                    border: 1px solid #e2e8f0;
                }

                .toggle-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }

                .toggle-btn {
                    flex: 1;
                    padding: 10px 16px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    background: #ffffff;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    color: #374151;
                    transition: all 0.2s ease;
                    text-align: center;
                }

                .toggle-btn:hover {
                    border-color: #3b82f6;
                    background: #eff6ff;
                    color: #1e40af;
                }

                .toggle-btn.active {
                    border-color: #3b82f6;
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                .modern-checkbox {
                    display: flex;
                    align-items: center;
                    cursor: pointer;
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

                /* Responsive Design */
                @media (max-width: 768px) {
                    .statistics-grid {
                        grid-template-columns: 1fr;
                    }
                }

                /* 3D Overlay Styles */
                .master-toggle {
                    margin-bottom: 20px;
                    padding: 16px;
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                    border-radius: 12px;
                    border: 1px solid #3b82f6;
                }

                .modern-checkbox.large .modern-checkbox__label {
                    font-size: 16px;
                    font-weight: 600;
                    color: #1e40af;
                }

                .overlay-toggles {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .control-group {
                    margin-bottom: 20px;
                }

                .size-buttons {
                    display: flex;
                    gap: 8px;
                    margin-top: 8px;
                }

                .size-btn {
                    flex: 1;
                    padding: 8px 12px;
                    border: 2px solid #e2e8f0;
                    border-radius: 8px;
                    background: #ffffff;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 500;
                    color: #374151;
                    transition: all 0.2s ease;
                    text-align: center;
                }

                .size-btn:hover {
                    border-color: #3b82f6;
                    background: #eff6ff;
                    color: #1e40af;
                }

                .size-btn.active {
                    border-color: #3b82f6;
                    background: #3b82f6;
                    color: white;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                @media (max-width: 768px) {
                    .overlay-toggles {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};
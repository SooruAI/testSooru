import React, { useEffect, useRef, useState } from 'react';
import './View3DPanel.css';
import {
    Box,
    Slider,
    Typography,
    FormControlLabel,
    Switch,
    Paper,
    Button,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface View3DPanelProps {
    onClose: () => void;
    onZoomChange: (value: number) => void;
    onColorChange: (component: string, color: string) => void;
    onToggleRoof: (visible: boolean) => void;
    cameraMode: string;
}

interface ColorOption {
    name: string;
    key: string;
    defaultColor: string;
}

const View3DPanel: React.FC<View3DPanelProps> = ({
    onClose,
    onZoomChange,
    onColorChange,
    onToggleRoof,
    cameraMode
}) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const [showRoof, setShowRoof] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(50);
    const [colorOptions, setColorOptions] = useState<{ [key: string]: string }>({
        walls: "#e9e4d6",
        outerWalls: "#ddd6c4",
        roof: "#eaeaea",
        floor: "#eaeaea"
    });

    // Block events from propagating to the 3D canvas
    const blockAllEvents = (e: React.MouseEvent | React.WheelEvent) => {
        e.stopPropagation();
    };

    const blockWheelEvents = (e: React.WheelEvent) => {
        e.stopPropagation();
        e.preventDefault();
    };

    // Set up event listeners to prevent events from affecting the 3D view
    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;

        const handleWheel = (e: WheelEvent) => {
            e.stopPropagation();
            e.preventDefault();
        };

        panel.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            panel.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Effect to toggle roof based on camera mode
    useEffect(() => {
        if (cameraMode === "orbit") {
            setShowRoof(false);
            onToggleRoof(false);
        } else if (cameraMode === "person") {
            setShowRoof(true);
            onToggleRoof(true);
        }
    }, [cameraMode, onToggleRoof]);

    // Handle zoom level change
    const handleZoomChange = (event: Event, newValue: number | number[]) => {
        const value = newValue as number;
        setZoomLevel(value);
        onZoomChange(value);
    };

    // Handle color change
    const handleColorChange = (component: string, color: string) => {
        setColorOptions(prev => ({
            ...prev,
            [component]: color
        }));
        onColorChange(component, color);
    };

    // Handle roof visibility toggle
    const handleRoofToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        const visible = event.target.checked;
        setShowRoof(visible);
        onToggleRoof(visible);
    };

    // Reset all options to defaults
    const handleReset = (e: React.MouseEvent) => {
        blockAllEvents(e);
        setZoomLevel(65);
        setShowRoof(cameraMode === "person");
        setColorOptions({
            walls: "#e9e4d6",
            outerWalls: "#ddd6c4",
            roof: "#eaeaea",
            floor: "#eaeaea"
        });
        onZoomChange(65);
        onToggleRoof(cameraMode === "person");
        onColorChange("walls", "#e9e4d6");
        onColorChange("outerWalls", "#ddd6c4");
        onColorChange("roof", "#eaeaea");
        onColorChange("floor", "#eaeaea");
    };

    const colorSections: ColorOption[] = [
        { name: "Inner Walls", key: "outerWalls", defaultColor: "#43e66f" },
        { name: "Outer Walls", key: "walls", defaultColor: "#5c8a68" },
        { name: "Roof", key: "roof", defaultColor: "#03a9fc" },
        { name: "Floor", key: "floor", defaultColor: "#945922" }
    ];

    return (
        <div
            ref={panelRef}
            className="view3d-panel"
            onMouseDown={blockAllEvents}
            onMouseMove={blockAllEvents}
            onMouseUp={blockAllEvents}
            onClick={blockAllEvents}
            onDoubleClick={blockAllEvents}
            onWheel={blockWheelEvents}
            style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
            }}
        >
            <div className="panel-header">
                <h2>3D Visualization</h2>
                <IconButton
                    className="close-panel"
                    onClick={(e) => {
                        blockAllEvents(e);
                        onClose();
                    }}
                    size="small"
                >
                    <CloseIcon />
                </IconButton>
            </div>

            <div className="panel-content">
                {/* Zoom Level Section */}
                <div className="options-section">
                    <Typography variant="h6" gutterBottom>
                        Zoom Level
                    </Typography>
                    <Box sx={{ width: '100%' }}>
                        <Slider
                            value={zoomLevel}
                            onChange={handleZoomChange}
                            min={10}
                            max={100}
                            step={1}
                            aria-labelledby="zoom-slider"
                            valueLabelDisplay="auto"
                            onWheel={blockWheelEvents}
                        />
                    </Box>
                </div>

                {/* Colors Section */}
                <div className="options-section">
                    <Typography variant="h6" gutterBottom>
                        Colors
                    </Typography>

                    {colorSections.map((option) => (
                        <div className="color-option" key={option.key}>
                            <Typography variant="body2">{option.name}</Typography>
                            <div className="color-picker-container">
                                <input
                                    type="color"
                                    value={colorOptions[option.key]}
                                    onChange={(e) => handleColorChange(option.key, e.target.value)}
                                />
                                <div
                                    className="color-preview"
                                    style={{ backgroundColor: colorOptions[option.key] }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Toggle Options Section */}
                <div className="options-section">
                    <Typography variant="h6" gutterBottom>
                        Display Options
                    </Typography>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={showRoof}
                                onChange={handleRoofToggle}
                                disabled={cameraMode === "orbit"} // Disable in orbit mode
                            />
                        }
                        label="Show Roof"
                    />
                </div>

                <div className="options-actions">
                    <Button
                        variant="outlined"
                        className="reset-button"
                        onClick={handleReset}
                    >
                        Reset to Defaults
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default View3DPanel;
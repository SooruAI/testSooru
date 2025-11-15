import React, { useState, useEffect } from 'react';
import {
    Move,
    RotateCw,
    Trash2,
    Copy,
    Check,
    X,
    RotateCcw,
    Scale,
    Info,
    Lock,
    Unlock
} from 'lucide-react';
import { Object3DData } from './Object3DManager';
import './ObjectControlPanel.css';

interface ObjectControlPanelProps {
    selectedObject: Object3DData | null;
    onModeChange: (mode: 'move' | 'rotate' | 'scale' | 'info' | null) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onSave: () => void;
    onDiscard: () => void;
    onRotate: (angle: number) => void;
    onScale: (scale: number) => void;
    currentMode: 'move' | 'rotate' | 'scale' | 'info' | null;
    hasChanges: boolean;
    isLocked: boolean;
    onToggleLock: () => void;
}

const ObjectControlPanel: React.FC<ObjectControlPanelProps> = ({
    selectedObject,
    onModeChange,
    onDelete,
    onDuplicate,
    onSave,
    onDiscard,
    onRotate,
    onScale,
    currentMode,
    hasChanges,
    isLocked,
    onToggleLock
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [rotationValue, setRotationValue] = useState(0);
    const [scaleValue, setScaleValue] = useState(1);

    useEffect(() => {
        if (selectedObject) {
            setIsVisible(true);
            // Initialize values from selected object
            setRotationValue(selectedObject.rotation.y * (180 / Math.PI));
            setScaleValue(selectedObject.scale.x); // Assume uniform scaling
        } else {
            const timer = setTimeout(() => setIsVisible(false), 100);
            return () => clearTimeout(timer);
        }
    }, [selectedObject]);

    if (!selectedObject) return null;

    const tools = [
        {
            id: 'move',
            icon: Move,
            label: 'Move',
            description: 'Drag to move object'
        },
        {
            id: 'rotate',
            icon: RotateCw,
            label: 'Rotate',
            description: 'Rotate object'
        },
        {
            id: 'scale',
            icon: Scale,
            label: 'Scale',
            description: 'Resize object'
        },
        {
            id: 'info',
            icon: Info,
            label: 'Info',
            description: 'Object details'
        }
    ];

    const handleRotationChange = (value: number) => {
        setRotationValue(value);
        onRotate(value * (Math.PI / 180)); // Convert to radians
    };

    const handleScaleChange = (value: number) => {
        setScaleValue(value);
        onScale(value);
    };

    const handleQuickRotation = (degrees: number) => {
        const newRotation = (rotationValue + degrees) % 360;
        handleRotationChange(newRotation);
    };

    return (
        <div className={`object-control-panel ${isVisible ? 'visible' : ''} ${isLocked ? 'locked' : ''}`}>
            <div className="object-control-panel__container">
                {/* Lock Button */}
                <button
                    className={`object-control-panel__lock ${isLocked ? 'locked' : ''}`}
                    onClick={onToggleLock}
                    title={isLocked ? 'Unlock panel (allows camera movement)' : 'Lock panel (prevents accidental closing)'}
                >
                    {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                </button>

                {/* Object Info */}
                <div className="object-control-panel__info">
                    <img
                        src={selectedObject.imagePath}
                        alt={selectedObject.name}
                        className="object-control-panel__thumbnail"
                    />
                    <div className="object-control-panel__details">
                        <h4 className="object-control-panel__name">{selectedObject.name}</h4>
                        <p className="object-control-panel__description">
                            {selectedObject.description.length > 40
                                ? `${selectedObject.description.substring(0, 40)}...`
                                : selectedObject.description
                            }
                        </p>
                    </div>
                </div>

                {/* Tool Buttons */}
                <div className="object-control-panel__tools">
                    {tools.map((tool) => {
                        const IconComponent = tool.icon;
                        const isActive = currentMode === tool.id;

                        return (
                            <button
                                key={tool.id}
                                className={`object-control-panel__tool ${isActive ? 'active' : ''}`}
                                onClick={() => onModeChange(isActive ? null : tool.id as any)}
                                title={tool.description}
                            >
                                <IconComponent size={18} />
                                <span className="object-control-panel__tool-label">{tool.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Precise Controls */}
                {(currentMode === 'rotate' || currentMode === 'scale') && (
                    <>
                        <div className="object-control-panel__separator"></div>
                        <div className="object-control-panel__precise-controls">

                            {/* Rotation Controls */}
                            {currentMode === 'rotate' && (
                                <div className="object-control-panel__control-group">
                                    <label className="object-control-panel__label">
                                        Rotation: {rotationValue.toFixed(0)}°
                                    </label>
                                    <div className="object-control-panel__rotation-section">
                                        <div className="object-control-panel__quick-buttons">
                                            <button
                                                className="object-control-panel__quick-btn"
                                                onClick={() => handleQuickRotation(-90)}
                                                title="Rotate 90° left"
                                            >
                                                <RotateCcw size={14} />
                                                90°
                                            </button>
                                            <button
                                                className="object-control-panel__quick-btn"
                                                onClick={() => handleQuickRotation(-45)}
                                                title="Rotate 45° left"
                                            >
                                                <RotateCcw size={14} />
                                                45°
                                            </button>
                                            <button
                                                className="object-control-panel__quick-btn"
                                                onClick={() => handleQuickRotation(45)}
                                                title="Rotate 45° right"
                                            >
                                                45°
                                                <RotateCw size={14} />
                                            </button>
                                            <button
                                                className="object-control-panel__quick-btn"
                                                onClick={() => handleQuickRotation(90)}
                                                title="Rotate 90° right"
                                            >
                                                90°
                                                <RotateCw size={14} />
                                            </button>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="360"
                                            step="1"
                                            value={rotationValue}
                                            onChange={(e) => handleRotationChange(Number(e.target.value))}
                                            className="object-control-panel__slider"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Scale Controls */}
                            {currentMode === 'scale' && (
                                <div className="object-control-panel__control-group">
                                    <label className="object-control-panel__label">
                                        Scale: {(scaleValue * 100).toFixed(0)}%
                                    </label>
                                    <div className="object-control-panel__scale-section">
                                        <div className="object-control-panel__quick-buttons">
                                            <button
                                                className="object-control-panel__quick-btn"
                                                onClick={() => handleScaleChange(0.5)}
                                                title="50% size"
                                            >
                                                50%
                                            </button>
                                            <button
                                                className="object-control-panel__quick-btn"
                                                onClick={() => handleScaleChange(0.75)}
                                                title="75% size"
                                            >
                                                75%
                                            </button>
                                            <button
                                                className="object-control-panel__quick-btn"
                                                onClick={() => handleScaleChange(1.0)}
                                                title="Original size"
                                            >
                                                100%
                                            </button>
                                            <button
                                                className="object-control-panel__quick-btn"
                                                onClick={() => handleScaleChange(1.5)}
                                                title="150% size"
                                            >
                                                150%
                                            </button>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="3.0"
                                            step="0.05"
                                            value={scaleValue}
                                            onChange={(e) => handleScaleChange(Number(e.target.value))}
                                            className="object-control-panel__slider"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Separator */}
                <div className="object-control-panel__separator"></div>

                {/* Action Buttons */}
                <div className="object-control-panel__actions">
                    <button
                        className="object-control-panel__action action-duplicate"
                        onClick={onDuplicate}
                        title="Duplicate object"
                    >
                        <Copy size={18} />
                        <span className="object-control-panel__action-label">Copy</span>
                    </button>
                    <button
                        className="object-control-panel__action action-delete"
                        onClick={onDelete}
                        title="Delete object"
                    >
                        <Trash2 size={18} />
                        <span className="object-control-panel__action-label">Delete</span>
                    </button>
                </div>

                {/* Save/Discard Controls */}
                {hasChanges && (
                    <>
                        <div className="object-control-panel__separator"></div>
                        <div className="object-control-panel__save-controls">
                            <button
                                className="object-control-panel__save-btn"
                                onClick={onSave}
                                title="Save changes"
                            >
                                <Check size={18} />
                                <span>Save</span>
                            </button>
                            <button
                                className="object-control-panel__discard-btn"
                                onClick={onDiscard}
                                title="Discard changes"
                            >
                                <X size={18} />
                                <span>Cancel</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ObjectControlPanel;

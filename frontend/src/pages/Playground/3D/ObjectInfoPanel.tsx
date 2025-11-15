import React from 'react';
import { Object3DData } from './Object3DManager';

interface ObjectInfoPanelProps {
    selectedObject: Object3DData | null;
    onClose: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    cameraMode: string;
}

const ObjectInfoPanel: React.FC<ObjectInfoPanelProps> = ({
    selectedObject,
    onClose,
    onDelete,
    onDuplicate,
    cameraMode
}) => {
    if (!selectedObject) return null;

    return (
        <div className="object-info-panel">
            <div className="object-info-panel__header">
                <h3 className="object-info-panel__title">Object Information</h3>
                <button
                    onClick={onClose}
                    className="object-info-panel__close-btn"
                >
                    ×
                </button>
            </div>

            <div className="object-info-panel__content">
                <div className="object-info-panel__image-container">
                    <img
                        src={selectedObject.imagePath}
                        alt={selectedObject.name}
                        className="object-info-panel__image"
                    />
                </div>

                <div className="object-info-panel__details">
                    <h4 className="object-info-panel__name">{selectedObject.name}</h4>
                    
                    <p className="object-info-panel__description">
                        {selectedObject.description}
                    </p>

                    <div className="object-info-panel__metadata">
                        <div className="object-info-panel__metadata-item">
                            <strong>Author:</strong> {selectedObject.author}
                        </div>
                        <div className="object-info-panel__metadata-item">
                            <strong>License:</strong> {selectedObject.license}
                        </div>
                        <div className="object-info-panel__metadata-item">
                            <strong>Position:</strong> 
                            <span className="object-info-panel__position">
                                X: {selectedObject.position.x.toFixed(1)}, 
                                Y: {selectedObject.position.y.toFixed(1)}, 
                                Z: {selectedObject.position.z.toFixed(1)}
                            </span>
                        </div>
                    </div>

                    {cameraMode === 'orbit' && (
                        <div className="object-info-panel__actions">
                            <button
                                onClick={onDuplicate}
                                className="object-info-panel__action-btn object-info-panel__action-btn--duplicate"
                            >
                                📋 Duplicate
                            </button>
                            <button
                                onClick={onDelete}
                                className="object-info-panel__action-btn object-info-panel__action-btn--delete"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    )}

                    {cameraMode === 'person' && (
                        <div className="object-info-panel__note">
                            Switch to Orbit mode to move or modify objects
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ObjectInfoPanel;
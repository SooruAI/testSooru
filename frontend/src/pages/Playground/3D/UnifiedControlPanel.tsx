import React from 'react';
import { Eye } from 'lucide-react';

interface UnifiedControlPanelProps {
    // Navigation
    navigate: (path: string) => void;

    // Wall rendering controls
    wallRenderingMode: 'solid' | 'transparent';
    wallTransparency: number;
    onWallRenderingChange: (mode: 'solid' | 'transparent', transparency: number) => void;

    // Share component
    ShareButtonComponent: React.ComponentType<any>;
    shareProps: {
        onExport: (format: string) => Promise<void>;
        onShare: (method: string) => Promise<void>;
        scene?: any;
        camera?: any;
        renderer?: any;
        isExporting?: boolean;
        exportProgress?: any;
    };
    // Project and plan IDs
    projectId?: string;
    planId?: string;
    viewOnly?: boolean;
}

const UnifiedControlPanel: React.FC<UnifiedControlPanelProps> = ({
    navigate,
    wallRenderingMode,
    wallTransparency,
    onWallRenderingChange,
    ShareButtonComponent,
    shareProps,
    projectId,
    planId,
    viewOnly = false,
}) => {
    return (
        <div className="unified-control-panel">
            {/* Top Row - 2D and Share Buttons */}
            <div className="control-row">
                <div
                  className="two-d-toggle"
                  onClick={() => {
                  const path = viewOnly ? `/view/playground/${projectId}/${planId}` : `/playground/${projectId}/${planId}`;
                  navigate(path);
                }}
                  style={{ fontWeight: 'bold', color: 'black' }}
                >
                  2D
                </div>

                <div className="share-button-wrapper">
                    <ShareButtonComponent {...shareProps} />
                </div>
            </div>

            {/* Bottom Section - Wall Rendering Controls */}
            {/* <div className="wall-section">
                <button
                    className={`xray-toggle-btn ${wallRenderingMode === 'transparent' ? 'active' : ''}`}
                    onClick={() => onWallRenderingChange(
                        wallRenderingMode === 'solid' ? 'transparent' : 'solid',
                        wallTransparency
                    )}
                >
                    <Eye size={16} className="wall-icon" />
                    <span className="wall-label">
                        {wallRenderingMode === 'solid' ? 'Solid' : 'X-Ray'}
                    </span>
                </button>

                {wallRenderingMode === 'transparent' && (
                    <div className="transparency-controls">
                        <input
                            type="range"
                            min="0.1"
                            max="0.9"
                            step="0.1"
                            value={wallTransparency}
                            onChange={(e) =>
                                onWallRenderingChange('transparent', parseFloat(e.target.value))
                            }
                            className="transparency-slider"
                        />
                        <span className="transparency-value">
                            {Math.round(wallTransparency * 100)}%
                        </span>
                    </div>
                )}
            </div> */}
        </div>
    );
};

export default UnifiedControlPanel;

// CSS Styles
const styles = `
.unified-control-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
  width: 128px; /* Fixed width to prevent shifting */
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 2D Toggle Button (square like ShareButton) */
.two-d-toggle {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(224, 231, 255, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
}

.two-d-toggle::before {
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

.two-d-toggle:hover {
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-color: #3b82f6;
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}

.two-d-toggle:hover::before {
  opacity: 1;
}

.two-d-toggle:active {
  transform: translateY(-1px) scale(0.98);
}

/* Share button wrapper - no custom styling, let ShareButton use its own CSS */
.share-button-wrapper {
  display: flex;
}

/* Wall section container */
.wall-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* X-Ray toggle button */
.xray-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  border: 1px solid #ccc;
  background-color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #333;
  min-height: 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%; /* Full width of container */
}

.xray-toggle-btn:hover {
  background-color: #f5f5f5;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Blue highlight when in X-Ray mode */
.xray-toggle-btn.active {
  background-color: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.xray-toggle-btn.active:hover {
  background-color: #2563eb;
}

.xray-toggle-btn.active .wall-icon {
  color: white;
}

.wall-icon {
  color: #6b7280;
}

.wall-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* Transparency Controls (now below the button) */
.transparency-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%; /* Full width of container */
  box-sizing: border-box;
}

.transparency-slider {
  width: 80px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.transparency-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}

.transparency-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

.transparency-value {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  min-width: 32px;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .unified-control-panel {
    top: 25px;
    right: 10px;
  }
  
  .two-d-toggle {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .share-button-wrapper > * {
    /* Let ShareButton handle its own responsive styling */
  }
  
  .wall-rendering-toggle {
    padding: 6px 10px;
  }
  
  .transparency-slider {
    width: 60px;
  }
  
  .xray-toggle-btn {
    padding: 8px 12px;
    min-width: 50px;
    min-height: 36px;
  }
  
  .transparency-controls {
    padding: 6px 10px;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
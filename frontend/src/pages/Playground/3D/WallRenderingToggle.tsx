import React, { useState } from 'react';
import { Eye, EyeOff, Layers } from 'lucide-react';

interface WallRenderingToggleProps {
    onModeChange: (mode: 'solid' | 'transparent', transparency: number) => void;
    currentMode?: 'solid' | 'transparent';
    currentTransparency?: number;
}

const WallRenderingToggle: React.FC<WallRenderingToggleProps> = ({
    onModeChange,
    currentMode = 'solid',
    currentTransparency = 0.3
}) => {
    const [mode, setMode] = useState<'solid' | 'transparent'>(currentMode);
    const [transparency, setTransparency] = useState(currentTransparency);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleModeToggle = () => {
        const newMode = mode === 'solid' ? 'transparent' : 'solid';
        console.log(`Wall rendering mode changing from ${mode} to ${newMode}`);
        setMode(newMode);
        onModeChange(newMode, transparency);
    };

    const handleTransparencyChange = (value: number) => {
        console.log(`Transparency changing to ${value}`);
        setTransparency(value);
        onModeChange(mode, value);
    };

    return (
        <div className="wall-rendering-toggle">
            {/* Main Toggle Button */}
            <button
                className={`toggle-button ${mode === 'transparent' ? 'active' : ''}`}
                onClick={handleModeToggle}
                title={mode === 'solid' ? 'Switch to X-Ray Mode' : 'Switch to Solid Mode'}
            >
                <div className="toggle-icon">
                    {mode === 'solid' ? <Eye size={20} /> : <EyeOff size={20} />}
                </div>
                <span className="toggle-label">
                    {mode === 'solid' ? 'Solid' : 'X-Ray'}
                </span>
            </button>

            {/* Transparency Control (only show when in transparent mode) */}
            {mode === 'transparent' && (
                <div className="transparency-control">
                    <button
                        className="expand-button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        title="Adjust transparency"
                    >
                        <Layers size={16} />
                    </button>
                    
                    {isExpanded && (
                        <div className="transparency-slider">
                            <label>Transparency</label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.1"
                                value={transparency}
                                onChange={(e) => handleTransparencyChange(parseFloat(e.target.value))}
                            />
                            <span className="transparency-value">
                                {Math.round((1 - transparency) * 100)}%
                            </span>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .wall-rendering-toggle {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .toggle-button {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(224, 231, 255, 0.8);
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    color: #64748b;
                    font-size: 14px;
                    font-weight: 500;
                    min-width: 100px;
                }

                .toggle-button:hover {
                    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
                    border-color: #3b82f6;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
                    color: #3b82f6;
                }

                .toggle-button.active {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    border-color: #2563eb;
                    color: white;
                    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
                }

                .toggle-button.active:hover {
                    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                    transform: translateY(-2px) scale(1.02);
                }

                .toggle-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .toggle-label {
                    font-weight: 600;
                    letter-spacing: -0.025em;
                }

                .transparency-control {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .expand-button {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    background: rgba(255, 255, 255, 0.9);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #3b82f6;
                }

                .expand-button:hover {
                    background: #3b82f6;
                    color: white;
                    transform: scale(1.05);
                }

                .transparency-slider {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.95);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                    animation: slideIn 0.2s ease-out;
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .transparency-slider label {
                    font-size: 12px;
                    color: #64748b;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .transparency-slider input[type="range"] {
                    width: 80px;
                    height: 4px;
                    border-radius: 2px;
                    background: #e2e8f0;
                    outline: none;
                    -webkit-appearance: none;
                    appearance: none;
                }

                .transparency-slider input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
                }

                .transparency-slider input[type="range"]::-webkit-slider-thumb:hover {
                    background: #2563eb;
                    transform: scale(1.1);
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
                }

                .transparency-slider input[type="range"]::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #3b82f6;
                    cursor: pointer;
                    border: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
                }

                .transparency-slider input[type="range"]::-moz-range-thumb:hover {
                    background: #2563eb;
                    transform: scale(1.1);
                    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
                }

                .transparency-value {
                    font-size: 11px;
                    color: #3b82f6;
                    font-weight: 600;
                    min-width: 30px;
                    text-align: center;
                }

                /* Mobile responsiveness */
                @media (max-width: 768px) {
                    .wall-rendering-toggle {
                        top: 70px;
                        right: 15px;
                    }

                    .toggle-button {
                        padding: 8px 12px;
                        font-size: 13px;
                        min-width: 85px;
                    }

                    .transparency-slider {
                        padding: 6px 10px;
                    }

                    .transparency-slider input[type="range"] {
                        width: 60px;
                    }
                }
            `}</style>
        </div>
    );
};

export default WallRenderingToggle;
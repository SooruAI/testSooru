import React, { useEffect, useRef } from 'react';
import './GameControls.css';

interface GameControlsProps {
    visible: boolean;
    onMovement: (direction: 'forward' | 'backward' | 'left' | 'right', active: boolean) => void;
}

const GameControls: React.FC<GameControlsProps> = ({ visible, onMovement }) => {
    const activeDirections = useRef<Set<string>>(new Set());

    // Handle touch events for mobile controls
    const handleTouchStart = (direction: 'forward' | 'backward' | 'left' | 'right') => {
        if (!activeDirections.current.has(direction)) {
            activeDirections.current.add(direction);
            onMovement(direction, true);
        }
    };

    const handleTouchEnd = (direction: 'forward' | 'backward' | 'left' | 'right') => {
        if (activeDirections.current.has(direction)) {
            activeDirections.current.delete(direction);
            onMovement(direction, false);
        }
    };

    // Handle mouse events for desktop controls
    const handleMouseDown = (direction: 'forward' | 'backward' | 'left' | 'right') => {
        if (!activeDirections.current.has(direction)) {
            activeDirections.current.add(direction);
            onMovement(direction, true);
        }
    };

    const handleMouseUp = (direction: 'forward' | 'backward' | 'left' | 'right') => {
        if (activeDirections.current.has(direction)) {
            activeDirections.current.delete(direction);
            onMovement(direction, false);
        }
    };

    // Clear all active directions when component unmounts or becomes invisible
    useEffect(() => {
        if (!visible) {
            activeDirections.current.forEach(direction => {
                onMovement(direction as any, false);
            });
            activeDirections.current.clear();
        }
    }, [visible, onMovement]);

    // Handle global mouse up to prevent stuck controls
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            activeDirections.current.forEach(direction => {
                onMovement(direction as any, false);
            });
            activeDirections.current.clear();
        };

        const handleGlobalTouchEnd = () => {
            activeDirections.current.forEach(direction => {
                onMovement(direction as any, false);
            });
            activeDirections.current.clear();
        };

        document.addEventListener('mouseup', handleGlobalMouseUp);
        document.addEventListener('touchend', handleGlobalTouchEnd);
        document.addEventListener('touchcancel', handleGlobalTouchEnd);

        return () => {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.removeEventListener('touchend', handleGlobalTouchEnd);
            document.removeEventListener('touchcancel', handleGlobalTouchEnd);
        };
    }, [onMovement]);

    if (!visible) return null;

    return (
        <div className="game-controls">
            {/* Forward button */}
            <button
                className="game-control-btn game-control-btn--forward"
                onMouseDown={() => handleMouseDown('forward')}
                onMouseUp={() => handleMouseUp('forward')}
                onMouseLeave={() => handleMouseUp('forward')}
                onTouchStart={(e) => {
                    e.preventDefault();
                    handleTouchStart('forward');
                }}
                onTouchEnd={(e) => {
                    e.preventDefault();
                    handleTouchEnd('forward');
                }}
                onTouchCancel={(e) => {
                    e.preventDefault();
                    handleTouchEnd('forward');
                }}
            >
                ▲
            </button>

            {/* Left and Right buttons */}
            <div className="game-controls-row">
                <button
                    className="game-control-btn game-control-btn--left"
                    onMouseDown={() => handleMouseDown('left')}
                    onMouseUp={() => handleMouseUp('left')}
                    onMouseLeave={() => handleMouseUp('left')}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        handleTouchStart('left');
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        handleTouchEnd('left');
                    }}
                    onTouchCancel={(e) => {
                        e.preventDefault();
                        handleTouchEnd('left');
                    }}
                >
                    ◀
                </button>

                <button
                    className="game-control-btn game-control-btn--right"
                    onMouseDown={() => handleMouseDown('right')}
                    onMouseUp={() => handleMouseUp('right')}
                    onMouseLeave={() => handleMouseUp('right')}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        handleTouchStart('right');
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        handleTouchEnd('right');
                    }}
                    onTouchCancel={(e) => {
                        e.preventDefault();
                        handleTouchEnd('right');
                    }}
                >
                    ▶
                </button>
            </div>
        </div>
    );
};

export default GameControls;
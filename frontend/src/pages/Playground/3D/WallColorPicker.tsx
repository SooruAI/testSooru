import React from 'react'
import * as t from "three";
import { useEffect, useRef, useState } from 'react';


interface WallClickData {
    roomId: string;
    wallIndex: number;
    side: 'inner' | 'outer';
    currentColor: string;
    point: t.Vector3;
}

interface ColorPickerPosition {
    x: number;
    y: number;
}

export const WallColorPicker: React.FC<{
    wallData: WallClickData | null;
    position: ColorPickerPosition;
    onColorChange: (color: string) => void;
    onClose: () => void;
}> = ({ wallData, position, onColorChange, onClose }) => {
    const pickerRef = useRef<HTMLDivElement>(null);
    
    const colorPalette = [
        // Neutrals
        '#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121', '#000000',
        // Warm colors
        '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350', '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C',
        // Cool colors
        '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1',
        // Greens
        '#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20',
        // Earth tones
        '#EFEBE9', '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723',
        // Pastels
        '#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F',
        // Yellows/Oranges
        '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58', '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17', '#F57C00',
    ];

    const [customColor, setCustomColor] = useState(wallData?.currentColor || '#FFFFFF');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!wallData) return null;

    return (
        <div
            ref={pickerRef}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                backgroundColor: 'white',
                border: '2px solid #333',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                zIndex: 10000,
                minWidth: '320px',
                maxWidth: '400px'
            }}
        >
            <div style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                    Change Wall Color
                </h3>
                <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                    Room: {wallData.roomId} | Wall {wallData.wallIndex + 1} | {wallData.side === 'inner' ? 'Interior' : 'Exterior'} Side
                </p>
            </div>

            {/* Color Palette Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '4px',
                marginBottom: '12px'
            }}>
                {colorPalette.map((color) => (
                    <button
                        key={color}
                        onClick={() => onColorChange(color)}
                        style={{
                            width: '28px',
                            height: '28px',
                            backgroundColor: color,
                            border: color === wallData.currentColor ? '2px solid #000' : '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: 0,
                            transition: 'transform 0.1s',
                            transform: color === wallData.currentColor ? 'scale(1.2)' : 'scale(1)'
                        }}
                        title={color}
                    />
                ))}
            </div>

            {/* Custom Color Input */}
            <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px' }}>Custom Color:</span>
                    <input
                        type="color"
                        value={customColor}
                        onChange={(e) => setCustomColor(e.target.value)}
                        style={{ flexGrow: 1, height: '32px', cursor: 'pointer' }}
                    />
                    <button
                        onClick={() => onColorChange(customColor)}
                        style={{
                            padding: '6px 12px',
                            backgroundColor: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        Apply
                    </button>
                </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                    onClick={onClose}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};


import React from 'react';
import { useFloorPlan } from '../FloorPlanContext';

const UnitSwitch: React.FC = () => {
  const { unitSystem, setUnitSystem } = useFloorPlan();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '30px',
        left: '30px',
        zIndex: 1000,
        display: 'flex',
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      <button
        onClick={() => setUnitSystem('imperial')}
        style={{
          padding: '8px 16px',
          border: 'none',
          backgroundColor: unitSystem === 'imperial' ? '#000' : '#fff',
          color: unitSystem === 'imperial' ? '#fff' : '#333',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: unitSystem === 'imperial' ? '600' : '400',
          transition: 'all 0.2s',
          maxWidth: '60px',
        }}
      >
        ft/in
      </button>
      <button
        onClick={() => setUnitSystem('metric')}
        style={{
          padding: '8px 16px',
          border: 'none',
          borderLeft: '1px solid #ddd',
          backgroundColor: unitSystem === 'metric' ? '#000' : '#fff',
          color: unitSystem === 'metric' ? '#fff' : '#333',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: unitSystem === 'metric' ? '600' : '400',
          transition: 'all 0.2s',
          minWidth: '60px',
        }}
      >
        m/cm
      </button>
    </div>
  );
};

export default UnitSwitch;
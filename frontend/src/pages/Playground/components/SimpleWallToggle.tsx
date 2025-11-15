import React from 'react';
import { useFloorPlan } from '../FloorPlanContext';

const SimpleWallToggle: React.FC = () => {
  const { showIndividualWalls, setShowIndividualWalls } = useFloorPlan();

  return (
    <div style={{ padding: '10px', background: 'white', border: '1px solid #ccc', borderRadius: '5px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={showIndividualWalls}
          onChange={(e) => setShowIndividualWalls(e.target.checked)}
        />
        Show Individual Walls
      </label>
    </div>
  );
};

export default SimpleWallToggle;
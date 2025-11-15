import React, { useState } from "react";

interface RoomTypeManagerProps {
  availableRoomTypes: string[];
  onSelectRoomType: (roomType: string) => void;
}

const RoomTypeManager: React.FC<RoomTypeManagerProps> = ({
  availableRoomTypes,
  onSelectRoomType,
}) => {
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);

  const handleSelectRoomType = (roomType: string) => {
    setSelectedRoomType(roomType);
    onSelectRoomType(roomType);
  };

  return (
    <div className="room-type-manager">
      <p className="instruction-text">
        Select a room type, then click on a room in the floor plan to apply it.
      </p>

      <div className="room-type-grid">
        {availableRoomTypes.map((roomType, index) => (
          <button
            key={roomType + index}
            className={`room-type-item ${
              selectedRoomType === roomType ? "selected" : ""
            }`}
            onClick={() => handleSelectRoomType(roomType)}
          >
            {roomType}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoomTypeManager;

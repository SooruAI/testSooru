import React from 'react';
import ReactDOM from 'react-dom';

interface OverlapWarningProps {
  overlappingRooms: string[][];
  getOverlappingRoomNames: () => string;
}

export const renderOverlapAlert = (props: OverlapWarningProps) => {
  const { overlappingRooms, getOverlappingRoomNames } = props;
  
  if (overlappingRooms.length === 0) return null;

  return ReactDOM.createPortal(
    <div className="overlap-alert">
      Room overlap detected between {getOverlappingRoomNames()}
    </div>,
    document.body
  );
};

export const getOverlappingRoomNames = (
  overlappingRooms: string[][],
  getRoomType: (id: string) => string | undefined
) => {
  const roomNamePairs = overlappingRooms
    .map(([id1, id2]) => {
      const room1Type = getRoomType(id1);
      const room2Type = getRoomType(id2);
      
      if (room1Type === "Wall" || room2Type === "Wall") {
        return null;
      }
      
      return `${room1Type} and ${room2Type}`;
    })
    .filter(pair => pair !== null) as string[];

  if (roomNamePairs.length === 1) {
    return roomNamePairs[0];
  } else if (roomNamePairs.length === 2) {
    return `${roomNamePairs[0]}, ${roomNamePairs[1]}`;
  } else if (roomNamePairs.length > 2) {
    return `${roomNamePairs.slice(0, 2).join(", ")} and ${
      roomNamePairs.length - 2
    } more`;
  }
  return "";
};

export const isRoomOverlapping = (roomId: string, overlappingRooms: string[][]) => {
  return overlappingRooms.some((pair) => pair.includes(roomId));
};
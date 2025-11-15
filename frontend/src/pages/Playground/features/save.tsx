import React from "react";
import { applyRotationToPolygon } from "./overlap1"; 
import { API_URL } from "../../../config";

const API_BASE_URL = API_URL;

interface Point {
  x: number;
  z: number;
}

interface Room {
  id: string;
  room_type: string;
  area: number;
  height: number;
  width: number;
  floor_polygon: Point[];
}

interface FloorPlanData {
  room_count: number;
  total_area: number;
  room_types: string[];
  rooms: Room[];
}

function rotatePoint(point: Point, center: { x: number, z: number }, angleDegrees: number): Point {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  
  const translatedX = point.x - center.x;
  const translatedZ = point.z - center.z;

  const rotatedX = translatedX * Math.cos(angleRadians) - translatedZ * Math.sin(angleRadians);
  const rotatedZ = translatedX * Math.sin(angleRadians) + translatedZ * Math.cos(angleRadians);
  
  return {
    x: rotatedX + center.x,
    z: rotatedZ + center.z
  };
}

function applyRoomRotations(
  floorPlanData: FloorPlanData, 
  roomRotations: { [key: string]: number }
): FloorPlanData {
  const updatedRooms = floorPlanData.rooms.map(room => {
    const rotation = roomRotations[room.id] || 0;
    
    if (rotation === 0) {
      return room;
    }

    const rotatedPolygon = applyRotationToPolygon(room.floor_polygon, rotation);
    
    return {
      ...room,
      floor_polygon: rotatedPolygon
    };
  });
  
  return {
    ...floorPlanData,
    rooms: updatedRooms
  };
}

async function updatePlanCoordinates(
  projectId: string,
  planId: string,
  floorPlanData: FloorPlanData
): Promise<boolean> {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.error('No access token found');
      return false;
    }

    const coordinatesPayload = {
      coordinates: floorPlanData
    };

    const response = await fetch(
      `${API_BASE_URL}/projects/${projectId}/plans/${planId}/`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coordinatesPayload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to update plan:', errorData);
      return false;
    }

    const updatedPlan = await response.json();
    console.log('Plan updated successfully:', updatedPlan);
    return true;

  } catch (error) {
    console.error('Error updating plan coordinates:', error);
    return false;
  }
}

export async function saveFloorPlan(
  floorPlanData: FloorPlanData, 
  roomRotations: { [key: string]: number },
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>,
  projectId: string,
  planId: string
) {
  try {
    const finalFloorPlanData = applyRoomRotations(floorPlanData, roomRotations);
  
    const updateSuccess = await updatePlanCoordinates(projectId, planId, finalFloorPlanData);
    
    if (!updateSuccess) {
      alert("Failed to save floor plan to server");
      return floorPlanData;
    }
    
    const cachedProjects = localStorage.getItem("userProjects");
    if (cachedProjects) {
      const projects = JSON.parse(cachedProjects);
      const updatedProjects = projects.map((project: any) => 
        project.id.toString() === projectId 
          ? {
              ...project,
              plans: project.plans.map((plan: any) => 
                plan.id.toString() === planId 
                  ? { ...plan, coordinates: floorPlanData }
                  : plan
              )
            }
          : project
      );
      localStorage.setItem("userProjects", JSON.stringify(updatedProjects));
    }
    
    console.log(JSON.stringify(finalFloorPlanData));
    
    setHasChanges(false);
    
    return finalFloorPlanData;
  } catch (error) {
    console.error("Error saving floor plan:", error);
    alert("Failed to save floor plan");
    return floorPlanData;
  }
}
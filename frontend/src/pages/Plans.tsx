import React, { useState, useEffect, useRef, use } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ShareModal from './Playground/components/ShareModal';
import './Plans.css';
import { CopyIcon, Upload } from 'lucide-react';
import UploadPlanModal from './Playground/components/UploadPlanModal';
import { API_URL } from '../config';
import { logEvent } from '../Utility/UserJourney';
import { view } from 'framer-motion';
import { platform } from 'os';
import { RemoveShoppingCartOutlined } from '@mui/icons-material';

const API_BASE_URL = API_URL;

const getInitialFloorPlanData = () => {
  const referencePoints = [
    {
      id: "invisible-reference-point-1",
      room_type: "Reference",
      area: 0,
      height: 0,
      width: 0,
      floor_polygon: [
        { x: 0, z: 0 },
        { x: 0, z: 0 }
      ],
      is_regular: 0
    }
  ];

  return {
    room_count: 0,
    total_area: 0,
    room_types: [],
    rooms: referencePoints,
    objects: []
  };
};

interface Point {
  x: number;
  z: number;
}

interface Room {
  id: string;
  room_type: string;
  area?: number;
  height?: number;
  width?: number;
  floor_polygon: Point[];
  is_regular?: number;
  isBoundary?: boolean;
}

interface FloorPlanData {
  room_count: number;
  total_area: number;
  room_types: string[];
  rooms: Room[];
  objects: any[];
}

interface Project {
  id: number;
  project_name: string;
  created_by: number;
  created_by_details: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_date: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  estimated_budget: string;
  currency: string;
  additional_details?: string;
  plans: any[];
  plans_count: number;
}

interface Plan {
  id: number;
  project: number;
  plan_name: string;
  created_date: string;
  coordinates: FloorPlanData;
}

// SVG Icons (keeping existing icons)
const PenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StarsIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" fill="currentColor" />
    <path d="M6 10l0.75 2.25L9 13l-2.25 0.75L6 16l-0.75-2.25L3 13l2.25-0.75L6 10z" fill="currentColor" />
    <path d="M19 8l0.75 2.25L22 11l-2.25 0.75L19 14l-0.75-2.25L16 11l2.25-0.75L19 8z" fill="currentColor" />
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="16,6 12,2 8,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Mini Floor Plan Component (keeping existing implementation)
const MiniFloorPlan: React.FC<{ floorPlanData: FloorPlanData; width?: number; height?: number }> = ({
  floorPlanData,
  width = 160,
  height = 110
}) => {
  // Safe floor plan data
  const safeFloorPlanData = floorPlanData || {
    rooms: [],
    total_area: 0,
    room_count: 0,
    room_types: [],
    objects: []
  };

  // Ensure rooms is always an array
  if (!safeFloorPlanData.rooms || !Array.isArray(safeFloorPlanData.rooms)) {
    safeFloorPlanData.rooms = [];
  }

  // Calculate bounds
  const calculateBounds = () => {
    if (
      !safeFloorPlanData ||
      !safeFloorPlanData.rooms ||
      safeFloorPlanData.rooms.length === 0
    ) {
      return { minX: 0, maxX: 100, minZ: 0, maxZ: 100 };
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    safeFloorPlanData.rooms.forEach((room: Room) => {
      if (room.floor_polygon && room.floor_polygon.length > 0) {
        room.floor_polygon.forEach((point: Point) => {
          minX = Math.min(minX, point.x);
          maxX = Math.max(maxX, point.x);
          minZ = Math.min(minZ, point.z);
          maxZ = Math.max(maxZ, point.z);
        });
      }
    });

    // If no valid points found, return default bounds
    if (minX === Infinity) {
      return { minX: 0, maxX: 100, minZ: 0, maxZ: 100 };
    }

    return { minX, maxX, minZ, maxZ };
  };

  const bounds = calculateBounds();
  const padding = 15;

  const scaleX = (width - padding * 2) / (bounds.maxX - bounds.minX || 1);
  const scaleZ = (height - padding * 2) / (bounds.maxZ - bounds.minZ || 1);
  const scale = Math.min(scaleX, scaleZ);

  const transformPoint = (point: Point) => {
    const x = (point.x - bounds.minX) * scale + padding;
    const y = (point.z - bounds.minZ) * scale + padding;
    return { x, y };
  };

  const getRoomColor = (roomType: string): string => {
    if (roomType === "Wall") {
      return "#333333";
    }

    if (roomType === "Reference" || roomType === "Boundary") {
      return "transparent";
    }

    // All rooms are grey now
    return "#D0D0D0";
  };

  const calculateMiteredCorners = (
    walls: Array<{
      start: { x: number; y: number };
      end: { x: number; y: number };
      wallWidth: number;
      isExternal: boolean;
    }>
  ) => {
    const corners = [];

    for (let i = 0; i < walls.length; i++) {
      const currentWall = walls[i];
      const prevWall = walls[i === 0 ? walls.length - 1 : i - 1];
      const nextWall = walls[(i + 1) % walls.length];

      const { start, end, wallWidth } = currentWall;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) {
        corners.push(null);
        continue;
      }

      const dirX = dx / length;
      const dirY = dy / length;
      const perpX = -dirY;
      const perpY = dirX;
      const halfWidth = wallWidth / 2;

      let topStart = {
        x: start.x + perpX * halfWidth,
        y: start.y + perpY * halfWidth,
      };
      let topEnd = {
        x: end.x + perpX * halfWidth,
        y: end.y + perpY * halfWidth,
      };
      let bottomStart = {
        x: start.x - perpX * halfWidth,
        y: start.y - perpY * halfWidth,
      };
      let bottomEnd = {
        x: end.x - perpX * halfWidth,
        y: end.y - perpY * halfWidth,
      };

      if (prevWall) {
        const prevDx = prevWall.end.x - prevWall.start.x;
        const prevDy = prevWall.end.y - prevWall.start.y;
        const prevLength = Math.sqrt(prevDx * prevDx + prevDy * prevDy);

        if (prevLength > 0) {
          const prevPerpX = -prevDy / prevLength;
          const prevPerpY = prevDx / prevLength;
          const prevHalfWidth = prevWall.wallWidth / 2;

          const topIntersection = getLineIntersection(
            {
              x: prevWall.start.x + prevPerpX * prevHalfWidth,
              y: prevWall.start.y + prevPerpY * prevHalfWidth,
            },
            {
              x: prevWall.end.x + prevPerpX * prevHalfWidth,
              y: prevWall.end.y + prevPerpY * prevHalfWidth,
            },
            topStart,
            topEnd
          );

          const bottomIntersection = getLineIntersection(
            {
              x: prevWall.start.x - prevPerpX * prevHalfWidth,
              y: prevWall.start.y - prevPerpY * prevHalfWidth,
            },
            {
              x: prevWall.end.x - prevPerpX * prevHalfWidth,
              y: prevWall.end.y - prevPerpY * prevHalfWidth,
            },
            bottomStart,
            bottomEnd
          );

          if (topIntersection) topStart = topIntersection;
          if (bottomIntersection) bottomStart = bottomIntersection;
        }
      }

      if (nextWall) {
        const nextDx = nextWall.end.x - nextWall.start.x;
        const nextDy = nextWall.end.y - nextWall.start.y;
        const nextLength = Math.sqrt(nextDx * nextDx + nextDy * nextDy);

        if (nextLength > 0) {
          const nextPerpX = -nextDy / nextLength;
          const nextPerpY = nextDx / nextLength;
          const nextHalfWidth = nextWall.wallWidth / 2;

          const topIntersection = getLineIntersection(
            topStart,
            topEnd,
            {
              x: nextWall.start.x + nextPerpX * nextHalfWidth,
              y: nextWall.start.y + nextPerpY * nextHalfWidth,
            },
            {
              x: nextWall.end.x + nextPerpX * nextHalfWidth,
              y: nextWall.end.y + nextPerpY * nextHalfWidth,
            }
          );

          const bottomIntersection = getLineIntersection(
            bottomStart,
            bottomEnd,
            {
              x: nextWall.start.x - nextPerpX * nextHalfWidth,
              y: nextWall.start.y - nextPerpY * nextHalfWidth,
            },
            {
              x: nextWall.end.x - nextPerpX * nextHalfWidth,
              y: nextWall.end.y - nextPerpY * nextHalfWidth,
            }
          );

          if (topIntersection) topEnd = topIntersection;
          if (bottomIntersection) bottomEnd = bottomIntersection;
        }
      }

      corners.push({
        topStart,
        topEnd,
        bottomStart,
        bottomEnd,
      });
    }

    return corners;
  };

  const getLineIntersection = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number }
  ) => {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);

    if (Math.abs(denom) < 0.0001) return null;

    const t =
      ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;

    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    };
  };

  const isExternalWallSegment = (
    roomId: string,
    segmentIndex: number,
    floorPlanData: FloorPlanData
  ) => {
    const currentRoom = floorPlanData.rooms.find((r: Room) => r.id === roomId);
    if (!currentRoom || currentRoom.room_type === "Wall") return false;

    const currentWallStart = currentRoom.floor_polygon[segmentIndex];
    const currentWallEnd =
      currentRoom.floor_polygon[
      (segmentIndex + 1) % currentRoom.floor_polygon.length
      ];

    for (const otherRoom of floorPlanData.rooms) {
      if (otherRoom.id === roomId || otherRoom.room_type === "Wall") continue;

      for (let i = 0; i < otherRoom.floor_polygon.length; i++) {
        const otherWallStart = otherRoom.floor_polygon[i];
        const otherWallEnd =
          otherRoom.floor_polygon[(i + 1) % otherRoom.floor_polygon.length];

        const sameDirection =
          Math.abs(currentWallStart.x - otherWallStart.x) < 0.1 &&
          Math.abs(currentWallStart.z - otherWallStart.z) < 0.1 &&
          Math.abs(currentWallEnd.x - otherWallEnd.x) < 0.1 &&
          Math.abs(currentWallEnd.z - otherWallEnd.z) < 0.1;

        const oppositeDirection =
          Math.abs(currentWallStart.x - otherWallEnd.x) < 0.1 &&
          Math.abs(currentWallStart.z - otherWallEnd.z) < 0.1 &&
          Math.abs(currentWallEnd.x - otherWallStart.x) < 0.1 &&
          Math.abs(currentWallEnd.z - otherWallStart.z) < 0.1;

        if (sameDirection || oppositeDirection) {
          return false;
        }
      }
    }

    return true;
  };

  // Check if there are any valid rooms to render
  const hasValidRooms = safeFloorPlanData.rooms.some(room =>
    room.floor_polygon &&
    room.floor_polygon.length > 0 &&
    room.room_type !== "Reference"
  );

  // Return empty div if no valid rooms (no background, no border, no text)
  if (!hasValidRooms) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Empty - no content */}
      </div>
    );
  }

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        left: "25px"
      }}
    >
      <svg
        width={width}
        height={height}
        style={{
          backgroundColor: "transparent",
        }}
      >
        {/* Render room fills */}
        {safeFloorPlanData.rooms.map((room: Room) => {
          if (room.room_type === "Wall" || !room.floor_polygon || room.floor_polygon.length < 3) return null;

          const isBoundary = room.isBoundary || room.room_type === "Boundary";
          const points = room.floor_polygon
            .map((p) => {
              const t = transformPoint(p);
              return `${t.x},${t.y}`;
            })
            .join(" ");

          return (
            <polygon
              key={`${room.id}-fill`}
              points={points}
              fill={isBoundary ? "none" : getRoomColor(room.room_type)}
              fillOpacity={isBoundary ? 0 : 1}
              stroke="none"
              style={{ pointerEvents: "none" }}
            />
          );
        })}

        {/* Render walls */}
        {(() => {
          const allWallSegments: Array<{
            roomId: string;
            segmentIndex: number;
            corners: any;
            isExternal: boolean;
            wallWidth: number;
          }> = [];

          safeFloorPlanData.rooms.forEach((room: Room) => {
            if (room.room_type === "Wall" || !room.floor_polygon || room.floor_polygon.length < 3)
              return;

            const transformedPoints = room.floor_polygon.map(transformPoint);

            const wallData = [];
            for (let i = 0; i < transformedPoints.length; i++) {
              const start = transformedPoints[i];
              const end = transformedPoints[(i + 1) % transformedPoints.length];
              const isExternal = isExternalWallSegment(room.id, i, safeFloorPlanData);

              const baseInternalWidth = 1.2;
              const baseExternalWidth = 1.8;
              const wallWidth = isExternal ? baseExternalWidth : baseInternalWidth;

              wallData.push({
                start,
                end,
                wallWidth,
                isExternal,
              });
            }

            const miteredCorners = calculateMiteredCorners(wallData);

            wallData.forEach((wall, index) => {
              const corners = miteredCorners[index];
              if (corners) {
                allWallSegments.push({
                  roomId: room.id,
                  segmentIndex: index,
                  corners,
                  isExternal: wall.isExternal,
                  wallWidth: wall.wallWidth,
                });
              }
            });
          });

          allWallSegments.sort((a, b) => {
            if (a.isExternal && !b.isExternal) return 1;
            if (!a.isExternal && b.isExternal) return -1;
            return 0;
          });

          return allWallSegments.map((wallSegment, index) => {
            const { corners } = wallSegment;
            const polygonPoints = `${corners.topStart.x},${corners.topStart.y} ${corners.topEnd.x},${corners.topEnd.y} ${corners.bottomEnd.x},${corners.bottomEnd.y} ${corners.bottomStart.x},${corners.bottomStart.y}`;

            return (
              <polygon
                key={`wall-segment-${index}`}
                points={polygonPoints}
                fill="black"
                stroke="none"
                style={{ pointerEvents: "none" }}
              />
            );
          });
        })()}

        {/* Render standalone wall segments */}
        {safeFloorPlanData.rooms.map((room: Room) => {
          if (room.room_type !== "Wall" || !room.floor_polygon || room.floor_polygon.length !== 2)
            return null;

          const start = transformPoint(room.floor_polygon[0]);
          const end = transformPoint(room.floor_polygon[1]);
          const wallWidth = 1.8;

          return (
            <line
              key={room.id}
              x1={start.x}
              y1={start.y}
              x2={end.x}
              y2={end.y}
              stroke="#333333"
              strokeWidth={wallWidth}
              strokeLinecap="round"
              style={{ pointerEvents: "none" }}
            />
          );
        })}
      </svg>
    </div>
  );
};

interface PlansProps {
  viewOnly?: boolean;
}

const Plans: React.FC<PlansProps> = ({ viewOnly = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [editPlanName, setEditPlanName] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [navigationLoading, setNavigationLoading] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);

  // Dark mode state using localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  // Add ShareModal state
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [sharePlan, setSharePlan] = useState<Plan | null>(null);

  // Sync with theme changes
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      const newIsDarkMode = savedTheme === "dark";
      setIsDarkMode(newIsDarkMode);
      document.body.classList.toggle("dark", newIsDarkMode);
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 100);

    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

  // Rest of your existing useEffect hooks and functions remain the same...
  useEffect(() => {
    // Check if user came from authorized routes
    const fromNewProject = location.state?.fromNewProject;
    const fromProjectPage = location.state?.fromProjectPage;
    const fromProposals = location.state?.fromProposals;

    if (!fromNewProject && !fromProjectPage && !fromProposals && !projectId) {
      navigate('/projects', { replace: true });
      return;
    }

    // Show success message if coming from new project creation
    if (location.state?.showSuccessMessage) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    }

    if (projectId) {
      fetchAllData();
    }
  }, [location.state, navigate, projectId]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchProjectDetails = async () => {
    try {
      // First try to get from localStorage
      const cachedProjects = localStorage.getItem("userProjects");
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects);
        const foundProject = projects.find((p: any) => p.id.toString() === projectId);
        if (foundProject) {
          setProject(foundProject);
          return; // Exit early if found in cache
        }
      }

      // Fallback to API if not in cache
      if (viewOnly) {
        const response = await fetch(`${API_BASE_URL}/public/projects/${projectId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch project details: ${response.status}`);
        }

        const projectData = await response.json();
        console.log("Fetched public project data:", projectData);

        setProject(projectData);
        console.log("sad", projectData.plans)
        setPlans(projectData.plans);
        let cachedProjects = localStorage.getItem("userProjects");
        let projects = cachedProjects ? JSON.parse(cachedProjects) : [];
        projectData.shared = true; // Mark as public/shared project
        projects.push(projectData);
        console.log("projects", projects)
        localStorage.setItem("userProjects", JSON.stringify(projects));
        // const projectExists = projects.some((p: any) => p.id.toString() === projectId);
        // let updatedProjects;
        // if (projectExists) {
        //   updatedProjects = projects.map((p: any) =>
        //     p.id.toString() === projectId
        //       ? { ...projectData, plans: p.plans, plans_count: p.plans_count }
        //       : p
        //   );
        // } else {
        //   console.log("Adding new public project to localStorage cache");
        //   updatedProjects = [...projects, projectData];
        // }
        // localStorage.setItem("userProjects", JSON.stringify(updatedProjects));

      } else {
        const token = localStorage.getItem('access_token');

        if (!token) {
          setError('Please login to view project details');
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401) {
          setError('Session expired. Please login again.');
          localStorage.removeItem('access_token');
          navigate('/login');
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch project details: ${response.status}`);
        }

        const projectData = await response.json();
        setProject(projectData);
      }
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to load project details');
    }
  };

  const fetchPlans = async () => {
    try {
      // Check if coming from proposals with fresh data flag
      const fromProposals = location.state?.fromProposals;
      const forceRefresh = location.state?.forceRefresh;

      // If coming from proposals or forced refresh, always fetch from API first
      if (fromProposals || forceRefresh) {
        console.log('Fetching fresh plans from API due to proposals/force refresh');
        let planData: any;
        if (viewOnly) {
          console.log('Fetching public plans for viewOnly mode');
          const response = await fetch(`${API_BASE_URL}/public/projects/${projectId}/plans/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            planData = await response.json();
            setPlans(planData);
          }
        } else {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            planData = await response.json();
            setPlans(planData);
          }

        }

        if (planData) {
          // Update localStorage with fresh data
          const cachedProjects = localStorage.getItem("userProjects");
          if (cachedProjects) {
            const projects = JSON.parse(cachedProjects);
            const updatedProjects = projects.map((p: any) =>
              p.id.toString() === projectId
                ? { ...p, plans: planData, plans_count: planData.length }
                : p
            );
            localStorage.setItem("userProjects", JSON.stringify(updatedProjects));
          }

          setError(null);
          return;
        }
      }

      // Normal flow - try localStorage first
      const cachedProjects = localStorage.getItem("userProjects");
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects);
        const foundProject = projects.find((p: any) => p.id.toString() === projectId);
        if (foundProject && foundProject.plans) {
          setPlans(foundProject.plans);
          setError(null);
          return;
        }
      }

      // Fallback to API if not in cache
      let planData: any;
      if (viewOnly) {
        return;
        const response = await fetch(`${API_BASE_URL}/public/projects/${projectId}/plans`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          planData = await response.json();
          setPlans(planData);
        }
      } else {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          planData = await response.json();
          setPlans(planData);
        }
      }
      if (!planData) {
        throw new Error('Failed to fetch plans from API');
      }

      // Update the project's plans in localStorage
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects);
        const updatedProjects = projects.map((p: any) =>
          p.id.toString() === projectId
            ? { ...p, plans: planData, plans_count: planData.length }
            : p
        );
        localStorage.setItem("userProjects", JSON.stringify(updatedProjects));
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load plans');
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProjectDetails(),
        fetchPlans()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // All your existing functions (createPlan, handleCreatePlan, etc.) remain the same...
  const createPlan = async (createOption: 'scratch' | 'ai') => {
    try {
      setCreateLoading(true);
      const token = localStorage.getItem('access_token');

      // Get initial floor plan data with reference points
      const initialData = getInitialFloorPlanData();

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: initialData // Save initial data to coordinates
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Handle duplicate name error
        if (response.status === 500 || errorData.detail?.includes('duplicate key')) {
          setError('Plan name already exists. Please try again.');
          await fetchAllData(); // Refresh data to get latest plan count
          return;
        }

        throw new Error(errorData.detail || 'Failed to create plan');
      }

      const newPlan = await response.json();

      // Update localStorage project with new plan
      const cachedProjects = localStorage.getItem("userProjects");
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects);
        const updatedProjects = projects.map((p: any) =>
          p.id.toString() === projectId
            ? {
              ...p,
              plans: [newPlan, ...(p.plans || [])],
              plans_count: (p.plans_count || 0) + 1
            }
            : p
        );
        localStorage.setItem("userProjects", JSON.stringify(updatedProjects));
      }

      // Show navigation loading and navigate to playground
      setNavigationLoading(true);
      setTimeout(() => {
        navigate(`/playground/${projectId}/${newPlan.id}?createOption=${createOption}`);
      }, 1);
    } catch (err) {
      console.error('Error creating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setShowCreateModal(true);
  };
  const handleCopyPlan = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please login to copy plan');
      const redirect = encodeURIComponent(`/view/projects/${projectId}/plans`)
      window.location.href = `/LoginPage?redirect=${redirect}`;
      return;
    }
    setCopyLoading(true);
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/duplicate/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log("Copy Plan Response:", data);

    if (!response.ok) {
      setError('Failed to copy plan');
      setCopyLoading(false);
      return;
    }
    navigate(`/projects/${data.new_project.id}/plans`)
  }

  const handleModalOptionClick = async (option: 'scratch' | 'ai' | 'existingPlan') => {
    setShowCreateModal(false);

    if (option === 'scratch') {
      await createPlan(option);
    } else if (option === 'ai') {
      // For AI option, navigate to AI creation route
      setNavigationLoading(true);
      setTimeout(() => {
        navigate(`/playground/${projectId}/ai-create?createOption=${option}`);
      }, 1000);
    } else {
      setUploadModal(true);
      console.log("Upload Modal Opened");
    }
  };

  const handlePlanClick = (plan: Plan) => {
    // Show navigation loading and navigate to playground
    logEvent('plan_opened', { planId: plan.id, projectId });
    setNavigationLoading(true);
    setTimeout(() => {
      if (viewOnly) {
        navigate(`/view/playground/${projectId}/${plan.id}`);
        return;
      } else {
        navigate(`/playground/${projectId}/${plan.id}`);
      }
    }, 1);
  };

  const handleDropdownClick = (e: React.MouseEvent, planId: number) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === planId ? null : planId);
  };

  const handleEdit = (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    setSelectedPlan(plan);
    setEditPlanName(plan.plan_name);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleDelete = (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    setSelectedPlan(plan);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  // Updated handleShare function
  const handleShare = (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    setSharePlan(plan);
    setShowShareModal(true);
    setActiveDropdown(null);
  };
  const handleDuplicate = async (e: React.MouseEvent, plan: Plan) => {
    e.stopPropagation();
    setCopyLoading(true);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Please login to duplicate plan');
      const redirect = encodeURIComponent(`/projects/${projectId}/plans`);
      window.location.href = `/LoginPage?redirect=${redirect}`;
      return;
    }

    try {
      setCopyLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/projects/${projectId}/plans/${plan.id}/duplicate/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || 'Failed to duplicate plan');
      }

      const newPlan: Plan = data.new_plan;

      setPlans((prev) => [...prev, newPlan]);

      setTimeout(() => {
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      }, 100);

      // Update localStorage cached project entry if present
      const cached = localStorage.getItem('userProjects');
      if (cached) {
        const projects = JSON.parse(cached);
        const updated = projects.map((p: any) =>
          p.id.toString() === projectId
            ? {
              ...p,
              plans: [newPlan, ...(p.plans || [])],
              plans_count: (p.plans_count || 0) + 1,
            }
            : p
        );
        localStorage.setItem('userProjects', JSON.stringify(updated));
        setActiveDropdown(null);
      }
    } catch (err) {
      console.error('Error duplicating plan:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate plan');
    } finally {
      setCopyLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!selectedPlan) return;

    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/${selectedPlan.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_name: editPlanName,
          coordinates: selectedPlan.coordinates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update plan');
      }

      // Update localStorage immediately for optimistic update
      const updatedPlans = plans.map(p =>
        p.id === selectedPlan.id
          ? { ...p, plan_name: editPlanName }
          : p
      );
      setPlans(updatedPlans);

      // Update project in localStorage
      const cachedProjects = localStorage.getItem("userProjects");
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects);
        const updatedProjects = projects.map((p: any) =>
          p.id.toString() === projectId
            ? { ...p, plans: updatedPlans }
            : p
        );
        localStorage.setItem("userProjects", JSON.stringify(updatedProjects));
      }

      setShowEditModal(false);
      setSelectedPlan(null);
    } catch (err) {
      console.error('Error updating plan:', err);
      setError('Failed to update plan');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAdvancedEdit = () => {
    if (!selectedPlan) return;

    setShowEditModal(false);
    // Show navigation loading and navigate to playground
    setNavigationLoading(true);
    setTimeout(() => {
      navigate(`/playground/${projectId}/${selectedPlan.id}`);
    }, 1);
  };

  const confirmDelete = async () => {
    if (!selectedPlan) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/${selectedPlan.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete plan');
      }

      // Update localStorage immediately for optimistic update
      const updatedPlans = plans.filter(p => p.id !== selectedPlan.id);
      setPlans(updatedPlans);

      // Update project in localStorage
      const cachedProjects = localStorage.getItem("userProjects");
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects);
        const updatedProjects = projects.map((p: any) =>
          p.id.toString() === projectId
            ? { ...p, plans: updatedPlans, plans_count: updatedPlans.length }
            : p
        );
        localStorage.setItem("userProjects", JSON.stringify(updatedProjects));
      }

      setShowDeleteModal(false);
      setSelectedPlan(null);
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError('Failed to delete plan');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBackToProjects = () => {
    const fromProposals = location.state?.fromProposals;

    if (fromProposals) {
      navigate('/projects');
    } else {
      navigate('/projects');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBudget = (budget: string, currency: string) => {
    const amount = parseFloat(budget);
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ${currency}`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K ${currency}`;
    }
    return `${amount.toLocaleString()} ${currency}`;
  };

  const getProjectLocation = (project: Project) => {
    const parts = [project.city, project.state, project.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  if (loading && !project) {
    return (
      <div className={`plans-loading ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="loading-spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className={`plans-error ${isDarkMode ? 'dark-mode' : ''}`}>
        <h3>⚠️ Error</h3>
        <p>{error}</p>
        <button onClick={() => navigate('/projects')} className="plans-back-btn">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="plans-wrapper">
      {showSuccessMessage && (
        <div className="success-banner">
          <span className="success-icon">✅</span>
          <span className="success-text">Project created successfully!</span>
        </div>
      )}

      <div className="plans-container">
        {/* Enhanced Navigation Bar */}
        <div className="plans-nav-bar">
          <div className="plans-nav-left">
            <button
              className="plans-nav-btn plans-back-button"
              onClick={handleBackToProjects}
            >
              ← Back
            </button>
            <div className="plans-nav-divider"></div>
            <button className="plans-nav-btn plans-nav-active">
              <strong>Plans</strong>
            </button>
          </div>
          <div className="plans-nav-right">
            {
              viewOnly ?
                <button
                  className="plans-create-btn plans-create-top"
                  onClick={handleCopyPlan}
                  disabled={copyLoading}
                >
                  {copyLoading ? 'CREATING...' : '+ Copy Project'}
                </button>
                :
                <button
                  className="plans-create-btn plans-create-top"
                  onClick={handleCreatePlan}
                  disabled={createLoading}
                >
                  {createLoading ? 'CREATING...' : '+ CREATE'}
                </button>
            }
          </div>
        </div>

        {/* Project Info Header */}
        {project && (
          <div className="project-info-header">
            <div className="project-info-main">
              <h1 className="project-title">{project.project_name}</h1>
              <div className="project-info-details">
                <div className="project-detail-item">
                  <span className="detail-icon">📍</span>
                  <span className="detail-text">{getProjectLocation(project)}</span>
                </div>
                <div className="project-detail-item">
                  <span className="detail-icon">📋</span>
                  <span className="detail-text">{plans.length} Plans</span>
                </div>
                <div className="project-detail-item">
                  <span className="detail-icon">💵</span>
                  <span className="detail-text">{formatBudget(project.estimated_budget, project.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="plans-main-content">
          {loading ? (
            <div className="plans-loading-state">
              <div className="loading-spinner"></div>
              <p>Loading plans...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="plans-empty-state">
              <h2 className="plans-empty-title">Your creations will appear here</h2>
              <p className="plans-empty-subtitle">
                Let's start to fill this space with beautiful content
              </p>
              <button
                className="plans-create-btn plans-create-main"
                onClick={handleCreatePlan}
                disabled={createLoading}
              >
                {createLoading ? 'CREATING...' : '+ CREATE'}
              </button>
            </div>
          ) : (
            <div className="plans-grid">
              {
                [...plans]
                  .sort((a, b) => a.id - b.id)
                  .map((plan) => (
                    <div
                      key={plan.id}
                      className="plan-card"
                      onClick={() => handlePlanClick(plan)}
                      style={{
                        opacity: navigationLoading ? 0.7 : 1,
                        pointerEvents: navigationLoading ? 'none' : 'auto'
                      }}
                    >
                      {/* <p>{JSON.stringify(plan)}</p> */}
                      {/* Replace the static image with MiniFloorPlan component */}
                      <div className="plan-card-preview" style={{
                        width: "100%",
                        height: "200px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "white",
                        borderRadius: "8px 8px 0 0",
                        overflow: "hidden",
                        position: "relative",
                        left: "0px"
                      }}>
                        <MiniFloorPlan
                          floorPlanData={plan.coordinates || getInitialFloorPlanData()}
                          width={240}
                          height={160}
                        />
                      </div>

                      <div className="plan-card-dropdown-container">
                        {
                          !viewOnly &&
                          <button
                            className="plan-card-dropdown-btn"
                            onClick={(e) => handleDropdownClick(e, plan.id)}
                            disabled={navigationLoading}
                          >
                            <DotsIcon />
                          </button>
                        }

                        {activeDropdown === plan.id && !navigationLoading && (
                          <div className="plan-card-dropdown-menu">
                            <button
                              className="dropdown-item"
                              onClick={(e) => handleShare(e, plan)}
                            >
                              <ShareIcon />
                              Share
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={(e) => handleDuplicate(e, plan)}
                            >
                              <CopyIcon />
                              {copyLoading ? 'Duplicating...' : 'Duplicate'}
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={(e) => handleEdit(e, plan)}
                            >
                              <EditIcon />
                              Edit
                            </button>
                            <button
                              className="dropdown-item delete"
                              onClick={(e) => handleDelete(e, plan)}
                            >
                              <DeleteIcon />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="plan-card-content">
                        <div className="plan-card-header">
                          <h3 className="plan-card-title">{plan.plan_name}</h3>
                        </div>
                        <div className="plan-card-date">
                          Created {formatDate(plan.created_date)}
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Create Plan Modal */}
      {showCreateModal && (
        <div className="plans-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="plans-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="plans-modal-close" onClick={() => setShowCreateModal(false)}>
              ✕
            </button>
            <h3 className="plans-modal-title">CREATE A PLAN</h3>
            <div className="plans-modal-options">
              <button
                className="plans-modal-option"
                onClick={() => handleModalOptionClick('ai')}
                disabled={createLoading}
              >
                <div className="plans-modal-option-icon">
                  <StarsIcon />
                </div>
                <span>With AI</span>
              </button>
              <button
                className="plans-modal-option"
                onClick={() => handleModalOptionClick('scratch')}
                disabled={createLoading}
              >
                <div className="plans-modal-option-icon">
                  <PenIcon />
                </div>
                <span>From Scratch</span>
              </button>
              <button
                className="plans-modal-option"
                onClick={() => handleModalOptionClick('existingPlan')}
                disabled={createLoading}
              >
                <div className="plans-modal-option-icon">
                  <Upload />
                </div>
                <span>Upload Existing Plan</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Upload Modal */}

      {uploadModal && <UploadPlanModal uploadPlan={true} projectId={projectId!} onClose={() => setUploadModal(false)} />}



      {/* Center Loading Spinner for Navigation */}
      {navigationLoading && (
        <div className="center-loading-overlay">
          <div className="center-loading-spinner"></div>
          <p style={{ color: 'white', marginTop: '16px', fontSize: '14px' }}>
            Loading playground...
          </p>
        </div>
      )}

      {/* Create Loading Spinner */}
      {createLoading && (
        <div className="center-loading-overlay">
          <div className="center-loading-spinner"></div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {showEditModal && selectedPlan && (
        <div className="plans-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="edit-plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
              <h3>Edit</h3>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>
                ×
              </button>
            </div>
            <div className="edit-modal-body">
              <label className="edit-label">Plan Name</label>
              <input
                type="text"
                value={editPlanName}
                onChange={(e) => setEditPlanName(e.target.value)}
                className="edit-input"
                placeholder="Enter plan name"
                disabled={navigationLoading}
              />
            </div>
            <div className="edit-modal-actions">
              <button
                className="edit-btn save-btn"
                onClick={handleEditSave}
                disabled={updateLoading}
              >
                {updateLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                className="edit-btn advanced-btn"
                onClick={handleAdvancedEdit}
                disabled={navigationLoading}
              >
                {navigationLoading ? 'Loading...' : 'Edit Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPlan && (
        <div className="plans-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="delete-plan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-modal-header">
              <h3>Delete Plan</h3>
            </div>
            <div className="delete-modal-body">
              <p>Are you sure you want to delete the plan: <span className="plan-name-highlight">"{selectedPlan.plan_name}"</span>?</p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="delete-modal-actions">
              <button
                className="delete-btn cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                className="delete-btn confirm-btn"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting..' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ShareModal Component */}
      {showShareModal && sharePlan && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSharePlan(null);
          }}
          floorPlanData={sharePlan.coordinates || getInitialFloorPlanData()}
          visualizationOptions={{
            colorScheme: 'standard',
            showRoomLabels: true,
            showMeasurements: true
          }}
          planId={sharePlan.id.toString()}
          projectId={sharePlan.project.toString()}
        />
      )}
    </div>
  );
};

export default Plans;
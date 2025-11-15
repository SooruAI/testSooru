import { useState, useCallback, useEffect, useRef } from "react";
import { InfiniteGrid } from "./Playground/components/Grid";
import Generated from "./Playground/Generated";
import { Compass } from "./Playground/components/Compass";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "./Playground.css";
import VerticalToolbar from "./Playground/components/VerticalToolbar";
import ToolPanel from "./Playground/components/ToolPanel";
import VisualizationPanel from "./Playground/components/VisualizationPanel";
import { FloorPlanProvider, useFloorPlan } from "./Playground/FloorPlanContext";
import CreateCopyButton from "../pages/Playground/components/CreateCopyButton";
import { formatImperialLength, formatImperialArea, coordToInches } from "./Playground/features/imperialUtils";
import UnitSwitch from './Playground/components/UnitSwitch';
import {
  Download,
  ArrowBack,
  Share,
  Lock,
  LockOpen,
  Visibility,
} from "@mui/icons-material";
import { getInfoToolPanelState } from "./Playground/features/eventHandlers";
import ShareModal from "./Playground/components/ShareModal";
import ConfirmationModal from "./Playground/components/ConfirmationModal";
import WallThicknessPanel from "./Playground/components/WallThicknessPanel";
import { API_URL } from "../config";

const API_BASE_URL = API_URL;
// const API_BASE_URL = 'http://127.0.0.1:8000';

// 1 ft = 10 render units (drawing scale)
const FEET_TO_UNITS = 10;

/**
 * Scales every { x, z } point it finds inside an object/array tree.
 * Leaves width/length/area/height untouched (they remain in feet for your UI).
 */
function scalePlanGeometryForRender<T = any>(plan: T, scale = FEET_TO_UNITS): T {
  const isPoint = (v: any) =>
    v && typeof v === "object" && typeof v.x === "number" && typeof v.z === "number";

  const visit = (node: any): any => {
    if (Array.isArray(node)) return node.map(visit);
    if (node && typeof node === "object") {
      if (isPoint(node)) return { x: node.x * scale, z: node.z * scale };
      const out: any = {};
      for (const k of Object.keys(node)) out[k] = visit(node[k]);
      return out;
    }
    return node;
  };

  return visit(plan);
}


interface PlaygroundProps {
  viewOnly?: boolean;
  aiMode?: boolean;
}

// TypeScript interfaces
interface RoomInstance {
  id: string;
  width: number;
  length: number;
}

interface StandardRoom {
  name: string;
  count: number;
  defaultWidth: number;
  defaultLength: number;
  open: boolean;
  instances: RoomInstance[];
}

interface CustomRoom {
  id: string;
  name: string;
  count: number;
  defaultWidth: number;
  defaultLength: number;
  open: boolean;
  instances: RoomInstance[];
}

interface ApiRoom {
  id: string;
  type: string;
  name: string;
  width: number;
  length: number;
  area: number;
}

interface ApiData {
  site_dimensions: {
    width: number;
    length: number;
    total_area: number;
  };
  rooms: ApiRoom[];
  totals: {
    total_rooms: number;
    total_area: number;
    remaining_area: number;
  };
}

// Updated room data structure with proper TypeScript types
const roomData: StandardRoom[] = [
  {
    name: "Master Bedroom",
    count: 0,
    defaultWidth: 12,
    defaultLength: 10,
    open: false,
    instances: [],
  },
  {
    name: "Bathroom",
    count: 0,
    defaultWidth: 7,
    defaultLength: 4,
    open: false,
    instances: [],
  },
  {
    name: "Kitchen",
    count: 0,
    defaultWidth: 8,
    defaultLength: 12,
    open: false,
    instances: [],
  },
  {
    name: "Living Room",
    count: 0,
    defaultWidth: 12,
    defaultLength: 10,
    open: false,
    instances: [],
  },
  {
    name: "Secondary Room",
    count: 0,
    defaultWidth: 11,
    defaultLength: 9,
    open: false,
    instances: [],
  },
  {
    name: "Children Room",
    count: 0,
    defaultWidth: 10,
    defaultLength: 9,
    open: false,
    instances: [],
  },
  {
    name: "Dining Room",
    count: 0,
    defaultWidth: 11,
    defaultLength: 9,
    open: false,
    instances: [],
  },
  {
    name: "Pooja Room",
    count: 0,
    defaultWidth: 11,
    defaultLength: 9,
    open: false,
    instances: [],
  },
  {
    name: "Balcony",
    count: 0,
    defaultWidth: 10,
    defaultLength: 4,
    open: false,
    instances: [],
  },
];

const PlaygroundWithProvider: React.FC<PlaygroundProps> = ({
  viewOnly = false,
  aiMode = false,
}) => {
  const { projectId, planId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if no projectId or planId (unless AI mode)
  useEffect(() => {
    if (aiMode) {
      if (!projectId) {
        console.log("Missing projectId in AI mode, redirecting to projects");
        navigate("/projects", { replace: true });
        return;
      }
    } else {
      if (!projectId || !planId) {
        console.log("Missing projectId or planId, redirecting to projects");
        navigate("/projects", { replace: true });
        return;
      }
    }
  }, [projectId, planId, navigate, aiMode]);

  // Validate that the project and plan exist
  useEffect(() => {
    const validateProjectAndPlan = async () => {
      if (aiMode) {
        // For AI mode, only validate project exists
        if (!projectId) return;

        try {
          const token = localStorage.getItem("access_token");
          if (!token) {
            navigate("/LoginPage", { replace: true });
            return;
          }

          const projectResponse = await fetch(
            `${API_BASE_URL}/projects/${projectId}/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!projectResponse.ok) {
            throw new Error("Project not found");
          }
        } catch (error) {
          console.error("Error validating project:", error);
          navigate("/projects", { replace: true });
        }
        return;
      }

      if (!projectId || !planId) return;

      // try {
      //   const headers: Record<string, string> = {
      //     "Content-Type": "application/json",
      //   };

      //   // Only add auth headers if not in viewOnly mode
      //   if (!viewOnly) {
      //     const token = localStorage.getItem("access_token");
      //     if (!token) {
      //       navigate("/LoginPage", { replace: true });
      //       return;
      //     }
      //     headers["Authorization"] = `Bearer ${token}`;

      //     // Check if project exists

      //     const projectResponse = await fetch(
      //       `${API_BASE_URL}/projects/${projectId}/`,
      //       {
      //         headers,
      //       }
      //     );

      //     if (!projectResponse.ok) {
      //       throw new Error("Project not found");
      //     }
      //   }

      //   // Check if plan exists
      //   const planResponse = await fetch(
      //     `${API_BASE_URL}/public/projects/${projectId}/plans/${planId}/`,
      //     {
      //       headers,
      //     }
      //   );

      //   if (!planResponse.ok) {
      //     throw new Error("Plan not found");
      //   }
      //   const planData = await planResponse.json();
      //   const cachedPlans = localStorage.getItem("currentPlan");
      //   if (cachedPlans) {
      //     let plans = JSON.parse(cachedPlans);
      //     plans = {
      //       ...plans,
      //       [`${projectId}/${planId}`]: planData,
      //     };
      //     localStorage.setItem("currentPlan", JSON.stringify(plans));
      //   } else {
      //     const plans = {
      //       [`${projectId}/${planId}`]: planData,
      //     };
      //     localStorage.setItem("currentPlan", JSON.stringify(plans));
      //   }
      // } catch (error) {
      //   console.error("Error validating project/plan:", error);
      //   if (!viewOnly) {
      //     navigate("/projects", { replace: true });
      //   } else {
      //     // For viewOnly, show an error page or message
      //     console.error("Shared plan not accessible");
      //   }
      // }
    };
    validateProjectAndPlan();
  }, [projectId, planId, navigate, viewOnly, aiMode]);

  // Don't render if missing required params
  if (!projectId || (!aiMode && !planId)) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f7f7",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div className="loading-spinner"></div>
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <FloorPlanProvider
      projectId={projectId}
      planId={aiMode ? "ai-create" : planId!}
      viewOnly={viewOnly}
    >
      <PlaygroundContent viewOnly={viewOnly} aiMode={aiMode} />
    </FloorPlanProvider>
  );
};

const PlaygroundContent: React.FC<{ viewOnly?: boolean; aiMode?: boolean }> = ({
  viewOnly = false,
  aiMode = false,
}) => {
  const {
    visualizationOptions,
    activeTool,
    setActiveTool,
    activeBuildTool,
    setActiveBuildTool,
    isDrawingActive,
    hasChanges,
    saveFloorPlanChanges,
    resetFloorPlanChanges,
    selectedRoomIds,
    isZoomingDisabled,
    floorPlanData,
    isLoadingData,
    isSaving,
    unitSystem
  } = useFloorPlan();

  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { projectId, planId } = useParams();
  const navigate = useNavigate();

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMiniModalOpen, setIsMiniModalOpen] = useState(false);
  const [rooms, setRooms] = useState<StandardRoom[]>(roomData);
  const [customRooms, setCustomRooms] = useState<CustomRoom[]>([]); // Properly typed custom rooms
  const [showVisualizationPanel, setShowVisualizationPanel] = useState(false);
  const [showToolPanel, setShowToolPanel] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [allottedWidth, setAllottedWidth] = useState(30);
  const [allottedHeight, setAllottedHeight] = useState(40);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isPromptMode, setIsPromptMode] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const [touchStartDistance, setTouchStartDistance] = useState(0);
  const [isRoomDraggingLocked, setIsRoomDraggingLocked] = useState(true);
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);

  useEffect(() => {
    window.isRoomDraggingLocked = isRoomDraggingLocked;
  }, [isRoomDraggingLocked]);

  const toggleRoomDraggingLock = useCallback(() => {
    setIsRoomDraggingLocked((prev) => !prev);
  }, []);

  // Updated room count handler for individual instances with proper types
  const updateRoomCount = (index: number, delta: number) => {
    setRooms((prevRooms) =>
      prevRooms.map((room, i) => {
        if (i === index) {
          const newCount = Math.max(0, room.count + delta);
          let newInstances = [...room.instances];

          if (delta > 0) {
            // Adding a room - create new instance with default dimensions
            for (let j = 0; j < delta; j++) {
              newInstances.push({
                id: `${room.name.toLowerCase().replace(/\s+/g, "_")}_${newInstances.length + 1
                  }`,
                width: room.defaultWidth,
                length: room.defaultLength,
              });
            }
          } else if (delta < 0) {
            // Removing rooms - remove from the end
            newInstances = newInstances.slice(0, newCount);
          }

          return { ...room, count: newCount, instances: newInstances };
        }
        return room;
      })
    );
  };

  // Updated room size handler for individual instances with proper types
  const updateRoomInstanceSize = (
    roomIndex: number,
    instanceIndex: number,
    field: keyof RoomInstance,
    value: number
  ) => {
    setRooms((prevRooms) =>
      prevRooms.map((room, i) => {
        if (i === roomIndex) {
          const newInstances = room.instances.map((instance, j) => {
            if (j === instanceIndex) {
              return { ...instance, [field]: value };
            }
            return instance;
          });
          return { ...room, instances: newInstances };
        }
        return room;
      })
    );
  };

  // Custom room handlers with proper types
  const addCustomRoom = () => {
    const newCustomRoom: CustomRoom = {
      id: `custom_${Date.now()}`,
      name: "",
      count: 1,
      defaultWidth: 10,
      defaultLength: 10,
      open: true,
      instances: [
        {
          id: `custom_${Date.now()}_1`,
          width: 10,
          length: 10,
        },
      ],
    };
    setCustomRooms((prev) => [...prev, newCustomRoom]);
  };

  const updateCustomRoomName = (customRoomId: string, newName: string) => {
    setCustomRooms((prev) =>
      prev.map((room) =>
        room.id === customRoomId ? { ...room, name: newName } : room
      )
    );
  };

  const updateCustomRoomCount = (customRoomId: string, delta: number) => {
    setCustomRooms((prev) =>
      prev.map((room) => {
        if (room.id === customRoomId) {
          const newCount = Math.max(0, room.count + delta);
          let newInstances = [...room.instances];

          if (delta > 0) {
            for (let j = 0; j < delta; j++) {
              newInstances.push({
                id: `${customRoomId}_${newInstances.length + 1}`,
                width: room.defaultWidth,
                length: room.defaultLength,
              });
            }
          } else if (delta < 0) {
            newInstances = newInstances.slice(0, newCount);
          }

          return { ...room, count: newCount, instances: newInstances };
        }
        return room;
      })
    );
  };

  const updateCustomRoomInstanceSize = (
    customRoomId: string,
    instanceIndex: number,
    field: keyof RoomInstance,
    value: number
  ) => {
    setCustomRooms((prev) =>
      prev.map((room) => {
        if (room.id === customRoomId) {
          const newInstances = room.instances.map((instance, j) => {
            if (j === instanceIndex) {
              return { ...instance, [field]: value };
            }
            return instance;
          });
          return { ...room, instances: newInstances };
        }
        return room;
      })
    );
  };

  const removeCustomRoom = (customRoomId: string) => {
    setCustomRooms((prev) => prev.filter((room) => room.id !== customRoomId));
  };

  // Calculate totals including custom rooms with proper types
  const calculateTotals = () => {
    const standardRoomsArea = rooms.reduce((sum, room) => {
      return (
        sum +
        room.instances.reduce((instanceSum, instance) => {
          return instanceSum + instance.width * instance.length;
        }, 0)
      );
    }, 0);

    const customRoomsArea = customRooms.reduce((sum, room) => {
      return (
        sum +
        room.instances.reduce((instanceSum, instance) => {
          return instanceSum + instance.width * instance.length;
        }, 0)
      );
    }, 0);

    const totalRoomCount =
      rooms.reduce((sum, room) => sum + room.count, 0) +
      customRooms.reduce((sum, room) => sum + room.count, 0);

    return {
      totalArea: standardRoomsArea + customRoomsArea,
      totalRooms: totalRoomCount,
    };
  };

  const { totalArea, totalRooms } = calculateTotals();
  const siteArea = allottedWidth * allottedHeight;
  const isAreaExceeded = totalArea > siteArea;
  const isGenerateDisabled = totalRooms === 0 || isAreaExceeded;

  // Function to prepare data for backend API with proper types
  const prepareApiData = (): ApiData => {
    const apiRooms: ApiRoom[] = [];

    // Add standard rooms
    rooms.forEach((room) => {
      room.instances.forEach((instance, index) => {
        apiRooms.push({
          id: instance.id,
          type: room.name,
          name: `${room.name} ${index + 1}`,
          width: instance.width,
          length: instance.length,
          area: instance.width * instance.length,
        });
      });
    });

    // Add custom rooms
    customRooms.forEach((room) => {
      room.instances.forEach((instance, index) => {
        apiRooms.push({
          id: instance.id,
          type: room.name || "Custom Room",
          name: `${room.name || "Custom Room"} ${index + 1}`,
          width: instance.width,
          length: instance.length,
          area: instance.width * instance.length,
        });
      });
    });

    return {
      site_dimensions: {
        width: allottedWidth,
        length: allottedHeight,
        total_area: siteArea,
      },
      rooms: apiRooms,
      totals: {
        total_rooms: totalRooms,
        total_area: totalArea,
        remaining_area: siteArea - totalArea,
      },
    };
  };

  const deleteCustomRoom = (roomId: string) => {
    setCustomRooms((prev) => prev.filter((room) => room.id !== roomId));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "+" || e.key === "-" || e.key === "=") {
          e.preventDefault();
        }
      }

      if (
        e.key === "Escape" &&
        (activeBuildTool === "drawWall" || activeBuildTool === "drawRoom")
      ) {
        exitDrawingMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeBuildTool]);

  useEffect(() => {
    const selectedWallId =
      selectedRoomIds.length === 1 ? selectedRoomIds[0] : null;
    const selectedRoom = selectedWallId
      ? floorPlanData.rooms.find((room) => room.id === selectedWallId)
      : null;
    const isStandaloneWall =
      selectedRoom &&
      selectedRoom.room_type === "Wall" &&
      selectedRoom.floor_polygon.length === 2;
    const isIndividualWallSegment =
      selectedWallId && selectedWallId.includes("-wall-");
    const isWallSelected = isStandaloneWall || isIndividualWallSegment;

    if (isWallSelected && showVisualizationPanel) {
      setShowVisualizationPanel(false);
      if (activeTool === "colors") {
        setActiveTool("design");
      }
    }
  }, [
    selectedRoomIds,
    floorPlanData.rooms,
    showVisualizationPanel,
    activeTool,
    setActiveTool,
  ]);

  useEffect(() => {
    const preventNavigation = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", preventNavigation, {
      passive: false,
    });

    return () => {
      document.removeEventListener("touchmove", preventNavigation);
    };
  }, [isDragging]);

  const scaledPosition = {
    x: position.x * scale,
    y: position.y * scale,
  };

  const exitDrawingMode = () => {
    setActiveBuildTool(null);
    setActiveTool("build");
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (hasChanges) {
        e.preventDefault();
        window.history.pushState(null, "", window.location.pathname);
        setPendingNavigation(`/projects/${projectId}/plans`);
        setShowLeaveModal(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.pathname);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasChanges, projectId]);

  useEffect(() => {
    const targetElement = containerRef.current;
    if (!targetElement) return;

    const handleWheel = (e: WheelEvent) => {
      if (
        isZoomingDisabled ||
        activeBuildTool === "drawWall" ||
        activeBuildTool === "drawRoom"
      ) {
        e.preventDefault();
        return;
      }

      if (isModalOpen || isDrawingActive) return;

      const isMouseWheel = Math.abs(e.deltaY) >= 100 || e.deltaMode === 1;

      if (isMouseWheel) {
        if (e.ctrlKey) {
          e.preventDefault();
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          setScale((prevScale) =>
            Math.min(Math.max(0.1, prevScale * delta), 4000)
          );
        } else {
          e.preventDefault();
        }
        return;
      }

      if (e.ctrlKey) {
        e.preventDefault();

        if (!isZoomingDisabled) {
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          setScale((prevScale) =>
            Math.min(Math.max(0.1, prevScale * delta), 4000)
          );
        }
      } else {
        if (
          activeTool === "project" ||
          activeTool === "build" ||
          activeTool === "colors" ||
          activeTool === "help" ||
          activeTool === "exports" ||
          activeTool === "design" ||
          activeTool === ""
        ) {
          // Only allow panning if there are actual rooms (total area > 0)
          if (floorPlanData.total_area > 0) {
            setPosition((prev) => ({
              x: prev.x - e.deltaX,
              y: prev.y - e.deltaY,
            }));
          }
        }
      }
    };

    targetElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      targetElement.removeEventListener("wheel", handleWheel);
    };
  }, [
    isModalOpen,
    scale,
    isDrawingActive,
    activeBuildTool,
    isZoomingDisabled,
    activeTool,
    floorPlanData.total_area,
    viewOnly,
  ]);

  // Handle AI modal display based on URL parameters
  // Handle AI modal display based on URL parameters or AI mode
  useEffect(() => {
    if (viewOnly) return;

    if (aiMode) {
      setIsModalOpen(true);
      return;
    }

    const urlParams = new URLSearchParams(location.search);
    const createOption = urlParams.get("createOption");

    if (createOption === "ai") {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
      setIsMiniModalOpen(false);
    }
  }, [location.search, aiMode, viewOnly]);

  const getDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleShare = () => {
    if (viewOnly) return;
    setShowShareModal(true);
  };

  const handleNavigation = (path: string) => {
    if (viewOnly) return;
    if (hasChanges) {
      setPendingNavigation(path);
      setShowLeaveModal(true);
    } else {
      navigate(path);
    }
  };

  const handleSaveAndNavigate = async () => {
    try {
      await saveFloorPlanChanges();
      setShowLeaveModal(false);
      if (pendingNavigation) {
        navigate(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      console.error("Error saving before navigation:", error);
    }
  };

  const handleDontSaveAndNavigate = () => {
    if (isSaving) return;
    setShowLeaveModal(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  const handleCancelNavigation = () => {
    if (isSaving) return;
    setShowLeaveModal(false);
    setPendingNavigation(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (viewOnly) return;
    if (activeBuildTool === "drawWall" || activeBuildTool === "drawRoom") {
      e.preventDefault();
      return;
    }

    if (isModalOpen || isDrawingActive) return;

    if (document.body.getAttribute("data-room-touch-interaction") === "true") {
      return;
    }

    if (e.touches.length === 2) {
      const distance = getDistance(e.touches);
      setTouchStartDistance(distance);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePosition({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    if (viewOnly) {
      console.log("View only - touch move ignored");
      return;
    }
    if (activeBuildTool === "drawWall" || activeBuildTool === "drawRoom") {
      e.preventDefault();
      return;
    }

    if (isModalOpen || isDrawingActive) return;

    if (document.body.getAttribute("data-room-touch-interaction") === "true") {
      return;
    }

    e.preventDefault();

    if (e.touches.length === 2) {
      if (isZoomingDisabled && activeTool !== "project") {
        return;
      }

      const distance = getDistance(e.touches);
      if (touchStartDistance > 0) {
        const delta = distance / touchStartDistance;
        setScale((prevScale) =>
          Math.min(Math.max(0.1, prevScale * delta), 4000)
        );
        setTouchStartDistance(distance);
      }
    } else if (e.touches.length === 1 && isDragging) {
      if (floorPlanData.total_area > 0) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastMousePosition.x;
        const dy = touch.clientY - lastMousePosition.y;
        setPosition((prev) => ({
          x: prev.x + dx / scale,
          y: prev.y + dy / scale,
        }));
        setLastMousePosition({ x: touch.clientX, y: touch.clientY });
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>): void => {
    // if (viewOnly) return
    setIsDragging(false);
    setTouchStartDistance(0);
  };

  useEffect(() => {
    const infoPanelState = getInfoToolPanelState();

    if (
      selectedRoomIds &&
      selectedRoomIds.length > 0 &&
      activeTool !== "project" &&
      activeTool !== "objects" &&
      activeTool !== "info" &&
      activeTool !== "colors" &&
      activeTool !== "build" &&
      (!infoPanelState.isActive ||
        infoPanelState.activeOption !== "setRoomtype")
    ) {
      setActiveTool("project");
    }
  }, [selectedRoomIds, activeTool]);

  useEffect(() => {
    const element = document.querySelector(".absolute.inset-0") as HTMLElement;
    if (element) {
      const touchStartWrapper = (e: TouchEvent) => {
        if (
          document.body.getAttribute("data-room-touch-interaction") === "true"
        ) {
          return;
        }
        // Block touchpad events when total area is 0
        if (floorPlanData.total_area === 0) {
          e.preventDefault();
          return;
        }
        (handleTouchStart as unknown as EventListener)(e);
      };

      const touchMoveWrapper = (e: TouchEvent) => {
        if (
          document.body.getAttribute("data-room-touch-interaction") === "true"
        ) {
          return;
        }
        // Block touchpad events when total area is 0
        if (floorPlanData.total_area === 0) {
          e.preventDefault();
          return;
        }
        (handleTouchMove as unknown as EventListener)(e);
      };

      element.addEventListener("touchstart", touchStartWrapper, {
        passive: false,
      });
      element.addEventListener("touchmove", touchMoveWrapper, {
        passive: false,
      });
      element.addEventListener(
        "touchend",
        handleTouchEnd as unknown as EventListener
      );

      return () => {
        element.removeEventListener("touchstart", touchStartWrapper);
        element.removeEventListener("touchmove", touchMoveWrapper);
        element.removeEventListener(
          "touchend",
          handleTouchEnd as unknown as EventListener
        );
      };
    }
  }, [
    scale,
    isDragging,
    lastMousePosition,
    touchStartDistance,
    isModalOpen,
    activeBuildTool,
    isZoomingDisabled,
    activeTool,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    floorPlanData.total_area,
  ]);

  const handleWheel = (e: React.WheelEvent) => {
    if (
      isDrawingActive ||
      activeBuildTool === "drawWall" ||
      activeBuildTool === "drawRoom"
    ) {
      e.preventDefault();
      return;
    }
  };

  const toggleDropdown = (index: number) => {
    setRooms((prevRooms) =>
      prevRooms.map((room, i) =>
        i === index ? { ...room, open: !room.open } : room
      )
    );
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    // if (viewOnly) return

    if (activeBuildTool === "drawWall" || activeBuildTool === "drawRoom") {
      return;
    }

    if (isDrawingActive) return;

    setIsDragging(true);
    setLastMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    // if (viewOnly) return
    if (
      !isDragging ||
      isDrawingActive ||
      activeBuildTool === "drawWall" ||
      activeBuildTool === "drawRoom"
    )
      return;

    if (floorPlanData.total_area > 0) {
      const dx = event.clientX - lastMousePosition.x;
      const dy = event.clientY - lastMousePosition.y;
      setPosition((prev) => ({
        x: prev.x + dx / scale,
        y: prev.y + dy / scale,
      }));
      setLastMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    // if (viewOnly) return
    setIsDragging(false);
  };

  const handleToolSelected = (toolId: string) => {
    setActiveTool(toolId);

    if (toolId === "colors") {
      setShowVisualizationPanel(true);
      setShowToolPanel(false);
    } else if (toolId !== "design" && toolId !== "project") {
      setShowToolPanel(true);
      setShowVisualizationPanel(false);
    } else if (toolId === "project") {
      setShowToolPanel(true);
      setShowVisualizationPanel(false);
    } else {
      setShowToolPanel(false);
      setShowVisualizationPanel(false);
    }
  };

  const handleCloseToolPanel = () => {
    setShowToolPanel(false);
    setActiveTool("design");
    setActiveBuildTool(null);
  };

  const handleCloseVisualizationPanel = () => {
    setShowVisualizationPanel(false);
    setActiveTool("design");
  };

  const handleSaveChanges = () => {
    if (viewOnly) return;
    saveFloorPlanChanges();
  };

  const handleResetChanges = () => {
    if (viewOnly) return;
    resetFloorPlanChanges();
  };

  const renderViewOnlyIndicator = () => {
    if (!viewOnly) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "10px 15px",
          borderRadius: "8px",
          fontSize: "14px",
          fontWeight: "bold",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <Visibility style={{ marginRight: "8px", fontSize: "20px" }} />
        View Only Mode
      </div>
    );
  };

  const isMobile = window.innerWidth < 850;

  // Show loading state if data is being loaded
  if (isLoadingData) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f7f7",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <div className="loading-spinner"></div>
          <p className="loading-text">Mapping the space....</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${visualizationOptions.darkMode ? "dark-mode" : ""
        }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        overflow: "hidden",
        width: "100%",
        height: "100%",
        position: "fixed",
        overscrollBehavior: "none",
        touchAction: "pan-y",
      }}
    >
      {renderViewOnlyIndicator()}
      {!viewOnly && !activeBuildTool && <UnitSwitch />}
      {viewOnly && (
        <CreateCopyButton
          currentUser={null}
          currentProjectID={projectId!}
          currentPlanID={planId!}
          size="default"
          buttonText="Create a Copy"
        />
      )}

      <InfiniteGrid
        width={window.innerWidth}
        height={window.innerHeight}
        scale={scale}
        position={position}
        rotation={rotation}
        visualizationOptions={visualizationOptions}
        viewOnly={viewOnly}
      />
      <div className="compass-container">
        <Compass
          size={window.innerWidth < 768 ? 45 : 60}
          rotation={rotation}
          onRotate={setRotation}
        />
      </div>

      {showVisualizationPanel && (
        <VisualizationPanel onClose={handleCloseVisualizationPanel} />
      )}

      {/* 2D/3D Toggle - Always show */}
      <div
        className="three-d-icon"
        style={{
          display: "flex",
          border: "1px solid black",
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: "#f5f5f5",
          width: "70px",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        <div
          onClick={() => {
            const path = viewOnly
              ? `/view/3D/${projectId}/${planId}`
              : `/3D/${projectId}/${planId}`;
            if (viewOnly) {
              navigate(path);
            } else {
              handleNavigation(path);
            }
          }}
          style={{
            flex: 1,
            padding: "8px 0",
            backgroundColor: "black",
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          3D
        </div>
      </div>

      {/* EDITING FEATURES - Only show when NOT viewOnly */}
      {!viewOnly && (
        <>
          <VerticalToolbar onToolSelected={handleToolSelected} />

          {(activeTool === "project" ||
            (activeTool &&
              activeTool !== "design" &&
              activeTool !== "colors")) && (
              <ToolPanel activeTool={activeTool} onClose={handleCloseToolPanel} />
            )}

          <WallThicknessPanel />

          {/* Drawing mode indicators */}
          {(activeBuildTool === "drawWall" ||
            activeBuildTool === "drawRoom" ||
            activeBuildTool === "drawBoundry") && (
              <div
                style={{
                  position: "fixed",
                  top: "15px",
                  left: "49.5%",
                  transform: "translateX(-50%)",
                  padding: "10px 20px",
                  width: "auto",
                  backgroundColor: "rgba(33, 150, 243, 0.8)",
                  color: "white",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  zIndex: 2000,
                  textAlign: "center",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                }}
              >
                {activeBuildTool === "drawWall"
                  ? "Wall Drawing Mode: Click to start, click again to finish"
                  : activeBuildTool === "drawBoundry"
                    ? "Boundary Drawing Mode: Click to start, click again to finish"
                    : "Room Drawing Mode: Click to start, click again to finish"}
              </div>
            )}
          {(activeBuildTool === "drawWall" ||
            activeBuildTool === "drawRoom" ||
            activeBuildTool === "drawBoundry") && (
              <div
                style={{
                  position: "fixed",
                  bottom: "30px",
                  left: "13.5%",
                  transform: "translateX(-50%)",
                  zIndex: 1000,
                  padding: "5px 12px",
                  backgroundColor: "rgba(255, 0, 0, 0.7)",
                  color: "white",
                  borderRadius: "5px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                }}
                onClick={exitDrawingMode}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  exitDrawingMode();
                }}
              >
                <span style={{ fontSize: "16px" }}>✕</span>
                Exit Drawing Mode
              </div>
            )}

          {/* Share Button */}
          <div
            className="three-d-icon1"
            style={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
          >
            <div className="share-button-container">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid black",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  cursor: "pointer",
                  backgroundColor: "black",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
                onClick={handleShare}
              >
                <Share style={{ marginRight: "8px", fontSize: "medium" }} />
                Share
              </div>
            </div>
          </div>

          {/* Lock/unlock button */}
          <div
            className="lock-unlock-button"
            style={{
              position: "fixed",
              top: "100px",
              right: "40px",
              zIndex: 101,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              backgroundColor: "white",
              border: "1px solid black",
              borderRadius: "8px",
              cursor: "pointer",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none",
            }}
            onClick={toggleRoomDraggingLock}
            title={
              isRoomDraggingLocked
                ? "Click to unlock room dragging"
                : "Click to lock room dragging"
            }
          >
            {isRoomDraggingLocked ? (
              <Lock style={{ fontSize: "24px", color: "black" }} />
            ) : (
              <LockOpen style={{ fontSize: "24px", color: "black" }} />
            )}
          </div>

          {/* Save/Reset buttons */}
          {hasChanges && (
            <div
              className="save-reset-container"
              style={{
                position: "fixed",
                display: "flex",
                bottom: "30px",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "auto",
                margin: "auto",
                zIndex: 1000,
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
              }}
            >
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <button
                className="save-button"
                onClick={handleSaveChanges}
                disabled={isSaving}
                style={{
                  opacity: isSaving ? 0.7 : 1,
                  cursor: isSaving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {isSaving && (
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #ffffff",
                      borderTop: "2px solid transparent",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
                <b>{isSaving ? "Saving..." : "Save Changes"}</b>
              </button>
              <button className="undo-button" onClick={handleResetChanges}>
                <b>Reset Changes</b>
              </button>
            </div>
          )}

          {/* AI Modal */}
          {isModalOpen && (
            <div
              className="modal-overlay"
              style={{
                zIndex: 1000,
              }}
            >
              <div className="modal">
                <div className="modal-header">
                  <h2
                    style={{
                      fontWeight: "bolder",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      MozUserSelect: "none",
                      msUserSelect: "none",
                      color: "black",
                    }}
                  >
                    House Parameters
                  </h2>
                  <button
                    className="close-btn"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsMiniModalOpen(true);
                    }}
                  >
                    ✖
                  </button>
                </div>

                {/* Mode Toggle */}
                <div style={{
                  display: "flex",
                  gap: "8px",
                  padding: "0 20px 16px 20px",
                  borderBottom: "1px solid #e0e0e0",
                }}>
                  <button
                    onClick={() => setIsPromptMode(false)}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: isPromptMode ? "normal" : "600",
                      backgroundColor: isPromptMode ? "#f5f5f5" : "#000000",
                      color: isPromptMode ? "#666" : "white",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Residential Mode
                  </button>
                  <button
                    onClick={() => setIsPromptMode(true)}
                    style={{
                      flex: 1,
                      padding: "8px 16px",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: isPromptMode ? "600" : "normal",
                      backgroundColor: isPromptMode ? "#000000" : "#f5f5f5",
                      color: isPromptMode ? "white" : "#666",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Prompt Mode
                  </button>
                </div>

                {isPromptMode ? (
                  // Prompt Mode UI
                  <div style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}>
                    <div style={{
                      backgroundColor: "#f8f9fa",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                    }}>
                      <p style={{
                        fontSize: "14px",
                        color: "#555",
                        margin: 0,
                        lineHeight: "1.5",
                      }}>
                        Describe your house requirements in natural language. For example: "I want a 3 bedroom house with a large kitchen and 2 bathrooms on a 2000 sq ft plot."
                      </p>
                    </div>

                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}>
                      <label style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#333",
                      }}>
                        Your Requirements
                      </label>
                      <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        placeholder="Describe your dream house..."
                        style={{
                          minHeight: "200px",
                          padding: "12px",
                          fontSize: "14px",
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          resize: "vertical",
                          fontFamily: "inherit",
                          lineHeight: "1.5",
                        }}
                      />
                    </div>

                    <button
                      onClick={async () => {
                        if (!promptText.trim()) {
                          alert("Please enter your requirements");
                          return;
                        }

                        setIsGeneratingWithAI(true);
                        try {
                          const token = localStorage.getItem("access_token");
                          if (!token) {
                            navigate("/LoginPage", { replace: true });
                            return;
                          }

                          // Call prompt-based AI endpoint
                          const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/ai-generate-prompt/`, {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ prompt: promptText }),
                          });

                          if (!response.ok) {
                            const errText = await response.text();
                            throw new Error(`Backend error (${response.status}): ${errText}`);
                          }

                          const data = await response.json();
                          const floorPlans = data.floor_plans;
                          const floorPlansForRender = floorPlans.map((plan: any) => scalePlanGeometryForRender(plan, 10));

                          setIsModalOpen(false);

                          navigate("/proposals", {
                            state: {
                              projectData: {
                                id: projectId,
                                name: "Current Project",
                                budget: "200",
                                currency: "USD",
                              },
                              roomData: null,
                              aiGeneratedPlans: floorPlansForRender,
                              aiMode: true,
                            },
                          });
                        } catch (error) {
                          console.error("Error generating AI floor plans:", error);
                          alert("Failed to generate floor plans. Please try again.");
                        } finally {
                          setIsGeneratingWithAI(false);
                        }
                      }}
                      disabled={isGeneratingWithAI || !promptText.trim()}
                      style={{
                        padding: "12px",
                        backgroundColor: "#000000",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: isGeneratingWithAI || !promptText.trim() ? "not-allowed" : "pointer",
                        opacity: isGeneratingWithAI || !promptText.trim() ? 0.5 : 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      {isGeneratingWithAI ? (
                        <>
                          <div
                            style={{
                              width: "16px",
                              height: "16px",
                              border: "2px solid #ffffff",
                              borderTop: "2px solid transparent",
                              borderRadius: "50%",
                              animation: "spin 1s linear infinite",
                              display: "inline-block",
                            }}
                          />
                          Generating Plans...
                        </>
                      ) : (
                        "✨ Generate Plan from Prompt"
                      )}
                    </button>

                    {isGeneratingWithAI && (
                      <p style={{
                        fontSize: "12px",
                        color: "#f44336",
                        textAlign: "center",
                        margin: 0,
                      }}>
                        Your floor plan is on the way — this might take a bit.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="room-list">
                      <h3>Site Dimensions</h3>
                      <div className="input-container">
                        <label>Width (ft):</label>
                        <input
                          type="number"
                          value={allottedWidth}
                          onChange={(e) =>
                            setAllottedWidth(parseFloat(e.target.value) || 0)
                          }
                        />
                        <label>Length (ft):</label>
                        <input
                          type="number"
                          value={allottedHeight}
                          onChange={(e) =>
                            setAllottedHeight(parseFloat(e.target.value) || 0)
                          }
                        />
                      </div>
                      <p className="total-area">
                        Total Area:{" "}
                        <span>
                          <b>
                            {formatImperialArea(allottedWidth * allottedHeight, unitSystem)}
                          </b>
                        </span>
                      </p>

                      {isAreaExceeded && (
                        <p className="warning">
                          ⚠ Your room areas exceed the site area constraint!
                        </p>
                      )}
                    </div>

                    <div className="room-list">
                      <h3>Rooms</h3>

                      {/* Standard Rooms */}
                      {(showAll ? rooms : rooms.slice(0, 3)).map((room, index) => (
                        <div key={index} className="room-item">
                          <div
                            className="room-header"
                            onClick={() => toggleDropdown(index)}
                          >
                            <span
                              className="room-name"
                              style={{ textAlign: "left" }}
                            >
                              {room.name}
                            </span>
                            <span className="arrow-icon">
                              {room.open ? "▾" : "▸"}
                            </span>
                            <div className="counter">
                              <button
                                style={{ fontSize: "15px", color: "black" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateRoomCount(index, -1);
                                }}
                              >
                                -
                              </button>
                              <span>{room.count}</span>
                              <button
                                style={{ fontSize: "15px", color: "black" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateRoomCount(index, 1);
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          {room.open &&
                            room.instances.map((instance, instanceIndex) => (
                              <div key={instanceIndex} className="room-details">
                                <div
                                  className={`room-box ${instanceIndex === 0 ? "active" : ""
                                    }`}
                                >
                                  <span>
                                    ⬜ {room.name} {instanceIndex + 1}
                                  </span>
                                  <div className="size-input">
                                    <input
                                      type="number"
                                      value={instance.width}
                                      onChange={(e) =>
                                        updateRoomInstanceSize(
                                          index,
                                          instanceIndex,
                                          "width",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                    />
                                    ×
                                    <input
                                      type="number"
                                      value={instance.length}
                                      onChange={(e) =>
                                        updateRoomInstanceSize(
                                          index,
                                          instanceIndex,
                                          "length",
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ))}

                      {/* Custom Rooms */}
                      {customRooms.map((customRoom) => (
                        <div key={customRoom.id} className="room-item">
                          <div
                            className="room-header"
                            onClick={() => {
                              setCustomRooms((prev) =>
                                prev.map((room) =>
                                  room.id === customRoom.id
                                    ? { ...room, open: !room.open }
                                    : room
                                )
                              );
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                flex: 1,
                              }}
                            >
                              <input
                                type="text"
                                placeholder="Enter room name"
                                value={customRoom.name}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateCustomRoomName(
                                    customRoom.id,
                                    e.target.value
                                  );
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  border: "1px solid #ccc",
                                  borderRadius: "4px",
                                  padding: "4px 8px",
                                  fontSize: "14px",
                                  width: "150px",
                                  marginRight: "10px",
                                }}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteCustomRoom(customRoom.id);
                                }}
                                style={{
                                  padding: "4px 8px",
                                  backgroundColor: "#ff4444",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  marginLeft: "auto",
                                  marginRight: "10px",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                            <span className="arrow-icon">
                              {customRoom.open ? "▾" : "▸"}
                            </span>
                            <div className="counter">
                              <button
                                style={{ fontSize: "15px", color: "black" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCustomRoomCount(customRoom.id, -1);
                                }}
                              >
                                -
                              </button>
                              <span>{customRoom.count}</span>
                              <button
                                style={{ fontSize: "15px", color: "black" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCustomRoomCount(customRoom.id, 1);
                                }}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          {customRoom.open &&
                            customRoom.instances.map(
                              (instance, instanceIndex) => (
                                <div
                                  key={instanceIndex}
                                  className="room-details"
                                >
                                  <div
                                    className={`room-box ${instanceIndex === 0 ? "active" : ""
                                      }`}
                                  >
                                    <span>
                                      ⬜ {customRoom.name} {instanceIndex + 1}
                                    </span>
                                    <div className="size-input">
                                      <input
                                        type="number"
                                        value={instance.width}
                                        onChange={(e) =>
                                          updateCustomRoomInstanceSize(
                                            customRoom.id,
                                            instanceIndex,
                                            "width",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                      ×
                                      <input
                                        type="number"
                                        value={instance.length}
                                        onChange={(e) =>
                                          updateCustomRoomInstanceSize(
                                            customRoom.id,
                                            instanceIndex,
                                            "length",
                                            parseFloat(e.target.value) || 0
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                        </div>
                      ))}

                      {/* Add Custom Room Button */}
                      <button
                        onClick={addCustomRoom}
                        style={{
                          width: "98%",
                          padding: "10px",
                          marginTop: "10px",
                          backgroundColor: "#f0f0f0",
                          border: "2px dashed #ccc",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        + Add Custom Room
                      </button>

                      <button
                        className="see-more-btn"
                        onClick={() => setShowAll(!showAll)}
                        style={{ color: "black", marginTop: "10px" }}
                      >
                        {showAll ? "− See less" : "+ See more"}
                      </button>
                    </div>

                    <hr />
                    <div className="total-info">
                      <p className="total-area">
                        Sum of Total area:{" "}
                        <span>
                          <b>{formatImperialArea(totalArea, unitSystem)}</b>
                        </span>
                      </p>
                      <p className="total-rooms">
                        Total Rooms:{" "}
                        <span>
                          <b>{totalRooms}</b>
                        </span>
                      </p>
                      {isAreaExceeded && (
                        <p
                          className="pleasetext"
                          style={{
                            color: "red",
                            fontSize: "12px",
                            margin: "5px 0",
                          }}
                        >
                          Room areas exceed site area by{" "}
                          {formatImperialArea(totalArea - siteArea, unitSystem)}
                        </p>
                      )}
                    </div>

                    <div className="modal-actions">
                      <button
                        onClick={async () => {
                          if (!isGenerateDisabled) {
                            setIsGeneratingWithAI(true);
                            try {
                              const roomData = prepareApiData();

                              const token = localStorage.getItem("access_token");
                              if (!token) {
                                navigate("/LoginPage", { replace: true });
                                return;
                              }

                              // Call AI API to generate 6 floor plans
                              const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/ai-generate/`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ roomData: roomData }),
                              });

                              if (!response.ok) {
                                const errText = await response.text();
                                throw new Error(`Backend error (${response.status}): ${errText}`);
                              }

                              const data = await response.json();
                              const floorPlans = data.floor_plans;
                              const floorPlansForRender = floorPlans.map((plan: any) => scalePlanGeometryForRender(plan, 10));

                              setIsModalOpen(false);

                              // Navigate to proposals with AI generated plans
                              navigate("/proposals", {
                                state: {
                                  projectData: {
                                    id: projectId,
                                    name: "Current Project",
                                    budget: "200",
                                    currency: "USD",
                                  },
                                  roomData: prepareApiData(),
                                  aiGeneratedPlans: floorPlansForRender, // Pass the 6 AI plans
                                  aiMode: true,
                                },
                              });
                            } catch (error) {
                              console.error(
                                "Error generating AI floor plans:",
                                error
                              );

                              let errorMessage =
                                "Failed to generate floor plans. Please try again.";
                              if (error instanceof Error) {
                                if (error.message.includes("API key")) {
                                  errorMessage = "OpenAI API key not configured.";
                                } else if (error.message.includes("invalid JSON")) {
                                  errorMessage =
                                    "AI generated invalid response. Please try again.";
                                }
                              }

                              alert(errorMessage);
                            } finally {
                              setIsGeneratingWithAI(false);
                            }
                          }
                        }}
                        className="generate-btn"
                        disabled={isGenerateDisabled || isGeneratingWithAI}
                        style={{
                          opacity:
                            isGenerateDisabled || isGeneratingWithAI ? 0.5 : 1,
                          cursor:
                            isGenerateDisabled || isGeneratingWithAI
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {isGeneratingWithAI ? (
                          <>
                            <div
                              style={{
                                width: "16px",
                                height: "16px",
                                border: "2px solid #ffffff",
                                borderTop: "2px solid transparent",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                display: "inline-block",
                                marginRight: "8px",
                              }}
                            />
                            Generating Plans...
                          </>
                        ) : (
                          "✨Generate Plan"
                        )}
                      </button>
                      {
                        isGeneratingWithAI &&
                        <p
                          className="pleasetext"
                          style={{
                            fontSize: "12px",
                            color: "red",
                            textAlign: "center",
                            marginTop: "5px",
                          }}
                        >
                          Your floor plan is on the way — this might take a bit.</p>
                      }
                      {isGenerateDisabled && (
                        <p
                          className="pleasetext"
                          style={{
                            fontSize: "12px",
                            color: "red",
                            textAlign: "center",
                            marginTop: "5px",
                          }}
                        >
                          {totalRooms === 0
                            ? "Please add at least one room to generate a plan"
                            : "Room areas exceed site area. Please adjust dimensions."}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="back-button-container">
            <div
              onClick={() => handleNavigation(`/projects/${projectId}/plans`)}
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid black",
                borderRadius: "8px",
                padding: "8px 14px",
                cursor: "pointer",
                backgroundColor: "white",
                color: "black",
                fontWeight: "bold",
                fontSize: "14px",
              }}
              className="back"
            >
              <ArrowBack
                style={{
                  marginRight: "8px",
                  fontSize: "22px",
                }}
              />
              Back
            </div>
          </div>

          {/* Share Modal */}
          {showShareModal && (
            <ShareModal
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              floorPlanData={floorPlanData}
              visualizationOptions={visualizationOptions}
              projectId={projectId!}
              planId={planId!}
            />
          )}

          {/* Confirmation Modal */}
          <ConfirmationModal
            isOpen={showLeaveModal}
            onSave={handleSaveAndNavigate}
            onDontSave={handleDontSaveAndNavigate}
            onCancel={handleCancelNavigation}
            isSaving={isSaving}
          />
        </>
      )}

      <ConfirmationModal
        isOpen={showLeaveModal}
        onSave={handleSaveAndNavigate}
        onDontSave={handleDontSaveAndNavigate}
        onCancel={handleCancelNavigation}
        isSaving={isSaving}
      />
    </div>
  );
};

export default PlaygroundWithProvider;

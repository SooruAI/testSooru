import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  FloorPlanData,
  BuildTool,
  Point,
  Label,
  FloorPlanObject,
  FloorPlanDoor,
  FloorPlanWindow,
  DimensionLine,
} from "./features/types";
import { saveFloorPlan } from "./features/save";
import { generateUniqueId } from "./features/drawingTools";
import { view } from "framer-motion";
import { API_URL } from "../../config";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = API_URL;

const getFallbackInitialData = (): FloorPlanData => {
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

export interface VisualizationOptions {
  showMeasurements: boolean;
  showRoomLabels: boolean;
  showGrid: boolean;
  darkMode: boolean;
  colorScheme: "standard" | "monochrome" | "pastel" | "contrast";
  externalWallThickness: number;
  internalWallThickness: number;
}

interface FloorPlanContextType {
  visualizationOptions: VisualizationOptions;
  updateVisualizationOption: <K extends keyof VisualizationOptions>(
    option: K,
    value: VisualizationOptions[K]
  ) => void;
  resetVisualizationOptions: () => void;
  activeTool: string;
  setActiveTool: (tool: string) => void;
  floorPlanData: FloorPlanData;
  setFloorPlanData: React.Dispatch<React.SetStateAction<FloorPlanData>>;
  activeBuildTool: BuildTool;
  setActiveBuildTool: React.Dispatch<React.SetStateAction<BuildTool>>;
  isDrawingActive: boolean;
  setIsDrawingActive: React.Dispatch<React.SetStateAction<boolean>>;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  position: { x: number; y: number };
  setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  defaultScale: number;
  isZoomingDisabled: boolean;
  hasChanges: boolean;
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
  roomRotations: { [key: string]: number };
  setRoomRotations: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  handleRoomTypeUpdate: (roomId: string, newRoomType: string) => void;
  saveFloorPlanChanges: () => void;
  resetFloorPlanChanges: () => void;
  addLabel: (text: string, position: Point) => void;
  addObject: (objectPath: string, position: Point) => void;
  updateObject: (objectId: string, updates: Partial<FloorPlanObject>) => void;
  addDoor: (doorPath: string, position: Point) => void;
  updateDoor: (doorId: string, updates: Partial<FloorPlanDoor>) => void;
  addWindow: (windowPath: string, position: Point) => void;
  updateWindow: (windowId: string, updates: Partial<FloorPlanWindow>) => void;
  captureOriginalState: () => void;
  selectedRoomIds: string[];
  setSelectedRoomIds: React.Dispatch<React.SetStateAction<string[]>>;
  openProjectPanel: (roomId: string) => void;
  drawingWallWidth: number;
  setDrawingWallWidth: React.Dispatch<React.SetStateAction<number>>;
  updateLabel: (labelId: string, updates: Partial<Label>) => void;
  addDimensionLine: (startPoint: Point, endPoint: Point) => void;
  updateDimensionLine: (
    dimensionId: string,
    updates: Partial<DimensionLine>
  ) => void;
  doorWidths: { [key: string]: number };
  setDoorWidths: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  windowWidths: { [key: string]: number };
  setWindowWidths: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  showIndividualWalls: boolean;
  setShowIndividualWalls: React.Dispatch<React.SetStateAction<boolean>>;
  wallWidths: { [key: string]: number };
  setWallWidths: React.Dispatch<
    React.SetStateAction<{ [key: string]: number }>
  >;
  updateWallWidth: (wallId: string, width: number) => void;
  flipDoorHorizontal: (doorId: string) => void;
  flipDoorVertical: (doorId: string) => void;
  flipWindowHorizontal: (windowId: string) => void;
  flipWindowVertical: (windowId: string) => void;

  loadFloorPlanFromAPI: (projectId: string, planId: string) => Promise<void>;
  saveFloorPlanToAPI: (projectId: string, planId: string) => Promise<void>;
  isLoadingData: boolean;

  projectId: string | null;
  planId: string | null;
  isSaving: boolean;
  unitSystem: 'imperial' | 'metric';
setUnitSystem: (unit: 'imperial' | 'metric') => void;
}


const loadVisualizationFromStorage = (projectId: string, planId: string) => {
  try {
    const storageKey = `floorplan_visualization_options_${projectId}_${planId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to load visualization options from localStorage:', error);
  }
  return null;
};

export const defaultVisualizationOptions: VisualizationOptions = {
  showMeasurements: true,
  showRoomLabels: true,
  showGrid: true,
  darkMode: false,
  colorScheme: "standard",
  externalWallThickness: 7,
  internalWallThickness: 4,
};

const FloorPlanContext = createContext<FloorPlanContextType | undefined>(
  undefined
);

export const FloorPlanProvider: React.FC<{ 
  children: ReactNode;
  projectId: string;
  planId: string;
  viewOnly?: boolean;
  aiMode?: boolean;
}> = ({
  children,
  projectId,
  planId,
  viewOnly = false,
  aiMode = false
}) => {
const [visualizationOptions, setVisualizationOptions] = useState<VisualizationOptions>(() => {
  const storedOptions = loadVisualizationFromStorage(projectId, planId);
  return storedOptions ? { ...defaultVisualizationOptions, ...storedOptions } : defaultVisualizationOptions;
});
  const [activeTool, setActiveTool] = useState<string>("design");
  const [floorPlanData, setFloorPlanData] = useState<FloorPlanData>(getFallbackInitialData());
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [activeBuildTool, setActiveBuildTool] = useState<BuildTool>(null);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [roomRotations, setRoomRotations] = useState<{ [key: string]: number }>({});

  const [doorWidths, setDoorWidths] = useState<{ [key: string]: number }>({});
  const [windowWidths, setWindowWidths] = useState<{ [key: string]: number }>({});
  const [wallWidths, setWallWidths] = useState<{ [key: string]: number }>({});

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [drawingWallWidth, setDrawingWallWidth] = useState<number>(7);
  const [showIndividualWalls, setShowIndividualWalls] = useState(true);

  const originalFloorPlanDataRef = useRef<FloorPlanData>(getFallbackInitialData());
  const originalRoomRotationsRef = useRef<{ [key: string]: number }>({});
  const hasStoredOriginal = useRef<boolean>(false);
  const isFlipOperationRef = useRef<boolean>(false);
  const loadedDataRef = useRef<string>('');
  const navigate = useNavigate();

  const defaultScale = window.innerWidth < 850 ? 1.6 : 2.5;
  const [scale, setScale] = useState(defaultScale);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZoomingDisabled, setIsZoomingDisabled] = useState(false);

 const loadFloorPlanFromAPI = useCallback(async (projectId: string, planId: string) => {
    if (aiMode || planId === 'ai-create') {
      console.log('AI mode detected - skipping plan data fetch');
      setIsLoadingData(false);
      return;
    }

    if (isLoadingData) {
      return;
    }

    try {
      setIsLoadingData(true);
      const token = localStorage.getItem('access_token');
      let response = {} as Response;
      let planData = {} as any;
      const localProjectData = localStorage.getItem('userProjects');
      const cachedProject = localProjectData ? JSON.parse(localProjectData).find((p: any) => p.id == projectId) : null;
      const cachedPlan = cachedProject ? cachedProject.plans.find((pl: any) => pl.id == planId) : null;
      if (cachedPlan && cachedPlan.coordinates) {
        console.log('Using cached plan data from localStorage');
        await new Promise((resolve) => setTimeout(resolve, 1));
        planData = cachedPlan;
      }
      if (!planData || !planData.coordinates){
        const cachedCurrntPlanData = localStorage.getItem("currentPlan");
        if (cachedCurrntPlanData) {
          const parsedCurrentPlan = JSON.parse(cachedCurrntPlanData);
          const cachedPlanData = parsedCurrentPlan[`${projectId}/${planId}`];
          if (cachedPlanData && cachedPlanData.coordinates) {
            console.log('Using cached plan data from currentPlan in localStorage');
            await new Promise((resolve) => setTimeout(resolve, 1));
            planData = cachedPlanData;
          }
        }
      }
      if (!planData || !planData.coordinates) {
        if(viewOnly) {
          response = await fetch(`${API_BASE_URL}/public/projects/${projectId}/plans/${planId}/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } else {
          if (!token) {
            throw new Error('No access token found');
          }
    
          response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/${planId}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
  
        if (!response.ok) {
          console.log('API response not ok', response.status);
          if (response.status === 401) {
            localStorage.removeItem('access_token');
            window.location.href = '/LoginPage';
            return;
          }
          navigate("/projects", { replace: true });
          throw new Error(`Failed to fetch plan data: ${response.status}`);
        }
        planData = await response.json();

        if(viewOnly){
          const cachedPlans = localStorage.getItem("currentPlan");
          if (cachedPlans) {
            let plans = JSON.parse(cachedPlans);
            plans = {
              ...plans,
              [`${projectId}/${planId}`]: planData,
            };
            localStorage.setItem("currentPlan", JSON.stringify(plans));
          } else {
            const plans = {
              [`${projectId}/${planId}`]: planData,
            };
            localStorage.setItem("currentPlan", JSON.stringify(plans));
          }
        }
        
        console.log('Fetched plan data from API',planData);
      }

      if(!planData.coordinates){
        navigate("/projects", { replace: true });
      }
    
      console.log("response ", planData)

      const loadedData = planData.coordinates && Object.keys(planData.coordinates).length > 0 
        ? planData.coordinates 
        : getFallbackInitialData();
      
      setFloorPlanData(loadedData);
      if (loadedData.wallWidths) {
        setWallWidths(loadedData.wallWidths);
      }
      originalFloorPlanDataRef.current = JSON.parse(JSON.stringify(loadedData));
      
    } catch (error) {
      console.error('Error loading floor plan data:', error);
      const fallbackData = getFallbackInitialData();
      setFloorPlanData(fallbackData);
      originalFloorPlanDataRef.current = JSON.parse(JSON.stringify(fallbackData));
    } finally {
      setIsLoadingData(false);
    }
  }, [isLoadingData, aiMode]);

  const saveFloorPlanToAPI = useCallback(async (projectId: string, planId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const getResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/${planId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!getResponse.ok) {
        throw new Error('Failed to fetch current plan details');
      }

      const currentPlan = await getResponse.json();

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/${planId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_name: currentPlan.plan_name,
          coordinates: floorPlanData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save plan data');
      }

      console.log('Floor plan saved to API successfully');
      
    } catch (error) {
      console.error('Error saving floor plan data:', error);
      throw error;
    }
  }, [floorPlanData]);

  useEffect(() => {
    if (aiMode || planId === 'ai-create') {
      setFloorPlanData(getFallbackInitialData());
      setIsLoadingData(false);
      return;
    }
    
    if (projectId && planId && !isLoadingData) {
      const currentDataKey = `${projectId}-${planId}`;
      
      if (loadedDataRef.current !== currentDataKey) {
        loadedDataRef.current = currentDataKey;
        loadFloorPlanFromAPI(projectId, planId).catch(console.error);
      }
    }
  }, [projectId, planId, aiMode]);

  const openProjectPanel = useCallback((roomId: string) => {
    setSelectedRoomIds([roomId]);
    setActiveTool("project");
  }, []);

  const captureOriginalState = useCallback(() => {
    originalFloorPlanDataRef.current = JSON.parse(JSON.stringify(floorPlanData));
    originalRoomRotationsRef.current = JSON.parse(JSON.stringify(roomRotations));
    hasStoredOriginal.current = true;
  }, [floorPlanData, roomRotations]);

  useEffect(() => {
    if (!hasStoredOriginal.current) {
      captureOriginalState();
    }
  }, [captureOriginalState]);

  const saveVisualizationToStorage = useCallback((options: VisualizationOptions) => {
  try {
    const storageKey = `floorplan_visualization_options_${projectId}_${planId}`;
    localStorage.setItem(storageKey, JSON.stringify(options));
  } catch (error) {
    console.warn('Failed to save visualization options to localStorage:', error);
  }
}, [projectId, planId]);

const updateVisualizationOption = <K extends keyof VisualizationOptions>(
  option: K,
  value: VisualizationOptions[K]
) => {
  setVisualizationOptions((prev) => {
    const newOptions = { ...prev, [option]: value };
    saveVisualizationToStorage(newOptions);
    return newOptions;
  });
};

const resetVisualizationOptions = () => {
  setVisualizationOptions(defaultVisualizationOptions);
  try {
    const storageKey = `floorplan_visualization_options_${projectId}_${planId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn('Failed to clear visualization options from localStorage:', error);
  }
};
const updateWallWidth = useCallback(
  (wallId: string, width: number) => {
    if (!hasChanges) {
      captureOriginalState();
    }

    setWallWidths((prev) => ({ ...prev, [wallId]: width }));

    setFloorPlanData((prevData) => {
      const updatedRooms = prevData.rooms.map((room) => {
        if (room.id === wallId) {
          return { ...room, width: width };
        }
        return room;
      });

      const newData = {
        ...prevData,
        rooms: updatedRooms,
        wallWidths: { ...wallWidths, [wallId]: width }, 
      };

      setHasChanges(true);
      return newData;
    });
  },
  [hasChanges, captureOriginalState, wallWidths]
);

  const handleRoomTypeUpdate = useCallback(
    (roomId: string, newRoomType: string) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const updatedRooms = prevData.rooms.map((room) =>
          room.id === roomId ? { ...room, room_type: newRoomType } : { ...room }
        );

        const newData = {
          ...prevData,
          rooms: updatedRooms,
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const flipDoorHorizontal = useCallback(
    (doorId: string) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      isFlipOperationRef.current = true;

      setFloorPlanData((prevData) => {
        const updatedDoors = (prevData.doors || []).map((door) => {
          if (door.id === doorId) {
            const newFlipHorizontal = !door.flipHorizontal;
            return {
              ...door,
              flipHorizontal: newFlipHorizontal,
            };
          }
          return door;
        });

        const newData = {
          ...prevData,
          doors: updatedDoors,
        };

        setHasChanges(true);

        setTimeout(() => {
          isFlipOperationRef.current = false;
        }, 100);

        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const flipDoorVertical = useCallback(
    (doorId: string) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      isFlipOperationRef.current = true;

      setFloorPlanData((prevData) => {
        const updatedDoors = (prevData.doors || []).map((door) => {
          if (door.id === doorId) {
            const newFlipVertical = !door.flipVertical;
            return {
              ...door,
              flipVertical: newFlipVertical,
            };
          }
          return door;
        });

        const newData = {
          ...prevData,
          doors: updatedDoors,
        };

        setHasChanges(true);

        setTimeout(() => {
          isFlipOperationRef.current = false;
        }, 100);

        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const flipWindowHorizontal = useCallback(
    (windowId: string) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      isFlipOperationRef.current = true;

      setFloorPlanData((prevData) => {
        const updatedWindows = (prevData.windows || []).map((window) => {
          if (window.id === windowId) {
            const newFlipHorizontal = !window.flipHorizontal;
            return {
              ...window,
              flipHorizontal: newFlipHorizontal,
            };
          }
          return window;
        });

        const newData = {
          ...prevData,
          windows: updatedWindows,
        };

        setHasChanges(true);

        setTimeout(() => {
          isFlipOperationRef.current = false;
        }, 100);

        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const flipWindowVertical = useCallback(
    (windowId: string) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      isFlipOperationRef.current = true;

      setFloorPlanData((prevData) => {
        const updatedWindows = (prevData.windows || []).map((window) => {
          if (window.id === windowId) {
            const newFlipVertical = !window.flipVertical;
            return {
              ...window,
              flipVertical: newFlipVertical,
            };
          }
          return window;
        });

        const newData = {
          ...prevData,
          windows: updatedWindows,
        };

        setHasChanges(true);

        setTimeout(() => {
          isFlipOperationRef.current = false;
        }, 100);

        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const addObject = useCallback(
    (objectPath: string, position: Point) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const objects = prevData.objects || [];

        const newObject: FloorPlanObject = {
          id: `object-${Date.now()}`,
          objectPath,
          position,
          rotation: 0,
          scale: 1,
        };

        const newData = {
          ...prevData,
          objects: [...objects, newObject],
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const updateObject = useCallback(
    (objectId: string, updates: Partial<FloorPlanObject>) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const updatedObjects = (prevData.objects || []).map((obj) =>
          obj.id === objectId ? { ...obj, ...updates } : obj
        );

        const newData = {
          ...prevData,
          objects: updatedObjects,
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const addDoor = useCallback(
    (doorPath: string, position: Point) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const doors = prevData.doors || [];
        const doorId = `door-${Date.now()}`;

        const newDoor: FloorPlanDoor = {
          id: doorId,
          doorPath,
          position,
          rotation: 0,
          scale: 1,
          width: 1,
          flipHorizontal: false,
          flipVertical: false,
        };

        setDoorWidths((prev) => ({ ...prev, [doorId]: 1 }));

        const newData = {
          ...prevData,
          doors: [...doors, newDoor],
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const updateDoor = useCallback(
    (doorId: string, updates: Partial<FloorPlanDoor>) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const updatedDoors = (prevData.doors || []).map((door) =>
          door.id === doorId ? { ...door, ...updates } : door
        );

        const newData = {
          ...prevData,
          doors: updatedDoors,
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const addWindow = useCallback(
    (windowPath: string, position: Point) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const windows = prevData.windows || [];
        const windowId = `window-${Date.now()}`;

        const newWindow: FloorPlanWindow = {
          id: windowId,
          windowPath,
          position,
          rotation: 0,
          scale: 1,
          width: 1,
          flipHorizontal: false,
          flipVertical: false,
        };

        setWindowWidths((prev) => ({ ...prev, [windowId]: 1 }));

        const newData = {
          ...prevData,
          windows: [...windows, newWindow],
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const updateWindow = useCallback(
    (windowId: string, updates: Partial<FloorPlanWindow>) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const updatedWindows = (prevData.windows || []).map((window) =>
          window.id === windowId ? { ...window, ...updates } : window
        );

        const newData = {
          ...prevData,
          windows: updatedWindows,
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const addLabel = useCallback(
    (text: string, position: Point) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const labels = prevData.labels || [];

        const newLabel: Label = {
          id: `label-${Date.now()}`,
          text,
          position,
          fontSize: 12,
          color: "#000000",
        };

        const newData = {
          ...prevData,
          labels: [...labels, newLabel],
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const addDimensionLine = useCallback(
    (startPoint: Point, endPoint: Point) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      const distance = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) +
        Math.pow(endPoint.z - startPoint.z, 2)
      );

      const midPoint = {
        x: (startPoint.x + endPoint.x) / 2,
        z: (startPoint.z + endPoint.z) / 2,
      };

      setFloorPlanData((prevData) => {
        const dimensionLines = prevData.dimensionLines || [];

        const newDimensionLine: DimensionLine = {
          id: generateUniqueId("dimension"),
          startPoint,
          endPoint,
          distance,
          midPoint,
        };

        const newData = {
          ...prevData,
          dimensionLines: [...dimensionLines, newDimensionLine],
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  const updateDimensionLine = useCallback(
    (dimensionId: string, updates: Partial<DimensionLine>) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const updatedDimensionLines = (prevData.dimensionLines || []).map(
          (dimension) =>
            dimension.id === dimensionId
              ? { ...dimension, ...updates }
              : dimension
        );

        const newData = {
          ...prevData,
          dimensionLines: updatedDimensionLines,
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

const [isSaving, setIsSaving] = useState(false);

const saveFloorPlanChanges = useCallback(async () => {
  try {
    setIsSaving(true);
    await saveFloorPlan(floorPlanData, roomRotations, setHasChanges, projectId, planId);
    
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
    
    originalFloorPlanDataRef.current = JSON.parse(JSON.stringify(floorPlanData));
    originalRoomRotationsRef.current = { ...roomRotations };
  } catch (error) {
    console.error('Error saving floor plan:', error);
  } finally {
    setIsSaving(false);
  }
}, [floorPlanData, roomRotations, projectId, planId]);

  const resetFloorPlanChanges = useCallback(() => {
    const resetData = JSON.parse(JSON.stringify(originalFloorPlanDataRef.current));
    const resetRotations = { ...originalRoomRotationsRef.current };
    setFloorPlanData(resetData);
    setRoomRotations(resetRotations);
    setHasChanges(false);
    setDoorWidths({});
    setWindowWidths({});
    setWallWidths({});

    setTimeout(() => {
      const event = new CustomEvent("floorPlanReset", { detail: resetData });
      window.dispatchEvent(event);
    }, 0);
  }, []);

  const updateLabel = useCallback(
    (labelId: string, updates: Partial<Label>) => {
      if (!hasChanges) {
        captureOriginalState();
      }

      setFloorPlanData((prevData) => {
        const updatedLabels = (prevData.labels || []).map((label) =>
          label.id === labelId ? { ...label, ...updates } : label
        );

        const newData = {
          ...prevData,
          labels: updatedLabels,
        };

        setHasChanges(true);
        return newData;
      });
    },
    [hasChanges, captureOriginalState]
  );

  useEffect(() => {
    const handleResize = () => {
      const newDefaultScale = window.innerWidth < 850 ? 1.6 : 2.5;
      if (activeBuildTool) {
        setScale(newDefaultScale);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeBuildTool]);

  return (
    <FloorPlanContext.Provider
      value={{
        visualizationOptions,
        updateVisualizationOption,
        resetVisualizationOptions,
        activeTool,
        setActiveTool,
        floorPlanData,
        setFloorPlanData,
        activeBuildTool,
        setActiveBuildTool,
        isDrawingActive,
        setIsDrawingActive,
        scale,
        setScale,
        position,
        setPosition,
        defaultScale,
        isZoomingDisabled,
        hasChanges,
        setHasChanges,
        roomRotations,
        setRoomRotations,
        handleRoomTypeUpdate,
        saveFloorPlanChanges,
        resetFloorPlanChanges,
        addLabel,
        addObject,
        updateObject,
        addDoor,
        updateDoor,
        addWindow,
        updateWindow,
        captureOriginalState,
        selectedRoomIds,
        setSelectedRoomIds,
        openProjectPanel,
        drawingWallWidth,
        setDrawingWallWidth,
        updateLabel,
        addDimensionLine,
        updateDimensionLine,
        doorWidths,
        setDoorWidths,
        windowWidths,
        setWindowWidths,
        showIndividualWalls,
        setShowIndividualWalls,
        wallWidths,
        setWallWidths,
        updateWallWidth,
        flipDoorHorizontal,
        flipDoorVertical,
        flipWindowHorizontal,
        flipWindowVertical,
        loadFloorPlanFromAPI,
        saveFloorPlanToAPI,
        isLoadingData,
        projectId: projectId || null,
        planId: planId || null,
        isSaving,
        unitSystem,
setUnitSystem,
      }}
    >
      {children}
    </FloorPlanContext.Provider>
  );
};

export const useFloorPlan = () => {
  const context = useContext(FloorPlanContext);
  if (context === undefined) {
    throw new Error("useFloorPlan must be used within a FloorPlanProvider");
  }
  return context;
};
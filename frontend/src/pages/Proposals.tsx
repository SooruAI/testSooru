import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowBack, ChevronLeft, ChevronRight, Person, Close, LocationOn, Business, AttachMoney, MonetizationOn, CurrencyExchange  } from '@mui/icons-material';
import './Proposals.css';
import SooruAILogo from "../SooruAI.png";
import { API_URL } from '../config';

const API_BASE_URL = API_URL;

interface Project {
  id: string;
  project_name: string;
  estimated_budget: string;
  currency: string;
  city?: string;
  state?: string;
  country?: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
}

interface Plan {
  id: string;
  plan_name: string;
  coordinates?: any;
}

interface Proposal {
  id: number;
  title: string;
  totalArea: string;
  totalRooms: number;
  image: string;
  isSaved: boolean;
  floorPlanData?: any;
}

interface UserProfile {
  id: number;
  username: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

// Heart Icon Component
const HeartIcon: React.FC<{ filled?: boolean }> = ({ filled = false }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill={filled ? "#ff0000" : "none"} 
    stroke={filled ? "#ff0000" : "currentColor"}
    strokeWidth="2"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// Floor Plan Rendering Helper Functions
const calculateMiteredCorners = (
  walls: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    wallWidth: number;
  }>
) => {
  const corners: any[] = [];

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
            y: nextWall.end.y + nextPerpY * nextHalfWidth,
          }
        );

        if (topIntersection) topEnd = topIntersection;
        if (bottomIntersection) bottomEnd = bottomIntersection;
      }
    }

    corners.push({ topStart, topEnd, bottomStart, bottomEnd });
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
  return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
};

const getRoomColor = (roomType: string) => {
  if (roomType === "Wall") return "#333333";
  return "#D0D0D0"; // Standard gray for all rooms in proposals
};

// Floor Plan Component
// Floor Plan Component - CORRECTED VERSION
export const FloorPlan: React.FC<{ 
  floorPlanData: any; 
  width: number; 
  height: number; 
  viewBox: string;
  className?: string;
  showRoomType?: boolean;
}> = ({ floorPlanData, width, height, viewBox, className, showRoomType = false }) => {
  if (!floorPlanData?.rooms) {
    return (
      <svg width={width} height={height} viewBox={viewBox} className={className}>
        <text x={width/2} y={height/2} textAnchor="middle" fill="#666">No floor plan data</text>
      </svg>
    );
  }

  // compute bounds
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  
  // Filter out Reference rooms for bounds calculation
  const validRooms = floorPlanData.rooms.filter((room: any) => 
    room.room_type !== "Reference" && 
    room.floor_polygon && 
    room.floor_polygon.length > 0
  );
  
  if (validRooms.length === 0) {
    return (
      <svg width={width} height={height} viewBox={viewBox} className={className}>
        <text x={width/2} y={height/2} textAnchor="middle" fill="#666">No valid rooms</text>
      </svg>
    );
  }
  
  validRooms.forEach((room: any) => {
    room.floor_polygon.forEach((point: any) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    });
  });

  const floorWidth = maxX - minX;
  const floorHeight = maxZ - minZ;

  // Parse viewBox dimensions
  const [vbX, vbY, vbWidth, vbHeight] = viewBox.split(' ').map(Number);
  
  // Add padding
  const padding = 25;
  const availableWidth = vbWidth - 2 * padding;
  const availableHeight = vbHeight - 2 * padding;

  // Calculate scale to fit the floor plan within available space
  const scaleX = availableWidth / (floorWidth || 1);
  const scaleZ = availableHeight / (floorHeight || 1);
  const scale = Math.min(scaleX, scaleZ) * 0.8; // Make it 80% of calculated size

  // Calculate the actual size after scaling
  const scaledWidth = floorWidth * scale;
  const scaledHeight = floorHeight * scale;

  // Calculate centering offsets - THIS IS THE KEY FIX
  const offsetX = vbX + (vbWidth - scaledWidth) / 2;
  const offsetY = vbY + (vbHeight - scaledHeight) / 2;

  const transformPoint = (point: any) => {
    const x = (point.x - minX) * scale + offsetX;
    const y = (point.z - minZ) * scale + offsetY;
    return { x, y };
  };

  // Helper function to calculate centroid of a polygon
  const getCentroid = (points: any[]) => {
    let sumX = 0;
    let sumY = 0;
    points.forEach(point => {
      sumX += point.x;
      sumY += point.y;
    });
    return {
      x: sumX / points.length,
      y: sumY / points.length
    };
  };

  const roomElements: React.ReactElement[] = [];
  const wallElements: React.ReactElement[] = [];
  const labelElements: React.ReactElement[] = [];

  // Draw room fills first (all rooms except walls and references)
  validRooms.forEach((room: any, index: number) => {
    if (room.room_type === "Wall" || room.room_type === "Reference") return;

    const points = room.floor_polygon
      .map((point: any) => {
        const t = transformPoint(point);
        return `${t.x},${t.y}`;
      })
      .join(" ");

    // Check if this is a boundary room
    const isBoundary = room.isBoundary || room.room_type === "Boundary";
    
    roomElements.push(
      <polygon
        key={`room-fill-${room.id}-${index}`}
        points={points}
        fill={isBoundary ? "none" : getRoomColor(room.room_type)}
        fillOpacity={isBoundary ? 0 : 1}
        stroke={isBoundary ? "#ff6b00" : "none"}
        strokeWidth={isBoundary ? "2" : "0"}
        strokeDasharray={isBoundary ? "4,2" : "none"}
        pointerEvents="none"
      />
    );

    // Add room type label if showRoomType is true
    if (showRoomType && !isBoundary) {
      const transformedPoints = room.floor_polygon.map(transformPoint);
      const centroid = getCentroid(transformedPoints);
      
      labelElements.push(
        <text
          key={`room-label-${room.id}-${index}`}
          x={centroid.x}
          y={centroid.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#333"
          fontSize="6"
          fontWeight="500"
          pointerEvents="none"
        >
          {room.room_type}
        </text>
      );
    }
  });

  // Build wall segments with uniform thickness
  const allWallSegments: Array<{
    corners: any;
    roomId: string;
    segmentIndex: number;
  }> = [];

  validRooms.forEach((room: any) => {
    if (room.room_type === "Wall" || room.floor_polygon.length < 3) return;

    const transformedPoints = room.floor_polygon.map(transformPoint);

    const wallData: any[] = [];
    for (let i = 0; i < transformedPoints.length; i++) {
      const start = transformedPoints[i];
      const end = transformedPoints[(i + 1) % transformedPoints.length];
      
      // Uniform wall width
      const wallWidth = 1;

      wallData.push({ start, end, wallWidth });
    }

    const miteredCorners = calculateMiteredCorners(wallData);

    wallData.forEach((wall, segmentIndex) => {
      const corners = miteredCorners[segmentIndex];
      if (corners) {
        allWallSegments.push({
          corners,
          roomId: room.id,
          segmentIndex,
        });
      }
    });
  });

  // Render wall segments
  allWallSegments.forEach((wallSegment, index) => {
    const { corners } = wallSegment;
    const polygonPoints = `${corners.topStart.x},${corners.topStart.y} ${corners.topEnd.x},${corners.topEnd.y} ${corners.bottomEnd.x},${corners.bottomEnd.y} ${corners.bottomStart.x},${corners.bottomStart.y}`;

    wallElements.push(
      <polygon
        key={`wall-segment-${wallSegment.roomId}-${wallSegment.segmentIndex}-${index}`}
        points={polygonPoints}
        fill="black"
        stroke="none"
      />
    );
  });

  // Render standalone walls
  validRooms.forEach((room: any, index: number) => {
    if (room.room_type !== "Wall" || room.floor_polygon.length !== 2) return;

    const start = transformPoint(room.floor_polygon[0]);
    const end = transformPoint(room.floor_polygon[1]);
    const wallWidth = 1;

    wallElements.push(
      <line
        key={`standalone-wall-${room.id}-${index}`}
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="#333333"
        strokeWidth={wallWidth}
        strokeLinecap="round"
      />
    );
  });

  return (
    <svg width={width} height={height} viewBox={viewBox} className={className} preserveAspectRatio="xMidYMid meet">
      {[...roomElements, ...wallElements, ...labelElements]}
    </svg>
  );
};

const Proposals: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [project, setProject] = useState<Project | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [proposalStates, setProposalStates] = useState<Proposal[]>([]);
  const [aiGeneratedPlans, setAiGeneratedPlans] = useState<any[]>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const [proposalsPerPage, setProposalsPerPage] = useState(window.innerWidth < 768 ? 1 : 2);
  const totalPages = Math.ceil(proposalStates.length / proposalsPerPage);

  useEffect(() => {
    const projectData = location.state?.projectData;
    const roomData = location.state?.roomData;
    
    if (projectData) {
      fetchProjectAndPlanData(projectData.id);
    } else {
      navigate('/projects');
    }

    const cachedProfile = localStorage.getItem('userProfile');
    if (cachedProfile) {
      setUserProfile(JSON.parse(cachedProfile));
    }
  }, [location.state, navigate]);

  useEffect(() => {
    const handleResize = () => {
      const perPage = window.innerWidth < 768 ? 1 : 2;
      setProposalsPerPage(perPage);
      setCurrentPage(0);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const aiPlans = location.state?.aiGeneratedPlans;
    const roomData = location.state?.roomData;
    
    if (aiPlans && Array.isArray(aiPlans)) {
      setAiGeneratedPlans(aiPlans);
      
      // Convert AI plans to proposal format
      const convertedProposals = aiPlans.map((plan, index) => {
        const totalRooms = plan.rooms?.filter((room: any) => room.room_type !== 'Reference').length || 0;
        const totalArea = plan.rooms?.reduce((sum: number, room: any) => sum + (room.area || 0), 0) || 0;
        
        return {
          id: index + 1,
          title: `PROPOSAL ${index + 1}`,
          totalArea: `${totalArea.toFixed(1)} sq ft`,
          totalRooms: totalRooms,
          image: '', // Will be rendered as floor plan
          isSaved: false,
          floorPlanData: plan // Store the actual floor plan data
        };
      });
      
      setProposalStates(convertedProposals);
    } else {
      console.error('No AI plans received or invalid format');
    }
  }, [location.state]);

  const fetchProjectAndPlanData = async (projectId: string) => {
    try {
      setLoading(true);
      
      // First try localStorage like in Plans page
      const cachedProjects = localStorage.getItem("userProjects");
      let projectData = null;
      
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects);
        projectData = projects.find((p: any) => p.id.toString() === projectId);
      }

      // If not found in cache, fetch from API
      if (!projectData) {
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

        projectData = await response.json();
      }

      setProject(projectData);
      
      if (projectData.plans && projectData.plans.length > 0) {
        setPlan(projectData.plans[0]);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching project data:', err);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  // Simple toggle for save/unsave - no API calls
  const handleSave = (proposalId: number) => {
    setProposalStates(prevStates => 
      prevStates.map(proposal => 
        proposal.id === proposalId 
          ? { ...proposal, isSaved: !proposal.isSaved }
          : proposal
      )
    );
  };

  // Batch save all selected proposals when Next is clicked
  const handleNext = async () => {
    if (!project) return;
    
    const savedProposals = proposalStates.filter(p => p.isSaved);
    
    if (savedProposals.length === 0) {
      // No saved proposals, navigate directly
      navigate(`/projects/${project.id}/plans`, {
        state: {
          fromProposals: true,
          projectData: project
        }
      });
      return;
    }
    
    // Start saving process
    setIsSavingAll(true);
    
    try {
      console.log(`Saving ${savedProposals.length} proposals...`);
      
      // Save each proposal one by one
      for (let i = 0; i < savedProposals.length; i++) {
        const proposal = savedProposals[i];
        console.log(`Saving proposal ${i + 1}/${savedProposals.length}: ${proposal.title}`);
        
        await savePlanToDatabase(proposal);
        
        // Small delay between saves to avoid overwhelming the server
        if (i < savedProposals.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('All proposals saved successfully');
      
      // Refresh localStorage with latest data from API
      await refreshLocalStorage();
      
      // Navigate to plans page
      navigate(`/projects/${project.id}/plans`, {
        state: {
          fromProposals: true,
          projectData: project,
          savedPlansCount: savedProposals.length
        }
      });
      
    } catch (error) {
      console.error('Error saving proposals:', error);
      setError('Failed to save some proposals. Please try again.');
    } finally {
      setIsSavingAll(false);
    }
  };

  const savePlanToDatabase = async (proposal: Proposal) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`${API_BASE_URL}/projects/${project?.id}/plans/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_name: proposal.title,
          coordinates: proposal.floorPlanData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${proposal.title} to database`);
      }

      const newPlan = await response.json();
      console.log(`Plan saved: ${proposal.title}`, newPlan);
      
      return newPlan;
      
    } catch (error) {
      console.error(`Error saving ${proposal.title}:`, error);
      throw error;
    }
  };

  // Refresh localStorage with fresh data from API
  const refreshLocalStorage = async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Fetch fresh project data with updated plans
      const response = await fetch(`${API_BASE_URL}/projects/${project?.id}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh project data');
      }

      const freshProjectData = await response.json();
      
      // Update localStorage with fresh data
      const cachedProjects = localStorage.getItem("userProjects");
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects);
        const updatedProjects = projects.map((p: any) => 
          p.id.toString() === project?.id ? freshProjectData : p
        );
        localStorage.setItem("userProjects", JSON.stringify(updatedProjects));
        console.log('LocalStorage refreshed with fresh project data');
      }
      
    } catch (error) {
      console.error('Error refreshing localStorage:', error);
      // Don't throw - this is not critical for navigation
    }
  };

  const handleBack = () => {
    if (project) {
      navigate(`/playground/${project.id}/ai-create`, {
        state: {
          fromPlans: true,
          projectData: project,
          createOption: 'ai',
          startEmpty: true
        }
      });
    }
  };

  const handlePaginationNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePaginationPrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageClick = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  const getCurrentProposals = () => {
    const startIndex = currentPage * proposalsPerPage;
    return proposalStates.slice(startIndex, startIndex + proposalsPerPage);
  };

  const getProfileInitial = (): React.ReactNode => {
    if (userProfile && userProfile.first_name) {
      return userProfile.first_name.charAt(0).toUpperCase();
    }
    const storedLetter = localStorage.getItem("user_first_letter");
    if (storedLetter) {
      return storedLetter;
    }
    return <Person fontSize="small" />;
  };

  const handleLogoClick = () => {
    navigate('/');
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
    if (parts.length > 0) {
      return parts.join(', ');
    }
    const addressParts = [project.address_line_1, project.address_line_2, project.address_line_3].filter(Boolean);
    return addressParts.length > 0 ? addressParts.join(', ') : 'Location not specified';
  };

  // Generate page numbers to display
  const getVisiblePageNumbers = () => {
    const isMobile = window.innerWidth < 768;
    const maxVisible = isMobile ? 1 : 4;
    const pages = [];
    
    if (totalPages <= maxVisible || isMobile) {
      if (isMobile) {
        pages.push(currentPage);
      } else {
        for (let i = 0; i < totalPages; i++) {
          pages.push(i);
        }
      }
    } else {
      let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages, start + maxVisible);
      
      if (end - start < maxVisible) {
        start = Math.max(0, end - maxVisible);
      }
      
      for (let i = start; i < end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="proposals-loading">
        <div className="proposals-loading-spinner"></div>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="proposals-error">
        <h3>⚠️ Error</h3>
        <p>{error || 'Project data not found'}</p>
        <button onClick={() => navigate('/projects')} className="proposals-back-btn">
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="proposals-wrapper">
      <div className="proposals-container">
        {/* Top Navigation Bar */}
        <div className="proposals-top-nav">
          <div className="proposals-logo-container" onClick={handleLogoClick}>
            <img src={SooruAILogo} alt="Sooru.AI Logo" />
          </div>
          <div className="proposals-nav-info">
            <div>
              <span className="proposals-project-name"> <Business className="proposals-info-icon" /> &nbsp;{project.project_name}</span>
            </div>
            <div >
              <span className="proposals-budget"><MonetizationOn className="proposals-info-icon" /> {formatBudget(project.estimated_budget, project.currency)}</span>
            </div>
            <div className="proposals-info-item">
              <LocationOn className="proposals-info-icon1" />
              <span className="proposals-project-location">{getProjectLocation(project)}</span>
            </div>
          </div>
          <div className="proposals-profile-icon">{getProfileInitial()}</div>
        </div>

        {/* Main Content */}
        <div className="proposals-content">
          <div className="proposals-grid">
            {getCurrentProposals().map((proposal) => (
              <div 
                key={proposal.id} 
                className="proposal-card" 
                onClick={() => setSelectedProposal(proposal)}
              >
                <div className="proposal-header">
                  <h3 className="proposal-title">{proposal.title}</h3>
                </div>
                <div className="proposal-image-container">
                  <div className="proposal-image-placeholder">
                    {proposal.floorPlanData ? (
                      <FloorPlan 
                        floorPlanData={proposal.floorPlanData}
                        width={200}
                        height={140}
                        viewBox="0 0 300 200"
                        className="proposal-floor-plan-svg"
                      />
                    ) : (
                      <div className="floor-plan-preview">Floor Plan Preview</div>
                    )}
                  </div>
                  <div className="proposal-info">
                    <span className="proposal-area">Total Area: {proposal.totalArea}</span>
                    <span className="proposal-rooms">Total Rooms: {proposal.totalRooms}</span>
                  </div>
                </div>
                <div className="proposal-actions proposals-centered-actions">
                  <button 
                    className={`proposal-btn proposals-save-btn ${proposal.isSaved ? 'proposals-saved' : ''}`}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      handleSave(proposal.id); 
                    }}
                    disabled={isSavingAll}
                    style={{
                      textAlign:"center", 
                      justifyContent:"center",
                      opacity: isSavingAll ? 0.5 : 1,
                      cursor: isSavingAll ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <HeartIcon filled={proposal.isSaved} />
                    {proposal.isSaved ? 'Unsave' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation with Pagination */}
        <div className="proposals-bottom-nav">
          <button 
            className="proposals-back-btn" 
            onClick={handleBack}
            disabled={isSavingAll}
            style={{
              opacity: isSavingAll ? 0.5 : 1,
              cursor: isSavingAll ? 'not-allowed' : 'pointer'
            }}
          >
            <ArrowBack />
            Back
          </button>
          
          {/* Pagination */}
          <div className="proposals-pagination">
            <button 
              className="pagination-nav-btn" 
              onClick={handlePaginationPrevious} 
              disabled={currentPage === 0 || isSavingAll}
            >
              <ChevronLeft />
            </button>
            
            <div className="pagination-numbers">
              {getVisiblePageNumbers().map((pageIndex) => (
                <div
                  key={pageIndex}
                  className={`pagination-number ${currentPage === pageIndex ? 'active' : ''}`}
                  onClick={() => !isSavingAll && handlePageClick(pageIndex)}
                  style={{
                    opacity: isSavingAll ? 0.5 : 1,
                    cursor: isSavingAll ? 'not-allowed' : 'pointer'
                  }}
                >
                  {pageIndex + 1}
                </div>
              ))}
            </div>
            
            <button 
              className="pagination-nav-btn" 
              onClick={handlePaginationNext} 
              disabled={currentPage >= totalPages - 1 || isSavingAll}
            >
              <ChevronRight />
            </button>
          </div>
          
          <button 
            className="proposals-next-btn" 
            onClick={handleNext}
            disabled={isSavingAll}
            style={{
              opacity: isSavingAll ? 0.5 : 1,
              cursor: isSavingAll ? 'pointer' : 'pointer'
            }}
          >
            {isSavingAll ? (
              <>
                <span>Saving plans...</span>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginLeft: '8px'
                }} />
              </>
            ) : (
              <>
                Next
                <ChevronRight />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Zoom Modal */}
      {selectedProposal && !isSavingAll && (
        <div className="proposal-modal-overlay" onClick={() => setSelectedProposal(null)}>
          <div className="proposal-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="proposal-modal-close" onClick={() => setSelectedProposal(null)}>
              <Close />
            </button>
            <h2>{selectedProposal.title}</h2>
            <div className="proposal-modal-image">
              {selectedProposal.floorPlanData ? (
<FloorPlan 
  floorPlanData={selectedProposal.floorPlanData}
  width={700}          // Increased from 400
  height={550}         // Increased from 300
  viewBox="0 0 600 450"  // Increased viewBox
  className="proposal-modal-floor-plan-svg"
/>
              ) : (
                <div>📐 Floor Plan Preview</div>
              )}
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              marginTop: "10px",
              padding: "0 10px",
              fontWeight: "bold"
            }}>
              <span>Total Area: {selectedProposal.totalArea}</span>
              <span>Total Rooms: {selectedProposal.totalRooms}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proposals;
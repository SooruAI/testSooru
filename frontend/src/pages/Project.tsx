import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Project.css';
import { API_URL } from '../config';
import { logEvent } from '../Utility/UserJourney';
import ProjectShareModal from './Playground/components/ProjectShareModal';


const API_BASE_URL = API_URL;

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
  shared?: boolean; 
}

interface EditFormData {
  project_name: string;
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  estimated_budget: string;
  currency: string;
  additional_details: string;
}

// SVG Icons
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="16,6 12,2 8,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DotsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function Project() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    project_name: '',
    address_line_1: '',
    address_line_2: '',
    address_line_3: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    estimated_budget: '',
    currency: 'USD',
    additional_details: ''
  });
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Sync with theme changes
  useEffect(() => {
    const checkTheme = () => {
      const savedTheme = localStorage.getItem("theme");
      setIsDarkMode(savedTheme === "dark");
    };

    checkTheme();
    window.addEventListener("storage", checkTheme);
    const interval = setInterval(checkTheme, 100);

    return () => {
      window.removeEventListener("storage", checkTheme);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const hasRefreshed = sessionStorage.getItem('projectPageRefreshed');
    if (!hasRefreshed) {
      sessionStorage.setItem('projectPageRefreshed', 'true');
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

const fetchProjects = async () => {
    try {
      // First, load from localStorage for instant display
      const cachedProjects = localStorage.getItem("userProjects");
      if (cachedProjects) {
        const parsedProjects = JSON.parse(cachedProjects);
        setProjects(parsedProjects);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Please login to view projects');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/projects/`, {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

const data = await response.json();
      setProjects(data);
      localStorage.setItem("userProjects", JSON.stringify(data));
      
      data.forEach((project: Project) => {
        const plansKey = `plans_${project.id}`;
        localStorage.setItem(plansKey, JSON.stringify(project.plans));
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    sessionStorage.removeItem('projectPageRefreshed');
    navigate('/projects/new', { state: { fromProjects: true } });
  };

  const handleProjectClick = (project: Project) => {
    logEvent("project_clicked", { projectId: project.id, projectName: project.project_name });
    navigate(`/projects/${project.id}/plans`, { 
      state: { 
        fromProjectPage: true,
        projectData: project,
        projectId: project.id
      } 
    });
  };

  const handleDropdownClick = (e: React.MouseEvent, projectId: number) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === projectId ? null : projectId);
  };

  const handleEdit = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setEditFormData({
      project_name: project.project_name,
      address_line_1: project.address_line_1 || '',
      address_line_2: project.address_line_2 || '',
      address_line_3: project.address_line_3 || '',
      city: project.city || '',
      state: project.state || '',
      country: project.country || '',
      pincode: project.pincode || '',
      estimated_budget: project.estimated_budget,
      currency: project.currency,
      additional_details: project.additional_details || ''
    });
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleDelete = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setShowDeleteModal(true);
    setActiveDropdown(null);
  };

  const handleShare = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSelectedProject(project);
    setShowShareModal(true);
    setActiveDropdown(null);
  };

  const handleEditSubmit = async () => {
    if (!selectedProject) return;

    try {
      setUpdateLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editFormData,
          estimated_budget: parseFloat(editFormData.estimated_budget)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id 
          ? { ...p, ...editFormData, estimated_budget: editFormData.estimated_budget }
          : p
      );
      setProjects(updatedProjects);
      localStorage.setItem("userProjects", JSON.stringify(updatedProjects));

      setShowEditModal(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Failed to update project. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedProject) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(`${API_BASE_URL}/projects/${selectedProject.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      const updatedProjects = projects.filter(p => p.id !== selectedProject.id);
      setProjects(updatedProjects);
      localStorage.setItem("userProjects", JSON.stringify(updatedProjects));

      setShowDeleteModal(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleteLoading(false);
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

  const currencies = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'INR', label: 'INR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'JPY', label: 'JPY' },
    { value: 'AUD', label: 'AUD' },
    { value: 'CAD', label: 'CAD' }
  ];

  if (loading) {
    return (
      <div className={`project-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="project-header">
          <h1 className="project-title">Projects</h1>
          <button className="create-project-btn" onClick={handleCreateProject}>
            <span className="plus-sign">+</span> New Project
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`project-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <div className="project-header">
          <h1 className="project-title">Projects</h1>
          <button className="create-project-btn" onClick={handleCreateProject}>
            <span className="plus-sign">+</span> New Project
          </button>
        </div>
        <div className="error-container">
          <div className="error-message">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={fetchProjects}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`project-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="project-header">
        <h1 className="project-title">Projects</h1>
        <button className="create-project-btn" onClick={handleCreateProject}>
          <span className="plus-sign">+</span> New Project
        </button>
      </div>

      <div className="projects-list">
        {projects.length === 0 ? (
          <div className="empty-project-card" onClick={handleCreateProject}>
            <img src="/3Dplan.png" alt="3D Plan" className="project-bg-image" />
            <div className="empty-card-content">
              <span className="empty-plus">+</span>
              <span className="empty-text">New Project</span>
            </div>
          </div>
        ) : (
          projects
          .filter((project) => !project.shared)
          .map((project) => (
            <div
              key={project.id}
              className="project-card-enhanced"
              onClick={() => handleProjectClick(project)}
            >
              <img src="/3Dplan.png" alt="3D Plan" className="project-card-bg-image" />
              
              <div className="project-card-dropdown-container">
                <button
                  className="project-card-dropdown-btn"
                  onClick={(e) => handleDropdownClick(e, project.id)}
                >
                  <DotsIcon />
                </button>
                
                {activeDropdown === project.id && (
                  <div className="project-card-dropdown-menu">
                    <button
                      className="dropdown-item"
                      onClick={(e) => handleEdit(e, project)}
                    >
                      <EditIcon />
                      Edit
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={(e) => handleShare(e, project)}
                    >
                      <ShareIcon />
                      Share
                    </button>
                    <button
                      className="dropdown-item delete"
                      onClick={(e) => handleDelete(e, project)}
                    >
                      <DeleteIcon />
                      Delete
                    </button>
                  </div>
                  
                )}
              </div>

              <div className="project-card-content" id="ProjectCard">
                <div className="project-card-header">
                  <h3 className="project-card-title">{project.project_name}</h3>
                  <div className="project-card-budget">
                    {formatBudget(project.estimated_budget, project.currency)}
                  </div>
                </div>
                
                <div className="project-card-info">
                  <div className="project-info-item" id="">
                    <span className="info-icon">📍</span>
                    <span className="info-text">{getProjectLocation(project)}</span>
                  </div>
                  
                  <div className="project-info-item">
                    <span className="info-icon">📋</span>
                    <span className="info-text">{project.plans_count} Plans</span>
                  </div>
                  
                  <div className="project-info-item">
                    <span className="info-icon">📅</span>
                    <span className="info-text">Created {formatDate(project.created_date)}</span>
                  </div>
                </div>
                
                {project.additional_details && (
                  <div className="project-card-description">
                    {project.additional_details.length > 80 
                      ? `${project.additional_details.substring(0, 80)}...`
                      : project.additional_details
                    }
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Share Project Modal */}
      {showShareModal && selectedProject && (
        <ProjectShareModal 
          project={selectedProject} 
          onClose={() => setShowShareModal(false)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <div className="modal-header">
              <h3 style={{margin:"auto"}}>Delete Project</h3>
            </div>
            <hr />
            <div className="modal-body">
              <p>Are you sure you want to delete the project: <span className="project-name-highlight">"{selectedProject.project_name}"</span></p>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                No, Cancel
              </button>
              <button
                className="modal-btn delete-btn"
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <div className="modal-header" >
              <h2 >Edit Project</h2>
              <button
              style={{color:"black"}}
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="form-group">
                  <label>Project Name</label>
                  <input
                    type="text"
                    value={editFormData.project_name}
                    onChange={(e) => setEditFormData(prev => ({...prev, project_name: e.target.value}))}
                    placeholder="Enter project name"
                  />
                </div>

                <div className="form-group">
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    value={editFormData.address_line_1}
                    onChange={(e) => setEditFormData(prev => ({...prev, address_line_1: e.target.value}))}
                    placeholder="Address line 1"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Address Line 2</label>
                    <input
                      type="text"
                      value={editFormData.address_line_2}
                      onChange={(e) => setEditFormData(prev => ({...prev, address_line_2: e.target.value}))}
                      placeholder="Address line 2 (Optional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Address Line 3</label>
                    <input
                      type="text"
                      value={editFormData.address_line_3}
                      onChange={(e) => setEditFormData(prev => ({...prev, address_line_3: e.target.value}))}
                      placeholder="Address line 3 (Optional)"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData(prev => ({...prev, city: e.target.value}))}
                      placeholder="City"
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={editFormData.state}
                      onChange={(e) => setEditFormData(prev => ({...prev, state: e.target.value}))}
                      placeholder="State"
                    />
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      value={editFormData.country}
                      onChange={(e) => setEditFormData(prev => ({...prev, country: e.target.value}))}
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={editFormData.pincode}
                      onChange={(e) => setEditFormData(prev => ({...prev, pincode: e.target.value}))}
                      placeholder="Pincode"
                    />
                  </div>
                  <div className="form-group">
                    <label>Budget</label>
                    <input
                      type="number"
                      value={editFormData.estimated_budget}
                      onChange={(e) => setEditFormData(prev => ({...prev, estimated_budget: e.target.value}))}
                      placeholder="Budget"
                    />
                  </div>
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      value={editFormData.currency}
                      onChange={(e) => setEditFormData(prev => ({...prev, currency: e.target.value}))}
                    >
                      {currencies.map(currency => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Additional Details</label>
                  <textarea
                    value={editFormData.additional_details}
                    onChange={(e) => setEditFormData(prev => ({...prev, additional_details: e.target.value}))}
                    placeholder="Additional details"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            <div className="modal-actions" style={{position:"relative", bottom:"15px"}}>
              <button
                className="modal-btn cancel-btn"
                onClick={() => setShowEditModal(false)}
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                className="modal-btn save-btn"
                onClick={handleEditSubmit}
                disabled={updateLoading}
              >
                {updateLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
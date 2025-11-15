import React, { useState } from 'react';
import { Copy, Loader2, Plus } from 'lucide-react';
import './CreateCopyButton.css'; 
import { API_URL } from '../../../config';

const API_BASE_URL = API_URL;

interface Project {
  id: string;
  project_name: string;
  plans?: Plan[];
}

interface Plan {
  id: string;
  name?: string;
  [key: string]: any;
}

interface ProjectData {
  id: string;
  [key: string]: any;
}

interface CreateCopyButtonProps {
  currentUser?: any;
  currentProjectID: string;
  currentPlanID: string;
  onLoginRedirect?: () => void;
  onProjectCreated?: (projectData: ProjectData) => void;
  buttonText?: string;
  showIcon?: boolean;
  size?: 'small' | 'default' | 'large';
}

const CreateCopyButton: React.FC<CreateCopyButtonProps> = ({
  currentUser,
  currentProjectID,
  currentPlanID,
  onLoginRedirect = () => { 
    const redirect = encodeURIComponent(`/view/playground/${currentProjectID}/${currentPlanID}`)
    window.location.href = `/LoginPage?redirect=${redirect}`; },
  onProjectCreated = (projectData: ProjectData) => { window.location.href = `/projects/${projectData.id}/plans`; },
  buttonText = 'Create a Copy',
  showIcon = true,
  size = 'default'
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingProjects, setIsFetchingProjects] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    project_name: '',
    address_line_1: '',
    address_line_2: '',
    address_line_3: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    additional_details: '',
    estimated_budget: '0',
    currency: 'USD'
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');

  const [isAddingToExisting, setIsAddingToExisting] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' }
  ];

  const handleCreateCopy = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      onLoginRedirect();
      return;
    }
    setIsModalOpen(true);
    setIsAddingToExisting(false);
    setFormData(prev => ({
      ...prev,
      project_name: "New Plan"
    }));
    setError('');
    setValidationErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.project_name.trim()) {
      errors.project_name = 'Project name is required';
    }

    if (!formData.address_line_1.trim()) {
      errors.address_line_1 = 'Address line 1 is required';
    }

    if (!formData.country.trim()) {
      errors.country = 'Country is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBudgetChange = (increment: boolean) => {
    const currentBudget = parseFloat(formData.estimated_budget) || 0;
    const step = 1000;
    const newBudget = increment 
      ? currentBudget + step 
      : Math.max(0, currentBudget - step);
    
    setFormData(prev => ({
      ...prev,
      estimated_budget: newBudget.toString()
    }));
  };

  const createPlanCopy = async (projectId: string, token: string): Promise<Plan> => {
    try {
      let planToCopy: any = undefined;
      const planRes = await fetch(`${API_BASE_URL}/public/projects/${currentProjectID}/plans/${currentPlanID}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!planRes.ok) {
        const err = await planRes.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to fetch plan to copy: ${planRes.status}`);
      }

      planToCopy = await planRes.json();

      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/plans/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planToCopy)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to copy plan: ${response.status}`);
      }
      const finalPlan = await response.json();
      console.log('Plan copied successfully:', finalPlan);

      const cachedProjects = localStorage.getItem("userProjects");
      const currentProjects = cachedProjects ? JSON.parse(cachedProjects) : [];
      const updatedProjects = currentProjects.map((proj: Project) => {if(proj.id==projectId){
        console.log("Adding copied plan to cached project:", proj);
        return {
          ...proj,
          plans: proj.plans ? [finalPlan, ...proj.plans] : [finalPlan]
        }
      }else{return proj}
    });
      localStorage.setItem("userProjects", JSON.stringify(updatedProjects));
      console.log("Updated userProjects cache after plan copy:", updatedProjects);

      return finalPlan;
    } catch (error) {
      console.error('Error copying plan:', error);
      throw error;
    }
  };

  const fetchUserProjects = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      onLoginRedirect();
      return;
    }

    setIsFetchingProjects(true);
    setError('');
    const projectsCache = localStorage.getItem('userProjects') || "[]";
    const projects = JSON.parse(projectsCache)
    if(projectsCache.length>0){
      setProjects(projects);
      setIsFetchingProjects(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/projects/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 401) {
        localStorage.removeItem('access_token');
        onLoginRedirect();
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to fetch projects: ${res.status}`);
      }

      const data = await res.json();
      const list: Project[] = Array.isArray(data) ? data : (data.results || data.projects || []);
      setProjects(list);

      if (list.length > 0) setSelectedProjectId(prev => prev || list[0].id);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setIsFetchingProjects(false);
    }
  };

  const handleOpenExisting = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      onLoginRedirect();
      return;
    }

    setIsAddingToExisting(true);
    setError('');
    await fetchUserProjects();
  };

  const handleCreateCopyToExisting = async () => {
    if (!selectedProjectId) {
      setError('Please select a target project to add the plan to');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please login to perform this action');
        onLoginRedirect();
        return;
      }

      const newPlan = await createPlanCopy(selectedProjectId, token);

      window.location.href = `/playground/${selectedProjectId}/${newPlan.id}`;
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add plan to the selected project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Please login to create a project');
        onLoginRedirect();
        return;
      }

      const apiData = {
        project_name: formData.project_name.trim(),
        address_line_1: formData.address_line_1.trim(),
        address_line_2: formData.address_line_2.trim() || undefined,
        address_line_3: formData.address_line_3.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        country: formData.country.trim(),
        pincode: formData.pincode.trim() || undefined,
        estimated_budget: parseFloat(formData.estimated_budget) || 0,
        currency: formData.currency,
        additional_details: formData.additional_details.trim() || undefined,
      };

      const projectResponse = await fetch(`${API_BASE_URL}/projects/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      if (projectResponse.status === 401) {
        setError('Session expired. Please login again.');
        localStorage.removeItem('access_token');
        onLoginRedirect();
        return;
      }

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${projectResponse.status}`);
      }

      const createdProject: ProjectData = await projectResponse.json();
      const cachedProjects = localStorage.getItem("userProjects");
      const currentProjects = cachedProjects ? JSON.parse(cachedProjects) : [];
      const updatedProjects = [createdProject, ...currentProjects];
      localStorage.setItem("userProjects", JSON.stringify(updatedProjects));

      try {
        const newPlan = await createPlanCopy(createdProject.id, token);
        window.location.href = `/playground/${createdProject.id}/${newPlan.id}`;
      } catch (planError) {
        console.error('Plan copying failed:', planError);
        setError(`Project created successfully, but failed to copy plan: ${(planError as Error).message}`);
        setTimeout(() => {
          setIsModalOpen(false);
        }, 2000);
        return;
      }

      setIsModalOpen(false);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    if (!isLoading && !isFetchingProjects) {
      setIsModalOpen(false);
      setIsAddingToExisting(false);
      setFormData({
        project_name: '',
        address_line_1: '',
        address_line_2: '',
        address_line_3: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        additional_details: '',
        estimated_budget: '0',
        currency: 'USD'
      });
      setSelectedProjectId('');
      setError('');
      setValidationErrors({});
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (isAddingToExisting) {
        handleCreateCopyToExisting();
      } else {
        handleSubmit();
      }
    }
  };

  return (
    <>
      <button
        onClick={handleCreateCopy}
        className={`ccb-button ccb-button-${size}`}
      >
        {showIcon && <Copy className="ccb-icon" />}
        {buttonText}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="ccb-modal-overlay" onClick={handleModalClose}>
          <div className="ccb-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header - Fixed */}
            <div className="ccb-modal-header">
              {/* Mode Toggle Buttons */}
              <div className="ccb-mode-toggle">
                <button
                  type="button"
                  onClick={() => { setIsAddingToExisting(false); setError(''); }}
                  className={`ccb-mode-btn ${!isAddingToExisting ? 'active' : ''}`}
                  disabled={isLoading || isFetchingProjects}
                >
                  Create New Project
                </button>

                <button
                  type="button"
                  onClick={handleOpenExisting}
                  className={`ccb-mode-btn ${isAddingToExisting ? 'active' : ''}`}
                  disabled={isLoading || isFetchingProjects}
                >
                  {isFetchingProjects ? (
                    <>
                      <Loader2 className="ccb-spinner" />
                      Loading
                    </>
                  ) : (
                    'Add to Existing Project'
                  )}
                </button>
              </div>
              
              <button
                onClick={handleModalClose}
                disabled={isLoading || isFetchingProjects}
                className="ccb-close-btn"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="ccb-modal-body" onKeyPress={handleKeyPress}>


              {/* If adding to existing project - show project selector */}
              {isAddingToExisting ? (
                <div className="ccb-form-group">
                  <label className="ccb-label">Select Target Project <span className="ccb-required">*</span></label>

                  {isFetchingProjects ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Loader2 className="ccb-spinner" />
                      <span>Fetching your projects...</span>
                    </div>
                  ) : (
                    <>
                      {projects.length > 0 ? (
                        <select
                          name="selected_existing_project"
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          disabled={isLoading}
                          className="ccb-select"
                        >
                          <option value="">-- Select a project --</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.project_name || p.id}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="ccb-info">No projects found. Create a new project or refresh your projects.</div>
                      )}

                      {/* <div className="ccb-button-group" style={{ marginTop: 12 }}>
                        <button
                          onClick={() => { setIsAddingToExisting(false); setError(''); }}
                          disabled={isLoading}
                          className="ccb-btn-cancel"
                        >
                          Back
                        </button>

                        <button
                          onClick={handleCreateCopyToExisting}
                          disabled={isLoading || !selectedProjectId}
                          className="ccb-btn-submit"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="ccb-spinner" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="ccb-icon" />
                              Create Copy
                            </>
                          )}
                        </button>
                      </div> */}
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="ccb-form-group">
                    <label className="ccb-label">
                      Project Name <span className="ccb-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="project_name"
                      value={formData.project_name}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={`ccb-input ${validationErrors.project_name ? 'ccb-error' : ''}`}
                      placeholder="Enter project name"
                      autoFocus
                    />
                    {validationErrors.project_name && (
                      <span className="ccb-validation-error">{validationErrors.project_name}</span>
                    )}
                  </div>

                  {/* Address Fields */}
                  <div className="ccb-form-group">
                    <label className="ccb-label">
                      Address <span className="ccb-required">*</span>
                    </label>
                    <input
                      type="text"
                      name="address_line_1"
                      value={formData.address_line_1}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={`ccb-input ${validationErrors.address_line_1 ? 'ccb-error' : ''}`}
                      placeholder="Address line 1*"
                    />
                    {validationErrors.address_line_1 && (
                      <span className="ccb-validation-error">{validationErrors.address_line_1}</span>
                    )}
                    
                    <input
                      type="text"
                      name="address_line_2"
                      value={formData.address_line_2}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="ccb-input ccb-mt-2"
                      placeholder="Address Line 2 (Optional)"
                    />
                    
                    <input
                      type="text"
                      name="address_line_3"
                      value={formData.address_line_3}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="ccb-input ccb-mt-2"
                      placeholder="Address Line 3 (Optional)"
                    />
                  </div>

                  {/* Country and State Row */}
                  <div className="ccb-form-row">
                    <div className="ccb-form-group ccb-half">
                      <label className="ccb-label">
                        Country <span className="ccb-required">*</span>
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className={`ccb-input ${validationErrors.country ? 'ccb-error' : ''}`}
                        placeholder="Enter Country"
                      />
                      {validationErrors.country && (
                        <span className="ccb-validation-error">{validationErrors.country}</span>
                      )}
                    </div>
                    
                    <div className="ccb-form-group ccb-half">
                      <label className="ccb-label">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="ccb-input"
                        placeholder="Enter State"
                      />
                    </div>
                  </div>

                  {/* City and Pincode Row */}
                  <div className="ccb-form-row">
                    <div className="ccb-form-group ccb-half">
                      <label className="ccb-label">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="ccb-input"
                        placeholder="Enter City"
                      />
                    </div>
                    
                    <div className="ccb-form-group ccb-half">
                      <label className="ccb-label">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="ccb-input"
                        placeholder="Pincode (Optional)"
                      />
                    </div>
                  </div>

                  {/* Budget and Currency Row */}
                  <div className="ccb-form-row">
                    <div className="ccb-form-group ccb-half">
                      <label className="ccb-label">Estimated Budget</label>
                      <div className="ccb-budget-wrapper">
                        <input
                          type="number"
                          name="estimated_budget"
                          value={formData.estimated_budget}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="ccb-input ccb-budget-input"
                          min="0"
                          step="1000"
                          placeholder="Enter budget (Optional)"
                        />
                      </div>
                    </div>
                    
                    <div className="ccb-form-group ccb-half">
                      <label className="ccb-label">Currency</label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        className="ccb-select"
                      >
                        {currencies.map(curr => (
                          <option key={curr.value} value={curr.value}>
                            {curr.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="ccb-error-message">
                  {error}
                </div>
              )}

            </div>

            {/* Modal Footer - Fixed */}
            <div className="ccb-modal-footer">
              <div className="ccb-button-group">
                <button
                  onClick={handleModalClose}
                  disabled={isLoading || isFetchingProjects}
                  className="ccb-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  onClick={isAddingToExisting ? handleCreateCopyToExisting : handleSubmit}
                  disabled={isLoading || isFetchingProjects || (isAddingToExisting && !selectedProjectId)}
                  className="ccb-btn-submit"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="ccb-spinner" />
                      {isAddingToExisting ? 'Adding...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="ccb-icon" />
                      {isAddingToExisting ? 'Create Copy' : 'Create Copy'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateCopyButton;

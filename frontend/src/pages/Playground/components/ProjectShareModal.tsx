import React, { useState } from 'react';
// --- NEW: Import lucide-react icons ---
import { MapPin, DollarSign, ClipboardList, FileText } from 'lucide-react';

// --- INTERFACES ---

interface Project {
  id: string | number;
  project_name?: string;
  city?: string;
  state?: string;
  country?: string;
  estimated_budget?: string | number;
  currency?: string;
  plans_count?: number;
  additional_details?: string;
}

interface PlanShareModalProps {
  project: Project;
  onClose: () => void;
}

// --- STYLES ---

/* All styles are namespaced with 'project-share-modal-' to prevent conflicts.
  These styles are now injected by the component itself.
*/
const modalStyles = `
.project-share-modal-vars {
  --modal-bg: #ffffff;
  --modal-text: #1a1a1a;
  --modal-text-light: #666;
  --modal-border: #e5e5e5;
  --modal-input-bg: #f9fafb;
  --modal-input-border: #d1d5db;
  --modal-input-text: #374151;
  --modal-primary-btn-bg: #3b82f6;
  --modal-primary-btn-hover: #2563eb;
  --modal-primary-btn-text: #ffffff;
  --modal-success-bg: #10b981;
  --modal-secondary-btn-bg: #f3f4f6;
  --modal-secondary-btn-hover: #e5e7eb;
  --modal-secondary-btn-text: #374151;
}

/* This selector is now fixed: 'body.dark' comes first */
body.dark .project-share-modal-vars {
  --modal-bg: #1f2937;
  --modal-text: #f9fafb;
  --modal-text-light: #9ca3af;
  --modal-border: #4b5563;
  --modal-input-bg: #374151;
  --modal-input-border: #4b5563;
  --modal-input-text: #f9fafb;
  --modal-secondary-btn-bg: #4b5563;
  --modal-secondary-btn-hover: #525f76;
  --modal-secondary-btn-text: #f3f4f6;
}

.project-share-modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
  margin-top: 80px;
  animation: project-share-modal-fade-in 0.2s ease-out;
}

@keyframes project-share-modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.project-share-modal-content {
  background-color: var(--modal-bg);
  color: var(--modal-text);
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  animation: project-share-modal-scale-in 0.2s ease-out;
}

@keyframes project-share-modal-scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.project-share-modal-size {
  max-width: 550px;
  width: 100%;
}

.project-share-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--modal-border);
}

.project-share-modal-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: var(--modal-text);
}

.project-share-modal-close-btn {
  background: none;
  border: none;
  font-size: 28px;
  line-height: 1;
  color: var(--modal-text-light);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, color 0.2s;
}

.project-share-modal-close-btn:hover {
  background-color: var(--modal-secondary-btn-hover);
  color: var(--modal-text);
}

.project-share-modal-body {
  padding: 24px;
  overflow-y: auto;
}

.project-share-modal-details {
  margin-bottom: 24px;
}

.project-share-modal-project-name {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--modal-text);
}

.project-share-modal-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.project-share-modal-info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.project-share-modal-info-item.full-width {
  grid-column: 1 / -1;
}

/* --- UPDATED: Added flex properties for icon alignment --- */
.project-share-modal-info-label {
  font-size: 14px;
  color: var(--modal-text-light);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* --- NEW: Added styles for the icons --- */
.project-share-modal-info-label svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
  flex-shrink: 0;
}

.project-share-modal-info-value {
  font-size: 16px;
  color: var(--modal-text);
  font-weight: 600;
  /* Handle potential line breaks */
  white-space: pre-wrap;
  word-break: break-word;
}

.project-share-modal-link-container {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--modal-border);
}

.project-share-modal-link-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--modal-text);
  margin-bottom: 10px;
}

.project-share-modal-link-input-group {
  display: flex;
  gap: 8px;
}

.project-share-modal-link-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--modal-input-border);
  border-radius: 8px;
  font-size: 14px;
  background-color: var(--modal-input-bg);
  color: var(--modal-input-text);
  font-family: monospace;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.project-share-modal-link-input:focus {
  outline: none;
  border-color: var(--modal-primary-btn-bg);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.project-share-modal-copy-btn {
  padding: 10px 20px;
  background-color: var(--modal-primary-btn-bg);
  color: var(--modal-primary-btn-text);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  white-space: nowrap;
}

.project-share-modal-copy-btn:hover {
  background-color: var(--modal-primary-btn-hover);
}

.project-share-modal-copy-btn:active {
  transform: scale(0.98);
}

.project-share-modal-copy-btn.copied {
  background-color: var(--modal-success-bg);
}

.project-share-modal-actions {
  padding: 16px 24px;
  border-top: 1px solid var(--modal-border);
  background-color: var(--modal-bg);
  display: flex;
  justify-content: flex-end;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.project-share-modal-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.project-share-modal-cancel-btn {
  background-color: var(--modal-secondary-btn-bg);
  color: var(--modal-secondary-btn-text);
}

.project-share-modal-cancel-btn:hover {
  background-color: var(--modal-secondary-btn-hover);
}
`;

// --- MODAL COMPONENT ---

const ProjectShareModal: React.FC<PlanShareModalProps> = ({ project, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  // Ensure window.location.origin is available, provide fallback
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const shareLink = `${origin}/view/projects/${project.id}/plans`;

  /**
    * Handles copying the share link to the clipboard.
    * Uses document.execCommand for reliability in iFrames.
    */
  const handleCopyLink = () => {
    const textArea = document.createElement('textarea');
    textArea.value = shareLink;

    // --- Style to hide the textarea ---
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        console.error('Failed to copy link.');
        // You could show a user-friendly error message here
      }
    } catch (err) {
      console.error('Error copying link:', err);
      // You could show a user-friendly error message here
    }

    document.body.removeChild(textArea);
  };

  /**
    * Formats the budget into K/M format.
    */
  const formatBudget = (budget: string | number | undefined, currency?: string): string => {
    const amount = parseFloat(String(budget ?? 0));
    if (isNaN(amount)) {
      return currency ? `0 ${currency}` : '0';
    }
    const safeCurrency = currency ?? '';
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M ${safeCurrency}`.trim();
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K ${safeCurrency}`.trim();
    }
    return `${amount.toLocaleString()} ${safeCurrency}`.trim();
  };

  /**
    * Combines location parts into a single string.
    */
  const getProjectLocation = (project: Project): string => {
    const parts = [project.city, project.state, project.country].filter(Boolean);
    // This is the line that was fixed (added closing quote)
    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  return (
    <>
      {/* Inject styles directly into the component render.
        This ensures they are applied whenever the modal is shown
        and avoids global scope pollution or import issues.
      */}
      <style>{modalStyles}</style>
      
      <div className="project-share-modal-overlay project-share-modal-vars" onClick={onClose}>
        <div className="project-share-modal-content project-share-modal-size" onClick={(e) => e.stopPropagation()}>
          <div className="project-share-modal-header">
            <h2>Share Project</h2>
            <button
              className="project-share-modal-close-btn"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          
          <div className="project-share-modal-body">
            <div className="project-share-modal-details">
              <h3 className="project-share-modal-project-name">{project.project_name || 'Unnamed Project'}</h3>
              
              <div className="project-share-modal-info-grid">
                
                {/* --- UPDATED: Emoji replaced with Lucide icon --- */}
                <div className="project-share-modal-info-item">
                  <span className="project-share-modal-info-label">
                    <MapPin />
                    Location
                  </span>
                  <span className="project-share-modal-info-value">{getProjectLocation(project)}</span>
                </div>
                
                {/* --- UPDATED: Emoji replaced with Lucide icon --- */}
                <div className="project-share-modal-info-item">
                  <span className="project-share-modal-info-label">
                    <DollarSign />
                    Budget
                  </span>
                  <span className="project-share-modal-info-value">
                    {formatBudget(project.estimated_budget, project.currency)}
                  </span>
                </div>
                
                {/* --- UPDATED: Emoji replaced with Lucide icon --- */}
                <div className="project-share-modal-info-item">
                  <span className="project-share-modal-info-label">
                    <ClipboardList />
                    Plans
                  </span>
                  <span className="project-share-modal-info-value">{project.plans_count || 0} Plans</span>
                </div>
                
                {project.additional_details && (
                  /* --- UPDATED: Emoji replaced with Lucide icon --- */
                  <div className="project-share-modal-info-item full-width">
                    <span className="project-share-modal-info-label">
                      <FileText />
                      Details
                    </span>
                    <span className="project-share-modal-info-value">{project.additional_details}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="project-share-modal-link-container">
              <label className="project-share-modal-link-label">Shareable Link</label>
              <div className="project-share-modal-link-input-group">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="project-share-modal-link-input"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  className={`project-share-modal-copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                >
                  {copied ? '✓ Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          </div>

          <div className="project-share-modal-actions">
            <button
              className="project-share-modal-btn project-share-modal-cancel-btn"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};


export default ProjectShareModal;
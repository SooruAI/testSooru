import React from 'react';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
 isOpen: boolean;
 onSave: () => void;
 onDontSave: () => void;
 onCancel: () => void;
 isSaving?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
 isOpen,
 onSave,
 onDontSave,
 onCancel,
 isSaving = false,
}) => {
 if (!isOpen) return null;

 return (
   <div className="confirmation-modal-overlay">
     <div className="confirmation-modal">
       <div className="confirmation-modal-header">
         <h2>Unsaved Changes</h2>
         <button 
           className="confirmation-close-btn" 
           onClick={onCancel}
           disabled={isSaving}
           style={{ opacity: isSaving ? 0.5 : 1 }}
         >
           ✖
         </button>
       </div>
       <div className="confirmation-modal-body">
         <p>Save changes to the floor plan before leaving?</p>
       </div>
       <div className="confirmation-modal-actions">
         <button 
           className="confirmation-save-btn" 
           onClick={onSave}
           disabled={isSaving}
           style={{
             opacity: isSaving ? 0.7 : 1,
             cursor: isSaving ? 'not-allowed' : 'pointer',
             display: 'flex',
             alignItems: 'center',
             gap: '8px',
             justifyContent: 'center'
           }}
         >
           {isSaving && (
             <div 
               style={{
                 width: '16px',
                 height: '16px',
                 border: '2px solid #ffffff',
                 borderTop: '2px solid transparent',
                 borderRadius: '50%',
                 animation: 'spin 1s linear infinite'
               }}
             />
           )}
           {isSaving ? 'Saving...' : 'Save'}
         </button>
         <button 
           className="confirmation-dont-save-btn" 
           onClick={onDontSave}
           disabled={isSaving}
           style={{ opacity: isSaving ? 0.5 : 1 }}
         >
           Don't Save
         </button>
       </div>
     </div>
     
     <style>{`
       @keyframes spin {
         0% { transform: rotate(0deg); }
         100% { transform: rotate(360deg); }
       }
     `}</style>
   </div>
 );
};

export default ConfirmationModal;
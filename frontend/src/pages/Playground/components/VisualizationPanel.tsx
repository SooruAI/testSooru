import React, { useEffect, useRef } from 'react';
import { useFloorPlan, VisualizationOptions } from '../FloorPlanContext';
import './VisualizationPanel.css';

interface VisualizationPanelProps {
  onClose: () => void;
}

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ onClose }) => {
  const { visualizationOptions, updateVisualizationOption, resetVisualizationOptions } = useFloorPlan();
  const panelRef = useRef<HTMLDivElement>(null);

  const blockAllEvents = (e: React.MouseEvent | React.WheelEvent) => {
    e.stopPropagation();
  };

  const blockWheelEvents = (e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault(); 
  };
  
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleWheel = (e: WheelEvent) => {
      e.stopPropagation();
      e.preventDefault();
    };

    panel.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      panel.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handleToggle = (option: keyof VisualizationOptions) => {
    if (typeof visualizationOptions[option] === 'boolean') {
      updateVisualizationOption(
        option,
        !visualizationOptions[option] as any
      );
    }
  };

  const handleSliderChange = (option: keyof VisualizationOptions, value: number) => {
    updateVisualizationOption(option, value as any);
  };

  const handleSelectChange = (option: keyof VisualizationOptions, value: string) => {
    updateVisualizationOption(option, value as any);
  };

  const handleColorSampleClick = (colorScheme: string) => {
    handleSelectChange('colorScheme', colorScheme as any);
  };

  return (
    <div 
      ref={panelRef}
      className="vizpanel-container"
      onMouseDown={blockAllEvents}
      onMouseMove={blockAllEvents}
      onMouseUp={blockAllEvents}
      onClick={blockAllEvents}
      onDoubleClick={blockAllEvents} 
      onWheel={blockWheelEvents}
      style={{userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",}}
    >
      <div className="vizpanel-header">
        <h2>Visualization Options</h2>
        <button className="vizpanel-close-btn" onClick={(e) => {
          blockAllEvents(e);
          onClose();
        }}>×</button>
      </div>
      
      <div className="vizpanel-content">
        <div className="vizpanel-section">
          <h3>Display Options</h3>
          
          <div className="vizpanel-toggle-option">
            <label>
              <input
                type="checkbox"
                checked={visualizationOptions.showMeasurements}
                onChange={() => handleToggle('showMeasurements')}
              />
              Show Measurements
            </label>
          </div>
          
          <div className="vizpanel-toggle-option">
            <label>
              <input
                type="checkbox"
                checked={visualizationOptions.showRoomLabels}
                onChange={() => handleToggle('showRoomLabels')}
              />
              Show Room Labels
            </label>
          </div>
          
          <div className="vizpanel-toggle-option">
            <label>
              <input
                type="checkbox"
                checked={visualizationOptions.showGrid}
                onChange={() => handleToggle('showGrid')}
              />
              Show Grid
            </label>
          </div>
        </div>
        
        <div className="vizpanel-section">
          <h3>Color Scheme</h3>
          <div className="vizpanel-select-option">
            <select
              value={visualizationOptions.colorScheme}
              onChange={(e) => handleSelectChange('colorScheme', e.target.value as any)}
            >
              <option value="standard">Standard</option>
              <option value="monochrome">Monochrome</option>
              <option value="pastel">Pastel</option>
              <option value="contrast">High Contrast</option>
            </select>
          </div>
          
          <div className="vizpanel-color-preview">
            <div 
              className={`vizpanel-color-sample vizpanel-color-standard ${visualizationOptions.colorScheme === 'standard' ? 'vizpanel-color-selected' : ''}`}
              title="Standard"
              onClick={(e) => {
                blockAllEvents(e);
                handleColorSampleClick('standard');
              }}
            ></div>
            <div 
              className={`vizpanel-color-sample vizpanel-color-monochrome ${visualizationOptions.colorScheme === 'monochrome' ? 'vizpanel-color-selected' : ''}`}
              title="Monochrome"
              onClick={(e) => {
                blockAllEvents(e);
                handleColorSampleClick('monochrome');
              }}
            ></div>
            <div 
              className={`vizpanel-color-sample vizpanel-color-pastel ${visualizationOptions.colorScheme === 'pastel' ? 'vizpanel-color-selected' : ''}`}
              title="Pastel"
              onClick={(e) => {
                blockAllEvents(e);
                handleColorSampleClick('pastel');
              }}
            ></div>
            <div 
              className={`vizpanel-color-sample vizpanel-color-contrast ${visualizationOptions.colorScheme === 'contrast' ? 'vizpanel-color-selected' : ''}`}
              title="High Contrast"
              onClick={(e) => {
                blockAllEvents(e);
                handleColorSampleClick('contrast');
              }}
            ></div>
          </div>
        </div>
        
        <div className="vizpanel-actions">
          <button 
            className="vizpanel-reset-btn" 
            onClick={(e) => {
              blockAllEvents(e);
              resetVisualizationOptions();
            }}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;
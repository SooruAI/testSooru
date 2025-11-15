import React from "react";
import "./Compass.css";

interface CompassProps {
  size: number;
  rotation: number;
  onRotate: (rotation: number) => void;
}

export const Compass = ({ size, rotation, onRotate }: CompassProps) => {
  const handleRotateLeft = () => {
    onRotate((rotation - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    onRotate((rotation + 90) % 360);
  };

  return (
    <div
      className="compass-container"
      style={{ width: size + size * 2.85, height: size * 2.2 }}
    >
      <button onClick={handleRotateLeft} className="rotate-button" aria-label="Rotate Left">
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rotate-left-icon"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>

      <div
        className="compass-body"
        style={{
          width: size + size * 3.5,
          height: size * 1.7,
          transform: `rotate(${rotation}deg)`,
        }}
      >
        <div className="compass-dial" style={{  userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",}}>
          <div className="compass-text north">N</div>
          <div className="compass-text south">S</div>
          <div className="compass-text east">E</div>
          <div className="compass-text west">W</div>

          <div className="compass-needle">
            <div className="needle-top"></div>
            <div className="needle-bottom"></div>
          </div>
        </div>
      </div>

      <button onClick={handleRotateRight} className="rotate-button" aria-label="Rotate Right">
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="rotate-right-icon"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
    </div>
  );
};
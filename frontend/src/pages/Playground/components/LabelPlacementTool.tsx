import React, { useState, useRef, useEffect } from "react";

interface LabelPlacementToolProps {
  onPlaceLabel: (text: string, position: { x: number; y: number }) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

const LabelPlacementTool: React.FC<LabelPlacementToolProps> = ({
  onPlaceLabel,
  svgRef,
}) => {
  const [labelText, setLabelText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && labelText.trim()) {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!svgRef.current || !labelText.trim()) return;

    const handleSvgClick = (e: MouseEvent) => {
      const svgElement = svgRef.current;
      if (!svgElement) return;

      const rect = svgElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      onPlaceLabel(labelText, { x, y });
      setLabelText("");
    };

    const svg = svgRef.current;
    svg.addEventListener("click", handleSvgClick);

    return () => {
      if (svg) {
        svg.removeEventListener("click", handleSvgClick);
      }
    };
  }, [labelText, onPlaceLabel, svgRef]);

  return (
    <div className="label-placement-tool">
      <p className="instruction-text">
        Enter label text, then click on the floor plan to place it:
      </p>

      <div className="label-input-container">
        <input
          ref={inputRef}
          type="text"
          value={labelText}
          onChange={(e) => setLabelText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter label text"
          className="label-input"
        />

        {labelText.trim() && (
          <div className="click-instruction">
            Now click on the floor plan to place this label
          </div>
        )}
      </div>
    </div>
  );
};

export default LabelPlacementTool;

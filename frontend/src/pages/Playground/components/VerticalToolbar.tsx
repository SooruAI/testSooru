import React, { useState } from "react";
import "./VerticalToolbar.css";
import { useFloorPlan } from "../FloorPlanContext";
import {
  DashboardOutlined,
} from "@mui/icons-material";

const toolbarItems = [
  { id: "project", icon: "📋", label: "Project", tooltip: "Project view" },
  { id: "build", icon: "🔧", label: "Build", tooltip: "Building tools" },
  { id: "info", icon: "ℹ️", label: "Info", tooltip: "Information" },
  {
    id: "objects",
    icon: "🛋️",
    label: "Objects",
    tooltip: "Furniture and objects",
  },
  {
    id: "colors",
    icon: "🎨",
    label: "Appearance",
    tooltip: "Control appearance and display options",
  },
  //{ id: 'styleboards', icon: '🖼️', label: 'Styleboards', tooltip: 'Style options' },
  // { id: 'finishes', icon: '🧰', label: 'Finishes', tooltip: 'Finishing touches' },
  { id: "exports", icon: "💾", label: "Export", tooltip: "Export options" },
  { id: "help", icon: "❓", label: "Help", tooltip: "Help center" },
];

interface VerticalToolbarProps {
  onToolSelected: (toolId: string) => void;
}

const VerticalToolbar: React.FC<VerticalToolbarProps> = ({
  onToolSelected,
}) => {
  const { activeTool, setActiveTool, setScale, setPosition } = useFloorPlan();

  const handleToolClick = (toolId: string) => {
    setActiveTool(toolId);
    if (toolId !== "design") {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
    onToolSelected(toolId);
  };

  const renderIcon = (item: { id: string; icon: string }) => {
    if (item.id === "project") {
      return <DashboardOutlined fontSize="small" />;
    } else if (item.id === "build") {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"
            fill="currentColor"
          />
        </svg>
      );
    } else if (item.id === "info") {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 7H13V9H11V7ZM11 11H13V17H11V11ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
            fill="currentColor"
          />
        </svg>
      );
    } else if (item.id === "objects") {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M21 9V7c0-1.65-1.35-3-3-3H6C4.35 4 3 5.35 3 7v2c-1.65 0-3 1.35-3 3v5c0 1.65 1.35 3 3 3h18c1.65 0 3-1.35 3-3v-5c0-1.65-1.35-3-3-3zM6 7h12v2H6V7zm15 10H3v-5h2v3h14v-3h2v5z"
            fill="currentColor"
          />
        </svg>
      );
    } else if (item.id === "colors") {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"
            fill="currentColor"
          />
        </svg>
      );
    } else if (item.id === "styleboards") {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"
            fill="currentColor"
          />
        </svg>
      );
    } else if (item.id === "exports") {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M6 19V7H10V5H6C4.9 5 4 5.9 4 7V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V15H18V19H6Z"
            fill="currentColor"
          />
          <path d="M16 5L20 9L16 13V10H10V8H16V5Z" fill="currentColor" />
        </svg>
      );
    } else if (item.id === "help") {
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 19H11V17H13V19ZM15.07 11.25L14.17 12.17C13.45 12.9 13 13.5 13 15H11V14.5C11 13.4 11.45 12.4 12.17 11.67L13.41 10.41C13.78 10.05 14 9.55 14 9C14 7.9 13.1 7 12 7C10.9 7 10 7.9 10 9H8C8 6.79 9.79 5 12 5C14.21 5 16 6.79 16 9C16 9.88 15.64 10.67 15.07 11.25Z"
            fill="currentColor"
          />
        </svg>
      );
    }

    return <span className="emoji-icon">{item.icon}</span>;
  };

  return (
    <div className="vertical-toolbar">
      <div
        className="toolbar-items"
        style={{
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      >
        {toolbarItems.map((item) => (
          <div
            key={item.id}
            className={`toolbar-item ${activeTool === item.id ? "active" : ""}`}
            onClick={() => handleToolClick(item.id)}
            title={item.tooltip}
          >
            <div className="item-icon">{renderIcon(item)}</div>
            <div className="item-label">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerticalToolbar;

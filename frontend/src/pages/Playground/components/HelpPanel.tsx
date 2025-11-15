import React, { useState } from "react";
import "./ToolPanel.css";

interface HelpPanelProps {
  onSelectOption?: (optionId: string) => void;
}

interface ShortcutSection {
  title: string;
  shortcuts: { action: string; instruction: string }[];
}

const HelpPanel: React.FC<HelpPanelProps> = ({ onSelectOption }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedShortcut, setExpandedShortcut] = useState<string | null>(null);

  const shortcutSections: ShortcutSection[] = [
    {
      title: "General",
      shortcuts: [
        { action: "undo", instruction: "ctrl/cmd + Z" },
        {
          action: "save changes",
          instruction: "click on save changes button (bottom center)",
        },
        {
          action: "reset changes",
          instruction: "click on reset changes button (bottom center)",
        },
        {
          action: "delete walls/rooms/labels/signs",
          instruction: "click on wall/room/label/sign → press delete key",
        },
        {
          action: "select multiple rooms",
          instruction: "click one room → ctrl/cmd + click another room",
        },
        {
          action: "zoom floor plan",
          instruction: "ctrl/cmd + scroll mouse wheel",
        },
      ],
    },
    {
      title: "Room Operations",
      shortcuts: [
        { action: "move room", instruction: "click on lock icon in top right corner to unlock room movement → click on room → hold and drag"},
        {
          action: "resize room",
          instruction: "click on room → hold wall center and drag",
        },
        {
          action: "rotate clockwise",
          instruction: "left-click on the rotate icon in room center",
        },
        {
          action: "rotate counterclockwise",
          instruction: "right-click on the rotate icon in room center",
        },
        {
          action: "view room area",
          instruction:
            "click on room → projects toolbar opens showing the area",
        },
      ],
    },
    {
      title: "Drawing & Building",
      shortcuts: [
        {
          action: "draw new room",
          instruction: "open build toolbar → select draw room",
        },
        {
          action: "draw wall",
          instruction: "open build toolbar → select draw wall",
        },
        {
          action: "place label",
          instruction: "open info toolbar → select place label",
        },
        {
          action: "place signs and symbols",
          instruction: "open info toolbar → select place signs and symbols",
        },
        {
          action: "change room type",
          instruction: "open info toolbar → select set roomtype",
        },
      ],
    },
    {
      title: "View & Customization",
      shortcuts: [
        {
          action: "rotate floor plan",
          instruction:
            "click rotate buttons on the sides of compass (bottom right)",
        },
        {
          action: "change wall thickness",
          instruction: "click on wall → adjust in the modal that appears",
        },
        {
          action: "change appearance",
          instruction: "open appearance toolbar → adjust settings",
        },
      ],
    },
    {
      title: "Download & Share",
      shortcuts: [
        {
          action: "export floor plan",
          instruction: "open export toolbar → download as PNG, PDF, or CAD file",
        },
        {
          action: "share floor plan",
          instruction: "press share button on the top right corner of the page",
        },
      ],
    },
  ];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
    setExpandedShortcut(null);
  };

  const toggleShortcut = (shortcutKey: string) => {
    setExpandedShortcut(expandedShortcut === shortcutKey ? null : shortcutKey);
  };

  return (
    <div
      className="panel-options help-options"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        maxHeight: "500px",
        overflowY: "auto",
      }}
    >
      <div className="shortcuts-container">
        {shortcutSections.map((section, index) => {
          if (expandedSection !== null && expandedSection !== section.title) {
            return null;
          }

          return (
            <div key={index} className="shortcut-section">
              <div
                className="section-header"
                onClick={() => toggleSection(section.title)}
                style={{
                  cursor: "pointer",
                  padding: "10px",
                  backgroundColor: "#f5f5f5",
                  color: "black !important",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "14px",
                  fontWeight: "500",
                  marginBottom: "1px",
                }}
              >
                <span>{section.title}</span>
                <span
                  style={{
                    fontSize: "10px",
                    transform:
                      expandedSection === section.title
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  {expandedSection === section.title ? "▼" : "▶"}
                </span>
              </div>
              {expandedSection === section.title && (
                <div
                  className="shortcuts-list"
                  style={{ backgroundColor: "#fff" }}
                >
                  {section.shortcuts.map((shortcut, idx) => {
                    const shortcutKey = `${section.title}-${idx}`;
                    return (
                      <div key={idx}>
                        <div
                          className="shortcut-item"
                          onClick={() => toggleShortcut(shortcutKey)}
                          style={{
                            cursor: "pointer",
                            padding: "8px 10px",
                            backgroundColor: "#ffffff",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "13px",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                        >
                          <span style={{ color: "#333" }}>{shortcut.action}</span>
                          <span
                            style={{
                              fontSize: "10px",
                              transform:
                                expandedShortcut === shortcutKey
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              transition: "transform 0.2s",
                              color: "grey",
                            }}
                          >
                            {expandedShortcut === shortcutKey ? "▼" : "▶"}
                          </span>
                        </div>
                        {expandedShortcut === shortcutKey && (
                          <div
                            style={{
                              padding: "8px 10px",
                              backgroundColor: "#ffffff",
                              borderBottom: "1px solid #f0f0f0",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: "#f5f5f5",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                color: "#666",
                                display: "inline-block",
                              }}
                            >
                              {shortcut.instruction}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: "0px",
          padding: "8px 10px",
          borderTop: "1px solid #e0e0e0",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          position: "relative",
          right: "5px",
        }}
      >
        <p style={{ fontSize: "12px", color: "#666", marginRight: "5px" }}>
          Need more help?
        </p>
        <a 
          href="/support-and-feedback"
          target="_blank"
          onClick={(e) => {
            if (onSelectOption) onSelectOption("contact-support");
          }}
          style={{
            fontSize: "12px",
            color: "#0066cc",
            textDecoration: "none",
          }}
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default HelpPanel;
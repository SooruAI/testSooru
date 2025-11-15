import React, { useState } from "react";
import "./ToolPanel.css";
import { useFloorPlan } from "../FloorPlanContext";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";

interface ExportsPanelProps {
    onSelectOption?: (optionId: string) => void;
}

const ExportsPanel: React.FC<ExportsPanelProps> = ({ onSelectOption }) => {
    const [includeMeasurements, setIncludeMeasurements] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<string>("");

    const { floorPlanData, updateVisualizationOption, visualizationOptions } =
        useFloorPlan();

    const handleExportOption = async (format: string) => {
        setIsExporting(true);
        setExportStatus(`Exporting as ${format.toUpperCase()}...`);

        try {
            updateVisualizationOption("showMeasurements", includeMeasurements);

            await new Promise((resolve) => setTimeout(resolve, 500));

            switch (format) {
                case "png":
                    await exportAsPNG();
                    break;
                case "pdf":
                    await exportAsPDF();
                    break;
                case "cad":
                    await exportAsCAD();
                    break;
                default:
                    console.error("Unknown export format:", format);
            }

            setExportStatus("Export completed successfully!");

            if (!includeMeasurements) {
                setIncludeMeasurements(true);
                updateVisualizationOption("showMeasurements", true);
            }

            if (onSelectOption) {
                onSelectOption(format);
            }
        } catch (error) {
            console.error("Export failed:", error);
            setExportStatus("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
            setTimeout(() => setExportStatus(""), 3000);
        }
    };

    const exportAsPNG = async () => {
        const floorPlanElement = document.querySelector(".floor-plan-container");
        const parentContainer = floorPlanElement?.parentElement;

        if (!floorPlanElement || !parentContainer) {
            throw new Error("Floor plan element not found");
        }

        try {
            const clonedParentContainer = parentContainer.cloneNode(
                true
            ) as HTMLElement;
            const clonedContainer = clonedParentContainer.querySelector(
                ".floor-plan-container"
            ) as HTMLElement;

            const tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.backgroundColor = "#ffffff";
            tempContainer.style.overflow = "visible";
            document.body.appendChild(tempContainer);

            tempContainer.appendChild(clonedContainer);

            clonedContainer.style.position = "relative";
            clonedContainer.style.transform = "none";
            clonedContainer.style.left = "0";
            clonedContainer.style.top = "0";

            const svg = clonedContainer.querySelector("svg");
            if (svg) {
                const bbox = svg.getBBox();
                const exportPadding = 100;
                const topPadding = includeMeasurements ? 140 : 100;
                clonedContainer.style.width = bbox.width + 2 * exportPadding + "px";
                clonedContainer.style.height =
                    bbox.height + exportPadding + topPadding + "px";

                svg.setAttribute(
                    "viewBox",
                    `${bbox.x - exportPadding} ${bbox.y - topPadding} ${bbox.width + 2 * exportPadding
                    } ${bbox.height + exportPadding + topPadding}`
                );
            }

            const originalAreaText = parentContainer.querySelector(
                ".always-black-text"
            ) as HTMLElement;

            if (originalAreaText && includeMeasurements) {
                const textContent =
                    originalAreaText.innerText || originalAreaText.textContent || "";

                const areaTextDiv = document.createElement("div");
                areaTextDiv.innerHTML = textContent;
                areaTextDiv.style.position = "absolute";
                areaTextDiv.style.top = "20px";
                areaTextDiv.style.left = "50%";
                areaTextDiv.style.transform = "translateX(-50%)";
                areaTextDiv.style.fontSize = "11px";
                areaTextDiv.style.fontWeight = "bold";
                areaTextDiv.style.color = "#000000";
                areaTextDiv.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                areaTextDiv.style.padding = "5px 10px";
                areaTextDiv.style.borderRadius = "3px";
                areaTextDiv.style.zIndex = "9999";
                areaTextDiv.style.whiteSpace = "nowrap";
                areaTextDiv.style.textAlign = "center";
                areaTextDiv.className = "always-black-text";

                clonedContainer.appendChild(areaTextDiv);
            }

            const dimensionLabels =
                clonedContainer.querySelectorAll(".dimension-label");
            dimensionLabels.forEach((label) => {
                (label as HTMLElement).style.display = includeMeasurements
                    ? "block"
                    : "none";
            });

            const roomLabels = clonedContainer.querySelectorAll(".room-label");
            roomLabels.forEach((label) => {
                if ((label as HTMLElement).classList.contains("room-name1")) {
                    (label as HTMLElement).style.fontSize = "9px";
                } else if (
                    (label as HTMLElement).classList.contains("dimension-label")
                ) {
                    (label as HTMLElement).style.fontSize = "7px";
                } else {
                    (label as HTMLElement).style.fontSize = "8px";
                }
            });

            const areaText = clonedContainer.querySelector(".always-black-text");
            if (areaText) {
                (areaText as HTMLElement).style.fontSize = "10px";
                (areaText as HTMLElement).style.display = "block";
            }

            const wallLines = clonedContainer.querySelectorAll(".wall-line");
            wallLines.forEach((wall) => {
                (wall as SVGLineElement).setAttribute("stroke", "#000000");
                (wall as SVGLineElement).setAttribute("stroke-width", "0.5");
            });

            const roomPolygons = clonedContainer.querySelectorAll(".room-polygon");
            roomPolygons.forEach((room) => {
                (room as SVGPolygonElement).setAttribute("stroke", "#000000");
                (room as SVGPolygonElement).setAttribute("stroke-width", "0.5");
            });

            const wallPolygons = clonedContainer.querySelectorAll(".wall-polygon");
            wallPolygons.forEach((wall) => {
                (wall as SVGPolygonElement).setAttribute("stroke", "#000000");
                (wall as SVGPolygonElement).setAttribute("stroke-width", "0.5");
                (wall as SVGPolygonElement).setAttribute("fill", "#000000");
            });

            const dataUrl = await htmlToImage.toPng(clonedContainer, {
                quality: 0.95,
                backgroundColor: "#ffffff",
                pixelRatio: 2,
            });

            document.body.removeChild(tempContainer);

            saveAs(
                dataUrl,
                `floor-plan-${new Date().toISOString().split("T")[0]}.png`
            );
        } catch (error) {
            console.error("PNG export error:", error);
            throw error;
        }
    };

    const exportAsPDF = async () => {
        const floorPlanElement = document.querySelector(".floor-plan-container");
        const parentContainer = floorPlanElement?.parentElement;

        if (!floorPlanElement || !parentContainer) {
            throw new Error("Floor plan element not found");
        }

        try {
            const clonedParentContainer = parentContainer.cloneNode(
                true
            ) as HTMLElement;
            const clonedContainer = clonedParentContainer.querySelector(
                ".floor-plan-container"
            ) as HTMLElement;

            const tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.backgroundColor = "#ffffff";
            tempContainer.style.overflow = "visible";
            document.body.appendChild(tempContainer);

            tempContainer.appendChild(clonedContainer);

            clonedContainer.style.position = "relative";
            clonedContainer.style.transform = "none";
            clonedContainer.style.left = "0";
            clonedContainer.style.top = "0";

            const svg = clonedContainer.querySelector("svg");
            if (svg) {
                const bbox = svg.getBBox();
                const exportPadding = 100;
                const topPadding = includeMeasurements ? 140 : 100;
                clonedContainer.style.width = bbox.width + 2 * exportPadding + "px";
                clonedContainer.style.height =
                    bbox.height + exportPadding + topPadding + "px";

                svg.setAttribute(
                    "viewBox",
                    `${bbox.x - exportPadding} ${bbox.y - topPadding} ${bbox.width + 2 * exportPadding
                    } ${bbox.height + exportPadding + topPadding}`
                );
            }

            const originalAreaText = parentContainer.querySelector(
                ".always-black-text"
            ) as HTMLElement;

            if (originalAreaText && includeMeasurements) {
                const textContent =
                    originalAreaText.innerText || originalAreaText.textContent || "";

                const areaTextDiv = document.createElement("div");
                areaTextDiv.innerHTML = textContent;
                areaTextDiv.style.position = "absolute";
                areaTextDiv.style.top = "20px";
                areaTextDiv.style.left = "50%";
                areaTextDiv.style.transform = "translateX(-50%)";
                areaTextDiv.style.fontSize = "11px";
                areaTextDiv.style.fontWeight = "bold";
                areaTextDiv.style.color = "#000000";
                areaTextDiv.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                areaTextDiv.style.padding = "5px 10px";
                areaTextDiv.style.borderRadius = "3px";
                areaTextDiv.style.zIndex = "9999";
                areaTextDiv.style.whiteSpace = "nowrap";
                areaTextDiv.style.textAlign = "center";
                areaTextDiv.className = "always-black-text";

                clonedContainer.appendChild(areaTextDiv);
            }

            const dimensionLabels =
                clonedContainer.querySelectorAll(".dimension-label");
            dimensionLabels.forEach((label) => {
                (label as HTMLElement).style.display = includeMeasurements
                    ? "block"
                    : "none";
            });

            const roomLabels = clonedContainer.querySelectorAll(".room-label");
            roomLabels.forEach((label) => {
                if ((label as HTMLElement).classList.contains("room-name1")) {
                    (label as HTMLElement).style.fontSize = "9px";
                } else if (
                    (label as HTMLElement).classList.contains("dimension-label")
                ) {
                    (label as HTMLElement).style.fontSize = "7px";
                } else {
                    (label as HTMLElement).style.fontSize = "8px";
                }
            });

            const areaText = clonedContainer.querySelector(".always-black-text");
            if (areaText) {
                (areaText as HTMLElement).style.fontSize = "10px";
                (areaText as HTMLElement).style.display = "block";
            }

            const wallLines = clonedContainer.querySelectorAll(".wall-line");
            wallLines.forEach((wall) => {
                (wall as SVGLineElement).setAttribute("stroke", "#000000");
                (wall as SVGLineElement).setAttribute("stroke-width", "0.5");
            });

            const roomPolygons = clonedContainer.querySelectorAll(".room-polygon");
            roomPolygons.forEach((room) => {
                (room as SVGPolygonElement).setAttribute("stroke", "#000000");
                (room as SVGPolygonElement).setAttribute("stroke-width", "0.5");
            });

            const wallPolygons = clonedContainer.querySelectorAll(".wall-polygon");
            wallPolygons.forEach((wall) => {
                (wall as SVGPolygonElement).setAttribute("stroke", "#000000");
                (wall as SVGPolygonElement).setAttribute("stroke-width", "0.5");
                (wall as SVGPolygonElement).setAttribute("fill", "#000000");
            });

            const dataUrl = await htmlToImage.toPng(clonedContainer, {
                quality: 0.95,
                backgroundColor: "#ffffff",
                pixelRatio: 2,
            });

            document.body.removeChild(tempContainer);

            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4",
            });

            const img = new Image();
            img.src = dataUrl;

            await new Promise((resolve) => {
                img.onload = () => {
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    const margin = 10;

                    let imgWidth = pageWidth - 2 * margin;
                    let imgHeight = (img.height * imgWidth) / img.width;

                    if (imgHeight > pageHeight - 20) {
                        imgHeight = pageHeight - 20;
                        imgWidth = (img.width * imgHeight) / img.height;
                    }

                    const x = (pageWidth - imgWidth) / 2;
                    const y = margin;

                    pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);

                    pdf.save(`floor-plan-${new Date().toISOString().split("T")[0]}.pdf`);
                    resolve(true);
                };
            });
        } catch (error) {
            console.error("PDF export error:", error);
            throw error;
        }
    };

const exportAsCAD = async () => {
    try {
        let dxfContent = "0\nSECTION\n2\nHEADER\n";
        dxfContent += "9\n$ACADVER\n1\nAC1014\n";
        dxfContent += "9\n$INSUNITS\n70\n6\n";
        dxfContent += "9\n$DIMSCALE\n40\n1.0\n";
        dxfContent += "9\n$LTSCALE\n40\n1.0\n";
        dxfContent += "0\nENDSEC\n";

        dxfContent += "0\nSECTION\n2\nTABLES\n";
        dxfContent += "0\nTABLE\n2\nLTYPE\n";
        dxfContent +=
            "0\nLTYPE\n2\nCONTINUOUS\n70\n0\n3\nSolid line\n72\n65\n73\n0\n40\n0.0\n";
        dxfContent += "0\nENDTAB\n";

        dxfContent += "0\nTABLE\n2\nLAYER\n";
        dxfContent +=
            "0\nLAYER\n2\nWALLS\n70\n0\n62\n7\n370\n18\n6\nCONTINUOUS\n";
        dxfContent +=
            "0\nLAYER\n2\nROOMS\n70\n0\n62\n7\n370\n18\n6\nCONTINUOUS\n";
        dxfContent += "0\nLAYER\n2\nTEXT\n70\n0\n62\n7\n370\n18\n6\nCONTINUOUS\n";
        dxfContent += "0\nENDTAB\n0\nENDSEC\n";

        dxfContent += "0\nSECTION\n2\nENTITIES\n";

        const bounds = floorPlanData.rooms.reduce(
            (acc, room) => {
                room.floor_polygon.forEach((point) => {
                    acc.minX = Math.min(acc.minX, point.x);
                    acc.maxX = Math.max(acc.maxX, point.x);
                    acc.minZ = Math.min(acc.minZ, -point.z);
                    acc.maxZ = Math.max(acc.maxZ, -point.z);
                });
                return acc;
            },
            { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
        );

        const floorPlanWidth = bounds.maxX - bounds.minX;
        const maxDimension = Math.max(floorPlanWidth, bounds.maxZ - bounds.minZ);
        const titleTextHeight = maxDimension * 0.015;
        const roomNameTextHeight = maxDimension * 0.012;
        const dimensionTextHeight = maxDimension * 0.008;

        const titleText = `Total Area: ${floorPlanData.total_area.toFixed(0)} sq ft | Total Rooms: ${floorPlanData.room_count}`;
        dxfContent += "0\nTEXT\n";
        dxfContent += "8\nTEXT\n";
        dxfContent += `10\n${(bounds.minX + bounds.maxX) / 2 - floorPlanWidth * 0.2}\n`;
        dxfContent += `20\n${bounds.maxZ + 2 * titleTextHeight}\n`;
        dxfContent += "30\n0\n";
        dxfContent += `40\n${titleTextHeight}\n`;
        dxfContent += `1\n${titleText}\n`;
        dxfContent += "50\n0\n";
        dxfContent += "72\n1\n";
        dxfContent += "73\n2\n";

        const getDistance = (p1: {x: number, z: number}, p2: {x: number, z: number}) => {
            return Math.sqrt((p2.x - p1.x) ** 2 + (p2.z - p1.z) ** 2);
        };

        const getMidpoint = (p1: {x: number, z: number}, p2: {x: number, z: number}) => {
            return {
                x: (p1.x + p2.x) / 2,
                z: -(p1.z + p2.z) / 2
            };
        };

        floorPlanData.rooms.forEach((room) => {
            if (room.floor_polygon.length > 1) {
                const layerName = room.room_type === "Wall" ? "WALLS" : "ROOMS";

                dxfContent += "0\nPOLYLINE\n";
                dxfContent += `8\n${layerName}\n`;
                dxfContent += "66\n1\n";
                dxfContent += "70\n1\n";
                dxfContent += "43\n0.0\n";

                room.floor_polygon.forEach((point) => {
                    dxfContent += "0\nVERTEX\n";
                    dxfContent += `8\n${layerName}\n`;
                    dxfContent += `10\n${point.x.toFixed(6)}\n`;
                    dxfContent += `20\n${-point.z.toFixed(6)}\n`;
                    dxfContent += "30\n0\n";
                });

                dxfContent += "0\nSEQEND\n";

                if (room.floor_polygon.length > 2) {
                    for (let i = 0; i < room.floor_polygon.length; i++) {
                        const currentPoint = room.floor_polygon[i];
                        const nextPoint = room.floor_polygon[(i + 1) % room.floor_polygon.length];
                        
                        const distance = getDistance(currentPoint, nextPoint);
                        const midpoint = getMidpoint(currentPoint, nextPoint);

                        if (distance > 0.5) {
                            const totalFeet = distance / 10;
                            const feet = Math.floor(totalFeet);
                            const inches = Math.round((totalFeet - feet) * 12);
                            
                            let dimensionText = "";
                            if (inches === 0) {
                                dimensionText = `${feet}'-0"`;
                            } else if (inches === 12) {
                                dimensionText = `${feet + 1}'-0"`;
                            } else {
                                dimensionText = `${feet}'-${inches}"`;
                            }
                            
                            dxfContent += "0\nTEXT\n";
                            dxfContent += "8\nTEXT\n";
                            dxfContent += `10\n${midpoint.x.toFixed(6)}\n`;
                            dxfContent += `20\n${midpoint.z.toFixed(6)}\n`;
                            dxfContent += "30\n0\n";
                            dxfContent += `40\n${dimensionTextHeight}\n`;
                            dxfContent += `1\n${dimensionText}\n`;
                            dxfContent += "50\n0\n";
                            dxfContent += "72\n1\n";
                            dxfContent += "73\n2\n";
                        }
                    }
                }
                if (room.room_type !== "Wall" && 
                    room.room_type !== "Boundary" && 
                    room.room_type !== "Reference") {
                    const centroid = room.floor_polygon.reduce(
                        (acc, point, _, arr) => ({
                            x: acc.x + point.x / arr.length,
                            z: acc.z + (-point.z) / arr.length,
                        }),
                        { x: 0, z: 0 }
                    );

                    dxfContent += "0\nTEXT\n";
                    dxfContent += "8\nTEXT\n";
                    dxfContent += `10\n${centroid.x.toFixed(6)}\n`;
                    dxfContent += `20\n${centroid.z.toFixed(6)}\n`;
                    dxfContent += "30\n0\n";
                    dxfContent += `40\n${roomNameTextHeight}\n`;
                    dxfContent += `1\n${room.room_type}\n`;
                    dxfContent += "50\n0\n";
                    dxfContent += "72\n1\n";
                    dxfContent += "73\n2\n";
                }
            }
        });

        dxfContent += "0\nENDSEC\n0\nEOF\n";

        const blob = new Blob([dxfContent], { type: "application/dxf" });
        saveAs(blob, `floor-plan-${new Date().toISOString().split("T")[0]}.dxf`);
    } catch (error) {
        console.error("CAD export error:", error);
        throw error;
    }
};

    return (
        <div
            className="panel-options exports-options"
            style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
            }}
        >
            <button
                className="export-button"
                onClick={() => handleExportOption("png")}
                disabled={isExporting}
            >
                PNG Image
            </button>
            <button
                className="export-button"
                onClick={() => handleExportOption("pdf")}
                disabled={isExporting}
            >
                PDF Document
            </button>
            <button
                className="export-button"
                onClick={() => handleExportOption("cad")}
                disabled={isExporting}
            >
                CAD File (DXF)
            </button>

            <div
                className="checkbox-control"
                style={{ position: "relative", left: "0.3rem" }}
            >
                <input
                    type="checkbox"
                    id="include-measurements"
                    checked={includeMeasurements}
                    onChange={(e) => setIncludeMeasurements(e.target.checked)}
                    disabled={isExporting}
                />
                <label htmlFor="include-measurements">Include Measurements</label>
            </div>

            {exportStatus && (
                <div
                    style={{
                        marginTop: "10px",
                        padding: "8px",
                        borderRadius: "4px",
                        backgroundColor: exportStatus.includes("failed")
                            ? "#ffebee"
                            : "#e8f5e9",
                        color: exportStatus.includes("failed") ? "#c62828" : "#2e7d32",
                        fontSize: "13px",
                        textAlign: "center",
                    }}
                >
                    {exportStatus}
                </div>
            )}
        </div>
    );
};

export default ExportsPanel;

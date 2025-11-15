import React, { useState } from "react";
import "./ShareModal.css";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  floorPlanData: any;
  visualizationOptions?: any;
  projectId: string;
  planId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  floorPlanData,
  visualizationOptions,
  projectId,
  planId,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const baseUrl = window.location.origin;
  const shareLink = `${baseUrl}/view/playground/${projectId}/${planId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        `Check out this floor plan: ${shareLink}`
      )}`,
      "_blank"
    );
  };

  const handleLinkedInShare = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        shareLink
      )}`,
      "_blank"
    );
  };

  const handlePinterestShare = () => {
    window.open(
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
        shareLink
      )}`,
      "_blank"
    );
  };

  const getRoomColor = (roomType: string) => {
    if (roomType === "Wall") return "#333333";

    const colorScheme = visualizationOptions?.colorScheme || "standard";

    switch (colorScheme) {
      case "monochrome":
        return "#B5DBFF";
      case "pastel":
        return "#E6E6FA";
      case "contrast": {
        const contrastMap: { [key: string]: string } = {
          LivingRoom: "#FFBDB9",
          Bathroom: "#A0D0F0",
          MasterRoom: "#FFDCC5",
          Kitchen: "#E2CCE2",
          SecondRoom: "#F9DD7D",
          ChildRoom: "#DFBDFF",
          DiningRoom: "#BADEBC",
          Balcony: "#C2E5E2",
          PoojaRoom: "#CDE6F9",
          Wall: "#333333",
        };
        return contrastMap[roomType] || "#E8E8E8";
      }
      default:
        return "#D0D0D0";
    }
  };


  const calculateMiteredCornersForShare = (
    walls: Array<{
      start: { x: number; y: number };
      end: { x: number; y: number };
      wallWidth: number;
      isExternal: boolean;
    }>
  ) => {
    const corners: any[] = [];

    for (let i = 0; i < walls.length; i++) {
      const currentWall = walls[i];
      const prevWall = walls[i === 0 ? walls.length - 1 : i - 1];
      const nextWall = walls[(i + 1) % walls.length];

      const { start, end, wallWidth } = currentWall;

      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length === 0) {
        corners.push(null);
        continue;
      }

      const dirX = dx / length;
      const dirY = dy / length;
      const perpX = -dirY;
      const perpY = dirX;
      const halfWidth = wallWidth / 2;

      let topStart = {
        x: start.x + perpX * halfWidth,
        y: start.y + perpY * halfWidth,
      };
      let topEnd = {
        x: end.x + perpX * halfWidth,
        y: end.y + perpY * halfWidth,
      };
      let bottomStart = {
        x: start.x - perpX * halfWidth,
        y: start.y - perpY * halfWidth,
      };
      let bottomEnd = {
        x: end.x - perpX * halfWidth,
        y: end.y - perpY * halfWidth,
      };

      if (prevWall) {
        const prevDx = prevWall.end.x - prevWall.start.x;
        const prevDy = prevWall.end.y - prevWall.start.y;
        const prevLength = Math.sqrt(prevDx * prevDx + prevDy * prevDy);

        if (prevLength > 0) {
          const prevPerpX = -prevDy / prevLength;
          const prevPerpY = prevDx / prevLength;
          const prevHalfWidth = prevWall.wallWidth / 2;

          const topIntersection = getLineIntersectionForShare(
            {
              x: prevWall.start.x + prevPerpX * prevHalfWidth,
              y: prevWall.start.y + prevPerpY * prevHalfWidth,
            },
            {
              x: prevWall.end.x + prevPerpX * prevHalfWidth,
              y: prevWall.end.y + prevPerpY * prevHalfWidth,
            },
            topStart,
            topEnd
          );

          const bottomIntersection = getLineIntersectionForShare(
            {
              x: prevWall.start.x - prevPerpX * prevHalfWidth,
              y: prevWall.start.y - prevPerpY * prevHalfWidth,
            },
            {
              x: prevWall.end.x - prevPerpX * prevHalfWidth,
              y: prevWall.end.y - prevPerpY * prevHalfWidth,
            },
            bottomStart,
            bottomEnd
          );

          if (topIntersection) topStart = topIntersection;
          if (bottomIntersection) bottomStart = bottomIntersection;
        }
      }

      if (nextWall) {
        const nextDx = nextWall.end.x - nextWall.start.x;
        const nextDy = nextWall.end.y - nextWall.start.y;
        const nextLength = Math.sqrt(nextDx * nextDx + nextDy * nextDy);

        if (nextLength > 0) {
          const nextPerpX = -nextDy / nextLength;
          const nextPerpY = nextDx / nextLength;
          const nextHalfWidth = nextWall.wallWidth / 2;

          const topIntersection = getLineIntersectionForShare(
            topStart,
            topEnd,
            {
              x: nextWall.start.x + nextPerpX * nextHalfWidth,
              y: nextWall.start.y + nextPerpY * nextHalfWidth,
            },
            {
              x: nextWall.end.x + nextPerpX * nextHalfWidth,
              y: nextWall.end.y + nextPerpY * nextHalfWidth,
            }
          );

          const bottomIntersection = getLineIntersectionForShare(
            bottomStart,
            bottomEnd,
            {
              x: nextWall.start.x - nextPerpX * nextHalfWidth,
              y: nextWall.start.y - nextPerpY * nextHalfWidth,
            },
            {
              x: nextWall.end.x - nextPerpX * nextHalfWidth,
              y: nextWall.end.y + nextPerpY * nextHalfWidth,
            }
          );

          if (topIntersection) topEnd = topIntersection;
          if (bottomIntersection) bottomEnd = bottomIntersection;
        }
      }

      corners.push({ topStart, topEnd, bottomStart, bottomEnd });
    }

    return corners;
  };

  const getLineIntersectionForShare = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number }
  ) => {
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 0.0001) return null;
    const t =
      ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
    return { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
  };

  const isExternalWallSegmentForShare = (
    roomId: string,
    segmentIndex: number,
    data: any
  ) => {
    const currentRoom = data.rooms.find((r: any) => r.id === roomId);
    if (!currentRoom || currentRoom.room_type === "Wall") return false;

    const currentWallStart = currentRoom.floor_polygon[segmentIndex];
    const currentWallEnd =
      currentRoom.floor_polygon[
        (segmentIndex + 1) % currentRoom.floor_polygon.length
      ];

    for (const otherRoom of data.rooms) {
      if (otherRoom.id === roomId || otherRoom.room_type === "Wall") continue;

      for (let i = 0; i < otherRoom.floor_polygon.length; i++) {
        const otherWallStart = otherRoom.floor_polygon[i];
        const otherWallEnd =
          otherRoom.floor_polygon[(i + 1) % otherRoom.floor_polygon.length];

        const sameDirection =
          Math.abs(currentWallStart.x - otherWallStart.x) < 0.1 &&
          Math.abs(currentWallStart.z - otherWallStart.z) < 0.1 &&
          Math.abs(currentWallEnd.x - otherWallEnd.x) < 0.1 &&
          Math.abs(currentWallEnd.z - otherWallEnd.z) < 0.1;

        const oppositeDirection =
          Math.abs(currentWallStart.x - otherWallEnd.x) < 0.1 &&
          Math.abs(currentWallStart.z - otherWallEnd.z) < 0.1 &&
          Math.abs(currentWallEnd.x - otherWallStart.x) < 0.1 &&
          Math.abs(currentWallEnd.z - otherWallStart.z) < 0.1;

        if (sameDirection || oppositeDirection) return false;
      }
    }
    return true;
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h2>Share</h2>
          <button className=" close-button-modal" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="share-modal-content">
          <h3>Scanned Floorplan</h3>

          <div className="floorplan-preview">
            <svg
              width="180"
              height="180"
              viewBox="0 0 300 300"
              className="preview-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              {floorPlanData?.rooms ? (
                <>
                  {(() => {
                    let minX = Infinity,
                      maxX = -Infinity,
                      minZ = Infinity,
                      maxZ = -Infinity;
        
                    const validRooms = floorPlanData.rooms.filter((room: any) => 
                      room.room_type !== "Reference" && 
                      room.floor_polygon && 
                      room.floor_polygon.length > 0
                    );
                    
                    validRooms.forEach((room: any) => {
                      room.floor_polygon.forEach((point: any) => {
                        minX = Math.min(minX, point.x);
                        maxX = Math.max(maxX, point.x);
                        minZ = Math.min(minZ, point.z);
                        maxZ = Math.max(maxZ, point.z);
                      });
                    });
                    if (minX === Infinity) {
                      minX = 0; maxX = 100; minZ = 0; maxZ = 100;
                    }

                    const width = maxX - minX;
                    const height = maxZ - minZ;
                    const aspectRatio = width / height;

                    let viewBoxWidth = 300;
                    let viewBoxHeight = 300;
                    let offsetX = 0;
                    let offsetY = 0;

                    if (aspectRatio > 1) {
                      viewBoxHeight = viewBoxWidth / aspectRatio;
                      offsetY = (300 - viewBoxHeight) / 2;
                    } else {
                      viewBoxWidth = viewBoxHeight * aspectRatio;
                      offsetX = (300 - viewBoxWidth) / 2;
                    }

                    const padding = 15;
                    const scaleX = (viewBoxWidth - 2 * padding) / (width || 1);
                    const scaleZ = (viewBoxHeight - 2 * padding) / (height || 1);
                    const scale = Math.min(scaleX, scaleZ);

                    const transformPoint = (point: any) => {
                      const x = (point.x - minX) * scale + padding + offsetX;
                      const y = (point.z - minZ) * scale + padding + offsetY;
                      return { x, y };
                    };

                    const roomElements: React.ReactElement[] = [];
                    const wallElements: React.ReactElement[] = [];
                    validRooms.forEach((room: any, index: number) => {
                      if (room.room_type === "Wall" || room.room_type === "Reference") return;

                      const points = room.floor_polygon
                        .map((point: any) => {
                          const t = transformPoint(point);
                          return `${t.x},${t.y}`;
                        })
                        .join(" ");

                      const isBoundary = room.isBoundary || room.room_type === "Boundary";
                      
                      roomElements.push(
                        <polygon
                          key={`room-fill-${room.id}-${index}`}
                          points={points}
                          fill={isBoundary ? "none" : getRoomColor(room.room_type)}
                          fillOpacity={isBoundary ? 0 : 1}
                          stroke={isBoundary ? "#ff6b00" : "none"}
                          strokeWidth={isBoundary ? "2" : "0"}
                          strokeDasharray={isBoundary ? "4,2" : "none"}
                          pointerEvents="none"
                        />
                      );
                    });
                    const allWallSegments: Array<{
                      corners: any;
                      isExternal: boolean;
                      roomId: string;
                      segmentIndex: number;
                    }> = [];

                    validRooms.forEach((room: any) => {
                      if (
                        room.room_type === "Wall" ||
                        room.floor_polygon.length < 3
                      )
                        return;

                      const transformedPoints = room.floor_polygon.map(transformPoint);

                      const wallData: any[] = [];
                      for (let i = 0; i < transformedPoints.length; i++) {
                        const start = transformedPoints[i];
                        const end = transformedPoints[(i + 1) % transformedPoints.length];
                        const isExternal = isExternalWallSegmentForShare(
                          room.id,
                          i,
                          floorPlanData
                        );

                        const baseInternalWidth = 2;
                        const baseExternalWidth = 4;
                        const wallWidth = isExternal ? baseExternalWidth : baseInternalWidth;

                        wallData.push({ start, end, wallWidth, isExternal });
                      }

                      const miteredCorners = calculateMiteredCornersForShare(wallData);

                      wallData.forEach((wall, segmentIndex) => {
                        const corners = miteredCorners[segmentIndex];
                        if (corners) {
                          allWallSegments.push({
                            corners,
                            isExternal: wall.isExternal,
                            roomId: room.id,
                            segmentIndex,
                          });
                        }
                      });
                    });

                    allWallSegments.sort((a, b) => {
                      if (a.isExternal && !b.isExternal) return 1;
                      if (!a.isExternal && b.isExternal) return -1;
                      return 0;
                    });

                    allWallSegments.forEach((wallSegment, index) => {
                      const { corners } = wallSegment;
                      const polygonPoints = `${corners.topStart.x},${corners.topStart.y} ${corners.topEnd.x},${corners.topEnd.y} ${corners.bottomEnd.x},${corners.bottomEnd.y} ${corners.bottomStart.x},${corners.bottomStart.y}`;

                      wallElements.push(
                        <polygon
                          key={`wall-segment-${wallSegment.roomId}-${wallSegment.segmentIndex}-${index}`}
                          points={polygonPoints}
                          fill="black"
                          stroke="none"
                        />
                      );
                    });
                    validRooms.forEach((room: any, index: number) => {
                      if (
                        room.room_type !== "Wall" ||
                        room.floor_polygon.length !== 2
                      )
                        return;

                      const start = transformPoint(room.floor_polygon[0]);
                      const end = transformPoint(room.floor_polygon[1]);
                      const wallWidth = 4;

                      wallElements.push(
                        <line
                          key={`standalone-wall-${room.id}-${index}`}
                          x1={start.x}
                          y1={start.y}
                          x2={end.x}
                          y2={end.y}
                          stroke="#333333"
                          strokeWidth={wallWidth}
                          strokeLinecap="round"
                        />
                      );
                    });

                    return [...roomElements, ...wallElements];
                  })()}
                </>
              ) : (
                <>
                  <rect
                    x="30"
                    y="30"
                    width="240"
                    height="240"
                    fill="#D0D0D0"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <rect
                    x="30"
                    y="30"
                    width="80"
                    height="80"
                    fill="#D0D0D0"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <rect
                    x="110"
                    y="30"
                    width="80"
                    height="60"
                    fill="#D0D0D0"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <rect
                    x="190"
                    y="30"
                    width="80"
                    height="120"
                    fill="#D0D0D0"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <rect
                    x="30"
                    y="110"
                    width="80"
                    height="80"
                    fill="#D0D0D0"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <rect
                    x="110"
                    y="90"
                    width="80"
                    height="100"
                    fill="#D0D0D0"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <rect
                    x="30"
                    y="190"
                    width="160"
                    height="80"
                    fill="#D0D0D0"
                    stroke="#666"
                    strokeWidth="2"
                  />
                  <rect
                    x="190"
                    y="150"
                    width="80"
                    height="120"
                    fill="#D0D0D0"
                    stroke="#666"
                    strokeWidth="2"
                  />
                </>
              )}
            </svg>
          </div>

          <div className="share-section">
            <h4>Link</h4>
            <div className="link-container">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="share-link-input"
              />
              <button className="copy-link-button" onClick={handleCopyLink}>
                {copiedLink ? "Copied!" : "Copy link"}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="9"
                    y="9"
                    width="13"
                    height="13"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="share-section">
            <h4>Social Media</h4>
            <div className="social-media-buttons">
              <button
                className="social-button whatsapp"
                onClick={handleWhatsAppShare}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </button>
              <button
                className="social-button linkedin"
                onClick={handleLinkedInShare}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
              <button
                className="social-button pinterest"
                onClick={handlePinterestShare}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
// ULTIMATE UNIFIEDWALLSYSTEM.TS - Complete Implementation
import { DoorWindowManager, Cutout, createWallWithCutouts } from './DoorWindowManager';

import * as t from "three";

export const height = 40;
const wallWidth = 1;

interface Point {
    x: number;
    z: number;
}

export interface MaterialConfig {
    id: string;
    name: string;
    color: string;
    texture?: string;
    roughness: number;
    metalness?: number;
    normalMap?: string;
    useTexture?: boolean;
}

export interface WallRenderingOptions {
    mode: 'solid' | 'transparent';
    transparency: number;
}

export class UnifiedWallSystem {
    group: t.Group;
    private materialManager: any;
    private innerWallMesh?: t.Object3D;
    private outerWallMesh?: t.Object3D;
    private capMeshes: t.Mesh[] = [];
    private roomId: string;
    private roomType: string;
    private renderingMode: 'solid' | 'transparent' = 'solid';
    private transparency: number = 0.3;
    private doorWindowManager?: DoorWindowManager;

    public setDoorWindowManager(manager: DoorWindowManager): void {
        this.doorWindowManager = manager;
    }

    // Store original data for rebuilding
    private originalCorners: Array<Point>;

    // Reference to room's material arrays
    private roomInnerMaterials: MaterialConfig[] = [];
    private roomOuterMaterials: MaterialConfig[] = [];

    // Building bounds for perimeter detection
    private buildingBounds?: { minX: number, maxX: number, minZ: number, maxZ: number };
    private isBoundary: boolean = false;
    private wallHeight: number = 20;

    constructor(
        corners: Array<Point>,
        innerMaterialArray: MaterialConfig[],
        outerMaterialArray: MaterialConfig[],
        materialManager?: any,
        roomId?: string,
        roomType?: string,
        renderingOptions?: WallRenderingOptions,
        buildingBounds?: { minX: number, maxX: number, minZ: number, maxZ: number },
        isBoundary?: boolean
    ) {
        this.group = new t.Group();
        this.materialManager = materialManager;

        // Store original data for rebuilding
        this.originalCorners = [...corners];

        // Store references to room's material arrays
        this.roomInnerMaterials = innerMaterialArray;
        this.roomOuterMaterials = outerMaterialArray;
        this.buildingBounds = buildingBounds;
        this.isBoundary = isBoundary || false;
        this.wallHeight = this.isBoundary ? height / 2 : height;

        this.roomId = roomId || Math.random().toString(36);
        this.roomType = roomType || 'unknown';

        if (renderingOptions) {
            this.renderingMode = renderingOptions.mode;
            this.transparency = renderingOptions.transparency;
        }

        // // console.log(`🏗️  UnifiedWallSystem created for room ${this.roomId} with ${innerMaterialArray.length} walls`);
        if (buildingBounds) {
            // // console.log(`📏 Building bounds: (${buildingBounds.minX},${buildingBounds.minZ}) to (${buildingBounds.maxX},${buildingBounds.maxZ})`);
        }

        this.buildWallsFromArrays(corners);
    }

    // ==================== MAIN BUILDING METHODS ====================

    private async buildWallsFromArrays(corners: Array<Point>): Promise<void> {
        try {
            // // console.log(`🔨 Building walls for room ${this.roomId} with ${corners.length} walls`);

            // Validate inputs
            if (!corners || corners.length === 0) {
                console.error('❌ No corners provided for wall building');
                return;
            }

            if (this.roomInnerMaterials.length !== corners.length) {
                console.error(`❌ Inner material count (${this.roomInnerMaterials.length}) doesn't match corner count (${corners.length})`);
                return;
            }

            if (this.roomOuterMaterials.length !== corners.length) {
                console.error(`❌ Outer material count (${this.roomOuterMaterials.length}) doesn't match corner count (${corners.length})`);
                return;
            }

            // Detect which walls are on building perimeter (external) vs interior
            const wallTypes = this.analyzeWallTypes(corners);

            // Calculate wall points with mitered corners
            const { innerPoints, outerPoints } = this.calculateMiteredWallPoints(corners);
            // // console.log(`📐 Calculated ${innerPoints.length} inner points and ${outerPoints.length} outer points`);

            // Build walls with proper overlap - outer walls first, then inner walls on top
            await this.buildOverlappingWalls(innerPoints, outerPoints, wallTypes);

            // Build caps
            await this.buildWallCaps(innerPoints, outerPoints);

            // // console.log(`✅ Successfully built walls for room ${this.roomId}`);

        } catch (error) {
            console.error('❌ Error building walls from arrays:', error);
            await this.buildFallbackWalls(corners);
        }
    }

    private async buildOverlappingWalls(
        innerPoints: t.Vector3[],
        outerPoints: t.Vector3[],
        wallTypes: Array<'internal' | 'external'>
    ): Promise<void> {
        // // console.log(`🎨 Building face-based walls (not overlapping entire meshes)`);

        // Instead of building separate inner/outer meshes that completely overlap,
        // build walls where each face gets the appropriate material

        await this.buildWallsWithFaceBasedMaterials(innerPoints, outerPoints, wallTypes);
    }

    private async buildWallsWithFaceBasedMaterials(
        innerPoints: t.Vector3[],
        outerPoints: t.Vector3[],
        wallTypes: Array<'internal' | 'external'>
    ): Promise<void> {
        // // console.log(`🏗️  Building walls with face-based materials`);

        // Create material groups for different face types
        const materialGroups = new Map<string, {
            geometry: any,
            material: t.Material,
            segments: number[],
            config: MaterialConfig,
            faceType: 'inner' | 'outer'
        }>();

        for (let i = 0; i < innerPoints.length; i++) {
            const wallType = wallTypes[i];

            // For each wall segment, we need to create TWO faces:
            // 1. Inner-facing face (toward room interior)
            // 2. Outer-facing face (toward building exterior)

            // Inner-facing face material
            const innerFaceMaterial = this.roomInnerMaterials[i];
            const innerKey = `inner_face_${innerFaceMaterial.id}`;

            if (!materialGroups.has(innerKey)) {
                // console.log(`🎨 Creating inner face material: ${innerKey} (${innerFaceMaterial.color})`);
                const material = await this.createMaterialFromConfig(innerFaceMaterial, 'inner');
                materialGroups.set(innerKey, {
                    geometry: this.createEmptyGeometryData(),
                    material,
                    segments: [],
                    config: innerFaceMaterial,
                    faceType: 'inner'
                });
            }
            materialGroups.get(innerKey)!.segments.push(i);

            // Outer-facing face material
            let outerFaceMaterial: MaterialConfig;
            if (wallType === 'external') {
                // External walls: outer face uses outer material
                outerFaceMaterial = this.roomOuterMaterials[i];
            } else {
                // Internal walls: outer face also uses inner material (both sides same)
                outerFaceMaterial = this.roomInnerMaterials[i];
            }

            const outerKey = `outer_face_${outerFaceMaterial.id}`;

            if (!materialGroups.has(outerKey)) {
                // console.log(`🎨 Creating outer face material: ${outerKey} (${outerFaceMaterial.color})`);
                const material = await this.createMaterialFromConfig(outerFaceMaterial, 'outer');
                materialGroups.set(outerKey, {
                    geometry: this.createEmptyGeometryData(),
                    material,
                    segments: [],
                    config: outerFaceMaterial,
                    faceType: 'outer'
                });
            }
            materialGroups.get(outerKey)!.segments.push(i);
        }

        // console.log(`📊 Created ${materialGroups.size} face material groups`);

        // Build geometry for each material group
        for (const [materialKey, group] of Array.from(materialGroups.entries())) {
            // console.log(`🔧 Building geometry for ${materialKey} with ${group.segments.length} segments`);

            for (const segmentIndex of group.segments) {
                if (group.faceType === 'inner') {
                    // Inner-facing face (uses innerPoints, normal pointing INTO room)
                    this.addWallFaceToGeometry(
                        group.geometry,
                        innerPoints,
                        segmentIndex,
                        'inner'
                    );
                } else {
                    // Outer-facing face (uses outerPoints, normal pointing OUT from building)
                    this.addWallFaceToGeometry(
                        group.geometry,
                        outerPoints,
                        segmentIndex,
                        'outer'
                    );
                }
            }

            const mesh = this.createMeshFromGeometry(
                group.geometry,
                group.material,
                `${this.roomId}_${materialKey}`
            );

            // Set render order - all faces can have same order since they don't overlap
            mesh.renderOrder = 5;
            this.group.add(mesh);

            // console.log(`✅ Added face mesh: ${materialKey}, color: ${group.config.color}`);
        }

        // console.log('🎯 Finished building face-based walls');
    }

    // NEW: Add a single wall face to geometry
    private addWallFaceToGeometry(
        geometryData: any,
        points: t.Vector3[],
        segmentIndex: number,
        faceType: 'inner' | 'outer'
    ): void {
        const nextIndex = (segmentIndex + 1) % points.length;
        const currentPoint = points[segmentIndex];
        const nextPoint = points[nextIndex];

        // Calculate wall direction and normal
        const wallDirection = nextPoint.clone().sub(currentPoint).normalize();

        // Normal direction depends on face type
        let segmentNormal: t.Vector3;
        if (faceType === 'inner') {
            // Inner face normal points INTO the room
            segmentNormal = new t.Vector3(wallDirection.z, 0, -wallDirection.x);
        } else {
            // Outer face normal points OUT from the building
            segmentNormal = new t.Vector3(-wallDirection.z, 0, wallDirection.x);
        }

        // Check if this wall segment has cutouts
        if (this.doorWindowManager) {
            const cutouts = this.doorWindowManager.getCutouts();
            const wallSegments = this.createWallSegmentsWithCutouts(
                currentPoint, 
                nextPoint, 
                cutouts
            );

            // Add each wall segment (excluding cutout areas)
            for (const segment of wallSegments) {
                this.addWallSegmentToGeometry(
                    geometryData,
                    segment.start,
                    segment.end,
                    segment.bottomHeight,
                    segment.topHeight,
                    segmentNormal,
                    faceType
                );
            }
        } else {
            // No cutouts - add full wall segment
            this.addWallSegmentToGeometry(
                geometryData,
                currentPoint,
                nextPoint,
                0,
                this.wallHeight,
                segmentNormal,
                faceType
            );
        }

        const baseVertexIndex = geometryData.vertexCount;

        // Add vertices for full wall face
        geometryData.vertices.push(
            currentPoint.x, 0, currentPoint.z,           // bottom start
            nextPoint.x, 0, nextPoint.z,                 // bottom end
            currentPoint.x, this.wallHeight, currentPoint.z,     // top start
            nextPoint.x, this.wallHeight, nextPoint.z             // top end
        );

        // Add normals
        for (let i = 0; i < 4; i++) {
            geometryData.normals.push(segmentNormal.x, segmentNormal.y, segmentNormal.z);
        }

        // Add UVs
        geometryData.uvs.push(
            0, 0,     // bottom start
            1, 0,     // bottom end
            0, 1,     // top start
            1, 1      // top end
        );

        // Add indices with proper winding for face type
        if (faceType === 'inner') {
            // Inner face - standard winding
            geometryData.indices.push(
                baseVertexIndex, baseVertexIndex + 2, baseVertexIndex + 1,
                baseVertexIndex + 1, baseVertexIndex + 2, baseVertexIndex + 3
            );
        } else {
            // Outer face - reversed winding
            geometryData.indices.push(
                baseVertexIndex, baseVertexIndex + 1, baseVertexIndex + 2,
                baseVertexIndex + 1, baseVertexIndex + 3, baseVertexIndex + 2
            );
        }

        geometryData.vertexCount += 4;
    }

    private createWallSegmentsWithCutouts(
        wallStart: t.Vector3,
        wallEnd: t.Vector3,
        cutouts: Map<string, Cutout>
    ): Array<{
        start: t.Vector3;
        end: t.Vector3;
        bottomHeight: number;
        topHeight: number;
    }> {
        const segments: Array<{
            start: t.Vector3;
            end: t.Vector3;
            bottomHeight: number;
            topHeight: number;
        }> = [];

        const wallDirection = wallEnd.clone().sub(wallStart).normalize();
        const wallLength = wallStart.distanceTo(wallEnd);

        // Find cutouts that intersect this wall
        const wallCutouts: Array<{
            startPos: number;
            endPos: number;
            bottomHeight: number;
            topHeight: number;
        }> = [];

        for (const cutout of Array.from(cutouts.values())) {
            const toCutout = cutout.position.clone().sub(wallStart);
            const cutoutAlongWall = toCutout.dot(wallDirection);
            const halfWidth = cutout.width / 2;

            // Check if cutout intersects this wall
            if (cutoutAlongWall + halfWidth > 0 && cutoutAlongWall - halfWidth < wallLength) {
                wallCutouts.push({
                    startPos: Math.max(0, cutoutAlongWall - halfWidth),
                    endPos: Math.min(wallLength, cutoutAlongWall + halfWidth),
                    bottomHeight: cutout.type === 'window' ? 10 : 0, // Windows start at height 10
                    topHeight: cutout.type === 'window' ? 10 + cutout.height : cutout.height
                });
            }
        }

        // Sort cutouts by position
        wallCutouts.sort((a, b) => a.startPos - b.startPos);

        let currentPos = 0;

        for (const cutout of wallCutouts) {
            // Add segment before cutout (full height)
            if (currentPos < cutout.startPos) {
                segments.push({
                    start: wallStart.clone().add(wallDirection.clone().multiplyScalar(currentPos)),
                    end: wallStart.clone().add(wallDirection.clone().multiplyScalar(cutout.startPos)),
                    bottomHeight: 0,
                    topHeight: this.wallHeight
                });
            }

            // Add segments around cutout
            // Bottom segment (below cutout)
            if (cutout.bottomHeight > 0) {
                segments.push({
                    start: wallStart.clone().add(wallDirection.clone().multiplyScalar(cutout.startPos)),
                    end: wallStart.clone().add(wallDirection.clone().multiplyScalar(cutout.endPos)),
                    bottomHeight: 0,
                    topHeight: cutout.bottomHeight
                });
            }

            // Top segment (above cutout)
            if (cutout.topHeight < this.wallHeight) {
                segments.push({
                    start: wallStart.clone().add(wallDirection.clone().multiplyScalar(cutout.startPos)),
                    end: wallStart.clone().add(wallDirection.clone().multiplyScalar(cutout.endPos)),
                    bottomHeight: cutout.topHeight,
                    topHeight: this.wallHeight
                });
            }

            currentPos = Math.max(currentPos, cutout.endPos);
        }

        // Add final segment after all cutouts
        if (currentPos < wallLength) {
            segments.push({
                start: wallStart.clone().add(wallDirection.clone().multiplyScalar(currentPos)),
                end: wallStart.clone().add(wallDirection.clone().multiplyScalar(wallLength)),
                bottomHeight: 0,
                topHeight: this.wallHeight
            });
        }

        return segments;
    }

    // New method to add a wall segment with specific height range
    private addWallSegmentToGeometry(
        geometryData: any,
        start: t.Vector3,
        end: t.Vector3,
        bottomHeight: number,
        topHeight: number,
        normal: t.Vector3,
        faceType: 'inner' | 'outer'
    ): void {
        const segmentLength = start.distanceTo(end);
        if (segmentLength < 0.01) return; // Skip very small segments

        const baseVertexIndex = geometryData.vertexCount;

        // Add vertices for this segment
        geometryData.vertices.push(
            start.x, bottomHeight, start.z,    // bottom start
            end.x, bottomHeight, end.z,        // bottom end
            start.x, topHeight, start.z,       // top start
            end.x, topHeight, end.z            // top end
        );

        // Add normals
        for (let i = 0; i < 4; i++) {
            geometryData.normals.push(normal.x, normal.y, normal.z);
        }

        // Add UVs - scale based on segment length and height
        const uScale = segmentLength / 50; // Adjust texture scale
        const vScale = (topHeight - bottomHeight) / 50;
        
        geometryData.uvs.push(
            0, 0,           // bottom start
            uScale, 0,      // bottom end
            0, vScale,      // top start
            uScale, vScale  // top end
        );

        // Add indices with proper winding
        if (faceType === 'inner') {
            geometryData.indices.push(
                baseVertexIndex, baseVertexIndex + 2, baseVertexIndex + 1,
                baseVertexIndex + 1, baseVertexIndex + 2, baseVertexIndex + 3
            );
        } else {
            geometryData.indices.push(
                baseVertexIndex, baseVertexIndex + 1, baseVertexIndex + 2,
                baseVertexIndex + 1, baseVertexIndex + 3, baseVertexIndex + 2
            );
        }

        geometryData.vertexCount += 4;
    }

    // ==================== WALL TYPE DETECTION ====================

    private analyzeWallTypes(corners: Array<Point>): Array<'internal' | 'external'> {
        // console.log(`🔍 Analyzing wall types for room ${this.roomId} with ${corners.length} walls`);

        const wallTypes: Array<'internal' | 'external'> = [];

        for (let i = 0; i < corners.length; i++) {
            const nextIndex = (i + 1) % corners.length;
            const startPoint = corners[i];
            const endPoint = corners[nextIndex];

            const wallType = this.detectWallType(startPoint, endPoint);
            wallTypes.push(wallType);

            // console.log(`📏 Wall ${i}: (${startPoint.x},${startPoint.z}) → (${endPoint.x},${endPoint.z}) = ${wallType.toUpperCase()}`);
        }

        const internalCount = wallTypes.filter(type => type === 'internal').length;
        const externalCount = wallTypes.filter(type => type === 'external').length;

        // console.log(`📊 Wall analysis complete: ${internalCount} internal, ${externalCount} external`);

        return wallTypes;
    }

    private detectWallType(startPoint: Point, endPoint: Point): 'internal' | 'external' {

        // If we have building bounds, use perimeter detection
        if (this.buildingBounds) {
            return this.detectUsingBuildingBounds(startPoint, endPoint);
        }

        // Fallback: Simple heuristic
        return this.detectUsingFallback(startPoint, endPoint);
    }

    private detectUsingBuildingBounds(startPoint: Point, endPoint: Point): 'internal' | 'external' {
        const tolerance = 2.0; // 2 unit tolerance for being "on the perimeter"

        // Check if BOTH points of the wall are on building perimeter
        const startOnPerimeter = this.isPointOnBuildingPerimeter(startPoint, tolerance);
        const endOnPerimeter = this.isPointOnBuildingPerimeter(endPoint, tolerance);

        // If both points are on the building perimeter, it's an external wall
        if (startOnPerimeter && endOnPerimeter) {
            return 'external';
        } else {
            return 'internal';
        }
    }

    private isPointOnBuildingPerimeter(point: Point, tolerance: number): boolean {
        if (!this.buildingBounds) return false;

        const { minX, maxX, minZ, maxZ } = this.buildingBounds;

        // Check if point is within tolerance of any building edge
        const nearLeftEdge = Math.abs(point.x - minX) <= tolerance;
        const nearRightEdge = Math.abs(point.x - maxX) <= tolerance;
        const nearTopEdge = Math.abs(point.z - minZ) <= tolerance;
        const nearBottomEdge = Math.abs(point.z - maxZ) <= tolerance;

        return nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge;
    }

    private detectUsingFallback(startPoint: Point, endPoint: Point): 'internal' | 'external' {
        // Simple fallback: walls at the extremes of the room are more likely external
        const roomBounds = this.calculateRoomBounds();
        const tolerance = 1.0;

        const startNearBoundary = this.isPointNearRoomBoundary(startPoint, roomBounds, tolerance);
        const endNearBoundary = this.isPointNearRoomBoundary(endPoint, roomBounds, tolerance);

        if (startNearBoundary && endNearBoundary) {
            return 'external';
        } else {
            return 'internal';
        }
    }

    private calculateRoomBounds(): { minX: number, maxX: number, minZ: number, maxZ: number } {
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        for (const corner of this.originalCorners) {
            minX = Math.min(minX, corner.x);
            maxX = Math.max(maxX, corner.x);
            minZ = Math.min(minZ, corner.z);
            maxZ = Math.max(maxZ, corner.z);
        }

        return { minX, maxX, minZ, maxZ };
    }

    private isPointNearRoomBoundary(point: Point, bounds: any, tolerance: number): boolean {
        const nearLeft = Math.abs(point.x - bounds.minX) <= tolerance;
        const nearRight = Math.abs(point.x - bounds.maxX) <= tolerance;
        const nearTop = Math.abs(point.z - bounds.minZ) <= tolerance;
        const nearBottom = Math.abs(point.z - bounds.maxZ) <= tolerance;

        return nearLeft || nearRight || nearTop || nearBottom;
    }

    // ==================== GEOMETRY HELPERS ====================

    private createEmptyGeometryData(): {
        vertices: number[],
        normals: number[],
        uvs: number[],
        indices: number[],
        vertexCount: number
    } {
        return {
            vertices: [],
            normals: [],
            uvs: [],
            indices: [],
            vertexCount: 0
        };
    }

    private addSegmentToGeometry(
        geometryData: any,
        points: t.Vector3[],
        segmentIndex: number
    ): void {
        const nextIndex = (segmentIndex + 1) % points.length;
        const currentPoint = points[segmentIndex];
        const nextPoint = points[nextIndex];

        // Calculate wall direction and normal
        const wallDirection = nextPoint.clone().sub(currentPoint).normalize();
        const segmentNormal = new t.Vector3(-wallDirection.z, 0, wallDirection.x);

        const baseVertexIndex = geometryData.vertexCount;

        // Add vertices
        geometryData.vertices.push(
            currentPoint.x, 0, currentPoint.z,           // bottom start
            nextPoint.x, 0, nextPoint.z,                 // bottom end
            currentPoint.x, this.wallHeight, currentPoint.z,     // top start
            nextPoint.x, this.wallHeight, nextPoint.z             // top end
        );

        // Add normals
        for (let i = 0; i < 4; i++) {
            geometryData.normals.push(segmentNormal.x, segmentNormal.y, segmentNormal.z);
        }

        // Add UVs
        geometryData.uvs.push(
            0, 0,     // bottom start
            1, 0,     // bottom end
            0, 1,     // top start
            1, 1      // top end
        );

        // Add indices
        geometryData.indices.push(
            baseVertexIndex, baseVertexIndex + 2, baseVertexIndex + 1,
            baseVertexIndex + 1, baseVertexIndex + 2, baseVertexIndex + 3
        );

        geometryData.vertexCount += 4;
    }

    private createMeshFromGeometry(geometryData: any, material: t.Material, name: string): t.Mesh {
        const geometry = new t.BufferGeometry();

        if (geometryData.vertices.length > 0) {
            geometry.setAttribute('position', new t.BufferAttribute(new Float32Array(geometryData.vertices), 3));
            geometry.setAttribute('normal', new t.BufferAttribute(new Float32Array(geometryData.normals), 3));
            geometry.setAttribute('uv', new t.BufferAttribute(new Float32Array(geometryData.uvs), 2));
            geometry.setIndex(geometryData.indices);

            geometry.computeBoundingBox();
            geometry.computeBoundingSphere();
        }

        const mesh = new t.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = name;

        return mesh;
    }

    // ==================== MATERIAL MANAGEMENT ====================

    private async createMaterialFromConfig(config: MaterialConfig, faceType: 'inner' | 'outer'): Promise<t.Material> {
        if (this.materialManager) {
            try {
                const material = await this.materialManager.createMaterial(config);
                this.applyFaceMaterialFixes(material as t.MeshStandardMaterial, faceType);
                return material;
            } catch (error) {
                console.warn(`Failed to create material from config ${config.id}, using fallback`);
            }
        }

        // Fallback to basic material
        const color = parseInt(config.color.replace('#', ''), 16);
        return this.createBasicFaceMaterial(color, faceType);
    }

    // NEW: Material fixes for face-based rendering
    private applyFaceMaterialFixes(material: t.MeshStandardMaterial, faceType: 'inner' | 'outer'): void {
        // Use DoubleSide for now to ensure visibility
        material.side = t.DoubleSide;
        material.depthWrite = true;
        material.depthTest = true;

        // No polygon offset needed since faces don't overlap
        material.polygonOffset = false;

        if (this.renderingMode === 'transparent') {
            material.transparent = true;
            material.opacity = this.transparency;
        } else {
            material.transparent = false;
            material.opacity = 1.0;
        }
    }

    // NEW: Basic material for faces
    private createBasicFaceMaterial(color: number, faceType: 'inner' | 'outer'): t.MeshStandardMaterial {
        const material = new t.MeshStandardMaterial({
            color: new t.Color(color),
            roughness: 0.4,
            metalness: 0.0,
            side: t.DoubleSide, // Ensure visibility from both sides
            transparent: this.renderingMode === 'transparent',
            opacity: this.renderingMode === 'transparent' ? this.transparency : 1.0,
            alphaTest: 0.01,
            depthWrite: true,
            depthTest: true,
        });

        // No polygon offset for face-based rendering
        material.polygonOffset = false;

        return material;
    }

    private createBasicWallMaterial(color: number, wallType: 'inner' | 'outer' | 'cap' = 'inner'): t.MeshStandardMaterial {
        const material = new t.MeshStandardMaterial({
            color: new t.Color(color),
            roughness: 0.4,
            metalness: 0.0,
            side: t.DoubleSide,
            transparent: this.renderingMode === 'transparent',
            opacity: this.renderingMode === 'transparent' ? this.transparency : 1.0,
            alphaTest: 0.01,
            depthWrite: true,
            depthTest: true,
        });

        // Apply depth bias for proper layering
        material.polygonOffset = true;
        if (wallType === 'outer') {
            material.polygonOffsetFactor = 5;
            material.polygonOffsetUnits = 5;
        } else if (wallType === 'inner') {
            material.polygonOffsetFactor = 0;
            material.polygonOffsetUnits = 0;
        } else {
            material.polygonOffsetFactor = -5;
            material.polygonOffsetUnits = -5;
        }

        return material;
    }

    private applyMaterialFixes(material: t.MeshStandardMaterial, wallType: 'inner' | 'outer' | 'cap' = 'inner'): void {
        material.polygonOffset = true;
        if (wallType === 'outer') {
            material.polygonOffsetFactor = 5;
            material.polygonOffsetUnits = 5;
        } else if (wallType === 'inner') {
            material.polygonOffsetFactor = 0;
            material.polygonOffsetUnits = 0;
        } else {
            material.polygonOffsetFactor = -5;
            material.polygonOffsetUnits = -5;
        }

        material.side = t.DoubleSide;
        material.depthWrite = true;
        material.depthTest = true;

        if (this.renderingMode === 'transparent') {
            material.transparent = true;
            material.opacity = this.transparency;
        } else {
            material.transparent = false;
            material.opacity = 1.0;
        }
    }

    // ==================== WALL CAPS ====================

    private async buildWallCaps(innerPoints: t.Vector3[], outerPoints: t.Vector3[]): Promise<void> {
        if (this.renderingMode === 'solid') {
            // console.log('🧢 Building wall caps...');
            const capMaterial = this.createBasicWallMaterial(0x666666, 'cap');

            for (let i = 0; i < innerPoints.length; i++) {
                const nextIndex = (i + 1) % innerPoints.length;

                const innerStart = innerPoints[i];
                const innerEnd = innerPoints[nextIndex];
                const outerStart = outerPoints[i];
                const outerEnd = outerPoints[nextIndex];

                const segmentCap = this.createWallSegmentCap(
                    innerStart, innerEnd, outerStart, outerEnd,
                    this.wallHeight - 0.01, capMaterial
                );
                segmentCap.renderOrder = 20 + i;
                segmentCap.name = `${this.roomId}_cap_${i}`;
                this.capMeshes.push(segmentCap);
                this.group.add(segmentCap);
            }

            // console.log(`✅ Created ${this.capMeshes.length} wall caps`);
        }
    }

    private createWallSegmentCap(
        innerStart: t.Vector3,
        innerEnd: t.Vector3,
        outerStart: t.Vector3,
        outerEnd: t.Vector3,
        yLevel: number,
        material: t.Material
    ): t.Mesh {
        const vertices = new Float32Array([
            innerStart.x, yLevel, innerStart.z,  // 0: inner start
            innerEnd.x, yLevel, innerEnd.z,      // 1: inner end
            outerEnd.x, yLevel, outerEnd.z,      // 2: outer end
            outerStart.x, yLevel, outerStart.z,  // 3: outer start
        ]);

        const uvs = new Float32Array([
            0, 0,  // inner start
            1, 0,  // inner end
            1, 1,  // outer end
            0, 1,  // outer start
        ]);

        const indices = [
            0, 1, 2,  // first triangle
            0, 2, 3   // second triangle
        ];

        const normals = new Float32Array([
            0, 1, 0,  // all normals point up
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
        ]);

        const geometry = new t.BufferGeometry();
        geometry.setAttribute('position', new t.BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new t.BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new t.BufferAttribute(uvs, 2));
        geometry.setIndex(indices);

        const mesh = new t.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    // ==================== MITERED CORNERS ====================

    private calculateMiteredWallPoints(corners: Array<Point>): {
        innerPoints: t.Vector3[],
        outerPoints: t.Vector3[]
    } {
        const innerPoints: t.Vector3[] = [];
        const outerPoints: t.Vector3[] = [];

        for (let i = 0; i < corners.length; i++) {
            const prevIndex = (i - 1 + corners.length) % corners.length;
            const nextIndex = (i + 1) % corners.length;

            const prevCorner = new t.Vector3(corners[prevIndex].x, 0, corners[prevIndex].z);
            const currentCorner = new t.Vector3(corners[i].x, 0, corners[i].z);
            const nextCorner = new t.Vector3(corners[nextIndex].x, 0, corners[nextIndex].z);

            const { innerPoint, outerPoint } = this.calculateMiteredCorner(
                prevCorner,
                currentCorner,
                nextCorner,
                wallWidth
            );

            // Apply small room-specific offset to prevent z-fighting
            const roomOffset = this.calculateRoomOffset();
            innerPoint.add(roomOffset);
            outerPoint.add(roomOffset);

            innerPoints.push(innerPoint);
            outerPoints.push(outerPoint);
        }

        return { innerPoints, outerPoints };
    }

    private calculateMiteredCorner(
        prevPoint: t.Vector3,
        currentPoint: t.Vector3,
        nextPoint: t.Vector3,
        wallWidth: number
    ): { innerPoint: t.Vector3, outerPoint: t.Vector3 } {

        const vec1 = prevPoint.clone().sub(currentPoint).normalize();
        const vec2 = nextPoint.clone().sub(currentPoint).normalize();
        const angle = vec1.angleTo(vec2);

        // Calculate the perpendicular direction for the current wall segment
        const avgDirection = vec1.clone().add(vec2).normalize();
        const perpendicular = new t.Vector3(-avgDirection.z, 0, avgDirection.x).normalize();

        // Handle straight walls or near-straight walls
        if (Math.abs(angle) < 0.2 || Math.abs(angle - Math.PI) < 0.2) {
            return {
                innerPoint: currentPoint.clone().add(perpendicular.clone().multiplyScalar(wallWidth / 2)),
                outerPoint: currentPoint.clone().add(perpendicular.clone().multiplyScalar(-wallWidth / 2))
            };
        }

        // For corners, use bisector but maintain consistent wall thickness
        const bisector = vec1.clone().add(vec2).normalize();
        const cross = vec1.clone().cross(vec2);
        const isOuterCorner = cross.y > 0;

        const halfAngle = angle / 2;
        const sinHalfAngle = Math.sin(halfAngle);

        // Prevent extreme miter lengths
        if (sinHalfAngle < 0.2) {
            return {
                innerPoint: currentPoint.clone().add(perpendicular.clone().multiplyScalar(wallWidth / 2)),
                outerPoint: currentPoint.clone().add(perpendicular.clone().multiplyScalar(-wallWidth / 2))
            };
        }

        // Calculate miter length to maintain wall thickness
        const miterLength = (wallWidth / 2) / sinHalfAngle;
        const maxMiterLength = wallWidth * 2;
        const clampedMiterLength = Math.min(Math.abs(miterLength), maxMiterLength);

        let innerPoint: t.Vector3;
        let outerPoint: t.Vector3;

        if (isOuterCorner) {
            innerPoint = currentPoint.clone().add(bisector.clone().multiplyScalar(clampedMiterLength));
            outerPoint = currentPoint.clone().add(bisector.clone().multiplyScalar(-clampedMiterLength));
        } else {
            innerPoint = currentPoint.clone().add(bisector.clone().multiplyScalar(-clampedMiterLength));
            outerPoint = currentPoint.clone().add(bisector.clone().multiplyScalar(clampedMiterLength));
        }

        return { innerPoint, outerPoint };
    }

    private calculateRoomOffset(): t.Vector3 {
        let hash = 0;
        const roomString = `${this.roomId}_${this.roomType}`;

        for (let i = 0; i < roomString.length; i++) {
            const char = roomString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        const offsetScale = 0.001;
        const xOffset = ((hash % 20) - 10) * offsetScale;
        const zOffset = (((hash >> 8) % 20) - 10) * offsetScale;

        return new t.Vector3(xOffset, 0, zOffset);
    }

    // ==================== PUBLIC API ====================

    async updateFromRoomMaterials(
        innerMaterials: MaterialConfig[],
        outerMaterials: MaterialConfig[]
    ): Promise<void> {
        // console.log(`🔄 Updating walls from room material arrays: ${innerMaterials.length} inner, ${outerMaterials.length} outer`);

        this.roomInnerMaterials = innerMaterials;
        this.roomOuterMaterials = outerMaterials;

        this.clearWalls();
        await this.buildWallsFromArrays(this.originalCorners);
    }

    setRenderingMode(mode: 'solid' | 'transparent', transparency: number = 0.3) {
        // console.log(`🎨 Setting rendering mode to ${mode} with transparency ${transparency} for room ${this.roomId}`);

        const modeChanged = this.renderingMode !== mode;
        const transparencyChanged = Math.abs(this.transparency - transparency) > 0.01;

        this.renderingMode = mode;
        this.transparency = transparency;

        if (modeChanged) {
            this.rebuildWallsFromArrays();
        } else if (transparencyChanged && mode === 'transparent') {
            this.updateAllMaterialTransparency();
        }
    }

    getRenderingMode(): { mode: 'solid' | 'transparent', transparency: number } {
        return {
            mode: this.renderingMode,
            transparency: this.transparency
        };
    }

    getWallMaterial(wallIndex: number, type: 'inner' | 'outer'): MaterialConfig | undefined {
        const materials = type === 'inner' ? this.roomInnerMaterials : this.roomOuterMaterials;
        return materials[wallIndex];
    }

    dispose(): void {
        this.clearWalls();
    }

    // ==================== HELPER METHODS ====================

    public async rebuildWallsFromArrays(): Promise<void> {
        // console.log(`🔄 Rebuilding walls from arrays for room ${this.roomId}`);
        this.clearWalls();
        await this.buildWallsFromArrays(this.originalCorners);
    }

    private updateAllMaterialTransparency(): void {
        // console.log(`🔍 Updating transparency on all materials for room ${this.roomId}`);

        this.group.children.forEach(child => {
            if (child instanceof t.Mesh && child.material) {
                const material = child.material as t.MeshStandardMaterial;
                if (material.transparent !== undefined) {
                    material.transparent = this.renderingMode === 'transparent';
                    material.opacity = this.renderingMode === 'transparent' ? this.transparency : 1.0;
                    material.needsUpdate = true;
                }
            }
        });
    }

    private clearWalls(): void {
        // console.log(`🧹 Clearing all walls for room ${this.roomId}`);

        // Remove all wall meshes
        const wallMeshes = this.group.children.filter(child =>
            child.name.includes('_inner_') ||
            child.name.includes('_outer_') ||
            child.name.includes('_cap_')
        );

        wallMeshes.forEach(mesh => {
            this.group.remove(mesh);
            if (mesh instanceof t.Mesh) {
                mesh.geometry.dispose();
                if (mesh.material instanceof t.Material) {
                    mesh.material.dispose();
                } else if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(mat => mat.dispose());
                }
            }
        });

        // Clear arrays
        this.capMeshes = [];
        this.innerWallMesh = undefined;
        this.outerWallMesh = undefined;
    }

    private async buildFallbackWalls(corners: Array<Point>): Promise<void> {
        // console.log(`🚨 Building fallback walls for room ${this.roomId}`);

        try {
            const { innerPoints, outerPoints } = this.calculateMiteredWallPoints(corners);

            // Use first material from each array as fallback
            const fallbackInnerMaterial = this.roomInnerMaterials.length > 0
                ? await this.createMaterialFromConfig(this.roomInnerMaterials[0], 'inner')
                : this.createBasicWallMaterial(0x000000, 'inner');

            const fallbackOuterMaterial = this.roomOuterMaterials.length > 0
                ? await this.createMaterialFromConfig(this.roomOuterMaterials[0], 'outer')
                : this.createBasicWallMaterial(0xddd6c4, 'outer');

            // Build simple overlapping walls
            this.outerWallMesh = this.buildSimpleWall(outerPoints, fallbackOuterMaterial, 'outer');
            this.innerWallMesh = this.buildSimpleWall(innerPoints, fallbackInnerMaterial, 'inner');

            // Set render order - outer behind, inner on top
            if (this.outerWallMesh) {
                this.outerWallMesh.renderOrder = 1;
                this.outerWallMesh.name = `${this.roomId}_fallback_outer`;
                this.group.add(this.outerWallMesh);
            }

            if (this.innerWallMesh) {
                this.innerWallMesh.renderOrder = 10;
                this.innerWallMesh.name = `${this.roomId}_fallback_inner`;
                this.group.add(this.innerWallMesh);
            }

            // console.log('✅ Fallback walls built successfully');

        } catch (error) {
            console.error('❌ Failed to build fallback walls:', error);
        }
    }

    private buildWallWithCutouts(points: t.Vector3[], material: t.Material, cutouts: Map<string, Cutout>): t.Group {
        const wallGroup = new t.Group();

        // Build each wall segment with cutouts
        for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            const wallStart = points[i];
            const wallEnd = points[nextIndex];

            const segmentWall = createWallWithCutouts(
                wallStart,
                wallEnd,
                this.wallHeight,
                5, // wall thickness
                cutouts,
                material
            );

            wallGroup.add(segmentWall);
        }

        return wallGroup;
    }

    private buildSimpleWall(points: t.Vector3[], material: t.Material, wallType: string): t.Object3D {
        // Check if we have cutouts from door/window manager
        if (this.doorWindowManager) {
            const cutouts = this.doorWindowManager.getCutouts();

            if (cutouts.size > 0) {
                // Use createWallWithCutouts for walls with openings
                return this.buildWallWithCutouts(points, material, cutouts);
            }
        }

        // Fallback to original simple wall building
        return this.buildOriginalSimpleWall(points, material, wallType);
    }

    private buildOriginalSimpleWall(points: t.Vector3[], material: t.Material, wallType: string): t.Mesh {
        const segmentCount = points.length;
        const verticesPerSegment = 4;
        const totalVertices = segmentCount * verticesPerSegment;

        const vertices = new Float32Array(totalVertices * 3);
        const normals = new Float32Array(totalVertices * 3);
        const uvs = new Float32Array(totalVertices * 2);
        const indices: number[] = [];

        for (let i = 0; i < points.length; i++) {
            const nextIndex = (i + 1) % points.length;
            const currentPoint = points[i];
            const nextPoint = points[nextIndex];

            // Calculate wall direction and normal
            const wallDirection = nextPoint.clone().sub(currentPoint).normalize();
            const segmentNormal = new t.Vector3(-wallDirection.z, 0, wallDirection.x);

            const baseIndex = i * 4;

            // Bottom vertices
            vertices[baseIndex * 3] = currentPoint.x;
            vertices[baseIndex * 3 + 1] = 0;
            vertices[baseIndex * 3 + 2] = currentPoint.z;

            vertices[(baseIndex + 1) * 3] = nextPoint.x;
            vertices[(baseIndex + 1) * 3 + 1] = 0;
            vertices[(baseIndex + 1) * 3 + 2] = nextPoint.z;

            // Top vertices
            vertices[(baseIndex + 2) * 3] = currentPoint.x;
            vertices[(baseIndex + 2) * 3 + 1] = this.wallHeight;
            vertices[(baseIndex + 2) * 3 + 2] = currentPoint.z;

            vertices[(baseIndex + 3) * 3] = nextPoint.x;
            vertices[(baseIndex + 3) * 3 + 1] = this.wallHeight;
            vertices[(baseIndex + 3) * 3 + 2] = nextPoint.z;

            // Set normals
            for (let j = 0; j < 4; j++) {
                normals[(baseIndex + j) * 3] = segmentNormal.x;
                normals[(baseIndex + j) * 3 + 1] = segmentNormal.y;
                normals[(baseIndex + j) * 3 + 2] = segmentNormal.z;
            }

            // UV mapping
            uvs[baseIndex * 2] = 0;
            uvs[baseIndex * 2 + 1] = 0;
            uvs[(baseIndex + 1) * 2] = 1;
            uvs[(baseIndex + 1) * 2 + 1] = 0;
            uvs[(baseIndex + 2) * 2] = 0;
            uvs[(baseIndex + 2) * 2 + 1] = 1;
            uvs[(baseIndex + 3) * 2] = 1;
            uvs[(baseIndex + 3) * 2 + 1] = 1;

            // Create triangles
            const v0 = baseIndex;
            const v1 = baseIndex + 1;
            const v2 = baseIndex + 2;
            const v3 = baseIndex + 3;

            indices.push(v0, v2, v1);
            indices.push(v1, v2, v3);
        }

        const geometry = new t.BufferGeometry();
        geometry.setAttribute('position', new t.BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new t.BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new t.BufferAttribute(uvs, 2));
        geometry.setIndex(indices);

        geometry.computeBoundingBox();
        geometry.computeBoundingSphere();

        const mesh = new t.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    // ==================== STATIC UTILITY METHODS ====================

    /**
     * Calculate building bounds from all room corners
     * Call this from your main application before creating rooms
     */
    static calculateBuildingBounds(allRoomCorners: Array<Array<Point>>): { minX: number, maxX: number, minZ: number, maxZ: number } {
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        // Find the overall bounding box of all rooms
        for (const roomCorners of allRoomCorners) {
            for (const corner of roomCorners) {
                minX = Math.min(minX, corner.x);
                maxX = Math.max(maxX, corner.x);
                minZ = Math.min(minZ, corner.z);
                maxZ = Math.max(maxZ, corner.z);
            }
        }

        // console.log(`📐 Calculated building bounds: (${minX},${minZ}) to (${maxX},${maxZ})`);

        return { minX, maxX, minZ, maxZ };
    }

    /**
     * Debug method to log current wall state
     */
    debugWallState(): void {
        // console.log(`\n=== 🔍 WALL DEBUG INFO for Room ${this.roomId} ===`);
        // console.log(`Rendering Mode: ${this.renderingMode}`);
        // console.log(`Transparency: ${this.transparency}`);
        // console.log(`Wall Count: ${this.originalCorners.length}`);
        // console.log(`Active Meshes: ${this.group.children.length}`);

        // console.log('\nInner Materials:');
        this.roomInnerMaterials.forEach((material, index) => {
            // console.log(`  Wall ${index}: ${material.id} (${material.color})`);
        });

        // console.log('\nOuter Materials:');
        this.roomOuterMaterials.forEach((material, index) => {
            // console.log(`  Wall ${index}: ${material.id} (${material.color})`);
        });

        // console.log('\nActive Meshes:');
        this.group.children.forEach((child, index) => {
            if (child instanceof t.Mesh) {
                const material = child.material as t.MeshStandardMaterial;
                // console.log(`  ${index}: ${child.name} - Order: ${child.renderOrder} - Color: #${material.color.getHexString()}`);
            }
        });

        if (this.buildingBounds) {
            // console.log(`\nBuilding Bounds: (${this.buildingBounds.minX},${this.buildingBounds.minZ}) to (${this.buildingBounds.maxX},${this.buildingBounds.maxZ})`);
        } else {
            // console.log('\nNo building bounds provided');
        }

        // console.log('===========================================\n');
    }

    // ==================== DEPRECATED METHODS (for backward compatibility) ====================

    /**
     * @deprecated Use Room.setAllWallMaterials() instead
     */
    async updateMaterial(component: 'inner' | 'outer', config: MaterialConfig): Promise<void> {
        console.warn('⚠️  UnifiedWallSystem.updateMaterial is deprecated. Use Room.setAllWallMaterials() instead.');

        try {
            const materialArray = component === 'inner' ? this.roomInnerMaterials : this.roomOuterMaterials;

            // Update all materials in the array
            for (let i = 0; i < materialArray.length; i++) {
                materialArray[i] = {
                    ...config,
                    id: `${this.roomId}-${component}-wall-${i}`,
                    name: `${this.roomId} ${component.charAt(0).toUpperCase() + component.slice(1)} Wall ${i + 1}`
                };
            }

            // Rebuild walls with updated arrays
            await this.rebuildWallsFromArrays();

            // console.log(`✅ Updated all ${component} wall materials and rebuilt walls`);

        } catch (error) {
            console.error(`❌ Failed to update ${component} wall material:`, error);
        }
    }
}
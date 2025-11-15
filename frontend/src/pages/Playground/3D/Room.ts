import * as t from "three";
import earcut from 'earcut'
import { UnifiedWallSystem, WallRenderingOptions } from "./UnifiedWallSystem";
import { DoorWindowManager } from './DoorWindowManager';

const height = 20;

interface Point {
    x: number;
    z: number;
}

interface Vertex {
    position: t.Vector3;
    index: number;
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
    tileSize?: number;
}

export class MaterialManager {
    private static instance: MaterialManager;
    private materials: Map<string, t.MeshStandardMaterial> = new Map();
    private textureLoader: t.TextureLoader;
    private textureCache: Map<string, t.Texture> = new Map();

    private constructor() {
        this.textureLoader = new t.TextureLoader();
    }

    static getInstance(): MaterialManager {
        if (!MaterialManager.instance) {
            MaterialManager.instance = new MaterialManager();
        }
        return MaterialManager.instance;
    }

    async loadTexture(path: string): Promise<t.Texture> {
        if (this.textureCache.has(path)) {
            return this.textureCache.get(path)!;
        }

        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    texture.wrapS = t.RepeatWrapping;
                    texture.wrapT = t.RepeatWrapping;
                    texture.repeat.set(1, 1);
                    texture.generateMipmaps = true;
                    texture.minFilter = t.LinearMipmapLinearFilter;
                    texture.magFilter = t.LinearFilter;

                    this.textureCache.set(path, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.warn(`Failed to load texture: ${path}`, error);
                    reject(error);
                }
            );
        });
    }

    async createMaterial(config: MaterialConfig): Promise<t.MeshStandardMaterial> {
        const materialKey = `${config.id}_${config.color}_${config.texture || 'solid'}_${config.useTexture}`;

        if (this.materials.has(materialKey)) {
            return this.materials.get(materialKey)!;
        }

        const baseColor = new t.Color(config.color);
        const brightColor = baseColor.clone().multiplyScalar(1.4);

        const material = new t.MeshStandardMaterial({
            color: brightColor,
            roughness: config.roughness,
            metalness: config.metalness || 0,
            emissive: new t.Color(config.color).multiplyScalar(0.3),
        });

        if (config.useTexture && config.texture && config.texture !== 'smooth') {
            try {
                const texture = await this.loadTexture(`/textures/${config.texture}.jpg`);
                material.map = texture;
                material.needsUpdate = true;

                if (config.normalMap) {
                    try {
                        const normalTexture = await this.loadTexture(`/textures/normals/${config.normalMap}.jpg`);
                        material.normalMap = normalTexture;
                    } catch (error) {
                        console.warn(`Failed to load normal map: ${config.normalMap}`);
                    }
                }
            } catch (error) {
                console.warn(`Failed to load texture: ${config.texture}`, error);
            }
        }

        this.materials.set(materialKey, material);
        return material;
    }

    createBasicMaterial(color: number, transparent: boolean = false, opacity: number = 1): t.MeshBasicMaterial {
        return new t.MeshBasicMaterial({
            color: new t.Color(color),
            transparent,
            opacity,
            side: t.DoubleSide
        });
    }

    disposeMaterial(materialKey: string) {
        const material = this.materials.get(materialKey);
        if (material) {
            material.dispose();
            if (material.map) material.map.dispose();
            if (material.normalMap) material.normalMap.dispose();
            this.materials.delete(materialKey);
        }
    }

    disposeAll() {
        this.materials.forEach((material) => {
            material.dispose();
            if (material.map) material.map.dispose();
            if (material.normalMap) material.normalMap.dispose();
        });
        this.materials.clear();

        this.textureCache.forEach((texture) => {
            texture.dispose();
        });
        this.textureCache.clear();
    }
}

export default class Room {
    group: t.Group;
    private wallSystem: UnifiedWallSystem | undefined;
    private materialManager = MaterialManager.getInstance();
    private roofMeshes: t.Mesh[] = [];
    private floorMeshes: t.Mesh[] = [];
    public roomId: string;
    private roomType: string;
    private wallWidthData?: Record<string, number>;
    private isBoundary: boolean = false;

    // NEW: Per-wall material arrays
    private innerWallMaterials: MaterialConfig[] = [];
    private outerWallMaterials: MaterialConfig[] = [];
    private wallCount: number = 0;
    private corners: Array<Point> = [];

    constructor(
        corners: Array<Point>,
        innerWallConfig?: MaterialConfig,
        outerWallConfig?: MaterialConfig,
        roofConfig?: MaterialConfig,
        floorConfig?: MaterialConfig,
        roomData?: {
            id?: string;
            room_type?: string;
            wallWidths?: Record<string, number>;
            isBoundary?: boolean;
        },
        wallRenderingOptions?: WallRenderingOptions
    ) {
        this.group = new t.Group();
        this.corners = [...corners];
        this.wallCount = corners.length;

        // Generate or use provided room identification
        this.roomId = roomData?.id || this.generateRoomId(corners);
        this.roomType = roomData?.room_type || 'unknown';

        this.wallWidthData = roomData?.wallWidths;
        this.isBoundary = roomData?.isBoundary || false;

        // Initialize per-wall material arrays
        this.initializeWallMaterialArrays(innerWallConfig, outerWallConfig);

        this.initializeRoom(corners, innerWallConfig, outerWallConfig, roofConfig, floorConfig, wallRenderingOptions);
    }

    public setDoorWindowManager(manager: DoorWindowManager): void {
        if (this.wallSystem) {
            this.wallSystem.setDoorWindowManager(manager);
        }
    }

    public getWallSystem(): UnifiedWallSystem {
        if (!this.wallSystem) {
            throw new Error('Wall system is not initialized');
        }
        return this.wallSystem;
    }

    private initializeWallMaterialArrays(
        defaultInnerConfig?: MaterialConfig,
        defaultOuterConfig?: MaterialConfig
    ): void {
        // console.log(`Initializing material arrays for ${this.wallCount} walls in room ${this.roomId}`);

        // Create default configs if not provided
        const defaultInner: MaterialConfig = defaultInnerConfig || {
            id: 'default-inner',
            name: 'Default Inner Wall',
            color: '#000000', // Black
            roughness: 0.5,
            useTexture: false
        };

        const defaultOuter: MaterialConfig = defaultOuterConfig || {
            id: 'default-outer',
            name: 'Default Outer Wall',
            color: '#ddd6c4', // Light brown
            roughness: 0.5,
            useTexture: false
        };

        // Initialize arrays with default materials for each wall
        this.innerWallMaterials = [];
        this.outerWallMaterials = [];

        for (let i = 0; i < this.wallCount; i++) {
            // Create unique configs for each wall
            this.innerWallMaterials.push({
                ...defaultInner,
                id: `${this.roomId}-inner-wall-${i}`,
                name: `${this.roomId} Inner Wall ${i + 1}`
            });

            this.outerWallMaterials.push({
                ...defaultOuter,
                id: `${this.roomId}-outer-wall-${i}`,
                name: `${this.roomId} Outer Wall ${i + 1}`
            });
        }

        // console.log(`Initialized ${this.innerWallMaterials.length} inner and ${this.outerWallMaterials.length} outer wall materials`);
    }

    getWallMaterial(wallIndex: number, type: 'inner' | 'outer'): MaterialConfig | undefined {
        if (wallIndex < 0 || wallIndex >= this.wallCount) {
            console.warn(`Invalid wall index ${wallIndex} for room ${this.roomId} (max: ${this.wallCount - 1})`);
            return undefined;
        }

        return type === 'inner'
            ? this.innerWallMaterials[wallIndex]
            : this.outerWallMaterials[wallIndex];
    }

    async setWallMaterial(wallIndex: number, type: 'inner' | 'outer', config: MaterialConfig): Promise<void> {
        if (wallIndex < 0 || wallIndex >= this.wallCount) {
            console.warn(`Invalid wall index ${wallIndex} for room ${this.roomId} (max: ${this.wallCount - 1})`);
            return;
        }

        // console.log(`Setting ${type} material for wall ${wallIndex} in room ${this.roomId}:`, config);

        // Update the material array
        if (type === 'inner') {
            this.innerWallMaterials[wallIndex] = { ...config };
        } else {
            this.outerWallMaterials[wallIndex] = { ...config };
        }

        // Notify wall system to rebuild with new materials
        if (this.wallSystem) {
            await this.wallSystem.updateFromRoomMaterials(this.innerWallMaterials, this.outerWallMaterials);
        }
    }

    async setAllWallMaterials(type: 'inner' | 'outer', config: MaterialConfig): Promise<void> {
        // console.log(`Setting ALL ${type} wall materials in room ${this.roomId}:`, config);

        const materialArray = type === 'inner' ? this.innerWallMaterials : this.outerWallMaterials;

        // Update all walls of this type
        for (let i = 0; i < this.wallCount; i++) {
            materialArray[i] = {
                ...config,
                id: `${this.roomId}-${type}-wall-${i}`,
                name: `${this.roomId} ${type.charAt(0).toUpperCase() + type.slice(1)} Wall ${i + 1}`
            };
        }

        // Notify wall system to rebuild
        if (this.wallSystem) {
            await this.wallSystem.updateFromRoomMaterials(this.innerWallMaterials, this.outerWallMaterials);
        }
    }

    getAllWallMaterials(): { inner: MaterialConfig[], outer: MaterialConfig[] } {
        return {
            inner: [...this.innerWallMaterials],
            outer: [...this.outerWallMaterials]
        };
    }

    getWallCount(): number {
        return this.wallCount;
    }

    private generateRoomId(corners: Array<Point>): string {
        // Generate a deterministic ID based on room corners
        const cornerHash = corners
            .map(p => `${Math.round(p.x * 10)},${Math.round(p.z * 10)}`)
            .join('|');

        // Create hash from corner positions
        let hash = 0;
        for (let i = 0; i < cornerHash.length; i++) {
            const char = cornerHash.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return `room_${Math.abs(hash).toString(36)}`;
    }

    private async initializeRoom(
        corners: Array<Point>,
        innerWallConfig?: MaterialConfig,
        outerWallConfig?: MaterialConfig,
        roofConfig?: MaterialConfig,
        floorConfig?: MaterialConfig,
        wallRenderingOptions?: WallRenderingOptions
    ) {
        try {
            // console.log(`Initializing room ${this.roomId} (${this.roomType}) with per-wall material system...`);
            const wallOptions: WallRenderingOptions = wallRenderingOptions || { mode: 'solid', transparency: 0.3 };
            // Build unified wall system with material arrays
            this.wallSystem = new UnifiedWallSystem(
                corners,
                this.innerWallMaterials,
                this.outerWallMaterials,
                this.materialManager,
                this.roomId,
                this.roomType,
                wallRenderingOptions,
                undefined
            );
            this.group.add(this.wallSystem.group);

            // Create materials for floor and roof
            const roofMaterial = roofConfig
                ? await this.materialManager.createMaterial(roofConfig)
                : this.materialManager.createBasicMaterial(0xeaeaea, true, 0.4);

            const floorMaterial = floorConfig
                ? await this.materialManager.createMaterial(floorConfig)
                : this.materialManager.createBasicMaterial(0xeaeaea);

            // Build floor and roof
            await this.buildCover(corners, roofMaterial, floorMaterial);

        } catch (error) {
            console.error(`Failed to initialize room ${this.roomId} materials:`, error);
            // Fallback to basic materials
            this.buildWithBasicMaterials(corners, wallRenderingOptions);
        }
    }

    private async buildCover(
        corners: Array<Point>,
        roofMaterial: t.Material,
        floorMaterial: t.Material
    ) {
        const coverMeshes = this.cover(corners, roofMaterial, floorMaterial);
        for (let i = 0; i < coverMeshes.length; i++) {
            this.group.add(coverMeshes[i]);

            // Track roof and floor meshes for later manipulation
            if (coverMeshes[i].material === roofMaterial) {
                this.roofMeshes.push(coverMeshes[i]);
            } else if (coverMeshes[i].material === floorMaterial) {
                this.floorMeshes.push(coverMeshes[i]);
            }
        }
    }

    private buildWithBasicMaterials(corners: Array<Point>, wallRenderingOptions?: WallRenderingOptions) {
        // console.log(`Building room ${this.roomId} with basic materials (fallback)`);

        // Fallback to basic unified wall system
        this.wallSystem = new UnifiedWallSystem(
            corners,
            [],
            [],
            this.materialManager,
            this.roomId,
            this.roomType,
            wallRenderingOptions
        );
        this.group.add(this.wallSystem.group);

        const basicRoofMaterial = this.materialManager.createBasicMaterial(0xeaeaea, true, 0.4);
        const basicFloorMaterial = this.materialManager.createBasicMaterial(0xeaeaea);

        const coverMeshes = this.cover(corners, basicRoofMaterial, basicFloorMaterial);
        for (let i = 0; i < coverMeshes.length; i++) {
            this.group.add(coverMeshes[i]);
        }
    }

    // MISSING WALL RENDERING METHODS - THESE ARE THE KEY ADDITIONS:

    // Method to set wall rendering mode - delegates to UnifiedWallSystem
    setWallRenderingMode(mode: 'solid' | 'transparent', transparency: number = 0.3) {
        // console.log(`Room ${this.roomId}: Setting wall rendering mode to ${mode} with transparency ${transparency}`);

        if (this.wallSystem) {
            this.wallSystem.setRenderingMode(mode, transparency);
        } else {
            console.warn(`Room ${this.roomId}: No wall system available for rendering mode change`);
        }
    }

    // Method to set wall transparency - delegates to setWallRenderingMode
    setWallTransparency(transparency: number) {
        // console.log(`Room ${this.roomId}: Setting wall transparency to ${transparency}`);

        // Get current mode and update with new transparency
        if (this.wallSystem) {
            const currentMode = this.wallSystem.getRenderingMode();
            this.setWallRenderingMode(currentMode.mode, transparency);
        } else {
            console.warn(`Room ${this.roomId}: No wall system available for transparency change`);
        }
    }

    // Method to get current wall rendering settings
    getWallRenderingMode(): { mode: 'solid' | 'transparent', transparency: number } {
        if (this.wallSystem) {
            return this.wallSystem.getRenderingMode();
        }
        return { mode: 'solid', transparency: 1.0 };
    }

    // END OF MISSING METHODS

    // Updated wall material method to work with unified system
    async updateWallMaterials(component: 'inner' | 'outer', config: MaterialConfig) {
        // console.log(`Updating ALL ${component} wall materials for room ${this.roomId} with unified system`);

        try {
            // Update all walls of this type
            await this.setAllWallMaterials(component, config);
        } catch (error) {
            console.error(`Failed to update ${component} wall materials for room ${this.roomId}:`, error);
        }
    }

    async setWallMaterialRange(
        startIndex: number,
        endIndex: number,
        type: 'inner' | 'outer',
        config: MaterialConfig
    ): Promise<void> {
        // console.log(`Setting ${type} materials for walls ${startIndex}-${endIndex} in room ${this.roomId}`);

        for (let i = startIndex; i <= Math.min(endIndex, this.wallCount - 1); i++) {
            await this.setWallMaterial(i, type, config);
        }
    }

    async copyWallMaterial(
        fromIndex: number,
        toIndex: number,
        type: 'inner' | 'outer'
    ): Promise<void> {
        const sourceMaterial = this.getWallMaterial(fromIndex, type);
        if (sourceMaterial) {
            await this.setWallMaterial(toIndex, type, sourceMaterial);
        }
    }

    getWallsWithMaterial(config: MaterialConfig, type: 'inner' | 'outer'): number[] {
        const materialArray = type === 'inner' ? this.innerWallMaterials : this.outerWallMaterials;
        const matchingWalls: number[] = [];

        for (let i = 0; i < materialArray.length; i++) {
            if (materialArray[i].id === config.id ||
                (materialArray[i].color === config.color &&
                    materialArray[i].useTexture === config.useTexture)) {
                matchingWalls.push(i);
            }
        }

        return matchingWalls;
    }

    exportWallMaterials(): {
        roomId: string,
        wallCount: number,
        innerMaterials: MaterialConfig[],
        outerMaterials: MaterialConfig[]
    } {
        return {
            roomId: this.roomId,
            wallCount: this.wallCount,
            innerMaterials: [...this.innerWallMaterials],
            outerMaterials: [...this.outerWallMaterials]
        };
    }

    async importWallMaterials(data: {
        innerMaterials: MaterialConfig[],
        outerMaterials: MaterialConfig[]
    }): Promise<void> {
        // console.log(`Importing wall materials for room ${this.roomId}`);

        if (data.innerMaterials.length === this.wallCount &&
            data.outerMaterials.length === this.wallCount) {

            this.innerWallMaterials = [...data.innerMaterials];
            this.outerWallMaterials = [...data.outerMaterials];

            // Rebuild walls with imported materials
            if (this.wallSystem) {
                await this.wallSystem.updateFromRoomMaterials(this.innerWallMaterials, this.outerWallMaterials);
            }
        } else {
            console.error('Imported material count does not match wall count');
        }
    }



    // Method to update floor/roof materials
    async updateMaterial(
        component: 'roof' | 'floor',
        config: MaterialConfig
    ) {
        try {
            const newMaterial = await this.materialManager.createMaterial(config);

            if (component === 'roof') {
                this.roofMeshes.forEach(mesh => {
                    mesh.material = newMaterial;
                });
            } else if (component === 'floor') {
                this.floorMeshes.forEach(mesh => {
                    mesh.material = newMaterial;
                });
            }
        } catch (error) {
            console.error(`Failed to update ${component} material for room ${this.roomId}:`, error);
        }
    }

    // Method to toggle roof visibility
    toggleRoof(visible: boolean) {
        this.roofMeshes.forEach(mesh => {
            mesh.visible = visible;
        });
    }

    // Getter methods for room information
    getRoomId(): string {
        return this.roomId;
    }

    getRoomType(): string {
        return this.roomType;
    }

    // Method to update room information
    updateRoomInfo(roomData: { id?: string; room_type?: string }) {
        if (roomData.id) {
            this.roomId = roomData.id;
        }
        if (roomData.room_type) {
            this.roomType = roomData.room_type;
        }

        // If wallSystem exists, we might need to rebuild it with new identification
        // This would be an edge case but good to handle
        // console.log(`Updated room info: ${this.roomId} (${this.roomType})`);
    }

    cover(corners: Array<Point>, roofMaterial?: t.Material, floorMaterial?: t.Material) {
        console.log(`Room ${this.roomId}: Building cover with ${corners.length} corners`);
        const actualRoofMaterial = roofMaterial || this.materialManager.createBasicMaterial(0xeaeaea, true, 0.4);
        const actualFloorMaterial = floorMaterial || this.materialManager.createBasicMaterial(0xeaeaea);

        if (corners.length < 3) {
            console.warn(`Room ${this.roomId}: Not enough corners for triangulation (${corners.length})`);
            return [];
        }

        const points: Array<Vertex> = [];
        for (let i = 0; i < corners.length; i++) {
            const pos: t.Vector3 = new t.Vector3(corners[i].x, 0, corners[i].z);
            points.push({ position: pos, index: i });
        }

        // Create vertex arrays
        let roofVertices = new Float32Array(points.length * 3);
        let floorVertices = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            roofVertices[i * 3 + 0] = points[i].position.x;
            roofVertices[i * 3 + 1] = height - 0.01;
            roofVertices[i * 3 + 2] = points[i].position.z;

            floorVertices[i * 3 + 0] = points[i].position.x;
            floorVertices[i * 3 + 1] = this.roomType?.toLowerCase() === 'boundary' ? 0.001 : 0.01;
            floorVertices[i * 3 + 2] = points[i].position.z;
        }

        // Use earcut for proper triangulation of any polygon
        const flatCoordinates: number[] = [];
        for (const corner of corners) {
            flatCoordinates.push(corner.x, corner.z);
        }

        const triangles = earcut(flatCoordinates);

        // Convert earcut indices to Three.js format
        const indices: number[] = [];
        const reverseIndices: number[] = [];

        for (let i = 0; i < triangles.length; i += 3) {
            // Original order for roof
            indices.push(triangles[i], triangles[i + 1], triangles[i + 2]);
            // Reversed order for floor (facing up)
            reverseIndices.push(triangles[i + 2], triangles[i + 1], triangles[i]);
        }

        // Create geometries
        const floorGeometry = new t.BufferGeometry();
        const roofGeometry = new t.BufferGeometry();

        floorGeometry.setAttribute("position", new t.BufferAttribute(floorVertices, 3));
        roofGeometry.setAttribute("position", new t.BufferAttribute(roofVertices, 3));

        // Add UV coordinates
        const uvs = new Float32Array(points.length * 2);
        for (let i = 0; i < points.length; i++) {
            uvs[i * 2 + 0] = points[i].position.x / 100;
            uvs[i * 2 + 1] = points[i].position.z / 100;
        }

        floorGeometry.setAttribute("uv", new t.BufferAttribute(uvs, 2));
        roofGeometry.setAttribute("uv", new t.BufferAttribute(uvs, 2));

        // Set indices
        floorGeometry.setIndex(reverseIndices);
        roofGeometry.setIndex(indices);

        // Compute normals
        floorGeometry.computeVertexNormals();
        roofGeometry.computeVertexNormals();

        // Create meshes
        const roofMesh = new t.Mesh(roofGeometry, actualRoofMaterial);
        const floorMesh = new t.Mesh(floorGeometry, actualFloorMaterial);

        // Set render order and visibility
        roofMesh.renderOrder = 4;
        floorMesh.renderOrder = 0;
        roofMesh.visible = false;
        floorMesh.visible = true;

        // Enable shadow receiving for floor
        floorMesh.receiveShadow = true;
        floorMesh.castShadow = false;

        // Prevent z-fighting by adjusting material properties
        if (actualFloorMaterial instanceof t.MeshStandardMaterial) {
            actualFloorMaterial.depthWrite = true;
            actualFloorMaterial.depthTest = true;
            actualFloorMaterial.polygonOffset = true;
            actualFloorMaterial.polygonOffsetFactor = 1;
            actualFloorMaterial.polygonOffsetUnits = 1;
        }

        // Set names for debugging
        roofMesh.name = `${this.roomId}_roof`;
        floorMesh.name = `${this.roomId}_floor`;

        // Store references
        this.roofMeshes.push(roofMesh);
        this.floorMeshes.push(floorMesh);

        return [roofMesh, floorMesh];
    }

    clockwise(vecA: t.Vector3, vecB: t.Vector3) {
        const cross = vecA.cross(vecB);
        const vn = new t.Vector3(0, 1, 0);
        return vn.dot(cross) <= 0;
    }

    pointInsideTriangle(vecA: t.Vector3, vecB: t.Vector3, vecC: t.Vector3, points: Array<Vertex>) {
        const area = this.area(vecA, vecB, vecC);
        for (let i = 0; i < points.length; i++) {
            if (
                points[i].position === vecA ||
                points[i].position === vecB ||
                points[i].position === vecC
            ) {
                continue;
            }
            const area0 = this.area(vecA, points[i].position, vecB);
            const area1 = this.area(vecB, points[i].position, vecC);
            const area2 = this.area(vecC, points[i].position, vecA);
            if (Math.abs(area - (area0 + area1 + area2)) < 0.001) return true; // Add small tolerance
        }
        return false;
    }

    area(vecA: t.Vector3, vecB: t.Vector3, vecC: t.Vector3) {
        return Math.abs(
            (vecA.x * (vecB.z - vecC.z) +
                vecB.x * (vecC.z - vecA.z) +
                vecC.x * (vecA.z - vecB.z)) /
            2.0,
        );
    }

    // Cleanup method
    dispose() {
        this.group.clear();
        this.roofMeshes = [];
        this.floorMeshes = [];
        if (this.wallSystem) {
            // Add dispose method call if it exists in UnifiedWallSystem
            this.wallSystem = undefined;
        }
    }
}
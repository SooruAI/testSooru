import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface DoorWindowData {
    id: string;
    type: 'door' | 'window';
    position: { x: number; z: number };
    rotation: number;
    scale: number;
    width: number;
    height?: number;
    doorPath?: string;
    windowPath?: string;
    flipHorizontal: boolean;
    flipVertical: boolean;
}

interface WallSegment {
    start: THREE.Vector3;
    end: THREE.Vector3;
    index: number;
}

export interface Cutout {
    position: THREE.Vector3;
    width: number;
    height: number;
    type: 'door' | 'window';
    id: string;
    modelPath: string;
}

export class DoorWindowManager {
    private scene: THREE.Scene;
    private loader: GLTFLoader;
    private loadedModels: Map<string, THREE.Object3D> = new Map();
    private cutouts: Map<string, Cutout> = new Map();

    // Model mappings for different door/window types
    private readonly MODEL_PATHS = {
        // Door models
        '/doors/Frame1.png': '/model/doors/double-door.glb',        // Double Door
        '/doors/Frame2.png': '/model/doors/single-door.glb',        // Single Door
        '/doors/Frame3.png': '/model/doors/pivot-door.glb',         // Pivot Door
        '/doors/Frame4.png': '/model/doors/single-sliding-door.glb', // Single Sliding Door
        '/doors/Frame5.png': '/model/doors/double-sliding-door.glb', // Double Sliding Door
        '/doors/Frame6.png': '/model/doors/bifold-door.glb',        // Bi-Fold Door
        
        // Window models
        '/doors/Frame7.png': '/model/windows/fixed-window.glb',      // Fixed Window
        '/doors/Frame8.png': '/model/windows/casement-window.glb',   // Casement Window
        '/doors/Frame9.png': '/model/windows/single-hung-window.glb', // Single Hung Window
        '/doors/Frame10.png': '/model/windows/double-hung-window.glb', // Double Hung Window
        '/doors/Frame11.png': '/model/windows/sliding-window.glb',   // Sliding Window
    };

    // Manual scale adjustments for each door/window type
    // Adjust these values to make doors/windows look good in your 3D scene
    private readonly MODEL_SCALES = {
        // Door scales - adjust these as needed
        '/doors/Frame1.png': 0.16,   // Double Door
        '/doors/Frame2.png': 16,   // Single Door
        '/doors/Frame3.png': 2.1,  // Pivot Door
        '/doors/Frame4.png': 1.6,   // Single Sliding Door
        '/doors/Frame5.png': 19.5,  // Double Sliding Door
        '/doors/Frame6.png': 16,   // Bi-Fold Door
        
        // Window scales - adjust these as needed
        '/doors/Frame7.png': 0.3,   // Fixed Window
        '/doors/Frame8.png': 10,   // Casement Window
        '/doors/Frame9.png': 14,  // Single Hung Window
        '/doors/Frame10.png': 0.4,  // Double Hung Window
        '/doors/Frame11.png': 0.44,  // Sliding Window
    };

    // Position offsets for fine-tuning model placement
    private readonly MODEL_POSITION_OFFSETS = {
        // Door position adjustments (Y-axis mainly for floor alignment)
        '/doors/Frame1.png': { x: 0, y: 0, z: 0 },     // Double Door
        '/doors/Frame2.png': { x: 0, y: 0, z: 0 },     // Single Door
        '/doors/Frame3.png': { x: 0, y: 0, z: 0 },     // Pivot Door
        '/doors/Frame4.png': { x: 0, y: 0, z: 0 },     // Single Sliding Door
        '/doors/Frame5.png': { x: 0, y: 0, z: 0 },     // Double Sliding Door
        '/doors/Frame6.png': { x: 0, y: 0, z: 0 },     // Bi-Fold Door
        
        // Window position adjustments
        '/doors/Frame7.png': { x: 0, y: 5, z: 0 },    // Fixed Window (higher on wall)
        '/doors/Frame8.png': { x: 0, y: 4, z: 0 },    // Casement Window
        '/doors/Frame9.png': { x: 0, y: 8, z: 0 },    // Single Hung Window
        '/doors/Frame10.png': { x: 0, y: 8, z: 0 },   // Double Hung Window
        '/doors/Frame11.png': { x: 0, y: 6, z: 0 },   // Sliding Window
    };

    // Rotation offsets for fine-tuning model orientation (in degrees)
    // Adjust these values to manually rotate each door/window type
    private readonly MODEL_ROTATION_OFFSETS = {
        // Door rotation adjustments (in degrees)
        '/doors/Frame1.png': 0,     // Double Door
        '/doors/Frame2.png': 90,     // Single Door
        '/doors/Frame3.png': 0,     // Pivot Door
        '/doors/Frame4.png': 0,     // Single Sliding Door
        '/doors/Frame5.png': 90,     // Double Sliding Door
        '/doors/Frame6.png': 0,     // Bi-Fold Door
        
        // Window rotation adjustments (in degrees)
        '/doors/Frame7.png': 90,     // Fixed Window
        '/doors/Frame8.png': 0,     // Casement Window
        '/doors/Frame9.png': 0,     // Single Hung Window
        '/doors/Frame10.png': 90,    // Double Hung Window
        '/doors/Frame11.png': 0,    // Sliding Window
    };

    // Wall depth offsets - individual settings for each door/window type
    private readonly WALL_DEPTH_OFFSETS = {
        // Door depth offsets (distance from wall center for interior/exterior copies)
        '/doors/Frame1.png': { interior: -1, exterior: 1 },   // Double Door
        '/doors/Frame2.png': { interior: -1, exterior: 1 },   // Single Door
        '/doors/Frame3.png': { interior: -1.5, exterior: 1.5 },   // Pivot Door
        '/doors/Frame4.png': { interior: -1, exterior: 1 },   // Single Sliding Door
        '/doors/Frame5.png': { interior: -1, exterior: 2 },   // Double Sliding Door
        '/doors/Frame6.png': { interior: -1.5, exterior: 0.5 },   // Bi-Fold Door
        
        // Window depth offsets
        '/doors/Frame7.png': { interior: 1, exterior: -1 },   // Fixed Window
        '/doors/Frame8.png': { interior: -0.7, exterior: 0.7 },   // Casement Window
        '/doors/Frame9.png': { interior: -0.7, exterior: 0.7 },   // Single Hung Window
        '/doors/Frame10.png': { interior: -0.9, exterior: 0.9 },  // Double Hung Window
        '/doors/Frame11.png': { interior: -0.7, exterior: 0.7 },  // Sliding Window
    };

    // Light emission settings for each door/window type
    // Higher values make models brighter (useful for dark models)
    private readonly MODEL_LIGHT_EMISSION = {
        '/doors/Frame1.png': 0.2,   // Double Door
        '/doors/Frame2.png': 0.2,   // Single Door
        '/doors/Frame3.png': 0.3,   // Pivot Door
        '/doors/Frame4.png': 0.1,   // Single Sliding Door
        '/doors/Frame5.png': 0.3,   // Double Sliding Door
        '/doors/Frame6.png': 0.2,   // Bi-Fold Door
        
        '/doors/Frame7.png': 0.25,   // Fixed Window
        '/doors/Frame8.png': 0.2,   // Casement Window
        '/doors/Frame9.png': 0.2,   // Single Hung Window
        '/doors/Frame10.png': 0.2,  // Double Hung Window
        '/doors/Frame11.png': 0.2,  // Sliding Window
    };

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.loader = new GLTFLoader();
    }

    /**
     * Get the scale factor for a specific door/window type
     */
    public getModelScale(path: string): number {
        return this.MODEL_SCALES[path as keyof typeof this.MODEL_SCALES] || 1.0;
    }

    /**
     * Set a custom scale for a specific door/window type
     */
    public setModelScale(path: string, scale: number): void {
        if (this.MODEL_SCALES[path as keyof typeof this.MODEL_SCALES] !== undefined) {
            (this.MODEL_SCALES as any)[path] = scale;
            
            // Update existing models with this path
            this.updateExistingModelsScale(path, scale);
        }
    }

    /**
     * Get depth offsets for a specific door/window type
     */
    public getDepthOffsets(path: string): { interior: number; exterior: number } {
        return this.WALL_DEPTH_OFFSETS[path as keyof typeof this.WALL_DEPTH_OFFSETS] || { interior: -0.5, exterior: 0.5 };
    }

    /**
     * Set depth offsets for a specific door/window type
     */
    public setDepthOffsets(path: string, offsets: { interior: number; exterior: number }): void {
        if (this.WALL_DEPTH_OFFSETS[path as keyof typeof this.WALL_DEPTH_OFFSETS] !== undefined) {
            (this.WALL_DEPTH_OFFSETS as any)[path] = offsets;
            
            // Update existing models with this path
            this.updateExistingModelsPosition(path);
        }
    }

    /**
     * Get light emission for a specific door/window type
     */
    public getLightEmission(path: string): number {
        return this.MODEL_LIGHT_EMISSION[path as keyof typeof this.MODEL_LIGHT_EMISSION] || 0.0;
    }

    /**
     * Set light emission for a specific door/window type
     */
    public setLightEmission(path: string, emission: number): void {
        if (this.MODEL_LIGHT_EMISSION[path as keyof typeof this.MODEL_LIGHT_EMISSION] !== undefined) {
            (this.MODEL_LIGHT_EMISSION as any)[path] = Math.max(0, Math.min(1, emission)); // Clamp between 0-1
            
            // Update existing models with this path
            this.updateExistingModelsLighting(path);
        }
    }

    /**
     * Update lighting for existing models of a specific type
     */
    private updateExistingModelsLighting(path: string): void {
        const emission = this.getLightEmission(path);
        this.scene.traverse((object) => {
            if (object.userData?.modelPath === path) {
                // Apply emission to all materials in the model
                object.traverse((child) => {
                    if (child instanceof THREE.Mesh && child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(material => {
                            if (material instanceof THREE.MeshStandardMaterial) {
                                material.emissive.setScalar(emission);
                                material.needsUpdate = true;
                            } else if (material instanceof THREE.MeshBasicMaterial) {
                                // MeshBasicMaterial doesn't have emissive, so we brighten the color instead
                                const originalColor = material.color.clone();
                                material.color.lerp(new THREE.Color(1, 1, 1), emission);
                                material.needsUpdate = true;
                            }
                        });
                    }
                });
            }
        });
    }

    /**
     * Get all current light emission settings for debugging/UI
     */
    public getAllLightEmissions(): Record<string, number> {
        return { ...this.MODEL_LIGHT_EMISSION };
    }

    /**
     * Reset all light emissions to default values
     */
    public resetAllLightEmissions(): void {
        // Reset to default values
        Object.keys(this.MODEL_LIGHT_EMISSION).forEach(key => {
            (this.MODEL_LIGHT_EMISSION as any)[key] = key.includes('window') ? 0.1 : 0.0;
        });
        
        // Update all existing models
        Object.keys(this.MODEL_LIGHT_EMISSION).forEach(path => {
            this.updateExistingModelsLighting(path);
        });
    }

    /**
     * Get rotation offset for a specific door/window type
     */
    public getRotationOffset(path: string): number {
        return this.MODEL_ROTATION_OFFSETS[path as keyof typeof this.MODEL_ROTATION_OFFSETS] || 0;
    }

    /**
     * Set rotation offset for a specific door/window type
     */
    public setRotationOffset(path: string, rotationDegrees: number): void {
        if (this.MODEL_ROTATION_OFFSETS[path as keyof typeof this.MODEL_ROTATION_OFFSETS] !== undefined) {
            (this.MODEL_ROTATION_OFFSETS as any)[path] = rotationDegrees;
            
            // Update existing models with this path
            this.updateExistingModelsRotation(path);
        }
    }

    /**
     * Update rotation for existing models of a specific type
     */
    private updateExistingModelsRotation(path: string): void {
        const rotationOffset = this.getRotationOffset(path);
        this.scene.traverse((object) => {
            if (object.userData?.modelPath === path) {
                const baseRotation = object.userData?.baseRotation || 0;
                object.rotation.y = (baseRotation + rotationOffset) * Math.PI / 180;
            }
        });
    }

    /**
     * Get position offset for a specific door/window type
     */
    public getPositionOffset(path: string): { x: number; y: number; z: number } {
        return this.MODEL_POSITION_OFFSETS[path as keyof typeof this.MODEL_POSITION_OFFSETS] || { x: 0, y: 0, z: 0 };
    }

    /**
     * Set position offset for a specific door/window type
     */
    public setPositionOffset(path: string, offset: { x: number; y: number; z: number }): void {
        if (this.MODEL_POSITION_OFFSETS[path as keyof typeof this.MODEL_POSITION_OFFSETS] !== undefined) {
            (this.MODEL_POSITION_OFFSETS as any)[path] = offset;
            
            // Update existing models with this path
            this.updateExistingModelsPosition(path);
        }
    }

    /**
     * Update scale for existing models of a specific type
     */
    private updateExistingModelsScale(path: string, newScale: number): void {
        this.scene.traverse((object) => {
            if (object.userData?.modelPath === path) {
                const baseScale = object.userData?.baseScale || 1.0;
                object.scale.setScalar(baseScale * newScale);
            }
        });
    }

    /**
     * Update position for existing models of a specific type
     */
    private updateExistingModelsPosition(path: string): void {
        const offset = this.getPositionOffset(path);
        this.scene.traverse((object) => {
            if (object.userData?.modelPath === path) {
                const cutout = this.cutouts.get(object.userData.id);
                if (cutout) {
                    object.position.set(
                        cutout.position.x + offset.x,
                        cutout.position.y + offset.y,
                        cutout.position.z + offset.z
                    );
                }
            }
        });
    }

    /**
     * Get all current rotation settings for debugging/UI
     */
    public getAllRotations(): Record<string, number> {
        return { ...this.MODEL_ROTATION_OFFSETS };
    }

    /**
     * Reset all rotations to default values
     */
    public resetAllRotations(): void {
        // Reset to default values
        Object.keys(this.MODEL_ROTATION_OFFSETS).forEach(key => {
            (this.MODEL_ROTATION_OFFSETS as any)[key] = 0;
        });
        
        // Update all existing models
        this.scene.traverse((object) => {
            if (object.userData?.isDoorWindow && object.userData?.baseRotation !== undefined) {
                object.rotation.y = (object.userData.baseRotation * Math.PI) / 180;
            }
        });
    }

    /**
     * Get all current scale settings for debugging/UI
     */
    public getAllScales(): Record<string, number> {
        return { ...this.MODEL_SCALES };
    }

    /**
     * Reset all scales to default values
     */
    public resetAllScales(): void {
        // Reset to default values
        Object.keys(this.MODEL_SCALES).forEach(key => {
            (this.MODEL_SCALES as any)[key] = 1.0;
        });
        
        // Update all existing models
        this.scene.traverse((object) => {
            if (object.userData?.isDoorWindow && object.userData?.baseScale) {
                object.scale.setScalar(object.userData.baseScale);
            }
        });
    }

    /**
     * Process doors and windows from floor plan data
     */
    public async processDoorWindows(
        doors: DoorWindowData[], 
        windows: DoorWindowData[], 
        wallSegments: WallSegment[]
    ): Promise<void> {
        // Clear existing cutouts
        this.clearAll();

        // Process doors
        for (const door of doors) {
            await this.addDoorWindow(
                {
                    ...door,
                    type: 'door',
                    height: door.height || 2.1, // Default door height
                    modelPath: this.MODEL_PATHS[door.doorPath as keyof typeof this.MODEL_PATHS] || '/model/doors/single-door.glb'
                },
                wallSegments
            );
        }

        // Process windows
        for (const window of windows) {
            await this.addDoorWindow(
                {
                    ...window,
                    type: 'window',
                    height: window.height || 1.2, // Default window height
                    modelPath: this.MODEL_PATHS[window.windowPath as keyof typeof this.MODEL_PATHS] || '/model/windows/fixed-window.glb'
                },
                wallSegments
            );
        }
    }

    /**
     * Add a door or window with cutout
     */
    private async addDoorWindow(
        item: DoorWindowData & { modelPath: string; height: number },
        wallSegments: WallSegment[]
    ): Promise<void> {
        const wallSegment = this.findWallSegment(item.position, wallSegments);
        if (!wallSegment) {
            console.warn(`No wall segment found for ${item.type} at position`, item.position);
            return;
        }

        // Calculate cutout position along the wall
        const cutoutPosition = this.calculateCutoutPosition(item.position, wallSegment);
        
        // Create cutout data
        const cutout: Cutout = {
            position: cutoutPosition,
            width: item.width * 30, // Scale up for 3D world units
            height: item.height * 30,
            type: item.type,
            id: item.id,
            modelPath: item.modelPath
        };

        this.cutouts.set(item.id, cutout);

        // Load and place 3D model (with wall depth offset)
        await this.load3DModel(cutout, item, wallSegment);
    }

    /**
     * Find the wall segment closest to the given position
     */
    private findWallSegment(position: { x: number; z: number }, wallSegments: WallSegment[]): WallSegment | null {
        let closestSegment: WallSegment | null = null;
        let minDistance = Infinity;

        const pos = new THREE.Vector3(position.x, 0, position.z);

        for (const segment of wallSegments) {
            const distance = this.distanceToLineSegment(pos, segment.start, segment.end);
            if (distance < minDistance && distance < 5) { // Within 5 units of wall
                minDistance = distance;
                closestSegment = segment;
            }
        }

        return closestSegment;
    }

    /**
     * Calculate distance from point to line segment
     */
    private distanceToLineSegment(point: THREE.Vector3, lineStart: THREE.Vector3, lineEnd: THREE.Vector3): number {
        const line = lineEnd.clone().sub(lineStart);
        const lineLength = line.length();
        
        if (lineLength === 0) return point.distanceTo(lineStart);
        
        const t = Math.max(0, Math.min(1, point.clone().sub(lineStart).dot(line) / (lineLength * lineLength)));
        const projection = lineStart.clone().add(line.multiplyScalar(t));
        
        return point.distanceTo(projection);
    }

    /**
     * Calculate the exact position for the cutout along the wall
     */
    private calculateCutoutPosition(
        position: { x: number; z: number }, 
        wallSegment: WallSegment
    ): THREE.Vector3 {
        const wallDirection = wallSegment.end.clone().sub(wallSegment.start).normalize();
        const wallNormal = new THREE.Vector3(-wallDirection.z, 0, wallDirection.x);
        
        // Project the position onto the wall line
        const toPosition = new THREE.Vector3(position.x, 0, position.z).sub(wallSegment.start);
        const alongWall = toPosition.dot(wallDirection);
        
        // Calculate position along the wall
        const cutoutPosition = wallSegment.start.clone().add(wallDirection.multiplyScalar(alongWall));
        cutoutPosition.y = 0; // Floor level
        
        return cutoutPosition;
    }

    /**
     * Calculate the positions for both sides of the wall
     */
    private calculateDualModelPositions(
        cutoutPosition: THREE.Vector3,
        wallSegment: WallSegment,
        positionOffset: { x: number; y: number; z: number },
        modelPath: string
    ): { interior: THREE.Vector3; exterior: THREE.Vector3 } {
        const wallDirection = wallSegment.end.clone().sub(wallSegment.start).normalize();
        const wallNormal = new THREE.Vector3(-wallDirection.z, 0, wallDirection.x);
        
        // Get individual depth offsets for this model type
        const depthOffsets = this.getDepthOffsets(modelPath);
        
        // Calculate positions for both sides
        const interiorPosition = cutoutPosition.clone();
        const exteriorPosition = cutoutPosition.clone();
        
        // Push interior copy toward room interior (negative normal direction)
        interiorPosition.add(wallNormal.clone().multiplyScalar(depthOffsets.interior));
        
        // Push exterior copy toward building exterior (positive normal direction)  
        exteriorPosition.add(wallNormal.clone().multiplyScalar(depthOffsets.exterior));
        
        // Apply custom position offset to both
        const offset = new THREE.Vector3(positionOffset.x, positionOffset.y, positionOffset.z);
        interiorPosition.add(offset);
        exteriorPosition.add(offset);
        
        return { interior: interiorPosition, exterior: exteriorPosition };
    }

    /**
     * Load and place 3D model - creates two copies, one on each side of wall
     */
    private async load3DModel(cutout: Cutout, itemData: DoorWindowData, wallSegment: WallSegment): Promise<void> {
        try {
            // Check if model is already loaded
            if (this.loadedModels.has(cutout.modelPath)) {
                const originalModel = this.loadedModels.get(cutout.modelPath)!;
                
                // Create two copies
                const interiorModel = originalModel.clone();
                const exteriorModel = originalModel.clone();
                
                this.setupDualModels(interiorModel, exteriorModel, cutout, itemData, wallSegment);
                return;
            }

            // Load new model
            const gltf = await new Promise<any>((resolve, reject) => {
                this.loader.load(
                    cutout.modelPath,
                    resolve,
                    undefined,
                    reject
                );
            });

            // Cache the loaded model
            this.loadedModels.set(cutout.modelPath, gltf.scene);
            
            // Create two copies from loaded model
            const interiorModel = gltf.scene.clone();
            const exteriorModel = gltf.scene.clone();
            
            this.setupDualModels(interiorModel, exteriorModel, cutout, itemData, wallSegment);

        } catch (error) {
            console.warn(`Failed to load ${cutout.type} model:`, cutout.modelPath, error);
            // Create fallback placeholders
            this.createDualFallbackModels(cutout, itemData, wallSegment);
        }
    }

    /**
     * Setup dual models (interior and exterior copies)
     */
    private setupDualModels(
        interiorModel: THREE.Object3D, 
        exteriorModel: THREE.Object3D, 
        cutout: Cutout, 
        itemData: DoorWindowData, 
        wallSegment: WallSegment
    ): void {
        // Get the model path for this item
        const modelPath = cutout.type === 'door' 
            ? itemData.doorPath || '/doors/Frame2.png'
            : itemData.windowPath || '/doors/Frame7.png';

        // Get custom scale and position offset for this model type
        const customScale = this.getModelScale(modelPath);
        const positionOffset = this.getPositionOffset(modelPath);
        
        // Calculate positions for both sides of the wall
        const positions = this.calculateDualModelPositions(
            cutout.position,
            wallSegment,
            positionOffset,
            modelPath
        );
        
        // Setup interior model
        this.setupSingleModel(interiorModel, positions.interior, cutout, itemData, modelPath, customScale, 'interior', wallSegment);
        
        // Setup exterior model
        this.setupSingleModel(exteriorModel, positions.exterior, cutout, itemData, modelPath, customScale, 'exterior', wallSegment);
    }

    /**
     * Setup a single model (helper for dual setup)
     */
    private setupSingleModel(
        model: THREE.Object3D,
        position: THREE.Vector3,
        cutout: Cutout,
        itemData: DoorWindowData,
        modelPath: string,
        customScale: number,
        side: 'interior' | 'exterior',
        wallSegment: WallSegment
    ): void {
        // Position the model
        model.position.copy(position);
        
        // Set rotation with custom offset
        const rotationOffset = this.getRotationOffset(modelPath);
        const finalRotation = itemData.rotation + rotationOffset;
        model.rotation.y = (finalRotation * Math.PI) / 180;
        
        // Apply both item scale and custom model scale
        const finalScale = (itemData.scale || 1) * customScale;
        model.scale.set(finalScale, finalScale, finalScale);
        
        // Handle flipping
        if (itemData.flipHorizontal) {
            model.scale.x *= -1;
        }
        if (itemData.flipVertical) {
            model.scale.y *= -1;
        }

        // Apply light emission to all materials in the model
        const lightEmission = this.getLightEmission(modelPath);
        this.applyLightEmissionToModel(model, lightEmission);

        // Align to floor for doors
        if (cutout.type === 'door') {
            this.alignToFloor(model);
            // Restore Y position after floor alignment
            const yOffset = this.getPositionOffset(modelPath).y;
            model.position.y += yOffset;
        }

        // Store metadata for future updates
        model.userData = {
            type: cutout.type,
            id: `${cutout.id}_${side}`, // Unique ID for each side
            originalId: cutout.id,
            isDoorWindow: true,
            modelPath: modelPath,
            baseScale: itemData.scale || 1,
            customScale: customScale,
            baseRotation: itemData.rotation, // Store original rotation
            rotationOffset: rotationOffset,
            lightEmission: lightEmission,
            wallSegment: wallSegment,
            side: side
        };

        this.scene.add(model);
    }

    /**
     * Apply light emission to all materials in a model
     */
    private applyLightEmissionToModel(model: THREE.Object3D, emission: number): void {
        model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(material => {
                    if (material instanceof THREE.MeshStandardMaterial) {
                        material.emissive.setScalar(emission);
                        material.needsUpdate = true;
                    } else if (material instanceof THREE.MeshBasicMaterial) {
                        // MeshBasicMaterial doesn't have emissive, so we brighten the color instead
                        const originalColor = material.color.clone();
                        material.color.lerp(new THREE.Color(1, 1, 1), emission);
                        material.needsUpdate = true;
                    }
                });
            }
        });
    }

    /**
     * Align model to floor
     */
    private alignToFloor(model: THREE.Object3D): void {
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        
        if (!box.isEmpty()) {
            const bottomY = box.min.y;
            model.position.y = -bottomY + 0.01; // Small offset to prevent z-fighting
        }
    }

    /**
     * Create dual fallback placeholder models
     */
    private createDualFallbackModels(cutout: Cutout, itemData: DoorWindowData, wallSegment: WallSegment): void {
        const modelPath = cutout.type === 'door' 
            ? itemData.doorPath || '/doors/Frame2.png'
            : itemData.windowPath || '/doors/Frame7.png';
            
        const customScale = this.getModelScale(modelPath);
        const positionOffset = this.getPositionOffset(modelPath);
        
        // Calculate positions for both sides
        const positions = this.calculateDualModelPositions(
            cutout.position,
            wallSegment,
            positionOffset,
            modelPath
        );
        
        // Create geometry for fallback
        const geometry = cutout.type === 'door' 
            ? new THREE.BoxGeometry(cutout.width, cutout.height, 0.8) // Thinner fallback door
            : new THREE.PlaneGeometry(cutout.width, cutout.height);
            
        const material = new THREE.MeshBasicMaterial({
            color: cutout.type === 'door' ? 0x8B4513 : 0x87CEEB,
            transparent: cutout.type === 'window',
            opacity: cutout.type === 'window' ? 0.3 : 1
        });

        // Create interior fallback
        const interiorMesh = new THREE.Mesh(geometry, material);
        this.setupSingleFallback(interiorMesh, positions.interior, cutout, itemData, modelPath, customScale, 'interior', wallSegment);
        
        // Create exterior fallback
        const exteriorMesh = new THREE.Mesh(geometry, material.clone());
        this.setupSingleFallback(exteriorMesh, positions.exterior, cutout, itemData, modelPath, customScale, 'exterior', wallSegment);
    }

    /**
     * Setup a single fallback model
     */
    private setupSingleFallback(
        mesh: THREE.Mesh,
        position: THREE.Vector3,
        cutout: Cutout,
        itemData: DoorWindowData,
        modelPath: string,
        customScale: number,
        side: 'interior' | 'exterior',
        wallSegment: WallSegment
    ): void {
        mesh.position.copy(position);
        
        // Set rotation with custom offset
        const rotationOffset = this.getRotationOffset(modelPath);
        const finalRotation = itemData.rotation + rotationOffset;
        mesh.rotation.y = (finalRotation * Math.PI) / 180;
        
        // Apply custom scale
        const finalScale = (itemData.scale || 1) * customScale;
        mesh.scale.set(finalScale, finalScale, finalScale);

        // Apply light emission to fallback material
        const lightEmission = this.getLightEmission(modelPath);
        if (mesh.material instanceof THREE.MeshBasicMaterial) {
            // MeshBasicMaterial doesn't have emissive, so we brighten the color
            const originalColor = mesh.material.color.clone();
            mesh.material.color.lerp(new THREE.Color(1, 1, 1), lightEmission);
        }

        mesh.userData = {
            type: cutout.type,
            id: `${cutout.id}_${side}`,
            originalId: cutout.id,
            isDoorWindow: true,
            isFallback: true,
            modelPath: modelPath,
            baseScale: itemData.scale || 1,
            customScale: customScale,
            baseRotation: itemData.rotation,
            rotationOffset: rotationOffset,
            lightEmission: lightEmission,
            wallSegment: wallSegment,
            side: side
        };

        this.scene.add(mesh);
    }

    /**
     * Get all cutouts for wall generation
     */
    public getCutouts(): Map<string, Cutout> {
        return this.cutouts;
    }

    /**
     * Check if a point is within any cutout area
     */
    public isPointInCutout(point: THREE.Vector3, wallStart: THREE.Vector3, wallEnd: THREE.Vector3): boolean {
        for (const cutout of Array.from(this.cutouts.values())) {
            if (this.isPointInCutoutArea(point, cutout, wallStart, wallEnd)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if point is within specific cutout area
     */
    private isPointInCutoutArea(
        point: THREE.Vector3, 
        cutout: Cutout, 
        wallStart: THREE.Vector3, 
        wallEnd: THREE.Vector3
    ): boolean {
        // Project cutout position onto wall
        const wallDirection = wallEnd.clone().sub(wallStart).normalize();
        const toCutout = cutout.position.clone().sub(wallStart);
        const cutoutAlongWall = toCutout.dot(wallDirection);
        
        // Project point onto wall
        const toPoint = point.clone().sub(wallStart);
        const pointAlongWall = toPoint.dot(wallDirection);
        
        // Check if point is within cutout width along wall
        const halfWidth = cutout.width / 2;
        const withinWidth = Math.abs(pointAlongWall - cutoutAlongWall) <= halfWidth;
        
        // Check height for vertical cutouts
        const withinHeight = point.y >= 0 && point.y <= cutout.height;
        
        return withinWidth && withinHeight;
    }

    /**
     * Clear all doors and windows
     */
    public clearAll(): void {
        // Remove from scene
        const objectsToRemove: THREE.Object3D[] = [];
        this.scene.traverse((object) => {
            if (object.userData?.isDoorWindow) {
                objectsToRemove.push(object);
            }
        });

        objectsToRemove.forEach(obj => this.scene.remove(obj));
        
        // Clear cutouts
        this.cutouts.clear();
    }

    /**
     * Update door/window position - updates both interior and exterior copies
     */
    public updatePosition(originalId: string, position: { x: number; z: number }): void {
        const cutout = this.cutouts.get(originalId);
        if (!cutout) return;

        cutout.position.x = position.x;
        cutout.position.z = position.z;

        // Update both interior and exterior models
        ['interior', 'exterior'].forEach(side => {
            const model = this.scene.getObjectByProperty('userData.id', `${originalId}_${side}`);
            if (model && model.userData?.wallSegment) {
                const wallSegment = model.userData.wallSegment;
                const modelPath = model.userData.modelPath;
                const positionOffset = this.getPositionOffset(modelPath);
                
                const positions = this.calculateDualModelPositions(
                    cutout.position,
                    wallSegment,
                    positionOffset,
                    modelPath
                );
                
                model.position.copy(side === 'interior' ? positions.interior : positions.exterior);
            }
        });
    }

    /**
     * Dispose of all resources
     */
    public dispose(): void {
        this.clearAll();
        this.loadedModels.clear();
    }
}

// Export helper functions for wall generation
export const createWallWithCutouts = (
    wallStart: THREE.Vector3,
    wallEnd: THREE.Vector3,
    wallHeight: number,
    wallThickness: number,
    cutouts: Map<string, Cutout>,
    material: THREE.Material
): THREE.Group => {
    const wallGroup = new THREE.Group();
    
    // Use the existing calculateWallSegments function
    const segments = calculateWallSegments(wallStart, wallEnd, wallHeight, cutouts);
    
    for (const segment of segments) {
        const segmentGeometry = new THREE.BoxGeometry(
            segment.width,
            segment.height,
            wallThickness
        );
        
        const segmentMesh = new THREE.Mesh(segmentGeometry, material);
        segmentMesh.position.copy(segment.position);
        segmentMesh.position.y = segment.height / 2; // Center vertically
        wallGroup.add(segmentMesh);
    }
    
    return wallGroup;
};

const createWallShapeWithHoles = (
    wallLength: number,
    wallHeight: number,
    cutouts: Map<string, Cutout>,
    wallStart: THREE.Vector3,
    wallEnd: THREE.Vector3
): THREE.Shape => {
    // Create the main wall shape
    const wallShape = new THREE.Shape();
    wallShape.moveTo(-wallLength / 2, -wallHeight / 2);
    wallShape.lineTo(wallLength / 2, -wallHeight / 2);
    wallShape.lineTo(wallLength / 2, wallHeight / 2);
    wallShape.lineTo(-wallLength / 2, wallHeight / 2);
    wallShape.closePath();
    
    // Create holes for each cutout
    const wallDirection = wallEnd.clone().sub(wallStart).normalize();
    
    for (const cutout of Array.from(cutouts.values())) {
        // Calculate cutout position relative to wall start
        const toCutout = cutout.position.clone().sub(wallStart);
        const cutoutAlongWall = toCutout.dot(wallDirection);
        
        // Convert to shape coordinates (centered at 0,0)
        const cutoutX = cutoutAlongWall - wallLength / 2;
        const cutoutY = (cutout.type === 'window' ? 10 : 0) - wallHeight / 2; // Windows start at height 10
        
        // Create hole shape
        const holeShape = new THREE.Path();
        const halfWidth = cutout.width / 2;
        const cutoutHeight = cutout.height;
        
        holeShape.moveTo(cutoutX - halfWidth, cutoutY);
        holeShape.lineTo(cutoutX + halfWidth, cutoutY);
        holeShape.lineTo(cutoutX + halfWidth, cutoutY + cutoutHeight);
        holeShape.lineTo(cutoutX - halfWidth, cutoutY + cutoutHeight);
        holeShape.closePath();
        
        wallShape.holes.push(holeShape);
    }
    
    return wallShape;
};

interface WallSegmentData {
    position: THREE.Vector3;
    width: number;
    height: number;
}

const calculateWallSegments = (
    wallStart: THREE.Vector3,
    wallEnd: THREE.Vector3,
    wallHeight: number,
    cutouts: Map<string, Cutout>
): WallSegmentData[] => {
    const segments: WallSegmentData[] = [];
    const wallDirection = wallEnd.clone().sub(wallStart).normalize();
    const wallLength = wallStart.distanceTo(wallEnd);
    
    // Find cutouts that intersect this wall
    const wallCutouts: Array<{ position: number; width: number; height: number }> = [];
    
    for (const cutout of Array.from(cutouts.values())) {
        const toCutout = cutout.position.clone().sub(wallStart);
        const cutoutAlongWall = toCutout.dot(wallDirection);
        
        // Check if cutout intersects this wall
        if (cutoutAlongWall >= -cutout.width/2 && cutoutAlongWall <= wallLength + cutout.width/2) {
            wallCutouts.push({
                position: cutoutAlongWall,
                width: cutout.width,
                height: cutout.height
            });
        }
    }
    
    // Sort cutouts by position along wall
    wallCutouts.sort((a, b) => a.position - b.position);
    
    // Create wall segments between cutouts
    let currentPos = 0;
    
    for (const cutout of wallCutouts) {
        const cutoutStart = cutout.position - cutout.width / 2;
        const cutoutEnd = cutout.position + cutout.width / 2;
        
        // Add segment before cutout
        if (currentPos < cutoutStart) {
            const segmentWidth = cutoutStart - currentPos;
            const segmentCenter = currentPos + segmentWidth / 2;
            
            segments.push({
                position: wallStart.clone().add(wallDirection.clone().multiplyScalar(segmentCenter)),
                width: segmentWidth,
                height: wallHeight
            });
        }
        
        // Add segments above and below cutout if it doesn't reach full height
        if (cutout.height < wallHeight) {
            // Above cutout
            segments.push({
                position: wallStart.clone().add(wallDirection.clone().multiplyScalar(cutout.position)).setY(cutout.height + (wallHeight - cutout.height) / 2),
                width: cutout.width,
                height: wallHeight - cutout.height
            });
        }
        
        currentPos = Math.max(currentPos, cutoutEnd);
    }
    
    // Add final segment
    if (currentPos < wallLength) {
        const segmentWidth = wallLength - currentPos;
        const segmentCenter = currentPos + segmentWidth / 2;
        
        segments.push({
            position: wallStart.clone().add(wallDirection.clone().multiplyScalar(segmentCenter)),
            width: segmentWidth,
            height: wallHeight
        });
    }
    
    return segments;
};
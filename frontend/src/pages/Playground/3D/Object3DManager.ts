import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FrameIcon } from 'lucide-react';
import { Stairs } from '@mui/icons-material';
import { s } from 'framer-motion/dist/types.d-6pKw1mTI';

export interface Object3DData {
    id: string;
    name: string;
    modelPath: string;
    imagePath: string;
    description: string;
    author: string;
    license: string;
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
    mesh?: THREE.Object3D;
    isSelected?: boolean;
    isLoading?: boolean;
    loadError?: string;
}

export const OBJECT_POSITION_OFFSETS = {
    chair: { x: 0, y: 0, z: 0 },
    bed: { x: 0, y: 0, z: 0 },
    sofa: { x: 0, y: 0, z: -20 },
    table: { x: 0, y: 0, z: 40 },
    lamp: { x: 0, y: 0, z: -40 },
    toilet: { x: 0, y: 0, z: -20 },
    basin: { x: 0, y: 0, z: -10 },
    diningtable: { x: 0, y: 0, z: 0 },
    tap: { x: 0, y: 15, z: 0 },
    fridge: { x: 0, y: 0, z: 0 },
    stove: { x: 0, y: 0, z: 0 },
    wash: { x: 0, y: 0, z: 0 },
    kitchen: { x: 0, y: 0, z: 0 },
    tv: { x: 0, y: 0, z: 0 },
    tub: { x: 0, y: 0, z: 0 },
    elevator: { x: 0, y: 0, z: 0 },
    cupboard: { x: 0, y: 0, z: 0 },
    stairs: { x: 0, y: 0, z: 0 },
    car: {x:0, y:0, z:0},
    bike: {x:0, y:0, z:0},
    dressingtable: { x: 0, y: 0, z: 0 },
    default: { x: 0, y: 0, z: -80 }
} as const;

export const OBJECT_SIZE_MULTIPLIERS = {
    chair: [15, 15, 15, 15, 20, 20, 30, 15, 15, 15, 20, 12, 20, 20, 15, 15, 20, 20, 30, 10, 10, 20, 25, 15, 15, 15, 20, 30, 8, 15, 15],
    bed: [50, 65, 65, 65, 60, 60, 90, 45, 40, 40, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
    sofa: [35, 45, 45, 50, 20, 50, 40, 40, 20, 30, 80, 40, 50, 55, 30, 40, 50, 40, 40, 35, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
    table: [50, 30, 15, 20, 25, 15, 25, 30, 15, 30, 60, 20, 10, 20, 30, 60],
    lamp: [6, 5, 7, 5.5, 6.5],
    toilet: [20],
    basin: [17],
    diningtable: [40],
    tap: [5],
    fridge: [35, 35],
    stove: [20],
    wash: [20, 20],
    kitchen: [35],
    tv: [40, 30, 30],
    tub: [40],
    elevator: [40, 40],
    cupboard: [40],
    stairs: [40, 60, 40],
    car: [80, 80],
    bike: [30, 30],
    dressingtable: [25, 30],
    default: [5, 7, 9, 8.5, 7.5]
} as const;

export const OBJECT_ROTATION_OFFSETS = {
    chair: [0, 0, 0, 0, 0],
    bed: [0, 0, 0, 0, 0],
    sofa: [0, 0, 0, 0, 0],
    table: [0, 0, 0, 0, 0],
    lamp: [0, 0, 0, 0, 0],
    toilet: [0],
    basin: [0],
    diningtable: [0],
    tap: [0],
    fridge: [0],
    stove: [0],
    wash: [0, 0],
    kitchen: [0],
    tv: [0, 0],
    tub: [0],
    elevator: [0, 0],
    cupboard: [0],
    stairs: [0],
    car: [0, 0],
    bike: [0, 0],
    dressingtable: [0, 0],
    default: [0, 0, 0, 0, 0]
} as const;

export const OBJECT_LUMINESCENCE = {
    chair: [1, 1, 1, 1, 1],
    bed: [1, 1, 1, 1, 1, 1, 1, 1],
    sofa: [1, 1, 1, 1, 1, 1],
    table: [1, 1, 1, 1, 1],
    lamp: [1, 1, 1, 1, 1],
    toilet: [1],
    basin: [1],
    diningtable: [1],
    tap: [1],
    fridge: [1],
    stove: [1],
    wash: [1, 1],
    kitchen: [1],
    tv: [1, 1],
    tub: [1],
    elevator: [1, 1],
    cupboard: [1],
    stairs: [1],
    car: [1, 1],
    bike: [1, 1],
    dressingtable: [1, 1],
    default: [1, 1, 1, 1, 1]
} as const;

export type ObjectType = keyof typeof OBJECT_SIZE_MULTIPLIERS;

export function getSizeMultiplier(objectType: string, variantIndex: number = 0): number {
    const type = objectType as ObjectType;
    const multipliers = OBJECT_SIZE_MULTIPLIERS[type] || OBJECT_SIZE_MULTIPLIERS.default;
    return multipliers[variantIndex % multipliers.length];
}

export function getVariantIndexFromPath(modelPath: string, objectType: string): number {
    const regex = new RegExp(`${objectType}-(\\d+)`, 'i');
    const match = modelPath.match(regex);

    if (match && match[1]) {
        const index = parseInt(match[1], 10) - 1;
        return Math.max(0, index);
    }

    return 0;
}

export function getRotationOffset(objectType: string, variantIndex: number = 0): number {
    const type = objectType as ObjectType;
    const offsets = OBJECT_ROTATION_OFFSETS[type] || OBJECT_ROTATION_OFFSETS.default;
    return offsets[variantIndex % offsets.length];
}

export function getLuminescence(objectType: string, variantIndex: number = 0): number {
    const type = objectType as ObjectType;
    const luminescence = OBJECT_LUMINESCENCE[type] || OBJECT_LUMINESCENCE.default;
    return luminescence[variantIndex % luminescence.length];
}

export function getAvailableSizes(objectType: string): number[] {
    const type = objectType as ObjectType;
    return [...(OBJECT_SIZE_MULTIPLIERS[type] || OBJECT_SIZE_MULTIPLIERS.default)];
}

export interface Object3DManagerConfig {
    scene: THREE.Scene;
    camera: THREE.Camera;
    raycaster: THREE.Raycaster;
    floorPlanData?: any;
}

export class Object3DManager {
    public scene: THREE.Scene;
    public camera: THREE.Camera;
    private raycaster: THREE.Raycaster;
    private loader: GLTFLoader;
    private dracoLoader: DRACOLoader;
    private floorPlanData: any;
    private objects: Map<string, Object3DData> = new Map();
    private selectedObjectId: string | null = null;
    private onObjectSelect?: (objectId: string | null) => void;
    private onObjectUpdate?: (objectId: string, data: Object3DData) => void;
    private isDragging: boolean = false;
    private dragStart: THREE.Vector2 = new THREE.Vector2();
    private dragPlane: THREE.Plane = new THREE.Plane();
    private dragOffset: THREE.Vector3 = new THREE.Vector3();

    public offsetX: number = 0;
    public offsetY: number = 0;
    public offsetZ: number = -80;

    constructor(config: Object3DManagerConfig) {
        this.scene = config.scene;
        this.camera = config.camera;
        this.raycaster = config.raycaster;
        this.floorPlanData = config.floorPlanData;
        this.loader = new GLTFLoader();

        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        this.dracoLoader.setDecoderConfig({ type: 'js' });

        this.loader.setDRACOLoader(this.dracoLoader);

        this.setupDragPlane();
    }

    private getObjectOffset(objectType: string): { x: number; y: number; z: number } {
        const type = objectType as keyof typeof OBJECT_POSITION_OFFSETS;
        return OBJECT_POSITION_OFFSETS[type] || OBJECT_POSITION_OFFSETS.default;
    }

    public setObjectTypeOffset(objectType: string, offsetX: number, offsetY: number, offsetZ: number): void {
        const type = objectType as keyof typeof OBJECT_POSITION_OFFSETS;
        if (OBJECT_POSITION_OFFSETS[type] !== undefined) {
            (OBJECT_POSITION_OFFSETS as any)[type] = { x: offsetX, y: offsetY, z: offsetZ };

            this.updateObjectsOfType(objectType);
        }
    }

    public setGlobalOffset(offsetX: number, offsetY: number, offsetZ: number): void {
        Object.keys(OBJECT_POSITION_OFFSETS).forEach(type => {
            (OBJECT_POSITION_OFFSETS as any)[type] = { x: offsetX, y: offsetY, z: offsetZ };
        });

        this.updateAllObjectsWithOffset();
    }

    private updateObjectsOfType(objectType: string): void {
        this.objects.forEach((objectData) => {
            if (objectData.mesh) {
                const currentObjectType = this.getObjectTypeFromPath(objectData.modelPath);
                if (currentObjectType === objectType) {
                    this.configureMesh(objectData.mesh, objectData, objectData.position);
                }
            }
        });
    }

    private setupDragPlane() {
        this.dragPlane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 0)
        );
    }

    public setOffsets(offsetX: number, offsetY: number, offsetZ: number): void {
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.offsetZ = offsetZ;

        this.updateAllObjectsWithOffset();
    }

    private updateAllObjectsWithOffset(): void {
        this.objects.forEach((objectData) => {
            if (objectData.mesh) {
                this.configureMesh(objectData.mesh, objectData, objectData.position);
            }
        });
    }

    public setCallbacks(
        onObjectSelect?: (objectId: string | null) => void,
        onObjectUpdate?: (objectId: string, data: Object3DData) => void
    ) {
        this.onObjectSelect = onObjectSelect;
        this.onObjectUpdate = onObjectUpdate;
    }

    public async addObject(
        id: string,
        modelData: any,
        position: THREE.Vector3 = new THREE.Vector3(0, 0, 0),
        initialRotation: THREE.Euler = new THREE.Euler(0, 0, 0),
        initialScale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
    ): Promise<void> {
        console.log('Object3DManager.addObject called:', { id, modelData, position, initialRotation, initialScale });

        try {
            const objectData: Object3DData = {
                id,
                name: modelData.name,
                modelPath: modelData.modelPath,
                imagePath: modelData.imagePath,
                description: modelData.description,
                author: modelData.author,
                license: modelData.license,
                position: position.clone(),
                rotation: initialRotation.clone(),
                scale: initialScale.clone(),
                isLoading: true
            };

            this.objects.set(id, objectData);
            console.log('Object data stored, loading model...');

            const gltf = await this.loadModel(modelData.modelPath);
            const mesh = gltf.scene;
            console.log('Model loaded successfully');

            this.configureMesh(mesh, objectData, position);

            this.scene.add(mesh);
            console.log('Mesh added to scene');

            objectData.mesh = mesh;
            objectData.isLoading = false;

            mesh.name = `object-${id}`;
            mesh.userData = { objectId: id, type: 'placed-object' };

            console.log(`Successfully loaded 3D object: ${modelData.name} with local space offsets`);

        } catch (error) {
            console.error(`Failed to load 3D object ${modelData.name}:`, error);
            const objectData = this.objects.get(id);
            if (objectData) {
                objectData.isLoading = false;
                objectData.loadError = error instanceof Error ? error.message : 'Unknown error';
            }
            throw error;
        }
    }


    private async loadModel(modelPath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.loader.load(
                modelPath,
                (gltf) => resolve(gltf),
                (progress) => {
                    console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
                },
                (error) => reject(error)
            );
        });
    }

    private getObjectTypeFromPath(modelPath: string): string {
        const path = modelPath.toLowerCase();
        if (path.includes('chair')) return 'chair';
        if (path.includes('bed')) return 'bed';
        if (path.includes('sofa')) return 'sofa';
        if (path.includes('dressingtable')) return 'dressingtable';
        if (path.includes('diningtable')) return 'diningtable';
        if (path.includes('table')) return 'table';
        if (path.includes('lamp')) return 'lamp';
        if (path.includes('toilet')) return 'toilet';
        if (path.includes('basin')) return 'basin';
        if (path.includes('tap')) return 'tap';
        if (path.includes('fridge')) return 'fridge';
        if (path.includes('stove')) return 'stove';
        if (path.includes('wash')) return 'wash';
        if (path.includes('kitchen')) return 'kitchen';
        if (path.includes('tv')) return 'tv';
        if (path.includes('tub')) return 'tub';
        if (path.includes('elevator')) return 'elevator';
        if (path.includes('cupboard')) return 'cupboard';
        if (path.includes('stairs')) return 'stairs';
        if (path.includes('car')) return 'car';
        if (path.includes('bike')) return 'bike';
        return 'default';
    }

    private getTargetSizeForObjectType(objectType: string, modelPath: string): number {
        const variantIndex = getVariantIndexFromPath(modelPath, objectType);
        return getSizeMultiplier(objectType, variantIndex);
    }

    private getObjectTypeCount(objectType: string): number {
        let count = 0;
        Array.from(this.objects.values()).forEach(obj => {
            if (obj.modelPath && obj.modelPath.toLowerCase().includes(objectType.toLowerCase())) {
                count++;
            }
        });
        return count;
    }

    private configureMesh(mesh: THREE.Object3D, objectData: Object3DData, basePosition: THREE.Vector3) {

        const objectType = this.getObjectTypeFromPath(objectData.modelPath);
        const variantIndex = getVariantIndexFromPath(objectData.modelPath, objectType);
        const targetSize = getSizeMultiplier(objectType, variantIndex);
        const luminescence = getLuminescence(objectType, variantIndex);

        const typeOffset = this.getObjectOffset(objectType);

        const rotationOffset = getRotationOffset(objectType, variantIndex);

        mesh.position.copy(basePosition);
        mesh.scale.copy(objectData.scale);

        mesh.rotation.set(
            objectData.rotation.x,
            objectData.rotation.y + (rotationOffset * Math.PI) / 180,
            objectData.rotation.z
        );

        objectData.rotation.y += (rotationOffset * Math.PI) / 180;

        mesh.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(mesh);
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);

        if (maxSize === 0) {
            console.warn('Invalid object size, skipping scaling');
            return;
        }

        const scaleFactor = targetSize / maxSize;
        mesh.scale.multiplyScalar(scaleFactor);

        mesh.updateMatrixWorld(true);

        if (typeOffset.x !== 0 || typeOffset.z !== 0) {
            const compensatedOffsetX = typeOffset.x / scaleFactor;
            const compensatedOffsetZ = typeOffset.z / scaleFactor;
            const localOffset = new THREE.Vector3(compensatedOffsetX, 0, compensatedOffsetZ);

            localOffset.applyEuler(mesh.rotation);

            mesh.position.add(localOffset);
        }

        mesh.position.sub(new THREE.Vector3(0, 50, 0));

        mesh.updateMatrixWorld(true);

        this.alignObjectToFloor(mesh, mesh.position, typeOffset.y);

        console.log('Object configured with local offset:', {
            objectType: objectType,
            variantIndex: variantIndex,
            rotationOffset: rotationOffset,
            luminescence: luminescence,
            localOffsets: { x: this.offsetX, y: this.offsetY, z: this.offsetZ },
            typeOffsets: typeOffset,
            scaleFactor: scaleFactor,
            targetSize: targetSize,
            finalPosition: mesh.position,
            finalRotation: {
                x: mesh.rotation.x * (180 / Math.PI),
                y: mesh.rotation.y * (180 / Math.PI),
                z: mesh.rotation.z * (180 / Math.PI)
            }
        });

        mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                if (luminescence !== 1) {
                                    mat.emissive.setHex(0xffffff);
                                    mat.emissiveIntensity = (luminescence - 1) * 0.3;
                                }
                                mat.needsUpdate = true;
                            }
                        });
                    } else if (child.material instanceof THREE.MeshStandardMaterial) {
                        if (luminescence !== 1) {
                            child.material.emissive.setHex(0xffffff);
                            child.material.emissiveIntensity = (luminescence - 1) * 0.3;
                        }
                        child.material.needsUpdate = true;
                    }
                }
            }
        });
    }


    public removeObject(id: string): void {
        const objectData = this.objects.get(id);
        if (objectData && objectData.mesh) {
            this.scene.remove(objectData.mesh);

            objectData.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(mat => mat.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                }
            });
        }

        this.objects.delete(id);

        if (this.selectedObjectId === id) {
            this.selectedObjectId = null;
            this.onObjectSelect?.(null);
        }
    }

    public selectObject(id: string | null): void {
        if (this.selectedObjectId) {
            const prevObject = this.objects.get(this.selectedObjectId);
            if (prevObject) {
                prevObject.isSelected = false;
                this.updateObjectHighlight(prevObject, false);
            }
        }

        this.selectedObjectId = id;
        if (id) {
            const objectData = this.objects.get(id);
            if (objectData) {
                objectData.isSelected = true;
                this.updateObjectHighlight(objectData, true);
            }
        }

        this.onObjectSelect?.(id);
    }

    private updateObjectHighlight(objectData: Object3DData, highlight: boolean): void {
        if (!objectData.mesh) return;

        const objectType = this.getObjectTypeFromPath(objectData.modelPath);
        const variantIndex = getVariantIndexFromPath(objectData.modelPath, objectType);
        const baseLuminescence = getLuminescence(objectType, variantIndex);

        objectData.mesh.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];

                materials.forEach(material => {
                    if (material instanceof THREE.MeshStandardMaterial) {
                        if (highlight) {
                            material.emissive.setHex(0x1976d2);
                            material.emissiveIntensity = 0.1 + (baseLuminescence !== 1 ? (baseLuminescence - 1) * 0.3 : 0);
                        } else {
                            if (baseLuminescence !== 1) {
                                material.emissive.setHex(0xffffff);
                                material.emissiveIntensity = (baseLuminescence - 1) * 0.3;
                            } else {
                                material.emissive.setHex(0x000000);
                                material.emissiveIntensity = 0;
                            }
                        }
                        material.needsUpdate = true;
                    }
                });
            }
        });
    }

    public updateObjectPosition(id: string, position: THREE.Vector3): void {
        const objectData = this.objects.get(id);
        if (objectData && objectData.mesh) {
            const objectType = this.getObjectTypeFromPath(objectData.modelPath);
            const typeOffset = this.getObjectOffset(objectType);

            const adjustedPosition = position.clone();
            adjustedPosition.x += typeOffset.x;
            adjustedPosition.z += typeOffset.z;

            objectData.position.copy(adjustedPosition);

            this.alignObjectToFloor(objectData.mesh, adjustedPosition, typeOffset.y);

            this.onObjectUpdate?.(id, objectData);
        }
    }

    private alignObjectToFloor(mesh: THREE.Object3D, position: THREE.Vector3, yOffset: number = 0): void {
        const currentRotation = mesh.rotation.clone();

        mesh.position.x = position.x;
        mesh.position.z = position.z;

        mesh.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(mesh);

        if (box.isEmpty()) {
            console.warn('Empty bounding box for object, using position y directly');
            mesh.position.y = position.y + yOffset;
            return;
        }

        const bottomY = box.min.y;

        mesh.position.y = position.y - bottomY + 0.01 + yOffset;

        mesh.rotation.copy(currentRotation);
        mesh.updateMatrixWorld(true);

        console.log('Object aligned to floor:', {
            targetY: position.y,
            bottomY: bottomY,
            yOffset: yOffset,
            finalY: mesh.position.y,
            rotation: { x: mesh.rotation.x, y: mesh.rotation.y, z: mesh.rotation.z },
            boundingBox: { min: box.min, max: box.max }
        });
    }


    public updateObjectRotation(id: string, rotation: THREE.Euler): void {
        const objectData = this.objects.get(id);
        if (objectData && objectData.mesh) {
            objectData.rotation.copy(rotation);

            const objectType = this.getObjectTypeFromPath(objectData.modelPath);
            const variantIndex = getVariantIndexFromPath(objectData.modelPath, objectType);
            const baseRotationOffset = getRotationOffset(objectType, variantIndex);
            const typeOffset = this.getObjectOffset(objectType);

            const totalRotationY = rotation.y + (baseRotationOffset * Math.PI) / 180;
            objectData.mesh.rotation.set(rotation.x, totalRotationY, rotation.z);

            console.log('Object rotation updated:', {
                objectId: id,
                userRotationDegrees: rotation.y * (180 / Math.PI),
                baseOffsetDegrees: baseRotationOffset,
                totalRotationDegrees: totalRotationY * (180 / Math.PI)
            });

            objectData.mesh.updateMatrixWorld(true);

            this.alignObjectToFloor(objectData.mesh, objectData.position, typeOffset.y);

            this.onObjectUpdate?.(id, objectData);
        }
    }

    public updateObjectScale(id: string, scale: THREE.Vector3): void {
        const objectData = this.objects.get(id);
        if (objectData && objectData.mesh) {
            objectData.scale.copy(scale);
            objectData.mesh.scale.copy(scale);

            objectData.mesh.updateMatrixWorld(true);

            const objectType = this.getObjectTypeFromPath(objectData.modelPath);
            const typeOffset = this.getObjectOffset(objectType);

            this.alignObjectToFloor(objectData.mesh, objectData.position, typeOffset.y);

            this.onObjectUpdate?.(id, objectData);
        }
    }

    public handleMouseDown(event: MouseEvent, mouse: THREE.Vector2, allowDragging: boolean = true): boolean {
        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(
            Array.from(this.objects.values())
                .filter(obj => obj.mesh)
                .map(obj => obj.mesh!)
        );

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            let objectId: string | null = null;

            let current = intersectedObject;
            while (current && !current.userData?.objectId) {
                current = current.parent as THREE.Object3D;
            }

            if (current && current.userData?.objectId) {
                objectId = current.userData.objectId;
            }

            if (objectId) {
                this.selectObject(objectId);

                if (allowDragging) {
                    this.isDragging = true;
                    this.dragStart.copy(mouse);

                    const intersection = intersects[0];
                    this.dragOffset.copy(intersection.point).sub(current.position);
                }

                return true;
            }
        } else {
            if (allowDragging) {
                this.selectObject(null);
            }
        }

        return false;
    }

    public handleMouseMove(event: MouseEvent, mouse: THREE.Vector2): boolean {
        if (this.isDragging && this.selectedObjectId) {
            this.raycaster.setFromCamera(mouse, this.camera);

            const intersection = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
                intersection.sub(this.dragOffset);
                this.updateObjectPosition(this.selectedObjectId, intersection);
            }

            return true;
        }

        return false;
    }

    public handleMouseUp(event: MouseEvent): boolean {
        if (this.isDragging) {
            this.isDragging = false;
            return true;
        }

        return false;
    }

    public getObjects(): Object3DData[] {
        return Array.from(this.objects.values());
    }

    public getObject(id: string): Object3DData | undefined {
        return this.objects.get(id);
    }

    public getSelectedObject(): Object3DData | null {
        return this.selectedObjectId ? this.objects.get(this.selectedObjectId) || null : null;
    }

    public dispose(): void {
        Array.from(this.objects.values()).forEach(objectData => {
            if (objectData.mesh) {
                this.scene.remove(objectData.mesh);

                objectData.mesh.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        if (child.geometry) {
                            child.geometry.dispose();
                        }
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => mat.dispose());
                            } else {
                                child.material.dispose();
                            }
                        }
                    }
                });

                objectData.mesh = undefined;
            }
        });

        this.objects.clear();

        this.selectedObjectId = null;

        this.scene.updateMatrixWorld(true);
    }
    public isValidPlacementPosition(position: THREE.Vector3): boolean {
        const maxDistance = 300;
        if (position.length() > maxDistance) {
            console.log('Position rejected: too far from origin');
            return false;
        }

        if (position.y < -5) {
            console.log('Position rejected: below ground level');
            return false;
        }

        const floorPlanData = this.getFloorPlanData();

        if (!floorPlanData || !floorPlanData.rooms) {
            console.log('No floor plan data available, using basic distance check');
            return position.length() <= maxDistance;
        }

        const point = { x: position.x, z: position.z };
        let isInsideAnyRoom = false;

        for (const room of floorPlanData.rooms) {
            if (room.room_type === "Wall") {
                if (room.floor_polygon.length === 2) {
                    const wallStart = room.floor_polygon[0];
                    const wallEnd = room.floor_polygon[1];
                    const distanceToWall = this.distanceToLineSegment(point, wallStart, wallEnd);

                    if (distanceToWall < 5) {
                        console.log('Position rejected: too close to wall');
                        return false;
                    }
                }
                continue;
            }

            if (room.floor_polygon.length >= 3) {
                const isInside = this.isPointInPolygon(point, room.floor_polygon);
                if (isInside) {
                    isInsideAnyRoom = true;
                    console.log(`Position is inside room: ${room.room_type || room.id}`);
                    break;
                }
            }
        }

        if (!isInsideAnyRoom) {
            console.log('Position rejected: not inside any room');
            return false;
        }

        console.log('Position is valid for placement');
        return true;
    }

    private isPointInPolygon(point: { x: number, z: number }, polygon: Array<{ x: number, z: number }>): boolean {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].z;
            const xj = polygon[j].x;
            const yj = polygon[j].z;

            if (((yi > point.z) !== (yj > point.z)) &&
                (point.x < (xj - xi) * (point.z - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    private distanceToLineSegment(
        point: { x: number, z: number },
        lineStart: { x: number, z: number },
        lineEnd: { x: number, z: number }
    ): number {
        const A = point.x - lineStart.x;
        const B = point.z - lineStart.z;
        const C = lineEnd.x - lineStart.x;
        const D = lineEnd.z - lineStart.z;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) {
            return Math.sqrt(A * A + B * B);
        }

        let param = dot / lenSq;

        let xx: number, yy: number;

        if (param < 0) {
            xx = lineStart.x;
            yy = lineStart.z;
        } else if (param > 1) {
            xx = lineEnd.x;
            yy = lineEnd.z;
        } else {
            xx = lineStart.x + param * C;
            yy = lineStart.z + param * D;
        }

        const dx = point.x - xx;
        const dy = point.z - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getFloorPlanData(): any {
        return this.floorPlanData;
    }

    public updateFloorPlanData(floorPlanData: any): void {
        this.floorPlanData = floorPlanData;
    }

    public getPlacementPosition(mouse: THREE.Vector2): THREE.Vector3 | null {
        this.raycaster.setFromCamera(mouse, this.camera);

        const intersection = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
            console.log('Raycaster intersection found:', intersection);
            if (this.isValidPlacementPosition(intersection)) {
                console.log('Position is valid for placement');
                return intersection;
            } else {
                console.log('Position is invalid for placement');
            }
        } else {
            console.log('No raycaster intersection with plane');
        }

        return null;
    }

    public duplicateObject(sourceId: string): string | null {
        const sourceObject = this.objects.get(sourceId);
        if (!sourceObject) return null;

        const newId = `${sourceObject.id}_copy_${Date.now()}`;
        const offset = new THREE.Vector3(10, 0, 10);
        const newPosition = sourceObject.position.clone().add(offset);

        this.addObject(newId, {
            name: sourceObject.name,
            modelPath: sourceObject.modelPath,
            imagePath: sourceObject.imagePath,
            description: sourceObject.description,
            author: sourceObject.author,
            license: sourceObject.license
        }, newPosition);

        return newId;
    }

    public getObjectsByCategory(category: string): Object3DData[] {
        return Array.from(this.objects.values()).filter(obj =>
            obj.modelPath.includes(category)
        );
    }

    public exportObjectData(): any[] {
        return Array.from(this.objects.values()).map(obj => ({
            id: obj.id,
            name: obj.name,
            modelPath: obj.modelPath,
            imagePath: obj.imagePath,
            description: obj.description,
            author: obj.author,
            license: obj.license,
            position: {
                x: obj.position.x,
                y: obj.position.y,
                z: obj.position.z
            },
            rotation: {
                x: obj.rotation.x * (180 / Math.PI),
                y: obj.rotation.y * (180 / Math.PI),
                z: obj.rotation.z * (180 / Math.PI)
            },
            scale: {
                x: obj.scale.x,
                y: obj.scale.y,
                z: obj.scale.z
            }
        }));
    }

    public async importObjectData(objectsData: any[]): Promise<void> {
        this.dispose();

        for (const objData of objectsData) {
            const position = new THREE.Vector3(
                objData.position.x,
                objData.position.y,
                objData.position.z
            );

            const rotation = objData.rotation ? new THREE.Euler(
                objData.rotation.x * (Math.PI / 180),
                -objData.rotation.y * (Math.PI / 180),
                objData.rotation.z * (Math.PI / 180)
            ) : new THREE.Euler(0, 0, 0);

            const scale = objData.scale ? new THREE.Vector3(
                objData.scale.x,
                objData.scale.y,
                objData.scale.z
            ) : new THREE.Vector3(1, 1, 1);

            await this.addObject(objData.id, {
                name: objData.name,
                modelPath: objData.modelPath,
                imagePath: objData.imagePath,
                description: objData.description,
                author: objData.author,
                license: objData.license
            }, position, rotation, scale);
        }
    }
}
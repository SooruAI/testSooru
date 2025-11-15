import * as t from "three";
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { PlayerAnimation } from "./PlayerAnimation";
import { PlayerControl } from "./PlayerControl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PlayerPositionUtils } from "./PlayerPositionUtils";

interface FloorPlanData {
    rooms: Array<{
        id: string;
        room_type: string;
        area?: number;
        height?: number;
        width?: number;
        floor_polygon: Array<{ x: number; z: number }>;
    }>;
}

export class Player {
    playerAnimation: PlayerAnimation | undefined;
    playerControl: PlayerControl | undefined;
    model: t.Object3D | undefined;
    private floorPlanData: FloorPlanData | null = null;
    private isPositioned: boolean = false;

    constructor(scene: t.Scene, floorPlanData?: FloorPlanData) {
        this.floorPlanData = floorPlanData || null;
        
        const loader = new FBXLoader();
        loader.load("/character.fbx",
            (model: t.Object3D) => {
                this.onLoad(model);
                model.visible = false;
                scene.add(model);
                this.model = model;
            }, () => { }, (error: any) => console.log(error));
    }

    onLoad(model: t.Object3D): void {
        this.playerControl = new PlayerControl(model);
        model.scale.set(0.07, 0.07, 0.07);
        model.traverse(c => c.castShadow = true);
        const mixer = new t.AnimationMixer(model);
        this.playerAnimation = new PlayerAnimation(mixer);
        
        // Set initial position based on floor plan data
        this.setOptimalInitialPosition(model);
    }

    /**
     * Set the optimal initial position based on floor plan data
     */
    private setOptimalInitialPosition(model: t.Object3D): void {
        if (this.floorPlanData && !this.isPositioned) {
            try {
                const positionInfo = PlayerPositionUtils.findSafeSpawnPosition(this.floorPlanData);
                
                // Set player position
                model.position.copy(positionInfo.position);
                
                // Set player orientation to face the building
                if (this.playerControl) {
                    this.playerControl.bodyOrientation = positionInfo.orientation;
                    model.rotation.y = this.playerControl.bodyOrientation;
                }
                
                console.log('Player positioned dynamically:', {
                    position: positionInfo.position,
                    orientation: positionInfo.orientation,
                    bounds: positionInfo.floorPlanBounds
                });
                
                this.isPositioned = true;
            } catch (error) {
                console.warn('Failed to calculate optimal player position, using fallback:', error);
                this.setFallbackPosition(model);
            }
        } else {
            this.setFallbackPosition(model);
        }
    }

    /**
     * Set fallback position when floor plan data is not available
     */
    private setFallbackPosition(model: t.Object3D): void {
        model.position.set(0, 0, 100); // Default position in front of origin
        
        if (this.playerControl) {
            this.playerControl.bodyOrientation = Math.PI; // Face north/toward origin
            model.rotation.y = this.playerControl.bodyOrientation;
        }
        
        console.log('Player positioned using fallback position');
        this.isPositioned = true;
    }

    /**
     * Update floor plan data and recalculate position if needed
     */
    setFloorPlanData(floorPlanData: FloorPlanData): void {
        this.floorPlanData = floorPlanData;
        
        // If model is loaded but not positioned yet, position it now
        if (this.model && !this.isPositioned) {
            this.setOptimalInitialPosition(this.model);
        }
    }

    /**
     * Manually set player position (useful for repositioning)
     */
    setPosition(position: t.Vector3, orientation?: number): void {
        if (this.model) {
            this.model.position.copy(position);
            
            if (orientation !== undefined && this.playerControl) {
                this.playerControl.bodyOrientation = orientation;
                this.model.rotation.y = orientation;
            }
        }
    }

    /**
     * Get current player position info
     */
    getPositionInfo(): { position: t.Vector3 | null, orientation: number | null } {
        return {
            position: this.model ? this.model.position.clone() : null,
            orientation: this.playerControl ? this.playerControl.bodyOrientation : null
        };
    }

    // Method to set camera references for camera-based movement
    setCameraReferences(camera: t.PerspectiveCamera, orbitControls: OrbitControls) {
        if (this.playerControl) {
            this.playerControl.setCameraReferences(camera, orbitControls);
        }
    }

    update(delta: number) {
        if (!this.model || !this.model.visible) return;
        this.playerControl?.update(delta);
        if (this.playerControl) this.playerAnimation?.update(delta, this.playerControl.speed);
    }
}
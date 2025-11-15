import { MathUtils } from "three";
import * as t from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface Controls {
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
};

export class PlayerControl {
    maxSpeed = 50;
    walkSpeed = 25;
    maxReverseSpeed = -50;
    frontAcceleration = 100;
    backAcceleration = 100;
    frontDecceleration = 100;
    angularSpeed = 2.5;
    speed = 0;
    bodyOrientation = 0;
    root: t.Object3D;
    controls: Controls;
    camera: t.PerspectiveCamera | null = null;
    orbitControls: OrbitControls | null = null;

    constructor(root: t.Object3D) {
        this.root = root;

        const controls = {
            moveForward: false,
            moveBackward: false,
            moveLeft: false,
            moveRight: false
        };

        function onKeyDown(event: KeyboardEvent) {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': controls.moveForward = true; break;

                // case 'ArrowDown':
                // case 'KeyS': controls.moveBackward = true; break;

                case 'ArrowLeft':
                case 'KeyA': controls.moveLeft = true; break;

                case 'ArrowRight':
                case 'KeyD': controls.moveRight = true; break;
            }
        }

        function onKeyUp(event: KeyboardEvent) {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': controls.moveForward = false; break;

                // case 'ArrowDown':
                // case 'KeyS': controls.moveBackward = false; break;

                case 'ArrowLeft':
                case 'KeyA': controls.moveLeft = false; break;

                case 'ArrowRight':
                case 'KeyD': controls.moveRight = false; break;
            }
        }
        this.controls = controls;
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
    }

    // Method to set camera and orbit controls references
    setCameraReferences(camera: t.PerspectiveCamera, orbitControls: OrbitControls) {
        this.camera = camera;
        this.orbitControls = orbitControls;
    }

    // Calculate movement direction based on camera's look direction
    getCameraDirection(): { forward: t.Vector3, right: t.Vector3 } {
        if (!this.camera || !this.orbitControls) {
            // Fallback to player's body orientation if camera not available
            return {
                forward: new t.Vector3(Math.sin(this.bodyOrientation), 0, Math.cos(this.bodyOrientation)),
                right: new t.Vector3(Math.cos(this.bodyOrientation), 0, -Math.sin(this.bodyOrientation))
            };
        }

        // Get the direction from camera position to target (what the camera is looking at)
        const cameraPosition = this.camera.position.clone();
        const target = this.orbitControls.target.clone();
        
        // Calculate forward direction (from camera to target, projected onto Y=0 plane)
        const forward = new t.Vector3().subVectors(target, cameraPosition);
        forward.y = 0; // Remove vertical component for ground movement
        forward.normalize();

        // Calculate right direction (perpendicular to forward)
        const right = new t.Vector3().crossVectors(forward, new t.Vector3(0, 1, 0));
        right.normalize();

        return { forward, right };
    }

    update(delta: number) {
        this.updateMovementModel(delta);
    }

    setBodyOrientation(orientation: number) {
        this.bodyOrientation = orientation;
        this.root.rotation.y = this.bodyOrientation;
    }
    
    getBodyOrientation(): number {
        return this.bodyOrientation;
    }

    updateMovementModel(delta: number) {
        function exponentialEaseOut(k: number) { 
            return k === 1 ? 1 : -Math.pow(2, -10 * k) + 1; 
        }

        const controls = this.controls;
        this.maxSpeed = this.walkSpeed;
        this.maxReverseSpeed = - this.maxSpeed;

        // Handle rotation with A/D keys
        if (controls.moveLeft) {
            this.rotatePlayerAndCamera(delta * this.angularSpeed);
        }

        if (controls.moveRight) {
            this.rotatePlayerAndCamera(-delta * this.angularSpeed);
        }

        // Handle forward/backward movement with W/S keys
        let isMoving = controls.moveForward || controls.moveBackward;

        if (controls.moveForward) {
            this.speed = MathUtils.clamp(
                this.speed + delta * this.frontAcceleration,
                this.maxReverseSpeed, 
                this.maxSpeed
            );
        } else if (controls.moveBackward) {
            this.speed = MathUtils.clamp(
                this.speed - delta * this.frontAcceleration,
                this.maxReverseSpeed, 
                this.maxSpeed
            );
        } else {
            // Decelerate when not moving
            if (this.speed > 0) {
                const k = exponentialEaseOut(this.speed / this.maxSpeed);
                this.speed = 0;
            } else if (this.speed < 0) {
                const k = exponentialEaseOut(Math.abs(this.speed) / this.maxSpeed);
                this.speed = 0;
            }
        }

        // Apply forward/backward movement based on camera direction
        const forwardDelta = this.speed * delta;
        if (Math.abs(forwardDelta) > 0.001) {
            const { forward } = this.getCameraDirection();
            this.root.position.x += forward.x * forwardDelta;
            this.root.position.z += forward.z * forwardDelta;

            // Update body orientation to face movement direction
            this.bodyOrientation = Math.atan2(forward.x, forward.z);
            this.root.rotation.y = this.bodyOrientation;
        }
    }

    // Method to rotate both player and camera
    rotatePlayerAndCamera(angleRadians: number) {
        if (!this.camera || !this.orbitControls) {
            // Fallback to just rotating the player if camera not available
            this.bodyOrientation += angleRadians;
            this.root.rotation.y = this.bodyOrientation;
            return;
        }

        // Get current camera position relative to target
        const target = this.orbitControls.target.clone();
        const cameraPosition = this.camera.position.clone();
        
        // Calculate current offset from target
        const offset = new t.Vector3().subVectors(cameraPosition, target);
        
        // Rotate the offset around the Y axis
        const rotationMatrix = new t.Matrix4().makeRotationY(angleRadians);
        offset.applyMatrix4(rotationMatrix);
        
        // Set new camera position
        this.camera.position.copy(target.clone().add(offset));
        
        // Update orbit controls
        this.orbitControls.update();
        
        // Update player body orientation
        this.bodyOrientation += angleRadians;
        this.root.rotation.y = this.bodyOrientation;
    }
}
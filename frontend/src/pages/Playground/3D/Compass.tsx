import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Compass.css';

interface CompassProps {
    camera: THREE.PerspectiveCamera | null;
    mode: string;
    onDirectionClick: (axis: 'x' | 'y' | 'z') => void;
}

const Compass: React.FC<CompassProps> = ({ camera, mode, onDirectionClick }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const sceneRef = useRef<THREE.Scene>(null);
    const rendererRef = useRef<THREE.WebGLRenderer>(null);
    const compassCameraRef = useRef<THREE.PerspectiveCamera>(null);
    const axisGroupRef = useRef<THREE.Group>(null);
    const animationIdRef = useRef<number>(0);

    useEffect(() => {
        if (!canvasRef.current || mode !== 'orbit') return;

        const scene = new THREE.Scene();
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvasRef.current, 
            alpha: true,
            antialias: true 
        });
        renderer.setSize(120, 120);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        const compassCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
        compassCamera.position.z = 5;

        const axisGroup = new THREE.Group();

        const createTextTexture = (text: string, color: string) => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d')!;
            
            // Clear canvas with transparent background
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Set font and text properties
            ctx.font = 'bold 48px Arial, sans-serif';
            ctx.fillStyle = color;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw text with outline for better visibility
            ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
            ctx.fillText(text, canvas.width / 2, canvas.height / 2);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return texture;
        };

        const createAxis = (dir: THREE.Vector3, color: string, label: string) => {
            // Create line geometry
            const material = new THREE.LineBasicMaterial({ 
                color, 
                linewidth: 3,
                transparent: true,
                opacity: 0.9
            });
            const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(1.5)];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, material);

            // Create sprite for label
            const spriteMaterial = new THREE.SpriteMaterial({
                map: createTextTexture(label, color),
                transparent: true,
                alphaTest: 0.1
            });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(0.8, 0.8, 1);
            sprite.position.copy(dir.clone().multiplyScalar(2.0));

            const axisContainer = new THREE.Group();
            axisContainer.add(line);
            axisContainer.add(sprite);

            axisGroup.add(axisContainer);
        };

        // Create axes with better labels and colors
        createAxis(new THREE.Vector3(1, 0, 0), '#ff4444', 'W');  // East - Red
        createAxis(new THREE.Vector3(-1, 0, 0), '#ff4444', 'E'); // West - Red
        createAxis(new THREE.Vector3(0, 1, 0), '#44ff44', 'T'); // Up - Green
        createAxis(new THREE.Vector3(0, -1, 0), '#44ff44', 'D'); // Down - Green
        createAxis(new THREE.Vector3(0, 0, 1), '#4444ff', 'N'); // North - Blue
        createAxis(new THREE.Vector3(0, 0, -1), '#4444ff', 'S'); // South - Blue

        scene.add(axisGroup);

        sceneRef.current = scene;
        rendererRef.current = renderer;
        compassCameraRef.current = compassCamera;
        axisGroupRef.current = axisGroup;

        const animate = () => {
            if (camera && axisGroupRef.current && mode === 'orbit') {
                // Sync compass rotation with main camera
                const inverseQuat = camera.quaternion.clone().invert();
                axisGroupRef.current.setRotationFromQuaternion(inverseQuat);
            }
            renderer.render(scene, compassCamera);
            animationIdRef.current = requestAnimationFrame(animate);
        };

        // Start animation immediately
        animate();

        // Cleanup function
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            renderer.dispose();
            scene.clear();
        };
    }, [camera, mode]);

    // Stop animation when not in orbit mode
    useEffect(() => {
        if (mode !== 'orbit' && animationIdRef.current) {
            cancelAnimationFrame(animationIdRef.current);
        }
    }, [mode]);

    if (mode !== 'orbit') return null;

    return (
        <div style={{ 
            position: 'fixed', 
            bottom: -10, 
            right: 10, 
            width: 130, 
            height: 130, 
            zIndex: 1000,
            pointerEvents: 'none' 
        }}>
            <canvas
                ref={canvasRef}
                width={120}
                height={120}
                style={{
                    cursor: 'pointer',
                    borderRadius: '50%',
                    border: '4px solid #333',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    position: 'absolute',
                    bottom: 30,
                    pointerEvents: 'auto'
                }}
            />
        </div>
    );
};

export default Compass;
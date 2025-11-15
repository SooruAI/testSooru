import React from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

// Types for export options
interface ExportOptions {
    format: string;
    scene: THREE.Scene;
    camera?: THREE.Camera;
    fileName?: string;
    quality?: 'low' | 'medium' | 'high';
    includeTextures?: boolean;
    includeObjects?: boolean;
    includeFloorPlan?: boolean;
}

interface ExportProgress {
    stage: string;
    progress: number;
    message: string;
}

export class ModelExporter {
    private gltfExporter: GLTFExporter;
    private objExporter: OBJExporter;
    private onProgress?: (progress: ExportProgress) => void;

    constructor(onProgress?: (progress: ExportProgress) => void) {
        this.gltfExporter = new GLTFExporter();
        this.objExporter = new OBJExporter();
        this.onProgress = onProgress;
    }

    private reportProgress(stage: string, progress: number, message: string) {
        if (this.onProgress) {
            this.onProgress({ stage, progress, message });
        }
    }

    private prepareSceneForExport(scene: THREE.Scene, options: ExportOptions): THREE.Scene {
        this.reportProgress('preparation', 10, 'Preparing scene for export...');
        
        // Clone the scene to avoid modifying the original
        const exportScene = scene.clone();
        
        // Remove UI elements, helpers, and non-exportable objects
        const objectsToRemove: THREE.Object3D[] = [];
        
        exportScene.traverse((object) => {
            // Remove cameras (except if specifically included)
            if (object instanceof THREE.Camera && !options.includeObjects) {
                objectsToRemove.push(object);
            }
            
            // Remove lights that might cause issues
            if (object instanceof THREE.DirectionalLight || object instanceof THREE.AmbientLight) {
                // Keep lighting but ensure it's exportable
                if (object.shadow) {
                    object.shadow.dispose();
                    object.shadow = null as any;
                }
            }
            
            // Remove helpers and debug objects
            if (object.name.includes('helper') || object.name.includes('debug')) {
                objectsToRemove.push(object);
            }
            
            // Ensure materials are exportable
            if (object instanceof THREE.Mesh && object.material) {
                this.prepareMaterialForExport(object.material);
            }
        });
        
        // Remove flagged objects
        objectsToRemove.forEach(obj => {
            if (obj.parent) {
                obj.parent.remove(obj);
            }
        });
        
        this.reportProgress('preparation', 25, 'Scene prepared successfully');
        return exportScene;
    }

    private prepareMaterialForExport(material: THREE.Material | THREE.Material[]) {
        const materials = Array.isArray(material) ? material : [material];
        
        materials.forEach(mat => {
            if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
                // Ensure textures are properly set up for export
                if (mat.map && !mat.map.image) {
                    // If texture is not loaded, remove it
                    mat.map = null;
                }
                
                // Ensure material has proper naming
                if (!mat.name) {
                    mat.name = `Material_${Math.random().toString(36).substr(2, 9)}`;
                }
            }
        });
    }

    private downloadFile(data: string | ArrayBuffer, filename: string, mimeType: string) {
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    }

    async exportGLB(options: ExportOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.reportProgress('export', 30, 'Starting GLB export...');
                
                const exportScene = this.prepareSceneForExport(options.scene, options);
                const fileName = options.fileName || 'floor-plan-3d.glb';
                
                const gltfOptions = {
                    binary: true,
                    includeCustomExtensions: false,
                    truncateDrawRange: true,
                    embedImages: options.includeTextures !== false,
                    maxTextureSize: options.quality === 'high' ? 2048 : options.quality === 'medium' ? 1024 : 512,
                    onlyVisible: true
                };

                this.reportProgress('export', 50, 'Processing geometry...');

                this.gltfExporter.parse(
                    exportScene,
                    (result) => {
                        try {
                            this.reportProgress('export', 80, 'Finalizing GLB file...');
                            
                            if (result instanceof ArrayBuffer) {
                                this.downloadFile(result, fileName, 'model/gltf-binary');
                                this.reportProgress('export', 100, 'GLB export completed successfully!');
                                resolve();
                            } else {
                                throw new Error('Invalid GLB export result');
                            }
                        } catch (error) {
                            reject(error);
                        }
                    },
                    (error) => {
                        console.error('GLB Export Error:', error);
                        reject(new Error(`GLB export failed: ${error.message || error}`));
                    },
                    gltfOptions
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    async exportGLTF(options: ExportOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this.reportProgress('export', 30, 'Starting GLTF export...');
                
                const exportScene = this.prepareSceneForExport(options.scene, options);
                const fileName = options.fileName || 'floor-plan-3d.gltf';
                
                const gltfOptions = {
                    binary: false,
                    includeCustomExtensions: false,
                    truncateDrawRange: true,
                    embedImages: options.includeTextures !== false,
                    maxTextureSize: options.quality === 'high' ? 2048 : options.quality === 'medium' ? 1024 : 512,
                    onlyVisible: true
                };

                this.reportProgress('export', 50, 'Processing geometry...');

                this.gltfExporter.parse(
                    exportScene,
                    (result) => {
                        try {
                            this.reportProgress('export', 80, 'Finalizing GLTF file...');
                            
                            if (typeof result === 'object' && !(result instanceof ArrayBuffer) && 'scene' in result) {
                                const gltfString = JSON.stringify(result, null, 2);
                                this.downloadFile(gltfString, fileName, 'model/gltf+json');
                                this.reportProgress('export', 100, 'GLTF export completed successfully!');
                                resolve();
                            } else {
                                throw new Error('Invalid GLTF export result');
                            }
                        } catch (error) {
                            reject(error);
                        }
                    },
                    (error) => {
                        console.error('GLTF Export Error:', error);
                        reject(new Error(`GLTF export failed: ${error.message || error}`));
                    },
                    gltfOptions
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    async exportOBJ(options: ExportOptions): Promise<void> {
        try {
            this.reportProgress('export', 30, 'Starting OBJ export...');
            
            const exportScene = this.prepareSceneForExport(options.scene, options);
            const fileName = options.fileName || 'floor-plan-3d.obj';
            
            this.reportProgress('export', 50, 'Processing geometry...');
            
            // Extract only mesh objects for OBJ export
            const meshes: THREE.Mesh[] = [];
            exportScene.traverse((object) => {
                if (object instanceof THREE.Mesh && object.geometry) {
                    meshes.push(object);
                }
            });
            
            if (meshes.length === 0) {
                throw new Error('No exportable geometry found in scene');
            }
            
            this.reportProgress('export', 70, 'Generating OBJ data...');
            
            // Create a group containing all meshes
            const exportGroup = new THREE.Group();
            meshes.forEach(mesh => {
                const clonedMesh = mesh.clone();
                // Apply world matrix to bake transformations
                clonedMesh.applyMatrix4(mesh.matrixWorld);
                exportGroup.add(clonedMesh);
            });
            
            const objData = this.objExporter.parse(exportGroup);
            
            this.reportProgress('export', 90, 'Finalizing OBJ file...');
            
            this.downloadFile(objData, fileName, 'text/plain');
            
            // Also create a basic MTL file for materials
            const mtlFileName = fileName.replace('.obj', '.mtl');
            const mtlData = this.generateMTLFile(meshes);
            this.downloadFile(mtlData, mtlFileName, 'text/plain');
            
            this.reportProgress('export', 100, 'OBJ export completed successfully!');
        } catch (error) {
            console.error('OBJ Export Error:', error);
            throw new Error(`OBJ export failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private generateMTLFile(meshes: THREE.Mesh[]): string {
        const materials = new Map<string, THREE.Material>();
        
        meshes.forEach(mesh => {
            if (mesh.material) {
                const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                const materialName = material.name || `Material_${materials.size}`;
                materials.set(materialName, material);
            }
        });
        
        let mtlContent = '# Material file generated by Floor Plan 3D Exporter\n\n';
        
        materials.forEach((material, name) => {
            mtlContent += `newmtl ${name}\n`;
            
            if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshBasicMaterial) {
                const color = material.color;
                mtlContent += `Kd ${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)}\n`;
                mtlContent += `Ka ${(color.r * 0.3).toFixed(3)} ${(color.g * 0.3).toFixed(3)} ${(color.b * 0.3).toFixed(3)}\n`;
                mtlContent += `Ks 0.1 0.1 0.1\n`;
                mtlContent += `Ns 32\n`;
                
                if (material instanceof THREE.MeshStandardMaterial) {
                    mtlContent += `d ${1 - material.opacity}\n`;
                }
            }
            
            mtlContent += '\n';
        });
        
        return mtlContent;
    }

    async export(options: ExportOptions): Promise<void> {
        if (!options.scene) {
            throw new Error('Scene is required for export');
        }

        const format = options.format.toLowerCase();
        
        try {
            switch (format) {
                case 'glb':
                    await this.exportGLB(options);
                    break;
                case 'gltf':
                    await this.exportGLTF(options);
                    break;
                case 'obj':
                    await this.exportOBJ(options);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            throw error;
        }
    }

    // Utility method to estimate file size
    estimateFileSize(scene: THREE.Scene, format: string): number {
        let vertexCount = 0;
        let textureMemory = 0;
        
        scene.traverse((object) => {
            if (object instanceof THREE.Mesh && object.geometry) {
                const geometry = object.geometry;
                const positions = geometry.attributes.position;
                if (positions) {
                    vertexCount += positions.count;
                }
                
                if (object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach(mat => {
                        if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
                            textureMemory += (mat.map.image?.width || 512) * (mat.map.image?.height || 512) * 4;
                        }
                    });
                }
            }
        });
        
        // Rough estimation based on format
        switch (format.toLowerCase()) {
            case 'glb':
                return (vertexCount * 32) + textureMemory; // Compressed binary
            case 'gltf':
                return (vertexCount * 48) + textureMemory; // JSON format
            case 'obj':
                return vertexCount * 64; // Text format, no textures
            default:
                return vertexCount * 40;
        }
    }
}

// Export hook for use in React components
export const useModelExporter = () => {
    const [isExporting, setIsExporting] = React.useState(false);
    const [exportProgress, setExportProgress] = React.useState<ExportProgress | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    
    const exportModel = React.useCallback(async (options: ExportOptions) => {
        setIsExporting(true);
        setError(null);
        setExportProgress(null);
        
        try {
            const exporter = new ModelExporter((progress) => {
                setExportProgress(progress);
            });
            
            await exporter.export(options);
            
            // Success
            setExportProgress({
                stage: 'complete',
                progress: 100,
                message: `${options.format.toUpperCase()} export completed successfully!`
            });
            
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Export failed';
            setError(errorMessage);
            console.error('Export error:', err);
        } finally {
            setIsExporting(false);
        }
    }, []);
    
    return {
        exportModel,
        isExporting,
        exportProgress,
        error,
        clearError: () => setError(null)
    };
};
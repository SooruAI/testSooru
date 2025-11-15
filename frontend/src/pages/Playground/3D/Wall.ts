import * as t from "three";

export const height = 20;
const width = 1;
const indices = [0, 1, 2, 1, 3, 2];
const indicesReverse = [0, 2, 1, 1, 2, 3];

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
                    // Optimize texture settings for walls
                    texture.wrapS = t.RepeatWrapping;
                    texture.wrapT = t.RepeatWrapping;
                    
                    // Calculate repeat based on wall dimensions
                    // This will be adjusted per wall in the wallMesh method
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

        // Only apply texture if useTexture is true and texture is specified
        if (config.useTexture && config.texture && config.texture !== 'smooth') {
            try {
                const texture = await this.loadTexture(`/textures/${config.texture}.jpg`);
                material.map = texture;
                material.needsUpdate = true;
                
                // Optional: Add normal map for more detail
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
                // Material will fall back to solid color
            }
        }

        this.materials.set(materialKey, material);
        return material;
    }

    // Create a basic material (fallback)
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

export default class wall {
    group: t.Group;
    innerStart: t.Vector3;
    outerStart: t.Vector3;
    innerEnd: t.Vector3;
    outerEnd: t.Vector3;
    private materialManager = MaterialManager.getInstance();
    private innerMesh?: t.Mesh;
    private outerMesh?: t.Mesh;
    private coverMeshes: t.Mesh[] = [];
    
    constructor(
        start: t.Vector3,
        end: t.Vector3,
        innerMaterialConfig?: MaterialConfig,
        outerMaterialConfig?: MaterialConfig
    ) {
        this.group = new t.Group();
        this.calculateWallGeometry(start, end);
        this.initializeWall(start, end, innerMaterialConfig, outerMaterialConfig);

        const normal = start
            .clone()
            .sub(end)
            .normalize()
            .applyAxisAngle(new t.Vector3(0, 1, 0), t.MathUtils.degToRad(90));
        const wallDelta = start
            .clone()
            .sub(end)
            .normalize()
            .multiplyScalar(width / 2);

        const innerWallOffset = normal.clone().multiplyScalar(width / 2);
        const outerWallOffset = normal.clone().multiplyScalar((-width / 2) - 0.01);

        this.innerStart = start.clone().add(innerWallOffset).sub(wallDelta);
        this.outerStart = start.clone().add(outerWallOffset).add(wallDelta);
        this.innerEnd = end.clone().add(innerWallOffset.add(wallDelta));
        this.outerEnd = end.clone().add(outerWallOffset).sub(wallDelta);
    }

    private calculateWallGeometry(start: t.Vector3, end: t.Vector3) {
        const normal = start
            .clone()
            .sub(end)
            .normalize()
            .applyAxisAngle(new t.Vector3(0, 1, 0), t.MathUtils.degToRad(90));
        const wallDelta = start
            .clone()
            .sub(end)
            .normalize()
            .multiplyScalar(width / 2);

        const innerWallOffset = normal.clone().multiplyScalar(width / 2);
        const outerWallOffset = normal.clone().multiplyScalar((-width / 2) - 0.01);

        this.innerStart = start.clone().add(innerWallOffset).sub(wallDelta);
        this.outerStart = start.clone().add(outerWallOffset).add(wallDelta);
        this.innerEnd = end.clone().add(innerWallOffset.add(wallDelta));
        this.outerEnd = end.clone().add(outerWallOffset).sub(wallDelta);
    }

    private async initializeWall(
        start: t.Vector3,
        end: t.Vector3,
        innerMaterialConfig?: MaterialConfig,
        outerMaterialConfig?: MaterialConfig
    ) {
        try {
            // Create materials
            const innerMaterial = innerMaterialConfig 
                ? await this.materialManager.createMaterial(innerMaterialConfig)
                : this.materialManager.createBasicMaterial(0xe9e4d6);
                
            const outerMaterial = outerMaterialConfig
                ? await this.materialManager.createMaterial(outerMaterialConfig)
                : this.materialManager.createBasicMaterial(0xddd6c4);
                
            const coverMaterial = this.materialManager.createBasicMaterial(0x000000);

            // Build wall meshes
            await this.buildWallMeshes(innerMaterial, outerMaterial, coverMaterial);
            
        } catch (error) {
            console.error('Failed to initialize wall materials:', error);
            // Fallback to basic materials
            this.buildWithBasicMaterials();
        }
    }

    private async buildWallMeshes(
        innerMaterial: t.Material,
        outerMaterial: t.Material,
        coverMaterial: t.Material
    ) {
        // Calculate wall length for texture scaling
        const wallLength = this.innerStart.distanceTo(this.innerEnd);
        
        this.innerMesh = this.wallMesh(
            [this.innerStart, this.innerEnd],
            indices,
            innerMaterial,
            wallLength
        );
        
        this.outerMesh = this.wallMesh(
            [this.outerStart, this.outerEnd],
            indicesReverse,
            outerMaterial,
            wallLength
        );

        this.coverMeshes = wall.cover(
            [this.outerStart, this.outerEnd, this.innerStart, this.innerEnd],
            innerMaterial as any,
            coverMaterial as any
        );

        // Add all meshes to group
        this.group.add(this.innerMesh);
        this.group.add(this.outerMesh);
        for (let i = 0; i < this.coverMeshes.length; i++) {
            this.group.add(this.coverMeshes[i]);
        }
    }

    private buildWithBasicMaterials() {
        // Fallback method using basic materials
        const innerMaterial = this.materialManager.createBasicMaterial(0xe9e4d6);
        const outerMaterial = this.materialManager.createBasicMaterial(0xddd6c4);
        const coverMaterial = this.materialManager.createBasicMaterial(0x000000);

        const wallLength = this.innerStart.distanceTo(this.innerEnd);
        
        this.innerMesh = this.wallMesh(
            [this.innerStart, this.innerEnd],
            indices,
            innerMaterial,
            wallLength
        );
        
        this.outerMesh = this.wallMesh(
            [this.outerStart, this.outerEnd],
            indicesReverse,
            outerMaterial,
            wallLength
        );

        this.coverMeshes = wall.cover(
            [this.outerStart, this.outerEnd, this.innerStart, this.innerEnd],
            innerMaterial,
            coverMaterial
        );

        this.group.add(this.innerMesh);
        this.group.add(this.outerMesh);
        for (let i = 0; i < this.coverMeshes.length; i++) {
            this.group.add(this.coverMeshes[i]);
        }
    }

    // Method to update materials after creation
    async updateMaterial(
        component: 'inner' | 'outer',
        config: MaterialConfig
    ) {
        try {
            const newMaterial = await this.materialManager.createMaterial(config);
            
            if (component === 'inner' && this.innerMesh) {
                this.innerMesh.material = newMaterial;
            } else if (component === 'outer' && this.outerMesh) {
                this.outerMesh.material = newMaterial;
            }
        } catch (error) {
            console.error(`Failed to update ${component} wall material:`, error);
        }
    }

    wallMesh(points: Array<t.Vector3>, indices: Array<number>, material: t.Material, wallLength: number = 1) {
        const geometry = new t.BufferGeometry();
        const vertices = new Float32Array(points.length * 2 * 3);
        const uvs = new Float32Array(points.length * 2 * 2);

        for (let i = 0; i < points.length; i++) {
            // Bottom vertices
            vertices[i * 3 + 0] = points[i].x;
            vertices[i * 3 + 1] = 0;
            vertices[i * 3 + 2] = points[i].z;

            // Top vertices
            vertices[(i + 2) * 3 + 0] = points[i].x;
            vertices[(i + 2) * 3 + 1] = height;
            vertices[(i + 2) * 3 + 2] = points[i].z;

            // UV coordinates for texture mapping
            const u = i / (points.length - 1);
            
            // Bottom UVs
            uvs[i * 2 + 0] = u * (wallLength / 10); // Scale based on wall length
            uvs[i * 2 + 1] = 0;
            
            // Top UVs
            uvs[(i + 2) * 2 + 0] = u * (wallLength / 10);
            uvs[(i + 2) * 2 + 1] = height / 10; // Scale based on wall height
        }

        geometry.setAttribute("position", new t.BufferAttribute(vertices, 3));
        geometry.setAttribute("uv", new t.BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        
        // Compute normals for proper lighting
        geometry.computeVertexNormals();
        
        // Adjust texture repeat if material has a texture
        if (material instanceof t.MeshStandardMaterial && material.map) {
            const textureRepeatX = Math.max(1, wallLength / 50); // Adjust scale as needed
            const textureRepeatY = Math.max(1, height / 50);
            material.map.repeat.set(textureRepeatX, textureRepeatY);
        }
        
        return new t.Mesh(geometry, material);
    }

    static cover(points: Array<t.Vector3>, innerMaterial: t.MeshBasicMaterial, coverMaterial: t.MeshBasicMaterial) {
        const bottomVertices = new Float32Array(points.length * 3);
        const topVertices = new Float32Array(points.length * 3);
        const leftVertices = new Float32Array(points.length * 3);
        const rightVertices = new Float32Array(points.length * 3);

        // Bottom and top vertices
        for (let i = 0; i < points.length; i++) {
            bottomVertices[i * 3 + 0] = points[i].x;
            bottomVertices[i * 3 + 1] = 0;
            bottomVertices[i * 3 + 2] = points[i].z;

            topVertices[i * 3 + 0] = points[i].x;
            topVertices[i * 3 + 1] = height;
            topVertices[i * 3 + 2] = points[i].z;
        }

        // Left vertices (corrected)
        for (let i = 0; i < points.length; i += 2) {
            leftVertices[i * 3 + 0] = points[i].x;
            leftVertices[i * 3 + 1] = 0;
            leftVertices[i * 3 + 2] = points[i].z;

            leftVertices[(i + 1) * 3 + 0] = points[i].x;
            leftVertices[(i + 1) * 3 + 1] = height;
            leftVertices[(i + 1) * 3 + 2] = points[i].z;
        }

        // Right vertices (corrected)
        for (let i = 1; i < points.length; i += 2) {
            rightVertices[i * 3 + 0] = points[i].x;
            rightVertices[i * 3 + 1] = 0;
            rightVertices[i * 3 + 2] = points[i].z;

            rightVertices[(i - 1) * 3 + 0] = points[i].x;
            rightVertices[(i - 1) * 3 + 1] = height;
            rightVertices[(i - 1) * 3 + 2] = points[i].z;
        }

        // Create geometries
        const topGeometry = new t.BufferGeometry();
        const bottomGeometry = new t.BufferGeometry();
        const leftGeometry = new t.BufferGeometry();
        const rightGeometry = new t.BufferGeometry();

        topGeometry.setAttribute("position", new t.BufferAttribute(topVertices, 3));
        bottomGeometry.setAttribute("position", new t.BufferAttribute(bottomVertices, 3));
        leftGeometry.setAttribute("position", new t.BufferAttribute(leftVertices, 3));
        rightGeometry.setAttribute("position", new t.BufferAttribute(rightVertices, 3));

        // Add UV coordinates for cover surfaces
        const uvs = new Float32Array(points.length * 2);
        for (let i = 0; i < points.length; i++) {
            uvs[i * 2 + 0] = i / (points.length - 1);
            uvs[i * 2 + 1] = 0.5;
        }

        topGeometry.setAttribute("uv", new t.BufferAttribute(uvs, 2));
        bottomGeometry.setAttribute("uv", new t.BufferAttribute(uvs, 2));
        leftGeometry.setAttribute("uv", new t.BufferAttribute(uvs, 2));
        rightGeometry.setAttribute("uv", new t.BufferAttribute(uvs, 2));

        // Set indices
        topGeometry.setIndex(indicesReverse);
        bottomGeometry.setIndex(indices);
        leftGeometry.setIndex(indices);
        rightGeometry.setIndex(indicesReverse);

        // Compute normals
        topGeometry.computeVertexNormals();
        bottomGeometry.computeVertexNormals();
        leftGeometry.computeVertexNormals();
        rightGeometry.computeVertexNormals();

        // Create meshes
        const topMesh = new t.Mesh(topGeometry, coverMaterial);
        const bottomMesh = new t.Mesh(bottomGeometry, coverMaterial);
        const leftMesh = new t.Mesh(leftGeometry, innerMaterial);
        const rightMesh = new t.Mesh(rightGeometry, innerMaterial);

        return [topMesh, bottomMesh, leftMesh, rightMesh];
    }

    // Method to get wall length (useful for texture scaling)
    getLength(): number {
        return this.innerStart.distanceTo(this.innerEnd);
    }

    // Method to get wall height
    getHeight(): number {
        return height;
    }

    // Cleanup method
    dispose() {
        this.group.clear();
        this.innerMesh = undefined;
        this.outerMesh = undefined;
        this.coverMeshes = [];
    }
}
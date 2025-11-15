import * as t from 'three';

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
                    // Optimize texture settings
                    texture.wrapS = t.RepeatWrapping;
                    texture.wrapT = t.RepeatWrapping;
                    texture.repeat.set(2, 2); // Adjust based on surface size
                    texture.generateMipmaps = true;
                    texture.minFilter = t.LinearMipmapLinearFilter;
                    texture.magFilter = t.LinearFilter;
                    
                    this.textureCache.set(path, texture);
                    resolve(texture);
                },
                undefined,
                reject
            );
        });
    }

    async createMaterial(config: MaterialConfig): Promise<t.MeshStandardMaterial> {
        const materialKey = `${config.id}_${config.color}_${config.texture || 'solid'}`;
        
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
            }
        }

        this.materials.set(materialKey, material);
        return material;
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
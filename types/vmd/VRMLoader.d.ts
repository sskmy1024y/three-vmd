import * as THREE from 'three';
import { VMD } from './data';
export declare class VMDLoader {
    private _fileLoader;
    constructor(manager?: THREE.LoadingManager);
    load(url: string, onLoad?: (vmd: VMD) => void, onProgress?: (request: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
}

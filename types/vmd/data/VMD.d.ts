import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
export declare class VMD {
    metadata: VMDMetadata;
    motions: VMDMotion[];
    morphs: VMDMorph[];
    cameras: VMDCamera[];
    constructor();
    fromObject(object: any): VMD;
    toAnimationClipForVRM(vrm: VRM): THREE.AnimationClip;
}
export interface VMDMetadata {
    magic: string;
    name: string;
    coordinateSystem: 'left' | 'right';
    motionCount: number;
    morphCount: number;
    cameraCount: number;
}
export interface VMDMotion {
    boneName: string;
    frameNum: number;
    position: [number, number, number];
    rotation: [number, number, number, number];
    interpolation: number[];
}
export interface VMDMorph {
    morphName: string;
    frameNum: number;
    weight: number;
}
export interface VMDCamera {
    frameNum: number;
    distance: number;
    position: [number, number, number];
    rotation: [number, number, number];
    interpolation: number[];
    fov: number;
    perspective: number;
}

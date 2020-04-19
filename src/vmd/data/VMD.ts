import * as THREE from 'three'
import { PMDSemiStandardBoneName, PMDStandardBoneName, PMDMorphName } from '.'

import { VRMSchema, VRM } from '@pixiv/three-vrm'

export class VMD {
  public metadata: VMDMetadata
  public motions: VMDMotion[]
  public morphs: VMDMorph[]
  public cameras: VMDCamera[]

  constructor() {
    this.metadata = {
      magic: '',
      name: '',
      coordinateSystem: 'right',
      motionCount: 0,
      morphCount: 0,
      cameraCount: 0,
    }
    this.motions = []
    this.morphs = []
    this.cameras = []
  }

  public fromObject(object: any): VMD {
    Object.assign(this, object)
    return this
  }

  public toAnimationClipForVRM(vrm: VRM): THREE.AnimationClip {
    const motionsMap = new Map<string, VMDMotion[]>()
    this.motions.forEach((motion) => {
      if (!motionsMap.has(motion.boneName)) {
        motionsMap.set(motion.boneName, [motion])
        return
      }
      motionsMap.get(motion.boneName)?.push(motion)
    })
    motionsMap.forEach((motions) => {
      motions.sort((a, b) => {
        return a.frameNum - b.frameNum
      })
    })

    const morphsMap = new Map<string, VMDMorph[]>()
    this.morphs.forEach((morph) => {
      if (!morphsMap.has(morph.morphName)) {
        morphsMap.set(morph.morphName, [morph])
        return
      }
      morphsMap.get(morph.morphName)?.push(morph)
    })
    morphsMap.forEach((morphs) => {
      morphs.sort((a, b) => {
        return a.frameNum - b.frameNum
      })
    })

    const tracks: THREE.KeyframeTrack[] = []

    // Convert rotations for T-pose.
    const front = new THREE.Vector3(0, 0, -1)
    const rotationOffsets = new Map<VRMSchema.HumanoidBoneName, THREE.Quaternion>([
      [VRMSchema.HumanoidBoneName.LeftShoulder, new THREE.Quaternion().setFromAxisAngle(front, (-5 / 180) * Math.PI)],
      [VRMSchema.HumanoidBoneName.RightShoulder, new THREE.Quaternion().setFromAxisAngle(front, (5 / 180) * Math.PI)],
      [VRMSchema.HumanoidBoneName.LeftUpperArm, new THREE.Quaternion().setFromAxisAngle(front, (-35 / 180) * Math.PI)],
      [VRMSchema.HumanoidBoneName.RightUpperArm, new THREE.Quaternion().setFromAxisAngle(front, (35 / 180) * Math.PI)],
    ])

    motionsMap.forEach((motions, boneName) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const humanBoneName = pmdToHuman.get(boneName)

      let _bone: THREE.Object3D | null

      if (humanBoneName) {
        // bone = vrm.getNodeByHumanBoneName(humanBoneName);
        _bone = vrm.humanoid?.getBoneNode(humanBoneName) ?? null
      } else {
        // bone = vrm.model.getObjectByName(boneName);
        _bone = vrm.scene.getObjectByName(boneName) ?? null
      }

      if (_bone === null || !humanBoneName) {
        console.warn(`VMD.toAnimationClipForVRM : Bone '${boneName}' not found.`)
        return
      }

      const bone: THREE.Object3D = _bone

      const rotationOffset = rotationOffsets.get(humanBoneName)

      // Inspired by https://github.com/mrdoob/three.js/blob/dev/examples/js/loaders/MMDLoader.js
      const times: number[] = []
      const positions: number[] = []
      const rotations: number[] = []
      const positionInterpolations: number[] = []
      const rotationInterpolations: number[] = []

      motions.forEach((motion) => {
        times.push(motion.frameNum / 30) // 30 fps

        const p = new THREE.Vector3(-motion.position[0], motion.position[1], -motion.position[2])
          .multiplyScalar(0.08) // 1 unit length in VMD = 0.08 m
          .add(bone.position)
        positions.push(p.x, p.y, p.z)

        const q = new THREE.Quaternion(motion.rotation[0], -motion.rotation[1], motion.rotation[2], -motion.rotation[3])
        if (rotationOffset) {
          q.multiply(rotationOffset)
        }
        rotations.push(q.x, q.y, q.z, q.w)

        // Control points of cubic Bézier curve.
        for (let i = 0; i < 3; i++) {
          positionInterpolations.push(
            motion.interpolation[i + 0] / 127, // time1
            motion.interpolation[i + 8] / 127, // value1
            motion.interpolation[i + 4] / 127, // time2
            motion.interpolation[i + 12] / 127, // value2
          )
        }
        rotationInterpolations.push(
          motion.interpolation[3 + 0] / 127,
          motion.interpolation[3 + 8] / 127,
          motion.interpolation[3 + 4] / 127,
          motion.interpolation[3 + 12] / 127,
        )
      })

      const positionTrack = new THREE.VectorKeyframeTrack(`${bone.uuid}.position`, times, positions)
      const quaternionTrack = new THREE.QuaternionKeyframeTrack(`${bone.uuid}.quaternion`, times, rotations)

      tracks.push(positionTrack)
      tracks.push(quaternionTrack)
    })

    morphsMap.forEach((morphs, morphName) => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const blendShapeGroupName = morphToBlendShapeGroup.get(morphName) || morphName
      // const blendShapeGroup = vrm.blendShapeMaster.blendShapeGroups.find(
      const trackName = vrm.blendShapeProxy?.getBlendShapeTrackName(blendShapeGroupName)
      const blendShapeGroup = vrm.blendShapeProxy?.getBlendShapeGroup(blendShapeGroupName)

      if (!blendShapeGroup || !trackName) return

      const times: number[] = []
      const values: number[] = []

      morphs.forEach((morph) => {
        times.push(morph.frameNum / 30) // 30 fps
        values.push((blendShapeGroup.weight / 100) * morph.weight) // [0, 100] -> [0, 1]
      })

      const track = new THREE.NumberKeyframeTrack(trackName, times, values)
      tracks.push(track)
    })

    return new THREE.AnimationClip(`uuid-${Math.random()}`, -1, tracks)
  }
}

export interface VMDMetadata {
  magic: string
  name: string
  coordinateSystem: 'left' | 'right'
  motionCount: number
  morphCount: number
  cameraCount: number
}

export interface VMDMotion {
  boneName: string
  frameNum: number
  position: [number, number, number]
  rotation: [number, number, number, number]
  interpolation: number[] // Array(64)
}

export interface VMDMorph {
  morphName: string
  frameNum: number
  weight: number
}

export interface VMDCamera {
  frameNum: number
  distance: number
  position: [number, number, number]
  rotation: [number, number, number]
  interpolation: number[] // Array(24)
  fov: number
  perspective: number
}

const pmdToHuman = new Map<string, VRMSchema.HumanoidBoneName>([
  [PMDStandardBoneName.LowerBody, VRMSchema.HumanoidBoneName.Hips],
  [PMDStandardBoneName.UpperBody, VRMSchema.HumanoidBoneName.Spine],
  [PMDSemiStandardBoneName.UpperBody2, VRMSchema.HumanoidBoneName.Chest],
  [PMDStandardBoneName.LeftLeg, VRMSchema.HumanoidBoneName.LeftUpperLeg],
  [PMDStandardBoneName.LeftKnee, VRMSchema.HumanoidBoneName.LeftLowerLeg],
  [PMDStandardBoneName.LeftAnkle, VRMSchema.HumanoidBoneName.LeftFoot],
  [PMDStandardBoneName.LeftToes, VRMSchema.HumanoidBoneName.LeftToes],
  [PMDStandardBoneName.RightLeg, VRMSchema.HumanoidBoneName.RightUpperLeg],
  [PMDStandardBoneName.RightKnee, VRMSchema.HumanoidBoneName.RightLowerLeg],
  [PMDStandardBoneName.RightAnkle, VRMSchema.HumanoidBoneName.RightFoot],
  [PMDStandardBoneName.RightToes, VRMSchema.HumanoidBoneName.RightToes],
  [PMDStandardBoneName.Neck, VRMSchema.HumanoidBoneName.Neck],
  [PMDStandardBoneName.Head, VRMSchema.HumanoidBoneName.Head],
  [PMDStandardBoneName.LeftEye, VRMSchema.HumanoidBoneName.LeftEye],
  [PMDStandardBoneName.RightEye, VRMSchema.HumanoidBoneName.RightEye],
  [PMDStandardBoneName.LeftShoulder, VRMSchema.HumanoidBoneName.LeftShoulder],
  [PMDStandardBoneName.LeftArm, VRMSchema.HumanoidBoneName.LeftUpperArm],
  [PMDStandardBoneName.LeftElbow, VRMSchema.HumanoidBoneName.LeftLowerArm],
  [PMDStandardBoneName.LeftWrist, VRMSchema.HumanoidBoneName.LeftHand],
  [PMDStandardBoneName.RightShoulder, VRMSchema.HumanoidBoneName.RightShoulder],
  [PMDStandardBoneName.RightArm, VRMSchema.HumanoidBoneName.RightUpperArm],
  [PMDStandardBoneName.RightElbow, VRMSchema.HumanoidBoneName.RightLowerArm],
  [PMDStandardBoneName.RightWrist, VRMSchema.HumanoidBoneName.RightHand],
  [PMDStandardBoneName.LeftRing1, VRMSchema.HumanoidBoneName.LeftRingProximal],
  [PMDStandardBoneName.LeftRing2, VRMSchema.HumanoidBoneName.LeftRingIntermediate],
  [PMDStandardBoneName.LeftRing3, VRMSchema.HumanoidBoneName.LeftRingDistal],
  [PMDStandardBoneName.LeftThumb0, VRMSchema.HumanoidBoneName.LeftThumbProximal],
  [PMDStandardBoneName.LeftThumb1, VRMSchema.HumanoidBoneName.LeftThumbIntermediate],
  [PMDStandardBoneName.LeftThumb2, VRMSchema.HumanoidBoneName.LeftThumbDistal],
  [PMDStandardBoneName.LeftIndex1, VRMSchema.HumanoidBoneName.LeftIndexProximal],
  [PMDStandardBoneName.LeftIndex2, VRMSchema.HumanoidBoneName.LeftIndexIntermediate],
  [PMDStandardBoneName.LeftIndex3, VRMSchema.HumanoidBoneName.LeftIndexDistal],
  [PMDStandardBoneName.LeftMiddle1, VRMSchema.HumanoidBoneName.LeftMiddleProximal],
  [PMDStandardBoneName.LeftMiddle2, VRMSchema.HumanoidBoneName.LeftMiddleIntermediate],
  [PMDStandardBoneName.LeftMiddle3, VRMSchema.HumanoidBoneName.LeftMiddleDistal],
  [PMDStandardBoneName.LeftLittle1, VRMSchema.HumanoidBoneName.LeftLittleProximal],
  [PMDStandardBoneName.LeftLittle2, VRMSchema.HumanoidBoneName.LeftLittleIntermediate],
  [PMDStandardBoneName.LeftLittle3, VRMSchema.HumanoidBoneName.LeftLittleDistal],
  [PMDStandardBoneName.RightRing1, VRMSchema.HumanoidBoneName.RightRingProximal],
  [PMDStandardBoneName.RightRing2, VRMSchema.HumanoidBoneName.RightRingIntermediate],
  [PMDStandardBoneName.RightRing3, VRMSchema.HumanoidBoneName.RightRingDistal],
  [PMDStandardBoneName.RightThumb0, VRMSchema.HumanoidBoneName.RightThumbProximal],
  [PMDStandardBoneName.RightThumb1, VRMSchema.HumanoidBoneName.RightThumbIntermediate],
  [PMDStandardBoneName.RightThumb2, VRMSchema.HumanoidBoneName.RightThumbDistal],
  [PMDStandardBoneName.RightIndex1, VRMSchema.HumanoidBoneName.RightIndexProximal],
  [PMDStandardBoneName.RightIndex2, VRMSchema.HumanoidBoneName.RightIndexIntermediate],
  [PMDStandardBoneName.RightIndex3, VRMSchema.HumanoidBoneName.RightIndexDistal],
  [PMDStandardBoneName.RightMiddle1, VRMSchema.HumanoidBoneName.RightMiddleProximal],
  [PMDStandardBoneName.RightMiddle2, VRMSchema.HumanoidBoneName.RightMiddleIntermediate],
  [PMDStandardBoneName.RightMiddle3, VRMSchema.HumanoidBoneName.RightMiddleDistal],
  [PMDStandardBoneName.RightLittle1, VRMSchema.HumanoidBoneName.RightLittleProximal],
  [PMDStandardBoneName.RightLittle2, VRMSchema.HumanoidBoneName.RightLittleIntermediate],
  [PMDStandardBoneName.RightLittle3, VRMSchema.HumanoidBoneName.RightLittleDistal],
])

const morphToBlendShapeGroup = new Map<string, VRMSchema.BlendShapePresetName>([
  [PMDMorphName.Blink, VRMSchema.BlendShapePresetName.Blink],
  [PMDMorphName.BlinkR, VRMSchema.BlendShapePresetName.BlinkR],
  [PMDMorphName.BlinkL, VRMSchema.BlendShapePresetName.BlinkL],
  [PMDMorphName.A, VRMSchema.BlendShapePresetName.A],
  [PMDMorphName.I, VRMSchema.BlendShapePresetName.I],
  [PMDMorphName.U, VRMSchema.BlendShapePresetName.U],
  [PMDMorphName.E, VRMSchema.BlendShapePresetName.E],
  [PMDMorphName.O, VRMSchema.BlendShapePresetName.O],
  [PMDMorphName.Joy, VRMSchema.BlendShapePresetName.Joy],
  [PMDMorphName.Angry, VRMSchema.BlendShapePresetName.Angry],
  [PMDMorphName.Sorrow, VRMSchema.BlendShapePresetName.Sorrow],
  [PMDMorphName.Fun, VRMSchema.BlendShapePresetName.Fun],
])

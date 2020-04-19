import React, { useState, useEffect } from 'react'

import { useLoader, Canvas, useFrame } from 'react-three-fiber'
import { Scene, Group, NumberKeyframeTrack, AnimationClip, AnimationMixer, LoopRepeat } from 'three'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

import { VRM, VRMSchema, VRMUtils } from '@pixiv/three-vrm'
import { VMD, VMDLoader } from '../../src'

export interface ViewerProps {
  vrmUrl: string
  vmdUrl?: string
  children?: React.ReactNode
}

export default function Viewer({ vrmUrl, vmdUrl, children }: ViewerProps) {
  const gltf = useLoader(GLTFLoader, vrmUrl)
  const [vrm, setVRM] = useState<VRM | null>(null)
  const [vmd, setVMD] = useState<VMD | null>(null)

  useEffect(() => {
    VRM.from(gltf).then(setVRM).catch(console.error)
  }, [vrmUrl])

  useEffect(() => {
    if (vmdUrl) {
      new VMDLoader().load(vmdUrl, (vmd) => {
        // eslint-disable-next-line no-console
        console.log(vmd)
        setVMD(vmd)
      })
    }
  }, [vmdUrl])

  if (vrm === null || gltf === null) {
    return null
  }

  return (
    <Canvas>
      <Model gltf={gltf} vrm={vrm} vmd={vmd} />
      {children}
    </Canvas>
  )
}

interface ModelProps {
  gltf: GLTF
  vrm: VRM
  vmd: VMD | null
}

export function Model({ gltf, vrm, vmd }: ModelProps) {
  const [scene, setScene] = useState<Scene | Group | null>(null)

  const [mixer, setMixer] = useState<AnimationMixer | null>(null)

  useEffect(() => {
    VRMUtils.removeUnnecessaryJoints(gltf.scene)
    setScene(vrm.scene)

    const boneNode = vrm.humanoid?.getBoneNode(VRMSchema.HumanoidBoneName.Hips)
    boneNode?.rotateY(Math.PI)

    if (scene !== null) {
      setMixer(new AnimationMixer(scene))
    }
  }, [gltf, vrm, scene])

  useEffect(() => {
    const trackName = vrm.blendShapeProxy?.getBlendShapeTrackName(VRMSchema.BlendShapePresetName.Blink) // name

    if (!trackName || mixer === null || scene === null) return

    const blinkTrack = new NumberKeyframeTrack(
      trackName,
      [0.0, 0.5, 1.0], // times
      [0.0, 1.0, 0.0], // values
    )
    const clip = new AnimationClip('blink', 1.0, [blinkTrack])
    const action = mixer.clipAction(clip)
    action.setLoop(LoopRepeat, 1 / 0)
    action.reset()
    action.play()
  }, [vrm, mixer, scene])

  useFrame((_, delta) => {
    mixer?.update(delta)
    vrm?.update(delta)
  })

  if (scene === null) {
    return null
  }

  return <primitive object={scene} dispose={null} />
}

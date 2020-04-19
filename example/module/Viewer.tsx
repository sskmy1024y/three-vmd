import React, { useState, useEffect } from 'react'

import { useLoader, Canvas } from 'react-three-fiber'
import { Scene, Group } from 'three'
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader'

import { VRM, VRMSchema, VRMUtils } from '@pixiv/three-vrm'
import { VMD } from '../../src'

export interface ViewerProps {
  vrmUrl: string
  vmdUrl?: string
  children?: React.ReactNode
}

export default function Viewer({ vrmUrl, vmdUrl, children }: ViewerProps) {
  const gltf = useLoader(GLTFLoader, vrmUrl)
  const [vrm, setVRM] = useState<VRM | null>(null)

  useEffect(() => {
    VRM.from(gltf).then(setVRM).catch(console.error)
  }, [vrmUrl])

  if (vrm === null || gltf === null) {
    return null
  }

  return (
    <Canvas>
      <Model gltf={gltf} vrm={vrm} />
      {children}
    </Canvas>
  )
}

interface ModelProps {
  gltf: GLTF
  vrm: VRM
  vmd?: VMD
}

export function Model({ gltf, vrm, vmd }: ModelProps) {
  const [scene, setScene] = useState<Scene | Group | null>(null)

  useEffect(() => {
    VRMUtils.removeUnnecessaryJoints(gltf.scene)
    setScene(vrm.scene)

    const boneNode = vrm.humanoid?.getBoneNode(VRMSchema.HumanoidBoneName.Hips)
    boneNode?.rotateY(Math.PI)
  }, [gltf, vrm])

  if (scene === null) {
    return null
  }

  return <primitive object={scene} dispose={null} />
}

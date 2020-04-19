import React, { useRef, useEffect } from 'react'
import { extend, ReactThreeFiber, useThree, useFrame } from 'react-three-fiber'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

extend({ OrbitControls })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      readonly orbitControls: ReactThreeFiber.Object3DNode<OrbitControls, typeof OrbitControls>
    }
  }
}

interface Props extends ReactThreeFiber.Object3DNode<OrbitControls, typeof OrbitControls> {
  defaultCameraPosition?: [number, number, number]
}

export default function Controller(props: Props) {
  const {
    camera,
    gl: { domElement },
  } = useThree()
  const controls = useRef<OrbitControls>()
  const { defaultCameraPosition } = props

  useFrame(() => controls.current?.update())

  useEffect(() => {
    if (defaultCameraPosition !== undefined) {
      camera.position.set(...defaultCameraPosition)
    }
  }, [camera, defaultCameraPosition])

  return <orbitControls ref={controls} args={[camera, domElement]} screenSpacePanning {...props} />
}

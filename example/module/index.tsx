import React from 'react'
import { render } from 'react-dom'
import styled from 'styled-components'
import VRMCanvas from './VRMCanvas'
import Controller from './Controls'
import { Vector3 } from 'three'

import girlModel from '../assets/models/three-vrm-girl.vrm'
import waitingMotion from '../assets/motions/wavefile_v2.vmd'

function App() {
  return (
    <Container>
      <VRMCanvas vrmUrl={girlModel} vmdUrl={waitingMotion}>
        <Controller defaultCameraPosition={[0, 1.5, 1.2]} target={new Vector3(0, 1.2, 0)} />
        <directionalLight position={[1, 1, 1]} />
        <gridHelper />
        <axesHelper />
      </VRMCanvas>
    </Container>
  )
}

const Container = styled.div`
  width: 100vw;
  height: 100vh;
`

render(<App />, document.getElementById('root'))

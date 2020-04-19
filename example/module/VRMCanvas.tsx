import React, { Suspense } from 'react'

interface Props {
  vrmUrl: string
  vmdUrl?: string
  children: React.ReactNode
}

export default function VRMCanvas({ children, ...props }: Props) {
  return (
    <Suspense fallback={null}>
      <Viewer {...props}>{children}</Viewer>
    </Suspense>
  )
}

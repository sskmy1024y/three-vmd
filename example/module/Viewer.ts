function Viewer() {
  const [scene, setScene] = useState<Scene | Group | null>(null)
  const gltf = useLoader(GLTFLoader, girlModel)

  useEffect(() => {
    VRMUtils.removeUnnecessaryJoints(gltf.scene)
    VRM.from(gltf)
      .then((vrm) => {
        setScene(vrm.scene)

        const boneNode = vrm.humanoid?.getBoneNode(VRMSchema.HumanoidBoneName.Hips)
        boneNode?.rotateY(Math.PI)
      })
      .catch((e) => {
        console.error(e)
      })
  }, [gltf, setScene])

  return <Suspense fallback={null}></Suspense>
}

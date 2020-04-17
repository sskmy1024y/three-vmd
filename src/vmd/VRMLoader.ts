import * as MMDParser from 'mmd-parser'
import * as THREE from 'three'
import { VMD } from './data'

export class VMDLoader {
  private _fileLoader: THREE.FileLoader

  constructor(manager?: THREE.LoadingManager) {
    this._fileLoader = new THREE.FileLoader(manager)
  }

  public load(
    url: string,
    onLoad?: (vmd: VMD) => void,
    onProgress?: (request: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void,
  ): void {
    this._fileLoader.setResponseType('arraybuffer')
    this._fileLoader.load(
      url,
      (buffer) => {
        if (onLoad) {
          const mmdParser = new MMDParser.Parser()
          const object = mmdParser.parseVmd(buffer, true)
          onLoad(new VMD().fromObject(object))
        }
      },
      onProgress,
      onError,
    )
  }
}

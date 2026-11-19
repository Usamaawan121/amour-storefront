import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function mountJewelScene(host: HTMLElement, canvas: HTMLCanvasElement, context: WebGL2RenderingContext) {
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.22
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 50)
  camera.position.set(4, 3.15, 7.1)
  camera.lookAt(0, .1, 0)

  const pmrem = new THREE.PMREMGenerator(renderer)
  const studio = new RoomEnvironment()
  const environment = pmrem.fromScene(studio, .06)
  studio.dispose()
  pmrem.dispose()
  scene.environment = environment.texture

  const key = new THREE.DirectionalLight(0xffe2a8, 3.8)
  key.position.set(2.5, 5, 3)
  key.castShadow = true
  key.shadow.mapSize.set(512, 512)
  key.shadow.normalBias = .025
  scene.add(key, new THREE.HemisphereLight(0xfff6db, 0x482811, 1.15))

  const surface = new THREE.CanvasTexture(makeTexture())
  surface.wrapS = surface.wrapT = THREE.RepeatWrapping
  surface.repeat.set(4, 2)
  const gold = new THREE.MeshPhysicalMaterial({
    color: 0xe2a94e, metalness: .86, roughness: .24, clearcoat: .75,
    envMapIntensity: 1.35, bumpMap: surface, bumpScale: .035,
  })
  const stone = new THREE.MeshPhysicalMaterial({
    color: 0xfff6d9, metalness: .16, roughness: .1, clearcoat: 1,
    envMapIntensity: 1.6, flatShading: true,
  })
  const base = new THREE.MeshStandardMaterial({ color: 0x23211d, roughness: .47 })
  const geometries: THREE.BufferGeometry[] = []
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material) {
    geometries.push(geometry)
    const shape = new THREE.Mesh(geometry, material)
    shape.castShadow = true
    shape.receiveShadow = true
    return shape
  }

  const pedestal = mesh(new THREE.CylinderGeometry(1.47, 1.51, .25, 72), base)
  pedestal.position.y = -.98
  scene.add(pedestal)
  const trim = mesh(new THREE.CylinderGeometry(1.5, 1.5, .035, 72), gold)
  trim.position.y = -1.02
  scene.add(trim)
  const ring = new THREE.Group()
  const band = mesh(new THREE.TorusGeometry(.76, .105, 24, 96), gold)
  ring.add(band)
  const gem = mesh(new THREE.OctahedronGeometry(.27), stone)
  gem.position.set(0, .83, .08)
  gem.scale.set(.95, .85, .83)
  gem.rotation.y = Math.PI / 5
  ring.add(gem)
  for (let index = 0; index < 4; index++) {
    const angle = index * Math.PI / 2 + Math.PI / 4
    const prong = mesh(new THREE.SphereGeometry(.052, 10, 8), gold)
    prong.position.set(Math.cos(angle) * .175, .83 + Math.sin(angle) * .175, .15)
    ring.add(prong)
  }
  scene.add(ring)

  function resize() {
    const { clientWidth: width, clientHeight: height } = host
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }
  resize()
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  host.append(renderer.domElement)
  let start = 0
  renderer.setAnimationLoop(time => {
    if (!start) start = time
    const seconds = (time - start) / 1000
    const entry = Math.min(seconds / .8, 1)
    ring.position.y = (1 - entry) ** 3 * 1.5 + .11 + Math.sin(seconds * 2.1) * .08
    ring.rotation.set(.22 + seconds * .15, -.38 + seconds * 1.16, -.25)
    ring.scale.setScalar(.72 + entry * .28)
    renderer.render(scene, camera)
    host.dataset.ready = 'true'
  })

  return () => {
    observer.disconnect()
    renderer.setAnimationLoop(null)
    for (const geometry of geometries) geometry.dispose()
    for (const material of [gold, stone, base]) material.dispose()
    surface.dispose()
    environment.dispose()
    key.shadow.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
}

function makeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')!
  const pixels = context.createImageData(64, 64)
  for (let i = 0; i < pixels.data.length; i += 4) {
    const shade = 175 + Math.sin(i / 8) * 20 + Math.cos(i / 27) * 22
    pixels.data.set([shade, shade, shade, 255], i)
  }
  context.putImageData(pixels, 0, 0)
  return canvas
}

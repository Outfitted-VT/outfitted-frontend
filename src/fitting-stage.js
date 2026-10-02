// Renders the avatar wearing a garment. model-viewer shows one model at a time, so this uses three.js directly.
// The garment is a rigid overlay placed by `fit` (anchor → target, scale); real draping will replace this.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const loader = new GLTFLoader();
const loadModel = (url) => loader.loadAsync(url).then((gltf) => gltf.scene);

export async function createFittingStage(container, { avatarUrl, garmentUrl, fit }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const light = new THREE.DirectionalLight(0xffffff, 1.2);
  light.position.set(0.4, 5, 1.2);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = light.shadow.camera.bottom = -1.2;
  light.shadow.camera.right = light.shadow.camera.top = 1.2;
  light.shadow.radius = 6;
  scene.add(light);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(2, 48), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 20);
  camera.position.set(1.2, 0.95, 4.9);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.76, -0.08);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = Math.PI * 0.3;
  controls.maxPolarAngle = Math.PI * 0.55;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.addEventListener("start", () => (controls.autoRotate = false));

  const [avatar, garmentModel] = await Promise.all([loadModel(avatarUrl), loadModel(garmentUrl)]);
  const garment = new THREE.Group();
  garment.add(garmentModel);
  for (const object of [avatar, garment]) {
    object.traverse((node) => {
      if (node.isMesh) node.castShadow = true;
    });
    scene.add(object);
  }

  // Scale the garment about its anchor point and pin that point to the avatar's target point.
  const stretch = fit.stretch ?? [1, 1, 1];
  const setSizeScale = (sizeScale) => {
    const s = stretch.map((axis) => fit.scale * sizeScale * axis);
    garment.scale.set(...s);
    garment.position.set(...fit.target.map((t, i) => t - fit.anchor[i] * s[i]));
  };
  setSizeScale(1);

  // Orbit the camera to a fixed angle around the body (0 = front).
  const setView = (degrees) => {
    controls.autoRotate = false;
    const offset = camera.position.clone().sub(controls.target);
    const radius = Math.hypot(offset.x, offset.z);
    const angle = THREE.MathUtils.degToRad(degrees);
    camera.position.set(controls.target.x + radius * Math.sin(angle), camera.position.y, controls.target.z + radius * Math.cos(angle));
  };

  const resize = () => {
    const { clientWidth: width, clientHeight: height } = container;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    setSizeScale,
    setView,
    setAutoRotate: (on) => (controls.autoRotate = on),
    dispose() {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

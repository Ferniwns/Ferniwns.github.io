import { TELEPORT_POINTS } from './teleport-points.js';

const MODEL_PATH = './assets/models/gallery.glb';
const SKY_PATH = './assets/sky/sky.jpg';
const TELEPORT_ANIMATION_DURATION = 600;
const DEFAULT_FUSE_TIMEOUT = 1500;

const assetAvailability = new Map();
const teleportStart = new THREE.Vector3();
const teleportEnd = new THREE.Vector3();
const teleportCurrent = new THREE.Vector3();
let teleportAnimationFrame = null;

AFRAME.registerComponent('teleport-to', {
  schema: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } },
  init() {
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.fuseTimer = null;
    this.teleportLocked = false;

    this.el.classList.add('teleport-hotspot');
    this.el.addEventListener('click', this.handleClick);
    this.el.addEventListener('mouseenter', this.handleMouseEnter);
    this.el.addEventListener('mouseleave', this.handleMouseLeave);
  },
  remove() {
    this.el.removeEventListener('click', this.handleClick);
    this.el.removeEventListener('mouseenter', this.handleMouseEnter);
    this.el.removeEventListener('mouseleave', this.handleMouseLeave);
    this.clearFuseTimer();
  },
  handleClick() {
    this.clearFuseTimer();
    this.triggerTeleport();
  },
  handleMouseEnter(evt) {
    const cursorEl = evt.detail?.cursorEl;
    const fuseData = cursorEl?.components?.cursor?.data;
    const fuseEnabled = !!fuseData?.fuse;
    if (!fuseEnabled) return;

    const timeout =
      typeof fuseData.fuseTimeout === 'number' && !Number.isNaN(fuseData.fuseTimeout)
        ? fuseData.fuseTimeout
        : DEFAULT_FUSE_TIMEOUT;

    this.clearFuseTimer();
    this.fuseTimer = setTimeout(() => {
      this.fuseTimer = null;
      this.triggerTeleport();
    }, timeout);
  },
  handleMouseLeave() {
    this.clearFuseTimer();
  },
  clearFuseTimer() {
    if (this.fuseTimer) {
      clearTimeout(this.fuseTimer);
      this.fuseTimer = null;
    }
  },
  triggerTeleport() {
    this.clearFuseTimer();
    if (this.teleportLocked) return;
    this.teleportLocked = true;
    smoothTeleportTo(this.data);
    setTimeout(() => {
      this.teleportLocked = false;
    }, 120);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) {
    console.warn('A-Frame scene not found.');
    return;
  }

  if (sceneEl.hasLoaded) {
    initScene();
  } else {
    sceneEl.addEventListener('loaded', initScene);
  }
});

async function initScene() {
  setupLights();
  setupCamera();
  await setupSky();

  const hasModel = await assetExists(MODEL_PATH);
  if (hasModel) {
    loadGalleryModel();
  } else {
    buildProceduralGallery();
  }

  setupTeleportHotspots();
}

async function assetExists(path) {
  if (assetAvailability.has(path)) {
    return assetAvailability.get(path);
  }

  const methods = ['HEAD', 'GET'];
  for (const method of methods) {
    const exists = await attemptFetch(path, method);
    if (exists !== null) {
      assetAvailability.set(path, exists);
      return exists;
    }
  }

  assetAvailability.set(path, false);
  return false;
}

async function attemptFetch(path, method) {
  try {
    const response = await fetch(path, { method, cache: 'no-store' });
    if (response.ok || response.type === 'opaque' || response.status === 0) {
      return true;
    }
    if (response.status === 404) {
      return false;
    }
    if (response.status === 405 && method === 'HEAD') {
      return null;
    }
    return null;
  } catch (err) {
    return null;
  }
}

function setupLights() {
  const lightingRoot = document.getElementById('lighting-root');
  if (!lightingRoot) return;
  clearChildren(lightingRoot);

  const ambient = document.createElement('a-entity');
  ambient.setAttribute('light', 'type: ambient; intensity: 0.5; color: #ffffff');
  lightingRoot.appendChild(ambient);

  const directional = document.createElement('a-entity');
  directional.setAttribute('light', 'type: directional; intensity: 1; castShadow: true');
  directional.setAttribute('position', '0 4 -2');
  lightingRoot.appendChild(directional);
}

function setupCamera() {
  const rig = document.getElementById('rig');
  if (!rig) return;

  rig.setAttribute('camera', 'active: true');
  rig.setAttribute('look-controls', 'pointerLockEnabled: false; magicWindowTrackingEnabled: true');

  const cursor = rig.querySelector('[cursor]');
  if (cursor) {
    cursor.setAttribute('cursor', 'fuse: true; fuseTimeout: 1500');
    cursor.setAttribute('raycaster', 'objects: .teleport-hotspot');
  }
}

async function setupSky() {
  const skyEl = document.getElementById('dynamic-sky');
  if (!skyEl) return;

  const hasSky = await assetExists(SKY_PATH);
  if (hasSky) {
    skyEl.setAttribute('src', SKY_PATH);
  }
  skyEl.setAttribute('visible', true);
}

function loadGalleryModel() {
  const assetsEl = document.getElementById('asset-bank');
  const environmentRoot = document.getElementById('environment-root');
  if (!assetsEl || !environmentRoot) return;

  clearChildren(environmentRoot);

  let modelAsset = document.getElementById('galleryModelAsset');
  if (!modelAsset) {
    modelAsset = document.createElement('a-asset-item');
    modelAsset.setAttribute('id', 'galleryModelAsset');
    modelAsset.setAttribute('src', MODEL_PATH);
    assetsEl.appendChild(modelAsset);
  }

  const modelEntity = document.createElement('a-entity');
  modelEntity.setAttribute('gltf-model', '#galleryModelAsset');
  modelEntity.setAttribute('position', '0 0 0');
  modelEntity.setAttribute('shadow', 'cast: true; receive: true');
  environmentRoot.appendChild(modelEntity);
}

function buildProceduralGallery() {
  const environmentRoot = document.getElementById('environment-root');
  if (!environmentRoot) return;

  clearChildren(environmentRoot);

  const floor = document.createElement('a-plane');
  floor.setAttribute('rotation', '-90 0 0');
  floor.setAttribute('position', '0 0 0');
  floor.setAttribute('width', '14');
  floor.setAttribute('height', '14');
  floor.setAttribute('material', 'src: #floorTexture; repeat: 6 6; roughness: 1; metalness: 0.1');
  environmentRoot.appendChild(floor);

  const walls = [
    { position: '0 2 -7', rotation: '0 0 0' },
    { position: '0 2 7', rotation: '0 180 0' },
    { position: '-7 2 0', rotation: '0 90 0' },
    { position: '7 2 0', rotation: '0 -90 0' }
  ];

  walls.forEach((config) => {
    const wall = document.createElement('a-plane');
    wall.setAttribute('width', '14');
    wall.setAttribute('height', '4');
    wall.setAttribute('material', 'src: #wallTexture; repeat: 4 1; roughness: 0.9');
    wall.setAttribute('position', config.position);
    wall.setAttribute('rotation', config.rotation);
    environmentRoot.appendChild(wall);
  });

  createPaintings(environmentRoot);
}

function createPaintings(root) {
  const paintingData = [
    { src: '#painting1', position: '-4 2 -6.85', rotation: '0 0 0', size: '2.8 2' },
    { src: '#painting2', position: '4 2 -6.85', rotation: '0 0 0', size: '2.8 2' },
    { src: '#painting1', position: '0 2 6.85', rotation: '0 180 0', size: '3.2 2.2' }
  ];

  paintingData.forEach((data) => {
    const [width, height] = data.size.split(' ').map(parseFloat);
    const frame = document.createElement('a-plane');
    frame.setAttribute('width', width);
    frame.setAttribute('height', height);
    frame.setAttribute('material', `color: #000; side: double; shader: flat`);
    frame.setAttribute('position', data.position);
    frame.setAttribute('rotation', data.rotation);
    frame.setAttribute('depth-test', 'false');
    root.appendChild(frame);

    const painting = document.createElement('a-plane');
    painting.setAttribute('width', width - 0.2);
    painting.setAttribute('height', height - 0.2);
    painting.setAttribute('material', `src: ${data.src}; color: #fff; shader: standard; roughness: 0.4`);
    painting.setAttribute('position', data.position);
    painting.setAttribute('rotation', data.rotation);
    painting.setAttribute('class', 'gallery-painting');
    painting.setAttribute('shadow', 'receive: false; cast: false');
    root.appendChild(painting);
  });
}

function setupTeleportHotspots() {
  const environmentRoot = document.getElementById('environment-root');
  if (!environmentRoot || !Array.isArray(TELEPORT_POINTS)) {
    return;
  }

  const existing = environmentRoot.querySelectorAll('.teleport-hotspot');
  existing.forEach((hotspot) => hotspot.parentNode?.removeChild(hotspot));

  TELEPORT_POINTS.forEach((point) => {
    if (!point?.position) return;

    const hotspot = document.createElement('a-cylinder');
    hotspot.classList.add('teleport-hotspot');
    hotspot.setAttribute('radius', '0.25');
    hotspot.setAttribute('height', '0.02');
    hotspot.setAttribute(
      'material',
      'color: #3ad4ff; shader: standard; metalness: 0; roughness: 0.4; emissive: #1a6fb4; emissiveIntensity: 0.45'
    );
    const hotspotY =
      Math.max(typeof point.position.y === 'number' ? point.position.y : 0, 1);
    hotspot.setAttribute('position', `${point.position.x} ${hotspotY} ${point.position.z}`);
    hotspot.setAttribute('rotation', '0 0 0');
    hotspot.setAttribute(
      'teleport-to',
      `x: ${point.position.x}; y: ${point.position.y}; z: ${point.position.z}`
    );

    environmentRoot.appendChild(hotspot);
  });
}

function smoothTeleportTo(target) {
  const rigEl = document.getElementById('rig');
  if (!rigEl) return;

  const rigObj = rigEl.object3D;
  teleportStart.copy(rigObj.position);
  teleportEnd.set(target.x, target.y, target.z);

  if (teleportAnimationFrame) {
    cancelAnimationFrame(teleportAnimationFrame);
    teleportAnimationFrame = null;
  }

  const startTime = performance.now();

  const step = (now) => {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / TELEPORT_ANIMATION_DURATION, 1);
    const eased = easeInOutQuad(t);

    teleportCurrent.copy(teleportStart).lerp(teleportEnd, eased);
    rigObj.position.copy(teleportCurrent);
    rigEl.setAttribute('position', `${teleportCurrent.x} ${teleportCurrent.y} ${teleportCurrent.z}`);

    if (t < 1) {
      teleportAnimationFrame = requestAnimationFrame(step);
    } else {
      teleportAnimationFrame = null;
    }
  };

  teleportAnimationFrame = requestAnimationFrame(step);
}

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function clearChildren(element) {
  while (element && element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

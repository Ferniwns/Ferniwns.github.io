const MODEL_PATH = './assets/models/gallery.glb';
const SKY_PATH = './assets/sky/sky.jpg';

const assetAvailability = new Map();

const teleportPoints = [
  { x: -1.34, z: 5.23 },
  { x: 1.54, z: 10.00 },
  { x: -6.77, z: 3.64 }
];

const TELEPORT_MARKER_HEIGHT = 1.6;
const TELEPORT_DWELL_MS = 2500;

const teleportState = {
  markers: [],
  raycaster: null,
  rafId: null,
  dwellTarget: null,
  dwellStart: 0,
  controlsReady: false,
  vrActive: false,
  tempOrigin: new THREE.Vector3(),
  tempDirection: new THREE.Vector3()
};

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

  setupTeleportMarkers();
  initializeTeleportController();
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
  const cameraRoot = document.getElementById('camera-root');
  if (!cameraRoot) return;
  clearChildren(cameraRoot);

  const camera = document.createElement('a-entity');
  camera.setAttribute('id', 'viewer-camera');
  camera.setAttribute('camera', 'active: true');
  camera.setAttribute('look-controls', 'pointerLockEnabled: false; magicWindowTrackingEnabled: true');
  camera.setAttribute('position', '0 1.6 4');

  if (!isMobileDevice()) {
    camera.setAttribute('wasd-controls', 'acceleration: 12');
  }

  cameraRoot.appendChild(camera);
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

function setupTeleportMarkers() {
  const environmentRoot = document.getElementById('environment-root');
  if (!environmentRoot) return;

  teleportState.markers.forEach((entry) => {
    if (entry.el && entry.el.parentNode) {
      entry.el.parentNode.removeChild(entry.el);
    }
  });
  teleportState.markers = [];

  teleportPoints.forEach((point, index) => {
    const marker = document.createElement('a-sphere');
    marker.setAttribute('radius', '0.15');
    marker.setAttribute('color', '#3ad4ff');
    marker.setAttribute('segments-width', '12');
    marker.setAttribute('segments-height', '12');
    marker.setAttribute(
      'material',
      'shader: standard; roughness: 0.25; metalness: 0; emissive: #3ad4ff; emissiveIntensity: 0.45'
    );
    marker.setAttribute('shadow', 'cast: false; receive: false');
    marker.setAttribute('position', `${point.x} ${TELEPORT_MARKER_HEIGHT} ${point.z}`);
    marker.classList.add('teleport-marker');
    marker.setAttribute('id', `teleport-marker-${index}`);
    environmentRoot.appendChild(marker);
    teleportState.markers.push({ el: marker, point });
  });
}

function initializeTeleportController() {
  if (!isMobileDevice() || teleportState.controlsReady) {
    return;
  }

  const sceneEl = document.querySelector('a-scene');
  const cameraEl = document.getElementById('viewer-camera');
  if (!sceneEl || !cameraEl || teleportState.markers.length === 0) return;

  teleportState.raycaster = teleportState.raycaster || new THREE.Raycaster();
  if (!teleportState.raycaster) return;

  const handleEnterVR = () => {
    teleportState.vrActive = true;
    startTeleportLoop();
  };

  const handleExitVR = () => {
    teleportState.vrActive = false;
    stopTeleportLoop();
  };

  sceneEl.addEventListener('enter-vr', handleEnterVR);
  sceneEl.addEventListener('exit-vr', handleExitVR);

  teleportState.controlsReady = true;

  if (sceneEl.is('vr-mode')) {
    handleEnterVR();
  }
}

function startTeleportLoop() {
  if (teleportState.rafId) return;

  const step = (time) => {
    updateTeleportGaze(time || performance.now());
    teleportState.rafId = window.requestAnimationFrame(step);
  };

  teleportState.rafId = window.requestAnimationFrame(step);
}

function stopTeleportLoop() {
  if (teleportState.rafId) {
    window.cancelAnimationFrame(teleportState.rafId);
    teleportState.rafId = null;
  }
  resetTeleportDwell();
}

function updateTeleportGaze(currentTime = performance.now()) {
  if (!teleportState.vrActive || teleportState.markers.length === 0) {
    resetTeleportDwell();
    return;
  }

  const cameraEl = document.getElementById('viewer-camera');
  if (!cameraEl) return;

  const origin = teleportState.tempOrigin;
  const direction = teleportState.tempDirection;
  cameraEl.object3D.getWorldPosition(origin);
  cameraEl.object3D.getWorldDirection(direction);
  teleportState.raycaster.set(origin, direction);

  const objects = teleportState.markers.map((entry) => entry.el.object3D);
  const intersections = teleportState.raycaster.intersectObjects(objects, true);
  let hitEntry = null;

  if (intersections.length > 0) {
    const hitEl = intersections[0].object.el;
    const markerEl =
      hitEl &&
      (teleportState.markers.find((entry) => entry.el === hitEl)?.el ||
        (typeof hitEl.closest === 'function' ? hitEl.closest('.teleport-marker') : null));
    if (markerEl) {
      hitEntry = teleportState.markers.find((entry) => entry.el === markerEl) || null;
    }
  }

  if (!hitEntry) {
    resetTeleportDwell();
    return;
  }

  if (teleportState.dwellTarget !== hitEntry) {
    teleportState.dwellTarget = hitEntry;
    teleportState.dwellStart = currentTime;
    return;
  }

  if (currentTime - teleportState.dwellStart >= TELEPORT_DWELL_MS) {
    performTeleport(hitEntry.point);
    resetTeleportDwell();
  }
}

function performTeleport(target) {
  const cameraEl = document.getElementById('viewer-camera');
  if (!cameraEl || !target) return;

  const currentPos = cameraEl.object3D.position;
  const newY = currentPos.y;
  cameraEl.object3D.position.set(target.x, newY, target.z);
  cameraEl.setAttribute('position', `${target.x} ${newY} ${target.z}`);
}

function resetTeleportDwell() {
  teleportState.dwellTarget = null;
  teleportState.dwellStart = 0;
}

function isMobileDevice() {
  const ua = navigator.userAgent || '';
  return /Android|iPhone|iPad|iPod|Mobi|OculusBrowser|Quest|Pico/i.test(ua);
}

function clearChildren(element) {
  while (element && element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

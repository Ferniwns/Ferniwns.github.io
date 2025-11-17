import { ROOMS } from './room-config.js';
import { TELEPORT_POINTS } from './teleport-points.js';

const TELEPORT_ANIMATION_DURATION = 600;
const DEFAULT_FUSE_TIMEOUT = 1500;
const DEFAULT_HEIGHT = 1.6;

const STATE = {
  rigEl: null,
  environmentRoot: null,
  lightingRoot: null,
  currentRoom: null,
  modelEl: null
};

const teleportReticleState = {
  el: null,
  cursorEl: null,
  intersectionHandler: null,
  clearedHandler: null,
  tempPosition: new THREE.Vector3()
};

AFRAME.registerComponent('teleport-to', {
  schema: {
    movesToOtherRoom: { type: 'boolean', default: false },
    targetRoom: { type: 'string', default: '' },
    teleportTarget: { type: 'vec3' }
  },
  init() {
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseEnter = this.handleMouseEnter.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.clearFuseTimer = this.clearFuseTimer.bind(this);
    this.triggerTeleport = this.triggerTeleport.bind(this);
    this.fuseTimer = null;
    this.pending = false;

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
    if (!fuseData?.fuse) return;

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
    if (this.pending) return;
    this.pending = true;
    hideTeleportReticle();

    requestTeleport({
      movesToOtherRoom: this.data.movesToOtherRoom,
      targetRoom: this.data.targetRoom,
      teleportTarget: this.data.teleportTarget
    })
      .catch(() => {})
      .finally(() => {
        this.pending = false;
      });
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

function initScene() {
  STATE.environmentRoot = document.getElementById('environment-root');
  STATE.lightingRoot = document.getElementById('lighting-root');
  STATE.rigEl = document.getElementById('rig');

  setupLights();
  setupRigControls();

  const initialRoom = Object.keys(ROOMS)[0];
  if (initialRoom) {
    loadRoom(initialRoom, { x: 0, y: DEFAULT_HEIGHT, z: 0 });
  } else {
    console.warn('No rooms defined in room-config.js');
  }
}

function setupLights() {
  if (!STATE.lightingRoot) return;
  clearChildren(STATE.lightingRoot);

  const ambient = document.createElement('a-entity');
  ambient.setAttribute('light', 'type: ambient; intensity: 0.5; color: #ffffff');
  STATE.lightingRoot.appendChild(ambient);

  const directional = document.createElement('a-entity');
  directional.setAttribute('light', 'type: directional; intensity: 0.8; castShadow: true');
  directional.setAttribute('position', '0 4 -2');
  STATE.lightingRoot.appendChild(directional);
}

function setupRigControls() {
  if (!STATE.rigEl) return;

  STATE.rigEl.setAttribute('camera', 'active: true');
  STATE.rigEl.setAttribute('look-controls', 'pointerLockEnabled: false; magicWindowTrackingEnabled: true');

  const cursor = STATE.rigEl.querySelector('[cursor]');
  if (cursor) {
    cursor.setAttribute('cursor', `fuse: true; fuseTimeout: ${DEFAULT_FUSE_TIMEOUT}`);
    cursor.setAttribute('raycaster', 'objects: .teleport-hotspot');
    setupTeleportReticle(cursor);
  } else {
    setupTeleportReticle(null);
  }
}

async function loadRoom(roomId, spawnPosition) {
  const config = ROOMS[roomId];
  if (!config) {
    console.warn(`Room "${roomId}" is not defined in room-config.js`);
    return;
  }

  if (!STATE.environmentRoot) return;

  if (STATE.modelEl && STATE.modelEl.parentNode) {
    STATE.modelEl.parentNode.removeChild(STATE.modelEl);
    STATE.modelEl = null;
  }

  const modelEntity = document.createElement('a-entity');
  modelEntity.setAttribute('gltf-model', config.glb);
  STATE.environmentRoot.appendChild(modelEntity);
  STATE.modelEl = modelEntity;

  await new Promise((resolve, reject) => {
    const onLoad = () => {
      modelEntity.removeEventListener('model-loaded', onLoad);
      modelEntity.removeEventListener('model-error', onError);
      resolve();
    };
    const onError = (evt) => {
      console.error(`Failed to load room model "${config.glb}"`, evt.detail?.error || evt);
      modelEntity.removeEventListener('model-loaded', onLoad);
      modelEntity.removeEventListener('model-error', onError);
      reject(evt.detail?.error || new Error('model load failed'));
    };
    modelEntity.addEventListener('model-loaded', onLoad);
    modelEntity.addEventListener('model-error', onError);
  }).catch(() => {});

  STATE.currentRoom = roomId;
  rebuildHotspotsForRoom(roomId);
  const targetPosition = spawnPosition || { x: 0, y: DEFAULT_HEIGHT, z: 0 };
  setRigPosition(targetPosition);
}

function rebuildHotspotsForRoom(roomId) {
  if (!STATE.environmentRoot) return;

  const existing = STATE.environmentRoot.querySelectorAll('.teleport-hotspot-wrapper');
  existing.forEach((node) => node.parentNode?.removeChild(node));

  const roomHotspots = TELEPORT_POINTS.filter((point) => point.room === roomId);
  roomHotspots.forEach((point) => {
    const wrapper = document.createElement('a-entity');
    wrapper.classList.add('teleport-hotspot-wrapper');
    const hotspotPosition = point.position || { x: 0, y: DEFAULT_HEIGHT, z: 0 };
    wrapper.setAttribute(
      'position',
      `${hotspotPosition.x} ${hotspotPosition.y ?? DEFAULT_HEIGHT} ${hotspotPosition.z}`
    );

    const color = point.color || '#008CFF';
    const teleportTarget = point.teleportTarget || point.position || { x: 0, y: DEFAULT_HEIGHT, z: 0 };

    const visualSphere = document.createElement('a-sphere');
    visualSphere.classList.add('teleport-visual');
    visualSphere.setAttribute('geometry', 'primitive: sphere; radius: 0.15');
    visualSphere.setAttribute('material', `color: ${color}; opacity: 0.85; shader: flat; transparent: true`);
    visualSphere.setAttribute('position', '0 0 0');

    if (point.label) {
      const label = document.createElement('a-entity');
      label.setAttribute(
        'text',
        `value: ${point.label}; align: center; side: double; color: #FFFFFF; width: 2`
      );
      label.setAttribute('position', '0 0.4 0');
      visualSphere.appendChild(label);
    }

    const collider = document.createElement('a-sphere');
    collider.classList.add('teleport-hotspot');
    collider.setAttribute('geometry', 'primitive: sphere; radius: 0.45');
    collider.setAttribute('material', 'color: #fff; opacity: 0; shader: flat; transparent: true');
    collider.setAttribute(
      'teleport-to',
      {
        movesToOtherRoom: !!point.movesToOtherRoom,
        targetRoom: point.targetRoom || '',
        teleportTarget: {
          x: teleportTarget.x,
          y: teleportTarget.y ?? DEFAULT_HEIGHT,
          z: teleportTarget.z
        }
      }
    );

    wrapper.appendChild(visualSphere);
    wrapper.appendChild(collider);
    STATE.environmentRoot.appendChild(wrapper);
  });
}

async function requestTeleport(options = {}) {
  const destination = options.teleportTarget || { x: 0, y: DEFAULT_HEIGHT, z: 0 };
  if (options.movesToOtherRoom) {
    if (!options.targetRoom) {
      console.warn('Teleport hotspot marked as room transfer but has no targetRoom.');
      return;
    }
    await loadRoom(options.targetRoom, destination);
  } else {
    await smoothTeleportTo(destination);
  }
}

function setupTeleportReticle(cursorEl) {
  if (teleportReticleState.cursorEl) {
    teleportReticleState.cursorEl.removeEventListener(
      'raycaster-intersection',
      teleportReticleState.intersectionHandler
    );
    teleportReticleState.cursorEl.removeEventListener(
      'raycaster-intersection-cleared',
      teleportReticleState.clearedHandler
    );
    teleportReticleState.cursorEl = null;
  }

  if (!cursorEl) {
    hideTeleportReticle();
    return;
  }

  let reticle = teleportReticleState.el;
  const environmentRoot = STATE.environmentRoot || document.getElementById('environment-root');
  if (!reticle) {
    reticle = document.createElement('a-ring');
    reticle.setAttribute('id', 'teleport-reticle');
    reticle.setAttribute('rotation', '-90 0 0');
    reticle.setAttribute('radius-inner', '0.05');
    reticle.setAttribute('radius-outer', '0.09');
    reticle.setAttribute('material', 'color: #39f; opacity: 0.75; shader: flat; transparent: true');
    reticle.setAttribute('visible', 'false');
    environmentRoot?.appendChild(reticle);
    teleportReticleState.el = reticle;
  }

  const intersectionHandler = (evt) => handleTeleportReticleIntersection(evt);
  const clearedHandler = () => hideTeleportReticle();

  cursorEl.addEventListener('raycaster-intersection', intersectionHandler);
  cursorEl.addEventListener('raycaster-intersection-cleared', clearedHandler);

  teleportReticleState.cursorEl = cursorEl;
  teleportReticleState.intersectionHandler = intersectionHandler;
  teleportReticleState.clearedHandler = clearedHandler;
}

function handleTeleportReticleIntersection(evt) {
  const intersections = evt.detail?.els || [];
  const hotspot = intersections.find((el) => el?.classList?.contains('teleport-hotspot'));
  if (!hotspot) {
    hideTeleportReticle();
    return;
  }
  updateTeleportReticlePosition(hotspot);
}

function updateTeleportReticlePosition(targetEl) {
  if (!teleportReticleState.el || !targetEl?.object3D) return;
  targetEl.object3D.getWorldPosition(teleportReticleState.tempPosition);
  const pos = teleportReticleState.tempPosition;
  teleportReticleState.el.setAttribute('position', `${pos.x} ${pos.y - 0.1} ${pos.z}`);
  teleportReticleState.el.setAttribute('visible', 'true');
}

function hideTeleportReticle() {
  if (teleportReticleState.el) {
    teleportReticleState.el.setAttribute('visible', 'false');
  }
}

function setRigPosition(position) {
  if (!STATE.rigEl) return;
  const { x, y, z } = position;
  STATE.rigEl.object3D.position.set(x, y, z);
  STATE.rigEl.setAttribute('position', `${x} ${y} ${z}`);
}

function smoothTeleportTo(target) {
  const rigEl = STATE.rigEl;
  if (!rigEl) return Promise.resolve();

  const rigObj = rigEl.object3D;
  teleportStart.copy(rigObj.position);
  teleportEnd.set(target.x, target.y, target.z);

  if (teleportAnimationFrame) {
    cancelAnimationFrame(teleportAnimationFrame);
    teleportAnimationFrame = null;
  }

  const startTime = performance.now();

  return new Promise((resolve) => {
    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / TELEPORT_ANIMATION_DURATION, 1);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

      teleportCurrent.copy(teleportStart).lerp(teleportEnd, eased);
      rigObj.position.copy(teleportCurrent);
      rigEl.setAttribute('position', `${teleportCurrent.x} ${teleportCurrent.y} ${teleportCurrent.z}`);

      if (t < 1) {
        teleportAnimationFrame = requestAnimationFrame(step);
      } else {
        teleportAnimationFrame = null;
        resolve();
      }
    };

    teleportAnimationFrame = requestAnimationFrame(step);
  });
}

function clearChildren(element) {
  while (element && element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

(function () {
  const DWELL_DURATION_MS = 2500;
  const DEFAULT_CAMERA_HEIGHT = 1.6;
  const MARKER_RADIUS = 0.35;
  const MARKER_VISUAL_HEIGHT = 0.05;

  const state = {
    sceneEl: null,
    cameraEl: null,
    environmentRoot: null,
    markers: [],
    raycaster: null,
    pointer: null,
    tempOrigin: null,
    tempDirection: null,
    dwellTarget: null,
    dwellStart: 0,
    gazeRaf: null,
    canvasClickHandler: null
  };

  function boot() {
    const start = () => {
      if (Array.isArray(window.TeleportPoints) && window.TeleportPoints.length > 0) {
        waitForScene();
      } else {
        console.warn('TeleportSystem: No teleport points defined. Update js/teleport-config.js to add destinations.');
      }
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      start();
    } else {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    }
  }

  function waitForScene() {
    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) {
      window.requestAnimationFrame(waitForScene);
      return;
    }

    state.sceneEl = sceneEl;
    const proceed = () => waitForCoreEntities();
    if (sceneEl.hasLoaded) {
      proceed();
    } else {
      sceneEl.addEventListener('loaded', proceed, { once: true });
    }
  }

  function waitForCoreEntities(attempt = 0) {
    state.cameraEl = document.getElementById('viewer-camera');
    state.environmentRoot = document.getElementById('environment-root');

    if (state.cameraEl && state.environmentRoot) {
      initializeTeleportSystem();
      return;
    }

    if (attempt > 120) {
      console.warn('TeleportSystem: Camera or environment root not found. Teleport will remain disabled.');
      return;
    }

    setTimeout(() => waitForCoreEntities(attempt + 1), 100);
  }

  function initializeTeleportSystem() {
    if (!ensureThreeHelpers()) {
      console.warn('TeleportSystem: THREE.js helpers unavailable.');
      return;
    }

    clearOldMarkers();
    createMarkers();
    attachVREvents();
    attachDesktopClicks();

    window.TeleportSystem = window.TeleportSystem || {};
    window.TeleportSystem.refreshMarkers = () => {
      clearOldMarkers();
      createMarkers();
    };
  }

  function ensureThreeHelpers() {
    if (!window.THREE) {
      return false;
    }

    state.raycaster = state.raycaster || new THREE.Raycaster();
    state.pointer = state.pointer || new THREE.Vector2();
    state.tempOrigin = state.tempOrigin || new THREE.Vector3();
    state.tempDirection = state.tempDirection || new THREE.Vector3();
    return !!state.raycaster && !!state.pointer && !!state.tempOrigin && !!state.tempDirection;
  }

  function clearOldMarkers() {
    state.markers.forEach((entry) => {
      if (entry.el && entry.el.parentNode) {
        entry.el.parentNode.removeChild(entry.el);
      }
    });
    state.markers = [];
  }

  function createMarkers() {
    const points = Array.isArray(window.TeleportPoints) ? window.TeleportPoints : [];
    points.forEach((point, index) => {
      const marker = document.createElement('a-entity');
      marker.classList.add('teleport-marker');
      marker.setAttribute('id', `teleport-marker-${index}`);

      const ring = document.createElement('a-circle');
      ring.setAttribute('radius', MARKER_RADIUS);
      ring.setAttribute('rotation', '-90 0 0');
      ring.setAttribute(
        'material',
        'color: #33c6ff; shader: standard; metalness: 0; roughness: 0.2; emissive: #1f89b7; emissiveIntensity: 0.6; opacity: 0.8'
      );
      marker.appendChild(ring);

      const inner = document.createElement('a-circle');
      inner.setAttribute('radius', MARKER_RADIUS * 0.45);
      inner.setAttribute('rotation', '-90 0 0');
      inner.setAttribute(
        'material',
        'color: #ffffff; shader: flat; opacity: 0.65; side: double'
      );
      marker.appendChild(inner);

      marker.setAttribute('position', `${point.position?.x ?? 0} ${MARKER_VISUAL_HEIGHT} ${point.position?.z ?? 0}`);

      state.environmentRoot.appendChild(marker);

      const target = {
        x: point.position?.x ?? 0,
        y: typeof point.position?.y === 'number' ? point.position.y : DEFAULT_CAMERA_HEIGHT,
        z: point.position?.z ?? 0
      };

      state.markers.push({ el: marker, target, name: point.name || `Teleport-${index + 1}` });

      marker.addEventListener('click', () => teleportTo(target));
    });
  }

  function attachVREvents() {
    if (!state.sceneEl) return;

    state.sceneEl.addEventListener('enter-vr', startGazeLoop);
    state.sceneEl.addEventListener('exit-vr', stopGazeLoop);

    if (state.sceneEl.is('vr-mode')) {
      startGazeLoop();
    }
  }

  function startGazeLoop() {
    if (state.gazeRaf) return;

    const loop = (time) => {
      runGazeCheck(time || performance.now());
      state.gazeRaf = window.requestAnimationFrame(loop);
    };
    state.gazeRaf = window.requestAnimationFrame(loop);
  }

  function stopGazeLoop() {
    if (state.gazeRaf) {
      window.cancelAnimationFrame(state.gazeRaf);
      state.gazeRaf = null;
    }
    resetDwell();
  }

  function runGazeCheck(time) {
    if (!state.cameraEl || !state.raycaster || state.markers.length === 0) {
      resetDwell();
      return;
    }

    state.cameraEl.object3D.getWorldPosition(state.tempOrigin);
    state.cameraEl.object3D.getWorldDirection(state.tempDirection);
    state.raycaster.set(state.tempOrigin, state.tempDirection);

    const hitEntry = getFirstMarkerHit(state.raycaster);
    if (!hitEntry) {
      resetDwell();
      return;
    }

    if (state.dwellTarget !== hitEntry) {
      state.dwellTarget = hitEntry;
      state.dwellStart = time;
      return;
    }

    if (time - state.dwellStart >= DWELL_DURATION_MS) {
      teleportTo(hitEntry.target);
      resetDwell();
    }
  }

  function resetDwell() {
    state.dwellTarget = null;
    state.dwellStart = 0;
  }

  function attachDesktopClicks() {
    if (!state.sceneEl) return;
    const canvas = state.sceneEl.canvas;
    if (!canvas) {
      state.sceneEl.addEventListener('render-target-loaded', attachDesktopClicks, { once: true });
      return;
    }

    if (state.canvasClickHandler) {
      canvas.removeEventListener('click', state.canvasClickHandler);
    }

    state.canvasClickHandler = (event) => {
      if (!state.cameraEl || !state.raycaster || state.markers.length === 0) return;

      const rect = canvas.getBoundingClientRect();
      state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const threeCamera = state.cameraEl.getObject3D('camera');
      if (!threeCamera) return;

      state.raycaster.setFromCamera(state.pointer, threeCamera);
      const hitEntry = getFirstMarkerHit(state.raycaster);
      if (hitEntry) {
        teleportTo(hitEntry.target);
      }
    };

    canvas.addEventListener('click', state.canvasClickHandler);
  }

  function getFirstMarkerHit(raycaster) {
    const objects = state.markers.map((entry) => entry.el.object3D);
    const intersections = raycaster.intersectObjects(objects, true);
    if (intersections.length === 0) {
      return null;
    }

    const hitEl = intersections[0].object.el;
    const markerEl =
      hitEl &&
      (state.markers.find((entry) => entry.el === hitEl)?.el ||
        (typeof hitEl.closest === 'function' ? hitEl.closest('.teleport-marker') : null));

    if (!markerEl) return null;
    return state.markers.find((entry) => entry.el === markerEl) || null;
  }

  function teleportTo(target) {
    if (!state.cameraEl || !target) return;
    const newY = typeof target.y === 'number' ? target.y : state.cameraEl.object3D.position.y;
    state.cameraEl.object3D.position.set(target.x, newY, target.z);
    state.cameraEl.setAttribute('position', `${target.x} ${newY} ${target.z}`);
  }

  boot();
})();

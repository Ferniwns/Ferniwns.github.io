(function () {
  const TELEPORT_DURATION_MS = 450;
  const EPSILON = 0.001;

  const config = window.TeleportConfig || {};
  const teleportPoints = Array.isArray(config.teleportPoints) ? config.teleportPoints : [];

  const state = {
    sceneEl: null,
    cameraEl: null,
    activePoint: null,
    animationFrame: null,
    animationStart: 0,
    startPosition: null,
    endPosition: null,
    listeners: new Set(),
    readyResolve: null
  };

  const readyPromise = new Promise((resolve) => {
    state.readyResolve = resolve;
  });

  function boot() {
    if (!window.THREE) {
      console.warn('TeleportSystem: THREE.js is required.');
      return;
    }

    if (teleportPoints.length === 0) {
      console.warn('TeleportSystem: No teleport points provided in teleport-config.js');
    }

    waitForScene();
  }

  function waitForScene() {
    const sceneEl = document.querySelector('a-scene');
    if (!sceneEl) {
      window.requestAnimationFrame(waitForScene);
      return;
    }

    state.sceneEl = sceneEl;
    const proceed = () => waitForCamera();

    if (sceneEl.hasLoaded) {
      proceed();
    } else {
      sceneEl.addEventListener('loaded', proceed, { once: true });
    }
  }

  function waitForCamera(attempt = 0) {
    state.cameraEl = document.getElementById('viewer-camera');
    if (state.cameraEl) {
      finalizeReady();
      return;
    }

    if (attempt > 200) {
      console.warn('TeleportSystem: viewer-camera not found.');
      finalizeReady();
      return;
    }

    setTimeout(() => waitForCamera(attempt + 1), 100);
  }

  function finalizeReady() {
    if (typeof state.readyResolve === 'function') {
      state.readyResolve();
      state.readyResolve = null;
    }
  }

  function notify(point) {
    state.listeners.forEach((cb) => {
      try {
        cb(point || null);
      } catch (err) {
        console.error('TeleportSystem listener error:', err);
      }
    });
  }

  function getPointByName(name) {
    return teleportPoints.find((point) => point?.name === name) || null;
  }

  function teleportToPoint(point) {
    if (!point || !state.cameraEl) {
      return Promise.resolve(false);
    }

    cancelAnimation();

    const start = state.cameraEl.object3D.position.clone();
    const target = new THREE.Vector3(
      typeof point.position?.x === 'number' ? point.position.x : start.x,
      typeof point.position?.y === 'number' ? point.position.y : start.y,
      typeof point.position?.z === 'number' ? point.position.z : start.z
    );

    if (start.distanceToSquared(target) <= EPSILON) {
      setCameraPosition(target);
      state.activePoint = point;
      notify(state.activePoint);
      return Promise.resolve(true);
    }

    state.animationStart = performance.now();
    state.startPosition = start;
    state.endPosition = target;
    state.activePoint = point;

    return new Promise((resolve) => {
      const step = (now) => {
        const elapsed = now - state.animationStart;
        const t = Math.min(elapsed / TELEPORT_DURATION_MS, 1);
        const eased = easeInOutQuad(t);

        const current = state.startPosition.clone().lerp(state.endPosition, eased);
        setCameraPosition(current);

        if (t >= 1) {
          state.animationFrame = null;
          notify(state.activePoint);
          resolve(true);
          return;
        }

        state.animationFrame = window.requestAnimationFrame(step);
      };

      state.animationFrame = window.requestAnimationFrame(step);
    });
  }

  function setCameraPosition(vec3) {
    if (!state.cameraEl) return;
    state.cameraEl.object3D.position.copy(vec3);
    state.cameraEl.setAttribute('position', `${vec3.x} ${vec3.y} ${vec3.z}`);
  }

  function cancelAnimation() {
    if (state.animationFrame) {
      window.cancelAnimationFrame(state.animationFrame);
      state.animationFrame = null;
    }
  }

  function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  function teleportToName(name) {
    const point = getPointByName(name);
    if (!point) return Promise.resolve(false);
    return teleportToPoint(point);
  }

  function onTeleport(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    state.listeners.add(callback);
    return () => state.listeners.delete(callback);
  }

  window.TeleportSystem = {
    ready: () => readyPromise,
    getPoints: () => teleportPoints.map((point) => ({ ...point })),
    teleportToName,
    teleportToPoint,
    getActivePoint: () => (state.activePoint ? { ...state.activePoint } : null),
    onTeleport
  };

  boot();
})();

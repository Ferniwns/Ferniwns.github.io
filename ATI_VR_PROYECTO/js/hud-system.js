(function () {
  const GAZE_DWELL_MS = 2500;
  const FACING_SMOOTHING = 0.12;

  const config = window.TeleportConfig || {};
  const hudConfig = config.hud || {};

  const state = {
    sceneEl: null,
    cameraEl: null,
    environmentRoot: null,
    hudRoot: null,
    layout: null,
    buttonEntries: [],
    iconEntries: [],
    raycaster: null,
    pointer: null,
    gazeOrigin: new THREE.Vector3(),
    gazeDirection: new THREE.Vector3(),
    dwellTarget: null,
    dwellStart: 0,
    gazeRaf: null,
    facingRaf: null,
    facingData: {
      cameraPos: new THREE.Vector3(),
      hudPos: new THREE.Vector3(),
      targetQuat: new THREE.Quaternion(),
      lookMatrix: new THREE.Matrix4(),
      up: new THREE.Vector3(0, 1, 0)
    },
    unsubscribeTeleport: null,
    canvasClickHandler: null
  };

  function boot() {
    if (!window.TeleportSystem || !window.HUDStyles || !window.HUDElements || !window.THREE) {
      console.warn('HUD System requires TeleportSystem, HUDStyles, HUD elements, and THREE.js.');
      return;
    }

    state.raycaster = new THREE.Raycaster();
    state.pointer = new THREE.Vector2();

    TeleportSystem.ready().then(() => waitForScene());
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
      initializeHud();
      return;
    }

    if (attempt > 120) {
      console.warn('HUD System: Unable to find viewer-camera or environment-root.');
      return;
    }

    setTimeout(() => waitForCoreEntities(attempt + 1), 100);
  }

  function initializeHud() {
    buildLayout();
    buildHud();
    attachSceneEvents();
    startFacingLoop();

    state.unsubscribeTeleport = TeleportSystem.onTeleport((point) => {
      if (point?.name) {
        setActiveButton(point.name);
      }
    });
  }

  function buildLayout() {
    const base = window.HUDStyles;
    const dims = hudConfig.dimensions || {};

    state.layout = {
      panelWidth: typeof dims.width === 'number' ? dims.width : base.panel.width,
      panelHeight: typeof dims.height === 'number' ? dims.height : base.panel.height,
      panelPadding: base.panel.padding,
      iconSize: base.icons.size,
      buttonWidth: base.buttons.width,
      buttonHeight: base.buttons.height,
      buttonSpacing: base.buttons.spacing,
      buttonBottomOffset: base.buttons.bottomOffset,
      progressHeight: base.progress.height,
      progressGap: base.progress.gap
    };
  }

  function buildHud() {
    const anchorPosition = hudConfig.anchorPosition || { x: 0, y: 2, z: -2 };
    state.hudRoot = HUDElements.createHudRoot(anchorPosition);
    state.environmentRoot.appendChild(state.hudRoot);

    const iconData = hudConfig.icons || {};
    ['left', 'right'].forEach((slot) => {
      const iconConfig = iconData[slot];
      const icon = HUDElements.createTopIcon(slot, iconConfig, state.layout);
      if (icon) {
        icon.wrapper.dataset.iconSlot = slot;
        icon.wrapper.dataset.iconName = iconConfig?.name || slot;
        icon.state = { active: false, config: iconConfig };
        state.hudRoot.appendChild(icon.wrapper);
        state.iconEntries.push(icon);
      }
    });

    const points = TeleportSystem.getPoints();
    if (points.length === 0) {
      console.warn('HUD System: No teleport points to display.');
      return;
    }

    points.forEach((point, index) => {
      const button = HUDElements.createTeleportButton(point, index, points.length, state.layout);
      button.point = point;
      button.state = { active: false };
      state.hudRoot.appendChild(button.wrapper);
      state.buttonEntries.push(button);
    });
  }

  function attachSceneEvents() {
    if (!state.sceneEl) return;

    state.sceneEl.addEventListener('enter-vr', handleEnterVR);
    state.sceneEl.addEventListener('exit-vr', handleExitVR);

    if (state.sceneEl.is('vr-mode')) {
      handleEnterVR();
    }

    if (state.sceneEl.canvas) {
      bindDesktopClick();
    } else {
      state.sceneEl.addEventListener('render-target-loaded', bindDesktopClick, { once: true });
    }
  }

  function bindDesktopClick() {
    const canvas = state.sceneEl?.canvas;
    if (!canvas) return;

    if (state.canvasClickHandler) {
      canvas.removeEventListener('click', state.canvasClickHandler);
    }

    state.canvasClickHandler = (event) => {
      const camera = state.cameraEl?.getObject3D('camera');
      if (!camera || !state.raycaster) return;

      const rect = canvas.getBoundingClientRect();
      state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      state.raycaster.setFromCamera(state.pointer, camera);

      const icon = intersectIcon();
      if (icon) {
        toggleIcon(icon);
        return;
      }

      const button = intersectButton();
      if (button) {
        selectTeleportButton(button);
      }
    };

    canvas.addEventListener('click', state.canvasClickHandler);
  }

  function handleEnterVR() {
    startGazeLoop();
  }

  function handleExitVR() {
    stopGazeLoop();
    resetDwell();
  }

  function startGazeLoop() {
    if (state.gazeRaf) return;

    const step = (time) => {
      runGazeSelection(time || performance.now());
      state.gazeRaf = window.requestAnimationFrame(step);
    };

    state.gazeRaf = window.requestAnimationFrame(step);
  }

  function stopGazeLoop() {
    if (state.gazeRaf) {
      window.cancelAnimationFrame(state.gazeRaf);
      state.gazeRaf = null;
    }
  }

  function runGazeSelection(time) {
    if (!state.cameraEl || state.buttonEntries.length === 0) {
      resetDwell();
      return;
    }

    state.cameraEl.object3D.getWorldPosition(state.gazeOrigin);
    state.cameraEl.object3D.getWorldDirection(state.gazeDirection);
    state.raycaster.set(state.gazeOrigin, state.gazeDirection);

    const button = intersectButton();
    if (!button) {
      resetDwell();
      return;
    }

    if (state.dwellTarget !== button) {
      resetProgressBars();
      state.dwellTarget = button;
      state.dwellStart = time;
      updateProgress(button, 0);
      return;
    }

    const progress = Math.min((time - state.dwellStart) / GAZE_DWELL_MS, 1);
    updateProgress(button, progress);

    if (progress >= 1) {
      selectTeleportButton(button);
      resetDwell();
    }
  }

  function resetDwell() {
    state.dwellTarget = null;
    state.dwellStart = 0;
    resetProgressBars();
  }

  function resetProgressBars() {
    state.buttonEntries.forEach((entry) => {
      entry.progress.setAttribute('visible', 'false');
    });
  }

  function updateProgress(entry, ratio) {
    entry.progress.setAttribute('visible', 'true');
    const width = entry.width * ratio;
    entry.progress.setAttribute('width', width <= 0 ? 0.001 : width);
    const offset = -entry.width / 2 + width / 2;
    entry.progress.object3D.position.x = offset;
  }

  function intersectButton() {
    if (!state.raycaster) return null;
    const objects = state.buttonEntries.map((entry) => entry.wrapper.object3D);
    const intersections = state.raycaster.intersectObjects(objects, true);
    if (!intersections.length) return null;

    const hitEl = intersections[0].object.el;
    return (
      state.buttonEntries.find(
        (entry) =>
          entry.wrapper === hitEl ||
          entry.wrapper.contains(hitEl) ||
          entry.plane === hitEl ||
          entry.progress === hitEl
      ) || null
    );
  }

  function intersectIcon() {
    if (!state.raycaster) return null;
    const objects = state.iconEntries.map((entry) => entry.wrapper.object3D);
    const intersections = state.raycaster.intersectObjects(objects, true);
    if (!intersections.length) return null;

    const hitEl = intersections[0].object.el;
    return (
      state.iconEntries.find(
        (entry) => entry.wrapper === hitEl || entry.wrapper.contains(hitEl) || entry.plane === hitEl
      ) || null
    );
  }

  function toggleIcon(entry) {
    if (!entry?.state || !entry.state.config) return;
    entry.state.active = !entry.state.active;
    const texture = entry.state.active ? entry.state.config.active : entry.state.config.normal;
    entry.plane.setAttribute('material', `shader: flat; transparent: true; alphaTest: 0.05; src: url(${texture || ''})`);
  }

  function selectTeleportButton(entry) {
    TeleportSystem.teleportToName(entry.point.name);
  }

  function setActiveButton(name) {
    state.buttonEntries.forEach((entry) => {
      const isActive = entry.point.name === name;
      if (entry.state.active !== isActive) {
        entry.state.active = isActive;
        const texture = isActive ? entry.point.iconActive : entry.point.iconNormal;
        entry.plane.setAttribute(
          'material',
          `shader: flat; transparent: true; alphaTest: 0.05; src: url(${texture || ''})`
        );
      }
    });
  }

  function startFacingLoop() {
    if (state.facingRaf || !state.hudRoot || !state.cameraEl) return;

    const loop = () => {
      updateHudFacing();
      state.facingRaf = window.requestAnimationFrame(loop);
    };

    state.facingRaf = window.requestAnimationFrame(loop);
  }

  function updateHudFacing() {
    if (!state.hudRoot || !state.cameraEl) return;

    const hudObj = state.hudRoot.object3D;
    const { cameraPos, hudPos, targetQuat, lookMatrix, up } = state.facingData;

    state.cameraEl.object3D.getWorldPosition(cameraPos);
    hudObj.getWorldPosition(hudPos);

    lookMatrix.lookAt(hudPos, cameraPos, up);
    targetQuat.setFromRotationMatrix(lookMatrix);

    hudObj.quaternion.slerp(targetQuat, FACING_SMOOTHING);
  }

  boot();
})();

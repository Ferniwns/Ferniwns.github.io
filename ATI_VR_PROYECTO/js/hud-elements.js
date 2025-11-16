(function () {
  const styles = window.HUDStyles || {};

  function createHudRoot(anchorPosition) {
    const root = document.createElement('a-entity');
    root.setAttribute('id', 'hud-root');

    const pos = anchorPosition || { x: 0, y: 2, z: -2 };
    root.setAttribute('position', `${pos.x || 0} ${pos.y || 0} ${pos.z || 0}`);
    root.classList.add('hud-root');
    return root;
  }

  function createTopIcon(slot, iconConfig, layout) {
    if (!iconConfig) return null;

    const wrapper = document.createElement('a-entity');
    wrapper.classList.add('hud-icon', `hud-icon-${slot}`);

    const width = layout.iconSize;
    const height = layout.iconSize;
    const xSign = slot === 'left' ? -1 : 1;
    const padding = layout.panelPadding;
    const halfWidth = layout.panelWidth / 2 - padding - width / 2;
    const x = xSign * halfWidth;
    const y = layout.panelHeight / 2 - padding - height / 2;

    wrapper.setAttribute('position', `${x} ${y} 0`);

    const plane = document.createElement('a-plane');
    plane.setAttribute('width', width);
    plane.setAttribute('height', height);
    plane.setAttribute('material', `shader: flat; transparent: true; alphaTest: 0.05; src: url(${iconConfig.normal || ''})`);
    wrapper.appendChild(plane);

    return { wrapper, plane };
  }

  function createTeleportButton(point, index, total, layout) {
    const wrapper = document.createElement('a-entity');
    wrapper.classList.add('hud-teleport-button');

    const width = layout.buttonWidth;
    const height = layout.buttonHeight;
    const spacing = layout.buttonSpacing;
    const totalWidth = total * width + (total - 1) * spacing;
    const startX = -totalWidth / 2 + width / 2;
    const x = startX + index * (width + spacing);
    const y = -layout.panelHeight / 2 + height / 2 + layout.buttonBottomOffset;

    wrapper.setAttribute('position', `${x} ${y} 0`);

    const plane = document.createElement('a-plane');
    plane.setAttribute('width', width);
    plane.setAttribute('height', height);
    plane.setAttribute('material', `shader: flat; transparent: true; alphaTest: 0.05; src: url(${point.iconNormal || ''})`);
    plane.classList.add('hud-teleport-button-surface');
    wrapper.appendChild(plane);

    const progress = document.createElement('a-plane');
    progress.setAttribute('width', width);
    progress.setAttribute('height', layout.progressHeight);
    progress.setAttribute(
      'material',
      'shader: flat; color: #33c6ff; opacity: 0.9; transparent: true; alphaTest: 0.05'
    );
    progress.setAttribute('position', `0 ${-height / 2 - layout.progressGap} 0.001`);
    progress.setAttribute('visible', 'false');
    progress.classList.add('hud-progress-indicator');
    wrapper.appendChild(progress);

    return { wrapper, plane, progress, width, height };
  }

  window.HUDElements = {
    createHudRoot,
    createTopIcon,
    createTeleportButton
  };
})();

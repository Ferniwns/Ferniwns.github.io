/* Centralized HUD + teleport configuration.
 * Update icon paths and teleport coordinates here without touching the logic files.
 */
window.TeleportConfig = {
  hud: {
    anchorPosition: { x: 0, y: 2.1, z: -2.6 },
    dimensions: { width: 2.8, height: 1.45 },
    icons: {
      left: {
        name: 'info',
        normal: './assets/icons/info.png',
        active: './assets/icons/info-active.png'
      },
      right: {
        name: 'map',
        normal: './assets/icons/map.png',
        active: './assets/icons/map-active.png'
      }
    }
  },
  teleportPoints: [
    {
      name: 'Entrance',
      label: 'Entrance',
      iconNormal: './assets/icons/tp-entrance.png',
      iconActive: './assets/icons/tp-entrance-active.png',
      position: { x: -1.34, y: 1.6, z: 5.23 }
    },
    {
      name: 'CentralHall',
      label: 'Central Hall',
      iconNormal: './assets/icons/tp-central.png',
      iconActive: './assets/icons/tp-central-active.png',
      position: { x: 1.54, y: 1.6, z: 10.0 }
    },
    {
      name: 'SideWing',
      label: 'Side Wing',
      iconNormal: './assets/icons/tp-side.png',
      iconActive: './assets/icons/tp-side-active.png',
      position: { x: -6.77, y: 1.6, z: 3.64 }
    }
  ]
};

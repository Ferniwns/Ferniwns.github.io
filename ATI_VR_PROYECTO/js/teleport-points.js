export const TELEPORT_POINTS = [
  {
    room: 'uno',
    position: { x: -3, y: 1.6, z: 3 }, //Z VA INVERSO!!
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF7A18',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'dos'
  },
  {
    room: 'dos',
    position: { x: 0.5, y: 1, z: 1.5 },
    teleportTarget: { x: 0, y: 1.6, z: 0  },
    color: '#FF7A18',
    label: 'Hallway',
    movesToOtherRoom: true,
    targetRoom: 'tres'
  },
  {
    room: 'tres',
    position: { x: -5.4, y: 1.6, z: 1 },
    teleportTarget: { x: 0, y: 1.6, z: 0  },
    color: '#FF7A18',
    label: 'Hallway',
    movesToOtherRoom: true,
    targetRoom: 'cuatro'
  },  
  {
    room: 'cuatro',
    position: { x: -2, y: -4.2, z: 1.6 },
    teleportTarget: { x: 0, y: 1.6, z: 0  },
    color: '#FF7A18',
    label: 'Hallway',
    movesToOtherRoom: true,
    targetRoom: 'cinco'
  },
  {
    room: 'cinco',
    position: { x: 1, y: 1.6, z: 1 },
    teleportTarget: { x: 0, y: 1.6, z: 0  },
    color: '#FF7A18',
    label: 'Hallway',
    movesToOtherRoom: true,
    targetRoom: 'seis'
  },
  {
    room: 'seis',
    position: { x: 1, y: 1.6, z: 1 },
    teleportTarget: { x: 0, y: 1.6, z: 0  },
    color: '#FF7A18',
    label: 'Hallway',
    movesToOtherRoom: true,
    targetRoom: 'uno'
  },
];

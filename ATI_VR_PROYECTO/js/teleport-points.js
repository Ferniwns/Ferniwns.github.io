export const TELEPORT_POINTS = [
  {
    room: 'gallery1',
    position: { x: 0, y: 1.6, z: -3 },
    teleportTarget: { x: 0, y: 1.6, z: -5 },
    color: '#008CFF',
    label: 'Entrance',
    movesToOtherRoom: false
  },
  {
    room: 'gallery1',
    position: { x: 5, y: 1.6, z: -2 },
    teleportTarget: { x: 7, y: 1.6, z: -2 },
    color: '#FF7A18',
    label: 'Hallway',
    movesToOtherRoom: true,
    targetRoom: 'gallery2'
  },
  {
    room: 'gallery2',
    position: { x: -4, y: 1.6, z: -1 },
    teleportTarget: { x: -6, y: 1.6, z: -4 },
    color: '#3AD4FF',
    label: 'Side Wing',
    movesToOtherRoom: true,
    targetRoom: 'gallery1'
  }
];

export const TELEPORT_POINTS = [
  {
    room: 'initial', //INITIAL TP
    position: { x: -3.168, y: 1.7, z: 2.521 }, //Z VA INVERSO y es Y!!
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery1_v1'
  },

  //GALLERY 1
  {
    room: 'gallery1_v1', //TP TO GALLERY 2 INITIAL
    position: { x: -1.325, y: 0.5, z: 9.644 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery2_v1'
  },
  {
    room: 'gallery1_v2', //TP TO GALLERY 2 WALKMAN
    position: { x: -2.6, y: 1.5, z: 12.148 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery2_v1'
  },
  {
    room: 'gallery1_v3', //TP TO GALLERY 2 PS1
    position: { x: -2.537, y: 1.5, z: 5.356 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery2_v1'
  },
  {
    room: 'gallery1_v4', //TP TO GALLERY 2 README
    position: { x: -2.177, y: 1, z: 1.891 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery2_v1'
  },
  {
    room: 'gallery1_v1', //TP TO GALLERY 1 INTIAL TO WALKMAN
    position: { x: 1.214, y: 1.1, z: -1.74 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#0000FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery1_v2'
  },
  {
    room: 'gallery1_v1', //TP TO GALLERY 1 INITIAL TO  PS1
    position: { x: 1.214, y: 1.1, z: 3.214 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#0000FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery1_v3'
  },
  {
    room: 'gallery1_v2', //TP TO GALLERY 1 WALKMAN TO PS1
    position: { x: 0, y: 0.6, z: 5.732 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#0000FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery1_v3'
  },
  {
    room: 'gallery1_v3', //TP TO GALLERY 1 PS1 TO WALKMAN
    position: { x: 0, y: 0.5, z: -6.489 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#0000FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery1_v2'
  },
  {
    room: 'gallery1_v3', //TP TO GALLERY 1 PS1 TO README
    position: { x: 0, y: 1.5, z: 4.6 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#0000FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery1_v4'
  },
  {
    room: 'gallery1_v4', //TP TO GALLERY 1 README TO PS1
    position: { x: -0, y: 1.2, z: -4 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#0000FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery1_v3'
  },

  //GALLERY 2
  {
    room: 'gallery2_v1', //TP GALLERY 2 TO 3
    position: { x: -2.824, y: 0.8, z: 0.418 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery3_v1'
  },

  //GALLERY 3
  {
    room: 'gallery3_v1', //TP GALLERY 3 v1 TO 4
    position: { x: -1.174, y: 1.3, z: 3.5 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery4_v1'
  },
  {
    room: 'gallery3_v2', //TP GALLERY 3 v2 TO 4
    position: { x: -7, y: 1.1, z: 2 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery4_v1'
  },
  {
    room: 'gallery3_v1', //TP GALLERY 3 v1 TO v2
    position: { x: 6.642, y: 1.8, z: 1.284 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#0000FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery3_v2'
  },
  {
    room: 'gallery3_v2', //TP GALLERY 3 v2 TO v1
    position: { x: -7, y: 1.1, z: 1 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#0000FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'gallery3_v1'
  },
  //GALLERY 4
  {
    room: 'gallery4_v1', //TP GALLERY 4 TO FINALE
    position: { x: -4, y: 2, z: -1 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'finale'
  },
  //FINALE
  {
    room: 'finale', //TP FINALE TO INITIAL
    position: { x: 2.8, y: 1.5, z: -1.5 },
    teleportTarget: { x: 0, y: 1.6, z: 0 },
    color: '#FF00FF',
    label: '',
    movesToOtherRoom: true,
    targetRoom: 'initial'
  },
];

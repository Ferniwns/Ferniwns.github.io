# WebXR Multi-Room Gallery

This project is a fully data-driven WebXR experience built on A-Frame. Every room, hotspot, and teleport action is declared in simple JSON-like files, so you can add new spaces or rearrange existing ones without touching the core logic.

The app loads GLB rooms on demand, shows only the hotspots relevant to the current room, and keeps teleports stateless—so the user can jump between rooms or move inside the same room without soft-locking.

---

## 1. Project Structure

| Path | Description |
| ---- | ----------- |
| `index.html` | A-Frame entry point. Defines the scene, assets, and the camera rig with gaze cursor. |
| `css/style.css` | UI overlay styling for the instructions banner. |
| `assets/models/` | Place one GLB per room here (e.g., `gallery1.glb`). The loader fetches these based on `room-config.js`. |
| `assets/textures/` | Shared textures (floors, walls, artwork) used by fallback geometry or GLB materials. |
| `js/room-config.js` | Maps room IDs to GLB files. This is the only place you reference model paths. |
| `js/teleport-points.js` | The complete hotspot metadata: room, label, color, local teleports, room transfers, and spawn positions. |
| `js/main.js` | Core runtime: room loader, hotspot builder, teleport-to component, promise-based locomotion, and reticle logic. |

---

## 2. Adding or Modifying Rooms

### room-config.js

```javascript
export const ROOMS = {
  gallery1: { glb: './assets/models/gallery1.glb' },
  gallery2: { glb: './assets/models/gallery2.glb' },
  gallery3: { glb: './assets/models/gallery3.glb' }
};
```

- **Key** (`gallery1`, etc.) is the room ID used everywhere else.
- **`glb`** is the path to the model file. Keep paths relative to the project root.

#### Registering a new room

1. Drop `atrium.glb` inside `assets/models/`.
2. Add it to `room-config.js`:

   ```javascript
   export const ROOMS = {
     ...,
     atrium: { glb: './assets/models/atrium.glb' }
   };
   ```

3. Define hotspots in `teleport-points.js` with `room: 'atrium'`.

**Naming tips**

- Use simple, lowercase room IDs with no spaces.
- Keep GLB filenames consistent with the room ID to avoid confusion.
- Remove unused GLBs to keep the repo lean.

---

## 3. Adding or Modifying Teleport Hotspots

### Data Model (`teleport-points.js`)

Each hotspot is a plain object:

```javascript
{
  id: 'entrance',              // optional but helpful for debugging
  room: 'gallery1',            // which room this hotspot belongs to
  position: { x: 0, y: 1.6, z: -3 },   // visual sphere location INSIDE the current room
  color: '#008CFF',            // optional; defaults to #008CFF
  label: 'Entrance',           // optional text above the sphere
  movesToOtherRoom: false,     // true when this hotspot loads another room
  targetRoom: 'gallery2',      // required when movesToOtherRoom is true
  teleportTarget: { x: 0, y: 1.6, z: -5 } // spawn point INSIDE the new room
}
```

#### Example scenarios

- **Same-room teleport**

  ```javascript
  {
    id: 'center',
    room: 'gallery1',
    position: { x: 2, y: 1.6, z: 1 },
    color: '#33AAFF',
    label: 'Center Platform',
    movesToOtherRoom: false,
    teleportTarget: { x: 4, y: 1.6, z: 2 }
  }
  ```

- **Room switch**

  ```javascript
  {
    id: 'to-gallery2',
    room: 'gallery1',
    position: { x: 5, y: 1.6, z: -2 },
    color: '#FF7A18',
    label: 'Go to Gallery 2',
    movesToOtherRoom: true,
    targetRoom: 'gallery2',
    teleportTarget: { x: 1, y: 1.6, z: -3 }
  }
  ```

- **Custom color & label only**

  ```javascript
  {
    id: 'sculpture',
    room: 'gallery2',
    position: { x: -3, y: 1.6, z: 4 },
    color: '#2EE6D6',
    label: 'Sculpture View',
    movesToOtherRoom: false,
    teleportTarget: { x: -5, y: 1.6, z: 4 }
  }
  ```

**Hotspot visibility**  
Only hotspots whose `room` matches the currently loaded room are instantiated. When you switch rooms, the loader wipes the old hotspots and rebuilds the new set automatically.

---

## 4. Dynamic Room Loading

### `loadRoom(roomId)`

1. Removes the previous GLB entity from the scene.
2. Loads the GLB defined in `ROOMS[roomId].glb`.
3. Rebuilds only the hotspots where `hotspot.room === roomId`.
4. Moves the camera rig to the provided spawn position.

### Teleport targets

When you define `teleportTarget`, you’re specifying the spawn coordinates **inside the destination room**. This ensures that jumping between rooms always places the visitor at the precise location you choose.

### Promise-based transitions

Both GLB loading and camera motion are awaited via Promises. The system never starts a new teleport until the previous one resolves, eliminating race conditions or soft-locks.

---

## 5. Teleport System

### `teleport-to` component

- Lives on the invisible collider child of each hotspot.
- Reads `movesToOtherRoom`, `targetRoom`, and `teleportTarget` from its schema.
- Responds to both click events and gaze fuse (mouseenter + timeout).
- Forwards every action to `requestTeleport(...)`.

### Stateless logic

- No global cooldowns or mutable flags.
- Each component instance tracks its own fuse timer and pending state.
- Once the Promise resolves (either room load or smooth teleport), the hotspot is ready again.

### Colliders only

- The visible sphere is decorative.
- The hidden sphere (`.teleport-hotspot`) is the only raycast target, ensuring precise gaze detection even with labels or other child elements.

---

## 6. Organizing GLB Files

**Folder**: `assets/models/`

**Recommended naming**: `gallery1.glb`, `gallery2.glb`, `atrium.glb`. Keep it short, lowercase, and unique.

**Performance guidelines**

- Optimize meshes: limit triangle count where possible.
- Reduce texture resolution (2–4 K max) and reuse materials.
- Use Draco or Meshopt compression before exporting GLBs.
- Bake lighting/shadows to textures to avoid expensive real-time lighting.

---

## 7. World Reticle

- The gaze cursor’s raycaster emits `raycaster-intersection` events.
- When a `.teleport-hotspot` is hit, a ring reticle is positioned near the hotspot and shown.
- When cleared, the reticle hides immediately.
- In VR or Cardboard, the reticle gives the user a precise “landing marker” that updates smoothly with head movement.

---

## 8. Setup & Usage

- **Browsers**: Chrome or Edge (desktop). For mobile/VR, Chrome or Edge on Android with WebXR support.
- **Run locally**:
  1. `cd ATI_VR_PROYECTO`
  2. Start a static server (e.g., `npx http-server .`, `python -m http.server`, or VS Code Live Server).
  3. Visit `http://localhost:8080` (or your port).
- **Cardboard/VR**:
  - Use the WebXR “Enter VR” button.
  - Grant motion sensor permissions when prompted.
  - Ensure HTTPS (or `localhost`) for sensor access.

---

## 9. Additional Notes

- **Optimization**:
  - Compress GLBs (Draco/Meshopt), compress textures (Basis/ETC).
  - Remove unused nodes before exporting.
  - Keep GLB sizes as small as possible for faster streaming.
- **Extensibility**:
  - Add more rooms by updating `ROOMS` and dropping GLBs in `assets/models/`.
  - Chain hotspots across multiple rooms to create guided tours.
  - Extend hotspots with new metadata (audio triggers, UI panels, etc.)—the architecture is ready for more fields if you expand the components.

Enjoy building immersive, modular WebXR tours with dynamic rooms and frictionless teleportation!

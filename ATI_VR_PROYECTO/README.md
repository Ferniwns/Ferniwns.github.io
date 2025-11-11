# WebXR Art Gallery

Fully static A-Frame powered art gallery that runs straight from `index.html` on desktop and mobile browsers (including Cardboard/VR) with no build steps.

## Features
- Auto-loads `./assets/models/gallery.glb` if present, otherwise generates a procedural gallery with walls, floor, lights, and framed paintings.
- Uses textures from `./assets/textures/` for walls, floor, and artwork (`cuadro1.jpg`, `cuadro2.jpg`).
- Optional panoramic background from `./assets/sky/sky.jpg`.
- Desktop controls: mouse + WASD. Mobile controls: gyroscope look (Cardboard ready).
- Instruction overlay reminds users how to look around and enter VR.

## Project Structure
```
ATI_VR_PROYECTO/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
└── assets/
    ├── models/
    │   └── gallery.glb          (optional)
    ├── textures/
    │   ├── cuadro1.jpg
    │   ├── cuadro2.jpg
    │   ├── floor.jpg
    │   └── wall.jpg
    └── sky/
        └── sky.jpg              (optional)
```

## Customizing Assets
- **Gallery model**: Replace `assets/models/gallery.glb` with your own GLB/GLTF scene. Keep the filename identical or update `MODEL_PATH` inside `js/main.js`.
- **Paintings**: Swap `assets/textures/cuadro1.jpg` and `cuadro2.jpg` for any 2D artwork. Adjust painting sizes/positions in `createPaintings()` within `js/main.js` as needed.
- **Materials**: Replace `assets/textures/floor.jpg` and `wall.jpg` to match your desired venue.
- **Skybox**: Place a panoramic JPG inside `assets/sky/sky.jpg` to wrap the entire scene with your image.

All paths are relative, so you can drag-and-drop replacements without touching the HTML.

## Running Locally
1. Download or clone this folder onto your machine.
2. Double-click `index.html` (or open it via **File → Open** inside Chrome/Firefox/Edge).
3. Allow motion sensor permissions on mobile when prompted to enable gyroscope look controls.

No Node.js, npm, or local server is required.

## Publishing Online
You only need to upload the folder contents to a static host:

- **GitHub Pages**
  1. Create a new GitHub repo and push/commit the files.
  2. Enable Pages (Settings → Pages → Branch: `main`, folder: `/root`).
  3. Wait for the deploy URL and open it on desktop or mobile.

- **Vercel / Netlify**
  1. Create a new project and drag the folder into their upload UI, or connect your Git repo.
  2. Deploy using default static settings (no build command).

Any host that serves static files over HTTPS (including Vercel’s drag-and-drop) works.

## Browser & VR Support
- Tested with latest Chrome, Firefox, and Edge on desktop.
- Mobile browsers must support WebXR / DeviceOrientation (Chrome for Android, Firefox Reality, Oculus Browser, etc.).
- **HTTPS is required** on mobile for VR and sensor access. Local `file://` works for quick previews on desktop, but use HTTPS hosting for gyroscope + VR button functionality.

## Troubleshooting
- **Black textures / missing images**: Ensure texture files remain in `assets/textures/` with the same filenames referenced in HTML.
- **Gyroscope not working**: Reload the page and accept the motion permission dialog. iOS/Safari requires enabling Motion & Orientation in Settings.
- **Model not loading**: Verify your GLB is named `gallery.glb` and valid. If it fails, the app automatically falls back to the procedural gallery.

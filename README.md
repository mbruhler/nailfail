# Nailfail

A small, local-first desktop app for macOS that detects nail biting using your
webcam — and interrupts you when it catches you.

It runs entirely on your machine. No video, snapshots, or raw frames are ever
saved or sent anywhere.

## Performance

App consumes about 700MB of RAM and sits on CPU - this is due to the live inspection of human in front of the camera

## Design choices

App uses code (available in Settings) that prevents to close the app by mistake.
There is a siren sound when user bites his nails, you can lower the volume to 0% to mute it and leave just fullscreen overlay

## Download

Grab the latest signed and notarized `.dmg` from the
[**Releases**](../../releases) page, open it, and drag **Nailfail** into your
Applications folder. Launch it and allow camera access when prompted.

## What it does

- Uses your camera locally via `getUserMedia`.
- Loads [MediaPipe](https://ai.google.dev/edge/mediapipe) face and hand
  landmark models bundled in `public/models`.
- Runs a temporal heuristic detector to recognize hand-to-mouth nail biting.
- Slams a fullscreen overlay over your screen as an interruption when it
  catches you (dismissible with a click or key press).
- Lives in the menu-bar tray; quitting requires typing a randomly generated
  exit code so you can't quit on reflex mid-bite.
- Saves nothing. Everything happens on-device.

## Privacy

Nailfail never records, stores, or transmits any camera data. Frames are
processed in memory for landmark detection and discarded immediately.

## Build from source

Requires [Rust](https://www.rust-lang.org/tools/install) and Node.js 20+.

```bash
npm install   # also downloads MediaPipe models + copies wasm assets
npm start     # run the desktop app in dev mode
```

The first run takes a while because Rust compiles the Tauri shell.

To produce a release build locally:

```bash
npm run build:desktop
```

The signed `.dmg` is produced automatically in CI — see
[`.github/workflows/release.yml`](.github/workflows/release.yml). Pushing a
`v*` tag builds, signs, notarizes, and publishes a GitHub Release.

## Tech

Tauri v2 · React · TypeScript · MediaPipe Tasks Vision · Rust (AVFoundation for
camera permission handling on macOS).

## License

[MIT](LICENSE)

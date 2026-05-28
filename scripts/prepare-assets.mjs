import { createWriteStream } from "node:fs";
import { cp, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDir = join(root, "public");

const assets = [
  {
    name: "Face Landmarker model",
    target: join(publicDir, "models", "face_landmarker.task"),
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  },
  {
    name: "Hand Landmarker model",
    target: join(publicDir, "models", "hand_landmarker.task"),
    url: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  },
];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function download(url, target) {
  await mkdir(dirname(target), { recursive: true });

  await new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed ${response.statusCode}: ${url}`));
          response.resume();
          return;
        }

        const file = createWriteStream(target);
        response.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  const wasmSource = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
  const wasmTarget = join(publicDir, "mediapipe", "wasm");
  await mkdir(wasmTarget, { recursive: true });
  await cp(wasmSource, wasmTarget, { recursive: true });

  for (const asset of assets) {
    if (await exists(asset.target)) {
      continue;
    }

    console.log(`Downloading ${asset.name}...`);
    await download(asset.url, asset.target);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

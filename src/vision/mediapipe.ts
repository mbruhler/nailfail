import { FaceLandmarker, FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export type VisionTasks = {
  faceLandmarker: FaceLandmarker;
  handLandmarker: HandLandmarker;
};

let tasksPromise: Promise<VisionTasks> | null = null;

export function loadVisionTasks() {
  tasksPromise ??= createVisionTasks();
  return tasksPromise;
}

async function createVisionTasks(): Promise<VisionTasks> {
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");

  const faceLandmarker = await FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: "/models/face_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "VIDEO",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  const handLandmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: "/models/hand_landmarker.task",
      delegate: "CPU",
    },
    runningMode: "VIDEO",
    // You can only bite one hand's nails at a time, so tracking a single hand
    // is enough — it halves the hand inference work and trims memory.
    numHands: 1,
    minHandDetectionConfidence: 0.45,
    minHandPresenceConfidence: 0.45,
    minTrackingConfidence: 0.45,
  });

  return {
    faceLandmarker,
    handLandmarker,
  };
}

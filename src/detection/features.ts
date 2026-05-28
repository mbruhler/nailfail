import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type FeatureVector = {
  timestamp: number;
  minFingertipMouthDistance: number;
  fingertipInsideMouth: boolean;
  handVelocity: number;
  handStability: number;
  fingersNearMouth: number;
  faceYaw: number;
  facePitch: number;
  confidence: number;
};

export type FrameMemory = {
  timestamp: number;
  handCenter?: Point;
};

type Point = {
  x: number;
  y: number;
};

const mouthIndices = [
  13, 14, 17, 61, 78, 80, 81, 82, 84, 87, 88, 91, 95, 146, 178, 181, 191, 267, 269, 270,
  291, 308, 310, 311, 312, 314, 317, 318, 321, 324, 375, 402, 405,
];
const fingertipIndices = [4, 8, 12, 16, 20];

export function extractFeatureVector(
  faceLandmarks: NormalizedLandmark[][],
  handLandmarks: NormalizedLandmark[][],
  previous?: FrameMemory,
): { features: FeatureVector; memory: FrameMemory } {
  const timestamp = performance.now();
  const face = faceLandmarks[0];

  if (!face) {
    const features = emptyFeatures(timestamp);
    return { features, memory: { timestamp } };
  }

  const faceBox = bounds(face);
  const faceScale = Math.max(diagonal(faceBox), 0.001);
  const mouthPoints = mouthIndices.map((index) => face[index]).filter(Boolean);
  const mouthBox = bounds(mouthPoints);
  const mouthCenter = center(mouthPoints);
  const paddedMouthBox = padBox(mouthBox, faceScale * 0.08);
  const tips = handLandmarks.flatMap((hand) =>
    fingertipIndices.map((index) => hand[index]).filter(Boolean),
  );
  const currentHandCenter = handLandmarks[0] ? center(handLandmarks[0]) : undefined;

  let minDistance = 2;
  let insideMouth = false;
  let fingersNearMouth = 0;

  for (const tip of tips) {
    const distance = euclidean(tip, mouthCenter) / faceScale;
    minDistance = Math.min(minDistance, distance);

    if (distance < 0.24) {
      fingersNearMouth += 1;
    }

    if (pointInBox(tip, paddedMouthBox)) {
      insideMouth = true;
    }
  }

  const handVelocity =
    currentHandCenter && previous?.handCenter
      ? euclidean(currentHandCenter, previous.handCenter) /
        faceScale /
        Math.max((timestamp - previous.timestamp) / 1000, 0.001)
      : 0;

  const features: FeatureVector = {
    timestamp,
    minFingertipMouthDistance: round(minDistance),
    fingertipInsideMouth: insideMouth,
    handVelocity: round(handVelocity),
    handStability: round(Math.max(0, 1 - handVelocity / 1.2)),
    fingersNearMouth,
    faceYaw: round(faceYaw(face)),
    facePitch: round(facePitch(face, mouthCenter)),
    confidence: handLandmarks.length > 0 ? 1 : 0.55,
  };

  return {
    features,
    memory: {
      timestamp,
      handCenter: currentHandCenter,
    },
  };
}

function emptyFeatures(timestamp: number): FeatureVector {
  return {
    timestamp,
    minFingertipMouthDistance: 2,
    fingertipInsideMouth: false,
    handVelocity: 0,
    handStability: 0,
    fingersNearMouth: 0,
    faceYaw: 0,
    facePitch: 0,
    confidence: 0,
  };
}

function bounds(points: Point[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function center(points: Point[]): Point {
  const total = points.reduce(
    (sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y }),
    { x: 0, y: 0 },
  );

  return {
    x: total.x / Math.max(points.length, 1),
    y: total.y / Math.max(points.length, 1),
  };
}

function diagonal(box: ReturnType<typeof bounds>) {
  return Math.hypot(box.maxX - box.minX, box.maxY - box.minY);
}

function padBox(box: ReturnType<typeof bounds>, pad: number) {
  return {
    minX: box.minX - pad,
    maxX: box.maxX + pad,
    minY: box.minY - pad,
    maxY: box.maxY + pad,
  };
}

function pointInBox(point: Point, box: ReturnType<typeof bounds>) {
  return point.x >= box.minX && point.x <= box.maxX && point.y >= box.minY && point.y <= box.maxY;
}

function euclidean(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function faceYaw(face: NormalizedLandmark[]) {
  const nose = face[1];
  const left = face[234];
  const right = face[454];

  if (!nose || !left || !right) {
    return 0;
  }

  const leftDistance = Math.abs(nose.x - left.x);
  const rightDistance = Math.abs(right.x - nose.x);
  return (leftDistance - rightDistance) / Math.max(leftDistance + rightDistance, 0.001);
}

function facePitch(face: NormalizedLandmark[], mouthCenter: Point) {
  const leftEye = face[33];
  const rightEye = face[263];

  if (!leftEye || !rightEye) {
    return 0;
  }

  const eyeCenter = center([leftEye, rightEye]);
  return (mouthCenter.y - eyeCenter.y) / Math.max(Math.abs(mouthCenter.x - eyeCenter.x) + 0.1, 0.001);
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

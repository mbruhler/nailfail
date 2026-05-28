import type { FeatureVector } from "./features";

export type DetectionState = "watching" | "suspected_biting" | "confirmed_biting";

export type DetectionResult = {
  state: DetectionState;
  score: number;
  nearDurationMs: number;
  reason: string;
};

export function evaluateBitingWindow(
  window: FeatureVector[],
  sensitivity: number,
  holdMs: number,
): DetectionResult {
  const latest = window.at(-1);

  if (!latest) {
    return idleResult();
  }

  const distanceThreshold = 0.16 + sensitivity * 0.013;
  // `holdMs` is how long the fingers must stay near the mouth before we confirm
  // biting (user-configurable). The "suspected" hint fires at half of it.
  const confirmedMs = Math.max(300, holdMs);
  const suspectedMs = Math.max(300, confirmedMs * 0.5);
  const trailingNear = collectTrailingNearFrames(window, distanceThreshold);
  const nearDurationMs =
    trailingNear.length > 1 ? trailingNear.at(-1)!.timestamp - trailingNear[0].timestamp : 0;
  const nearRatio = trailingNear.length / Math.max(window.length, 1);
  const avgDistance = average(trailingNear.map((frame) => frame.minFingertipMouthDistance), 1);
  const avgStability = average(trailingNear.map((frame) => frame.handStability), 0);
  const avgVelocity = average(trailingNear.map((frame) => frame.handVelocity), 0);
  const proximity = Math.max(0, 1 - avgDistance / Math.max(distanceThreshold, 0.001));
  const score = clamp(nearRatio * 0.45 + proximity * 0.4 + avgStability * 0.15);

  if (nearDurationMs >= confirmedMs && avgVelocity < 2.2) {
    return {
      state: "confirmed_biting",
      score: round(score),
      nearDurationMs: Math.round(nearDurationMs),
      reason: "fingers stayed near mouth long enough",
    };
  }

  if (nearDurationMs >= suspectedMs) {
    return {
      state: "suspected_biting",
      score: round(score),
      nearDurationMs: Math.round(nearDurationMs),
      reason: "fingers near mouth",
    };
  }

  return {
    state: "watching",
    score: round(score),
    nearDurationMs: Math.round(nearDurationMs),
    reason: "watching",
  };
}

function collectTrailingNearFrames(window: FeatureVector[], threshold: number) {
  const frames: FeatureVector[] = [];

  for (let index = window.length - 1; index >= 0; index -= 1) {
    const frame = window[index];
    const near =
      frame.confidence > 0.7 &&
      (frame.fingertipInsideMouth ||
        frame.fingersNearMouth > 0 ||
        frame.minFingertipMouthDistance <= threshold);

    if (!near) {
      break;
    }

    frames.unshift(frame);
  }

  return frames;
}

function idleResult(): DetectionResult {
  return {
    state: "watching",
    score: 0,
    nearDurationMs: 0,
    reason: "watching",
  };
}

function average(values: number[], fallback: number) {
  if (values.length === 0) {
    return fallback;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

import * as faceapi from "face-api.js";

let modelsLoaded = false;
let modelLoadingPromise = null;

//
// Fast Detector Options
//
export const getFastDetectorOptions = (inputSize = 224, scoreThreshold = 0.35) => {
  return new faceapi.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold
  });
};

//
// Load face-api.js models from /models
//
export const loadFaceModels = async () => {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      const MODEL_URL = "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);

      modelsLoaded = true;
      console.log("All face-api models loaded successfully ✅");
      return true;
    } catch (err) {
      console.error("Error loading face-api models:", err);
      modelsLoaded = false;
      throw err;
    } finally {
      modelLoadingPromise = null;
    }
  })();

  return modelLoadingPromise;
};

//
// Euclidean Distance helper for 128-dimensional face embedding vectors
//
export const euclideanDistance = (arr1, arr2) => {
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return 1.0;
  let sum = 0;
  for (let i = 0; i < arr1.length; i++) {
    const diff = arr1[i] - arr2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

//
// Compare two face descriptors
// Threshold: 0.54 (optimal balance between biometric security and webcam lighting tolerance)
//
export const compareFaceDescriptors = (registeredDescriptor, liveDescriptor, threshold = 0.54) => {
  const distance = euclideanDistance(registeredDescriptor, liveDescriptor);
  const isMatch = distance <= threshold;
  const confidence = Math.max(0, Math.min(100, Math.round((1 - (distance / 0.65)) * 100)));

  return {
    isMatch,
    distance: Number(distance.toFixed(3)),
    confidence
  };
};

//
// Calculate average descriptor vector from multiple samples
//
export const averageDescriptors = (descriptors) => {
  if (!descriptors || descriptors.length === 0) return null;
  const len = descriptors[0].length;
  const avg = new Float32Array(len);

  for (let i = 0; i < len; i++) {
    let sum = 0;
    for (let j = 0; j < descriptors.length; j++) {
      sum += descriptors[j][i];
    }
    avg[i] = sum / descriptors.length;
  }

  return Array.from(avg);
};

const pointDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

//
// Eye Aspect Ratio (EAR)
//
export const computeEyeAspectRatio = (landmarks) => {
  const points = landmarks.positions || landmarks._positions;
  if (!points || points.length < 68) return 0.28;

  const leftA = pointDistance(points[37], points[41]);
  const leftB = pointDistance(points[38], points[40]);
  const leftC = pointDistance(points[36], points[39]);
  const leftEAR = leftC > 0 ? (leftA + leftB) / (2.0 * leftC) : 0.28;

  const rightA = pointDistance(points[43], points[47]);
  const rightB = pointDistance(points[44], points[46]);
  const rightC = pointDistance(points[42], points[45]);
  const rightEAR = rightC > 0 ? (rightA + rightB) / (2.0 * rightC) : 0.28;

  return (leftEAR + rightEAR) / 2.0;
};

//
// Mouth Aspect Ratio (MAR)
//
export const computeMouthAspectRatio = (landmarks) => {
  const points = landmarks.positions || landmarks._positions;
  if (!points || points.length < 68) return 0.25;

  const mouthWidth = pointDistance(points[48], points[54]);
  const mouthHeight = pointDistance(points[51], points[57]);

  if (mouthWidth <= 0) return 0;
  return mouthHeight / mouthWidth;
};

//
// Head Pose Yaw
//
export const computeHeadPose = (landmarks) => {
  const points = landmarks.positions || landmarks._positions;
  if (!points || points.length < 68) return { pose: "center", ratio: 0.5 };

  const nose = points[30];
  const leftJaw = points[0];
  const rightJaw = points[16];

  const totalWidth = rightJaw.x - leftJaw.x;
  if (totalWidth <= 0) return { pose: "center", ratio: 0.5 };

  const ratio = (nose.x - leftJaw.x) / totalWidth;

  let pose = "center";
  if (ratio < 0.38) pose = "left";
  else if (ratio > 0.62) pose = "right";

  return { pose, ratio: Number(ratio.toFixed(3)) };
};

//
// Adaptive Anti-Spoofing Liveness Engine
//
export class AntiSpoofingTracker {
  constructor(challengeType = "head_turn") {
    this.challengeType = challengeType; // "head_turn" | "smile" | "blink"
    this.phase = 0;
    this.baselineEAR = null;
    this.baselineMAR = null;
    this.isLive = false;
    this.frameCount = 0;
    this.statusText = "Looking at camera...";
  }

  reset(challengeType) {
    if (challengeType) this.challengeType = challengeType;
    this.phase = 0;
    this.baselineEAR = null;
    this.baselineMAR = null;
    this.isLive = false;
    this.frameCount = 0;
    this.statusText = "Looking at camera...";
  }

  processFrame(landmarks) {
    this.frameCount++;
    const ear = computeEyeAspectRatio(landmarks);
    const mar = computeMouthAspectRatio(landmarks);
    const { pose, ratio: yawRatio } = computeHeadPose(landmarks);

    // Initialize baseline on first few frames
    if (this.baselineEAR === null) {
      this.baselineEAR = ear;
      this.baselineMAR = mar;
    } else if (this.frameCount < 5) {
      this.baselineEAR = (this.baselineEAR + ear) / 2;
      this.baselineMAR = (this.baselineMAR + mar) / 2;
    }

    //
    // Challenge 1: 3D Head Movement (Center -> Turn Left/Right -> Center)
    // Most robust against 2D photos and screens
    //
    if (this.challengeType === "head_turn" || this.challengeType === "head_left") {
      if (this.phase === 0) {
        this.statusText = "Step 1/2: Look straight at the camera...";
        if (yawRatio >= 0.42 && yawRatio <= 0.58) {
          this.phase = 1;
        }
      } else if (this.phase === 1) {
        this.statusText = "Step 2/2: Turn your head slightly to the LEFT ⬅️";
        if (yawRatio <= 0.38) {
          this.phase = 2;
        }
      } else if (this.phase === 2) {
        this.statusText = "Now turn back to center... 🎯";
        if (yawRatio >= 0.43) {
          this.isLive = true;
          this.statusText = "✅ Live Human Verified!";
        }
      }
    }

    //
    // Challenge 2: Dynamic Smile (Neutral -> Smile -> Relax)
    //
    else if (this.challengeType === "smile") {
      if (this.phase === 0) {
        this.statusText = "Step 1/2: Keep a relaxed expression...";
        if (mar <= 0.34) {
          this.phase = 1;
        }
      } else if (this.phase === 1) {
        this.statusText = "Step 2/2: Smile for the camera! 😊";
        if (mar >= 0.36 || mar > this.baselineMAR * 1.25) {
          this.phase = 2;
        }
      } else if (this.phase === 2) {
        this.statusText = "Hold steady...";
        this.isLive = true;
        this.statusText = "✅ Live Human Verified!";
      }
    }

    //
    // Challenge 3: Adaptive Relative Blink
    //
    else if (this.challengeType === "blink") {
      const openBaseline = Math.max(0.24, this.baselineEAR || 0.26);

      if (this.phase === 0) {
        this.statusText = "Step 1/2: Eyes open, looking at camera...";
        if (ear >= 0.22) {
          this.phase = 1;
        }
      } else if (this.phase === 1) {
        this.statusText = "Step 2/2: Blink your eyes naturally 👁️";
        // Relative drop of 18%+ from baseline or ear <= 0.20
        if (ear <= openBaseline * 0.80 || ear <= 0.20) {
          this.phase = 2;
        }
      } else if (this.phase === 2) {
        this.statusText = "Eyes open...";
        if (ear >= openBaseline * 0.85 || ear >= 0.22) {
          this.isLive = true;
          this.statusText = "✅ Live Human Verified!";
        }
      }
    }

    const progress = this.isLive ? 100 : this.phase === 2 ? 70 : this.phase === 1 ? 40 : 15;

    return {
      isLive: this.isLive,
      phase: this.phase,
      statusText: this.statusText,
      progress,
      ear: Number(ear.toFixed(3)),
      mar: Number(mar.toFixed(3)),
      yawRatio
    };
  }
}

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { loadFaceModels, getFastDetectorOptions } from "../utils/faceApi";

const FaceTest = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectIntervalRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [descriptor, setDescriptor] = useState(null);

  // =========================
  // LOAD MODELS + START CAMERA
  // =========================
  useEffect(() => {
    let stream;

    const setup = async () => {
      try {
        await loadFaceModels();
        setModelsLoaded(true);

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setCameraStarted(true);
      } catch (error) {
        console.error("Setup error:", error);
      }
    };

    setup();

    return () => {
      if (detectIntervalRef.current) {
        clearInterval(detectIntervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // =========================
  // CAPTURE FACE DESCRIPTOR
  // =========================
  const captureFace = async () => {
    try {
      const video = videoRef.current;
      if (!video) {
        alert("Camera not available");
        return;
      }

      const result = await faceapi
        .detectSingleFace(video, getFastDetectorOptions(224, 0.35))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!result) {
        alert("No face detected. Please look directly at the camera.");
        return;
      }

      setDescriptor(result.descriptor);
      console.log("Face descriptor:", result.descriptor);
      console.log("Descriptor length:", result.descriptor.length);
    } catch (error) {
      console.error("Face capture error:", error);
    }
  };

  // =========================
  // FAST REAL-TIME FACE DETECTION
  // =========================
  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const displaySize = {
      width: video.videoWidth || 640,
      height: video.videoHeight || 480,
    };

    canvas.width = displaySize.width;
    canvas.height = displaySize.height;
    faceapi.matchDimensions(canvas, displaySize);

    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

    const detectorOptions = getFastDetectorOptions(224, 0.35);

    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const detection = await faceapi
          .detectSingleFace(video, detectorOptions)
          .withFaceLandmarks();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          const resized = faceapi.resizeResults(detection, displaySize);
          faceapi.draw.drawDetections(canvas, resized);
          setFaceDetected(true);
        } else {
          setFaceDetected(false);
        }
      } catch (error) {
        console.error("Detection error:", error);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">
        Fast Face Detection Test
      </h1>

      {/* STATUS */}
      <div className="mb-6 bg-gray-800 p-5 rounded-lg w-full max-w-xl">
        <p className="mb-2">
          Models:{" "}
          <span className={modelsLoaded ? "text-green-400 font-semibold" : "text-yellow-400 font-semibold"}>
            {modelsLoaded ? "Loaded ✅" : "Loading..."}
          </span>
        </p>
        <p className="mb-2">
          Camera:{" "}
          <span className={cameraStarted ? "text-green-400 font-semibold" : "text-yellow-400 font-semibold"}>
            {cameraStarted ? "Started (60 FPS Smooth) ✅" : "Starting..."}
          </span>
        </p>
        <p>
          Face Status:{" "}
          <span className={faceDetected ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
            {faceDetected ? "Face Detected & Locked ✅" : "Looking for face..."}
          </span>
        </p>
      </div>

      {/* CAMERA */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl border-2 border-gray-700"
        style={{
          width: "640px",
          height: "480px",
          maxWidth: "100%",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onPlay={handleVideoPlay}
          className="w-full h-full object-cover transform -scale-x-100"
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none transform -scale-x-100"
        />
      </div>

      {/* REGISTER FACE BUTTON */}
      <button
        onClick={captureFace}
        disabled={!modelsLoaded || !cameraStarted}
        className="
          mt-6
          bg-emerald-600
          hover:bg-emerald-700
          disabled:bg-gray-600
          disabled:cursor-not-allowed
          px-8
          py-3.5
          rounded-xl
          font-bold
          shadow-lg
          transition
        "
      >
        Capture Face Descriptor
      </button>

      {/* DESCRIPTOR STATUS */}
      {descriptor && (
        <div className="mt-6 bg-gray-800 p-4 rounded-xl text-center border border-emerald-500/30">
          <p className="text-green-400 font-bold">
            Face captured successfully ✅
          </p>
          <p className="text-xs text-gray-300 mt-1">
            128-dimensional embedding vector ready (Length: {descriptor.length})
          </p>
        </div>
      )}
    </div>
  );
};

export default FaceTest;
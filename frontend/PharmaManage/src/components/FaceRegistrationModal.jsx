import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { loadFaceModels, averageDescriptors, getFastDetectorOptions } from "../utils/faceApi";
import api from "../services/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, AlertCircle, X, RefreshCw, UserCheck, Zap, ShieldCheck } from "lucide-react";

const TOTAL_SAMPLES = 3; // Fast, lightweight 3-sample capture (takes < 0.5s)

const FaceRegistrationModal = ({ isOpen, onClose, employee, onSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);

  const [loadingModels, setLoadingModels] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Initializing camera & face recognition...");
  const [statusType, setStatusType] = useState("info");
  const [samples, setSamples] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [lastDetectedDescriptor, setLastDetectedDescriptor] = useState(null);

  //
  // Initialize Camera & Models
  //
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const init = async () => {
      try {
        setLoadingModels(true);
        setStatusMessage("Loading lightweight face AI models...");
        await loadFaceModels();

        if (!isMounted) return;
        setLoadingModels(false);
        setStatusMessage("Requesting camera access...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            setCameraActive(true);
            setStatusMessage("Face detected! Click 'Quick Register' or 'Instant Capture'.");
            setStatusType("info");
          };
        }
      } catch (err) {
        console.error("Camera/Model error:", err);
        setStatusMessage(
          err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
            ? "Camera permission denied. Please allow camera access."
            : "Failed to initialize camera or models."
        );
        setStatusType("error");
        setLoadingModels(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen]);

  const stopCamera = () => {
    if (detectIntervalRef.current) {
      clearInterval(detectIntervalRef.current);
      detectIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  //
  // Fast, Throttled Real-time Detection Loop (Runs every 100ms for smooth 60fps video)
  //
  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);

    const detectorOptions = getFastDetectorOptions(224, 0.35);

    detectIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      try {
        const detection = await faceapi
          .detectSingleFace(video, detectorOptions)
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!detection) {
          setLastDetectedDescriptor(null);
          if (!isCapturing && samples.length === 0) {
            setStatusMessage("Looking for face... Please look directly at the camera.");
            setStatusType("warning");
          }
          return;
        }

        // Draw face box smoothly
        const resized = faceapi.resizeResults(detection, displaySize);
        faceapi.draw.drawDetections(canvas, resized);

        const currentDesc = Array.from(detection.descriptor);
        setLastDetectedDescriptor(currentDesc);

        // Auto sampling if in capturing mode
        if (isCapturing) {
          setSamples((prev) => {
            if (prev.length < TOTAL_SAMPLES) {
              const updated = [...prev, currentDesc];
              setStatusMessage(`Captured sample ${updated.length} of ${TOTAL_SAMPLES}...`);
              setStatusType("success");

              if (updated.length >= TOTAL_SAMPLES) {
                setIsCapturing(false);
                saveDescriptor(updated);
              }
              return updated;
            }
            return prev;
          });
        } else if (samples.length === 0) {
          setStatusMessage("Face locked! Ready for Quick Registration.");
          setStatusType("success");
        }
      } catch (err) {
        console.error("Fast detection error:", err);
      }
    }, 100);
  };

  //
  // Save Face Data to Backend
  //
  const saveDescriptor = async (collectedSamples) => {
    try {
      setSaving(true);
      setStatusMessage("Saving face biometric template securely...");
      setStatusType("info");

      const finalDescriptor = averageDescriptors(collectedSamples);

      const res = await api.post(`/users/${employee._id}/face`, {
        descriptor: finalDescriptor
      });

      setRegistrationComplete(true);
      toast.success(res.data?.message || "Face registered successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save face descriptor");
      setStatusMessage("Failed to save face descriptor. Please try again.");
      setStatusType("error");
    } finally {
      setSaving(false);
    }
  };

  // 1-Click Instant Register
  const handleInstantRegister = () => {
    if (!lastDetectedDescriptor) {
      return toast.error("Please look at the camera until your face is detected.");
    }
    saveDescriptor([lastDetectedDescriptor]);
  };

  // Multi-sample rapid registration
  const handleStartCapture = () => {
    setSamples([]);
    setIsCapturing(true);
    setStatusMessage("Capturing rapid face samples... Hold steady.");
    setStatusType("info");
  };

  const handleReset = () => {
    setSamples([]);
    setIsCapturing(false);
    setRegistrationComplete(false);
    setStatusMessage("Look at the camera to begin.");
    setStatusType("info");
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-white"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Camera size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Fast Face Registration</h2>
              <p className="text-xs text-slate-400">
                {employee.name} ({employee.department} • {employee.role})
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center">
          {/* Video Viewport Container */}
          <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-inner flex items-center justify-center">
            {loadingModels && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 gap-3 text-sm text-slate-300">
                <RefreshCw className="animate-spin text-indigo-400" size={32} />
                <span>Loading face detection AI models...</span>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onPlay={handleVideoPlay}
              className="w-full h-full object-cover transform -scale-x-100"
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none transform -scale-x-100" />

            {/* Oval Guide */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-[65%] h-[75%] rounded-[50%] border-2 border-dashed transition-colors duration-200 ${
                  lastDetectedDescriptor
                    ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                    : "border-indigo-400/60"
                }`}
              />
            </div>

            {/* Success Overlay */}
            {registrationComplete && (
              <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center gap-3 z-30 p-6 text-center">
                <CheckCircle2 size={56} className="text-emerald-400 animate-bounce" />
                <h3 className="text-xl font-bold text-emerald-200">Face Registered Successfully!</h3>
                <p className="text-xs text-emerald-300 max-w-xs">
                  Biometric embedding vector stored. {employee.name} can now check in via face recognition.
                </p>
              </div>
            )}
          </div>

          {/* Sample Progress */}
          {samples.length > 0 && !registrationComplete && (
            <div className="w-full max-w-[420px] mt-4">
              <div className="flex justify-between items-center text-xs mb-1.5 text-slate-400 font-medium">
                <span>Registration Progress</span>
                <span>{samples.length} / {TOTAL_SAMPLES} Samples</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-200"
                  style={{ width: `${(samples.length / TOTAL_SAMPLES) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Message */}
          <div
            className={`w-full max-w-[420px] mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5 border ${
              statusType === "success"
                ? "bg-emerald-950/40 border-emerald-800/50 text-emerald-300"
                : statusType === "warning"
                ? "bg-amber-950/40 border-amber-800/50 text-amber-300"
                : statusType === "error"
                ? "bg-red-950/40 border-red-800/50 text-red-300"
                : "bg-slate-800/60 border-slate-700 text-slate-300"
            }`}
          >
            {statusType === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            ) : statusType === "error" ? (
              <AlertCircle size={16} className="shrink-0 text-red-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-amber-400" />
            )}
            <span className="leading-relaxed font-medium">{statusMessage}</span>
          </div>

          {/* Action Buttons */}
          <div className="w-full max-w-[420px] mt-5 flex gap-3">
            {!registrationComplete ? (
              <>
                <button
                  type="button"
                  onClick={handleInstantRegister}
                  disabled={loadingModels || !cameraActive || !lastDetectedDescriptor || saving}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Zap size={16} /> Instant 1-Click Register
                </button>

                <button
                  type="button"
                  onClick={handleStartCapture}
                  disabled={loadingModels || !cameraActive || isCapturing || saving}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg"
                >
                  {isCapturing ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Sampling...
                    </>
                  ) : saving ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <UserCheck size={16} />
                      Multi-Sample (3x)
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FaceRegistrationModal;

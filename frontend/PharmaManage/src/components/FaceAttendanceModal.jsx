import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import {
  loadFaceModels,
  compareFaceDescriptors,
  getFastDetectorOptions,
  AntiSpoofingTracker
} from "../utils/faceApi";
import api from "../services/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  ScanFace,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft
} from "lucide-react";

const LIVENESS_CHALLENGES = [
  { id: "head_turn", title: "Head Movement", text: "Look center, then turn head slightly Left", icon: "⬅️" },
  { id: "smile", title: "Dynamic Smile", text: "Neutral face, then Smile at the camera", icon: "😊" },
  { id: "blink", title: "Natural Blink", text: "Look straight, then Blink your eyes naturally", icon: "👁️" }
];

const FaceAttendanceModal = ({ isOpen, onClose, type = "checkin", onSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectIntervalRef = useRef(null);
  const trackerRef = useRef(null);

  const [activeType, setActiveType] = useState(type);
  const [todayStatus, setTodayStatus] = useState(null);

  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [coords, setCoords] = useState(null);
  const [registeredDescriptor, setRegisteredDescriptor] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [step, setStep] = useState("setup");
  const [statusMessage, setStatusMessage] = useState("Initializing facial recognition & anti-spoofing...");
  const [statusType, setStatusType] = useState("info");
  const [confidence, setConfidence] = useState(null);
  const [livenessProgress, setLivenessProgress] = useState(0);

  const [challengeIndex, setChallengeIndex] = useState(0);
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentChallenge = LIVENESS_CHALLENGES[challengeIndex % LIVENESS_CHALLENGES.length];

  // Auto-detect check-in / check-out status
  useEffect(() => {
    if (!isOpen) return;
    setActiveType(type);

    api.get("/attendance/today-status")
      .then(({ data }) => {
        setTodayStatus(data);
        if (data?.checkedIn && !data?.checkedOut) {
          setActiveType("checkout");
        } else if (!data?.checkedIn) {
          setActiveType("checkin");
        }
      })
      .catch(() => {});
  }, [isOpen, type]);

  //
  // Initialize Camera, GPS, Models, and Registered Face Descriptor
  //
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const setup = async () => {
      try {
        setStep("setup");
        setLoading(true);
        setLivenessPassed(false);
        setLivenessProgress(0);
        setConfidence(null);
        setStatusMessage("Fetching GPS coordinates and loading face AI...");
        setStatusType("info");

        // 1. GPS coordinates with fallback
        let userCoords = { lat: 23.0225, lng: 72.5714 };
        try {
          if (navigator.geolocation) {
            const pos = await new Promise((res, rej) => {
              navigator.geolocation.getCurrentPosition(res, rej, {
                enableHighAccuracy: true,
                timeout: 3500
              });
            });
            userCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          }
        } catch (geoErr) {
          console.warn("GPS lookup:", geoErr);
        }

        if (!isMounted) return;
        setCoords(userCoords);

        // 2. Fetch User Profile and Registered Face Descriptor
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (!storedUser?._id) {
          throw new Error("Authentication missing. Please login again.");
        }
        setUserProfile(storedUser);

        const descRes = await api.get(`/users/${storedUser._id}/face-descriptor`);
        if (!descRes.data?.descriptor || descRes.data.descriptor.length === 0) {
          throw new Error("Face not registered yet. Please ask HR or Admin to register your face first.");
        }
        setRegisteredDescriptor(descRes.data.descriptor);

        // 3. Load face-api models
        await loadFaceModels();

        // 4. Initialize Tracker
        trackerRef.current = new AntiSpoofingTracker(currentChallenge.id);

        // 5. Start Camera
        setStatusMessage("Starting secure camera...");
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
            setLoading(false);
            setStep("liveness");
            setStatusMessage("Position face in oval. Follow the anti-spoofing challenge.");
            setStatusType("info");
          };
        }
      } catch (err) {
        console.error("Attendance setup error:", err);
        setLoading(false);
        setStep("failed");
        setStatusType("error");
        setStatusMessage(
          err.response?.data?.message ||
          err.message ||
          "Failed to initialize face attendance."
        );
      }
    };

    setup();

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
  // Real-time Detection Loop
  //
  const handleVideoPlay = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !trackerRef.current) return;

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
          if (step !== "success" && step !== "verifying") {
            setStatusMessage("Looking for face... Please look directly at the camera.");
            setStatusType("warning");
          }
          return;
        }

        const resized = faceapi.resizeResults(detection, displaySize);
        faceapi.draw.drawDetections(canvas, resized);

        const landmarks = detection.landmarks;
        const liveDesc = Array.from(detection.descriptor);

        // 1. Process Anti-Spoofing Frame
        const trackerResult = trackerRef.current.processFrame(landmarks);
        setLivenessProgress(trackerResult.progress);

        if (!trackerResult.isLive) {
          setStatusMessage(trackerResult.statusText);
          setStatusType(trackerResult.statusText.includes("⚠️") ? "error" : "info");
          return;
        }

        // 2. Liveness is PROVEN
        if (!livenessPassed) {
          setLivenessPassed(true);
          setStep("verifying");
          setStatusMessage("✅ Live Human Verified! Comparing biometric template...");
          setStatusType("success");
        }

        // 3. Match live face with registered biometric template
        if (registeredDescriptor && !submitting) {
          const matchResult = compareFaceDescriptors(registeredDescriptor, liveDesc, 0.54);

          if (matchResult.isMatch) {
            setConfidence(matchResult.confidence);
            stopCamera();
            submitAttendance(matchResult.confidence);
          } else {
            setStatusMessage(`Face mismatch (${matchResult.distance}). Live face does not match registered profile.`);
            setStatusType("error");
          }
        }
      } catch (err) {
        console.error("Attendance frame loop error:", err);
      }
    }, 100);
  };

  //
  // Submit Attendance (Check-in or Check-out)
  //
  const submitAttendance = async (faceConfidence) => {
    try {
      setSubmitting(true);
      setStep("verifying");
      setStatusMessage(`Recording ${activeType === "checkin" ? "Check-in" : "Check-out"}...`);
      setStatusType("info");

      const endpoint = activeType === "checkin" ? "/attendance/check-in" : "/attendance/check-out";

      const res = await api.post(endpoint, {
        lat: coords?.lat || 23.0225,
        lng: coords?.lng || 72.5714,
        faceVerified: true,
        faceConfidence: faceConfidence || 95,
        verificationMethod: "face"
      });

      setStep("success");
      setStatusMessage(res.data?.message || "Attendance recorded successfully!");
      setStatusType("success");
      toast.success(res.data?.message || "Attendance recorded!");

      if (onSuccess) onSuccess(res.data);
    } catch (err) {
      console.error("Attendance submission error:", err);
      setStep("failed");
      setStatusType("error");
      setStatusMessage(
        err.response?.data?.message ||
        err.message ||
        "Attendance submission failed."
      );
      toast.error(err.response?.data?.message || "Attendance failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Switch / Cycle Challenge
  const handleSwitchChallenge = () => {
    const nextIdx = (challengeIndex + 1) % LIVENESS_CHALLENGES.length;
    setChallengeIndex(nextIdx);
    const nextChallenge = LIVENESS_CHALLENGES[nextIdx];
    if (trackerRef.current) {
      trackerRef.current.reset(nextChallenge.id);
    }
    setLivenessPassed(false);
    setLivenessProgress(0);
    setStep("liveness");
    setStatusMessage("Follow the prompt below.");
    setStatusType("info");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-white"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              activeType === "checkin"
                ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/30"
                : "bg-rose-600/20 text-rose-400 border-rose-500/30"
            }`}>
              <ScanFace size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Face Attendance
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  activeType === "checkin"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                }`}>
                  {activeType === "checkin" ? "Check-In" : "Check-Out"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-400" />
                Anti-Spoofing Active (Photos Prohibited)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Type Switcher */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveType("checkin")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  activeType === "checkin"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                In
              </button>
              <button
                type="button"
                onClick={() => setActiveType("checkout")}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  activeType === "checkout"
                    ? "bg-rose-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Out
              </button>
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
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col items-center">
          {/* Camera Viewport */}
          <div className="relative w-full max-w-[400px] aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700 shadow-inner flex items-center justify-center">
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 gap-3 text-sm text-slate-300">
                <RefreshCw className="animate-spin text-emerald-400" size={32} />
                <span>Starting anti-spoofing camera...</span>
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

            {/* Guide Oval */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div
                className={`w-[65%] h-[75%] rounded-[50%] border-2 border-dashed transition-all duration-300 ${
                  step === "success"
                    ? "border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.7)]"
                    : livenessPassed
                    ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                    : statusType === "error"
                    ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                    : "border-indigo-400/70"
                }`}
              />
            </div>

            {/* Success Overlay */}
            {step === "success" && (
              <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center gap-3 z-30 p-6 text-center">
                <CheckCircle2 size={60} className="text-emerald-400 animate-bounce" />
                <h3 className="text-xl font-bold text-emerald-200">
                  {type === "checkin" ? "Check-in Confirmed!" : "Check-out Confirmed!"}
                </h3>
                <p className="text-xs text-emerald-300 max-w-xs">
                  Real Person Verified • Confidence: {confidence ? `${confidence}%` : "95%"}
                </p>
              </div>
            )}
          </div>

          {/* Anti-Spoofing Challenge Box */}
          {currentChallenge && step !== "success" && (
            <div className="w-full max-w-[400px] mt-4 p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/40">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <ShieldCheck size={16} className="text-indigo-400" />
                  <span>Challenge: {currentChallenge.title}</span>
                </div>
                <button
                  onClick={handleSwitchChallenge}
                  className="px-2 py-0.5 rounded-md bg-indigo-800/60 hover:bg-indigo-700 text-[11px] text-indigo-200 transition flex items-center gap-1"
                  title="Switch Challenge"
                >
                  <ArrowRightLeft size={11} /> Switch
                </button>
              </div>

              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-200 font-medium">{currentChallenge.text}</p>
                <span className="text-lg ml-2">{currentChallenge.icon}</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${livenessProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Status Alert Box */}
          <div
            className={`w-full max-w-[400px] mt-3 p-3 rounded-xl text-xs flex items-center gap-2.5 border ${
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
              <ShieldAlert size={16} className="shrink-0 text-red-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-amber-400" />
            )}
            <span className="leading-relaxed font-medium">{statusMessage}</span>
          </div>

          {/* Geolocation Info */}
          {coords && (
            <div className="w-full max-w-[400px] mt-2 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-slate-400" />
                GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
              <span>{livenessPassed ? "✅ Liveness Verified" : "🛡️ Anti-Spoofing Active"}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="w-full max-w-[400px] mt-5 flex gap-3">
            {step === "success" ? (
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
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSwitchChallenge}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm transition border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} /> Try Other Action
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs sm:text-sm transition border border-slate-700"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FaceAttendanceModal;

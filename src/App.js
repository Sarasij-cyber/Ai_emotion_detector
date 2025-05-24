import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use CDN for models
  const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setLoading(false);
      } catch (err) {
        console.error("Error loading face-api models:", err);
      }
    };
    loadModels();
  }, []);

  // Start webcam when models are loaded
  useEffect(() => {
    if (!loading) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Error accessing webcam: ", err));
    }
  }, [loading]);

  // Capture frame and detect emotions
  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    const detections = await faceapi
      .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (detections && detections.expressions) {
      const expressions = detections.expressions;
      const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
      setEmotion({
        label: sorted[0][0],
        confidence: (sorted[0][1] * 100).toFixed(2),
      });
    } else {
      setEmotion({ label: "No face detected", confidence: 0 });
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>AI Emotion Detection</h1>
      {loading ? (
        <p>Loading models...</p>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            width="480"
            height="360"
            style={{ borderRadius: 8, border: "1px solid #eee" }}
          />
          <div>
            <button
              onClick={handleCapture}
              style={{ margin: 16, fontSize: 18 }}
            >
              Capture & Detect Emotion
            </button>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {emotion && (
            <div>
              <h2>Emotion: {emotion.label}</h2>
              {emotion.confidence > 0 && (
                <p>Confidence: {emotion.confidence}%</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
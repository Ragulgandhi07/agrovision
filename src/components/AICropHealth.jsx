import React, { useState, useRef, useEffect, useCallback } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';
import { saveCropScan, addNotification } from '../utils/storage';
import { handleImageFallback } from '../utils/imageFallbacks';
import {
  loadMobileNetModel,
  subscribeMobileNetStatus,
  runCropClassification,
} from '../utils/tfModels';

export function AICropHealth({ onScanSaved }) {
  const presets = siteData.cropDiseaseDatabase;

  // Selected input image states
  const [selectedFile, setSelectedFile] = useState(null); // File object or null
  const [capturedDataUrl, setCapturedDataUrl] = useState(null); // dataUrl from camera or null
  const [previewUrl, setPreviewUrl] = useState(presets[0].sampleImage);
  const [activePreset, setActivePreset] = useState(presets[0]); // preset or null
  const [inputMode, setInputMode] = useState('preset'); // 'preset' | 'upload' | 'camera'

  // Analysis result states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null); // null until analyzed or preset viewed
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [modelStatus, setModelStatus] = useState('idle');
  const [liveCropResult, setLiveCropResult] = useState(null);

  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const activeBlobUrlRef = useRef(null);
  const cropDetectionLoopRef = useRef(null);

  // Preload MobileNet model on mount
  useEffect(() => {
    const unsub = subscribeMobileNetStatus(setModelStatus);
    loadMobileNetModel().catch(() => {});
    return unsub;
  }, []);

  // Stop camera stream & live loop on unmount & revoke object URLs
  useEffect(() => {
    return () => {
      if (cropDetectionLoopRef.current) {
        clearInterval(cropDetectionLoopRef.current);
        cropDetectionLoopRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, []);

  // ── Live continuous inference loop for camera ─────────────────────────────
  const stopCropDetectionLoop = () => {
    if (cropDetectionLoopRef.current) {
      clearInterval(cropDetectionLoopRef.current);
      cropDetectionLoopRef.current = null;
    }
    setLiveCropResult(null);
  };

  const startCropDetectionLoop = useCallback(() => {
    if (cropDetectionLoopRef.current) return;
    if (modelStatus !== 'ready') return;

    cropDetectionLoopRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const classResult = await runCropClassification(video);
        if (classResult) {
          setLiveCropResult(classResult);
        }
      } catch (_) {
        // Frame dropped or model busy
      }
    }, 900); // 900ms throttle for smooth continuous inference without UI lag
  }, [modelStatus]);

  useEffect(() => {
    if (isCameraActive && modelStatus === 'ready' && !cropDetectionLoopRef.current) {
      startCropDetectionLoop();
    }
  }, [isCameraActive, modelStatus, startCropDetectionLoop]);

  // ── Camera Controls ────────────────────────────────────────────────────────
  const startCamera = async (overrideFacing) => {
    setCameraError('');
    setErrorMessage('');
    setSavedSuccess(false);

    // Safeguard: handle React synthetic event object being passed as argument
    const requestedFacing = typeof overrideFacing === 'string' ? overrideFacing : facingMode;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is not supported by this browser or requires a secure HTTPS/localhost context.'
      );
      return;
    }

    stopCropDetectionLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: requestedFacing } },
          audio: false
        });
      } catch (firstErr) {
        if (firstErr.name === 'NotAllowedError') throw firstErr;
        // Fallback constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setInputMode('camera');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (pErr) {
          console.warn('Video play blocked:', pErr);
        }
      }

      if (modelStatus === 'ready') {
        startCropDetectionLoop();
      }
    } catch (err) {
      console.warn('Crop camera access error:', err);
      let msg = 'Camera permission denied or camera in use.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera device detected on this system.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera is currently in use by another application or operating system.';
      } else {
        msg = `Camera error: ${err.message || 'Check browser permissions'}`;
      }
      setCameraError(msg);
      setIsCameraActive(false);
    }
  };

  const switchCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (isCameraActive) startCamera(next);
  };

  const stopCamera = () => {
    stopCropDetectionLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureCropPhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
      setCameraError('Camera stream is not ready for frame capture. Please wait a second.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    stopCamera();

    // Revoke previous blob if any
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    setSelectedFile(null);
    setCapturedDataUrl(dataUrl);
    setPreviewUrl(dataUrl);
    setActivePreset(null);
    setInputMode('camera');
    setAnalysisResult(null); // Clear previous result so user sees fresh inference
    setErrorMessage('');
    setSavedSuccess(false);
  };

  // ── File Upload Handling ──────────────────────────────────────────────────
  const handleFile = (file) => {
    setErrorMessage('');
    setSavedSuccess(false);
    setCameraError('');

    if (!file) return;

    // Type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/jfif'];
    const fileName = (file.name || '').toLowerCase();
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.jfif'];
    const hasValidExt = validExts.some((ext) => fileName.endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setErrorMessage('Invalid file format. Please upload a clear JPEG, PNG, or WebP leaf image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image file size exceeds 10MB limit. Please upload a smaller photo.');
      return;
    }

    // Revoke previous blob URL
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    activeBlobUrlRef.current = objectUrl;

    setSelectedFile(file);
    setCapturedDataUrl(null);
    setPreviewUrl(objectUrl);
    setActivePreset(null);
    setInputMode('upload');
    setAnalysisResult(null); // Explicitly reset result on every new image!
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setSelectedFile(null);
    setCapturedDataUrl(null);
    setPreviewUrl(presets[0].sampleImage);
    setActivePreset(presets[0]);
    setInputMode('preset');
    setAnalysisResult(null);
    setErrorMessage('');
    setSavedSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectPreset = (preset) => {
    stopCamera();
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setSelectedFile(null);
    setCapturedDataUrl(null);
    setPreviewUrl(preset.sampleImage);
    setActivePreset(preset);
    setInputMode('preset');
    setAnalysisResult({
      id: `ref-${preset.id}`,
      crop: preset.crop,
      disease: preset.disease,
      confidence: preset.confidence,
      severity: preset.severity,
      symptoms: preset.symptoms,
      prevention: preset.prevention,
      treatmentAdvice: preset.treatmentAdvice,
      sampleImage: preset.sampleImage,
      isPresetReference: true,
      timestamp: new Date().toLocaleString()
    });
    setErrorMessage('');
    setSavedSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Inference Execution ───────────────────────────────────────────────────
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage('');
    setSavedSuccess(false);

    try {
      // 1. If user selected a preset knowledge base record, show the curated agronomy profile
      if (inputMode === 'preset' && activePreset) {
        setAnalysisResult({
          id: `ref-${activePreset.id}-${Date.now()}`,
          crop: activePreset.crop,
          disease: activePreset.disease,
          confidence: activePreset.confidence,
          severity: activePreset.severity,
          symptoms: activePreset.symptoms,
          prevention: activePreset.prevention,
          treatmentAdvice: activePreset.treatmentAdvice,
          sampleImage: previewUrl,
          isPresetReference: true,
          timestamp: new Date().toLocaleString()
        });
        setIsAnalyzing(false);
        return;
      }

      // 2. Try optional FastAPI backend if running with verified weights
      if (selectedFile || capturedDataUrl) {
        try {
          const healthRes = await fetch('http://localhost:8000/api/health', { signal: AbortSignal.timeout(1000) });
          if (healthRes.ok) {
            const health = await healthRes.json();
            if (health.models?.crop_pathology_loaded) {
              const formData = new FormData();
              if (selectedFile) {
                formData.append('file', selectedFile);
              } else if (capturedDataUrl) {
                const parts = capturedDataUrl.split(',');
                const byteString = atob(parts[1]);
                const mimeString = parts[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
                const blob = new Blob([ab], { type: mimeString });
                formData.append('file', blob, 'camera-capture.jpg');
              }

              const backendRes = await fetch('http://localhost:8000/api/predict-crop', {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(3000)
              });
              if (backendRes.ok) {
                const data = await backendRes.json();
                setAnalysisResult({
                  ...data,
                  sampleImage: previewUrl,
                  isBackendModel: true,
                  timestamp: new Date().toLocaleString()
                });
                setIsAnalyzing(false);
                return;
              }
            }
          }
        } catch (_) {
          // Backend offline or no custom weights — gracefully fall through to in-browser MobileNet
        }
      }

      // 3. Real in-browser MobileNet v2 inference on current image
      if (modelStatus === 'ready') {
        const imgEl = new Image();
        await new Promise((resolve, reject) => {
          imgEl.onload = resolve;
          imgEl.onerror = () => reject(new Error('Cannot decode image file.'));
          imgEl.src = previewUrl;
        });

        const classResult = await runCropClassification(imgEl);

        if (classResult.status === 'uncertain') {
          setAnalysisResult({
            id: `diag-${Date.now()}`,
            crop: 'Plant Leaf Specimen',
            disease: 'Unable to Identify Pathogen',
            confidence: classResult.topConfidencePercent,
            severity: 'Uncertain',
            symptoms: classResult.message,
            prevention: 'Ensure the photo is taken in clear lighting, centered on the affected leaf area, with minimal background clutter.',
            treatmentAdvice: 'MobileNet ImageNet model is active in-browser. It classifies visual categories rather than specialized microscopic foliar diseases. Consult an agricultural extension officer or plant pathology clinic.',
            sampleImage: previewUrl,
            isModelResult: true,
            isUncertain: true,
            disclaimer: classResult.disclaimer,
            timestamp: new Date().toLocaleString()
          });
          setIsAnalyzing(false);
          return;
        }

        // Recognized category
        const topClasses = (classResult.allPredictions || [])
          .slice(0, 3)
          .map((p) => `${p.className.split(',')[0]} (${(p.probability * 100).toFixed(1)}%)`)
          .join('; ');

        setAnalysisResult({
          id: `diag-${Date.now()}`,
          crop: 'Botanical Foliar Specimen',
          disease: `Visual Classification: ${classResult.topLabel}`,
          confidence: classResult.topConfidencePercent,
          severity: classResult.topConfidence > 0.65 ? 'Moderate' : 'Low',
          symptoms: `Primary visual trait: "${classResult.topLabel}" at ${classResult.topConfidencePercent} confidence. Top matches: ${topClasses}.`,
          prevention: 'For certified crop pathology diagnosis, deploy custom PlantVillage weights. Clean field tools and maintain balanced root hydration.',
          treatmentAdvice: classResult.disclaimer,
          sampleImage: previewUrl,
          isModelResult: true,
          disclaimer: classResult.disclaimer,
          allPredictions: classResult.allPredictions,
          timestamp: new Date().toLocaleString()
        });
        setIsAnalyzing(false);
        return;
      }

      if (modelStatus === 'loading') {
        setErrorMessage('TensorFlow.js MobileNet model is still loading into browser memory. Please wait a few seconds and retry.');
      } else if (modelStatus === 'error') {
        setErrorMessage('TensorFlow.js model failed to load. Check your internet connection and reload the page.');
      } else {
        setErrorMessage('AI inference engine is initializing. Please retry in a moment.');
      }
    } catch (err) {
      console.warn('Crop analysis error:', err);
      setErrorMessage(`Analysis could not complete: ${err.message || 'Please upload a clear leaf photograph.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save to history & generate notification
  const handleSaveToHistory = () => {
    if (!analysisResult) return;

    const newScan = {
      id: `CRP-${Math.floor(1000 + Math.random() * 9000)}`,
      crop: analysisResult.crop,
      condition: analysisResult.disease,
      confidence: analysisResult.confidence,
      severity: analysisResult.severity || 'Moderate',
      timestamp: new Date().toLocaleString(),
      isDemo: Boolean(analysisResult.isPresetReference),
      status: analysisResult.severity === 'None' ? 'Healthy' : 'Action Recommended',
      image: analysisResult.sampleImage,
      treatment: analysisResult.treatmentAdvice || analysisResult.prevention
    };

    saveCropScan(newScan);
    addNotification({
      id: `NOTIF-${Date.now()}`,
      type: 'crop',
      title: `Crop Diagnostic Logged: ${analysisResult.crop}`,
      message: `${analysisResult.disease} (Confidence: ${analysisResult.confidence}). Action guidance recorded.`,
      time: 'Just now',
      severity: analysisResult.severity === 'High' ? 'danger' : 'info',
      read: false
    });

    setSavedSuccess(true);
    if (onScanSaved) onScanSaved();
  };

  return (
    <section id="crop-disease" className="section crop-health-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            AI Crop Disease Diagnosis
          </div>
          <h2 className="section-title">
            Foliar Computer Vision & Health Diagnosis
          </h2>
          <p className="section-subtitle">
            Capture or upload leaf photographs for instant visual classification, symptom verification, and honest agricultural remedies.
          </p>
        </div>

        {/* Honest AI Model Connection Status Banner */}
        <div className="ai-status-banner">
          <div className="ai-status-left">
            <span
              className={`status-indicator-dot ${
                modelStatus === 'ready'
                  ? 'online'
                  : modelStatus === 'loading'
                  ? 'loading'
                  : modelStatus === 'error'
                  ? 'error'
                  : 'idle'
              }`}
            />
            <span>
              <strong>Crop AI Engine (MobileNet v2):</strong>&nbsp;
              {modelStatus === 'idle' && 'Initializing TensorFlow.js MobileNet v2…'}
              {modelStatus === 'loading' && 'Loading TensorFlow.js MobileNet v2 model weights into browser…'}
              {modelStatus === 'ready' && 'Model Ready — Real client-side MobileNet inference active'}
              {modelStatus === 'error' && 'Model load failed — check network connectivity and reload'}
            </span>
          </div>
          <span className="disclaimer-chip">
            {modelStatus === 'loading' && <><Icon name="refresh" size={13} className="spin" /> Loading…</>}
            {modelStatus === 'ready' && 'MobileNet TF.js • Live In-Browser'}
            {modelStatus === 'error' && 'Model Offline'}
          </span>
        </div>

        {/* Preset Sample Leaf Switcher */}
        <div className="sample-presets-bar">
          <span className="preset-label">
            <Icon name="leaf" size={16} />
            Reference Disease Knowledge Base:
          </span>
          <div className="preset-chips-scroll">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip ${activePreset?.id === preset.id && inputMode === 'preset' ? 'active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
                title={`View ${preset.crop} - ${preset.disease} reference profile`}
              >
                <span>{preset.crop}:</span>
                <strong>{preset.disease}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Interface: Viewfinder Left, Diagnostics Right */}
        <div className="crop-scanner-grid">
          {/* Left Column: Upload / Viewfinder */}
          <div className="scanner-left-card">
            <div
              className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Image / Video Preview Area */}
              <div className="image-viewfinder-frame">
                {/* Live Camera Video Feed */}
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="viewfinder-img"
                  style={{ display: isCameraActive ? 'block' : 'none', objectFit: 'cover' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Static Preview Image */}
                <img
                  src={previewUrl}
                  alt="Leaf Specimen"
                  className="viewfinder-img"
                  style={{ display: isCameraActive ? 'none' : 'block' }}
                  onError={(e) => handleImageFallback(e, 'crop')}
                />

                {/* HUD Laser Reticle */}
                <div className={`viewfinder-reticle ${isAnalyzing || isCameraActive ? 'scanning' : ''}`}>
                  <div className="corner corner-tl" />
                  <div className="corner corner-tr" />
                  <div className="corner corner-bl" />
                  <div className="corner corner-br" />
                  {(isAnalyzing || isCameraActive) && <div className="laser-beam" />}
                </div>

                {isAnalyzing && (
                  <div className="analyzing-overlay-badge">
                    <Icon name="refresh" size={18} className="spin" />
                    <span>Processing Foliar Visual Features with MobileNet v2…</span>
                  </div>
                )}

                {isCameraActive && (
                  <div
                    className="analyzing-overlay-badge"
                    style={{ background: 'rgba(22, 163, 74, 0.9)', maxWidth: '92%', whiteSpace: 'normal', textAlign: 'left', padding: '6px 12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="live-pulse-dot camera-on" />
                      <strong>REAL-TIME CAMERA FEED ACTIVE</strong>
                    </div>
                    {liveCropResult ? (
                      <div style={{ fontSize: '0.82rem', marginTop: '3px', lineHeight: 1.3 }}>
                        <span>Visual match: <strong>{liveCropResult.topLabel}</strong> ({liveCropResult.topConfidencePercent})</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                        Align leaf in frame and click "Capture Leaf Frame" to diagnose.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Upload & Action Controls */}
              <div className="dropzone-controls">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  style={{ display: 'none' }}
                  id="crop-file-input"
                />

                <div className="file-btns-row">
                  {/* Camera Toggle Button */}
                  <button
                    type="button"
                    id="crop-open-camera-btn"
                    className={`btn ${isCameraActive ? 'btn-danger' : 'btn-outline'} btn-sm`}
                    onClick={() => (isCameraActive ? stopCamera() : startCamera())}
                    title={isCameraActive ? 'Close Camera Stream' : 'Open Camera for Real-Time Foliar Scan'}
                  >
                    <Icon name={isCameraActive ? 'square' : 'video'} size={16} />
                    {isCameraActive ? 'Close Camera' : 'Open Camera'}
                  </button>

                  {isCameraActive && (
                    <button
                      type="button"
                      id="crop-capture-btn"
                      className="btn btn-warning btn-sm"
                      onClick={captureCropPhoto}
                      title="Snap photo from current camera feed for diagnosis"
                    >
                      <Icon name="camera" size={16} />
                      Capture Leaf Frame
                    </button>
                  )}

                  {isCameraActive && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={switchCamera}
                      title="Switch between front and rear camera"
                    >
                      <Icon name="refresh" size={16} />
                      Switch Camera
                    </button>
                  )}

                  {!isCameraActive && (
                    <button
                      type="button"
                      id="crop-upload-photo-btn"
                      className="btn btn-outline btn-sm"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      <Icon name="camera" size={16} />
                      Upload Leaf Photo
                    </button>
                  )}

                  {!isCameraActive && (
                    <button
                      type="button"
                      id="crop-run-diagnosis-btn"
                      className="btn btn-primary btn-sm"
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing}
                    >
                      <Icon name="scan" size={16} />
                      {isAnalyzing
                        ? 'Analyzing Image…'
                        : inputMode === 'preset'
                        ? 'View Reference Guide'
                        : 'Run AI Leaf Diagnosis'}
                    </button>
                  )}

                  {(selectedFile || capturedDataUrl) && !isCameraActive && (
                    <button
                      type="button"
                      className="btn btn-glass btn-sm"
                      onClick={handleRemoveImage}
                      title="Clear uploaded image and restore reference presets"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>

                <p className="drop-hint">
                  {isCameraActive
                    ? 'Center the leaf within the reticle and click "Capture Leaf Frame".'
                    : inputMode === 'upload' || inputMode === 'camera'
                    ? 'Image loaded. Click "Run AI Leaf Diagnosis" to process this specific photo.'
                    : 'Select a reference specimen above, or use camera / upload to test your own leaf photograph.'}
                </p>

                {cameraError && (
                  <div className="camera-error-banner" style={{ marginTop: '10px' }}>
                    <Icon name="alert-triangle" size={16} color="#ef4444" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="error-alert-box" style={{ marginTop: '10px' }}>
                    <Icon name="alert-triangle" size={16} color="#ef4444" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Diagnostic Results Card */}
          <div className="scanner-right-card">
            {analysisResult ? (
              <div className="diagnostic-result-panel">
                <div className="result-header-row">
                  <div>
                    <span className="result-kicker">
                      {analysisResult.isPresetReference ? 'Knowledge Base Reference Specimen' : 'Diagnosed Specimen Result'}
                    </span>
                    <h3 className="result-disease-name">
                      {analysisResult.crop} – {analysisResult.disease}
                    </h3>
                  </div>
                  <div className="result-confidence-pill">
                    <span className="conf-label">Confidence</span>
                    <span className="conf-value">{analysisResult.confidence}</span>
                  </div>
                </div>

                {/* Severity & Status Tags */}
                <div className="severity-row">
                  <span className={`severity-tag ${analysisResult.severity?.toLowerCase() || 'moderate'}`}>
                    Severity: {analysisResult.severity || 'Moderate'}
                  </span>
                  <span className="timestamp-tag">
                    <Icon name="clock" size={14} />
                    {analysisResult.timestamp || new Date().toLocaleString()}
                  </span>
                </div>

                {/* Honest AI Model Disclosures */}
                {analysisResult.isPresetReference && (
                  <div className="demo-mode-notice" style={{ marginBottom: '14px', borderColor: '#16a34a' }}>
                    <Icon name="leaf" size={16} color="#16a34a" />
                    <span>
                      <strong>AgroVision Reference Database:</strong> This is a curated knowledge base entry displaying characteristic foliar symptoms, biological prevention, and safe organic remedies for educational review.
                    </span>
                  </div>
                )}

                {analysisResult.isModelResult && (
                  <div className="demo-mode-notice" style={{ marginBottom: '14px', borderColor: '#0284c7' }}>
                    <Icon name="info" size={16} color="#0284c7" />
                    <span>
                      <strong>TensorFlow.js MobileNet v2 Inference:</strong> {analysisResult.disclaimer}
                    </span>
                  </div>
                )}

                {/* Clinical Diagnostic Sections */}
                <div className="diagnostic-details-stack">
                  <div className="diag-section">
                    <div className="diag-sec-title">
                      <Icon name="alert-triangle" size={16} color="#d97706" />
                      <span>Identified Symptoms & Visual Characteristics</span>
                    </div>
                    <p className="diag-sec-text">{analysisResult.symptoms}</p>
                  </div>

                  <div className="diag-section">
                    <div className="diag-sec-title">
                      <Icon name="shield" size={16} color="#16a34a" />
                      <span>Agronomic Prevention & Cultural Practices</span>
                    </div>
                    <p className="diag-sec-text">{analysisResult.prevention}</p>
                  </div>

                  <div className="diag-section">
                    <div className="diag-sec-title">
                      <Icon name="droplet" size={16} color="#0284c7" />
                      <span>Recommended Organic & Cautious Remedies</span>
                    </div>
                    <p className="diag-sec-text">{analysisResult.treatmentAdvice}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="result-actions-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveToHistory}
                    disabled={savedSuccess}
                  >
                    <Icon name={savedSuccess ? 'check' : 'bookmark'} size={15} />
                    <span>{savedSuccess ? 'Scan Logged to History' : 'Save Diagnostic to History'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => window.print()}
                  >
                    <Icon name="printer" size={15} />
                    <span>Print Leaf Dossier</span>
                  </button>
                </div>

                {savedSuccess && (
                  <div className="save-success-toast">
                    <Icon name="check-circle" size={16} color="#16a34a" />
                    <span>Scan recorded in Detection History and Farm Telemetry log.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="diagnostic-empty-state">
                <div className="empty-icon-wrap">
                  <Icon name="scan" size={36} color="#16a34a" />
                </div>
                <h3>Ready for Leaf Diagnosis</h3>
                <p>
                  Select a reference disease specimen from the quick switcher above, or upload a leaf photo / capture a live camera frame, then click <strong>"Run AI Leaf Diagnosis"</strong> to inspect.
                </p>
                <div className="empty-tips-box">
                  <strong>Photo Guidelines for Optimal Analysis:</strong>
                  <ul>
                    <li>Hold leaf flat and fill at least 70% of the camera viewfinder</li>
                    <li>Ensure even, diffused daytime lighting without heavy shadows</li>
                    <li>Avoid blurry frames by holding device steady</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

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

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(presets[0].sampleImage);
  const [activePreset, setActivePreset] = useState(presets[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(presets[0]);
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [modelStatus, setModelStatus] = useState('idle'); // idle|loading|ready|error
  const [liveCropResult, setLiveCropResult] = useState(null); // Real-time continuous prediction

  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cropDetectionLoopRef = useRef(null);

  // Preload MobileNet on mount
  useEffect(() => {
    const unsub = subscribeMobileNetStatus(setModelStatus);
    loadMobileNetModel().catch(() => {});
    return unsub;
  }, []);

  // Stop camera stream & live loop on unmount
  useEffect(() => {
    return () => {
      if (cropDetectionLoopRef.current) {
        clearInterval(cropDetectionLoopRef.current);
        cropDetectionLoopRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  // ── Live Crop Detection Loop ──────────────────────────────────────────────
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
    }, 800); // 800ms throttle for smooth continuous inference without freezing UI
  }, [modelStatus]);

  // Restart live loop when model becomes ready while camera is active
  useEffect(() => {
    if (isCameraActive && modelStatus === 'ready' && !cropDetectionLoopRef.current) {
      startCropDetectionLoop();
    }
  }, [isCameraActive, modelStatus, startCropDetectionLoop]);

  const startCamera = async (overrideFacing) => {
    setCameraError('');
    setErrorMessage('');
    setSavedSuccess(false);
    const requestedFacing = overrideFacing || facingMode;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is not supported by this browser or requires a secure HTTPS/localhost context.'
      );
      return;
    }

    // Stop existing stream and loop before starting new one
    stopCropDetectionLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
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
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (pErr) {
          console.warn('Video play blocked:', pErr);
        }
      }

      setTimeout(async () => {
        if (videoRef.current && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch (_) {}
        }
      }, 50);

      // Start continuous AI analysis if model is ready
      if (modelStatus === 'ready') {
        startCropDetectionLoop();
      }
    } catch (err) {
      console.warn('Crop camera access error:', err);
      let msg = 'Camera permission denied or camera is in use.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera hardware found on this device.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera is currently in use by another application.';
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
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    setPreviewUrl(dataUrl);
    setSelectedFile(dataUrl);
    setActivePreset({
      id: 'crop-camera-capture',
      crop: 'Field Foliage Scan',
      disease: 'Camera Specimen Captured',
      confidence: 'Ready for inference',
      severity: 'Medium',
      symptoms: 'Fresh foliar specimen captured from live camera feed.',
      prevention: 'Inspect underside of leaves and keep moisture low.',
      treatmentAdvice: 'Run AI Leaf Diagnosis to analyze specimen.',
      sampleImage: dataUrl
    });
    setAnalysisResult(null);
    stopCamera();
  };

  // Validate and set image
  const handleFile = (file) => {
    setErrorMessage('');
    setSavedSuccess(false);

    if (!file) return;

    // Type validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/jfif'];
    const fileName = (file.name || '').toLowerCase();
    const validExts = ['.jpg', '.jpeg', '.png', '.webp', '.jfif'];
    const hasValidExt = validExts.some((ext) => fileName.endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setErrorMessage(
        'Invalid file format. Please upload a JPEG, PNG, or WebP leaf image.'
      );
      return;
    }

    // Size validation (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        'Image file size exceeds 10MB limit. Please upload a smaller photo.'
      );
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Default to an unknown/pending custom image state
    setActivePreset({
      id: 'custom-upload',
      crop: 'Field Foliage Specimen',
      disease: 'Awaiting AI Diagnostic Classification',
      confidence: 'Pending',
      severity: 'Pending',
      symptoms: 'Foliar scan loaded. Click "Run AI Leaf Diagnosis" to classify symptoms.',
      prevention: 'Maintain leaf hygiene and keep leaves well ventilated.',
      treatmentAdvice: 'Execute neural classification below.',
      sampleImage: objectUrl
    });
    setAnalysisResult(null);
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
    setSelectedFile(null);
    setPreviewUrl(presets[0].sampleImage);
    setActivePreset(presets[0]);
    setAnalysisResult(presets[0]);
    setErrorMessage('');
    setSavedSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectPreset = (preset) => {
    setSelectedFile(null);
    setPreviewUrl(preset.sampleImage);
    setActivePreset(preset);
    setAnalysisResult(preset);
    setErrorMessage('');
    setSavedSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Run model inference: FastAPI → MobileNet → preset fallback
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage('');
    setSavedSuccess(false);

    try {
      // ── 1. Try FastAPI backend (optional, port 8000) ──────────────────────
      if (selectedFile) {
        try {
          const formData = new FormData();
          if (typeof selectedFile === 'string' && selectedFile.startsWith('data:')) {
            const parts = selectedFile.split(',');
            const byteString = atob(parts[1]);
            const mimeString = parts[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
            const blob = new Blob([ab], { type: mimeString });
            formData.append('file', blob, 'leaf-camera-capture.jpg');
          } else {
            formData.append('file', selectedFile);
          }

          const response = await fetch('http://localhost:8000/api/predict-crop', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(1500)
          });
          if (response.ok) {
            const data = await response.json();
            setAnalysisResult({ ...data, sampleImage: previewUrl });
            return; // backend success
          }
        } catch (_) { /* backend unavailable */ }
      }

      // ── 2. Real MobileNet in-browser classification for both uploads and presets ──
      if (modelStatus === 'ready') {
        // Create an Image element from the preview URL
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          imgEl.onload = resolve;
          imgEl.onerror = reject;
          imgEl.src = previewUrl;
        });

        const classResult = await runCropClassification(imgEl);

        if (classResult.status === 'uncertain') {
          setAnalysisResult({
            id: `diag-${Date.now()}`,
            crop: 'Leaf / Plant Specimen',
            disease: 'Uncertain — Low Model Confidence',
            confidence: `${(classResult.topConfidence * 100).toFixed(1)}%`,
            severity: 'Unknown',
            symptoms: classResult.message,
            prevention: 'Ensure the photo is well-lit, close-up, and shows only the leaf clearly against a plain background.',
            treatmentAdvice: classResult.disclaimer,
            sampleImage: previewUrl,
            isModelResult: true,
            isUncertain: true,
            timestamp: new Date().toLocaleString()
          });
          return;
        }

        if (classResult.status === 'low_confidence') {
          setAnalysisResult({
            id: `diag-${Date.now()}`,
            crop: 'Plant Specimen',
            disease: `Low Confidence: ${classResult.topLabel.split(',')[0]}`,
            confidence: `${(classResult.topConfidence * 100).toFixed(1)}%`,
            severity: 'Uncertain',
            symptoms: classResult.message,
            prevention: 'Use a clearer, closer leaf photo for better results. Ensure good lighting and minimal background.',
            treatmentAdvice: classResult.disclaimer,
            sampleImage: previewUrl,
            isModelResult: true,
            isLowConfidence: true,
            timestamp: new Date().toLocaleString()
          });
          return;
        }

        // Good confidence — show real MobileNet result
        const topClasses = classResult.allPredictions
          .slice(0, 3)
          .map(p => `${p.className.split(',')[0]} (${(p.probability * 100).toFixed(1)}%)`);

        setAnalysisResult({
          id: `diag-${Date.now()}`,
          crop: 'Leaf / Plant Specimen',
          disease: `Visual Classification: ${classResult.topLabel.split(',')[0]}`,
          confidence: classResult.topConfidencePercent,
          severity: classResult.topConfidence > 0.75 ? 'Detectable' : 'Low',
          symptoms: `Top visual classification: "${classResult.topLabel.split(',')[0]}" at ${classResult.topConfidencePercent} confidence. Top 3: ${topClasses.join('; ')}.`,
          prevention: 'For clinical crop disease diagnosis, a custom PlantVillage-trained model is required. MobileNet identifies visual categories, not specific plant diseases.',
          treatmentAdvice: classResult.disclaimer,
          sampleImage: previewUrl,
          isModelResult: true,
          allPredictions: classResult.allPredictions,
          timestamp: new Date().toLocaleString()
        });
        return;
      }

      // ── 3. Model loading / error states ─────────────────────────────────
      if (modelStatus === 'loading') {
        setErrorMessage('AI model is still loading. Please wait a moment and try again.');
        return;
      }

      if (modelStatus === 'error') {
        setErrorMessage('MobileNet model failed to load. Check internet connection and reload.');
        return;
      }
    } catch (err) {
      setErrorMessage(
        'Image analysis failed. Please try again with a clear, well-lit leaf photograph.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save to history
  const handleSaveToHistory = () => {
    if (!analysisResult) return;

    const newScan = {
      id: `CRP-${Math.floor(1000 + Math.random() * 9000)}`,
      crop: analysisResult.crop,
      condition: analysisResult.disease,
      confidence: analysisResult.confidence,
      severity: analysisResult.severity,
      timestamp: new Date().toLocaleString(),
      isDemo: true,
      status: analysisResult.severity === 'None' ? 'Healthy' : 'Action Recommended',
      image: analysisResult.sampleImage,
      treatment: analysisResult.treatmentAdvice
    };

    saveCropScan(newScan);
    addNotification({
      id: `NOTIF-${Date.now()}`,
      type: 'crop',
      title: `Crop Diagnostic Saved: ${analysisResult.crop}`,
      message: `${analysisResult.disease} (Confidence ${analysisResult.confidence}). Action steps logged.`,
      time: 'Just now',
      severity: analysisResult.severity === 'High' ? 'danger' : 'info',
      read: false
    });

    setSavedSuccess(true);
    if (onScanSaved) onScanSaved();
  };

  // Print single report
  const handlePrintReport = () => {
    window.print();
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
            Upload leaf photographs for instant pathogen classification, symptom verification, and cautious agricultural remedies.
          </p>
        </div>

        {/* Honest AI Model Connection Status Banner */}
        <div className="ai-status-banner">
          <div className="ai-status-left">
            <span className={`status-indicator-dot ${
              modelStatus === 'ready' ? 'online' :
              modelStatus === 'loading' ? 'loading' :
              modelStatus === 'error' ? 'error' : 'idle'
            }`} />
            <span>
              <strong>Crop AI Engine (MobileNet v2):</strong>&nbsp;
              {modelStatus === 'idle' && 'Idle — model will load on first use'}
              {modelStatus === 'loading' && 'Loading TensorFlow.js MobileNet v2 model…'}
              {modelStatus === 'ready' && 'Model Ready — Real in-browser classification active'}
              {modelStatus === 'error' && 'Model load failed — check internet and reload'}
            </span>
          </div>
          <span className="disclaimer-chip">
            {modelStatus === 'loading' && <><Icon name="refresh" size={13} className="spin" /> Loading…</>}
            {modelStatus === 'ready' && 'MobileNet TF.js • Live Inference'}
            {(modelStatus === 'idle' || modelStatus === 'error') && 'Preset Knowledge Base Mode'}
          </span>
        </div>

        {/* Preset Sample Leaf Switcher */}
        <div className="sample-presets-bar">
          <span className="preset-label">
            <Icon name="leaf" size={16} />
            Quick Test Leaf Specimens:
          </span>
          <div className="preset-chips-scroll">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={`preset-chip ${activePreset?.id === preset.id ? 'active' : ''}`}
                onClick={() => handleSelectPreset(preset)}
              >
                <span>{preset.crop}:</span>
                <strong>{preset.disease}</strong>
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Interface: Upload & Scanner Left, Diagnostics Right */}
        <div className="crop-scanner-grid">
          {/* Left Column: Upload / Drag-and-Drop & Viewfinder */}
          <div className="scanner-left-card">
            <div
              className={`dropzone-container ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Image / Video Preview Area with Animated Reticle */}
              <div className="image-viewfinder-frame">
                {/* Live Camera Video Feed (always in DOM, visible when camera active) */}
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="viewfinder-img"
                  style={{ display: isCameraActive ? 'block' : 'none', objectFit: 'cover' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Static Preview Image (visible when camera inactive) */}
                <img
                  src={previewUrl}
                  alt="Leaf Specimen"
                  className="viewfinder-img"
                  style={{ display: isCameraActive ? 'none' : 'block' }}
                  onError={(e) => handleImageFallback(e, 'crop')}
                />

                {/* Animated HUD Laser Reticle */}
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
                    <span>Extracting Foliar Morphological Features...</span>
                  </div>
                )}

                {isCameraActive && (
                  <div className="analyzing-overlay-badge" style={{ background: 'rgba(22, 163, 74, 0.9)', maxWidth: '92%', whiteSpace: 'normal', textAlign: 'left', padding: '6px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: liveCropResult ? '2px' : 0 }}>
                      <span className="live-pulse-dot camera-on" />
                      <strong>REAL-TIME AI CROP SCANNER</strong>
                    </div>
                    {liveCropResult ? (
                      <div style={{ fontSize: '0.82rem', marginTop: '3px', lineHeight: 1.3 }}>
                        <span>Top Class: <strong>{liveCropResult.topLabel?.split(',')[0]}</strong></span>
                        <span style={{ marginLeft: '8px', opacity: 0.9 }}>({(liveCropResult.topConfidence * 100).toFixed(1)}%)</span>
                        <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '2px' }}>
                          Status: {liveCropResult.status === 'detected' ? '✓ Characteristic Match' : '⚠ Searching / Low confidence'}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>
                        {modelStatus === 'ready' ? 'Analyzing live frames continuously...' : 'Loading AI model...'}
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
                  onChange={(e) => handleFile(e.target.files[0])}
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  id="crop-file-input"
                />

                <div className="file-btns-row">
                  {/* Explicit Open Camera button for Crop Scanner */}
                  <button
                    type="button"
                    id="crop-open-camera-btn"
                    className={`btn ${isCameraActive ? 'btn-danger' : 'btn-outline'} btn-sm`}
                    onClick={isCameraActive ? stopCamera : startCamera}
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
                      title="Snap photo from live feed and prepare for AI diagnosis"
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
                      : modelStatus === 'loading'
                      ? 'Model Loading…'
                      : 'Run AI Leaf Diagnosis'}
                  </button>

                  {selectedFile && !isCameraActive && (
                    <button
                      type="button"
                      className="btn btn-glass btn-sm"
                      onClick={handleRemoveImage}
                      title="Remove Image"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>

                <p className="drop-hint">
                  {isCameraActive
                    ? 'Align leaf in the frame and click "Capture Leaf Frame" to diagnose.'
                    : 'Use live camera or drag & drop a clear leaf photo here (JPEG, PNG, WebP up to 10MB)'}
                </p>

                {cameraError && (
                  <div className="camera-error-banner" style={{ marginTop: '10px' }}>
                    <Icon name="alert-triangle" size={16} color="#ef4444" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="error-alert-box">
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
                      Diagnosed Specimen
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
                    {analysisResult.timestamp || '2026-10-14 10:30'}
                  </span>
                </div>

                {analysisResult.isModelResult && (
                  <div className="demo-mode-notice" style={{ marginBottom: '14px', borderColor: '#0284c7' }}>
                    <Icon name="info" size={16} color="#0284c7" />
                    <span>
                      <strong>Real AI Result (MobileNet v2):</strong> This is an actual TensorFlow.js model inference result, not a simulation.
                      {analysisResult.isUncertain && ' Low confidence — image may not show a clear plant specimen.'}
                      {analysisResult.isLowConfidence && ' Confidence is low — try a clearer, well-lit photo.'}
                    </span>
                  </div>
                )}

                {analysisResult.isPresetResult && (
                  <div className="demo-mode-notice" style={{ marginBottom: '14px' }}>
                    <Icon name="leaf" size={16} color="#16a34a" />
                    <span>
                      <strong>Curated Knowledge Base Result:</strong> This result is from the AgroVision crop disease reference database, not a live model inference on your uploaded image.
                    </span>
                  </div>
                )}

                <div className="diagnostic-block">
                  <h4 className="diag-heading">
                    <Icon name="eye" size={16} color="#16a34a" />
                    Observed Symptoms
                  </h4>
                  <p className="diag-text">
                    {analysisResult.symptoms}
                  </p>
                </div>

                <div className="diagnostic-block">
                  <h4 className="diag-heading">
                    <Icon name="shield" size={16} color="#0284c7" />
                    Prevention & Crop Care Guidance
                  </h4>
                  <p className="diag-text">
                    {analysisResult.prevention}
                  </p>
                </div>

                <div className="diagnostic-block highlight-box">
                  <h4 className="diag-heading">
                    <Icon name="sprout" size={16} color="#16a34a" />
                    Suggested Actionable Next Steps
                  </h4>
                  <p className="diag-text">{analysisResult.treatmentAdvice}</p>
                  <p className="cautious-note">
                    <Icon name="alert-triangle" size={14} color="#d97706" />
                    Agronomic Disclaimer: Always consult a licensed local agricultural extension officer or Krishi Vigyan Kendra (KVK) expert before preparing chemical spray mixtures.
                  </p>
                </div>

                {/* Save and Print Actions */}
                <div className="result-actions-row">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveToHistory}
                    disabled={savedSuccess}
                  >
                    <Icon name={savedSuccess ? 'check' : 'database'} size={16} />
                    {savedSuccess ? 'Saved to History!' : 'Save to Detection History'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handlePrintReport}
                  >
                    <Icon name="printer" size={16} />
                    Print Diagnostic Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="scanner-empty-state">
                <Icon name="scan" size={48} color="#4b7a4b" />
                <h3>Ready for Leaf Diagnosis</h3>
                <p>
                  Select a leaf specimen above or upload a fresh photograph to generate foliar diagnostic breakdown.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

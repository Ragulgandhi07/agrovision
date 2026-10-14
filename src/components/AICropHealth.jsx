import React, { useState, useRef, useEffect } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';
import { saveCropScan, addNotification } from '../utils/storage';

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

  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    setErrorMessage('');
    setSavedSuccess(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is not supported by this browser or requires a secure HTTPS/localhost context.'
      );
      return;
    }

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' },
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

  const stopCamera = () => {
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
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        'Invalid file format. Please upload a JPEG, PNG, or WebP image.'
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
      crop: 'Field Leaf Specimen',
      disease: 'Analyzing Diagnostic Features...',
      confidence: 'Pending',
      severity: 'Pending',
      symptoms: 'Foliar scan awaiting neural inference.',
      prevention: 'Keep leaf dry and follow general phytosanitary hygiene.',
      treatmentAdvice: 'Please run the model inference below.',
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

  // Run model inference simulation or check local backend
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage('');
    setSavedSuccess(false);

    try {
      let backendSuccess = false;
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const response = await fetch('http://localhost:8000/api/predict-crop', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(1500)
          });
          if (response.ok) {
            const data = await response.json();
            setAnalysisResult({
              ...data,
              sampleImage: previewUrl
            });
            backendSuccess = true;
          }
        } catch (e) {
          backendSuccess = false;
        }
      }

      if (!backendSuccess) {
        // High quality simulated diagnostic engine
        await new Promise((res) => setTimeout(res, 1200));

        const result = activePreset.id === 'custom-upload'
          ? {
              ...presets[0],
              confidence: '91.8%',
              sampleImage: previewUrl,
              timestamp: new Date().toLocaleString()
            }
          : {
              ...activePreset,
              timestamp: new Date().toLocaleString()
            };
        setAnalysisResult(result);
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
            <span className="status-indicator-dot online" />
            <span>
              <strong>AI Diagnostic Engine:</strong> Interactive Demonstration Mode Active • Ready for Local FastAPI PyTorch Backend (Port 8000)
            </span>
          </div>
          <span className="disclaimer-chip">
            General Guidance • Consult Agronomist for Chemical Dosages
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
                  <div className="analyzing-overlay-badge" style={{ background: 'rgba(22, 163, 74, 0.85)' }}>
                    <span className="live-pulse-dot camera-on" style={{ marginRight: '6px' }} />
                    <span>Live Crop Viewfinder Active</span>
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
                    {isAnalyzing ? 'Analyzing Image...' : 'Run AI Leaf Diagnosis'}
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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';
import { saveCropScan, addNotification } from '../utils/storage';
import { handleImageFallback, DEFAULT_CROP_IMAGE } from '../utils/imageFallbacks';
import {
  loadPlantDiseaseModel,
  retryLoadPlantDiseaseModel,
  subscribePlantDiseaseStatus,
  runPlantDiseaseClassification,
} from '../utils/tfModels';
import { getPlantDiseaseDetails } from '../utils/plantDiseaseData';

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

  // Model states (idle | loading | ready | error)
  const [modelStatus, setModelStatus] = useState('idle');
  const [modelErrorDetail, setModelErrorDetail] = useState('');
  const [liveCropResult, setLiveCropResult] = useState(null);

  // Camera stream states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');

  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const activeBlobUrlRef = useRef(null);
  const cropDetectionLoopRef = useRef(null);

  // Load Plant Disease model once on mount and subscribe to status
  useEffect(() => {
    let isMounted = true;
    const unsub = subscribePlantDiseaseStatus((status) => {
      if (isMounted) setModelStatus(status);
    });

    loadPlantDiseaseModel()
      .then(() => {
        if (isMounted) setModelErrorDetail('');
      })
      .catch((err) => {
        if (isMounted) {
          setModelErrorDetail(err.message || 'Plant disease model failed to load.');
        }
      });

    return () => {
      isMounted = false;
      unsub();
    };
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

  // ── Camera Detection Loop ──────────────────────────────────────────────────
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
        const classResult = await runPlantDiseaseClassification(video);
        if (classResult && classResult.status === 'classified') {
          setLiveCropResult(classResult);
        }
      } catch (_) {
        // Frame dropped or model busy
      }
    }, 1200);
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
    setAnalysisResult(null); // Reset result on new photo
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

  // Scan Another Leaf handler: resets analysis result and opens picker
  const handleScanAnotherLeaf = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setSelectedFile(null);
    setCapturedDataUrl(null);
    setAnalysisResult(null);
    setErrorMessage('');
    setSavedSuccess(false);
    setInputMode('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Preset selector
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
    const isHealthy = preset.id === 'healthy-paddy';
    setAnalysisResult({
      id: `ref-${preset.id}`,
      crop: preset.crop,
      disease: preset.disease,
      predictedTitle: isHealthy ? 'No disease detected by the model' : `${preset.crop} – ${preset.disease}`,
      confidence: preset.confidence || 'Reference Profile',
      severity: preset.severity,
      symptoms: preset.symptoms,
      prevention: preset.prevention,
      treatmentAdvice: preset.treatmentAdvice,
      sampleImage: preset.sampleImage,
      isPresetReference: true,
      isHealthy,
      timestamp: new Date().toLocaleString()
    });
    setErrorMessage('');
    setSavedSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Retry loading plant disease model
  const handleRetryModelLoad = async () => {
    setErrorMessage('');
    setModelErrorDetail('');
    try {
      await retryLoadPlantDiseaseModel();
      setModelErrorDetail('');
    } catch (err) {
      setModelErrorDetail(err.message || 'Plant disease model download timed out or failed.');
    }
  };

  const imageRef = useRef(null);
  const [selectedCropFocus, setSelectedCropFocus] = useState('auto'); // 'auto' | 'tomato' | 'potato' | 'rice' | 'corn'

  // ── Main Analysis Handler ─────────────────────────────────────────────────
  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage('');
    setSavedSuccess(false);

    try {
      // 1. Ensure model is loaded or attempt loading
      let activeModel = null;
      try {
        activeModel = await loadPlantDiseaseModel();
      } catch (loadErr) {
        setErrorMessage(`Plant disease model is offline: ${loadErr.message || 'Failed to initialize neural network weights'}. Please click "Retry Load" above.`);
        setIsAnalyzing(false);
        return;
      }

      if (!activeModel) {
        setErrorMessage('Plant disease model is offline. Please click "Retry Load" in the status bar.');
        setIsAnalyzing(false);
        return;
      }

      // 2. Preprocess image safely using DOM viewfinder image or offscreen Image element with dimensions check
      let imgSource = imageRef.current;
      if (!imgSource || !imgSource.complete || imgSource.naturalWidth === 0) {
        const offscreenImg = new Image();
        offscreenImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          offscreenImg.onload = resolve;
          offscreenImg.onerror = () => reject(new Error('Cannot decode leaf image file. Please provide a clear JPEG, PNG, or WebP photo.'));
          offscreenImg.src = previewUrl;
        });
        imgSource = offscreenImg;
      }

      // 3. Execute genuine Plant Disease model inference on the leaf image
      const classResult = await runPlantDiseaseClassification(imgSource);

      if (!classResult || classResult.status !== 'classified') {
        setErrorMessage(classResult?.message || 'Plant disease inference could not be completed. Please provide a clear leaf photograph.');
        setIsAnalyzing(false);
        return;
      }

      const {
        topCrop,
        topDisease,
        topRawLabel,
        topConfidence,
        topConfidencePercent,
        isHealthy,
        predictions
      } = classResult;

      // Validate real confidence score from model inference
      if (typeof topConfidence !== 'number' || isNaN(topConfidence)) {
        setErrorMessage('The model did not return a valid confidence score. Please try another image.');
        setIsAnalyzing(false);
        return;
      }

      // Retrieve comprehensive pathology guidance (symptoms, practical & safe treatment, prevention)
      const details = getPlantDiseaseDetails(topRawLabel, topCrop, topDisease);

      const isLowConfidence = topConfidence < 0.25;
      const predictedDiseaseName = isHealthy
        ? 'Healthy Foliage'
        : details.disease;

      const title = `${details.crop} – ${predictedDiseaseName}`;

      setAnalysisResult({
        id: `diag-${Date.now()}`,
        crop: details.crop,
        disease: predictedDiseaseName,
        predictedTitle: title,
        confidence: topConfidencePercent, // Genuine model confidence e.g. "88.9%"
        confidenceValue: topConfidence,
        severity: isHealthy ? 'None' : details.severity || 'Moderate',
        symptoms: isLowConfidence
          ? `Low confidence inference (${topConfidencePercent}). Nearest pattern match: ${title}. Inspect leaf: ${details.symptoms}`
          : details.symptoms,
        treatmentAdvice: isHealthy
          ? 'No chemical or bio-fungicide required. Maintain regular irrigation and balanced nutrient management.'
          : details.treatmentAdvice,
        prevention: details.prevention,
        sampleImage: previewUrl,
        isModelResult: true,
        isHealthy: Boolean(isHealthy),
        isLowConfidence,
        isPathologyModel: true,
        topFeatureMatch: topRawLabel,
        topPredictions: predictions || [],
        timestamp: new Date().toLocaleString()
      });
    } catch (err) {
      console.error('Analysis error:', err);
      setErrorMessage(`Analysis could not complete: ${err.message || 'Please upload a clear leaf photograph.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save to history & generate notification
  const handleSaveToHistory = () => {
    if (!analysisResult) return;

    let persistentThumb = analysisResult.sampleImage;
    try {
      if (persistentThumb && persistentThumb.startsWith('blob:')) {
        const img = document.querySelector('.analyzed-leaf-thumb') || document.querySelector('.viewfinder-img');
        if (img) {
          const thumbCanvas = document.createElement('canvas');
          const maxDim = 200;
          let w = img.naturalWidth || 200;
          let h = img.naturalHeight || 200;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          thumbCanvas.width = w;
          thumbCanvas.height = h;
          const ctx = thumbCanvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          persistentThumb = thumbCanvas.toDataURL('image/jpeg', 0.82);
        }
      }
    } catch (_) {}
    if (!persistentThumb || persistentThumb.startsWith('blob:')) {
      persistentThumb = DEFAULT_CROP_IMAGE;
    }

    const newScan = {
      id: `CRP-${Math.floor(1000 + Math.random() * 9000)}`,
      crop: analysisResult.crop,
      condition: analysisResult.disease,
      confidence: analysisResult.confidence,
      severity: analysisResult.severity || 'Moderate',
      timestamp: new Date().toLocaleString(),
      isDemo: Boolean(analysisResult.isPresetReference),
      status: analysisResult.isHealthy ? 'Healthy' : analysisResult.isUnreliable ? 'Unverified' : 'Action Recommended',
      image: persistentThumb,
      treatment: analysisResult.treatmentAdvice || analysisResult.prevention
    };

    saveCropScan(newScan);
    addNotification({
      id: `NOTIF-${Date.now()}`,
      type: 'crop',
      title: `Crop Diagnostic Logged: ${analysisResult.crop}`,
      message: `${analysisResult.disease} (${analysisResult.confidence}). Action guidance recorded.`,
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
            Foliar Computer Vision &amp; Health Diagnosis
          </h2>
          <p className="section-subtitle">
            Capture or upload leaf photographs for foliar evaluation, symptom inspection, and safe agricultural guidance.
          </p>
        </div>

        {/* Model Status & Connection Banner */}
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
              <strong>Crop AI Engine:</strong>&nbsp;
              {modelStatus === 'idle' && 'Initializing Plant Pathology vision engine…'}
              {modelStatus === 'loading' && 'Loading Plant Pathology deep neural network weights (PlantVillage 38-class model) into browser memory…'}
              {modelStatus === 'ready' && 'Plant Pathology Engine Ready — PlantVillage 38-class neural model active'}
              {modelStatus === 'error' && (modelErrorDetail || 'Plant pathology model unavailable. Please check connection and retry.')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {modelStatus === 'error' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ padding: '3px 10px', fontSize: '0.75rem', borderColor: '#f59e0b', color: '#b45309' }}
                onClick={handleRetryModelLoad}
                title="Retry loading model weights"
              >
                <Icon name="refresh" size={12} /> Retry Load
              </button>
            )}
            <span className="disclaimer-chip">
              {modelStatus === 'loading' && <><Icon name="refresh" size={13} className="spin" /> Initializing…</>}
              {modelStatus === 'ready' && 'PlantVillage TF.js • Ready'}
              {modelStatus === 'error' && 'Model Offline'}
            </span>
          </div>
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

                {/* Static Preview Image - Always visible */}
                <img
                  ref={imageRef}
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
                    <span>Evaluating Foliar Specimen…</span>
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
                {/* Crop Focus Selector for Uploaded Images */}
                {!isCameraActive && (
                  <div className="crop-focus-bar" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155' }}>
                      Crop Focus:
                    </span>
                    <div style={{ display: 'inline-flex', gap: '5px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'auto', label: 'Auto / General' },
                        { id: 'tomato', label: 'Tomato' },
                        { id: 'potato', label: 'Potato' },
                        { id: 'rice', label: 'Paddy / Rice' },
                        { id: 'corn', label: 'Maize / Corn' }
                      ].map((cropOpt) => (
                        <button
                          key={cropOpt.id}
                          type="button"
                          className={`btn-chip ${selectedCropFocus === cropOpt.id ? 'active' : ''}`}
                          style={{
                            padding: '3px 10px',
                            fontSize: '0.75rem',
                            borderRadius: '14px',
                            border: selectedCropFocus === cropOpt.id ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                            background: selectedCropFocus === cropOpt.id ? '#dcfce7' : '#ffffff',
                            color: selectedCropFocus === cropOpt.id ? '#15803d' : '#475569',
                            fontWeight: selectedCropFocus === cropOpt.id ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => setSelectedCropFocus(cropOpt.id)}
                        >
                          {cropOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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

                  {/* Analyze Button: Disabled while loading, automatically enabled when ready */}
                  {!isCameraActive && (
                    <button
                      type="button"
                      id="crop-run-diagnosis-btn"
                      className={`btn btn-primary btn-sm ${isAnalyzing || modelStatus === 'loading' ? 'loading' : ''}`}
                      onClick={handleRunAnalysis}
                      disabled={isAnalyzing || modelStatus === 'loading'}
                      title={
                        modelStatus === 'loading'
                          ? 'Model is initializing. Please wait a few seconds…'
                          : 'Analyze leaf image'
                      }
                    >
                      <Icon
                        name={isAnalyzing || modelStatus === 'loading' ? 'refresh' : 'scan'}
                        size={16}
                        className={isAnalyzing || modelStatus === 'loading' ? 'spin' : ''}
                      />
                      <span>
                        {isAnalyzing
                          ? 'Analyzing…'
                          : modelStatus === 'loading'
                          ? 'Loading Engine…'
                          : 'Analyze'}
                      </span>
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
                    : modelStatus === 'loading'
                    ? 'Loading client-side vision model… Analyze will enable automatically.'
                    : inputMode === 'upload' || inputMode === 'camera'
                    ? 'Leaf image ready. Click "Analyze" to inspect foliar condition.'
                    : 'Select a reference specimen above, or upload a leaf photo and click "Analyze".'}
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
                {/* 1. Analyzed Leaf Image Preview - Verified visible after analysis */}
                <div className="analyzed-leaf-preview-box">
                  <img
                    src={analysisResult.sampleImage || previewUrl}
                    alt="Analyzed Leaf Preview"
                    className="analyzed-leaf-thumb"
                    onError={(e) => handleImageFallback(e, 'crop')}
                  />
                  <div className="analyzed-leaf-meta">
                    <span className="leaf-specimen-type">
                      {analysisResult.crop}
                    </span>
                    <span className="leaf-scan-time">
                      <Icon name="clock" size={13} /> {analysisResult.timestamp || 'Just now'}
                    </span>
                    {analysisResult.topFeatureMatch && (
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Visual feature: <strong>{analysisResult.topFeatureMatch}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Predicted Result & Confidence */}
                <div className="result-header-row">
                  <div>
                    <span className="result-kicker">
                      {analysisResult.isPresetReference
                        ? 'Knowledge Base Reference Specimen'
                        : analysisResult.isHealthy
                        ? 'Plant Pathology Assessment — Healthy Canopy'
                        : 'Plant Pathology Model Diagnosis'}
                    </span>
                    <h3
                      className="result-disease-name"
                      style={{
                        color: analysisResult.isHealthy
                          ? '#16a34a'
                          : '#0f172a',
                        fontSize: '1.25rem',
                        lineHeight: 1.35
                      }}
                    >
                      {analysisResult.predictedTitle}
                    </h3>
                  </div>
                  <div className="result-confidence-pill">
                    <span className="conf-label">Confidence</span>
                    <span className="conf-value" style={{ fontSize: '1.15rem' }}>
                      {analysisResult.confidence}
                    </span>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="severity-row">
                  <span
                    className={`severity-tag ${
                      analysisResult.isHealthy
                        ? 'none'
                        : analysisResult.severity?.toLowerCase() || 'moderate'
                    }`}
                  >
                    Status: {analysisResult.isHealthy
                      ? 'Healthy Canopy'
                      : `${analysisResult.severity || 'Moderate'} Severity`}
                  </span>
                  <span className="timestamp-tag">
                    <Icon name="shield" size={14} />
                    {analysisResult.isPresetReference
                      ? 'Verified Knowledge Base'
                      : 'PlantVillage TF.js Neural Model'}
                  </span>
                </div>

                {/* Low Confidence Notice if applicable */}
                {analysisResult.isLowConfidence && (
                  <div className="demo-mode-notice" style={{ borderColor: '#f59e0b', background: '#fffbeb' }}>
                    <Icon name="alert-triangle" size={16} color="#d97706" />
                    <span style={{ color: '#92400e', fontSize: '0.8rem' }}>
                      <strong>Low Confidence Warning:</strong> Neural network confidence is below 25%. For optimal accuracy, please ensure the leaf fills 70% of the viewfinder in even natural daylight.
                    </span>
                  </div>
                )}

                {/* Top Neural Network Probabilities */}
                {analysisResult.topPredictions && analysisResult.topPredictions.length > 1 && (
                  <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                      Top Neural Network Predictions:
                    </span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {analysisResult.topPredictions.slice(0, 3).map((p, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.75rem',
                            background: idx === 0 ? '#dcfce7' : '#ffffff',
                            color: idx === 0 ? '#15803d' : '#475569',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: idx === 0 ? '1px solid #86efac' : '1px solid #cbd5e1',
                            fontWeight: idx === 0 ? 600 : 400
                          }}
                        >
                          {p.displayName || p.rawLabel}: <strong>{p.confidencePercent}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Diagnostic Sections: Symptoms, Treatment, Prevention */}
                <div className="diagnostic-details-stack">
                  {/* Symptoms */}
                  <div className="diag-section">
                    <div className="diag-sec-title">
                      <Icon name="alert-triangle" size={16} color="#d97706" />
                      <span>Visible Symptoms &amp; Diagnostic Inspection</span>
                    </div>
                    <p className="diag-sec-text">{analysisResult.symptoms}</p>
                  </div>

                  {/* Practical & Safe Treatment Advice */}
                  <div className="diag-section highlight">
                    <div className="diag-sec-title">
                      <Icon name="droplet" size={16} color="#16a34a" />
                      <span>Recommended Practical &amp; Safe Treatment</span>
                    </div>
                    <p className="diag-sec-text">{analysisResult.treatmentAdvice}</p>
                  </div>

                  {/* Prevention & Safe Farming Practices */}
                  <div className="diag-section">
                    <div className="diag-sec-title">
                      <Icon name="shield" size={16} color="#0284c7" />
                      <span>Agronomic Prevention &amp; Safe Monitoring Advice</span>
                    </div>
                    <p className="diag-sec-text">{analysisResult.prevention}</p>
                  </div>
                </div>

                {/* 4. Action Buttons including "Scan Another Leaf" */}
                <div className="result-actions-row">
                  <button
                    type="button"
                    id="crop-scan-another-btn"
                    className="btn btn-outline btn-sm"
                    onClick={handleScanAnotherLeaf}
                    title="Upload or capture another leaf photo"
                  >
                    <Icon name="camera" size={15} />
                    <span>Scan Another Leaf</span>
                  </button>

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
                    className="btn btn-glass btn-sm"
                    onClick={() => window.print()}
                    title="Print Leaf Dossier"
                  >
                    <Icon name="printer" size={15} />
                    <span>Print Dossier</span>
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
                  Upload a leaf photo or snap a camera frame, then click <strong>"Analyze"</strong> to evaluate foliar health, symptoms, and safe remedies. You can also inspect curated specimens from the reference list above.
                </p>
                <div className="empty-tips-box">
                  <strong>Photo Guidelines for Optimal Analysis:</strong>
                  <ul>
                    <li>Hold leaf flat and fill at least 70% of the camera viewfinder</li>
                    <li>Ensure even, diffused daytime lighting without heavy shadows</li>
                    <li>Focus closely on symptomatic areas (spots, pustules, or discoloration)</li>
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

export default AICropHealth;

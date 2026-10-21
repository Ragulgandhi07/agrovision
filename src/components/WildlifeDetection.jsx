import React, { useState, useEffect, useRef, useCallback } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';
import { playMildWildlifeChime } from '../utils/audioAlert';
import {
  getWildlifeHistory,
  saveWildlifeEvent,
  deleteWildlifeEvent,
  clearWildlifeHistory,
  addNotification,
  exportToCSV
} from '../utils/storage';
import { handleImageFallback, DEFAULT_WILDLIFE_IMAGE } from '../utils/imageFallbacks';
import {
  loadCocoModel,
  subscribeCocoStatus,
  runWildlifeDetection,
  drawBoundingBoxes,
  clearCanvas,
} from '../utils/tfModels';

export function WildlifeDetection({
  soundEnabled,
  soundVolume,
  onToggleSound,
  onChangeVolume,
  onEventLogged
}) {
  const speciesList = siteData.wildlifeDatabase;

  // Active analysis states
  const [activePreset, setActivePreset] = useState(speciesList[0]);
  const [previewImage, setPreviewImage] = useState(speciesList[0].sampleImage);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedResult, setDetectedResult] = useState(speciesList[0]);
  const [inputSource, setInputSource] = useState('preset');
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Camera stream states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = rear, 'user' = front
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);          // hidden capture canvas
  const overlayCanvasRef = useRef(null);   // visible bbox overlay canvas
  const detectionLoopRef = useRef(null);   // setInterval handle for live detection
  const fileInputRef = useRef(null);

  // AI Model state
  const [modelStatus, setModelStatus] = useState('idle'); // idle|loading|ready|error
  const [liveDetections, setLiveDetections] = useState([]); // detections on current frame

  // Incident location states
  const [incidentLocation, setIncidentLocation] = useState('Sector 4B • South Border Trench');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // History and search/filter states
  const [historyRecords, setHistoryRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEventModal, setSelectedEventModal] = useState(null);

  // Load history on mount
  useEffect(() => {
    setHistoryRecords(getWildlifeHistory());
  }, []);

  // Preload COCO-SSD model on mount and subscribe to status
  useEffect(() => {
    const unsub = subscribeCocoStatus(setModelStatus);
    loadCocoModel().catch(() => {}); // fire and forget; errors handled by status
    return unsub;
  }, []);

  // Cleanup camera stream and detection loop on unmount
  // NOTE: uses refs directly — functions are not yet defined at this point in render
  useEffect(() => {
    return () => {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current);
        detectionLoopRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  // ── Detection loop helpers ──────────────────────────────────────────────────
  const stopDetectionLoop = () => {
    if (detectionLoopRef.current) {
      clearInterval(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    setLiveDetections([]);
    if (overlayCanvasRef.current) clearCanvas(overlayCanvasRef.current);
  };

  const startDetectionLoop = useCallback(() => {
    if (detectionLoopRef.current) return; // already running
    if (modelStatus !== 'ready') return;  // model not loaded yet

    detectionLoopRef.current = setInterval(async () => {
      const video = videoRef.current;
      const overlay = overlayCanvasRef.current;
      if (!video || video.readyState < 2 || !overlay) return;

      try {
        const detections = await runWildlifeDetection(video);
        setLiveDetections(detections);

        // Sync canvas size to displayed video
        overlay.width  = video.videoWidth  || video.clientWidth  || 640;
        overlay.height = video.videoHeight || video.clientHeight || 480;
        clearCanvas(overlay);

        if (detections.length > 0) {
          drawBoundingBoxes(
            overlay,
            detections,
            video.videoWidth  || 640,
            video.videoHeight || 480
          );
          if (soundEnabled) {
            playMildWildlifeChime({ volume: soundVolume });
          }
        }
      } catch (_) { /* model busy or frame unavailable */ }
    }, 700); // throttled to ~1.4 fps for performance
  }, [modelStatus, soundEnabled, soundVolume]);

  // Re-start loop when model becomes ready while camera is active
  useEffect(() => {
    if (isCameraActive && modelStatus === 'ready' && !detectionLoopRef.current) {
      startDetectionLoop();
    }
  }, [isCameraActive, modelStatus, startDetectionLoop]);

  // ── Camera controls ─────────────────────────────────────────────────────────
  const startCamera = async (overrideFacingMode) => {
    setCameraError('');
    const requestedFacing = overrideFacingMode || facingMode;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is not supported by this browser or requires a secure HTTPS/localhost context.'
      );
      return;
    }

    // Stop existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    stopDetectionLoop();

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: { ideal: requestedFacing } },
          audio: false
        });
      } catch (firstErr) {
        if (firstErr.name === 'NotAllowedError') throw firstErr;
        // Fallback to basic camera (no facing constraint)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setInputSource('camera');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch (e) { console.warn('play() blocked:', e); }
      }

      setTimeout(async () => {
        if (videoRef.current && videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
          try { await videoRef.current.play(); } catch (_) {}
        }
      }, 50);

      // Start live detection loop if model is ready
      if (modelStatus === 'ready') startDetectionLoop();

      setSuccessBanner(
        modelStatus === 'ready'
          ? 'Live camera started — COCO-SSD AI detection active.'
          : 'Live camera started — AI model loading in background…'
      );
    } catch (err) {
      let msg = 'Camera permission was denied or camera is in use.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera hardware found on this device.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera is currently in use by another application or operating system.';
      } else {
        msg = `Camera access error: ${err.message || 'Check browser permissions'}`;
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

  const stopCameraStream = () => {
    stopDetectionLoop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setLiveDetections([]);
  };

  const handleCaptureCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    setPreviewImage(dataUrl);
    setInputSource('camera-capture');
    stopCameraStream();

    // Run real inference on the captured frame
    runWildlifeInference(canvas, dataUrl, 'Live Camera Capture');
  };

  // Image upload handling
  const handleFileUpload = (file) => {
    setErrorMessage('');
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage(
        'Invalid file format. Please upload JPEG, PNG, or WebP images.'
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        'File exceeds 10MB size limit. Please upload a smaller photo.'
      );
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
    setInputSource('upload');
  };

  // Preset selector
  const handleSelectPreset = (preset) => {
    stopCameraStream();
    setSelectedFile(null);
    setActivePreset(preset);
    setPreviewImage(preset.sampleImage);
    setInputSource('preset');
    setDetectedResult(preset);
    setErrorMessage('');
  };

  // Geolocation trigger
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by this browser');
      return;
    }
    setIsLocating(true);
    setLocationStatus('Acquiring GPS fix...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        const locString = `Field GPS: ${lat}°N, ${lon}°E (±${Math.round(pos.coords.accuracy)}m)`;
        setIncidentLocation(locString);
        setIsLocating(false);
        setLocationStatus('GPS Coordinates Locked');
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('Location permission denied (Manual entry available)');
      },
      { timeout: 7000 }
    );
  };

  // Audio test sound
  const handleTestSound = () => {
    playMildWildlifeChime({ volume: soundVolume, force: true });
  };

  // ── Main Wildlife Inference Engine (COCO-SSD + FastAPI fallback) ────────────
  /**
   * @param {HTMLCanvasElement|null} captureCanvas - canvas element for TF.js inference (from camera capture)
   * @param {string} imgUrl - image URL for preview / thumbnail
   * @param {string} sourceLabel - event source label
   */
  const runWildlifeInference = async (
    captureCanvas = null,
    imgUrl = previewImage,
    sourceLabel = 'Uploaded Image'
  ) => {
    setIsAnalyzing(true);
    setErrorMessage('');
    setSuccessBanner('');

    try {
      // ── 1. Try FastAPI backend (optional, port 8000) ─────────────────────
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          const response = await fetch('http://localhost:8000/api/predict-wildlife', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(1500)
          });
          if (response.ok) {
            const data = await response.json();
            // Backend returned a real result
            const speciesData = speciesList.find(s => s.id === data.speciesId) || speciesList[0];
            await _logWildlifeResult(speciesData, data.confidence || speciesData.defaultConfidence, imgUrl, sourceLabel, false);
            return;
          }
        } catch (_) { /* backend unavailable */ }
      }

      // ── 2. Run COCO-SSD in-browser if model is ready ─────────────────────
      if (modelStatus === 'ready') {
        // Determine what to run inference on
        let inferenceTarget = null;

        if (captureCanvas && captureCanvas instanceof HTMLCanvasElement) {
          inferenceTarget = captureCanvas;
        } else {
          // Create an img element from the active image (upload or preset)
          const imgEl = new Image();
          imgEl.crossOrigin = 'anonymous';
          await new Promise((res, rej) => {
            imgEl.onload = res;
            imgEl.onerror = rej;
            imgEl.src = imgUrl;
          });
          inferenceTarget = imgEl;
        }

        if (inferenceTarget) {
          const detections = await runWildlifeDetection(inferenceTarget);

          if (detections.length === 0) {
            // Honest no-detection result
            setDetectedResult(null);
            setErrorMessage(
              'No supported wildlife detected in this image (COCO-SSD confidence below threshold). ' +
              'Try a clearer, well-lit photo with the animal clearly visible.'
            );
            setIsAnalyzing(false);
            return;
          }

          // Take top detection
          const topDet = detections[0];
          const matchedPreset = speciesList.find(s => s.id === topDet.speciesId);

          const resultSpecies = matchedPreset ? {
            ...matchedPreset,
            commonName: topDet.label,
            threatLevel: topDet.threatLevel || matchedPreset.threatLevel,
          } : {
            id: topDet.speciesId,
            commonName: topDet.label,
            scientificName: `Detected via COCO-SSD [class: ${topDet.cocoClass}]`,
            threatLevel: topDet.threatLevel || 'Low',
            defaultConfidence: topDet.confidencePercent,
            typicalHabit: `Detected animal class "${topDet.cocoClass}" near farm border.`,
            safetyGuidance: topDet.threatLevel === 'High'
              ? 'Large animal spotted. Maintain distance and observe safe perimeter protocols.'
              : 'Domestic or grazing animal spotted near crop border. Check perimeter fence.',
            recommendedActions: [
              'Check perimeter boundary and crop fence line',
              'Observe animal direction from a safe location',
              'Log incident in AgroVision event ledger'
            ]
          };

          await _logWildlifeResult(
            resultSpecies,
            topDet.confidencePercent,
            imgUrl,
            sourceLabel,
            topDet.isApproximate,
            topDet.label
          );
          return;
        }
      }

      // ── 4. Model loading fallback ────────────────────────────────────────
      if (modelStatus === 'loading') {
        setErrorMessage('AI model is still loading. Please wait a moment and try again.');
        return;
      }

      if (modelStatus === 'error') {
        setErrorMessage('COCO-SSD model failed to load. Check internet connection and reload the page.');
        return;
      }

      // Generic fallback for uploaded image when model unavailable
      setErrorMessage(
        'No real AI model available. Connect internet to load COCO-SSD, or start the local FastAPI backend at port 8000.'
      );
    } catch (err) {
      console.error('Wildlife inference error:', err);
      setErrorMessage('Wildlife identification failed. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Internal helper: persist and display a wildlife detection result
  const _logWildlifeResult = async (
    speciesData,
    confidenceStr,
    imgUrl,
    sourceLabel,
    isApproximate = false,
    detectedLabel = null
  ) => {
    const resultToShow = {
      ...speciesData,
      detectedLabel,         // raw COCO label if approximate
      isApproximate,         // flag for UI disclosure
      defaultConfidence: confidenceStr,
    };
    setDetectedResult(resultToShow);

    if (soundEnabled) {
      playMildWildlifeChime({ volume: soundVolume });
    }

    const newEvent = {
      id: `WLD-${Math.floor(1000 + Math.random() * 9000)}`,
      species: `${speciesData.commonName} (${speciesData.scientificName})`,
      speciesCommon: speciesData.commonName,
      confidence: confidenceStr,
      timestamp: new Date().toLocaleString(),
      source: sourceLabel,
      location: incidentLocation,
      status: 'Verified',
      threatLevel: speciesData.threatLevel,
      isDemo: false,
      thumbnail: imgUrl,
      notes: speciesData.typicalHabit
    };

    const updatedHistory = saveWildlifeEvent(newEvent);
    setHistoryRecords(updatedHistory);

    addNotification({
      id: `NOTIF-${Date.now()}`,
      type: 'wildlife',
      title: `Wildlife Detected: ${speciesData.commonName}`,
      message: `Detected at ${incidentLocation}. Confidence: ${confidenceStr}. Follow safe distance guidelines.`,
      time: 'Just now',
      severity: speciesData.threatLevel === 'High' ? 'danger' : 'warning',
      read: false
    });

    setSuccessBanner(
      `Target Identified: ${speciesData.commonName} (${confidenceStr}). Event logged.`
    );

    if (onEventLogged) onEventLogged();
  };

  const filteredHistory = historyRecords.filter((rec) => {
    const matchesSearch =
      rec.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || rec.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleDeleteRecord = (id) => {
    if (window.confirm('Are you sure you want to delete this incident record?')) {
      const updated = deleteWildlifeEvent(id);
      setHistoryRecords(updated);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all wildlife detection logs?')) {
      clearWildlifeHistory();
      setHistoryRecords([]);
    }
  };

  const handleExportCSV = () => {
    if (!historyRecords.length) return;
    const formatted = historyRecords.map((r) => ({
      Event_ID: r.id,
      Species: r.species,
      Confidence: r.confidence,
      Timestamp: r.timestamp,
      Source: r.source,
      Location: r.location,
      Threat_Level: r.threatLevel,
      Status: r.status,
      Notes: r.notes
    }));
    exportToCSV(`AgroVision_Wildlife_Incidents_${Date.now()}.csv`, formatted);
  };

  return (
    <section id="wildlife" className="section wildlife-section">
      <div className="container">
        {/* Wildlife Header */}
        <div className="section-header">
          <div className="badge badge-warning-subtle">
            <span className="badge-dot" style={{ backgroundColor: '#eab308' }} />
            Advanced Wildlife Detection Module
          </div>
          <h2 className="section-title">
            Perimeter Threat Identification & Mild Alerting
          </h2>
          <p className="section-subtitle">
            Safeguarding agricultural acreage from nocturnal wildlife damage with non-invasive computer vision, harmless auditory chimes, and safe perimeter guidance.
          </p>
        </div>

        {/* AI Model Status Banner */}
        <div className="ai-status-banner">
          <div className="ai-status-left">
            <span className={`status-indicator-dot ${
              modelStatus === 'ready' ? 'online' :
              modelStatus === 'loading' ? 'loading' :
              modelStatus === 'error' ? 'error' : 'idle'
            }`} />
            <span>
              <strong>Wildlife AI Engine (COCO-SSD):</strong>&nbsp;
              {modelStatus === 'idle' && 'Idle — model will load on first use'}
              {modelStatus === 'loading' && 'Loading TensorFlow.js COCO-SSD model…'}
              {modelStatus === 'ready' && 'Model Ready — Real-time COCO-SSD detection active'}
              {modelStatus === 'error' && 'Model load failed — check internet connection and reload'}
            </span>
          </div>
          <span className="disclaimer-chip">
            {modelStatus === 'loading' && <><Icon name="refresh" size={13} className="spin" /> Loading…</>}
            {modelStatus === 'ready' && 'COCO-SSD TF.js • Live Inference'}
            {(modelStatus === 'idle' || modelStatus === 'error') && 'Detection Unavailable'}
          </span>
        </div>

        {/* Audio Alert Controls Toolbar */}
        <div className="wildlife-audio-toolbar">
          <div className="audio-tool-left">
            <div className="audio-icon-box">
              <Icon name={soundEnabled ? 'volume-2' : 'volume-x'} size={20} color={soundEnabled ? '#16a34a' : '#94a3b8'} />
            </div>
            <div>
              <span className="tool-title">
                Mild Two-Tone Alert Chime:
              </span>
              <span className="tool-desc">
                {soundEnabled
                  ? 'Active (Soft C5-E5 Harmonic Chime)'
                  : 'Silenced'}
              </span>
            </div>
          </div>

          <div className="audio-tool-right">
            {/* Sound Toggle */}
            <button
              type="button"
              className={`btn btn-sm ${soundEnabled ? 'btn-primary' : 'btn-outline'}`}
              onClick={onToggleSound}
            >
              <Icon name={soundEnabled ? 'volume-2' : 'volume-x'} size={16} />
              <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
            </button>

            {/* Volume Slider */}
            {soundEnabled && (
              <div className="slider-group">
                <span className="vol-text">{Math.round(soundVolume * 100)}%</span>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                  className="toolbar-slider"
                  title="Alert volume slider"
                />
              </div>
            )}

            {/* Test Sound Button */}
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleTestSound}
              title="Test the mild notification tone"
            >
              <Icon name="play" size={14} />
              <span>Test Sound</span>
            </button>
          </div>
        </div>

        {/* Preset Animal Quick Selector Bar */}
        <div className="species-selector-bar">
          <span className="spec-label">
            <Icon name="shield-alert" size={16} color="#d97706" />
            Supported Species Presets:
          </span>
          <div className="spec-chips-row">
            {speciesList.map((spec) => (
              <button
                key={spec.id}
                type="button"
                className={`species-chip ${activePreset?.id === spec.id ? 'active' : ''}`}
                onClick={() => handleSelectPreset(spec)}
              >
                <span>{spec.commonName}</span>
                <span className={`chip-threat ${spec.threatLevel.toLowerCase()}`}>
                  {spec.threatLevel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Interface: Camera / Viewfinder Left, Warning Panel Right */}
        <div className="wildlife-monitor-grid">
          {/* Left Column: Live Camera Stream or Image Viewfinder */}
          <div className="wildlife-viewfinder-card">
            <div className="viewfinder-header">
              <div className="source-tabs">
                <button
                  type="button"
                  className={`src-tab ${inputSource === 'preset' || inputSource === 'upload' ? 'active' : ''}`}
                  onClick={() => {
                    stopCameraStream();
                    setInputSource('preset');
                  }}
                >
                  <Icon name="camera" size={16} />
                  Image Specimen
                </button>
                <button
                  type="button"
                  id="open-camera-btn"
                  className={`src-tab ${isCameraActive ? 'active' : ''}`}
                  onClick={startCamera}
                  title="Open Camera Stream"
                >
                  <Icon name="video" size={16} />
                  Open Camera / Live Feed
                </button>
              </div>

              {/* Status indicator */}
              <div className="feed-status-badge">
                <span className={`live-pulse-dot ${isCameraActive ? 'camera-on' : ''}`} />
                <span>{isCameraActive ? 'STREAM ACTIVE' : 'STANDBY'}</span>
              </div>
            </div>

            {/* Video / Image Display Area */}
            <div className="viewfinder-viewport" style={{ position: 'relative' }}>
              {/* Camera stream — always in DOM so videoRef is valid; hidden when inactive */}
              <div className="camera-stream-wrap" style={{ display: isCameraActive ? 'block' : 'none', position: 'relative' }}>
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="live-video-element"
                  style={{ display: 'block', width: '100%', borderRadius: '8px' }}
                />
                {/* Real bounding box canvas overlay */}
                <canvas
                  ref={overlayCanvasRef}
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%',
                    pointerEvents: 'none', borderRadius: '8px'
                  }}
                />
                <div className="camera-overlay-reticle">
                  <span className="cam-hud-label">
                    {modelStatus === 'ready' ? 'COCO-SSD LIVE DETECTION' : 'PERIMETER SURVEILLANCE'}
                  </span>
                  {liveDetections.length > 0 && (
                    <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: 10 }}>
                      ⚠ {liveDetections.length} ANIMAL{liveDetections.length > 1 ? 'S' : ''} DETECTED
                    </span>
                  )}
                </div>
              </div>

              {/* Static image preview — shown when camera is off */}
              {!isCameraActive && (
                <div className="image-preview-wrap">
                  <img
                    src={previewImage}
                    alt="Wildlife Specimen"
                    className="preview-wildlife-img"
                    onError={(e) => handleImageFallback(e, 'wildlife')}
                  />

                  {/* Show real detection label if available */}
                  {detectedResult && !errorMessage && (
                    <div className="ai-bounding-box">
                      <span className="bbox-label">
                        {detectedResult.detectedLabel || detectedResult.commonName}: {detectedResult.defaultConfidence}
                      </span>
                    </div>
                  )}

                  {isAnalyzing && (
                    <div className="analyzing-backdrop">
                      <Icon name="refresh" size={28} className="spin" color="#ffffff" />
                      <p>
                        {modelStatus === 'ready'
                          ? 'Running COCO-SSD Object Detection…'
                          : modelStatus === 'loading'
                          ? 'Loading AI model…'
                          : 'Analyzing image…'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Hidden canvas for capturing video frames */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>

            {/* Controls Bar */}
            <div className="viewfinder-bottom-controls">
              {isCameraActive ? (
                <div className="camera-active-actions">
                  <button
                    type="button"
                    className="btn btn-warning-glass"
                    onClick={handleCaptureCamera}
                  >
                    <Icon name="camera" size={16} />
                    Capture & Analyze
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={switchCamera}
                    title="Switch between front and rear camera"
                  >
                    <Icon name="refresh" size={16} />
                    Switch Camera
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={stopCameraStream}
                  >
                    <Icon name="square" size={16} />
                    Stop Camera
                  </button>
                </div>
              ) : (
                <div className="image-mode-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                  />

                  <button
                    type="button"
                    id="wildlife-open-camera-btn"
                    className="btn btn-outline btn-sm"
                    onClick={startCamera}
                    title="Start Live Camera Surveillance"
                  >
                    <Icon name="video" size={16} />
                    Open Camera
                  </button>

                  <button
                    type="button"
                    id="wildlife-upload-btn"
                    className="btn btn-outline btn-sm"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  >
                    <Icon name="camera" size={16} />
                    Upload Photo
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => runWildlifeInference(null, previewImage, selectedFile ? 'Uploaded Image' : 'Preset Specimen')}
                    disabled={isAnalyzing || (!selectedFile && inputSource !== 'preset')}
                  >
                    <Icon name="scan" size={16} />
                    {isAnalyzing
                      ? 'Analyzing…'
                      : modelStatus === 'loading'
                      ? 'Model Loading…'
                      : 'Analyze Animal'}
                  </button>

                  {selectedFile && (
                    <button
                      type="button"
                      className="btn btn-glass btn-sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewImage(activePreset.sampleImage);
                        setInputSource('preset');
                        setErrorMessage('');
                        setSuccessBanner('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Remove uploaded photo"
                    >
                      <Icon name="x" size={16} />
                      Remove Photo
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-glass btn-sm"
                    onClick={() => startCamera()}
                  >
                    <Icon name="video" size={16} />
                    Start Camera
                  </button>
                </div>
              )}

              {/* Incident Location Field Bar */}
              <div className="incident-location-row">
                <div className="loc-input-wrap">
                  <Icon name="map-pin" size={16} color="#16a34a" />
                  <input
                    type="text"
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    placeholder="Enter farm sector or border location"
                    className="loc-input"
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={handleRequestLocation}
                  disabled={isLocating}
                  title="Detect GPS coordinates from device"
                >
                  <Icon name="crosshair" size={14} className={isLocating ? 'spin' : ''} />
                  <span>{isLocating ? 'Locating...' : 'Get GPS'}</span>
                </button>
              </div>

              {locationStatus && <span className="loc-status-text">{locationStatus}</span>}
              {cameraError && <div className="camera-error-banner">{cameraError}</div>}
              {errorMessage && <div className="error-alert-box">{errorMessage}</div>}
              {successBanner && <div className="success-alert-box">{successBanner}</div>}
            </div>
          </div>

          {/* Right Column: Wildlife Warning Alert Panel */}
          <div className="wildlife-alert-card">
            {detectedResult ? (
              <div className="threat-alert-box">
                {/* Approximate mapping disclosure */}
                {detectedResult.isApproximate && (
                  <div className="demo-mode-notice">
                    <Icon name="info" size={16} color="#0284c7" />
                    <span>
                      <strong>AI Note:</strong> COCO-SSD detected a <em>{detectedResult.detectedLabel}</em> class object. Wild boar, deer, and macaques are not explicit COCO classes — the closest available class was matched. For species-specific detection, a custom model trained on agricultural wildlife images is recommended.
                    </span>
                  </div>
                )}
                {/* Visual Alert Banner */}
                <div className={`alert-banner-header ${detectedResult.threatLevel?.toLowerCase() || 'medium'}`}>
                  <div className="alert-title-row">
                    <Icon name="shield-alert" size={24} color="#ffffff" />
                    <div>
                      <span className="banner-kicker">AGROVISION PERIMETER ALERT</span>
                      <h3 className="banner-headline">WILDLIFE DETECTED</h3>
                    </div>
                  </div>
                  <span className="threat-pill">
                    {detectedResult.threatLevel} Priority
                  </span>
                </div>

                {/* Detected Animal Metadata Grid */}
                <div className="detected-meta-grid">
                  <div className="meta-box">
                    <span className="m-label">Identified Species</span>
                    <strong className="m-val">{detectedResult.commonName}</strong>
                    <span className="m-sub">({detectedResult.scientificName})</span>
                  </div>

                  <div className="meta-box">
                    <span className="m-label">Confidence Score</span>
                    <strong className="m-val text-green">{detectedResult.defaultConfidence || '—'}</strong>
                    <span className="m-sub">
                      {modelStatus === 'ready' ? 'COCO-SSD TF.js' : 'Preset Reference'}
                    </span>
                  </div>

                  <div className="meta-box">
                    <span className="m-label">Detection Timestamp</span>
                    <strong className="m-val">{new Date().toLocaleTimeString()}</strong>
                    <span className="m-sub">{new Date().toLocaleDateString()}</span>
                  </div>

                  <div className="meta-box">
                    <span className="m-label">Border Location</span>
                    <strong className="m-val text-ellipsis">{incidentLocation}</strong>
                    <span className="m-sub">Field Logged</span>
                  </div>
                </div>

                {/* Foraging Habit and Behavior */}
                <div className="guidance-block">
                  <h4>
                    <Icon name="eye" size={16} color="#d97706" />
                    Foraging Habit & Potential Crop Threat
                  </h4>
                  <p>{detectedResult.typicalHabit}</p>
                </div>

                {/* Non-violent Safe Farmer Guidance */}
                <div className="guidance-block safe-guidance-box">
                  <h4>
                    <Icon name="shield" size={16} color="#16a34a" />
                    Recommended Non-Lethal Safety Actions
                  </h4>
                  <p className="safe-policy-text">
                    {detectedResult.safetyGuidance}
                  </p>
                  <ul className="action-checklist">
                    {detectedResult.recommendedActions?.map((act, i) => (
                      <li key={i}>
                        <Icon name="check" size={14} color="#16a34a" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="forest-dept-notice">
                    <Icon name="phone" size={14} color="#0369a1" />
                    <span>
                      Forest Department Toll-Free Wildlife Helpline: 1800-425-4545 / 1926
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="wildlife-empty-state">
                <Icon name="shield-alert" size={48} color="#94a3b8" />
                <h3>Perimeter Watchdog Ready</h3>
                <p>
                  Start the live camera or choose a specimen preset above to activate the surveillance reticle.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Wildlife Detection History Table Section */}
        <div className="wildlife-history-wrapper">
          <div className="history-header-bar">
            <div>
              <h3 className="history-title">
                <Icon name="database" size={20} color="#16a34a" />
                Wildlife Detection Event Ledger
              </h3>
              <p className="history-subtitle">
                Immutable security log of perimeter incursions, confidence metrics, and incident timestamps.
              </p>
            </div>

            <div className="history-controls-row">
              {/* Search Box */}
              <div className="hist-search-box">
                <Icon name="search" size={16} />
                <input
                  type="text"
                  placeholder="Search by animal or sector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="hist-select"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="alert dispatched">Alert Dispatched</option>
                <option value="resolved">Resolved</option>
              </select>

              {/* Export to CSV */}
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleExportCSV}
                disabled={!historyRecords.length}
              >
                <Icon name="download" size={16} />
                <span>Export CSV</span>
              </button>

              {/* Clear History */}
              <button
                type="button"
                className="btn btn-glass btn-sm"
                onClick={handleClearAllHistory}
                disabled={!historyRecords.length}
                title="Clear ledger history"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="table-responsive-wrapper">
            <table className="wildlife-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Event ID</th>
                  <th>Animal Species</th>
                  <th>Confidence</th>
                  <th>Source</th>
                  <th>Location</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center empty-td">
                      No matching wildlife incident logs found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((rec) => (
                    <tr key={rec.id}>
                      <td>
                        <img
                          src={rec.thumbnail || DEFAULT_WILDLIFE_IMAGE}
                          alt={rec.species}
                          className="table-thumb"
                          onError={(e) => handleImageFallback(e, 'wildlife')}
                          onClick={() => setSelectedEventModal(rec)}
                        />
                      </td>
                      <td>
                        <span className="code-pill">{rec.id}</span>
                      </td>
                      <td>
                        <strong className="species-cell-name">{rec.speciesCommon || rec.species}</strong>
                      </td>
                      <td>
                        <span className="conf-pill">{rec.confidence}</span>
                      </td>
                      <td>
                        <span className="source-tag">{rec.source}</span>
                      </td>
                      <td>
                        <span className="loc-cell">{rec.location}</span>
                      </td>
                      <td>
                        <span className="time-cell">{rec.timestamp}</span>
                      </td>
                      <td>
                        <span className={`status-badge-pill ${rec.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-btn-actions">
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => setSelectedEventModal(rec)}
                            title="View incident details"
                          >
                            <Icon name="eye" size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-action-btn delete"
                            onClick={() => handleDeleteRecord(rec.id)}
                            title="Delete record"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Event Details Modal */}
        {selectedEventModal && (
          <div className="modal-overlay" onClick={() => setSelectedEventModal(null)}>
            <div className="modal-container event-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    Wildlife Incident Log: {selectedEventModal.id}
                  </h3>
                  <span className="modal-subtitle">{selectedEventModal.timestamp}</span>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedEventModal(null)}
                >
                  <Icon name="x" size={20} />
                </button>
              </div>

              <div className="event-modal-body">
                <img
                  src={selectedEventModal.thumbnail || DEFAULT_WILDLIFE_IMAGE}
                  alt={selectedEventModal.species}
                  className="modal-event-img"
                  onError={(e) => handleImageFallback(e, 'wildlife')}
                />
                <div className="modal-event-fields">
                  <div className="m-field">
                    <span>Species:</span>
                    <strong>{selectedEventModal.species}</strong>
                  </div>
                  <div className="m-field">
                    <span>Confidence:</span>
                    <strong>{selectedEventModal.confidence}</strong>
                  </div>
                  <div className="m-field">
                    <span>Location:</span>
                    <strong>{selectedEventModal.location}</strong>
                  </div>
                  <div className="m-field">
                    <span>Threat Level:</span>
                    <strong>{selectedEventModal.threatLevel || 'Medium'}</strong>
                  </div>
                  <div className="m-field full">
                    <span>Surveillance Notes:</span>
                    <p>{selectedEventModal.notes || 'Perimeter monitoring triggered.'}</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => window.print()}
                >
                  <Icon name="printer" size={15} />
                  Print Report
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedEventModal(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

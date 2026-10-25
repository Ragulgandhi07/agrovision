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
import {
  handleImageFallback,
  DEFAULT_WILDLIFE_IMAGE,
  getWildlifeSpeciesImage
} from '../utils/imageFallbacks';
import {
  loadCocoModel,
  subscribeCocoStatus,
  runWildlifeDetection,
  drawBoundingBoxes,
  clearCanvas,
} from '../utils/tfModels';
import { getCurrentGPSLocation } from '../utils/geoWeather';

export function WildlifeDetection({
  soundEnabled,
  soundVolume,
  onToggleSound,
  onChangeVolume,
  onEventLogged
}) {
  const speciesList = siteData.wildlifeDatabase;

  // Active analysis states
  const [activePreset, setActivePreset] = useState(null);
  const [previewImage, setPreviewImage] = useState('/images/wildlife-placeholder.jpg');
  const [selectedFile, setSelectedFile] = useState(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedResult, setDetectedResult] = useState(null); // null until analyzed or preset explicitly selected
  const [currentDetections, setCurrentDetections] = useState([]); // real bbox detections on current image
  const [inputSource, setInputSource] = useState('idle'); // 'idle' | 'preset' | 'upload' | 'camera' | 'camera-capture'
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Camera stream states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = rear, 'user' = front

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);              // hidden capture canvas
  const streamOverlayCanvasRef = useRef(null); // visible bbox overlay on live video
  const imageOverlayCanvasRef = useRef(null);  // visible real bbox overlay on static image
  const imageElRef = useRef(null);             // static preview img element ref
  const detectionLoopRef = useRef(null);       // live video inference interval
  const fileInputRef = useRef(null);
  const activeBlobUrlRef = useRef(null);

  // AI Model state
  const [modelStatus, setModelStatus] = useState('idle'); // idle|loading|ready|error
  const [liveDetections, setLiveDetections] = useState([]); // detections on current video frame

  // Incident location states
  const [incidentLocation, setIncidentLocation] = useState('Sector 4B • South Border Trench');
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');

  // History and search/filter states
  const [historyRecords, setHistoryRecords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load history on mount
  useEffect(() => {
    setHistoryRecords(getWildlifeHistory());
  }, []);

  // Preload COCO-SSD model on mount and subscribe to status
  useEffect(() => {
    const unsub = subscribeCocoStatus(setModelStatus);
    loadCocoModel().catch(() => {});
    return unsub;
  }, []);

  // Cleanup camera stream, live loop, and blob URLs on unmount
  useEffect(() => {
    return () => {
      if (detectionLoopRef.current) {
        clearInterval(detectionLoopRef.current);
        detectionLoopRef.current = null;
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

  // ── Live Video Detection Loop Helpers ─────────────────────────────────────
  const stopDetectionLoop = () => {
    if (detectionLoopRef.current) {
      clearInterval(detectionLoopRef.current);
      detectionLoopRef.current = null;
    }
    setLiveDetections([]);
    if (streamOverlayCanvasRef.current) clearCanvas(streamOverlayCanvasRef.current);
  };

  const startDetectionLoop = useCallback(() => {
    if (detectionLoopRef.current) return;
    if (modelStatus !== 'ready') return;

    detectionLoopRef.current = setInterval(async () => {
      const video = videoRef.current;
      const overlay = streamOverlayCanvasRef.current;
      if (!video || video.readyState < 2 || !overlay) return;

      try {
        const { animalDetections } = await runWildlifeDetection(video);
        setLiveDetections(animalDetections);

        overlay.width = video.videoWidth || video.clientWidth || 640;
        overlay.height = video.videoHeight || video.clientHeight || 480;
        clearCanvas(overlay);

        if (animalDetections.length > 0) {
          drawBoundingBoxes(
            overlay,
            animalDetections,
            video.videoWidth || 640,
            video.videoHeight || 480
          );
          if (soundEnabled) {
            playMildWildlifeChime({ volume: soundVolume });
          }
        }
      } catch (_) {
        // Drop busy frames
      }
    }, 750);
  }, [modelStatus, soundEnabled, soundVolume]);

  useEffect(() => {
    if (isCameraActive && modelStatus === 'ready' && !detectionLoopRef.current) {
      startDetectionLoop();
    }
  }, [isCameraActive, modelStatus, startDetectionLoop]);

  // ── Camera Controls ────────────────────────────────────────────────────────
  const startCamera = async (overrideFacingMode) => {
    setCameraError('');
    setErrorMessage('');
    setSuccessBanner('');

    const requestedFacing = typeof overrideFacingMode === 'string' ? overrideFacingMode : facingMode;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is not supported by this browser or requires a secure HTTPS/localhost context.'
      );
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
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
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraActive(true);
      setInputSource('camera');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch (e) { console.warn('play() blocked:', e); }
      }

      if (modelStatus === 'ready') startDetectionLoop();

      setSuccessBanner(
        modelStatus === 'ready'
          ? 'Live camera stream started — COCO-SSD real-time vision active.'
          : 'Live camera stream active — AI vision model initializing…'
      );
    } catch (err) {
      console.warn('Wildlife camera error:', err);
      let msg = 'Camera access was denied or hardware is in use.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied. Please allow camera permissions in your browser address bar.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera hardware detected on this device.';
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

  // Capture still frame from live camera
  const handleCaptureCamera = () => {
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

    stopCameraStream();

    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }

    setSelectedFile(null);
    setCapturedDataUrl(dataUrl);
    setPreviewImage(dataUrl);
    setInputSource('camera-capture');
    setDetectedResult(null); // Clear previous result immediately
    setCurrentDetections([]);
    if (imageOverlayCanvasRef.current) clearCanvas(imageOverlayCanvasRef.current);

    // Run real inference on captured frame
    runWildlifeInference(canvas, dataUrl, 'Live Camera Capture');
  };

  // Image upload handling
  const handleFileUpload = (file) => {
    setErrorMessage('');
    setSuccessBanner('');
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Invalid file format. Please upload a clear JPEG, PNG, or WebP photo.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File exceeds 10MB size limit. Please upload a smaller photo.');
      return;
    }

    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    activeBlobUrlRef.current = url;

    stopCameraStream();
    setSelectedFile(file);
    setCapturedDataUrl(null);
    setPreviewImage(url);
    setInputSource('upload');
    setDetectedResult(null); // CRITICAL: Reset old result on every new upload so no previous species shows!
    setCurrentDetections([]);
    if (imageOverlayCanvasRef.current) clearCanvas(imageOverlayCanvasRef.current);
  };

  // Preset selector
  const handleSelectPreset = (preset) => {
    stopCameraStream();
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setSelectedFile(null);
    setCapturedDataUrl(null);
    setActivePreset(preset);
    setPreviewImage(preset.sampleImage);
    setInputSource('preset');
    setDetectedResult({
      ...preset,
      isPresetReference: true,
      defaultConfidence: preset.defaultConfidence
    });
    setCurrentDetections([]);
    if (imageOverlayCanvasRef.current) clearCanvas(imageOverlayCanvasRef.current);
    setErrorMessage('');
    setSuccessBanner('');
  };

  // Real Geolocation trigger
  const handleRequestLocation = async () => {
    setIsLocating(true);
    setLocationStatus('Acquiring device GPS fix...');

    try {
      const gps = await getCurrentGPSLocation();
      const locString = `Field GPS: ${gps.lat.toFixed(4)}°N, ${gps.lon.toFixed(4)}°E • ${gps.placeName} (±${gps.accuracy}m)`;
      setIncidentLocation(locString);
      setLocationStatus(`GPS Locked: ${gps.placeName} (±${gps.accuracy}m)`);
    } catch (err) {
      console.warn('Wildlife GPS error:', err);
      setLocationStatus(err.message || 'Location permission denied.');
    } finally {
      setIsLocating(false);
    }
  };

  // Audio test sound
  const handleTestSound = () => {
    playMildWildlifeChime({ volume: soundVolume, force: true });
  };

  // ── Main Wildlife Inference Engine ────────────────────────────────────────
  const runWildlifeInference = async (
    captureCanvas = null,
    imgUrl = previewImage,
    sourceLabel = selectedFile ? 'Uploaded Image' : capturedDataUrl ? 'Live Camera Capture' : 'Preset Specimen'
  ) => {
    setIsAnalyzing(true);
    setErrorMessage('');
    setSuccessBanner('');
    setDetectedResult(null); // Clear stale results before starting
    setCurrentDetections([]);
    if (imageOverlayCanvasRef.current) clearCanvas(imageOverlayCanvasRef.current);

    try {
      // 1. Try FastAPI backend if running with verified custom weights
      if (selectedFile || capturedDataUrl) {
        try {
          const healthRes = await fetch('http://localhost:8000/api/health', { signal: AbortSignal.timeout(1000) });
          if (healthRes.ok) {
            const health = await healthRes.json();
            if (health.models?.yolo_wildlife_loaded) {
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
                formData.append('file', blob, 'wildlife-capture.jpg');
              }

              const backendRes = await fetch('http://localhost:8000/api/predict-wildlife', {
                method: 'POST',
                body: formData,
                signal: AbortSignal.timeout(3000)
              });
              if (backendRes.ok) {
                const data = await backendRes.json();
                const matchedPreset = speciesList.find((s) => s.commonName.toLowerCase() === (data.commonName || '').toLowerCase()) || {
                  id: 'yolo-detection',
                  commonName: data.commonName || 'Detected Wildlife',
                  scientificName: data.scientificName || 'Classified Species',
                  threatLevel: data.threatLevel || 'Medium',
                  typicalHabit: data.typicalHabit || 'Boundary movement detected.',
                  safetyGuidance: data.safetyGuidance || 'Maintain safe perimeter.'
                };

                await _logWildlifeResult(matchedPreset, data.defaultConfidence || '92%', imgUrl, sourceLabel, false, data.commonName);
                setIsAnalyzing(false);
                return;
              }
            }
          }
        } catch (_) {
          // Backend offline or no custom weights — proceed to in-browser COCO-SSD
        }
      }

      // 2. Load model if not already ready (with proper await so inference isn't called prematurely)
      let model = null;
      try {
        model = await loadCocoModel();
      } catch (loadErr) {
        console.error('COCO-SSD load failure:', loadErr);
        setDetectedResult(null);
        setErrorMessage('COCO-SSD model could not be loaded into memory. Check network connectivity and reload the page.');
        setIsAnalyzing(false);
        return;
      }

      // 3. Prepare target element for inference
      let inferenceTarget = null;
      let sourceWidth = 640;
      let sourceHeight = 480;

      if (captureCanvas && captureCanvas instanceof HTMLCanvasElement) {
        inferenceTarget = captureCanvas;
        sourceWidth = captureCanvas.width;
        sourceHeight = captureCanvas.height;
      } else {
        const imgEl = new Image();
        imgEl.crossOrigin = 'anonymous';
        await new Promise((res, reject) => {
          imgEl.onload = () => {
            if (typeof imgEl.decode === 'function') {
              imgEl.decode().then(res).catch(() => res());
            } else {
              res();
            }
          };
          imgEl.onerror = () => reject(new Error('Cannot decode image file. Please upload a valid JPEG, PNG, or WebP photo.'));
          imgEl.src = imgUrl;
        });
        inferenceTarget = imgEl;
        sourceWidth = imgEl.naturalWidth || 640;
        sourceHeight = imgEl.naturalHeight || 480;
      }

      // 4. Run real inference
      const { animalDetections, otherDetections } = await runWildlifeDetection(inferenceTarget);
      const allDetections = [...animalDetections, ...otherDetections];
      setCurrentDetections(allDetections);

      // 5. Draw real bounding boxes on overlay canvas
      const overlayCanvas = imageOverlayCanvasRef.current;
      if (overlayCanvas) {
        const previewImgEl = imageElRef.current;
        overlayCanvas.width = previewImgEl?.clientWidth || sourceWidth;
        overlayCanvas.height = previewImgEl?.clientHeight || sourceHeight;
        clearCanvas(overlayCanvas);

        if (allDetections.length > 0) {
          drawBoundingBoxes(overlayCanvas, allDetections, sourceWidth, sourceHeight);
        }
      }

      // 6. Handle Detection Results Honestly
      if (animalDetections.length > 0) {
        const topAnimal = animalDetections[0];
        const isElephant = topAnimal.cocoClass === 'elephant';

        const resultSpecies = {
          id: topAnimal.speciesId,
          commonName: topAnimal.label,
          scientificName: isElephant ? 'Elephas maximus' : `COCO-SSD Class: ${topAnimal.cocoClass}`,
          threatLevel: topAnimal.threatLevel,
          defaultConfidence: topAnimal.confidencePercent,
          typicalHabit: isElephant
            ? 'Migratory corridor movement detected near agricultural boundary. High risk to banana/sugarcane.'
            : `Animal of class "${topAnimal.cocoClass}" detected near crop boundary.`,
          safetyGuidance: topAnimal.guidance,
          recommendedActions: isElephant
            ? [
                'Maintain strict safe perimeter (> 100 meters)',
                'Alert neighboring farms and notify village forest committee',
                'Contact local Forest Department Rapid Response Team (RRT)'
              ]
            : [
                'Inspect perimeter fencing and crop boundary wire',
                'Confirm species from a safe observation distance',
                'Log incident in AgroVision event ledger'
              ],
          isSupportedAnimal: true
        };

        await _logWildlifeResult(
          resultSpecies,
          topAnimal.confidencePercent,
          imgUrl,
          sourceLabel,
          false,
          topAnimal.label
        );
        return;
      }

      // If no animal was detected, check if non-animal objects (e.g. car, person) were detected
      if (otherDetections.length > 0) {
        const topOther = otherDetections[0];
        setDetectedResult({
          id: `obj-${topOther.cocoClass}`,
          commonName: `Non-Wildlife Object: ${topOther.label.toUpperCase()}`,
          scientificName: `Detected Class: "${topOther.cocoClass}"`,
          threatLevel: 'None',
          defaultConfidence: topOther.confidencePercent,
          typicalHabit: `Detected "${topOther.cocoClass}" in field view. No wild animal detected.`,
          safetyGuidance: 'No wild animal present in this photograph. The detected target is an inanimate object, vehicle, or human.',
          recommendedActions: [
            'No wildlife deterrent action required',
            'Verify camera angle and perimeter boundary view'
          ],
          isNonWildlife: true
        });
        setSuccessBanner(`Scanned: Inanimate target "${topOther.label}" detected (${topOther.confidencePercent}). No wildlife threat logged.`);
        return;
      }

      // No animal or object detected above threshold (e.g. wild boar / deer which are not in standard COCO-SSD)
      setDetectedResult({
        id: 'unidentified',
        commonName: 'Species could not be identified reliably',
        scientificName: 'No supported animal detected above confidence threshold',
        threatLevel: 'Low',
        defaultConfidence: 'Uncertain (< 40%)',
        typicalHabit: 'The computer vision model could not identify a supported wild animal in this image with sufficient confidence.',
        safetyGuidance: 'Ensure the animal is clearly visible, centered, and well-lit. Note: Standard COCO-SSD weights support Elephant, Bear, Zebra, Giraffe, Cattle, Sheep, Horse, Canine, Bird. They do not contain custom classes for Wild Boar (Sus scrofa) or Spotted Deer (Axis axis). To recognize those specific species, deploy custom YOLOv8 weights via the backend.',
        recommendedActions: [
          'Upload a clearer, well-lit photo showing the entire animal',
          'Deploy custom wildlife weights (yolov8n_wildlife.pt) via the AgroVision backend'
        ],
        isUncertain: true
      });

      setErrorMessage(
        'Species could not be identified reliably. COCO-SSD detected no supported wildlife with high confidence. Note: Standard COCO-SSD does not contain classes for Wild Boar or Spotted Deer.'
      );
    } catch (err) {
      console.warn('Wildlife inference error:', err);
      setDetectedResult(null);
      setErrorMessage(`Identification could not complete: ${err.message || 'Please test with a clear photo.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Internal helper to log real result & trigger chime
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
      detectedLabel,
      isApproximate,
      defaultConfidence: confidenceStr,
      isModelResult: true
    };
    setDetectedResult(resultToShow);

    // Play mild chime only on genuine supported animal detections
    if (soundEnabled && speciesData.threatLevel !== 'None' && !speciesData.isNonWildlife && !speciesData.isUncertain) {
      playMildWildlifeChime({ volume: soundVolume });
    }

    // ONLY save real supported animal detections to the incident history ledger (NEVER save non-wildlife or presets)
    if (speciesData.threatLevel !== 'None' && !speciesData.isNonWildlife && !speciesData.isUncertain && !speciesData.isPresetReference) {
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
        message: `Detected at ${incidentLocation}. Confidence: ${confidenceStr}. Follow perimeter safety guidelines.`,
        time: 'Just now',
        severity: speciesData.threatLevel === 'High' ? 'danger' : 'warning',
        read: false
      });

      setSuccessBanner(
        `Identified: ${speciesData.commonName} (${confidenceStr}). Logged to incident ledger.`
      );

      if (onEventLogged) onEventLogged();
    }
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
    if (window.confirm('Delete this incident record?')) {
      const updated = deleteWildlifeEvent(id);
      setHistoryRecords(updated);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm('Clear all wildlife detection incident logs?')) {
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
            Safeguarding agricultural acreage from nocturnal wildlife incursions with edge computer vision, harmless auditory chimes, and safe perimeter guidance.
          </p>
        </div>

        {/* AI Model Status Banner */}
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
              <strong>Wildlife AI Vision Engine (COCO-SSD):</strong>&nbsp;
              {modelStatus === 'idle' && 'Initializing TensorFlow.js COCO-SSD object detector…'}
              {modelStatus === 'loading' && 'Loading COCO-SSD model weights into browser…'}
              {modelStatus === 'ready' && 'Model Ready — Real client-side object detection active'}
              {modelStatus === 'error' && 'Model load failed — check network connectivity and reload'}
            </span>
          </div>
          <span className="disclaimer-chip">
            {modelStatus === 'loading' && <><Icon name="refresh" size={13} className="spin" /> Loading…</>}
            {modelStatus === 'ready' && 'COCO-SSD TF.js • Live Bounding Boxes'}
            {modelStatus === 'error' && 'Model Offline'}
          </span>
        </div>

        {/* Audio Alert Controls Toolbar */}
        <div className="wildlife-audio-toolbar">
          <div className="audio-tool-left">
            <div className="audio-icon-box">
              <Icon
                name={soundEnabled ? 'volume-2' : 'volume-x'}
                size={20}
                color={soundEnabled ? '#16a34a' : '#94a3b8'}
              />
            </div>
            <div>
              <span className="tool-title">Mild Two-Tone Alert Chime:</span>
              <span className="tool-desc">
                {soundEnabled ? 'Active (Soft C5-E5 Harmonic Chime • Non-startling)' : 'Silenced'}
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
              <span>Test Chime</span>
            </button>
          </div>
        </div>

        {/* Preset Animal Quick Selector Bar */}
        <div className="species-selector-bar">
          <span className="spec-label">
            <Icon name="shield-alert" size={16} color="#d97706" />
            Reference Species Presets:
          </span>
          <div className="spec-chips-row">
            {speciesList.map((spec) => (
              <button
                key={spec.id}
                type="button"
                className={`species-chip ${activePreset?.id === spec.id && inputSource === 'preset' ? 'active' : ''}`}
                onClick={() => handleSelectPreset(spec)}
                title={`Inspect ${spec.commonName} reference profile`}
              >
                <span>{spec.commonName}</span>
                <span className={`chip-threat ${spec.threatLevel.toLowerCase()}`}>
                  {spec.threatLevel}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Interface: Viewfinder Left, Warning Panel Right */}
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
                    setInputSource(selectedFile ? 'upload' : 'preset');
                  }}
                >
                  <Icon name="camera" size={16} />
                  Image Specimen
                </button>
                <button
                  type="button"
                  id="open-camera-btn"
                  className={`src-tab ${isCameraActive ? 'active' : ''}`}
                  onClick={() => startCamera()}
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
              {/* Camera stream wrap */}
              <div
                className="camera-stream-wrap"
                style={{ display: isCameraActive ? 'block' : 'none', position: 'relative' }}
              >
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="live-video-element"
                  style={{ display: 'block', width: '100%', borderRadius: '8px' }}
                />
                {/* Real-time bounding box canvas overlay on video */}
                <canvas
                  ref={streamOverlayCanvasRef}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    borderRadius: '8px'
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
                <div className="image-preview-wrap" style={{ position: 'relative' }}>
                  <img
                    ref={imageElRef}
                    src={previewImage}
                    alt="Wildlife Specimen"
                    className="preview-wildlife-img"
                    onError={(e) => handleImageFallback(e, 'wildlife')}
                  />

                  {/* Viewfinder standby HUD if idle */}
                  {inputSource === 'idle' && (
                    <div className="viewfinder-idle-hud" style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(9, 14, 11, 0.62)',
                      backdropFilter: 'blur(2px)',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      padding: '24px',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}>
                      <Icon name="camera" size={38} color="#4ade80" />
                      <h4 style={{ margin: '12px 0 6px', fontSize: '1.1rem', fontWeight: 600 }}>Perimeter Surveillance Standby</h4>
                      <p style={{ margin: 0, fontSize: '0.88rem', color: '#cbd5e1', maxWidth: '380px' }}>
                        Upload an animal photo or open camera to scan for wildlife incursions using edge AI.
                      </p>
                    </div>
                  )}

                  {/* Real dynamic bounding box canvas overlay for static images */}
                  <canvas
                    ref={imageOverlayCanvasRef}
                    className="static-image-bbox-canvas"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      borderRadius: '8px'
                    }}
                  />

                  {isAnalyzing && (
                    <div className="analyzing-backdrop">
                      <Icon name="refresh" size={28} className="spin" color="#ffffff" />
                      <p>Running COCO-SSD Object Detection…</p>
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
                    id="wildlife-capture-btn"
                    className="btn btn-warning-glass"
                    onClick={handleCaptureCamera}
                  >
                    <Icon name="camera" size={16} />
                    Capture & Analyze Frame
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
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  />

                  <button
                    type="button"
                    id="wildlife-open-camera-btn"
                    className="btn btn-outline btn-sm"
                    onClick={() => startCamera()}
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
                    id="wildlife-analyze-btn"
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      runWildlifeInference(
                        null,
                        previewImage,
                        selectedFile ? 'Uploaded Image' : capturedDataUrl ? 'Live Camera Capture' : 'Preset Specimen'
                      )
                    }
                    disabled={isAnalyzing}
                  >
                    <Icon name="scan" size={16} />
                    {isAnalyzing
                      ? 'Analyzing Image…'
                      : inputSource === 'preset'
                      ? 'Analyze Preset with COCO-SSD'
                      : 'Analyze Animal'}
                  </button>

                  {(selectedFile || capturedDataUrl || activePreset) && (
                    <button
                      type="button"
                      className="btn btn-glass btn-sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setCapturedDataUrl(null);
                        setActivePreset(null);
                        setPreviewImage('/images/wildlife-placeholder.jpg');
                        setInputSource('idle');
                        setDetectedResult(null);
                        setCurrentDetections([]);
                        if (imageOverlayCanvasRef.current) clearCanvas(imageOverlayCanvasRef.current);
                        setErrorMessage('');
                        setSuccessBanner('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Clear image and restore standby viewfinder"
                    >
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Error & Success Messages */}
            {cameraError && (
              <div className="camera-error-banner" style={{ margin: '10px 14px' }}>
                <Icon name="alert-triangle" size={16} color="#ef4444" />
                <span>{cameraError}</span>
              </div>
            )}

            {errorMessage && (
              <div className="error-alert-box" style={{ margin: '10px 14px' }}>
                <Icon name="alert-triangle" size={16} color="#ef4444" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successBanner && (
              <div className="save-success-toast" style={{ margin: '10px 14px' }}>
                <Icon name="check-circle" size={16} color="#16a34a" />
                <span>{successBanner}</span>
              </div>
            )}

            {/* GPS Incident Location Bar */}
            <div className="incident-loc-bar">
              <div className="loc-label-col">
                <Icon name="map-pin" size={16} color="#16a34a" />
                <span className="loc-title">Surveillance Location:</span>
                <span className="loc-val">{incidentLocation}</span>
              </div>
              <button
                type="button"
                id="wildlife-gps-btn"
                className="btn btn-outline btn-xs"
                onClick={handleRequestLocation}
                disabled={isLocating}
                title="Acquire device GPS coordinates"
              >
                <Icon name="crosshair" size={12} className={isLocating ? 'spin' : ''} />
                <span>{isLocating ? 'Acquiring GPS...' : 'Lock Device GPS'}</span>
              </button>
            </div>
            {locationStatus && (
              <div style={{ padding: '0 14px 10px', fontSize: '0.8rem', opacity: 0.85, color: '#16a34a' }}>
                {locationStatus}
              </div>
            )}
          </div>

          {/* Right Column: Species Intelligence & Response Protocol */}
          <div className="wildlife-response-card">
            {detectedResult ? (
              <div className="species-profile-panel">
                <div className="sp-header-row">
                  <div>
                    <span className="sp-kicker">
                      {detectedResult.isPresetReference ? 'Reference Knowledge Base Specimen' : 'Perimeter Vision Result'}
                    </span>
                    <h3 className="sp-common-name">{detectedResult.commonName}</h3>
                    <span className="sp-sci-name">{detectedResult.scientificName}</span>
                  </div>

                  <div className="sp-threat-col">
                    <span className={`threat-badge-lg ${detectedResult.threatLevel?.toLowerCase() || 'low'}`}>
                      {detectedResult.threatLevel} Threat
                    </span>
                    <span className="sp-conf">
                      Confidence: <strong>{detectedResult.defaultConfidence}</strong>
                    </span>
                  </div>
                </div>

                {detectedResult.isPresetReference && (
                  <div className="demo-mode-notice" style={{ margin: '12px 0', borderColor: '#16a34a' }}>
                    <Icon name="shield" size={16} color="#16a34a" />
                    <span>
                      <strong>Educational Knowledge Base Entry:</strong> This is a reference wildlife profile from the AgroVision database detailing typical habits and non-lethal deterrent methods. Click <strong>"Analyze Preset with COCO-SSD"</strong> to execute real vision inference on this photo.
                    </span>
                  </div>
                )}

                {detectedResult.isModelResult && (
                  <div className="demo-mode-notice" style={{ margin: '12px 0', borderColor: '#0284c7' }}>
                    <Icon name="info" size={16} color="#0284c7" />
                    <span>
                      <strong>Real COCO-SSD Inference Active:</strong> Real-time neural object detection executed. Bounding boxes are drawn to actual detected object coordinates.
                    </span>
                  </div>
                )}

                {/* Ecological Habit & Safety */}
                <div className="sp-sections-stack">
                  <div className="sp-section">
                    <div className="sp-sec-title">
                      <Icon name="leaf" size={15} color="#16a34a" />
                      <span>Foraging Behavior & Crop Risk</span>
                    </div>
                    <p className="sp-sec-text">{detectedResult.typicalHabit}</p>
                  </div>

                  <div className="sp-section highlight-guidance">
                    <div className="sp-sec-title">
                      <Icon name="shield-alert" size={15} color="#ef4444" />
                      <span>Farmer Safety Protocol & Distance Rules</span>
                    </div>
                    <p className="sp-sec-text">{detectedResult.safetyGuidance}</p>
                  </div>

                  <div className="sp-section">
                    <div className="sp-sec-title">
                      <Icon name="check-circle" size={15} color="#0284c7" />
                      <span>Non-Lethal Perimeter Actions</span>
                    </div>
                    <ul className="sp-actions-list">
                      {(detectedResult.recommendedActions || []).map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="diagnostic-empty-state">
                <div className="empty-icon-wrap">
                  <Icon name="shield-alert" size={36} color="#d97706" />
                </div>
                <h3>Wildlife Surveillance Standby</h3>
                <p>
                  Click a reference species above to review safety protocols, or open live camera / upload a field photograph, then click <strong>"Analyze Animal"</strong>.
                </p>
                <div className="empty-tips-box">
                  <strong>Vision Model Coverage (COCO-SSD):</strong>
                  <ul>
                    <li>Directly detects: Elephants, Bears, Ungulates, Livestock (Cattle/Sheep/Horses), Stray Canines, Birds</li>
                    <li>For custom Wild Boar or Spotted Deer classifiers, deploy the custom YOLOv8 model weights via the backend</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Table & Ledger */}
        <div className="wildlife-history-card">
          <div className="history-header-row">
            <div>
              <h3 className="hist-title">Perimeter Wildlife Intrusion Ledger</h3>
              <p className="hist-subtitle">
                Timestamped records of animal detections, confidence scores, and logged incident coordinates.
              </p>
            </div>

            <div className="hist-actions-row">
              <input
                type="text"
                placeholder="Search species or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="hist-search-input"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="hist-filter-select"
              >
                <option value="all">All Threat Levels</option>
                <option value="high">High Threat Only</option>
                <option value="medium">Medium Threat</option>
                <option value="low">Low Threat</option>
              </select>

              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={handleExportCSV}
                disabled={!historyRecords.length}
                title="Download CSV report"
              >
                <Icon name="download" size={13} />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                className="btn btn-glass btn-xs text-danger"
                onClick={handleClearAllHistory}
                disabled={!historyRecords.length}
                title="Clear all saved incident logs"
              >
                <Icon name="trash" size={13} />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="history-table-container">
            <table className="wildlife-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Animal Species</th>
                  <th>Confidence</th>
                  <th>Location & Sector</th>
                  <th>Timestamp</th>
                  <th>Threat</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-table-cell" style={{ padding: '36px 16px', textAlign: 'center' }}>
                      <div className="empty-wildlife-history" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Icon name="clock" size={34} color="#16a34a" />
                        <h4 style={{ margin: '12px 0 4px', fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>
                          No detection history yet. Upload an image to begin.
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                          Capture a live camera frame or upload an animal photograph above to identify species and log incidents.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length > 0 ? (
                  filteredHistory.map((rec) => (
                    <tr key={rec.id}>
                      <td className="font-mono text-muted">{rec.id}</td>
                      <td>
                        <div className="table-species-cell">
                          <img
                            src={rec.thumbnail || getWildlifeSpeciesImage(rec.speciesCommon || rec.species)}
                            alt={rec.speciesCommon || rec.species}
                            className="table-thumb"
                            onError={(e) => handleImageFallback(e, 'wildlife', rec.speciesCommon || rec.species)}
                          />
                          <div>
                            <strong>{rec.speciesCommon || rec.species}</strong>
                            {rec.isDemo && <span className="demo-table-tag">Reference</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="conf-pill">{rec.confidence}</span>
                      </td>
                      <td className="text-secondary">{rec.location}</td>
                      <td className="text-muted text-sm">{rec.timestamp}</td>
                      <td>
                        <span className={`threat-badge-sm ${rec.threatLevel?.toLowerCase() || 'medium'}`}>
                          {rec.threatLevel || 'Medium'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-glass btn-xs"
                          onClick={() => handleDeleteRecord(rec.id)}
                          title="Delete incident entry"
                        >
                          <Icon name="trash" size={12} color="#ef4444" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty-table-cell" style={{ padding: '24px 16px', textAlign: 'center' }}>
                      <p style={{ margin: 0, color: '#94a3b8' }}>
                        No wildlife incidents recorded matching the filter.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

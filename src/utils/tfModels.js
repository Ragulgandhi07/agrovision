/**
 * AgroVision – TensorFlow.js Model Loader & Real Inference Utilities
 *
 * Explicitly initializes @tensorflow/tfjs backend (WebGL / CPU)
 * Loads COCO-SSD from local public assets (/models/coco-ssd/model.json) with remote fallback.
 *
 * MODELS:
 * 1. Wildlife Detection: COCO-SSD (Object detection on 80 COCO classes)
 *    Directly detects: elephant, bear, zebra, giraffe, cow, sheep, horse, dog, cat, bird, person, car, etc.
 *    Honesty: COCO-SSD standard weights do NOT contain custom classes for Wild Boar, Spotted Deer,
 *    or Macaque. The system reports the exact detected COCO class without inventing fake classifications.
 *
 * 2. Crop Health Screening: MobileNet v2 (ImageNet 1000 categories)
 *    Honesty: MobileNet is a general-purpose vision classifier. It identifies visual categories
 *    and general botanical traits, NOT clinical microscopic foliar plant diseases.
 *    Clinical plant pathology requires a custom PlantVillage-trained model (e.g. crop_pathology_resnet.pth).
 */

import * as tf from '@tensorflow/tfjs';

// ── Model Instances & Status Tracking ─────────────────────────────────────────
let cocoModel = null;
let mobileNetModel = null;
let cocoStatus = 'idle';        // idle | loading | ready | error
let mobileNetStatus = 'idle';

const cocoListeners = new Set();
const mobileNetListeners = new Set();

function notifyListeners(set, status) {
  set.forEach((fn) => {
    try { fn(status); } catch (_) {}
  });
}

export function subscribeCocoStatus(fn) {
  cocoListeners.add(fn);
  fn(cocoStatus);
  return () => cocoListeners.delete(fn);
}

export function subscribeMobileNetStatus(fn) {
  mobileNetListeners.add(fn);
  fn(mobileNetStatus);
  return () => mobileNetListeners.delete(fn);
}

export function getCocoStatus() { return cocoStatus; }
export function getMobileNetStatus() { return mobileNetStatus; }

// ── COCO-SSD Loader ───────────────────────────────────────────────────────────
export async function loadCocoModel() {
  if (cocoModel) return cocoModel;

  if (cocoStatus === 'loading') {
    return new Promise((resolve, reject) => {
      const unsub = subscribeCocoStatus((s) => {
        if (s === 'ready') { unsub(); resolve(cocoModel); }
        if (s === 'error') { unsub(); reject(new Error('COCO-SSD model failed to load.')); }
      });
    });
  }

  cocoStatus = 'loading';
  notifyListeners(cocoListeners, 'loading');

  try {
    // 1. Ensure TensorFlow.js backend is fully initialized
    await tf.ready();

    const cocoSsd = await import('@tensorflow-models/coco-ssd');

    // 2. Try loading from local bundled assets in /models/coco-ssd/ (offline-ready, zero latency)
    try {
      const localUrl = typeof window !== 'undefined' && window.location?.origin
        ? new URL('/models/coco-ssd/model.json', window.location.origin).href
        : '/models/coco-ssd/model.json';

      cocoModel = await cocoSsd.load({ modelUrl: localUrl });
      cocoStatus = 'ready';
      notifyListeners(cocoListeners, 'ready');
      return cocoModel;
    } catch (localErr) {
      console.warn('Local COCO-SSD model load notice, attempting remote repository:', localErr.message);
    }

    // 3. Fallback to standard Google Cloud Storage weights
    cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
    cocoStatus = 'ready';
    notifyListeners(cocoListeners, 'ready');
    return cocoModel;
  } catch (err) {
    console.error('COCO-SSD load error:', err);
    cocoStatus = 'error';
    notifyListeners(cocoListeners, 'error');
    throw err;
  }
}

// ── MobileNet Loader ──────────────────────────────────────────────────────────
export async function loadMobileNetModel() {
  if (mobileNetModel) return mobileNetModel;

  if (mobileNetStatus === 'loading') {
    return new Promise((resolve, reject) => {
      const unsub = subscribeMobileNetStatus((s) => {
        if (s === 'ready') { unsub(); resolve(mobileNetModel); }
        if (s === 'error') { unsub(); reject(new Error('MobileNet model failed to load.')); }
      });
    });
  }

  mobileNetStatus = 'loading';
  notifyListeners(mobileNetListeners, 'loading');

  try {
    await tf.ready();
    const mn = await import('@tensorflow-models/mobilenet');
    mobileNetModel = await mn.load({ version: 2, alpha: 1.0 });
    mobileNetStatus = 'ready';
    notifyListeners(mobileNetListeners, 'ready');
    return mobileNetModel;
  } catch (err) {
    console.error('MobileNet load error:', err);
    mobileNetStatus = 'error';
    notifyListeners(mobileNetListeners, 'error');
    throw err;
  }
}

// ── COCO-SSD Animal Class Metadata ───────────────────────────────────────────
export const COCO_ANIMAL_CLASSES = {
  elephant: {
    speciesId: 'asian-elephant',
    label: 'Asian Elephant (Elephas maximus)',
    threatLevel: 'High',
    isSupportedWildlife: true,
    guidance: 'CRITICAL PERIMETER THREAT: Elephant detected. Maintain safe perimeter (> 100m). Alert neighboring plots and notify Forest Dept RRT.'
  },
  bear: {
    speciesId: 'wild-bear',
    label: 'Wild Bear / Large Carnivore',
    threatLevel: 'High',
    isSupportedWildlife: true,
    guidance: 'DANGER: Large predator spotted near farm perimeter. Keep clear of dense brush and do not approach.'
  },
  zebra: {
    speciesId: 'wild-herbivore',
    label: 'Wild Herbivore / Ungulate',
    threatLevel: 'Low',
    isSupportedWildlife: true,
    guidance: 'Wild grazing animal detected. Check border fence and use mild solar flashers.'
  },
  giraffe: {
    speciesId: 'large-herbivore',
    label: 'Large Herbivore',
    threatLevel: 'Medium',
    isSupportedWildlife: true,
    guidance: 'Large herbivore detected near canopy trees. Monitor boundary fence.'
  },
  cow: {
    speciesId: 'livestock-cow',
    label: 'Cattle / Cow (Stray Livestock)',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Domestic cattle grazing near crop boundary. Check perimeter gates and guide animal away calmly.'
  },
  sheep: {
    speciesId: 'livestock-sheep',
    label: 'Sheep / Goat (Stray Livestock)',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Small livestock stray detected. Inspect boundary fence mesh to prevent cover-crop damage.'
  },
  horse: {
    speciesId: 'livestock-horse',
    label: 'Horse / Equine (Stray Animal)',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Equine stray near field path. Observe from safe distance.'
  },
  dog: {
    speciesId: 'canine-stray',
    label: 'Canine / Dog (Stray Animal)',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Stray canine detected near perimeter. Ensure livestock shelters are latched.'
  },
  cat: {
    speciesId: 'feline-stray',
    label: 'Feline / Cat',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Domestic or stray feline. Harmless to field crops.'
  },
  bird: {
    speciesId: 'avian',
    label: 'Bird / Avian Pest',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Avian flock detected near crop canopy. Use visual bird-tape reflectors or ribbon lines.'
  },
  person: {
    speciesId: 'human',
    label: 'Human / Farm Operator',
    threatLevel: 'None',
    isSupportedWildlife: false,
    guidance: 'Authorized farm operator or pedestrian in detection zone.'
  }
};

const MIN_DETECTION_CONFIDENCE = 0.40;

/**
 * Execute real COCO-SSD object detection on an image, video, or canvas element.
 * Returns raw model predictions and classified results.
 */
export async function runWildlifeDetection(imageSource) {
  const model = await loadCocoModel();
  const rawPredictions = await model.detect(imageSource);

  const animalResults = [];
  const otherResults = [];

  for (const pred of rawPredictions) {
    const cls = pred.class.toLowerCase();
    const score = pred.score;

    if (score < MIN_DETECTION_CONFIDENCE) continue;

    if (COCO_ANIMAL_CLASSES[cls]) {
      const meta = COCO_ANIMAL_CLASSES[cls];
      animalResults.push({
        speciesId: meta.speciesId,
        label: meta.label,
        threatLevel: meta.threatLevel,
        isSupportedWildlife: meta.isSupportedWildlife,
        guidance: meta.guidance,
        confidence: score,
        confidencePercent: `${(score * 100).toFixed(1)}%`,
        cocoClass: cls,
        bbox: pred.bbox,
        isAnimal: true
      });
    } else {
      otherResults.push({
        label: pred.class,
        cocoClass: cls,
        confidence: score,
        confidencePercent: `${(score * 100).toFixed(1)}%`,
        bbox: pred.bbox,
        threatLevel: 'None',
        isAnimal: false
      });
    }
  }

  // Sort animals by highest confidence first
  animalResults.sort((a, b) => b.confidence - a.confidence);
  otherResults.sort((a, b) => b.confidence - a.confidence);

  return {
    animalDetections: animalResults,
    otherDetections: otherResults,
    allRawDetections: rawPredictions
  };
}

/**
 * Execute real MobileNet classification on a crop leaf element
 */
export async function runCropClassification(imageSource) {
  const model = await loadMobileNetModel();
  const predictions = await model.classify(imageSource, 5);

  const top = predictions[0];
  const topProb = top?.probability ?? 0;

  if (topProb < 0.22) {
    return {
      status: 'uncertain',
      topLabel: top?.className ? top.className.split(',')[0] : 'Unidentified',
      topConfidence: topProb,
      topConfidencePercent: `${(topProb * 100).toFixed(1)}%`,
      allPredictions: predictions,
      isPathologyModel: false,
      message: 'Visual features too faint or low confidence to classify. Please provide a clear, well-lit close-up of the leaf surface.',
      disclaimer: 'MobileNet v2 ImageNet vision model active. Not certified for microscopic plant pathology.'
    };
  }

  if (topProb < 0.50) {
    return {
      status: 'low_confidence',
      topLabel: top.className.split(',')[0],
      topConfidence: topProb,
      topConfidencePercent: `${(topProb * 100).toFixed(1)}%`,
      allPredictions: predictions,
      isPathologyModel: false,
      message: `Low confidence visual match: "${top.className.split(',')[0]}" (${(topProb * 100).toFixed(1)}%). Recommended: Capture leaf against a plain background under direct diffuse light.`,
      disclaimer: 'MobileNet v2 ImageNet vision model active. For clinical crop disease diagnosis, custom PlantVillage weights are required.'
    };
  }

  return {
    status: 'detected',
    topLabel: top.className.split(',')[0],
    topConfidence: topProb,
    topConfidencePercent: `${(topProb * 100).toFixed(1)}%`,
    allPredictions: predictions,
    isPathologyModel: false,
    message: `Visual morphological classification: "${top.className.split(',')[0]}" (${(topProb * 100).toFixed(1)}%)`,
    disclaimer: 'Notice: MobileNet v2 is an ImageNet visual classifier, not a clinical crop pathology diagnostic model. It identifies general visual categories. For verified foliar disease diagnosis, a PlantVillage-trained classifier is required.'
  };
}

/**
 * Draw bounding boxes and confidence badges onto an HTMLCanvasElement
 */
export function drawBoundingBoxes(canvas, detections, sourceWidth, sourceHeight) {
  if (!canvas || !detections || detections.length === 0) return;

  const ctx = canvas.getContext('2d');
  const scaleX = canvas.width / (sourceWidth || canvas.width);
  const scaleY = canvas.height / (sourceHeight || canvas.height);

  for (const det of detections) {
    const [bx, by, bw, bh] = det.bbox;
    const x = bx * scaleX;
    const y = by * scaleY;
    const w = bw * scaleX;
    const h = bh * scaleY;

    const isHighThreat = det.threatLevel === 'High';
    const isDomestic = det.threatLevel === 'None' || det.threatLevel === 'Low';
    const boxColor = isHighThreat ? '#ef4444' : isDomestic ? '#3b82f6' : '#f59e0b';

    // Box border with glow
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = boxColor;
    ctx.shadowBlur = 8;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;

    // Label tag above or inside box
    const labelText = `${(det.label || det.cocoClass || 'Object').split('(')[0].trim()}: ${det.confidencePercent}`;
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const textW = ctx.measureText(labelText).width;
    const badgeY = y > 24 ? y - 22 : y + 4;

    ctx.fillStyle = boxColor;
    ctx.fillRect(x, badgeY, textW + 12, 20);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelText, x + 6, badgeY + 14);
  }
}

/**
 * Clear all drawings from an HTMLCanvasElement
 */
export function clearCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

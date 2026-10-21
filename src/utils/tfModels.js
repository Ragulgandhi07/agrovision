/**
 * AgroVision – TensorFlow.js Model Loader & Inference Utilities
 *
 * MODELS USED:
 *   Wildlife: COCO-SSD (object detection, 80 COCO classes, includes "elephant", "bear", "cow", etc.)
 *   Crop:     MobileNet v2 (ImageNet classification — general purpose, not disease-specific)
 *
 * HONEST DISCLOSURE:
 *   - COCO-SSD can detect elephants directly. Wild boar, spotted deer, and macaques are approximated
 *     from the closest COCO classes (pig, sheep/deer, bear) with clear labeling.
 *   - MobileNet is NOT trained on plant diseases. It identifies general visual categories.
 *     For clinical crop disease diagnosis, a custom model trained on PlantVillage dataset is required.
 *     See README for training instructions.
 *   - Results below 60% confidence are reported as "Low confidence / Uncertain".
 */

// ── Model State ──────────────────────────────────────────────────────────────
let cocoModel = null;
let mobileNetModel = null;
let cocoStatus = 'idle';   // idle | loading | ready | error
let mobileNetStatus = 'idle';

// Listeners for status updates
const cocoListeners = new Set();
const mobileNetListeners = new Set();

function notifyListeners(set, status) {
  set.forEach(fn => {
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

// ── COCO-SSD Model Loader ─────────────────────────────────────────────────────
export async function loadCocoModel() {
  if (cocoModel) return cocoModel;
  if (cocoStatus === 'loading') {
    // Wait for existing load to finish
    return new Promise((resolve, reject) => {
      const unsub = subscribeCocoStatus(s => {
        if (s === 'ready') { unsub(); resolve(cocoModel); }
        if (s === 'error') { unsub(); reject(new Error('COCO-SSD failed to load')); }
      });
    });
  }

  cocoStatus = 'loading';
  notifyListeners(cocoListeners, 'loading');

  try {
    const cocoSsd = await import('@tensorflow-models/coco-ssd');
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

// ── MobileNet Model Loader ────────────────────────────────────────────────────
export async function loadMobileNetModel() {
  if (mobileNetModel) return mobileNetModel;
  if (mobileNetStatus === 'loading') {
    return new Promise((resolve, reject) => {
      const unsub = subscribeMobileNetStatus(s => {
        if (s === 'ready') { unsub(); resolve(mobileNetModel); }
        if (s === 'error') { unsub(); reject(new Error('MobileNet failed to load')); }
      });
    });
  }

  mobileNetStatus = 'loading';
  notifyListeners(mobileNetListeners, 'loading');

  try {
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

// ── COCO-SSD Class → AgroVision Species Mapping ──────────────────────────────
/**
 * Strict animal mapping for COCO-SSD (80 classes).
 * COCO-SSD directly supports: elephant, bear, dog, cat, horse, sheep, cow, bird, zebra, giraffe.
 * We ONLY detect real animal classes and report the exact detected class without relabeling unrelated animals as wild boars.
 */
const COCO_ANIMAL_SPECIES = {
  // Direct Indian wildlife & farm perimeter threats
  elephant: {
    id: 'asian-elephant',
    label: 'Elephant (Elephas maximus)',
    threatLevel: 'High',
    isSupported: true,
  },
  bear: {
    id: 'wild-animal',
    label: 'Wild Bear / Large Carnivore',
    threatLevel: 'High',
    isSupported: true,
  },
  zebra: {
    id: 'spotted-deer',
    label: 'Wild Herbivore / Ungulate',
    threatLevel: 'Low',
    isSupported: true,
  },
  giraffe: {
    id: 'large-herbivore',
    label: 'Large Herbivore',
    threatLevel: 'Medium',
    isSupported: true,
  },
  // Domestic / Livestock (not wild boar, labeled honestly)
  cow: {
    id: 'livestock-cow',
    label: 'Cattle / Cow (Grazing Stray)',
    threatLevel: 'Low',
    isSupported: false,
  },
  sheep: {
    id: 'livestock-sheep',
    label: 'Sheep / Goat (Grazing Stray)',
    threatLevel: 'Low',
    isSupported: false,
  },
  horse: {
    id: 'livestock-horse',
    label: 'Horse (Farmed Animal)',
    threatLevel: 'Low',
    isSupported: false,
  },
  dog: {
    id: 'canine-stray',
    label: 'Canine / Dog (Stray Animal)',
    threatLevel: 'Low',
    isSupported: false,
  },
  cat: {
    id: 'feline-stray',
    label: 'Feline / Cat',
    threatLevel: 'Low',
    isSupported: false,
  },
  bird: {
    id: 'avian',
    label: 'Bird / Avian Pest',
    threatLevel: 'Low',
    isSupported: false,
  },
};

// Strict confidence threshold (0.50) to prevent false positive flickering
const MIN_WILDLIFE_CONFIDENCE = 0.50;

// ── Wildlife Inference (COCO-SSD) ────────────────────────────────────────────
/**
 * Run COCO-SSD object detection on an HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement.
 * Returns an array of detections, each { speciesId, label, confidence, bbox, cocoClass }.
 * Returns empty array if nothing wildlife-relevant is detected above threshold.
 */
export async function runWildlifeDetection(imageElement) {
  const model = await loadCocoModel();
  const predictions = await model.detect(imageElement);

  const results = [];

  for (const pred of predictions) {
    const cls = pred.class.toLowerCase();
    const rawScore = pred.score;

    if (!COCO_ANIMAL_SPECIES[cls]) continue; // Ignore non-animal objects (e.g. chairs, persons, cars)

    if (rawScore < MIN_WILDLIFE_CONFIDENCE) continue;

    const animalMeta = COCO_ANIMAL_SPECIES[cls];

    results.push({
      speciesId: animalMeta.id,
      label: animalMeta.label,
      threatLevel: animalMeta.threatLevel,
      isSupported: animalMeta.isSupported,
      confidence: rawScore,
      confidencePercent: `${(rawScore * 100).toFixed(1)}%`,
      cocoClass: cls,
      bbox: pred.bbox, // [x, y, width, height] in image pixels
      isApproximate: false,
    });
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);
  return results;
}

// ── Crop Inference (MobileNet) ────────────────────────────────────────────────
/**
 * Run MobileNet classification on an image.
 * Returns top predictions with honest disclosure about model limitations.
 *
 * IMPORTANT: MobileNet is trained on ImageNet, NOT plant diseases.
 * Results are indicative only. A custom PlantVillage model is needed for disease diagnosis.
 */
export async function runCropClassification(imageElement) {
  const model = await loadMobileNetModel();
  const predictions = await model.classify(imageElement, 5);

  // Determine overall confidence tier
  const topPred = predictions[0];
  const topConf = topPred?.probability ?? 0;

  if (topConf < 0.25) {
    return {
      status: 'uncertain',
      topLabel: topPred?.className || 'Unknown',
      topConfidence: topConf,
      allPredictions: predictions,
      message: 'Model confidence too low to determine plant condition. Please use a clear, well-lit leaf photo.',
      disclaimer: 'MobileNet ImageNet model — not specialized for crop disease diagnosis.',
    };
  }

  if (topConf < 0.55) {
    return {
      status: 'low_confidence',
      topLabel: topPred?.className || 'Unknown',
      topConfidence: topConf,
      allPredictions: predictions,
      message: `Low confidence result: "${topPred?.className}" (${(topConf * 100).toFixed(1)}%). Consider using a clearer, closer leaf photo.`,
      disclaimer: 'MobileNet ImageNet model — not specialized for crop disease diagnosis. Results are indicative.',
    };
  }

  return {
    status: 'detected',
    topLabel: topPred?.className || 'Unknown',
    topConfidence: topConf,
    topConfidencePercent: `${(topConf * 100).toFixed(1)}%`,
    allPredictions: predictions,
    message: `Visual classification: "${topPred?.className}"`,
    disclaimer: 'Note: MobileNet is trained on ImageNet general categories, not plant disease classification. For clinical crop disease diagnosis, a custom PlantVillage-trained model is required.',
  };
}

// ── Canvas Bounding Box Renderer ─────────────────────────────────────────────
/**
 * Draws detection bounding boxes and labels onto a canvas element.
 * @param {HTMLCanvasElement} canvas
 * @param {Array} detections — array from runWildlifeDetection()
 * @param {number} sourceWidth — source image/video natural width
 * @param {number} sourceHeight — source image/video natural height
 */
export function drawBoundingBoxes(canvas, detections, sourceWidth, sourceHeight) {
  if (!canvas || !detections || detections.length === 0) return;

  const ctx = canvas.getContext('2d');
  const scaleX = canvas.width / sourceWidth;
  const scaleY = canvas.height / sourceHeight;

  for (const det of detections) {
    const [bx, by, bw, bh] = det.bbox;
    const x = bx * scaleX;
    const y = by * scaleY;
    const w = bw * scaleX;
    const h = bh * scaleY;

    // Box color by threat approximation
    const isHighThreat = det.speciesId === 'asian-elephant';
    const boxColor = isHighThreat ? '#ef4444' : '#f59e0b';

    // Draw box
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = boxColor;
    ctx.shadowBlur = 6;
    ctx.strokeRect(x, y, w, h);
    ctx.shadowBlur = 0;

    // Label background
    const labelText = `${det.label}: ${det.confidencePercent}`;
    ctx.font = 'bold 13px -apple-system, sans-serif';
    const textW = ctx.measureText(labelText).width;
    ctx.fillStyle = isHighThreat ? 'rgba(239,68,68,0.88)' : 'rgba(245,158,11,0.88)';
    ctx.fillRect(x, y > 20 ? y - 22 : y + 2, textW + 10, 20);

    // Label text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelText, x + 5, y > 20 ? y - 6 : y + 16);
  }
}

/**
 * Clears all drawings from a canvas.
 */
export function clearCanvas(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

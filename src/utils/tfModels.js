/**
 * AgroVision – TensorFlow.js Model Loader & Real Inference Utilities
 *
 * Wildlife identification uses two real models (no hardcoded species or fake scores):
 * 1. MobileNet v2 (ImageNet-1000) — species classification. This is the source of the
 *    displayed animal name. ImageNet includes Indian/African elephant, wild boar, tiger,
 *    macaque, gazelle/impala/hartebeest, and many other animals. It does NOT include
 *    Axis axis (spotted deer) as its own class.
 * 2. COCO-SSD — object detection for bounding boxes only. Official COCO classes include
 *    elephant, bear, zebra, giraffe, cow, sheep, horse, dog, cat, bird, and person.
 *    COCO-SSD cannot name wild boar, deer, tiger, or macaque.
 *
 * Crop health still uses MobileNet as a general visual classifier (not a pathology model).
 */

import * as tf from '@tensorflow/tfjs';
import { getAssetUrl } from './imageFallbacks';

// ── PlantVillage Disease Model: 38-Class Labels ──────────────────────────────
// Trained on PlantVillage dataset (MobileNetV2 transfer learning, 224×224 input, rescale=1/255)
export const PLANT_DISEASE_LABELS = {
  0: 'Apple___Apple_scab',
  1: 'Apple___Black_rot',
  2: 'Apple___Cedar_apple_rust',
  3: 'Apple___healthy',
  4: 'Blueberry___healthy',
  5: 'Cherry_(including_sour)___Powdery_mildew',
  6: 'Cherry_(including_sour)___healthy',
  7: 'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
  8: 'Corn_(maize)___Common_rust_',
  9: 'Corn_(maize)___Northern_Leaf_Blight',
  10: 'Corn_(maize)___healthy',
  11: 'Grape___Black_rot',
  12: 'Grape___Esca_(Black_Measles)',
  13: 'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
  14: 'Grape___healthy',
  15: 'Orange___Haunglongbing_(Citrus_greening)',
  16: 'Peach___Bacterial_spot',
  17: 'Peach___healthy',
  18: 'Pepper,_bell___Bacterial_spot',
  19: 'Pepper,_bell___healthy',
  20: 'Potato___Early_blight',
  21: 'Potato___Late_blight',
  22: 'Potato___healthy',
  23: 'Raspberry___healthy',
  24: 'Soybean___healthy',
  25: 'Squash___Powdery_mildew',
  26: 'Strawberry___Leaf_scorch',
  27: 'Strawberry___healthy',
  28: 'Tomato___Bacterial_spot',
  29: 'Tomato___Early_blight',
  30: 'Tomato___Late_blight',
  31: 'Tomato___Leaf_Mold',
  32: 'Tomato___Septoria_leaf_spot',
  33: 'Tomato___Spider_mites Two-spotted_spider_mite',
  34: 'Tomato___Target_Spot',
  35: 'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
  36: 'Tomato___Tomato_mosaic_virus',
  37: 'Tomato___healthy'
};

/** Format raw PlantVillage label into human-readable crop + disease */
export function formatDiseaseLabel(rawLabel) {
  if (!rawLabel) return { crop: 'Unknown', disease: 'Unknown', isHealthy: false, displayName: 'Unknown' };
  const parts = rawLabel.split('___');
  const crop = (parts[0] || 'Unknown').replace(/_/g, ' ').replace(/\(including sour\)/i, '').trim();
  const rawDisease = (parts[1] || 'Unknown').replace(/_/g, ' ').trim();
  const isHealthy = rawDisease.toLowerCase() === 'healthy';
  const disease = isHealthy ? 'Healthy' : rawDisease;
  const displayName = isHealthy ? `${crop} — Healthy Leaf` : `${crop} — ${disease}`;
  return { crop, disease, isHealthy, displayName };
}

// ── Model Instances & Status Tracking ─────────────────────────────────────────
let cocoModel = null;
let mobileNetModel = null;
let plantDiseaseModel = null;
let cocoStatus = 'idle';        // idle | loading | ready | error
let mobileNetStatus = 'idle';   // idle | loading | ready | error
let plantDiseaseStatus = 'idle'; // idle | loading | ready | error
let cocoError = null;
let mobileNetError = null;
let plantDiseaseError = null;
let activeCocoPromise = null;
let activeMobileNetPromise = null;
let activePlantDiseasePromise = null;

export const WILDLIFE_UNCERTAIN_MESSAGE =
  'Animal not confidently identified. Please upload a clearer image or try another supported image.';

const MIN_COCO_SCORE = 0.50;
const MIN_CLASSIFY_CONFIDENCE = 0.28;
const MIN_RELIABLE_CONFIDENCE = 0.40;

const cocoListeners = new Set();
const mobileNetListeners = new Set();
const plantDiseaseListeners = new Set();

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

export function subscribePlantDiseaseStatus(fn) {
  plantDiseaseListeners.add(fn);
  fn(plantDiseaseStatus);
  return () => plantDiseaseListeners.delete(fn);
}

export function getCocoStatus() { return cocoStatus; }
export function getCocoError() { return cocoError; }
export function getMobileNetStatus() { return mobileNetStatus; }
export function getMobileNetError() { return mobileNetError; }
export function getPlantDiseaseStatus() { return plantDiseaseStatus; }
export function getPlantDiseaseError() { return plantDiseaseError; }

function resolvePublicModelUrl(relativePath) {
  const assetPath = getAssetUrl(relativePath);
  if (typeof window === 'undefined' || !window.location?.href) return assetPath;
  try {
    return new URL(assetPath, window.location.href).href;
  } catch (_) {
    return assetPath;
  }
}

// ── PlantVillage Disease Model Loader (tf.loadLayersModel) ───────────────────
export async function loadPlantDiseaseModel() {
  if (plantDiseaseModel) {
    plantDiseaseStatus = 'ready';
    return plantDiseaseModel;
  }
  if (activePlantDiseasePromise) return activePlantDiseasePromise;

  plantDiseaseStatus = 'loading';
  plantDiseaseError = null;
  notifyListeners(plantDiseaseListeners, 'loading');

  activePlantDiseasePromise = (async () => {
    try {
      await tf.ready();
      const modelUrl = resolvePublicModelUrl('models/plant-disease/model.json');
      console.log('[PlantDisease] Loading model from:', modelUrl);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Plant disease model download timed out.')), 20000)
      );
      const loaded = await Promise.race([tf.loadLayersModel(modelUrl), timeoutPromise]);

      plantDiseaseModel = loaded;
      plantDiseaseStatus = 'ready';
      plantDiseaseError = null;
      notifyListeners(plantDiseaseListeners, 'ready');
      console.log('[PlantDisease] Model loaded successfully. Input shape:', loaded.inputs[0].shape);
      return loaded;
    } catch (err) {
      console.warn('[PlantDisease] Model load failed:', err.message);
      plantDiseaseModel = null;
      plantDiseaseStatus = 'error';
      plantDiseaseError = err.message || 'Failed to load plant disease model.';
      notifyListeners(plantDiseaseListeners, 'error');
      throw err;
    } finally {
      activePlantDiseasePromise = null;
    }
  })();

  return activePlantDiseasePromise;
}

export function retryLoadPlantDiseaseModel() {
  plantDiseaseModel = null;
  plantDiseaseStatus = 'idle';
  plantDiseaseError = null;
  activePlantDiseasePromise = null;
  return loadPlantDiseaseModel();
}

/**
 * Run real PlantVillage disease classification on a leaf image element.
 * Preprocesses: resize to 224×224, normalize to [0, 1], predict with softmax output.
 * Returns top predictions with crop, disease, confidence, and raw label.
 */
export async function runPlantDiseaseClassification(imageSource) {
  try {
    const model = await loadPlantDiseaseModel();
    if (!model) {
      return {
        status: 'unavailable',
        message: 'Plant disease model is not loaded.',
        predictions: []
      };
    }

    // Preprocess: resize to 224×224, normalize to [0, 1] (matching training: rescale=1./255)
    const probabilities = tf.tidy(() => {
      const tensor = tf.browser.fromPixels(imageSource)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(255.0)
        .expandDims(0);
      return model.predict(tensor);
    });

    const probData = await probabilities.data();
    probabilities.dispose();

    // Build sorted predictions
    const allPredictions = Array.from(probData)
      .map((prob, idx) => ({
        idx,
        rawLabel: PLANT_DISEASE_LABELS[idx] || `class_${idx}`,
        probability: prob,
        confidencePercent: `${(prob * 100).toFixed(1)}%`,
        ...formatDiseaseLabel(PLANT_DISEASE_LABELS[idx])
      }))
      .sort((a, b) => b.probability - a.probability);

    const top = allPredictions[0];
    const topConfidence = top.probability;

    return {
      status: 'classified',
      topLabel: top.displayName,
      topCrop: top.crop,
      topDisease: top.disease,
      topRawLabel: top.rawLabel,
      topConfidence,
      topConfidencePercent: top.confidencePercent,
      isHealthy: top.isHealthy,
      isPathologyModel: true,
      predictions: allPredictions.slice(0, 5),
      allPredictions,
      message: `Plant disease model prediction: ${top.displayName} (${top.confidencePercent})`
    };
  } catch (err) {
    console.warn('[PlantDisease] runPlantDiseaseClassification error:', err.message);
    return {
      status: 'error',
      message: err.message || 'Plant disease inference failed.',
      predictions: []
    };
  }
}

// ── COCO-SSD Loader ───────────────────────────────────────────────────────────
export async function loadCocoModel() {
  if (cocoModel) return cocoModel;
  if (activeCocoPromise) return activeCocoPromise;

  cocoStatus = 'loading';
  cocoError = null;
  notifyListeners(cocoListeners, 'loading');

  activeCocoPromise = (async () => {
    try {
      await tf.ready();
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      const localUrl = resolvePublicModelUrl('models/coco-ssd/model.json');

      try {
        cocoModel = await cocoSsd.load({ modelUrl: localUrl });
      } catch (localErr) {
        console.warn('Local COCO-SSD unavailable, using remote lite_mobilenet_v2:', localErr.message);
        cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      }

      cocoStatus = 'ready';
      cocoError = null;
      notifyListeners(cocoListeners, 'ready');
      return cocoModel;
    } catch (err) {
      console.error('COCO-SSD load error:', err);
      cocoModel = null;
      cocoStatus = 'error';
      cocoError = err.message || 'COCO-SSD model failed to load.';
      notifyListeners(cocoListeners, 'error');
      throw err;
    } finally {
      activeCocoPromise = null;
    }
  })();

  return activeCocoPromise;
}

export function retryLoadCocoModel() {
  cocoModel = null;
  cocoStatus = 'idle';
  cocoError = null;
  activeCocoPromise = null;
  return loadCocoModel();
}

// ── MobileNet Loader with Singleton Reuse & 12s Timeout ─────────────────────
export async function loadMobileNetModel() {
  // If already loaded into memory, immediately return cached instance
  if (mobileNetModel) {
    mobileNetStatus = 'ready';
    return mobileNetModel;
  }

  // If loading is already in flight, reuse the exact same active Promise (never load repeatedly)
  if (activeMobileNetPromise) {
    return activeMobileNetPromise;
  }

  mobileNetStatus = 'loading';
  mobileNetError = null;
  notifyListeners(mobileNetListeners, 'loading');

  activeMobileNetPromise = (async () => {
    try {
      await tf.ready();
      const mn = await import('@tensorflow-models/mobilenet');
      const localUrl = resolvePublicModelUrl('models/mobilenet-v2/model.json');

      const loadPromise = (async () => {
        try {
          return await mn.load({
            version: 2,
            alpha: 1.0,
            modelUrl: localUrl,
            inputRange: [0, 1]
          });
        } catch (localErr) {
          console.warn('[MobileNet] Local load failed, falling back to TF Hub:', localErr.message);
          return await mn.load({ version: 2, alpha: 1.0 });
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Model download timed out (Google Storage CDN unreachable or blocked).')),
          25000
        )
      );

      const loaded = await Promise.race([loadPromise, timeoutPromise]);
      mobileNetModel = loaded;
      mobileNetStatus = 'ready';
      mobileNetError = null;
      notifyListeners(mobileNetListeners, 'ready');
      return loaded;
    } catch (err) {
      console.warn('MobileNet model initialization notice:', err.message);
      mobileNetModel = null;
      mobileNetStatus = 'error';
      mobileNetError = err.message || 'Network error downloading model weights.';
      notifyListeners(mobileNetListeners, 'error');
      throw err;
    } finally {
      activeMobileNetPromise = null;
    }
  })();

  return activeMobileNetPromise;
}

/**
 * Manually retry loading the MobileNet model after a failure
 */
export function retryLoadMobileNetModel() {
  mobileNetModel = null;
  mobileNetStatus = 'idle';
  mobileNetError = null;
  activeMobileNetPromise = null;
  return loadMobileNetModel();
}

// ── Honest COCO-SSD labels (only the 80 official COCO classes) ───────────────
export const COCO_ANIMAL_CLASSES = {
  elephant: {
    speciesId: 'elephant',
    label: 'Elephant',
    threatLevel: 'High',
    isSupportedWildlife: true,
    guidance: 'CRITICAL PERIMETER THREAT: Elephant detected. Maintain a safe perimeter (> 100m). Alert neighboring plots and notify Forest Dept RRT.'
  },
  bear: {
    speciesId: 'bear',
    label: 'Bear',
    threatLevel: 'High',
    isSupportedWildlife: true,
    guidance: 'DANGER: Large predator spotted near farm perimeter. Keep clear of dense brush and do not approach.'
  },
  zebra: {
    speciesId: 'zebra',
    label: 'Zebra',
    threatLevel: 'Low',
    isSupportedWildlife: true,
    guidance: 'Zebra detected. Check border fence and use mild solar flashers if the animal is near crops.'
  },
  giraffe: {
    speciesId: 'giraffe',
    label: 'Giraffe',
    threatLevel: 'Medium',
    isSupportedWildlife: true,
    guidance: 'Giraffe detected near canopy trees. Monitor boundary fence.'
  },
  cow: {
    speciesId: 'livestock-cow',
    label: 'Cow',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Domestic cattle grazing near crop boundary. Check perimeter gates and guide the animal away calmly.'
  },
  sheep: {
    speciesId: 'livestock-sheep',
    label: 'Sheep',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Sheep detected. Inspect boundary fence mesh to prevent cover-crop damage.'
  },
  horse: {
    speciesId: 'livestock-horse',
    label: 'Horse',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Horse near field path. Observe from a safe distance.'
  },
  dog: {
    speciesId: 'canine-stray',
    label: 'Dog',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Canine detected near perimeter. Ensure livestock shelters are latched.'
  },
  cat: {
    speciesId: 'feline-stray',
    label: 'Cat',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Domestic or stray feline. Harmless to field crops.'
  },
  bird: {
    speciesId: 'avian',
    label: 'Bird',
    threatLevel: 'Low',
    isSupportedWildlife: false,
    guidance: 'Bird detected near crop canopy. Use visual bird-tape reflectors or ribbon lines if flocks are feeding.'
  },
  person: {
    speciesId: 'human',
    label: 'Person',
    threatLevel: 'None',
    isSupportedWildlife: false,
    guidance: 'Person in detection zone.'
  }
};

export const WILDLIFE_MODEL_COVERAGE = {
  classifier: 'MobileNet v2 (ImageNet-1000)',
  detector: 'COCO-SSD (80 COCO classes)',
  classifierSupports: [
    'Indian elephant / African elephant / tusker',
    'Wild boar and hog/pig (Sus scrofa)',
    'Tiger, lion, leopard, jaguar, cheetah',
    'Macaque and other monkeys',
    'Gazelle, impala, hartebeest (no spotted-deer class)',
    'Bear, zebra, giraffe, livestock, dogs, cats, many birds'
  ],
  cocoSupports: [
    'elephant', 'bear', 'zebra', 'giraffe', 'cow', 'sheep', 'horse', 'dog', 'cat', 'bird', 'person'
  ],
  notSupportedAsNamedClasses: [
    'Spotted deer (Axis axis) — ImageNet has gazelle/impala/hartebeest instead',
    'Bonnet macaque specifically — ImageNet has a generic macaque class',
    'Wild boar as a COCO-SSD class — detection boxes will not say "wild boar"'
  ]
};

function percent(score) {
  return `${((score || 0) * 100).toFixed(1)}%`;
}

/**
 * Map a genuine ImageNet class string onto farm-relevant wildlife metadata.
 * Only matches actual ImageNet labels — never invents a species.
 */
export function mapImageNetToWildlife(className) {
  if (!className) return null;
  const n = String(className).toLowerCase();

  if (n.includes('tiger shark') || n.includes('tiger beetle') || n.includes('tiger cat')) {
    return null;
  }
  if (n.includes('guinea pig')) return null;
  if (n.includes('sea lion') || n.includes('lionfish')) return null;

  if (n.includes('indian elephant')) {
    return {
      id: 'asian-elephant',
      label: 'Indian Elephant',
      scientificName: 'Elephas maximus',
      threatLevel: 'High',
      family: 'elephant',
      imagenetClass: className,
      guidance: 'CRITICAL PERIMETER THREAT: Elephant detected. Maintain a safe perimeter (> 100m). Alert neighboring plots and notify Forest Dept RRT.',
      recommendedActions: [
        'Maintain a strict safe perimeter (> 100 meters)',
        'Alert neighboring farms and notify the village forest committee',
        'Contact the local Forest Department Rapid Response Team (RRT)'
      ]
    };
  }
  if (n.includes('african elephant')) {
    return {
      id: 'african-elephant',
      label: 'African Elephant',
      scientificName: 'Loxodonta africana',
      threatLevel: 'High',
      family: 'elephant',
      imagenetClass: className,
      guidance: 'CRITICAL PERIMETER THREAT: Elephant detected. Maintain a safe perimeter (> 100m). Do not block the animal’s path.',
      recommendedActions: [
        'Maintain a strict safe perimeter (> 100 meters)',
        'Alert neighboring farms',
        'Contact local wildlife authorities'
      ]
    };
  }
  if (n.includes('tusker') || (n.includes('elephant') && !n.includes('shrew'))) {
    return {
      id: 'asian-elephant',
      label: 'Elephant (ImageNet: tusker)',
      scientificName: 'Elephantidae',
      threatLevel: 'High',
      family: 'elephant',
      imagenetClass: className,
      guidance: 'CRITICAL PERIMETER THREAT: Large tusked animal consistent with elephant. Maintain a safe perimeter (> 100m).',
      recommendedActions: [
        'Maintain a strict safe perimeter (> 100 meters)',
        'Alert neighboring farms and notify the village forest committee',
        'Contact the local Forest Department Rapid Response Team (RRT)'
      ]
    };
  }
  if (n.includes('wild boar') || (/\bboar\b/.test(n) && !n.includes('seaboard'))) {
    return {
      id: 'wild-boar',
      label: 'Wild Boar',
      scientificName: 'Sus scrofa',
      threatLevel: 'Medium',
      family: 'boar',
      imagenetClass: className,
      guidance: 'Keep a safe distance. Avoid approaching or cornering the animal. Use reflective flashers, auditory buzzers, or bio-fencing.',
      recommendedActions: [
        'Inspect perimeter trenches and bio-fencing borders',
        'Activate a mild non-lethal acoustic deterrent',
        'Record the incident location for the forest department boundary log'
      ]
    };
  }
  if (/\bhog\b/.test(n) || (/\bpig\b/.test(n) && !n.includes('guinea') && !n.includes('pigeon'))) {
    return {
      id: 'wild-boar',
      label: 'Wild Boar / Pig',
      scientificName: 'Sus scrofa',
      threatLevel: 'Medium',
      family: 'boar',
      imagenetClass: className,
      guidance: 'ImageNet class is hog/pig (Sus scrofa), the same species as wild boar. Keep a safe distance and do not corner the animal.',
      recommendedActions: [
        'Inspect perimeter trenches and bio-fencing borders',
        'Activate a mild non-lethal acoustic deterrent',
        'Confirm from a safe distance whether the animal is feral or livestock'
      ]
    };
  }
  if (n.includes('warthog')) {
    return {
      id: 'warthog',
      label: 'Warthog',
      scientificName: 'Phacochoerus africanus',
      threatLevel: 'Medium',
      family: 'boar',
      imagenetClass: className,
      guidance: 'Warthog detected. Keep a safe distance; do not corner the animal.',
      recommendedActions: ['Observe from a safe distance', 'Inspect boundary fencing']
    };
  }
  if (n.includes('tiger')) {
    return {
      id: 'tiger',
      label: 'Tiger',
      scientificName: 'Panthera tigris',
      threatLevel: 'High',
      family: 'felid',
      imagenetClass: className,
      guidance: 'DANGER: Tiger identified. Leave the area immediately. Do not approach, flash lights into the animal’s eyes, or attempt to drive it away.',
      recommendedActions: [
        'Move people and livestock to shelter immediately',
        'Notify the Forest Department Rapid Response Team',
        'Do not follow or photograph the animal at close range'
      ]
    };
  }
  if (n.includes('lion,') || n.startsWith('lion') || n.includes('panthera leo')) {
    return {
      id: 'lion',
      label: 'Lion',
      scientificName: 'Panthera leo',
      threatLevel: 'High',
      family: 'felid',
      imagenetClass: className,
      guidance: 'Large felid identified. Keep a long safe distance and notify wildlife authorities.',
      recommendedActions: ['Shelter people and livestock', 'Notify wildlife authorities']
    };
  }
  if (n.includes('leopard') || n.includes('jaguar') || n.includes('cheetah') || n.includes('cougar') || n.includes('lynx')) {
    return {
      id: 'wild-felid',
      label: className.split(',')[0].trim(),
      scientificName: className,
      threatLevel: 'High',
      family: 'felid',
      imagenetClass: className,
      guidance: 'Wild felid identified. Keep a long safe distance and notify wildlife authorities.',
      recommendedActions: ['Shelter people and livestock', 'Notify wildlife authorities']
    };
  }
  if (n.includes('macaque')) {
    return {
      id: 'bonnet-macaque',
      label: 'Macaque',
      scientificName: 'Macaca',
      threatLevel: 'Medium',
      family: 'primate',
      imagenetClass: className,
      guidance: 'Avoid leaving open food waste or harvest bins. ImageNet provides a generic macaque class, not a subspecies ID.',
      recommendedActions: [
        'Secure nursery seedlings with anti-monkey mesh',
        'Harvest ripe fruit promptly',
        'Avoid leaving open water storage buckets'
      ]
    };
  }
  if (n.includes('baboon') || n.includes('guenon') || n.includes('langur') || n.includes('colobus') || n.includes('chimpanzee') || n.includes('orangutan') || n.includes('gorilla') || n.includes('gibbon') || n.includes('howler') || n.includes('capuchin') || n.includes('marmoset') || n.includes('monkey')) {
    return {
      id: 'primate',
      label: className.split(',')[0].trim(),
      scientificName: className,
      threatLevel: 'Medium',
      family: 'primate',
      imagenetClass: className,
      guidance: 'Primate detected near crops. Secure fruit and food waste. Do not feed or chase the troop.',
      recommendedActions: ['Secure harvest bins', 'Use canopy nets on fruit trees']
    };
  }
  if (n.includes('gazelle') || n.includes('impala') || n.includes('hartebeest')) {
    return {
      id: 'deer-antelope',
      label: className.split(',')[0].trim(),
      scientificName: className,
      threatLevel: 'Low',
      family: 'ungulate',
      imagenetClass: className,
      guidance: 'ImageNet has no spotted-deer (Axis axis) class. This prediction is the closest supported ungulate class (gazelle / impala / hartebeest). Use mild strobes or wind-chimes; do not harm the animal.',
      recommendedActions: [
        'Deploy chili-rope borders or shade netting',
        'Ensure field fencing is intact',
        'Log grazing pattern for seasonal monitoring'
      ]
    };
  }
  if (n.includes('zebra')) {
    return { id: 'zebra', label: 'Zebra', scientificName: 'Equus', threatLevel: 'Low', family: 'ungulate', imagenetClass: className, guidance: 'Zebra detected. Check border fencing.', recommendedActions: ['Inspect perimeter fencing'] };
  }
  if (n.includes('giraffe')) {
    return { id: 'giraffe', label: 'Giraffe', scientificName: 'Giraffa', threatLevel: 'Medium', family: 'ungulate', imagenetClass: className, guidance: 'Giraffe detected. Monitor canopy-edge fencing.', recommendedActions: ['Monitor boundary fence'] };
  }
  if (n.includes('brown bear') || n.includes('black bear') || n.includes('ice bear') || n.includes('sloth bear') || n.includes('polar bear') || n === 'bear') {
    return { id: 'bear', label: className.split(',')[0].trim(), scientificName: className, threatLevel: 'High', family: 'bear', imagenetClass: className, guidance: 'Bear detected. Keep clear of dense brush and do not approach.', recommendedActions: ['Keep people indoors', 'Notify wildlife authorities'] };
  }

  return null;
}

function isGenericAnimalClass(className) {
  if (!className) return false;
  if (mapImageNetToWildlife(className)) return true;
  const n = String(className).toLowerCase();
  const tokens = [
    'dog', 'cat', 'bird', 'ox', 'cattle', 'cow', 'ram', 'sheep', 'ibex', 'bison', 'buffalo',
    'horse', 'sorrel', 'camel', 'llama', 'deer', 'elk', 'moose', 'antelope', 'fox', 'wolf',
    'hyena', 'mongoose', 'otter', 'badger', 'skunk', 'weasel', 'kangaroo', 'wallaby', 'koala',
    'panda', 'hippopotamus', 'rhinoceros', 'ostrich', 'eagle', 'vulture', 'owl', 'goose', 'duck',
    'hen', 'cock', 'peacock', 'hare', 'rabbit'
  ];
  return tokens.some((t) => n.includes(t));
}

function formatCocoDetection(pred) {
  const cls = String(pred.class || '').toLowerCase();
  const score = pred.score;
  const meta = COCO_ANIMAL_CLASSES[cls];
  if (meta) {
    return {
      speciesId: meta.speciesId,
      label: meta.label,
      threatLevel: meta.threatLevel,
      isSupportedWildlife: meta.isSupportedWildlife,
      guidance: meta.guidance,
      confidence: score,
      confidencePercent: percent(score),
      cocoClass: cls,
      bbox: pred.bbox,
      isAnimal: true
    };
  }
  return {
    label: pred.class,
    cocoClass: cls,
    confidence: score,
    confidencePercent: percent(score),
    bbox: pred.bbox,
    threatLevel: 'None',
    isAnimal: false
  };
}

function buildIdentifiedSpecies(wildlifeMeta, confidence, source) {
  return {
    id: wildlifeMeta.id,
    label: wildlifeMeta.label,
    scientificName: wildlifeMeta.scientificName,
    threatLevel: wildlifeMeta.threatLevel,
    guidance: wildlifeMeta.guidance,
    recommendedActions: wildlifeMeta.recommendedActions || [],
    family: wildlifeMeta.family,
    imagenetClass: wildlifeMeta.imagenetClass || null,
    cocoClass: wildlifeMeta.cocoClass || null,
    confidence,
    confidencePercent: percent(confidence),
    source,
    isUncertain: false
  };
}

function uncertainSpecies() {
  return {
    id: 'unidentified',
    label: WILDLIFE_UNCERTAIN_MESSAGE,
    scientificName: '',
    threatLevel: 'Low',
    guidance: 'The vision model did not produce a reliable animal class for this photograph.',
    recommendedActions: [
      'Upload a closer, well-lit photo with the animal filling most of the frame',
      'Avoid heavy blur, extreme crop, or cluttered backgrounds'
    ],
    family: null,
    imagenetClass: null,
    cocoClass: null,
    confidence: 0,
    confidencePercent: 'Uncertain',
    source: 'none',
    isUncertain: true
  };
}

/**
 * Resolve a single honest species from MobileNet classifications + COCO boxes.
 * Never maps an unknown class onto the farm species list.
 */
function resolveWildlifeSpecies(classifications, cocoAnimals) {
  const mapped = (classifications || [])
    .map((c) => ({
      probability: c.probability,
      className: c.className,
      meta: mapImageNetToWildlife(c.className)
    }))
    .filter((c) => c.meta && c.probability >= MIN_CLASSIFY_CONFIDENCE);

  const specificElephant = mapped.find(
    (c) => c.meta.family === 'elephant' && !String(c.className).toLowerCase().includes('tusker')
  );
  const anyElephant = mapped.find((c) => c.meta.family === 'elephant');
  const cocoElephant = (cocoAnimals || []).find((d) => d.cocoClass === 'elephant' && d.confidence >= MIN_COCO_SCORE);

  if (cocoElephant && cocoElephant.confidence >= 0.55) {
    const mn = specificElephant || anyElephant;
    if (mn) {
      return buildIdentifiedSpecies(mn.meta, Math.max(mn.probability, cocoElephant.confidence), 'mobilenet+coco');
    }
    return buildIdentifiedSpecies(
      {
        id: 'asian-elephant',
        label: 'Elephant',
        scientificName: 'Elephantidae',
        threatLevel: 'High',
        family: 'elephant',
        cocoClass: 'elephant',
        guidance: COCO_ANIMAL_CLASSES.elephant.guidance,
        recommendedActions: [
          'Maintain a strict safe perimeter (> 100 meters)',
          'Alert neighboring farms and notify the village forest committee',
          'Contact the local Forest Department Rapid Response Team (RRT)'
        ]
      },
      cocoElephant.confidence,
      'coco-ssd'
    );
  }

  if (specificElephant && specificElephant.probability >= MIN_CLASSIFY_CONFIDENCE) {
    return buildIdentifiedSpecies(specificElephant.meta, specificElephant.probability, 'mobilenet');
  }

  const topMapped = mapped[0];
  if (topMapped && topMapped.probability >= MIN_RELIABLE_CONFIDENCE) {
    return buildIdentifiedSpecies(topMapped.meta, topMapped.probability, 'mobilenet');
  }
  if (topMapped && topMapped.probability >= MIN_CLASSIFY_CONFIDENCE && topMapped.meta.family) {
    return buildIdentifiedSpecies(topMapped.meta, topMapped.probability, 'mobilenet');
  }

  const topCoco = (cocoAnimals || [])[0];
  if (topCoco && topCoco.confidence >= 0.60 && topCoco.cocoClass === 'elephant') {
    return buildIdentifiedSpecies(
      {
        id: 'asian-elephant',
        label: 'Elephant',
        scientificName: 'Elephantidae',
        threatLevel: 'High',
        family: 'elephant',
        cocoClass: 'elephant',
        guidance: COCO_ANIMAL_CLASSES.elephant.guidance,
        recommendedActions: ['Maintain a strict safe perimeter (> 100 meters)']
      },
      topCoco.confidence,
      'coco-ssd'
    );
  }

  return uncertainSpecies();
}

export async function loadWildlifeModels() {
  const results = await Promise.allSettled([loadMobileNetModel(), loadCocoModel()]);
  const classifierReady = results[0].status === 'fulfilled';
  const detectorReady = results[1].status === 'fulfilled';
  if (!classifierReady && !detectorReady) {
    const err = results[0].reason || results[1].reason || new Error('Wildlife models failed to load.');
    throw err;
  }
  return { classifierReady, detectorReady };
}

/**
 * Real wildlife inference.
 * mode 'full' (default): MobileNet species name + COCO-SSD boxes.
 * mode 'live': COCO-SSD boxes only (camera loop).
 */
export async function runWildlifeDetection(imageSource, options = {}) {
  const mode = options.mode === 'live' ? 'live' : 'full';

  let rawPredictions = [];
  let classifications = [];
  let classifierError = null;
  let detectorError = null;

  if (mode === 'full') {
    try {
      const mn = await loadMobileNetModel();
      classifications = await mn.classify(imageSource, 5);
    } catch (err) {
      classifierError = err.message || 'MobileNet classifier failed.';
      console.warn('Wildlife classifier error:', classifierError);
    }
  }

  try {
    const coco = await loadCocoModel();
    rawPredictions = await coco.detect(imageSource);
  } catch (err) {
    detectorError = err.message || 'COCO-SSD detector failed.';
    console.warn('Wildlife detector error:', detectorError);
  }

  const animalResults = [];
  const otherResults = [];
  for (const pred of rawPredictions) {
    if (pred.score < MIN_COCO_SCORE) continue;
    const formatted = formatCocoDetection(pred);
    if (formatted.isAnimal) animalResults.push(formatted);
    else otherResults.push(formatted);
  }
  animalResults.sort((a, b) => b.confidence - a.confidence);
  otherResults.sort((a, b) => b.confidence - a.confidence);

  let identifiedSpecies;
  if (mode === 'live') {
    if (animalResults.length > 0) {
      const top = animalResults[0];
      identifiedSpecies = {
        id: top.speciesId,
        label: top.label,
        scientificName: `COCO-SSD class: ${top.cocoClass}`,
        threatLevel: top.threatLevel,
        guidance: top.guidance,
        recommendedActions: [],
        family: top.cocoClass,
        imagenetClass: null,
        cocoClass: top.cocoClass,
        confidence: top.confidence,
        confidencePercent: top.confidencePercent,
        source: 'coco-ssd',
        isUncertain: false
      };
    } else {
      identifiedSpecies = uncertainSpecies();
    }
  } else {
    identifiedSpecies = resolveWildlifeSpecies(classifications, animalResults);

    const topClass = classifications[0];
    if (
      identifiedSpecies.isUncertain &&
      topClass &&
      isGenericAnimalClass(topClass.className) &&
      topClass.probability >= MIN_RELIABLE_CONFIDENCE
    ) {
      identifiedSpecies = {
        id: 'generic-animal',
        label: topClass.className.split(',')[0].trim(),
        scientificName: topClass.className,
        threatLevel: 'Low',
        guidance: 'A supported ImageNet animal class was predicted. This species is outside the farm-conflict shortlist.',
        recommendedActions: ['Confirm visually from a safe distance', 'Log the incident if the animal is near crops'],
        family: 'other',
        imagenetClass: topClass.className,
        cocoClass: null,
        confidence: topClass.probability,
        confidencePercent: percent(topClass.probability),
        source: 'mobilenet',
        isUncertain: false
      };
    }
  }

  return {
    identifiedSpecies,
    animalDetections: animalResults,
    otherDetections: otherResults,
    allRawDetections: rawPredictions,
    classifications,
    classifierError,
    detectorError,
    models: {
      classifier: 'MobileNet v2 ImageNet-1000',
      detector: 'COCO-SSD'
    }
  };
}

/**
 * Execute real MobileNet classification on a crop leaf element
 */
export async function runCropClassification(imageSource) {
  try {
    const model = await loadMobileNetModel();
    if (!model || typeof model.classify !== 'function') {
      return {
        status: 'unavailable',
        topLabel: 'Unavailable',
        topConfidencePercent: '0%',
        isPathologyModel: false,
        message: 'Vision model is not loaded in memory.',
        disclaimer: 'MobileNet vision model is unavailable.'
      };
    }

    const predictions = await model.classify(imageSource, 5);
    const top = predictions[0];
    const topProb = top?.probability ?? 0;

    return {
      status: 'classified',
      topLabel: top?.className ? top.className.split(',')[0].trim() : 'Unknown Feature',
      topConfidence: topProb,
      topConfidencePercent: `${(topProb * 100).toFixed(1)}%`,
      allPredictions: predictions,
      isPathologyModel: false,
      message: `Visual morphological classification: "${top?.className ? top.className.split(',')[0].trim() : 'Foliar surface'}"`,
      disclaimer: 'Notice: MobileNet v2 is an ImageNet visual classifier, not a clinical crop pathology diagnostic model.'
    };
  } catch (err) {
    console.warn('runCropClassification exception:', err.message);
    return {
      status: 'error',
      topLabel: 'Unavailable',
      topConfidencePercent: '0%',
      isPathologyModel: false,
      message: err.message || 'Classification failed.',
      disclaimer: 'Model inference could not complete.'
    };
  }
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

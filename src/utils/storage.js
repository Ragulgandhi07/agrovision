// Storage and Data Management Utility for AgroVision
// Handles local storage persistence for detection history, farmer profile, alerts, and settings

const STORAGE_KEYS = {
  WILDLIFE_HISTORY: 'agrovision_wildlife_history_v1',
  CROP_HISTORY: 'agrovision_crop_history_v1',
  PROFILE: 'agrovision_farmer_profile_v1',
  SETTINGS: 'agrovision_user_settings_v1',
  NOTIFICATIONS: 'agrovision_notifications_v1'
};

// Initial realistic demonstration wildlife events (clearly labeled as Demonstration Data)
const INITIAL_WILDLIFE_EVENTS = [
  {
    id: 'WLD-8041',
    species: 'Wild Boar (Sus scrofa)',
    speciesCommon: 'Wild Boar',
    confidence: '94.2%',
    timestamp: '2026-10-14 05:20:15',
    source: 'Automated Camera (Night PIR)',
    location: 'Sector 4B • South Border Trench',
    status: 'Verified',
    threatLevel: 'Medium',
    isDemo: true,
    thumbnail: 'https://images.pexels.com/photos/247399/pexels-photo-247399.jpeg?auto=compress&cs=tinysrgb&w=300',
    notes: 'Foraging observed near cassava and groundnut boundary.'
  },
  {
    id: 'WLD-8039',
    species: 'Asian Elephant (Elephas maximus)',
    speciesCommon: 'Asian Elephant',
    confidence: '96.8%',
    timestamp: '2026-10-13 22:45:00',
    source: 'Live Camera Stream',
    location: 'Sector 1A • Western Forest Perimeter',
    status: 'Alert Dispatched',
    threatLevel: 'High',
    isDemo: true,
    thumbnail: 'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=300',
    notes: 'Solitary elephant detected traversing elephant corridor buffer.'
  },
  {
    id: 'WLD-8035',
    species: 'Spotted Deer (Axis axis)',
    speciesCommon: 'Spotted Deer',
    confidence: '91.5%',
    timestamp: '2026-10-13 17:15:30',
    source: 'Uploaded Image',
    location: 'Sector 3C • East Canal Bank',
    status: 'Resolved',
    threatLevel: 'Low',
    isDemo: true,
    thumbnail: 'https://images.pexels.com/photos/1345190/pexels-photo-1345190.jpeg?auto=compress&cs=tinysrgb&w=300',
    notes: 'Herd of 3 grazing on clover cover crop without crop harm.'
  }
];

// Initial realistic demonstration crop health scans
const INITIAL_CROP_SCANS = [
  {
    id: 'CRP-4102',
    crop: 'Tomato',
    condition: 'Early Blight (Alternaria solani)',
    confidence: '93.7%',
    severity: 'Moderate',
    timestamp: '2026-10-14 08:30:10',
    isDemo: true,
    status: 'Action Recommended',
    image: 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=600',
    treatment: 'Apply neem seed kernel extract (5%) or copper oxychloride. Prune lower diseased foliage.'
  },
  {
    id: 'CRP-4098',
    crop: 'Paddy / Rice',
    condition: 'Healthy Vigorous Canopy',
    confidence: '98.1%',
    severity: 'None (Healthy)',
    timestamp: '2026-10-13 14:10:45',
    isDemo: true,
    status: 'Healthy',
    image: 'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg?auto=compress&cs=tinysrgb&w=600',
    treatment: 'Maintain current water depth (2-3cm) during panicle initiation.'
  },
  {
    id: 'CRP-4095',
    crop: 'Potato',
    condition: 'Late Blight (Phytophthora infestans)',
    confidence: '91.4%',
    severity: 'High',
    timestamp: '2026-10-12 11:40:20',
    isDemo: true,
    status: 'Action Required',
    image: 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=600',
    treatment: 'Ensure furrow drainage. Spray Mancozeb 75% WP under agronomist guidance.'
  }
];

// Initial farmer profile
const INITIAL_PROFILE = {
  isLoggedIn: true,
  farmerName: 'M. Selvakumar',
  farmName: 'Green Valley Organic Agrofarm',
  district: 'Thanjavur, Tamil Nadu',
  landSize: '12.5 Acres',
  primaryCrops: 'Paddy, Banana, Sugarcane, Tomato',
  soilType: 'Alluvial Loam',
  phone: '+91 94432 18902',
  email: 'selva.agrovision@gmail.com'
};

// Initial settings
const INITIAL_SETTINGS = {
  language: 'en', // 'en' or 'ta'
  soundEnabled: true,
  soundVolume: 0.4, // 0.0 to 1.0
  browserNotifications: false,
  networkMode: 'online'
};

// Initial notifications
const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-1',
    type: 'wildlife',
    title: 'Wildlife Detected: Wild Boar',
    message: 'Motion detected at Sector 4B South Border. Gentle chime triggered.',
    time: '25 mins ago',
    severity: 'warning',
    read: false
  },
  {
    id: 'NOTIF-2',
    type: 'crop',
    title: 'Crop Diagnostic Saved: Tomato Early Blight',
    message: 'Confidence 93.7%. Recommended preventive treatment saved to history.',
    time: '2 hours ago',
    severity: 'info',
    read: false
  },
  {
    id: 'NOTIF-3',
    type: 'irrigation',
    title: 'Soil Moisture Advisory',
    message: 'Sector 2 (Chili Block) moisture dropped to 31%. Scheduled drip cycle recommended.',
    time: '4 hours ago',
    severity: 'warning',
    read: true
  },
  {
    id: 'NOTIF-4',
    type: 'weather',
    title: 'Light Showers Forecasted',
    message: 'Open-Meteo forecasts 12mm precipitation tomorrow afternoon. Pause scheduled watering.',
    time: 'Yesterday',
    severity: 'info',
    read: true
  }
];

/**
 * Wildlife History Storage
 */
export function getWildlifeHistory() {
  if (typeof window === 'undefined') return INITIAL_WILDLIFE_EVENTS;
  const stored = localStorage.getItem(STORAGE_KEYS.WILDLIFE_HISTORY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.WILDLIFE_HISTORY, JSON.stringify(INITIAL_WILDLIFE_EVENTS));
    return INITIAL_WILDLIFE_EVENTS;
  }
  // Map of old Unsplash URLs -> new reliable Pexels URLs
  const THUMBNAIL_MIGRATION = {
    'photo-1727701773949-69e701bdb680': 'https://images.pexels.com/photos/247399/pexels-photo-247399.jpeg?auto=compress&cs=tinysrgb&w=300',
    'photo-1555685812-4b943f1cb0eb': 'https://images.pexels.com/photos/247399/pexels-photo-247399.jpeg?auto=compress&cs=tinysrgb&w=300',
    'photo-1557050543-4d5f4e07ef46': 'https://images.pexels.com/photos/66898/elephant-cub-tsavo-kenya-66898.jpeg?auto=compress&cs=tinysrgb&w=300',
    'photo-1484406566174-9da000fda645': 'https://images.pexels.com/photos/1345190/pexels-photo-1345190.jpeg?auto=compress&cs=tinysrgb&w=300',
    'photo-1540573133985-87b6da6d54a9': 'https://images.pexels.com/photos/1123765/pexels-photo-1123765.jpeg?auto=compress&cs=tinysrgb&w=300',
  };
  try {
    const parsed = JSON.parse(stored);
    let updated = false;
    const sanitized = parsed.map((item) => {
      if (item.thumbnail) {
        for (const [oldId, newUrl] of Object.entries(THUMBNAIL_MIGRATION)) {
          if (item.thumbnail.includes(oldId)) {
            updated = true;
            return { ...item, thumbnail: newUrl };
          }
        }
      }
      return item;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.WILDLIFE_HISTORY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    return INITIAL_WILDLIFE_EVENTS;
  }
}

export function saveWildlifeEvent(event) {
  const current = getWildlifeHistory();
  const updated = [event, ...current];
  localStorage.setItem(STORAGE_KEYS.WILDLIFE_HISTORY, JSON.stringify(updated));
  return updated;
}

export function deleteWildlifeEvent(id) {
  const current = getWildlifeHistory();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.WILDLIFE_HISTORY, JSON.stringify(updated));
  return updated;
}

export function clearWildlifeHistory() {
  localStorage.setItem(STORAGE_KEYS.WILDLIFE_HISTORY, JSON.stringify([]));
  return [];
}

/**
 * Crop History Storage
 */
export function getCropHistory() {
  if (typeof window === 'undefined') return INITIAL_CROP_SCANS;
  const stored = localStorage.getItem(STORAGE_KEYS.CROP_HISTORY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.CROP_HISTORY, JSON.stringify(INITIAL_CROP_SCANS));
    return INITIAL_CROP_SCANS;
  }
  try {
    const parsed = JSON.parse(stored);
    const CROP_URL_MAP = {
      'photo-1592417817098-8f3d6910985b': 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=600',
      'photo-1592841200221-a6898f307baa': 'https://images.pexels.com/photos/1327838/pexels-photo-1327838.jpeg?auto=compress&cs=tinysrgb&w=600',
      'photo-1530595467537-0b5996c41f2d': 'https://images.pexels.com/photos/247599/pexels-photo-247599.jpeg?auto=compress&cs=tinysrgb&w=600',
      'photo-1518977676601-b53f82aba655': 'https://images.pexels.com/photos/144248/potatoes-vegetables-erdfrucht-bio-144248.jpeg?auto=compress&cs=tinysrgb&w=600',
    };
    let updated = false;
    const sanitized = parsed.map((item) => {
      if (item.image) {
        for (const [key, pexelsUrl] of Object.entries(CROP_URL_MAP)) {
          if (item.image.includes(key)) {
            updated = true;
            return { ...item, image: pexelsUrl };
          }
        }
        if (item.image.includes('unsplash.com')) {
          updated = true;
          return { ...item, image: 'https://images.pexels.com/photos/1084540/pexels-photo-1084540.jpeg?auto=compress&cs=tinysrgb&w=600' };
        }
      }
      return item;
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.CROP_HISTORY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (e) {
    return INITIAL_CROP_SCANS;
  }
}

export function saveCropScan(scan) {
  const current = getCropHistory();
  const updated = [scan, ...current];
  localStorage.setItem(STORAGE_KEYS.CROP_HISTORY, JSON.stringify(updated));
  return updated;
}

export function deleteCropScan(id) {
  const current = getCropHistory();
  const updated = current.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.CROP_HISTORY, JSON.stringify(updated));
  return updated;
}

export function clearCropHistory() {
  localStorage.setItem(STORAGE_KEYS.CROP_HISTORY, JSON.stringify([]));
  return [];
}

/**
 * Farmer Profile Storage
 */
export function getFarmerProfile() {
  if (typeof window === 'undefined') return INITIAL_PROFILE;
  const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
    return INITIAL_PROFILE;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_PROFILE;
  }
}

export function saveFarmerProfile(profile) {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  return profile;
}

/**
 * User Settings Storage
 */
export function getUserSettings() {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;
  const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_SETTINGS;
  }
}

export function saveUserSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  return settings;
}

/**
 * Notifications Storage
 */
export function getNotifications() {
  if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
  const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_NOTIFICATIONS;
  }
}

export function addNotification(notif) {
  const current = getNotifications();
  const updated = [notif, ...current];
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  return updated;
}

export function markNotificationAsRead(id) {
  const current = getNotifications();
  const updated = current.map(item => item.id === id ? { ...item, read: true } : item);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
  return updated;
}

export function clearNotifications() {
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  return [];
}

/**
 * CSV Export Utility
 */
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map(row => {
      return keys.map(k => {
        let val = row[k] === null || row[k] === undefined ? '' : row[k];
        val = String(val).replace(/"/g, '""');
        if (val.search(/("|,|\n)/g) >= 0) {
          val = `"${val}"`;
        }
        return val;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

import { getAssetUrl } from './utils/imageFallbacks';

// AgroVision - Master Site Data
// Professional English Only

export const siteData = {
  brand: {
    name: "AgroVision",
    fullName: "AgroVision – Real-Time Farm Monitoring & Smart Alert System",
    tagline: "Real-Time Farm Monitoring & Smart Alerts",
    subheading: "Continuous farm condition monitoring with live weather, GPS telemetry, soil moisture tracking, and smart alerts.",
    description: "Next-generation farm monitoring platform. Continuous telemetry tracking field microclimates, soil moisture gradients, smart alert notifications, and perimeter diagnostics to safeguard farm yields and livelihoods."
  },

  // Navigation Items required by specification
  navItems: [
    { id: "home", label: "Home", href: "#home" },
    { id: "dashboard", label: "Dashboard", href: "#dashboard" },
    { id: "crop-disease", label: "Crop Disease Detection", href: "#crop-disease" },
    { id: "wildlife", label: "Wildlife Detection", href: "#wildlife" },
    { id: "irrigation", label: "Smart Irrigation", href: "#irrigation" },
    { id: "weather", label: "Weather", href: "#weather" },
    { id: "crop-care", label: "Crop Care", href: "#crop-care" },
    { id: "history", label: "Detection History", href: "#history" },
    { id: "reports", label: "Reports", href: "#reports" },
    { id: "about", label: "About", href: "#about" }
  ],

  // Hero Section
  hero: {
    badge: "Smart India Hackathon • Agricultural Innovation",
    headline: "AgroVision – Real-Time Farm Monitoring App",
    subheadline: "Continuous farm condition monitoring — live weather & GPS telemetry, soil moisture & temperature monitoring, and smart farm alerts.",
    ctaDashboard: "Farm Monitoring Dashboard",
    ctaCrop: "Crop Disease Detection",
    ctaWildlife: "Wildlife Detection",
    stats: [
      { id: "scans", target: 4850, suffix: "+", label: "Crop Scans Processed" },
      { id: "wildlifeAlerts", target: 1240, suffix: "+", label: "Wildlife Alerts Logged" },
      { id: "waterSavings", target: 42, suffix: "%", label: "Estimated Water Saved" },
      { id: "farmersAssisted", target: 820, suffix: "+", label: "Farmers Assisted" }
    ]
  },

  // Agricultural Workflow Steps
  workflow: [
    {
      step: "01",
      icon: "camera",
      title: "Field Capture & Scouting",
      desc: "Farmers capture crop foliage photographs or monitor live camera boundary feeds for wildlife incursions."
    },
    {
      step: "02",
      icon: "cpu",
      title: "Edge AI Diagnosis",
      desc: "Computer vision classifiers assess foliar symptoms while YOLO object detection identifies animal species."
    },
    {
      step: "03",
      icon: "volume-2",
      title: "Mild Non-Startling Alert",
      desc: "A gentle two-tone harmonic chime sounds upon animal detection, notifying operators without panic."
    },
    {
      step: "04",
      icon: "droplet",
      title: "Automated Agronomy & Water",
      desc: "Multi-depth root moisture telemetry guides calibrated drip delivery and sustainable crop care practices."
    }
  ],

  // Platform Benefits
  benefits: [
    {
      icon: "shield",
      title: "Safe Wildlife Coexistence",
      desc: "Non-lethal perimeter alerts prevent conflict with wild boars, elephants, and deer without endangering animals or humans."
    },
    {
      icon: "leaf",
      title: "Early Foliar Disease Intervention",
      desc: "Detect fungal blights and bacterial rusts before systemic crop spread, reducing chemical pesticide dependency."
    },
    {
      icon: "droplets",
      title: "Smart Root Hydration",
      desc: "Multi-depth capacitive telemetry tracks moisture gradients at 10cm, 30cm, and 60cm to eliminate leaching."
    },
    {
      icon: "file-text",
      title: "Actionable Agricultural Reports",
      desc: "Generate printable incident logs, disease progression sheets, and CSV exports for agricultural extension visits."
    }
  ],

  // Wildlife Detection Species Database & Presets
  // Wildlife Detection Species Database & Presets
  wildlifeDatabase: [
    {
      id: "wild-boar",
      commonName: "Wild Boar",
      scientificName: "Sus scrofa",
      threatLevel: "Medium",
      defaultConfidence: "Reference Profile",
      typicalHabit: "Nocturnal root-foraging; damages tuber crops, groundnuts, potatoes, and maize stalks.",
      safetyGuidance: "Keep a safe distance from the animal. Avoid approaching or cornering it. Use reflective flashers, auditory buzzers, or bio-fencing. Do not attempt direct contact.",
      recommendedActions: [
        "Inspect perimeter trenches and bio-fencing borders",
        "Activate mild non-lethal acoustic deterrent",
        "Record incident location for forest department boundary log"
      ],
      sampleImage: getAssetUrl("images/wild-boar.jpg")
    },
    {
      id: "asian-elephant",
      commonName: "Asian Elephant",
      scientificName: "Elephas maximus",
      threatLevel: "High",
      defaultConfidence: "Reference Profile",
      typicalHabit: "Corridor migration; attracted to sugarcane fields, banana plantations, and ripening paddy.",
      safetyGuidance: "CRITICAL SAFETY: Maintain an absolute safe perimeter (> 100 meters). Never direct high-beam torches into the animal's eyes. Alert neighboring farms and promptly inform the local Forest Department Rapid Response Team (RRT).",
      recommendedActions: [
        "Do not block migratory path or provoke the herd",
        "Notify nearby village forest committee via AgroVision alert",
        "Follow local Forest Department safety protocols"
      ],
      sampleImage: getAssetUrl("images/elephant.jpg")
    },
    {
      id: "spotted-deer",
      commonName: "Spotted Deer",
      scientificName: "Axis axis",
      threatLevel: "Low",
      defaultConfidence: "Reference Profile",
      typicalHabit: "Herbivore herd grazing; grazes on tender vegetable shoots, pulses, and grain seedlings.",
      safetyGuidance: "Spotted deer are docile and skittish. Use mild wind-chimes or solar-powered perimeter LED strobes to gently deter them without harm.",
      recommendedActions: [
        "Deploy chili-rope borders or border shade netting",
        "Ensure field fencing is intact without sharp barbs",
        "Log grazing pattern for seasonal monitoring"
      ],
      sampleImage: getAssetUrl("images/deer.jpg")
    },
    {
      id: "bonnet-macaque",
      commonName: "Bonnet Macaque (Monkey)",
      scientificName: "Macaca radiata",
      threatLevel: "Medium",
      defaultConfidence: "Reference Profile",
      typicalHabit: "Diurnal troop foraging; damages fruit orchards, mangoes, tomatoes, and maize cobs.",
      safetyGuidance: "Avoid leaving open food waste or harvest bins. Install nylon canopy nets over fruit trees. Bio-acoustic distress chirps can deter troops safely.",
      recommendedActions: [
        "Secure nursery seedlings with anti-monkey mesh",
        "Harvest ripe fruit promptly to remove attraction",
        "Avoid leaving open water storage buckets"
      ],
      sampleImage: getAssetUrl("images/macaque.jpg")
    }
  ],

  // Crop Disease Diagnosis Presets & Knowledge Base
  cropDiseaseDatabase: [
    {
      id: "tomato-early-blight",
      crop: "Tomato",
      disease: "Early Blight (Alternaria solani)",
      confidence: "Reference Diagnostic",
      severity: "Moderate",
      symptoms: "Concentric dark brown rings ('target spots') on older leaves, surrounded by yellow chlorotic halos. Lower foliage turns brown, withers, and drops prematurely.",
      prevention: "Practice 3-year crop rotation with non-solanaceous crops. Stake plants for improved canopy airflow. Water at the base with drip lines to keep foliage dry.",
      treatmentAdvice: "Apply organic Trichoderma harzianum soil drench or 5% neem seed kernel extract. For severe fungal spread, consult local agricultural extension officer for Mancozeb 75 WP dosage guidelines.",
      sampleImage: getAssetUrl("images/crop-early-blight.jpg")
    },
    {
      id: "potato-late-blight",
      crop: "Potato",
      disease: "Late Blight (Phytophthora infestans)",
      confidence: "Reference Diagnostic",
      severity: "High",
      symptoms: "Water-soaked, dark olive to black lesions on leaf tips and stems. White velvety fungal sporulation visible on the underside during humid mornings.",
      prevention: "Plant certified disease-free seed tubers. Space rows widely to accelerate foliage drying after morning dew. Destroy cull piles promptly.",
      treatmentAdvice: "Ensure immediate drainage of standing furrow water. Apply protective copper hydroxide or consult your regional KVK (Krishi Vigyan Kendra) agronomist.",
      sampleImage: getAssetUrl("images/crop-late-blight.jpg")
    },
    {
      id: "rice-leaf-blast",
      crop: "Paddy / Rice",
      disease: "Rice Leaf Blast (Magnaporthe oryzae)",
      confidence: "Reference Diagnostic",
      severity: "High",
      symptoms: "Spindle-shaped or eye-shaped lesions with gray/whitish centers and dark reddish-brown margins on leaf blades. Lesions coalesce, burning the leaf canopy.",
      prevention: "Avoid excessive split applications of chemical nitrogen fertilizer. Treat seeds with Pseudomonas fluorescens (10g/kg seed) before nursery sowing.",
      treatmentAdvice: "Spray Pseudomonas fluorescens @ 2.5 kg/ha or consult the local agricultural officer for appropriate bio-formulation spray schedule.",
      sampleImage: getAssetUrl("images/crop-rice-blast.jpg")
    },
    {
      id: "healthy-paddy",
      crop: "Paddy / Rice",
      disease: "Healthy Vigorous Canopy",
      confidence: "Reference Diagnostic",
      severity: "None",
      symptoms: "Uniform emerald-green canopy with erect leaves, zero necrotic lesions, and balanced chlorophyll index (SPAD 38-42).",
      prevention: "Maintain alternate wetting and drying (AWD) water management. Continue periodic field monitoring for stem borer or leaf folder eggs.",
      treatmentAdvice: "No chemical or bio-fungicide needed. Maintain current micronutrient and nitrogen balance.",
      sampleImage: getAssetUrl("images/crop-healthy-paddy.jpg")
    },
    {
      id: "corn-common-rust",
      crop: "Maize / Corn",
      disease: "Common Rust (Puccinia sorghi)",
      confidence: "Reference Diagnostic",
      severity: "Moderate",
      symptoms: "Small, circular to elongate golden-brown to cinnamon-brown pustules scattered across both upper and lower leaf surfaces. Pustules rupture the epidermis.",
      prevention: "Select rust-resistant certified hybrid cultivars. Plant early in the season to evade peak airborne spore concentrations.",
      treatmentAdvice: "Maintain optimal potassium nutrition to bolster cell wall resistance. Consult agronomist for targeted bio-spray.",
      sampleImage: getAssetUrl("images/crop-corn-rust.jpg")
    }
  ],

  // Crop Care and Farming Guidance Library
  cropCareLibrary: [
    {
      id: "rice",
      name: "Rice / Paddy",
      scientificName: "Oryza sativa",
      season: "Kharif & Rabi Seasons",
      growthStages: [
        { stage: "Nursery Phase (0-25 days)", notes: "Maintain 1-2 cm shallow water film; apply well-decomposed organic compost." },
        { stage: "Tillering Phase (25-55 days)", notes: "Shallow water (2.5 cm); top dress balanced nitrogen split." },
        { stage: "Panicle Initiation (55-80 days)", notes: "Keep 5 cm water depth; critical moisture-sensitive physiological window." },
        { stage: "Ripening & Harvest (80-120 days)", notes: "Drain water completely 10-14 days prior to combine harvesting." }
      ],
      wateringGuidance: "Practice Alternate Wetting and Drying (AWD) using a perforated field tube to conserve 25-35% water without reducing yield.",
      soilPrep: "Puddled clayey loam or alluvial soil with pH 5.5 to 6.5. Incorporate green manure (Sesbania/Sunn hemp) 15 days before transplanting.",
      fertilizerGuidance: "Standard recommendation: 120:40:40 kg N:P2O5:K2O per hectare. Apply nitrogen in 3 equal splits (basal, tillering, panicle initiation).",
      commonDiseases: "Blast, Bacterial Leaf Blight, Sheath Blight, Brown Spot.",
      wildlifeSafety: "Elephant herds and wild boars are attracted during ripening. Install perimeter bio-acoustic chimes and border lighting. Maintain a safe perimeter."
    },
    {
      id: "tomato",
      name: "Tomato",
      scientificName: "Solanum lycopersicum",
      season: "Year-Round Cultivation",
      growthStages: [
        { stage: "Seedling & Transplant (0-30 days)", notes: "Plant on raised beds with 60x45cm spacing; dip roots in Trichoderma suspension." },
        { stage: "Vegetative Growth (30-50 days)", notes: "Stake vines with bamboo to elevate foliage away from damp soil." },
        { stage: "Flowering & Fruit Set (50-75 days)", notes: "Consistent drip irrigation to prevent blossom end rot from calcium deficiency." },
        { stage: "Fruit Maturation (75-110 days)", notes: "Gradual harvesting at breaker/pink color stage." }
      ],
      wateringGuidance: "Deliver 2 to 3 liters per plant per day via calibrated drip emitters. Avoid overhead sprinkler watering which promotes foliar blights.",
      soilPrep: "Well-drained sandy loam or red loam rich in organic matter, pH 6.0 - 7.0. Add 25 tonnes/ha well-decomposed farmyard manure.",
      fertilizerGuidance: "Recommended: 150:100:100 kg NPK/ha. Supplement with Calcium Nitrate and Boron foliar spray during flowering to stop fruit cracking.",
      commonDiseases: "Early Blight, Late Blight, Tomato Leaf Curl Virus, Bacterial Wilt.",
      wildlifeSafety: "Wild boars and monkeys frequently forage on ripening tomatoes. Install overhead nylon netting and solar flashers."
    },
    {
      id: "sugarcane",
      name: "Sugarcane",
      scientificName: "Saccharum officinarum",
      season: "Early, Mid, and Late Seasons",
      growthStages: [
        { stage: "Germination (0-35 days)", notes: "Maintain moist ridges without waterlogging." },
        { stage: "Tillering & Formative (35-120 days)", notes: "Critical water demand; partial earthing up at 60 days." },
        { stage: "Grand Growth (120-270 days)", notes: "Full earthing up at 120 days; detrash dry lower leaves." },
        { stage: "Maturity & Ripening (270-360 days)", notes: "Withhold irrigation 15 days prior to harvest." }
      ],
      wateringGuidance: "Subsurface drip irrigation saves 40% water while increasing sucrose recovery by 15-20%.",
      soilPrep: "Deep loamy soils with 45cm plowing depth. Form furrows spaced 4 to 5 feet apart for wide-row tractor cultivation.",
      fertilizerGuidance: "275:60:110 kg N:P2O5:K2O per hectare. Complete nitrogen application before 90-120 days after planting.",
      commonDiseases: "Red Rot (Colletotrichum falcatum), Smut, Grassy Shoot.",
      wildlifeSafety: "Dense sugarcane canopies offer shelter to wildlife. Always make noise before entering tall crops. Clear a 3-meter boundary buffer strip."
    },
    {
      id: "cotton",
      name: "Cotton",
      scientificName: "Gossypium hirsutum",
      season: "Kharif / Winter Irrigated",
      growthStages: [
        { stage: "Vegetative Phase (0-45 days)", notes: "Thinning to single seedling per hill at 15-20 days." },
        { stage: "Square Formation (45-70 days)", notes: "Scout for sucking pests (whiteflies, jassids, thrips)." },
        { stage: "Boll Development (70-120 days)", notes: "Peak water consumption; spray NAA to prevent flower shedding." },
        { stage: "Boll Bursting & Picking (120-160 days)", notes: "Hand pick clean seed cotton during dry mornings." }
      ],
      wateringGuidance: "Cotton is sensitive to waterlogging. Provide alternate furrow irrigation to preserve root oxygenation.",
      soilPrep: "Deep black cotton soils (Vertisols) or fertile clayey loams with pH 7.5 to 8.5.",
      fertilizerGuidance: "80:40:40 kg NPK/ha for hybrid cotton under irrigated conditions.",
      commonDiseases: "Bacterial Blight, Alternaria Leaf Spot, Fusarium Wilt.",
      wildlifeSafety: "Deer feed on tender squares. Install bio-fences with prickly pear or lemongrass borders."
    },
    {
      id: "banana",
      name: "Banana",
      scientificName: "Musa acuminata",
      season: "Year-Round Plantation",
      growthStages: [
        { stage: "Sucker Establishment (0-3 months)", notes: "Use 1.5-2.0 kg sword suckers treated with bio-fungicide." },
        { stage: "Vegetative Phase (3-6 months)", notes: "Regular desuckering; keep only mother plant." },
        { stage: "Shooting / Bunch Emergence (7-9 months)", notes: "Propping with casuarina poles against high winds." },
        { stage: "Bunch Maturation (10-12 months)", notes: "Cover bunches with blue polyethylene sleeves." }
      ],
      wateringGuidance: "High water requirement: 15-20 liters per plant per day via micro-sprinklers or drip rings.",
      soilPrep: "Deep, rich alluvial loam or clay loam with high drainage capacity, pH 6.5 to 7.5.",
      fertilizerGuidance: "Apply 200g N, 50g P, and 300g K per plant divided over months 2, 4, 6, and 8.",
      commonDiseases: "Panama Wilt (Fusarium oxysporum), Sigatoka Leaf Spot, Bunchy Top Virus.",
      wildlifeSafety: "Elephants seek banana pseudo-stems for hydration. Install honeybee boundary fences and chili-grease boundary ropes."
    }
  ],

  // Smart Irrigation Telemetry Defaults
  irrigation: {
    systemMode: "Autonomous Micro-Drip (Hardware Telemetry Ready)",
    hardwareStatus: "ESP32 LoRaWAN Gateway Connected (Simulation Mode Active)",
    sectors: [
      { id: "sec-1", name: "Sector 1A • Paddy East", crop: "Paddy", moisture10cm: 68, moisture30cm: 72, moisture60cm: 78, valveStatus: "Closed", lastIrrigated: "4 hrs ago", flowRate: "0 L/min" },
      { id: "sec-2", name: "Sector 2B • Tomato Polyhouse", crop: "Tomato", moisture10cm: 32, moisture30cm: 38, moisture60cm: 45, valveStatus: "Active", lastIrrigated: "Running (12 mins)", flowRate: "14.2 L/min" },
      { id: "sec-3", name: "Sector 3C • Sugarcane Block", crop: "Sugarcane", moisture10cm: 54, moisture30cm: 59, moisture60cm: 64, valveStatus: "Closed", lastIrrigated: "Yesterday", flowRate: "0 L/min" },
      { id: "sec-4", name: "Sector 4D • Banana Grove", crop: "Banana", moisture10cm: 48, moisture30cm: 52, moisture60cm: 58, valveStatus: "Standby", lastIrrigated: "8 hrs ago", flowRate: "0 L/min" }
    ],
    cropWaterNeeds: [
      { crop: "Paddy / Rice", mmPerDay: "6.0 - 9.0 mm", method: "Alternate Wetting & Drying", criticalStage: "Panicle initiation & flowering" },
      { crop: "Tomato", mmPerDay: "3.5 - 5.5 mm", method: "Precision Drip Emitter", criticalStage: "Fruit set & sizing" },
      { crop: "Sugarcane", mmPerDay: "5.0 - 7.5 mm", method: "Subsurface Drip Irrigation", criticalStage: "Tillering & formative phase" },
      { crop: "Cotton", mmPerDay: "4.0 - 6.0 mm", method: "Furrow & Drip", criticalStage: "Squaring & boll formation" },
      { crop: "Banana", mmPerDay: "7.0 - 10.0 mm", method: "Micro-Sprinklers / Rings", criticalStage: "Shooting & bunch development" }
    ]
  },

  // Agricultural Weather Presets
  weatherPresets: [
    { name: "Thanjavur (Cauvery Delta)", lat: 10.787, lon: 79.1378, zone: "Paddy & Sugarcane Belt" },
    { name: "Coimbatore", lat: 11.0168, lon: 76.9558, zone: "Cotton & Vegetable Hub" },
    { name: "Madurai", lat: 9.9252, lon: 78.1198, zone: "Pulses & Jasmine Belt" },
    { name: "Salem", lat: 11.6643, lon: 78.146, zone: "Tapioca & Mango Zone" },
    { name: "Ludhiana", lat: 30.901, lon: 75.8573, zone: "Wheat & Rice Grain Bowl" },
    { name: "Nashik", lat: 19.9975, lon: 73.7898, zone: "Onion & Grape Belt" }
  ],

  // SIH / College Presentation About Details
  aboutProject: {
    title: "AgroVision – Smart Farming and AI-Based Detection System",
    theme: "Smart Automation, Agriculture & Food Security (Smart India Hackathon)",
    problemStatement: "Farmers encounter two compounding threats: (1) Uncontrolled nocturnal crop destruction by wildlife (wild boars, elephants, deer) causing up to 30-40% yield loss and dangerous human-wildlife conflict; (2) Devastating foliar diseases (blights, blasts, rusts) that go unnoticed until systemic necrosis occurs. In addition, irregular irrigation depletes groundwater resources.",
    proposedSolution: "AgroVision provides a unified, farmer-friendly digital agronomy platform: (1) Computer vision-powered wildlife perimeter detection with mild non-startling audio alerts; (2) Leaf pathogen image diagnostics with actionable organic remedies; (3) IoT soil moisture depth telemetry for precision drip control; (4) Actionable crop care advice and printable farm reports.",
    architecture: {
      frontend: "React 18 + Vite, Modular Responsive UI, Web Audio API chime synthesis, MediaDevices Camera API, Geolocation API, LocalStorage persistence",
      aiVision: "YOLOv8 Edge Object Detection (Wildlife) + MobileNetV3 / ResNet Foliar Pathology Classifier",
      backend: "Python FastAPI / Flask REST Server (Endpoint integration ready)",
      hardware: "ESP32 Microcontroller + Capacitive Multi-Depth Soil Sensors (10/30/60cm) + LoRaWAN / 4G Gateway"
    },
    limitationsHonesty: "Note: Sensor telemetry and AI predictions on this static deployment operate in robust client-side simulation and demo mode. To connect live camera inference to custom trained weights, launch the bundled Python backend server in the /backend folder.",
    futureRoadmap: [
      "Deployment of low-power solar edge camera boxes with PIR triggers on farm boundaries",
      "Cellular SMS & WhatsApp voice dispatch for non-smartphone farmers",
      "Integration with government crop insurance claim documentation portals"
    ]
  }
};

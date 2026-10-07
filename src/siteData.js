export const siteData = {
  brand: {
    name: "SmartFarm",
    tagline: "Precision Agriculture & AI Farming Intelligence",
    description: "Next-generation precision agriculture platform. Empowering growers with IoT soil telemetry, autonomous irrigation, and edge AI crop diagnostics to maximize harvest yield while preserving water and soil vitality."
  },

  navLinks: [
    { name: "Home", href: "#home" },
    { name: "About", href: "#about" },
    { name: "Features", href: "#features" },
    { name: "Dashboard", href: "#dashboard" },
    { name: "Smart Irrigation", href: "#irrigation" },
    { name: "AI Crop Health", href: "#crop-health" },
    { name: "Sustainability", href: "#sustainability" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Contact", href: "#contact" }
  ],

  hero: {
    badge: "Next-Gen Agricultural Intelligence",
    headline: "Transforming Agriculture with AI & Precision IoT",
    subheadline: "Empower your farm with real-time soil intelligence, autonomous micro-irrigation, and predictive crop analytics to maximize harvests and slash resource waste.",
    ctaPrimary: { text: "Explore Live Dashboard", href: "#dashboard" },
    ctaSecondary: { text: "Request Farm Demo", href: "#contact" },
    stats: [
      { id: "water", target: 45, suffix: "%", label: "Water Saved", desc: "Closed-loop micro-drip scheduling" },
      { id: "yield", target: 32, suffix: "%", label: "Higher Yield", desc: "Optimal nutrient & root hydration" },
      { id: "pesticide", target: 55, suffix: "%", label: "Less Pesticide", desc: "Localized early pest eradication" },
      { id: "farmers", target: 12500, suffix: "+", label: "Farmers Helped", desc: "Active across 28 global agricultural zones" }
    ]
  },

  about: {
    badge: "Intelligent Agronomy",
    title: "Pioneering the Next Era of Sustainable Farming",
    subtitle: "SmartFarm bridges rugged field IoT hardware with predictive agronomy AI models to eliminate guesswork and safeguard farm profitability.",
    description: "Our autonomous system acts as a digital agronomist on duty 24/7. By measuring microclimate variations, root-zone hydration, and foliage chlorophyll in real time, farmers achieve unprecedented yield consistency while dramatically slashing input overhead.",
    checklist: [
      "Sub-inch precision sensor telemetry updated every 60 seconds",
      "Predictive irrigation schedules calibrated against hyper-local weather models",
      "Edge AI disease and pest detection with instant smartphone triage",
      "Seamless integration with existing drip, pivot, and solenoid valve infrastructure",
      "Offline edge gateway operation with automated satellite cloud sync in remote zones"
    ],
    cards: [
      {
        icon: "brain",
        title: "AI Crop Analytics",
        badge: "Deep Learning",
        description: "Continuous neural models predict yield trends, detect canopy stress before visible wilting, and calculate harvest timing with 94%+ precision."
      },
      {
        icon: "sensor",
        title: "IoT Sensor Probes",
        badge: "Industrial Telemetry",
        description: "Multi-depth wireless probes measure volumetric water content, electrical conductivity, soil salinity, and root temperature across all sectors."
      },
      {
        icon: "droplet",
        title: "Smart Irrigation",
        badge: "Autonomous Valves",
        description: "Zero-waste micro-actuators deliver water in calibrated micro-bursts based on real-time evapotranspiration, eliminating dry spots and leaching."
      }
    ]
  },

  features: [
    {
      id: "crop-monitoring",
      icon: "eye",
      title: "AI Crop Monitoring",
      description: "Computer vision and multispectral canopy scans detect stress, chlorophyll deficiency, and uneven growth days before human eyes can notice.",
      tag: "Computer Vision"
    },
    {
      id: "smart-irrigation",
      icon: "droplets",
      title: "Smart Irrigation",
      description: "Automated solenoid valves adjust water delivery dynamically based on real-time transpiration, soil tension, and solar radiation.",
      tag: "Autonomous"
    },
    {
      id: "soil-moisture",
      icon: "layers",
      title: "Soil Moisture Monitoring",
      description: "Multi-depth capacitive probes track root moisture gradients at 10cm, 30cm, and 60cm to eliminate both leaching and water stress.",
      tag: "Real-Time Telemetry"
    },
    {
      id: "weather-monitoring",
      icon: "cloud-sun",
      title: "Weather Monitoring",
      description: "Hyper-local micro-weather stations deliver 72-hour frost alerts, vapor-pressure deficit tracking, and wind-drift protection for spraying.",
      tag: "Hyper-Local Radar"
    },
    {
      id: "disease-detection",
      icon: "shield-alert",
      title: "Crop Disease Detection",
      description: "Instant pathogen recognition identifies blights, rusts, mildews, and viral strains directly on farm handhelds within seconds.",
      tag: "Edge AI Diagnosis"
    },
    {
      id: "pest-detection",
      icon: "bug",
      title: "Pest Detection",
      description: "Smart optical and acoustic traps catalog invasive insect species early to allow ultra-targeted biological controls before infestation.",
      tag: "Biosecurity"
    },
    {
      id: "automated-farming",
      icon: "cpu",
      title: "Automated Farming",
      description: "Plug-and-play controllers seamlessly trigger fertigation injectors, center pivots, greenhouse fans, and autonomous drone missions.",
      tag: "Robotic Control"
    },
    {
      id: "yield-prediction",
      icon: "trending-up",
      title: "Yield Prediction",
      description: "Machine learning models fuse historical weather, soil health indices, and current biomass to forecast seasonal bushel yields accurately.",
      tag: "ML Forecasting"
    }
  ],

  dashboardInitial: {
    sensors: [
      {
        id: "temp",
        name: "Ambient Temperature",
        icon: "thermometer",
        value: 26.4,
        unit: "°C",
        min: 10,
        max: 45,
        percentage: 58,
        status: "Optimal",
        statusType: "success",
        trend: "+0.8°C vs yesterday",
        color: "#16a34a"
      },
      {
        id: "humidity",
        name: "Relative Humidity",
        icon: "cloud-rain",
        value: 68,
        unit: "%",
        min: 20,
        max: 100,
        percentage: 68,
        status: "Normal",
        statusType: "success",
        trend: "Healthy transpiration",
        color: "#22c55e"
      },
      {
        id: "moisture",
        name: "Soil Moisture (Zone B)",
        icon: "droplet",
        value: 42,
        unit: "%",
        min: 0,
        max: 100,
        percentage: 42,
        status: "Good",
        statusType: "success",
        trend: "Within field capacity",
        color: "#3b82f6"
      },
      {
        id: "rainfall",
        name: "Precipitation (24h)",
        icon: "cloud-drizzle",
        value: 14.2,
        unit: "mm",
        min: 0,
        max: 50,
        percentage: 35,
        status: "Moderate",
        statusType: "info",
        trend: "Shower ended 2h ago",
        color: "#06b6d4"
      },
      {
        id: "crop-health",
        name: "Crop Health Index (NDVI)",
        icon: "sprout",
        value: 96,
        unit: "%",
        min: 0,
        max: 100,
        percentage: 96,
        status: "Excellent",
        statusType: "success",
        trend: "Vibrant chlorophyll density",
        color: "#10b981"
      },
      {
        id: "water-level",
        name: "Reservoir Water Level",
        icon: "gauge",
        value: 84,
        unit: "%",
        min: 0,
        max: 100,
        percentage: 84,
        status: "Sufficient",
        statusType: "success",
        trend: "14 days reserve capacity",
        color: "#6366f1"
      }
    ],
    weather: {
      location: "North Orchard • Sector 4B",
      condition: "Clear & Sunny",
      temp: "27°C",
      feelsLike: "28°C",
      wind: "8.5 km/h NW",
      uvIndex: "6.4 High",
      pressure: "1014 hPa",
      sunrise: "06:14 AM",
      sunset: "07:42 PM",
      dewPoint: "16°C"
    },
    weeklyMoisture: [
      { day: "Mon", value: 48, status: "Optimal" },
      { day: "Tue", value: 41, status: "Moderate" },
      { day: "Wed", value: 58, status: "Irrigated" },
      { day: "Thu", value: 52, status: "Optimal" },
      { day: "Fri", value: 44, status: "Optimal" },
      { day: "Sat", value: 39, status: "Moderate" },
      { day: "Sun", value: 47, status: "Optimal" }
    ]
  },

  smartIrrigation: {
    badge: "Autonomous Precision Flow",
    title: "Closed-Loop Micro-Irrigation Architecture",
    subtitle: "From underground dielectric sensing to instant cloud computation and localized solenoid valve pulsing — zero water wasted.",
    flowSteps: [
      {
        step: 1,
        title: "Dielectric Sensor",
        subtitle: "Sub-surface root probing",
        desc: "Capacitive probes gauge soil dielectric constant every 60s at multiple depths.",
        icon: "probe"
      },
      {
        step: 2,
        title: "AI Controller",
        subtitle: "Agronomic edge processing",
        desc: "Neural engine compares transpiration rates and solar radiation against plant stage.",
        icon: "cpu"
      },
      {
        step: 3,
        title: "Smart Valve",
        subtitle: "Solar solenoid actuation",
        desc: "Wireless pulse-actuated micro-valves open for milliliter-accurate water delivery.",
        icon: "valve"
      },
      {
        step: 4,
        title: "Drip Irrigation",
        subtitle: "Targeted root absorption",
        desc: "Pressure-compensating emitters deliver water directly into the root rhizosphere.",
        icon: "sprinkler"
      }
    ],
    gauge: {
      title: "Current Sector Moisture",
      current: 58,
      target: 62,
      min: 0,
      max: 100,
      status: "Optimal Hydration",
      substatus: "Next micro-pulse scheduled in 3h 15m"
    },
    explanationSteps: [
      {
        number: "01",
        title: "Continuous Root-Zone Telemetry",
        description: "Multi-depth capacitive sensors measure soil moisture tension and volumetric water content 24 hours a day, preventing invisible root desiccation."
      },
      {
        number: "02",
        title: "Hyper-Local Weather Fusion",
        description: "The AI gateway continuously models local Doppler radar, vapor-pressure deficit (VPD), and solar radiation to cancel watering if precipitation is imminent."
      },
      {
        number: "03",
        title: "Precision Micro-Pulse Actuation",
        description: "Instead of inefficient soil-flooding, solar-powered LoRaWAN solenoid valves release micro-bursts of water, preventing nutrient runoff and evaporative loss."
      },
      {
        number: "04",
        title: "Closed-Loop Feedback Verification",
        description: "Sensors verify actual root absorption within 10 minutes of delivery, dynamically calibrating the next cycle and conserving up to 45% freshwater."
      }
    ]
  },

  aiCropHealth: {
    badge: "Edge Vision Diagnostics",
    title: "AI-Powered Foliage & Disease Detection",
    subtitle: "Point your smartphone or fly an agricultural drone over your fields. Our edge neural vision instantly identifies over 140 plant pathogens, blights, and deficiencies with laboratory accuracy.",
    stats: [
      { label: "Diagnostic Accuracy", value: "98.4%", desc: "Agronomist verified" },
      { label: "Inference Time", value: "1.2s", desc: "Real-time edge neural inference" },
      { label: "Diseases Cataloged", value: "140+", desc: "Cereals, fruits, legumes & vines" },
      { label: "Active Field Monitoring", value: "24/7", desc: "Continuous automated scanning" }
    ],
    sampleDetections: [
      {
        id: "healthy",
        crop: "Maize / Sweet Corn",
        condition: "Healthy Foliage",
        confidence: "99.4%",
        status: "Healthy",
        severity: "None",
        nitrogenLevel: "Optimal (3.8%)",
        treatment: "No intervention needed. Foliage displays robust chlorophyll saturation and cellular turgor.",
        timestamp: "Live Scan • 1.2s ago"
      },
      {
        id: "rust",
        crop: "Winter Wheat",
        condition: "Early Leaf Rust (Puccinia)",
        confidence: "97.8%",
        status: "Early Stage",
        severity: "Moderate",
        nitrogenLevel: "Adequate (3.2%)",
        treatment: "Targeted triazole bio-fungicide recommended within 36 hours before spore dispersal.",
        timestamp: "Detected in Sector 2"
      }
    ],
    detectableDiseases: [
      { name: "Powdery Mildew (Erysiphe)", type: "Fungal", confidence: "99.1%", risk: "High", icon: "fungus" },
      { name: "Early Blight (Alternaria solani)", type: "Bacterial", confidence: "98.2%", risk: "Moderate", icon: "leaf" },
      { name: "Corn Leaf Blight (Exserohilum)", type: "Fungal", confidence: "98.7%", risk: "High", icon: "alert" },
      { name: "Aphid Cluster Infestation", type: "Pest", confidence: "99.5%", risk: "Critical", icon: "bug" },
      { name: "Nitrogen Chlorosis Deficiency", type: "Nutritional", confidence: "96.4%", risk: "Low", icon: "droplet" },
      { name: "Bacterial Wilt (Ralstonia)", type: "Bacterial", confidence: "97.9%", risk: "Critical", icon: "shield" }
    ]
  },

  sustainability: {
    badge: "Eco-Agronomy Impact",
    title: "Cultivating Abundance While Preserving Earth",
    subtitle: "Precision agriculture is not just about higher yields — it is about ensuring our soils, waterways, and ecosystems thrive for generations.",
    cards: [
      {
        id: "water",
        icon: "droplet",
        title: "Water Conservation",
        value: 45,
        suffix: "%",
        metric: "45% reduction in freshwater use",
        description: "Closed-loop micro-drip cycles eliminate over-watering, evaporation losses, and deep-soil leaching into groundwater tables."
      },
      {
        id: "chemical",
        icon: "flask",
        title: "Reduced Chemical Usage",
        value: 55,
        suffix: "%",
        metric: "55% cut in synthetic chemical runoff",
        description: "Precision spray alerts apply pesticides only to affected leaves, preventing blanket chemical spraying and protecting pollinators."
      },
      {
        id: "yield",
        icon: "sprout",
        title: "Better Crop Productivity",
        value: 32,
        suffix: "%",
        metric: "32% increase in harvest tonnage",
        description: "Eliminating crop water stress and nutrient deficiencies unlocks full genetic potential for heavier, premium-grade produce."
      },
      {
        id: "sustainable",
        icon: "globe",
        title: "Sustainable Agriculture",
        value: 85,
        suffix: "%",
        metric: "85% soil microbiome preservation index",
        description: "Maintains optimal soil moisture and carbon balance, encouraging microbial biodiversity and long-term soil regeneration."
      },
      {
        id: "waste",
        icon: "recycle",
        title: "Reduced Farming Waste",
        value: 60,
        suffix: "%",
        metric: "60% reduction in pre-harvest crop spoil",
        description: "Early disease identification stops blight epidemics before whole fields are contaminated, saving thousands of labor hours."
      }
    ],
    ctaCard: {
      badge: "Join 12,500+ Farmers",
      title: "Ready to Transform Your Farm's Future?",
      description: "Book an obligation-free telemetry audit. Our agricultural engineers evaluate your soil maps and calculate your exact ROI within 48 hours.",
      buttonText: "Schedule Free Farm Audit",
      href: "#contact"
    }
  },

  howItWorks: {
    badge: "Seamless IoT Architecture",
    title: "How SmartFarm Operates in the Field",
    subtitle: "A completely autonomous 5-step loop connecting your soil directly to actionable intelligence and precision automated actions.",
    steps: [
      {
        stepNumber: "01",
        title: "Sensors Collect Data",
        description: "Solar-powered wireless probes measure soil moisture, root temperature, electrical conductivity, and ambient air data every 60 seconds.",
        icon: "sensor",
        highlight: "Multi-depth telemetry"
      },
      {
        stepNumber: "02",
        title: "Data Sent to System",
        description: "Encrypted low-power LoRaWAN and cellular telemetry transmits field readings securely to our cloud ag-engine even from remote off-grid farms.",
        icon: "wifi",
        highlight: "15km wireless range"
      },
      {
        stepNumber: "03",
        title: "AI Analyzes Data",
        description: "Deep learning models cross-reference plant physiological growth models, satellite NDVI maps, and radar weather feeds to detect anomalies.",
        icon: "cpu",
        highlight: "Sub-second inference"
      },
      {
        stepNumber: "04",
        title: "Farmers Receive Insights",
        description: "Instant clear push notifications, irrigation schedules, and diagnostic alerts appear on your phone, tablet, and operations desktop.",
        icon: "bell",
        highlight: "Real-time alerts"
      },
      {
        stepNumber: "05",
        title: "Automated Actions",
        description: "Smart valves open for precise micro-bursts, fertigation injectors calibrate dosages, and autonomous drone sprayers launch on target.",
        icon: "check-circle",
        highlight: "Zero manual intervention"
      }
    ]
  },

  contact: {
    badge: "Get in Touch",
    title: "Start Your Smart Farming Journey Today",
    subtitle: "Have questions about sensor deployment, existing irrigation compatibility, or enterprise farm acreage? Our agricultural specialists are ready to assist.",
    info: [
      {
        icon: "map-pin",
        title: "Global Headquarters",
        lines: [
          "AgriTech Innovation Center, Suite 400",
          "450 Harvest Parkway, Salinas Valley, CA 93901"
        ]
      },
      {
        icon: "mail",
        title: "Direct Inquiries",
        lines: [
          "contact@smartfarm-precision.io",
          "support@smartfarm-precision.io"
        ]
      },
      {
        icon: "phone",
        title: "Phone & Dispatch",
        lines: [
          "+1 (800) 492-FARM (492-3276)",
          "+1 (831) 555-0199 (Field Engineers)"
        ]
      },
      {
        icon: "clock",
        title: "Operational Hours",
        lines: [
          "Monday – Friday: 06:00 AM – 07:00 PM PST",
          "Saturday: 08:00 AM – 02:00 PM PST",
          "24/7 Sensor Monitoring Support"
        ]
      }
    ],
    form: {
      title: "Request a Customized Farm Evaluation",
      description: "Fill in your acreage details and irrigation setup. We'll simulate your potential water savings and yield uplift.",
      fields: {
        namePlaceholder: "e.g. John Henderson",
        emailPlaceholder: "e.g. john@hendersonfarms.com",
        phonePlaceholder: "e.g. +1 (555) 014-8832",
        farmSizePlaceholder: "e.g. 250 Acres (Corn & Soybeans)",
        messagePlaceholder: "Tell us about your current irrigation methods, soil challenges, or crops..."
      },
      buttonText: "Submit Evaluation Request"
    }
  },

  footer: {
    brandText: "SmartFarm",
    tagline: "Cultivating the future with AI & IoT.",
    blurb: "SmartFarm provides growers with intelligent soil sensors, automated micro-irrigation systems, and edge computer vision crop diagnostics to drive sustainable yield expansion.",
    columns: [
      {
        title: "Quick Links",
        links: [
          { name: "Home", href: "#home" },
          { name: "About Us", href: "#about" },
          { name: "Core Features", href: "#features" },
          { name: "Live Dashboard Demo", href: "#dashboard" },
          { name: "Smart Irrigation", href: "#irrigation" },
          { name: "AI Foliage Scanner", href: "#crop-health" }
        ]
      },
      {
        title: "Solutions",
        links: [
          { name: "Vineyard Precision Water", href: "#irrigation" },
          { name: "Orchard Fruit Canopy AI", href: "#crop-health" },
          { name: "Row Crop Soil Telemetry", href: "#features" },
          { name: "Commercial Greenhouse IoT", href: "#features" },
          { name: "Water Conservation Audits", href: "#sustainability" },
          { name: "Carbon Credit Verification", href: "#sustainability" }
        ]
      },
      {
        title: "Resources & Tech",
        links: [
          { name: "LoRaWAN Sensor Spec Sheet", href: "#features" },
          { name: "Edge AI Disease Database", href: "#crop-health" },
          { name: "Agronomist Case Studies", href: "#about" },
          { name: "API Documentation", href: "#dashboard" },
          { name: "Farm ROI Calculator", href: "#contact" },
          { name: "System Status: 99.98%", href: "#dashboard" }
        ]
      }
    ],
    socials: [
      { name: "Twitter / X", href: "https://twitter.com", icon: "x-twitter" },
      { name: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
      { name: "GitHub", href: "https://github.com", icon: "github" },
      { name: "YouTube", href: "https://youtube.com", icon: "youtube" }
    ],
    bottomNotice: "© 2026 SmartFarm Technologies Inc. All rights reserved. Built for modern growers worldwide."
  }
};

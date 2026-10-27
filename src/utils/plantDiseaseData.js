/**
 * Agronomic Disease Knowledge Base & Diagnostic Guidance
 * Provides detailed symptoms, safe treatment advice, prevention measures,
 * and severity ratings for all PlantVillage 38 pathology classes and regional crops.
 */

export const PLANT_DISEASE_GUIDE = {
  // Apple
  'Apple___Apple_scab': {
    crop: 'Apple',
    disease: 'Apple Scab (Venturia inaequalis)',
    severity: 'Moderate',
    symptoms: 'Olive-green to dull brown velvety spots on upper leaf surfaces that turn corky and dark. Leaves may become distorted and drop prematurely.',
    treatmentAdvice: 'Apply organic sulfur-based sprays or bio-fungicide Bacillus subtilis at early leaf bud. For severe orchard outbreaks, consult extension services for Captan or Myclobutanil schedule.',
    prevention: 'Rake and destroy fallen leaves in autumn to eradicate overwintering pseudothecia. Prune canopy to promote rapid drying after rains.'
  },
  'Apple___Black_rot': {
    crop: 'Apple',
    disease: 'Black Rot (Botryosphaeria obtusa)',
    severity: 'High',
    symptoms: 'Circular purple spots that enlarge into "frog-eye" lesions with light brown centers and dark purple margins. Infected fruit develops dark sunken rot rings.',
    treatmentAdvice: 'Prune out dead wood, fire blight cankers, and mummified fruit where the fungus overwinters. Apply protective bio-copper or Captan during petal fall.',
    prevention: 'Maintain tree vigor with balanced nutrition. Sterilize pruning equipment between cuts with 70% isopropyl alcohol.'
  },
  'Apple___Cedar_apple_rust': {
    crop: 'Apple',
    disease: 'Cedar Apple Rust (Gymnosporangium juniperi-virginianae)',
    severity: 'Moderate',
    symptoms: 'Bright yellow-orange or reddish spots on upper leaf surfaces. Later, small tube-like aecia develop on the leaf underside, producing rust-colored spores.',
    treatmentAdvice: 'Apply protective sprays such as myclobutanil or sulfur at the pink bud stage. Remove nearby eastern red cedar galls within 500 meters if feasible.',
    prevention: 'Plant rust-resistant apple cultivars (e.g., Enterprise, Freedom). Maintain spatial separation from alternate host juniper trees.'
  },
  'Apple___healthy': {
    crop: 'Apple',
    disease: 'Healthy Leaf Canopy',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Foliage exhibits uniform deep-green coloration with crisp leaf margins, intact cuticle layer, and no necrotic lesions or fungal spotting.',
    treatmentAdvice: 'No chemical intervention required. Continue routine foliar nutritional sprays and balanced soil fertilization.',
    prevention: 'Maintain regular orchard scouting, seasonal pruning for canopy aeration, and drip irrigation scheduling.'
  },

  // Blueberry
  'Blueberry___healthy': {
    crop: 'Blueberry',
    disease: 'Healthy Leaf Canopy',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Leaves are vibrant green, glossy, and firm without chlorosis, anthracnose spotting, or marginal burn.',
    treatmentAdvice: 'No fungicide treatment needed. Maintain optimal soil pH (4.5 to 5.2) with elemental sulfur or pine bark mulch.',
    prevention: 'Ensure consistent soil moisture, adequate acid organic matter, and routine bird netting protection.'
  },

  // Cherry
  'Cherry_(including_sour)___Powdery_mildew': {
    crop: 'Cherry',
    disease: 'Powdery Mildew (Podosphaera clandestina)',
    severity: 'Moderate',
    symptoms: 'White powdery fungal mycelium coating young leaves, shoot tips, and developing fruit. Infected leaves curl upward and may drop early.',
    treatmentAdvice: 'Spray potassium bicarbonate, horticultural neem oil (0.5%), or wettable sulfur during early morning before high temperatures.',
    prevention: 'Improve air movement by selective pruning of interior watersprouts. Avoid overhead sprinkler irrigation on foliage.'
  },
  'Cherry_(including_sour)___healthy': {
    crop: 'Cherry',
    disease: 'Healthy Leaf Canopy',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Clean serrated leaf blades with rich emerald color and no fungal webbing, shot-hole perforations, or wilting.',
    treatmentAdvice: 'No treatment required. Maintain standard irrigation and post-harvest orchard hygiene.',
    prevention: 'Monitor for bacterial canker or aphid infestations in early spring. Maintain tree trunk protection.'
  },

  // Corn (Maize)
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
    crop: 'Maize / Corn',
    disease: 'Gray Leaf Spot (Cercospora zeae-maydis)',
    severity: 'High',
    symptoms: 'Small rectangular necrotic lesions running parallel to leaf veins, bounded by vein walls. Mature lesions turn gray-tan with fungal sporulation.',
    treatmentAdvice: 'Rotate fields out of corn for at least 1-2 seasons. If lesions reach the ear leaf prior to pollination, consult agronomist for strobilurin fungicide.',
    prevention: 'Plant certified resistant maize hybrids. Perform clean tillage or crop residue burial to minimize overwintering inoculum.'
  },
  'Corn_(maize)___Common_rust_': {
    crop: 'Maize / Corn',
    disease: 'Common Rust (Puccinia sorghi)',
    severity: 'Moderate',
    symptoms: 'Small, circular to elongate cinnamon-brown to golden pustules on both upper and lower leaf surfaces. Pustules rupture the leaf epidermis.',
    treatmentAdvice: 'Maintain balanced potassium levels to strengthen epidermal tissue. Apply protective bio-fungicide or consult local KVK for triazole spray if rust covers >10% leaf area before tasseling.',
    prevention: 'Select rust-tolerant hybrid seeds. Plant early in the season to evade heavy airborne spore loads.'
  },
  'Corn_(maize)___Northern_Leaf_Blight': {
    crop: 'Maize / Corn',
    disease: 'Northern Corn Leaf Blight (Exserohilum turcicum)',
    severity: 'High',
    symptoms: 'Long, elliptical, cigar-shaped grayish-green to tan lesions (2.5 to 15 cm long) developing on lower leaves and spreading upward.',
    treatmentAdvice: 'Apply copper bio-formulations or recommended fungicide (e.g., azoxystrobin) if lesions appear before silking. Destroy heavily infected crop debris post-harvest.',
    prevention: 'Rotate with non-grass crops (soybean, groundnut). Use resistant corn hybrids carrying Ht gene resistance.'
  },
  'Corn_(maize)___healthy': {
    crop: 'Maize / Corn',
    disease: 'Healthy Vigorous Foliage',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Broad, vigorous deep-green leaves with crisp parallel veins and zero fungal pustules, chlorosis, or necrotic striping.',
    treatmentAdvice: 'No chemical intervention needed. Maintain balanced NPK split application during knee-high and tasseling stages.',
    prevention: 'Ensure proper plant spacing (60 × 20 cm) and scout weekly for stem borers or armyworms.'
  },

  // Grape
  'Grape___Black_rot': {
    crop: 'Grape',
    disease: 'Black Rot (Phyllosticta ampelicida)',
    severity: 'High',
    symptoms: 'Small reddish-brown circular leaf spots containing tiny black specks (pycnidia). Berries shrivel into hard, black, wrinkled mummies.',
    treatmentAdvice: 'Apply myclobutanil or mancozeb from early shoot growth through post-bloom. Prune out and bury mummified clusters.',
    prevention: 'Train vine canopies vertically (VSP) for maximum sunlight exposure and wind drying. Keep vineyard floor clean of fallen vines.'
  },
  'Grape___Esca_(Black_Measles)': {
    crop: 'Grape',
    disease: 'Esca / Black Measles (Phaeomoniella chlamydospora complex)',
    severity: 'High',
    symptoms: '"Tiger-stripe" interveinal chlorosis and necrosis on leaves. Berries develop dark purplish-brown flecks and sudden shoot apoplexy.',
    treatmentAdvice: 'Prune vines during late dormant season. Paint large pruning wounds with wound protectant containing Trichoderma or copper paste.',
    prevention: 'Avoid severe mechanical trunk injury during cultivation. Replace dying cordons with healthy renewal canes.'
  },
  'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
    crop: 'Grape',
    disease: 'Leaf Blight (Pseudocercospora cladosporioides)',
    severity: 'Moderate',
    symptoms: 'Large, irregular brown to dark brown lesions with yellow halos on older leaves. Severe infection causes early defoliation and reduced fruit sugar.',
    treatmentAdvice: 'Spray copper oxychloride (0.25%) or Bordeaux mixture (1%) after post-pruning sprouting.',
    prevention: 'Ensure good air drainage through vine thinning. Remove fallen infected leaves after harvest.'
  },
  'Grape___healthy': {
    crop: 'Grape',
    disease: 'Healthy Vine Canopy',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Lush palmate green foliage with intact leaf margins, crisp petioles, and healthy tendril vigor.',
    treatmentAdvice: 'No pesticide required. Continue regular drip fertigation and canopy shoot tucking.',
    prevention: 'Scout regularly for downy mildew or leafhoppers during humid weather.'
  },

  // Orange
  'Orange___Haunglongbing_(Citrus_greening)': {
    crop: 'Citrus / Orange',
    disease: 'Citrus Greening / Huanglongbing (Candidatus Liberibacter asiaticus)',
    severity: 'High',
    symptoms: 'Asymmetric blotchy yellow mottling across leaf veins (not mirrored on leaf halves). Leaves are small and upright with twig dieback and lopsided bitter fruit.',
    treatmentAdvice: 'Bacterial pathogen is systemic; no cure exists. Manage Asian Citrus Psyllid vectors using imidacloprid or bio-control Tamarixia radiata. Promptly remove confirmed symptomatic trees to protect grove.',
    prevention: 'Plant only certified disease-free nursery stock. Inspect tree flushes for psyllid nymphs regularly.'
  },

  // Peach
  'Peach___Bacterial_spot': {
    crop: 'Peach',
    disease: 'Bacterial Spot (Xanthomonas arboricola pv. pruni)',
    severity: 'Moderate',
    symptoms: 'Angular water-soaked spots that turn dark purple-brown and drop out, giving leaves a "shot-hole" appearance. Gumming occurs on fruit and twigs.',
    treatmentAdvice: 'Apply low-rate copper bactericide or oxytetracycline during shuck split. Avoid high-pressure sprays that wound tender foliage.',
    prevention: 'Plant resistant peach varieties. Avoid planting windbreak rows that obstruct air movement.'
  },
  'Peach___healthy': {
    crop: 'Peach',
    disease: 'Healthy Foliage',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Lanceolate leaves with glossy green surface, smooth venation, and no shot-hole perforations or leaf curl.',
    treatmentAdvice: 'No pesticide needed. Maintain regular orchard weeding and balanced potassium fertilization.',
    prevention: 'Apply dormant copper spray in autumn to prevent peach leaf curl.'
  },

  // Pepper Bell
  'Pepper,_bell___Bacterial_spot': {
    crop: 'Bell Pepper / Capsicum',
    disease: 'Bacterial Spot (Xanthomonas campestris pv. vesicatoria)',
    severity: 'High',
    symptoms: 'Small, circular, water-soaked dark spots on leaves, becoming greasy and necrotic with yellow margins. Leaves yellow and drop readily.',
    treatmentAdvice: 'Spray copper hydroxide mixed with mancozeb or bio-agent Pseudomonas fluorescens. Discontinue overhead watering immediately.',
    prevention: 'Use certified disease-free seed and soak seeds in hot water (50°C for 25 min). Practice 2-year rotation away from solanaceous crops.'
  },
  'Pepper,_bell___healthy': {
    crop: 'Bell Pepper / Capsicum',
    disease: 'Healthy Foliage',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Lush dark green leaves, sturdy stems, upright growth habit with no mosaic mottling or bacterial blighting.',
    treatmentAdvice: 'No treatment required. Maintain consistent soil moisture to prevent blossom end rot.',
    prevention: 'Mulch soil with organic straw to prevent soil splashing during rains.'
  },

  // Potato
  'Potato___Early_blight': {
    crop: 'Potato',
    disease: 'Early Blight (Alternaria solani)',
    severity: 'Moderate',
    symptoms: 'Dark brown, concentric ringed lesions ("target-board" spots) primarily on older bottom foliage. Surrounding tissue turns yellow chlorotic.',
    treatmentAdvice: 'Apply 5% neem seed kernel extract or Trichoderma harzianum. For intense field pressure, consult agronomist for Mancozeb 75 WP or Chlorothalonil.',
    prevention: 'Practice 3-year crop rotation with non-solanaceous crops. Irrigate using drip systems to avoid wetting foliage.'
  },
  'Potato___Late_blight': {
    crop: 'Potato',
    disease: 'Late Blight (Phytophthora infestans)',
    severity: 'High',
    symptoms: 'Water-soaked, rapidly expanding dark olive-brown to black lesions on leaves and stems. White downy fungal mold visible on leaf undersides in cool, damp mornings.',
    treatmentAdvice: 'IMMEDIATE ACTION REQUIRED: Apply systemic fungicide (Cymoxanil + Mancozeb or Metalaxyl) upon first detection. Ensure rapid surface field drainage.',
    prevention: 'Plant certified disease-free seed tubers. Space rows widely to improve canopy drying. Destroy voluntary cull potato piles.'
  },
  'Potato___healthy': {
    crop: 'Potato',
    disease: 'Healthy Crop Foliage',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Vigorous compound leaves with rich green pigmentation, sturdy petioles, and zero water-soaked margins or concentric rings.',
    treatmentAdvice: 'No chemical fungicides needed. Maintain hill soil mounding to protect developing tubers from sun exposure.',
    prevention: 'Scout foliage weekly during periods of persistent morning fog or rain.'
  },

  // Raspberry
  'Raspberry___healthy': {
    crop: 'Raspberry',
    disease: 'Healthy Foliage Canopy',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Pinnately compound green leaves with serrated margins, healthy cane shoots, and no spur blight or anthracnose cankers.',
    treatmentAdvice: 'No treatment necessary. Provide trellis support and maintain weed-free rows.',
    prevention: 'Thin out fruited floricanes right after harvest to improve sunlight penetration.'
  },

  // Soybean
  'Soybean___healthy': {
    crop: 'Soybean',
    disease: 'Healthy Leaf Canopy',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Trifoliate leaves with vibrant green color, strong nodulation potential, and no rust pustules or frog-eye spots.',
    treatmentAdvice: 'No pesticide application needed. Ensure soil Rhizobium inoculation during seed treatment.',
    prevention: 'Monitor for pod borers and maintain proper field drainage during monsoon downpours.'
  },

  // Squash
  'Squash___Powdery_mildew': {
    crop: 'Squash / Cucurbit',
    disease: 'Powdery Mildew (Podosphaera xanthii)',
    severity: 'Moderate',
    symptoms: 'White powdery circular talcum-like fungal patches on both leaf surfaces and stems. Heavily infected leaves turn yellow, brown, and brittle.',
    treatmentAdvice: 'Spray dilute baking soda solution (5g/L water with a few drops of liquid soap) or 0.5% neem oil emulsion. Apply sulfur sprays in early morning.',
    prevention: 'Plant powdery-mildew-tolerant squash varieties. Space vines adequately to reduce humidity within canopy.'
  },

  // Strawberry
  'Strawberry___Leaf_scorch': {
    crop: 'Strawberry',
    disease: 'Leaf Scorch (Diplocarpon earlianum)',
    severity: 'Moderate',
    symptoms: 'Numerous small, irregular dark purple or brown spots on upper leaf surfaces. As spots coalesce, leaf margins curl upward and appear scorched/burned.',
    treatmentAdvice: 'Remove and destroy severely affected leaves. Apply protective copper bio-fungicide or captan after harvesting.',
    prevention: 'Plant in well-drained raised beds with plastic mulch. Avoid overhead sprinkler irrigation during late afternoon.'
  },
  'Strawberry___healthy': {
    crop: 'Strawberry',
    disease: 'Healthy Strawberry Foliage',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Lush trifoliate green leaves with serrated edges, active runner growth, and no leaf spots or angular scorch marks.',
    treatmentAdvice: 'No fungicide required. Maintain consistent drip moisture and balanced micronutrient fertigation.',
    prevention: 'Mulch with clean pine straw or black plastic to keep leaves and fruit away from bare soil.'
  },

  // Tomato
  'Tomato___Bacterial_spot': {
    crop: 'Tomato',
    disease: 'Bacterial Spot (Xanthomonas perforans)',
    severity: 'High',
    symptoms: 'Small (under 3mm), dark brown water-soaked angular spots on leaves, surrounded by faint yellow halos. Center of spots may crack or tear out.',
    treatmentAdvice: 'Apply fixed copper bactericide combined with mancozeb or bio-control Bacillus subtilis. Cease overhead irrigation immediately.',
    prevention: 'Use certified disease-free treated seeds. Clean stakes and trellising clips between seasons. Rotate fields away from nightshade crops.'
  },
  'Tomato___Early_blight': {
    crop: 'Tomato',
    disease: 'Early Blight (Alternaria solani)',
    severity: 'Moderate',
    symptoms: 'Concentric dark brown rings ("target spots") on older bottom leaves, surrounded by yellow chlorotic halos. Lower foliage withers and drops prematurely.',
    treatmentAdvice: 'Apply organic Trichoderma harzianum or 5% neem seed kernel extract. For high fungal pressure, apply Mancozeb 75 WP or Chlorothalonil per agricultural extension directions.',
    prevention: 'Practice 3-year crop rotation with non-solanaceous crops. Stake plants for improved canopy airflow. Irrigate at the plant base with drip lines.'
  },
  'Tomato___Late_blight': {
    crop: 'Tomato',
    disease: 'Late Blight (Phytophthora infestans)',
    severity: 'High',
    symptoms: 'Large, irregular water-soaked pale-green to dark brown lesions that expand rapidly. White fuzzy fungal growth on the underside during humid conditions.',
    treatmentAdvice: 'CRITICAL TREATMENT: Prune and bag infected plants immediately. Apply copper hydroxide or systemic metalaxyl / cymoxanil fungicides without delay.',
    prevention: 'Space plants widely for rapid leaf drying. Avoid planting tomatoes adjacent to potato fields. Destroy volunteer nightshade weeds.'
  },
  'Tomato___Leaf_Mold': {
    crop: 'Tomato',
    disease: 'Leaf Mold (Passalora fulva)',
    severity: 'Moderate',
    symptoms: 'Pale green or yellowish spots with indefinite margins on upper leaf surface. Corresponding underside develops olive-green to brownish velvety mold.',
    treatmentAdvice: 'Reduce greenhouse/field relative humidity below 85% by improving ventilation. Apply protective copper soap spray or bio-fungicide.',
    prevention: 'Prune suckers to enhance interior canopy airflow. Plant resistant hybrid cultivars with Cf gene resistance.'
  },
  'Tomato___Septoria_leaf_spot': {
    crop: 'Tomato',
    disease: 'Septoria Leaf Spot (Septoria lycopersici)',
    severity: 'Moderate',
    symptoms: 'Numerous small circular spots (2-3 mm) with dark brown borders and grayish-white centers containing tiny black fruiting bodies (pycnidia).',
    treatmentAdvice: 'Remove infected bottom leaves promptly. Spray bio-fungicide or copper fungicide early in disease onset before canopy defoliation.',
    prevention: 'Apply thick organic straw mulch around plant base to prevent soil splash. Avoid working in tomato rows while foliage is wet.'
  },
  'Tomato___Spider_mites Two-spotted_spider_mite': {
    crop: 'Tomato',
    disease: 'Two-Spotted Spider Mite Infestation (Tetranychus urticae)',
    severity: 'Moderate',
    symptoms: 'Fine yellow-white stippling (speckling) on leaf blades. Under heavy infestation, fine silky webbing envelops leaf undersides and shoot tips; leaves turn bronze and desiccate.',
    treatmentAdvice: 'Spray botanical neem oil (1%), insecticidal soap, or release predatory mites (Phytoseiulus persimilis). Wash foliage undersides with a gentle water jet.',
    prevention: 'Avoid excessive nitrogen fertilization which stimulates mite reproduction. Keep field perimeters moist and free of dusty conditions.'
  },
  'Tomato___Target_Spot': {
    crop: 'Tomato',
    disease: 'Target Spot (Corynespora cassiicola)',
    severity: 'Moderate',
    symptoms: 'Small, pinpoint water-soaked spots that enlarge into circular lesions with light brown centers and dark concentric rings. Lesions may crack.',
    treatmentAdvice: 'Apply protective bio-fungicide or azoxystrobin. Prune lower canopy foliage to keep leaves off moist mulch.',
    prevention: 'Provide adequate plant spacing. Ensure drip irrigation lines do not leak and saturate the soil surface.'
  },
  'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
    crop: 'Tomato',
    disease: 'Tomato Yellow Leaf Curl Virus (TYLCV)',
    severity: 'High',
    symptoms: 'Severe stunting of plants with leaves curling upward and cupping. Interveinal chlorosis, reduced leaf blade size, and heavy blossom drop.',
    treatmentAdvice: 'Viral disease transmitted by Silverleaf Whiteflies (Bemisia tabaci). Install yellow sticky traps (15-20 traps/acre). Spray neem oil or pymetrozine to control whitefly vector. Remove virus-infected plants to prevent spread.',
    prevention: 'Grow TYLCV-resistant hybrids. Use 50-mesh insect netting in nurseries to exclude whitefly vectors.'
  },
  'Tomato___Tomato_mosaic_virus': {
    crop: 'Tomato',
    disease: 'Tomato Mosaic Virus (ToMV)',
    severity: 'High',
    symptoms: 'Mottled alternating light and dark green mosaic patterns on foliage. Leaves may show "shoestring" distortion, leaf curling, and internal fruit browning.',
    treatmentAdvice: 'No chemical cure exists for viral plant infection. Immediately rogue and burn infected plants. Wash hands and tools with 20% non-fat dry milk solution before handling healthy plants.',
    prevention: 'Disallow tobacco use near tomato fields. Select ToMV-resistant cultivars (marked with "T" or "ToMV" on seed packet).'
  },
  'Tomato___healthy': {
    crop: 'Tomato',
    disease: 'Healthy Vigorous Foliage',
    severity: 'None',
    isHealthy: true,
    symptoms: 'Uniform deep green leaves, sturdy hirsute stems, crisp leaflets with zero viral cupping, concentric rings, or water-soaked lesions.',
    treatmentAdvice: 'No treatment required. Maintain regular calcium and potassium fertigation to prevent blossom end rot.',
    prevention: 'Stake vines cleanly, scout weekly for hornworms or aphids, and water at soil level.'
  }
};

/**
 * Get agronomic guidance for a predicted label or fallback to reasonable safe defaults.
 */
export function getPlantDiseaseDetails(rawLabel, cropFallback, diseaseFallback) {
  if (rawLabel && PLANT_DISEASE_GUIDE[rawLabel]) {
    return { ...PLANT_DISEASE_GUIDE[rawLabel] };
  }

  // Fallback safe agronomic guidance
  return {
    crop: cropFallback || 'Crop Specimen',
    disease: diseaseFallback || 'Foliar Screening',
    severity: 'Moderate',
    symptoms: 'Examine leaf surface for concentric brown rings, water-soaked dark margins, powdery fungal sporulation, or yellow halos.',
    treatmentAdvice: 'Apply safe organic bio-protectants (5% neem seed kernel extract or Trichoderma harzianum). For severe spread, consult your local Agricultural Extension Officer or Krishi Vigyan Kendra (KVK).',
    prevention: 'Irrigate at the plant base with drip lines to keep canopy dry. Maintain proper plant spacing to facilitate air circulation and sunlight penetration.'
  };
}

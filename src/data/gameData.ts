import {
  DistrictZone,
  FactionId,
  LevelConfig,
  LevelId,
  MetroGate,
  OutfitConfig,
  RoadSegment,
  Structure25D,
  TerritoryZone,
  WorldBarricade,
  WorldCoverSpot,
} from '../types/game';

export const WORLD_SIZE = 3200;

export const OUTFITS: OutfitConfig[] = [
  // POLICE OUTFITS
  {
    id: 'police_khaki',
    name: 'Delhi Khaki Patrol',
    faction: 'POLICE',
    tagline: 'Classic New Delhi district inspector with peaked cap and cane lathi.',
    primaryColor: '#C29B61',
    secondaryColor: '#8C6239',
    accentColor: '#EF4444',
    skinTone: '#D99B72',
    headgear: 'PEAKED_CAP',
    accessory: 'BATON_SHIELD',
    statBonus: '+15% Capture Lunge Reach',
  },
  {
    id: 'police_rapid',
    name: 'Rapid Action Tactical',
    faction: 'POLICE',
    tagline: 'Navy rapid-response command unit built for multi-district open-world interception.',
    primaryColor: '#1E3A8A',
    secondaryColor: '#0F172A',
    accentColor: '#38BDF8',
    skinTone: '#C6865E',
    headgear: 'BERET',
    accessory: 'WHISTLE_VEST',
    statBonus: '-25% Patrol Whistle Cooldown',
  },
  {
    id: 'police_night',
    name: 'Night Traffic Command',
    faction: 'POLICE',
    tagline: 'High-visibility curfew interceptor with reflective trim and strobe baton.',
    primaryColor: '#1E293B',
    secondaryColor: '#090D16',
    accentColor: '#F59E0B',
    skinTone: '#E0A37C',
    headgear: 'HELMET',
    accessory: 'NIGHT_BEACON',
    statBonus: '+20% Radar Sight Range',
  },

  // PROTESTER OUTFITS
  {
    id: 'protester_saffron',
    name: 'Saffron Scarf Runner',
    faction: 'PROTESTER',
    tagline: 'Agile open-world parkour leader wearing the signature flowing saffron scarf.',
    primaryColor: '#1E293B',
    secondaryColor: '#334155',
    accentColor: '#FF9933',
    skinTone: '#D99B72',
    headgear: 'HEADBAND',
    accessory: 'SAFFRON_SCARF',
    statBonus: '+15% Sprint Stamina Efficiency',
  },
  {
    id: 'protester_student',
    name: 'University Activist',
    faction: 'PROTESTER',
    tagline: 'Charismatic district organizer equipped with megaphone and tricolor sash.',
    primaryColor: '#0F5132',
    secondaryColor: '#1E293B',
    accentColor: '#F8FAFC',
    skinTone: '#C6865E',
    headgear: 'TURBAN_SCARF',
    accessory: 'TRICOLOR_BANNER',
    statBonus: '+30% Territory Zone Rally Speed',
  },
  {
    id: 'protester_shadow',
    name: 'Shadow Parkour Hoodie',
    faction: 'PROTESTER',
    tagline: 'Stealth specialist who sheds Police Heat stars rapidly inside cover zones.',
    primaryColor: '#0F172A',
    secondaryColor: '#1E293B',
    accentColor: '#10B981',
    skinTone: '#E0A37C',
    headgear: 'HOODIE',
    accessory: 'MEGAPHONE',
    statBonus: '+40% Faster Heat Cooldown in Cover',
  },
];

export const FACTION_INFO: Record<
  FactionId,
  {
    title: string;
    subtitle: string;
    roleBadge: string;
    themeColor: string;
    accentHex: string;
    description: string;
    bullets: string[];
    abilityName: string;
    abilityDescription: string;
    interactName: string;
    ctaLabel: string;
  }
> = {
  POLICE: {
    title: 'POLICE — THE PURSUERS',
    subtitle: 'Open-World City Command & Tactical Interception',
    roleBadge: 'PURSUIT FACTION',
    themeColor: 'from-blue-950/90 via-slate-900/95 to-slate-950',
    accentHex: '#3B82F6',
    description:
      'Patrol a seamless 2.5D open-world recreation of New Delhi—from Jantar Mantar and Connaught Place to Sansad Marg. Track live dispatches on your radar minimap, blow your whistle to summon AI squads, and apprehend Protester Leaders.',
    bullets: [
      'Free-roam 360° across Jantar Mantar, Connaught Place, and Sansad Marg.',
      'Track Protester cells on your real-time Tactical Radar Minimap.',
      'Use Patrol Whistle [Q] to ping targets and rally nearby AI police units.',
      'Execute Capture Lunges [E] to apprehend high-value Protester Leaders.',
      'Lock down contested Territory Zones before citywide unrest peaks.',
    ],
    abilityName: 'Patrol Whistle & Squad Ping [Q]',
    abilityDescription:
      'Emits a sonic whistle blast that reveals hidden protesters in tents/groves, pings all runners on the minimap, and orders nearby AI officers to converge.',
    interactName: '360° Capture Lunge [E]',
    ctaLabel: 'PLAY AS POLICE',
  },
  PROTESTER: {
    title: 'PROTESTERS — THE ESCAPE ARTISTS',
    subtitle: 'Open-World Territory Rally, Stealth & Evasion',
    roleBadge: 'EVASION FACTION',
    themeColor: 'from-amber-950/90 via-slate-900/95 to-slate-950',
    accentHex: '#FF9933',
    description:
      'Explore the interconnected boulevards, monument parks, and bazaar alleys of New Delhi. Rally support across 5 landmark Territory Zones, evade escalating 1–5 Star Police Heat levels, duck into Shamiana tents to lose pursuers, and extract via Metro Gates.',
    bullets: [
      '360° open-world movement across 5 iconic New Delhi districts.',
      'Rally Territory Zones at Jantar Mantar, Connaught Place, and Janpath.',
      'Survive escalating 1–5 Star Police Heat levels and emergent chases.',
      'Hide inside Shamiana Tents and Banyan Groves [C] to shed Police Heat.',
      'Unlock and reach an active Metro Extraction Gate once zones are rallied.',
    ],
    abilityName: 'Saffron Smoke Decoy [Q]',
    abilityDescription:
      'Deploys a dense 2.5D saffron-and-emerald smoke cloud that blocks police vision cones, drops Heat, and restores sprint stamina.',
    interactName: 'Adrenaline Vault / Rally [E]',
    ctaLabel: 'PLAY AS PROTESTER',
  },
};

/**
 * SEAMLESS 3200 x 3200 NEW DELHI OPEN-WORLD MAP GEOMETRY
 */
export const DISTRICTS: DistrictZone[] = [
  {
    id: 'connaught_place',
    name: 'CONNAUGHT PLACE CIRCLE',
    subtitle: 'Georgian Colonnade & Central Rajiv Chowk Park',
    x: 200,
    y: 150,
    width: 2800,
    height: 850,
    groundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  {
    id: 'jantar_mantar',
    name: 'JANTAR MANTAR OBSERVATORY PARK',
    subtitle: 'Historic Astronomical Monuments & Heritage Gardens',
    x: 900,
    y: 1050,
    width: 1400,
    height: 1150,
    groundColor: '#133223',
    borderColor: '#FF9933',
  },
  {
    id: 'sansad_marg',
    name: 'SANSAD MARG BOULEVARD',
    subtitle: 'High-Security Government Avenue & Civic Towers',
    x: 150,
    y: 1050,
    width: 720,
    height: 1950,
    groundColor: '#172033',
    borderColor: '#EF4444',
  },
  {
    id: 'janpath_bazaar',
    name: 'JANPATH HERITAGE BAZAAR',
    subtitle: 'Bustling Pedestrian Market & Eastern Colonnade',
    x: 2330,
    y: 1050,
    width: 720,
    height: 1950,
    groundColor: '#231D29',
    borderColor: '#F59E0B',
  },
  {
    id: 'patel_chowk_metro',
    name: 'PATEL CHOWK & TOLSTOY PLAZA',
    subtitle: 'Southern Transit Hub & Extraction Corridor',
    x: 900,
    y: 2230,
    width: 1400,
    height: 770,
    groundColor: '#162234',
    borderColor: '#10B981',
  },
];

export const ROADS: RoadSegment[] = [
  // Sansad Marg (West North-South Grand Boulevard)
  { id: 'r_sansad', x1: 520, y1: 200, x2: 520, y2: 3000, width: 170, hasMedian: true, label: 'SANSAD MARG' },
  // Janpath Road (East North-South Grand Avenue)
  { id: 'r_janpath', x1: 2660, y1: 200, x2: 2660, y2: 3000, width: 170, hasMedian: true, label: 'JANPATH ROAD' },
  // Connaught Outer Circle (Northern East-West Artery)
  { id: 'r_cp_outer', x1: 250, y1: 560, x2: 2950, y2: 560, width: 180, hasMedian: true, label: 'CONNAUGHT OUTER CIRCLE' },
  // Jantar Mantar Road (Central East-West Boulevard)
  { id: 'r_jm_road', x1: 250, y1: 1050, x2: 2950, y2: 1050, width: 150, hasMedian: true, label: 'JANTAR MANTAR ROAD' },
  // Tolstoy Marg (Southern East-West Boulevard)
  { id: 'r_tolstoy', x1: 250, y1: 2220, x2: 2950, y2: 2220, width: 160, hasMedian: true, label: 'TOLSTOY MARG' },
  // Ashoka Road (Far South Perimeter)
  { id: 'r_ashoka', x1: 250, y1: 2820, x2: 2950, y2: 2820, width: 150, hasMedian: false, label: 'ASHOKA ROAD' },
  // Central Observatory Promenade (North-South Park Walkway)
  { id: 'r_central_walk', x1: 1600, y1: 560, x2: 1600, y2: 2820, width: 110, hasMedian: false, label: 'CENTRAL PROMENADE' },
];

export const STRUCTURES_25D: Structure25D[] = [
  // Jantar Mantar Iconic Terracotta Monuments
  {
    id: 'samrat_yantra',
    name: 'Samrat Yantra (Giant Sundial)',
    x: 1120,
    y: 1320,
    width: 310,
    depth: 190,
    height25D: 125,
    type: 'SAMRAT_YANTRA',
    wallColor: '#B84A39',
    roofColor: '#9A3412',
    trimColor: '#FDE68A',
  },
  {
    id: 'ram_yantra',
    name: 'Ram Yantra (Cylindrical Observatory)',
    x: 1820,
    y: 1340,
    width: 240,
    depth: 190,
    height25D: 95,
    type: 'RAM_YANTRA',
    wallColor: '#A33B2B',
    roofColor: '#7C2D12',
    trimColor: '#FDE68A',
  },
  {
    id: 'jai_prakash',
    name: 'Jai Prakash Yantra (Hemisphere Bowls)',
    x: 1180,
    y: 1780,
    width: 260,
    depth: 160,
    height25D: 75,
    type: 'JAI_PRAKASH',
    wallColor: '#B84A39',
    roofColor: '#7F2F23',
    trimColor: '#F3E5AB',
  },
  {
    id: 'misra_yantra',
    name: 'Misra Yantra Archway',
    x: 1840,
    y: 1780,
    width: 230,
    depth: 160,
    height25D: 88,
    type: 'SAMRAT_YANTRA',
    wallColor: '#B84A39',
    roofColor: '#9A3412',
    trimColor: '#FDE68A',
  },

  // Connaught Place Georgian White Colonnades
  {
    id: 'cp_block_a',
    name: 'Connaught Place Block A Colonnade',
    x: 780,
    y: 260,
    width: 580,
    depth: 170,
    height25D: 92,
    type: 'CP_COLONNADE',
    wallColor: '#E2E8F0',
    roofColor: '#334155',
    trimColor: '#F8FAFC',
  },
  {
    id: 'cp_block_b',
    name: 'Connaught Place Block B Colonnade',
    x: 1840,
    y: 260,
    width: 580,
    depth: 170,
    height25D: 92,
    type: 'CP_COLONNADE',
    wallColor: '#E2E8F0',
    roofColor: '#334155',
    trimColor: '#F8FAFC',
  },
  {
    id: 'cp_block_f',
    name: 'Connaught Outer Arcade West',
    x: 820,
    y: 740,
    width: 520,
    depth: 155,
    height25D: 85,
    type: 'CP_COLONNADE',
    wallColor: '#CBD5E1',
    roofColor: '#1E293B',
    trimColor: '#F8FAFC',
  },
  {
    id: 'cp_block_n',
    name: 'Connaught Outer Arcade East',
    x: 1860,
    y: 740,
    width: 520,
    depth: 155,
    height25D: 85,
    type: 'CP_COLONNADE',
    wallColor: '#CBD5E1',
    roofColor: '#1E293B',
    trimColor: '#F8FAFC',
  },

  // Sansad Marg Civic & Ministry Towers
  {
    id: 'ndmc_tower',
    name: 'Palika Kendra Civic Tower',
    x: 190,
    y: 1260,
    width: 210,
    depth: 260,
    height25D: 140,
    type: 'CIVIC_TOWER',
    wallColor: '#475569',
    roofColor: '#1E293B',
    trimColor: '#38BDF8',
  },
  {
    id: 'sanchar_bhawan',
    name: 'Sansad Marg Annex Building',
    x: 190,
    y: 1750,
    width: 210,
    depth: 250,
    height25D: 115,
    type: 'CIVIC_TOWER',
    wallColor: '#64748B',
    roofColor: '#0F172A',
    trimColor: '#F59E0B',
  },

  // Janpath Market & Eastern Stalls
  {
    id: 'janpath_emporium',
    name: 'Janpath Craft Emporium',
    x: 2800,
    y: 1280,
    width: 220,
    depth: 280,
    height25D: 90,
    type: 'BAZAAR_HALL',
    wallColor: '#9A3412',
    roofColor: '#431407',
    trimColor: '#FF9933',
  },
  {
    id: 'imperial_arcade',
    name: 'Janpath Heritage Hotel Wing',
    x: 2800,
    y: 1780,
    width: 220,
    depth: 260,
    height25D: 110,
    type: 'CP_COLONNADE',
    wallColor: '#E2E8F0',
    roofColor: '#334155',
    trimColor: '#FBBF24',
  },

  // Southern Metro & Plaza Pavilions
  {
    id: 'patel_metro_bldg',
    name: 'Patel Chowk Metro Concourse',
    x: 1020,
    y: 2450,
    width: 340,
    depth: 175,
    height25D: 82,
    type: 'METRO_HUB',
    wallColor: '#1E3A8A',
    roofColor: '#0F172A',
    trimColor: '#38BDF8',
  },
  {
    id: 'tolstoy_house',
    name: 'Tolstoy Marg Commercial Plaza',
    x: 1840,
    y: 2450,
    width: 340,
    depth: 175,
    height25D: 105,
    type: 'CIVIC_TOWER',
    wallColor: '#475569',
    roofColor: '#1E293B',
    trimColor: '#10B981',
  },
];

export const INITIAL_TERRITORY_ZONES: TerritoryZone[] = [
  {
    id: 'zone_jantar_core',
    name: 'Jantar Mantar Sundial Plaza',
    districtName: 'JANTAR MANTAR PARK',
    x: 1600,
    y: 1600,
    radius: 155,
    progress: 35,
    owner: 'NEUTRAL',
    contested: false,
  },
  {
    id: 'zone_cp_circle',
    name: 'Rajiv Chowk Central Amphitheatre',
    districtName: 'CONNAUGHT PLACE',
    x: 1600,
    y: 560,
    radius: 155,
    progress: 20,
    owner: 'NEUTRAL',
    contested: false,
  },
  {
    id: 'zone_sansad_cordon',
    name: 'Sansad Marg Police Cordon',
    districtName: 'SANSAD MARG',
    x: 520,
    y: 1600,
    radius: 150,
    progress: 15,
    owner: 'POLICE',
    contested: false,
  },
  {
    id: 'zone_janpath_market',
    name: 'Janpath Bazaar Square',
    districtName: 'JANPATH BAZAAR',
    x: 2660,
    y: 1600,
    radius: 150,
    progress: 40,
    owner: 'NEUTRAL',
    contested: false,
  },
  {
    id: 'zone_tolstoy_crossing',
    name: 'Patel Chowk Metro Roundabout',
    districtName: 'PATEL CHOWK PLAZA',
    x: 1600,
    y: 2220,
    radius: 155,
    progress: 25,
    owner: 'NEUTRAL',
    contested: false,
  },
];

export const METRO_GATES: MetroGate[] = [
  { id: 'metro_rajiv', name: 'Rajiv Chowk Metro Gate 4 (North)', x: 1600, y: 210, radius: 75 },
  { id: 'metro_patel', name: 'Patel Chowk Metro Gate 1 (South)', x: 1600, y: 2940, radius: 75 },
  { id: 'metro_janpath', name: 'Janpath Metro Station Exit (East)', x: 2960, y: 1050, radius: 75 },
];

export const WORLD_COVER_SPOTS: WorldCoverSpot[] = [
  { id: 'cov_1', x: 740, y: 1180, width: 120, depth: 85, height25D: 50, type: 'SHAMIANA_TENT', label: 'Shamiana Protest Tent' },
  { id: 'cov_2', x: 1540, y: 1220, width: 120, depth: 85, height25D: 50, type: 'BANNER_PAVILION', label: 'Central Banner Canopy' },
  { id: 'cov_3', x: 2220, y: 1180, width: 120, depth: 85, height25D: 50, type: 'SHAMIANA_TENT', label: 'East Lawn Tent' },
  { id: 'cov_4', x: 1380, y: 500, width: 110, depth: 80, height25D: 45, type: 'CHAI_STALL', label: 'Connaught Chai & Book Stall' },
  { id: 'cov_5', x: 640, y: 1850, width: 115, depth: 85, height25D: 55, type: 'BANYAN_GROVE', label: 'Sansad Banyan Shade' },
  { id: 'cov_6', x: 2460, y: 1850, width: 120, depth: 85, height25D: 50, type: 'SHAMIANA_TENT', label: 'Janpath Textile Canopy' },
  { id: 'cov_7', x: 1540, y: 1960, width: 120, depth: 85, height25D: 50, type: 'SHAMIANA_TENT', label: 'South Garden Camp' },
  { id: 'cov_8', x: 1460, y: 2560, width: 115, depth: 80, height25D: 45, type: 'CHAI_STALL', label: 'Metro Plaza Vendor Stall' },
];

export const WORLD_BARRICADES: WorldBarricade[] = [
  // Sansad Marg Blockade Line
  { id: 'bar_1', x: 450, y: 1020, width: 140, depth: 28, height25D: 34, type: 'DELHI_BARRICADE', vaultable: true },
  { id: 'bar_2', x: 460, y: 1380, width: 110, depth: 48, height25D: 46, type: 'POLICE_VAN', vaultable: true },
  { id: 'bar_3', x: 450, y: 1920, width: 140, depth: 28, height25D: 34, type: 'DELHI_BARRICADE', vaultable: true },

  // Jantar Mantar Road Cordons
  { id: 'bar_4', x: 960, y: 1015, width: 115, depth: 28, height25D: 34, type: 'DELHI_BARRICADE', vaultable: true },
  { id: 'bar_5', x: 1540, y: 990, width: 120, depth: 28, height25D: 34, type: 'DELHI_BARRICADE', vaultable: true },
  { id: 'bar_6', x: 2120, y: 1015, width: 115, depth: 28, height25D: 34, type: 'DELHI_BARRICADE', vaultable: true },

  // Connaught Place Outer Circle Checkpoints
  { id: 'bar_7', x: 1160, y: 525, width: 110, depth: 48, height25D: 46, type: 'POLICE_VAN', vaultable: true },
  { id: 'bar_8', x: 1920, y: 525, width: 115, depth: 28, height25D: 34, type: 'DELHI_BARRICADE', vaultable: true },

  // Janpath & Tolstoy Intersections
  { id: 'bar_9', x: 2600, y: 1280, width: 125, depth: 28, height25D: 34, type: 'DELHI_BARRICADE', vaultable: true },
  { id: 'bar_10', x: 2600, y: 1920, width: 110, depth: 48, height25D: 46, type: 'POLICE_VAN', vaultable: true },
  { id: 'bar_11', x: 1260, y: 2190, width: 125, depth: 28, height25D: 34, type: 'DELHI_BARRICADE', vaultable: true },
  { id: 'bar_12', x: 1840, y: 2190, width: 125, depth: 28, height25D: 34, type: 'JERSEY_BARRIER', vaultable: true },
];

export const LEVELS: Record<LevelId, LevelConfig> = {
  street_pursuit: {
    id: 'street_pursuit',
    number: 1,
    title: 'GOLDEN HOUR UPRISING',
    subtitle: 'Open-World New Delhi · Sunset Sandbox',
    timeOfDay: 'SUNSET',
    difficulty: 'MODERATE',
    timeLimit: 180,
    targetZonesRequired: 3,
    initialHeat: 1,
    policeSquadCount: 6,
    protesterCellCount: 5,
    description:
      'Warm golden-hour sunlight bathes the entire New Delhi open world. Roam freely between Jantar Mantar, Connaught Place, and Sansad Marg to rally 3 Territory Zones and extract—or command Police patrols to apprehend the movement leaders.',
    policeObjective:
      'Patrol the open-world districts, respond to zone alerts on the radar minimap, and capture 3 Protester Leaders.',
    protesterObjective:
      'Roam the city to rally at least 3 Territory Zones (100%), survive Police Heat, and extract at any green Metro Gate.',
    skyColors: ['#1D1B38', '#C85A32', '#F4A261'],
    ambientLight: 1.0,
    hasSearchlights: false,
  },

  barricade_run: {
    id: 'barricade_run',
    number: 2,
    title: 'HIGH-ALERT BLOCKADE',
    subtitle: 'Open-World New Delhi · Dusk Lockdown',
    timeOfDay: 'DUSK',
    difficulty: 'CHALLENGING',
    timeLimit: 210,
    targetZonesRequired: 4,
    initialHeat: 2,
    policeSquadCount: 8,
    protesterCellCount: 6,
    description:
      'As dusk settles over Connaught Place and Sansad Marg, Police Heat starts at 2 Stars with reinforced barricade cordons and rapid-response patrols. Requires rallying 4 of the 5 city districts to unlock Metro extraction.',
    policeObjective:
      'Defend the 5 city districts from Protester rallies and apprehend 4 Protester Leaders across the blockade.',
    protesterObjective:
      'Break through heavy dusk cordons, rally 4 Territory Zones across New Delhi, and escape via an active Metro Gate.',
    skyColors: ['#111827', '#7C2D12', '#EA580C'],
    ambientLight: 0.82,
    hasSearchlights: false,
  },

  night_escape: {
    id: 'night_escape',
    number: 3,
    title: 'MIDNIGHT CURFEW',
    subtitle: 'Open-World New Delhi · Searchlight Sweep',
    timeOfDay: 'NIGHT',
    difficulty: 'INTENSE',
    timeLimit: 240,
    targetZonesRequired: 4,
    initialHeat: 3,
    policeSquadCount: 10,
    protesterCellCount: 7,
    description:
      'Under a midnight curfew, sweeping helicopter and tower searchlights patrol the entire open-world map. High-stakes stealth inside Shamiana tents and Banyan groves is essential to survive 3+ Star Heat.',
    policeObjective:
      'Use sweeping night searchlights and Patrol Whistles to flush out and capture 5 Protester Leaders.',
    protesterObjective:
      'Evade sweeping searchlights under 3-Star Curfew Heat, rally 4 Territory Zones, and reach a Midnight Metro Gate.',
    skyColors: ['#050814', '#0B132B', '#1E293B'],
    ambientLight: 0.52,
    hasSearchlights: true,
  },
};

export const GAMEPLAY_TIPS: string[] = [
  'OPEN-WORLD MOVEMENT: Use [WASD] or [Arrow Keys] to move 360° across Jantar Mantar, Connaught Place, and Sansad Marg.',
  'TERRITORY RALLY: Stand inside circular Landmark Zones and press [E] to rapidly rally (Protester) or secure (Police) the district.',
  'HEAT & STEALTH: Hold [C] inside Shamiana Tents or Banyan Groves to become HIDDEN and rapidly shed Police Heat Stars!',
  'VAULT BARRICADES: Press [Space] while sprinting toward any yellow Delhi Police barricade to leap cleanly over it in 2.5D.',
  'TACTICAL RADAR: Watch the top-right Minimap (or press [M] to expand) to track contested zones, police patrols, and Metro gates.',
];

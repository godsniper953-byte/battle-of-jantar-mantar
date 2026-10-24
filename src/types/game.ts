export type FactionId = 'POLICE' | 'PROTESTER';

export type ScreenState =
  | 'MAIN_MENU'
  | 'SELECT_CHARACTER'
  | 'GAME_MODES'
  | 'PLAYING'
  | 'RESULTS';

export type ModalState = 'NONE' | 'SETTINGS' | 'HOW_TO_PLAY' | 'PAUSED';

export type LevelId = 'street_pursuit' | 'barricade_run' | 'night_escape';

export interface OutfitConfig {
  id: string;
  name: string;
  faction: FactionId;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  skinTone: string;
  headgear: 'PEAKED_CAP' | 'BERET' | 'HELMET' | 'HEADBAND' | 'HOODIE' | 'TURBAN_SCARF';
  accessory: 'BATON_SHIELD' | 'WHISTLE_VEST' | 'NIGHT_BEACON' | 'SAFFRON_SCARF' | 'MEGAPHONE' | 'TRICOLOR_BANNER';
  statBonus: string;
}

export interface DistrictZone {
  id: string;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  groundColor: string;
  borderColor: string;
}

export interface RoadSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  hasMedian?: boolean;
  label?: string;
}

export interface Structure25D {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height25D: number; // extruded vertical facade height
  type:
    | 'SAMRAT_YANTRA'
    | 'RAM_YANTRA'
    | 'JAI_PRAKASH'
    | 'CP_COLONNADE'
    | 'CIVIC_TOWER'
    | 'METRO_HUB'
    | 'BAZAAR_HALL';
  wallColor: string;
  roofColor: string;
  trimColor: string;
}

export interface WorldBarricade {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height25D: number;
  type: 'DELHI_BARRICADE' | 'POLICE_VAN' | 'DTC_BUS' | 'JERSEY_BARRIER' | 'TEA_CART';
  vaultable: boolean;
}

export interface WorldCoverSpot {
  id: string;
  x: number;
  y: number;
  width: number;
  depth: number;
  height25D: number;
  type: 'SHAMIANA_TENT' | 'BANYAN_GROVE' | 'BANNER_PAVILION' | 'CHAI_STALL';
  label: string;
}

export interface TerritoryZone {
  id: string;
  name: string;
  districtName: string;
  x: number;
  y: number;
  radius: number;
  progress: number; // 0..100 (100 = Protester Rallied, 0 = Police Lockdown)
  owner: 'NEUTRAL' | 'PROTESTER' | 'POLICE';
  contested: boolean;
}

export interface MetroGate {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
}

export interface LevelConfig {
  id: LevelId;
  number: number;
  title: string;
  subtitle: string;
  timeOfDay: 'SUNSET' | 'DUSK' | 'NIGHT';
  difficulty: 'MODERATE' | 'CHALLENGING' | 'INTENSE';
  timeLimit: number; // seconds
  targetZonesRequired: number;
  initialHeat: number; // 1..5
  policeSquadCount: number;
  protesterCellCount: number;
  description: string;
  policeObjective: string;
  protesterObjective: string;
  skyColors: [string, string, string];
  ambientLight: number;
  hasSearchlights: boolean;
}

export interface AudioSettings {
  musicVolume: number; // 0..100
  sfxVolume: number; // 0..100
  ambienceVolume: number; // 0..100
  muted: boolean;
  subtitles: boolean;
  showTouchControls: boolean;
  screenShake: boolean;
  highContrastHud: boolean;
}

export interface SubtitleCue {
  id: string;
  speaker: 'RADIO' | 'CROWD' | 'SYSTEM' | 'SFX';
  text: string;
  color: string;
  timestamp: number;
}

export interface GameResult {
  won: boolean;
  faction: FactionId;
  levelId: LevelId;
  reason: string;
  score: number;
  timeTaken: number;
  timeLimit: number;
  objectivesCompleted: { label: string; completed: boolean; bonus: number }[];
  capturesOrEvades: number;
  zonesSecured: number;
  peakHeat: number;
}

export interface HighScoreRecord {
  bestScore: number;
  fastestTime: number;
  wins: number;
}

export type CharacterStance =
  | 'IDLE'
  | 'RUN'
  | 'SPRINT'
  | 'JUMP'
  | 'FALL'
  | 'CROUCH'
  | 'LUNGE'
  | 'VAULT'
  | 'STUNNED'
  | 'CAUGHT'
  | 'VICTORY';

export interface ActiveCharacter {
  id: string;
  name: string;
  faction: FactionId;
  isPlayer: boolean;
  outfit: OutfitConfig;
  x: number; // 2D world X (0..3200)
  y: number; // 2D world Y (0..3200)
  z: number; // 2.5D vertical jump/vault height above ground (0 = on street)
  vx: number;
  vy: number;
  vz: number;
  moveAngle: number; // radians in 360-degree plane
  facing: 1 | -1; // horizontal sprite flip
  stance: CharacterStance;
  animFrame: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  isHidden: boolean;
  inCoverId: string | null;
  abilityCooldown: number;
  maxAbilityCooldown: number;
  abilityActiveTimer: number;
  lungeTimer: number;
  stunTimer: number;
  invulnerableTimer: number;
  squashX: number;
  squashY: number;
  alertState: 'PATROL' | 'SUSPICIOUS' | 'CHASE';
  targetZoneId?: string;
  isPrimaryTarget?: boolean;
  captured?: boolean;
  waypointX?: number;
  waypointY?: number;
}

export interface WorldParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'DUST' | 'EMBER' | 'SMOKE' | 'RING' | 'SPARK';
}

export interface DecoyCloud {
  id: string;
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer: number;
  faction: FactionId;
}

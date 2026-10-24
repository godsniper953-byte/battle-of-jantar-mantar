import React, { useEffect, useRef, useState } from 'react';
import {
  ActiveCharacter,
  AudioSettings,
  DecoyCloud,
  FactionId,
  GameResult,
  LevelConfig,
  OutfitConfig,
  TerritoryZone,
  WorldParticle,
} from '../types/game';
import {
  DISTRICTS,
  INITIAL_TERRITORY_ZONES,
  METRO_GATES,
  OUTFITS,
  STRUCTURES_25D,
  WORLD_BARRICADES,
  WORLD_COVER_SPOTS,
  WORLD_SIZE,
} from '../data/gameData';
import {
  drawArticulatedCharacter,
  drawOpenWorldGround,
  drawParticlesAndDecoys,
  drawStructure25D,
  drawTacticalCompassAndWaypoints,
  drawTacticalMinimap,
  drawWorldBarricade25D,
  drawWorldCover25D,
} from '../canvas/spriteRenderer';
import { soundEngine } from '../audio/soundEngine';

interface GameCanvasProps {
  faction: FactionId;
  outfit: OutfitConfig;
  level: LevelConfig;
  settings: AudioSettings;
  isPaused: boolean;
  onPauseToggle: () => void;
  onGameEnd: (result: GameResult) => void;
}

interface HudSnapshot {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  score: number;
  timeRemaining: number;
  districtName: string;
  heatStars: number; // 1..5
  zonesRalliedCount: number;
  zonesRequired: number;
  capturesCount: number;
  capturesRequired: number;
  gatesUnlocked: boolean;
  activeZoneName: string | null;
  activeZoneProgress: number | null;
  isHidden: boolean;
  inCoverLabel: string | null;
  alertState: 'PATROL' | 'SUSPICIOUS' | 'CHASE';
  abilityCooldown: number;
  maxAbilityCooldown: number;
  canCaptureNow: boolean;
  canExtractNow: boolean;
  currentZoomPct: number;
  currentTiltDeg: number;
  hintMessage: string | null;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  faction,
  outfit,
  level,
  settings,
  isPaused,
  onPauseToggle,
  onGameEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);
  const [expandedMap, setExpandedMap] = useState(false);

  // Camera Zoom & 2.5D Tilt Mutable Controls (accessible via HUD buttons, Scroll Wheel, or [Z]/[T] keys)
  const cameraControlRef = useRef({
    baseZoom: 0.64, // Wide 2.5D default so surroundings are clearly visible
    currentZoom: 0.64,
    baseTilt: 0.82, // 2.5D foreshortening tilt factor (0.72 = deep 2.5D angle, 0.94 = top-down)
    currentTilt: 0.82,
    autoAdapt: true,
  });

  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const capturesTargetTotal = level.number === 1 ? 3 : level.number === 2 ? 4 : 5;

  const [hud, setHud] = useState<HudSnapshot>({
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    score: 0,
    timeRemaining: level.timeLimit,
    districtName: 'JANTAR MANTAR OBSERVATORY PARK',
    heatStars: level.initialHeat,
    zonesRalliedCount: 0,
    zonesRequired: level.targetZonesRequired,
    capturesCount: 0,
    capturesRequired: capturesTargetTotal,
    gatesUnlocked: false,
    activeZoneName: null,
    activeZoneProgress: null,
    isHidden: false,
    inCoverLabel: null,
    alertState: 'PATROL',
    abilityCooldown: 0,
    maxAbilityCooldown: 8,
    canCaptureNow: false,
    canExtractNow: false,
    currentZoomPct: 64,
    currentTiltDeg: 35,
    hintMessage:
      faction === 'POLICE'
        ? '[WASD] 360° Move · [Space] Vault · [E] Capture · [Q] Whistle · [Scroll/Z] Zoom · [T] 2.5D Tilt'
        : '[WASD] 360° Move · [Space] Vault · [C] Hide · [Q] Smoke · [Scroll/Z] Zoom · [T] 2.5D Tilt',
  });

  // Mutable 360° input state
  const inputRef = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
    sprint: false,
    crouchHide: false,
    jumpPressed: false,
    interactPressed: false,
    abilityPressed: false,
  });

  const cycleZoomPreset = () => {
    soundEngine.playUiClick();
    const presets = [0.52, 0.64, 0.78];
    const curr = cameraControlRef.current.baseZoom;
    const nextIdx = (presets.findIndex((p) => Math.abs(p - curr) < 0.05) + 1) % presets.length;
    cameraControlRef.current.baseZoom = presets[nextIdx];
  };

  const cycleTiltPreset = () => {
    soundEngine.playUiClick();
    const tilts = [0.74, 0.82, 0.92];
    const curr = cameraControlRef.current.baseTilt;
    const nextIdx = (tilts.findIndex((t) => Math.abs(t - curr) < 0.04) + 1) % tilts.length;
    cameraControlRef.current.baseTilt = tilts[nextIdx];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    soundEngine.startGameplayAudio();

    const updateSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Clone Territory Zones for this sandbox session
    const zones: TerritoryZone[] = INITIAL_TERRITORY_ZONES.map((z) => ({ ...z }));

    const policeOutfits = OUTFITS.filter((o) => o.faction === 'POLICE');
    const protesterOutfits = OUTFITS.filter((o) => o.faction === 'PROTESTER');

    const maxCooldown = outfit.id === 'police_rapid' ? 6.0 : 8.0;

    // Spawn Player in Central Jantar Mantar Plaza
    const player: ActiveCharacter = {
      id: 'player',
      name: faction === 'POLICE' ? 'Inspector Vikram' : 'Aarav (Organizer)',
      faction,
      isPlayer: true,
      outfit,
      x: 1600,
      y: 1680,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      moveAngle: 0,
      facing: 1,
      stance: 'IDLE',
      animFrame: 0,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      isHidden: false,
      inCoverId: null,
      abilityCooldown: 0,
      maxAbilityCooldown: maxCooldown,
      abilityActiveTimer: 0,
      lungeTimer: 0,
      stunTimer: 0,
      invulnerableTimer: 0,
      squashX: 1,
      squashY: 1,
      alertState: 'PATROL',
    };

    const npcs: ActiveCharacter[] = [];

    // Spawn AI Protester Leaders & Cells across the 5 New Delhi Districts
    const protesterSpawns = [
      { x: 1600, y: 580, zoneId: 'zone_cp_circle' },
      { x: 2660, y: 1580, zoneId: 'zone_janpath_market' },
      { x: 1600, y: 2220, zoneId: 'zone_tolstoy_crossing' },
      { x: 520, y: 1620, zoneId: 'zone_sansad_cordon' },
      { x: 1550, y: 1540, zoneId: 'zone_jantar_core' },
      { x: 1120, y: 1050, zoneId: 'zone_jantar_core' },
      { x: 2150, y: 1050, zoneId: 'zone_janpath_market' },
    ];

    for (let i = 0; i < level.protesterCellCount; i++) {
      const sp = protesterSpawns[i % protesterSpawns.length];
      npcs.push({
        id: `protester_npc_${i}`,
        name: `Movement Leader #${i + 1}`,
        faction: 'PROTESTER',
        isPlayer: false,
        isPrimaryTarget: faction === 'POLICE',
        outfit: protesterOutfits[i % protesterOutfits.length],
        x: sp.x + (i % 2 === 0 ? 45 : -45),
        y: sp.y + (i % 3 === 0 ? 40 : -40),
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        moveAngle: 0,
        facing: 1,
        stance: 'RUN',
        animFrame: i * 1.3,
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        isHidden: false,
        inCoverId: null,
        abilityCooldown: 0,
        maxAbilityCooldown: 9,
        abilityActiveTimer: 0,
        lungeTimer: 0,
        stunTimer: 0,
        invulnerableTimer: 0,
        squashX: 1,
        squashY: 1,
        alertState: 'PATROL',
        targetZoneId: sp.zoneId,
        waypointX: sp.x,
        waypointY: sp.y,
      });
    }

    // Spawn AI Police Patrol Units across the City Boulevards
    const policeSpawns = [
      { x: 520, y: 1450 },
      { x: 1600, y: 720 },
      { x: 2660, y: 1420 },
      { x: 1600, y: 2050 },
      { x: 1150, y: 1050 },
      { x: 2050, y: 1050 },
      { x: 520, y: 800 },
      { x: 2660, y: 800 },
      { x: 1200, y: 2220 },
      { x: 2000, y: 2220 },
    ];

    for (let i = 0; i < level.policeSquadCount; i++) {
      const sp = policeSpawns[i % policeSpawns.length];
      npcs.push({
        id: `police_npc_${i}`,
        name: `PCR Patrol Officer #${i + 1}`,
        faction: 'POLICE',
        isPlayer: false,
        outfit: policeOutfits[i % policeOutfits.length],
        x: sp.x,
        y: sp.y,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        moveAngle: (i * Math.PI) / 2,
        facing: i % 2 === 0 ? 1 : -1,
        stance: 'RUN',
        animFrame: i * 1.7,
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        isHidden: false,
        inCoverId: null,
        abilityCooldown: 0,
        maxAbilityCooldown: 8,
        abilityActiveTimer: 0,
        lungeTimer: 0,
        stunTimer: 0,
        invulnerableTimer: 0,
        squashX: 1,
        squashY: 1,
        alertState: 'PATROL',
        waypointX: sp.x + (i % 2 === 0 ? 320 : -320),
        waypointY: sp.y,
      });
    }

    let camX = player.x - canvas.width / 2;
    let camY = player.y - canvas.height / 2;
    let timeElapsed = 0;
    let score = 0;
    let capturesOrEvades = 0;
    let heatValue = level.initialHeat; // continuous 1.0 .. 5.0
    let peakHeat = level.initialHeat;
    let hitstopTimer = 0;
    let shakeIntensity = 0;
    let footstepAccum = 0;
    let hudSyncAccum = 0;
    let gameEnded = false;

    const particles: WorldParticle[] = [];
    const decoys: DecoyCloud[] = [];

    const spawnBurst = (
      wx: number,
      wy: number,
      wz: number,
      count: number,
      color: string,
      type: WorldParticle['type'] = 'DUST'
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 110;
        particles.push({
          x: wx,
          y: wy,
          z: wz,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: 20 + Math.random() * 60,
          size: type === 'RING' ? 50 : 3 + Math.random() * 4,
          alpha: 0.88,
          color,
          life: type === 'RING' ? 0.5 : 0.35 + Math.random() * 0.35,
          maxLife: type === 'RING' ? 0.5 : 0.6,
          type,
        });
      }
    };

    // Mouse Wheel Zoom Handler
    const onWheel = (e: WheelEvent) => {
      if (isPausedRef.current) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      cameraControlRef.current.baseZoom = Math.max(
        0.46,
        Math.min(0.92, cameraControlRef.current.baseZoom + delta)
      );
    };

    // Keyboard Controls
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const code = e.code;
      if (code === 'Escape') {
        e.preventDefault();
        onPauseToggle();
        return;
      }
      if (code === 'KeyM' || code === 'Tab') {
        e.preventDefault();
        soundEngine.playUiClick();
        setExpandedMap((prev) => !prev);
        return;
      }
      if (code === 'KeyZ') {
        cycleZoomPreset();
        return;
      }
      if (code === 'KeyT') {
        cycleTiltPreset();
        return;
      }
      if (code === 'Minus' || code === 'NumpadSubtract') {
        cameraControlRef.current.baseZoom = Math.max(0.46, cameraControlRef.current.baseZoom - 0.06);
        return;
      }
      if (code === 'Equal' || code === 'NumpadAdd') {
        cameraControlRef.current.baseZoom = Math.min(0.92, cameraControlRef.current.baseZoom + 0.06);
        return;
      }
      if (isPausedRef.current) return;

      if (code === 'KeyW' || code === 'ArrowUp') inputRef.current.up = true;
      if (code === 'KeyS' || code === 'ArrowDown') inputRef.current.down = true;
      if (code === 'KeyA' || code === 'ArrowLeft') inputRef.current.left = true;
      if (code === 'KeyD' || code === 'ArrowRight') inputRef.current.right = true;
      if (code === 'ShiftLeft' || code === 'ShiftRight') inputRef.current.sprint = true;
      if (code === 'KeyC' || code === 'ControlLeft') inputRef.current.crouchHide = true;
      if (code === 'Space') {
        e.preventDefault();
        inputRef.current.jumpPressed = true;
      }
      if (code === 'KeyE') inputRef.current.interactPressed = true;
      if (code === 'KeyQ' || code === 'KeyF') inputRef.current.abilityPressed = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') inputRef.current.up = false;
      if (code === 'KeyS' || code === 'ArrowDown') inputRef.current.down = false;
      if (code === 'KeyA' || code === 'ArrowLeft') inputRef.current.left = false;
      if (code === 'KeyD' || code === 'ArrowRight') inputRef.current.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight') inputRef.current.sprint = false;
      if (code === 'KeyC' || code === 'ControlLeft') inputRef.current.crouchHide = false;
    };

    const onBlur = () => {
      inputRef.current.up = false;
      inputRef.current.down = false;
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.sprint = false;
      inputRef.current.crouchHide = false;
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);

    // Helper: Resolve 2D Circle vs 2.5D Structure Footprint Collisions
    const resolveBuildingCollision = (entity: ActiveCharacter, radius = 18) => {
      entity.x = Math.max(100, Math.min(WORLD_SIZE - 100, entity.x));
      entity.y = Math.max(100, Math.min(WORLD_SIZE - 100, entity.y));

      for (const s of STRUCTURES_25D) {
        const closestX = Math.max(s.x, Math.min(entity.x, s.x + s.width));
        const closestY = Math.max(s.y, Math.min(entity.y, s.y + s.depth));
        const dx = entity.x - closestX;
        const dy = entity.y - closestY;
        const distSq = dx * dx + dy * dy;
        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq) || 1;
          const overlap = radius - dist;
          entity.x += (dx / dist) * overlap;
          entity.y += (dy / dist) * overlap;
        }
      }
    };

    const finishGame = (won: boolean, reason: string, zonesCount: number) => {
      if (gameEnded) return;
      gameEnded = true;
      soundEngine.stopGameplayAudio();
      if (won) {
        soundEngine.playVictoryFanfare();
      } else {
        soundEngine.playDefeatSound();
      }

      const timeBonus = won ? Math.max(0, Math.round((level.timeLimit - timeElapsed) * 18)) : 0;
      const zoneBonus = zonesCount * 450;
      const actionBonus = capturesOrEvades * 350;
      const totalScore = Math.round(score + timeBonus + zoneBonus + actionBonus);

      const objectivesCompleted =
        faction === 'POLICE'
          ? [
              {
                label: `Apprehend ${capturesTargetTotal} Open-World Protester Leaders`,
                completed: won,
                bonus: won ? 1800 : 0,
              },
              {
                label: 'Prevent Protesters from Rallying 3+ City Districts',
                completed: zonesCount < level.targetZonesRequired,
                bonus: zonesCount < level.targetZonesRequired ? 650 : 0,
              },
              {
                label: 'Patrol Whistle Coordination & Rapid Captures',
                completed: capturesOrEvades >= 2,
                bonus: capturesOrEvades * 350,
              },
            ]
          : [
              {
                label: `Rally ${level.targetZonesRequired} New Delhi Territory Zones & Extract via Metro`,
                completed: won,
                bonus: won ? 1800 : 0,
              },
              {
                label: 'Evade High-Alert Police Patrols Using Stealth Cover',
                completed: capturesOrEvades >= 1,
                bonus: capturesOrEvades * 350,
              },
              {
                label: 'Survive With > 50% Health Across Open World',
                completed: player.health >= 50,
                bonus: player.health >= 50 ? 500 : 0,
              },
            ];

      onGameEnd({
        won,
        faction,
        levelId: level.id,
        reason,
        score: totalScore,
        timeTaken: Math.round(timeElapsed * 10) / 10,
        timeLimit: level.timeLimit,
        objectivesCompleted,
        capturesOrEvades,
        zonesSecured: zonesCount,
        peakHeat: Math.round(peakHeat),
      });
    };

    let lastTime = performance.now();
    let rafId = 0;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      if (isPausedRef.current || gameEnded) return;
      const dt = Math.min(rawDt, 0.05);

      if (hitstopTimer > 0) {
        hitstopTimer -= dt;
        return;
      }

      timeElapsed += dt;
      const timeRemaining = Math.max(0, level.timeLimit - timeElapsed);
      const ralliedZonesCount = zones.filter((z) => z.owner === 'PROTESTER').length;
      const gatesUnlocked = ralliedZonesCount >= level.targetZonesRequired;

      if (timeRemaining <= 0) {
        if (faction === 'POLICE') {
          finishGame(
            ralliedZonesCount < level.targetZonesRequired,
            ralliedZonesCount < level.targetZonesRequired
              ? 'You held the New Delhi perimeter until curfew enforcement completed!'
              : 'Time expired while too many districts remained under Protester control.',
            ralliedZonesCount
          );
        } else {
          finishGame(
            false,
            'Citywide lockdown timer expired before you extracted at a Metro Station.',
            ralliedZonesCount
          );
        }
        return;
      }

      // 1. PLAYER 360° MOVEMENT & Z-AXIS JUMP/VAULT PHYSICS
      const inp = inputRef.current;
      if (player.abilityCooldown > 0) player.abilityCooldown = Math.max(0, player.abilityCooldown - dt);
      if (player.abilityActiveTimer > 0) player.abilityActiveTimer = Math.max(0, player.abilityActiveTimer - dt);
      if (player.lungeTimer > 0) player.lungeTimer = Math.max(0, player.lungeTimer - dt);
      if (player.stunTimer > 0) player.stunTimer = Math.max(0, player.stunTimer - dt);
      if (player.invulnerableTimer > 0) player.invulnerableTimer = Math.max(0, player.invulnerableTimer - dt);

      player.squashX += (1 - player.squashX) * 12 * dt;
      player.squashY += (1 - player.squashY) * 12 * dt;

      // Check if Player is inside a 2.5D Stealth Cover Spot
      let activeCover = null;
      for (const cov of WORLD_COVER_SPOTS) {
        if (
          player.x >= cov.x - 10 &&
          player.x <= cov.x + cov.width + 10 &&
          player.y >= cov.y - 10 &&
          player.y <= cov.y + cov.depth + 10
        ) {
          activeCover = cov;
          break;
        }
      }
      player.inCoverId = activeCover ? activeCover.id : null;

      const inSmoke = decoys.some(
        (d) => Math.hypot(player.x - d.x, player.y - d.y) < d.radius
      );
      const wasHidden = player.isHidden;
      player.isHidden =
        faction === 'PROTESTER' &&
        ((Boolean(activeCover) && inp.crouchHide) || inSmoke);

      if (player.isHidden && !wasHidden) {
        soundEngine.playStealthConceal();
        capturesOrEvades++;
        score += 120;
      }

      // Shed Police Heat rapidly when hidden in cover
      if (player.isHidden) {
        const coolRate = outfit.id === 'protester_shadow' ? 0.55 : 0.35;
        heatValue = Math.max(1, heatValue - coolRate * dt);
      }

      // Jump / Vault in 2.5D Z-axis [Space]
      if (inp.jumpPressed) {
        inp.jumpPressed = false;
        if (player.z <= 2) {
          player.vz = 420;
          player.squashX = 0.82;
          player.squashY = 1.24;
          soundEngine.playJump();
          spawnBurst(player.x, player.y, 0, 8, '#CBD5E1', 'DUST');
        }
      }

      // Tactical Ability [Q]
      if (inp.abilityPressed) {
        inp.abilityPressed = false;
        if (player.abilityCooldown <= 0) {
          player.abilityCooldown = player.maxAbilityCooldown;
          player.abilityActiveTimer = 5.0;

          if (faction === 'POLICE') {
            soundEngine.playWhistle();
            spawnBurst(player.x, player.y, 20, 1, '#38BDF8', 'RING');
            player.stamina = Math.min(player.maxStamina, player.stamina + 40);
            const closestRunner = npcs.find((n) => n.faction === 'PROTESTER' && !n.captured);
            npcs.forEach((n) => {
              if (n.faction === 'POLICE') {
                n.alertState = 'CHASE';
                if (closestRunner) {
                  n.waypointX = closestRunner.x;
                  n.waypointY = closestRunner.y;
                }
              }
            });
            score += 120;
          } else {
            soundEngine.playSmokeDecoy();
            decoys.push({
              id: `decoy_${Date.now()}`,
              x: player.x,
              y: player.y,
              radius: 130,
              timer: 6.0,
              maxTimer: 6.0,
              faction: 'PROTESTER',
            });
            spawnBurst(player.x, player.y, 10, 14, '#FF9933', 'SMOKE');
            player.stamina = Math.min(player.maxStamina, player.stamina + 45);
            heatValue = Math.max(1, heatValue - 0.65);
            capturesOrEvades++;
            score += 150;
          }
        }
      }

      // 360° Input Vector
      const dxInput = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      const dyInput = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      const inputLen = Math.hypot(dxInput, dyInput);
      const normX = inputLen > 0 ? dxInput / inputLen : 0;
      const normY = inputLen > 0 ? dyInput / inputLen : 0;

      if (inputLen > 0 && player.lungeTimer <= 0) {
        player.moveAngle = Math.atan2(normY, normX);
        if (Math.abs(normX) > 0.05) {
          player.facing = normX >= 0 ? 1 : -1;
        }
      }

      // Context Action / Capture Lunge / Zone Rally Boost [E]
      if (inp.interactPressed) {
        inp.interactPressed = false;
        if (player.lungeTimer <= 0 && player.stamina >= 15) {
          player.lungeTimer = 0.3;
          player.stamina = Math.max(0, player.stamina - 15);
          const lungeSpeed = faction === 'POLICE' ? 540 : 480;
          player.vx = Math.cos(player.moveAngle) * lungeSpeed;
          player.vy = Math.sin(player.moveAngle) * lungeSpeed;
          if (faction === 'PROTESTER' && player.z <= 2) {
            player.vz = 320;
          }
          player.squashX = 1.26;
          player.squashY = 0.82;
          soundEngine.playJump();
          spawnBurst(
            player.x,
            player.y,
            5,
            10,
            faction === 'POLICE' ? '#38BDF8' : '#FF9933',
            'DUST'
          );
        }
      }

      const isSprinting = inp.sprint && inputLen > 0 && !inp.crouchHide && player.stamina > 4;
      if (isSprinting) {
        const drainRate = outfit.id === 'protester_saffron' ? 15 : 19;
        player.stamina = Math.max(0, player.stamina - drainRate * dt);
      } else {
        const regenRate = inputLen === 0 ? 28 : 15;
        player.stamina = Math.min(player.maxStamina, player.stamina + regenRate * dt);
      }

      const baseSpeed = faction === 'POLICE' ? 265 : 275;
      const mult = isSprinting ? 1.46 : inp.crouchHide ? 0.48 : 1.0;
      const skillBoost = player.abilityActiveTimer > 0 ? 1.15 : 1.0;
      const targetVx = normX * baseSpeed * mult * skillBoost;
      const targetVy = normY * baseSpeed * mult * skillBoost;

      if (player.lungeTimer <= 0) {
        player.vx += (targetVx - player.vx) * 12 * dt;
        player.vy += (targetVy - player.vy) * 12 * dt;
      }

      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Z-Axis Gravity & Landing
      const prevZ = player.z;
      player.vz -= 1250 * dt;
      player.z += player.vz * dt;
      if (player.z <= 0) {
        if (prevZ > 8) {
          player.squashX = 1.18;
          player.squashY = 0.84;
          soundEngine.playLand(false);
          spawnBurst(player.x, player.y, 0, 6, '#94A3B8', 'DUST');
        }
        player.z = 0;
        player.vz = 0;
      }

      // Resolve 2.5D Building Collisions
      resolveBuildingCollision(player, 18);

      // Check Street Barricade Collisions (Vault over if player.z >= 18)
      for (const bar of WORLD_BARRICADES) {
        if (
          player.x >= bar.x - 12 &&
          player.x <= bar.x + bar.width + 12 &&
          player.y >= bar.y - 12 &&
          player.y <= bar.y + bar.depth + 12
        ) {
          if (player.z < 18 && player.invulnerableTimer <= 0) {
            player.invulnerableTimer = 0.75;
            player.vx *= -0.4;
            player.vy *= -0.4;
            soundEngine.playObstacleHit();
            spawnBurst(player.x, player.y, 15, 8, '#F59E0B', 'SPARK');
          }
        }
      }

      // Update Stance & Footsteps
      const speed2D = Math.hypot(player.vx, player.vy);
      if (player.lungeTimer > 0) {
        player.stance = faction === 'POLICE' ? 'LUNGE' : 'VAULT';
      } else if (player.z > 4) {
        player.stance = 'JUMP';
      } else if (inp.crouchHide) {
        player.stance = 'CROUCH';
      } else if (speed2D > 25) {
        player.stance = isSprinting ? 'SPRINT' : 'RUN';
        player.animFrame += dt * (isSprinting ? 15 : 10);
        footstepAccum += dt * (isSprinting ? 4.0 : 2.5);
        if (footstepAccum >= 1) {
          footstepAccum = 0;
          soundEngine.playFootstep(isSprinting, false);
        }
      } else {
        player.stance = 'IDLE';
      }

      // 2. TERRITORY ZONES UPDATE
      let activeZone: TerritoryZone | null = null;
      for (const z of zones) {
        const distPlayer = Math.hypot(player.x - z.x, player.y - z.y);
        if (distPlayer <= z.radius) {
          activeZone = z;
          if (faction === 'PROTESTER') {
            const rallyRate = outfit.id === 'protester_student' ? 24 : 18;
            const prevOwner = z.owner;
            z.progress = Math.min(100, z.progress + rallyRate * dt);
            if (z.progress >= 100 && prevOwner !== 'PROTESTER') {
              z.owner = 'PROTESTER';
              score += 500;
              heatValue = Math.min(5, heatValue + 0.75);
              peakHeat = Math.max(peakHeat, heatValue);
              soundEngine.playVictoryFanfare();
              spawnBurst(z.x, z.y, 15, 18, '#FF9933', 'RING');
            }
          } else {
            z.progress = Math.max(0, z.progress - 22 * dt);
            if (z.progress <= 10) z.owner = 'POLICE';
          }
        }

        if (faction === 'POLICE') {
          const aiInZone = npcs.some(
            (n) =>
              n.faction === 'PROTESTER' &&
              !n.captured &&
              Math.hypot(n.x - z.x, n.y - z.y) <= z.radius
          );
          if (aiInZone && distPlayer > z.radius) {
            z.progress = Math.min(100, z.progress + 3.8 * dt);
            if (z.progress >= 100) z.owner = 'PROTESTER';
          }
        }
      }

      // Check Metro Gate Extraction
      let canExtractNow = false;
      if (faction === 'PROTESTER' && gatesUnlocked) {
        for (const gate of METRO_GATES) {
          if (Math.hypot(player.x - gate.x, player.y - gate.y) <= gate.radius) {
            canExtractNow = true;
            score += 1800;
            finishGame(
              true,
              `You rallied ${ralliedZonesCount} New Delhi districts and extracted safely at ${gate.name}!`,
              ralliedZonesCount
            );
            return;
          }
        }
      }

      // 3. AI OPEN-WORLD SIMULATION
      let anyOfficerChasing = false;
      let canCaptureNow = false;

      for (const npc of npcs) {
        if (npc.captured) continue;

        npc.squashX += (1 - npc.squashX) * 10 * dt;
        npc.squashY += (1 - npc.squashY) * 10 * dt;

        const inDecoy = decoys.some(
          (d) => Math.hypot(npc.x - d.x, npc.y - d.y) < d.radius
        );

        if (npc.faction === 'PROTESTER') {
          const distToPlayer = Math.hypot(player.x - npc.x, player.y - npc.y);

          if (faction === 'POLICE' && distToPlayer < 280) {
            npc.alertState = 'CHASE';
            const fleeAngle = Math.atan2(npc.y - player.y, npc.x - player.x);
            npc.moveAngle = fleeAngle;
            npc.vx += (Math.cos(fleeAngle) * 245 - npc.vx) * 6 * dt;
            npc.vy += (Math.sin(fleeAngle) * 245 - npc.vy) * 6 * dt;
          } else {
            const targetZ = zones.find((z) => z.id === npc.targetZoneId) || zones[0];
            const distZ = Math.hypot(targetZ.x - npc.x, targetZ.y - npc.y);
            if (distZ > 90) {
              const ang = Math.atan2(targetZ.y - npc.y, targetZ.x - npc.x);
              npc.moveAngle = ang;
              npc.vx = Math.cos(ang) * 155;
              npc.vy = Math.sin(ang) * 155;
            } else {
              npc.moveAngle += dt * 1.2;
              npc.vx = Math.cos(npc.moveAngle) * 90;
              npc.vy = Math.sin(npc.moveAngle) * 90;
            }
          }

          npc.facing = npc.vx >= 0 ? 1 : -1;
          npc.x += npc.vx * dt;
          npc.y += npc.vy * dt;
          resolveBuildingCollision(npc, 16);
          npc.animFrame += dt * 11;

          if (faction === 'POLICE') {
            const reach = outfit.id === 'police_khaki' ? 105 : 90;
            if (distToPlayer <= reach + 25) {
              canCaptureNow = true;
            }
            if (distToPlayer <= (player.lungeTimer > 0 ? reach : 42)) {
              npc.captured = true;
              capturesOrEvades++;
              score += 650;
              shakeIntensity = settingsRef.current.screenShake ? 12 : 0;
              hitstopTimer = 0.05;
              soundEngine.playWhistle();
              spawnBurst(npc.x, npc.y, 15, 18, '#38BDF8', 'SPARK');

              if (capturesOrEvades >= capturesTargetTotal) {
                finishGame(
                  true,
                  `You apprehended ${capturesOrEvades} Protester Leaders and secured the New Delhi open world!`,
                  ralliedZonesCount
                );
                return;
              }
            }
          }
        } else {
          if (faction === 'PROTESTER') {
            const dx = player.x - npc.x;
            const dy = player.y - npc.y;
            const dist = Math.hypot(dx, dy);
            const angleToPlayer = Math.atan2(dy, dx);
            const angleDiff = Math.abs(
              Math.atan2(
                Math.sin(angleToPlayer - npc.moveAngle),
                Math.cos(angleToPlayer - npc.moveAngle)
              )
            );

            const sightRange = 220 + heatValue * 32;
            const spotted =
              !player.isHidden &&
              !inDecoy &&
              ((dist < sightRange && angleDiff < 0.65) || dist < 120);

            if (spotted) {
              npc.alertState = 'CHASE';
              anyOfficerChasing = true;
              heatValue = Math.min(5, heatValue + 0.14 * dt);
              peakHeat = Math.max(peakHeat, heatValue);
              npc.moveAngle = angleToPlayer;
              const chaseSpeed = (215 + heatValue * 11) * (inDecoy ? 0.5 : 1);
              npc.vx += (Math.cos(angleToPlayer) * chaseSpeed - npc.vx) * 6 * dt;
              npc.vy += (Math.sin(angleToPlayer) * chaseSpeed - npc.vy) * 6 * dt;
            } else {
              if (npc.alertState === 'CHASE' && player.isHidden) {
                npc.alertState = 'SUSPICIOUS';
              }
              const wpX = npc.waypointX ?? 1600;
              const wpY = npc.waypointY ?? 1600;
              const distWp = Math.hypot(wpX - npc.x, wpY - npc.y);
              if (distWp < 60) {
                const randomZone = zones[Math.floor(Math.random() * zones.length)];
                npc.waypointX = randomZone.x + (Math.random() - 0.5) * 260;
                npc.waypointY = randomZone.y + (Math.random() - 0.5) * 260;
              } else {
                const ang = Math.atan2(wpY - npc.y, wpX - npc.x);
                npc.moveAngle = ang;
                npc.vx = Math.cos(ang) * 135;
                npc.vy = Math.sin(ang) * 135;
              }
            }

            if (!player.isHidden && dist < 36 && player.z < 18 && player.invulnerableTimer <= 0) {
              player.health -= 28;
              player.invulnerableTimer = 1.1;
              player.vx = Math.cos(angleToPlayer) * 320;
              player.vy = Math.sin(angleToPlayer) * 320;
              shakeIntensity = settingsRef.current.screenShake ? 13 : 0;
              hitstopTimer = 0.05;
              soundEngine.playObstacleHit();
              spawnBurst(player.x, player.y, 15, 14, '#EF4444', 'SPARK');

              if (player.health <= 0) {
                player.health = 0;
                finishGame(
                  false,
                  `Apprehended by ${npc.name} under ${Math.round(heatValue)}-Star Police Heat!`,
                  ralliedZonesCount
                );
                return;
              }
            }
          } else {
            const targetRunner = npcs.find((n) => n.faction === 'PROTESTER' && !n.captured);
            if (targetRunner && Math.hypot(targetRunner.x - npc.x, targetRunner.y - npc.y) < 420) {
              const ang = Math.atan2(targetRunner.y - npc.y, targetRunner.x - npc.x);
              npc.moveAngle = ang;
              npc.vx = Math.cos(ang) * 210;
              npc.vy = Math.sin(ang) * 210;
            } else {
              npc.moveAngle += dt * 0.6;
              npc.vx = Math.cos(npc.moveAngle) * 120;
              npc.vy = Math.sin(npc.moveAngle) * 120;
            }
          }

          npc.facing = npc.vx >= 0 ? 1 : -1;
          npc.x += npc.vx * dt;
          npc.y += npc.vy * dt;
          resolveBuildingCollision(npc, 16);
          npc.animFrame += dt * 11;
        }
      }

      soundEngine.setChaseIntensity(anyOfficerChasing);

      // Update Decoys & Particles
      for (let i = decoys.length - 1; i >= 0; i--) {
        decoys[i].timer -= dt;
        if (decoys[i].timer <= 0) decoys.splice(i, 1);
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z = Math.max(0, (p.z || 0) + (p.vz || 0) * dt);
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }

      // 4. DYNAMIC CAMERA ZOOM & 2.5D TILT SYSTEM
      // Dynamically widens zoom when sprinting, vaulting, or in an active high-Heat chase
      const camCtrl = cameraControlRef.current;
      const speedRatio = Math.min(1, speed2D / 380);
      const sprintZoomOut = isSprinting ? -0.065 : 0;
      const chaseZoomOut = anyOfficerChasing ? -0.045 : 0;
      const vaultZoomOut = player.z > 5 ? -0.035 : 0;
      const stealthZoomIn = player.isHidden ? 0.04 : 0;

      const targetZoom = Math.max(
        0.45,
        Math.min(
          0.92,
          camCtrl.baseZoom + sprintZoomOut + chaseZoomOut + vaultZoomOut + stealthZoomIn - speedRatio * 0.025
        )
      );
      camCtrl.currentZoom += (targetZoom - camCtrl.currentZoom) * 4.5 * dt;

      // Dynamically adjusts 2.5D vertical tilt angle (tilts deeper into horizon during fast sprinting/vaulting)
      const targetTilt = Math.max(
        0.7,
        Math.min(0.95, camCtrl.baseTilt - (isSprinting ? 0.04 : 0) - (player.z > 5 ? 0.03 : 0))
      );
      camCtrl.currentTilt += (targetTilt - camCtrl.currentTilt) * 5.0 * dt;

      const scaleX = camCtrl.currentZoom;
      const scaleY = camCtrl.currentZoom * camCtrl.currentTilt;

      const effectiveViewW = canvas.width / scaleX;
      const effectiveViewH = canvas.height / scaleY;

      // Forward velocity look-ahead so player sees upcoming streets & barricades clearly
      const targetCamX = Math.max(
        0,
        Math.min(WORLD_SIZE - effectiveViewW, player.x - effectiveViewW / 2 + player.vx * 0.28)
      );
      const targetCamY = Math.max(
        0,
        Math.min(WORLD_SIZE - effectiveViewH, player.y - effectiveViewH / 2 + player.vy * 0.28)
      );
      camX += (targetCamX - camX) * 7.5 * dt;
      camY += (targetCamY - camY) * 7.5 * dt;

      let shakeX = 0;
      let shakeY = 0;
      if (shakeIntensity > 0.2) {
        shakeX = (Math.random() - 0.5) * shakeIntensity * 1.5;
        shakeY = (Math.random() - 0.5) * shakeIntensity * 1.5;
        shakeIntensity *= Math.pow(0.04, dt);
      }

      // 5. RENDER 2.5D OPEN WORLD WITH DYNAMIC ZOOM, TILT & Y-SORTED PAINTER'S ALGORITHM
      ctx.save();
      ctx.scale(scaleX, scaleY);
      ctx.translate(shakeX, shakeY);

      drawOpenWorldGround(
        ctx,
        effectiveViewW,
        effectiveViewH,
        camX,
        camY,
        level,
        zones,
        gatesUnlocked,
        timeElapsed
      );

      // Draw Tactical Compass Ring & Off-Screen Waypoint Chevrons on Ground Plane around Player
      drawTacticalCompassAndWaypoints(
        ctx,
        player,
        npcs,
        zones,
        gatesUnlocked,
        camX,
        camY,
        camCtrl.currentTilt,
        timeElapsed
      );

      // Build Y-sorted render queue for all 2.5D objects in viewport
      // Counter-scale vertical extrusion height slightly when tilted so 2.5D buildings & characters stand tall
      const verticalCompensation = 1 / Math.max(0.75, camCtrl.currentTilt * 0.96);

      type RenderItem = { sortY: number; draw: () => void };
      const renderQueue: RenderItem[] = [];

      // Structures
      for (const s of STRUCTURES_25D) {
        if (
          s.x + s.width > camX - 140 &&
          s.x < camX + effectiveViewW + 140 &&
          s.y + s.depth > camY - 180 &&
          s.y - s.height25D < camY + effectiveViewH + 180
        ) {
          renderQueue.push({
            sortY: s.y + s.depth,
            draw: () =>
              drawStructure25D(
                ctx,
                { ...s, height25D: s.height25D * verticalCompensation },
                camX,
                camY,
                level.timeOfDay
              ),
          });
        }
      }

      // Barricades
      for (const b of WORLD_BARRICADES) {
        if (
          b.x + b.width > camX - 100 &&
          b.x < camX + effectiveViewW + 100 &&
          b.y + b.depth > camY - 100 &&
          b.y < camY + effectiveViewH + 100
        ) {
          renderQueue.push({
            sortY: b.y + b.depth,
            draw: () =>
              drawWorldBarricade25D(
                ctx,
                { ...b, height25D: b.height25D * verticalCompensation },
                camX,
                camY,
                timeElapsed
              ),
          });
        }
      }

      // Cover Spots
      for (const cov of WORLD_COVER_SPOTS) {
        if (
          cov.x + cov.width > camX - 100 &&
          cov.x < camX + effectiveViewW + 100 &&
          cov.y + cov.depth > camY - 100 &&
          cov.y < camY + effectiveViewH + 100
        ) {
          const inside = player.inCoverId === cov.id;
          renderQueue.push({
            sortY: cov.y + cov.depth,
            draw: () =>
              drawWorldCover25D(
                ctx,
                { ...cov, height25D: cov.height25D * verticalCompensation },
                camX,
                camY,
                inside,
                inside && player.isHidden
              ),
          });
        }
      }

      // NPCs
      for (const npc of npcs) {
        if (npc.captured) continue;
        if (
          npc.x > camX - 100 &&
          npc.x < camX + effectiveViewW + 100 &&
          npc.y > camY - 100 &&
          npc.y < camY + effectiveViewH + 100
        ) {
          renderQueue.push({
            sortY: npc.y,
            draw: () =>
              drawArticulatedCharacter(
                ctx,
                npc,
                npc.x - camX,
                npc.y - camY,
                timeElapsed,
                0.92 * verticalCompensation
              ),
          });
        }
      }

      // Player
      renderQueue.push({
        sortY: player.y,
        draw: () =>
          drawArticulatedCharacter(
            ctx,
            player,
            player.x - camX,
            player.y - camY,
            timeElapsed,
            0.96 * verticalCompensation
          ),
      });

      // Sort back-to-front by world Y coordinate
      renderQueue.sort((a, b) => a.sortY - b.sortY);
      for (const item of renderQueue) {
        item.draw();
      }

      // Particles & Smoke Decoys
      drawParticlesAndDecoys(ctx, particles, decoys, camX, camY);

      // Sweeping Searchlights at Night
      if (level.hasSearchlights) {
        for (let i = 0; i < 4; i++) {
          const lx = 800 + (i % 2) * 1600 + Math.sin(timeElapsed * 0.7 + i) * 420 - camX;
          const ly = 800 + Math.floor(i / 2) * 1400 + Math.cos(timeElapsed * 0.6 + i) * 420 - camY;
          const grad = ctx.createRadialGradient(lx, ly, 10, lx, ly, 180);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
          grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(lx, ly, 180, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // World-space contextual prompt above player
      const pScreenX = player.x - camX;
      const pScreenY = player.y - camY - player.z - 78;
      ctx.textAlign = 'center';
      ctx.font = '800 12px "Barlow Condensed", sans-serif';
      if (canCaptureNow && faction === 'POLICE') {
        ctx.fillStyle = '#EF4444';
        ctx.fillText('[E] CAPTURE LEADER!', pScreenX, pScreenY);
      } else if (activeZone) {
        ctx.fillStyle = '#FF9933';
        ctx.fillText(
          faction === 'PROTESTER'
            ? `RALLYING ${activeZone.name.toUpperCase()} (${Math.round(activeZone.progress)}%)`
            : `SECURING ${activeZone.name.toUpperCase()}`,
          pScreenX,
          pScreenY
        );
      }

      ctx.restore();

      // 6. UPDATE RADAR MINIMAP & HUD SNAPSHOT
      if (minimapRef.current) {
        const mCtx = minimapRef.current.getContext('2d');
        if (mCtx) {
          drawTacticalMinimap(
            mCtx,
            minimapRef.current.width,
            player,
            npcs,
            zones,
            gatesUnlocked
          );
        }
      }

      hudSyncAccum += dt;
      if (hudSyncAccum >= 0.12) {
        hudSyncAccum = 0;
        const currentDistrict =
          DISTRICTS.find(
            (d) =>
              player.x >= d.x &&
              player.x <= d.x + d.width &&
              player.y >= d.y &&
              player.y <= d.y + d.height
          )?.name || 'CENTRAL NEW DELHI BOULEVARD';

        // Convert tiltFactor (0.70..0.95) to readable camera pitch degrees
        const tiltDeg = Math.round(Math.acos(Math.min(1, camCtrl.currentTilt)) * (180 / Math.PI));

        setHud({
          health: Math.round(player.health),
          maxHealth: player.maxHealth,
          stamina: Math.round(player.stamina),
          maxStamina: player.maxStamina,
          score: Math.round(score),
          timeRemaining: Math.ceil(timeRemaining),
          districtName: currentDistrict,
          heatStars: Math.min(5, Math.max(1, Math.round(heatValue))),
          zonesRalliedCount: ralliedZonesCount,
          zonesRequired: level.targetZonesRequired,
          capturesCount: capturesOrEvades,
          capturesRequired: capturesTargetTotal,
          gatesUnlocked,
          activeZoneName: activeZone ? activeZone.name : null,
          activeZoneProgress: activeZone ? Math.round(activeZone.progress) : null,
          isHidden: player.isHidden,
          inCoverLabel: activeCover ? activeCover.label : null,
          alertState: anyOfficerChasing ? 'CHASE' : 'PATROL',
          abilityCooldown: Math.ceil(player.abilityCooldown * 10) / 10,
          maxAbilityCooldown: player.maxAbilityCooldown,
          canCaptureNow,
          canExtractNow,
          currentZoomPct: Math.round(camCtrl.currentZoom * 100),
          currentTiltDeg: tiltDeg,
          hintMessage:
            timeElapsed < 10
              ? faction === 'POLICE'
                ? '[WASD] Move · [Space] Vault · [E] Capture · [Q] Whistle · [Scroll/Z] Zoom · [T] Tilt'
                : '[WASD] Move · [Space] Vault · [C] Hide in Tent · [Q] Smoke · [Scroll/Z] Zoom · [T] Tilt'
              : null,
        });
      }
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', updateSize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      soundEngine.stopGameplayAudio();
    };
  }, [faction, outfit, level, capturesTargetTotal, onPauseToggle, onGameEnd]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B132B] select-none">
      {/* Isolated 60fps 2.5D Open-World Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Ultra-Compact Low-Occlusion Perimeter HUD Overlay */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2.5 md:p-3.5">
        {/* TOP ROW: Compact Vitals & Skill (Left), Slim District/Heat Strip (Center), Mini Radar & Camera Controls (Right) */}
        <div className="flex items-start justify-between gap-2">
          {/* Top-Left: Compact Vitals & Skill Pill */}
          <div className="flex flex-col gap-1.5 bg-[#0B132B]/80 border border-slate-700/70 rounded-md px-2.5 py-2 w-[176px] shadow">
            <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-300">
              <span>{faction}</span>
              <span
                className={
                  hud.isHidden
                    ? 'text-emerald-400'
                    : hud.alertState === 'CHASE'
                    ? 'text-red-400'
                    : 'text-sky-400'
                }
              >
                {hud.isHidden ? 'HIDDEN' : hud.alertState}
              </span>
            </div>

            {/* Compact HP & Stamina Bars */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-6 text-slate-400 font-semibold">HP</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-transform duration-150 origin-left"
                  style={{ transform: `scaleX(${hud.health / hud.maxHealth})` }}
                />
              </div>
              <span className="w-7 text-right font-mono-tabular text-white">{hud.health}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="w-6 text-slate-400 font-semibold">STM</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded overflow-hidden">
                <div
                  className="h-full bg-[#FF9933] transition-transform duration-100 origin-left"
                  style={{ transform: `scaleX(${hud.stamina / hud.maxStamina})` }}
                />
              </div>
              <span className="w-7 text-right font-mono-tabular text-amber-400">{hud.stamina}</span>
            </div>

            {/* Compact Skill Readout */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
              <span className="text-slate-300">
                {faction === 'POLICE' ? '[Q] WHISTLE' : '[Q] SMOKE'}
              </span>
              <span
                className={`font-mono-tabular font-bold ${
                  hud.abilityCooldown <= 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {hud.abilityCooldown <= 0 ? 'READY' : `${hud.abilityCooldown.toFixed(1)}s`}
              </span>
            </div>
          </div>

          {/* Top-Center: Slim Single-Row District, Heat & Objective Strip */}
          <div className="hidden sm:flex items-center gap-3 bg-[#0B132B]/80 border border-slate-700/70 rounded-md px-3 py-1.5 shadow text-xs">
            <span className="font-display font-bold text-sm text-white tracking-wide whitespace-nowrap">
              {hud.districtName}
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>

            {/* Heat Stars */}
            <div className="flex items-center gap-0.5" title="Police Heat Level">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-xs ${
                    star <= hud.heatStars ? 'text-red-500' : 'text-slate-700'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-slate-600" aria-hidden="true">·</span>

            {/* Objective Counter */}
            {faction === 'PROTESTER' ? (
              <span className="font-mono-tabular text-[11px] text-slate-200 whitespace-nowrap">
                ZONES: <strong className="text-[#FF9933]">{hud.zonesRalliedCount}/{hud.zonesRequired}</strong>
                {hud.gatesUnlocked && <strong className="text-emerald-400 ml-1.5">EXIT OPEN</strong>}
              </span>
            ) : (
              <span className="font-mono-tabular text-[11px] text-slate-200 whitespace-nowrap">
                CAPTURED: <strong className="text-sky-400">{hud.capturesCount}/{hud.capturesRequired}</strong>
              </span>
            )}
            <span className="text-slate-600" aria-hidden="true">·</span>

            <span className="font-mono-tabular text-[11px] text-white whitespace-nowrap">
              {hud.timeRemaining}s
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>

            <span className="font-mono-tabular text-[11px] text-[#FF9933] font-bold whitespace-nowrap">
              {hud.score.toLocaleString()} PTS
            </span>
          </div>

          {/* Top-Right: Camera Zoom/Tilt Controls, Compact Radar Minimap & Pause */}
          <div className="flex items-start gap-2">
            {/* Dynamic Camera Zoom & 2.5D Tilt Control Pill */}
            <div className="pointer-events-auto hidden md:flex flex-col gap-1 bg-[#0B132B]/80 border border-slate-700/70 rounded-md px-2 py-1.5 text-[10px] font-mono-tabular text-slate-300 shadow">
              <button
                type="button"
                onClick={cycleZoomPreset}
                className="flex items-center justify-between gap-2 hover:text-[#FF9933] transition-colors cursor-pointer"
                title="Cycle Camera Zoom Preset [Z] or use Mouse Wheel"
              >
                <span>ZOOM [Z]</span>
                <span className="font-bold text-white">{hud.currentZoomPct}%</span>
              </button>
              <button
                type="button"
                onClick={cycleTiltPreset}
                className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 hover:text-sky-400 transition-colors cursor-pointer"
                title="Cycle 2.5D Camera Tilt Angle [T]"
              >
                <span>TILT [T]</span>
                <span className="font-bold text-sky-400">{hud.currentTiltDeg}°</span>
              </button>
            </div>

            <div
              onClick={() => {
                soundEngine.playUiClick();
                setExpandedMap((prev) => !prev);
              }}
              className="pointer-events-auto relative rounded-md overflow-hidden border border-slate-600 bg-[#070C18]/90 shadow-md cursor-pointer"
              title="Click or press [M] to toggle Radar size"
            >
              <canvas
                ref={minimapRef}
                width={expandedMap ? 200 : 92}
                height={expandedMap ? 200 : 92}
                className="block"
              />
              <div className="bg-[#0B132B]/90 px-1.5 py-0.5 text-[9px] font-mono-tabular text-slate-300 flex items-center justify-between border-t border-slate-800">
                <span>MAP</span>
                <span className="text-[#FF9933]">[M]</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onPauseToggle();
              }}
              className="pointer-events-auto px-2.5 py-1.5 rounded-md bg-[#0B132B]/85 hover:bg-slate-800 border border-slate-600 text-[11px] font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0 shadow"
            >
              PAUSE
            </button>
          </div>
        </div>

        {/* BOTTOM HINTS & COMPACT TOUCH/SKILL CONTROLS */}
        <div className="flex flex-col gap-1.5">
          {hud.hintMessage && (
            <div className="self-center bg-[#0B132B]/80 border border-slate-700 text-slate-200 px-3 py-1 rounded text-[11px] font-medium tracking-wide">
              {hud.hintMessage}
            </div>
          )}

          {/* Compact Touch & Skill Controls */}
          <div
            className={`pointer-events-auto flex items-end justify-between w-full ${
              settings.showTouchControls ? 'flex' : 'flex lg:hidden'
            }`}
          >
            {/* Compact Left 8-Way D-Pad */}
            <div className="grid grid-cols-3 gap-1 w-26 h-26">
              <div />
              <button
                type="button"
                onTouchStart={() => (inputRef.current.up = true)}
                onTouchEnd={() => (inputRef.current.up = false)}
                onMouseDown={() => (inputRef.current.up = true)}
                onMouseUp={() => (inputRef.current.up = false)}
                className="rounded bg-slate-900/75 active:bg-[#FF9933] border border-slate-600 flex items-center justify-center text-xs text-white font-bold"
              >
                ▲
              </button>
              <div />
              <button
                type="button"
                onTouchStart={() => (inputRef.current.left = true)}
                onTouchEnd={() => (inputRef.current.left = false)}
                onMouseDown={() => (inputRef.current.left = true)}
                onMouseUp={() => (inputRef.current.left = false)}
                className="rounded bg-slate-900/75 active:bg-[#FF9933] border border-slate-600 flex items-center justify-center text-xs text-white font-bold"
              >
                ◀
              </button>
              <button
                type="button"
                onTouchStart={() => (inputRef.current.crouchHide = true)}
                onTouchEnd={() => (inputRef.current.crouchHide = false)}
                onMouseDown={() => (inputRef.current.crouchHide = true)}
                onMouseUp={() => (inputRef.current.crouchHide = false)}
                className="rounded bg-slate-950/80 active:bg-emerald-500 border border-slate-700 flex items-center justify-center text-[8px] font-bold text-emerald-300"
              >
                HIDE
              </button>
              <button
                type="button"
                onTouchStart={() => (inputRef.current.right = true)}
                onTouchEnd={() => (inputRef.current.right = false)}
                onMouseDown={() => (inputRef.current.right = true)}
                onMouseUp={() => (inputRef.current.right = false)}
                className="rounded bg-slate-900/75 active:bg-[#FF9933] border border-slate-600 flex items-center justify-center text-xs text-white font-bold"
              >
                ▶
              </button>
              <div />
              <button
                type="button"
                onTouchStart={() => (inputRef.current.down = true)}
                onTouchEnd={() => (inputRef.current.down = false)}
                onMouseDown={() => (inputRef.current.down = true)}
                onMouseUp={() => (inputRef.current.down = false)}
                className="rounded bg-slate-900/75 active:bg-[#FF9933] border border-slate-600 flex items-center justify-center text-xs text-white font-bold"
              >
                ▼
              </button>
              <div />
            </div>

            {/* Compact Right Skill & Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cycleZoomPreset}
                className="px-2 h-10 rounded-lg bg-slate-900/75 border border-slate-600 flex flex-col items-center justify-center text-[9px] font-bold text-slate-200"
              >
                <span>ZOOM</span>
                <span className="text-[8px] text-[#FF9933]">{hud.currentZoomPct}%</span>
              </button>
              <button
                type="button"
                onClick={() => (inputRef.current.abilityPressed = true)}
                className="px-2.5 h-10 rounded-lg bg-slate-900/75 active:bg-sky-500 border border-sky-500/60 flex flex-col items-center justify-center text-[10px] font-bold text-sky-300"
              >
                <span>SKILL</span>
                <span className="text-[8px]">[Q]</span>
              </button>
              <button
                type="button"
                onClick={() => (inputRef.current.interactPressed = true)}
                className="px-2.5 h-10 rounded-lg bg-slate-900/75 active:bg-red-500 border border-red-500/60 flex flex-col items-center justify-center text-[10px] font-bold text-red-300"
              >
                <span>{faction === 'POLICE' ? 'CATCH' : 'DASH'}</span>
                <span className="text-[8px]">[E]</span>
              </button>
              <button
                type="button"
                onTouchStart={() => (inputRef.current.sprint = true)}
                onTouchEnd={() => (inputRef.current.sprint = false)}
                onMouseDown={() => (inputRef.current.sprint = true)}
                onMouseUp={() => (inputRef.current.sprint = false)}
                className="px-2.5 h-10 rounded-lg bg-slate-900/75 active:bg-amber-500 border border-amber-500/60 flex flex-col items-center justify-center text-[10px] font-bold text-amber-300"
              >
                <span>RUN</span>
                <span className="text-[8px]">[SHF]</span>
              </button>
              <button
                type="button"
                onClick={() => (inputRef.current.jumpPressed = true)}
                className="px-3 h-10 rounded-lg bg-[#FF9933] active:bg-amber-400 text-[#0B132B] font-extrabold text-[10px] flex flex-col items-center justify-center shadow"
              >
                <span>VAULT</span>
                <span className="text-[8px]">[SPC]</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

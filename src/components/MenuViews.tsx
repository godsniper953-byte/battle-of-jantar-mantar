import React, { useEffect, useRef, useState } from 'react';
import {
  ActiveCharacter,
  AudioSettings,
  FactionId,
  GameResult,
  HighScoreRecord,
  LevelConfig,
  LevelId,
  OutfitConfig,
} from '../types/game';
import {
  FACTION_INFO,
  GAMEPLAY_TIPS,
  INITIAL_TERRITORY_ZONES,
  LEVELS,
  OUTFITS,
  STRUCTURES_25D,
  WORLD_BARRICADES,
  WORLD_COVER_SPOTS,
} from '../data/gameData';
import {
  drawArticulatedCharacter,
  drawOpenWorldGround,
  drawStructure25D,
  drawWorldBarricade25D,
  drawWorldCover25D,
} from '../canvas/spriteRenderer';
import { soundEngine } from '../audio/soundEngine';

/**
 * Live 2.5D Open-World Camera Flyover for the Main Menu Background
 */
export const LiveTitleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    const level = LEVELS.street_pursuit;
    const protesterOutfit = OUTFITS.find((o) => o.id === 'protester_saffron')!;
    const policeOutfit = OUTFITS.find((o) => o.id === 'police_khaki')!;

    const runner: ActiveCharacter = {
      id: 'bg_runner',
      name: 'Runner',
      faction: 'PROTESTER',
      isPlayer: false,
      outfit: protesterOutfit,
      x: 1600,
      y: 1600,
      z: 0,
      vx: 160,
      vy: 0,
      vz: 0,
      moveAngle: 0,
      facing: 1,
      stance: 'SPRINT',
      animFrame: 0,
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
      alertState: 'CHASE',
    };

    const officer: ActiveCharacter = {
      ...runner,
      id: 'bg_officer',
      name: 'Officer',
      faction: 'POLICE',
      outfit: policeOutfit,
      animFrame: 1.8,
    };

    let timeSec = 0;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      timeSec += dt;

      // Smoothly pan camera around Jantar Mantar & Connaught Place
      const centerX = 1600 + Math.sin(timeSec * 0.22) * 380;
      const centerY = 1480 + Math.cos(timeSec * 0.18) * 320;
      const camX = centerX - canvas.width / 2;
      const camY = centerY - canvas.height / 2;

      drawOpenWorldGround(
        ctx,
        canvas.width,
        canvas.height,
        camX,
        camY,
        level,
        INITIAL_TERRITORY_ZONES,
        true,
        timeSec
      );

      for (const s of STRUCTURES_25D) {
        drawStructure25D(ctx, s, camX, camY, 'SUNSET');
      }
      for (const b of WORLD_BARRICADES) {
        drawWorldBarricade25D(ctx, b, camX, camY, timeSec);
      }
      for (const cov of WORLD_COVER_SPOTS) {
        drawWorldCover25D(ctx, cov, camX, camY, false, false);
      }

      // Orbiting chase around Central Sundial Plaza
      const orbitAngle = timeSec * 0.9;
      runner.x = 1600 + Math.cos(orbitAngle) * 185;
      runner.y = 1600 + Math.sin(orbitAngle) * 185;
      runner.moveAngle = orbitAngle + Math.PI / 2;
      runner.facing = Math.cos(runner.moveAngle) >= 0 ? 1 : -1;
      runner.animFrame += dt * 13;

      const offAngle = orbitAngle - 0.55;
      officer.x = 1600 + Math.cos(offAngle) * 185;
      officer.y = 1600 + Math.sin(offAngle) * 185;
      officer.moveAngle = offAngle + Math.PI / 2;
      officer.facing = Math.cos(officer.moveAngle) >= 0 ? 1 : -1;
      officer.animFrame += dt * 13;

      drawArticulatedCharacter(ctx, officer, officer.x - camX, officer.y - camY, timeSec, 1.1);
      drawArticulatedCharacter(ctx, runner, runner.x - camX, runner.y - camY, timeSec, 1.1);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />;
};

/**
 * Live 2D Character Preview Canvas for Choose Your Side Cards
 */
export const CharacterPreviewCanvas: React.FC<{
  outfit: OutfitConfig;
  stanceMode: 'RUN' | 'JUMP' | 'CROUCH';
}> = ({ outfit, stanceMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let timeSec = 0;
    let last = performance.now();
    let raf = 0;

    const previewChar: ActiveCharacter = {
      id: 'preview',
      name: outfit.name,
      faction: outfit.faction,
      isPlayer: true,
      outfit,
      x: 0,
      y: 0,
      z: 0,
      vx: 150,
      vy: 0,
      vz: 0,
      moveAngle: 0,
      facing: 1,
      stance: stanceMode === 'RUN' ? 'SPRINT' : stanceMode,
      animFrame: 0,
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
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      timeSec += dt;
      previewChar.outfit = outfit;
      previewChar.stance = stanceMode === 'RUN' ? 'SPRINT' : stanceMode;
      previewChar.z = stanceMode === 'JUMP' ? Math.abs(Math.sin(timeSec * 3.5)) * 22 : 0;
      previewChar.animFrame += dt * 11;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      if (outfit.faction === 'POLICE') {
        bgGrad.addColorStop(0, '#0F172A');
        bgGrad.addColorStop(1, '#1E3A8A');
      } else {
        bgGrad.addColorStop(0, '#1C1917');
        bgGrad.addColorStop(1, '#7C2D12');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // 2.5D Territory Ring Motif on Floor
      ctx.strokeStyle = outfit.accentColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h - 28, 78, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      drawArticulatedCharacter(ctx, previewChar, w * 0.5, h - 26, timeSec, 1.35);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [outfit, stanceMode]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={175}
      className="w-full h-44 rounded-lg border border-slate-700/80 block"
    />
  );
};

/**
 * Live 2.5D Open-World Miniature Preview Canvas for Game Modes Screen
 */
const LevelPreviewCanvas: React.FC<{ level: LevelConfig }> = ({ level }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const camX = 1120;
    const camY = 1280;
    drawOpenWorldGround(
      ctx,
      canvas.width,
      canvas.height,
      camX,
      camY,
      level,
      INITIAL_TERRITORY_ZONES,
      true,
      2.0
    );
    drawStructure25D(ctx, STRUCTURES_25D[0], camX, camY, level.timeOfDay);
  }, [level]);

  return (
    <canvas
      ref={canvasRef}
      width={360}
      height={150}
      className="w-full h-36 rounded-lg border border-slate-700/80 block object-cover"
    />
  );
};

/**
 * 1. MAIN MENU VIEW
 */
export const MainMenuView: React.FC<{
  selectedFaction: FactionId;
  selectedLevel: LevelId;
  onPlayGame: () => void;
  onSelectCharacter: () => void;
  onSelectModes: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
}> = ({
  selectedFaction,
  selectedLevel,
  onPlayGame,
  onSelectCharacter,
  onSelectModes,
  onOpenSettings,
  onOpenHowToPlay,
}) => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((prev) => (prev + 1) % GAMEPLAY_TIPS.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        soundEngine.playUiClick();
        onPlayGame();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onPlayGame]);

  const currentLevel = LEVELS[selectedLevel];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between p-6 md:p-10">
      <LiveTitleBackground />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0B132B]/95 via-[#0B132B]/80 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B132B]/95 via-transparent to-[#0B132B]/60" />

      {/* Top Perimeter Bar */}
      <div className="relative z-10 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3 text-xs font-medium text-slate-300">
          <span className="text-[#FF9933] font-semibold">2.5D OPEN WORLD · NEW DELHI</span>
          <span aria-hidden="true">·</span>
          <span>FACTION: {selectedFaction}</span>
          <span aria-hidden="true">·</span>
          <span>PRESET: {currentLevel.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenHowToPlay();
            }}
            className="px-3.5 py-1.5 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            HOW TO PLAY
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenSettings();
            }}
            className="px-3.5 py-1.5 rounded-md bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            SETTINGS
          </button>
        </div>
      </div>

      {/* Hero Title Lockup & Menu Buttons */}
      <div className="relative z-10 max-w-xl my-auto flex flex-col items-start gap-6">
        <div className="w-full">
          <svg
            viewBox="0 0 620 145"
            className="w-full max-w-[540px] h-auto drop-shadow-lg"
            role="img"
            aria-label="Battle of Jantar Mantar"
          >
            <defs>
              <linearGradient id="saffronGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFEDD5" />
                <stop offset="50%" stopColor="#FF9933" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            <rect x="2" y="4" width="76" height="5" fill="#FF9933" rx="2" />
            <rect x="84" y="4" width="76" height="5" fill="#F8FAFC" rx="2" />
            <rect x="166" y="4" width="76" height="5" fill="#10B981" rx="2" />

            <text
              x="0"
              y="54"
              fill="#F8FAFC"
              fontFamily="'Barlow Condensed', sans-serif"
              fontWeight="800"
              fontSize="42"
              letterSpacing="3"
            >
              BATTLE OF · OPEN WORLD
            </text>
            <text
              x="0"
              y="124"
              fill="url(#saffronGrad)"
              fontFamily="'Barlow Condensed', sans-serif"
              fontWeight="800"
              fontSize="76"
              letterSpacing="1.5"
            >
              JANTAR MANTAR
            </text>
          </svg>

          <p className="mt-2 text-lg md:text-xl font-medium text-slate-200 tracking-wide">
            “Choose Your Side. Chase or Escape Across Open-World New Delhi.”
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Explore Jantar Mantar, Connaught Place, Sansad Marg, Janpath Bazaar & Metro Stations with 360° movement, 1–5 Star Police Heat, and live Territory Zones.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full">
          <button
            type="button"
            onMouseEnter={() => soundEngine.playUiHover()}
            onClick={() => {
              soundEngine.playUiClick(620);
              onPlayGame();
            }}
            className="px-8 py-4 rounded-lg bg-[#FF9933] hover:bg-amber-400 active:scale-[0.99] text-[#0B132B] font-display font-extrabold text-2xl tracking-wider transition-all shadow-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            PLAY GAME
          </button>

          <button
            type="button"
            onMouseEnter={() => soundEngine.playUiHover()}
            onClick={() => {
              soundEngine.playUiClick();
              onSelectCharacter();
            }}
            className="px-6 py-4 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-600 text-white font-display font-bold text-xl tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            SELECT CHARACTER
          </button>

          <button
            type="button"
            onMouseEnter={() => soundEngine.playUiHover()}
            onClick={() => {
              soundEngine.playUiClick();
              onSelectModes();
            }}
            className="px-6 py-4 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-600 text-white font-display font-bold text-xl tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            GAME MODES
          </button>
        </div>

        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            onMouseEnter={() => soundEngine.playUiHover()}
            onClick={() => {
              soundEngine.playUiClick();
              onOpenSettings();
            }}
            className="text-sm font-semibold text-slate-300 hover:text-[#FF9933] underline-offset-4 hover:underline transition-colors cursor-pointer"
          >
            SETTINGS & AUDIO
          </button>
          <span className="text-slate-600" aria-hidden="true">·</span>
          <button
            type="button"
            onMouseEnter={() => soundEngine.playUiHover()}
            onClick={() => {
              soundEngine.playUiClick();
              onOpenHowToPlay();
            }}
            className="text-sm font-semibold text-slate-300 hover:text-[#FF9933] underline-offset-4 hover:underline transition-colors cursor-pointer"
          >
            HOW TO PLAY & MAP GUIDE
          </button>
        </div>
      </div>

      {/* Bottom Flat Control-Hint & Rotating Tip Strip */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
        <div className="font-mono-tabular text-slate-200">
          WASD/Arrows 360° Move · Space Vault · Shift Sprint · C Hide · E Capture/Rally · Q Skill · M Map
        </div>
        <div className="text-slate-400 truncate max-w-xl">{GAMEPLAY_TIPS[tipIndex]}</div>
      </div>
    </div>
  );
};

/**
 * 2. CHOOSE YOUR SIDE & CHARACTER OUTFITS VIEW
 */
export const ChooseYourSideView: React.FC<{
  selectedFaction: FactionId;
  selectedPoliceOutfit: OutfitConfig;
  selectedProtesterOutfit: OutfitConfig;
  onSelectPoliceOutfit: (o: OutfitConfig) => void;
  onSelectProtesterOutfit: (o: OutfitConfig) => void;
  onConfirmPlay: (faction: FactionId) => void;
  onBack: () => void;
}> = ({
  selectedFaction,
  selectedPoliceOutfit,
  selectedProtesterOutfit,
  onSelectPoliceOutfit,
  onSelectProtesterOutfit,
  onConfirmPlay,
  onBack,
}) => {
  const [stancePreview, setStancePreview] = useState<'RUN' | 'JUMP' | 'CROUCH'>('RUN');
  const policeOutfits = OUTFITS.filter((o) => o.faction === 'POLICE');
  const protesterOutfits = OUTFITS.filter((o) => o.faction === 'PROTESTER');

  const renderFactionCard = (
    factionId: FactionId,
    activeOutfit: OutfitConfig,
    outfitList: OutfitConfig[],
    onSelectOutfit: (o: OutfitConfig) => void
  ) => {
    const info = FACTION_INFO[factionId];
    const isSelected = selectedFaction === factionId;

    return (
      <div
        key={factionId}
        className={`flex flex-col justify-between rounded-xl bg-slate-900/90 border p-6 transition-all ${
          isSelected ? 'border-[#FF9933] shadow-xl' : 'border-slate-700/80 hover:border-slate-500'
        }`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold tracking-wider text-slate-400">
                {info.roleBadge} · {info.subtitle}
              </div>
              <h2 className="font-display font-extrabold text-3xl text-white tracking-wide mt-0.5">
                {info.title}
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
              {(['RUN', 'JUMP', 'CROUCH'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    setStancePreview(st);
                  }}
                  className={`px-2 py-1 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                    stancePreview === st
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <CharacterPreviewCanvas outfit={activeOutfit} stanceMode={stancePreview} />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">SELECT OUTFIT: {activeOutfit.name}</span>
              <span className="font-mono-tabular text-emerald-400">{activeOutfit.statBonus}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {outfitList.map((o) => {
                const active = o.id === activeOutfit.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playUiClick();
                      onSelectOutfit(o);
                    }}
                    className={`px-3 py-2 rounded-md border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-slate-800 border-[#FF9933] text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{o.name}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="w-3 h-3 rounded-sm border border-white/20"
                        style={{ backgroundColor: o.primaryColor }}
                      />
                      <span
                        className="w-3 h-3 rounded-sm border border-white/20"
                        style={{ backgroundColor: o.accentColor }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400">{activeOutfit.tagline}</p>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <p className="text-sm text-slate-200 leading-relaxed mb-3">{info.description}</p>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {info.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#FF9933] font-bold">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs">
            <div className="font-semibold text-white">
              TACTICAL SKILL: <span className="text-[#FF9933]">{info.abilityName}</span> ·{' '}
              <span className="text-sky-400">{info.interactName}</span>
            </div>
            <p className="text-slate-400 mt-1">{info.abilityDescription}</p>
          </div>
        </div>

        <button
          type="button"
          onMouseEnter={() => soundEngine.playUiHover()}
          onClick={() => {
            soundEngine.playUiClick(640);
            onConfirmPlay(factionId);
          }}
          className={`mt-6 w-full py-3.5 px-6 rounded-lg font-display font-extrabold text-2xl tracking-wider transition-all cursor-pointer ${
            factionId === 'POLICE'
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-[#FF9933] hover:bg-amber-400 text-[#0B132B]'
          }`}
        >
          {info.ctaLabel}
        </button>
      </div>
    );
  };

  return (
    <div className="w-screen h-screen overflow-y-auto bg-[#0B132B] px-6 py-6 md:px-12 md:py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="font-display font-extrabold text-4xl text-white tracking-wide">
              CHOOSE YOUR SIDE — OPEN WORLD
            </h1>
            <p className="text-sm text-slate-400">
              Select your faction, customize your outfit, and deploy into the 5-district New Delhi sandbox.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onBack();
            }}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            ← BACK TO MAIN MENU
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {renderFactionCard(
            'POLICE',
            selectedPoliceOutfit,
            policeOutfits,
            onSelectPoliceOutfit
          )}
          {renderFactionCard(
            'PROTESTER',
            selectedProtesterOutfit,
            protesterOutfits,
            onSelectProtesterOutfit
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 3. GAME MODES & OPEN-WORLD PRESETS VIEW
 */
export const GameModesView: React.FC<{
  selectedFaction: FactionId;
  selectedLevel: LevelId;
  highScores: Record<string, HighScoreRecord>;
  onSelectFaction: (f: FactionId) => void;
  onSelectLevel: (l: LevelId) => void;
  onStartLevel: (l: LevelId) => void;
  onBack: () => void;
}> = ({
  selectedFaction,
  selectedLevel,
  highScores,
  onSelectFaction,
  onSelectLevel,
  onStartLevel,
  onBack,
}) => {
  const levelList = Object.values(LEVELS);

  return (
    <div className="w-screen h-screen overflow-y-auto bg-[#0B132B] px-6 py-6 md:px-12 md:py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="font-display font-extrabold text-4xl text-white tracking-wide">
              OPEN-WORLD MODES & HEAT PRESETS
            </h1>
            <p className="text-sm text-slate-400">
              All three New Delhi open-world lighting and Heat presets are unlocked from the start.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-700 rounded-lg">
              {(['POLICE', 'PROTESTER'] as const).map((fac) => (
                <button
                  key={fac}
                  type="button"
                  onClick={() => {
                    soundEngine.playUiClick();
                    onSelectFaction(fac);
                  }}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedFaction === fac
                      ? 'bg-[#FF9933] text-[#0B132B]'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  PLAY AS {fac}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playUiClick();
                onBack();
              }}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              ← BACK TO MAIN MENU
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {levelList.map((lvl) => {
            const isSelected = lvl.id === selectedLevel;
            const recordKey = `${lvl.id}_${selectedFaction}`;
            const record = highScores[recordKey];

            return (
              <div
                key={lvl.id}
                onClick={() => {
                  soundEngine.playUiClick();
                  onSelectLevel(lvl.id);
                }}
                className={`flex flex-col justify-between rounded-xl bg-slate-900/90 border p-5 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#FF9933] shadow-xl'
                    : 'border-slate-700/80 hover:border-slate-500'
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>PRESET 0{lvl.number} · {lvl.timeOfDay}</span>
                    <span className="font-mono-tabular text-[#FF9933] font-semibold">
                      {lvl.difficulty} · {lvl.initialHeat}★ START HEAT
                    </span>
                  </div>

                  <div>
                    <h2 className="font-display font-extrabold text-3xl text-white tracking-wide">
                      {lvl.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">{lvl.subtitle}</p>
                  </div>

                  <LevelPreviewCanvas level={lvl} />

                  <p className="text-sm text-slate-300 leading-relaxed">{lvl.description}</p>

                  <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>ZONES REQUIRED / TIMER</span>
                      <span className="font-mono-tabular font-semibold text-white">
                        {lvl.targetZonesRequired}/5 ZONES · {lvl.timeLimit}s
                      </span>
                    </div>
                    <div className="text-slate-400">
                      <strong className="text-slate-200">{selectedFaction} MISSION: </strong>
                      {selectedFaction === 'POLICE' ? lvl.policeObjective : lvl.protesterObjective}
                    </div>
                    {record && (
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-emerald-400 font-mono-tabular">
                        <span>BEST SCORE: {record.bestScore.toLocaleString()}</span>
                        <span>FASTEST: {record.fastestTime}s</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundEngine.playUiClick(640);
                    onStartLevel(lvl.id);
                  }}
                  className="mt-5 w-full py-3 rounded-lg bg-[#FF9933] hover:bg-amber-400 text-[#0B132B] font-display font-extrabold text-xl tracking-wider transition-colors cursor-pointer"
                >
                  DEPLOY: {lvl.title}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 4. SETTINGS MODAL
 */
export const SettingsModal: React.FC<{
  settings: AudioSettings;
  onChange: (next: AudioSettings) => void;
  onClose: () => void;
}> = ({ settings, onChange, onClose }) => {
  const update = (partial: Partial<AudioSettings>) => {
    const next = { ...settings, ...partial };
    onChange(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="font-display font-extrabold text-3xl text-white tracking-wide">
            SETTINGS & ACCESSIBILITY
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            CLOSE [ESC]
          </button>
        </div>

        <div className="space-y-5 py-5 text-sm">
          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-200">Music Volume</label>
              <span className="font-mono-tabular text-[#FF9933]">{settings.musicVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.musicVolume}
              onChange={(e) => update({ musicVolume: Number(e.target.value) })}
              className="w-full accent-[#FF9933] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-200">Sound Effects (SFX) Volume</label>
              <span className="font-mono-tabular text-[#FF9933]">{settings.sfxVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.sfxVolume}
              onChange={(e) => update({ sfxVolume: Number(e.target.value) })}
              className="w-full accent-[#FF9933] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="font-medium text-slate-200">City & Radio Ambience Volume</label>
              <span className="font-mono-tabular text-[#FF9933]">{settings.ambienceVolume}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={settings.ambienceVolume}
              onChange={(e) => update({ ambienceVolume: Number(e.target.value) })}
              className="w-full accent-[#FF9933] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => update({ muted: !settings.muted })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                settings.muted
                  ? 'bg-red-950/60 border-red-500 text-red-200'
                  : 'bg-slate-950 border-slate-800 text-slate-200'
              }`}
            >
              <div className="text-xs font-bold">MUTE ALL AUDIO</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {settings.muted ? 'Audio Muted' : 'Audio Active'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => update({ subtitles: !settings.subtitles })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                settings.subtitles
                  ? 'bg-emerald-950/50 border-emerald-500/70 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">AUDIO SUBTITLES</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {settings.subtitles ? 'Enabled (Radio & SFX)' : 'Disabled'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => update({ showTouchControls: !settings.showTouchControls })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                settings.showTouchControls
                  ? 'bg-amber-950/50 border-[#FF9933] text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">ON-SCREEN TOUCH PAD</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {settings.showTouchControls ? 'Always Visible' : 'Auto (Mobile Only)'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => update({ screenShake: !settings.screenShake })}
              className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                settings.screenShake
                  ? 'bg-sky-950/50 border-sky-500/70 text-sky-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <div className="text-xs font-bold">CAMERA IMPACT SHAKE</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {settings.screenShake ? 'Enabled' : 'Reduced Motion'}
              </div>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onClose();
          }}
          className="w-full py-3 rounded-lg bg-[#FF9933] hover:bg-amber-400 text-[#0B132B] font-display font-extrabold text-xl tracking-wider cursor-pointer"
        >
          SAVE & RETURN
        </button>
      </div>
    </div>
  );
};

/**
 * 5. HOW TO PLAY MODAL
 */
export const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="font-display font-extrabold text-3xl text-white tracking-wide">
            HOW TO PLAY — OPEN-WORLD FIELD GUIDE
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onClose();
            }}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        <div className="space-y-5 py-5 text-sm text-slate-300">
          <div>
            <h3 className="font-display font-bold text-xl text-[#FF9933] tracking-wide mb-2">
              1. 360° OPEN-WORLD CONTROLS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between">
                <span className="text-slate-400">Move 360° Across City</span>
                <span className="font-mono-tabular font-bold text-white">WASD or ARROW KEYS</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between">
                <span className="text-slate-400">Jump / Vault Barricades</span>
                <span className="font-mono-tabular font-bold text-white">SPACEBAR</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between">
                <span className="text-slate-400">High-Speed Sprint</span>
                <span className="font-mono-tabular font-bold text-white">HOLD SHIFT</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between">
                <span className="text-slate-400">Hide in Tent / Shed Heat</span>
                <span className="font-mono-tabular font-bold text-white">HOLD C or CTRL</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between">
                <span className="text-slate-400">Capture Lunge / Dash</span>
                <span className="font-mono-tabular font-bold text-white">E KEY</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between">
                <span className="text-slate-400">Whistle Ping / Smoke Decoy</span>
                <span className="font-mono-tabular font-bold text-white">Q KEY · [M] EXPAND MAP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div className="bg-slate-950/90 border border-blue-900/60 p-4 rounded-lg">
              <h4 className="font-display font-bold text-lg text-sky-400">
                POLICE SANDBOX (THE PURSUERS)
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Patrol the 5 interconnected districts of New Delhi. Use the top-right <strong>City Radar Minimap</strong> to spot Protester Leaders attempting to rally landmark rings. Press <strong>[Q]</strong> to blow your Patrol Whistle (commanding AI officers to converge) and press <strong>[E]</strong> to execute a 360° Capture Lunge.
              </p>
            </div>

            <div className="bg-slate-950/90 border border-amber-900/60 p-4 rounded-lg">
              <h4 className="font-display font-bold text-lg text-[#FF9933]">
                PROTESTER SANDBOX (ESCAPE ARTISTS)
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Roam across Jantar Mantar, Connaught Place, Sansad Marg, and Janpath to rally the circular <strong>Territory Zones</strong> to 100%. When your <strong>Police Heat (1–5★)</strong> escalates, duck into Shamiana Tents or Banyan Groves and hold <strong>[C]</strong> to shed Heat. Once enough zones are rallied, escape via any green <strong>Metro Station Gate</strong>!
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEngine.playUiClick();
            onClose();
          }}
          className="w-full py-3 rounded-lg bg-[#FF9933] hover:bg-amber-400 text-[#0B132B] font-display font-extrabold text-xl tracking-wider cursor-pointer"
        >
          GOT IT — ENTER OPEN WORLD
        </button>
      </div>
    </div>
  );
};

/**
 * 6. PAUSE MODAL
 */
export const PauseModal: React.FC<{
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}> = ({ onResume, onRestart, onOpenSettings, onMainMenu }) => {
  return (
    <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-center">
        <h2 className="font-display font-extrabold text-4xl text-white tracking-wide">
          SANDBOX PAUSED
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          New Delhi Open-World Operation on Standby
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onResume();
            }}
            className="w-full py-3 rounded-lg bg-[#FF9933] hover:bg-amber-400 text-[#0B132B] font-display font-extrabold text-xl tracking-wider cursor-pointer"
          >
            RESUME OPEN WORLD
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onRestart();
            }}
            className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-lg tracking-wider cursor-pointer"
          >
            RESTART SESSION
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onOpenSettings();
            }}
            className="w-full py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-lg tracking-wider cursor-pointer"
          >
            SETTINGS & AUDIO
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onMainMenu();
            }}
            className="w-full py-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-display font-bold text-lg tracking-wider cursor-pointer"
          >
            RETURN TO MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 7. GAME OVER / VICTORY RESULTS SCREEN
 */
export const ResultsView: React.FC<{
  result: GameResult;
  onReplay: () => void;
  onSelectLevel: () => void;
  onMainMenu: () => void;
}> = ({ result, onReplay, onSelectLevel, onMainMenu }) => {
  const level = LEVELS[result.levelId];
  const isCaptureVictory = result.won && result.faction === 'POLICE';
  const isEscapeVictory = result.won && result.faction === 'PROTESTER';

  const headline = isCaptureVictory
    ? 'CITY SECURED — POLICE WIN'
    : isEscapeVictory
    ? 'UPRISING & EXTRACTION — WIN'
    : result.faction === 'POLICE'
    ? 'DISTRICTS LOST — LOSS'
    : 'APPREHENDED IN LOCKDOWN — LOSS';

  return (
    <div className="relative w-screen h-screen overflow-y-auto bg-[#0B132B] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-xl bg-slate-900 border border-slate-700 p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-400">
          <span>
            OPEN WORLD: {level.title} · FACTION: {result.faction}
          </span>
          <span className={result.won ? 'text-emerald-400' : 'text-red-400'}>
            {result.won ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
          </span>
        </div>

        <h1
          className={`font-display font-extrabold text-4xl md:text-5xl tracking-wide mt-2 ${
            result.won ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {headline}
        </h1>
        <p className="text-sm text-slate-300 mt-1">{result.reason}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] text-slate-400">FINAL SCORE</div>
            <div className="text-2xl font-mono-tabular font-bold text-[#FF9933] mt-1">
              {result.score.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] text-slate-400">TIME TAKEN</div>
            <div className="text-2xl font-mono-tabular font-bold text-white mt-1">
              {result.timeTaken.toFixed(1)}s
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] text-slate-400">ZONES RALLIED</div>
            <div className="text-2xl font-mono-tabular font-bold text-emerald-400 mt-1">
              {result.zonesSecured} / 5
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
            <div className="text-[11px] text-slate-400">PEAK HEAT</div>
            <div className="text-2xl font-mono-tabular font-bold text-red-400 mt-1">
              {result.peakHeat} ★
            </div>
          </div>
        </div>

        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 mb-6">
          <div className="text-xs font-bold tracking-wider text-slate-300 mb-3">
            OPEN-WORLD OBJECTIVES SUMMARY
          </div>
          <div className="space-y-2.5">
            {result.objectivesCompleted.map((obj, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      obj.completed ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {obj.completed ? '[COMPLETED]' : '[INCOMPLETE]'}
                  </span>
                  <span className={obj.completed ? 'text-slate-100' : 'text-slate-400'}>
                    {obj.label}
                  </span>
                </div>
                <span className="font-mono-tabular font-semibold text-[#FF9933]">
                  +{obj.bonus} PTS
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick(640);
              onReplay();
            }}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-lg bg-[#FF9933] hover:bg-amber-400 text-[#0B132B] font-display font-extrabold text-xl tracking-wider transition-colors cursor-pointer"
          >
            REPLAY OPEN WORLD
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onSelectLevel();
            }}
            className="w-full sm:w-auto py-3.5 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-display font-bold text-lg tracking-wider transition-colors cursor-pointer"
          >
            CHANGE PRESET
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playUiClick();
              onMainMenu();
            }}
            className="w-full sm:w-auto py-3.5 px-5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-display font-bold text-lg tracking-wider transition-colors cursor-pointer"
          >
            RETURN TO MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};

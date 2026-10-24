import {
  ActiveCharacter,
  DecoyCloud,
  DistrictZone,
  FactionId,
  LevelConfig,
  MetroGate,
  OutfitConfig,
  RoadSegment,
  Structure25D,
  TerritoryZone,
  WorldBarricade,
  WorldCoverSpot,
  WorldParticle,
} from '../types/game';
import {
  DISTRICTS,
  METRO_GATES,
  ROADS,
  STRUCTURES_25D,
  WORLD_SIZE,
} from '../data/gameData';

/**
 * Draws the Open-World Ground Plane: Districts, Parks, Boulevards, Crosswalks, Territory Zones & Metro Gates
 */
export function drawOpenWorldGround(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  camX: number,
  camY: number,
  level: LevelConfig,
  zones: TerritoryZone[],
  gatesUnlocked: boolean,
  timeSec: number
) {
  // Base city ground fill
  ctx.fillStyle = level.timeOfDay === 'NIGHT' ? '#070C18' : '#111827';
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.save();
  ctx.translate(-camX, -camY);

  // 1. DISTRICT GROUNDS & GARDEN LAWNS
  for (const d of DISTRICTS) {
    if (
      d.x + d.width < camX ||
      d.x > camX + viewW ||
      d.y + d.height < camY ||
      d.y > camY + viewH
    ) {
      continue;
    }

    ctx.fillStyle = d.groundColor;
    ctx.fillRect(d.x, d.y, d.width, d.height);

    // Subtle paved grid or garden path tiling
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const step = 120;
    for (let gx = d.x; gx <= d.x + d.width; gx += step) {
      ctx.beginPath();
      ctx.moveTo(gx, d.y);
      ctx.lineTo(gx, d.y + d.height);
      ctx.stroke();
    }
    for (let gy = d.y; gy <= d.y + d.height; gy += step) {
      ctx.beginPath();
      ctx.moveTo(d.x, gy);
      ctx.lineTo(d.x + d.width, gy);
      ctx.stroke();
    }

    // District perimeter hairline
    ctx.strokeStyle = d.borderColor;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x + 4, d.y + 4, d.width - 8, d.height - 8);
    ctx.globalAlpha = 1;
  }

  // Jantar Mantar Ornamental Garden Parterres & Sandstone Pathways
  ctx.fillStyle = level.timeOfDay === 'NIGHT' ? '#0D261B' : '#164E35';
  ctx.fillRect(980, 1140, 1240, 960);
  // Terracotta garden border
  ctx.strokeStyle = '#9A3412';
  ctx.lineWidth = 8;
  ctx.strokeRect(980, 1140, 1240, 960);

  // 2. ROAD NETWORK & BOULEVARDS
  for (const r of ROADS) {
    const isHorizontal = Math.abs(r.y1 - r.y2) < 10;
    const rx = isHorizontal ? Math.min(r.x1, r.x2) : r.x1 - r.width / 2;
    const ry = isHorizontal ? r.y1 - r.width / 2 : Math.min(r.y1, r.y2);
    const rw = isHorizontal ? Math.abs(r.x2 - r.x1) : r.width;
    const rh = isHorizontal ? r.width : Math.abs(r.y2 - r.y1);

    // Sandstone sidewalk curbs
    ctx.fillStyle = '#475569';
    ctx.fillRect(rx - 10, ry - 10, rw + 20, rh + 20);

    // Asphalt roadbed
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(rx, ry, rw, rh);

    // Dashed lane divider
    ctx.strokeStyle = r.hasMedian ? '#F59E0B' : 'rgba(248, 250, 252, 0.35)';
    ctx.lineWidth = r.hasMedian ? 3 : 2;
    ctx.setLineDash([28, 24]);
    ctx.beginPath();
    ctx.moveTo(r.x1, r.y1);
    ctx.lineTo(r.x2, r.y2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Road stencil name
    if (r.label) {
      ctx.save();
      ctx.fillStyle = 'rgba(248, 250, 252, 0.16)';
      ctx.font = '800 18px "Barlow Condensed", sans-serif';
      ctx.textAlign = 'center';
      const midX = (r.x1 + r.x2) / 2;
      const midY = (r.y1 + r.y2) / 2;
      if (!isHorizontal) {
        ctx.translate(midX - 35, midY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(r.label, 0, 0);
      } else {
        ctx.fillText(r.label, midX, midY - 25);
      }
      ctx.restore();
    }
  }

  // Connaught Place Iconic Circular Plaza Ring at (1600, 560)
  ctx.save();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 46;
  ctx.beginPath();
  ctx.arc(1600, 560, 240, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#F8FAFC';
  ctx.lineWidth = 2;
  ctx.setLineDash([16, 16]);
  ctx.beginPath();
  ctx.arc(1600, 560, 240, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 3. TERRITORY CONTROL ZONES (Interactive Landmark Rings)
  for (const z of zones) {
    const pulse = 1 + Math.sin(timeSec * 3.5) * 0.04;
    const ownerColor =
      z.owner === 'PROTESTER'
        ? '#FF9933'
        : z.owner === 'POLICE'
        ? '#3B82F6'
        : '#94A3B8';

    ctx.save();
    // Base zone floor glow
    const grad = ctx.createRadialGradient(z.x, z.y, 15, z.x, z.y, z.radius * pulse);
    grad.addColorStop(
      0,
      z.owner === 'PROTESTER'
        ? 'rgba(255, 153, 51, 0.28)'
        : z.owner === 'POLICE'
        ? 'rgba(59, 130, 246, 0.25)'
        : 'rgba(148, 163, 184, 0.16)'
    );
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.02)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Outer dashed boundary ring
    ctx.strokeStyle = ownerColor;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Progress Arc (0..100%)
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (z.progress / 100) * Math.PI * 2;
    ctx.strokeStyle = '#FF9933';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius - 8, startAngle, endAngle);
    ctx.stroke();

    // Center Monument Flag / Beacon Pedestal
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(z.x, z.y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ownerColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Zone Name & Percentage Readout on Ground
    ctx.font = '800 15px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(z.name.toUpperCase(), z.x, z.y - z.radius - 18);

    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillStyle = ownerColor;
    ctx.fillText(
      `${z.owner === 'PROTESTER' ? 'RALLIED' : z.owner === 'POLICE' ? 'LOCKED DOWN' : 'CONTESTED'} · ${Math.round(z.progress)}%`,
      z.x,
      z.y - z.radius - 4
    );
    ctx.restore();
  }

  // 4. METRO EXTRACTION GATES
  for (const gate of METRO_GATES) {
    ctx.save();
    const activeColor = gatesUnlocked ? '#10B981' : '#64748B';
    const glow = ctx.createRadialGradient(gate.x, gate.y, 10, gate.x, gate.y, gate.radius);
    glow.addColorStop(0, gatesUnlocked ? 'rgba(16, 185, 129, 0.48)' : 'rgba(100, 116, 139, 0.2)');
    glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, gate.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(gate.x, gate.y, gate.radius - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Delhi Metro "M" Insignia
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(gate.x - 54, gate.y - 18, 108, 36);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(gate.x - 54, gate.y - 18, 108, 36);

    ctx.fillStyle = gatesUnlocked ? '#34D399' : '#CBD5E1';
    ctx.font = '800 13px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      gatesUnlocked ? 'METRO EXIT: OPEN' : 'METRO EXIT (LOCKED)',
      gate.x,
      gate.y + 4
    );
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(gate.name, gate.x, gate.y + 34);
    ctx.restore();
  }

  // World Boundary Cordon Frame
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 6;
  ctx.setLineDash([24, 16]);
  ctx.strokeRect(80, 80, WORLD_SIZE - 160, WORLD_SIZE - 160);
  ctx.setLineDash([]);

  ctx.restore();
}

/**
 * Draws a 2.5D Extruded Building or Jantar Mantar Monument (Oblique Top-Down Projection)
 */
export function drawStructure25D(
  ctx: CanvasRenderingContext2D,
  s: Structure25D,
  camX: number,
  camY: number,
  timeOfDay: LevelConfig['timeOfDay']
) {
  const sx = s.x - camX;
  const sy = s.y - camY;
  const roofY = sy - s.height25D;

  ctx.save();

  // 1. Directional Ground Cast Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.moveTo(sx, sy + s.depth);
  ctx.lineTo(sx + s.width, sy + s.depth);
  ctx.lineTo(sx + s.width + 38, sy + s.depth + 28);
  ctx.lineTo(sx + 38, sy + s.depth + 28);
  ctx.closePath();
  ctx.fill();

  // 2. Front Extruded Vertical Facade (from roof bottom edge `roofY + s.depth` down to ground base `sy + s.depth`)
  const frontTopY = roofY + s.depth;
  const frontBotY = sy + s.depth;
  ctx.fillStyle = s.wallColor;
  ctx.fillRect(sx, frontTopY, s.width, s.height25D);
  ctx.strokeStyle = '#090D16';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(sx, frontTopY, s.width, s.height25D);

  // Architectural Facade Details based on Landmark Type
  if (s.type === 'SAMRAT_YANTRA') {
    // Recessed Terracotta Arches & Stepped Hypotenuse Ramp
    ctx.fillStyle = '#5E1B12';
    const archCount = 4;
    const archW = (s.width - 40) / archCount;
    for (let i = 0; i < archCount; i++) {
      const ax = sx + 20 + i * archW + 6;
      const ah = s.height25D * 0.65;
      ctx.beginPath();
      ctx.roundRect(ax, frontBotY - ah, archW - 14, ah, [18, 18, 0, 0]);
      ctx.fill();
    }
  } else if (s.type === 'RAM_YANTRA') {
    // Cylindrical Vertical Observatory Pillars
    ctx.fillStyle = '#451A14';
    const cols = 6;
    const colW = s.width / (cols * 2);
    for (let i = 0; i < cols; i++) {
      ctx.fillRect(sx + colW * (i * 2 + 0.5), frontTopY + 10, colW, s.height25D - 10);
    }
  } else if (s.type === 'CP_COLONNADE') {
    // Iconic White Georgian Pillars of Connaught Place
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(sx + 10, frontTopY + 14, s.width - 20, s.height25D - 14);
    ctx.fillStyle = s.wallColor;
    const pillars = Math.floor(s.width / 46);
    const gap = s.width / pillars;
    for (let p = 0; p <= pillars; p++) {
      ctx.fillRect(sx + p * gap - 5, frontTopY + 8, 10, s.height25D - 8);
    }
  } else {
    // Lit Windows on Civic Towers & Metro Concourses
    const rows = 3;
    const cols = Math.floor(s.width / 38);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle =
          timeOfDay === 'NIGHT' && (r + c) % 2 === 0
            ? '#FBBF24'
            : '#0F172A';
        ctx.fillRect(
          sx + 16 + c * 36,
          frontTopY + 14 + r * 26,
          18,
          14
        );
      }
    }
  }

  // 3. Top Extruded Roof / Terrace Surface (`sx, roofY, s.width, s.depth`)
  ctx.fillStyle = s.roofColor;
  ctx.fillRect(sx, roofY, s.width, s.depth);

  // Sandstone / Marble Trim Parapet
  ctx.strokeStyle = s.trimColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(sx + 2, roofY + 2, s.width - 4, s.depth - 4);

  // Sundial Calibration Markings on Jantar Mantar Roofs
  if (s.type === 'SAMRAT_YANTRA' || s.type === 'JAI_PRAKASH') {
    ctx.strokeStyle = s.trimColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx + s.width / 2, roofY + s.depth / 2, Math.min(s.width, s.depth) * 0.35, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Landmark Roof Label
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 13px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.name.toUpperCase(), sx + s.width / 2, roofY + s.depth / 2 + 4);

  ctx.restore();
}

/**
 * Draws a 2.5D Street Barricade or Police Van
 */
export function drawWorldBarricade25D(
  ctx: CanvasRenderingContext2D,
  b: WorldBarricade,
  camX: number,
  camY: number,
  timeSec: number
) {
  const sx = b.x - camX;
  const sy = b.y - camY;
  const topY = sy - b.height25D;

  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.fillRect(sx + 6, sy + 6, b.width, b.depth);

  if (b.type === 'DELHI_BARRICADE') {
    // Yellow & Red Delhi Police Barricade
    ctx.fillStyle = '#EAB308';
    ctx.fillRect(sx, topY + b.depth, b.width, b.height25D);
    ctx.strokeStyle = '#090D16';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, topY + b.depth, b.width, b.height25D);

    ctx.fillStyle = '#DC2626';
    ctx.fillRect(sx + 6, topY + b.depth + 6, b.width - 12, 8);
    ctx.fillRect(sx + 6, topY + b.depth + 18, b.width - 12, 8);

    ctx.fillStyle = '#090D16';
    ctx.font = '700 10px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DELHI POLICE · [SPACE] VAULT', sx + b.width / 2, topY + b.depth + 14);
  } else if (b.type === 'POLICE_VAN') {
    // 2.5D Police Gyro Van with Flashing Roof Beacon
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(sx, topY + b.depth, b.width, b.height25D);
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(sx, topY, b.width, b.depth);
    ctx.strokeStyle = '#090D16';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, topY, b.width, b.depth + b.height25D);

    // Red/Blue Flashing Siren Bar
    const isRed = Math.floor(timeSec * 8) % 2 === 0;
    ctx.fillStyle = isRed ? '#EF4444' : '#38BDF8';
    ctx.fillRect(sx + b.width / 2 - 14, topY + b.depth / 2 - 4, 28, 8);

    const sirenGlow = ctx.createRadialGradient(
      sx + b.width / 2,
      topY + b.depth / 2,
      4,
      sx + b.width / 2,
      topY + b.depth / 2,
      58
    );
    sirenGlow.addColorStop(0, isRed ? 'rgba(239, 68, 68, 0.55)' : 'rgba(56, 189, 248, 0.55)');
    sirenGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sirenGlow;
    ctx.beginPath();
    ctx.arc(sx + b.width / 2, topY + b.depth / 2, 58, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#64748B';
    ctx.fillRect(sx, topY + b.depth, b.width, b.height25D);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(sx, topY, b.width, b.depth);
    ctx.strokeStyle = '#090D16';
    ctx.strokeRect(sx, topY, b.width, b.depth + b.height25D);
  }

  ctx.restore();
}

/**
 * Draws a 2.5D Stealth Cover Spot (Shamiana Protest Tent, Banyan Grove, Chai Stall)
 */
export function drawWorldCover25D(
  ctx: CanvasRenderingContext2D,
  c: WorldCoverSpot,
  camX: number,
  camY: number,
  isPlayerInside: boolean,
  isPlayerHidden: boolean
) {
  const sx = c.x - camX;
  const sy = c.y - camY;
  const topY = sy - c.height25D;

  ctx.save();

  // If player is inside, make canopy semi-transparent so player sees their character clearly
  if (isPlayerInside) {
    ctx.globalAlpha = 0.65;
  }

  if (c.type === 'BANYAN_GROVE') {
    // Lush 2.5D Banyan Tree Canopy
    ctx.fillStyle = '#78350F';
    ctx.fillRect(sx + c.width / 2 - 10, sy + c.depth / 2 - 20, 20, 35);

    ctx.fillStyle = '#14532D';
    ctx.beginPath();
    ctx.arc(sx + c.width / 2, topY + c.depth / 2, 54, 0, Math.PI * 2);
    ctx.arc(sx + c.width * 0.28, topY + c.depth * 0.6, 40, 0, Math.PI * 2);
    ctx.arc(sx + c.width * 0.72, topY + c.depth * 0.6, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#052E16';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else {
    // Shamiana Canopy Tent with Saffron & White Stripes
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fillRect(sx + 6, sy + 6, c.width - 12, c.depth - 12);

    // Corner Brass Poles
    ctx.fillStyle = '#D97706';
    ctx.fillRect(sx + 4, topY + c.depth, 5, c.height25D);
    ctx.fillRect(sx + c.width - 9, topY + c.depth, 5, c.height25D);

    // Striped Canopy Roof
    const stripes = 6;
    const sw = c.width / stripes;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#FF9933' : '#F8FAFC';
      ctx.fillRect(sx + i * sw, topY, sw, c.depth);
    }
    ctx.strokeStyle = '#090D16';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, topY, c.width, c.depth);
  }

  ctx.globalAlpha = 1;

  if (isPlayerInside) {
    ctx.strokeStyle = isPlayerHidden ? '#10B981' : '#FF9933';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(sx - 4, sy - 4, c.width + 8, c.depth + 8);
    ctx.setLineDash([]);
  }

  ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = isPlayerHidden ? '#34D399' : '#E2E8F0';
  ctx.fillText(
    isPlayerHidden
      ? 'HIDDEN IN COVER (SHEDDING HEAT)'
      : isPlayerInside
      ? 'HOLD [C / S] TO HIDE'
      : c.label,
    sx + c.width / 2,
    topY - 8
  );

  ctx.restore();
}

/**
 * Draws an Articulated 2D Character inside the 2.5D Open World (with 360° vision cones & Z-jump height)
 */
export function drawArticulatedCharacter(
  ctx: CanvasRenderingContext2D,
  char: ActiveCharacter,
  screenX: number,
  screenFootY: number,
  timeSec: number,
  scale = 1
) {
  const zOffset = (char.z || 0) * scale;

  ctx.save();

  // 1. 360° AI Police Vision Cone on the Ground Plane
  if (char.faction === 'POLICE' && !char.isPlayer) {
    ctx.save();
    ctx.translate(screenX, screenFootY - 8);
    const coneRange = char.alertState === 'CHASE' ? 230 : 195;
    const coneSpread = 0.48;
    const angle = char.moveAngle || 0;

    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, coneRange);
    grad.addColorStop(
      0,
      char.alertState === 'CHASE'
        ? 'rgba(239, 68, 68, 0.28)'
        : 'rgba(56, 189, 248, 0.18)'
    );
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, coneRange, angle - coneSpread, angle + coneSpread);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 2. Ground Shadow at (screenX, screenFootY)
  const shadowScale = Math.max(0.45, 1 - (char.z || 0) / 140);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(screenX, screenFootY, 19 * scale * shadowScale, 6 * scale * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Translate to Character's elevated 2.5D foot position `(screenX, screenFootY - zOffset)`
  ctx.translate(screenX, screenFootY - zOffset);

  if (char.isHidden) {
    ctx.globalAlpha = 0.45;
  }

  ctx.scale(char.facing * char.squashX * scale, char.squashY * scale);

  const isCrouching = char.stance === 'CROUCH';
  const isMoving = char.stance === 'RUN' || char.stance === 'SPRINT';
  const isAirborne = (char.z || 0) > 4 || char.stance === 'JUMP' || char.stance === 'VAULT';
  const isLunging = char.stance === 'LUNGE';

  const swingAmp = char.stance === 'SPRINT' ? 0.85 : isMoving ? 0.58 : 0.08;
  const legAngle = isAirborne
    ? 0.45
    : isCrouching
    ? 0.25
    : Math.sin(char.animFrame) * swingAmp;
  const armAngle = isLunging
    ? -1.25
    : isAirborne
    ? -0.65
    : -Math.sin(char.animFrame) * (swingAmp * 0.9);

  const crouchOffsetY = isCrouching ? 16 : 0;
  const bounceY = isMoving ? Math.abs(Math.sin(char.animFrame)) * -3.5 : Math.sin(timeSec * 3.5) * 1.2;
  const hipY = -28 + crouchOffsetY + bounceY;
  const torsoLen = isCrouching ? 19 : 25;
  const shoulderY = hipY - torsoLen;
  const leanAngle = isLunging ? 0.35 : char.stance === 'SPRINT' ? 0.2 : isMoving ? 0.1 : 0;

  ctx.strokeStyle = '#090D16';
  ctx.lineWidth = 2.3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const outfit: OutfitConfig = char.outfit;

  // Back Arm
  ctx.save();
  ctx.translate(2, shoulderY + 4);
  ctx.rotate(-armAngle + leanAngle);
  ctx.fillStyle = outfit.primaryColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, 19, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Back Leg
  ctx.save();
  ctx.translate(-2, hipY);
  ctx.rotate(-legAngle);
  ctx.fillStyle = outfit.secondaryColor;
  ctx.beginPath();
  ctx.roundRect(-5, 0, 9, isCrouching ? 15 : 24, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Flowing Scarf for Protester
  if (char.faction === 'PROTESTER') {
    ctx.save();
    ctx.translate(-4, shoulderY + 3);
    const wave = Math.sin(timeSec * 9 + char.x * 0.04) * 5;
    ctx.fillStyle = outfit.accentColor;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-16, 4 + wave, -28, 9 - wave * 0.5);
    ctx.lineTo(-24, 16 - wave * 0.5);
    ctx.quadraticCurveTo(-12, 11 + wave, 2, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Torso & Head
  ctx.save();
  ctx.translate(0, hipY);
  ctx.rotate(leanAngle);

  ctx.fillStyle = outfit.primaryColor;
  ctx.beginPath();
  ctx.roundRect(-9, -torsoLen, 18, torsoLen + 4, 5);
  ctx.fill();
  ctx.stroke();

  if (char.faction === 'POLICE') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-9, -5, 18, 4);
    ctx.fillStyle = outfit.accentColor;
    ctx.fillRect(-3, -torsoLen + 4, 6, 5);
  } else {
    ctx.fillStyle = outfit.accentColor;
    ctx.fillRect(-7, -torsoLen + 5, 14, 4);
  }

  const headY = -torsoLen - 10;
  ctx.fillStyle = outfit.skinTone;
  ctx.beginPath();
  ctx.arc(1, headY, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#090D16';
  ctx.beginPath();
  ctx.arc(5, headY - 1, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Headgear
  if (outfit.headgear === 'PEAKED_CAP') {
    ctx.fillStyle = outfit.primaryColor;
    ctx.beginPath();
    ctx.roundRect(-9, headY - 12, 19, 6, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = outfit.accentColor;
    ctx.fillRect(-8, headY - 7, 17, 2.5);
  } else if (outfit.headgear === 'HEADBAND') {
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, headY - 2, 9.8, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = outfit.accentColor;
    ctx.fillRect(-9, headY - 5, 19, 3.5);
  } else {
    ctx.fillStyle = outfit.primaryColor;
    ctx.beginPath();
    ctx.arc(0, headY - 2, 10, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // Front Leg
  ctx.save();
  ctx.translate(2, hipY);
  ctx.rotate(legAngle);
  ctx.fillStyle = outfit.secondaryColor;
  ctx.beginPath();
  ctx.roundRect(-5, 0, 9, isCrouching ? 15 : 24, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Front Arm & Held Tool
  ctx.save();
  ctx.translate(-2 + leanAngle * 12, shoulderY + 5);
  ctx.rotate(armAngle + leanAngle);
  ctx.fillStyle = outfit.primaryColor;
  ctx.beginPath();
  ctx.roundRect(-4, 0, 8, 19, 4);
  ctx.fill();
  ctx.stroke();

  if (char.faction === 'POLICE') {
    ctx.fillStyle = outfit.accessory === 'NIGHT_BEACON' ? '#38BDF8' : '#78350F';
    ctx.beginPath();
    ctx.roundRect(-2, 16, 22, 4, 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore(); // End character root transform

  // Overhead Status Markers
  const topY = screenFootY - zOffset - (isCrouching ? 52 : 68) * scale;
  ctx.save();
  ctx.textAlign = 'center';
  if (char.isPlayer) {
    ctx.fillStyle = char.faction === 'POLICE' ? '#38BDF8' : '#FF9933';
    ctx.beginPath();
    ctx.moveTo(screenX, topY - 3);
    ctx.lineTo(screenX - 6, topY - 11);
    ctx.lineTo(screenX + 6, topY - 11);
    ctx.closePath();
    ctx.fill();
  } else if (char.isPrimaryTarget) {
    ctx.fillStyle = '#FF9933';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText('LEADER TARGET', screenX, topY - 8);
  } else if (char.faction === 'POLICE' && char.alertState === 'CHASE') {
    ctx.fillStyle = '#EF4444';
    ctx.font = '800 12px "Barlow Condensed", sans-serif';
    ctx.fillText('! PURSUING !', screenX, topY - 6);
  }
  ctx.restore();
}

/**
 * Draws World Particles & 2.5D Smoke Decoy Clouds
 */
export function drawParticlesAndDecoys(
  ctx: CanvasRenderingContext2D,
  particles: WorldParticle[],
  decoys: DecoyCloud[],
  camX: number,
  camY: number
) {
  decoys.forEach((d) => {
    const sx = d.x - camX;
    const sy = d.y - camY;
    const progress = d.timer / d.maxTimer;

    ctx.save();
    const grad = ctx.createRadialGradient(sx, sy, 6, sx, sy, d.radius);
    grad.addColorStop(0, `rgba(255, 153, 51, ${0.35 * progress})`);
    grad.addColorStop(0.6, `rgba(16, 185, 129, ${0.22 * progress})`);
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, d.radius, 0, Math.PI * 2);
    ctx.fill();

    // Subtle dashed perimeter ring so player sees exact skill area clearly without hiding terrain
    ctx.strokeStyle = `rgba(255, 153, 51, ${0.5 * progress})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(sx, sy, d.radius * 0.85, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  });

  particles.forEach((p) => {
    const sx = p.x - camX;
    const sy = p.y - camY - (p.z || 0);
    const ratio = Math.max(0, p.life / p.maxLife);

    ctx.save();
    ctx.globalAlpha = p.alpha * ratio;
    if (p.type === 'RING') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * (1.5 - ratio * 0.6), 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

/**
 * Draws World-Space Tactical Compass Ring & Off-Screen Waypoint Indicators around the Player
 * Ensures players always see nearby Territory Zones, Protester Leaders, and Open Metro Gates clearly
 */
export function drawTacticalCompassAndWaypoints(
  ctx: CanvasRenderingContext2D,
  player: ActiveCharacter,
  npcs: ActiveCharacter[],
  zones: TerritoryZone[],
  gatesUnlocked: boolean,
  camX: number,
  camY: number,
  tiltFactor: number,
  timeSec: number
) {
  const px = player.x - camX;
  const py = player.y - camY;
  const compassRadius = 95;

  ctx.save();

  // Subtle 2.5D Ground Tactical Compass Ring around player
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.ellipse(
    px,
    py,
    compassRadius,
    compassRadius * Math.max(0.65, tiltFactor),
    0,
    0,
    Math.PI * 2
  );
  ctx.stroke();
  ctx.setLineDash([]);

  // Collect tactical targets to point toward
  interface WaypointTarget {
    label: string;
    x: number;
    y: number;
    color: string;
    priority: boolean;
  }
  const targets: WaypointTarget[] = [];

  if (player.faction === 'PROTESTER') {
    if (gatesUnlocked) {
      for (const g of METRO_GATES) {
        targets.push({
          label: 'METRO EXIT',
          x: g.x,
          y: g.y,
          color: '#10B981',
          priority: true,
        });
      }
    }
    for (const z of zones) {
      if (z.owner !== 'PROTESTER') {
        targets.push({
          label: `${z.districtName.split(' ')[0]} (${Math.round(z.progress)}%)`,
          x: z.x,
          y: z.y,
          color: '#FF9933',
          priority: false,
        });
      }
    }
  } else {
    // Police faction: point toward uncaptured Protester Leaders
    for (const n of npcs) {
      if (n.faction === 'PROTESTER' && !n.captured) {
        targets.push({
          label: 'TARGET',
          x: n.x,
          y: n.y,
          color: '#EF4444',
          priority: true,
        });
      }
    }
  }

  // Sort by distance and show top 3 closest tactical indicators on the compass ring
  targets
    .map((t) => ({
      ...t,
      dist: Math.hypot(t.x - player.x, t.y - player.y),
    }))
    .filter((t) => t.dist > 140)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .forEach((t) => {
      const angle = Math.atan2(t.y - player.y, t.x - player.x);
      const rx = px + Math.cos(angle) * (compassRadius + 10);
      const ry = py + Math.sin(angle) * (compassRadius + 10) * Math.max(0.65, tiltFactor);

      // Directional Chevron Marker
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(angle);

      const pulse = t.priority ? 1 + Math.sin(timeSec * 6) * 0.15 : 1;
      ctx.scale(pulse, pulse);

      ctx.fillStyle = t.color;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-5, -5);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Compact Distance Readout
      const distMeters = Math.round(t.dist / 6);
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.fillText(`${t.label} ${distMeters}m`, rx, ry - 9);
    });

  ctx.restore();
}

/**
 * Draws the Real-Time Open-World Tactical Radar Minimap
 */
export function drawTacticalMinimap(
  ctx: CanvasRenderingContext2D,
  mapSize: number,
  player: ActiveCharacter,
  npcs: ActiveCharacter[],
  zones: TerritoryZone[],
  gatesUnlocked: boolean
) {
  const scale = mapSize / WORLD_SIZE;

  ctx.clearRect(0, 0, mapSize, mapSize);
  ctx.fillStyle = '#070C18';
  ctx.fillRect(0, 0, mapSize, mapSize);

  // Roads on Minimap
  ctx.strokeStyle = '#334155';
  for (const r of ROADS) {
    ctx.lineWidth = Math.max(2, r.width * scale);
    ctx.beginPath();
    ctx.moveTo(r.x1 * scale, r.y1 * scale);
    ctx.lineTo(r.x2 * scale, r.y2 * scale);
    ctx.stroke();
  }

  // Connaught Circle
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(1600 * scale, 560 * scale, 240 * scale, 0, Math.PI * 2);
  ctx.stroke();

  // 2.5D Buildings & Monuments
  for (const s of STRUCTURES_25D) {
    ctx.fillStyle = s.type.includes('YANTRA') || s.type === 'JAI_PRAKASH' ? '#B84A39' : '#475569';
    ctx.fillRect(s.x * scale, s.y * scale, s.width * scale, s.depth * scale);
  }

  // Territory Zones
  for (const z of zones) {
    ctx.fillStyle =
      z.owner === 'PROTESTER'
        ? 'rgba(255, 153, 51, 0.45)'
        : z.owner === 'POLICE'
        ? 'rgba(59, 130, 246, 0.45)'
        : 'rgba(148, 163, 184, 0.3)';
    ctx.strokeStyle =
      z.owner === 'PROTESTER'
        ? '#FF9933'
        : z.owner === 'POLICE'
        ? '#3B82F6'
        : '#CBD5E1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(z.x * scale, z.y * scale, z.radius * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Metro Gates
  for (const g of METRO_GATES) {
    ctx.fillStyle = gatesUnlocked ? '#10B981' : '#64748B';
    ctx.fillRect(g.x * scale - 3, g.y * scale - 3, 6, 6);
  }

  // NPCs (Police & Protesters)
  for (const n of npcs) {
    if (n.captured) continue;
    ctx.fillStyle = n.faction === 'POLICE' ? '#38BDF8' : '#FF9933';
    ctx.beginPath();
    ctx.arc(n.x * scale, n.y * scale, n.isPrimaryTarget ? 4 : 2.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Player Position Pulse
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(player.x * scale, player.y * scale, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = player.faction === 'POLICE' ? '#38BDF8' : '#FF9933';
  ctx.lineWidth = 2;
  ctx.stroke();
}

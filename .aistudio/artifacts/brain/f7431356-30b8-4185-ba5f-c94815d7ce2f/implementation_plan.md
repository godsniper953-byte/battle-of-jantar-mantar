# Battle of Jantar Mantar — 2.5D Open-World New Delhi Sandbox

An expansive, top-down 2.5D open-world stealth, parkour, and pursuit sandbox set across a seamless, stylized recreation of central New Delhi—spanning **Jantar Mantar**, **Connaught Place**, **Sansad Marg**, **Janpath Market**, and **Metro Station** hubs. Players choose between **Police (The Pursuers)** and **Protesters (The Escape Artists)** with full 360-degree movement, dynamic 5-star Heat levels, interactive territory control zones, emergent citywide chases, and a real-time tactical radar minimap.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The open-world architecture and gameplay loop have been updated to reflect your confirmed choices:

- **Confirmed Decision 1 — Top-Down 2.5D Open-World Perspective (360° Movement)**: Transforms the game from a single-axis side-scroller into a full 2D/2.5D oblique top-down open world (`3200px × 3200px` seamless city grid) with extruded 2.5D architectural depth, directional cast shadows, and smooth 360-degree movement (`WASD` / Arrow keys / virtual 360° thumbstick), obstacle vaulting, stealth cover, and tactical abilities.
- **Confirmed Decision 2 — Dynamic Sandbox with Heat Levels, Territory Zones & Emergent Chases**:
  - **Protester Sandbox Loop**: Freely explore New Delhi districts, capture/rally **5 Territory Zones** (raise banners & broadcast megaphones), evade escalating **1–5 Star Police Heat Levels** (patrol officers $\rightarrow$ rapid response squads $\rightarrow$ searchlight blockades), duck into Shamiana Tents, Chai Stalls, or Metro Undercrofts to lose heat, and extract via active **Metro Gates** once citywide momentum is achieved.
  - **Police Sandbox Loop**: Patrol the interconnected boulevards, track live dispatch blips on the **Tactical City Minimap**, intercept Protester cells attempting to rally districts, use the **Patrol Whistle** to summon AI squad reinforcements, and execute **Capture Lunges** to apprehend key leaders and secure the city.
- **Confirmed Decision 3 — Seamless Multi-District New Delhi Map & Time-of-Day Presets**: All districts (**Jantar Mantar Observatory Park**, **Connaught Place Georgian Colonnade Circle**, **Sansad Marg Boulevard**, **Janpath Bazaar**, and **Patel Chowk & Rajiv Chowk Metro Hubs**) are seamlessly connected in one world, playable across three atmospheric lighting modes (*Golden Hour Sunset*, *Dusk Blockade*, and *Midnight Curfew*).

---

## 1. Overview & Core Concept

- **What It Does**: Delivers a 60fps HTML5 Canvas 2.5D open-world sandbox wrapped in a low-occlusion tactical HUD. Players navigate tree-lined avenues, monument plazas, circular colonnades, and bazaar alleys with complete directional freedom, engaging in emergent cat-and-mouse pursuits.
- **Target Audience / Persona**: Players who enjoy top-down open-world action-stealth games (inspired by classic top-down urban sandboxes and tactical heist/evasion games) with rich regional art direction and immediate arcade accessibility.
- **Key Value**: Combines the visual charm of hand-crafted 2.5D New Delhi landmarks with systemic open-world replayability—where every chase spirals organically across avenues, parks, barricaded intersections, and metro plazas.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Main Menu & Live 2.5D Open-World Flyover**: The title screen renders a live, orbiting 2.5D camera flyover of the Jantar Mantar and Connaught Place open-world map with patrolling officers, fleeing runners, traffic barricades, and drifting golden particles, paired with the custom SVG title lockup and main navigation (`PLAY OPEN WORLD`, `SELECT CHARACTER`, `WORLD SETTINGS / TIME OF DAY`, `SETTINGS`, `HOW TO PLAY`).
2. **Choose Your Side & Character Outfits**: Two side-by-side faction cards (**POLICE — THE PURSUERS** and **PROTESTERS — THE ESCAPE ARTISTS**) featuring live animated character previews, 6 unlocked outfits with open-world stat perks, and faction ability breakdowns.
3. **World Lighting / Mode Selector**: Allows players to choose the open-world atmosphere and patrol intensity before deploying (all unlocked from the start):
   - **Golden Hour Uprising (Sunset)** — Balanced patrols, warm sandstone shadows, and clear visibility across all 5 districts.
   - **High-Alert Blockade (Dusk)** — Heavy steel barricade cordons along Sansad Marg and increased AI squad density.
   - **Midnight Curfew (Night)** — Darkened streets illuminated by sweeping searchlight cones, glowing streetlamps, and high-stakes stealth.
4. **Active Open-World Gameplay & Perimeter HUD**:
   - **Top-Left Cluster**: Health bar, Stamina bar, Tactical Ability status (`[Q] Patrol Whistle` / `[Q] Smoke Decoy`), and current **District Name** badge.
   - **Top-Center Cluster**: **City Territory Control Meter** (tracking the 5 landmark zones), **Heat / Alert Level (1–5 Stars)**, active dynamic dispatch objective, and session timer/score (`tabular-nums`).
   - **Top-Right Radar Minimap & Pause**: Real-time **Circular / Square Tactical Minimap** showing roads, Jantar Mantar & Connaught Place geometry, territory zone rings, player position, police patrol cones, target runners, Metro extraction gates, and a full-map toggle (`[M]`).
   - **World-Space Prompts**: Contextual `[E] RALLY ZONE` / `[E] SECURE ZONE`, `[E] CAPTURE TARGET` / `[E] VAULT BARRICADE`, `[S] HIDE IN COVER`, and off-screen directional chevrons pointing toward active objectives.

### Visual Identity & Theme

- **Aesthetic Direction**: Top-down 2.5D oblique architectural illustration—buildings, monument sundials, buses, and tents render both their footprint and extruded vertical facades + roof tops with soft directional shadows.
- **Color Palette & 60-30-10 Discipline**:
  - **60% Dominant World Canvas**: Asphalt boulevards (`#1E293B`), Connaught Place sandstone walkways (`#334155`), and Jantar Mantar lush lawn greens (`#14532D` / `#0F291E`).
  - **30% Extruded 2.5D Architecture**: Terracotta Jantar Mantar monuments (`#B84A39` walls, `#FDE68A` trim), Connaught Place Georgian white-and-cream colonnades (`#E2E8F0`), and dark slate HUD panels (`#0B132B`).
  - **10% High-Intent Accents**: Saffron (`#FF9933`) for Protester control zones and primary CTAs; Police Beacon Blue/Red (`#3B82F6` / `#EF4444`) for heat stars, sirens, and police zones; Emerald Green (`#10B981`) for stealth cover and Metro extraction points.
- **Typography & Hierarchy**: `Barlow Condensed` for district headers and banners, `Plus Jakarta Sans` for clean UI labels, and `JetBrains Mono` (`tabular-nums`) for coordinates, radar distances, heat timers, and scores.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Top-Down 2.5D Oblique Projection Engine with 360° Physics**
  - *Chosen Approach*: Render a `3200 × 3200` world coordinate space where every building, monument (Samrat Yantra, Ram Yantra, Jai Prakash Yantra), Connaught Place block, bus, tent, and character is drawn with 2.5D vertical extrusion and Y-sorted painter's algorithm (`sort by world Y`) so characters naturally walk behind tall monuments and in front of southern facades.
  - *Why*: Gives players true 360-degree open-world exploration across recognizable New Delhi streets and plazas while maintaining crisp 60fps performance and expressive 2D character animation.
- **Decision 2: Emergent 5-Star Heat & 5-District Territory Control Loop**
  - *Chosen Approach*: Populate the map with 5 iconic landmark zones (*Jantar Mantar Core*, *Sansad Marg Cordon*, *Connaught Outer Circle*, *Janpath Bazaar*, and *Patel Chowk Metro Plaza*). Protesters rally zones to unlock Metro extraction while evading escalating Heat stars; Police respond to live zone alerts and hunt down Protester leaders.
  - *Why*: Turns the map into a living, replayable sandbox with constant tactical choices (which route to take, when to hide in cover to drop Heat, and where to ambush or evade).

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     App Shell & Open-World State Machine                     │
│   (Screen: MAIN_MENU | SELECT_CHARACTER | WORLD_MODES | PLAYING | RESULTS)   │
└───────────────┬──────────────────────────────────────────────┬───────────────┘
                │                                              │
                ▼                                              ▼
┌───────────────────────────────┐              ┌───────────────────────────────┐
│     Menu & Modal Views        │              │  Active 2.5D Open-World View  │
│ ┌───────────────────────────┐ │              │ ┌───────────────────────────┐ │
│ │ Main Menu (Live 2.5D Map) │ │              │ │ 60fps 2.5D World Canvas   │ │
│ ├───────────────────────────┤ │              │ │ - 3200x3200 Seamless City │ │
│ │ Choose Your Side & Outfit │ │              │ │ - Y-Sorted 2.5D Buildings │ │
│ ├───────────────────────────┤ │              │ │ - 5 Landmark Zones        │ │
│ │ World Time/Preset Select  │ │              │ │ - 360° AI Sight & Chases  │ │
│ ├───────────────────────────┤ │              │ └─────────────┬─────────────┘ │
│ │ Settings & How To Play    │ │              │               │               │
│ ├───────────────────────────┤ │              │ ┌─────────────▼─────────────┐ │
│ │ Pause & Sandbox Summary   │ │              │ │ Tactical Radar Minimap,   │ │
│ └───────────────────────────┘ │              │ │ Heat Stars & 360° Touch   │ │
│                               │              │ └───────────────────────────┘ │
└───────────────┬───────────────┘              └───────────────┬───────────────┘
                │                                              │
                └──────────────────────┬───────────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 Core Game Services & Persistent Storage                      │
│  ┌─────────────────────────┐  ┌────────────────────┐  ┌───────────────────┐  │
│  │ 360° Input Manager      │  │ Web Audio Synth    │  │ LocalStorage      │  │
│  │ (WASD/Arrows + Vault +  │  │ (Adaptive Heat     │  │ (Settings, Best   │  │
│  │  Virtual Joystick)      │  │  Music & Dispatch) │  │  Sandbox Scores)  │  │
│  └─────────────────────────┘  └────────────────────┘  └───────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **Open-World Map Entities (`3200 × 3200` World)**:
  - `districts`: Named bounding regions (*Jantar Mantar Park*, *Sansad Marg Avenue*, *Connaught Place Circle*, *Janpath Market*, *Metro Hub*) that update the HUD location banner as the player moves.
  - `structures25D`: Impassable 2.5D extruded buildings and monuments (`MONUMENT_SAMRAT`, `MONUMENT_RAM`, `MONUMENT_JAI`, `CP_COLONNADE`, `METRO_STATION`, `NDMC_TOWER`) with collision footprints and extruded roof heights.
  - `barricades`: Jumpable/vaultable street barriers (`DELHI_BARRICADE`, `POLICE_VAN`, `JERSEY_BARRIER`, `TEA_CART`) placed across road intersections and plaza entrances.
  - `coverZones`: Stealth conceal spots (`SHAMIANA_TENT`, `BANYAN_GROVE`, `CHAI_BAZAAR`, `METRO_ALCOVE`) where holding `[C]` / `[Shift-Crouch]` or `[Space/S]` conceals the player and rapidly decays Police Heat stars.
  - `territoryZones`: 5 interactive circular control points with capture progress (`0..100%`), owner state (`NEUTRAL`, `PROTESTER`, `POLICE`), and world-space progress rings.
  - `extractionGates`: 3 Metro Station entrances that open for final extraction once Protesters rally at least 3 of the 5 districts (or serve as spawn/patrol hubs for Police).
- **360° Character & AI Simulation State**:
  - `x, y`: 2D world ground coordinates; `z, vz`: vertical jump/vault height above ground for leaping over street barricades!
  - `vx, vy`: 360-degree velocity vector; `facingAngle`: smooth directional angle (plus left/right sprite flip).
  - `heatLevel`: `1..5` stars driven by line-of-sight detection, zone captures, and whistle alerts, dynamically scaling AI pursuit speed and reinforcement spawns.

### Interactive Component & State Mapping

- **360° Open-World Controls**:
  - `W / A / S / D` or `Arrow Keys` (or Mobile 360° Virtual Thumbstick): Smooth 8-directional / 360° movement across roads, lawns, and alleys.
  - `Space`: Jump / Vault in 2.5D (`z`-axis vertical leap allowing players to jump cleanly over steel barricades and hedges).
  - `Shift`: Sprint (boosts movement speed, drains stamina, leaves dust trails).
  - `C` (or `Left Ctrl` / Touch `HIDE` button): Crouch & Stealth Conceal inside Shamiana Tents, Banyan Groves, or Bazaar Stalls to break police sight cones and lower Heat stars.
  - `E`: Context Action — **Police**: Execute a 360° directional **Capture Lunge** toward a Protester or secure a contested zone; **Protester**: **Rally Territory Zone** faster or perform a directional **Adrenaline Dash-Vault**.
  - `Q` / `F`: Faction Tactical Skill — **Police Whistle** (pings all Protesters on the radar minimap, exposes hidden runners within range, and calls AI officers to your coordinates) or **Protester Saffron Smoke Decoy** (drops a large 2.5D smoke cloud that blocks police vision cones and drops Heat).
  - `M` / `Tab`: Toggle expanded Tactical City Map overlay.

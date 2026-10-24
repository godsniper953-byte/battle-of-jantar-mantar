/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import {
  AudioSettings,
  FactionId,
  GameResult,
  HighScoreRecord,
  LevelId,
  ModalState,
  OutfitConfig,
  ScreenState,
  SubtitleCue,
} from './types/game';
import { LEVELS, OUTFITS } from './data/gameData';
import { soundEngine } from './audio/soundEngine';
import { GameCanvas } from './components/GameCanvas';
import {
  ChooseYourSideView,
  GameModesView,
  HowToPlayModal,
  MainMenuView,
  PauseModal,
  ResultsView,
  SettingsModal,
} from './components/MenuViews';

const STORAGE_KEYS = {
  SETTINGS: 'bjm_settings_v1',
  HIGH_SCORES: 'bjm_high_scores_v1',
};

const DEFAULT_SETTINGS: AudioSettings = {
  musicVolume: 70,
  sfxVolume: 85,
  ambienceVolume: 60,
  muted: false,
  subtitles: true,
  showTouchControls: false,
  screenShake: true,
  highContrastHud: false,
};

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('MAIN_MENU');
  const [modal, setModal] = useState<ModalState>('NONE');

  const [selectedFaction, setSelectedFaction] = useState<FactionId>('PROTESTER');
  const [selectedLevel, setSelectedLevel] = useState<LevelId>('street_pursuit');

  const [policeOutfit, setPoliceOutfit] = useState<OutfitConfig>(
    () => OUTFITS.find((o) => o.id === 'police_khaki')!
  );
  const [protesterOutfit, setProtesterOutfit] = useState<OutfitConfig>(
    () => OUTFITS.find((o) => o.id === 'protester_saffron')!
  );

  const [settings, setSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore storage errors
    }
    return DEFAULT_SETTINGS;
  });

  const [highScores, setHighScores] = useState<Record<string, HighScoreRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HIGH_SCORES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return {};
  });

  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [runKey, setRunKey] = useState<number>(1);
  const [activeSubtitle, setActiveSubtitle] = useState<SubtitleCue | null>(null);

  // Sync audio settings with soundEngine and localStorage
  useEffect(() => {
    soundEngine.updateSettings(settings);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Subscribe to live audio subtitles
  useEffect(() => {
    const unsub = soundEngine.onSubtitle((cue) => {
      setActiveSubtitle(cue);
    });
    return unsub;
  }, []);

  // Auto-clear subtitle after 3.8 seconds
  useEffect(() => {
    if (!activeSubtitle) return;
    const timer = window.setTimeout(() => {
      setActiveSubtitle(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [activeSubtitle]);

  const handlePauseToggle = useCallback(() => {
    setModal((prev) => (prev === 'PAUSED' ? 'NONE' : 'PAUSED'));
  }, []);

  const handleGameEnd = useCallback(
    (result: GameResult) => {
      setLastResult(result);
      setModal('NONE');
      setScreen('RESULTS');

      if (result.won) {
        const key = `${result.levelId}_${result.faction}`;
        setHighScores((prev) => {
          const existing = prev[key];
          const updated: HighScoreRecord = {
            bestScore: existing ? Math.max(existing.bestScore, result.score) : result.score,
            fastestTime: existing
              ? Math.min(existing.fastestTime, result.timeTaken)
              : result.timeTaken,
            wins: (existing?.wins ?? 0) + 1,
          };
          const nextMap = { ...prev, [key]: updated };
          try {
            localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(nextMap));
          } catch {
            // ignore
          }
          return nextMap;
        });
      }
    },
    []
  );

  const activeOutfit = selectedFaction === 'POLICE' ? policeOutfit : protesterOutfit;
  const activeLevelConfig = LEVELS[selectedLevel];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0B132B] text-[#F8FAFC]">
      {/* 1. MAIN MENU */}
      {screen === 'MAIN_MENU' && (
        <MainMenuView
          selectedFaction={selectedFaction}
          selectedLevel={selectedLevel}
          onPlayGame={() => setScreen('SELECT_CHARACTER')}
          onSelectCharacter={() => setScreen('SELECT_CHARACTER')}
          onSelectModes={() => setScreen('GAME_MODES')}
          onOpenSettings={() => setModal('SETTINGS')}
          onOpenHowToPlay={() => setModal('HOW_TO_PLAY')}
        />
      )}

      {/* 2. CHOOSE YOUR SIDE / CHARACTER OUTFITS */}
      {screen === 'SELECT_CHARACTER' && (
        <ChooseYourSideView
          selectedFaction={selectedFaction}
          selectedPoliceOutfit={policeOutfit}
          selectedProtesterOutfit={protesterOutfit}
          onSelectPoliceOutfit={(o) => {
            setPoliceOutfit(o);
            setSelectedFaction('POLICE');
          }}
          onSelectProtesterOutfit={(o) => {
            setProtesterOutfit(o);
            setSelectedFaction('PROTESTER');
          }}
          onConfirmPlay={(faction) => {
            setSelectedFaction(faction);
            setModal('NONE');
            setRunKey((k) => k + 1);
            setScreen('PLAYING');
          }}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* 3. GAME MODES & STAGE SELECTOR */}
      {screen === 'GAME_MODES' && (
        <GameModesView
          selectedFaction={selectedFaction}
          selectedLevel={selectedLevel}
          highScores={highScores}
          onSelectFaction={(f) => setSelectedFaction(f)}
          onSelectLevel={(l) => setSelectedLevel(l)}
          onStartLevel={(l) => {
            setSelectedLevel(l);
            setModal('NONE');
            setRunKey((k) => k + 1);
            setScreen('PLAYING');
          }}
          onBack={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* 4. ACTIVE 60FPS GAMEPLAY VIEWPORT */}
      {screen === 'PLAYING' && (
        <GameCanvas
          key={runKey}
          faction={selectedFaction}
          outfit={activeOutfit}
          level={activeLevelConfig}
          settings={settings}
          isPaused={modal !== 'NONE'}
          onPauseToggle={handlePauseToggle}
          onGameEnd={handleGameEnd}
        />
      )}

      {/* 5. RESULTS / GAME OVER SCREEN */}
      {screen === 'RESULTS' && lastResult && (
        <ResultsView
          result={lastResult}
          onReplay={() => {
            setModal('NONE');
            setRunKey((k) => k + 1);
            setScreen('PLAYING');
          }}
          onSelectLevel={() => setScreen('GAME_MODES')}
          onMainMenu={() => setScreen('MAIN_MENU')}
        />
      )}

      {/* OVERLAY MODALS */}
      {modal === 'PAUSED' && screen === 'PLAYING' && (
        <PauseModal
          onResume={() => setModal('NONE')}
          onRestart={() => {
            setModal('NONE');
            setRunKey((k) => k + 1);
          }}
          onOpenSettings={() => setModal('SETTINGS')}
          onMainMenu={() => {
            setModal('NONE');
            setScreen('MAIN_MENU');
          }}
        />
      )}

      {modal === 'SETTINGS' && (
        <SettingsModal
          settings={settings}
          onChange={setSettings}
          onClose={() => setModal(screen === 'PLAYING' ? 'PAUSED' : 'NONE')}
        />
      )}

      {modal === 'HOW_TO_PLAY' && (
        <HowToPlayModal onClose={() => setModal('NONE')} />
      )}

      {/* ACCESSIBILITY SUBTITLE CAPTION BAR */}
      {settings.subtitles && activeSubtitle && (
        <div className="pointer-events-none fixed bottom-16 left-1/2 -translate-x-1/2 z-50 max-w-xl px-4 py-1.5 rounded bg-black/85 border border-slate-700 text-xs font-medium tracking-wide shadow-lg text-center">
          <span className="font-bold mr-1.5" style={{ color: activeSubtitle.color }}>
            [{activeSubtitle.speaker}]
          </span>
          <span className="text-slate-100">{activeSubtitle.text}</span>
        </div>
      )}
    </main>
  );
}

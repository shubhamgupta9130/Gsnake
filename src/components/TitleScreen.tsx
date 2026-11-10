import React from 'react';
import { GameMode, Difficulty } from '../game/rules.ts';
import { Play, Shield, Shuffle, Zap, Trophy, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface TitleScreenProps {
  onStart: () => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  highScore: number;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStart,
  gameMode,
  setGameMode,
  difficulty,
  setDifficulty,
  highScore,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-6 sm:p-10 bg-[#090d16]/95 backdrop-blur-sm text-slate-100 select-none">
      {/* Top Header Row with Sound Toggle and High Score */}
      <header className="w-full max-w-2xl flex items-center justify-between text-xs sm:text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="uppercase tracking-wider font-semibold text-slate-300">Best Run</span>
          <span className="font-mono text-amber-400 text-sm font-bold tabular-nums">{highScore}</span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onToggleMute();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/70 bg-slate-800/60 hover:bg-slate-700/60 transition-colors text-slate-300 cursor-pointer"
          aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span className="text-xs font-medium">{isMuted ? 'Muted' : 'Sound On'}</span>
        </button>
      </header>

      {/* Hero Showcase Lockup */}
      <main className="flex flex-col items-center text-center my-auto max-w-xl w-full">
        {/* Custom Inline SVG Viper Emblem */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="absolute -inset-4 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />
          <svg className="w-24 h-24 sm:w-28 sm:h-28 text-emerald-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="45" stroke="#1e293b" strokeWidth="4" />
            <path
              d="M25 65 C25 45, 45 45, 45 30 C45 22, 55 22, 55 30 C55 45, 75 45, 75 65"
              stroke="url(#snakeGrad)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Viper Head */}
            <path
              d="M70 62 L82 72 L70 82 Z"
              fill="#10b981"
            />
            {/* Eye */}
            <circle cx="75" cy="70" r="2.5" fill="#090d16" />
            <circle cx="75" cy="70" r="1" fill="#ffffff" />
            {/* Apple */}
            <circle cx="34" cy="72" r="6" fill="#ef4444" />
            <path d="M35 66 Q37 63 39 65" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
            <defs>
              <linearGradient id="snakeGrad" x1="25" y1="30" x2="75" y2="70" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#34d399" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase mb-2">
          Neon <span className="text-emerald-400">Viper</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mb-8 max-w-sm">
          Precision arcade snake with dynamic power-ups, combo multipliers, and fluid responsive physics.
        </p>

        {/* Game Mode Selector */}
        <div className="w-full mb-5">
          <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
            Game Mode
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                sound.playClick();
                setGameMode('classic');
              }}
              className={`flex flex-col items-center py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                gameMode === 'classic'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4 mb-1" />
              Classic
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setGameMode('portal');
              }}
              className={`flex flex-col items-center py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                gameMode === 'portal'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shuffle className="w-4 h-4 mb-1" />
              Portal Wrap
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setGameMode('obstacles');
              }}
              className={`flex flex-col items-center py-2 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                gameMode === 'obstacles'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4 mb-1" />
              Obstacles
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div className="w-full mb-8">
          <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">
            Speed & Difficulty
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map(diff => (
              <button
                key={diff}
                onClick={() => {
                  sound.playClick();
                  setDifficulty(diff);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  difficulty === diff
                    ? 'bg-slate-700 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {diff === 'easy' ? 'Casual' : diff === 'normal' ? 'Normal' : 'Insane'}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Start CTA */}
        <button
          data-start="true"
          onClick={() => {
            sound.playClick();
            onStart();
          }}
          className="w-full sm:w-64 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          Start Game
        </button>
      </main>

      {/* Control Hint in Bottom Safe Margin */}
      <footer className="text-center text-xs text-slate-500">
        <span>WASD or Arrow Keys to Steer</span>
        <span className="mx-2">·</span>
        <span>Space or Enter to Start</span>
        <span className="mx-2">·</span>
        <span>P or Esc to Pause</span>
      </footer>
    </div>
  );
};

import React from 'react';
import { Volume2, VolumeX, Pause, RotateCcw, Flame, Snowflake } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface GameHudProps {
  score: number;
  highScore: number;
  length: number;
  combo: number;
  powerUp: { type: string; timeLeft: number } | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onRestart: () => void;
}

export const GameHud: React.FC<GameHudProps> = ({
  score,
  highScore,
  length,
  combo,
  powerUp,
  isMuted,
  onToggleMute,
  onPause,
  onRestart,
}) => {
  return (
    <div className="absolute top-0 inset-x-0 z-10 p-3 sm:p-4 pointer-events-none flex flex-col gap-2">
      {/* Top Dock Bar */}
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between bg-[#0e1626]/90 border border-slate-800 rounded-xl px-4 py-2.5 shadow-xl">
        {/* Left: Score & High Score */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Score</span>
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white tabular-nums">
              {score}
            </span>
          </div>

          <div className="hidden sm:flex flex-col border-l border-slate-700/60 pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Best</span>
            <span className="text-sm sm:text-base font-bold font-mono tracking-tight text-amber-400 tabular-nums">
              {Math.max(score, highScore)}
            </span>
          </div>

          <div className="flex flex-col border-l border-slate-700/60 pl-3 sm:pl-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Length</span>
            <span className="text-sm sm:text-base font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
              {length}
            </span>
          </div>
        </div>

        {/* Center: Active Combo & Power-Up Indicators */}
        <div className="flex items-center gap-3">
          {combo > 1 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-lg animate-pulse">
              <span className="text-[11px] font-black text-amber-400 font-mono tracking-wider">
                {combo}x COMBO
              </span>
            </div>
          )}

          {powerUp && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                powerUp.type === 'speed'
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                  : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
              }`}
            >
              {powerUp.type === 'speed' ? (
                <Flame className="w-3.5 h-3.5 fill-current animate-bounce" />
              ) : (
                <Snowflake className="w-3.5 h-3.5 animate-spin" />
              )}
              <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                {powerUp.type === 'speed' ? 'Speed' : 'Freeze'} {powerUp.timeLeft}s
              </span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            tabIndex={-1}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            title="Mute / Unmute (M)"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onPause();
            }}
            tabIndex={-1}
            aria-label="Pause Game"
            title="Pause Game (P or Esc)"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            tabIndex={-1}
            aria-label="Restart Game"
            title="Restart Run (R)"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

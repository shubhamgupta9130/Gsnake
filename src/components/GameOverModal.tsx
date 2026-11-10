import React, { useEffect } from 'react';
import { Play, Home, Trophy, Apple, Clock, Ruler } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface GameOverModalProps {
  score: number;
  highScore: number;
  length: number;
  apples: number;
  timeSeconds: number;
  isNewHigh: boolean;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  length,
  apples,
  timeSeconds,
  isNewHigh,
  onRestart,
  onHome,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.playClick();
        onRestart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRestart]);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#090d16]/85 select-none">
      <div className="w-full max-w-md bg-[#0e1626] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Game Over Header */}
        {isNewHigh ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 animate-bounce">
            <Trophy className="w-3.5 h-3.5" />
            New High Score!
          </div>
        ) : (
          <span className="text-xs uppercase font-bold tracking-widest text-rose-400 mb-1">
            Run Ended
          </span>
        )}

        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-white mb-2">
          Game Over
        </h2>

        {/* Hero Score Tile */}
        <div className="my-4 py-3 px-6 bg-slate-900/80 border border-slate-800 rounded-xl w-full">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
            Final Score
          </span>
          <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tabular-nums">
            {score}
          </span>
        </div>

        {/* 3 Metric Tiles */}
        <div className="grid grid-cols-3 gap-2 w-full mb-6">
          <div className="flex flex-col items-center p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <Ruler className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Length</span>
            <span className="text-sm font-bold font-mono text-slate-200 tabular-nums">{length}</span>
          </div>

          <div className="flex flex-col items-center p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <Apple className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Apples</span>
            <span className="text-sm font-bold font-mono text-slate-200 tabular-nums">{apples}</span>
          </div>

          <div className="flex flex-col items-center p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80">
            <Clock className="w-4 h-4 text-sky-400 mb-1" />
            <span className="text-[10px] uppercase font-bold text-slate-400">Time</span>
            <span className="text-sm font-bold font-mono text-slate-200 tabular-nums">{timeSeconds}s</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            data-start="true"
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Play Again (Enter)
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onHome();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/audio.ts';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#090d16]/80 select-none">
      <div className="w-full max-w-sm bg-[#0e1626] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Title */}
        <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-2">
          Game Paused
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Press <span className="font-mono text-emerald-400">Esc</span> or <span className="font-mono text-emerald-400">P</span> to resume instantly
        </p>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5 mb-6">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Resume
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Restart Run
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

        {/* Quick Settings & Controls */}
        <div className="w-full pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Sound Effects</span>
          <button
            onClick={() => {
              sound.playClick();
              onToggleMute();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'Muted' : 'Enabled'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

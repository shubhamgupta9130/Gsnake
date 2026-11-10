import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Direction } from '../game/rules.ts';

interface MobileControlsProps {
  onDirection: (dir: Direction) => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onDirection }) => {
  return (
    <div className="sm:hidden absolute bottom-4 inset-x-0 z-20 flex justify-center pointer-events-none select-none">
      <div className="grid grid-cols-3 gap-2 w-48 p-2 bg-[#090d16]/80 rounded-2xl border border-slate-800 pointer-events-auto backdrop-blur-sm">
        <div />
        <button
          onClick={() => onDirection('UP')}
          aria-label="Move Up"
          className="h-12 flex items-center justify-center rounded-xl bg-slate-800/90 active:bg-emerald-500 active:text-slate-950 text-slate-200 border border-slate-700 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          onClick={() => onDirection('LEFT')}
          aria-label="Move Left"
          className="h-12 flex items-center justify-center rounded-xl bg-slate-800/90 active:bg-emerald-500 active:text-slate-950 text-slate-200 border border-slate-700 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={() => onDirection('DOWN')}
          aria-label="Move Down"
          className="h-12 flex items-center justify-center rounded-xl bg-slate-800/90 active:bg-emerald-500 active:text-slate-950 text-slate-200 border border-slate-700 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        <button
          onClick={() => onDirection('RIGHT')}
          aria-label="Move Right"
          className="h-12 flex items-center justify-center rounded-xl bg-slate-800/90 active:bg-emerald-500 active:text-slate-950 text-slate-200 border border-slate-700 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

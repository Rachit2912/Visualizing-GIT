import React, { useEffect, useState } from 'react';
import { AnimationEvent } from '../types/git';
import { Play, CheckCircle2, X } from 'lucide-react';

interface AnimationBannerProps {
  events: AnimationEvent[];
  onDismiss?: () => void;
}

export const AnimationBanner: React.FC<AnimationBannerProps> = ({ events, onDismiss }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    if (events.length > 0) {
      setDismissed(false);
      setCurrentIndex(0);
      setIsPlaying(true);
      const timer = setTimeout(() => {
        setIsPlaying(false);
      }, events.length * 1500);

      return () => clearTimeout(timer);
    }
  }, [events]);

  useEffect(() => {
    if (isPlaying && currentIndex < events.length - 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, events.length - 1));
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentIndex, events.length]);

  if (events.length === 0 || dismissed) return null;

  const activeEvent = events[currentIndex];

  return (
    <div className="bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 border border-sky-500/60 rounded-md px-3 py-1.5 shadow-md flex items-center justify-between text-sky-100 my-1">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-xs shadow">
          {isPlaying ? <Play className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
            STATE CHANGE ({currentIndex + 1}/{events.length}):
          </span>
          <span className="text-xs font-bold text-slate-100 font-mono">
            {activeEvent?.description}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono bg-sky-900/80 text-sky-300 px-2 py-0.5 rounded border border-sky-700">
          {activeEvent?.type}
        </span>
        <button
          onClick={() => {
            setDismissed(true);
            if (onDismiss) onDismiss();
          }}
          className="text-slate-400 hover:text-white p-0.5 rounded transition"
          title="Close notification banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

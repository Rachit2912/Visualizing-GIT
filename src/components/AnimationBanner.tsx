import React, { useEffect } from 'react';
import { AnimationEvent } from '../types/git';
import { Play, CheckCircle2 } from 'lucide-react';

interface AnimationBannerProps {
  events: AnimationEvent[];
  onComplete?: () => void;
}

export const AnimationBanner: React.FC<AnimationBannerProps> = ({ events, onComplete }) => {
  const [currentIndex, setCurrentIndex] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);

  useEffect(() => {
    if (events.length > 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
      const timer = setTimeout(() => {
        setIsPlaying(false);
        if (onComplete) onComplete();
      }, events.length * 1500);

      return () => clearTimeout(timer);
    }
  }, [events, onComplete]);

  useEffect(() => {
    if (isPlaying && currentIndex < events.length - 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, events.length - 1));
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, currentIndex, events.length]);

  if (events.length === 0) return null;

  const activeEvent = events[currentIndex];

  return (
    <div className="bg-sky-950/90 border border-sky-500/50 rounded-lg p-3 shadow-lg flex items-center justify-between text-sky-100 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
          {isPlaying ? <Play className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        </div>
        <div>
          <div className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
            ANIMATING STATE CHANGE ({currentIndex + 1} of {events.length})
          </div>
          <div className="text-xs font-semibold text-slate-100 font-mono">
            {activeEvent?.description}
          </div>
        </div>
      </div>
      <div className="text-[11px] font-mono bg-sky-900/60 text-sky-300 px-2.5 py-1 rounded border border-sky-700">
        Event: {activeEvent?.type}
      </div>
    </div>
  );
};

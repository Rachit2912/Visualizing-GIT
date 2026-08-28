import React from 'react';
import { Explanation } from '../types/git';
import { HelpCircle, CheckCircle, Info, Sparkles } from 'lucide-react';

interface ExplanationPanelProps {
  explanation: Explanation | null;
  mode: 'beginner' | 'underTheHood';
  onToggleMode: (mode: 'beginner' | 'underTheHood') => void;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({
  explanation,
  mode,
  onToggleMode,
}) => {
  if (!explanation) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 h-full flex flex-col justify-center items-center text-center text-slate-500">
        <HelpCircle className="w-8 h-8 text-slate-700 mb-1.5" />
        <p className="text-xs font-semibold text-slate-300">No Operation Recorded</p>
        <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
          Execute a Git command to inspect the visual state transition explanation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col h-full shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-slate-100 text-xs tracking-wider uppercase">What Just Happened?</h2>
        </div>
        <div className="inline-flex bg-slate-950 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => onToggleMode('beginner')}
            className={`text-[10px] px-1.5 py-0.5 rounded transition font-semibold ${
              mode === 'beginner' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Beginner
          </button>
          <button
            onClick={() => onToggleMode('underTheHood')}
            className={`text-[10px] px-1.5 py-0.5 rounded transition font-semibold ${
              mode === 'underTheHood' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Under Hood
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
        <div className="bg-slate-950 border border-sky-500/30 rounded p-2.5">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
            {explanation.title}
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">{explanation.whatHappened}</p>
        </div>

        {mode === 'beginner' ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded p-2.5 space-y-1">
            <h4 className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
              <Info className="w-3 h-3 text-emerald-400" /> Purpose
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{explanation.why}</p>
          </div>
        ) : (
          <div className="bg-indigo-950/40 border border-indigo-800/60 rounded p-2.5 space-y-1">
            <h4 className="text-[11px] font-bold text-indigo-400 font-mono">
              [GIT INTERNALS]
            </h4>
            <p className="text-xs font-mono text-indigo-200 leading-relaxed">{explanation.underTheHood}</p>
          </div>
        )}

        {explanation.whatChanged.length > 0 && (
          <div className="bg-slate-950/60 border border-slate-800 rounded p-2.5 space-y-1">
            <h4 className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-amber-400" /> State Changes
            </h4>
            <ul className="space-y-0.5">
              {explanation.whatChanged.map((change, idx) => (
                <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1">
                  <span className="text-amber-400 select-none">•</span>
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

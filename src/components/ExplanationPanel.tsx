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
      <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 h-full flex flex-col justify-center items-center text-center text-slate-400">
        <HelpCircle className="w-10 h-10 text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-300">No command executed yet</p>
        <p className="text-xs text-slate-500 max-w-xs mt-1">
          Type a Git command in the terminal or click an action button to see a visual step-by-step breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 flex flex-col h-full shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">What Just Happened?</h2>
        </div>
        <div className="inline-flex bg-slate-900 p-0.5 rounded border border-slate-700">
          <button
            onClick={() => onToggleMode('beginner')}
            className={`text-[11px] px-2 py-0.5 rounded transition font-medium ${
              mode === 'beginner' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Beginner
          </button>
          <button
            onClick={() => onToggleMode('underTheHood')}
            className={`text-[11px] px-2 py-0.5 rounded transition font-medium ${
              mode === 'underTheHood' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Under the Hood
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        <div className="bg-slate-900/90 border border-sky-500/30 rounded-md p-3">
          <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">
            {explanation.title}
          </h3>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">{explanation.whatHappened}</p>
        </div>

        {mode === 'beginner' ? (
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-md p-3 space-y-1.5">
            <h4 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" /> Why does Git work this way?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{explanation.why}</p>
          </div>
        ) : (
          <div className="bg-indigo-950/30 border border-indigo-800/60 rounded-md p-3 space-y-1.5">
            <h4 className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5 font-mono">
              [UNDER THE HOOD]
            </h4>
            <p className="text-xs font-mono text-indigo-200 leading-relaxed">{explanation.underTheHood}</p>
          </div>
        )}

        {explanation.whatChanged.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-700/80 rounded-md p-3 space-y-1.5">
            <h4 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-amber-400" /> Key State Changes
            </h4>
            <ul className="space-y-1">
              {explanation.whatChanged.map((change, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
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

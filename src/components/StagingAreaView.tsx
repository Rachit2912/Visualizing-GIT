import React from 'react';
import { Layers, ArrowRight, ShieldCheck } from 'lucide-react';

interface StagingAreaViewProps {
  stagingArea: Record<string, string>;
  isInitialized: boolean;
  onCommit: (message: string) => void;
}

export const StagingAreaView: React.FC<StagingAreaViewProps> = ({ stagingArea, isInitialized, onCommit }) => {
  const [commitMessage, setCommitMessage] = React.useState('');

  const handleCommit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    onCommit(commitMessage.trim());
    setCommitMessage('');
  };

  const stagedFiles = Object.entries(stagingArea);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col h-full shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h2 className="font-semibold text-slate-100 text-xs tracking-wider uppercase">Staging Index</h2>
        </div>
        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
          {stagedFiles.length} staged
        </span>
      </div>

      {!isInitialized ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-800 rounded bg-slate-950/40">
          <ShieldCheck className="w-6 h-6 text-slate-600 mb-1" />
          <p className="text-[11px] text-slate-400">Git repository not initialized.</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 mb-2">
            {stagedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-4 text-slate-500 text-xs italic border border-dashed border-slate-800/80 rounded">
                Index is empty.
              </div>
            ) : (
              stagedFiles.map(([filename]) => (
                <div
                  key={filename}
                  className="bg-emerald-950/30 border border-emerald-500/30 rounded px-2 py-1.5 flex items-center justify-between"
                >
                  <span className="font-mono text-xs font-bold text-emerald-300 truncate">{filename}</span>
                  <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1 py-0.2 rounded font-mono font-semibold">
                    STAGED
                  </span>
                </div>
              ))
            )}
          </div>

          {stagedFiles.length > 0 && (
            <form onSubmit={handleCommit} className="bg-slate-950 border border-emerald-500/40 p-2 rounded flex flex-col gap-1.5">
              <input
                type="text"
                placeholder="Commit message (e.g. Add greeting)"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-1 rounded transition flex items-center justify-center gap-1 shadow-sm"
              >
                <ArrowRight className="w-3.5 h-3.5" /> git commit -m "{commitMessage || '...'}"
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
};

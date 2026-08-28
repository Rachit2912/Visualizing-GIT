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
    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 flex flex-col h-full shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">Staging Area (Index)</h2>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
          {stagedFiles.length} file(s) staged
        </span>
      </div>

      {!isInitialized ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-700 rounded bg-slate-900/40">
          <ShieldCheck className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs text-slate-400">Git repository is not initialized yet.</p>
          <p className="text-[11px] text-slate-500 mt-1">Run <code className="text-sky-400">git init</code> to start tracking files.</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
            {stagedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs italic border border-dashed border-slate-700/60 rounded">
                Staging Area is empty.
                <span className="text-[11px] text-slate-500 mt-1">
                  Run <code className="text-emerald-400 font-mono">git add &lt;file&gt;</code> to prepare changes for commit.
                </span>
              </div>
            ) : (
              stagedFiles.map(([filename, content]) => (
                <div
                  key={filename}
                  className="bg-emerald-950/20 border border-emerald-500/30 rounded-md p-2.5 flex flex-col gap-1.5 transition hover:border-emerald-500/60"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-emerald-300">{filename}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      ready to commit
                    </span>
                  </div>
                  <div className="bg-slate-950/80 rounded p-2 text-xs font-mono text-slate-300 overflow-x-auto max-h-20 whitespace-pre">
                    {content || <span className="text-slate-500 italic">(empty file)</span>}
                  </div>
                </div>
              ))
            )}
          </div>

          {stagedFiles.length > 0 && (
            <form onSubmit={handleCommit} className="bg-slate-900/90 border border-emerald-500/40 p-2.5 rounded-md flex flex-col gap-2">
              <label className="text-xs font-semibold text-emerald-400">QUICK COMMIT</label>
              <input
                type="text"
                placeholder="Commit message (e.g. Add greeting)"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-1.5 rounded transition flex items-center justify-center gap-1.5 shadow-sm"
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

import React from 'react';
import { Commit, Head } from '../types/git';
import { GitCommit, GitBranch, ArrowUp, Info, UserPlus } from 'lucide-react';

interface RepositoryGraphProps {
  title: string;
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  head?: Head;
  onSelectCommit: (commit: Commit) => void;
  isRemote?: boolean;
  onSimulateRemoteCommit?: () => void;
}

export const RepositoryGraph: React.FC<RepositoryGraphProps> = ({
  title,
  commits,
  branches,
  head,
  onSelectCommit,
  isRemote = false,
  onSimulateRemoteCommit,
}) => {
  const commitList = Object.values(commits).sort((a, b) => b.timestamp - a.timestamp);

  // Group branches by target commit hash
  const commitBranches: Record<string, string[]> = {};
  Object.entries(branches).forEach(([bName, hash]) => {
    if (hash) {
      if (!commitBranches[hash]) commitBranches[hash] = [];
      commitBranches[hash].push(bName);
    }
  });

  return (
    <div
      className={`border rounded-lg p-3 flex flex-col h-full shadow-2xl backdrop-blur-md ${
        isRemote
          ? 'bg-gradient-to-b from-indigo-950/60 via-slate-900/90 to-slate-950 border-indigo-500/50'
          : 'bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 border-sky-500/50'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${isRemote ? 'bg-indigo-500/20 text-indigo-400' : 'bg-sky-500/20 text-sky-400'}`}>
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-xs tracking-wider uppercase flex items-center gap-2">
              {title}
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono border ${
                isRemote ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40' : 'bg-sky-500/10 text-sky-300 border-sky-500/40'
              }`}>
                DAG Graph ({commitList.length} nodes)
              </span>
            </h2>
          </div>
        </div>

        {isRemote && onSimulateRemoteCommit && (
          <button
            onClick={onSimulateRemoteCommit}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1 rounded transition flex items-center gap-1.5 shadow"
            title="Simulate teammate pushing a commit directly to remote origin"
          >
            <UserPlus className="w-3.5 h-3.5" /> Simulate Teammate Commit
          </button>
        )}
      </div>

      {/* DAG Graph Node View */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 relative font-sans">
        {commitList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-xs italic border border-dashed border-slate-800 rounded">
            No commits created yet in this repository.
          </div>
        ) : (
          commitList.map((commit, index) => {
            const attachedBranches = commitBranches[commit.hash] || [];
            const isHeadTarget =
              head &&
              ((head.type === 'branch' && branches[head.value] === commit.hash) ||
                (head.type === 'detached' && head.value === commit.hash));

            return (
              <div key={commit.hash} className="relative flex items-start gap-3 group">
                {/* Connecting Edge to Parent Node */}
                {index < commitList.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gradient-to-b from-sky-500 to-indigo-600 opacity-60 group-hover:opacity-100 transition" />
                )}

                {/* Commit DAG Node Circle */}
                <button
                  onClick={() => onSelectCommit(commit)}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all transform group-hover:scale-110 shadow-lg ${
                    isRemote
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-2 ring-indigo-400/80 hover:ring-indigo-300'
                      : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white ring-2 ring-sky-400/80 hover:ring-sky-300'
                  }`}
                  title="Click node to inspect commit snapshot"
                >
                  <GitCommit className="w-4 h-4" />
                </button>

                {/* Commit Visual Node Card */}
                <div
                  onClick={() => onSelectCommit(commit)}
                  className={`flex-1 border rounded-lg p-2.5 cursor-pointer transition shadow-md ${
                    isRemote
                      ? 'bg-slate-900/90 border-indigo-800/80 hover:border-indigo-400 hover:bg-indigo-950/40'
                      : 'bg-slate-900/90 border-slate-800 hover:border-sky-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Commit Hash Badge (Vibrant Orange/Sky) */}
                      <span className="font-mono text-[11px] font-extrabold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/50 shadow-sm">
                        #{commit.hash}
                      </span>

                      {/* Branch Badges (Bright Emerald/Indigo) */}
                      {attachedBranches.map((b) => (
                        <span
                          key={b}
                          className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-bold border shadow-sm ${
                            isRemote
                              ? 'bg-indigo-950 text-indigo-200 border-indigo-400'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-400'
                          }`}
                        >
                          <GitBranch className="w-3 h-3" /> {isRemote ? `origin/${b}` : b}
                        </span>
                      ))}

                      {/* HEAD Indicator Badge (Vibrant Pink/Rose) */}
                      {isHeadTarget && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-extrabold bg-rose-950 text-rose-300 border border-rose-400 shadow-sm animate-pulse">
                          <ArrowUp className="w-3 h-3" /> HEAD
                        </span>
                      )}
                    </div>

                    <Info className="w-3.5 h-3.5 text-slate-500 hover:text-sky-300 transition" />
                  </div>

                  {/* Wrapped Commit Message */}
                  <p className="text-xs font-bold text-slate-100 mb-1 leading-snug line-clamp-2">
                    {commit.message}
                  </p>

                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-cyan-300 font-semibold">{commit.author}</span>
                    <span>{new Date(commit.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

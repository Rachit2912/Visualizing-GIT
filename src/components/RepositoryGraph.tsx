import React from 'react';
import { Commit, Head } from '../types/git';
import { GitCommit, GitBranch, ArrowUp, Info } from 'lucide-react';

interface RepositoryGraphProps {
  title: string;
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  head?: Head;
  onSelectCommit: (commit: Commit) => void;
  isRemote?: boolean;
}

export const RepositoryGraph: React.FC<RepositoryGraphProps> = ({
  title,
  commits,
  branches,
  head,
  onSelectCommit,
  isRemote = false,
}) => {
  const commitList = Object.values(commits).sort((a, b) => b.timestamp - a.timestamp);

  const commitBranches: Record<string, string[]> = {};
  Object.entries(branches).forEach(([bName, hash]) => {
    if (hash) {
      if (!commitBranches[hash]) commitBranches[hash] = [];
      commitBranches[hash].push(bName);
    }
  });

  return (
    <div className={`border rounded-lg p-4 flex flex-col h-full shadow-lg backdrop-blur-sm ${
      isRemote ? 'bg-indigo-950/40 border-indigo-800/60' : 'bg-slate-800/80 border-slate-700'
    }`}>
      <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <GitCommit className={`w-5 h-5 ${isRemote ? 'text-indigo-400' : 'text-sky-400'}`} />
          <h2 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">{title}</h2>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded font-mono border ${
          isRemote
            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
            : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
        }`}>
          {commitList.length} commit(s)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 relative">
        {commitList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            No commits created yet.
          </div>
        ) : (
          commitList.map((commit, index) => {
            const attachedBranches = commitBranches[commit.hash] || [];
            const isHeadTarget = head && (
              (head.type === 'branch' && branches[head.value] === commit.hash) ||
              (head.type === 'detached' && head.value === commit.hash)
            );

            return (
              <div key={commit.hash} className="relative flex items-start gap-3 group">
                {index < commitList.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-700 group-hover:bg-sky-500 transition" />
                )}

                <button
                  onClick={() => onSelectCommit(commit)}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all transform group-hover:scale-110 shadow-md ${
                    isRemote
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 hover:bg-indigo-500'
                      : 'bg-sky-600 text-white ring-2 ring-sky-400/50 hover:bg-sky-500'
                  }`}
                  title="Click for commit details"
                >
                  <GitCommit className="w-4 h-4" />
                </button>

                <div
                  onClick={() => onSelectCommit(commit)}
                  className={`flex-1 border rounded-md p-2.5 cursor-pointer transition shadow-sm ${
                    isRemote
                      ? 'bg-indigo-950/50 border-indigo-800/80 hover:border-indigo-500'
                      : 'bg-slate-900/80 border-slate-700 hover:border-sky-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                        {commit.hash}
                      </span>
                      {attachedBranches.map((b) => (
                        <span
                          key={b}
                          className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
                            isRemote
                              ? 'bg-indigo-900/60 text-indigo-300 border-indigo-500/50'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                          }`}
                        >
                          <GitBranch className="w-3 h-3" /> {isRemote ? `origin/${b}` : b}
                        </span>
                      ))}
                      {isHeadTarget && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
                          <ArrowUp className="w-3 h-3" /> HEAD
                        </span>
                      )}
                    </div>
                    <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                  </div>

                  <p className="text-xs font-medium text-slate-100 mb-1">{commit.message}</p>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-3">
                    <span>{commit.author}</span>
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

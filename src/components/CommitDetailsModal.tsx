import React, { useState } from 'react';
import { Commit } from '../types/git';
import { X, GitCommit, GitBranch, Calendar, User, FileCode, Code2 } from 'lucide-react';

interface CommitDetailsModalProps {
  commit: Commit | null;
  onClose: () => void;
  branches: Record<string, string>;
}

export const CommitDetailsModal: React.FC<CommitDetailsModalProps> = ({ commit, onClose, branches }) => {
  const [mode, setMode] = useState<'beginner' | 'underTheHood'>('beginner');

  if (!commit) return null;

  const associatedBranches = Object.entries(branches)
    .filter(([_, hash]) => hash === commit.hash)
    .map(([b]) => b);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100 text-sm">Commit Inspection</h3>
            <span className="font-mono text-xs text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
              {commit.hash}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 transition p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">EXPLANATION DEPTH:</span>
          <div className="inline-flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setMode('beginner')}
              className={`text-xs px-3 py-1 rounded-md font-medium transition ${
                mode === 'beginner' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Beginner Friendly
            </button>
            <button
              onClick={() => setMode('underTheHood')}
              className={`text-xs px-3 py-1 rounded-md font-medium transition ${
                mode === 'underTheHood' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Under the Hood
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3.5 space-y-2">
            <h4 className="text-sm font-semibold text-slate-100">{commit.message}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{commit.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(commit.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
                <span>Branches: {associatedBranches.join(', ') || 'none'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-sky-400" />
                <span>Parent: {commit.parentHashes.join(', ') || 'Root commit (no parent)'}</span>
              </div>
            </div>
          </div>

          {mode === 'beginner' ? (
            <div className="space-y-3">
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3.5">
                <h5 className="text-xs font-semibold text-sky-400 mb-1">What is this commit?</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  This commit represents a complete point-in-time snapshot of your project files when you ran <code className="text-sky-300">git commit</code>.
                </p>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-3.5">
                <h5 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" /> Files Saved in this Snapshot
                </h5>
                <div className="space-y-2">
                  {Object.entries(commit.snapshot).map(([filename, content]) => (
                    <div key={filename} className="bg-slate-950 border border-slate-800 rounded p-2">
                      <div className="font-mono text-xs font-semibold text-emerald-300 mb-1">{filename}</div>
                      <div className="font-mono text-xs text-slate-300 bg-slate-900 p-2 rounded max-h-24 overflow-y-auto whitespace-pre">
                        {content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-lg p-3.5 text-indigo-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-400">
                  <Code2 className="w-4 h-4" /> Internal Git Commit Object
                </div>
                <div className="bg-slate-950 p-3 rounded text-slate-300 border border-slate-800 space-y-1">
                  <div>tree 89a2bc1d8f... (Snapshot root tree)</div>
                  {commit.parentHashes.map((p) => (
                    <div key={p}>parent {p}</div>
                  ))}
                  <div>author {commit.author} {commit.timestamp}</div>
                  <div>committer {commit.author} {commit.timestamp}</div>
                  <div className="pt-2 text-sky-300">{commit.message}</div>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-400 leading-relaxed">
                Git stores commits as immutable objects in <code className="text-indigo-300">.git/objects/</code> hashed with SHA checksums.
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { FileState } from '../types/git';
import { FileCode, Plus, Edit2, Trash2, ArrowRight, CheckCircle2, FileQuestion, FileEdit } from 'lucide-react';

interface FileExplorerProps {
  files: Record<string, FileState>;
  isInitialized: boolean;
  onCreateFile: (filename: string, content: string) => void;
  onEditFile: (filename: string) => void;
  onDeleteFile: (filename: string) => void;
  onStageFile: (filename: string) => void;
  onStageAll: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  isInitialized,
  onCreateFile,
  onEditFile,
  onDeleteFile,
  onStageFile,
  onStageAll,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onCreateFile(newFileName.trim(), newFileContent);
    setNewFileName('');
    setNewFileContent('');
    setIsCreating(false);
  };

  const fileList = Object.values(files);
  const hasUnstagedChanges = fileList.some((f) => f.status === 'untracked' || f.status === 'modified');

  const getStatusBadge = (status: FileState['status']) => {
    switch (status) {
      case 'untracked':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold">
            <FileQuestion className="w-3 h-3" /> untracked
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
            <FileEdit className="w-3 h-3" /> modified
          </span>
        );
      case 'staged':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> staged
          </span>
        );
      case 'unchanged':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
            clean
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col h-full shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <FileCode className="w-4 h-4 text-sky-400" />
          <h2 className="font-semibold text-slate-100 text-xs tracking-wider uppercase">Working Tree</h2>
        </div>
        <div className="flex items-center gap-1">
          {isInitialized && hasUnstagedChanges && (
            <button
              onClick={onStageAll}
              className="text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded transition flex items-center gap-1 shadow-sm"
              title="git add ."
            >
              <ArrowRight className="w-3 h-3" /> Stage All
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-semibold px-2 py-0.5 rounded transition flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3 h-3" /> New
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-2 bg-slate-950 border border-sky-500/50 p-2 rounded-md">
          <input
            type="text"
            placeholder="filename (e.g. app.js)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 mb-1.5 focus:outline-none focus:border-sky-500 font-mono"
            autoFocus
          />
          <textarea
            placeholder="Initial content..."
            value={newFileContent}
            onChange={(e) => setNewFileContent(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 mb-1.5 focus:outline-none focus:border-sky-500 font-mono h-16 resize-none"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[11px] px-2 py-0.5 bg-sky-600 text-white rounded font-medium"
            >
              Save
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
        {fileList.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-xs italic">
            No files in workspace.
          </div>
        ) : (
          fileList.map((file) => (
            <div
              key={file.name}
              className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded p-2 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs font-semibold text-slate-200 truncate">{file.name}</span>
                {getStatusBadge(file.status)}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isInitialized && (file.status === 'untracked' || file.status === 'modified') && (
                  <button
                    onClick={() => onStageFile(file.name)}
                    className="text-[10px] bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 px-1.5 py-0.5 rounded font-mono flex items-center gap-1"
                    title={`git add ${file.name}`}
                  >
                    <ArrowRight className="w-2.5 h-2.5" /> Stage
                  </button>
                )}
                <button
                  onClick={() => onEditFile(file.name)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-sky-300 rounded"
                  title="Edit File Content"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteFile(file.name)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded"
                  title="Delete File"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

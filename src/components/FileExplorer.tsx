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
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <FileQuestion className="w-3 h-3" /> untracked
          </span>
        );
      case 'modified':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <FileEdit className="w-3 h-3" /> modified
          </span>
        );
      case 'staged':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> staged
          </span>
        );
      case 'unchanged':
        return (
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-700">
            unchanged
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 flex flex-col h-full shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-sky-400" />
          <h2 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">Working Directory</h2>
        </div>
        <div className="flex items-center gap-2">
          {isInitialized && hasUnstagedChanges && (
            <button
              onClick={onStageAll}
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded transition flex items-center gap-1 shadow-sm"
              title="git add ."
            >
              <ArrowRight className="w-3.5 h-3.5" /> Stage All (git add .)
            </button>
          )}
          <button
            onClick={() => setIsCreating(true)}
            className="text-xs bg-sky-600 hover:bg-sky-500 text-white font-medium px-2.5 py-1 rounded transition flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New File
          </button>
        </div>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="mb-3 bg-slate-900/90 border border-sky-500/40 p-3 rounded-md">
          <h3 className="text-xs font-semibold text-sky-400 mb-2">Create New File</h3>
          <input
            type="text"
            placeholder="filename (e.g. app.js)"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-slate-100 mb-2 focus:outline-none focus:border-sky-500 font-mono"
            autoFocus
          />
          <textarea
            placeholder="Initial content..."
            value={newFileContent}
            onChange={(e) => setNewFileContent(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded px-2.5 py-1 text-xs text-slate-100 mb-2 focus:outline-none focus:border-sky-500 font-mono h-20 resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium"
            >
              Create
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {fileList.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs italic">
            No files in Working Directory. Click "+ New File" to create one.
          </div>
        ) : (
          fileList.map((file) => (
            <div
              key={file.name}
              className="group bg-slate-900/60 border border-slate-700/80 hover:border-slate-600 rounded-md p-2.5 transition flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium text-slate-200">{file.name}</span>
                  {getStatusBadge(file.status)}
                </div>
                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition">
                  {isInitialized && (file.status === 'untracked' || file.status === 'modified') && (
                    <button
                      onClick={() => onStageFile(file.name)}
                      className="text-xs bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-700/60 px-2 py-0.5 rounded flex items-center gap-1"
                      title={`git add ${file.name}`}
                    >
                      <ArrowRight className="w-3 h-3" /> Stage
                    </button>
                  )}
                  <button
                    onClick={() => onEditFile(file.name)}
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-sky-300 rounded"
                    title="Edit Content"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteFile(file.name)}
                    className="p-1 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="bg-slate-950/70 rounded p-2 text-xs font-mono text-slate-300 overflow-x-auto max-h-24 whitespace-pre">
                {file.content || <span className="text-slate-500 italic">(empty file)</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

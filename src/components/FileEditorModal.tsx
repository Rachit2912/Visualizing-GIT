import React, { useState, useEffect } from 'react';
import { FileState } from '../types/git';
import { X, Save, FileEdit, Diff } from 'lucide-react';

interface FileEditorModalProps {
  file: FileState | null;
  onClose: () => void;
  onSave: (filename: string, content: string) => void;
}

export const FileEditorModal: React.FC<FileEditorModalProps> = ({ file, onClose, onSave }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (file) {
      setContent(file.content);
    }
  }, [file]);

  if (!file) return null;

  const handleSave = () => {
    onSave(file.name, content);
    onClose();
  };

  const lastCommitted = file.lastCommittedContent ?? '';
  const linesOld = lastCommitted ? lastCommitted.split('\n') : [];
  const linesNew = content.split('\n');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <FileEdit className="w-5 h-5 text-sky-400" />
            <h3 className="font-semibold text-slate-100 font-mono text-sm">{file.name}</h3>
            <span className="text-xs text-slate-400 font-mono">({file.status})</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 transition p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-4 overflow-y-auto">
          <div className="flex flex-col flex-1">
            <label className="text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
              <span>FILE CONTENT</span>
              <span className="font-mono text-[10px] text-slate-500">{content.length} characters</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-48 bg-slate-950 border border-slate-700 rounded-md p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none shadow-inner"
              spellCheck={false}
            />
          </div>

          {file.lastCommittedContent !== undefined && (
            <div className="bg-slate-950 border border-slate-800 rounded-md p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2 border-b border-slate-800 pb-1">
                <Diff className="w-4 h-4 text-amber-400" />
                <span>LIVE DIFF PREVIEW (vs HEAD Snapshot)</span>
              </div>
              <div className="font-mono text-xs space-y-0.5 max-h-32 overflow-y-auto">
                {linesOld.map((line, idx) => {
                  if (linesNew[idx] !== line) {
                    return (
                      <div key={`old-${idx}`} className="bg-rose-950/40 text-rose-300 px-1 py-0.5 rounded flex gap-2">
                        <span className="text-rose-500 select-none">-</span>
                        <span>{line}</span>
                      </div>
                    );
                  }
                  return null;
                })}
                {linesNew.map((line, idx) => {
                  if (linesOld[idx] !== line) {
                    return (
                      <div key={`new-${idx}`} className="bg-emerald-950/40 text-emerald-300 px-1 py-0.5 rounded flex gap-2">
                        <span className="text-emerald-500 select-none">+</span>
                        <span>{line}</span>
                      </div>
                    );
                  }
                  return (
                    <div key={`same-${idx}`} className="text-slate-500 px-1 py-0.5 flex gap-2">
                      <span className="opacity-0 select-none"> </span>
                      <span>{line}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-800/80 border-t border-slate-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs rounded font-medium transition flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

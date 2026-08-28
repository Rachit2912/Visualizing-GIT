import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, History } from 'lucide-react';

interface TerminalProps {
  onExecuteCommand: (cmd: string) => void;
  outputHistory: Array<{ command: string; output: string; isError?: boolean }>;
  onClearHistory: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
  onExecuteCommand,
  outputHistory,
  onClearHistory,
}) => {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    onExecuteCommand(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      }
    }
  };

  const quickCommands = [
    'git init',
    'git status',
    'git add app.js',
    'git add .',
    'git commit -m "Add feature"',
    'git branch feature',
    'git switch feature',
    'git push',
    'git fetch',
    'git pull',
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col h-full font-mono text-xs shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-300">Git Terminal / Command Input</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearHistory}
            className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
          >
            <History className="w-3 h-3" /> Clear Console
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 border-b border-slate-900 scrollbar-none">
        <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold shrink-0">Quick Commands:</span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => {
              setInput(cmd);
            }}
            className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-sky-400 px-2 py-0.5 rounded shrink-0 transition"
          >
            {cmd}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-slate-300">
        {outputHistory.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <span>$</span>
              <span>{item.command}</span>
            </div>
            <pre className={`whitespace-pre-wrap pl-4 ${item.isError ? 'text-rose-400' : 'text-slate-300'}`}>
              {item.output}
            </pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 focus-within:border-sky-500">
        <span className="text-emerald-400 font-bold">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type git command (e.g. git status, git add app.js, git commit -m 'Msg')"
          className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono text-xs placeholder:text-slate-600"
        />
        <button type="submit" className="text-slate-500 hover:text-sky-400 transition">
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, CornerDownLeft, Trash2 } from 'lucide-react';

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

    if (trimmed === 'clear') {
      onClearHistory();
      setInput('');
      return;
    }

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
    'clear',
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col h-full font-mono text-xs shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-300">Terminal CLI</span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-[10px] text-slate-400 hover:text-rose-300 flex items-center gap-1 transition px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800"
          title="Clear console output (type 'clear')"
        >
          <Trash2 className="w-3 h-3" /> Clear Console
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1 border-b border-slate-900 scrollbar-none">
        <span className="text-[9px] text-slate-500 uppercase font-sans font-semibold shrink-0">Quick:</span>
        {quickCommands.map((cmd) => (
          <button
            key={cmd}
            onClick={() => setInput(cmd)}
            className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-sky-400 px-1.5 py-0.5 rounded shrink-0 transition"
          >
            {cmd}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 text-slate-300">
        {outputHistory.map((item, index) => (
          <div key={index} className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <span>$</span>
              <span>{item.command}</span>
            </div>
            <pre className={`whitespace-pre-wrap pl-3 ${item.isError ? 'text-rose-400' : 'text-slate-300'}`}>
              {item.output}
            </pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-1.5 flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded px-2 py-1 focus-within:border-sky-500">
        <span className="text-emerald-400 font-bold">$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type git command or 'clear'..."
          className="flex-1 bg-transparent text-slate-100 focus:outline-none font-mono text-xs placeholder:text-slate-600"
        />
        <button type="submit" className="text-slate-500 hover:text-sky-400 transition">
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

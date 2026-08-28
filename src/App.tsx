import { useState, useEffect } from 'react';
import { GitEngine } from './engine/GitEngine';
import { createInitialRepositoryState } from './engine/initialState';
import { guidedLessons } from './engine/lessons';
import { RepositoryState, GitOperationResult, Commit, FileState, Explanation, AnimationEvent } from './types/git';

import { FileExplorer } from './components/FileExplorer';
import { FileEditorModal } from './components/FileEditorModal';
import { StagingAreaView } from './components/StagingAreaView';
import { RepositoryGraph } from './components/RepositoryGraph';
import { CommitDetailsModal } from './components/CommitDetailsModal';
import { ExplanationPanel } from './components/ExplanationPanel';
import { AnimationBanner } from './components/AnimationBanner';
import { Terminal } from './components/Terminal';
import { LessonPanel } from './components/LessonPanel';

import { GitBranch, Undo2, RotateCcw, BookOpen, Terminal as TermIcon } from 'lucide-react';

export default function App() {
  const [engine] = useState<GitEngine>(() => new GitEngine(createInitialRepositoryState()));
  const [stateHistory, setStateHistory] = useState<RepositoryState[]>([]);
  const [currentState, setCurrentState] = useState<RepositoryState>(engine.getState());

  const [activeLessonId, setActiveLessonId] = useState<string>('lesson-1');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  const [terminalHistory, setTerminalHistory] = useState<
    Array<{ command: string; output: string; isError?: boolean }>
  >([
    {
      command: 'system',
      output: 'Welcome to Visual Git Learning Tool! Try commands like "git init", "git status", "git add app.js", or "git commit -m \'Msg\'".',
    },
  ]);

  const [activeExplanation, setActiveExplanation] = useState<Explanation | null>(null);
  const [activeEvents, setActiveEvents] = useState<AnimationEvent[]>([]);

  const [editingFile, setEditingFile] = useState<FileState | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [explanationMode, setExplanationMode] = useState<'beginner' | 'underTheHood'>('beginner');
  const [activeTab, setActiveTab] = useState<'visual' | 'lessons'>('visual');

  const currentLesson = guidedLessons.find((l) => l.id === activeLessonId) || guidedLessons[0];

  useEffect(() => {
    if (currentStepIndex < currentLesson.steps.length) {
      const step = currentLesson.steps[currentStepIndex];
      const lastCmd = terminalHistory[terminalHistory.length - 1]?.command;
      if (step.validate(currentState, lastCmd)) {
        setCurrentStepIndex((prev) => prev + 1);
      }
    }
  }, [currentState, terminalHistory, currentStepIndex, currentLesson]);

  const handleApplyResult = (cmd: string, result: GitOperationResult) => {
    setStateHistory((prev) => [...prev, currentState]);
    setCurrentState(result.nextState);
    engine.setState(result.nextState);
    setActiveExplanation(result.explanation);
    setActiveEvents(result.animationEvents);

    setTerminalHistory((prev) => [
      ...prev,
      {
        command: cmd,
        output: result.output,
        isError: !result.success,
      },
    ]);
  };

  const handleExecuteCommand = (commandStr: string) => {
    const result = engine.executeCommand(commandStr);
    handleApplyResult(commandStr, result);
  };

  const handleCreateFile = (filename: string, content: string) => {
    const result = engine.createFile(filename, content);
    handleApplyResult(`create ${filename}`, result);
  };

  const handleEditSave = (filename: string, content: string) => {
    const result = engine.updateFile(filename, content);
    handleApplyResult(`edit ${filename}`, result);
  };

  const handleDeleteFile = (filename: string) => {
    const result = engine.deleteFile(filename);
    handleApplyResult(`rm ${filename}`, result);
  };

  const handleStageFile = (filename: string) => {
    const result = engine.executeCommand(`git add ${filename}`);
    handleApplyResult(`git add ${filename}`, result);
  };

  const handleStageAll = () => {
    const result = engine.executeCommand('git add .');
    handleApplyResult('git add .', result);
  };

  const handleQuickCommit = (message: string) => {
    const result = engine.executeCommand(`git commit -m "${message}"`);
    handleApplyResult(`git commit -m "${message}"`, result);
  };

  const handleUndo = () => {
    if (stateHistory.length === 0) return;
    const previousState = stateHistory[stateHistory.length - 1];
    setStateHistory((prev) => prev.slice(0, prev.length - 1));
    setCurrentState(previousState);
    engine.setState(previousState);
    setActiveExplanation({
      title: 'Undo Last Operation',
      whatHappened: 'Reverted repository state to previous step in timeline.',
      why: 'Allows learners to safely experiment without fear of messing up state.',
      underTheHood: 'Popped state snapshot from history stack.',
      whatChanged: ['Reverted state to previous timeline point'],
    });
  };

  const handleResetRepo = () => {
    const initial = createInitialRepositoryState();
    setStateHistory([]);
    setCurrentState(initial);
    engine.setState(initial);
    setActiveExplanation(null);
    setTerminalHistory([
      { command: 'reset', output: 'Repository reset to initial clean state.' },
    ]);
  };

  const handleSelectLesson = (lessonId: string) => {
    const target = guidedLessons.find((l) => l.id === lessonId);
    if (!target) return;
    setActiveLessonId(lessonId);
    setCurrentStepIndex(0);
    setStateHistory([]);
    setCurrentState(target.initialState);
    engine.setState(target.initialState);
    setActiveExplanation(null);
  };

  const handleResetLesson = () => {
    setCurrentStepIndex(0);
    setStateHistory([]);
    setCurrentState(currentLesson.initialState);
    engine.setState(currentLesson.initialState);
    setActiveExplanation(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <GitBranch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Visual Git Learning Tool
              <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded font-mono">
                Interactive Simulator
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              See what Git is doing step-by-step with visual state transitions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setActiveTab('visual')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeTab === 'visual'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TermIcon className="w-3.5 h-3.5" /> Free Playground
            </button>
            <button
              onClick={() => setActiveTab('lessons')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeTab === 'lessons'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Guided Lessons
            </button>
          </div>

          <div className="h-5 w-px bg-slate-800" />

          <button
            onClick={handleUndo}
            disabled={stateHistory.length === 0}
            className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 px-3 py-1.5 rounded border border-slate-700 transition flex items-center gap-1.5"
            title="Undo last command"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
          <button
            onClick={handleResetRepo}
            className="text-xs bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-300 px-3 py-1.5 rounded border border-slate-700 hover:border-rose-800 transition flex items-center gap-1.5"
            title="Reset repository to clean slate"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-12 gap-4 max-w-[1800px] w-full mx-auto overflow-hidden">
        <div className="col-span-12">
          <AnimationBanner events={activeEvents} />
        </div>

        <div className="col-span-12 md:col-span-3 flex flex-col gap-4 max-h-[calc(100vh-220px)] overflow-y-auto">
          {activeTab === 'lessons' ? (
            <LessonPanel
              lessons={guidedLessons}
              currentLesson={currentLesson}
              currentStepIndex={currentStepIndex}
              onSelectLesson={handleSelectLesson}
              onResetLesson={handleResetLesson}
            />
          ) : (
            <>
              <div className="h-1/2">
                <FileExplorer
                  files={currentState.files}
                  isInitialized={currentState.isInitialized}
                  onCreateFile={handleCreateFile}
                  onEditFile={(filename) => setEditingFile(currentState.files[filename])}
                  onDeleteFile={handleDeleteFile}
                  onStageFile={handleStageFile}
                  onStageAll={handleStageAll}
                />
              </div>
              <div className="h-1/2">
                <StagingAreaView
                  stagingArea={currentState.stagingArea}
                  isInitialized={currentState.isInitialized}
                  onCommit={handleQuickCommit}
                />
              </div>
            </>
          )}
        </div>

        <div className="col-span-12 md:col-span-6 flex flex-col gap-4 max-h-[calc(100vh-220px)] overflow-y-auto">
          <div className="h-1/2">
            <RepositoryGraph
              title="Local Repository History"
              commits={currentState.commits}
              branches={currentState.branches}
              head={currentState.head}
              onSelectCommit={(commit) => setSelectedCommit(commit)}
            />
          </div>
          <div className="h-1/2">
            <RepositoryGraph
              title="Remote Repository (origin)"
              commits={currentState.remote.commits}
              branches={currentState.remote.branches}
              onSelectCommit={(commit) => setSelectedCommit(commit)}
              isRemote
            />
          </div>
        </div>

        <div className="col-span-12 md:col-span-3 flex flex-col gap-4 max-h-[calc(100vh-220px)] overflow-y-auto">
          <ExplanationPanel
            explanation={activeExplanation}
            mode={explanationMode}
            onToggleMode={setExplanationMode}
          />
        </div>

        <div className="col-span-12 h-56">
          <Terminal
            onExecuteCommand={handleExecuteCommand}
            outputHistory={terminalHistory}
            onClearHistory={() => setTerminalHistory([])}
          />
        </div>
      </main>

      <FileEditorModal
        file={editingFile}
        onClose={() => setEditingFile(null)}
        onSave={handleEditSave}
      />

      <CommitDetailsModal
        commit={selectedCommit}
        onClose={() => setSelectedCommit(null)}
        branches={currentState.branches}
      />
    </div>
  );
}

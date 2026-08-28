import React from 'react';
import { Lesson } from '../types/git';
import { BookOpen, CheckCircle2, ChevronRight, HelpCircle, RotateCcw } from 'lucide-react';

interface LessonPanelProps {
  lessons: Lesson[];
  currentLesson: Lesson;
  currentStepIndex: number;
  onSelectLesson: (lessonId: string) => void;
  onResetLesson: () => void;
  lastCommandExecuted?: string;
}

export const LessonPanel: React.FC<LessonPanelProps> = ({
  lessons,
  currentLesson,
  currentStepIndex,
  onSelectLesson,
  onResetLesson,
}) => {
  const [showHint, setShowHint] = React.useState(false);
  const isLessonComplete = currentStepIndex >= currentLesson.steps.length;

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 flex flex-col h-full shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <h2 className="font-semibold text-slate-100 text-sm tracking-wide uppercase">Guided Lessons</h2>
        </div>
        <button
          onClick={onResetLesson}
          className="text-xs text-slate-400 hover:text-slate-100 bg-slate-700/60 hover:bg-slate-700 px-2 py-1 rounded flex items-center gap-1 transition"
          title="Reset lesson state"
        >
          <RotateCcw className="w-3 h-3" /> Reset Lesson
        </button>
      </div>

      <div className="mb-3">
        <select
          value={currentLesson.id}
          onChange={(e) => onSelectLesson(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
        >
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-slate-400 mb-3">{currentLesson.description}</p>

      <div className="w-full bg-slate-900 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-800">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{
            width: `${Math.min(100, ((currentStepIndex + (isLessonComplete ? 1 : 0)) / currentLesson.steps.length) * 100)}%`,
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLessonComplete ? (
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-lg p-4 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-emerald-300">Lesson Complete! 🎉</h3>
            <p className="text-xs text-slate-300">
              Great job! You have completed all steps in <span className="font-semibold">{currentLesson.title}</span>.
            </p>
          </div>
        ) : (
          currentLesson.steps.map((step, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isDone = idx < currentStepIndex;

            return (
              <div
                key={step.id}
                className={`border rounded-md p-3 transition ${
                  isCurrent
                    ? 'bg-sky-950/30 border-sky-500/60 shadow-md'
                    : isDone
                    ? 'bg-slate-900/40 border-slate-800 opacity-60'
                    : 'bg-slate-900/20 border-slate-800 opacity-40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <ChevronRight className="w-4 h-4 text-sky-400 animate-pulse" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500">
                        {step.id}
                      </div>
                    )}
                    <span className={isCurrent ? 'text-sky-300 font-bold' : 'text-slate-300'}>{step.title}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded font-mono">
                      ACTIVE STEP
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-2 pl-5">{step.instruction}</p>

                {isCurrent && (
                  <div className="pl-5 pt-1 space-y-2">
                    {step.suggestedCommand && (
                      <div className="bg-slate-950 border border-slate-800 rounded p-1.5 text-xs font-mono text-emerald-400 flex items-center justify-between">
                        <span>Try: {step.suggestedCommand}</span>
                      </div>
                    )}
                    <div>
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        <HelpCircle className="w-3 h-3" /> {showHint ? 'Hide Hint' : 'Show Hint'}
                      </button>
                      {showHint && (
                        <p className="mt-1 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-800/40 p-2 rounded">
                          {step.hint}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

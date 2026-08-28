import React, { useState, useRef, useMemo } from 'react';
import { Commit, Head } from '../types/git';
import { GitCommit, UserPlus, ZoomIn, ZoomOut, Maximize2, Tag as TagIcon, ArrowDown } from 'lucide-react';
import { calculateDAGLayout, DAGNodePosition } from '../utils/dagLayout';

interface RepositoryGraphProps {
  title: string;
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  tags?: Record<string, string>;
  head?: Head;
  onSelectCommit: (commit: Commit) => void;
  isRemote?: boolean;
  onSimulateRemoteCommit?: () => void;
}

export const RepositoryGraph: React.FC<RepositoryGraphProps> = ({
  title,
  commits,
  branches,
  tags = {},
  head,
  onSelectCommit,
  isRemote = false,
  onSimulateRemoteCommit,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredHash, setHoveredHash] = useState<string | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Compute DAG Layout
  const layout = useMemo(() => {
    return calculateDAGLayout(commits, branches, tags, head, isRemote);
  }, [commits, branches, tags, head, isRemote]);

  // Ancestry calculation for hover highlighting (child -> parent chain)
  const highlightedHashes = useMemo(() => {
    if (!hoveredHash) return new Set<string>();

    const set = new Set<string>();
    const queue = [hoveredHash];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (!set.has(curr)) {
        set.add(curr);
        const commit = commits[curr];
        if (commit) {
          queue.push(...commit.parentHashes);
        }
      }
    }

    return set;
  }, [hoveredHash, commits]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      className={`border rounded-xl p-3 flex flex-col h-full shadow-2xl backdrop-blur-md relative overflow-hidden select-none ${
        isRemote
          ? 'bg-gradient-to-b from-indigo-950/70 via-slate-900/95 to-slate-950 border-indigo-500/50'
          : 'bg-gradient-to-b from-slate-900/90 via-slate-900/95 to-slate-950 border-sky-500/50'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2.5 z-20">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isRemote ? 'bg-indigo-500/20 text-indigo-400' : 'bg-sky-500/20 text-sky-400'}`}>
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-xs tracking-wider uppercase flex items-center gap-2">
              {title}
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono border font-semibold ${
                isRemote ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40' : 'bg-sky-500/10 text-sky-300 border-sky-500/40'
              }`}>
                DAG Layout ({layout.nodes.length} commits)
              </span>
            </h2>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          {isRemote && onSimulateRemoteCommit && (
            <button
              onClick={onSimulateRemoteCommit}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1 rounded-md transition flex items-center gap-1.5 shadow"
              title="Simulate teammate pushing a commit directly to remote origin"
            >
              <UserPlus className="w-3.5 h-3.5" /> Simulate Remote Push
            </button>
          )}

          <div className="flex items-center bg-slate-800/80 rounded-md border border-slate-700/80 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              className="p-1 hover:bg-slate-700 text-slate-300 rounded transition"
              title="Reset View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive DAG Canvas Area */}
      <div
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing rounded-lg bg-slate-950/60 border border-slate-800/80"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {layout.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs italic">
            No commits created yet in this repository.
          </div>
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-75 origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: layout.width,
              height: layout.height,
            }}
          >
            {/* SVG Edges Layer (Rendered Behind Nodes) */}
            <svg
              className="absolute inset-0 pointer-events-none z-0"
              width={layout.width}
              height={layout.height}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrow-active"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
              </defs>

              {layout.edges.map((edge, idx) => {
                const isHighlighted =
                  highlightedHashes.has(edge.childHash) && highlightedHashes.has(edge.parentHash);

                return (
                  <path
                    key={`edge-${idx}`}
                    d={edge.pathD}
                    fill="none"
                    stroke={isHighlighted ? '#f59e0b' : edge.isMerge ? '#f43f5e' : '#38bdf8'}
                    strokeWidth={isHighlighted ? 3 : edge.isMerge ? 2.5 : 2}
                    strokeDasharray={edge.isMerge && !isHighlighted ? '4 3' : undefined}
                    markerEnd={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow)'}
                    className="transition-all duration-200"
                  />
                );
              })}
            </svg>

            {/* Commit Pill Nodes and Attached Badges */}
            {layout.nodes.map((node: DAGNodePosition) => {
              const commit = commits[node.hash];
              if (!commit) return null;

              const isHighlighted = highlightedHashes.has(node.hash);

              return (
                <div
                  key={node.hash}
                  style={{
                    position: 'absolute',
                    left: `${node.x - node.width / 2}px`,
                    top: `${node.y - node.height / 2}px`,
                    width: `${node.width}px`,
                  }}
                  className="flex flex-col items-center z-10"
                  onMouseEnter={() => setHoveredHash(node.hash)}
                  onMouseLeave={() => setHoveredHash(null)}
                >
                  {/* Compact Pill / Oval Commit Node */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCommit(commit);
                    }}
                    style={{ width: `${node.width}px`, height: `${node.height}px` }}
                    className={`rounded-2xl px-2 py-1 flex flex-col items-center justify-center border text-center transition-all transform hover:scale-105 shadow-lg ${
                      isHighlighted
                        ? 'bg-amber-950/90 border-amber-400 text-amber-200 ring-2 ring-amber-400'
                        : isRemote
                        ? 'bg-indigo-950/90 border-indigo-500/80 hover:border-indigo-300 text-indigo-100'
                        : 'bg-slate-900/90 border-sky-500/80 hover:border-sky-300 text-sky-100'
                    }`}
                    title={`Commit ${node.shortHash}: ${commit.message}`}
                  >
                    {/* Line 1: Short SHA */}
                    <span className="font-mono text-[11px] font-extrabold tracking-wider text-amber-300">
                      {node.shortHash}
                    </span>
                    {/* Line 2: Abbreviated Short Message */}
                    <span className="text-[10px] font-medium text-slate-200 truncate w-full px-1">
                      {commit.message}
                    </span>
                  </button>

                  {/* Ref Badges & HEAD Pointer Below Pill Node */}
                  <div className="flex flex-col items-center gap-1 mt-1.5 w-max max-w-[200px]">
                    {/* HEAD Indicator Pointer */}
                    {node.isHead && (
                      <div className="flex flex-col items-center animate-pulse mb-0.5">
                        <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500 shadow flex items-center gap-0.5">
                          HEAD
                        </span>
                        <ArrowDown className="w-3 h-3 text-rose-400 -mt-0.5" />
                      </div>
                    )}

                    <div className="flex items-center justify-center flex-wrap gap-1">
                      {/* Local Branch Badges */}
                      {node.branches.map((b) => (
                        <span
                          key={b}
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-400 shadow-sm whitespace-nowrap"
                        >
                          [{b}]
                        </span>
                      ))}

                      {/* Remote Branch Badges */}
                      {node.remoteBranches.map((rb) => (
                        <span
                          key={rb}
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-indigo-950 text-indigo-200 border border-indigo-400 shadow-sm whitespace-nowrap"
                        >
                          [{rb}]
                        </span>
                      ))}

                      {/* Tag Badges */}
                      {node.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full bg-purple-950 text-purple-200 border border-purple-400 shadow-sm flex items-center gap-0.5 whitespace-nowrap"
                        >
                          <TagIcon className="w-2.5 h-2.5 text-purple-300" /> [{tag}]
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

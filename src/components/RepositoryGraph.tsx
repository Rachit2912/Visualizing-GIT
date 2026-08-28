import React, { useState, useRef, useMemo } from 'react';
import { Commit, Head } from '../types/git';
import { GitCommit, GitBranch, ArrowUp, Info, UserPlus, ZoomIn, ZoomOut, Maximize2, Tag as TagIcon } from 'lucide-react';

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

interface NodePosition {
  hash: string;
  x: number;
  y: number;
  col: number;
  row: number;
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
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const commitList = useMemo(() => {
    return Object.values(commits).sort((a, b) => a.timestamp - b.timestamp);
  }, [commits]);

  // Group branches and tags by commit hash
  const { commitBranches, commitTags } = useMemo(() => {
    const cBranches: Record<string, string[]> = {};
    const cTags: Record<string, string[]> = {};

    Object.entries(branches).forEach(([bName, hash]) => {
      if (hash) {
        if (!cBranches[hash]) cBranches[hash] = [];
        cBranches[hash].push(bName);
      }
    });

    Object.entries(tags).forEach(([tagName, hash]) => {
      if (hash) {
        if (!cTags[hash]) cTags[hash] = [];
        cTags[hash].push(tagName);
      }
    });

    return { commitBranches: cBranches, commitTags: cTags };
  }, [branches, tags]);

  // Layout Engine: Calculate 2D coordinates for DAG
  const { layoutNodes, edges, graphWidth, graphHeight } = useMemo(() => {
    if (commitList.length === 0) {
      return { layoutNodes: [], edges: [], graphWidth: 400, graphHeight: 200 };
    }

    const NODE_WIDTH = 280;
    const ROW_HEIGHT = 100;
    const COL_WIDTH = 60;
    const PADDING_X = 40;
    const PADDING_Y = 50;

    // Map parent->children
    const childrenMap: Record<string, string[]> = {};
    commitList.forEach((c) => {
      c.parentHashes.forEach((pHash) => {
        if (!childrenMap[pHash]) childrenMap[pHash] = [];
        childrenMap[pHash].push(c.hash);
      });
    });

    // Assign rows (topological sort based on timestamp / ancestry depth)
    const nodeRows: Record<string, number> = {};
    commitList.forEach((c, idx) => {
      nodeRows[c.hash] = idx;
    });

    // Assign swimlane columns
    const activeColumns: (string | null)[] = [];
    const nodeCols: Record<string, number> = {};

    commitList.forEach((c) => {
      let assignedCol = -1;
      // If this commit continues an active column from one of its parents
      if (c.parentHashes.length > 0) {
        const primaryParent = c.parentHashes[0];
        const parentCol = nodeCols[primaryParent];
        if (parentCol !== undefined && activeColumns[parentCol] === primaryParent) {
          assignedCol = parentCol;
        }
      }

      if (assignedCol === -1) {
        // Find first empty column
        assignedCol = activeColumns.findIndex((col) => col === null);
        if (assignedCol === -1) {
          assignedCol = activeColumns.length;
          activeColumns.push(null);
        }
      }

      nodeCols[c.hash] = assignedCol;
      activeColumns[assignedCol] = c.hash;
    });

    const positions: Record<string, NodePosition> = {};
    let maxCol = 0;

    commitList.forEach((c) => {
      const row = nodeRows[c.hash];
      const col = nodeCols[c.hash] ?? 0;
      if (col > maxCol) maxCol = col;

      positions[c.hash] = {
        hash: c.hash,
        col,
        row,
        x: PADDING_X + col * COL_WIDTH,
        y: PADDING_Y + row * ROW_HEIGHT,
      };
    });

    // Generate edges from parents to child
    const edgeList: { from: NodePosition; to: NodePosition; isMerge: boolean }[] = [];
    commitList.forEach((c) => {
      const childPos = positions[c.hash];
      c.parentHashes.forEach((pHash, idx) => {
        const parentPos = positions[pHash];
        if (parentPos && childPos) {
          edgeList.push({
            from: parentPos,
            to: childPos,
            isMerge: c.parentHashes.length > 1 && idx > 0,
          });
        }
      });
    });

    const calculatedWidth = PADDING_X * 2 + (maxCol + 1) * COL_WIDTH + NODE_WIDTH + 60;
    const calculatedHeight = PADDING_Y * 2 + commitList.length * ROW_HEIGHT + 40;

    return {
      layoutNodes: Object.values(positions),
      edges: edgeList,
      graphWidth: Math.max(calculatedWidth, 450),
      graphHeight: Math.max(calculatedHeight, 300),
    };
  }, [commitList]);

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
                DAG Layout ({commitList.length} nodes)
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
        {commitList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs italic">
            No commits created yet in this repository.
          </div>
        ) : (
          <div
            className="absolute inset-0 transition-transform duration-75 origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: graphWidth,
              height: graphHeight,
            }}
          >
            {/* Curved Parent SVG Edges Layer */}
            <svg
              className="absolute inset-0 pointer-events-none"
              width={graphWidth}
              height={graphHeight}
            >
              <defs>
                <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="mergeEdgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {edges.map((edge, idx) => {
                const x1 = edge.from.x;
                const y1 = edge.from.y;
                const x2 = edge.to.x;
                const y2 = edge.to.y;

                // Bezier Curve calculation for smooth DAG connection
                const midY = (y1 + y2) / 2;
                const pathD = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

                return (
                  <path
                    key={`edge-${idx}`}
                    d={pathD}
                    fill="none"
                    stroke={edge.isMerge ? 'url(#mergeEdgeGradient)' : 'url(#edgeGradient)'}
                    strokeWidth={edge.isMerge ? 2.5 : 2}
                    strokeDasharray={edge.isMerge ? '4 3' : undefined}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Commit DAG Nodes Layer */}
            {layoutNodes.map((nodePos) => {
              const commit = commits[nodePos.hash];
              if (!commit) return null;

              const attachedBranches = commitBranches[commit.hash] || [];
              const attachedTags = commitTags[commit.hash] || [];

              const isHeadTarget =
                head &&
                ((head.type === 'branch' && branches[head.value] === commit.hash) ||
                  (head.type === 'detached' && head.value === commit.hash));

              return (
                <div
                  key={nodePos.hash}
                  style={{
                    position: 'absolute',
                    left: `${nodePos.x - 14}px`,
                    top: `${nodePos.y - 14}px`,
                  }}
                  className="flex items-center gap-3 group z-10"
                >
                  {/* DAG Commit Node Circle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCommit(commit);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all transform group-hover:scale-125 shadow-xl ${
                      isRemote
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white ring-2 ring-indigo-400 hover:ring-indigo-200'
                        : 'bg-gradient-to-r from-sky-400 to-cyan-500 text-white ring-2 ring-sky-300 hover:ring-sky-100'
                    }`}
                    title="Click node to view details"
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                  </button>

                  {/* Node Visual Card */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCommit(commit);
                    }}
                    className={`w-72 border rounded-xl p-2.5 cursor-pointer transition shadow-xl backdrop-blur-md ${
                      isRemote
                        ? 'bg-slate-900/90 border-indigo-800/80 hover:border-indigo-400 hover:bg-indigo-950/50'
                        : 'bg-slate-900/90 border-slate-800/90 hover:border-sky-400 hover:bg-slate-800/80'
                    }`}
                  >
                    {/* Header Row: Hash, Branch Ref, Tag Ref, HEAD */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Commit Hash (Amber/Gold) */}
                        <span className="font-mono text-[11px] font-extrabold text-amber-300 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/50 shadow-sm">
                          #{commit.hash.substring(0, 7)}
                        </span>

                        {/* Branch Ref Badges (Emerald Green / Indigo) */}
                        {attachedBranches.map((b) => (
                          <span
                            key={b}
                            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border shadow-sm ${
                              isRemote
                                ? 'bg-indigo-950 text-indigo-200 border-indigo-400'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-400'
                            }`}
                          >
                            <GitBranch className="w-3 h-3" /> {isRemote ? `origin/${b}` : b}
                          </span>
                        ))}

                        {/* Tag Badges (Amethyst / Magenta) */}
                        {attachedTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold bg-purple-950 text-purple-200 border border-purple-400 shadow-sm"
                          >
                            <TagIcon className="w-2.5 h-2.5 text-purple-300" /> {tag}
                          </span>
                        ))}

                        {/* HEAD Indicator Badge (Radiant Rose / Pink) */}
                        {isHeadTarget && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold bg-rose-950 text-rose-300 border border-rose-400 shadow-sm animate-pulse">
                            <ArrowUp className="w-2.5 h-2.5" /> HEAD
                          </span>
                        )}
                      </div>

                      <Info className="w-3.5 h-3.5 text-slate-500 hover:text-sky-300 transition" />
                    </div>

                    {/* Commit Message */}
                    <p className="text-xs font-semibold text-slate-100 mb-1 leading-snug line-clamp-2">
                      {commit.message}
                    </p>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="text-cyan-300 font-medium">{commit.author.split('<')[0]}</span>
                      <span>{new Date(commit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

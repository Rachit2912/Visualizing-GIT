import { Commit, Head } from '../types/git';

export interface GraphRefInfo {
  type: 'branch' | 'remote' | 'tag';
  name: string;
}

export interface DAGNodePosition {
  hash: string;
  shortHash: string;
  message: string;
  x: number; // Center X
  y: number; // Center Y
  col: number; // Horizontal generation (0 = oldest on left)
  row: number; // Vertical swimlane
  width: number;
  height: number;
  branches: string[];
  remoteBranches: string[];
  tags: string[];
  isHead: boolean;
  headBranch?: string;
  isDetachedHead: boolean;
}

export interface DAGEdge {
  childHash: string;
  parentHash: string;
  startX: number; // Right or left boundary of child
  startY: number;
  endX: number; // Right boundary of parent
  endY: number;
  isMerge: boolean;
  pathD: string;
}

export interface DAGLayoutResult {
  nodes: DAGNodePosition[];
  nodeMap: Record<string, DAGNodePosition>;
  edges: DAGEdge[];
  width: number;
  height: number;
}

export const NODE_WIDTH = 130;
export const NODE_HEIGHT = 56;
export const COL_SPACING = 210;
export const ROW_SPACING = 120;
export const PADDING_X = 80;
export const PADDING_Y = 80;

export function calculateDAGLayout(
  commits: Record<string, Commit>,
  branches: Record<string, string>,
  tags: Record<string, string> = {},
  head?: Head,
  isRemoteGraph: boolean = false
): DAGLayoutResult {
  const commitList = Object.values(commits).sort((a, b) => a.timestamp - b.timestamp);

  if (commitList.length === 0) {
    return { nodes: [], nodeMap: {}, edges: [], width: 500, height: 300 };
  }

  // 1. Group references by commit hash
  const commitBranches: Record<string, string[]> = {};
  const commitRemoteBranches: Record<string, string[]> = {};
  const commitTags: Record<string, string[]> = {};

  Object.entries(branches).forEach(([bName, hash]) => {
    if (hash && commits[hash]) {
      if (isRemoteGraph) {
        if (!commitRemoteBranches[hash]) commitRemoteBranches[hash] = [];
        commitRemoteBranches[hash].push(`origin/${bName}`);
      } else {
        if (!commitBranches[hash]) commitBranches[hash] = [];
        commitBranches[hash].push(bName);
      }
    }
  });

  Object.entries(tags).forEach(([tagName, hash]) => {
    if (hash && commits[hash]) {
      if (!commitTags[hash]) commitTags[hash] = [];
      commitTags[hash].push(tagName);
    }
  });

  // 2. Compute Horizontal Generations (Col: 0 = oldest on left, N = newer on right)
  const commitCols: Record<string, number> = {};
  commitList.forEach((c) => {
    if (c.parentHashes.length === 0) {
      commitCols[c.hash] = 0;
    } else {
      let maxParentCol = 0;
      c.parentHashes.forEach((pHash) => {
        const pCol = commitCols[pHash] ?? 0;
        if (pCol > maxParentCol) maxParentCol = pCol;
      });
      commitCols[c.hash] = maxParentCol + 1;
    }
  });

  // Normalize column collisions (if multiple commits share the same column, increment)
  const colGroups: Record<number, string[]> = {};
  commitList.forEach((c) => {
    const col = commitCols[c.hash];
    if (!colGroups[col]) colGroups[col] = [];
    colGroups[col].push(c.hash);
  });

  let currentColShift = 0;
  const finalCols: Record<string, number> = {};

  Object.keys(colGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((colKey) => {
      const hashes = colGroups[colKey];
      hashes.forEach((hash, idx) => {
        finalCols[hash] = colKey + currentColShift + idx;
      });
      if (hashes.length > 1) {
        currentColShift += hashes.length - 1;
      }
    });

  // 3. Compute Vertical Swimlanes (Rows)
  const activeRows: (string | null)[] = [];
  const commitRows: Record<string, number> = {};

  commitList.forEach((c) => {
    let assignedRow = -1;

    // Try to stay in primary parent's swimlane
    if (c.parentHashes.length > 0) {
      const primaryParent = c.parentHashes[0];
      const parentRow = commitRows[primaryParent];
      if (parentRow !== undefined && activeRows[parentRow] === primaryParent) {
        assignedRow = parentRow;
      }
    }

    if (assignedRow === -1) {
      assignedRow = activeRows.findIndex((rowVal) => rowVal === null);
      if (assignedRow === -1) {
        assignedRow = activeRows.length;
        activeRows.push(null);
      }
    }

    commitRows[c.hash] = assignedRow;
    activeRows[assignedRow] = c.hash;
  });

  // 4. Calculate Coordinates and Node Map
  const nodeMap: Record<string, DAGNodePosition> = {};
  let maxCol = 0;
  let maxRow = 0;

  commitList.forEach((c) => {
    const col = finalCols[c.hash] ?? 0;
    const row = commitRows[c.hash] ?? 0;

    if (col > maxCol) maxCol = col;
    if (row > maxRow) maxRow = row;

    const x = PADDING_X + col * COL_SPACING + NODE_WIDTH / 2;
    const y = PADDING_Y + row * ROW_SPACING + NODE_HEIGHT / 2;

    const attachedBranches = commitBranches[c.hash] || [];
    const attachedRemoteBranches = commitRemoteBranches[c.hash] || [];
    const attachedTags = commitTags[c.hash] || [];

    let isHead = false;
    let headBranch: string | undefined;
    let isDetachedHead = false;

    if (head && !isRemoteGraph) {
      if (head.type === 'branch') {
        const currentBranchTarget = branches[head.value];
        if (currentBranchTarget === c.hash) {
          isHead = true;
          headBranch = head.value;
        }
      } else if (head.type === 'detached' && head.value === c.hash) {
        isHead = true;
        isDetachedHead = true;
      }
    }

    nodeMap[c.hash] = {
      hash: c.hash,
      shortHash: c.hash.substring(0, 7),
      message: c.message,
      x,
      y,
      col,
      row,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      branches: attachedBranches,
      remoteBranches: attachedRemoteBranches,
      tags: attachedTags,
      isHead,
      headBranch,
      isDetachedHead,
    };
  });

  // 5. Generate Edges (Child -> Parent, newer on right pointing leftward to parent)
  const edges: DAGEdge[] = [];

  commitList.forEach((childCommit) => {
    const childNode = nodeMap[childCommit.hash];
    if (!childNode) return;

    childCommit.parentHashes.forEach((pHash) => {
      const parentNode = nodeMap[pHash];
      if (!parentNode) return;

      // Newer child is on right (childNode.x > parentNode.x)
      // Edge starts at left edge of child node
      const startX = childNode.x - NODE_WIDTH / 2;
      const startY = childNode.y;

      // Edge ends at right edge of parent node
      const endX = parentNode.x + NODE_WIDTH / 2;
      const endY = parentNode.y;

      const isMerge = childCommit.parentHashes.length > 1;

      // Bezier curve connecting child to parent
      const midX = (startX + endX) / 2;
      const pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

      edges.push({
        childHash: childCommit.hash,
        parentHash: pHash,
        startX,
        startY,
        endX,
        endY,
        isMerge,
        pathD,
      });
    });
  });

  const totalWidth = PADDING_X * 2 + (maxCol + 1) * COL_SPACING + NODE_WIDTH;
  const totalHeight = PADDING_Y * 2 + (maxRow + 1) * ROW_SPACING + NODE_HEIGHT + 60;

  return {
    nodes: Object.values(nodeMap),
    nodeMap,
    edges,
    width: Math.max(totalWidth, 600),
    height: Math.max(totalHeight, 350),
  };
}

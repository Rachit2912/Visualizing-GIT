export type FileStatus = 'untracked' | 'modified' | 'staged' | 'deleted' | 'unchanged';

export interface FileState {
  name: string;
  content: string;
  status: FileStatus;
  stagedContent?: string;
  lastCommittedContent?: string;
}

export interface Commit {
  hash: string;
  message: string;
  parentHashes: string[];
  snapshot: Record<string, string>;
  author: string;
  timestamp: number;
}

export interface Head {
  type: 'branch' | 'detached';
  value: string;
}

export interface RemoteState {
  branches: Record<string, string>;
  commits: Record<string, Commit>;
}

export interface RepositoryState {
  isInitialized: boolean;
  files: Record<string, FileState>;
  stagingArea: Record<string, string>;
  commits: Record<string, Commit>;
  branches: Record<string, string>;
  head: Head;
  remote: RemoteState;
  remoteName: string;
}

export type AnimationEventType =
  | 'INIT_GIT'
  | 'CREATE_FILE'
  | 'MODIFY_FILE'
  | 'DELETE_FILE'
  | 'MOVE_FILE_TO_STAGING'
  | 'UNSTAGE_FILE'
  | 'CREATE_COMMIT'
  | 'CREATE_BRANCH'
  | 'SWITCH_BRANCH'
  | 'SYNC_REMOTE_FETCH'
  | 'SYNC_REMOTE_PUSH'
  | 'MERGE_COMMIT';

export interface AnimationEvent {
  id: string;
  type: AnimationEventType;
  payload: Record<string, any>;
  description: string;
}

export interface Explanation {
  title: string;
  whatHappened: string;
  why: string;
  underTheHood: string;
  whatChanged: string[];
}

export interface GitOperationResult {
  success: boolean;
  nextState: RepositoryState;
  explanation: Explanation;
  animationEvents: AnimationEvent[];
  output: string;
  error?: string;
}

export interface LessonStep {
  id: number;
  title: string;
  instruction: string;
  hint: string;
  suggestedCommand?: string;
  validate: (state: RepositoryState, lastCommand?: string) => boolean;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  initialState: RepositoryState;
  steps: LessonStep[];
}

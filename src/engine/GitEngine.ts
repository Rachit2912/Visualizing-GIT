import { RepositoryState, GitOperationResult, AnimationEvent, Commit } from '../types/git';

export class GitEngine {
  private state: RepositoryState;

  constructor(initialState: RepositoryState) {
    this.state = JSON.parse(JSON.stringify(initialState));
  }

  public getState(): RepositoryState {
    return JSON.parse(JSON.stringify(this.state));
  }

  public setState(newState: RepositoryState): void {
    this.state = JSON.parse(JSON.stringify(newState));
  }

  public createFile(filename: string, content: string = ''): GitOperationResult {
    const currentState = this.getState();
    const existing = currentState.files[filename];

    const updatedFiles = { ...currentState.files };
    updatedFiles[filename] = {
      name: filename,
      content,
      status: 'untracked',
      lastCommittedContent: existing?.lastCommittedContent,
      stagedContent: existing?.stagedContent,
    };

    const nextState: RepositoryState = {
      ...currentState,
      files: updatedFiles,
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `Created file '${filename}'`,
      explanation: {
        title: `Created file '${filename}'`,
        whatHappened: `You created a new file called ${filename} in your working directory.`,
        why: 'Working directory is where you edit code before telling Git to track changes.',
        underTheHood: `File ${filename} is in the workspace. Git has not recorded any snapshot of it yet.`,
        whatChanged: [`Created working tree file ${filename}`],
      },
      animationEvents: [
        {
          id: `create-file-${Date.now()}`,
          type: 'CREATE_FILE',
          payload: { filename, content },
          description: `Created ${filename} in Working Directory`,
        },
      ],
    };
  }

  public updateFile(filename: string, content: string): GitOperationResult {
    const currentState = this.getState();
    const file = currentState.files[filename];

    if (!file) {
      return this.errorResult(`File '${filename}' does not exist.`);
    }

    const lastCommitted = file.lastCommittedContent;
    const isStaged = currentState.stagingArea[filename] !== undefined;

    let newStatus = file.status;
    if (file.status === 'untracked') {
      newStatus = 'untracked';
    } else if (lastCommitted === undefined) {
      newStatus = 'untracked';
    } else if (content === lastCommitted) {
      newStatus = isStaged ? 'staged' : 'unchanged';
    } else {
      newStatus = 'modified';
    }

    const updatedFiles = {
      ...currentState.files,
      [filename]: {
        ...file,
        content,
        status: newStatus,
      },
    };

    const nextState = {
      ...currentState,
      files: updatedFiles,
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `Updated file '${filename}'`,
      explanation: {
        title: `Edited '${filename}'`,
        whatHappened: `You modified the contents of ${filename}.`,
        why: 'Git notices changes between your working directory file and the last staged or committed snapshot.',
        underTheHood: `Working tree file ${filename} content differs from index and HEAD snapshot.`,
        whatChanged: [`Modified working directory file ${filename}`],
      },
      animationEvents: [
        {
          id: `modify-file-${Date.now()}`,
          type: 'MODIFY_FILE',
          payload: { filename, content },
          description: `Modified ${filename}`,
        },
      ],
    };
  }

  public deleteFile(filename: string): GitOperationResult {
    const currentState = this.getState();
    const file = currentState.files[filename];

    if (!file) {
      return this.errorResult(`File '${filename}' does not exist.`);
    }

    const updatedFiles = { ...currentState.files };
    delete updatedFiles[filename];

    const nextState = {
      ...currentState,
      files: updatedFiles,
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `Deleted file '${filename}'`,
      explanation: {
        title: `Deleted '${filename}'`,
        whatHappened: `You deleted ${filename} from your working directory.`,
        why: 'Deleting a file is a change in the working directory that can be staged and committed.',
        underTheHood: `File ${filename} was removed from filesystem.`,
        whatChanged: [`Deleted ${filename} from working directory`],
      },
      animationEvents: [
        {
          id: `delete-file-${Date.now()}`,
          type: 'DELETE_FILE',
          payload: { filename },
          description: `Deleted ${filename}`,
        },
      ],
    };
  }

  // Helper to simulate a commit created by another developer on Remote (origin)
  public simulateRemoteCommit(message: string, filename: string, content: string): GitOperationResult {
    const currentState = this.getState();
    const parentHash = currentState.remote.branches['main'] || Object.keys(currentState.remote.commits)[0] || '';
    const parentCommit = parentHash ? currentState.remote.commits[parentHash] : null;

    const snapshot: Record<string, string> = parentCommit ? { ...parentCommit.snapshot } : {};
    snapshot[filename] = content;

    const hash = Math.random().toString(16).substring(2, 9);
    const newCommit: Commit = {
      hash,
      message,
      parentHashes: parentHash ? [parentHash] : [],
      snapshot,
      author: 'Collaborator <dev@remote.com>',
      timestamp: Date.now(),
    };

    const nextState: RepositoryState = {
      ...currentState,
      remote: {
        branches: {
          ...currentState.remote.branches,
          main: hash,
        },
        commits: {
          ...currentState.remote.commits,
          [hash]: newCommit,
        },
      },
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `[Remote origin/main ${hash}] ${message}`,
      explanation: {
        title: 'Simulated Remote Change',
        whatHappened: `A collaborator committed '${message}' directly to the remote repository origin/main.`,
        why: 'In real projects, teammates push changes to the remote. You must use git fetch or git pull to bring them into your local repo.',
        underTheHood: `Remote branch ref origin/main updated to ${hash}.`,
        whatChanged: [`Created remote commit ${hash} on origin/main`],
      },
      animationEvents: [
        {
          id: `remote-commit-${hash}`,
          type: 'CREATE_COMMIT',
          payload: { hash, message },
          description: `Collaborator pushed ${hash} to origin/main`,
        },
      ],
    };
  }

  public executeCommand(input: string): GitOperationResult {
    const trimmed = input.trim();
    if (!trimmed) {
      return this.errorResult('Empty command');
    }

    if (trimmed === 'clear') {
      return {
        success: true,
        nextState: this.getState(),
        output: '__CLEAR_CONSOLE__',
        explanation: {
          title: 'clear',
          whatHappened: 'Cleared terminal console window.',
          why: 'Keeps command interface tidy.',
          underTheHood: 'Console history buffer reset.',
          whatChanged: [],
        },
        animationEvents: [],
      };
    }

    const parts = trimmed.split(/\s+/);
    if (parts[0] !== 'git') {
      return this.errorResult(`Command not recognized: '${parts[0]}'. Did you mean 'git ...'?`);
    }

    const subCommand = parts[1];
    const args = parts.slice(2);

    switch (subCommand) {
      case 'init':
        return this.gitInit();
      case 'status':
        return this.gitStatus();
      case 'add':
        return this.gitAdd(args);
      case 'commit':
        return this.gitCommit(args);
      case 'log':
        return this.gitLog();
      case 'branch':
        return this.gitBranch(args);
      case 'switch':
      case 'checkout':
        return this.gitSwitch(args);
      case 'fetch':
        return this.gitFetch();
      case 'push':
        return this.gitPush();
      case 'pull':
        return this.gitPull();
      default:
        return this.errorResult(
          `Unknown or unsupported git command: 'git ${subCommand}'. Supported commands: git init, git status, git add, git commit, git log, git branch, git switch, git fetch, git push, git pull`
        );
    }
  }

  public gitInit(): GitOperationResult {
    const currentState = this.getState();
    if (currentState.isInitialized) {
      return {
        success: true,
        nextState: currentState,
        output: 'Reinitialized existing Git repository',
        explanation: {
          title: 'Repository Already Initialized',
          whatHappened: 'The repository is already initialized.',
          why: 'Running git init again reinitializes the directory safely.',
          underTheHood: '.git directory already exists.',
          whatChanged: [],
        },
        animationEvents: [],
      };
    }

    const nextState: RepositoryState = {
      ...currentState,
      isInitialized: true,
      branches: {
        main: '',
      },
      head: {
        type: 'branch',
        value: 'main',
      },
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: 'Initialized empty Git repository in /my-project/.git/',
      explanation: {
        title: 'git init',
        whatHappened: 'Git created a hidden .git directory in your project.',
        why: 'The .git folder is where Git stores all configuration, objects, staging index, and history.',
        underTheHood: 'Created .git directory structure with default branch refs/heads/main.',
        whatChanged: ['Created .git directory', 'Set default branch to main', 'HEAD points to main'],
      },
      animationEvents: [
        {
          id: `init-${Date.now()}`,
          type: 'INIT_GIT',
          payload: {},
          description: 'Initialized Git Repository (.git)',
        },
      ],
    };
  }

  public gitStatus(): GitOperationResult {
    const currentState = this.getState();
    if (!currentState.isInitialized) {
      return this.errorResult('fatal: not a git repository (or any of the parent directories): .git');
    }

    const branch = currentState.head.type === 'branch' ? currentState.head.value : 'detached';
    const currentCommitHash = currentState.head.type === 'branch'
      ? currentState.branches[branch]
      : currentState.head.value;

    const stagedFiles = Object.keys(currentState.stagingArea);
    const untrackedFiles: string[] = [];
    const modifiedFiles: string[] = [];

    Object.values(currentState.files).forEach((file) => {
      if (file.status === 'untracked') {
        untrackedFiles.push(file.name);
      } else if (file.status === 'modified') {
        modifiedFiles.push(file.name);
      }
    });

    let output = `On branch ${branch}\n`;
    if (!currentCommitHash) {
      output += 'No commits yet\n\n';
    }

    if (stagedFiles.length > 0) {
      output += 'Changes to be committed:\n  (use "git restore --staged <file>..." to unstage)\n';
      stagedFiles.forEach((f) => {
        output += `\tnew file/modified: ${f}\n`;
      });
      output += '\n';
    }

    if (modifiedFiles.length > 0) {
      output += 'Changes not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n';
      modifiedFiles.forEach((f) => {
        output += `\tmodified:   ${f}\n`;
      });
      output += '\n';
    }

    if (untrackedFiles.length > 0) {
      output += 'Untracked files:\n  (use "git add <file>..." to include in what will be committed)\n';
      untrackedFiles.forEach((f) => {
        output += `\t${f}\n`;
      });
      output += '\n';
    }

    if (stagedFiles.length === 0 && modifiedFiles.length === 0 && untrackedFiles.length === 0) {
      output += 'nothing to commit, working tree clean';
    }

    return {
      success: true,
      nextState: currentState,
      output: output.trim(),
      explanation: {
        title: 'git status',
        whatHappened: 'Git checked the working directory and staging area against the current HEAD commit.',
        why: 'git status lets you see which changes are untracked, modified, or staged before committing.',
        underTheHood: 'Git compared file checksums between Working Tree, Index (Staging), and HEAD tree.',
        whatChanged: ['No state changes (read-only command)'],
      },
      animationEvents: [],
    };
  }

  public gitAdd(args: string[]): GitOperationResult {
    const currentState = this.getState();
    if (!currentState.isInitialized) {
      return this.errorResult('fatal: not a git repository (or any of the parent directories): .git');
    }

    if (args.length === 0) {
      return this.errorResult('Nothing specified, nothing added. Usage: git add <file> or git add .');
    }

    const target = args[0];
    const newStagingArea = { ...currentState.stagingArea };
    const newFiles = { ...currentState.files };
    const addedFiles: string[] = [];

    if (target === '.' || target === '-A' || target === '--all') {
      Object.values(currentState.files).forEach((file) => {
        if (file.status === 'untracked' || file.status === 'modified') {
          newStagingArea[file.name] = file.content;
          newFiles[file.name] = {
            ...file,
            status: 'staged',
            stagedContent: file.content,
          };
          addedFiles.push(file.name);
        }
      });
    } else {
      const file = currentState.files[target];
      if (!file) {
        return this.errorResult(`fatal: pathspec '${target}' did not match any files`);
      }
      newStagingArea[target] = file.content;
      newFiles[target] = {
        ...file,
        status: 'staged',
        stagedContent: file.content,
      };
      addedFiles.push(target);
    }

    if (addedFiles.length === 0) {
      return {
        success: true,
        nextState: currentState,
        output: 'Nothing to add. Working directory is up to date.',
        explanation: {
          title: 'git add',
          whatHappened: 'No new or modified files found to stage.',
          why: 'git add only copies files that have uncommitted changes.',
          underTheHood: 'Index matches working tree state.',
          whatChanged: [],
        },
        animationEvents: [],
      };
    }

    const nextState: RepositoryState = {
      ...currentState,
      files: newFiles,
      stagingArea: newStagingArea,
    };

    this.state = nextState;

    const animationEvents: AnimationEvent[] = addedFiles.map((filename) => ({
      id: `add-${filename}-${Date.now()}`,
      type: 'MOVE_FILE_TO_STAGING',
      payload: { filename },
      description: `Staged ${filename} to Staging Area`,
    }));

    return {
      success: true,
      nextState,
      output: `Staged ${addedFiles.join(', ')}`,
      explanation: {
        title: 'git add',
        whatHappened: `You staged ${addedFiles.join(', ')} into the Staging Area.`,
        why: 'git add prepares specific changes for the next commit snapshot.',
        underTheHood: 'Copied file contents into the Git Index (staging area buffer).',
        whatChanged: addedFiles.map((f) => `Moved ${f} to Staging Area`),
      },
      animationEvents,
    };
  }

  public gitCommit(args: string[]): GitOperationResult {
    const currentState = this.getState();
    if (!currentState.isInitialized) {
      return this.errorResult('fatal: not a git repository (or any of the parent directories): .git');
    }

    let message = '';
    const mIndex = args.indexOf('-m');
    if (mIndex !== -1 && args[mIndex + 1]) {
      message = args.slice(mIndex + 1).join(' ').replace(/^["']|["']$/g, '');
    } else if (args.length > 0 && !args[0].startsWith('-')) {
      message = args.join(' ').replace(/^["']|["']$/g, '');
    }

    if (!message) {
      return this.errorResult('Aborting commit due to empty commit message. Use: git commit -m "Your message"');
    }

    const stagedKeys = Object.keys(currentState.stagingArea);
    if (stagedKeys.length === 0) {
      return this.errorResult('Nothing is staged to commit. Stage changes first with "git add <file>".');
    }

    const currentBranch = currentState.head.type === 'branch' ? currentState.head.value : null;
    const parentHash = currentBranch ? currentState.branches[currentBranch] : currentState.head.value;
    const parentCommit = parentHash ? currentState.commits[parentHash] : null;

    const snapshot: Record<string, string> = parentCommit ? { ...parentCommit.snapshot } : {};
    Object.entries(currentState.stagingArea).forEach(([filename, content]) => {
      snapshot[filename] = content;
    });

    const hash = Math.random().toString(16).substring(2, 9);
    const newCommit: Commit = {
      hash,
      message,
      parentHashes: parentHash ? [parentHash] : [],
      snapshot,
      author: 'User <user@example.com>',
      timestamp: Date.now(),
    };

    const newCommits = { ...currentState.commits, [hash]: newCommit };
    const newBranches = { ...currentState.branches };

    if (currentBranch) {
      newBranches[currentBranch] = hash;
    }

    const newFiles = { ...currentState.files };
    Object.keys(snapshot).forEach((filename) => {
      if (newFiles[filename]) {
        newFiles[filename] = {
          ...newFiles[filename],
          status: 'unchanged',
          lastCommittedContent: snapshot[filename],
          stagedContent: undefined,
        };
      }
    });

    const nextState: RepositoryState = {
      ...currentState,
      commits: newCommits,
      branches: newBranches,
      files: newFiles,
      stagingArea: {},
      head: currentBranch ? { type: 'branch', value: currentBranch } : { type: 'detached', value: hash },
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `[${currentBranch || 'detached-HEAD'} ${hash}] ${message}\n ${stagedKeys.length} file(s) changed`,
      explanation: {
        title: 'git commit',
        whatHappened: `Created new commit ${hash} with message "${message}".`,
        why: 'git commit permanently records a snapshot of staged changes in history.',
        underTheHood: `Created commit object ${hash} pointing to tree snapshot and parent commit ${parentHash || 'none'}. Advanced branch reference ${currentBranch}.`,
        whatChanged: [
          `Created commit node ${hash}`,
          `Advanced branch '${currentBranch}' to ${hash}`,
          'Cleared staging area',
        ],
      },
      animationEvents: [
        {
          id: `commit-${hash}`,
          type: 'CREATE_COMMIT',
          payload: { hash, message, parentHash, branch: currentBranch },
          description: `Created Commit ${hash}: "${message}"`,
        },
      ],
    };
  }

  public gitLog(): GitOperationResult {
    const currentState = this.getState();
    if (!currentState.isInitialized) {
      return this.errorResult('fatal: not a git repository (or any of the parent directories): .git');
    }

    const currentBranch = currentState.head.type === 'branch' ? currentState.head.value : null;
    let headHash = currentBranch ? currentState.branches[currentBranch] : currentState.head.value;

    if (!headHash) {
      return this.errorResult(`fatal: your current branch '${currentBranch}' does not have any commits yet`);
    }

    const logLines: string[] = [];
    const visited = new Set<string>();

    let curr: string | undefined = headHash;
    while (curr && currentState.commits[curr] && !visited.has(curr)) {
      visited.add(curr);
      const commitObj: Commit = currentState.commits[curr];
      logLines.push(`commit ${commitObj.hash}`);
      logLines.push(`Author: ${commitObj.author}`);
      logLines.push(`Date:   ${new Date(commitObj.timestamp).toLocaleString()}`);
      logLines.push(`\n    ${commitObj.message}\n`);
      curr = commitObj.parentHashes[0];
    }

    return {
      success: true,
      nextState: currentState,
      output: logLines.join('\n'),
      explanation: {
        title: 'git log',
        whatHappened: 'Displayed commit history leading up to HEAD.',
        why: 'git log lets you review past snapshots, authors, and commit messages.',
        underTheHood: 'Traversed commit object parent links starting from current HEAD reference.',
        whatChanged: ['No state changes (read-only command)'],
      },
      animationEvents: [],
    };
  }

  public gitBranch(args: string[]): GitOperationResult {
    const currentState = this.getState();
    if (!currentState.isInitialized) {
      return this.errorResult('fatal: not a git repository (or any of the parent directories): .git');
    }

    if (args.length === 0) {
      const currentBranch = currentState.head.type === 'branch' ? currentState.head.value : null;
      let output = '';
      Object.keys(currentState.branches).forEach((b) => {
        if (b === currentBranch) {
          output += `* ${b}\n`;
        } else {
          output += `  ${b}\n`;
        }
      });
      return {
        success: true,
        nextState: currentState,
        output: output.trim(),
        explanation: {
          title: 'git branch',
          whatHappened: 'Listed available local branches.',
          why: 'git branch shows all branch pointers in your local repository.',
          underTheHood: 'Read ref pointers from .git/refs/heads/',
          whatChanged: [],
        },
        animationEvents: [],
      };
    }

    const branchName = args[0];
    if (currentState.branches[branchName] !== undefined) {
      return this.errorResult(`fatal: a branch named '${branchName}' already exists.`);
    }

    const currentBranch = currentState.head.type === 'branch' ? currentState.head.value : null;
    const currentHash = currentBranch ? currentState.branches[currentBranch] : currentState.head.value;

    const nextState: RepositoryState = {
      ...currentState,
      branches: {
        ...currentState.branches,
        [branchName]: currentHash || '',
      },
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `Created branch '${branchName}'`,
      explanation: {
        title: 'git branch',
        whatHappened: `Created new branch reference '${branchName}' pointing to commit ${currentHash || 'none'}.`,
        why: 'A branch in Git is just a lightweight pointer to a commit.',
        underTheHood: `Created .git/refs/heads/${branchName} file containing hash ${currentHash || 'empty'}.`,
        whatChanged: [`Created branch pointer '${branchName}'`],
      },
      animationEvents: [
        {
          id: `branch-${branchName}`,
          type: 'CREATE_BRANCH',
          payload: { branchName, targetHash: currentHash },
          description: `Created branch reference '${branchName}'`,
        },
      ],
    };
  }

  public gitSwitch(args: string[]): GitOperationResult {
    const currentState = this.getState();
    if (!currentState.isInitialized) {
      return this.errorResult('fatal: not a git repository (or any of the parent directories): .git');
    }

    if (args.length === 0) {
      return this.errorResult('Please specify a branch name to switch to. Usage: git switch <branch>');
    }

    const targetBranch = args[0] === '-c' ? args[1] : args[0];
    const createNew = args[0] === '-c';

    if (createNew) {
      this.gitBranch([targetBranch]);
    }

    const updatedState = this.getState();
    if (updatedState.branches[targetBranch] === undefined) {
      return this.errorResult(`fatal: invalid reference: ${targetBranch}`);
    }

    const targetCommitHash = updatedState.branches[targetBranch];
    const targetCommit = targetCommitHash ? updatedState.commits[targetCommitHash] : null;

    const newFiles = { ...updatedState.files };
    if (targetCommit) {
      Object.entries(targetCommit.snapshot).forEach(([filename, content]) => {
        newFiles[filename] = {
          name: filename,
          content,
          status: 'unchanged',
          lastCommittedContent: content,
        };
      });
    }

    const nextState: RepositoryState = {
      ...updatedState,
      head: {
        type: 'branch',
        value: targetBranch,
      },
      files: newFiles,
      stagingArea: {},
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `Switched to branch '${targetBranch}'`,
      explanation: {
        title: 'git switch',
        whatHappened: `Moved HEAD to point to branch '${targetBranch}'.`,
        why: 'git switch changes your active working branch and updates working tree files to match.',
        underTheHood: `Updated .git/HEAD file to point to ref: refs/heads/${targetBranch}.`,
        whatChanged: [`Moved HEAD -> '${targetBranch}'`, 'Updated working directory files'],
      },
      animationEvents: [
        {
          id: `switch-${targetBranch}`,
          type: 'SWITCH_BRANCH',
          payload: { branchName: targetBranch },
          description: `HEAD switched to '${targetBranch}'`,
        },
      ],
    };
  }

  public gitFetch(): GitOperationResult {
    const currentState = this.getState();
    if (!currentState.isInitialized) {
      return this.errorResult('fatal: not a git repository');
    }

    const newCommits = { ...currentState.commits, ...currentState.remote.commits };
    const remoteBranches = { ...currentState.remote.branches };

    const nextState: RepositoryState = {
      ...currentState,
      commits: newCommits,
      remote: {
        ...currentState.remote,
        branches: remoteBranches,
      },
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: 'From origin\n * [updated] main -> origin/main',
      explanation: {
        title: 'git fetch',
        whatHappened: 'Downloaded remote commits and updated remote-tracking branch origin/main.',
        why: 'git fetch lets you see remote updates without altering your local branch.',
        underTheHood: 'Updated origin/main ref in .git/refs/remotes/origin/. Local branch pointer was NOT moved.',
        whatChanged: ['Updated remote-tracking reference origin/main'],
      },
      animationEvents: [
        {
          id: `fetch-${Date.now()}`,
          type: 'SYNC_REMOTE_FETCH',
          payload: {},
          description: 'Fetched remote commits into origin/ tracking refs',
        },
      ],
    };
  }

  public gitPush(): GitOperationResult {
    const currentState = this.getState();
    if (!currentState.isInitialized) {
      return this.errorResult('fatal: not a git repository');
    }

    const currentBranch = currentState.head.type === 'branch' ? currentState.head.value : null;
    if (!currentBranch) {
      return this.errorResult('fatal: You are not currently on a branch.');
    }

    const currentHash = currentState.branches[currentBranch];
    if (!currentHash) {
      return this.errorResult(`fatal: The current branch ${currentBranch} has no commits to push.`);
    }

    const remoteCommits = { ...currentState.remote.commits };
    let curr: string | undefined = currentHash;

    while (curr && currentState.commits[curr]) {
      remoteCommits[curr] = currentState.commits[curr];
      curr = currentState.commits[curr].parentHashes[0];
    }

    const nextState: RepositoryState = {
      ...currentState,
      remote: {
        branches: {
          ...currentState.remote.branches,
          [currentBranch]: currentHash,
        },
        commits: remoteCommits,
      },
    };

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `To origin\n   ${currentHash.substring(0, 7)}..${currentHash.substring(0, 7)} ${currentBranch} -> ${currentBranch}`,
      explanation: {
        title: 'git push',
        whatHappened: `Transferred local commits on branch '${currentBranch}' to remote repository '${currentState.remoteName}'.`,
        why: 'git push uploads your local commits to a shared remote server so collaborators can access them.',
        underTheHood: `Updated remote reference refs/heads/${currentBranch} to commit ${currentHash}.`,
        whatChanged: [`Synchronized ${currentBranch} to remote origin/${currentBranch}`],
      },
      animationEvents: [
        {
          id: `push-${Date.now()}`,
          type: 'SYNC_REMOTE_PUSH',
          payload: { branch: currentBranch, hash: currentHash },
          description: `Pushed local branch '${currentBranch}' to remote`,
        },
      ],
    };
  }

  public gitPull(): GitOperationResult {
    const fetchResult = this.gitFetch();
    const currentState = this.getState();

    const currentBranch = currentState.head.type === 'branch' ? currentState.head.value : null;
    if (!currentBranch) {
      return this.errorResult('fatal: You are not currently on a branch.');
    }

    const remoteHash = currentState.remote.branches[currentBranch];
    if (!remoteHash) {
      return {
        ...fetchResult,
        output: `${fetchResult.output}\nAlready up to date.`,
      };
    }

    const nextState: RepositoryState = {
      ...this.getState(),
      branches: {
        ...currentState.branches,
        [currentBranch]: remoteHash,
      },
    };

    const remoteCommit = currentState.commits[remoteHash] || currentState.remote.commits[remoteHash];
    if (remoteCommit) {
      Object.entries(remoteCommit.snapshot).forEach(([filename, content]) => {
        nextState.files[filename] = {
          name: filename,
          content,
          status: 'unchanged',
          lastCommittedContent: content,
        };
      });
    }

    this.state = nextState;

    return {
      success: true,
      nextState,
      output: `Updating ${currentBranch}\nFast-forward`,
      explanation: {
        title: 'git pull',
        whatHappened: `Fetched remote changes and integrated origin/${currentBranch} into local branch '${currentBranch}'.`,
        why: 'git pull is a shortcut command that combines git fetch and git merge.',
        underTheHood: `Advanced local ref refs/heads/${currentBranch} to match origin/${currentBranch}.`,
        whatChanged: [`Fetched remote changes`, `Updated local branch '${currentBranch}'`],
      },
      animationEvents: [
        ...fetchResult.animationEvents,
        {
          id: `pull-merge-${Date.now()}`,
          type: 'MERGE_COMMIT',
          payload: { branch: currentBranch, hash: remoteHash },
          description: `Integrated remote commit into '${currentBranch}'`,
        },
      ],
    };
  }

  private errorResult(message: string): GitOperationResult {
    const currentState = this.getState();
    return {
      success: false,
      nextState: currentState,
      output: message,
      error: message,
      explanation: {
        title: 'Command Failed',
        whatHappened: message,
        why: 'Git rejected this operation because pre-conditions were not met.',
        underTheHood: 'Git command handler returned error exit code 1.',
        whatChanged: ['No changes made to repository state'],
      },
      animationEvents: [],
    };
  }
}

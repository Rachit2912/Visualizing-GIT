import { Lesson, RepositoryState } from '../types/git';
import { createInitialRepositoryState } from './initialState';

export const guidedLessons: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Lesson 1: Your First Commit',
    description: 'Learn how to initialize a repository, create files, stage them, and create your very first Git commit.',
    initialState: createInitialRepositoryState(),
    steps: [
      {
        id: 1,
        title: 'Step 1: Initialize Git Repository',
        instruction: 'Run `git init` in the terminal to initialize a new Git repository.',
        hint: 'Type `git init` in the terminal prompt below.',
        suggestedCommand: 'git init',
        validate: (state: RepositoryState) => state.isInitialized,
      },
      {
        id: 2,
        title: 'Step 2: Check Repository Status',
        instruction: 'Check the working directory status using `git status`.',
        hint: 'Type `git status` in the terminal.',
        suggestedCommand: 'git status',
        validate: (_state: RepositoryState, lastCmd?: string) => lastCmd === 'git status',
      },
      {
        id: 3,
        title: 'Step 3: Stage app.js',
        instruction: 'Stage the file `app.js` into the Staging Area using `git add app.js` or click the Stage button.',
        hint: 'Type `git add app.js` or click the "Stage" button next to app.js.',
        suggestedCommand: 'git add app.js',
        validate: (state: RepositoryState) => state.stagingArea['app.js'] !== undefined,
      },
      {
        id: 4,
        title: 'Step 4: Create your First Commit',
        instruction: 'Create a commit snapshot with a message using `git commit -m "Initial commit"`.',
        hint: 'Type `git commit -m "Initial commit"` in the terminal.',
        suggestedCommand: 'git commit -m "Initial commit"',
        validate: (state: RepositoryState) => Object.keys(state.commits).length >= 1,
      },
    ],
  },
  {
    id: 'lesson-2',
    title: 'Lesson 2: Branching & Switching',
    description: 'Understand how Git branches work as lightweight pointers to commits.',
    initialState: (() => {
      const base = createInitialRepositoryState();
      base.isInitialized = true;
      base.branches = { main: 'c1' };
      base.commits = {
        c1: {
          hash: 'c1',
          message: 'Initial commit',
          parentHashes: [],
          snapshot: { 'app.js': 'console.log("hello");' },
          author: 'User',
          timestamp: Date.now() - 10000,
        },
      };
      base.files = {
        'app.js': {
          name: 'app.js',
          content: 'console.log("hello");',
          status: 'unchanged',
          lastCommittedContent: 'console.log("hello");',
        },
      };
      return base;
    })(),
    steps: [
      {
        id: 1,
        title: 'Step 1: Create a Feature Branch',
        instruction: 'Create a new branch named `feature-login` using `git branch feature-login`.',
        hint: 'Type `git branch feature-login`. Notice how a new pointer appears on the commit without duplicating code!',
        suggestedCommand: 'git branch feature-login',
        validate: (state: RepositoryState) => state.branches['feature-login'] !== undefined,
      },
      {
        id: 2,
        title: 'Step 2: Switch to feature-login Branch',
        instruction: 'Move HEAD to `feature-login` using `git switch feature-login`.',
        hint: 'Type `git switch feature-login`.',
        suggestedCommand: 'git switch feature-login',
        validate: (state: RepositoryState) => state.head.value === 'feature-login',
      },
      {
        id: 3,
        title: 'Step 3: Make a Commit on Feature Branch',
        instruction: 'Edit `app.js` or stage and commit changes to advance `feature-login`.',
        hint: 'Edit app.js or run `git add .` and then `git commit -m "Add login"`.',
        suggestedCommand: 'git commit -m "Add login feature"',
        validate: (state: RepositoryState) => Object.keys(state.commits).length >= 2,
      },
    ],
  },
  {
    id: 'lesson-3',
    title: 'Lesson 3: Remote Repository & Push',
    description: 'Learn how to synchronize your local commits with a remote repository.',
    initialState: (() => {
      const base = createInitialRepositoryState();
      base.isInitialized = true;
      base.branches = { main: 'c1' };
      base.commits = {
        c1: {
          hash: 'c1',
          message: 'Initial commit',
          parentHashes: [],
          snapshot: { 'README.md': '# Project' },
          author: 'User',
          timestamp: Date.now() - 20000,
        },
      };
      return base;
    })(),
    steps: [
      {
        id: 1,
        title: 'Step 1: Push Commits to Remote',
        instruction: 'Synchronize your local commits to the remote origin using `git push`.',
        hint: 'Type `git push` in the terminal.',
        suggestedCommand: 'git push',
        validate: (state: RepositoryState) => state.remote.branches['main'] !== undefined,
      },
      {
        id: 2,
        title: 'Step 2: Fetch Remote Updates',
        instruction: 'Test fetching remote references using `git fetch`.',
        hint: 'Type `git fetch`. Notice how origin/main updates without moving your local branch.',
        suggestedCommand: 'git fetch',
        validate: (_state: RepositoryState, lastCmd?: string) => lastCmd === 'git fetch',
      },
    ],
  },
];

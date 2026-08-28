import { describe, it, expect, beforeEach } from 'vitest';
import { GitEngine } from './GitEngine';
import { createInitialRepositoryState } from './initialState';

describe('GitEngine Unit Tests', () => {
  let engine: GitEngine;

  beforeEach(() => {
    engine = new GitEngine(createInitialRepositoryState());
  });

  it('should initialize repository with git init', () => {
    const res = engine.executeCommand('git init');
    expect(res.success).toBe(true);
    expect(res.nextState.isInitialized).toBe(true);
    expect(res.nextState.head.value).toBe('main');
    expect(res.animationEvents).toHaveLength(1);
    expect(res.animationEvents[0].type).toBe('INIT_GIT');
  });

  it('should manage file creation, modification, and deletion', () => {
    engine.executeCommand('git init');

    const resCreate = engine.createFile('test.ts', 'console.log(1);');
    expect(resCreate.success).toBe(true);
    expect(engine.getState().files['test.ts'].status).toBe('untracked');

    const resUpdate = engine.updateFile('test.ts', 'console.log(2);');
    expect(resUpdate.success).toBe(true);
    expect(engine.getState().files['test.ts'].content).toBe('console.log(2);');

    const resDelete = engine.deleteFile('test.ts');
    expect(resDelete.success).toBe(true);
    expect(engine.getState().files['test.ts']).toBeUndefined();
  });

  it('should stage files with git add and git add .', () => {
    engine.executeCommand('git init');
    engine.createFile('file1.txt', 'Hello');
    engine.createFile('file2.txt', 'World');

    const resSingle = engine.executeCommand('git add file1.txt');
    expect(resSingle.success).toBe(true);
    expect(engine.getState().stagingArea['file1.txt']).toBe('Hello');
    expect(engine.getState().files['file1.txt'].status).toBe('staged');

    const resAll = engine.executeCommand('git add .');
    expect(resAll.success).toBe(true);
    expect(engine.getState().stagingArea['file2.txt']).toBe('World');
  });

  it('should fail git commit if staging area is empty or message missing', () => {
    engine.executeCommand('git init');

    const resFail = engine.executeCommand('git commit -m "Initial"');
    expect(resFail.success).toBe(false);
    expect(resFail.error).toContain('Nothing is staged');

    engine.executeCommand('git add .');
    const resNoMsg = engine.executeCommand('git commit');
    expect(resNoMsg.success).toBe(false);
    expect(resNoMsg.error).toContain('Aborting commit due to empty commit message');
  });

  it('should successfully create a commit and advance branch', () => {
    engine.executeCommand('git init');
    engine.executeCommand('git add .');
    const resCommit = engine.executeCommand('git commit -m "Initial commit"');

    expect(resCommit.success).toBe(true);
    const state = engine.getState();
    const commitHashes = Object.keys(state.commits);
    expect(commitHashes).toHaveLength(1);
    const commitHash = commitHashes[0];

    expect(state.branches['main']).toBe(commitHash);
    expect(state.commits[commitHash].message).toBe('Initial commit');
    expect(Object.keys(state.stagingArea)).toHaveLength(0);
    expect(state.files['app.js'].status).toBe('unchanged');
  });

  it('should handle branch creation and switching', () => {
    engine.executeCommand('git init');
    engine.executeCommand('git add .');
    engine.executeCommand('git commit -m "Initial"');

    const resBranch = engine.executeCommand('git branch feature');
    expect(resBranch.success).toBe(true);
    expect(engine.getState().branches['feature']).toBeDefined();

    const resSwitch = engine.executeCommand('git switch feature');
    expect(resSwitch.success).toBe(true);
    expect(engine.getState().head.value).toBe('feature');
  });

  it('should log commit history', () => {
    engine.executeCommand('git init');
    engine.executeCommand('git add .');
    engine.executeCommand('git commit -m "First commit"');

    const resLog = engine.executeCommand('git log');
    expect(resLog.success).toBe(true);
    expect(resLog.output).toContain('First commit');
  });

  it('should push, fetch, and pull correctly', () => {
    engine.executeCommand('git init');
    engine.executeCommand('git add .');
    engine.executeCommand('git commit -m "Initial"');

    const resPush = engine.executeCommand('git push');
    expect(resPush.success).toBe(true);
    expect(engine.getState().remote.branches['main']).toBeDefined();

    const resFetch = engine.executeCommand('git fetch');
    expect(resFetch.success).toBe(true);

    const resPull = engine.executeCommand('git pull');
    expect(resPull.success).toBe(true);
  });

  it('should handle invalid or unknown commands gracefully', () => {
    const res = engine.executeCommand('git foo');
    expect(res.success).toBe(false);
    expect(res.error).toContain('Unknown or unsupported git command');
  });
});

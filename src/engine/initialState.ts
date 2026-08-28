import { RepositoryState } from '../types/git';

export const createInitialRepositoryState = (): RepositoryState => ({
  isInitialized: false,
  files: {
    'index.html': {
      name: 'index.html',
      content: '<!DOCTYPE html>\n<html>\n  <head><title>My App</title></head>\n  <body><h1>Hello World</h1></body>\n</html>',
      status: 'untracked',
    },
    'app.js': {
      name: 'app.js',
      content: 'console.log("Welcome to Visual Git!");',
      status: 'untracked',
    },
  },
  stagingArea: {},
  commits: {},
  branches: {},
  tags: {},
  head: {
    type: 'branch',
    value: 'main',
  },
  remote: {
    branches: {},
    commits: {},
    tags: {},
  },
  remoteName: 'origin',
});

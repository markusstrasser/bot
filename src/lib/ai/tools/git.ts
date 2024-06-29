import simpleGit, { SimpleGit } from 'simple-git';

const git: SimpleGit = simpleGit();

const gitOperations = {
  commit: (message: string) => git.add('.').commit(message),
  push: (remote = 'origin', branch = 'main') => git.push(remote, branch),
  pull: (remote = 'origin', branch = 'main') => git.pull(remote, branch),
  checkout: (branch: string) => git.checkout(branch),
  createBranch: (branch: string) => git.checkoutLocalBranch(branch),
  status: () => git.status(),
  log: (maxCount = 10) => git.log({ maxCount }),
};

export const gitActions = new Proxy(gitOperations, {
  get: (target, prop: keyof typeof gitOperations) => 
    async (...args: any[]) => {
      try {
        //@ts-ignore
        return await target[prop](...args);
      } catch (error) {
        console.error(`Git operation '${String(prop)}' failed:`, error);
        throw error;
      }
    }
});

// Usage example:
// await gitActions.commit('Update feature X');
// await gitActions.push();

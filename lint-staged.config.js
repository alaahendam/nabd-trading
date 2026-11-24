import path from 'node:path';

const WORKSPACES = ['apps/web', 'apps/server', 'packages/shared', 'packages/config'];
const CODE = /\.(?:[cm]?[jt]sx?)$/;
const CSS = /\.css$/;

const quote = (file) => `"${file}"`;
const relative = (file) => path.relative(process.cwd(), file).split(path.sep).join('/');

/**
 * One sequential task list per commit: format first, then lint with the config of the
 * workspace each file belongs to (flat config is resolved from the workspace directory).
 */
export default {
  '*': (files) => {
    const commands = [`prettier --write --ignore-unknown ${files.map(quote).join(' ')}`];

    for (const workspace of WORKSPACES) {
      const owned = files.filter((file) => relative(file).startsWith(`${workspace}/`));
      const code = owned.filter((file) => CODE.test(file));
      if (code.length > 0) {
        const inWorkspace = code.map((file) => quote(path.relative(path.resolve(workspace), file)));
        commands.push(
          `pnpm --dir ${workspace} exec eslint --fix --max-warnings 0 --no-warn-ignored ${inWorkspace.join(' ')}`,
        );
      }
    }

    const rootCode = files.filter(
      (file) =>
        CODE.test(file) &&
        !WORKSPACES.some((workspace) => relative(file).startsWith(`${workspace}/`)),
    );
    if (rootCode.length > 0) {
      commands.push(
        `eslint --fix --max-warnings 0 --no-warn-ignored ${rootCode.map(quote).join(' ')}`,
      );
    }

    const css = files.filter((file) => CSS.test(file));
    if (css.length > 0) {
      commands.push(`stylelint --max-warnings 0 ${css.map(quote).join(' ')}`);
    }

    return commands;
  },
};

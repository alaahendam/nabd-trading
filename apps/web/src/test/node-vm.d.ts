/** Test-only: just what the pre-paint script test uses from Node, so the browser build never sees Node types. */
declare module 'node:vm' {
  export function runInNewContext(code: string, sandbox: object): unknown;
}

import { StdIn, StdOut } from "./std";

export class Process {
  env: { [key: string]: string | undefined } = {};
  argv: string[] = [];
  exitCode = 0;
  cwd = "/home/web/app";
  stdin!: StdIn;
  stdout!: StdOut;
  stderr!: StdOut;

  constructor({
    stdin,
    stdout,
    stderr,
    env,
    argv,
    cwd,
  }: {
    stdin: StdIn;
    stdout: StdOut;
    stderr: StdOut;
    env?: { [key: string]: string | undefined };
    argv?: string[];
    cwd: string;
  }) {
    this.stdin = stdin;
    this.stdout = stdout;
    this.stderr = stderr;
    this.env = env ?? {};
    this.argv = argv ?? [];
    this.cwd = cwd;
  }
}

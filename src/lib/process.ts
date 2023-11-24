import { StdIn, StdOut } from "./std";

export class Process {
  env: { [key: string]: string | undefined } = {};
  argv: string[] = [];
  exitCode = 0;
  cwd = "/home/web/app";
  stdin!: StdIn;
  stdout!: StdOut;
  stderr!: StdOut;
  versions = {
    node: "v14.15.0",
    pnp: "1.1.0",
    v8: "8.4.371.19-node.18",
    uv: "1.40.0",
    zlib: "1.2.11",
    brotli: "1.0.9",
    ares: "1.16.1",
    modules: "83",
    nghttp2: "1.41.0",
    napi: "7",
    llhttp: "2.1.3",
    openssl: "1.1.1h",
    cldr: "37.0",
    icu: "67.1",
    tz: "2020a",
    unicode: "13.0",
    ngtcp2: "0.1.0-DEV",
  };

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

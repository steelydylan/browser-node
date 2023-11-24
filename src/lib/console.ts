import { StdOut } from "./std";

export function createConsole(stdout: StdOut, stderr: StdOut) {
  return {
    log: (...args: unknown[]) => {
      stdout.write(args.join(" ") + "\n");
    },
    error: (...args: unknown[]) => {
      stderr.write(args.join(" ") + "\n");
    },
    info: (...args: unknown[]) => {
      stdout.write(args.join(" ") + "\n");
    },
  };
}

export type Console = ReturnType<typeof createConsole>;

import { IFs, memfs } from "memfs";
import { runNpmCli } from "npm-in-browser";
import path from "path";
import { runCode } from "./require";
import { Volume } from "memfs/lib/volume";
import { StdIn, StdOut, createStd } from "./std";
import { Emitter } from "mitt";
import { createConsole } from "./console";
import { Process } from "./process";

const decoder = new TextDecoder();

function ensurePath(str: string) {
  return str.startsWith("./") || str.startsWith("../") || str.startsWith("/")
    ? str
    : `./${str}`;
}

export class NodeBrowser {
  fs!: IFs;
  vol!: Volume;
  cwd = "/home/web/app";
  stdin!: StdIn;
  stdout!: StdOut;
  stderr!: StdOut;
  emitter!: Emitter<{ data: string }>;
  commandStr = "";

  constructor() {
    const { stdin, stdout, stderr, emitter } = createStd();
    this.stdin = stdin;
    this.stdout = stdout;
    this.stderr = stderr;
    this.emitter = emitter;
  }

  mount(files: Record<string, string>) {
    const { fs, vol } = memfs(files, this.cwd);
    this.fs = fs;
    this.vol = vol;
    // this.command(["npm", "install", "npm"]);
  }

  private async runNpm(commands: string[]) {
    if (commands[0] === "run") {
      const [scriptName, ...rest] = commands.slice(1);
      const packageJson = JSON.parse(
        this.fs.readFileSync(path.join(this.cwd, "package.json"), "utf-8")
      );
      const script = packageJson.scripts[scriptName];
      const scriptCommands = script.split(" ");
      await this.command([...scriptCommands, ...rest]);
      return;
    } else if (commands[0] === "start") {
      const packageJson = JSON.parse(
        this.fs.readFileSync(path.join(this.cwd, "package.json"), "utf-8")
      );
      const script = packageJson.scripts.start;
      const scriptCommands = script.split(" ");
      await this.command(scriptCommands);
      return;
    } else if (commands[0] === "test") {
      const packageJson = JSON.parse(
        this.fs.readFileSync(path.join(this.cwd, "package.json"), "utf-8")
      );
      const script = packageJson.scripts.test;
      const scriptCommands = script.split(" ");
      await this.command(scriptCommands);
      return;
    }
    if (commands[0] === "install") {
      this.stdout.write("installing...\n");
    }
    await runNpmCli(commands, {
      fs: this.fs,
      cwd: this.cwd,
      stdout: (chunk) => {
        this.stdout.write(chunk);
      },
      stderr: (chunk) => {
        this.stderr.write(chunk);
      },
      timings: {
        start(name) {
          console.log("START: " + name);
        },
        end(name) {
          console.log("END: " + name);
        },
      },
    });
  }

  async command(commands: string[]) {
    const [firstCommand, ...restCommands] = commands;

    if (firstCommand === "npm") {
      await this.runNpm(restCommands);
    } else if (firstCommand === "node") {
      const filePath = restCommands[0];
      const console = createConsole(this.stdout, this.stderr);
      runCode({
        filePath: ensurePath(filePath),
        fs: this.fs,
        cwd: this.cwd,
        console,
        process: new Process({
          stdin: this.stdin,
          stdout: this.stdout,
          stderr: this.stderr,
          env: {},
          argv: [ensurePath(filePath)],
          cwd: this.cwd,
        }),
      });
    } else if (firstCommand === "cd") {
      this.cdCommand(restCommands);
    } else if (firstCommand === "ls") {
      this.lsCommand(restCommands);
    } else if (firstCommand === "cat") {
      this.catCommand(restCommands);
    } else {
      this.runExecutable(commands);
    }
  }

  private async runExecutable(commands: string[]) {
    const [executable, ...args] = commands;
    const executablePath = path.join(this.cwd, "node_modules", executable);
    const packageJson = JSON.parse(
      this.fs.readFileSync(path.join(executablePath, "package.json"), "utf-8")
    );
    const bin = packageJson.bin;
    const binName = Object.keys(bin)[0];
    const binPath = path.join(executablePath, bin[binName]);

    const console = createConsole(this.stdout, this.stderr);
    const process = new Process({
      stdin: this.stdin,
      stdout: this.stdout,
      stderr: this.stderr,
      env: {},
      argv: [binPath, ...args],
      cwd: this.cwd,
    });
    runCode({
      filePath: binPath,
      fs: this.fs,
      cwd: this.cwd,
      console,
      process,
    });
  }

  private async cdCommand(commands: string[]) {
    const [dirPath] = commands;
    if (dirPath.startsWith("/")) {
      this.cwd = dirPath;
    } else {
      this.cwd = path.join(this.cwd, dirPath);
    }
  }

  private async lsCommand(commands: string[]) {
    const [dirPath] = commands;
    const dir = path.join(this.cwd, dirPath || "");
    const files = this.fs.readdirSync(dir);
    this.stdout.write(files.join("\n") + "\n");
  }

  private async catCommand(commands: string[]) {
    const [filePath] = commands;
    const file = path.join(this.cwd, filePath);
    const content = this.fs.readFileSync(file, "utf-8");
    this.stdout.write(content + "\n");
  }

  onData(cb: (data: string) => void) {
    this.emitter.on("data", () => {
      this.stdin.read().forEach((chunk) => {
        cb(decoder.decode(chunk));
      });
    });
  }

  write(data: string) {
    // delete
    if (data === "\x7f") {
      this.stdout.write("\b \b");
      this.commandStr = this.commandStr.slice(0, -1);
      return;
    } else if (data === "\r") {
      this.stdout.write("\n");
      const commands = this.commandStr.split(" ");
      this.commandStr = "";
      this.command(commands);
    } else {
      this.commandStr += data;
      this.stdout.write(data);
    }
  }
}

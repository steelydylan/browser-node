import { IFs } from "memfs";
import path from "path";
import * as ts from "typescript";
import { defaultModule } from "./default-module";
import { Console } from "./console";
import { Process } from "./process";

function isRelativePath(filePath: string) {
  return filePath.startsWith(".") || filePath.startsWith("/");
}

function resolveModule(moduleName: string, fs: IFs, cwd: string) {
  if (isRelativePath(moduleName)) {
    return resolveRelative(moduleName, fs, cwd);
  } else {
    return resolveAbsolute(moduleName, fs, cwd);
  }
}

function resolveRelative(filePath: string, fs: IFs, cwd: string) {
  // 拡張子がない場合、様々な拡張子を試す
  if (!/\.[^/.]+$/.test(filePath)) {
    for (const ext of [".js", ".mjs", ".cjs"]) {
      try {
        const tmpFilePath = filePath + ext;

        if (fs.existsSync(path.join(cwd, tmpFilePath))) {
          return path.join(cwd, tmpFilePath);
        }
      } catch (e) {
        console.log(e);
        // ファイルが見つからなかった場合、次の拡張子を試す
      }
    }
  } else {
    if (fs.existsSync(path.join(cwd, filePath))) {
      return path.join(cwd, filePath);
    }
  }
  throw new Error(`Cannot find module '${filePath}'`);
}

function resolveMainField(mainField: string, fs: IFs, cwd: string) {
  for (const ext of ["", ".js", ".mjs", ".cjs", "/index.js", "/index.mjs"]) {
    try {
      const mainPath = mainField + ext;
      const finalPath = path.join(cwd, mainPath);
      if (fs.existsSync(finalPath)) {
        const stats = fs.statSync(finalPath);
        if (stats.isFile()) {
          return finalPath;
        }
      }
    } catch (e) {
      console.log(e);
      // ファイルが見つからなかった場合、次の拡張子を試す
    }
  }
  throw new Error(`Cannot find module '${mainField}'`);
}

function resolveAbsoluteFromNodeModules(
  moduleName: string,
  fs: IFs,
  cwd: string
) {
  const basePath = "/node_modules/" + moduleName;
  const packageJsonPath = basePath + "/package.json";
  const defaultField = "index.js"; // デフォルトのエントリーポイント
  let mainFieldPath = "";

  try {
    const packageJson = JSON.parse(
      // @ts-expect-error TODO: fix this
      fs.readFileSync(path.join(cwd, packageJsonPath), "utf8")
    );

    const mainField = packageJson.main || defaultField;
    mainFieldPath = resolveMainField(mainField, fs, path.join(cwd, basePath));
  } catch (e) {
    // package.jsonが見つからない場合の処理
  }
  return mainFieldPath;
}

function resolveAbsolute(moduleName: string, fs: IFs, cwd: string) {
  const mainFieldPath = resolveAbsoluteFromNodeModules(moduleName, fs, cwd);
  return mainFieldPath;
}

export function runCode({
  filePath,
  fs,
  cwd,
  console,
  process,
}: {
  filePath: string;
  fs: IFs;
  cwd: string;
  console: Console;
  process: Process;
}) {
  function customRequire(filePath: string) {
    try {
      if (filePath === "fs") {
        return fs;
      }
      if (filePath === "console") {
        return console;
      }
      if (filePath === "process") {
        return process;
      }
      // @ts-expect-error TODO: fix this
      if (defaultModule[filePath]) {
        // @ts-expect-error TODO: fix this
        return defaultModule[filePath];
      }
      // @ts-expect-error TODO: fix this
      const baseDir = isRelativePath(filePath) && this ? this : cwd;

      const tmpFilePath = resolveModule(filePath, fs, baseDir);

      const exports = {};
      const module = { exports };

      // nodeの起動下ファイルを特定するために利用
      if (!customRequire.main) {
        // @ts-expect-error TODO: fix this
        customRequire.main = module;
      }

      const dirName = path.dirname(tmpFilePath);

      const code = fs.readFileSync(tmpFilePath, "utf8");
      // @ts-expect-error TODO: fix this
      const removeUserBinNode = code.replace(
        /^#!.*\n/,
        ""
      ); /* shebangを削除する */

      const addRequireCode = `const __dirname = "${dirName}";
        const process = require("process");
        const console = require("console");
        ${removeUserBinNode}`;

      // import文をサポート
      const finalCode = ts.transpileModule(addRequireCode, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
        },
      }).outputText;

      const script = new Function("require", "module", "exports", finalCode);

      script(customRequire.bind(dirName), module, exports);

      return module.exports;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  // `require.main`プロパティの初期化
  customRequire.main = null;
  customRequire.resolve = (filePath: string) => {
    return resolveModule(filePath, fs, cwd);
  };

  if (filePath.startsWith("/")) {
    customRequire("./" + path.relative(cwd, filePath));
  } else {
    customRequire(filePath);
  }
}

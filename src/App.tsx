import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import "./App.css";
import "./index.css";
import { NodeBrowser } from "./lib/node-browser";

const node = new NodeBrowser();

const files = {
  "./main.js": `
      const { hello } = require('./hello');
      const cows = require('cows');
      const items = cows();
      console.log(items[0]);
      console.log(items[1]);
      hello();
  `,
  "./hello.js": `
      const chalk = require('chalk');
      module.exports = {
          hello: () => console.log(chalk.blue('Hello World!'))
      };
  `,
  "webpack.config.js": `
      const path = require('path');
      module.exports = {
          entry: './main.js',
          output: {
              filename: 'bundle.js',
              path: path.resolve(__dirname, 'dist'),
          },
      };
  `,
  "./package.json": `
      {
          "name": "node-browser",
          "version": "1.0.0",
          "description": "",
          "main": "main.js",
          "scripts": {
              "test": "echo \\"Error: no test specified\\" && exit 1",
              "build": "webpack",
              "start": "node ./main.js"
          },
          "keywords": [],
          "author": "",
          "license": "ISC",
          "dependencies": {
              "chalk": "^4.1.2",
              "cows": "^2.1.1",
              "webpack": "^5.89.0",
              "webpack-cli": "^5.1.4"
          }
      }
  `,
};

node.mount(files);

// await node.command(["ls", "."]);

const terminal = new Terminal({
  convertEol: true,
  cursorBlink: true,
});

node.onData((data) => {
  terminal.write(data);
});

node.onCommandEnd(() => {
  terminal.write('\r\n$ ');
});

terminal.onData((data) => {
  node.write(data);
});

terminal.write('\r\n$ ')


function App() {
  const ref = useRef<HTMLDivElement>(null);

  async function runNode() {
    // await node.command(["npm", "install"]);
    // await node.command(["node", "./main.js"]);
  }
  useEffect(() => {
    if (ref.current && !terminal.element) {
      terminal.open(ref.current);
      runNode();
    }
  }, []);

  return (
    <div className="py-6">
      <aside className="bg-black text-white p-6 rounded-lg w-full max-w-lg font-mono m-auto">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2 text-red-500">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="terminal" ref={ref}></div>
      </aside>
    </div>
  );
}

export default App;

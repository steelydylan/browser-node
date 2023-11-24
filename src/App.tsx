import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import "./App.css";
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
  "./package.json": `
      {
          "name": "node-browser",
          "version": "1.0.0",
          "description": "",
          "main": "main.js",
          "scripts": {
              "test": "echo \\"Error: no test specified\\" && exit 1",
              "start": "node ./main.js"
          },
          "keywords": [],
          "author": "",
          "license": "ISC",
          "dependencies": {
              "chalk": "^4.1.2",
              "cows": "^2.1.1"
          }
      }
  `,
};

node.mount(files);

// await node.command(["ls", "."]);

const terminal = new Terminal({
  convertEol: true,
});

node.onData((data) => {
  terminal.write(data);
});

terminal.onData((data) => {
  node.write(data);
});

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
    <>
      <div className="terminal" ref={ref}></div>
    </>
  );
}

export default App;

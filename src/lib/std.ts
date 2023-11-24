import mitt, { Emitter } from "mitt";

export type StdOut = {
  write: (data: string | Uint8Array) => void;
  // writeln: (data: string | Uint8Array) => void,
};
export type StdIn = {
  read: () => Uint8Array[];
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

type Events = {
  data: string;
};

export const createStd = (): {
  stdin: StdIn;
  stdout: StdOut;
  stderr: StdOut;
  emitter: Emitter<Events>;
} => {
  const _buf: Uint8Array[] = [];
  const emitter = mitt<Events>();

  const stdin: StdIn = {
    read: () => {
      const ret = _buf.slice();
      _buf.length = 0;
      return ret;
    },
  };

  const stdout: StdOut = {
    write: (data: string | Uint8Array) => {
      if (data instanceof Uint8Array) {
        _buf.push(data);
        return;
      }
      const encoded = textEncoder.encode(data);
      _buf.push(encoded);
      emitter.emit("data", "write");
    },
  };
  const stderr: StdOut = {
    write: (data: string | Uint8Array) => {
      if (data instanceof Uint8Array) {
        data = textDecoder.decode(data);
      }
      _buf.push(textEncoder.encode(data));
      emitter.emit("data", "write");
    },
  };
  return {
    stdin,
    stdout,
    stderr,
    emitter,
  };
};

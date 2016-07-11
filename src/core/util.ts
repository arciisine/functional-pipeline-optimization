declare var window;
declare var global;

if (global) {
  [global.process.stdout, global.process.stderr].forEach((s:any) => {
    s && s.isTTY && s._handle && s._handle.setBlocking &&
      s._handle.setBlocking(true)
    });
}

export class Util {
  static global = global || window;
}
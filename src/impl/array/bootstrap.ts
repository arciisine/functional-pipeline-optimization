import {ArrayBuilder} from './builder';

export class Helper {
  static first<T>(args:any[]) { 
    return args[0]; 
  }
  static local<T>(el:T):T { 
    return ((el as any).local = true) && el; 
  }
  static wrap<T>(el:T):T { 
    return (Array.isArray(el) ? new ArrayBuilder<any,any>(el as any) : el) as T; 
  }
  static exec<T>(el:T, closed:any[]=[]):T {
    return (el as any).exec ? (el as any).exec(closed) as T : [el, ...closed] as any as T;
  }
} 

declare var window;

export let SYMBOL = "_zzx8";
if (global) {
  global[SYMBOL] = Helper;
  [global.process.stdout, global.process.stderr].forEach((s:any) => {
    s && s.isTTY && s._handle && s._handle.setBlocking &&
      s._handle.setBlocking(true)
    })
} else if (window) {
  window[SYMBOL] = Helper
}

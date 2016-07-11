import {ArrayBuilder} from './builder';
import {Util} from '../../core';

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

export let SYMBOL = "_zzx8";
Util.global[SYMBOL] = Helper;
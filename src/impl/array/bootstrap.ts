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
    return (Array.isArray(el) ? new ArrayBuilder<T,T>(el) as any as T: el) ; 
  }
  static exec<T>(el:T, closed:any[]=[]):T {
    return (el instanceof ArrayBuilder ? el.exec(closed) : [el, ...closed]) as any as T;
  }
} 

export let SYMBOL = "_zzx8";
Util.global[SYMBOL] = Helper;
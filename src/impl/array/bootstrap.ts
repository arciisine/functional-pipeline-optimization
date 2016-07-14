import {ArrayBuilder} from './builder';
import {Util} from '../../core';

export class Helper {
  static local<T>(el:T):T { 
    return ((el as any).local = true) && el; 
  }
  static wrap<T>(el:T):T { 
    return Array.isArray(el) ? new ArrayBuilder<T,T>(el) as any as T: el; 
  }
  static exec<T>(el:T[], closed:any[]=[], post:(all:any[])=>T = null ):T[] {
    if (el instanceof ArrayBuilder) {
      let {value, assigned} = (el as ArrayBuilder<T,T>).exec(closed);
      if (post !== null) post(assigned);
      return value;
    } else { 
      return el;
    }
  }
} 

export let SYMBOL = "_zzx8";
Util.global[SYMBOL] = Helper;
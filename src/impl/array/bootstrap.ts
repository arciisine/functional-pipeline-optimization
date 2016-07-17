import {ArrayBuilder} from './builder';
import {Util} from '../../core';

export class Helper {
  static inline<T>(el:T):T { 
    return ((el as any).inline = true) && el; 
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
Util.global[`${SYMBOL}`] = Helper
Util.global[`${SYMBOL}_inline`] = Helper.inline
Util.global[`${SYMBOL}_wrap`] = Helper.wrap
Util.global[`${SYMBOL}_exec`] = Helper.exec
import {ArrayBuilder} from './builder';
import {Util} from '../../core';

const is_arr = Array.isArray;

export class Helper {
  static inline<T>(el:T):T { 
    return ((el as any).inline = true) && el; 
  }
  static wrap<T>(el:T):T { 
    return is_arr(el) ? new ArrayBuilder<T,T>(el as any as T[]) as any as T: el; 
  }
  static exec<T>(el:T[], closed:any[]=[], post:(all:any[])=>T = null ):T[] {
    if (el && el.constructor === ArrayBuilder) {
      let res = (el as any as ArrayBuilder<T,T>).exec(closed);
      if (post !== null) post(res.assigned);
      return res.value;
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
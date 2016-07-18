import {ArrayBuilder} from './builder';
import {Util} from '../../core';

const is_arr = Array.isArray;
const cache = {};

export class Helper {
  static inline<T>(el:T, key:string):T { 
    let fn = (el as any as Function);
    fn.inline = true;
    fn.key = key;
    return el; 
  }
  static wrap<T>(el:T):T { 
    return is_arr(el) ? new ArrayBuilder<T,T>(el as any as T[]) as any as T: el; 
  }
  static exec<T>(el:T[], closed:any[]=[], post:(all:any[])=>T = null ):T[] {
    if (el && el.constructor === ArrayBuilder) {
      let ret = (el as any as ArrayBuilder<T,T>).exec(closed)
      if (post !== null) post(ret.assigned);
      return ret.value;
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
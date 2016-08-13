import {ArrayBuilder} from './builder';
import {Util} from '../../core';
import {md5} from './md5';

const is_arr = Array.isArray;

export class Helper {
  static tag<T>(el:T):T {
    if (typeof el === 'function') {
      let fn = el as any 
      fn.key = fn.key || md5(el.toString());
    }
    return el; 
  }
  static wrap<T>(el:T, key?:string):T { 
    return is_arr(el) ? new ArrayBuilder<T,T>(el as any as T[]) as any as T: el; 
  }
  static exec<T>(el:T[], closed:any[]=[], post:(all:any[])=>T = null ):T[] {
    if (el instanceof ArrayBuilder) {
      let ret = el.exec(closed)
      if (post !== null) post(ret.assigned);
      el =  ret.value as T[];
    } 
    return el;
  }
} 

export let SYMBOL = "_zzx8";
Util.global[`${SYMBOL}`] = Helper
Util.global[`${SYMBOL}_tag`]  = Helper.tag
Util.global[`${SYMBOL}_wrap`] = Helper.wrap
Util.global[`${SYMBOL}_exec`] = Helper.exec